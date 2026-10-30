import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const numberField = JSON.parse(
  await readFile(new URL('../number-field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.slider;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'slider');
  assert.equal(contract.ui, 'slider');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * Angular Material's thumbs are `input[matSliderThumb]` elements and Base UI's
 * `Slider.Thumb` renders a `div` with a nested `input[type=range]`; Radix and
 * Ark write `role="slider"` on a `span` instead. The native element is taken,
 * in both bindings, because it carries the role, the value set, form
 * submission, form reset and `disabled` without the family writing any of them.
 */
test('holds each value in a native range input rather than in a role', () => {
  assert.equal(contract.controlPart, 'input');
  assert.equal(contract.controlElement, 'input[type=range]');
  assert.equal(contract.controlRole, 'slider');
  assert.equal(contract.roleFrom, 'platform');
  assert.equal(contract.ariaValueFrom, 'element');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.thumbPerValue, true);
});

/**
 * Ten parts. `track` is the containing block for everything with a position on
 * the scale, so a thumb at either bound is contained rather than half outside
 * the control. `indicator` is Base UI's word for the filled portion: Radix and
 * Ark call it `Range`, and this family does not, because a range slider is
 * already a thing the family is.
 */
test('draws a track holding the fill, the marks and one thumb per value', () => {
  assert.deepEqual(Object.keys(contract.members), ['slider']);
  assert.deepEqual(member.parts, [
    'root',
    'output',
    'control',
    'track',
    'indicator',
    'mark',
    'mark-label',
    'thumb',
    'input',
    'bubble',
  ]);
  assert.ok(!member.parts.includes('range'), 'the filled portion is the indicator');
  assert.ok(!member.parts.includes('label'), 'the label belongs to the field around it');
});

/**
 * The APG Slider Pattern's own table, plus the two modifier steps and the
 * larger step it lists as optional. The family binds all of it rather than
 * leaving the arrows to the element: browsers disagree about Page Up on a range
 * input — Chrome moves by a tenth of the range and Firefox by one step — and
 * `largeStep` has to mean one thing in both bindings.
 */
test('binds every key the sourced pattern lists, and owns the table', () => {
  assert.equal(contract.keyboardOwner, 'family');
  assert.deepEqual(contract.keyboard, [
    { key: 'ArrowRight', effect: 'increase', by: 'step', mirrors: true },
    { key: 'ArrowLeft', effect: 'decrease', by: 'step', mirrors: true },
    { key: 'ArrowUp', effect: 'increase', by: 'step', mirrors: false },
    { key: 'ArrowDown', effect: 'decrease', by: 'step', mirrors: false },
    { key: 'Shift+ArrowRight', effect: 'increase', by: 'largeStep', mirrors: true },
    { key: 'Shift+ArrowLeft', effect: 'decrease', by: 'largeStep', mirrors: true },
    { key: 'Shift+ArrowUp', effect: 'increase', by: 'largeStep', mirrors: false },
    { key: 'Shift+ArrowDown', effect: 'decrease', by: 'largeStep', mirrors: false },
    { key: 'PageUp', effect: 'increase', by: 'largeStep', mirrors: false },
    { key: 'PageDown', effect: 'decrease', by: 'largeStep', mirrors: false },
    { key: 'Home', effect: 'min', mirrors: false },
    { key: 'End', effect: 'max', mirrors: false },
  ]);
  assert.equal(contract.stepDefaults.largeStep, numberField.stepDefaults.largeStep);
});

/**
 * The inline arrows follow the reading direction and the block arrows do not: a
 * scale has a direction and bidi is not it. The APG's note that reversing the
 * direction "could create a more intuitive experience" is what a right-to-left
 * document is.
 */
test('mirrors only the arrows that name an inline side', () => {
  const mirrored = contract.keyboard.filter((entry) => entry.mirrors).map((entry) => entry.key);

  assert.deepEqual(mirrored, ['ArrowRight', 'ArrowLeft', 'Shift+ArrowRight', 'Shift+ArrowLeft']);
});

/**
 * The multi-thumb pattern: "the values of aria-valuemin or aria-valuemax of the
 * dependent sliders are updated when the value changes". Each input's own `min`
 * and `max` follow its neighbour, so the announced range is right and the
 * clamping is the platform's. Home and End therefore reach the thumb's bounds
 * rather than the scale's.
 */
test('moves each thumb’s own bounds to its neighbour', () => {
  assert.equal(contract.boundsFollowNeighbour, true);
  assert.equal(contract.homeEndReach, 'thumb');
  assert.equal(contract.range.minStepsBetween, 'minStepsBetween');
});

/** The second half of the multi-thumb pattern: the tab order never moves. */
test('keeps the tab order the array’s order however the thumbs move', () => {
  assert.equal(contract.tabOrder, 'declaration');
});

/**
 * The inputs are unhittable so that one press can pick the nearest thumb and
 * keep dragging it past the pointer leaving the element, which is what
 * `setPointerCapture` is for.
 */
test('owns the pointer as well, and says how', () => {
  assert.deepEqual(contract.pointer, {
    trackPress: 'nearest',
    drag: 'family',
    capture: 'setPointerCapture',
    inputPointerEvents: 'none',
  });
});

/**
 * One mutable value that is a number or an array of them. Splitting single and
 * range into two families would be two answers to one question, and six of the
 * nine surveyed implementations put them in one.
 */
test('declares one state model, over one value or several', () => {
  assert.ok(member.capabilities.includes('value'));
  assert.ok(MUTABLE_CAPABILITIES.includes('value'));
  assert.equal(contract.valueType, 'number | number[]');
  assert.deepEqual(contract.stateModel, {
    value: {
      controlled: 'value',
      uncontrolled: 'defaultValue',
      request: 'onValueChange',
      reasons: ['pointer', 'keyboard', 'programmatic'],
    },
  });
});

/**
 * A drag emits a hundred changes and one commit. They are two transitions, not
 * two events for one, which is the failure `docs/state-and-events.md` names.
 * Radix, Base UI, Ark, Mantine and Angular Material all ship the second one.
 */
test('separates the end of a drag from the changes inside it', () => {
  assert.equal(contract.commitRequest, 'onValueCommit');
  assert.notEqual(contract.commitRequest, contract.stateModel.value.request);
});

/**
 * `blur` is absent because nothing is committed by leaving the control: a
 * slider has no text to parse. `clear` is absent because there is no empty
 * value to return to — a range input always holds a number.
 */
test('emits only the reasons this control can produce', () => {
  assert.deepEqual(contract.stateModel.value.reasons, ['pointer', 'keyboard', 'programmatic']);
});

/**
 * `input[type=range]` is not in the list of types `readonly` applies to, so the
 * platform has nothing to give here and the family refuses the change itself. A
 * read-only slider stays focusable and stays submitted, which is what separates
 * it from a disabled one.
 */
test('takes its state from the field, and answers read-only where the platform cannot', () => {
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.mirrorsState, true);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.equal(contract.readOnlyAttribute, 'aria-readonly');

  const shared = { ...field.wiring };
  delete shared.readonly;
  const { 'aria-readonly': ariaReadonly, ...rest } = contract.wiring;
  assert.deepEqual(rest, shared, 'every other row is the field’s, unchanged');
  assert.equal(ariaReadonly, 'readOnly');
});

test('mirrors onto the root exactly the states it paints', () => {
  assert.deepEqual(Object.keys(contract.stateAttributes), [
    'disabled',
    'invalid',
    'readonly',
    'dragging',
  ]);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'invalid',
    'readonly',
    'dragging',
  ]);
});

/**
 * The APG names `aria-valuetext` for a value that is not user-friendly and
 * gives "Monday" as the example. A mark that already carries a label is that
 * string, so a five-step quality scale announces "Medium" rather than "50"
 * without a consumer writing the function Ark and Mantine both require.
 */
test('lets a mark’s label become the announced value', () => {
  assert.equal(contract.valueTextFromMark, true);
  assert.ok(contract.ariaValue.includes('aria-valuetext'));
});

/** One library, one word for one idea: the axis and the formatter `number-field` ships. */
test('shares its size vocabulary and its formatter with the sibling control', () => {
  assert.deepEqual(contract.axes.size, numberField.axes.size);
  assert.deepEqual(contract.resolution.size, numberField.resolution.size);
  assert.equal(contract.format.options, numberField.format.options);
  assert.equal(contract.format.core, numberField.core);
});

test('offers both orientations and three ways to show the number', () => {
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.deepEqual(contract.axes.valueLabel, ['auto', 'always', 'none']);
});

test('lets an application decide once what its sliders look like', () => {
  assert.deepEqual(contract.provides.sliderDefaults, ['size', 'orientation', 'valueLabel']);
});

/** The one action a value cannot express: putting focus on a named thumb. */
test('exposes only the imperative action the platform does not already give', () => {
  assert.deepEqual(contract.imperative, ['focusThumb']);
});

test('keeps the geometry and the stepping in the shared core', () => {
  assert.equal(contract.core, '@slotted/core/slider');
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.slider, [
    'playground',
    'sizes',
    'orientation',
    'range',
    'marks',
    'origin',
    'format',
    'valueLabel',
    'states',
    'content',
    'composition',
    'keyboard',
  ]);
});
