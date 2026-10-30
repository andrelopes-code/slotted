import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'listbox');
  assert.equal(contract.ui, 'listbox');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A group is a part of the set rather than a family of its own, as it is in
 * `list`. One member keeps `data-ui` on exactly one element.
 */
test('is one set whose groups and options are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['listbox']);
  assert.deepEqual(contract.members.listbox.parts, [
    'root',
    'canvas',
    'group',
    'group-label',
    'option',
    'indicator',
    'icon',
    'label',
    'description',
    'meta',
    'empty',
    'loader',
  ]);
});

/** A link without the extracted lists is not evidence. */
test('cites the pattern it implements, and where the transcription lives', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/');
  assert.match(contract.patternStatus, /aria-practices/);
});

/**
 * The role replaces what `ul` and `li` would have implied, so nothing is
 * inherited and the family writes the set semantics itself.
 */
test('states the roles, and the cost of the elements it did not use', () => {
  assert.equal(contract.roles.root, 'listbox');
  assert.equal(contract.roles.option, 'option');
  assert.equal(contract.roles.group, 'group');
  assert.equal(contract.roles.canvas, 'presentation');
  assert.equal(contract.members.listbox.nativeElement, 'div');
  assert.match(contract.element.reason, /ul|li/);
  assert.match(contract.wiring['aria-setsize'], /hydration/);
});

/**
 * The pattern forbids mixing the two selection attributes, and this library's
 * `data-selected` already means the reader's own choice.
 */
test('indicates selection with one attribute and never with two', () => {
  assert.equal(contract.selection.attribute, 'aria-selected');
  assert.equal(contract.selection.forbidden, 'aria-checked');
  assert.ok(!('checked' in contract.stateAttributes));
  assert.ok(!contract.members.listbox.capabilities.includes('checked'));
});

/**
 * Focus and selection are two things. Every surveyed implementation that ships
 * one of them ships a listbox whose active option cannot be restored.
 */
test('holds two mutable values, each with its own model', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'selection']);
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'select', 'clear', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'activeKey',
    uncontrolled: 'defaultActiveKey',
    request: 'onActiveKeyChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

/**
 * Three of the four surveyed implementations give single selection a scalar.
 * The CDK's array-always shape is what makes every consumer write `value[0]`.
 */
test('gives single selection a scalar and multiple selection a set', () => {
  assert.equal(contract.value.single, 'string | null');
  assert.equal(contract.value.multiple, 'readonly string[]');
  assert.match(contract.value.reason, /value\[0\]/);
});

/** Both models the pattern offers, chosen by one axis. */
test('implements both of the selection models the pattern offers', () => {
  assert.deepEqual(contract.axes.selectionMode, ['none', 'single', 'multiple']);
  assert.deepEqual(contract.axes.selectionBehavior, ['toggle', 'replace']);
  assert.equal(contract.members.listbox.defaults.selectionBehavior, 'toggle');
  assert.match(contract.selection.models.toggle, /recommended/i);
  assert.match(contract.selection.models.replace, /alternative/i);
});

/**
 * The keyboard table is transcribed from the pattern rather than recalled, and
 * every entry says where it came from.
 */
test('transcribes the keyboard, key by key, with the source of each', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of [
    'Tab',
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
    'PageDown',
    'PageUp',
    'Space',
    'Enter',
    'Shift+ArrowDown',
    'Shift+Space',
    'Control+Shift+Home',
    'Control+Shift+End',
    'Control+A',
    'Control+ArrowDown',
    'Control+Space',
    'Printable character',
  ]) {
    assert.ok(keys.includes(key), `keyboard table omits ${key}`);
  }
  for (const entry of contract.keyboard) {
    assert.ok(['pattern', 'platform', 'departure'].includes(entry.source), entry.key);
    assert.ok(entry.effect.length > 0 && entry.focus.length > 0, entry.key);
  }
});

/** A departure may not be silent. */
test('writes the cost of every departure from the pattern', () => {
  for (const entry of contract.keyboard) {
    if (entry.source !== 'departure') continue;
    assert.ok(contract.declined.action ?? contract.departures[entry.key], entry.key);
  }
  for (const [name, departure] of Object.entries(contract.departures)) {
    assert.ok(departure.cost.length > 20, `${name} states no cost`);
  }
});

/**
 * The engine's review named the failure this axis exists to prevent: a roving
 * tab stop cannot survive its own element being recycled.
 */
test('chooses the focus model from a fact rather than asking the consumer', () => {
  assert.deepEqual(contract.axes.focusMode, ['auto', 'roving', 'activedescendant']);
  assert.equal(contract.members.listbox.defaults.focusMode, 'auto');
  assert.equal(contract.focus.auto.virtual, 'activedescendant');
  assert.equal(contract.focus.auto.otherwise, 'roving');
  assert.match(contract.focus.auto.reason, /recycl/i);
  assert.equal(contract.focus.tabStops, 1);
});

/** Windowing is a capability of the collection, and it is declared as one. */
test('declares virtualization, and names the engine that answers it', () => {
  assert.ok(contract.members.listbox.capabilities.includes('virtualization'));
  assert.equal(contract.virtual.module, 'packages/core/src/collection');
  assert.deepEqual(contract.virtual.pinned, ['the active option', 'the range anchor']);
  assert.match(contract.virtual.itemSize, /required/);
  assert.equal(contract.virtual.canvasRole, 'presentation');
});

/**
 * The pattern requires the pair exactly when the set is not fully in the DOM,
 * which is what both windowing and incremental loading produce.
 */
test('tells the reader how large the set is when it is not all present', () => {
  assert.match(contract.wiring['aria-setsize'], /not in the DOM/);
  assert.match(contract.wiring['aria-posinset'], /position|posinset/i);
  assert.equal(contract.incremental.threshold, 0);
  assert.equal(contract.incremental.request, 'onLoadMore');
  assert.deepEqual(contract.incremental.inputs, ['hasMore', 'loading', 'totalCount']);
});

/** The composition is the engine's, not a second copy of it. */
test('composes the shared modules rather than rewriting them', () => {
  assert.deepEqual(contract.composes.sort(), ['collection', 'state', 'typeahead']);
  assert.equal(contract.typeahead.module, 'typeahead');
  assert.equal(contract.typeahead.label, 'textValue, or the label part text');
  assert.equal(contract.typeahead.timeout, 500);
  assert.match(contract.navigation.module, /collection/);
  assert.match(contract.navigation.rowStep, /pageDown|columns/);
});

/** Every decline names the family or the composition that answers instead. */
test('declines nothing without naming what owns it instead', () => {
  for (const [name, declined] of Object.entries(contract.declined)) {
    assert.ok(
      typeof declined.deferTo === 'string' || typeof declined.composition === 'string',
      `${name} declines and names nothing`,
    );
    assert.ok(declined.reason.length > 40, `${name} gives no reason`);
  }
  assert.equal(contract.declined.trigger.deferTo, 'select');
  assert.equal(contract.declined.filtering.deferTo, 'combobox');
  assert.equal(contract.declined.dragToReorder.deferTo, 'drag-and-drop');
  assert.equal(contract.declined.action.deferTo, 'menu');
});

/** A form is where a listbox holds a choice, so it behaves like a control. */
test('behaves as a form control in both bindings', () => {
  for (const capability of ['readOnly', 'required', 'invalid']) {
    assert.ok(contract.members.listbox.capabilities.includes(capability), capability);
  }
  assert.equal(contract.forms.angular, 'ControlValueAccessor and Validator');
  assert.match(contract.forms.react, /hidden input/);
  assert.equal(contract.forms.name, 'name');
});

/** Density is the application's; size is this listbox's. */
test('scales in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(contract.members.listbox.defaults.size, 'md');
  assert.deepEqual(contract.axes.variant, ['plain', 'framed']);
  assert.equal(contract.members.listbox.defaults.variant, 'framed');
});

/** The consumer's own value outranks the provider and every inference. */
test('lets nothing outrank the consumer', () => {
  for (const [axis, resolution] of Object.entries(contract.resolution)) {
    assert.equal(resolution[0], 'prop', `${axis} lets something outrank the consumer`);
  }
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(axis in contract.resolution, `${axis} states no resolution order`);
  }
});

/** Every axis an application may set once is named in the provider's list. */
test('lets an application set its defaults once', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(contract.provides.listboxDefaults.includes(axis), `${axis} is not a default`);
  }
});

/**
 * Selection under forced colors is the case a tinted ground alone fails, and
 * it is the same failure WCAG 2.2 SC 1.4.1 describes for color on its own.
 */
test('says selection with a mark as well as with a ground', () => {
  assert.deepEqual(contract.axes.indicator, ['check', 'none']);
  assert.equal(contract.members.listbox.defaults.indicator, 'check');
  assert.match(contract.selection.forcedColors, /forced-colors|Canvas/);
  /* R1: without the mark the ground and the ink say it, never a rail. */
  assert.match(contract.selection.indicatorNone, /ground/i);
  assert.match(contract.selection.indicatorNone, /no rail|R1/i);
});

test('names one reference page, covering every scenario the family declares', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['listbox']);
  assert.deepEqual(contract.scenarios.listbox, [
    'playground',
    'selection',
    'behavior',
    'sections',
    'size',
    'variant',
    'layout',
    'states',
    'typeahead',
    'empty-and-loading',
    'virtualization',
    'content',
    'forms',
    'composition',
    'keyboard',
    'accessibility',
  ]);
});
