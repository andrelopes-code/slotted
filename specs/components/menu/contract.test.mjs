import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.menu;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'menu');
  assert.equal(contract.ui, 'menu');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The pattern is sourced, not recalled. Two pages answer this family: the
 * menubar pattern owns everything inside the surface, and the menu button
 * pattern owns the four keys on the control that opens it.
 */
test('cites both pages of the pattern it answers', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/');
  assert.equal(contract.triggerPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/');
  assert.deepEqual(contract.roles, {
    content: 'menu',
    item: 'menuitem',
    checkboxItem: 'menuitemcheckbox',
    radioItem: 'menuitemradio',
    group: 'group',
    separator: 'separator',
  });
});

/**
 * Every key the two pages list, in the order the menubar page lists them, each
 * saying what it does and where focus lands. A key table missing `ArrowLeft`
 * is a family that cannot close a submenu.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Enter',
    'Space',
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
    'Printable character',
    'Escape',
    'Tab',
    'Shift+Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
});

/** The inline axis is where a submenu lives, so both arrows mirror. */
test('mirrors the inline axis rather than binding a physical direction', () => {
  const inlineEnd = contract.keyboard.find((entry) => entry.key === 'ArrowRight');
  const inlineStart = contract.keyboard.find((entry) => entry.key === 'ArrowLeft');
  assert.match(inlineEnd.effect, /right-to-left|inline/i);
  assert.match(inlineStart.effect, /right-to-left|inline/i);
});

test('declares a state model for each of the three values a consumer can own', () => {
  for (const capability of ['open', 'checked', 'selection']) {
    assert.ok(member.capabilities.includes(capability), `${capability} is not declared`);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability), `${capability} is not mutable`);
  }
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'select', 'dismiss', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.checked, {
    controlled: 'checked',
    uncontrolled: 'defaultChecked',
    request: 'onCheckedChange',
    reasons: ['pointer', 'keyboard'],
  });
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard'],
  });
});

/**
 * `select` is what tells a consumer that the menu closed because an item ran,
 * rather than because the reader dismissed it. A boolean cannot say so.
 */
test('separates a selection from a dismissal in the reason it reports', () => {
  assert.ok(contract.stateModel.open.reasons.includes('select'));
  assert.ok(contract.stateModel.open.reasons.includes('escape'));
  assert.ok(contract.stateModel.open.reasons.includes('outsidePress'));
});

test('composes the core modules and rewrites none of them', () => {
  assert.deepEqual(contract.composes, [
    'positioner',
    'presence',
    'portal',
    'dismissable-layer',
    'focus',
    'typeahead',
    'pointer-intent',
  ]);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.scrollLock, false);
  assert.equal(contract.layer.zIndexToken, '--slotted-z-index-popover');
  assert.ok(contract.layer.branches.length > 0);
});

/** The two modules this family adds to shared ground, each with its reason. */
test('says which shared ground it had to add, and why', () => {
  assert.equal(contract.adds.typeahead.module, 'packages/core/src/typeahead');
  assert.match(contract.adds.typeahead.reason, /locale/i);
  assert.equal(contract.adds.typeahead.nextConsumer, 'listbox');
  assert.equal(contract.adds.pointerIntent.module, 'packages/core/src/pointer-intent');
  assert.match(contract.adds.pointerIntent.reason, /submenu/i);
  assert.equal(contract.adds.pointerIntent.nextConsumer, 'preview-card');
});

/** A submenu is this same family, and the three things that change say so. */
test('makes a submenu the same family opened from an item', () => {
  assert.equal(contract.submenu.family, 'menu');
  assert.equal(contract.submenu.trigger, 'item');
  assert.equal(contract.submenu.side, 'inline-end');
  assert.equal(contract.submenu.align, 'start');
  assert.ok(contract.submenu.openDelay > 0);
  /* The submenu block and the member's defaults state one delay, not two. */
  assert.equal(contract.submenu.openDelay, member.defaults.submenuOpenDelay);
  assert.equal(contract.submenu.closeDelay, member.defaults.submenuCloseDelay);
  assert.equal(contract.submenu.graceArea, 'pointer-intent');
  assert.match(contract.submenu.reason, /composition|same family/i);
});

test('says where focus goes on open, on select, and on dismissal', () => {
  assert.equal(contract.focus.onOpen, 'first item');
  assert.equal(contract.focus.restore, 'trigger');
  assert.equal(contract.focus.contained, false);
  assert.equal(contract.focus.roving, true);
  assert.match(contract.focus.disabledItems, /focusable/i);
  assert.ok(contract.focus.finalFocus.reason.length > 0);
});

/**
 * `popover` needed two focus guards because Tab inside a non-modal portalled
 * layer had nowhere to go. A menu answers Tab itself, so it needs none.
 */
test('needs no focus guard, because Tab is a key the pattern already binds', () => {
  assert.equal(contract.focus.guards, false);
  assert.match(contract.focus.guardsReason, /Tab/);
});

test('names every part, and no part it does not own', () => {
  assert.deepEqual(member.parts, [
    'root',
    'content',
    'header',
    'group',
    'group-label',
    'item',
    'indicator',
    'icon',
    'label',
    'description',
    'meta',
    'shortcut',
    'separator',
    'empty',
  ]);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'disabled',
    'checked',
    'loading',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    open: 'data-open',
    disabled: 'data-disabled',
    checked: 'data-checked',
    loading: 'data-loading',
  });
  assert.ok(contract.declined.triggerPart.reason.includes("data-part='root'"));
});

/** Each decline names the family that owns the capability instead. */
test('declines nothing without naming what owns it instead', () => {
  assert.equal(contract.declined.modal.deferTo, 'dialog');
  assert.equal(contract.declined.contextTrigger.deferTo, 'context-menu');
  assert.equal(contract.declined.longPress.deferTo, 'context-menu');
  assert.equal(contract.declined.filtering.deferTo, 'combobox');
  assert.equal(contract.declined.virtualization.deferTo, 'collection');
  assert.equal(contract.declined.arrow.deferTo, 'popover');
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
});

/**
 * The shortcut is resolved for the platform and announced, which is the one
 * thing no surveyed implementation does with it.
 */
test('treats a shortcut as a binding rather than as decorative text', () => {
  assert.equal(contract.shortcut.part, 'shortcut');
  assert.equal(contract.shortcut.resolvedBy, '@slotted/core/keys');
  assert.equal(contract.shortcut.announcedBy, 'aria-keyshortcuts');
  assert.equal(contract.shortcut.bound, false);
});

test('bounds the surface by the room the positioner reports', () => {
  assert.equal(contract.overflow.part, 'content');
  assert.equal(contract.overflow.property, '--slotted-positioner-available-height');
  assert.ok(contract.runtimeProperties.includes('--slotted-positioner-available-height'));
  assert.ok(contract.runtimeProperties.includes('--slotted-layer-depth'));
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

test('lets an application set every axis once', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(contract.provides.menuDefaults.includes(axis), `${axis} is not in the provider`);
  }
});

test('declares a scenario for every capability a reference page has to prove', () => {
  assert.deepEqual(contract.scenarios.menu, [
    'playground',
    'commands',
    'icons',
    'shortcuts',
    'checkbox-items',
    'radio-items',
    'groups',
    'submenu',
    'submenu-open',
    'header',
    'meta',
    'tone',
    'placement',
    'scrolling',
    'states',
    'keyboard',
    'composition',
  ]);
});

/**
 * The block at the top of an account or workspace menu. It is not an item:
 * the arrows and typeahead never reach it, and the surface names it as its
 * description, so a reader hears who the menu belongs to as it opens.
 */
test('describes the surface with a header the ring never enters', () => {
  assert.equal(contract.header.part, 'header');
  assert.equal(contract.header.focusable, false);
  assert.equal(contract.header.announcedBy, 'aria-describedby');
  assert.match(contract.header.reason, /menuitem|group|separator/);
});

/**
 * Content at the end of an item that is not a shortcut: a count, a status, the
 * value a submenu holds. It reads with the item and never feeds typeahead.
 */
test('gives an item a meta column of its own, outside typeahead', () => {
  assert.equal(contract.meta.part, 'meta');
  assert.equal(contract.meta.column, 3);
  assert.equal(contract.meta.typeahead, false);
  assert.equal(contract.shortcut.part, 'shortcut');
});
