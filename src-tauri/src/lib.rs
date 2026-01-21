use midir::{MidiInput, MidiInputConnection, MidiOutput};
use parking_lot::Mutex;
use rodio::{OutputStream, Sink, Source};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

// MIDI Device Types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MidiPortType {
    Input,
    Output,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiDevice {
    pub id: String,
    pub name: String,
    pub port_type: MidiPortType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MidiDeviceList {
    pub inputs: Vec<MidiDevice>,
    pub outputs: Vec<MidiDevice>,
}

// MIDI Note Types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiNote {
    pub note: u8,
    pub velocity: u8,
    pub start_time: f64,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiNoteEvent {
    pub track_id: String,
    pub note: u8,
    pub velocity: u8,
    pub is_note_on: bool,
    pub time: f64,
}

// Recording State
struct RecordingState {
    is_recording: bool,
    start_time: Option<Instant>,
    pending_notes: HashMap<u8, (u8, f64)>,
    recorded_notes: Vec<MidiNote>,
}

impl Default for RecordingState {
    fn default() -> Self {
        Self {
            is_recording: false,
            start_time: None,
            pending_notes: HashMap::new(),
            recorded_notes: Vec::new(),
        }
    }
}

// Track State
struct TrackMidiState {
    _connection: MidiInputConnection<()>,
    recording: Arc<Mutex<RecordingState>>,
}

// Global App State (only Send+Sync types)
pub struct AppState {
    track_connections: Mutex<HashMap<String, TrackMidiState>>,
    stop_playback: Arc<AtomicBool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            track_connections: Mutex::new(HashMap::new()),
            stop_playback: Arc::new(AtomicBool::new(false)),
        }
    }
}

// Simple sine wave source
struct SineWave {
    freq: f32,
    sample_rate: u32,
    num_sample: usize,
    duration_samples: usize,
    amplitude: f32,
}

impl SineWave {
    fn new(freq: f32, duration_secs: f32, amplitude: f32) -> Self {
        let sample_rate = 44100;
        Self {
            freq,
            sample_rate,
            num_sample: 0,
            duration_samples: (sample_rate as f32 * duration_secs) as usize,
            amplitude,
        }
    }
}

impl Iterator for SineWave {
    type Item = f32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.num_sample >= self.duration_samples {
            return None;
        }
        let value = (self.num_sample as f32 * self.freq * 2.0 * std::f32::consts::PI
            / self.sample_rate as f32)
            .sin();

        let envelope = if self.num_sample < 100 {
            self.num_sample as f32 / 100.0
        } else if self.num_sample > self.duration_samples.saturating_sub(100) {
            (self.duration_samples - self.num_sample) as f32 / 100.0
        } else {
            1.0
        };

        self.num_sample += 1;
        Some(value * self.amplitude * envelope)
    }
}

impl Source for SineWave {
    fn current_frame_len(&self) -> Option<usize> {
        None
    }

    fn channels(&self) -> u16 {
        1
    }

    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn total_duration(&self) -> Option<Duration> {
        Some(Duration::from_secs_f32(
            self.duration_samples as f32 / self.sample_rate as f32,
        ))
    }
}

fn midi_to_freq(note: u8) -> f32 {
    440.0 * 2.0_f32.powf((note as f32 - 69.0) / 12.0)
}

// Tauri Commands
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn list_midi_devices() -> Result<MidiDeviceList, String> {
    let mut inputs = Vec::new();
    let mut outputs = Vec::new();

    if let Ok(midi_in) = MidiInput::new("homados-input-query") {
        for (idx, port) in midi_in.ports().iter().enumerate() {
            if let Ok(name) = midi_in.port_name(port) {
                inputs.push(MidiDevice {
                    id: format!("input-{}", idx),
                    name,
                    port_type: MidiPortType::Input,
                });
            }
        }
    }

    if let Ok(midi_out) = MidiOutput::new("homados-output-query") {
        for (idx, port) in midi_out.ports().iter().enumerate() {
            if let Ok(name) = midi_out.port_name(port) {
                outputs.push(MidiDevice {
                    id: format!("output-{}", idx),
                    name,
                    port_type: MidiPortType::Output,
                });
            }
        }
    }

    Ok(MidiDeviceList { inputs, outputs })
}

#[tauri::command]
fn connect_midi_input(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    track_id: String,
    device_id: String,
) -> Result<(), String> {
    let idx: usize = device_id
        .strip_prefix("input-")
        .and_then(|s| s.parse().ok())
        .ok_or("Invalid device ID")?;

    let midi_in = MidiInput::new("homados-input").map_err(|e| e.to_string())?;
    let ports = midi_in.ports();
    let port = ports.get(idx).ok_or("Port not found")?;

    let recording = Arc::new(Mutex::new(RecordingState::default()));
    let recording_clone = recording.clone();
    let track_id_clone = track_id.clone();
    let app_clone = app.clone();

    let connection = midi_in
        .connect(
            port,
            "homados-input-connection",
            move |_timestamp, message, _| {
                if message.len() >= 3 {
                    let status = message[0] & 0xF0;
                    let note = message[1];
                    let velocity = message[2];

                    let is_note_on = status == 0x90 && velocity > 0;
                    let is_note_off = status == 0x80 || (status == 0x90 && velocity == 0);

                    if is_note_on || is_note_off {
                        let mut rec = recording_clone.lock();
                        let time = rec
                            .start_time
                            .map(|s| s.elapsed().as_secs_f64())
                            .unwrap_or(0.0);

                        let _ = app_clone.emit(
                            "midi-note",
                            MidiNoteEvent {
                                track_id: track_id_clone.clone(),
                                note,
                                velocity,
                                is_note_on,
                                time,
                            },
                        );

                        if rec.is_recording {
                            if is_note_on {
                                rec.pending_notes.insert(note, (velocity, time));
                            } else if let Some((vel, start)) = rec.pending_notes.remove(&note) {
                                rec.recorded_notes.push(MidiNote {
                                    note,
                                    velocity: vel,
                                    start_time: start,
                                    duration: time - start,
                                });
                            }
                        }
                    }
                }
            },
            (),
        )
        .map_err(|e| e.to_string())?;

    let mut connections = state.track_connections.lock();
    connections.insert(
        track_id,
        TrackMidiState {
            _connection: connection,
            recording,
        },
    );

    Ok(())
}

#[tauri::command]
fn disconnect_midi_input(
    state: tauri::State<'_, AppState>,
    track_id: String,
) -> Result<(), String> {
    let mut connections = state.track_connections.lock();
    connections.remove(&track_id);
    Ok(())
}

#[tauri::command]
fn start_recording(state: tauri::State<'_, AppState>, track_id: String) -> Result<(), String> {
    let connections = state.track_connections.lock();
    let track_state = connections.get(&track_id).ok_or("Track not connected")?;

    let mut recording = track_state.recording.lock();
    recording.is_recording = true;
    recording.start_time = Some(Instant::now());
    recording.pending_notes.clear();
    recording.recorded_notes.clear();

    Ok(())
}

#[tauri::command]
fn stop_recording(
    state: tauri::State<'_, AppState>,
    track_id: String,
) -> Result<Vec<MidiNote>, String> {
    let connections = state.track_connections.lock();
    let track_state = connections.get(&track_id).ok_or("Track not connected")?;

    let mut recording = track_state.recording.lock();
    recording.is_recording = false;

    let end_time = recording
        .start_time
        .map(|s| s.elapsed().as_secs_f64())
        .unwrap_or(0.0);

    let pending: Vec<_> = recording.pending_notes.drain().collect();
    for (note, (velocity, start)) in pending {
        recording.recorded_notes.push(MidiNote {
            note,
            velocity,
            start_time: start,
            duration: end_time - start,
        });
    }

    Ok(recording.recorded_notes.clone())
}

#[tauri::command]
fn play_notes(state: tauri::State<'_, AppState>, notes: Vec<MidiNote>, volume: f32) {
    // Reset stop flag
    state.stop_playback.store(false, Ordering::SeqCst);
    let stop_flag = state.stop_playback.clone();

    // Sort notes by start time
    let mut sorted_notes = notes;
    sorted_notes.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

    // Spawn playback thread (audio stream created inside thread)
    std::thread::spawn(move || {
        let Ok((_stream, handle)) = OutputStream::try_default() else {
            return;
        };
        let Ok(sink) = Sink::try_new(&handle) else {
            return;
        };

        let start = Instant::now();

        for note in sorted_notes {
            if stop_flag.load(Ordering::SeqCst) {
                break;
            }

            let target_time = Duration::from_secs_f64(note.start_time);
            let elapsed = start.elapsed();
            if target_time > elapsed {
                std::thread::sleep(target_time - elapsed);
            }

            if stop_flag.load(Ordering::SeqCst) {
                break;
            }

            let freq = midi_to_freq(note.note);
            let amplitude = (note.velocity as f32 / 127.0) * volume;
            let source = SineWave::new(freq, note.duration as f32, amplitude);
            sink.append(source);
        }

        sink.sleep_until_end();
    });
}

#[tauri::command]
fn stop_playback(state: tauri::State<'_, AppState>) {
    state.stop_playback.store(true, Ordering::SeqCst);
}

#[tauri::command]
fn play_note_preview(note: u8, velocity: u8, volume: f32) {
    std::thread::spawn(move || {
        let Ok((_stream, handle)) = OutputStream::try_default() else {
            return;
        };
        let Ok(sink) = Sink::try_new(&handle) else {
            return;
        };

        let freq = midi_to_freq(note);
        let amplitude = (velocity as f32 / 127.0) * volume * 0.3;
        let source = SineWave::new(freq, 0.2, amplitude);
        sink.append(source);
        sink.sleep_until_end();
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            list_midi_devices,
            connect_midi_input,
            disconnect_midi_input,
            start_recording,
            stop_recording,
            play_notes,
            stop_playback,
            play_note_preview
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
