import { MidiDevice, MidiNote } from "../types/midi";
import { MidiDeviceSelector } from "./MidiDeviceSelector";
import { NoteVisualization } from "./NoteVisualization";
import "./AudioTrack.css";

interface AudioTrackProps {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number; // 0-100
  midiInputDeviceId?: string;
  midiInputDevices: MidiDevice[];
  isRecording: boolean;
  notes: MidiNote[];
  activeNotes: Set<number>;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onMidiInputChange: (trackId: string, deviceId: string | undefined) => void;
  onRecordToggle: (id: string) => void;
}

export function AudioTrack({
  id,
  name,
  color,
  muted,
  solo,
  volume,
  midiInputDeviceId,
  midiInputDevices,
  isRecording,
  notes,
  activeNotes,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange,
  onMidiInputChange,
  onRecordToggle,
}: AudioTrackProps) {
  const canRecord = !!midiInputDeviceId;

  return (
    <div className={`audio-track ${muted ? "muted" : ""} ${isRecording ? "recording" : ""}`}>
      <div className="track-controls">
        <div className="track-color-indicator" style={{ backgroundColor: color }} />
        <span className="track-name">{name}</span>
        <div className="track-buttons">
          <button
            className={`track-btn record-btn ${isRecording ? "active" : ""}`}
            onClick={() => onRecordToggle(id)}
            disabled={!canRecord}
            title={canRecord ? (isRecording ? "Stop Recording" : "Start Recording") : "Select MIDI device first"}
          >
            R
          </button>
          <button
            className={`track-btn mute-btn ${muted ? "active" : ""}`}
            onClick={() => onMuteToggle(id)}
            title="Mute"
          >
            M
          </button>
          <button
            className={`track-btn solo-btn ${solo ? "active" : ""}`}
            onClick={() => onSoloToggle(id)}
            title="Solo"
          >
            S
          </button>
        </div>
        <input
          type="range"
          className="track-volume"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(id, parseInt(e.target.value))}
          title={`Volume: ${volume}%`}
        />
        <MidiDeviceSelector
          devices={midiInputDevices}
          selectedDeviceId={midiInputDeviceId}
          onDeviceChange={(deviceId) => onMidiInputChange(id, deviceId)}
          disabled={isRecording}
        />
      </div>
      <div className="track-content">
        <div className="track-waveform">
          <NoteVisualization
            notes={notes}
            activeNotes={activeNotes}
            color={color}
            pixelsPerSecond={30}
          />
        </div>
      </div>
    </div>
  );
}
