import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const appShell = JSON.parse(
  await readFile(new URL('../app-shell/contract.json', import.meta.url), 'utf8'),
);
const sideNavigation = JSON.parse(
  await readFile(new URL('../side-navigation/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.topNavigation;
const keys = contract.keyboard.map((entry) => entry.key);

/** The four fields the schema holds; a model's `reason` and `attributeOn` are documentation. */
function model({ controlled, uncontrolled, request, reasons }) {
  return { controlled, uncontrolled, request, reasons };
}

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'top-navigation');
  assert.equal(contract.ui, 'top-navigation');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The APG's own caution is transcribed rather than recalled: the menubar
 * navigation example says `menubar` demands functionality a site's navigation
 * does not need and points at the disclosure pattern, which is also what the
 * scope says — the bar is not a toolbar with one tab stop per region.
 */
test('cites the disclosure navigation example and refuses menubar', () => {
  assert.equal(
    contract.pattern,
    'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
  );
  assert.equal(contract.landmarkPattern, appShell.pattern);
  assert.equal(contract.roles.root, 'banner | none');
  assert.equal(contract.roles.nav, 'navigation');
  assert.equal(contract.roles.list, 'list');
  assert.equal(contract.roles.item, 'listitem');
  assert.equal(contract.roles.link, 'link');
  assert.equal(contract.roles.trigger, 'button');
  assert.equal(contract.roles.more, 'button');
  assert.equal(contract.element.root, 'header | div');
  assert.match(contract.patternStatus, /menubar/);
  assert.equal(contract.rovingTabindex, false);
  assert.ok('menubar' in contract.declined);
});

/**
 * The disclosure example's table without its optional arrow keys. `Space` on a
 * link is the one departure, and it is the platform's: the same row
 * `side-navigation` and `list-item` refused to script.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(
      ['platform', 'pattern', 'departure'].includes(entry.source),
      `${entry.key} names no source`,
    );
  }
  assert.equal(contract.keyboard.find((entry) => entry.key === 'Space').source, 'departure');
  assert.match(contract.keyboardReason, /optional/);
});

/**
 * Three values a consumer can own: the panel, the search and the current
 * destination. `open` is a named set, the shape `app-shell` put in the schema
 * for a family with two regions that open.
 */
test('declares a state model for each of the three values a consumer can own', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['open', 'current']);
  assert.deepEqual(Object.keys(contract.stateModel.open), ['more', 'search']);
  assert.deepEqual(model(contract.stateModel.open.more), {
    controlled: 'moreOpen',
    uncontrolled: 'defaultMoreOpen',
    request: 'onMoreOpenChange',
    reasons: ['pointer', 'keyboard', 'select', 'escape', 'outsidePress', 'resize', 'programmatic'],
  });
  assert.deepEqual(model(contract.stateModel.open.search), {
    controlled: 'searchOpen',
    uncontrolled: 'defaultSearchOpen',
    request: 'onSearchOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'blur', 'resize', 'programmatic'],
  });
  assert.deepEqual(model(contract.stateModel.current), {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  for (const capability of member.capabilities) {
    if (MUTABLE_CAPABILITIES.includes(capability)) {
      assert.ok(capability in contract.stateModel, `${capability} holds state and has no model`);
    }
  }
});

/**
 * Which items fold is read from the width and never owned by the consumer:
 * `overflow` is the schema's deliberately immutable capability, and what the
 * consumer gets is the fact in the DOM and a callback when it changes.
 */
test('reports the folded set as a fact rather than a value', () => {
  assert.ok(member.capabilities.includes('overflow'));
  assert.ok(!MUTABLE_CAPABILITIES.includes('overflow'));
  assert.equal(contract.overflow.attribute, 'data-collapsed');
  assert.equal(contract.overflow.on, 'item');
  assert.match(contract.overflow.callback, /^onCollapseChange\(/);
  assert.match(contract.overflow.callback, /resize/);
});

/**
 * The three steps are literal because a container condition cannot read a
 * custom property, and the script that writes `data-collapsed` reads the same
 * three numbers. Each step is a priority, and the default priority is the
 * middle one, so a consumer who writes nothing gets a bar that folds at the
 * width `app-shell` goes to overlay at.
 */
test('folds by three literal steps that name the three priorities', () => {
  assert.deepEqual(Object.keys(contract.collapseAt), ['high', 'medium', 'low']);
  assert.deepEqual(contract.priority.values, ['high', 'medium', 'low']);
  assert.equal(contract.priority.default, 'medium');
  assert.ok(contract.collapseAt.low > contract.collapseAt.medium);
  assert.ok(contract.collapseAt.medium > contract.collapseAt.high);
  assert.equal(contract.collapseAt.medium, appShell.overlayAt);
  assert.deepEqual(contract.axes.priority, contract.priority.values);
});

/**
 * The panel holds the consumer's own elements, and it stands inside the root
 * so the tab sequence reaches it — the cost `side-navigation`'s flyout paid
 * for standing in the portal container is written on the other side here.
 */
test('presents the folded items in a disclosure panel inside the root, as the same DOM', () => {
  assert.equal(contract.more.inRoot, true);
  assert.match(contract.more.inRootReason, /side-navigation/);
  assert.match(contract.collapse.sameDom, /createPortal/);
  assert.match(contract.collapse.sameDom, /moves/);
  assert.ok(contract.collapse.sameDomCost.length > 0, 'the cost of moving the DOM is unwritten');
  assert.ok(member.parts.includes('more'));
  assert.ok(member.parts.includes('panel'));
  assert.ok(member.parts.includes('panel-list'));
  assert.ok(!contract.composes.includes('portal'), 'the panel is not portalled');
  assert.ok(!contract.composes.includes('positioner'), 'the panel is placed by the stylesheet');
  assert.ok(contract.composes.includes('presence'));
  assert.ok(contract.composes.includes('dismissable-layer'));
});

/**
 * The bar's landmark and its frame both come from the shell when it is there:
 * a header inside the shell's banner would be a second banner, and a ground
 * inside a painted region would be a second ground.
 */
test('resolves landmark and frame through app-shell before the defaults', () => {
  assert.deepEqual(contract.landmarks.resolution, ['prop', 'app-shell', 'defaults', true]);
  assert.deepEqual(contract.resolution.landmark, ['prop', 'app-shell', 'defaults', true]);
  assert.deepEqual(contract.resolution.frame, ['prop', 'app-shell', 'defaults', true]);
  assert.equal(contract.landmarks.banner, appShell.landmarks.banner);
  assert.equal(contract.landmarks.navigation, appShell.landmarks.navigation);
  assert.equal(contract.frame.attribute, 'data-frame');
});

/**
 * The bar reads what the shell publishes for a row, so its brand stands over
 * the column's marks and its panel's rows read as the column's rows. Every
 * name it reads is one `side-navigation` reads, because the two are one
 * frame.
 */
test('reads only row properties app-shell publishes', () => {
  for (const property of contract.reads) {
    assert.ok(
      sideNavigation.reads.includes(property),
      `${property} is not one the shell publishes`,
    );
  }
});

test('says current the way side-navigation says it', () => {
  assert.equal(contract.current.attribute, 'data-current');
  assert.equal(contract.current.aria, 'aria-current');
  assert.equal(contract.current.value, 'page');
  assert.deepEqual(contract.current.precedence, sideNavigation.current.precedence);
  assert.match(contract.current.painted, /accent-surface/);
  assert.match(contract.more.current, /data-current/);
});

/**
 * The parts the family draws a mark on each name the glyph token they draw,
 * and the one glyph the scale did not hold is justified beside its name.
 */
test('names a glyph for every mark it draws', () => {
  assert.match(contract.anatomy.more, /the ellipsis Glyph element/);
  assert.match(contract.anatomy['search-toggle'], /the search Glyph element/);
  assert.match(contract.anatomy['search-close'], /the x Glyph element/);
  assert.match(contract.anatomy.help, /the circle-question Glyph element/);
  assert.match(contract.anatomy.notifications, /the bell Glyph element/);
  assert.match(contract.indicator.closed, /^chevron-down:/);
  assert.ok('bell' in contract.glyphs);
});

test('declares a message for every control that has no visible text', () => {
  assert.deepEqual(contract.messages, [
    'account',
    'closeSearch',
    'help',
    'more',
    'moreCount',
    'navigation',
    'notifications',
    'search',
    'skip',
  ]);
});

/**
 * Every declined capability names the family that owns it, or the lines the
 * consumer writes instead; a bare "not needed" is not a reason the inventory
 * accepts.
 */
test('declines nothing without a reason', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 40, `${name} is declined without a reason`);
  }
  assert.equal(contract.declined.navToggle.deferTo, 'app-shell');
  assert.equal(contract.declined.title.deferTo, 'page-header');
});

test('declares the defaults provider over the axes it can set once', () => {
  assert.deepEqual(contract.provides.topNavigationDefaults, ['size', 'landmark', 'frame']);
  assert.deepEqual(member.defaults, { size: 'md', landmark: true, frame: true });
});

test('declares the shell as a scenario, because the bar is built for it', () => {
  assert.ok(contract.scenarios.topNavigation.includes('shell'));
  assert.ok(contract.scenarios.topNavigation.includes('standalone'));
  assert.ok(contract.scenarios.topNavigation.includes('priority'));
  assert.ok(contract.scenarios.topNavigation.includes('search'));
});

/**
 * A section of the bar is a section of a navigation menu: the destinations are
 * links, and the disclosure pattern the scope names is the one that family
 * implements. The nav part carries the menu's root.
 */
test('opens a section as a navigation-menu panel, never a menu', () => {
  assert.ok(contract.composes.includes('navigation-menu'));
  assert.equal(contract.sections.family, 'navigation-menu');
  assert.match(contract.anatomy.trigger, /navigation-menu trigger/);
  assert.match(contract.anatomy.nav, /data-ui=navigation-menu/);
  assert.doesNotMatch(contract.anatomy.trigger, /wraps in menu/);
});
