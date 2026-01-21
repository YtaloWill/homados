use midir::{MidiInput, MidiOutput};
use serde::{Deserialize, Serialize};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

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

#[tauri::command]
fn list_midi_devices() -> Result<MidiDeviceList, String> {
    let mut inputs = Vec::new();
    let mut outputs = Vec::new();

    // Get MIDI inputs
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

    // Get MIDI outputs
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, list_midi_devices])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
