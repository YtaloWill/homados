import "./AudioTrack.css";

interface AudioTrackProps {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number; // 0-100
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
}

export function AudioTrack({
  id,
  name,
  color,
  muted,
  solo,
  volume,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange,
}: AudioTrackProps) {
  return (
    <div className={`audio-track ${muted ? "muted" : ""}`}>
      <div className="track-controls">
        <div className="track-color-indicator" style={{ backgroundColor: color }} />
        <span className="track-name">{name}</span>
        <div className="track-buttons">
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
      </div>
      <div className="track-content">
        <div className="track-waveform">
          {/* Placeholder waveform visualization */}
          <div className="waveform-placeholder" />
        </div>
      </div>
    </div>
  );
}
