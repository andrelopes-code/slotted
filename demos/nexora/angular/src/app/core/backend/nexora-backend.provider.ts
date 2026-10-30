import {
  InjectionToken,
  makeEnvironmentProviders,
  provideAppInitializer,
  signal,
  type EnvironmentProviders,
  type Signal,
} from '@angular/core';
import {
  createNexoraBackend,
  type BackendOptions,
  type NexoraApi,
} from '@slotted/demo-nexora-backend';
import { readDemoState } from './demo-state';

export type BackendStatus = 'idle' | 'seeding' | 'ready';

export interface BackendHandle {
  api: Signal<NexoraApi | null>;
  status: Signal<BackendStatus>;
  ready(): Promise<NexoraApi>;
  create(options?: Partial<BackendOptions>): Promise<NexoraApi>;
  recreate(options?: Partial<BackendOptions>): Promise<NexoraApi>;
}

export const NEXORA_BACKEND = new InjectionToken<BackendHandle>('nexora backend');

/**
 * The seed is synchronous and costs seconds; the handle defers it to the next
 * macrotask so the shell paints its skeleton first, and every store awaits
 * `ready()` before its first call.
 */
export function createBackendHandle(base: Partial<BackendOptions>, defer: boolean): BackendHandle {
  const api = signal<NexoraApi | null>(null);
  const status = signal<BackendStatus>('idle');
  let pending: Promise<NexoraApi> | null = null;

  const build = (options: Partial<BackendOptions>): Promise<NexoraApi> => {
    status.set('seeding');
    api.set(null);
    const state = readDemoState();
    const merged: BackendOptions = {
      scale: state.scale ?? 'light',
      latency: 'normal',
      ...(state.persona === undefined ? {} : { persona: state.persona }),
      ...(state.scenario === undefined ? {} : { scenario: state.scenario }),
      ...base,
      ...options,
    };
    const run = () => {
      const instance = createNexoraBackend(merged);
      api.set(instance);
      status.set('ready');
      return instance;
    };
    pending = defer
      ? new Promise<NexoraApi>((resolve) => setTimeout(() => resolve(run()), 0))
      : Promise.resolve(run());
    return pending;
  };

  return {
    api: api.asReadonly(),
    status: status.asReadonly(),
    ready: () => pending ?? build({}),
    create: (options = {}) => pending ?? build(options),
    recreate: (options = {}) => build(options),
  };
}

export function provideNexoraBackend(
  config: { defer?: boolean; options?: Partial<BackendOptions> } = {},
): EnvironmentProviders {
  const handle = createBackendHandle(config.options ?? {}, config.defer ?? true);
  return makeEnvironmentProviders([
    { provide: NEXORA_BACKEND, useValue: handle },
    provideAppInitializer(() => {
      void handle.create();
    }),
  ]);
}
