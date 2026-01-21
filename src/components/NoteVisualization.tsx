import { MidiNote } from "../types/midi";
import "./NoteVisualization.css";

interface NoteVisualizationProps {
  notes: MidiNote[];
  activeNotes: Set<number>;
  color: string;
  pixelsPerSecond: number;
}

// Convert MIDI note number to note name
function noteToName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return `${names[note % 12]}${octave}`;
}

export function NoteVisualization({
  notes,
  activeNotes,
  color,
  pixelsPerSecond,
}: NoteVisualizationProps) {
  // Calculate note position based on MIDI note range (typically 21-108 for piano)
  const minNote = 21; // A0
  const maxNote = 108; // C8
  const noteRange = maxNote - minNote;

  const getNoteTop = (note: number): number => {
    // Invert so higher notes are at top
    return ((maxNote - note) / noteRange) * 100;
  };

  const getNoteHeight = (): number => {
    return (1 / noteRange) * 100;
  };

  return (
    <div className="note-visualization">
      {/* Active notes indicator */}
      {Array.from(activeNotes).map((note) => (
        <div
          key={`active-${note}`}
          className="active-note-indicator"
          style={{
            top: `${getNoteTop(note)}%`,
            height: `${Math.max(getNoteHeight(), 2)}%`,
            backgroundColor: color,
          }}
          title={noteToName(note)}
        />
      ))}

      {/* Recorded notes */}
      {notes.map((note, index) => (
        <div
          key={index}
          className="recorded-note"
          style={{
            left: `${note.startTime * pixelsPerSecond}px`,
            width: `${Math.max(note.duration * pixelsPerSecond, 4)}px`,
            top: `${getNoteTop(note.note)}%`,
            height: `${Math.max(getNoteHeight(), 2)}%`,
            backgroundColor: color,
            opacity: note.velocity / 127,
          }}
          title={`${noteToName(note.note)} (vel: ${note.velocity})`}
        />
      ))}

      {/* Empty state */}
      {notes.length === 0 && activeNotes.size === 0 && (
        <div className="note-visualization-empty">
          No notes recorded
        </div>
      )}
    </div>
  );
}
