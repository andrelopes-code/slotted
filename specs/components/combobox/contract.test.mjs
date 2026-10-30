import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.combobox;
const keys = contract.keyboard.map((entry) => entry.key);
const keyed = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'combobox');
  assert.equal(contract.ui, 'combobox');
  assert.equal(contract.schemaVersion, 5);
});

test('cites both pages of the pattern it answers', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/');
  assert.equal(contract.listboxPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/');
  assert.deepEqual(contract.roles, {
    input: 'combobox',
    content: 'listbox',
    item: 'option',
    group: 'group',
    separator: 'separator',
    status: 'status',
  });
});

test('says which native element it refused, and what it kept from the platform', () => {
  assert.equal(contract.nativeElement.considered, 'input + datalist');
  assert.equal(contract.nativeElement.refused, true);
  assert.match(contract.nativeElement.reason, /real input/i);
});

test('answers every key the pattern lists, and says where focus lands', () => {
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
    'Backspace',
    'Delete',
    'Printable character',
    'Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
});

/**
 * The pattern's IMPORTANT note asks that script not capture the keys a browser
 * uses to edit text. Six rows here are the platform's, and saying so is what
 * stops a later change from quietly binding one of them.
 */
test('leaves every text-editing key to the browser, and marks it as the platform’s', () => {
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete']) {
    assert.equal(keyed(key).source, 'platform', `${key} is not left to the platform`);
    assert.match(keyed(key).effect, /never intercepted/, `${key} does not say it is untouched`);
  }
});

/** The arrows move the highlight and must not move the caret with it. */
test('moves the highlight on the block axis without moving the caret', () => {
  assert.match(keyed('ArrowDown').focus, /caret does not move/);
  assert.match(keyed('ArrowUp').focus, /caret unmoved/);
});

/** Tab does not commit here, and select's does. The pair has to say why. */
test('refuses to commit on Tab, which is where it parts company with select', () => {
  assert.match(keyed('Tab').effect, /closes without committing/);
  assert.match(keyed('Tab').effect, /select/);
});

/** Escape is two steps, and the pattern names both as optional. */
test('gives Escape both of the steps the pattern offers', () => {
  assert.match(keyed('Escape').effect, /closes/);
  assert.match(keyed('Escape').effect, /reverts/);
  assert.match(keyed('Escape').effect, /clears the selection/);
});

test('declares a state model for each of the four values a consumer can own', () => {
  for (const capability of ['value', 'selection', 'open', 'current']) {
    assert.ok(member.capabilities.includes(capability), `${capability} is not declared`);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability), `${capability} is not mutable`);
  }
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'inputValue',
    uncontrolled: 'defaultInputValue',
    request: 'onInputValueChange',
    reasons: ['keyboard', 'select', 'clear', 'blur', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'clear', 'select', 'blur', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'highlightedValue',
    uncontrolled: 'defaultHighlightedValue',
    request: 'onHighlightedValueChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
});

/**
 * §6 asks for it in these words: the typed text and the chosen key are two
 * contracts. A family that held one would make a consumer derive the other,
 * and the derivation is wrong for every list whose labels are not unique.
 */
test('keeps the typed text and the chosen key as two contracts', () => {
  assert.match(contract.value.text, /^inputValue,/);
  assert.match(contract.value.key, /^value,/);
  assert.notEqual(contract.stateModel.value.controlled, contract.stateModel.selection.controlled);
  assert.match(contract.value.reason, /exactly one request/);
});

test('keeps the highlight and the selection apart, in both the DOM and ARIA', () => {
  assert.equal(contract.highlight.mechanism, 'aria-activedescendant');
  assert.equal(contract.highlight.attribute, 'data-current');
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.equal(contract.stateAttributes.selected, 'data-selected');
});

/** §6: filtering, ranking and remote search are adapters, never assumptions. */
test('treats filtering as an adapter and ships a locale-sensitive default', () => {
  assert.match(contract.filtering.default, /locale-sensitive/);
  assert.equal(contract.filtering.adapter, 'filter: (item, query) => boolean');
  assert.match(contract.filtering.off, /filter=\{null\}/);
  assert.match(contract.filtering.highlight, /highlight family inside the label part/);
  assert.equal(contract.mark.family, 'highlight');
  assert.ok(member.parts.includes('match'));
});

/** The pattern's own three values, and the family ships all three. */
test('answers aria-autocomplete with the pattern’s own three values', () => {
  assert.deepEqual(contract.axes.autocomplete, ['none', 'list', 'both']);
  assert.equal(contract.autocomplete.default, 'list');
  assert.match(contract.autocomplete.both, /selected range|completion/);
  assert.match(contract.wiring['aria-autocomplete'], /none, list or both/);
});

test('says what it does while an answer is still travelling', () => {
  assert.match(contract.async.loading, /aria-busy/);
  assert.match(contract.async.loading, /measure/);
  assert.equal(
    contract.async.loadMore,
    'onLoadMore fires when the status row is scrolled into view',
  );
  assert.match(contract.async.count, /live region/);
  assert.ok(member.parts.includes('status'));
  assert.ok(contract.messages.includes('count'));
});

test('keeps the trigger button out of the page tab sequence, as the pattern asks', () => {
  assert.match(contract.wiring.tabindex, /-1 on the trigger/);
  assert.match(contract.wiring.tabindex, /tab sequence/);
});

test('composes the core modules and rewrites none of them', () => {
  assert.deepEqual(contract.composes, [
    'positioner',
    'presence',
    'portal',
    'dismissable-layer',
    'collection',
    'live-announcer',
  ]);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.scrollLock, false);
  assert.equal(contract.layer.zIndexToken, '--slotted-z-index-popover');
});

test('declares that the identifier is written on two elements, and why', () => {
  assert.deepEqual(contract.portalledIdentity.elements, ['root', 'positioner']);
  assert.match(contract.portalledIdentity.reason, /portalled/);
});

test('names every part, and no part it does not own', () => {
  assert.deepEqual(member.parts, [
    'root',
    'input',
    'trigger',
    'arrow',
    'busy',
    'clear',
    'positioner',
    'content',
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
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'disabled',
    'readonly',
    'invalid',
    'required',
    'loading',
    'selected',
    'current',
  ]);
});

test('answers a form the way each ecosystem does, and records the asymmetry', () => {
  assert.match(contract.form.react, /hidden native input/);
  assert.match(contract.form.angular, /ControlValueAccessor/);
  assert.match(contract.form.angular, /Validator/);
  assert.match(contract.form.reason, /allowsCustomValue/);
});

test('resolves every axis in the same order, and holds a default for each', () => {
  for (const axis of Object.keys(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.ok(Array.isArray(resolution), `${axis} declares no resolution order`);
    assert.equal(resolution[0], 'prop', `${axis} does not let the consumer's value win`);
    assert.equal(resolution[1], 'defaults', `${axis} cannot be set once for an application`);
    assert.ok(axis in member.defaults, `${axis} has no default`);
    assert.deepEqual(member.defaults[axis], resolution[2], `${axis} default disagrees`);
  }
});

test('lets an application set every axis once, and takes every word from the catalog', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(contract.provides.comboboxDefaults.includes(axis), `${axis} is not in the provider`);
  }
  for (const word of ['clear', 'empty', 'loading', 'trigger', 'count', 'create']) {
    assert.ok(contract.messages.includes(word), `${word} is not a message`);
  }
});

/** The family has no typeahead axis, because typing is already the filter. */
test('ships no typeahead axis, because the input is the typeahead', () => {
  assert.ok(!('typeahead' in contract.axes));
  assert.ok(!contract.composes.includes('typeahead'));
});

test('declines nothing without naming what owns it instead', () => {
  assert.equal(contract.declined.multiple.deferTo, 'multi-select');
  assert.equal(contract.declined.modal.deferTo, 'dialog');
  assert.equal(contract.declined.backdrop.deferTo, 'dialog');
  assert.equal(contract.declined.arrow.deferTo, 'popover');
  assert.equal(contract.declined.grid.deferTo, 'table');
  assert.equal(contract.declined.virtualization.deferTo, 'collection');
  assert.match(contract.declined.debounce.reason, /drop characters/);
  assert.match(contract.declined.ranking.reason, /adapter/);
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
});

test('declares a scenario for every capability a reference page has to prove', () => {
  assert.deepEqual(contract.scenarios.combobox, [
    'playground',
    'filtering',
    'autocomplete',
    'custom-value',
    'creation',
    'async',
    'groups',
    'clearable',
    'sizes',
    'variants',
    'states',
    'empty',
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
