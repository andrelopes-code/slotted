import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members['entity-picker'];

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'entity-picker');
  assert.equal(contract.ui, 'entity-picker');
  assert.equal(contract.schemaVersion, 5);
  assert.deepEqual(Object.keys(contract.members), ['entity-picker']);
  assert.equal(member.nativeElement, 'div');
  assert.deepEqual(contract.portalledIdentity.elements, ['root', 'positioner']);
});

/**
 * The design's anatomy, §3, part for part. A chip is a `tag` root and the
 * media holds an `avatar`: their parts are those families', so a chip is
 * reached as a child of `chips` and has no part name of this family.
 */
test('declares every part of the anatomy', () => {
  assert.deepEqual(member.parts, [
    'root',
    'scope',
    'control',
    'selection',
    'values',
    'chips',
    'field',
    'input',
    'clear',
    'trigger',
    'arrow',
    'busy',
    'positioner',
    'content',
    'group',
    'group-label',
    'item',
    'media',
    'label',
    'match',
    'description',
    'meta',
    'indicator',
    'error',
    'empty',
    'placeholder',
    'more',
    'status',
  ]);
  for (const part of member.parts) {
    assert.ok(typeof contract.anatomy[part] === 'string', `${part} is not described`);
  }
  assert.deepEqual(contract.composes, [
    'avatar',
    'tag',
    'select',
    'spinner',
    'skeleton',
    'highlight',
    'positioner',
    'presence',
    'portal',
    'dismissable-layer',
    'collection',
    'focus',
    'live-announcer',
  ]);
});

test('follows the combobox pattern with a listbox popup and a grid of chips', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/');
  assert.equal(contract.listboxPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/');
  assert.equal(contract.chipsPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/');
  assert.equal(contract.roles.input, 'combobox');
  assert.equal(contract.roles.content, 'listbox');
  assert.equal(contract.roles.item, 'option');
  assert.equal(contract.roles.values, 'grid');
  assert.equal(contract.roles.chips, 'row');
  assert.equal(contract.roles['chips > tag'], 'gridcell');
  assert.equal(contract.roles.status, 'status');
  assert.equal(contract.highlight.mechanism, 'aria-activedescendant');
  assert.match(contract.wiring['aria-autocomplete'], /^list/);
  assert.match(contract.wiring['aria-multiselectable'], /multiple/);
});

/**
 * Five values move. `selection` is the chosen ids; `value` is the text in the
 * field, which is the vocabulary's word for it; `filter` is the scope, the
 * condition every search carries.
 */
test('models every mutable value with its reasons', () => {
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'select', 'remove', 'clear', 'submit', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'inputValue',
    uncontrolled: 'defaultInputValue',
    request: 'onInputValueChange',
    reasons: ['keyboard', 'select', 'clear', 'blur', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'select', 'blur', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'highlightedValue',
    uncontrolled: 'defaultHighlightedValue',
    request: 'onHighlightedValueChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.filter, {
    controlled: 'scope',
    uncontrolled: 'defaultScope',
    request: 'onScopeChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

test('holds ids as the value and hands the normalised entities on the request', () => {
  assert.match(contract.value.single, /string or null/);
  assert.match(contract.value.multiple, /array of ids/);
  assert.match(contract.value.request, /entities/);
  assert.match(contract.value.query, /typed since the last choice/);
  assert.deepEqual(contract.entity.required, ['id', 'label']);
  assert.deepEqual(contract.entity.optional, [
    'description',
    'meta',
    'avatar',
    'group',
    'scope',
    'disabled',
  ]);
});

/**
 * The adapters of the scope paragraph: search with its page, resolve for ids
 * the family has not seen, and a local list as a source like any other.
 */
test('calls its adapters with an abort signal and paints only the latest answer', () => {
  assert.match(contract.source.search, /signal/);
  assert.deepEqual(contract.source.request, ['query', 'scope', 'page', 'cursor', 'selected']);
  assert.deepEqual(contract.source.result, ['items', 'total', 'hasMore', 'cursor']);
  assert.match(contract.source.resolve, /ids/);
  assert.match(contract.source.local, /localEntitySource/);
  assert.match(contract.source.stale, /aborted/);
  assert.match(contract.source.delay, /searchDelay/);
  assert.match(contract.source.minimum, /minQueryLength/);
  assert.match(contract.source.more, /hasMore/);
});

test('builds the sections without repeating an id', () => {
  assert.match(contract.sections.empty, /chosen entities first, then favorites, then recent/);
  assert.match(contract.sections.typed, /only the results/);
  assert.match(contract.sections.dedupe, /never repeated/);
  assert.match(contract.sections.scope, /scope/);
  assert.match(contract.sections.headings, /more than one/);
  assert.match(contract.sections.cache, /never erases/);
});

/**
 * A form field is one row tall. The chosen set collapses into a count by
 * default, and the scope never takes a row of its own (visual gate).
 */
test('keeps the control on one line in a form', () => {
  assert.deepEqual(contract.axes.overflow, ['collapse', 'wrap']);
  assert.equal(member.defaults.overflow, 'collapse');
  assert.match(contract.overflow.collapse, /createCollapse/);
  assert.match(contract.overflow.collapse, /data-count/);
  assert.match(contract.overflow.collapse, /chosen section/);
  assert.match(contract.anatomy.root, /one line at every width/);
});

test('offers creation, retry and unresolved ids as states a reader can reach', () => {
  assert.match(contract.creation.element, /data-create/);
  assert.match(contract.creation.effect, /reason submit/);
  assert.match(contract.creation.appears, /no result's label equals/);
  assert.match(contract.error.retry, /data-retry/);
  assert.match(contract.error.retry, /Enter/);
  assert.match(contract.resolve.pending, /skeleton/);
  assert.match(contract.resolve.missing, /data-unresolved/);
  assert.match(contract.resolve.validity, /unresolved/);
});

test('answers every key of the pattern, the chips and the family', () => {
  const keys = contract.keyboard.map(({ key }) => key);
  for (const key of [
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
  ]) {
    assert.ok(keys.includes(key), `${key} is not answered`);
  }
  for (const row of contract.keyboard) {
    assert.ok(row.effect && row.focus && row.source, `${row.key} is incomplete`);
  }
  assert.match(contract.keyboard.find(({ key }) => key === 'Backspace').effect, /first press/);
});

test('offers the axes with their defaults and lets an application set them once', () => {
  assert.deepEqual(contract.axes.selectionMode, ['single', 'multiple']);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.variant, ['outline', 'subtle', 'plain']);
  assert.deepEqual(contract.axes.media, ['avatar', 'none']);
  assert.equal(member.defaults.selectionMode, 'single');
  assert.equal(member.defaults.searchDelay, 250);
  assert.equal(member.defaults.minQueryLength, 0);
  assert.equal(member.defaults.max, null);
  assert.equal(member.defaults.media, 'avatar');
  assert.deepEqual(contract.resolution.disabled, ['prop', 'field', 'defaults', false]);
  assert.ok(!contract.provides.entityPickerDefaults.includes('labels'));
  assert.ok(contract.provides.entityPickerDefaults.includes('searchDelay'));
  for (const label of [
    'empty',
    'loading',
    'count',
    'minQuery',
    'create',
    'error',
    'retry',
    'chosen',
    'favorites',
    'recent',
    'results',
    'unresolved',
    'remove',
    'scope',
    'added',
    'removed',
    'complete',
    'clear',
    'trigger',
  ]) {
    assert.ok(contract.messages.includes(label), `${label} is not a message`);
  }
});

test('records what it declines and where each one lives instead', () => {
  assert.equal(contract.declined.inlineCompletion.deferTo, undefined);
  assert.match(contract.declined.inlineCompletion.reason, /same name/);
  assert.equal(contract.declined.customValue.deferTo, 'combobox');
  assert.equal(contract.declined.virtualization.deferTo, 'collection');
  assert.equal(contract.declined.reorder.deferTo, 'multi-select');
  assert.equal(contract.declined.personCard.deferTo, 'hover-card');
  assert.match(contract.declined.favoriteMark.reason, /star/);
});

test('declares one page of demonstrations for every scenario', () => {
  assert.deepEqual(contract.scenarios['entity-picker'], [
    'playground',
    'single',
    'multiple',
    'rich-results',
    'sections',
    'scopes',
    'async',
    'creation',
    'error',
    'unresolved',
    'limit',
    'sizes',
    'variants',
    'states',
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
