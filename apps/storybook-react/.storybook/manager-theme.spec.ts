import { describe, expect, it } from 'vitest';

import { registerManagerTheme } from './manager-theme';

describe('React Storybook manager theme', () => {
  it('waits for the active manager channel before subscribing', async () => {
    type Listener = (payload: { globals: Record<string, unknown> }) => void;
    const provisionalListeners = new Set<Listener>();
    const activeListeners = new Set<Listener>();
    const makeChannel = (listeners: Set<Listener>) => ({
      on: (_event: string, listener: Listener) => listeners.add(listener),
      off: (_event: string, listener: Listener) => listeners.delete(listener),
    });
    const activeChannel = makeChannel(activeListeners);
    const themes: string[] = [];
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
    let resolveReady: ((channel: typeof activeChannel) => void) | undefined;
    const ready = new Promise<typeof activeChannel>((resolve) => {
      resolveReady = resolve;
    });
    const manager = {
      ready: () => ready,
      setConfig: ({ theme }: { theme: { base: string } }) => {
        themes.push(theme.base);
      },
    };

    const connected = registerManagerTheme(manager, root);
    resolveReady?.(activeChannel);
    await connected;

    for (const listener of activeListeners) {
      listener({ globals: { scheme: 'dark' } });
    }

    expect(provisionalListeners).toHaveLength(0);
    expect(themes).toEqual(['light', 'dark']);
    expect(root).toMatchObject({
      dataset: { slottedScheme: 'dark' },
      style: { colorScheme: 'dark' },
    });
  });
});
