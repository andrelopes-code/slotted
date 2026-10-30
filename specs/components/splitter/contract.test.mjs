import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const drawer = JSON.parse(
  await readFile(new URL('../drawer/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.splitter;
const keys = contract.keyboard.map((entry) => entry.key);
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'splitter');
  assert.equal(contract.ui, 'splitter');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it implements rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/');
});

/**
 * The family is the separator and holds no panels. Three parts, one of them the
 * root: a bar, two hairlines and the grip between them.
 *
 * The decision is recorded
 * section 1, against seven of seven surveyed implementations. This test is what
 * keeps a later pass from quietly growing a `panel` part and turning the family
 * into the layout engine it declined to be.
 */
test('is the separator, and declares no panel', () => {
  assert.deepEqual(member.parts, ['root', 'line', 'grip']);
  assert.equal(member.nativeElement, 'div');
});

/**
 * The two families draw one picture, so they use one vocabulary for it.
 *
 * `line` and `grip` are deliberately the same word in both: a hairline is a
 * hairline and a grip is a grip, and `drawer`'s separator was repainted from
 * this family precisely so that a consumer who has styled one has styled the
 * other. Sharing a name for one shape is what `identity.test.mjs` is for; it is
 * sharing a name for *two* shapes that the rule forbids.
 *
 * What is not shared is the target itself. `drawer` calls it `resizer` — one
 * gutter on a panel's edge — and this family's is its own root. Those are two
 * shapes, and they keep two names.
 */
test('shares the words for the picture it shares, and not the word for the target', () => {
  const drawerParts = new Set(Object.values(drawer.members).flatMap((entry) => entry.parts));

  for (const shared of ['line', 'grip']) {
    assert.ok(member.parts.includes(shared), `splitter does not draw a ${shared}`);
    assert.ok(drawerParts.has(shared), `drawer does not draw a ${shared}`);
  }

  assert.ok(!member.parts.includes('resizer'), "resizer is drawer's word for a different shape");
});

/**
 * The APG's whole table, key by key, with the focus destination for each.
 *
 * `Enter` is the one that needs saying: the pattern makes it collapse and
 * restore, and it was the argument for holding panels. A bar that owns `value`,
 * `min` and `max` answers it without knowing what a panel is.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Enter',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
});

test('collapses and restores on Enter, which is what the pattern asks of it', () => {
  const enter = keyboard('Enter');
  assert.match(enter.effect, /collaps/i);
  assert.match(enter.effect, /restor/i);
  assert.equal(enter.focus, 'stays on the separator');
});

/**
 * "If the splitter is horizontal, it does not listen for Left Arrow or Right
 * Arrow so those keys can provide their normal browser scrolling functions."
 * The cross axis belongs to the page, which is the rule `tabs` already states.
 */
test('leaves the cross axis to the page', () => {
  assert.equal(contract.crossAxisNavigates, false);
});

/**
 * F6 is optional in the pattern. It is a window-management convention belonging
 * to the application composing the regions, not to the separator — and a
 * departure is only recorded when it names its cost.
 */
test('records F6 as a departure with its cost rather than omitting it', () => {
  assert.ok(contract.declined.F6, 'F6 is not addressed');
  assert.ok(contract.declined.F6.reason.length > 0);
  assert.ok(contract.declined.F6.cost.length > 0);
});

test('declines the panel manager and names who owns it instead', () => {
  assert.equal(contract.declined.panels.deferTo, 'app-shell');
  assert.ok(contract.declined.panels.reason.length > 0);
  assert.ok(contract.declined.panels.cost.length > 0);
});

/**
 * Two mutable values, each with the pair and the request
 * `docs/state-and-events.md` requires. Collapse is its own state and not a
 * value of the extent: `react-resizable-panels` persists the geometry alone and
 * a restored panel comes back indistinguishable from a very small one.
 */
test('models both mutable values, and keeps collapse separate from the measure', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['extent', 'open']);
  assert.equal(contract.stateModel.extent.controlled, 'value');
  assert.equal(contract.stateModel.extent.uncontrolled, 'defaultValue');
  assert.equal(contract.stateModel.extent.request, 'onValueChange');
  assert.equal(contract.stateModel.open.controlled, 'collapsed');
  assert.equal(contract.stateModel.open.uncontrolled, 'defaultCollapsed');
  assert.equal(contract.stateModel.open.request, 'onCollapsedChange');
  for (const entry of Object.values(contract.stateModel)) {
    for (const reason of entry.reasons) assert.ok(CHANGE_REASONS.includes(reason));
  }
});

/**
 * The unit is the one `packages/core/src/extent/extent.ts` already fixes for
 * this pattern, and that file's line 17 names this family as its second
 * consumer. A splitter speaking pixels would use none of `extentAtPoint`,
 * `nearestSnap`, `stepExtent` or `extentBounds`, and would arrive at the same
 * arithmetic a second time.
 */
test('holds a fraction, and accepts limits in either unit', () => {
  assert.equal(contract.extent.unit, 'fraction');
  assert.equal(contract.extent.source, '@slotted/core/extent');
  assert.deepEqual(contract.extent.limitUnits, ['fraction', 'length']);
  assert.ok(contract.extent.clamped.length > 0);
});

/**
 * The differentiator, and the reason it is one: not one of the seven surveyed
 * implementations can state a pixel floor. Zag says so outright — "the splitter
 * only supports setting percentage values".
 */
test('states the limit unit no surveyed implementation offers', () => {
  assert.match(contract.extent.limitReason, /length|pixel/i);
});

test('names the element it sizes, and announces the same one', () => {
  assert.equal(contract.wiring['aria-controls'], contract.sizes.property);
  assert.equal(contract.sizes.input, 'for');
  assert.equal(contract.sizes.fallback, 'the previous element sibling');
});

/**
 * The accent is the color that means "the keyboard is here". SAP is the only
 * one of the seven that keeps hover and focus apart, and spending the accent on
 * hover is the defect this family was invoked to correct.
 */
test('reserves the accent for keyboard focus', () => {
  assert.equal(contract.paint.rest, 'border-subtle');
  assert.equal(contract.paint.hover, 'border-strong');
  assert.equal(contract.paint.dragging, 'border-strong');
  assert.equal(contract.paint['focus-visible'], 'focus-ring');
});

test('writes an attribute for every state that is not a pseudo-class', () => {
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    dragging: 'data-dragging',
    expanded: 'data-expanded',
  });
});

test('declares the scenarios both reference pages must carry', () => {
  assert.deepEqual(contract.scenarios.splitter, [
    'playground',
    'orientation',
    'value',
    'limits',
    'collapse',
    'snapPoints',
    'reset',
    'disabled',
    'keyboard',
    'twoBars',
    'persistence',
    'composition',
    'defaults',
    'accessibility',
  ]);
});
