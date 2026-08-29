import { readFileSync } from 'node:fs';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@slotted/storybook-workbench', () => ({
  GLOBAL_TYPES: {},
  INITIAL_GLOBALS: { density: 'comfortable', scheme: 'light', theme: 'default' },
  resolveWorkbenchGlobals: () => ({
    density: 'comfortable',
    scheme: 'light',
    theme: 'default',
  }),
}));

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
describe('React Storybook remote development server', () => {
  it('binds all interfaces on the documented port', () => {
    expect(manifest.scripts.dev).toContain('--host 0.0.0.0');
    expect(manifest.scripts.dev).toContain('--port 6006');
    expect(manifest.scripts.dev).toContain('--no-open');
  });

  it('uses a compact wrapper for stories embedded in docs', async () => {
    const { default: preview } = await import('./preview');
    const decorator = preview.decorators?.[0];
    const embedded = decorator?.(() => null, {
      globals: {},
      viewMode: 'docs',
    } as never) as ReactElement<{ className: string }>;
    const standalone = decorator?.(() => null, {
      globals: {},
      viewMode: 'story',
    } as never) as ReactElement<{ className: string }>;

    expect(embedded.props.className).toContain('slotted-workbench-preview--embedded');
    expect(standalone.props.className).not.toContain('slotted-workbench-preview--embedded');
  });
});
