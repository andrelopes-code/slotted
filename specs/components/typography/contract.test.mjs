import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'typography');
  assert.equal(contract.ui, 'typography');
  assert.equal(contract.schemaVersion, 5);
});

test('declares the two primitives that read text, and nothing else', () => {
  assert.deepEqual(Object.keys(contract.members), ['text', 'heading']);
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.parts, ['root']);
  }
});

test('makes no claim about the element Text renders into', () => {
  assert.equal(contract.members.text.nativeElement, 'span');
});

test('renders a heading as a heading, so the level is the element', () => {
  assert.equal(contract.members.heading.nativeElement, 'h1');
  assert.deepEqual(contract.axes.level, ['1', '2', '3', '4', '5', '6']);
});

test('carries no state: text does not change, it is replaced', () => {
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.states, ['default']);
  }
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
});

test('offers one type scale to both members, seven steps deep', () => {
  assert.deepEqual(contract.axes.size, ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']);
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.capabilities, ['size']);
  }
});

test('lets text take the color of its context before it takes a tone', () => {
  assert.equal(contract.axes.tone[0], 'inherit');
  assert.equal(contract.members.text.defaults.tone, 'inherit');
  assert.equal(contract.members.heading.defaults.tone, 'inherit');
});

test('reads a heading size from its level, and a text size from the scale', () => {
  assert.equal(contract.members.text.defaults.size, 'md');
  assert.equal(contract.members.heading.defaults.size, 'level');
});

test('balances a heading and leaves running text alone', () => {
  assert.equal(contract.members.heading.defaults.wrap, 'balance');
  assert.ok(!('wrap' in contract.members.text.defaults));
  assert.deepEqual(contract.axes.wrap, ['normal', 'nowrap', 'balance', 'pretty']);
});

test('defaults only the axes the family decides, so the rest inherit', () => {
  assert.deepEqual(Object.keys(contract.members.text.defaults), ['size', 'weight', 'tone']);
  for (const axis of ['align', 'transform', 'numeric']) {
    assert.ok(!(axis in contract.members.text.defaults), `${axis} inherits until it is set`);
    assert.ok(!(axis in contract.members.heading.defaults), `${axis} inherits until it is set`);
  }
});

test('emphasises a heading by weight rather than by size alone', () => {
  assert.equal(contract.members.heading.defaults.weight, 'semibold');
  assert.equal(contract.members.text.defaults.weight, 'regular');
});

test('names one reference page per member', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['text', 'heading']);
  assert.ok(contract.scenarios.text.includes('truncation'));
  assert.ok(contract.scenarios.heading.includes('hierarchy'));
});
