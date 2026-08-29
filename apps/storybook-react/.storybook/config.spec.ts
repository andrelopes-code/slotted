import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
describe('React Storybook remote development server', () => {
  it('binds all interfaces on the documented port', () => {
    expect(manifest.scripts.dev).toContain('--host 0.0.0.0');
    expect(manifest.scripts.dev).toContain('--port 6006');
    expect(manifest.scripts.dev).toContain('--no-open');
  });
});
