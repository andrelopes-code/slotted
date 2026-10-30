import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const sheet = contract.members['action-sheet'];
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'action-sheet');
  assert.equal(contract.ui, 'action-sheet');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * No APG pattern describes an action sheet. The layer is the modal dialog
 * pattern and the list is the menu pattern, and both are cited rather than
 * claimed.
 */
test('cites both patterns it answers', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.equal(contract.listPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/');
});

/**
 * The scope paragraph says the family composes drawer, and since the bottom
 * sheet reopening of 2026-09-25 it does: drawer measures its content and caps
 * its width, which were the two facts that kept the family apart
 *.
 */
test('composes drawer for the layer and keeps only the menu', () => {
  assert.deepEqual(contract.composes, ['drawer', 'focus', 'typeahead', 'state']);
  assert.match(contract.identity.reason, /inside drawer's panel/);
  assert.match(contract.identity.reason, /grid-row: 1 \/ -1/);
  assert.ok(contract.identity.cost.length > 0, 'the cost of the composition is not written down');
});

test('is a dialog that holds a menu', () => {
  assert.match(contract.wiring.role, /^dialog on the panel/);
  assert.match(contract.wiring.listRole, /^menu on the list/);
  assert.match(contract.wiring.itemRole, /^menuitem/);
  assert.match(contract.wiring['aria-modal'], /only while modal/);
  assert.match(contract.wiring['aria-haspopup'], /^dialog/);
});

/**
 * The dialog's two tab keys and Escape, then the menu's keys. Tab does not
 * close, which is the one departure from the menu pattern, and it is written.
 */
test('answers every key both patterns list, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Tab',
    'Shift+Tab',
    'Escape',
    'ArrowDown',
    'ArrowUp',
    'Home',
    'End',
    'Printable character',
    'Enter',
    'Space',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who answers it`);
  }
  assert.match(contract.keyboard[0].effect, /does not close/);
  assert.match(contract.keyboard[2].effect, /topmost/);
  assert.ok(contract.departures.tabStaysInside.cost.length > 0);
});

/**
 * The dialog pattern's first note: a dialog whose first action is not easily
 * reversible puts focus on the least destructive one.
 */
test('enters on the least destructive action', () => {
  assert.match(contract.focus.initial, /first enabled item/);
  assert.match(contract.focus.initial, /tone=danger/);
  assert.match(contract.focus.initial, /cancel/);
  assert.match(contract.focus.restore, /outsidePress/);
});

test('declares one state model, whose close carries the chosen value', () => {
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.ok(sheet.capabilities.includes('open'));
  assert.deepEqual(Object.keys(contract.stateModel), ['open']);
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: [
      'pointer',
      'keyboard',
      'select',
      'dismiss',
      'escape',
      'outsidePress',
      'back',
      'programmatic',
    ],
    result: 'the value of the item that was selected, when the reason is select',
  });
  for (const reason of contract.stateModel.open.reasons) assert.ok(CHANGE_REASONS.includes(reason));
});

test('maps every source of a change to its reason', () => {
  assert.deepEqual(contract.reasons, {
    trigger: ['pointer', 'keyboard'],
    item: 'select',
    cancel: 'dismiss',
    escape: 'escape',
    outsidePress: 'outsidePress',
    back: 'back',
    handle: 'programmatic',
  });
});

test('declares its anatomy, every part described', () => {
  assert.deepEqual(sheet.parts, [
    'root',
    'trigger',
    'header',
    'title',
    'message',
    'list',
    'group',
    'group-label',
    'item',
    'icon',
    'label',
    'description',
    'separator',
    'footer',
    'cancel',
  ]);
  for (const part of sheet.parts) {
    assert.ok(contract.anatomy[part]?.length > 0, `${part} is not described`);
  }
});

test('paints every state the pattern gives an item', () => {
  assert.deepEqual(sheet.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'disabled',
    'loading',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    open: 'data-open',
    disabled: 'data-disabled',
    loading: 'data-loading',
  });
});

/**
 * The item vocabulary is menu's, word for word, so a list of actions maps to
 * either family at the application's breakpoint.
 */
test('shares the item vocabulary with menu', async () => {
  const menu = JSON.parse(
    await readFile(new URL('../menu/contract.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(contract.item.tones, ['accent', 'secondary', 'success', 'warning', 'danger']);
  for (const prop of [
    'value',
    'textValue',
    'icon',
    'description',
    'tone',
    'disabled',
    'closeOnSelect',
    'onSelect',
  ]) {
    assert.ok(contract.item.props.includes(prop), `${prop} is missing from the item`);
  }
  for (const part of [
    'item',
    'icon',
    'label',
    'description',
    'group',
    'group-label',
    'separator',
  ]) {
    assert.ok(menu.members.menu.parts.includes(part), `${part} is not a menu part`);
  }
});

test('waits in the item that started the work', () => {
  assert.match(contract.item.loading, /spinner/);
  assert.match(contract.item.loading, /aria-busy/);
  assert.match(contract.item.loading, /refuses activation/);
});

/**
 * A control's height, which the theme raises to the comfortable target under a
 * coarse pointer. A fixed 44 pixels made the sheet a phone's sheet on a desktop.
 */
test('takes the touch target from the theme under a coarse pointer, not at every width', () => {
  assert.match(contract.geometry.item, /--slotted-control-height-lg/);
  assert.match(contract.geometry.item, /pointer: coarse/);
  assert.match(contract.geometry.label, /--slotted-font-size-md/);
  assert.match(contract.geometry.label, /--slotted-font-size-lg/);
  assert.match(contract.geometry.measure, /--slotted-action-sheet-inline-size/);
  assert.match(contract.geometry.measure, /--slotted-drawer-sheet-inline-size/);
  assert.match(contract.geometry.safeArea, /safe-area-inset-bottom/);
  assert.match(contract.geometry.scroll, /list/);
});

test('declares its axes and resolves each from prop, defaults and family', () => {
  assert.deepEqual(contract.axes, {
    modal: [true, false],
    mount: ['active', 'lazy', 'eager'],
    escape: ['close', 'none'],
    outsidePress: ['close', 'none'],
    back: ['close', 'none'],
    closeOnSelect: [true, false],
  });
  for (const axis of Object.keys(contract.axes)) {
    assert.deepEqual(contract.resolution[axis], ['prop', 'defaults', 'family']);
  }
  assert.deepEqual(contract.provides.actionSheetDefaults, [
    'modal',
    'mount',
    'escape',
    'outsidePress',
    'back',
    'closeOnSelect',
  ]);
  assert.equal(sheet.defaults.modal, true);
  assert.equal(sheet.defaults.mount, 'active');
  assert.equal(sheet.defaults.closeOnSelect, true);
});

/** A scrim is the promise of an inert page, and a non-modal sheet keeps the page live. */
test('paints the scrim only while modal', () => {
  assert.match(contract.modal.false, /scrimFrom/);
  assert.match(contract.modal.false, /no scrim is painted/);
});

/** Every table-stakes row the family does not ship names who owns it instead. */
test('names the owner or the composition of everything it declines', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} gives no reason`);
    assert.ok(
      'deferTo' in entry || 'replacedBy' in entry,
      `${name} names neither an owner nor a composition`,
    );
  }
  for (const name of [
    'controller',
    'radioItems',
    'boldItem',
    'headerClose',
    'translucent',
    'grabber',
    'dragAxis',
  ]) {
    assert.ok(name in contract.declined, `${name} is not declined in writing`);
  }
  for (const name of ['dragToDismiss', 'drawerParts']) {
    assert.ok(!(name in contract.declined), `${name} is still declined though drawer now owns it`);
  }
  assert.match(contract.drag, /pointer/);
});

test('declares a scenario for each capability a reference page demonstrates', () => {
  assert.deepEqual(contract.scenarios['action-sheet'], [
    'playground',
    'destructive',
    'groups',
    'content',
    'loading',
    'modal',
    'policy',
    'focus',
    'result',
    'responsive',
    'defaults',
    'accessibility',
  ]);
});
