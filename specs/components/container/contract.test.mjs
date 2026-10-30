import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'container');
  assert.equal(contract.ui, 'container');
  assert.equal(contract.schemaVersion, 5);
});

test('renders a div until the consumer says what the element is', () => {
  assert.equal(contract.members.container.nativeElement, 'div');
});

test('holds a bound and a way out of it, and nothing else', () => {
  assert.deepEqual(Object.keys(contract.members), ['container']);
  assert.deepEqual(contract.members.container.parts, ['root', 'breakout']);
});

test('names no part for the bounded column, because a track is not an element', () => {
  assert.ok(
    !contract.members.container.parts.includes('content'),
    'a content part would be a second box to style and a second place to state the bound',
  );
});

test('carries no state: a container is told what to bound and bounds it', () => {
  assert.deepEqual(contract.members.container.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
});

test('declares the size capability, and does not claim to arrange', () => {
  assert.deepEqual(contract.members.container.capabilities, ['size']);
  assert.ok(
    !contract.members.container.capabilities.includes('arrangement'),
    'arrangement obliges gap and justify, and separation belongs to stack',
  );
});

test('bounds by five steps named for what they bound, not by t-shirt letters', () => {
  assert.deepEqual(contract.axes.size, ['measure', 'content', 'wide', 'full', 'bleed']);
  for (const letter of ['sm', 'md', 'lg']) {
    assert.ok(!contract.axes.size.includes(letter), `${letter} hides which choice was made`);
  }
});

test('owns comfortable measure, which no other family may offer', () => {
  assert.ok(
    contract.axes.size.includes('measure'),
    'the briefing gives measure to this family and to no other',
  );
});

/**
 * The step that removes the maximum is `bleed`, and `full` is bounded: `full`
 * is what a person types to mean "use the screen", and an application that
 * typed it on every route was unreadable on an ultra-wide display. The value
 * written without thinking is the safe one; the other is asked for by name.
 */
test('keeps a step that removes the maximum without removing the container', () => {
  assert.ok(contract.axes.size.includes('bleed'));
  assert.equal(contract.axes.size.at(-1), 'bleed');
  assert.ok(contract.axes.size.includes('full'));
});

test('insets by the same scale the layout families take their gap from', () => {
  assert.deepEqual(contract.axes.inset, [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
  ]);
});

test('places the bounded column, rather than only centering it', () => {
  assert.deepEqual(contract.axes.align, ['center', 'start', 'end']);
});

test('takes the logical keywords, so a mirrored document is the same component', () => {
  for (const physical of ['left', 'right']) {
    assert.ok(!contract.axes.align.includes(physical), `${physical} does not mirror`);
  }
});

test('defaults to the bounded step whose failure is visible', () => {
  assert.equal(
    contract.members.container.defaults.size,
    'content',
    'a dashboard that inherits content looks wrong at once; a settings page that inherits wide does not',
  );
});

test('defaults every axis it decides, and decides all three', () => {
  assert.deepEqual(Object.keys(contract.members.container.defaults), ['size', 'inset', 'align']);
  assert.equal(contract.members.container.defaults.inset, '6');
  assert.equal(contract.members.container.defaults.align, 'center');
});

test('offers no axis that separates children, because that is the stack', () => {
  const axes = Object.keys(contract.axes);
  for (const axis of ['gap', 'justify', 'padding', 'direction']) {
    assert.ok(!axes.includes(axis), `${axis} belongs to another family`);
  }
});

test('offers no axis keyed on the viewport', () => {
  const axes = Object.keys(contract.axes);
  for (const axis of ['breakpoint', 'display', 'hidden', 'fluid']) {
    assert.ok(!axes.includes(axis), `${axis} answers the viewport, not the container`);
  }
});

test('names one reference page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['container']);
  assert.ok(contract.scenarios.container.includes('measure'));
  assert.ok(contract.scenarios.container.includes('breakout'));
  assert.ok(contract.scenarios.container.includes('accessibility'));
});
