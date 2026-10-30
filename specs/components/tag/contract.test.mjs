import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
  TONES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

const members = () => Object.values(contract.members);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'tag');
  assert.equal(contract.ui, 'tag');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The guide's rule for this family is that a tag is never several behaviours at
 * once. Every surveyed implementation states that rule and then breaks it with
 * prop combinations: MUI's chip is clickable and deletable together, Ant's is
 * `href` plus `closable`, and Primer's `Token` needed a `hasMultipleActionTargets`
 * branch to keep the DOM legal when the two met.
 *
 * Here the rule is structural. Which behaviour a tag has is which member you
 * reached for, and there is no prop that adds a second one.
 */
test('spends one member on each behaviour a tag can have', () => {
  assert.deepEqual(Object.keys(contract.members), ['tag', 'tagButton', 'tagLink', 'tagToggle']);
});

/**
 * A `button` may not contain a `button` and an `a` may not contain either, so a
 * chip that both acts and removes has to put its two controls side by side.
 * Deciding it once — the root is never the interactive element — is what
 * removes the branch every surveyed implementation carries.
 */
test('never makes the root the interactive element', () => {
  for (const [name, member] of Object.entries(contract.members)) {
    assert.equal(member.nativeElement, 'span', `${name} makes its root interactive`);
    assert.ok(member.parts.includes('body'), `${name} declares no body to be interactive in`);
  }
});

test('gives the words a box of their own, with a glyph slot on either side', () => {
  for (const [name, member] of Object.entries(contract.members)) {
    for (const part of ['root', 'body', 'start', 'label', 'end']) {
      assert.ok(member.parts.includes(part), `${name} is missing the ${part} part`);
    }
    assert.ok(member.capabilities.includes('content'), `${name} declares no content capability`);
  }
});

/** Every member removes, because a filter chip that acts and removes is the common one. */
test('lets any tag be removed, and declares no state for it', () => {
  for (const [name, member] of Object.entries(contract.members)) {
    assert.ok(member.capabilities.includes('removable'), `${name} cannot be removed`);
    assert.ok(member.parts.includes('remove'), `${name} declares no remove part`);
  }
  assert.ok(
    !MUTABLE_CAPABILITIES.includes('removable'),
    'a tag does not own whether it exists; its consumer’s collection does',
  );
  assert.ok(!('removable' in (contract.stateModel ?? {})));
});

/**
 * The one part in this family that contains its family's root instead of
 * sitting inside it, so it carries `data-ui` itself. `badge`'s `anchor` is the
 * only other one, and for the same reason: a `data-part` with no reachable
 * family identifier is selectable only by a name no family owns.
 */
test('reserves the run that holds the tags and owns their keyboard', () => {
  assert.ok(contract.members.tag.parts.includes('group'));
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.equal(contract.members.tag.defaults.orientation, 'horizontal');
  assert.ok(contract.members.tag.capabilities.includes('orientation'));
});

test('separates the colour it speaks in from the way that colour is painted', () => {
  assert.deepEqual(contract.axes.tone, TONES);
  assert.deepEqual(contract.axes.variant, ['solid', 'soft', 'outline', 'dashed']);
  assert.ok(!('fill' in contract.axes), 'fill is the word button retired');
});

/**
 * `soft` for the reason `badge` recorded: a page of solid grey pills reads as a
 * page of controls. A tag is a value, not a command, until a member says so.
 */
test('defaults to the tinted chip, not to a filled one', () => {
  for (const [name, member] of Object.entries(contract.members)) {
    assert.equal(member.defaults.variant, 'soft', `${name} defaults to the wrong painting`);
    assert.equal(member.defaults.tone, 'secondary', `${name} defaults to the wrong tone`);
  }
});

test('scales in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.shape, ['pill', 'square']);
  for (const member of members()) {
    assert.equal(member.defaults.size, 'md');
    assert.equal(member.defaults.shape, 'pill');
  }
});

/**
 * The whole state model, for the one value a tag owns. Carbon, Ant, Fluent and
 * Primer all ship the selectable chip controlled-only; the pair is what lets a
 * filter bar be uncontrolled in a demo and controlled in an application without
 * changing the element.
 */
test('holds its selection with both modes and a request that says how it moved', () => {
  assert.ok(contract.members.tagToggle.capabilities.includes('selection'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'selected',
    uncontrolled: 'defaultSelected',
    request: 'onSelectedChange',
    reasons: ['pointer', 'keyboard'],
  });
  for (const reason of contract.stateModel.selection.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason));
  }
});

test('gives the selection a mark of its own, so colour is never the only signal', () => {
  assert.ok(contract.members.tagToggle.parts.includes('indicator'));
  assert.ok(contract.members.tagToggle.states.includes('selected'));
  assert.equal(contract.stateAttributes.selected, 'data-selected');
});

/** Only the member that holds a selection declares one. */
test('keeps the selection out of the three members that do not hold one', () => {
  for (const name of ['tag', 'tagButton', 'tagLink']) {
    assert.ok(!contract.members[name].capabilities.includes('selection'), name);
    assert.ok(!contract.members[name].states.includes('selected'), name);
    assert.ok(!contract.members[name].parts.includes('indicator'), name);
  }
});

/**
 * A static tag paints hover, press and focus because its remove control does.
 * `focus-visible` is never held back: a control that keeps its place in the tab
 * sequence while unavailable still has to show where focus is.
 */
test('paints every state its controls can be in', () => {
  for (const [name, member] of Object.entries(contract.members)) {
    for (const state of ['default', 'hover', 'active', 'focus-visible', 'disabled']) {
      assert.ok(member.states.includes(state), `${name} never paints ${state}`);
    }
    assert.ok(member.capabilities.includes('disabled'), `${name} cannot be disabled`);
  }
  assert.equal(contract.stateAttributes.disabled, 'data-disabled');
});

test('names one reference page per member, plus the one that compares them', () => {
  assert.deepEqual(Object.keys(contract.scenarios), [
    'overview',
    'tag',
    'tagButton',
    'tagLink',
    'tagToggle',
  ]);
  for (const [page, ids] of Object.entries(contract.scenarios)) {
    assert.ok(ids.length > 0, `${page} names no scenario`);
  }
});
