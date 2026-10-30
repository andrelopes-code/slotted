import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { STATUS_GLYPHS } from '../../../packages/core/src/glyph/status-glyphs.ts';
import { assertContractShape, MUTABLE_CAPABILITIES, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const statusIndicator = contract.members.statusIndicator;

/**
 * Read rather than recalled, because the claim below about the dot is a claim
 * about another family's public vocabulary: a status dot and a badge dot are
 * the same object drawn by two families, and if `badge` ever renames the shape
 * this test is what says so.
 */
const badge = JSON.parse(
  await readFile(new URL('../badge/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one family with one member and five parts', () => {
  assert.equal(contract.family, 'status-indicator');
  assert.equal(contract.ui, 'status-indicator');
  assert.deepEqual(Object.keys(contract.members), ['statusIndicator']);
  assert.deepEqual(statusIndicator.parts, ['root', 'mark', 'label', 'detail', 'announcement']);
});

/**
 * A `span`, so a status written inside a sentence or inside a table cell is
 * legal markup wherever the consumer puts it. Nothing in the family is a
 * block, because nothing in it owns a line of its own.
 */
test('renders an element that is legal wherever content is', () => {
  assert.equal(statusIndicator.nativeElement, 'span');
});

/**
 * Six operational states. The vocabulary is closed on purpose: a seventh value
 * would carry no tone, no glyph and no fallback word, which are the three
 * things this family exists to supply.
 */
test('names six statuses and defaults to the one that claims nothing', () => {
  assert.deepEqual(contract.axes.status, [
    'neutral',
    'info',
    'success',
    'warning',
    'danger',
    'unknown',
  ]);
  assert.equal(statusIndicator.defaults.status, 'neutral');
});

/**
 * Every status speaks in one of the library's five shared tones, and the map
 * is contract rather than stylesheet detail: the CSS is checked against it,
 * and both bindings write the same attribute the CSS reads.
 *
 * `neutral` and `unknown` share `secondary`, which is the reason the mark has
 * to tell them apart without color.
 */
test('maps every status onto a tone the theme already paints', () => {
  assert.deepEqual(Object.keys(contract.statusTones), contract.axes.status);
  for (const [status, tone] of Object.entries(contract.statusTones)) {
    assert.ok(TONES.includes(tone), `${status} speaks in ${tone}, which is not a shared tone`);
  }
  assert.equal(contract.statusTones.neutral, contract.statusTones.unknown);
});

/**
 * The glyph each status draws when the mark is an icon. Named here so the two
 * bindings and the harness cannot disagree about which artwork means “failed”.
 * A name is the glyph token without `--slotted-icon-`, which is the name the
 * `Glyph` element takes.
 */
test('gives every status its own glyph from the status set', () => {
  assert.deepEqual(Object.keys(contract.statusGlyphs), contract.axes.status);
  const drawn = Object.values(contract.statusGlyphs);
  assert.equal(new Set(drawn).size, drawn.length, 'two statuses draw the same glyph');
  for (const [status, name] of Object.entries(contract.statusGlyphs)) {
    assert.ok(name in STATUS_GLYPHS, `${status} names no status glyph: ${name}`);
  }
});

/**
 * `docs/build-briefing.md` › No triangle glyph: every mark is a hand-drawn
 * status glyph, and the warning and danger marks are the ones `alert` and
 * `toast` draw for the same tones.
 */
test('draws every status from the status set, never a triangle', () => {
  assert.equal(contract.statusGlyphs.warning, 'status-warning');
  assert.equal(contract.statusGlyphs.danger, 'status-failed');
});

/**
 * The word a reader hears when the consumer supplied no visible label. It is
 * the family's answer to the one thing every surveyed implementation gets
 * wrong: Spectrum asks the consumer for an `aria-label` and ships a nameless
 * dot when they forget, and Fluent builds one that is English for ever.
 */
test('carries a fallback name for every status, replaceable per application', () => {
  assert.deepEqual([...contract.messages].sort(), [...contract.axes.status].sort());
  assert.ok(statusIndicator.parts.includes('announcement'));
});

/**
 * Two marks. The dot is the compact one and borrows `badge`'s shape word; the
 * icon is the non-chromatic one, and it is what satisfies WCAG 2.2 1.4.1 where
 * a product cannot spare the room for a visible label.
 */
test('draws two marks, and the compact one is the shape badge already names', () => {
  assert.deepEqual(contract.axes.mark, ['dot', 'icon']);
  assert.equal(statusIndicator.defaults.mark, 'dot');
  assert.ok(
    badge.axes.shape.includes('dot'),
    'the dot is shared with badge, and badge no longer names it',
  );
});

/**
 * Three steps, reading the control type and glyph scales — the only scales the
 * theme restates per density — so a status shrinks with the row it sits in.
 */
test('sizes itself on the scale that answers density', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(statusIndicator.defaults.size, 'md');
});

/**
 * Announcing is off by default. A status present when the page loads is not
 * news, and Shoelace's badge — which writes `role="status"` on every instance
 * — announces text nobody changed.
 */
test('announces only when an application asks it to', () => {
  assert.deepEqual(contract.axes.live, ['off', 'polite', 'assertive']);
  assert.equal(statusIndicator.defaults.live, 'off');
  assert.ok(statusIndicator.capabilities.includes('live'));
});

/**
 * The pulse is an appearance rather than a state: it says a change is
 * happening now, on any of the six statuses, which is what Ant Design's single
 * `processing` value cannot say about a failing deploy.
 */
test('holds the pulse as an appearance, off until a live change asks for it', () => {
  assert.equal(statusIndicator.defaults.pulse, false);
  assert.ok(statusIndicator.capabilities.includes('appearance'));
  assert.ok(!statusIndicator.states.includes('loading'));
});

/**
 * The family reports a state the application owns and never moves it, which is
 * the relationship `progress` declares for a range. The absence is asserted
 * rather than implied, because the next reader's first question is why a
 * family with six values has no state model.
 */
test('holds no state a consumer can own, and therefore no state model', () => {
  for (const capability of statusIndicator.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} would make status a value the family moves`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

/**
 * No hover, no active, no disabled: the family is furniture. `focus-visible`
 * is painted for the one case a consumer creates — a status that became a link
 * through `render` — which is the decision `badge` took first.
 */
test('paints the focus ring for a root the consumer made focusable, and nothing else', () => {
  assert.deepEqual(statusIndicator.states, ['default', 'focus-visible']);
  assert.deepEqual(statusIndicator.capabilities, ['appearance', 'size', 'status', 'live']);
});

test('names one scenario page, because the family has one member', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['statusIndicator']);
  assert.deepEqual(contract.scenarios.statusIndicator, [
    'playground',
    'statuses',
    'marks',
    'sizes',
    'pulse',
    'announcements',
    'context',
    'content',
    'composition',
    'accessibility',
  ]);
});
