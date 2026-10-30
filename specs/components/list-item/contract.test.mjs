import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  MUTABLE_CAPABILITIES,
  STATE_PRECEDENCE,
  TONES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'list-item');
  assert.equal(contract.ui, 'list-item');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A static row, a row that is one command and a row that is one destination are
 * three components in React and three elements under one directive in Angular.
 * They are not three members: the row is the same `li` with the same parts, and
 * a member per element would put `data-ui` on three things that are one.
 */
test('is one row whose regions are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['listItem']);
  assert.equal(contract.members.listItem.nativeElement, 'li');
  assert.deepEqual(contract.members.listItem.parts, [
    'root',
    'marker',
    'content',
    'start',
    'body',
    'label',
    'description',
    'end',
    'actions',
  ]);
});

/**
 * ARIA 1.2 deprecates `aria-disabled` on `listitem`, and no surveyed
 * implementation says so — MUI writes it on the row. The state is painted from
 * `data-disabled` and the attribute that means it goes on the element that can
 * refuse an interaction.
 */
test('keeps the deprecated attributes off the row', () => {
  assert.ok(contract.roleFacts.deprecated.includes('aria-disabled'));
  assert.match(contract.roleFacts.source, /wai-aria-1\.2/);
  assert.match(contract.disabled.row, /`data-disabled` only/);
  assert.match(contract.disabled.row, /never `aria-disabled`/);
  assert.match(contract.disabled.button, /native `disabled`/);
  assert.match(contract.disabled.link, /aria-disabled/);
  assert.match(contract.disabled.link, /stays focusable/);
  assert.match(contract.disabled.link, /activation refused/);
});

/**
 * Interactive content may not nest inside `a` or `button`. Every surveyed
 * implementation lets a consumer do it anyway; making the sibling arrangement
 * the only one the parts express is what stops the mistake being possible.
 */
test('places independent targets beside the actionable box, never inside it', () => {
  assert.equal(contract.actionsPlacement.part, 'actions');
  assert.equal(contract.actionsPlacement.sibling, 'content');
  const parts = contract.members.listItem.parts;
  assert.ok(parts.indexOf('actions') > parts.indexOf('content'));
});

/** Three elements, one row. The default claims nothing the content does not. */
test('renders the box as the element the page means', () => {
  assert.equal(contract.contentElement.static, 'div');
  assert.equal(contract.contentElement.action, 'button');
  assert.equal(contract.contentElement.navigation, 'a');
  assert.equal(contract.contentElement.default, 'div');
});

/**
 * The title gets a box of its own for three reasons at once, and the third is
 * the one nothing surveyed handles: a single unbroken token — a URL, a hash —
 * pushes the trailing metadata out of the row unless the label may break it.
 */
test('gives the title a box that can clip, isolate and break it', () => {
  assert.equal(contract.labelPart.part, 'label');
  assert.match(contract.labelPart.reason, /text-overflow/);
  assert.match(contract.labelPart.reason, /unicode-bidi/);
  assert.match(contract.labelPart.reason, /overflow-wrap/);
});

/**
 * `aria-selected` is not valid on `listitem`, so the row paints a selection the
 * page owns and the control in `start` announces it — `card`'s contract for the
 * same problem. `aria-current` is inherited by the role and is not deprecated,
 * so it is the one state of this shape the row may announce itself.
 */
test('paints a selection it does not announce, and announces the one state it may', () => {
  assert.equal(contract.selected.attribute, 'data-selected');
  assert.match(contract.selected.announcedBy, /start/);
  assert.equal(contract.current.aria, 'aria-current');
  assert.deepEqual(contract.current.values, ['page', 'step', 'location', 'date', 'time', 'true']);
  assert.ok(contract.roleFacts.inherited.includes('aria-current'));
});

/**
 * ARIA 1.2 is explicit that both are unnecessary while every row is in the DOM
 * and necessary the moment only part of the set is. Writing them always makes
 * every list disagree with itself as soon as a row is filtered out.
 */
test('states a position in the set only when the page knows one', () => {
  assert.deepEqual(contract.setPosition.attributes, ['aria-posinset', 'aria-setsize']);
  assert.equal(contract.setPosition.written, 'only when the page states them');
  assert.match(contract.setPosition.source, /aria-setsize/);
});

/**
 * A loading row keeps its width, refuses the duplicate action and keeps its
 * accessible name, which is what `docs/component-features.md` section 2.5 asks
 * of every loading state.
 */
test('refuses the duplicate action without losing the row', () => {
  assert.equal(contract.loading.attribute, 'aria-busy');
  assert.deepEqual(contract.loading.preserves, ["the row's width", 'the accessible name']);
});

/** The row answers its own inline size; the set has no layout that depends on it. */
test('reflows against its own width, at a literal the CSS syntax forces', () => {
  assert.equal(contract.container.type, 'inline-size');
  assert.equal(contract.container.name, 'slotted-list-item');
  assert.equal(contract.container.breakpoint, '22rem');
});

/** The five the theme carries. Shipping one of a scale and hiding four is the invention. */
test('carries the whole tone scale the theme holds, and starts at its neutral', () => {
  assert.deepEqual([...contract.axes.tone].sort(), [...TONES].sort());
  assert.equal(contract.axes.tone[0], 'secondary');
  assert.equal(contract.members.listItem.defaults.tone, 'secondary');
});

test('scales in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(contract.members.listItem.defaults.size, 'md');
  assert.deepEqual(contract.axes.align, ['center', 'start']);
  assert.equal(contract.members.listItem.defaults.align, 'center');
});

/** Every state the row paints, and each one in the order a stylesheet has to hold. */
test('paints eight states, and declares an attribute for the four that are not pseudo', () => {
  assert.deepEqual(contract.members.listItem.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'selected',
    'current',
    'loading',
    'disabled',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    selected: 'data-selected',
    current: 'data-current',
    disabled: 'data-disabled',
    loading: 'data-loading',
  });

  const declared = contract.members.listItem.states;
  const ranked = STATE_PRECEDENCE.filter((state) => declared.includes(state));
  assert.equal(ranked[0], 'disabled', 'disabled is the strongest state the row holds');
  assert.ok(ranked.indexOf('loading') < ranked.indexOf('selected'));
  assert.ok(ranked.indexOf('selected') < ranked.indexOf('current'));
});

/**
 * The row can refuse an interaction, which is why it declares `disabled` where
 * `card` cannot: `content` is the control, and the family writes the attribute
 * on it. It still holds no value a consumer can own.
 */
test('declares what it can refuse, and no value it cannot hold', () => {
  /* `content` is not among them. In this library that word means the leading
     and trailing slots taken as props — which is what `tag` ships — and here
     they are parts a consumer composes, so claiming it would put two props on
     the reference page that do not exist. */
  assert.deepEqual(contract.members.listItem.capabilities, [
    'appearance',
    'size',
    'disabled',
    'loading',
    'wiring',
  ]);
  assert.ok(!contract.members.listItem.capabilities.includes('content'));
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.listItem.capabilities.includes(capability),
      `list-item claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

/** A row inherits from its set, and its own prop still wins. */
test('resolves every inherited value from the consumer first', () => {
  assert.equal(contract.groupFamily, 'list');
  assert.deepEqual(contract.resolution.size, ['prop', 'list', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.inset, ['prop', 'list', 'defaults', false]);
  for (const [axis, order] of Object.entries(contract.resolution)) {
    assert.equal(order[0], 'prop', `${axis} lets something outrank the consumer`);
  }
});

/** Each decline names the family that takes the capability or the lines that compose it. */
test('declines nothing without naming what answers it instead', () => {
  assert.match(contract.declined.onAction.reason, /state-and-events/);
  assert.match(contract.declined.inactiveText.reason, /<ListItem disabled>/);
  assert.match(contract.declined.lines.reason, /align/);
});

test('names one reference page, covering the three content elements', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['listItem']);
  assert.deepEqual(contract.scenarios.listItem, [
    'playground',
    'content-elements',
    'anatomy',
    'alignment',
    'tone',
    'states',
    'actions',
    'reflow',
    'content',
    'composition',
    'keyboard',
  ]);
});
