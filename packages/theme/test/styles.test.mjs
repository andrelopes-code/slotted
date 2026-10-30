import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { LAYER_ORDER_STATEMENT } from '../dist/layer-order.js';

/**
 * `@slotted/theme/styles.css` is the stylesheet that registers the layer
 * order for an application importing nothing else from the library
 * (`docs/decisions/0001-cascade-layer-contract.md`).
 */
test('the published stylesheet opens with the layer order', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.ok(css.startsWith(LAYER_ORDER_STATEMENT), css.slice(0, 120));
});
