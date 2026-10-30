import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES, stateModels } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.commandPalette;
const keys = contract.keyboard.map((entry) => entry.key);
const keyed = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'command-palette');
  assert.equal(contract.ui, 'command-palette');
  assert.equal(contract.schemaVersion, 5);
});

test('answers the combobox pattern with a listbox popup, and hands the layer to dialog', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/');
  assert.equal(contract.layerPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.deepEqual(contract.roles, {
    input: 'combobox',
    list: 'listbox',
    item: 'option',
    group: 'group',
    separator: 'separator',
    status: 'status',
  });
  assert.equal(contract.highlight.mechanism, 'aria-activedescendant');
  assert.equal(contract.highlight.attribute, 'data-current');
});

/**
 * `docs/process/build-order.md` says what the family is in five words — "dialog com
 * combobox + listbox dentro" — and `docs/build-briefing.md` says overlay
 * behavior is composed and never rewritten. The family therefore composes the
 * dialog family and says so, rather than reaching for the core modules dialog
 * already composes.
 */
test('composes the dialog family for the layer, and kbd for every shortcut', () => {
  assert.ok(contract.composes.includes('dialog'));
  assert.ok(contract.composes.includes('kbd'));
  assert.match(contract.composedFamilies.dialog, /nothing of the layer is redrawn/i);
  assert.match(contract.composedFamilies.kbd, /plain/);
  for (const module of ['portal', 'presence', 'dismissable-layer', 'focus']) {
    assert.ok(
      !contract.composes.includes(module),
      `${module} is dialog's to compose, not this family's`,
    );
  }
});

/** The scope names the filtered menu menu refused, and inline is how it is answered. */
test('ships the surface without a layer, which is the filtered menu that menu refused', () => {
  assert.deepEqual(contract.axes.presentation, ['dialog', 'inline']);
  assert.equal(contract.presentation.default, 'dialog');
  assert.match(contract.presentation.inline, /menu/);
  assert.equal(contract.presentation.attribute, 'data-presentation');
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
    'Enter',
    'Escape',
    'Home',
    'End',
    'Ctrl+Home',
    'Ctrl+End',
    'PageDown',
    'PageUp',
    'ArrowLeft',
    'ArrowRight',
    'Backspace',
    'Delete',
    'Printable character',
    'Tab',
    'Hotkey',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
});

/** The pattern's IMPORTANT note: script does not capture the keys the browser edits text with. */
test('leaves every text-editing key to the browser, and marks it as the platform’s', () => {
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete']) {
    assert.equal(keyed(key).source, 'platform', `${key} is not left to the platform`);
    assert.match(keyed(key).effect, /never intercepted/, `${key} does not say it is untouched`);
  }
});

/** Escape is three steps here, in an order a reader can predict. */
test('gives Escape the clear, the page and the close, in that order', () => {
  const effect = keyed('Escape').effect;
  assert.ok(effect.indexOf('clears') < effect.indexOf('returns one page'));
  assert.ok(effect.indexOf('returns one page') < effect.indexOf('closes'));
  assert.match(effect, /inline/);
});

/** `docs/process/build-order.md`: the family never executes a disabled item. */
test('never executes a disabled item, and never highlights one', () => {
  assert.match(keyed('Enter').effect, /disabled item is never highlighted and never executed/);
  assert.match(contract.items.disabled, /never executed/);
  assert.match(contract.focus.disabledItems, /skipped by every movement key/);
});

test('returns a page on Backspace only when the query is empty', () => {
  assert.match(keyed('Backspace').effect, /empty query and a page open, returns one page/);
  assert.match(contract.pages.back, /Backspace with an empty query/);
});

test('declares a state model for each of the five values a consumer can own', () => {
  for (const capability of ['open', 'value', 'current', 'queue']) {
    assert.ok(member.capabilities.includes(capability), `${capability} is not declared`);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability), `${capability} is not mutable`);
  }
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'query',
    uncontrolled: 'defaultQuery',
    request: 'onQueryChange',
    reasons: ['keyboard', 'clear', 'select', 'programmatic'],
  });
  assert.deepEqual(Object.keys(contract.stateModel.current), ['item', 'page']);
  assert.equal(stateModels(contract.stateModel.current).length, 2);
  assert.deepEqual(contract.stateModel.current.page, {
    controlled: 'pages',
    uncontrolled: 'defaultPages',
    request: 'onPagesChange',
    reasons: ['select', 'keyboard', 'pointer', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.queue, {
    controlled: 'recent',
    uncontrolled: 'defaultRecent',
    request: 'onRecentChange',
    reasons: ['select'],
  });
});

/** §5: ranking is an adapter with a locale-sensitive default, and it can be turned off. */
test('treats ranking as an adapter and ships the core ranker as its default', () => {
  assert.match(contract.ranking.default, /createRanker/);
  assert.match(contract.ranking.default, /locale-sensitive/);
  assert.equal(contract.ranking.adapter, 'rank: (item, query) => number | null');
  assert.match(contract.ranking.off, /rank=\{null\}/);
  assert.equal(contract.adds.collection.export, 'createRanker');
  assert.match(contract.adds.collection.reason, /typeahead/);
});

/** The scope asks for the count to be announced, and the row is the live region. */
test('announces the result count through the live announcer, from a hidden status row', () => {
  assert.equal(contract.announce.part, 'status');
  assert.equal(contract.announce.module, 'packages/core/src/live-announcer');
  assert.match(contract.announce.count, /\{count\}/);
  assert.match(contract.announce.error, /\{message\}/);
  assert.ok(member.parts.includes('status'));
});

test('opens on a hotkey the consumer can turn off, and matches it with the core matcher', () => {
  assert.equal(member.defaults.hotkey, 'mod+k');
  assert.equal(contract.hotkey.off, 'hotkey={null}');
  assert.match(contract.hotkey.editable, /without a modifier does not fire/);
  assert.equal(contract.adds.keys.export, 'matchesShortcut, isEditableTarget');
  assert.equal(keyed('Hotkey').source, 'family');
});

test('holds a recent group the product persists, cut at a limit', () => {
  assert.equal(member.defaults.recentLimit, 5);
  assert.ok(contract.messages.includes('recent'));
  assert.match(contract.recent.updated, /moved to the front/);
  assert.match(contract.recent.unknown, /kept in the array/);
});

test('keeps a pending handler from running twice, and stays open when it fails', () => {
  assert.match(contract.execution.async, /refuses to execute the same item again/);
  assert.match(contract.execution.async, /on rejection it stays open/);
  assert.match(contract.execution.event, /keepOpen\(\)/);
});

test('declares every part the anatomy draws, and no more', () => {
  assert.deepEqual(member.parts, [
    'root',
    'trigger',
    'header',
    'search',
    'busy',
    'pages',
    'page',
    'input',
    'clear',
    'close',
    'list',
    'group',
    'group-label',
    'item',
    'icon',
    'label',
    'match',
    'description',
    'meta',
    'shortcut',
    'arrow',
    'separator',
    'empty',
    'status',
    'placeholder',
    'footer',
    'hint',
  ]);
  assert.equal(contract.waiting.busy.ui, 'spinner');
  assert.equal(contract.waiting.placeholder.ui, 'skeleton');
  assert.equal(contract.mark.family, 'highlight');
});

/** Every default a reference page has to print, and every axis a provider sets once. */
test('lets an application set every axis once, and reads every word from the catalog', () => {
  for (const axis of Object.keys(contract.axes)) {
    if (axis === 'loading' || axis === 'disabled') continue;
    assert.ok(
      contract.provides.commandPaletteDefaults.includes(axis),
      `${axis} is not in defaults`,
    );
  }
  for (const key of [
    'label',
    'input',
    'placeholder',
    'empty',
    'loading',
    'error',
    'count',
    'recent',
    'clear',
    'close',
    'back',
    'hintNavigate',
    'hintSelect',
    'hintClose',
    'hintBack',
  ]) {
    assert.ok(contract.messages.includes(key), `${key} is not a message`);
  }
  for (const [axis, [source, fallback, value]] of Object.entries(contract.resolution)) {
    assert.deepEqual([source, fallback], ['prop', 'defaults'], axis);
    assert.equal(member.defaults[axis], value, `${axis} default disagrees with resolution`);
  }
});

test('answers its own width with a literal breakpoint on a named container', () => {
  assert.equal(contract.responsive.container, 'command-palette');
  assert.equal(contract.responsive.breakpoint, '360px');
});

test('writes every declined capability with its owner or its composition', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 40, `${name} is declined without a reason`);
  }
  assert.equal(contract.declined.virtualization.deferTo, 'collection');
  assert.equal(contract.declined.checkedItems.deferTo, 'menu');
  assert.match(contract.declined.itemShortcuts.reason, /matchesShortcut/);
});
