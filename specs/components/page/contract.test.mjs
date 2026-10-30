import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const container = JSON.parse(
  await readFile(new URL('../container/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.page;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'page');
  assert.equal(contract.ui, 'page');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the landmark practice rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/');
});

/**
 * One `main` per document, and the page is it unless the consumer says the
 * document already has one — a page inside a drawer, a dialog, or the detail
 * pane of a master–detail layout.
 */
test('is the main landmark by default and can decline to be', () => {
  assert.equal(member.nativeElement, 'main');
  assert.deepEqual(contract.axes.landmark, ['main', 'none']);
  assert.equal(member.defaults.landmark, 'main');
  assert.equal(contract.landmark.none.element, 'div');
  assert.match(contract.landmark.reason, /one main landmark/);
});

/**
 * The header is not a part. A `sticky` element never leaves the box that
 * contains it, so a wrapper exactly the header's height would pin nothing.
 */
test('has no header part, because the header must be a direct child of what scrolls', () => {
  assert.deepEqual(member.parts, ['root', 'scroll', 'body', 'footer', 'actions']);
  assert.match(contract.anatomy.scroll, /direct child/);
  assert.equal(contract.anatomy.header, 'page-header');
});

/** The two answers the field gives, as one axis rather than two families. */
test('says who scrolls, once', () => {
  assert.deepEqual(contract.axes.scroll, ['ancestor', 'self']);
  assert.equal(member.defaults.scroll, 'ancestor');
  for (const value of contract.axes.scroll) {
    assert.ok(contract.scroll[value].length > 0, `${value} says nothing about who scrolls`);
  }
  assert.match(contract.scroll.self, /footer/);
});

/** Measure belongs to container, and to it alone. */
test('takes its width from container rather than owning a second measure', () => {
  assert.deepEqual(contract.axes.width, container.axes.size);
  assert.deepEqual(contract.axes.inset, container.axes.inset);
  assert.ok(contract.composes.includes('container'));
  assert.equal(member.defaults.width, 'wide');
});

test('names the two page grounds the foundation has', () => {
  assert.deepEqual(contract.axes.ground, ['sunken', 'surface']);
  assert.equal(member.defaults.ground, 'sunken');
});

test('fills when asked and says how the header collapses there', () => {
  assert.deepEqual(contract.axes.fill, [false, true]);
  assert.equal(member.defaults.fill, false);
  assert.match(contract.fill.header, /contained/);
  assert.match(contract.fill.header, /16 pixels/);
  assert.match(contract.fill.header, /principal/);
  assert.match(contract.fill.cost, /only a scroller inside the body/);
  /* A phone's column is too short to share: fill holds from the compact class up. */
  assert.match(contract.fill.on, /600 pixels and wider/);
});

/** The page answers its own width with the compact size class. */
test('names its query container and what changes below the compact class', () => {
  assert.equal(contract.responsive.container, 'slotted-page');
  assert.equal(contract.responsive.compact, '600px');
  assert.match(contract.responsive.below, /inset 5 to 12/);
  assert.match(contract.responsive.below, /step 4/);
  assert.doesNotMatch(contract.responsive.below, /fill stays/);
  assert.match(contract.responsive.below, /fill does not apply/);
  assert.match(contract.responsive.below, /data-grid/);
});

/** The footer takes space in the flow, so it never covers the last line. */
test('keeps the footer in the flow and holds it through its exit', () => {
  assert.equal(contract.footer.position, 'sticky');
  assert.ok(contract.composes.includes('presence'));
  assert.equal(contract.footer.label, 'messages.footer');
  assert.ok(contract.messages.includes('footer'));
});

/**
 * The page is the only element that knows where its fixed chrome ends, so it
 * writes the offsets its children stick under — and bridges them to table's
 * own token, which is the one precedent of a family writing another's token.
 */
test('publishes the fixed geometry as runtime properties and bridges table', () => {
  assert.deepEqual(Object.keys(contract.runtime), [
    '--slotted-page-sticky-top',
    '--slotted-page-sticky-bottom',
    '--slotted-page-scrollport-block-size',
  ]);
  assert.equal(contract.runtime['--slotted-page-sticky-top'].writer, 'page-header');
  assert.equal(contract.runtime['--slotted-page-sticky-bottom'].writer, 'page');
  assert.equal(contract.runtime['--slotted-page-scrollport-block-size'].writer, 'page');
  assert.deepEqual(contract.bridge, {
    '--slotted-table-sticky-offset': '--slotted-page-sticky-top',
    '--slotted-table-sticky-offset-end': '--slotted-page-sticky-bottom',
  });
});

/** The outline is typography's; the page only steps it. */
test('steps the heading level for its body through typography', () => {
  assert.equal(contract.heading.provider, 'typography');
  assert.equal(contract.heading.body, '+1');
});

test('declares loading as a fact about the surface and no other state', () => {
  assert.deepEqual(member.states, ['default', 'loading']);
  assert.deepEqual(contract.stateAttributes, { loading: 'data-loading' });
  assert.equal(contract.stateModel, undefined);
  assert.match(contract.loading, /aria-busy/);
});

test('lets an application set its defaults once', () => {
  assert.deepEqual(contract.provides.pageDefaults, [
    'width',
    'inset',
    'scroll',
    'ground',
    'landmark',
  ]);
  for (const axis of ['width', 'inset', 'scroll', 'ground', 'landmark']) {
    assert.deepEqual(contract.resolution[axis].slice(0, 2), ['prop', 'defaults']);
  }
});

test('declines with a reason, never silently', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines without a reason`);
  }
  assert.ok('breakpointEvent' in contract.declined);
});

test('lists every scenario the reference pages have to show', () => {
  assert.deepEqual(contract.scenarios.page, [
    'playground',
    'width',
    'scroll',
    'fill',
    'ground',
    'footer',
    'loading',
    'composition',
    'defaults',
    'accessibility',
  ]);
});
