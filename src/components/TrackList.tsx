import { AudioTrack } from "./AudioTrack";
import "./TrackList.css";

export interface Track {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface TrackListProps {
  tracks: Track[];
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
}

export function TrackList({
  tracks,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange,
}: TrackListProps) {
  return (
    <div className="track-list">
      {tracks.map((track) => (
        <AudioTrack
          key={track.id}
          {...track}
          onMuteToggle={onMuteToggle}
          onSoloToggle={onSoloToggle}
          onVolumeChange={onVolumeChange}
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
