import type { ScenarioId } from '@slotted/demo-nexora-backend';

export interface DemoState {
  persona?: string;
  scenario?: ScenarioId;
  scale?: 'light' | 'demo';
  signedOut?: boolean;
}

const KEY = 'nexora:demo';

export function readDemoState(): DemoState {
  let state: DemoState = {};
  try {
    state = JSON.parse(localStorage.getItem(KEY) ?? '{}') as DemoState;
  } catch {
    state = {};
  }
  const scale = new URLSearchParams(location.search).get('scale');
  if (scale === 'light' || scale === 'demo') state.scale = scale;
  return state;
}

export function writeDemoState(patch: DemoState): DemoState {
  const next = { ...readDemoState(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}
