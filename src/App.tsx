import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Toolbar } from "./components/Toolbar";
import { Timeline } from "./components/Timeline";
import { TrackList, Track } from "./components/TrackList";
import { useMidiDevices } from "./hooks/useMidiDevices";
import { MidiNote, MidiNoteEvent } from "./types/midi";
import "./App.css";

const TRACK_COLORS = [
  "#4a9eff",
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#95e1d3",
  "#f38181",
  "#aa96da",
  "#fcbad3",
];

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "1",
      name: "Audio Track 1",
      color: TRACK_COLORS[0],
      muted: false,
      solo: false,
      volume: 80,
      isRecording: false,
      notes: [],
      activeNotes: new Set(),
    },
    {
      id: "2",
      name: "Audio Track 2",
      color: TRACK_COLORS[1],
      muted: false,
      solo: false,
      volume: 75,
      isRecording: false,
      notes: [],
      activeNotes: new Set(),
    },
  ]);
  const { devices: midiDevices } = useMidiDevices();
  const playbackIntervalRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  // Listen for MIDI note events from the backend
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<MidiNoteEvent>("midi-note", (event) => {
        const { trackId, note, isNoteOn } = event.payload;

        setTracks((prevTracks) =>
          prevTracks.map((track) => {
            if (track.id !== trackId) return track;

            const newActiveNotes = new Set(track.activeNotes);
            if (isNoteOn) {
              newActiveNotes.add(note);
            } else {
              newActiveNotes.delete(note);
            }

            return { ...track, activeNotes: newActiveNotes };
          })
        );

        // Play note preview sound when note is pressed (during recording or just playing)
        if (isNoteOn) {
          const track = tracks.find(t => t.id === trackId);
          if (track && !track.muted) {
            invoke("play_note_preview", {
              note,
              velocity: event.payload.velocity,
              volume: track.volume / 100
            }).catch(console.error);
          }
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [tracks]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    playbackStartTimeRef.current = Date.now() - currentTime * 1000;

    // Collect all notes from non-muted tracks
    const allNotes: MidiNote[] = [];
    const soloTracks = tracks.filter(t => t.solo);
    const tracksToPlay = soloTracks.length > 0 ? soloTracks : tracks.filter(t => !t.muted);

    for (const track of tracksToPlay) {
      // Adjust note times relative to current playback position
      for (const note of track.notes) {
        if (note.startTime >= currentTime) {
          allNotes.push({
            ...note,
            startTime: note.startTime - currentTime,
          });
        } else if (note.startTime + note.duration > currentTime) {
          // Note is partially in range
          allNotes.push({
            ...note,
            startTime: 0,
            duration: note.duration - (currentTime - note.startTime),
          });
        }
      }
    }

    if (allNotes.length > 0) {
      const avgVolume = tracksToPlay.reduce((sum, t) => sum + t.volume, 0) / tracksToPlay.length / 100;
      invoke("play_notes", { notes: allNotes, volume: avgVolume }).catch(console.error);
    }

    // Update current time during playback
    playbackIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - playbackStartTimeRef.current) / 1000;
      setCurrentTime(elapsed);
    }, 50);
  }, [currentTime, tracks]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    invoke("stop_playback").catch(console.error);

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    invoke("stop_playback").catch(console.error);

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  const handleAddTrack = () => {
    const newId = (Math.max(...tracks.map(t => parseInt(t.id)), 0) + 1).toString();
    const colorIndex = tracks.length % TRACK_COLORS.length;
    setTracks([
      ...tracks,
      {
        id: newId,
        name: `Audio Track ${newId}`,
        color: TRACK_COLORS[colorIndex],
        muted: false,
        solo: false,
        volume: 80,
        isRecording: false,
        notes: [],
        activeNotes: new Set(),
      },
    ]);
  };

  const handleMuteToggle = (id: string) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, muted: !track.muted } : track
      )
    );
  };

  const handleSoloToggle = (id: string) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, solo: !track.solo } : track
      )
    );
  };

  const handleVolumeChange = (id: string, volume: number) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, volume } : track
      )
    );
  };

  const handleMidiInputChange = async (trackId: string, deviceId: string | undefined) => {
    const track = tracks.find(t => t.id === trackId);

    // Disconnect previous device if any
    if (track?.midiInputDeviceId) {
      await invoke("disconnect_midi_input", { trackId }).catch(console.error);
    }

    // Connect new device if selected
    if (deviceId) {
      await invoke("connect_midi_input", { trackId, deviceId }).catch(console.error);
    }

    setTracks(
      tracks.map((t) =>
        t.id === trackId ? { ...t, midiInputDeviceId: deviceId, activeNotes: new Set() } : t
      )
    );
  };

  const handleRecordToggle = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.midiInputDeviceId) return;

    if (track.isRecording) {
      // Stop recording
      try {
        const recordedNotes = await invoke<MidiNote[]>("stop_recording", { trackId });
        setTracks(
          tracks.map((t) =>
            t.id === trackId
              ? { ...t, isRecording: false, notes: recordedNotes, activeNotes: new Set() }
              : t
          )
        );
      } catch (error) {
        console.error("Failed to stop recording:", error);
        setTracks(
          tracks.map((t) =>
            t.id === trackId ? { ...t, isRecording: false } : t
          )
        );
      }
    } else {
      // Start recording - clear previous notes
      try {
        await invoke("start_recording", { trackId });
        setTracks(
          tracks.map((t) =>
            t.id === trackId ? { ...t, isRecording: true, notes: [] } : t
          )
        );
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      invoke("stop_playback").catch(() => {});
    };
  }, []);

  return (
    <div className="daw-container">
      <Toolbar
        isPlaying={isPlaying}
        currentTime={currentTime}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onAddTrack={handleAddTrack}
      />
      <Timeline duration={120} currentTime={currentTime} zoom={30} />
      <TrackList
        tracks={tracks}
        midiInputDevices={midiDevices.inputs}
        onMuteToggle={handleMuteToggle}
        onSoloToggle={handleSoloToggle}
        onVolumeChange={handleVolumeChange}
        onMidiInputChange={handleMidiInputChange}
        onRecordToggle={handleRecordToggle}
      />
    </div>
  );
}

export default App;
