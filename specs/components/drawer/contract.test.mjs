import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
  STATE_ATTRIBUTES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const drawer = contract.members.drawer;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'drawer');
  assert.equal(contract.ui, 'drawer');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A drawer is not a member of `dialog`, and one fact decides it: a persistent
 * drawer has no `dialog` role at all. An alert dialog *is* a dialog — same role
 * family, same keyboard, same modality — so a consumer writing
 * `[data-ui='dialog']` means it too. An inline drawer is a region of the page,
 * and the role on it would be the claim the APG calls severe.
 */
test('is its own identifier rather than a member of dialog, and says what that costs', () => {
  assert.notEqual(contract.ui, 'dialog');
  assert.match(contract.identity.reason, /no dialog role at all/);
  assert.ok(contract.identity.cost.length > 0, 'the duplication is not written down');
});

test('cites both patterns it answers rather than claiming to have checked them', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.equal(contract.resizePattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/');
});

/**
 * The modal dialog pattern's whole table, then the window splitter's. `Escape`
 * is the layer's; the two tab keys are the platform's order with the wrap the
 * pattern requires; the six that follow belong to the separator.
 */
test('answers every key both patterns list, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Tab',
    'Shift+Tab',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Enter',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who answers it`);
  }
  assert.match(contract.keyboard[0].effect, /wrap|first tabbable/i);
  assert.match(contract.keyboard[1].effect, /wrap|last tabbable/i);
});

/** Two layers, one Escape. A layer that refuses stops the request descending. */
test('gives Escape to the topmost layer alone', () => {
  assert.match(contract.keyboard[2].effect, /topmost/);
  assert.equal(contract.escapeBound, true);
});

/**
 * `docs/component-features.md` §2.8 requires a keyboard alternative for every
 * resize, and §8 makes snap points conditional on exactly that. Ant's resizer
 * and Vaul's snap dragging are both pointer-only, so this is the one part of
 * the family the field does not already answer.
 */
test('gives the resize a keyboard, which no surveyed implementation has', () => {
  const resizeKeys = contract.keyboard.filter((entry) => /resizer/.test(entry.effect));
  assert.deepEqual(
    resizeKeys.map((entry) => entry.key),
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'],
  );
  for (const entry of resizeKeys) {
    assert.equal(entry.source, '@slotted/core/extent');
    assert.match(entry.focus, /stays on the resizer/);
  }
});

/**
 * The arrows name a direction on the screen, which is the pattern's own
 * reading: `ArrowLeft` grows an `end` panel in a left-to-right document and
 * shrinks it in a mirrored one, because there the panel is on the left and the
 * reader is pushing its edge toward the wall.
 */
test('moves the separator by the screen rather than by the reading direction', () => {
  const left = contract.keyboard.find((entry) => entry.key === 'ArrowLeft');
  assert.match(left.effect, /left of the screen/);
  assert.match(left.effect, /mirrored/);
});

/**
 * The pattern's "collapses the pane" would mean closing the drawer, and Escape
 * already means that. A reader who presses Enter on a separator expects the
 * separator to still be there afterwards.
 */
test('collapses to the smallest extent rather than closing, and says why', () => {
  const enter = contract.keyboard.find((entry) => entry.key === 'Enter');
  assert.match(enter.effect, /smallest allowed extent/);
  assert.match(enter.effect, /does not close the drawer/);
});

test('declares a state model for both values a consumer can own', () => {
  assert.ok(drawer.capabilities.includes('open'));
  assert.ok(drawer.capabilities.includes('extent'));
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.ok(MUTABLE_CAPABILITIES.includes('extent'));
  assert.deepEqual(Object.keys(contract.stateModel), ['open', 'extent']);

  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'dismiss', 'escape', 'outsidePress', 'back', 'programmatic'],
    result: 'the value of the close part that was pressed',
  });

  assert.deepEqual(contract.stateModel.extent, {
    controlled: 'extent',
    uncontrolled: 'defaultExtent',
    request: 'onExtentChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
    valueType:
      'number | undefined, where undefined is the panel on the measure its size step gives it — under size=content, the height of its content',
  });
});

/**
 * A separator is a gutter and not a handle. Four pixels of nothing at rest, a
 * a reach that holds the WCAG 2.2 floor without the eye being told where it is.
 *
 * That last clause is what changed, and this test changed with the decision
 * rather than being deleted around it. The separator used to draw nothing at
 * rest and then a two-pixel line in the accent under the hand, on the argument
 * that the edge is already there. It was reported as an edge nobody could find,
 * and the accent — the one colour that means the keyboard is here — had been
 * spent on hover, leaving nothing for focus.
 *
 * So the family now draws `splitter`'s picture: two hairlines and a grip on an
 * inline side, a pill above the header on a block one, and the accent on the
 * focus ring alone. What did not change is the reach, and it is asserted below
 * exactly as it was.
 */
test('draws the separator as something a hand can find, with a reach wider than its picture', () => {
  assert.match(contract.anatomy.resizer, /--slotted-target-min/);
  assert.match(contract.anatomy.resizer, /centred on the gutter/);
  assert.match(contract.anatomy.resizer, /draws something at rest/);
  assert.match(contract.anatomy.resizer, /grip/);

  /* The accent is reserved, and the contract says where it went. */
  assert.match(contract.anatomy.resizer, /focus ring alone/);
  assert.doesNotMatch(contract.anatomy.resizer, /Invisible at rest/);

  /* A sheet is held in the middle, not at the edge of the screen. */
  assert.match(contract.anatomy.resizer, /pill above the header/);
});

/** The two parts the picture is made of, and why neither is a pseudo-element. */
test('declares the two parts the separator draws itself with', () => {
  assert.ok(contract.members.drawer.parts.includes('line'));
  assert.ok(contract.members.drawer.parts.includes('grip'));
  assert.match(contract.anatomy.grip, /aria-hidden/);
  assert.match(contract.anatomy.line, /Not painted on a block side/);
});

/**
 * A distance and not a proportion. Five per cent of a twelve-hundred-pixel
 * layer is sixty pixels — a jump, not an adjustment — and a reader placing an
 * edge against the content beside it needs the adjustment.
 */
test('moves the separator by a distance the reader can predict', () => {
  assert.match(contract.extent.step, /16px per arrow press and 64px with Shift/);
  assert.match(contract.extent.step, /A distance and not a proportion/);
  assert.match(contract.extent.restore, /double click/);
  assert.match(contract.extent.restore, /the size step decides/);
});

/**
 * The drag animates nothing. R7 forbids a layout property in a transition, and
 * the width under the reader's hand is not in one: it is the value being held,
 * written once per `pointermove`, with `will-change` on the axis for the life
 * of the gesture and no transition on it at any time.
 */
test('states what the drag does to the document, and what it does not animate', () => {
  assert.match(contract.extent.gesture, /pointer capture/);
  assert.match(contract.extent.gesture, /col-resize or row-resize/);
  assert.match(contract.extent.gesture, /selection is suspended/);
  assert.match(contract.extent.gesture, /will-change/);
  assert.match(contract.extent.gesture, /no transition on that axis at all/);
  assert.match(contract.extent.gesture, /R7 forbids animating a layout property/);
});

/** Five ways to close, one request, one guard. */
test('names one reason for every source that can move it', () => {
  const sources = Object.entries(contract.reasons);
  assert.deepEqual(
    sources.map(([source]) => source),
    ['trigger', 'close', 'escape', 'outsidePress', 'back', 'handle', 'resizerDrag', 'resizerKeys'],
  );

  const declared = new Set([
    ...contract.stateModel.open.reasons,
    ...contract.stateModel.extent.reasons,
  ]);
  for (const [source, reason] of sources) {
    for (const value of [reason].flat()) {
      assert.ok(CHANGE_REASONS.includes(value), `${source} emits the unknown reason ${value}`);
      assert.ok(declared.has(value), `${source} emits ${value}, which no state model declares`);
    }
  }
});

/**
 * `dialog` emits `submit` because `alertDialog` owns a part whose meaning *is*
 * confirmation. This family owns none, so the reason would be declared and
 * unreachable — which is the same defect as a reason a source emits and the
 * model does not name, stated from the other side.
 */
test('declares no reason nothing in the family can emit', () => {
  const emitted = new Set(Object.values(contract.reasons).flat());
  for (const reason of contract.stateModel.open.reasons) {
    assert.ok(emitted.has(reason), `open declares ${reason} and no source emits it`);
  }
  assert.ok(!contract.stateModel.open.reasons.includes('submit'));
  assert.match(contract.declinedReasons.submit, /owns none/);
});

/** The result is what the platform calls `returnValue`, on the request. */
test('carries the result out on the request rather than as a second state', () => {
  assert.ok('result' in contract.stateModel.open);
  assert.ok(!('result' in contract.stateModel.extent));
  assert.ok(contract.result.parts.every((part) => drawer.parts.includes(part)));
});

/**
 * `line` and `grip` arrived with the separator's repaint. They are elements and
 * not pseudo-elements for one reason: `packages/styles/src/fallbacks.test.mjs`
 * forbids a system colour inside `::before` or `::after`, and both steps the
 * picture takes — the strong border and the muted text — have one as their last
 * resort. The reach is still a pseudo-element, because it paints nothing.
 */
test('declares the anatomy the family renders', () => {
  assert.deepEqual(drawer.parts, [
    'root',
    'trigger',
    'backdrop',
    'panel',
    'resizer',
    'line',
    'grip',
    'header',
    'title',
    'actions',
    'description',
    'body',
    'footer',
    'close',
  ]);
});

/**
 * Two boxes in the layer, not three. `dialog` needs a `viewport` between the
 * layer and the panel because its root declares `container-type: inline-size`,
 * which applies `contain: layout`, which makes a scrim positioned inside a
 * scrolling root part of what scrolls. A drawer's root declares no container
 * and never scrolls.
 */
test('places the scrim and the panel in one cell, with no third box', () => {
  assert.ok(!drawer.parts.includes('viewport'));
  assert.match(contract.anatomy.panel, /Two boxes and not three/);
  assert.match(contract.anatomy.panel, /bounded to the layer/);
});

/**
 * Every rule in the panel runs across the inline axis. A resizer *row* — which
 * is what a block side gets — crosses none of them; a resizer *column* would
 * cut all of them, and the first capture showed exactly that: a rule under the
 * header stopping twenty-four pixels short of the panel's own edge. A line
 * cannot cross an opaque box, so on an inline side the separator lies over the
 * panel and the rows keep clear of it instead.
 */
test('gives the resizer a row on a block side and an overlay on an inline one', () => {
  assert.match(contract.anatomy.resizer, /--slotted-target-min/);
  assert.match(contract.anatomy.resizer, /row of the panel's grid on a block side/);
  assert.match(contract.anatomy.resizer, /overlay on the inner edge on an inline side/);
  /* The reason, which is what keeps the asymmetry from reading as an accident. */
  assert.match(contract.anatomy.resizer, /every rule in the panel runs across the inline axis/);
  /* And the cost of the half that overlaps. */
  assert.match(contract.extent.overlapCost, /scrollbar/);
});

/**
 * Rendering the part is the capability. A `resizable` prop with no resizer
 * part, and a resizer part a prop had switched off, are both states the family
 * would otherwise be able to be in.
 */
test('makes the resizer part the capability rather than a prop beside it', () => {
  assert.ok(!('resizable' in contract.axes));
  assert.ok(!('resizable' in drawer.defaults));
  assert.match(contract.extent.capability, /no resizable prop/);
});

/**
 * A fraction of the layer and not a CSS length. The pattern's three aria values
 * are then the fraction times a hundred, the limits and the snap points are the
 * same kind of number so one clamp covers all three, and a keyboard step is a
 * proportion rather than a pixel literal the family would have to tokenise.
 */
test('measures the extent as a fraction of the layer', () => {
  assert.match(contract.extent.unit, /fraction of the layer/);
  assert.match(contract.extent.unit, /rather than a CSS length/);
  assert.equal(drawer.defaults.minExtent, 0.2);
  assert.equal(drawer.defaults.maxExtent, 1);
  /* No stops by default, and the absence is a described value rather than a
     declared one: `[]` stringifies to nothing, and a reference page's API table
     is required to print every declared default as it stands. */
  assert.ok(!('snapPoints' in drawer.defaults));
  assert.match(contract.extent.snapPoints, /empty by default/);
  assert.match(contract.wiring.resizerValue, /times a hundred/);
});

/**
 * The property is a theme-owned decision as well as the channel the binding
 * writes an instance value on, which is why it belongs in `drawer.tokens.json`
 * rather than in `packages/styles/src/runtime-properties.mjs`.
 */
test('names one property for the extent, and says why no theme is shut out of it', () => {
  assert.match(contract.extent.property, /--slotted-drawer-extent/);
  assert.match(contract.extent.property, /theme-owned/);
  assert.match(contract.extent.property, /runtime-properties/);
});

/**
 * §8 allows snap points "only when they add value and remain operable
 * by keyboard". They are the discrete form of the same separator, which is the
 * only reading under which the condition can be met.
 */
test('makes a snap point a stop of the separator rather than a second mechanism', () => {
  assert.match(contract.extent.snapPoints, /adjacent stop/);
  assert.match(contract.extent.snapPoints, /Home and End/);
  assert.match(contract.extent.dismissThreshold, /settleExtent/);
  assert.match(contract.extent.dismissThreshold, /the stop 0/);
});

test('declares the two shapes docs/component-features.md section 8 asks for', () => {
  assert.deepEqual(contract.axes.mode, ['overlay', 'inline']);
  assert.equal(contract.mode.default, 'overlay');
  assert.match(contract.mode.reason, /modal ou persistente conforme viewport/);
});

/**
 * An axis rather than two components, because the switch is the point: two
 * components mean the consumer swaps one element for another at a breakpoint,
 * and both frameworks destroy the subtree when they do.
 */
test('makes the mode an axis so the switch keeps the panel’s state', () => {
  assert.match(contract.mode.reason, /destroy the subtree/);
  assert.ok(contract.provides.drawerDefaults.includes('mode'));
});

/** A viewport query owned by a family is what the rubric's dimension 3 refuses. */
test('leaves the responsive breakpoint to the application', () => {
  assert.match(contract.mode.responsive, /breakpoint is the consumer/);
  assert.match(contract.mode.responsive, /container query cannot/);
});

/** `start` and `end`, never `left` and `right`. §2.4 of the guide. */
test('names the side logically', () => {
  assert.deepEqual(contract.axes.side, ['start', 'end', 'top', 'bottom']);
  assert.equal(drawer.defaults.side, 'end');
});

/**
 * The panel is a dialog only where the background is genuinely out of reach.
 * Under `inline` it writes no role at all, because a navigation drawer is a
 * navigation landmark and a filter panel is complementary, and a family that
 * cannot know which one guesses wrong half the time.
 */
test('writes the dialog role only where the drawer is a layer', () => {
  assert.match(contract.wiring.role, /dialog on the panel part under mode=overlay/);
  assert.match(contract.wiring.role, /writes no role/);
  assert.match(contract.wiring['aria-modal'], /only while modal is true/);
  assert.equal(drawer.fixed.modalUnderInline, false);
});

/**
 * An inline drawer is a disclosure, not a popup, and `aria-haspopup` on it
 * would promise a layer that never arrives. None of the six surveyed
 * implementations makes the distinction.
 */
test('promises a popup only when there is one', () => {
  assert.match(contract.wiring['aria-haspopup'], /mode=overlay only/);
  assert.match(contract.wiring['aria-expanded'], /in both modes/);
});

/** The separator is named for the pane it sizes, and it names that pane back. */
test('wires the separator to the pane it sizes, both ways', () => {
  assert.match(contract.wiring.resizerRole, /separator on the resizer part/);
  assert.match(contract.wiring.resizerRole, /tabindex=0/);
  assert.match(contract.wiring.resizerName, /aria-labelledby the title part/);
  assert.match(contract.wiring.resizerControls, /names the panel/);
  assert.match(contract.wiring['aria-orientation'], /vertical/);
  assert.match(contract.wiring['aria-orientation'], /horizontal/);
});

/**
 * A sidebar that stole focus every time a breakpoint crossed would be
 * unusable, and one whose closed controls stayed in the tab sequence is the
 * defect MUI's persistent variant ships. Angular Material takes the same split.
 */
test('moves focus in only where the drawer is a layer, and restores in both', () => {
  assert.match(contract.focus.initial, /nothing at all under mode=inline/);
  assert.match(contract.focus.contain, /An inline drawer contains nothing/);
  assert.match(contract.focus.restore, /in both modes/);
  assert.match(contract.focus.closedPanel, /inert/);
});

test('declares the states the stylesheet may paint, and no others', () => {
  assert.deepEqual(drawer.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'loading',
    'dragging',
    'expanded',
  ]);
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.equal(attribute, STATE_ATTRIBUTES[state], `${state} disagrees with the vocabulary`);
  }
});

/**
 * A drawer's panel never exceeds the layer, so there is no second thing that
 * could scroll and the axis `dialog` needs would be an axis with one useful
 * value. Ant, Fluent and MUI all scroll the body and none ships an axis.
 */
/**
 * The scrim belongs to the layer and not to the dismissal policy. Tying the two
 * cost a reference page: a demonstration that stands open must not be modal —
 * a modal layer locks the document scroll and reads every press elsewhere as an
 * outside press — and with the scrim gated on modality, every still picture on
 * the page lost the scrim that is half of it.
 */
test('paints the scrim wherever there is a layer, modal or not', () => {
  assert.match(contract.anatomy.backdrop, /whether the layer is modal or not/);
  assert.match(contract.anatomy.backdrop, /never what is painted/);
  assert.match(contract.wiring['aria-modal'], /only while modal is true/);
});

test('scrolls the body and ships no axis for it', () => {
  assert.ok(!('scroll' in contract.axes));
  assert.match(contract.scroll.reason, /never exceeds the layer/);
});

test('composes the overlay modules and names the ones it does not', () => {
  assert.deepEqual(contract.composes, [
    'portal',
    'dismissable-layer',
    'presence',
    'focus',
    'extent',
    'measure',
  ]);
  assert.match(contract.declined.positioner.reason, /anchored to an edge/);
  assert.match(contract.declined.liveAnnouncer.reason, /aria-expanded/);
});

/**
 * A decline is complete only when it names the family that owns the capability
 * instead, or the composition that replaces it.
 */
test('replaces every declined capability rather than only refusing it', () => {
  assert.match(contract.declined.pushMode.replacedBy, /mode="inline"/);
  assert.equal(contract.declined.emptyState.deferTo, 'result-state');
  assert.match(contract.declined.backgroundScale.replacedBy, /:has\(\[data-ui='drawer'\]/);
  assert.ok(contract.declined.dialogElement.cost.length > 0);
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} is declined with no reason`);
  }
});

/**
 * The defaults an application sets once. Every one of them is an axis, and
 * every axis a consumer can set per instance is one of them — a provider that
 * covered fewer would leave a product repeating the difference on every drawer.
 */
test('lets an application set every axis once', () => {
  assert.deepEqual(contract.provides.drawerDefaults, Object.keys(contract.axes));
  for (const axis of Object.keys(contract.axes)) {
    assert.deepEqual(contract.resolution[axis], ['prop', 'defaults', 'family']);
    assert.ok(axis in drawer.defaults, `${axis} has no declared default`);
  }
});

/**
 * One demonstration per scenario, which is what
 * `.claude/skills/component/references/stories.md` holds both reference pages
 * to. Every axis is represented, and so is each of the two capabilities the
 * field does not ship.
 */
test('declares a scenario for every axis and for both new capabilities', () => {
  const ids = contract.scenarios.drawer;
  for (const id of ['mode', 'side', 'size', 'modal', 'resize', 'snapPoints']) {
    assert.ok(ids.includes(id), `no scenario demonstrates ${id}`);
  }
  for (const id of ['playground', 'policy', 'focus', 'composition', 'defaults', 'accessibility']) {
    assert.ok(ids.includes(id), `no scenario demonstrates ${id}`);
  }
  assert.equal(new Set(ids).size, ids.length);
});

/** The body's padding is the consumer's to drop, never inferred from what the body holds. */
test('lets the consumer drop the body inset', () => {
  assert.equal(contract.bodyInset.attribute, 'data-inset');
  assert.deepEqual(contract.bodyInset.values, ['none']);
});

/**
 * The reopening of 2026-09-25.
 * A sheet from a block edge measures its content, as every native sheet does;
 * a panel from an inline edge keeps the named step Ant, Fluent and MUI use.
 */
test('measures a sheet by its content and a side panel by its step', () => {
  assert.ok(contract.axes.size.includes('content'));
  assert.equal(drawer.defaults.size, 'content on top and bottom, md on start and end');
  assert.match(contract.sheet.content, /default size on top and bottom and never on start and end/);
  assert.match(contract.sheet.contentStop, /minimum height lifted/);
  assert.match(contract.sheet.contentStop, /undefined/);
});

/**
 * The declined panel drag of 2026-09-04 is revoked: seven of the eight surveyed
 * sheets drag by the body and hand the gesture to the scroll of what it holds.
 * The mouse keeps the resizer, for the reason the decline gave.
 */
test('drags a sheet by its body and hands the gesture to the scroll', () => {
  assert.ok(!('panelDrag' in contract.declined), 'the revoked decline is still written');
  assert.deepEqual(contract.axes.drag, ['panel', 'resizer']);
  assert.equal(drawer.defaults.drag, 'panel');
  assert.match(contract.sheet.drag, /touch/);
  assert.match(contract.sheet.drag, /side=bottom/);
  assert.match(contract.sheet.drag, /scroll-snap-type: y mandatory/);
  assert.match(contract.sheet.gesture, /nothing renders and nothing is measured/);
  assert.match(contract.sheet.gesture, /scrollend/);
  assert.match(contract.sheet.handoff, /scrollTop/);
  assert.match(contract.sheet.handoff, /same gesture/);
  assert.match(contract.sheet.exclusions, /touch-action/);
  assert.match(contract.sheet.exclusions, /data-drawer-drag="none"/);
});

/** A sheet's release is the platform's fling and snap; the other sides' separators keep settleExtent. */
test('settles a sheet on the snap points and the other sides by settleExtent', () => {
  assert.match(contract.sheet.settle, /snap points decide/);
  assert.match(contract.sheet.settle, /settleExtent/);
  assert.match(contract.sheet.settle, /close/);
  assert.match(contract.sheet.overdrag, /overscroll/);
  assert.match(
    contract.sheet.motion,
    /--slotted-drawer-slide-easing \(default --slotted-easing-standard\)/,
  );
  assert.match(contract.sheet.motion, /at most a tenth of the distance/);
});

test('leaves the page undimmed below a stop the consumer names', () => {
  assert.equal(drawer.defaults.scrimFrom, 0);
  assert.equal(contract.sheet.scrimFrom.attribute, 'data-undimmed');
  assert.match(contract.sheet.scrimFrom.meaning, /pointer-events: none/);
});

test('caps a sheet on a wide layer and lifts it over the virtual keyboard', () => {
  assert.match(contract.sheet.width, /--slotted-drawer-sheet-inline-size/);
  assert.match(contract.sheet.keyboard, /--slotted-keyboard-inset/);
  assert.match(contract.sheet.keyboard, /visualViewport/);
  assert.match(contract.sheet.grabberTap, /next stop/);
});

test('demonstrates the sheet, its undimmed stop and the keyboard', () => {
  for (const id of ['sheet', 'scrimFrom', 'keyboard']) {
    assert.ok(contract.scenarios.drawer.includes(id), `no scenario demonstrates ${id}`);
  }
});
