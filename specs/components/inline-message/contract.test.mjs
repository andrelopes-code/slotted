import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.inlineMessage;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'inline-message');
  assert.equal(contract.ui, 'inline-message');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member and four parts. Three of the four are drawn by the family rather
 * than written by the consumer, which is what lets the stylesheet ask whether
 * there is a message at all: `text` is the family's own wrapper, so
 * `[data-part='text']:empty` is an exact question in both bindings.
 */
test('is one member, and the five parts the family draws', () => {
  assert.deepEqual(Object.keys(contract.members), ['inlineMessage']);
  assert.deepEqual(member.parts, ['root', 'prefix', 'icon', 'text', 'actions']);
});

/**
 * A message that offers its answers — two amounts the reader may have meant —
 * holds them, rather than standing beside them: a paragraph cannot hold a
 * button, so the root becomes a group named by its sentence.
 */
test('becomes a group named by its sentence when it holds actions', () => {
  assert.match(contract.actions.root, /role=group, aria-labelledby the text part/);
  assert.match(contract.actions.live, /moves to the text part/);
});

/**
 * A paragraph of prose about something else. GOV.UK, Material UI and Mantine
 * all render one; Primer and Chakra render a `span` and a `div`, which read as
 * one run of text rather than as a unit.
 */
test('renders a paragraph, because the message is a sentence', () => {
  assert.equal(member.nativeElement, 'p');
});

/**
 * The five tones belong to the theme, and `specs/contract.schema.mjs` holds the
 * list. The guide's five kinds — ajuda, erro, warning, success, progresso — map
 * onto four of them plus one state, which is `loading` below.
 */
test('speaks in the library’s five shared tones and invents no sixth word', () => {
  assert.deepEqual(contract.axes.tone, [...TONES]);
});

/**
 * `secondary` is the help tone: the message that sits under most fields, that
 * draws no mark, speaks no severity word, and paints in the neutral muted ink
 * rather than in a tone's label color. The quietest thing the family can be is
 * what it is when nothing is stated.
 */
test('defaults to help, which is the message a form carries most of', () => {
  assert.equal(member.defaults.tone, 'secondary');
  assert.equal(contract.toneGlyphs.secondary, null);
  assert.equal(contract.tonePrefixes.secondary, null);
});

/**
 * A glyph per severity, so the tones are distinguishable in grayscale, in the
 * `high-contrast` scheme and under forced colors. The map is the one
 * `status-indicator` and `alert` declare, so a status light, an alert and a
 * field error about the same thing draw the same mark. WCAG 2.2 1.4.1.
 */
test('gives every severity a mark, so color is never the only signal', () => {
  assert.deepEqual(contract.toneGlyphs, {
    accent: 'status-info',
    secondary: null,
    info: 'status-info',
    success: 'status-success',
    warning: 'status-warning',
    danger: 'status-danger',
  });
  for (const tone of contract.axes.tone) {
    assert.ok(tone in contract.toneGlyphs, `${tone} has no entry in the glyph map`);
  }
  assert.equal(member.defaults.hideIcon, false);
});

/**
 * Three marks, and a form asks for the third. A silhouette per severity is
 * right for a message that stands alone — an alert, a status light — and wrong
 * for a column of them: four fields in error draw four circled exclamations one
 * under the other, and what was there to catch the eye becomes texture (R5).
 * `none` draws nothing at all, and the tone is then said by the ink and by the
 * weight of the sentence, which is what F1 settled. `dot` is one neutral bullet
 * for every tone, including the help tone that draws no silhouette at all, for
 * a page that wants a column of sentences to start on one left edge.
 *
 * `glyph` stays the default: the family is not only a form's, and a message
 * standing on its own keeps the mark that distinguishes it in grayscale.
 * `field` and `field-group` are what state `none`, in their own contracts.
 */
test('draws the tone’s silhouette, one neutral bullet, or nothing', () => {
  assert.deepEqual(contract.axes.mark, ['glyph', 'dot', 'none']);
  assert.equal(member.defaults.mark, 'glyph');
});

/**
 * The capability none of the thirteen surveyed implementations ships, and the
 * one the family exists for. The mark and the color reach a reader who looks;
 * a reader who listens hears the sentence and nothing else, so the severity is
 * also a word, clipped from sight and read first.
 *
 * GOV.UK ships it for errors in one hard-coded template. Here it is a word per
 * severity, and the table is replaced once for the application.
 */
test('says the severity in words as well as in color and geometry', () => {
  assert.deepEqual(contract.tonePrefixes, {
    accent: null,
    secondary: null,
    info: null,
    success: 'Success:',
    warning: 'Warning:',
    danger: 'Error:',
  });
  assert.ok(member.parts.includes('prefix'));
  for (const tone of contract.axes.tone) {
    assert.ok(tone in contract.tonePrefixes, `${tone} has no entry in the prefix map`);
  }
});

/**
 * `off` by default, for the reason the APG records about the alert role: a
 * message present before the page finished loading is not announced whatever
 * role it carries. The role goes on the root rather than on an inner part —
 * the contrast with `alert`, which has a dismiss button inside it and MDN's
 * rule that the role is for text content alone.
 */
test('announces nothing until the page says the message just arrived', () => {
  assert.deepEqual(contract.axes.live, ['off', 'polite', 'assertive']);
  assert.deepEqual(contract.liveRoles, { off: null, polite: 'status', assertive: 'alert' });
  assert.equal(member.defaults.live, 'off');
});

/**
 * Two steps, both read from the control scales the theme restates per density,
 * so a message under a dense field shrinks with it. `sm` is the default: help
 * text under a control is quieter than the control.
 */
test('steps with the control it belongs to', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md']);
  assert.equal(member.defaults.size, 'sm');
});

/**
 * The guide names “progresso” as a kind of inline message. It is a state of the
 * same message rather than a sixth tone: the mark becomes a ring and the tone,
 * the size and the geometry stay exactly where they were, so a pending check
 * becomes its own answer with nothing moving.
 */
test('holds the wait as a state, not as another tone', () => {
  assert.ok(member.capabilities.includes('loading'));
  assert.equal(contract.stateAttributes.loading, 'data-loading');
  assert.ok(member.states.includes('loading'));
  assert.ok(!contract.axes.tone.includes('progress'));
});

/**
 * `disabled` is not in `defaults`, and that absence is the decision. A message
 * that defaulted to `false` would quietly override a disabled `field` in wave
 * 3; `undefined` defers, and anything else wins: the field-aware invariant
 * seen from the other side.
 */
test('leaves disabled unstated, so the field can answer it', () => {
  assert.ok(member.capabilities.includes('disabled'));
  assert.equal(contract.stateAttributes.disabled, 'data-disabled');
  assert.ok(!('disabled' in member.defaults));
});

/**
 * Material UI reserves a line by asking the consumer to pass a space character.
 * Here it is stated, it measures one line box of the family's own leading, and
 * the mark and the prefix withdraw when there is nothing to say — so a form
 * renders the message unconditionally and never moves when it arrives.
 */
test('can hold its line open so nothing jumps when the message arrives', () => {
  assert.equal(member.defaults.reserve, false);
});

/**
 * The family holds no mutable value: it is told what to say, and when it
 * appears is the consumer's own render. That is why there is no state model,
 * and the assertion is here so the absence stays a decision rather than an
 * oversight — a later capability that does hold state fails this test.
 */
test('moves nothing, so it declares no state model', () => {
  assert.ok(!('stateModel' in contract));
  for (const capability of member.capabilities) {
    assert.ok(!MUTABLE_CAPABILITIES.includes(capability), `${capability} holds state`);
  }
});

/**
 * No hover, no active and no focus-visible: the family owns no interactive
 * element. A link a consumer writes inside the message belongs to `link`.
 */
test('paints only the states a sentence can actually be in', () => {
  assert.deepEqual(member.states, ['default', 'loading', 'disabled']);
  for (const state of ['hover', 'active', 'focus-visible', 'invalid', 'open']) {
    assert.ok(!member.states.includes(state), `inline-message claims ${state}`);
  }
});

test('names one reference page, covering every axis and every state', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['inlineMessage']);
  assert.deepEqual(contract.scenarios.inlineMessage, [
    'playground',
    'tones',
    'sizes',
    'pending',
    'wiring',
    'live',
    'reserve',
    'content',
    'composition',
    'accessibility',
  ]);
});
