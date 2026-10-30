import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'aspect-ratio');
  assert.equal(contract.ui, 'aspect-ratio');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member, one part. Radix, Chakra and Mantine each publish one box and
 * nothing inside it; what fills the box is the consumer's, and `image` is the
 * family that puts a picture there.
 */
test('is one box, and the content is the consumer’s', () => {
  assert.deepEqual(Object.keys(contract.members), ['aspect-ratio']);
  assert.deepEqual(contract.members['aspect-ratio'].parts, ['root']);
  assert.equal(contract.members['aspect-ratio'].nativeElement, 'div');
});

/**
 * Five names and a number. Carbon ships nine names and no number, Radix and
 * Mantine a number and no name; a product decides once that a thumbnail is
 * `landscape`, and the DOM says which one it was. `custom` is the number,
 * written as `w / h` into `--slotted-aspect-ratio` on the instance.
 */
test('names five ratios a product can decide once, and takes any other as a number', () => {
  assert.deepEqual(contract.axes.ratio, [
    'square',
    'landscape',
    'portrait',
    'video',
    'wide',
    'custom',
  ]);
  assert.deepEqual(contract.namedRatios, {
    square: [1, 1],
    landscape: [4, 3],
    portrait: [3, 4],
    video: [16, 9],
    wide: [21, 9],
  });
  for (const name of contract.axes.ratio) {
    if (name === 'custom') continue;
    assert.ok(name in contract.namedRatios, `${name} has no pair`);
  }
});

/**
 * The ratio is a decision, so there is no default to fall back on: both
 * bindings require it, and a box that states none is a box the consumer did
 * not think about.
 */
test('declares no default ratio, because the ratio is the consumer’s decision', () => {
  assert.deepEqual(contract.members['aspect-ratio'].defaults, {});
});

/**
 * The ratio is a quantity the consumer states and the family draws, which is
 * what `measurement` is for; nothing here is mutable, so nothing has a model.
 */
test('holds no state a consumer can own, and therefore declares no state model', () => {
  assert.deepEqual(contract.members['aspect-ratio'].capabilities, ['measurement', 'content']);
  assert.deepEqual(contract.members['aspect-ratio'].states, ['default']);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members['aspect-ratio'].capabilities.includes(capability),
      `aspect-ratio claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
  assert.deepEqual(contract.stateAttributes, {});
});

test('names one reference page, covering the growth rule and the composition with image', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['aspect-ratio']);
  assert.deepEqual(contract.scenarios['aspect-ratio'], [
    'playground',
    'ratios',
    'custom',
    'media',
    'growth',
    'composition',
    'accessibility',
  ]);
});
