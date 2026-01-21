# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homados is a DAW (Digital Audio Workstation) desktop application built with Tauri, featuring a React + TypeScript frontend and Rust backend.

## Development Commands

```bash
# Install dependencies
npm install

# Start development (frontend + Tauri backend)
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only (for rapid UI iteration)
npm run dev        # Start Vite dev server on port 1420
npm run build      # TypeScript check + production build
npm run preview    # Preview production build
```

## Architecture

**Frontend** (`src/`): React 19 + TypeScript with Vite. Entry point is `main.tsx`, main component is `App.tsx`.

**Backend** (`src-tauri/`): Rust with Tauri 2. Binary entry is `main.rs`, library with Tauri commands is `lib.rs`.

**Communication Pattern**: Frontend calls Rust functions via Tauri's invoke system:
```typescript
// Frontend
import { invoke } from "@tauri-apps/api/core";
const result = await invoke("command_name", { param1, param2 });
```
```rust
// Backend - expose functions with #[tauri::command] macro
#[tauri::command]
fn command_name(param1: &str, param2: i32) -> String { ... }

// Register in lib.rs run() function
.invoke_handler(tauri::generate_handler![command_name])
```

## Key Configuration

- `tauri.conf.json`: App window settings, bundle config, build commands
- `src-tauri/capabilities/default.json`: Window permissions for Tauri plugins
- `tsconfig.json`: TypeScript strict mode enabled
- `vite.config.ts`: Vite config with Tauri-specific settings (port 1420)

## MIDI Support

The application supports physical MIDI device input for recording and playback.

### Backend Commands (Rust)

| Command | Description |
|---------|-------------|
| `list_midi_devices` | Returns available MIDI input/output devices |
| `connect_midi_input` | Connects a MIDI device to a track |
| `disconnect_midi_input` | Disconnects MIDI device from a track |
| `start_recording` | Starts recording MIDI notes on a track |
| `stop_recording` | Stops recording and returns recorded notes |
| `play_notes` | Plays back recorded notes with sine wave synthesis |
| `stop_playback` | Stops current playback |
| `play_note_preview` | Plays a short preview of a single note |

### Frontend Components

- `src/types/midi.ts` - TypeScript interfaces for MIDI types
- `src/hooks/useMidiDevices.ts` - Hook for fetching MIDI devices
- `src/components/MidiDeviceSelector.tsx` - Dropdown for selecting MIDI input
- `src/components/NoteVisualization.tsx` - Displays recorded/active notes on track

### Key Dependencies

- `midir` (Rust) - Cross-platform MIDI I/O
- `rodio` (Rust) - Audio playback and synthesis
- `@tauri-apps/api/event` - For real-time MIDI note events from backend
