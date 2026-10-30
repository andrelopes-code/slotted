import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDesignSystem } from './design-system.ts';

/** Reads the React build: run after `pnpm --filter @slotted/react build`. */
const root = resolve(import.meta.dirname, '../../..');
const args = { root, ref: 'main@0000000', at: '2026-10-16T00:00:00Z', by: 'Test' };

function tree(dir: string): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else files.set(relative(dir, path), readFileSync(path));
    }
  };
  walk(dir);
  return files;
}

describe('buildDesignSystem', async () => {
  const out = join(mkdtempSync(join(tmpdir(), 'ds-')), 'design-system');
  const report = await buildDesignSystem({ ...args, out });
  const files = tree(join(out, 'project'));
  const text = (path: string) => files.get(path)!.toString('utf8');

  it('writes the index with its marker, the tokens, the book and the cover', () => {
    const index = JSON.parse(text('design-system.json')) as Record<string, unknown>;
    expect(index).toMatchObject({
      v: 3,
      layout: 'files',
      title: 'Slotted',
      createdOnFiles: { v: 1 },
      docs: { readme: 'project/README.md', sections: [] },
    });
    expect(JSON.parse(text('tokens.json'))).toMatchObject({ name: 'Slotted', version: 1 });
    expect(text('README.md')).toContain('## Colour');
    expect(text('components/Cover/preview.html').split('\n')[0]).toBe(
      '<!-- @dsCard height=288 -->',
    );
  });

  it('gives every family guidelines, and a preview where an example renders', () => {
    const families = readdirSync(join(root, 'packages/react/dist/docs')).filter((file) =>
      file.endsWith('.json'),
    );
    const readmes = [...files.keys()].filter((path) =>
      /^components\/[A-Za-z0-9]+\/README\.md$/.test(path),
    );
    expect(readmes).toHaveLength(families.length);
    const previews = [...files.keys()].filter((path) =>
      /^components\/[A-Za-z0-9]+\/preview\.html$/.test(path),
    );
    expect(previews.length + report.withoutPreview.length).toBe(families.length + 1);
    expect([...report.renderErrors]).toEqual([]);
  });

  it('keeps within the caps of the type', () => {
    expect(files.size).toBeLessThanOrEqual(1008);
    const over = [...files].filter(([path, bytes]) => {
      if (path === 'components/bundle.css') return bytes.length > 2 * 1024 * 1024;
      if (path.endsWith('/README.md')) return bytes.length > 64 * 1024;
      if (path.endsWith('/preview.html')) return bytes.length > 256 * 1024;
      if (path === 'tokens.json') return bytes.length > 512 * 1024;
      return false;
    });
    expect(over.map(([path]) => path)).toEqual([]);
  });

  it('writes the same files for the same commit', async () => {
    const again = join(mkdtempSync(join(tmpdir(), 'ds-')), 'design-system');
    await buildDesignSystem({ ...args, out: again });
    const second = tree(join(again, 'project'));
    expect([...second.keys()].sort()).toEqual([...files.keys()].sort());
    for (const [path, bytes] of files) expect(second.get(path)!.equals(bytes), path).toBe(true);
  });
});
