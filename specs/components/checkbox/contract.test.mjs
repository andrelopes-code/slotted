import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.checkbox;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'checkbox');
  assert.equal(contract.ui, 'checkbox');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The control is the native element and the mark is its sibling. Firefox
 * renders neither `::before` nor `::after` on an `input`, a glyph token is
 * authored black so it can be masked, and a mask set on the input itself would
 * clip the border and the fill away with it. One element is the price, and it
 * is the one Ark, Radix, Material and Mantine all pay.
 */
test('draws the mark on a sibling of the control, never on the control itself', () => {
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.controlPart, 'control');
  assert.equal(contract.indicator.part, 'indicator');
  assert.equal(contract.indicator.drawnOn, 'sibling');
  assert.equal(contract.indicator.checked, '--slotted-icon-check');
  assert.equal(contract.indicator.indeterminate, '--slotted-icon-minus');
  assert.ok(member.parts.includes('indicator'));
});

/**
 * The label names the control through `for` rather than by wrapping it. The
 * root is a two-column grid — the box in one, the label and the description in
 * the other — and a label that wrapped the control would be one grid item
 * holding both columns, so the description could no longer align under the
 * label text. The gap between box and text belongs to the label's padding, so
 * the target is continuous either way.
 *
 * The description stays outside the label in both arrangements: inside, it
 * would join the accessible name, and a paragraph of help text that toggles a
 * value when it is clicked is a paragraph nobody can read.
 */
test('names the control from a sibling label and keeps the description outside it', () => {
  assert.equal(contract.labelAssociation, 'for');
  assert.equal(contract.generatesControlId, true);
  assert.deepEqual(member.parts, ['root', 'label', 'control', 'indicator', 'description']);
  assert.equal(contract.rootRole, null, 'the root carries no role of its own');
});

test('declares a state model for the one value it holds', () => {
  assert.ok(member.capabilities.includes('checked'));
  assert.ok(MUTABLE_CAPABILITIES.includes('checked'));
  assert.deepEqual(contract.stateModel.checked, {
    controlled: 'checked',
    uncontrolled: 'defaultChecked',
    request: 'onCheckedChange',
    reasons: ['pointer', 'keyboard'],
  });
});

/**
 * `indeterminate` is a state and never a third value of `checked`. Radix models
 * it as `checked="indeterminate"`, which makes the submitted value a union of
 * three things while the form still submits two; `docs/component-features.md`
 * §6 asks for the opposite, and the platform agrees: `indeterminate` is an IDL
 * property that leaves `checked` alone.
 */
test('keeps indeterminate a state and leaves the submitted value boolean', () => {
  assert.ok(member.states.includes('indeterminate'));
  assert.equal(contract.stateAttributes.indeterminate, 'data-indeterminate');
  assert.ok(!MUTABLE_CAPABILITIES.includes('indeterminate'));
  assert.equal(member.defaults.indeterminate, false);
});

/**
 * The whole keyboard is the platform's. `Space` toggles, `Enter` submits the
 * form rather than the control, and neither is a listener this family writes.
 */
test('binds no key of its own', () => {
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Space'],
  );
  assert.ok(contract.keyboard.every((entry) => entry.source === 'platform'));
  assert.equal(contract.escapeBound, false);
});

/**
 * The field-aware control mechanism, with one departure: this control owns its
 * own label, so a field's `id` would give it a second one.
 */
test('reads the field for state and never takes its identifier', () => {
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.wiring.id, 'never');
  assert.equal(field.wiring.id, 'always');
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
});

/**
 * The platform has no `readonly` for a checkbox, so the state is announced and
 * enforced rather than borrowed. It is not painted as `disabled`: a read-only
 * value is real, focusable and submitted.
 */
test('announces read-only, because the element cannot', () => {
  assert.equal(contract.readOnlyAttribute, 'aria-readonly');
  assert.ok(member.capabilities.includes('readOnly'));
  assert.ok(member.states.includes('readonly'));
});

test('mirrors exactly the states its stylesheet paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), [
    'checked',
    'indeterminate',
    'disabled',
    'invalid',
    'readonly',
  ]);
  assert.ok(!member.states.includes('required'), 'the necessity mark belongs to the label');
});

/**
 * `labelPlacement` is never inherited from the field. The field's axis answers
 * where a field's label sits relative to its control; this one answers which
 * side of its own label the box is on, and the two share a name and no meaning.
 */
test('resolves its axes in one stated order, and not through the field', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.labelPlacement, ['end', 'start']);
  assert.deepEqual(contract.resolution.size, ['prop', 'group', 'field', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.labelPlacement, ['prop', 'group', 'defaults', 'end']);
  assert.ok(!contract.resolution.labelPlacement.includes('field'));
  assert.ok(field.provides.fieldDefaults.includes('labelPlacement'));
});

test('lets an application decide once what its checkboxes look like', () => {
  assert.deepEqual(contract.provides.checkboxDefaults, ['size', 'variant', 'labelPlacement']);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.checkbox, [
    'playground',
    'sizes',
    'tile',
    'states',
    'indeterminate',
    'placement',
    'description',
    'field',
    'content',
    'composition',
    'keyboard',
  ]);
});

/**
 * A choice drawn as a framed surface stays inside this family. Three of the
 * implementations surveyed put it here — Mantine's `Checkbox.Card`, Chakra's
 * `CheckboxCard` and React Aria's `CheckboxButton` — and the surface `card`
 * draws is a content container that knows nothing of `size` arriving from a
 * field, of `invalid`, of `readonly` or of `required`. `card` keeps
 * `data-part="selection"` for a choice that lives inside real card content;
 * this axis is for a choice that is the whole of what the surface holds.
 *
 * The name is `tile` rather than `card`, which is what Mantine and Chakra call
 * it, because `card` is already a family here and one word may not name two
 * things. Carbon and Cloudscape both call the framed choice a tile.
 */
test('draws a choice as a framed surface without leaving the family', () => {
  assert.deepEqual(contract.axes.variant, ['plain', 'tile']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'group', 'defaults', 'plain']);
  assert.equal(member.defaults.variant, 'plain');
  assert.ok(member.capabilities.includes('appearance'));
});
