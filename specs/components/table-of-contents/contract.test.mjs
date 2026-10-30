import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const section = JSON.parse(
  await readFile(new URL('../section/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.tableOfContents;
const keys = contract.keyboard.map((entry) => entry.key);

/** The four fields the schema holds; a model's `reason` and `attributeOn` are documentation. */
function model({ controlled, uncontrolled, request, reasons }) {
  return { controlled, uncontrolled, request, reasons };
}

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'table-of-contents');
  assert.equal(contract.ui, 'table-of-contents');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The APG has no pattern for the family, and the contract says so rather than
 * citing one from memory. What it cites is the Disclosure Navigation Menu
 * example, for the trigger of the collapsed layout, and `aria-current` with
 * the `location` token from ARIA 1.2 — a section in view is a location within
 * a context, not a page within a set.
 */
test('cites the disclosure navigation example and aria-current=location', () => {
  assert.equal(
    contract.pattern,
    'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
  );
  assert.match(contract.patternStatus, /no table-of-contents/);
  assert.equal(contract.roles.root, 'navigation');
  assert.equal(contract.roles.link, 'link');
  assert.equal(contract.roles.trigger, 'button');
  assert.equal(contract.element.link, 'a');
  assert.equal(contract.element.list, 'ol');
  assert.equal(contract.current.aria, 'aria-current');
  assert.equal(contract.current.value, 'location');
});

/** The example's whole table, optional keys included, each with a focus destination. */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Tab',
    'Shift+Tab',
    'Enter',
    'Space',
    'Escape',
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(
      ['platform', 'pattern', 'departure'].includes(entry.source),
      `${entry.key} names no source`,
    );
  }
  assert.equal(contract.rovingTabindex, false);
});

test('declares a state model for each of the two values a consumer can own', () => {
  for (const capability of ['current', 'open']) {
    assert.ok(member.capabilities.includes(capability));
    assert.ok(MUTABLE_CAPABILITIES.includes(capability));
  }
  assert.deepEqual(model(contract.stateModel.current), {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['scroll', 'pointer', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(model(contract.stateModel.open), {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'select', 'escape', 'outsidePress', 'programmatic'],
  });
});

/**
 * The reason the observer carries is `scroll`, the one `page-header` put in
 * the vocabulary: a wheel is not a press on a link, and a consumer who saves
 * where the reader stopped needs to tell the two apart.
 */
test('the observer asks with the reason scroll, and a press with pointer or keyboard', () => {
  assert.ok(contract.stateModel.current.reasons.includes('scroll'));
  assert.ok(contract.stateModel.current.reasons.includes('pointer'));
  assert.ok(contract.stateModel.current.reasons.includes('keyboard'));
  assert.match(contract.navigate.steps[0], /pointer or keyboard/);
});

/**
 * Where the page's chrome ends is a property `page` publishes and every
 * sticky thing under it reads (docs/build-briefing.md). `section` writes its
 * scroll margin from it; this family reads the same name for the reading
 * line, and never measures a header itself.
 */
test('reads the sticky-top property page publishes, under the name section uses', () => {
  assert.deepEqual(contract.reads, ['--slotted-page-sticky-top']);
  assert.match(section.anchors.scrollMargin, /--slotted-page-sticky-top/);
  assert.match(contract.current.readingLine, /--slotted-page-sticky-top/);
  assert.match(contract.sticky.top, /--slotted-page-sticky-top/);
  assert.match(contract.sticky.inset, /--slotted-table-of-contents-sticky-inset/);
});

/**
 * Three layouts, one anatomy: the parts and the state model do not change
 * between the column, the bar and the collapsed trigger. The bar shows the
 * first level only, as Ant's horizontal Anchor does, and the collapsed list
 * is the disclosure pattern's, not a menu.
 */
test('holds three layouts over one anatomy', () => {
  assert.deepEqual(contract.axes.layout, ['vertical', 'horizontal', 'collapsed']);
  assert.match(contract.layout.horizontal, /first level only/);
  assert.match(contract.layout.collapsed, /Disclosure Navigation Menu/);
  assert.equal(contract.stateModel.open.attributeOn, 'root');
  for (const part of ['trigger', 'current', 'indicator', 'panel', 'marker']) {
    assert.ok(member.parts.includes(part), `${part} is not a part`);
  }
});

/**
 * The track is not a state rail. R1 refuses a band on the start edge that
 * says a state by itself; the track is drawn on the list, the marker is a
 * part that travels, and the current link is said by its ink.
 */
test('draws the track outside any state rule', () => {
  assert.match(contract.track.reason, /state-rail\.test\.mjs/);
  assert.match(contract.anatomy.marker, /--_marker-start/);
});

test('navigates by scrolling itself, and says what that costs', () => {
  assert.equal(contract.navigate.steps.length, 5);
  assert.match(contract.navigate.steps[2], /prefers-reduced-motion/);
  assert.match(contract.navigate.steps[4], /tabindex=-1/);
  assert.match(contract.navigate.cost, /:target/);
  assert.deepEqual(contract.axes.history, ['push', 'replace', 'none']);
});

test('generates ids for headings without one and never rewrites an existing id', () => {
  assert.match(contract.source.ids, /never rewritten/);
  assert.match(contract.source.ids, /unique by suffix/);
  assert.deepEqual(member.defaults.levels, [2, 3]);
});

test('every declined capability names its owner or the composition', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
  assert.equal(contract.declined.tabs.deferTo, 'tabs');
});

test('every axis resolves through the defaults provider', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(contract.resolution[axis], `${axis} has no resolution order`);
    assert.equal(contract.resolution[axis][1], 'defaults');
    assert.ok(
      contract.provides.tableOfContentsDefaults.includes(axis),
      `${axis} is not in the defaults`,
    );
  }
});
