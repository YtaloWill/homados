# Homados

A DAW (Digital Audio Workstation) desktop application built with Tauri, React, and TypeScript.

## Features

- Multi-track audio workspace with timeline
- MIDI device support for recording and playback
- Real-time note visualization
- Track controls (mute, solo, volume)
- Sine wave synthesis for MIDI playback

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- Platform-specific dependencies for Tauri (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))

### Installation

```bash
npm install
```

### Development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Usage

### Recording MIDI

1. Connect a MIDI device (keyboard, controller, etc.)
2. Select the MIDI device from the dropdown on a track
3. Press the **R** button to start recording
4. Play notes on your MIDI instrument
5. Press **R** again to stop recording

### Playback

- Press **Play** to hear recorded notes
- Use **Stop** to stop and reset to beginning
- Use **Pause** to pause at current position

### Track Controls

- **M** - Mute track
- **S** - Solo track
- **Volume slider** - Adjust track volume

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Rust, Tauri 2
- **MIDI**: midir (Rust)
- **Audio**: rodio (Rust)

## License

[Unlicense](LICENSE) - Public Domain
