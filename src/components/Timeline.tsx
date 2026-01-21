import "./Timeline.css";

interface TimelineProps {
  duration: number; // in seconds
  currentTime: number;
  zoom: number; // pixels per second
}

export function Timeline({ duration, currentTime, zoom }: TimelineProps) {
  const markers = [];
  const interval = zoom >= 50 ? 1 : zoom >= 20 ? 5 : 10; // adjust marker density based on zoom

  for (let i = 0; i <= duration; i += interval) {
    markers.push(
      <div
        key={i}
        className="timeline-marker"
        style={{ left: `${i * zoom}px` }}
      >
        <span className="timeline-marker-label">{formatTime(i)}</span>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-header">
        <div className="timeline-ruler" style={{ width: `${duration * zoom}px` }}>
          {markers}
          <div
            className="timeline-playhead"
            style={{ left: `${currentTime * zoom}px` }}
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
