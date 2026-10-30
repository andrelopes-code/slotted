import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.chart;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'chart');
  assert.equal(contract.ui, 'chart');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A `figure` takes its name from its `figcaption`, so the title the reader
 * sees is the name the tree announces without an `aria-label` restating it.
 */
test('is a figure named by its caption', () => {
  assert.equal(member.nativeElement, 'figure');
  assert.equal(contract.rootRole, 'figure');
  assert.ok(member.parts.includes('header'));
  assert.ok(member.parts.includes('title'));
});

/**
 * The engine draws marks and nothing a reader operates. Legend, tooltip, title
 * and toolbar are the family's HTML, so the four components that would draw
 * them inside the engine are never registered — which is also what keeps them
 * out of the bundle.
 */
test('draws its own legend, tooltip, title and actions, and never registers the engine’s', () => {
  assert.deepEqual(contract.engine.neverRegistered.sort(), [
    'LegendComponent',
    'TitleComponent',
    'ToolboxComponent',
    'TooltipComponent',
  ]);
  for (const part of ['legend', 'legend-item', 'tooltip', 'tooltip-item', 'actions']) {
    assert.ok(member.parts.includes(part), `${part} is not a part`);
  }
  assert.equal(contract.engine.dependency, 'optional peer');
});

/**
 * The tooltip is hidden from the tree because the live announcer says the same
 * sentence when the active point moves by keyboard; the two together read every
 * point twice.
 */
test('hides the tooltip from the tree and names the plot by the title', () => {
  assert.match(contract.tooltip.hidden, /^aria-hidden/);
  assert.equal(contract.plot.role, 'group');
  assert.equal(contract.plot.focusable, true);
  assert.match(contract.plot.name, /title/);
  assert.match(contract.plot.description, /summary/);
  assert.ok(member.capabilities.includes('live'));
});

/**
 * Six values the reader moves, and each is the consumer's to own: a hidden
 * series, the point under the pointer or the keyboard, a selected point, the
 * zoomed window, the table view and the whole screen. Each has a pair and a
 * request.
 */
test('models every value the reader moves', () => {
  const mutable = member.capabilities.filter((capability) =>
    MUTABLE_CAPABILITIES.includes(capability),
  );
  assert.deepEqual(mutable.sort(), [
    'current',
    'fullscreen',
    'open',
    'selection',
    'visibility',
    'zoom',
  ]);
  assert.deepEqual(Object.keys(contract.stateModel).sort(), mutable.sort());
  assert.equal(contract.stateModel.visibility.controlled, 'hidden');
  assert.equal(contract.stateModel.current.controlled, 'activePoint');
  assert.equal(contract.stateModel.zoom.controlled, 'zoom');
  assert.equal(contract.stateModel.open.controlled, 'tableOpen');
});

/**
 * Leaving the plot clears the point the keyboard was on, and says so: a
 * consumer that syncs two charts has to tell a reader who left from one who
 * pressed Escape.
 */
test('says why the active point cleared', () => {
  const reasons = contract.stateModel.current.reasons;
  for (const reason of ['pointer', 'keyboard', 'blur', 'escape']) {
    assert.ok(reasons.includes(reason), `${reason} missing`);
  }
  assert.ok(contract.stateModel.zoom.reasons.includes('clear'), 'the reset control clears');
});

/**
 * The plot keeps the arrow keys of the Grid pattern — series are rows, points
 * are columns, and focus stops at an edge rather than wrapping — because the
 * APG has no chart pattern and a reader who knows a grid knows this.
 */
test('moves through points and series with the arrow keys of a grid', () => {
  const plot = contract.keyboard.filter((entry) => entry.target === 'plot');
  const keys = plot.map((entry) => entry.key);
  for (const key of [
    'ArrowRight',
    'ArrowLeft',
    'ArrowDown',
    'ArrowUp',
    'Home',
    'End',
    'PageDown',
    'PageUp',
    'Enter',
    'Space',
    'Escape',
  ]) {
    assert.ok(keys.includes(key), `${key} missing on the plot`);
  }
  assert.match(plot.find((entry) => entry.key === 'ArrowRight').effect, /stops/);
});

/**
 * The legend is one tab stop, as a toolbar is, and it wraps where the plot
 * stops: a legend is a row of controls, not a coordinate space.
 */
test('treats the legend as a toolbar of toggles', () => {
  const legend = contract.keyboard.filter((entry) => entry.target === 'legend');
  assert.ok(
    legend.some((entry) => entry.key === 'Shift+Enter'),
    'isolating a series',
  );
  assert.match(legend.find((entry) => entry.key === 'ArrowRight').effect, /wrapping/);
  assert.ok(member.states.includes('pressed'));
});

/**
 * Eight slots, assigned in order, never cycled. A ninth series painted in the
 * first slot's colour would be a second series nobody can tell from the first.
 */
test('assigns the data scale in order and never cycles it', () => {
  assert.equal(contract.slots.count, 8);
  assert.equal(contract.slots.cycles, false);
  assert.deepEqual(contract.slots.precedence, ['tone', 'slot', 'position']);
  assert.deepEqual(contract.axes.slot, ['1', '2', '3', '4', '5', '6', '7', '8']);
});

/**
 * A straight segment passes through the points it joins; a curve draws where
 * no point is, so it is offered and not the default.
 */
test('joins points with straight segments unless asked otherwise', () => {
  assert.equal(member.defaults.curve, 'linear');
  assert.deepEqual(contract.axes.curve, ['linear', 'monotone', 'step']);
});

test('does not mirror the plot in a right-to-left document', () => {
  assert.match(contract.direction, /plot does not mirror/);
});

/**
 * Every scenario the reference pages and the harness show, and every state
 * section 18 asks of a family: loading, empty, error and extreme content.
 */
test('declares a scenario for every kind and every waiting state', () => {
  const scenarios = contract.scenarios.chart;
  for (const kind of contract.axes.kind) {
    assert.ok(scenarios.includes(kind), `${kind} has no scenario`);
  }
  for (const state of ['loading', 'empty', 'error', 'all-hidden', 'long-labels', 'large-data']) {
    assert.ok(scenarios.includes(state), `${state} has no scenario`);
  }
});

/**
 * A dashboard puts charts side by side, and a card that grows when its data
 * arrives, when its legend wraps or when its table opens moves every card
 * under it. Every state shares one set of boxes, the legend holds one line,
 * and the table opens inside the plot.
 */
test('keeps one height through every state and every view', () => {
  assert.match(contract.layout.heightStable, /same boxes/);
  assert.match(contract.layout.table, /inside/);
  assert.match(contract.layout.legend, /one line/);
  assert.ok(member.parts.includes('legend-more'));
  assert.deepEqual(contract.axes.variant, ['plain', 'card']);
  assert.equal(member.defaults.variant, 'plain');
});

/**
 * Fullscreen is the reader's to take and a consumer's to own, and the word
 * the vocabulary already has for it — `dialog` put it there.
 */
test('takes the whole screen on the reader’s word, and leaves it on Escape', () => {
  assert.ok(member.capabilities.includes('fullscreen'));
  assert.equal(contract.stateModel.fullscreen.controlled, 'fullscreen');
  assert.ok(contract.stateModel.fullscreen.reasons.includes('escape'));
  assert.ok(member.parts.includes('fullscreen-toggle'));
});

/**
 * Colour is retuned through tokens and chosen through meaning, never passed
 * as a value: a colour prop is the arbitrary colour §2.4 keeps out of the
 * contract.
 */
test('retunes colour through tokens and three palettes, never through a colour value', () => {
  assert.deepEqual(contract.axes.palette, ['categorical', 'sequential', 'focus']);
  assert.match(contract.palette.categorical, /--slotted-chart-color-1\.\.8/);
  assert.match(contract.palette.override, /no series takes an arbitrary colour/);
});

test('gathers its own controls in a toolbar that can step back', () => {
  for (const part of [
    'toolbar',
    'view-toggle',
    'fullscreen-toggle',
    'menu-trigger',
    'zoom-reset',
  ]) {
    assert.ok(member.parts.includes(part), `${part} missing`);
  }
  assert.ok(!member.parts.includes('table-trigger'), 'the table is a view of the plot now');
  assert.deepEqual(contract.axes.toolbar, ['visible', 'hover', 'none']);
});
