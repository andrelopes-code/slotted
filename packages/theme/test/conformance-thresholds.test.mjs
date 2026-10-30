import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('fixtures/conformance/layer-step.mjs', import.meta.url));

/** The layer check alone, run in a process of its own so its verdict can be read. */
function layerCheck(layerStep) {
  return spawnSync(
    process.execPath,
    ['--test', '--test-name-pattern=raises a layer visibly above the page', fixture],
    {
      encoding: 'utf8',
      /* Without the parent's test context, the child reports its own verdict. */
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(([name]) => name !== 'NODE_TEST_CONTEXT'),
        ),
        ...(layerStep === undefined ? {} : { LAYER_STEP: String(layerStep) }),
      },
    },
  );
}

/**
 * A theme may pick its own layer step in a dark scheme and keep every other
 * check: `thresholds.layerStep`, 0.04 unless given, and the failure names it.
 */
test('takes a dark layer step of its own from thresholds.layerStep', () => {
  const strict = layerCheck(undefined);
  assert.notEqual(strict.status, 0);
  assert.match(strict.stdout, /thresholds\.layerStep/);
  assert.equal(layerCheck(0.015).status, 0);
});
