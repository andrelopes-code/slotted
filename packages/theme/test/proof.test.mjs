import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildTheme } from '../cli/build.mjs';

/**
 * The compiled proof theme, held whole. `UPDATE_PROOF=1` rewrites the
 * snapshot; a change to it is a change to what every theme compiles to.
 */
const snapshot = new URL('fixtures/proof/proof.css', import.meta.url);

async function readSnapshot() {
  try {
    return await readFile(snapshot, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    assert.fail(
      `${fileURLToPath(snapshot)} does not exist — run: UPDATE_PROOF=1 node --test packages/theme/test/proof.test.mjs`,
    );
  }
}

test('compiles every part of a theme in the published order', async () => {
  const out = await mkdtemp(join(tmpdir(), 'slotted-proof-'));
  try {
    const { css } = await buildTheme(
      fileURLToPath(new URL('fixtures/proof/theme.mjs', import.meta.url)),
      out,
    );
    const order = [
      '@layer slotted.reset',
      '@property --slotted-seed-accent',
      '@font-face {\n  font-family: "Proof Sans"',
      '@layer slotted.theme {',
      '@keyframes slotted-proof-breathe',
      '@layer slotted.theme-rules {',
    ].map((marker) => css.indexOf(marker));
    assert.ok(
      order.every((position) => position >= 0),
      `missing a block: ${order}`,
    );
    assert.deepEqual(
      [...order].sort((a, b) => a - b),
      order,
    );
    assert.ok(css.includes('--slotted-seed-accent: oklch(0.55 0.2 300);'));
    assert.ok(css.includes('--slotted-text-field-radius: 0px;'));
    assert.ok(css.includes('animation: slotted-proof-breathe 1s infinite alternate;'));
    if (process.env.UPDATE_PROOF === '1') await writeFile(snapshot, css);
    assert.equal(css, await readSnapshot());
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
