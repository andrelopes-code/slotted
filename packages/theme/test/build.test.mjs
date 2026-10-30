import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildTheme } from '../cli/build.mjs';

const fixture = fileURLToPath(new URL('fixtures/cli/theme.mjs', import.meta.url));

test('writes the stylesheet, the resolved module and its declaration', async () => {
  const out = await mkdtemp(join(tmpdir(), 'slotted-theme-'));
  try {
    const { name } = await buildTheme(fixture, out);
    assert.equal(name, 'cli-fixture');
    const css = await readFile(join(out, 'cli-fixture.css'), 'utf8');
    assert.ok(css.includes('border-block-start-width: 0;'));
    assert.ok(css.includes('@layer slotted.theme-rules'));
    const built = (await import(join(out, 'cli-fixture.js'))).default;
    assert.equal(built.kind, 'slotted-theme');
    assert.ok(built.rules.every((rule) => typeof rule === 'string'));
    assert.match(
      await readFile(join(out, 'cli-fixture.d.ts'), 'utf8'),
      /declare const theme: Theme;/,
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('refuses a theme whose rules fail validation, naming the file, line and selector', async () => {
  const out = await mkdtemp(join(tmpdir(), 'slotted-theme-'));
  const module = fileURLToPath(new URL('fixtures/cli/bad.generated.mjs', import.meta.url));
  // Controller ruling: extendTheme's third argument carries `name`; `ThemeOverrides` has none.
  await writeFile(
    module,
    "import base from './theme.mjs';\nimport { extendTheme } from '@slotted/theme';\nexport default extendTheme(base, { rules: ['.x { color: red; }'] }, { name: 'bad' });\n",
  );
  try {
    await assert.rejects(
      buildTheme(module, out),
      // Location (file:line), the enclosing rule's selector, and the brief's own message text.
      /bad\.generated\.mjs#rules\[2\]:\d+ \.x: .*a class is not a public selector/,
    );
  } finally {
    await rm(module, { force: true });
    await rm(out, { recursive: true, force: true });
  }
});
