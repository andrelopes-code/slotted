import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members['tags-input'];
const keys = contract.keyboard.map((entry) => entry.key);
const keyed = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'tags-input');
  assert.equal(contract.ui, 'tags-input');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The layout grid always; the combobox only with `suggestions`. Without them
 * the input is a text box that opens nothing, so no role is written that
 * would claim a popup.
 */
test('cites the layout-grid pattern, and gives the input a role only with suggestions', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/');
  assert.match(contract.patternStatus, /2026-09-14/);
  assert.match(contract.patternStatus, /layout grid/i);
  assert.deepEqual(contract.roles, {
    input: null,
    control: 'grid',
    chips: 'row',
    chip: 'gridcell',
    field: 'gridcell',
    inputWithSuggestions: 'combobox',
    suggestions: 'listbox',
    suggestion: 'option',
  });
  assert.match(contract.patternStatus, /patterns\/combobox\//);
  assert.match(contract.wiring.role, /Without `suggestions` the input carries no role/);
});

test('keeps a real input, and says what the platform still owns because of it', () => {
  assert.equal(contract.nativeElement.considered, 'input type="email" multiple');
  assert.equal(contract.nativeElement.refused, true);
  assert.match(contract.nativeElement.kept, /constraint|validity|datalist/i);
});

/**
 * The reason the family exists beside `multi-select`: a value that fails is
 * held and shown, not dropped. It is an axis so the filter operand can refuse.
 */
test('holds an invalid value and says why, and refuses it only on request', () => {
  assert.deepEqual(contract.axes.invalidValues, ['keep', 'refuse']);
  assert.equal(member.defaults.invalidValues, 'keep');
  assert.equal(contract.validity.chip.tone, 'danger');
  assert.equal(contract.validity.chip.mark, '--slotted-icon-circle-alert');
  assert.equal(contract.validity.chip.message, 'message');
  assert.match(contract.validity.platform, /validationMessage/);
  assert.match(contract.validity.native, /setCustomValidity/);
  assert.ok(member.parts.includes('message'));
});

test('judges a value by the input’s own constraints when no validator is given', () => {
  assert.equal(contract.validity.validator, 'validate');
  assert.match(contract.validity.shape, /boolean \| string/);
  for (const attribute of ['type', 'pattern', 'minlength', 'maxlength']) {
    assert.match(contract.validity.platform, new RegExp(attribute));
  }
});

test('writes every departure from the pattern, each with its cost', () => {
  const names = contract.departures.map((entry) => entry.from);
  assert.deepEqual(names, ['Down Arrow and Up Arrow move a cell', 'focus in a cell']);
  for (const entry of contract.departures) {
    assert.ok(entry.instead.length > 0, `${entry.from} does not say what happens instead`);
    assert.ok(entry.cost.length > 0, `${entry.from} does not say what it costs`);
    assert.ok(entry.reason.length > 0, `${entry.from} does not say why`);
  }
});

test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Enter',
    'Escape',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'ArrowDown',
    'ArrowUp',
    'Alt+ArrowLeft',
    'Alt+ArrowRight',
    'Alt+Home',
    'Alt+End',
    'Backspace',
    'Delete',
    'Delimiter',
    'Ctrl+C',
    'Ctrl+X',
    'Printable character',
    'Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key}`);
  }
});

test('removes with Backspace only from an empty input, and only on the second press', () => {
  const entry = keyed('Backspace');
  assert.match(entry.effect, /empty/i);
  assert.match(entry.effect, /second/i);
  assert.equal(entry.source, 'family');
  assert.match(contract.removal.rule, /two presses/i);
});

test('never intercepts the text-editing keys the browser owns', () => {
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
    assert.match(keyed(key).effect, /caret/i, key);
  }
});

/** `Enter` with nothing typed is the platform's implicit submission. */
test('commits on Enter and never submits a form with text still in the box', () => {
  const entry = keyed('Enter');
  assert.match(entry.effect, /never submit|not submit/i);
  assert.match(entry.effect, /implicit submission/i);
});

test('copies a value out with the keys the platform uses for copying', () => {
  assert.match(keyed('Ctrl+C').effect, /whole list|every value/i);
  assert.match(keyed('Ctrl+X').effect, /remove/i);
  assert.equal(contract.copy.module, 'writeToClipboard from @slotted/core/clipboard');
  assert.match(contract.copy.join, /first delimiter/i);
  assert.ok(member.capabilities.includes('copyable'));
});

test('moves a value with Alt and an arrow, and mirrors it under rtl', () => {
  assert.match(keyed('Alt+ArrowRight').effect, /one place/i);
  assert.match(contract.reorder.direction, /rtl/i);
  assert.equal(contract.reorder.pointer.deferTo, 'drag-and-drop');
});

/**
 * One capability, two models: the list and the pending text are both text the
 * control holds. `selection` is not declared, because there is no collection.
 */
test('holds the two values a consumer can own under one capability', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['value']);
  assert.deepEqual(contract.stateModel.value.tags, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['submit', 'remove', 'clear', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.value.text, {
    controlled: 'inputValue',
    uncontrolled: 'defaultInputValue',
    request: 'onInputValueChange',
    reasons: ['keyboard', 'submit', 'clear', 'blur', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel.value)) {
    for (const reason of model.reasons) {
      assert.ok(CHANGE_REASONS.includes(reason), reason);
    }
  }
  assert.ok(!member.capabilities.includes('selection'));
});

test('declares the value an ordered array, and the order a contract', () => {
  assert.equal(contract.value.shape, 'readonly string[]');
  assert.match(contract.value.order, /reader/i);
  assert.match(contract.value.text, /the text is the label/i);
});

test('reports what it refused instead of dropping it', () => {
  assert.equal(contract.refusal.request, 'onValueRefuse');
  assert.deepEqual(contract.refusal.causes, ['duplicate', 'limit', 'invalid']);
  assert.equal(contract.refusal.stateModel, false);
  assert.match(contract.refusal.paste, /limit/i);
  assert.match(contract.refusal.invalid, /refuse/);
});

test('answers blur with three words rather than one boolean', () => {
  assert.deepEqual(contract.axes.pendingOnBlur, ['commit', 'keep', 'discard']);
  assert.equal(member.defaults.pendingOnBlur, 'commit');
  assert.match(contract.pending.reason, /three/i);
});

test('says a full control with the word the vocabulary already had', () => {
  assert.equal(contract.limit.attribute, 'data-complete');
  assert.ok(member.states.includes('complete'));
  assert.equal(contract.stateAttributes.complete, 'data-complete');
  assert.equal(contract.limit.overflow, false);
});

/**
 * There is no popup to hold the hidden chips, so the row itself is where they
 * are shown, and it is shown exactly when the reader is about to act on them.
 */
test('keeps the whole list reachable however the row overflows', () => {
  assert.deepEqual(contract.overflow.axis, ['wrap', 'collapse']);
  assert.equal(contract.overflow.default, 'wrap');
  assert.equal(contract.overflow.rows, 3);
  assert.equal(contract.overflow.collapse, 'createCollapse from @slotted/core/overflow');
  assert.equal(contract.overflow.expanded, 'data-expanded');
  assert.match(contract.overflow.expands, /focus/i);
  assert.ok(member.states.includes('expanded'));
  assert.equal(contract.stateAttributes.expanded, 'data-expanded');
  assert.equal(contract.overflow.narrowWidth, '120px');
});

test('draws the chip as a tag rather than as a pill of its own', () => {
  assert.equal(contract.chips.chip.ui, 'tag');
  assert.equal(contract.chips.chip.stylesheet, 'tag/tag.css');
  assert.equal(contract.chips.row, 'chips');
  assert.match(contract.chips.reason, /stated once|geometry/i);
  assert.equal(contract.chips.locked, 'lockedValues');
});

test('declares the anatomy the harness and both bindings answer', () => {
  assert.deepEqual(member.parts, [
    'root',
    'control',
    'chips',
    'field',
    'input',
    'message',
    'counter',
    'clear',
    'hint',
    'suggestions',
    'suggestion',
  ]);
  assert.equal(member.nativeElement, 'div');
});

test('holds the capabilities the inventory justified, and composes no layer', () => {
  for (const capability of [
    'value',
    'overflow',
    'copyable',
    'size',
    'appearance',
    'fullWidth',
    'disabled',
    'readOnly',
    'required',
    'invalid',
    'wiring',
  ]) {
    assert.ok(member.capabilities.includes(capability), capability);
  }
  assert.deepEqual(contract.composes, [
    'tags',
    'overflow',
    'measure',
    'focus',
    'live-announcer',
    'clipboard',
    'collection',
    'positioner',
  ]);
  /* The suggestions are placed, not layered: no portal, no stack, no presence. */
  for (const module of ['portal', 'presence', 'dismissable-layer']) {
    assert.ok(!contract.composes.includes(module), module);
  }
  assert.equal(contract.adds.tags.module, 'packages/core/src/tags');
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
  assert.equal(contract.declined.suggestions.deferTo, 'multi-select');
  assert.equal(contract.declined.reorderByPointer.deferTo, 'drag-and-drop');
  assert.ok(contract.declined.sorting.compose.length > 0);
  assert.ok(contract.declined.highlightedValue.compose.length > 0);
  assert.ok(contract.declined.minimum.compose.length > 0);
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
    assert.ok(contract.provides.tagsInputDefaults.includes(axis), axis);
  }
  for (const value of ['max', 'delimiters']) {
    assert.ok(contract.provides.tagsInputDefaults.includes(value), value);
  }
  for (const word of ['remove', 'invalid', 'copied']) {
    assert.ok(contract.messages.includes(word), `${word} is not a message`);
  }
});

test('declares a scenario for every capability a reference page has to show', () => {
  assert.deepEqual(contract.scenarios['tags-input'], [
    'playground',
    'recipients',
    'validity',
    'platform-validation',
    'limit',
    'duplicates',
    'paste',
    'blur',
    'editing',
    'reorder',
    'locked',
    'copy',
    'overflow',
    'sizes',
    'variants',
    'states',
    'long-content',
    'keyboard',
    'form',
    'composition',
  ]);
});
