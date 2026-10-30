import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.pageHeader;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'page-header');
  assert.equal(contract.ui, 'page-header');
  assert.equal(contract.schemaVersion, 5);
  assert.equal(member.nativeElement, 'header');
});

test('cites the three patterns it answers rather than claiming to have checked them', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/');
  assert.equal(contract.togglePattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/');
  assert.equal(contract.pinPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/button/');
});

/**
 * The Fiori anatomy, with the two areas the scope paragraph names and the
 * controls that straddle their edge.
 */
test('declares the whole anatomy the field ships, as parts', () => {
  assert.deepEqual(member.parts, [
    'root',
    'title-area',
    'nav',
    'back',
    'breadcrumbs',
    'title-row',
    'visual',
    'title',
    'heading',
    'marks',
    'subheading',
    'actions',
    'navigation',
    'header-area',
    'figure',
    'content',
    'description',
    'controls',
    'toggle',
    'pin',
    'tabs',
    'progress',
  ]);
  assert.match(contract.anatomy.controls, /zero-height row/);
});

/**
 * Two facts the stylesheet needs beside the state: whether the scroll has
 * passed the area, measured, and whether the area was shown whole in place
 * after it had. The second is a word the vocabulary already held.
 */
test('writes the measured fact and the revealed state the sticky offset depends on', () => {
  assert.equal(contract.snapDetection.fact, 'data-scrolled');
  assert.equal(contract.revealed.state, 'revealed');
  assert.equal(contract.revealed.attribute, 'data-revealed');
  assert.ok(member.states.includes('revealed'));
  assert.equal(contract.stateAttributes.revealed, 'data-revealed');
  assert.match(contract.revealed.ends, /scroll/);
  assert.equal(contract.sticky.revealedRoot, '0');
  assert.match(contract.collapsedByControl, /data-scrolled is absent/);
  assert.match(contract.toggleWhilePinned, /programmatic/);
});

/**
 * The header area is a value the reader moves — by scrolling past it, by
 * pressing the toggle — and a consumer can own it. Scroll is a reason of its
 * own: UI5 fires one event for a scroll and a click, and a product saving the
 * reader's preference then has to guess which one it saw.
 */
test('declares a state model for the header area, with scroll as a reason', () => {
  assert.ok(member.capabilities.includes('open'));
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.ok(CHANGE_REASONS.includes('scroll'), 'the shared vocabulary lacks scroll');
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'expanded',
    uncontrolled: 'defaultExpanded',
    request: 'onExpandedChange',
    reasons: ['pointer', 'keyboard', 'scroll', 'programmatic'],
  });
  assert.equal(member.defaults.expanded, true);
});

/** The pin is a toggle button, which is the `pressed` state the vocabulary has. */
test('declares a state model for the pin, as a pressed toggle button', () => {
  assert.ok(member.capabilities.includes('pressed'));
  assert.deepEqual(contract.stateModel.pressed, {
    controlled: 'pinned',
    uncontrolled: 'defaultPinned',
    request: 'onPinnedChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.equal(contract.roles.pin, 'button');
  assert.match(contract.wiring['aria-pressed'], /pin/);
  assert.match(contract.pin.expands, /programmatic/);
});

test('writes the disclosure wiring on the toggle and names the region it controls', () => {
  assert.equal(contract.roles.toggle, 'button');
  assert.equal(contract.roles['header-area'], 'region');
  assert.match(contract.wiring['aria-expanded'], /toggle/);
  assert.match(contract.wiring['aria-controls'], /header-area/);
  assert.match(contract.wiring['aria-label'], /messages/);
});

/**
 * The whole keyboard is the platform's: both controls are buttons, and the
 * title area is deliberately not one, because it holds links and buttons of
 * its own and a button may not contain a control.
 */
test('answers every key with a native button, and says where focus lands', () => {
  assert.deepEqual(keys, ['Tab', 'Shift+Tab', 'Enter', 'Space']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.equal(entry.source, 'platform');
  }
  assert.match(contract.declined.titleClick.reason, /nested/);
});

/** The mechanics of §2 of the design, stated where the stylesheet can be held to it. */
test('keeps its root box and sticks with a negative offset the size of the header area', () => {
  assert.equal(contract.sticky.root, 'calc(-1 * var(--slotted-page-header-collapse, 0px))');
  assert.equal(contract.sticky['title-area'], '0');
  assert.equal(contract.sticky.pinnedRoot, '0');
  assert.match(contract.declined.displayContents.reason, /box/);
  assert.equal(contract.snapDetection.observed, 'header-area');
  assert.match(contract.snapDetection.rootMargin, /moves down by what stands above/);
  /* Too much of the screen to hold: a fact the binding writes and the sheet reads. */
  assert.equal(contract.tall.fact, 'data-tall');
  assert.match(contract.tall.meaning, /600 pixels/);
  /* A filled page does not scroll: a scroller inside its body snaps the area. */
  assert.match(contract.snapDetection.contained, /data-fill/);
  assert.match(contract.snapDetection.contained, /16 pixels/);
  /* Only the principal scroller: a textarea or a short scroll area beside the list does not. */
  assert.match(contract.snapDetection.contained, /principal/);
  assert.match(contract.snapDetection.contained, /textarea/);
  assert.match(contract.snapDetection.contained, /half/);
});

/**
 * Compact, nothing sticks: on a phone a record's header and tabs held 40 per
 * cent of the screen for the whole scroll with nothing to condense.
 */
test('is in the flow below the compact size class', () => {
  assert.equal(contract.compact.fact, 'data-compact');
  assert.equal(contract.compact.width, '600px');
  assert.match(contract.compact.meaning, /not sticky/);
  assert.match(contract.compact.meaning, /--slotted-page-sticky-top/);
  assert.match(contract.compact.reason, /container query cannot/);
  assert.match(contract.runtime['--slotted-page-sticky-top'].value, /0px below the compact/);
  assert.match(contract.responsive.below, /scrolls away/);
});

/** Compact: one line of subheading, and a folding toolbar stays on the title row. */
test('states what the compact size class changes', () => {
  assert.equal(contract.responsive.container, 'page-header');
  assert.equal(contract.responsive.narrow, '600px');
  assert.match(contract.responsive.below, /subheading is one line/);
  assert.match(contract.responsive.below, /overflow=menu/);
});

/**
 * The toolbar observes its own width. A slot sized by its content was the
 * trigger alone after a fold and never grew back, so the actions stayed
 * folded after the window widened again.
 */
test('gives a folding toolbar the room the title leaves, not its own content', () => {
  assert.match(contract.anatomy.actions, /never its own content/);
  assert.match(contract.anatomy.actions, /in both directions/);
});

test('publishes the fixed geometry as runtime properties', () => {
  assert.deepEqual(Object.keys(contract.runtime), [
    '--slotted-page-header-collapse',
    '--slotted-page-sticky-top',
  ]);
  assert.match(contract.runtime['--slotted-page-sticky-top'].target, /scroll/);
});

/** One attribute where Fiori has seven slots. */
test('shows a child in one state only through data-when', () => {
  assert.deepEqual(contract.when.values, ['expanded', 'snapped']);
  assert.equal(contract.when.scope, 'title-area');
  assert.match(contract.when.reason, /snappedHeading/);
});

test('says what collapses and how it moves', () => {
  assert.deepEqual(contract.axes.collapse, ['scroll', 'manual']);
  assert.equal(member.defaults.collapse, 'scroll');
  assert.equal(contract.motion.property, 'grid-template-rows');
  assert.equal(contract.motion.measured, false);
  assert.equal(contract.motion.onScroll, 'none');
  assert.match(contract.motion.anchor, /overflow-anchor: none/);
  assert.equal(contract.tallHeader.fraction, 0.6);
});

/** Collapsed by the control, the area leaves the tab sequence; by scroll, it does not. */
test('takes the collapsed area out of the tab sequence only when the control collapsed it', () => {
  assert.equal(contract.inert.manual, true);
  assert.equal(contract.inert.scroll, false);
  assert.match(contract.inert.reason, /focus/);
});

test('draws its marks as Glyph elements and mirrors the one that points', () => {
  assert.deepEqual(contract.glyphs, {
    toggle: 'chevron-down',
    pin: 'pin',
    unpin: 'pin-off',
    back: 'arrow-left',
  });
  assert.match(contract.mirrored, /back/);
});

test('declares the states it paints and the attributes they take', () => {
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'expanded',
    'revealed',
    'pressed',
    'loading',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    expanded: 'data-expanded',
    revealed: 'data-revealed',
    pressed: 'data-pressed',
    loading: 'data-loading',
  });
  assert.match(contract.loading.parts, /heading/);
  assert.match(contract.loading.reason, /stable/);
});

test('sizes the title on its own scale and takes the level from the outline', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.level, ['1', '2', '3']);
  assert.equal(member.defaults.level, '1');
  assert.equal(contract.heading.provider, 'typography');
});

test('composes rather than re-implementing', () => {
  assert.deepEqual(contract.composes, [
    'container',
    'breadcrumb',
    'toolbar',
    'tabs',
    'typography',
    'progress-indicator',
  ]);
  assert.equal(contract.declined.actionOverflow.deferTo, 'toolbar');
  assert.equal(contract.declined.breadcrumbOverflow.deferTo, 'breadcrumb');
});

/**
 * The ground and the frame: a strip across the top, no ground of its own
 * until content passes under it, or a box of its own.
 */
test('declares three variants, band by default, and the stuck fact they read', () => {
  assert.deepEqual(contract.axes.variant, ['band', 'plain', 'floating']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'band']);
  assert.equal(member.defaults.variant, 'band');
  assert.ok(member.capabilities.includes('appearance'));
  assert.equal(contract.stuck.fact, 'data-stuck');
});

/** Stuck, the chrome is the theme's material, in any variant; off unless asked. */
test('declares material, off by default, which reads the theme tokens while stuck', () => {
  assert.deepEqual(contract.axes.material, [false, true]);
  assert.deepEqual(contract.resolution.material, ['prop', 'defaults', false]);
  assert.equal(member.defaults.material, false);
  assert.match(contract.material.true, /--slotted-surface-material/);
  assert.match(contract.material.true, /--slotted-material-backdrop/);
});

test('lets an application set its defaults once', () => {
  assert.deepEqual(contract.provides.pageHeaderDefaults, [
    'size',
    'level',
    'collapse',
    'variant',
    'material',
  ]);
  assert.deepEqual(contract.messages, [
    'collapse',
    'expand',
    'headerArea',
    'pin',
    'progress',
    'unpin',
  ]);
});

test('declines with a reason, never silently', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines without a reason`);
  }
});

test('lists every scenario the reference pages have to show', () => {
  assert.deepEqual(contract.scenarios.pageHeader, [
    'playground',
    'anatomy',
    'collapse',
    'pin',
    'when',
    'size',
    'navigation',
    'actions',
    'tabs',
    'loading',
    'progress',
    'content',
    'narrow',
    'composition',
    'defaults',
    'accessibility',
  ]);
});

/**
 * A refresh of what is already on screen is not a loading state: the content
 * stays and the region waits. The bar on the header's hairline is the one
 * thing drawn for it, and it gives way to the title's skeleton and to any
 * region around it that waits as a whole.
 */
test('draws a refresh on the hairline of the header, and only one wait at a time', () => {
  assert.equal(member.parts.at(-1), 'progress');
  assert.match(contract.anatomy.progress, /edge-end/);
  assert.match(contract.anatomy.progress, /hairline/);
  assert.match(contract.progress.wait, /already on screen/);
  assert.match(contract.progress.oneWait, /\[aria-busy='true'\]/);
  assert.match(contract.progress.oneWait, /loading/);
  assert.match(contract.progress.timing, /200/);
  assert.match(contract.progress.timing, /400/);
});
