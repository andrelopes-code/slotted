import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const breadcrumb = contract.members.breadcrumb;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the trail is one family', () => {
  assert.equal(contract.family, 'breadcrumb');
  assert.equal(contract.ui, 'breadcrumb');
  assert.deepEqual(Object.keys(contract.members), ['breadcrumb']);
});

/**
 * The APG pattern is a navigation landmark holding an ordered list. Both come
 * from the platform: `nav` is the landmark, and `ol` is what carries the
 * hierarchy and the set size without a single ARIA attribute.
 */
test('renders the landmark the pattern asks for', () => {
  assert.equal(breadcrumb.nativeElement, 'nav');
  assert.equal(contract.rootRole, 'navigation');
});

test('names the eight parts a trail is made of', () => {
  assert.deepEqual(breadcrumb.parts, [
    'root',
    'list',
    'item',
    'link',
    'page',
    'trigger',
    'separator',
    'ellipsis',
  ]);
});

/**
 * A crumb that switches between siblings — the organization, the project, the
 * environment — is a `button` that opens a `menu`. It is its own part because a
 * `link` is an `a`, and an `a` without `href` cannot take focus. The menu is the
 * consumer's composition; the trail owns how the crumb looks and that the
 * current one still says it is the page.
 */
test('lets a crumb open a menu of its siblings without losing aria-current', () => {
  assert.equal(contract.trigger.element, 'button');
  assert.equal(contract.trigger.composes, 'menu');
  assert.equal(contract.trigger.current, 'aria-current');
  assert.equal(contract.trigger.glyph, 'chevron-down');
  assert.equal(contract.trigger.keyboard, 'menu');
  assert.ok(breadcrumb.states.includes('open'));
});

/**
 * `aria-current="page"` is the ARIA specification's own value for a link inside
 * a set of pages, so the family writes the platform attribute and mirrors it
 * into no `data-current` of its own. The current page is a `page` part rather
 * than a link, because a link to the page the reader is on goes nowhere.
 */
test('marks the current page with the platform attribute and not with a link', () => {
  assert.equal(contract.currentValue, 'page');
  assert.equal(contract.currentSource, 'aria-current');
  assert.ok(breadcrumb.parts.includes('page'));
  assert.ok(!breadcrumb.states.includes('current'));
  assert.ok(!('current' in contract.stateAttributes));
});

/**
 * The APG example draws the separator in CSS so it never reaches the
 * accessibility tree, and `docs/token-foundation.md` forbids drawing an icon
 * from a character. A rotated rule is neither: it is geometry the stylesheet
 * owns, and the element exists so a consumer can put their own mark in it.
 */
test('draws the separator as geometry rather than as a character or a glyph', () => {
  assert.equal(contract.separator, 'geometry');
  assert.ok(breadcrumb.parts.includes('separator'));
  assert.ok(
    '--slotted-breadcrumb-separator-skew' in contract.literals,
    'the angle is a shape, and no scale in the foundation holds angles',
  );
});

test('collapses a long trail behind one control that says what it hides', () => {
  assert.equal(breadcrumb.defaults.maxItems, 8);
  assert.equal(breadcrumb.defaults.itemsBeforeCollapse, 1);
  assert.equal(breadcrumb.defaults.itemsAfterCollapse, 2);
  assert.ok(breadcrumb.parts.includes('ellipsis'));
  assert.equal(contract.collapse.control, 'ellipsis');
  assert.equal(contract.collapse.reveals, 'in place');
});

/**
 * The collapse is a value a consumer can own, so it carries a model like every
 * other mutable capability. An application that persists the reader's choice
 * holds `expanded`; one that does not passes `defaultExpanded`.
 */
test('gives the collapse a controlled and uncontrolled pair', () => {
  assert.ok(breadcrumb.capabilities.includes('open'));
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'expanded',
    uncontrolled: 'defaultExpanded',
    request: 'onExpandedChange',
    reasons: ['pointer', 'keyboard'],
  });
  assert.equal(breadcrumb.defaults.defaultExpanded, false);
  assert.deepEqual(contract.stateAttributes, { expanded: 'data-expanded', open: 'data-open' });
});

/**
 * The ellipsis stops existing the moment it is pressed, so focus has to be
 * given somewhere. Leaving it on a removed element loses it to the body.
 */
/**
 * A trail that does not fit its width folds its middle crumbs into the same
 * ellipsis the count collapses into. What folded is read from the layout, so it
 * is not a value a consumer owns; `wrap` keeps the older behavior.
 */
test('folds the crumbs that do not fit into the ellipsis', () => {
  assert.ok(breadcrumb.capabilities.includes('overflow'));
  assert.deepEqual(contract.axes, { overflow: ['collapse', 'wrap'] });
  assert.deepEqual(contract.resolution, { overflow: ['prop', 'defaults', 'collapse'] });
  assert.equal(breadcrumb.defaults.overflow, 'collapse');
  assert.ok(contract.provides.breadcrumbDefaults.includes('overflow'));
  assert.match(contract.collapse.measurement, /@slotted\/core\/overflow/);
  assert.match(contract.collapse.order, /nearest the root/);
  assert.match(contract.collapse.expanded, /does not fold/);
  assert.match(contract.collapse.reports, /data-collapsed/);
  assert.ok(!('overflow' in contract.stateModel));
});

test('says where focus lands once the trail expands', () => {
  assert.equal(contract.collapse.focusAfterExpand, 'the first revealed link');

  const expand = contract.keyboard.filter((row) => row.effect.includes('expands'));
  assert.equal(expand.length, 2, 'Enter and Space both activate a button');
  for (const row of expand) assert.match(row.focus, /first revealed link/);
});

test('takes every other key from the platform', () => {
  const platform = contract.keyboard.filter((row) => row.source === 'platform');
  assert.deepEqual(
    platform.map((row) => row.key),
    ['Tab', 'Enter', 'Space'],
  );
});

test('emits only reasons the shared vocabulary holds', () => {
  for (const reason of contract.stateModel.open.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason));
  }
});

/** Every decline names the family that owns the capability instead. */
test('names an owner for everything it declines', () => {
  for (const [capability, decline] of Object.entries(contract.declined)) {
    assert.ok(decline.deferTo, `${capability} declines and names no owner`);
    assert.ok(decline.reason.length > 40, `${capability} declines without a reason`);
  }
  assert.deepEqual(Object.keys(contract.declined), [
    'skeleton',
    'size',
    'menu',
    'collapsedState',
    'disabled',
  ]);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['breadcrumb']);
  assert.deepEqual(contract.scenarios.breadcrumb, [
    'playground',
    'collapse',
    'separator',
    'current',
    'context',
    'content',
    'composition',
    'switcher',
    'overflow',
    'keyboard',
  ]);
});
