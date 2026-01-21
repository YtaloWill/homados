import { AudioTrack } from "./AudioTrack";
import { MidiDevice } from "../types/midi";
import "./TrackList.css";

export interface Track {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  midiInputDeviceId?: string;
}

interface TrackListProps {
  tracks: Track[];
  midiInputDevices: MidiDevice[];
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onMidiInputChange: (trackId: string, deviceId: string | undefined) => void;
}

export function TrackList({
  tracks,
  midiInputDevices,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange,
  onMidiInputChange,
}: TrackListProps) {
  return (
    <div className="track-list">
      {tracks.map((track) => (
        <AudioTrack
          key={track.id}
          {...track}
          midiInputDevices={midiInputDevices}
          onMuteToggle={onMuteToggle}
          onSoloToggle={onSoloToggle}
          onVolumeChange={onVolumeChange}
          onMidiInputChange={onMidiInputChange}
        />
      ))}
      {tracks.length === 0 && (
        <div className="track-list-empty">
          No tracks. Add a track to get started.
        </div>
      )}
    </div>
  );
}
