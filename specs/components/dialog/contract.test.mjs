import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const dialog = contract.members.dialog;
const alert = contract.members.alertDialog;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'dialog');
  assert.equal(contract.ui, 'dialog');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * An alert dialog is a dialog, and a consumer writing `[data-ui='dialog']` in
 * their own stylesheet means every dialog. Two identifiers would mean two
 * stylesheets restating one layer, one panel geometry, one scroll model and one
 * forced-colors rule, because `packages/styles/src/identity.test.mjs` refuses
 * a family stylesheet that keys on another family's identifier. `button` took
 * the same reading for `iconButton`, which `docs/component-features.md` also
 * gives a section of its own.
 */
test('ships the alert dialog as a member rather than as a second identifier', () => {
  assert.deepEqual(Object.keys(contract.members), ['dialog', 'alertDialog']);
  assert.equal(alert.role, 'alertdialog');
  assert.equal(dialog.role, 'dialog');
});

test('cites both patterns it answers rather than claiming to have checked them', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.equal(contract.alertPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/');
});

/**
 * The modal dialog pattern's whole table. `Escape` is the family's own; the
 * two tab keys are the platform's order with the wrap the pattern requires,
 * which is `@slotted/core/focus`'s.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, ['Tab', 'Shift+Tab', 'Escape']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
  }
  assert.match(contract.keyboard[0].effect, /wrap|first tabbable/i);
  assert.match(contract.keyboard[1].effect, /wrap|last tabbable/i);
});

/**
 * Two layers, one Escape. `dismissable-layer` asks the topmost layer only, and
 * a layer that refuses stops the request reaching the one beneath it — which is
 * what keeps one Escape from closing a dialog and its parent together.
 */
test('gives Escape to the topmost layer alone', () => {
  assert.match(contract.keyboard[2].effect, /topmost/);
  assert.equal(contract.escapeBound, true);
});

test('declares a state model for the one value a consumer can own', () => {
  for (const member of [dialog, alert]) {
    assert.ok(member.capabilities.includes('open'));
  }
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: [
      'pointer',
      'keyboard',
      'dismiss',
      'escape',
      'outsidePress',
      'back',
      'submit',
      'programmatic',
    ],
    result: 'the value of the close, cancel or action part that was pressed',
  });
});

/**
 * Six ways to close, one request. Radix reports the same policy through
 * `onOpenChange`, `onEscapeKeyDown`, `onPointerDownOutside` and
 * `onInteractOutside`, and a consumer refusing a close while a form saves
 * writes the guard three times.
 */
test('names one reason for every source that can close it', () => {
  const sources = Object.entries(contract.reasons);
  assert.deepEqual(
    sources.map(([source]) => source),
    ['trigger', 'close', 'cancel', 'action', 'escape', 'outsidePress', 'back', 'handle'],
  );
  for (const [source, reason] of sources) {
    for (const value of [reason].flat()) {
      assert.ok(CHANGE_REASONS.includes(value), `${source} emits the unknown reason ${value}`);
      assert.ok(
        contract.stateModel.open.reasons.includes(value),
        `${source} emits ${value}, which the state model does not declare`,
      );
    }
  }
});

/**
 * `docs/component-features.md` §8 names `closeButton` as a source. The reason
 * vocabulary in `docs/state-and-events.md` is closed and already holds the word
 * for what a close button means, and a twelfth reason is a change to a contract
 * outside this family.
 */
test('says what a close button means in the vocabulary that already exists', () => {
  assert.equal(contract.reasons.close, 'dismiss');
  assert.equal(contract.reasons.cancel, 'dismiss');
  assert.equal(contract.reasons.action, 'submit');
});

/** The result is what the platform calls `returnValue`, on the request. */
test('carries the result out on the request rather than as a second state', () => {
  assert.ok('result' in contract.stateModel.open);
  assert.deepEqual(Object.keys(contract.stateModel), ['open', 'fullscreen']);
  assert.ok(contract.result.parts.every((part) => dialog.parts.concat(alert.parts).includes(part)));
});

test('declares the anatomy each member renders', () => {
  assert.deepEqual(dialog.parts, [
    'root',
    'trigger',
    'backdrop',
    'viewport',
    'content',
    'header',
    'title',
    'description',
    'body',
    'footer',
    'close',
    'fullscreen',
  ]);
  assert.deepEqual(alert.parts, [
    'root',
    'trigger',
    'backdrop',
    'viewport',
    'content',
    'header',
    'icon',
    'title',
    'description',
    'body',
    'footer',
    'cancel',
    'action',
  ]);
});

/**
 * A confirmation is answered, not dismissed by an ✕ in the corner: a corner ✕
 * beside Cancel is two controls for one outcome, and the one in the corner
 * gives no reading of which outcome it takes.
 */
test('gives the alert dialog an explicit pair of actions and no close button', () => {
  assert.ok(!alert.parts.includes('close'));
  assert.ok(alert.parts.includes('cancel') && alert.parts.includes('action'));
});

/**
 * The two rules `docs/component-features.md` §8 states. They are defaults of a
 * member rather than props a consumer sets, because Ark and React Aria make the
 * role a prop and a consumer who sets it and forgets the dismissal policy ships
 * a destructive confirmation a stray click dismisses.
 */
test('fixes the alert dialog’s dismissal policy rather than leaving it to a prop', () => {
  assert.equal(alert.defaults.outsidePress, 'none');
  assert.equal(alert.fixed.outsidePress, true);
  assert.equal(alert.defaults.modal, true);
  assert.equal(alert.fixed.modal, true);
  assert.equal(dialog.defaults.outsidePress, 'close');
  assert.ok(!('outsidePress' in (dialog.fixed ?? {})));
});

/** The APG's own advice for a step that is not easily reversible. */
test('focuses the least destructive action in an alert dialog', () => {
  assert.equal(alert.defaults.initialFocus, 'cancel');
  assert.equal(dialog.defaults.initialFocus, 'first');
});

/**
 * The alert dialog pattern requires `aria-describedby`; the modal dialog
 * pattern makes it optional and advises against it for structured content.
 */
test('requires a description of the alert dialog and not of the dialog', () => {
  assert.equal(contract.wiring.alertDescription, 'required');
  assert.match(contract.wiring['aria-describedby'], /when a description part is present/);
});

/**
 * The APG warns that marking a dialog modal when the application does not make
 * the background inert has severe consequences for the readers who rely on it.
 */
test('writes aria-modal only where the background is actually inert', () => {
  assert.match(contract.wiring['aria-modal'], /modal/);
  assert.match(contract.wiring['aria-modal'], /inert/);
});

/** `aria-haspopup` has no `alertdialog` token; `dialog` is correct for both. */
test('names the popup the trigger opens with the only token that exists', () => {
  assert.equal(contract.wiring['aria-haspopup'], 'dialog on the trigger of both members');
});

/**
 * A scrim inside the box that scrolls scrolls away with it, and a scrim outside
 * that box cannot be a cell of the same grid. Base UI reached the same third
 * element and calls it `Viewport`; Ark calls it `Positioner`.
 */
test('separates the box that scrolls from the box the scrim is painted on', () => {
  for (const member of [dialog, alert]) {
    assert.ok(member.parts.includes('viewport'));
    assert.ok(member.parts.indexOf('backdrop') < member.parts.indexOf('viewport'));
  }
  assert.match(contract.anatomy.viewport, /scrolls away/);
});

test('answers its own inline size at a literal breakpoint, as CSS requires', () => {
  assert.equal(contract.container.name, 'slotted-dialog');
  assert.equal(typeof contract.container.fullScreen, 'number');
  assert.match(contract.container.reason, /custom property/);
});

test('declares every axis it resolves and where each value comes from', () => {
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(axis in contract.resolution, `${axis} declares no resolution order`);
    assert.equal(
      contract.resolution[axis][0],
      'prop',
      `${axis} does not let an explicit consumer value win`,
    );
  }
  for (const axis of Object.keys(contract.resolution)) {
    assert.ok(axis in contract.axes, `${axis} resolves a value that is not an axis`);
  }
});

test('lets an application set its defaults once', () => {
  for (const axis of contract.provides.dialogDefaults) {
    assert.ok(contract.resolution[axis].includes('defaults'), `${axis} ignores the provider`);
  }
});

/**
 * A layer that is not in the DOM has nothing to transition, and a layer that
 * stays in it holds its controls in the page tab sequence. `active` is the
 * default because `@slotted/core/presence` keeps the layer mounted for its own
 * exit, so nothing is lost by removing it once the exit is over.
 */
test('says what each mount value keeps and which one is the default', () => {
  assert.deepEqual(
    Object.keys(contract.mount).filter((key) => contract.axes.mount.includes(key)),
    ['active', 'lazy', 'eager'],
  );
  assert.equal(contract.mount.default, 'active');
  assert.equal(dialog.defaults.mount, 'active');
});

/**
 * The gap §4 of the capability inventory records: Radix and React Aria ship no
 * layout, so a long body pushes the actions past the fold and the reader cannot
 * reach Save.
 */
test('keeps the footer on screen by bounding the row that scrolls', () => {
  assert.equal(contract.scroll.content, 'the body scrolls; the header and the footer stay');
  assert.equal(contract.scroll.default, 'content');
  assert.match(contract.scroll.reason, /footer/);
});

/**
 * A header holds more than the four parts the family places: a badge beside the
 * title, a breadcrumb, a second line the consumer wrote. Before this the words
 * column was two fixed rows and anything else auto-placed into whatever cell
 * happened to be free — column one when no icon was rendered — so where a
 * consumer's own element landed was an accident of the grid rather than a rule.
 */
/**
 * The panel takes the layer on the reader's own word, and the word is a
 * control in the header rather than a size the consumer chose in advance.
 * `fullScreen` is the responsive rule — what a narrow container does — and it
 * is not this: a reader who wants the whole layer for a table says so while
 * they are reading it, and says it again to go back.
 *
 * The two are one hyphen apart on purpose. `data-full-screen` is the axis and
 * carries `never`, `narrow` or `always`; `data-fullscreen` is the reader's own
 * state and is present or absent. The geometry they produce is the same rule,
 * written once.
 */
test('lets the reader take the layer, and says so apart from the responsive rule', () => {
  assert.equal(dialog.defaults.fullscreenToggle, false);
  assert.ok(dialog.parts.includes('fullscreen'));
  assert.ok(contract.header.parts.includes('fullscreen'));
  assert.equal(contract.stateAttributes.fullscreen, 'data-fullscreen');
  assert.ok(dialog.states.includes('fullscreen'));
  assert.ok(!alert.states.includes('fullscreen'));
  assert.deepEqual(contract.stateModel.fullscreen, {
    controlled: 'fullscreen',
    uncontrolled: 'defaultFullscreen',
    request: 'onFullscreenChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  /* The confirmation has no corner controls at all: no close, no toggle. */
  assert.ok(!alert.parts.includes('fullscreen'));
  assert.equal(alert.defaults.fullscreenToggle, undefined);
});

test('gives a consumer’s own header content a column of its own to land in', () => {
  assert.equal(contract.header.free, 'the words column, under the description');
  assert.match(contract.header.reason, /auto-plac/i);
});

/**
 * The layer is the mechanism and the panel is the picture, and a consumer who
 * wants the first without the second had no way to say so: `render` substitutes
 * the panel's element and keeps `data-part="content"`, so the family's surface,
 * border, radius and rows came with it. `plain` is the family's whole visual
 * layer turned off, with presence, containment, dismissal and the scrim intact.
 */
test('lets a consumer bring their own panel and keep the layer', () => {
  assert.deepEqual(contract.axes.surface, ['panel', 'plain']);
  assert.equal(contract.members.dialog.defaults.surface, 'panel');
  assert.equal(contract.members.alertDialog.defaults.surface, 'panel');
  assert.match(contract.surface.plain, /no background|paints nothing/i);
  assert.match(contract.surface.keeps, /presence|focus|dismiss/i);
});

test('declares the states each member paints', () => {
  for (const member of [dialog, alert]) {
    assert.ok(member.states.includes('open'));
    assert.ok(member.states.includes('loading'));
  }
  assert.equal(contract.stateAttributes.open, 'data-open');
  assert.equal(contract.stateAttributes.loading, 'data-loading');
});

/**
 * Declining the platform element is the largest decision the family takes, and
 * the contract carries it so a reader meets it before the implementation.
 */
test('writes the cost of declining the element the platform already ships', () => {
  const declined = contract.declined.dialogElement;
  assert.match(declined.reason, /top layer/);
  assert.match(declined.cost, /JavaScript|script/);
  assert.ok(declined.revisitWhen.length > 0);
});

test('names the family that owns each capability it does not', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(
      entry.reason?.length > 0 || entry.deferTo?.length > 0,
      `${name} is declined with no reason and no family to defer to`,
    );
  }
  assert.equal(contract.declined.dragAndResize.deferTo, 'floating-window');
  assert.equal(contract.declined.edgePlacement.deferTo, 'drawer');
});

test('declares a scenario page for each member', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['dialog', 'alertDialog']);
  for (const ids of Object.values(contract.scenarios)) {
    assert.ok(ids.includes('playground'));
    assert.ok(ids.includes('accessibility'));
  }
});
