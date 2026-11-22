import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { addExtensions, rewriteDirectory } from './add-declaration-extensions.mjs';

test('names the file a relative specifier resolves to, and leaves the rest', () => {
  const files = { './format': './format.js', './chart': './chart/index.js' };
  const source = [
    "export * from './chart';",
    "export { formatMessage } from './format';",
    "export type { X } from '../types.json';",
    "import type { Y } from 'react';",
    "type Z = import('./format').Z;",
  ].join('\n');

  assert.equal(
    addExtensions(source, (specifier) => files[specifier] ?? null),
    [
      "export * from './chart/index.js';",
      "export { formatMessage } from './format.js';",
      "export type { X } from '../types.json';",
      "import type { Y } from 'react';",
      "type Z = import('./format.js').Z;",
    ].join('\n'),
  );
});

test('rewrites the declarations of a directory to its files and directories', () => {
  const directory = mkdtempSync(join(tmpdir(), 'declarations-'));
  try {
    mkdirSync(join(directory, 'chart'));
    writeFileSync(join(directory, 'chart', 'index.d.ts'), 'export {};');
    writeFileSync(join(directory, 'format.d.ts'), 'export {};');
    writeFileSync(
      join(directory, 'index.d.ts'),
      "export * from './chart';\nexport * from './format';\nexport * from './missing';\n",
    );

    assert.equal(rewriteDirectory(directory), 1);
    assert.equal(
      readFileSync(join(directory, 'index.d.ts'), 'utf8'),
      "export * from './chart/index.js';\nexport * from './format.js';\nexport * from './missing';\n",
    );
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
