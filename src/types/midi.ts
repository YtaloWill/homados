export interface MidiDevice {
  id: string;
  name: string;
  portType: 'input' | 'output';
}

export interface MidiDeviceList {
  inputs: MidiDevice[];
  outputs: MidiDevice[];
}

export interface MidiNote {
  note: number;
  velocity: number;
  startTime: number; // in seconds
  duration: number;  // in seconds
}

export interface MidiNoteEvent {
  trackId: string;
  note: number;
  velocity: number;
  isNoteOn: boolean;
  time: number;
}
