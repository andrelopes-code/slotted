import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDocs } from './build.ts';
import { DOCS_DIR, type Binding } from './types.ts';

const root = resolve(import.meta.dirname, '../../..');

/**
 * A path the text names: a code span ending in `.md` with a directory in it.
 * A span holding `<…>` is a pattern the reader fills (`<family>.md`), not a path.
 */
function pathsIn(text: string): string[] {
  return [...text.matchAll(/`([^`\s]+\.md)`/g)]
    .map(([, path]) => path!)
    .filter((path) => path.includes('/') && !path.includes('<'));
}

/** Every Markdown file under `dir`, relative to it. */
function markdown(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((file) =>
    file.endsWith('.md'),
  );
}

/**
 * The docs are installed where an application installs them, so the snippet
 * resolves against the directory that holds `node_modules` — the base its
 * first sentence states — and every other file against its own directory.
 */
describe.each<Binding>(['react', 'angular'])('the paths the %s docs name', (binding) => {
  it('resolve from the stated base in the snippet, and from the file itself everywhere else', async () => {
    const app = mkdtempSync(join(tmpdir(), 'app-'));
    const docs = join(app, DOCS_DIR[binding]);
    mkdirSync(dirname(docs), { recursive: true });
    await buildDocs({ binding, root, out: docs });

    const snippet = readFileSync(join(docs, 'AGENTS.snippet.md'), 'utf8');
    expect(snippet.split('\n').find((line) => line.trim() !== '' && !line.startsWith('#'))).toMatch(
      /^Paths below are relative to the directory that holds node_modules\./,
    );

    const missing: string[] = [];
    const bare: string[] = [];
    const snippetPaths = pathsIn(snippet);
    expect(snippetPaths.length).toBeGreaterThan(0);
    for (const path of snippetPaths)
      if (!existsSync(join(app, path))) missing.push(`AGENTS.snippet.md: ${path}`);

    const files = markdown(docs).filter((file) => file !== 'AGENTS.snippet.md');
    let named = 0;
    for (const file of files) {
      const text = readFileSync(join(docs, file), 'utf8');
      for (const path of pathsIn(text)) {
        named += 1;
        if (path.startsWith('node_modules/')) bare.push(`${file}: ${path}`);
        else if (!existsSync(resolve(docs, dirname(file), path)))
          missing.push(`${file}: ${path} (${relative(app, resolve(docs, dirname(file), path))})`);
      }
    }
    expect(named).toBeGreaterThan(0);

    expect(bare, 'a path that resolves only from the directory holding node_modules').toEqual([]);
    expect(missing, 'a path that names no file').toEqual([]);
  });
});
