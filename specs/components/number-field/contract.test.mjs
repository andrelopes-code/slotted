import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const textField = JSON.parse(
  await readFile(new URL('../text-field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.numberField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'number-field');
  assert.equal(contract.ui, 'number-field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A frame around the control, for the reason `text-field` records: WAI-ARIA
 * limits the children of a `spinbutton`, like those of a `textbox`, to
 * non-interactive presentational content, so the two stepper buttons are
 * siblings of the control inside a frame with no role.
 *
 * `stepper` is a part rather than a layout decision taken in markup: it becomes
 * `display: contents` under the split layout, so one DOM tree serves both
 * arrangements and a consumer may change the axis after render.
 */
test('draws a frame holding the control, its adornments and its two steppers', () => {
  assert.deepEqual(Object.keys(contract.members), ['numberField']);
  assert.deepEqual(member.parts, [
    'root',
    'input',
    'start',
    'end',
    'scrub',
    'stepper',
    'decrement',
    'increment',
  ]);
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.controlPart, 'input');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
});

/**
 * `type="number"` sanitizes any text that is not a valid floating-point number
 * to the empty string, so no locale's grouping separator, decimal comma or
 * currency affix survives it. Carbon states the same boundary in its own props
 * and MDN's accessibility note reaches it from the other side.
 */
test('holds the value in a text input rather than in a number input', () => {
  assert.equal(contract.inputType, 'text');
  assert.notEqual(contract.inputType, 'number');
  assert.equal(contract.hiddenValueInput, true, 'the raw number needs somewhere to be submitted');
});

/**
 * The APG's Spinbutton Pattern, taken whole. React Aria strips the role and
 * announces the value through a live region instead; this library has no live
 * announcer until wave 5, and without the role nothing declarative says a
 * maximum exists.
 */
test('takes the APG spinbutton role with the whole value set', () => {
  assert.equal(contract.controlRole, 'spinbutton');
  assert.deepEqual(contract.ariaValue, [
    'aria-valuenow',
    'aria-valuemin',
    'aria-valuemax',
    'aria-valuetext',
  ]);
  assert.ok(
    !('aria-roledescription' in (contract.wiring ?? {})),
    'renaming a role the pattern already names hides it',
  );
});

/** The pattern's own keyboard table, plus the two modifier steps two libraries ship. */
test('binds every key the sourced pattern lists', () => {
  assert.deepEqual(contract.keyboard, [
    { key: 'ArrowUp', effect: 'step', by: 'step' },
    { key: 'ArrowDown', effect: 'step', by: 'step' },
    { key: 'Shift+ArrowUp', effect: 'step', by: 'largeStep' },
    { key: 'Shift+ArrowDown', effect: 'step', by: 'largeStep' },
    { key: 'Alt+ArrowUp', effect: 'step', by: 'smallStep' },
    { key: 'Alt+ArrowDown', effect: 'step', by: 'smallStep' },
    { key: 'PageUp', effect: 'step', by: 'largeStep' },
    { key: 'PageDown', effect: 'step', by: 'largeStep' },
    { key: 'Home', effect: 'min' },
    { key: 'End', effect: 'max' },
    { key: 'Enter', effect: 'commit' },
  ]);
  assert.equal(contract.escapeBound, false);
  assert.equal(
    contract.enterSubmits,
    true,
    'a single-line control submits its form, and the commit does not intercept it',
  );
});

/**
 * The APG: "the text field is usually the only focusable component". Zag and
 * React Spectrum both take the steppers out of the tab order, and a form of
 * twenty amounts would otherwise cost forty extra tab stops. They keep real
 * names and `aria-controls`, so a screen-reader cursor still reaches them.
 */
test('keeps the steppers out of the tab order and in the accessibility tree', () => {
  assert.equal(contract.stepperTabIndex, -1);
  assert.deepEqual(contract.stepperNames, ['increment', 'decrement']);
  assert.equal(contract.stepperDisabledAtBound, true);
});

/**
 * One mutable value, and `null` is part of it: a required amount left blank and
 * an amount of nought are different facts, and a family that collapsed them
 * would report a filled field to its form.
 */
test('declares one state model, over a number that may be empty', () => {
  assert.ok(member.capabilities.includes('value'));
  assert.ok(MUTABLE_CAPABILITIES.includes('value'));
  assert.equal(contract.valueType, 'number | null');
  assert.deepEqual(contract.stateModel, {
    value: {
      controlled: 'value',
      uncontrolled: 'defaultValue',
      request: 'onValueChange',
      reasons: ['keyboard', 'pointer', 'blur', 'programmatic'],
    },
  });
});

/**
 * `blur` is the commit that formats and clamps, and it is the reason a value
 * can move without a keystroke. `clear` is absent because the family draws no
 * clear button: emptying the control is an edit, and an edit is `keyboard`.
 */
test('emits only the reasons this control can produce', () => {
  assert.deepEqual(contract.stateModel.value.reasons, [
    'keyboard',
    'pointer',
    'blur',
    'programmatic',
  ]);
});

/**
 * The number moves on every keystroke that parses, and the text takes the
 * locale's shape on the same keystroke. `commit` is still where the value is
 * rounded, padded and put back inside the range — `formatOn` decides when the
 * grouping appears, not when the number is settled.
 *
 * The family shipped its first release formatting only at a commit, on the
 * grounds that reformatting mid-keystroke moves the caret. That was true of
 * the implementation, not of the idea: the caret is now measured in the
 * reader's own characters rather than in string indices, which is what
 * `@slotted/core/number` added and what its tests hold.
 */
test('says when the text is rewritten and when the number moves', () => {
  assert.equal(contract.parseOn, 'input');
  assert.deepEqual(contract.axes.formatOn, ['change', 'commit']);
  assert.deepEqual(contract.resolution.formatOn, ['prop', 'defaults', 'change']);
  assert.equal(contract.members.numberField.defaults.formatOn, 'change');
  assert.ok(contract.provides.numberFieldDefaults.includes('formatOn'));
  assert.deepEqual(contract.commitOn, ['blur', 'enter', 'step', 'wheel', 'scrub']);
});

test('states the range, the three steps and the policies over them', () => {
  assert.deepEqual(contract.range, {
    min: 'min',
    max: 'max',
    step: 'step',
    largeStep: 'largeStep',
    smallStep: 'smallStep',
    stepFrom: 'stepFrom',
  });
  assert.deepEqual(contract.axes.clamp, ['blur', 'strict', 'none']);
  assert.equal(contract.stepDefaults.largeStep, 'step * 10');
  assert.equal(contract.stepDefaults.smallStep, 'step / 10');
  assert.equal(contract.stepDefaults.stepFrom, 'min, or 0');
});

/**
 * Currency and percent are formattings of one numeric type, which is what
 * `docs/component-features.md` states for this family. A `mode` axis would make
 * them three types, and a `precision` prop would be a second answer to the
 * question `maximumFractionDigits` already answers.
 */
test('formats through Intl rather than through a second scale of its own', () => {
  assert.equal(contract.format.options, 'Intl.NumberFormatOptions');
  assert.equal(contract.format.locale, 'BCP 47');
  assert.equal(contract.format.parserFrom, 'formatToParts');
  assert.ok(!('precision' in contract.format), 'maximumFractionDigits already says it');
});

/**
 * Derived from the props rather than from the user agent: a user-agent check
 * during render is a hydration mismatch, and neither numeric keypad offers a
 * minus sign on every platform.
 */
test('derives the software keyboard from the format, never from the device', () => {
  assert.deepEqual(contract.inputMode, {
    negative: 'text',
    fractional: 'decimal',
    integer: 'numeric',
  });
});

/** The mechanism the field-aware controls design fixed, unchanged. */
test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.deepEqual(contract.wiring, field.wiring);
});

/** Three states are mirrored and `required` is not: the label draws the mark. */
test('mirrors onto the frame exactly the states the frame paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), ['disabled', 'invalid', 'readonly']);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'invalid',
    'readonly',
  ]);
});

/** One library, one word for one idea: the two axes `text-field` already ships. */
test('shares its size and variant vocabulary with the sibling control', () => {
  assert.deepEqual(contract.axes.size, textField.axes.size);
  assert.deepEqual(contract.axes.variant, textField.axes.variant);
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'outline']);
});

/**
 * `split` is decrement before the value and increment after it, in logical
 * order, so a right-to-left document mirrors the control with no `[dir]` rule.
 */
test('offers the three stepper arrangements the field ships between them', () => {
  assert.deepEqual(contract.axes.stepper, ['stacked', 'split', 'none']);
});

test('lets an application decide once what its number fields look like', () => {
  assert.deepEqual(contract.provides.numberFieldDefaults, [
    'size',
    'variant',
    'stepper',
    'formatOn',
    'clamp',
  ]);
});

/** The two actions a consumer cannot express by passing a value. */
test('exposes only the imperative actions the platform does not already give', () => {
  assert.deepEqual(contract.imperative, ['increment', 'decrement']);
});

/** The arithmetic is framework-free, so the two bindings cannot disagree. */
test('keeps parsing and stepping in the shared core rather than in a binding', () => {
  assert.equal(contract.core, '@slotted/core/number');
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.numberField, [
    'playground',
    'sizes',
    'variants',
    'stepper',
    'range',
    'format',
    'formatOn',
    'locale',
    'adornments',
    'scrub',
    'states',
    'content',
    'composition',
    'keyboard',
  ]);
});

/**
 * The design tools' gesture, which ReUI ships as Base UI's scrub area: a
 * horizontal drag over a mark in an adornment moves the number. It lives in
 * the frame rather than on the field's label, so the part is the family's own
 * and the gesture lands on the control it changes. The input's arrow keys are
 * the keyboard equivalent, so the part takes no focus and no role.
 */
test('moves the number by a horizontal drag over a scrub part', () => {
  assert.deepEqual(contract.scrub.placedIn, ['start', 'end']);
  assert.equal(contract.scrub.perStep, 'sensitivity pixels, default 2');
  assert.deepEqual(contract.scrub.modifiers, { Shift: 'largeStep', Alt: 'smallStep' });
  assert.match(contract.scrub.direction, /rtl/);
  assert.ok(contract.stateModel.value.reasons.includes(contract.scrub.reason));
  assert.ok('data-scrubbing' in contract.dataAttributes);
});
