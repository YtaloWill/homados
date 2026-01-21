import { useState } from "react";
import { Toolbar } from "./components/Toolbar";
import { Timeline } from "./components/Timeline";
import { TrackList, Track } from "./components/TrackList";
import { useMidiDevices } from "./hooks/useMidiDevices";
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
    { id: "1", name: "Audio Track 1", color: TRACK_COLORS[0], muted: false, solo: false, volume: 80 },
    { id: "2", name: "Audio Track 2", color: TRACK_COLORS[1], muted: false, solo: false, volume: 75 },
  ]);
  const { devices: midiDevices } = useMidiDevices();

  const handlePlay = () => {
    setIsPlaying(true);
    // TODO: Implement actual playback
  };

  const handlePause = () => {
    setIsPlaying(false);
    // TODO: Implement actual pause
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // TODO: Implement actual stop
  };

  const handleAddTrack = () => {
    const newId = (tracks.length + 1).toString();
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

  const handleMidiInputChange = (trackId: string, deviceId: string | undefined) => {
    setTracks(
      tracks.map((track) =>
        track.id === trackId ? { ...track, midiInputDeviceId: deviceId } : track
      )
    );
  };

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
      />
    </div>
  );
}

export default App;
