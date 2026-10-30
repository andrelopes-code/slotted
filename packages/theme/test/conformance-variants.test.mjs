import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('fixtures/conformance/variant.mjs', import.meta.url));

/** The variant's dark layer check alone, in a process of its own so its verdict can be read. */
function variantLayerCheck(raised) {
  return spawnSync(
    process.execPath,
    [
      '--test',
      '--test-name-pattern=depth=oled dark raises a layer visibly above the page',
      fixture,
    ],
    {
      encoding: 'utf8',
      /* Without the parent's test context, the child reports its own verdict. */
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(([name]) => name !== 'NODE_TEST_CONTEXT'),
        ),
        ...(raised === undefined ? {} : { RAISED: String(raised) }),
      },
    },
  );
}

/**
 * A variant value is held to the checks of the scheme it changes: a raised
 * layer 0.02 above an OLED black page fails the layer step, and one 0.08
 * above it passes.
 */
test('holds a variant value to the layer step of the dark scheme', () => {
  const flat = variantLayerCheck(undefined);
  assert.notEqual(flat.status, 0);
  assert.match(flat.stdout, /proof-variant depth=oled dark raises a layer/);
  assert.match(flat.stdout, /--slotted-surface-raised is 0\.0\d+ above --slotted-surface/);

  const raised = variantLayerCheck(0.08);
  assert.equal(raised.status, 0, raised.stdout);
  assert.match(raised.stdout, /ℹ pass 1\b/);
});
