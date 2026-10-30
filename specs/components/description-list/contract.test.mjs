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
const list = contract.members.descriptionList;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because every part reads one list', () => {
  assert.equal(contract.family, 'description-list');
  assert.equal(contract.ui, 'description-list');
  assert.deepEqual(Object.keys(contract.members), ['descriptionList']);
});

test('names the eleven parts a pair is made of', () => {
  assert.deepEqual(list.parts, [
    'root',
    'list',
    'item',
    'term',
    'hint',
    'description',
    'value',
    'placeholder',
    'copy',
    'toggle',
    'action',
  ]);
});

/**
 * Ant Design renders a `table`, which announces rows, columns and a cell count
 * that mean nothing when every term differs. Section 10 of
 * `docs/component-features.md` asks for `dl`/`dt`/`dd` or an equivalent
 * semantic, and the HTML Standard permits the `div` wrapper that makes a pair
 * one grid area.
 */
test('takes the list, the term and the definition from the platform', () => {
  assert.equal(list.nativeElement, 'div');
  assert.equal(contract.listElement, 'dl');
  assert.equal(contract.rootElement, 'div');
  assert.equal(contract.itemElement, 'div');
  assert.equal(contract.termElement, 'dt');
  assert.equal(contract.descriptionElement, 'dd');
  assert.equal(contract.groupWrapper.element, 'div');
  assert.match(contract.groupWrapper.source, /HTML Standard 4\.4\.9/);
});

/**
 * `dl`, `dt` and `dd` already carry `list`, `term` and `definition`. MDN
 * records that authoring the ARIA roles by hand changes how VoiceOver
 * announces the construct, so the family writes none of them.
 */
test('writes no role of its own', () => {
  assert.equal(contract.rootRole, 'none');
  assert.match(contract.roleReason, /VoiceOver/);
});

/**
 * A `dt` may be followed by more than one `dd`, which is how GOV.UK gives a
 * summary row its action without inventing any semantics.
 */
test('puts the row action in a second definition of the same term', () => {
  assert.equal(contract.actionElement, 'dd');
  assert.ok(list.parts.includes('action'));
});

/**
 * The APG has no description list pattern — twenty-nine patterns, read
 * 2026-09-03, and none of them is this. The claim is recorded with the URL
 * that supports it rather than asserted, and the one pattern the family does
 * borrow is named with what it requires.
 */
test('records that no APG pattern covers the family, and cites the one it borrows', () => {
  assert.equal(contract.pattern.apg, 'none');
  assert.match(contract.pattern.checked, /w3\.org\/WAI\/ARIA\/apg\/patterns/);
  assert.match(contract.pattern.platform, /html\.spec\.whatwg\.org/);
  assert.match(contract.pattern.platform, /html-aam/);
  assert.match(contract.pattern.borrowed.toggle, /aria-expanded/);
});

/**
 * Every interactive part is a native button or the consumer's own control, so
 * the family owns no key. Arrow navigation would take `Tab` away from controls
 * that need it, and a read-only list of pairs is not a composite widget.
 */
test('owns no keyboard behavior of its own', () => {
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Enter', 'Space'],
  );
  for (const entry of contract.keyboard) {
    assert.equal(entry.source, 'platform', `${entry.key} is not the platform's`);
  }
  assert.match(contract.keyboardReason, /composite widget/);
});

test('gives the one mutable value a model with reasons the vocabulary holds', () => {
  assert.ok(MUTABLE_CAPABILITIES.includes('revealed'));
  const model = contract.stateModel.revealed;
  assert.equal(model.controlled, 'revealed');
  assert.equal(model.uncontrolled, 'defaultRevealed');
  assert.equal(model.request, 'onRevealedChange');
  for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason));
});

/**
 * Copying is an action the platform completes. There is no controlled
 * clipboard and nothing to cancel, so the capability is declared and no state
 * model is — which the schema would refuse if the vocabulary disagreed.
 */
test('declares copying as a capability that holds no state', () => {
  assert.ok(list.capabilities.includes('copyable'));
  assert.ok(!MUTABLE_CAPABILITIES.includes('copyable'));
  assert.equal(contract.stateModel.copyable, undefined);
  assert.equal(contract.copy.api, 'navigator.clipboard.writeText');
  assert.match(contract.copy.declined, /execCommand/);
});

/**
 * A control that fails silently is indistinguishable from a broken one, and a
 * browser refuses the write for two reasons a family cannot prevent: an
 * unfocused document, and an iframe with no clipboard-write permission. What is
 * left to offer is the selection.
 */
test('does the part it still can when the platform refuses the clipboard', () => {
  assert.match(contract.copy.blocked, /selects the value/);
  assert.match(contract.copy.blocked, /clipboard-write/);
  assert.ok(contract.messages.includes('copyBlocked'));
});

/**
 * A clamp is a maximum rather than a promise. Most values in a panel are
 * shorter than it, and a control that reveals nothing is one a reader presses
 * once and learns to distrust.
 */
test('draws the reveal control only where there is something to reveal', () => {
  assert.equal(contract.reveal.control, 'toggle');
  assert.match(contract.reveal.measured, /scrollHeight/);
  assert.match(contract.reveal.reason, /maximum rather than a promise/);
});

test('paints the revealed state through the shared attribute vocabulary', () => {
  assert.ok(list.states.includes('revealed'));
  assert.equal(contract.stateAttributes.revealed, STATE_ATTRIBUTES.revealed);
});

/**
 * `container-type: inline-size` makes an element a query container for its
 * descendants and not for itself, and what the query changes here is the grid
 * the root would otherwise be. So the root is the container and the `dl` is the
 * grid — the division `stepper` makes between its root and its `ol`.
 */
test('separates the query container from the grid it resizes', () => {
  assert.ok(list.parts.indexOf('root') < list.parts.indexOf('list'));
  assert.match(contract.rootReason, /container query/);
  assert.equal(contract.tracks.owner, 'list');
});

/**
 * A copy that finished is something that has finished, which is the word the
 * vocabulary already holds. Painting it needs no second word for one family,
 * and the control returns to rest on its own.
 */
test('says a copy finished in the vocabulary the library already speaks', () => {
  assert.ok(list.states.includes('complete'));
  assert.equal(contract.stateAttributes.complete, STATE_ATTRIBUTES.complete);
  assert.match(contract.copy.feedback, /data-complete/);
});

/**
 * Section 10: a long value may be copied or revealed, never truncated without
 * access. Both routes are declared parts, and neither removes text from the
 * DOM.
 */
test('gives a long value two ways out and takes none of it away', () => {
  assert.ok(list.parts.includes('copy'));
  assert.ok(list.parts.includes('toggle'));
  assert.equal(list.defaults.clamp, 0);
  assert.ok(contract.messages.includes('reveal'));
  assert.ok(contract.messages.includes('collapse'));
});

/**
 * The count collapses before the arrangement does: a two-column row list at
 * 30rem has 15rem per pair, of which the term takes up to 14rem, and the value
 * would break one word per line.
 */
test('answers its own inline size, count first and arrangement second', () => {
  assert.equal(contract.reflow.container, 'slotted-description-list');
  const thresholds = Object.keys(contract.reflow.breakpoints).map((size) =>
    Number.parseFloat(size),
  );
  assert.deepEqual(
    thresholds,
    [...thresholds].sort((a, b) => b - a),
  );
  assert.match(contract.reflow.rowFold.effect, /stack/);
  assert.match(contract.reflow.rowFold.width, /termWidth/);
});

/**
 * Subgrid is what lets a `dl` of independent groups share one term column. The
 * three placements are stated once and serve the spanning item too, so no
 * second layout exists to disagree with the first.
 */
test('places every cell once, through the tracks the root declares', () => {
  assert.equal(contract.tracks.engine, 'subgrid');
  assert.equal(contract.tracks.term, '1');
  assert.match(contract.tracks.description, /^2 \/ -1\b/);
  assert.match(contract.tracks.description, /2 \/ -2/);
  assert.equal(contract.tracks.action, '-2 / -1');
  assert.equal(contract.tracks.owner, 'list');
  assert.match(contract.tracks.separation, /padding/);
});

/**
 * GOV.UK repeats the term inside every action as visually hidden text. A
 * reference says it once, and a consumer's own value is composed with rather
 * than replaced.
 */
test('names a row action by the term it belongs to', () => {
  assert.match(contract.wiring.action, /aria-describedby/);
  assert.ok(list.capabilities.includes('wiring'));
});

/**
 * A missing value is a decision, not an omission: the mark is geometry and the
 * reason is text, because color and shape alone never carry meaning.
 */
test('draws a missing value and says why it is missing', () => {
  assert.equal(contract.empty.part, 'placeholder');
  assert.match(contract.empty.text, /visually-hidden/);
  assert.match(contract.empty.forms, /:empty/);
  assert.ok(contract.messages.includes('placeholder'));
});

test('answers every axis from the prop, then the provider, then a stated default', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.deepEqual(resolution.slice(0, 2), ['prop', 'defaults'], axis);
    assert.ok(values.includes(resolution[2]), `${axis} falls back outside its own values`);
    assert.equal(list.defaults[axis], resolution[2], `${axis} default disagrees with resolution`);
  }
});

/**
 * Every decline names the family that owns the capability instead, or the wave
 * that builds it. "Not needed yet" is not one of the reasons on this list.
 */
test('names an owner for every capability it declines', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.deferTo, `${name} declines and names no owner`);
    assert.ok(entry.reason.length > 40, `${name} declines without a reason`);
  }
});

test('states the reason for every literal it writes', () => {
  for (const [token, reason] of Object.entries(contract.literals)) {
    assert.match(token, /^--slotted-description-list-/);
    assert.ok(reason.length > 40, `${token} states no reason`);
  }
});

/**
 * The six words the family says are catalog messages rather than declared
 * defaults. A default is a value a consumer overrides one at a time; a
 * vocabulary is translated once, which is why none of them appears in
 * `defaults`.
 */
test('holds the words it says apart from the values it defaults', () => {
  assert.deepEqual([...contract.messages].sort(), [
    'collapse',
    'copied',
    'copy',
    'copyBlocked',
    'placeholder',
    'reveal',
  ]);
  /* `copy` is a word here and a boolean input there — the control's name and
     whether it is drawn are two questions, and neither borrows the other's
     answer. Every other word stays out of the defaults entirely. */
  for (const key of ['collapse', 'copied', 'copyBlocked', 'placeholder', 'reveal']) {
    assert.ok(!(key in list.defaults), `${key} is a word, not a default`);
  }
  assert.ok(contract.messagesReason.length > 40);
});

/**
 * An application decides its arrangement once. Every value the provider
 * carries is a value a part reads.
 */
test('lets an application set the whole family once', () => {
  for (const key of contract.provides.descriptionListDefaults) {
    assert.ok(key in list.defaults, `${key} is provided and is not a default`);
  }
  for (const axis of contract.provides.toParts) {
    assert.ok(axis in contract.axes, `${axis} reaches the parts and is not an axis`);
  }
});
