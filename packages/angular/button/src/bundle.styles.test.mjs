import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bundle = readFileSync(
  new URL('../../dist/fesm2022/slotted-angular-button.mjs', import.meta.url),
  'utf8',
);

test('ships class-selector styles with encapsulation disabled', () => {
  assert.match(bundle, /encapsulation: i0\.ViewEncapsulation\.None/);
  assert.doesNotMatch(bundle, /styles: \["@layer slotted\.components\{:host/);
  assert.match(bundle, /styles: \["@layer slotted\.components\{\.slotted-button\{/);
  assert.match(bundle, /\.slotted-button-group\{/);
});
