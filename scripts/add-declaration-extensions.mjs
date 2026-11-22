import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * The packages are ES modules (`"type": "module"`), and under
 * `moduleResolution: node16` or `nodenext` a consumer's compiler reads their
 * declarations as ES modules too: a relative specifier needs its file
 * extension, and a directory needs its `index.js`. `tsc` emits the specifiers
 * as the sources write them, extensionless, which only `bundler` resolution
 * accepts; under `nodenext` every `export *` resolved to nothing and every
 * named re-export to `any`.
 *
 * Each relative specifier in the emitted `.d.ts` files is rewritten to the file
 * it names: `./x` to `./x.js` when `x.d.ts` exists, to `./x/index.js` when
 * `x/index.d.ts` does. Both forms resolve under `bundler` as well.
 *
 * Usage: `node scripts/add-declaration-extensions.mjs <types directory>`.
 */

/** `from './x'`, `import('./x')`, `import './x'`: a relative specifier with no extension. */
const SPECIFIER = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]*?)\2/g;
const KNOWN_EXTENSION = /\.(?:[cm]?js|json|css)$/;

export function rewriteDirectory(directory) {
  let changed = 0;

  for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) continue;

    const path = join(entry.parentPath, entry.name);
    const source = readFileSync(path, 'utf8');
    const rewritten = addExtensions(source, (specifier) => fileOf(dirname(path), specifier));

    if (rewritten === source) continue;
    writeFileSync(path, rewritten);
    changed += 1;
  }

  return changed;
}

export function addExtensions(source, resolveSpecifier) {
  return source.replace(SPECIFIER, (whole, lead, quote, specifier) => {
    const resolved = resolveSpecifier(specifier);

    return resolved === null ? whole : `${lead}${quote}${resolved}${quote}`;
  });
}

function fileOf(directory, specifier) {
  if (KNOWN_EXTENSION.test(specifier)) return null;

  const target = resolve(directory, specifier);

  if (existsSync(`${target}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(target, 'index.d.ts'))) return `${specifier.replace(/\/$/, '')}/index.js`;

  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];

  if (directory === undefined) {
    console.error('usage: add-declaration-extensions.mjs <types directory>');
    process.exit(1);
  }

  rewriteDirectory(resolve(directory));
}
