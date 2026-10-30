import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS, stateModels } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.cascader;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'cascader');
  assert.equal(contract.ui, 'cascader');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The family is the hierarchical picker the build order reserved: one core,
 * three layouts. A layout is the recipe; the value, the search and the
 * loading are the same in all three.
 */
test('answers the hierarchical-picker scope with three layouts over one core', () => {
  assert.equal(contract.scope.replaces, 'hierarchical-picker');
  assert.deepEqual(contract.axes.layout, ['auto', 'columns', 'drill', 'tree']);
  assert.equal(member.defaults.layout, 'auto');
  assert.match(contract.layout.auto, /columns/);
  assert.match(contract.layout.auto, /drill/);
  assert.equal(contract.layout.module, 'packages/core/src/cascader');
});

/**
 * The popup never widens past what the room holds, and never scrolls
 * sideways: a path deeper than the window slides it, and the levels left
 * behind go to the breadcrumb. The widest width is known as the popup opens,
 * so the layer is placed against it and does not move as the path grows.
 */
test('bounds the width it can reach, and slides a deep path instead of growing', () => {
  assert.equal(member.defaults.maxColumns, 3);
  assert.ok(contract.provides.cascaderDefaults.includes('maxColumns'));
  assert.match(contract.layout.window, /cascaderWindow/);
  assert.match(contract.layout.window, /breadcrumb/);
  assert.match(contract.layout.placement, /widest/);
  assert.equal(contract.layout.scroll, 'none on the inline axis');
  assert.equal(member.defaults.maxCrumbs, 4);
  assert.match(contract.layout.crumbs, /cascaderCrumbs/);
});

test('declares every part of the anatomy', () => {
  assert.deepEqual(member.parts, [
    'root',
    'trigger',
    'value',
    'value-segment',
    'value-separator',
    'placeholder',
    'tags',
    'summary',
    'clear',
    'busy',
    'arrow',
    'positioner',
    'content',
    'search',
    'search-input',
    'breadcrumb',
    'crumb',
    'panel',
    'column',
    'node',
    'indicator',
    'icon',
    'label',
    'match',
    'description',
    'meta',
    'expander',
    'loader',
    'status',
    'empty',
  ]);
});

/**
 * A tree popup in every layout. A listbox per level would need aria-haspopup
 * and aria-expanded on an option, which the option role does not support.
 */
test('follows the combobox pattern with a tree popup', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/');
  assert.equal(contract.treePattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/');
  assert.deepEqual(contract.roles, {
    trigger: 'combobox',
    panel: 'tree',
    column: 'group',
    node: 'treeitem',
    breadcrumb: 'navigation',
    status: 'status',
  });
  assert.deepEqual(contract.searchRoles, {
    content: 'dialog',
    'search-input': 'combobox',
  });
  assert.match(contract.wiring['aria-haspopup'], /tree/);
  assert.match(contract.wiring['aria-haspopup'], /dialog/);
  assert.match(contract.wiring['aria-checked'], /mixed/);
});

test('models every mutable value with its reasons', () => {
  const models = Object.fromEntries(
    Object.entries(contract.stateModel).flatMap(([capability, entry]) =>
      stateModels(entry).map((model) => [model.controlled, { capability, ...model }]),
    ),
  );
  assert.deepEqual(Object.keys(models).sort(), [
    'activeKey',
    'expandedKeys',
    'open',
    'path',
    'searchValue',
    'value',
  ]);
  assert.equal(models.value.capability, 'selection');
  assert.equal(models.searchValue.capability, 'value');
  assert.equal(models.open.capability, 'open');
  assert.equal(models.expandedKeys.capability, 'open');
  assert.equal(models.path.capability, 'current');
  assert.equal(models.activeKey.capability, 'current');
  for (const entry of Object.values(models)) {
    for (const reason of entry.reasons) assert.ok(CHANGE_REASONS.includes(reason));
  }
});

test('holds keys as the value, a scalar for one and a list for many', () => {
  assert.equal(contract.value.single, 'string | null');
  assert.equal(contract.value.multiple, 'readonly string[]');
  assert.deepEqual(contract.selection.selectable, ['leaf', 'any', 'predicate']);
  assert.deepEqual(contract.selection.checkedStrategy, ['all', 'parent', 'child']);
  assert.equal(contract.selection.cascade, 'cascadeSelection');
});

/**
 * The family holds no collection of its own, as tree does not: a branch that
 * has children it does not yet hold asks for them, and the answer arrives in
 * the consumer's items.
 */
test('asks for a level it does not hold, and aborts what it no longer needs', () => {
  assert.equal(contract.lazy.owner, 'the consumer');
  assert.deepEqual(contract.lazy.inputs, ['hasChildren', 'loading', 'invalid']);
  assert.equal(contract.lazy.part, 'loader');
  assert.match(contract.lazy.abort, /AbortSignal/);
});

test('searches every level and keeps the path of each result', () => {
  assert.equal(contract.search.module, 'packages/core/src/collection/filter.ts');
  assert.match(contract.search.result, /path/);
  assert.equal(contract.search.highlight, 'match');
});

/**
 * Every key the tree popup section of the combobox pattern lists, plus the
 * trigger's own and the family's Space. A departure is written, not hidden.
 */
test('answers every key the pattern lists, and writes its one departure', () => {
  assert.deepEqual(keys, [
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
    'Enter',
    'Space',
    'Escape',
    'Printable character',
    'Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  const right = contract.keyboard.find((entry) => entry.key === 'ArrowRight');
  assert.match(right.effect, /right-to-left/);
  assert.equal(contract.departures.verticalArrows.layouts.join(','), 'columns,drill');
  assert.ok(contract.departures.verticalArrows.cost.length > 0);
});

test('offers the axes with their defaults and lets an application set them once', () => {
  for (const axis of Object.keys(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.ok(Array.isArray(resolution), `${axis} declares no resolution order`);
    assert.deepEqual(resolution.slice(0, 2), ['prop', 'defaults'], axis);
    assert.deepEqual(member.defaults[axis], resolution[2], `${axis} default disagrees`);
    assert.ok(contract.provides.cascaderDefaults.includes(axis), `${axis} is not in the provider`);
  }
});

test('records what it declines and where each one lives instead', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
    assert.ok(entry.deferTo ?? entry.compose, `${name} names no owner and no composition`);
  }
});

test('declares one page of demonstrations for every scenario', () => {
  assert.deepEqual(contract.scenarios.cascader, [
    'playground',
    'columns',
    'drill',
    'tree',
    'layout-auto',
    'search',
    'multiple',
    'any-level',
    'lazy',
    'value-path',
    'panel',
    'states',
    'keyboard',
    'composition',
  ]);
});
