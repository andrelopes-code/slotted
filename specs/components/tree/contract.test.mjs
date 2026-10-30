import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS, STATE_PRECEDENCE } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'tree');
  assert.equal(contract.ui, 'tree');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A node is a part of one set rather than a family of its own, as a group is in
 * `listbox`. One member keeps `data-ui` on exactly one element.
 */
test('is one set whose nodes and groups are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['tree']);
  assert.deepEqual(contract.members.tree.parts, [
    'root',
    'canvas',
    'node',
    'row',
    'guide',
    'expander',
    'indicator',
    'icon',
    'label',
    'description',
    'meta',
    'loader',
    'actions',
    'group',
    'empty',
  ]);
});

/** A link without the extracted lists is not evidence. */
test('cites the pattern it implements, and where the transcription lives', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/');
  assert.match(contract.patternStatus, /2026-09-09/);
});

/**
 * `role="treeitem"` has to contain the `role="group"` holding its children, so
 * a pointer target that was the node itself would select a folder when the
 * reader clicked a file three levels down.
 */
test('splits the node from the row, and says why the list elements are kept', () => {
  assert.equal(contract.roles.canvas, 'tree');
  assert.equal(contract.roles.node, 'treeitem');
  assert.equal(contract.roles.group, 'group');
  assert.equal(contract.roles.row, 'presentation');
  assert.equal(contract.element.canvas, 'ul');
  assert.equal(contract.element.node, 'li');
  assert.match(contract.element.reason, /aria-level/);
  assert.match(contract.element.reason, /container-type/);
});

/**
 * The pattern forbids a tree carrying `aria-selected` and `aria-checked` at
 * once outside three conditions it calls extremely rare. Zag ships two
 * selection sets and produces that tree by default.
 */
test('holds one selection value and lets the indicator decide the attribute', () => {
  assert.equal(Object.keys(contract.stateModel).length, 3);
  assert.ok(contract.stateModel.selection);
  assert.ok(!('checked' in contract.stateModel));
  assert.match(contract.selection.attribute, /aria-selected/);
  assert.match(contract.selection.attribute, /aria-checked/);
  assert.equal(contract.selection.forbidden, 'both at once');
  assert.match(contract.selection.dom, /data-selected/);
  assert.deepEqual(contract.axes.selectionIndicator, ['auto', 'highlight', 'checkbox', 'none']);
});

/** Every mutable value carries its own model, and every reason is in the vocabulary. */
test('models the three values a reader moves', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'open', 'selection']);
  assert.equal(contract.stateModel.open.controlled, 'expandedKeys');
  assert.equal(contract.stateModel.open.uncontrolled, 'defaultExpandedKeys');
  assert.equal(contract.stateModel.open.request, 'onExpandedKeysChange');
  assert.equal(contract.stateModel.current.controlled, 'activeKey');
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

/**
 * The set the reader has expanded is not the set they can see. A branch opened
 * inside one that was then closed stays in the set and shows nothing, so a
 * keyboard counting the set rather than the visible list skips rows.
 */
test('counts the visible nodes rather than the expanded set', () => {
  assert.match(contract.navigation.mask, /visible\(expandedKeys\)/);
  assert.match(contract.navigation.mask, /collapsed/);
  assert.deepEqual(contract.navigation.functions, [
    'moveIndex',
    'createTreeCollection',
    'cascadeSelection',
    'indeterminateKeys',
  ]);
  assert.equal(contract.typeahead.scope, 'the visible nodes, in their visible order');
});

/**
 * A window renders a slice of the visible rows, and a slice cannot preserve
 * nesting — so the windowed tree writes the three properties the pattern
 * requires under exactly that condition, and the nested one writes none.
 */
test('states which structure writes the level properties, and what it costs', () => {
  assert.deepEqual(contract.axes.structure, ['auto', 'nested', 'flat']);
  assert.equal(contract.structure.auto, 'flat while virtual, nested otherwise');
  assert.match(contract.structure.nested, /the family writes none of them/);
  assert.match(contract.structure.flat, /aria-level/);
  assert.match(contract.structure.reason, /not present in the DOM/);
  assert.match(contract.structure.cost, /role=group/);
  assert.equal(contract.virtual.structure, 'flat');
});

/** A leaf carrying `aria-expanded` is announced as a parent. */
test('writes the tree properties the pattern requires and none it forbids', () => {
  assert.match(contract.wiring['aria-expanded'], /never on a leaf/);
  assert.match(contract.wiring['aria-multiselectable'], /only in multiple/);
  assert.match(contract.wiring['aria-labelledby'], /subtree/);
  assert.match(contract.wiring['aria-level'], /flat/);
  assert.match(contract.wiring.name, /aria-label/);
});

/**
 * The two keys the pattern gives a tree and nothing else, plus the optional one
 * two surveyed implementations ship.
 */
test('transcribes the keyboard, including the keys only a tree has', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of [
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
    'Enter',
    'Space',
    'Shift+ArrowDown',
    'Shift+Space',
    'Control+Shift+Home',
    'Control+Shift+End',
    'Control+A',
    '*',
  ]) {
    assert.ok(keys.includes(key), `the keyboard table is missing ${key}`);
  }
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect && entry.focus, `${entry.key} states no effect or no focus destination`);
    assert.ok(['pattern', 'departure'].includes(entry.source), entry.key);
  }
  const right = contract.keyboard.find((entry) => entry.key === 'ArrowRight');
  assert.match(right.effect, /opens a closed branch/);
  assert.match(right.effect, /leaf does nothing/);
});

/** A departure may not be silent, and each one carries its cost. */
test('writes every departure with its cost', () => {
  for (const [name, departure] of Object.entries(contract.departures)) {
    assert.ok(departure.reason, `${name} has no reason`);
    assert.ok(departure.cost, `${name} has no cost`);
  }
  const sourced = contract.keyboard.filter((entry) => entry.source === 'departure');
  assert.deepEqual(
    sourced.map((entry) => entry.key),
    ['PageDown', 'PageUp'],
  );
});

/** A decline names the family that owns the capability, or the composition. */
test('writes every decline with somewhere else to go', () => {
  for (const [name, declined] of Object.entries(contract.declined)) {
    assert.ok(declined.reason, `${name} has no reason`);
  }
  assert.equal(contract.declined.dragAndDrop.deferTo, 'wave 8');
});

/**
 * Carbon states the rule and ships no API for it. A selection that disappears
 * when its branch closes is a selection the reader has lost.
 */
test('says a collapsed branch holds a selection, without inventing a state', () => {
  assert.match(contract.selection.collapsedBranch, /data-selected-within/);
  assert.ok('data-selected-within' in contract.facts);
  for (const fact of Object.keys(contract.facts)) {
    if (fact === 'reason') continue;
    assert.match(fact, /^data-/, `${fact} is not a data attribute`);
    assert.ok(
      !Object.values(contract.stateAttributes).includes(fact),
      `${fact} is declared both as a fact and as a state`,
    );
  }
  /* `expanded` and `indeterminate` are outside `STATE_PRECEDENCE` on purpose:
     neither competes with another state for the paint. A branch is expanded
     while it is disabled, and a box is indeterminate while it is hovered, so
     the stylesheet paints them beside the ordered states rather than instead of
     one. `required` is outside it for the same reason: it is a fact about the
     control rather than a condition the reader put it in. Every state that does
     compete is in the order. */
  const ordered = contract.members.tree.states.filter((state) => state !== 'default');
  const outside = ordered.filter((state) => !STATE_PRECEDENCE.includes(state));
  assert.deepEqual(outside, ['expanded', 'indeterminate', 'required']);
});

/** The cascade rules, which are the half of a checkbox tree everyone gets wrong. */
test('states what a cascade does to a disabled node and to an unfetched branch', () => {
  assert.match(contract.selection.cascade.disabled, /left exactly as it was/);
  assert.match(contract.selection.cascade.unfetched, /stays selected on its own/);
  assert.match(contract.selection.cascade.indeterminate, /never a branch that is itself selected/);
  assert.deepEqual(contract.axes.selectionCascade, ['none', 'descendants']);
});

/** The consumer owns the data, so the family holds no fetch. */
test('gives lazy loading to the consumer and keeps the announcement', () => {
  assert.equal(contract.lazy.owner, 'the consumer');
  assert.equal(contract.lazy.part, 'loader');
  assert.match(contract.lazy.announce, /live-announcer/);
  assert.ok(contract.lazy.cost);
});

/** The differentiator, and the reason it costs a derivation rather than a mechanism. */
test('filters without owning the query or rendering a field', () => {
  assert.equal(contract.filtering.input, 'query');
  assert.equal(
    contract.filtering.owner,
    'the consumer owns the query string and the control it is typed into; the family renders no search field',
  );
  assert.match(contract.filtering.ancestors, /never hidden behind a closed branch/);
  assert.match(contract.filtering.mark, /--slotted-highlight-tint-opacity/);
});

/** The chevron is not a button, and the reason is a tab stop rather than taste. */
test('keeps the expander out of the tab order and says what that costs', () => {
  assert.equal(contract.expander.element, 'span');
  assert.equal(contract.expander.focusable, false);
  assert.match(contract.expander.reason, /second tab stop/);
  assert.match(contract.expander.cost, /--slotted-target-min/);
});

/** A band that started at the indent reads as a broken rectangle. */
test('puts the indent on the row and the guide in one element', () => {
  assert.equal(contract.indent.carrier, 'row');
  assert.equal(contract.indent.property, 'padding-inline-start');
  assert.match(contract.indent.guide, /one element per row/);
  assert.match(contract.indent.cap, /240/);
  assert.ok(contract.indent.cost);
});

/** Every axis resolves the same way in both bindings, and the defaults agree. */
test('resolves every axis through the same order, and defaults to what it declares', () => {
  const { defaults } = contract.members.tree;
  for (const [axis, values] of Object.entries(contract.axes)) {
    const order = contract.resolution[axis];
    assert.ok(order, `${axis} states no resolution order`);
    const fallback = order[order.length - 1];
    assert.equal(defaults[axis], fallback, `${axis} defaults disagree`);
    assert.ok(values.includes(fallback), `${axis} default is not one of its values`);
  }
  for (const axis of contract.provides.treeDefaults) {
    assert.ok(axis in defaults, `${axis} is provided and has no default`);
  }
});

/** One tab stop, and a place for focus to go when the node holding it leaves. */
test('answers where focus goes when a node or its branch disappears', () => {
  assert.equal(contract.focus.tabStops, 1);
  assert.equal(contract.focus.auto.virtual, 'activedescendant');
  assert.match(contract.focus.afterRemoval, /createRemovalFocus/);
  assert.match(contract.expansion.activeNodeInside, /before the expansion request/);
});

/** The Angular binding reaches an integration point React has no equal of. */
test('records the forms asymmetry rather than levelling both bindings down', () => {
  assert.match(contract.forms.angular, /ControlValueAccessor/);
  assert.match(contract.forms.react, /hidden input/);
  assert.match(contract.forms.asymmetry, /Recorded rather than levelled/);
});

/** Every scenario the contract declares owes the reference page a demonstration. */
test('declares one scenario list, covering every axis it holds', () => {
  const scenarios = contract.scenarios.tree;
  assert.equal(new Set(scenarios).size, scenarios.length);
  for (const scenario of ['selection', 'cascade', 'filtering', 'virtualization', 'keyboard']) {
    assert.ok(scenarios.includes(scenario), `no demonstration is owed for ${scenario}`);
  }
});
