export interface MidiDevice {
  id: string;
  name: string;
  portType: 'input' | 'output';
}

export interface MidiDeviceList {
  inputs: MidiDevice[];
  outputs: MidiDevice[];
}
