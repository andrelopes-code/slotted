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
const textField = JSON.parse(
  await readFile(new URL('../text-field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.currencyField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'currency-field');
  assert.equal(contract.ui, 'currency-field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The anatomy `number-field` established, part for part: an amount is a value
 * with adornments and, when a product asks for them, two steppers. A family
 * that added a part here would be saying money needs a box the number does not,
 * and it does not.
 */
test('draws the same frame the sibling numeric control draws', () => {
  assert.deepEqual(Object.keys(contract.members), ['currencyField']);
  /* The one part of its own is the currency mark the display appearance
     draws apart from the digits; every other part is the numeric frame's. */
  assert.deepEqual(
    member.parts.filter((part) => part !== 'symbol'),
    numberField.members.numberField.parts,
  );
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.controlPart, 'input');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
});

/**
 * `type="number"` sanitizes any text that is not a valid floating-point number
 * to the empty string, so no grouping separator, no decimal comma and no
 * currency symbol survives it — the boundary `number-field` records, and the
 * one a currency field hits on its first keystroke.
 */
test('holds the amount in a text input rather than in a number input', () => {
  assert.equal(contract.inputType, 'text');
  assert.equal(contract.hiddenValueInput, true, 'the raw number needs somewhere to be submitted');
  assert.equal(contract.valueType, 'number | null');
  assert.equal(contract.valueUnit, 'major', 'the value is reais, not centavos');
});

/**
 * The APG's Spinbutton Pattern, taken whole and for the reasons
 * `2026-09-03-number-field-design.md` records: without the role nothing
 * declarative says a maximum exists, and this library has no live announcer
 * until wave 5.
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

/**
 * Every key the sibling binds, plus the two this family adds: under cents-first
 * entry the sign cannot be typed into the digit run, so it is a key of its own.
 */
test('binds every key the sourced pattern lists, plus the two signs', () => {
  const shared = contract.keyboard.filter((row) => row.effect !== 'sign');
  assert.deepEqual(shared, numberField.keyboard);
  assert.deepEqual(
    contract.keyboard.filter((row) => row.effect === 'sign'),
    [
      { key: '-', effect: 'sign', sign: 'negative' },
      { key: '+', effect: 'sign', sign: 'positive' },
    ],
  );
  assert.equal(contract.escapeBound, false);
  assert.equal(contract.enterSubmits, true);
});

test('keeps the steppers out of the tab order and in the accessibility tree', () => {
  assert.equal(contract.stepperTabIndex, -1);
  assert.deepEqual(contract.stepperNames, ['increment', 'decrement']);
  assert.equal(contract.stepperDisabledAtBound, true);
});

/**
 * One mutable value, and `null` is part of it: an invoice with no total and an
 * invoice of nought are different facts.
 */
test('declares one state model, over an amount that may be empty', () => {
  assert.ok(member.capabilities.includes('value'));
  assert.ok(MUTABLE_CAPABILITIES.includes('value'));
  assert.equal(contract.stateModel.value.controlled, 'value');
  assert.equal(contract.stateModel.value.uncontrolled, 'defaultValue');
  assert.equal(contract.stateModel.value.request, 'onValueChange');
  assert.deepEqual(contract.stateModel.value.reasons, [
    'keyboard',
    'pointer',
    'blur',
    'programmatic',
  ]);
});

/**
 * The integer a payment API is charged in travels with the request, so a
 * consumer never writes `Math.round(value * 100)` — the line where a float
 * becomes a rounding defect. No surveyed implementation carries it.
 */
test('carries the exact minor-unit integer beside the amount', () => {
  assert.deepEqual(contract.stateModel.value.carries, [
    'value',
    'previous',
    'minorUnits',
    'reason',
    'event',
  ]);
});

/**
 * The axis this family exists for. `cents` is the model ngx-currency calls
 * `Financial` and the only one no headless library ships; `natural` is the
 * model `number-field` uses, kept for the amount that is edited rather than
 * entered.
 */
test('ships both entry models and defaults to the cash register', () => {
  assert.deepEqual(contract.axes.entry, ['cents', 'natural']);
  assert.equal(member.defaults.entry, 'cents');
  assert.deepEqual(contract.resolution.entry, ['prop', 'defaults', 'cents']);
});

/**
 * Under cents-first entry the text is generated on every keystroke, which is
 * the rule `number-field` forbids itself. It is legal here because there is no
 * typed text to protect: the digits are the value, the separator is never
 * typed, and the caret has exactly one legal position.
 */
test('states how each entry model treats the text, the caret and the digits', () => {
  assert.deepEqual(contract.entryModel.cents, {
    digitsAre: 'the value',
    shiftBy: 'minorUnits',
    writesTextOn: 'input',
    caret: 'after the last digit',
    caretIgnored: true,
    separatorTyped: false,
    signKeys: ['-', '+'],
    pasteParsed: true,
    maxDigits: 15,
    emptyValue: 'allowEmpty',
  });
  assert.equal(contract.entryModel.natural.writesTextOn, 'commit');
  assert.equal(contract.entryModel.natural.separatorTyped, true);
  assert.deepEqual(contract.entryModel.natural.signKeys, []);
});

/**
 * The one legal caret position is also the only one the amount is read from.
 * A digit typed against the first character of `R$ 0,00` produced `R$ 20,00`
 * while the digits were read out of the text the browser had already edited:
 * the caret decided the amount, and a cash register has no caret. The digits
 * the reader added or took away are read from the difference between the text
 * before the edit and the text after it, so both edits land at the right.
 */
/**
 * An amount is not an optional number by default. A total, a price and a
 * balance are all nought when nothing is in them, and a field that emitted
 * `null` for an emptied amount made every consumer write `value ?? 0` — which
 * is the same decision taken once per consumer instead of once here. A form
 * where the amount is genuinely absent asks for it with `allowEmpty`.
 */
test('settles an emptied amount on nought unless the consumer allows nothing', () => {
  assert.equal(member.defaults.allowEmpty, false);
  assert.equal(contract.entryModel.cents.emptyValue, 'allowEmpty');
  assert.equal(contract.entryModel.natural.emptyValue, 'allowEmpty');
});

test('reads the amount from the digits that changed, not from where they landed', () => {
  assert.equal(contract.entryModel.cents.caretIgnored, true);
  assert.equal(contract.entryModel.cents.caret, 'after the last digit');
  assert.equal(contract.entryModel.natural.caret, "the reader's");
});

/**
 * A paste is the one case where the cash-register rule would lose the reader's
 * data: `R$ 1.480,00` copied from a bank statement is one thousand four hundred
 * and eighty, not fourteen and eighty. Every surveyed masked input loses it.
 */
test('parses a paste in both models rather than accumulating its digits', () => {
  assert.equal(contract.entryModel.cents.pasteParsed, true);
  assert.equal(contract.entryModel.natural.pasteParsed, true);
});

/**
 * Fifteen digits is where a double stops holding a cent. The keystroke past it
 * is refused rather than silently rounded, so the text never shows an amount
 * the value does not hold.
 */
test('refuses the digit a double could not hold', () => {
  assert.equal(contract.entryModel.cents.maxDigits, 15);
});

/**
 * `formatOn` is `number-field`'s axis, and it is here because `entry="natural"`
 * is `number-field`'s model: one library must not answer the same question two
 * ways in two families. Under `entry="cents"` the text is generated from the
 * digits after every edit, so it has always taken the locale's shape as it is
 * typed and the axis has nothing left to decide.
 */
test('says when the text is rewritten and when the number moves', () => {
  assert.equal(contract.parseOn, 'input');
  assert.deepEqual(contract.axes.formatOn, numberField.axes.formatOn);
  assert.deepEqual(contract.resolution.formatOn, numberField.resolution.formatOn);
  assert.equal(contract.members.currencyField.defaults.formatOn, 'change');
  assert.deepEqual(contract.commitOn, numberField.commitOn);
});

test('states the range, the three steps and the policies over them', () => {
  assert.deepEqual(contract.range, numberField.range);
  assert.deepEqual(contract.stepDefaults, numberField.stepDefaults);
  assert.deepEqual(contract.axes.clamp, ['blur', 'strict', 'none']);
});

/**
 * The currency decides the digits and the locale writes them. ngx-currency and
 * react-currency-input configure both by hand, which is why `pt-BR` plus `USD`
 * is a combination their consumers get wrong.
 */
test('takes its fraction digits from the currency and its separators from the locale', () => {
  assert.equal(contract.format.style, 'currency');
  assert.equal(contract.format.currency, 'ISO 4217');
  assert.equal(contract.format.locale, 'BCP 47');
  assert.equal(contract.format.parserFrom, 'formatToParts');
  assert.equal(contract.format.fractionDigitsFrom, "the currency's minor units");
  assert.ok(
    !('precision' in contract.format),
    'the currency already says how many digits a cent has',
  );
});

/**
 * `Intl` writes `(R$ 1.234,56)` under `currencySign: 'accounting'` and every
 * surveyed parser reads it back as a credit. A debit that changes sign when it
 * is pasted back into the field it came from is a defect that costs money.
 */
test('reads an accounting negative back as a negative', () => {
  assert.equal(contract.format.accountingNegative, '( )');
});

/**
 * Cents-first entry never types a separator and never types a sign into the
 * digits, so the numeric keypad is complete for the task. Everything else is
 * `number-field`'s rule, derived from the props rather than from the device.
 */
test('derives the software keyboard from the entry model first', () => {
  assert.equal(contract.inputMode.cents, 'numeric');
  assert.equal(contract.inputMode.negative, numberField.inputMode.negative);
  assert.equal(contract.inputMode.fractional, numberField.inputMode.fractional);
  assert.equal(contract.inputMode.integer, numberField.inputMode.integer);
});

/**
 * Standard autofill field names, and WCAG 2.2 SC 1.3.5 is satisfied by naming
 * the purpose of the field. No surveyed implementation mentions either token.
 */
test('names the autofill tokens a payment amount belongs to', () => {
  assert.deepEqual(contract.autocompleteTokens, ['transaction-amount', 'transaction-currency']);
});

/** The mechanism the field-aware controls design fixed, unchanged. */
test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.deepEqual(contract.wiring, field.wiring);
});

test('mirrors onto the frame exactly the states the frame paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), ['disabled', 'invalid', 'readonly']);
  assert.deepEqual(member.states, numberField.members.numberField.states);
});

/** One library, one word for one idea: the two axes `text-field` already ships. */
test('shares its size and variant vocabulary with the sibling controls', () => {
  assert.deepEqual(contract.axes.size, textField.axes.size);
  assert.deepEqual(contract.axes.variant, textField.axes.variant);
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'outline']);
});

/**
 * An amount is compared on its last digit, and the cents-first caret already
 * lives at that edge. ngx-currency defaults its own alignment to the same side
 * for the same reason.
 */
test('aligns the amount to the reading end by default', () => {
  assert.deepEqual(contract.axes.align, ['end', 'start']);
  assert.equal(member.defaults.align, 'end');
});

/**
 * Where `number-field` defaults to a stacked stepper, an amount defaults to
 * none: PrimeNG leaves `showButtons` false for the same reason, and two buttons
 * that move an invoice total by one real invite a mis-click that costs money.
 */
test('offers the three stepper arrangements and shows none of them by default', () => {
  assert.deepEqual(contract.axes.stepper.slice().sort(), numberField.axes.stepper.slice().sort());
  assert.equal(member.defaults.stepper, 'none');
  assert.equal(member.defaults.step, 1, 'one major unit, not one cent');
});

/**
 * A product has one currency in nine screens out of ten, and `currency` is the
 * one input a field cannot be built without — so the provider is the second
 * place it may come from. The locale is the application's (`SlottedProvider`).
 */
test('lets an application decide once what its currency fields are', () => {
  assert.deepEqual(contract.provides.currencyFieldDefaults, [
    'align',
    'clamp',
    'currency',
    'currencyDisplay',
    'entry',
    'formatOn',
    'size',
    'stepper',
    'unit',
    'variant',
  ]);
  assert.deepEqual(contract.resolution.currency, ['prop', 'defaults']);
  assert.deepEqual(contract.resolution.unit, ['prop', 'defaults', 'major']);
});

test('exposes only the imperative actions the platform does not already give', () => {
  assert.deepEqual(contract.imperative, ['increment', 'decrement']);
});

/**
 * The arithmetic is framework-free, so the two bindings cannot disagree about
 * what the fourth keystroke of `1234` means. Nothing is imported from the
 * sibling family's bindings: the two meet in core or not at all.
 */
test('keeps the entry model and the parser in the shared core', () => {
  assert.deepEqual(contract.core, ['@slotted/core/currency', '@slotted/core/number']);
  assert.ok(contract.core.includes(numberField.core));
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.currencyField, [
    'playground',
    'entry',
    'currency',
    'locale',
    'sizes',
    'variants',
    'alignment',
    'range',
    'stepper',
    'adornments',
    'scrub',
    'states',
    'content',
    'composition',
    'keyboard',
  ]);
});

/**
 * The sibling's drag, taken whole: the part is in the anatomy the two
 * families share, so the gesture is too. One step is the field's `step` —
 * a whole unit of the currency by default — and the minor units the request
 * carries are the moved amount's, never the drag's distance.
 */
test('moves the amount by a horizontal drag over a scrub part, as the sibling does', () => {
  assert.deepEqual(contract.scrub, numberField.scrub);
  assert.ok(contract.stateModel.value.reasons.includes(contract.scrub.reason));
  assert.deepEqual(contract.dataAttributes, numberField.dataAttributes);
});
