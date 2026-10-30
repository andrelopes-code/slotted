import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members['stat-card'];

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'stat-card');
  assert.equal(contract.ui, 'stat-card');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member whose regions are parts: a label, a status, an action, a figure
 * made of a value with its unit and a delta with its indicator, the prose
 * comparison with its period, a trend region for a sparkline, and a message
 * for the two statuses that have no value to show. Every part is optional
 * to the consumer and fixed in its place by the stylesheet; the order here is
 * the reading order.
 *
 * `body` is the grid, one element inside the root, and the binding renders
 * it: the root is the container the query measures, and a query container
 * cannot change its own tracks — `docs/build-briefing.md`, _Decisions already
 * taken_.
 */
test('is one figure whose regions are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['stat-card']);
  assert.equal(member.nativeElement, 'div');
  assert.deepEqual(member.parts, [
    'root',
    'body',
    'header',
    'label',
    'status',
    'action',
    'figure',
    'value',
    'unit',
    'delta',
    'indicator',
    'comparison',
    'period',
    'trend',
    'message',
  ]);
});

/**
 * Nothing on the card is the reader's to move. The action is the consumer's
 * own control; the value is a fact the application states. So there is no
 * state model, and the one state the card carries is the one it does not
 * have a value for yet.
 */
test('holds no mutable state, and says when it is waiting for one', () => {
  assert.ok(!member.capabilities.some((capability) => MUTABLE_CAPABILITIES.includes(capability)));
  assert.equal(contract.stateModel, undefined);
  assert.deepEqual(member.states, ['default', 'loading']);
  assert.deepEqual(contract.stateAttributes, { loading: 'data-loading' });
  assert.equal(member.defaults.loading, false);
});

/**
 * The reason the family exists rather than a card with a big number in it:
 * the colour of a change comes from what the metric means, never from the
 * sign. A rising error rate is bad; a rising conversion is good; a rising
 * session count is neither. `up` is the default because most metrics on most
 * dashboards are counts a team wants more of, and a consumer who disagrees
 * says so once, on the root, and every delta inside inherits it.
 */
test('derives the tone of a change from what the metric means', () => {
  assert.deepEqual(contract.axes.goodWhen, ['up', 'down', 'none']);
  assert.equal(member.defaults.goodWhen, 'up');
  assert.deepEqual(contract.axes.trend, ['up', 'down', 'flat']);
  assert.deepEqual(contract.axes.tone, ['neutral', ...TONES]);
  assert.ok(!('tone' in member.defaults), 'the root carries no tone until a delta gives it one');
});

/**
 * A figure past a threshold the product states is flagged apart from its
 * change: `attention` paints the value and the edge, and the delta keeps the
 * tone its direction earned. Unset by default, because a threshold is the
 * product's to state.
 */
test('flags a figure past a threshold apart from the tone of its change', () => {
  assert.deepEqual(contract.axes.attention, ['warning', 'danger']);
  assert.ok(!('attention' in member.defaults));
});

/**
 * A metric with nothing to show still takes its place in the row. `empty`
 * and `error` are statuses of the value, not of the card, so the card keeps
 * its frame and its height and puts the message where the figure was.
 * `loading` is a state rather than a status because it can coincide with
 * either: a card that errored can be reloading.
 */
test('keeps its place when the value is missing or failed', () => {
  assert.deepEqual(contract.axes.status, ['ready', 'empty', 'error']);
  assert.equal(member.defaults.status, 'ready');
  assert.ok(member.capabilities.includes('status'));
  assert.ok(member.parts.includes('message'));
});

/**
 * The trend sits beside the figure or under it, and the card decides which
 * below a width: `inline` is the default because a row of four cards on a
 * desktop reads the sparkline as an annotation of the number, and `stacked`
 * gives a lone card the full width for the line.
 */
test('puts the trend beside the figure or under it', () => {
  assert.deepEqual(contract.axes.layout, ['inline', 'stacked']);
  assert.equal(member.defaults.layout, 'inline');
});

/**
 * Four frames: the three a card has, and `plain`, which is the card in a
 * table cell or in a row separated by dividers, where a second edge would be
 * a box inside a box. `variant` stays unused because the tone axis is derived
 * from the delta and not chosen.
 */
test('offers the three frames a card has and the one a cell needs', () => {
  assert.deepEqual(contract.axes.fill, ['outline', 'elevated', 'subtle', 'plain']);
  assert.equal(member.defaults.fill, 'outline');
  assert.ok(!('variant' in contract.axes));
});

test('scales its figure in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(member.defaults.size, 'md');
});
