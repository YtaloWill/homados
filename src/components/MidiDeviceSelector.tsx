import { MidiDevice } from "../types/midi";
import "./MidiDeviceSelector.css";

interface MidiDeviceSelectorProps {
  devices: MidiDevice[];
  selectedDeviceId: string | undefined;
  onDeviceChange: (deviceId: string | undefined) => void;
  disabled?: boolean;
}

export function MidiDeviceSelector({
  devices,
  selectedDeviceId,
  onDeviceChange,
  disabled = false,
}: MidiDeviceSelectorProps) {
  return (
    <select
      className="midi-device-selector"
      value={selectedDeviceId ?? ""}
      onChange={(e) => onDeviceChange(e.target.value || undefined)}
      disabled={disabled}
      title="MIDI Input Device"
    >
      <option value="">No MIDI Input</option>
      {devices.map((device) => (
        <option key={device.id} value={device.id}>
          {device.name}
        </option>
      ))}
    </select>
  );
}
