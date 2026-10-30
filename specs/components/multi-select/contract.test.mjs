import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members['multi-select'];
const keys = contract.keyboard.map((entry) => entry.key);
const keyed = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'multi-select');
  assert.equal(contract.ui, 'multi-select');
  assert.equal(contract.schemaVersion, 5);
});

test('cites both pages of the pattern it answers', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/');
  assert.equal(contract.chipsPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/');
  assert.match(contract.patternStatus, /2026-09-10/);
  assert.deepEqual(contract.roles, {
    input: 'combobox',
    control: 'grid',
    chips: 'row',
    chip: 'gridcell',
    field: 'gridcell',
    content: 'listbox',
    item: 'option',
    group: 'group',
    separator: 'separator',
    status: 'status',
  });
});

test('keeps a real input, and says what the platform still owns because of it', () => {
  assert.equal(contract.nativeElement.considered, 'input + datalist');
  assert.equal(contract.nativeElement.refused, true);
  assert.match(contract.nativeElement.kept, /input/i);
});

/**
 * The two places this family knowingly leaves the pattern. A departure with no
 * written cost is the failure `references/patterns.md` exists to catch, so each
 * one carries what it costs and which surveyed implementations agree.
 */
test('writes every departure from the two patterns, each with its cost', () => {
  const names = contract.departures.map((entry) => entry.from);
  assert.deepEqual(names, ['selection follows focus', 'Enter closes the popup', 'focus in a cell']);
  for (const entry of contract.departures) {
    assert.ok(entry.instead.length > 0, `${entry.from} does not say what happens instead`);
    assert.ok(entry.cost.length > 0, `${entry.from} does not say what it costs`);
    assert.ok(entry.reason.length > 0, `${entry.from} does not say why`);
  }
});

test('answers every key both patterns list, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'ArrowDown',
    'ArrowUp',
    'Alt+ArrowDown',
    'Alt+ArrowUp',
    'Enter',
    'Escape',
    'Home',
    'End',
    'PageDown',
    'PageUp',
    'ArrowLeft',
    'ArrowRight',
    'Alt+ArrowLeft',
    'Alt+ArrowRight',
    'Alt+Home',
    'Alt+End',
    'Backspace',
    'Delete',
    'Delimiter',
    'Printable character',
    'Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'grid', 'family'].includes(entry.source), `${entry.key}`);
  }
});

/**
 * §6 of the feature guide asks for a predictable rule and does not say which.
 * Two presses is the rule: the first shows the reader what is about to go.
 */
test('removes with Backspace only from an empty input, and only on the second press', () => {
  const entry = keyed('Backspace');
  assert.match(entry.effect, /empty/i);
  assert.match(entry.effect, /second/i);
  assert.equal(entry.source, 'family');
  assert.match(contract.removal.rule, /two presses/i);
});

test('never intercepts the text-editing keys the browser owns', () => {
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
    assert.equal(keyed(key).source === 'platform' || /caret/.test(keyed(key).effect), true, key);
  }
  assert.match(keyed('Home').effect, /caret/i);
  assert.match(keyed('End').effect, /caret/i);
});

test('moves a value with Alt and an arrow, and mirrors it under rtl', () => {
  assert.match(keyed('Alt+ArrowRight').effect, /one place/i);
  assert.match(contract.reorder.direction, /rtl/i);
  assert.equal(contract.reorder.pointer.deferTo, 'drag-and-drop');
  assert.match(contract.reorder.reason, /§2\.8|keyboard alternative/i);
});

test('holds the four values a consumer can own, each with a reason vocabulary', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), [
    'current',
    'open',
    'selection',
    'value',
  ]);
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['select', 'submit', 'remove', 'clear', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'inputValue',
    uncontrolled: 'defaultInputValue',
    request: 'onInputValueChange',
    reasons: ['keyboard', 'select', 'submit', 'clear', 'blur', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) {
      assert.ok(CHANGE_REASONS.includes(reason), reason);
    }
  }
});

/**
 * The set is ordered, and the order is the reader's. Reorder means nothing
 * against a value the family is free to re-sort.
 */
test('declares the value an ordered array, and the order a contract', () => {
  assert.equal(contract.value.shape, 'readonly string[]');
  assert.match(contract.value.order, /reader/i);
  assert.match(contract.value.reason, /reorder/i);
});

/** Four silences the inventory found in the field, answered by one event. */
test('reports what it refused instead of dropping it', () => {
  assert.equal(contract.refusal.request, 'onValueRefuse');
  assert.deepEqual(contract.refusal.causes, ['duplicate', 'limit', 'invalid']);
  assert.equal(contract.refusal.stateModel, false);
  assert.match(contract.refusal.paste, /limit/i);
});

test('says a full control with the word the vocabulary already had', () => {
  assert.equal(contract.limit.attribute, 'data-complete');
  assert.ok(member.states.includes('complete'));
  assert.equal(contract.stateAttributes.complete, 'data-complete');
  assert.match(contract.limit.reason, /top of its range/i);
});

test('keeps the whole set reachable however the row overflows', () => {
  assert.deepEqual(contract.overflow.axis, ['wrap', 'collapse']);
  assert.equal(contract.overflow.default, 'wrap');
  assert.equal(contract.overflow.rows, 3);
  assert.equal(contract.overflow.collapse, 'createCollapse from @slotted/core/overflow');
  assert.match(contract.overflow.reason, /without hiding|sem ocultar/i);
  assert.equal(contract.overflow.narrowWidth, '120px');
});

test('draws the chip as a tag rather than as a pill of its own', () => {
  assert.equal(contract.chips.chip.ui, 'tag');
  assert.equal(contract.chips.chip.stylesheet, 'tag/tag.css');
  assert.equal(contract.chips.row, 'chips');
  assert.match(contract.chips.reason, /stated once|geometry/i);
});

test('declares the anatomy the harness and both bindings answer', () => {
  assert.deepEqual(member.parts, [
    'root',
    'control',
    'chips',
    'field',
    'input',
    'counter',
    'busy',
    'clear',
    'trigger',
    'arrow',
    'positioner',
    'content',
    'chosen',
    'group',
    'group-label',
    'item',
    'indicator',
    'icon',
    'label',
    'match',
    'description',
    'separator',
    'empty',
    'status',
    'placeholder',
  ]);
  assert.deepEqual(contract.portalledIdentity.elements, ['root', 'positioner']);
});

test('holds the capabilities the inventory justified', () => {
  for (const capability of [
    'value',
    'selection',
    'open',
    'current',
    'overflow',
    'size',
    'appearance',
    'placement',
    'content',
    'fullWidth',
    'disabled',
    'loading',
    'readOnly',
    'required',
    'invalid',
    'wiring',
  ]) {
    assert.ok(member.capabilities.includes(capability), capability);
  }
});

test('opens the popup and keeps it open, which is where it parts from select', () => {
  assert.equal(member.defaults.closeOnSelect, false);
  assert.equal(contract.wiring['aria-multiselectable'], 'true on the content, always');
});

test('names where focus goes after a value is taken out', () => {
  assert.equal(contract.focus.module, 'createRemovalFocus from @slotted/core/focus');
  assert.match(contract.focus.removal, /index/i);
  assert.match(contract.focus.duplicate, /existing/i);
  assert.equal(contract.focus.roving, true);
  assert.equal(contract.focus.tabStops, 1);
});

test('declines only what it can name a family or a composition for', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} has no reason`);
    assert.ok(
      'deferTo' in entry || 'compose' in entry,
      `${name} declines without naming the family that owns it or the composition that replaces it`,
    );
  }
  assert.equal(contract.declined.reorderByPointer.deferTo, 'drag-and-drop');
  assert.equal(contract.declined.virtualization.deferTo, 'collection');
  assert.equal(contract.declined.modal.deferTo, 'dialog');
  assert.ok(contract.declined.selectAll.compose.length > 0);
});

test('gives every axis a default and a resolution order', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(axis in member.defaults, `${axis} has no default`);
    assert.ok(contract.resolution[axis], `${axis} has no resolution order`);
    assert.deepEqual(contract.resolution[axis].slice(0, 2), ['prop', 'defaults']);
  }
});

test('lets an application set the family defaults once', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(contract.provides.multiSelectDefaults.includes(axis), axis);
  }
  assert.ok(contract.provides.multiSelectDefaults.includes('max'));
  assert.ok(contract.provides.multiSelectDefaults.includes('delimiters'));
});

test('declares a scenario for every capability a reference page has to show', () => {
  assert.deepEqual(contract.scenarios['multi-select'], [
    'playground',
    'chips',
    'creation',
    'limit',
    'duplicates',
    'reorder',
    'paste',
    'editing',
    'filtering',
    'groups',
    'overflow',
    'sizes',
    'variants',
    'states',
    'loading-and-empty',
    'long-content',
    'keyboard',
    'form',
    'composition',
  ]);
});

/**
 * A reader tabbing through a form passes this control on the way to the next
 * field, and a popup that opens on every Tab is a list announced and dismissed
 * for nothing. A press on the input is the other gesture: the reader aimed at
 * this control, and a press that only places the caret leaves them hunting for
 * the chevron. combobox, multi-select and entity-picker answer both alike.
 */
test('opens on typing and on a press on the input, and never on a Tab into it', () => {
  assert.deepEqual(contract.axes.openOn, ['input', 'focus', 'manual']);
  assert.equal(member.defaults.openOn, 'input');
  assert.deepEqual(contract.resolution.openOn, ['prop', 'defaults', 'input']);
  assert.match(contract.opening.input, /typing/);
  assert.match(contract.opening.input, /Tab/);
  assert.match(contract.opening.focus, /every focus/);
  assert.match(contract.opening.manual, /trigger/);
  assert.match(contract.opening.press, /pointer/);
  assert.match(contract.opening.press, /never closes/);
  assert.match(contract.opening.press, /manual/);
});
