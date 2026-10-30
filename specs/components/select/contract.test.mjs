import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.select;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'select');
  assert.equal(contract.ui, 'select');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * Three pages answer this family, and none of them alone does. The combobox
 * pattern owns the control; the select-only example owns the key table, because
 * a combobox that takes no text is exactly what this family is; the listbox
 * pattern owns the popup and its selection states.
 */
test('cites all three pages of the pattern it answers', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/');
  assert.equal(
    contract.examplePattern,
    'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/',
  );
  assert.equal(contract.listboxPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/');
  assert.deepEqual(contract.roles, {
    trigger: 'combobox',
    content: 'listbox',
    'search-input': 'combobox',
    list: 'listbox',
    item: 'option',
    group: 'group',
    separator: 'separator',
    status: 'status',
  });
});

/**
 * The fourth page, and only for the opt-in. The combobox pattern lists the four
 * roles a popup may carry and says a popup that is not a listbox is named by
 * `aria-haspopup`; a popup holding a text field and a list is a dialog, and the
 * date-picker example is the pattern's own instance of that composition. A
 * select that did not search kept the listbox it has always had, so the second
 * shape is recorded beside the first rather than replacing it.
 */
test('cites the page that answers the popup it opens while searching', () => {
  assert.equal(
    contract.searchRoles.source,
    'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/',
  );
  assert.equal(contract.searchRoles.content, 'dialog');
  assert.equal(contract.roles.content, 'listbox');
  assert.match(contract.wiring['aria-haspopup'], /dialog/);
  assert.match(contract.wiring['aria-activedescendant'], /search input/);
});

/**
 * The query is a value the reader owns and never a value the form holds. It is
 * filed under `value` because that is the word `combobox` files `inputValue`
 * under, and the two are the same kind of thing: text a control carries that is
 * not the key it commits.
 */
test('declares a state model for the query, and keeps it apart from the selection', () => {
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'searchValue',
    uncontrolled: 'defaultSearchValue',
    request: 'onSearchValueChange',
    reasons: ['keyboard', 'select', 'clear', 'programmatic'],
  });
  assert.ok(member.capabilities.includes('value'));
  assert.match(contract.search.query, /never becomes a value/);
  assert.equal(contract.search.default, false);
  assert.equal(member.defaults.search, false);
});

/**
 * Focus enters the layer for the first time in this family, and only here. The
 * pattern's own note is the reason, and the contract carries it rather than the
 * implementation alone.
 */
test('says where focus goes while searching, and why the layer still needs no guard', () => {
  assert.match(contract.focus.onOpenSearching, /aria-activedescendant/);
  assert.match(contract.focus.onOpenSearching, /dialog/);
  assert.equal(contract.focus.guards, false);
  assert.match(contract.focus.guardsReason, /one focusable element/i);
});

/**
 * Two keys behave differently while the reader is typing, and each is a key the
 * closed control spends on something else. A departure with no written cost is
 * the failure `patterns.md` names.
 */
test('records every key the search field takes back from the key table', () => {
  const searchKeys = contract.searchKeyboard.map((entry) => entry.key);
  assert.deepEqual(searchKeys, [
    'ArrowDown',
    'ArrowUp',
    'PageDown',
    'PageUp',
    'Home',
    'End',
    'Enter',
    'Space',
    'Escape',
    'Tab',
    'Printable character',
  ]);
  for (const entry of contract.searchKeyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  for (const key of ['Space', 'Home', 'End']) {
    const entry = contract.searchKeyboard.find((row) => row.key === key);
    assert.equal(entry.source, 'platform', `${key} is bound where the platform should hold it`);
    assert.match(entry.effect, /Not bound/);
  }
  /*
   * Tab keeps the effect the closed control's Tab has — commit, close, move on
   * — and only the mechanism differs, because the browser's own next element
   * from inside a portalled layer is the end of the document. Returning focus
   * to the trigger and stopping there was the first answer, and it cost the
   * reader a second Tab to leave a control they had finished with.
   */
  const tab = contract.searchKeyboard.find((entry) => entry.key === 'Tab');
  assert.equal(tab.source, 'pattern');
  assert.match(tab.effect, /moves on/);
  assert.match(tab.effect, /tabbables\(\)/);
  assert.match(contract.search.tabOrder, /@slotted\/core\/focus/);
  assert.match(contract.focus.restoreSearching, /outside press/);
  assert.match(contract.typeahead.disabledBy, /^search,/);
});

/**
 * `docs/component-features.md` §2.8 asks for the native element first. It was
 * considered and refused, and the refusal states its own cost rather than
 * leaving a reader to find it.
 */
test('says which native element it refused, and what refusing it costs', () => {
  assert.equal(contract.nativeElement.considered, 'select');
  assert.equal(contract.nativeElement.refused, true);
  assert.match(contract.nativeElement.reason, /operating system/i);
  assert.match(contract.nativeElement.reason, /hidden native select/i);
});

test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'ArrowDown',
    'ArrowUp',
    'Alt+ArrowDown',
    'Alt+ArrowUp',
    'Enter',
    'Space',
    'Home',
    'End',
    'PageDown',
    'PageUp',
    'Printable character',
    'Escape',
    'Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
});

/**
 * The one key whose behaviour departs from the example it was transcribed from.
 * A departure with no written cost is the failure `patterns.md` names.
 */
test('records the one key that departs from the example, as a departure', () => {
  const up = contract.keyboard.find((entry) => entry.key === 'ArrowUp');
  assert.equal(up.source, 'family');
  assert.match(up.effect, /departure|mirror/i);
});

/** Tab commits here and does not in `combobox`, and the table has to say so. */
test('commits on Tab, which is what separates it from an editable combobox', () => {
  const tab = contract.keyboard.find((entry) => entry.key === 'Tab');
  assert.match(tab.effect, /commits/);
  assert.match(tab.effect, /native select/);
});

test('declares a state model for each of the three values a consumer can own', () => {
  for (const capability of ['selection', 'open', 'current']) {
    assert.ok(member.capabilities.includes(capability), `${capability} is not declared`);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability), `${capability} is not mutable`);
  }
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'clear', 'select', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'highlightedValue',
    uncontrolled: 'defaultHighlightedValue',
    request: 'onHighlightedValueChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.ok(contract.stateModel.open.reasons.includes('select'));
  assert.ok(contract.stateModel.open.reasons.includes('escape'));
  assert.ok(contract.stateModel.open.reasons.includes('outsidePress'));
});

/**
 * The highlight is where the reader is and the selection is what they chose.
 * The listbox pattern's own note separates the two, and a family that painted
 * one attribute for both would leave a reader unable to tell a value they had
 * committed from a row they had merely arrowed past.
 */
test('keeps the highlight and the selection apart, in both the DOM and ARIA', () => {
  assert.equal(contract.highlight.mechanism, 'aria-activedescendant');
  assert.equal(contract.highlight.attribute, 'data-current');
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.equal(contract.stateAttributes.selected, 'data-selected');
  assert.match(contract.wiring['aria-selected'], /committed/);
  assert.match(contract.highlight.reason, /select-only|focus/i);
});

test('keeps focus on the trigger, so the layer needs no guard and no restore', () => {
  assert.equal(contract.focus.roving, false);
  assert.equal(contract.focus.contained, false);
  assert.equal(contract.focus.guards, false);
  assert.match(contract.focus.guardsReason, /never enters/i);
  assert.match(contract.focus.disabledItems, /skipped/i);
});

test('composes the core modules and rewrites none of them', () => {
  assert.deepEqual(contract.composes, [
    'positioner',
    'presence',
    'portal',
    'dismissable-layer',
    'typeahead',
    'collection',
  ]);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.scrollLock, false);
  assert.equal(contract.layer.zIndexToken, '--slotted-z-index-popover');
  assert.ok(contract.layer.branches.length > 0);
});

test('says which shared ground it had to add, and why', () => {
  assert.equal(contract.adds.collection.module, 'packages/core/src/collection');
  assert.match(contract.adds.collection.reason, /aria-activedescendant/);
  assert.match(contract.adds.collection.reason, /locale/i);
  assert.equal(contract.adds.collection.nextConsumer, 'listbox');
});

/**
 * The family is two subtrees and `data-ui` is on both, which is a departure
 * from every family built before it. A consumer selecting on `[data-ui]` gets
 * two elements, so the contract says so where a reader will find it.
 */
test('declares that the identifier is written on two elements, and why', () => {
  assert.deepEqual(contract.portalledIdentity.elements, ['root', 'positioner']);
  assert.match(contract.portalledIdentity.reason, /portalled/);
  assert.ok(member.parts.includes('root'));
  assert.ok(member.parts.includes('positioner'));
});

/**
 * SL10. The control holds one line, so twelve chosen values are three chips and
 * a count; the band at the top of the popup holds all of them and scrolls at
 * about two rows of its own. It carries no remove control, because focus never
 * enters this layer and a widget in there would be a tab stop the pattern
 * excludes — a value is taken back from the option's own row, or from the
 * focusable chips in the control.
 */
test('holds every chosen value in a band of the popup, and puts no widget in it', () => {
  assert.equal(contract.chips.band, 'chosen');
  assert.equal(contract.chips.bandRows, 2);
  assert.equal(contract.chips.bandInteractive, false);
  /*
   * The reason is keyboard reach, and `search` narrows it without breaking it:
   * focus does enter the layer there, and the layer's one Tab is spent leaving
   * the control, so a remove control in the band would be pointer-only (SL11).
   */
  assert.match(contract.chips.bandReason, /keyboard reach/i);
  assert.match(contract.chips.bandReason, /pointer and by nothing else/i);
  assert.ok(member.parts.includes('chosen'));
});

test('names every part, and no part it does not own', () => {
  assert.deepEqual(member.parts, [
    'root',
    'trigger',
    'value',
    'arrow',
    'busy',
    'tags',
    'summary',
    'clear',
    'positioner',
    'content',
    'search',
    'search-icon',
    'search-input',
    'list',
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

/**
 * A controlled value the collection does not hold is what an async list shows
 * on its first render. Every surveyed implementation paints the placeholder;
 * this one says the label could not be resolved and shows the value.
 */
test('says what it draws for a value no option matches', () => {
  assert.equal(contract.value.part, 'value');
  assert.equal(contract.value.unmatched, 'data-unmatched');
  assert.match(contract.value.reason, /placeholder/);
});

test('answers a form the way each ecosystem does, and records the asymmetry', () => {
  assert.match(contract.form.react, /hidden native select/);
  assert.match(contract.form.angular, /ControlValueAccessor/);
  assert.match(contract.form.angular, /Validator/);
  assert.match(contract.form.reason, /asymmetry/i);
});

test('bounds the surface by the room the positioner reports, and by the anchor width', () => {
  assert.equal(contract.overflow.part, 'content');
  assert.equal(contract.overflow.property, '--slotted-positioner-available-height');
  assert.equal(contract.measure.property, '--slotted-positioner-anchor-width');
  for (const property of [
    '--slotted-layer-depth',
    '--slotted-positioner-anchor-width',
    '--slotted-positioner-available-height',
    '--slotted-positioner-transform-origin',
  ]) {
    assert.ok(contract.runtimeProperties.includes(property), `${property} is not declared`);
  }
});

/** A list of a hundred options that does not wrap is where the reader keeps their place. */
test('does not loop by default, which is where it parts company with menu', () => {
  assert.equal(member.defaults.loop, false);
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
    assert.ok(contract.provides.selectDefaults.includes(axis), `${axis} is not in the provider`);
  }
  for (const word of ['clear', 'empty', 'loading']) {
    assert.ok(contract.messages.includes(word), `${word} is not a message`);
  }
});

/** Each decline names the family that owns the capability instead, or the cost. */
test('declines nothing without naming what owns it instead', () => {
  assert.equal(contract.declined.modal.deferTo, 'dialog');
  assert.equal(contract.declined.backdrop.deferTo, 'dialog');
  assert.equal(contract.declined.arrow.deferTo, 'popover');
  assert.equal(contract.declined.chips.deferTo, 'multi-select');
  assert.equal(contract.declined.freeText.deferTo, 'combobox');
  assert.equal(contract.declined.virtualization.deferTo, 'collection');
  assert.match(contract.declined.itemAligned.reason, /no composition replaces it/i);
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
});

test('declares a scenario for every capability a reference page has to prove', () => {
  assert.deepEqual(contract.scenarios.select, [
    'playground',
    'selection',
    'placeholder',
    'groups',
    'multiple',
    'clearable',
    'sizes',
    'variants',
    'states',
    'loading-and-empty',
    'long-content',
    'search',
    'placement',
    'keyboard',
    'form',
    'composition',
  ]);
});
