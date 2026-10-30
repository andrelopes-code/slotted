import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'icon');
  assert.equal(contract.ui, 'icon');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The box has no anatomy of its own. Its one other part is the library's own
 * artwork: `Glyph` / `svg[slGlyph]`, the element every family draws its icons
 * with, so a close button's cross is a real `<svg>` and never a pseudo-element
 * or a mask a stylesheet invented. A consumer's artwork stays theirs.
 */
test('is one member: the box, and the library’s own glyph inside it', () => {
  assert.deepEqual(Object.keys(contract.members), ['icon']);
  assert.deepEqual(contract.members.icon.parts, ['root', 'glyph']);
});

test('frames the artwork rather than owning it', () => {
  assert.equal(contract.members.icon.nativeElement, 'span');
  assert.ok(!('glyphs' in contract), 'a glyph catalogue would make the artwork the family’s');
  assert.ok(!('axes' in contract && 'name' in contract.axes), 'a glyph is content, not an axis');
});

test('carries no state: an icon is replaced, not changed', () => {
  assert.deepEqual(contract.members.icon.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
});

test('sizes from the control icon scale, and from the type beside it', () => {
  assert.deepEqual(contract.axes.size, ['text', 'sm', 'md', 'lg']);
  assert.deepEqual(contract.members.icon.capabilities, ['size']);
  assert.equal(contract.members.icon.defaults.size, 'md');
});

test('takes the colour of its context before it takes a tone', () => {
  assert.deepEqual(contract.axes.tone, [
    'inherit',
    'default',
    'muted',
    'accent',
    'info',
    'success',
    'warning',
    'danger',
    'inverse',
  ]);
  assert.equal(contract.members.icon.defaults.tone, 'inherit');
});

test('declares no stroke or fill axis, because it does not own the geometry', () => {
  for (const axis of ['stroke', 'fill', 'weight', 'variant']) {
    assert.ok(!(axis in contract.axes), `${axis} would decide something the artwork already did`);
  }
});

test('mirrors only what the consumer says points somewhere', () => {
  assert.deepEqual(Object.keys(contract.members.icon.defaults), ['size', 'tone', 'directional']);
  assert.equal(contract.members.icon.defaults.directional, false);
});

test('has no decorative switch, because the name is what decides', () => {
  assert.ok(!('decorative' in contract.members.icon.defaults));
  assert.ok(!contract.members.icon.capabilities.includes('decorative'));
});

test('names one reference page, covering direction and the accessibility choice', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['icon']);
  assert.deepEqual(contract.scenarios.icon, [
    'playground',
    'sizes',
    'baseline',
    'tone',
    'in-context',
    'direction',
    'accessibility',
    'library-glyphs',
  ]);
});

/**
 * Where the box sits against a line of text is the family's one purely optical
 * decision, and a scene showing sizes side by side cannot show it: the shift is
 * only visible against running text whose baseline the eye already follows.
 */
test('shows the optical shift against running text, not against a size chart', () => {
  assert.ok(contract.scenarios.icon.includes('baseline'));
});
