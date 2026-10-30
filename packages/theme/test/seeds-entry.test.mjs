import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** A built module and every module it imports statically, as file paths. */
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  for (const [, specifier] of source.matchAll(
    /(?:^|[;}\s])(?:import|export)\b[^'"()]*?from\s*['"](\.[^'"]+)['"]/g,
  )) {
    closure(join(dirname(file), specifier), seen);
  }
  for (const [, specifier] of source.matchAll(/(?:^|[;}\s])import\s*['"](\.[^'"]+)['"]/g)) {
    closure(join(dirname(file), specifier), seen);
  }
  return seen;
}

/**
 * An application writes a reader's seeds before it has any reason to compile
 * a theme. `@slotted/theme/seeds` is the entry for that: the seed names and
 * `seedStyle`, with the colour parser they need and nothing of the contract,
 * the validator or the renderer, which a bundler cannot drop from a module it
 * shares with them.
 */
test('the seeds entry carries the seed names and seedStyle, and none of the theme machinery', async () => {
  const entry = join(DIST, 'seeds.js');
  assert.ok(existsSync(entry), 'dist/seeds.js exists');
  const seeds = await import(entry);
  const index = await import(join(DIST, 'index.js'));
  assert.deepEqual(
    [...seeds.SEED_NAMES],
    ['accent', 'neutral', 'success', 'info', 'warning', 'danger'],
  );
  assert.equal(seeds.seedStyle, index.seedStyle);
  assert.equal(seeds.SEED_NAMES, index.SEED_NAMES);
  assert.deepEqual(seeds.seedStyle({ accent: '#7c3aed' }), { '--slotted-seed-accent': '#7c3aed' });
  assert.throws(() => seeds.seedStyle({ accent: 'red; color: blue' }), /seed accent/);

  const files = [...closure(entry)];
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const marker of ['states a literal', '--slotted-text-field-radius', '@layer slotted']) {
    assert.ok(!source.includes(marker), `${marker} is not reachable from dist/seeds.js`);
  }
  const bytes = files.reduce((total, file) => total + readFileSync(file).length, 0);
  assert.ok(bytes < 8_000, `dist/seeds.js and its imports are ${bytes} bytes`);

  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.exports['./seeds'], {
    types: './dist/types/seeds.d.ts',
    import: './dist/seeds.js',
  });
  assert.ok(existsSync(join(DIST, 'types/seeds.d.ts')));
});
