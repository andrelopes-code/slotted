import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const skeleton = contract.members.skeleton;

/**
 * Read here rather than recalled, because the claim this file makes about the
 * two round shapes is a claim about another family's public vocabulary. If
 * Avatar ever renames one of them, this test is what says so.
 */
const avatar = JSON.parse(
  await readFile(new URL('../avatar/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one family with one member, three components and five parts', () => {
  assert.equal(contract.family, 'skeleton');
  assert.equal(contract.ui, 'skeleton');
  assert.deepEqual(Object.keys(contract.members), ['skeleton']);
  assert.deepEqual(skeleton.parts, ['root', 'text', 'line', 'region', 'announcement']);
});

/**
 * A `span` rather than a `div`, so a placeholder standing in for a word inside
 * a sentence is legal markup. The two parts that hold others — `text` and
 * `region` — are the family's only block elements, and the anatomy table names
 * them; the element a member renders is the element of its first part.
 */
test('renders an element that is legal wherever content is', () => {
  assert.equal(skeleton.nativeElement, 'span');
});

/**
 * Four shapes, and the vocabulary is deliberately not `size`'s. A line of text
 * takes the height of the type around it, a block takes what it is given, and
 * a round placeholder takes an avatar's box: three relationships to the
 * surrounding layout rather than three points on one scale. `circle` and
 * `square` are Avatar's own two words, because that is what they stand in for.
 */
test('names four shapes, two of which are Avatar’s', () => {
  assert.deepEqual(contract.axes.shape, ['text', 'block', 'circle', 'square']);
  assert.equal(skeleton.defaults.shape, 'text');
  for (const shape of avatar.axes.shape) {
    assert.ok(
      contract.axes.shape.includes(shape),
      `a placeholder for a ${shape} avatar has no word of its own`,
    );
  }
});

/**
 * Five steps, not the type scale's seven, because the scale behind them is
 * `--slotted-avatar-size-*`. It means nothing on `text`, which takes its
 * height from the type it is placed in, and nothing on `block`, which takes
 * what the consumer or the covered content gives it.
 */
test('sizes the round shapes on the scale this library already owns', () => {
  assert.deepEqual(contract.axes.size, ['xs', 'sm', 'md', 'lg', 'xl']);
  assert.equal(skeleton.defaults.size, 'md');
  assert.deepEqual(contract.sizedShapes, ['circle', 'square']);
});

/**
 * `shimmer` is the default: a band travelling across the placeholder is what
 * says "still coming" rather than "empty", and it is what the field defaults
 * to. Both it and `pulse` derive their second color from the fill, so both
 * are correct in all three schemes — the reason this family gave in August for
 * having no shimmer at all no longer holds.
 */
test('offers three animations and defaults to the one that reads as waiting', () => {
  assert.deepEqual(contract.axes.animation, ['shimmer', 'pulse', 'none']);
  assert.equal(skeleton.defaults.animation, 'shimmer');
});

/**
 * The whole point of the rebuild. `loading` is what makes a placeholder stop
 * being one, and the shipped family had no way to say it.
 */
test('holds the loading fact, and paints it as a state a consumer can style', () => {
  assert.ok(skeleton.capabilities.includes('loading'));
  assert.equal(skeleton.defaults.loading, true);
  assert.deepEqual(skeleton.states, ['default', 'loading']);
  assert.deepEqual(contract.stateAttributes, { loading: 'data-loading' });
});

/**
 * A placeholder cannot decide that data arrived, so there is nothing for it to
 * request and no mode for a consumer to choose between. The absence is
 * asserted rather than implied, because the next reader's first question is
 * why a family with a boolean has no state model.
 */
test('holds no state a consumer can own, and therefore no state model', () => {
  for (const capability of skeleton.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} would make loading a value the family moves`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

/**
 * The scope paragraph's other half: the region announces the wait once. `live`
 * is what decides whether it announces at all, and it defaults to `polite`
 * because the announcement is the only thing a screen reader gets — every box
 * is hidden from it.
 */
test('announces from the region, once, and lets an application switch it off', () => {
  assert.ok(skeleton.capabilities.includes('live'));
  assert.deepEqual(contract.axes.live, ['polite', 'off']);
  assert.equal(skeleton.defaults.live, 'polite');
  assert.deepEqual(contract.messages, ['label']);
  assert.ok(skeleton.parts.includes('announcement'));
});

/**
 * Both default to zero. The family cannot know a consumer's latency, and a
 * non-zero default would leave a blank page wherever the data is already
 * absent — which is every first render. The recommended pair is on the
 * reference page, and an application sets it once through the provider.
 */
test('ships the timing that prevents a flash, and turns neither on by itself', () => {
  assert.equal(skeleton.defaults.delay, 0);
  assert.equal(skeleton.defaults.minDuration, 0);
});

test('draws three lines by default, and shortens only the last of several', () => {
  assert.equal(skeleton.defaults.lines, 3);
  assert.equal(skeleton.defaults.lastLineSize, '62%');
});

test('exposes appearance, shape, size, loading and live as its capabilities', () => {
  assert.deepEqual(skeleton.capabilities, ['appearance', 'shape', 'size', 'loading', 'live']);
});

test('names one scenario page, because the three components are used together', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['skeleton']);
  assert.deepEqual(contract.scenarios.skeleton, [
    'playground',
    'shapes',
    'text',
    'sizes',
    'wrapping',
    'region',
    'timing',
    'animation',
    'composition',
    'content',
    'accessibility',
  ]);
});
