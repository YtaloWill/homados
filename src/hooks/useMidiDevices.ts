import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MidiDeviceList } from "../types/midi";

export function useMidiDevices() {
  const [devices, setDevices] = useState<MidiDeviceList>({ inputs: [], outputs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<MidiDeviceList>("list_midi_devices");
      setDevices(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    refreshDevices: fetchDevices,
  };
}
