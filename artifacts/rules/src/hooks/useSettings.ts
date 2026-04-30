import { useEffect, useState } from "react";

export type Settings = {
  reduceMotion: boolean;
  compactMode: boolean;
  notifications: boolean;
};

export const defaultSettings: Settings = {
  reduceMotion: false,
  compactMode: false,
  notifications: true,
};

const SETTINGS_STORAGE_KEY = "balkan-rules:settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  return { settings, setSettings };
}
