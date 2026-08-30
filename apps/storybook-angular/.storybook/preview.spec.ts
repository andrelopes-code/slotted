/** @vitest-environment jsdom */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@slotted/storybook-workbench', () => ({
  GLOBAL_TYPES: {
    density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
    scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
    theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
  },
  INITIAL_GLOBALS: { density: 'comfortable', scheme: 'light', theme: 'default' },
  resolveWorkbenchGlobals: (globals: Record<string, unknown> | undefined) => ({
    density: globals?.['density'] === 'compact' ? 'compact' : 'comfortable',
    scheme: globals?.['scheme'] === 'dark' ? 'dark' : 'light',
    theme: 'default',
  }),
}));

import preview from './preview';

describe('Angular Storybook preview', () => {
  const render = (context: unknown) => {
    const decorators = Array.isArray(preview.decorators)
      ? preview.decorators
      : preview.decorators
        ? [preview.decorators]
        : [];
    const decorator = decorators[0];
    expect(decorator).toBeTypeOf('function');
    return decorator?.(() => ({ template: '<button>Probe</button>' }), context as never);
  };

  it('maps dark compact globals to the themed workbench wrapper', () => {
    const rendered = render({
      globals: { density: 'compact', scheme: 'dark', theme: 'default' },
    });

    expect(rendered).toMatchObject({
      props: {
        slottedBackground: 'var(--slotted-button-outline-background)',
        slottedColor: 'var(--slotted-tone-neutral-text)',
        slottedColorScheme: 'dark',
        slottedDensity: 'compact',
        slottedEmbedded: false,
        slottedScheme: 'dark',
        slottedTheme: 'default',
      },
    });
    expect(rendered?.template).toContain('<button>Probe</button>');
    expect(document.documentElement.dataset['slottedScheme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
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

  it('uses a compact wrapper for stories embedded in docs', () => {
    expect(render({ globals: {}, viewMode: 'docs' })).toMatchObject({
      props: { slottedEmbedded: true },
    });
    expect(render({ globals: {}, viewMode: 'story' })).toMatchObject({
      props: { slottedEmbedded: false },
    });
  });

  it('keeps the themed docs surface and deterministic component ordering', () => {
    expect(preview.parameters).toMatchObject({
      backgrounds: { disable: true },
      docs: { container: expect.any(Function), source: { state: 'none' }, toc: true },
      layout: 'fullscreen',
      options: { storySort: { order: ['Components', expect.any(Array)] } },
    });
  });

  it('uses the deterministic remote development host', async () => {
    const packageJson = await readFile(resolve(process.cwd(), 'package.json'), 'utf8');
    const dev = JSON.parse(packageJson).scripts.dev as string;
    expect(dev).toContain('--host 0.0.0.0');
    expect(dev).toContain('--port 6007');
    expect(dev).toContain('--no-open');
  });
});
