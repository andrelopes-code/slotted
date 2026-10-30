import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const appShell = JSON.parse(
  await readFile(new URL('../app-shell/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.sideNavigation;
const keys = contract.keyboard.map((entry) => entry.key);

/** The four fields the schema holds; a model's `reason` and `attributeOn` are documentation. */
function model({ controlled, uncontrolled, request, reasons }) {
  return { controlled, uncontrolled, request, reasons };
}

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'side-navigation');
  assert.equal(contract.ui, 'side-navigation');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The APG's own advice is transcribed rather than recalled: the treeview
 * navigation example warns that `tree` demands functionality a site's
 * navigation does not need, and points at the disclosure pattern instead. The
 * hybrid example is the one that admits a destination that is also a parent.
 */
test('cites the hybrid disclosure navigation example and refuses tree', () => {
  assert.equal(
    contract.pattern,
    'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/',
  );
  assert.equal(contract.roles.root, 'navigation');
  assert.equal(contract.roles.list, 'list');
  assert.equal(contract.roles.item, 'listitem');
  assert.equal(contract.roles.trigger, 'button');
  assert.equal(contract.roles.link, 'link | button');
  assert.equal(contract.element.link, 'a | button');
  assert.match(contract.patternStatus, /tree/);
});

/**
 * The pattern's whole table, optional keys included. `Space` on a link is the
 * one departure, and it is the platform's: a link scrolls on `Space`, and
 * scripting it to navigate is what `list-item` refused for the same row.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Tab',
    'Shift+Tab',
    'Enter',
    'Space',
    'Escape',
    'ArrowDown',
    'ArrowRight',
    'ArrowUp',
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
  assert.equal(contract.keyboard.find((entry) => entry.key === 'Space').source, 'departure');
  assert.equal(contract.rovingTabindex, false);
});

test('declares a state model for each of the three values a consumer can own', () => {
  for (const capability of ['open', 'current']) {
    assert.ok(member.capabilities.includes(capability));
    assert.ok(MUTABLE_CAPABILITIES.includes(capability));
  }
  assert.deepEqual(model(contract.stateModel.open.expanded), {
    controlled: 'expanded',
    uncontrolled: 'defaultExpanded',
    request: 'onExpandedChange',
    reasons: ['pointer', 'keyboard', 'select', 'escape', 'programmatic'],
  });
  assert.deepEqual(model(contract.stateModel.open.flyout), {
    controlled: 'flyout',
    uncontrolled: 'defaultFlyout',
    request: 'onFlyoutChange',
    reasons: [
      'pointer',
      'keyboard',
      'select',
      'escape',
      'outsidePress',
      'blur',
      'resize',
      'programmatic',
    ],
  });
  assert.deepEqual(model(contract.stateModel.current), {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
});

/**
 * The flyout is transient and the inline set is not: one branch shown beside
 * the rail at a time, closed by the focus leaving it and by the rail widening.
 * A flyout that wrote into `expanded` would open three groups at once the
 * moment a reader with three groups open collapsed the shell.
 */
test('keeps the flyout apart from the inline set', () => {
  assert.equal(contract.flyout.writesExpanded, false);
  assert.ok(contract.stateModel.open.flyout.reasons.includes('blur'));
  assert.ok(contract.stateModel.open.flyout.reasons.includes('resize'));
  assert.ok(!contract.stateModel.open.expanded.reasons.includes('outsidePress'));
});

/**
 * The parent of the current destination is marked only while the reader
 * cannot see the destination itself: a closed group, or the rail.
 */
test('marks the parent of the current destination only while it hides it', () => {
  assert.equal(contract.current.parentWhen, 'closed or compact');
  assert.equal(contract.current.aria, 'aria-current');
  assert.deepEqual(contract.current.precedence, ['link', 'value']);
});

test('reads the rail as a width, and declares the number the stylesheet uses', () => {
  assert.equal(contract.compactAt, 96);
  assert.equal(contract.container.name, 'slotted-side-navigation');
  assert.equal(contract.container.type, 'inline-size');
  assert.deepEqual(contract.axes.mode, ['auto', 'expanded', 'compact']);
  assert.deepEqual(contract.resolution.mode, ['prop', 'defaults', 'auto']);
});

/**
 * The shell's `nav` region is already the navigation landmark. A `nav` inside
 * it is a second one with no name, so the family renders a `div` there; a
 * consumer who states `landmark` still wins, which is what the resolution
 * order says.
 */
test('is a landmark on its own and a plain element inside the shell', () => {
  assert.deepEqual(contract.resolution.landmark, ['prop', 'app-shell', 'defaults', true]);
  assert.equal(contract.element.root, 'nav | div');
  assert.equal(appShell.landmarks.navigation, 'nav');
});

/**
 * The shell publishes six numbers so that every row in its frame stands on the
 * same left edge; this family is the first to read them.
 */
test('reads the row geometry app-shell publishes', () => {
  for (const property of Object.keys(appShell.published)) {
    if (property === 'reason') continue;
    assert.ok(
      contract.reads.includes(property),
      `${property} is published by app-shell and not read here`,
    );
  }
});

test('composes what it does not own', () => {
  assert.deepEqual(contract.composes, [
    'disclosure',
    'portal',
    'positioner',
    'presence',
    'dismissable-layer',
    'tooltip',
    'skeleton',
    'text',
  ]);
  assert.equal(contract.declined.drawer.deferTo, 'app-shell');
  assert.equal(contract.declined.header.deferTo, 'app-shell');
  assert.equal(contract.declined.horizontal.deferTo, 'top-navigation');
});

/**
 * A closed branch points along the line and an open one points down: the
 * chevron that points down while closed is `select`'s promise, not this one.
 */
test('folds a closed branch along the reading direction', () => {
  assert.match(
    contract.indicator.closed,
    /^the chevron-right Glyph element in a directional icon box/,
  );
  assert.match(contract.indicator.open, /quarter turn/);
  assert.match(contract.depth.deeper, /indent-step/);
});

/**
 * Truncation is a decision with five parts, each written: where the cut
 * falls, how the whole is reached, what gives way first, what never clips,
 * and what wraps instead. A label that is cut and not reachable is a word
 * lost, which `docs/build-briefing.md` forbids.
 */
test('loses no words: cuts at the end or the middle and reveals the whole', () => {
  assert.deepEqual(contract.axes.truncate, ['end', 'middle', 'none']);
  assert.deepEqual(contract.resolution.truncate, ['prop', 'defaults', 'end']);
  assert.match(contract.truncate.reveal, /data-clipped/);
  assert.match(contract.truncate.reveal, /tooltip/);
  assert.match(contract.truncate.middle, /core\/text/);
  assert.match(contract.truncate.priority, /only part that shrinks/);
  assert.match(contract.truncate.count, /never truncates/);
  assert.match(contract.truncate.sectionLabel, /wraps/);
  assert.match(contract.truncate.none, /anywhere/);
  assert.ok(contract.composes.includes('text'));
});

/** R1: a band on the start edge may not say `current`; the ground says it. */
test('says current with the ground, never with a bar', () => {
  assert.match(contract.declined.bar.reason, /state-rail/);
  assert.match(contract.current.painted, /accent-surface/);
  assert.ok(!('marker' in contract.axes));
});

test('lists every part the design names', () => {
  assert.deepEqual(member.parts, [
    'root',
    'section',
    'section-label',
    'list',
    'item',
    'link',
    'trigger',
    'icon',
    'label',
    'description',
    'end',
    'count',
    'indicator',
    'actions',
    'group',
    'divider',
    'skeleton',
    'flyout',
  ]);
});

test('declares each axis with the default the reference page prints', () => {
  assert.deepEqual(member.defaults, {
    size: 'md',
    mode: 'auto',
    multiple: true,
    autoExpand: true,
    guides: true,
    truncate: 'end',
    landmark: true,
    compactAt: 96,
  });
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(axis in member.defaults, `${axis} has no default`);
    assert.ok(contract.axes[axis].includes(member.defaults[axis]), `${axis} default is off-axis`);
  }
});
