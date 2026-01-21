import "./Toolbar.css";

interface ToolbarProps {
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onAddTrack: () => void;
}

export function Toolbar({
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onStop,
  onAddTrack,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section transport">
        <button className="toolbar-btn" onClick={onStop} title="Stop">
          <span className="icon-stop" />
        </button>
        <button
          className="toolbar-btn play-btn"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          <span className={isPlaying ? "icon-pause" : "icon-play"} />
        </button>
      </div>

      <div className="toolbar-section time-display">
        <span className="time-code">{formatTimeCode(currentTime)}</span>
      </div>

      <div className="toolbar-section actions">
        <button className="toolbar-btn add-track-btn" onClick={onAddTrack}>
          + Add Track
        </button>
      </div>

      <div className="toolbar-section title">
        <span className="project-title">Homados</span>
      </div>
    </div>
  );
}

function formatTimeCode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}:${ms.toString().padStart(2, "0")}`;
}
