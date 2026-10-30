import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.navigationMenu;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'navigation-menu');
  assert.equal(contract.ui, 'navigation-menu');
  assert.equal(contract.schemaVersion, 5);
  assert.equal(contract.catalog.group, 'Navigation');
});

/**
 * Disclosure, never menu: the destinations are links, and the APG's own
 * caution says menubar demands a keyboard site navigation does not need.
 */
test('cites the disclosure navigation example and writes no menu role', () => {
  assert.equal(
    contract.pattern,
    'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
  );
  assert.equal(contract.roles.root, 'navigation | none');
  assert.equal(contract.roles.trigger, 'button');
  assert.equal(contract.roles.link, 'link');
  assert.equal(contract.roles.group, 'group');
  assert.equal(contract.element.root, 'nav | div');
  assert.equal(contract.element.content, 'div');
  assert.ok(!Object.values(contract.roles).some((role) => /menu/.test(role)));
  assert.equal(contract.rovingTabindex, false);
});

test('declares every part, the content in the item and the surface shared', () => {
  assert.deepEqual(member.parts, [
    'root',
    'list',
    'item',
    'trigger',
    'indicator',
    'link',
    'content',
    'links',
    'group',
    'group-label',
    'icon',
    'label',
    'description',
    'footer',
    'viewport',
    'arrow',
  ]);
  for (const part of member.parts) assert.ok(contract.anatomy[part], `${part} has no anatomy`);
  assert.equal(contract.content.inItem, true);
});

test('the open section is one value with a reason for every way it moves', () => {
  assert.deepEqual(
    {
      controlled: contract.stateModel.open.controlled,
      uncontrolled: contract.stateModel.open.uncontrolled,
      request: contract.stateModel.open.request,
    },
    { controlled: 'value', uncontrolled: 'defaultValue', request: 'onValueChange' },
  );
  assert.deepEqual(contract.stateModel.open.reasons, [
    'pointer',
    'keyboard',
    'escape',
    'outsidePress',
    'blur',
    'select',
    'programmatic',
  ]);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'current',
    'disabled',
  ]);
});

test('hover opens after a delay and never on touch', () => {
  assert.equal(member.defaults.openDelay, 200);
  assert.equal(member.defaults.closeDelay, 300);
  assert.equal(member.defaults.closeOnSelect, true);
  assert.match(contract.hover.touch, /touch/);
  assert.match(contract.hover.switch, /without the delay/);
});

test('the keyboard table holds the disclosure keys and the optional arrows', () => {
  for (const key of [
    'Tab',
    'Shift+Tab',
    'Enter',
    'Space',
    'Escape',
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
  ]) {
    assert.ok(keys.includes(key), `${key} is missing from the keyboard table`);
  }
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect && entry.focus, `${entry.key} has no effect or focus`);
  }
});

/** Values only script can measure, named for what they are (briefing). */
test('publishes the measured geometry under names that say so', () => {
  assert.deepEqual(Object.keys(contract.runtimeProperties), [
    '--slotted-navigation-menu-viewport-inline-size',
    '--slotted-navigation-menu-viewport-block-size',
    '--slotted-navigation-menu-viewport-inline-start',
    '--slotted-navigation-menu-viewport-block-start',
    '--slotted-navigation-menu-arrow-offset',
    '--slotted-navigation-menu-available-inline-size',
  ]);
});

test('motion between sections is stated in logical directions', () => {
  assert.deepEqual(contract.dataAttributes['data-motion'], [
    'from-start',
    'from-end',
    'to-start',
    'to-end',
  ]);
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.deepEqual(contract.axes.columns, [1, 2, 3]);
});

test('every declined capability names its owner or its composition', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason?.length > 40, `${name} declines without a reason`);
  }
  assert.ok('menuRole' in contract.declined);
});

test('writes its one word through the catalog', () => {
  assert.deepEqual(contract.messages, ['navigation']);
});

test('every scenario has a page', () => {
  assert.deepEqual(contract.scenarios.navigationMenu, [
    'playground',
    'anatomy',
    'links',
    'rich',
    'groups',
    'footer',
    'current',
    'vertical',
    'nested',
    'states',
    'size',
    'content',
    'controlled',
    'defaults',
    'composition',
    'keyboard',
    'accessibility',
  ]);
});
