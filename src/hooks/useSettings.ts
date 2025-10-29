import { useEffect, useMemo, useState } from "react";

export type ModelType = 'llama3.1' | 'gpt-4' | 'claude' | 'biogpt';
export type LengthType = 'brief' | 'standard' | 'comprehensive';
export type Residency = 'local' | 'cloud' | 'encrypted';
export type Schedule = 'off' | 'daily' | 'weekly';

export interface SettingsState {
  model: ModelType;
  temperature: number; // 0..1
  length: LengthType;
  profile: string | null;
  hipaaMode: boolean;
  dataResidency: Residency;
  anonymizePHI: boolean;
  schedule: Schedule;
  trackedKeywords: string[];
}

const KEY = 'medlit.settings.v1';

const DEFAULTS: SettingsState = {
  model: 'llama3.1',
  temperature: 0,
  length: 'standard',
  profile: null,
  hipaaMode: true,
  dataResidency: 'local',
  anonymizePHI: true,
  schedule: 'off',
  trackedKeywords: [],
};

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const obj = JSON.parse(raw);
    return { ...DEFAULTS, ...obj } as SettingsState;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [state, setState] = useState<SettingsState>(DEFAULTS);

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const actions = useMemo(() => ({
    setModel: (model: ModelType) => setState((s) => ({ ...s, model })),
    setTemperature: (temperature: number) => setState((s) => ({ ...s, temperature })),
    setLength: (length: LengthType) => setState((s) => ({ ...s, length })),
    setProfile: (profile: string | null) => setState((s) => ({ ...s, profile })),
    setHipaaMode: (hipaaMode: boolean) => setState((s) => ({ ...s, hipaaMode })),
    setResidency: (dataResidency: Residency) => setState((s) => ({ ...s, dataResidency })),
    setAnonymizePHI: (anonymizePHI: boolean) => setState((s) => ({ ...s, anonymizePHI })),
    setSchedule: (schedule: Schedule) => setState((s) => ({ ...s, schedule })),
    addKeyword: (kw: string) => setState((s) => ({ ...s, trackedKeywords: Array.from(new Set([...(s.trackedKeywords||[]), kw])).slice(0, 20) })),
    removeKeyword: (kw: string) => setState((s) => ({ ...s, trackedKeywords: (s.trackedKeywords||[]).filter((x) => x !== kw) })),
    reset: () => setState(DEFAULTS),
  }), []);

  return { state, ...actions } as const;
}
