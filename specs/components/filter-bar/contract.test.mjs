import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS, strongestState } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const filterBar = contract.members.filterBar;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because every part reads one bar', () => {
  assert.equal(contract.family, 'filter-bar');
  assert.equal(contract.ui, 'filter-bar');
  assert.deepEqual(Object.keys(contract.members), ['filterBar']);
  assert.equal(filterBar.nativeElement, 'div');
});

/**
 * The value is the engine's tree and nothing of this family's: the leaf is the
 * descriptor `table` edits in a column header, so a screen offering both edits
 * one object. Inventing a flat rule here would be the three-families-disagreeing
 * failure the briefing names for `sort`.
 */
test('holds a FilterGroup whose leaves are the column descriptor, unchanged', () => {
  assert.equal(contract.valueType, 'FilterGroup | null');
  assert.match(contract.valueRules.shape, /FilterDescriptor/);
  assert.match(contract.valueRules.engine, /@slotted\/core\/filter/);
  assert.match(contract.valueRules.firstLevel, /ruleFor/);
  assert.match(contract.valueRules.inactive, /normalizeFilterGroup/);
  assert.match(contract.valueRules.unknownField, /data-invalid/);
});

/**
 * Two tab stops however many fields a product declares. The root is a search
 * landmark rather than a toolbar because the APG toolbar pattern asks a
 * toolbar to avoid controls that need the arrow keys, and the search field is
 * one. Every other control — a pill, each segment of each chip, add, clear —
 * is one roving set, which the pattern's note on toolbars of several rows
 * allows.
 */
test('is a search landmark holding one toolbar whose chips are groups', () => {
  assert.equal(contract.rootRole, 'search');
  assert.match(contract.pattern.url, /patterns\/toolbar/);
  assert.match(contract.pattern.rows, /wrap from row to row/);
  assert.equal(contract.pattern.chips, undefined);
  assert.equal(contract.wiring.chips, undefined);
  assert.match(contract.wiring.bar, /role=toolbar/);
  assert.match(contract.wiring.bar, /chip segment/);
  assert.match(contract.wiring.chip, /role=group/);
  assert.match(contract.wiring.pill, /aria-haspopup=dialog/);
  assert.match(contract.wiring.count, /aria-live=polite/);
});

/**
 * A chip is its condition written in segments, each answering one question:
 * the field is fixed and only read, the operator opens a menu, the value a
 * popover, and the cross removes. The one-target chip it replaces reopened the
 * operand to change the operator.
 */
test('writes a chip as field, operator, value and remove', () => {
  const segments = ['chip-field', 'chip-operator', 'chip-value', 'chip-remove'];
  const at = filterBar.parts.indexOf('chip');
  assert.deepEqual(filterBar.parts.slice(at + 1, at + 5), segments);
  assert.match(contract.wiring.chipSegments, /chip-field is a span and never focusable/);
  assert.match(contract.wiring.chipSegments, /chip-operator a button with aria-haspopup=menu/);
  assert.match(contract.wiring.chipSegments, /chip-value a button with aria-haspopup=dialog/);
  assert.match(contract.wiring.chipSegments, /absent on a required field/);
  assert.match(contract.surfaces.chip, /moves on to the value popover/);
});

/**
 * An unfinished condition is drawn, never applied: the engine already keeps an
 * inactive rule out, so the chip is the bar's own until it completes.
 */
test('draws an incomplete condition without emitting it', () => {
  assert.match(contract.incomplete.rule, /data-incomplete/);
  assert.match(contract.incomplete.ownership, /onValueChange does not emit it/);
  assert.match(contract.surfaces.add, /incomplete/);
  assert.ok(contract.dataAttributes['data-incomplete']);
  assert.ok(contract.dataAttributes['data-pinned']);
  assert.ok(contract.dataAttributes['data-compact']);
  assert.equal(contract.dataAttributes['data-filtered'], undefined);
  assert.equal(contract.dataAttributes['data-bar-wrapped'], undefined);
});

test('reads without writing under readOnly', () => {
  assert.ok(filterBar.capabilities.includes('readOnly'));
  assert.ok(filterBar.states.includes('readonly'));
  assert.equal(contract.stateAttributes.readonly, 'data-readonly');
  assert.equal(filterBar.defaults.readOnly, false);
});

/**
 * The APG pattern, key by key, so the keyboard table can be audited against
 * the source rather than remembered.
 */
test('transcribes the toolbar keyboard, and the keys of its own', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.deepEqual(keys, [
    'Tab / Shift+Tab',
    'ArrowLeft / ArrowRight',
    'ArrowUp / ArrowDown',
    'Home / End',
    'Enter / Space',
    'Delete / Backspace',
    'Escape',
    'Enter',
    'shortcut',
  ]);
  for (const entry of contract.keyboard) {
    for (const field of ['effect', 'focus', 'source']) {
      assert.ok(entry[field], `${entry.key} names no ${field}`);
    }
  }
  const remove = contract.keyboard.find((entry) => entry.key === 'Delete / Backspace');
  assert.match(remove.focus, /same role on the next chip, else on the previous, else add/);
  assert.match(remove.effect, /reason remove/);
});

/**
 * Five mutable values, five models. The query is `value` — the text a control
 * holds — and the preset is `selection`, the reader's choice of one item; the
 * vocabulary had both words and neither was invented here.
 */
test('models every mutable value, with the reasons each can carry', () => {
  const models = contract.stateModel;
  assert.deepEqual(Object.keys(models), ['filter', 'value', 'selection', 'open', 'revealed']);
  assert.equal(models.filter.controlled, 'value');
  assert.equal(models.filter.uncontrolled, 'defaultValue');
  assert.equal(models.filter.request, 'onValueChange');
  assert.ok(models.filter.reasons.includes('submit'), 'manual apply carries submit');
  assert.ok(models.filter.reasons.includes('remove'), 'a chip removed carries remove');
  assert.ok(models.filter.reasons.includes('select'), 'a preset chosen carries select');
  assert.equal(models.value.controlled, 'query');
  assert.equal(models.selection.controlled, 'preset');
  assert.equal(models.open.controlled, 'open');
  assert.equal(models.revealed.controlled, 'revealed');
  for (const model of Object.values(models)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

/**
 * Two update policies, Carbon's batch and instant and Fiori's Go and liveMode,
 * as one axis. Under manual the bar edits a draft and says so in the DOM.
 */
test('applies live or manually, and marks the dirty draft', () => {
  assert.deepEqual(contract.axes.apply, ['live', 'manual']);
  assert.equal(filterBar.defaults.apply, 'live');
  assert.match(contract.apply.manual, /submit/);
  assert.match(contract.apply.manual, /data-dirty/);
  assert.equal(contract.dataAttributes['data-dirty'].includes('draft'), true);
});

/**
 * docs/component-features.md §15: Clear tells a current filter from a required
 * default. The default is what Clear returns to, and a required field with no
 * value refuses to be applied or removed.
 */
test('keeps a required field at its default through Clear', () => {
  assert.match(contract.required.rule, /defaultValue/);
  assert.match(contract.required.refusal, /data-invalid/);
  assert.match(contract.required.refusal, /focus/);
  assert.match(contract.required.pinned, /pinned/);
  assert.ok(filterBar.states.includes('invalid'));
});

test('folds behind one button below the narrow breakpoint, and the builder is a drawer', () => {
  assert.match(
    contract.responsive.container,
    /^filter-bar, inline-size, on the root; the grid is on frame/,
  );
  assert.match(contract.responsive.narrow, /36rem/);
  assert.equal(contract.responsive.wide, undefined);
  assert.match(contract.responsive.lines, /the bar on the second/);
  assert.ok(filterBar.parts.includes('frame'));
  assert.match(contract.surfaces.builder, /drawer/);
  assert.match(contract.surfaces.summary, /Filters \(n\)/);
  assert.ok(filterBar.parts.includes('summary'));
});

test('reads the page property for sticky rather than measuring the header', () => {
  assert.match(contract.sticky.on, /--slotted-page-sticky-top/);
  assert.match(contract.sticky.on, /--slotted-filter-bar-size/);
  assert.deepEqual(contract.axes.sticky, ['false', 'true']);
  assert.equal(filterBar.defaults.sticky, false);
});

/**
 * Every decline names its owner or its composition. "Not needed yet" is not on
 * the list and cannot be.
 */
test('names the owner of every declined capability', () => {
  for (const [capability, reason] of Object.entries(contract.declined)) {
    assert.match(
      reason,
      /table|data-grid|column-manager|end slot|consumer|application|builder|join|engine/,
      `${capability} declines without naming an owner`,
    );
  }
});

test('names the thirty-five parts a filter bar is made of', () => {
  assert.equal(filterBar.parts.length, 35);
  for (const part of [
    'search',
    'bar',
    'pill',
    'add',
    'clear',
    'chip',
    'count',
    'builder',
    /* The builder's rows: the joining word before each rule or nested group. */
    'rules',
    'conjunction',
  ]) {
    assert.ok(filterBar.parts.includes(part), part);
  }
});

test('resolves disabled over every other state', () => {
  assert.equal(strongestState(filterBar.states), 'disabled');
});

test('lets an application set the policy once, and takes its words from the catalog', () => {
  assert.deepEqual(contract.provides.filterBarDefaults, [
    'apply',
    'queryDelay',
    'chipLimit',
    'shortcut',
  ]);
  for (const key of ['required', 'operators.contains', 'count', 'countOnly', 'rule', 'remove']) {
    assert.ok(contract.messages.includes(key), key);
  }
  assert.ok(!('labels' in contract), 'the words are messages, not labels');
});

test('declares a scenario for every capability the page has to show', () => {
  for (const scenario of [
    'listing',
    'pinned',
    'chips',
    'builder',
    'groups',
    'manual',
    'required',
    'presets',
    'query',
    'url',
    'count',
    'narrow',
    'sticky',
    'keyboard',
  ]) {
    assert.ok(contract.scenarios.filterBar.includes(scenario), scenario);
  }
});

/**
 * A phone gets one surface for every edit and a builder it can use: the bar
 * becomes one row that scrolls sideways, every edit opens the builder as a
 * bottom sheet, and the builder lists each rule as a card that expands in
 * place, with nesting drawn as a rail rather than a gutter.
 */
test('serves a phone with one scrolling row, a sheet and rule cards', () => {
  assert.match(contract.responsive.narrow, /scrolls sideways/);
  assert.match(contract.surfaces.builder, /from the bottom as a sheet/);
  assert.match(contract.surfaces.narrow, /open the builder, with the rule they name expanded/);
  assert.match(contract.builderCards.when, /builder's own width under 30rem/);
  assert.match(contract.builderCards.rule, /rule-summary/);
  assert.match(contract.builderCards.rule, /data-expanded/);
  assert.match(contract.builderCards.nesting, /rail/);
  assert.ok(filterBar.parts.includes('rule-summary'));
  assert.ok(filterBar.states.includes('expanded'));
  assert.equal(contract.stateAttributes.expanded, 'data-expanded');
});
