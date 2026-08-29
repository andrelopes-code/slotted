import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@slotted/storybook-workbench', () => ({
  GLOBAL_TYPES: {
    density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
    scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
    theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
  },
  INITIAL_GLOBALS: { density: 'comfortable', scheme: 'light', theme: 'default' },
  resolveWorkbenchGlobals: (globals: Record<string, unknown> | undefined) => ({
    density: globals?.density === 'compact' ? 'compact' : 'comfortable',
    scheme: globals?.scheme === 'dark' ? 'dark' : 'light',
    theme: 'default',
  }),
}));

import preview from './preview';

describe('Angular Storybook preview', () => {
  const render = (context: unknown) => {
    const decorator = preview.decorators?.[0];
    expect(decorator).toBeTypeOf('function');
    return decorator?.(() => ({ template: '<button>Probe</button>' }), context as never);
  };

  it('maps dark compact globals to the theme wrapper', () => {
    expect(
      render({ globals: { density: 'compact', scheme: 'dark', theme: 'default' } }),
    ).toMatchObject({
      props: { slottedDensity: 'compact', slottedScheme: 'dark', slottedTheme: 'default' },
    });
  });

  it('defaults light globals when context is absent', () => {
    expect(
      render({ globals: { density: 'comfortable', scheme: 'light', theme: 'default' } }),
    ).toMatchObject({
      props: { slottedDensity: 'comfortable', slottedScheme: 'light', slottedTheme: 'default' },
    });
    expect(render(undefined)).toMatchObject({
      props: { slottedDensity: 'comfortable', slottedScheme: 'light', slottedTheme: 'default' },
    });
  });

  it('uses the deterministic remote development host', async () => {
    const packageJson = await readFile(
      fileURLToPath(new URL('../package.json', import.meta.url)),
      'utf8',
    );
    const dev = JSON.parse(packageJson).scripts.dev as string;
    expect(dev).toContain('--host 0.0.0.0');
    expect(dev).toContain('--port 6007');
    expect(dev).toContain('--no-open');
  });

});
