import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.sparkline;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'sparkline');
  assert.equal(contract.ui, 'sparkline');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The root is an inline element with the image role, because a sparkline is
 * read beside a value — in a card's trend region, in a table cell — and a
 * block would break the line it sits on. The `svg` inside is a part, not the
 * root: the accessible name lives on the element the consumer can reach, and
 * the drawing is hidden from the tree as the pixels it is.
 */
test('is an inline image whose drawing is a part', () => {
  assert.equal(member.nativeElement, 'span');
  assert.deepEqual(member.parts, [
    'root',
    'plot',
    'area',
    'line',
    'bar',
    'reference',
    'ring',
    'marker',
  ]);
});

/**
 * `data` is a quantity the consumer states and the family draws — the word
 * `measurement` was put in the vocabulary for exactly this by
 * `progress-indicator`. Nothing here is the reader's to move, so there is no
 * state model, no keyboard and no focus.
 */
test('draws a measurement and holds no mutable state', () => {
  assert.ok(member.capabilities.includes('measurement'));
  assert.ok(!member.capabilities.some((capability) => MUTABLE_CAPABILITIES.includes(capability)));
  assert.equal(contract.stateModel, undefined);
  assert.deepEqual(member.states, ['default']);
});

/**
 * Two forms and no third: a line for a trend and bars for a count per period.
 * MUI, Polaris, SAP and Tremor ship the same pair; an area is the line with
 * its wash, not a form of its own.
 */
test('draws a line or bars, and starts as a line', () => {
  assert.deepEqual(contract.axes.type, ['line', 'bar']);
  assert.equal(member.defaults.type, 'line');
  assert.equal(member.defaults.area, false);
});

/**
 * A straight segment passes through the two points it joins and nowhere else;
 * a monotone curve is offered because a smoothed trend reads faster, and it is
 * not the default because it draws where no point is.
 */
test('joins points with straight segments unless asked to smooth them', () => {
  assert.deepEqual(contract.axes.curve, ['linear', 'monotone']);
  assert.equal(member.defaults.curve, 'linear');
});

/**
 * Colour resolves in one order: a tone says how the series is doing, a series
 * says which one it is, and a sparkline that names neither reads the colour
 * its container states or falls back to the first data slot. The tone axis is
 * the five tones of the theme plus `neutral`, which is the comparison series
 * and the aside; the series axis is the eight slots of the data scale,
 * in the order the foundation fixes, and nothing may be added to it here.
 */
test('takes a tone or a data slot, and names no default for either', () => {
  assert.deepEqual(contract.axes.tone, ['neutral', ...TONES]);
  assert.deepEqual(
    contract.axes.series,
    Array.from({ length: 8 }, (_, index) => String(index + 1)),
  );
  assert.ok(!('tone' in member.defaults), 'an absent tone is what lets a container decide');
  assert.ok(!('series' in member.defaults), 'an absent series is what lets a container decide');
});

/**
 * The marker is the one point that is labelled: the last one, which is the
 * value the reader is asked about. A dot on every point is what the dataviz
 * rule against a number on every point exists to refuse.
 */
test('marks the last point by default and no other', () => {
  assert.equal(member.defaults.marker, true);
  assert.ok(member.parts.includes('marker'));
  /* The ring is its own part because it is its own stroke: a zero-length
     path with a round cap is a disc whose diameter is its stroke width, and
     a disc cannot carry a second stroke around itself. Two paths, one
     under the other, is what keeps both circular under a stretched grid. */
  assert.ok(member.parts.includes('ring'));
});

/**
 * The height is the family's; the width is the container's. Before the box is
 * measured — on the server, on the first paint — the drawing is laid out on
 * the nominal grid of its size step, and the contract states that grid so both
 * bindings draw the same first frame.
 */
test('states the nominal grid each size step is drawn on before it is measured', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(member.defaults.size, 'md');
  assert.deepEqual(Object.keys(contract.nominalSize), contract.axes.size);
  for (const size of contract.axes.size) {
    const { width, height } = contract.nominalSize[size];
    assert.ok(width > height, `${size} is wider than it is tall`);
    assert.ok(height >= 20, `${size} has room for a 2px line and an 8px marker`);
  }
});

/** The series is the consumer's; a default series would be invented data. */
test('declares no default series', () => {
  assert.ok(!('data' in member.defaults));
});
