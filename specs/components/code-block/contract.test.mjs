import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS, strongestState } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const codeBlock = contract.members.codeBlock;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because every part reads one block', () => {
  assert.equal(contract.family, 'code-block');
  assert.equal(contract.ui, 'code-block');
  assert.deepEqual(Object.keys(contract.members), ['codeBlock']);
  assert.equal(codeBlock.nativeElement, 'div');
});

/**
 * No APG pattern describes a block of source, and the contract records the
 * absence with the requirements that govern the block instead. Carbon's
 * `role="textbox"` on a block nobody can edit is refused here in writing.
 */
test('records the absent pattern and what governs the block instead', () => {
  assert.equal(contract.pattern, null);
  assert.equal(contract.rootRole, 'none');
  assert.match(contract.patternAbsent.reason, /textbox/);
  const requirements = contract.patternAbsent.governedBy.map((entry) => entry.requirement);
  assert.ok(
    requirements.some((name) => /2\.1\.1/.test(name)),
    'keyboard',
  );
  assert.ok(
    requirements.some((name) => /scrollable-region-focusable/.test(name)),
    'the rule',
  );
  assert.ok(
    requirements.some((name) => /1\.4\.10/.test(name)),
    'reflow',
  );
  for (const entry of contract.patternAbsent.governedBy) {
    assert.match(entry.url, /^https:\/\//, entry.requirement);
    assert.ok(entry.effect, entry.requirement);
  }
});

/**
 * Tokens in, never HTML. The engine is outside the family, and the family's
 * job is the frame: a `<script>` in a code sample is drawn as six characters.
 */
test('takes tokens from an optional engine and never HTML', () => {
  assert.match(contract.input.tokens, /never written with innerHTML/);
  assert.match(contract.input.highlight, /Promise<CodeLine\[\]>/);
  assert.match(contract.input.adapters, /fromPrismTokens and fromShikiTokens/);
  assert.match(contract.input.adapters, /import neither engine/);
  assert.match(contract.declined.engine, /optional package/);
  assert.deepEqual(contract.scopes, [
    'comment',
    'keyword',
    'string',
    'number',
    'function',
    'type',
    'variable',
    'property',
    'punctuation',
    'tag',
    'attribute',
    'constant',
  ]);
});

/**
 * The palette is a theme scale — twelve tokens in the component layer — so a
 * scheme switch reaches every color. An engine's inline color is the one
 * thing a scheme switch cannot reach.
 */
test('paints scopes from a twelve-token scale measured against the fence ground', () => {
  assert.match(
    contract.palette.tokens,
    /--slotted-code-<scope>, twelve, component layer, scheme axis/,
  );
  assert.equal(contract.palette.ground.startsWith('--slotted-surface-sunken'), true);
  assert.match(contract.palette.ratio, /4\.5:1 in light and dark, 7:1 in high-contrast/);
  assert.match(contract.palette.ratio, /default-theme\.test\.mjs/);
});

test('composes scroll-area for the body and description-list’s copy control', () => {
  assert.match(contract.composes.body, /^scroll-area/);
  assert.match(contract.composes.body, /only while the code overflows/);
  assert.match(contract.composes.copy, /@slotted\/core\/clipboard/);
  assert.match(contract.composes.copy, /data-complete/);
  assert.ok(codeBlock.capabilities.includes('copyable'));
  assert.ok(codeBlock.states.includes('complete'));
});

/**
 * Six marks with one precedence, and focus apart from the others because it
 * composes with them. Magic comments are a Markdown convention and a mutation
 * of the code the block claims to show.
 */
test('resolves marks in one order and keeps focus apart', () => {
  assert.deepEqual(contract.marks.precedence, ['remove', 'add', 'error', 'warning', 'highlight']);
  assert.match(contract.marks.focus, /data-dim/);
  assert.match(contract.marks.magicComments, /not parsed/);
  assert.equal(
    contract.dataAttributes['data-mark'].includes('highlight, add, remove, error, warning'),
    true,
  );
});

test('copies the code the consumer gave, without the removed lines', () => {
  assert.match(contract.copy.text, /never the DOM's text/);
  assert.match(contract.copy.removed, /copyRemoved/);
  assert.deepEqual(contract.axes.copyRemoved, ['false', 'true']);
  assert.equal(codeBlock.defaults.copyRemoved, false);
});

/**
 * Two mutable values, two models. Wrap is `pressed` because the control that
 * toggles it is a pressed button and the block's state is the same bit;
 * revealed is the word description-list put in the vocabulary.
 */
test('models wrap as pressed and the collapse as revealed', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['pressed', 'revealed']);
  assert.equal(contract.stateModel.pressed.controlled, 'wrap');
  assert.equal(contract.stateModel.pressed.uncontrolled, 'defaultWrap');
  assert.equal(contract.stateModel.pressed.request, 'onWrapChange');
  assert.equal(contract.stateModel.revealed.controlled, 'revealed');
  assert.ok(contract.stateModel.revealed.reasons.includes('escape'), 'Escape collapses');
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

test('draws the wrap control only while a line overflows', () => {
  assert.match(contract.wrap.control, /only while some line overflows/);
  assert.match(contract.wrap.control, /scroll-area/);
  assert.match(contract.wrap.continuation, /leading whitespace/);
  assert.ok('data-overflow' in contract.dataAttributes);
});

test('reads left to right whatever the page does, and keeps its type across densities', () => {
  assert.match(contract.direction, /^ltr on the pre/);
  assert.match(contract.density, /the type does not/);
});

test('transcribes the keyboard, and owns Escape alone', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.equal(keys.length, 4);
  const escape = contract.keyboard.find((entry) => entry.key === 'Escape');
  assert.equal(escape.source, 'this family');
  const scroll = contract.keyboard[1];
  assert.match(scroll.source, /scroll-area writes none/);
  for (const entry of contract.keyboard) {
    for (const field of ['effect', 'focus', 'source']) {
      assert.ok(entry[field], `${entry.key} names no ${field}`);
    }
  }
});

test('names the owner of every declined capability', () => {
  for (const [capability, reason] of Object.entries(contract.declined)) {
    assert.match(
      reason,
      /tabs|prose|kbd|description-list|consumer|button|scrollport|optional package/,
      `${capability} declines without naming an owner`,
    );
  }
});

test('names the seventeen parts a code block is made of', () => {
  assert.equal(codeBlock.parts.length, 17);
  for (const part of [
    'header',
    'copy',
    'wrap',
    'body',
    'pre',
    'code',
    'line',
    'text',
    'number',
    'token',
  ]) {
    assert.ok(codeBlock.parts.includes(part), part);
  }
});

test('resolves loading over every other state', () => {
  assert.equal(strongestState(codeBlock.states), 'loading');
});

test('lets an application hand the highlighter to every block once', () => {
  assert.deepEqual(contract.provides.codeBlockDefaults, ['highlight', 'lineNumbers', 'copy']);
  assert.deepEqual(contract.resolution.highlight, ['prop', 'defaults', 'none']);
});

test('declares a scenario for every capability the page has to show', () => {
  for (const scenario of [
    'highlight',
    'engines',
    'lineNumbers',
    'marks',
    'diff',
    'focus',
    'wrap',
    'title',
    'collapse',
    'maxLines',
    'copy',
    'loading',
    'content',
    'keyboard',
  ]) {
    assert.ok(contract.scenarios.codeBlock.includes(scenario), scenario);
  }
});
