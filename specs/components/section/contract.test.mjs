import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.section;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'section');
  assert.equal(contract.ui, 'section');
  assert.equal(contract.schemaVersion, 5);
  assert.equal(member.nativeElement, 'section');
});

test('cites the landmark practice rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/');
});

test('declares its anatomy as parts', () => {
  assert.deepEqual(member.parts, [
    'root',
    'header',
    'title',
    'eyebrow',
    'heading',
    'tags',
    'description',
    'actions',
    'body',
  ]);
});

/** A `section` with an accessible name is a region; one without is not a landmark. */
test('is a region only when it has a heading to be named by', () => {
  assert.equal(contract.roles.root, 'region');
  assert.match(contract.wiring['aria-labelledby'], /heading/);
  assert.match(contract.wiring.unnamed, /not a landmark/);
});

/** The outline is typography's; the section reads it and steps it for its body. */
test('takes its heading level from the outline and steps it for its body', () => {
  assert.equal(contract.heading.provider, 'typography');
  assert.equal(contract.heading.body, '+1');
  assert.deepEqual(contract.axes.level, ['auto', '1', '2', '3', '4', '5', '6']);
  assert.equal(member.defaults.level, 'auto');
});

test('separates by space, rule or surface, and is never a card', () => {
  assert.deepEqual(contract.axes.divider, [false, true]);
  assert.deepEqual(contract.axes.ground, ['none', 'surface']);
  assert.match(contract.ground.surface, /no shadow/);
  assert.match(contract.declined.card.reason, /card/);
});

test('sticks its header under the page chrome', () => {
  assert.deepEqual(contract.axes.sticky, [false, true]);
  assert.equal(contract.sticky.offset, 'var(--slotted-page-sticky-top, 0px)');
  assert.equal(contract.sticky.part, 'header');
  assert.match(contract.sticky.stuck, /data-stuck/);
  assert.match(contract.sticky.stuck, /--slotted-section-header-background/);
});

/** The hooks anchor navigation needs, and the family that owns the rest. */
test('gives anchor navigation its hooks and defers the bar', () => {
  assert.equal(contract.anchors.deferTo, 'anchor-nav');
  assert.equal(contract.anchors.scrollMargin, 'var(--slotted-page-sticky-top, 0px)');
  assert.match(contract.anchors.id, /useId/);
});

test('holds no state a reader moves', () => {
  assert.deepEqual(member.states, ['default']);
  assert.equal(contract.stateModel, undefined);
  assert.deepEqual(member.capabilities, ['size', 'appearance', 'wiring']);
});

test('lets an application set its defaults once', () => {
  assert.deepEqual(contract.provides.sectionDefaults, ['size', 'divider', 'ground', 'sticky']);
});

test('declines with a reason, never silently', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines without a reason`);
  }
});

test('lists every scenario the reference pages have to show', () => {
  assert.deepEqual(contract.scenarios.section, [
    'playground',
    'anatomy',
    'level',
    'size',
    'separation',
    'sticky',
    'nested',
    'content',
    'composition',
    'defaults',
    'accessibility',
  ]);
});
