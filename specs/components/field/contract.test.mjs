import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const message = JSON.parse(
  await readFile(new URL('../inline-message/contract.json', import.meta.url), 'utf8'),
);
const field = contract.members.field;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'field');
  assert.equal(contract.ui, 'field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member, nine parts. A field never appears without its box, so every piece
 * of it is a part of that box rather than a member of its own — the shape
 * `card` and `alert` already have. `counter` is the part Angular Material and
 * Carbon both draw and neither names: Angular Material asks for a
 * `mat-hint align="end"`, which shares a row with the error and pushes it.
 *
 * `header` is the label row, and the four parts after `mark` live in it. ReUI
 * writes the same row by hand in four of its examples — a `div` with
 * `justify-between` around the label and whatever sits beside it — which is
 * the reason it is a part here: a row every page rebuilds is a row the family
 * owns.
 */
test('is one member, and the nine parts the family draws', () => {
  assert.deepEqual(Object.keys(contract.members), ['field']);
  assert.deepEqual(field.parts, [
    'root',
    'header',
    'label',
    'mark',
    'help',
    'indicator',
    'action',
    'counter',
    'control',
  ]);
});

/**
 * The help control cannot sit inside the `label`. A `button` is labelable
 * content, which HTML forbids inside a `label` other than the control it
 * labels, and a press on it would reach the label and move focus to the
 * control instead of opening the hint. That is the objection the 2026-09-02
 * inventory declined contextual help on; the header is what answers it, by
 * giving the button a sibling place in the same row.
 */
test('keeps every control of the label row out of the label', () => {
  assert.deepEqual(contract.header.inside, ['label', 'help', 'indicator', 'action', 'counter']);
  assert.deepEqual(contract.header.outsideLabel, ['help', 'indicator', 'action', 'counter']);
  assert.equal(contract.header.optional, true);
});

/**
 * A `div`, because the field is a box around a control rather than a control.
 * Every surveyed implementation but Spectrum renders one, and Spectrum has no
 * field family at all: it spends a `label`, a `description` and an
 * `errorMessage` prop on every control instead.
 */
test('renders a div holding a native label and a native control', () => {
  assert.equal(field.nativeElement, 'div');
  assert.ok(field.parts.includes('label'));
  assert.ok(field.parts.includes('control'));
});

/**
 * The description and the error are `inline-message`, which
 * `docs/process/build-order.md` states as the reason that family was built in wave 2.
 * The field draws neither a mark nor a severity word of its own; it points at
 * the family that already does, so a field error and a status light about the
 * same thing speak the same word.
 *
 * The one value the field answers rather than passes is the mark, and the
 * answer is no mark at all (F2): a message under a control is a small box that
 * repeats down a form, and ten of them in error are ten circled exclamations in
 * a column — the limit R5 draws. The tone is said by the ink and by the weight
 * of the sentence, which is what F1 settled. `mark='glyph'` and `mark='dot'`
 * are still there for a page that asks for either.
 */
test('speaks through the message family instead of drawing a message', () => {
  assert.equal(contract.messageFamily, 'inline-message');
  assert.equal(message.ui, contract.messageFamily);
  assert.ok(
    !field.parts.includes('description') && !field.parts.includes('error'),
    'the field claims a part it does not own',
  );
  assert.equal(contract.messagePlacement, 'after');
  assert.equal(contract.messageMark, 'none');
  assert.ok(
    message.axes.mark.includes(contract.messageMark),
    'the field asks for a mark inline-message does not draw',
  );
  assert.equal(contract.messageTones.description, 'secondary');
  assert.equal(contract.messageTones.error, 'danger');
  for (const tone of Object.values(contract.messageTones)) {
    assert.ok(message.axes.tone.includes(tone), `${tone} is not a tone inline-message speaks`);
  }
});

/**
 * Four identifiers derived from one base, rather than registered by the parts.
 * `label[for]` then resolves to the identifier the control will use with no
 * ordering dependency between siblings and nothing to coordinate during
 * hydration.
 */
test('derives every identifier from one base', () => {
  assert.deepEqual(contract.identifiers, [
    'control',
    'label',
    'indicator',
    'help',
    'description',
    'counter',
    'error',
  ]);
});

/**
 * A fixed order rather than one read from the DOM. Known slots have one correct
 * reading order, and deriving it from registration order would make the
 * accessible description depend on when an effect ran.
 *
 * What qualifies the field comes first — the indicator (`Beta`), then the help
 * behind the icon — then what the page says under the control, then the count,
 * and the error last, where it has always been. The counter is in the list
 * because `docs/component-features.md` §2.8 requires the label, the
 * description, the error *and the counter* to be related by identifier, and
 * until this pass the counter was not.
 */
test('reads what qualifies the field, then the help, the count and the error', () => {
  assert.deepEqual(contract.describedBy, ['indicator', 'help', 'description', 'counter', 'error']);
});

/**
 * The text behind the help icon reaches the control's description through a
 * node the family keeps hidden, not through the tooltip's layer: the layer
 * exists only while it is open, so a reference to it would describe nothing
 * the rest of the time. A `hidden` element directly referenced by
 * `aria-describedby` still enters the description (accname 1.2, step 2A).
 * The tooltip is asked to describe nothing, so the hint is not read twice.
 */
test('describes the control with the help text whether the hint is open or not', () => {
  assert.equal(contract.help.describedBy, 'hidden-node');
  assert.equal(contract.help.tooltipDescribes, 'none');
  assert.equal(contract.help.glyph, 'circle-question');
  assert.equal(contract.help.name, 'messages.help');
  assert.ok(contract.messages.includes('help'));
});

/**
 * A tooltip opens on a coarse pointer only by a long press, because a tap is
 * the trigger's own action (`specs/components/tooltip/contract.json` › touch).
 * The help icon has no other action, so its tap is the hint: the family
 * controls the tooltip's `open` and toggles it on activation, which is the
 * toggletip Carbon ships and the reason a reader on a phone finds the hint at
 * all. Hover and focus still open it the way every other tooltip opens.
 */
test('opens the hint on a tap, where a tooltip alone would need a long press', () => {
  assert.equal(contract.help.opensOn, 'press, hover and focus');
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'blur', 'programmatic'],
  });
});

/**
 * A disabled field is a field nobody can type in, not a field nobody may ask
 * about. The help stays operable — it is often where the reason the field is
 * disabled is written — and the action belongs to the page, so the field does
 * not disable either.
 */
test('leaves the help and the action operable on a disabled field', () => {
  assert.deepEqual(contract.disabledLeaves, ['help', 'action']);
});

/**
 * `aria-required`, never the native `required`: the native attribute engages
 * browser constraint validation and changes submit behaviour, which the library
 * must not impose as a side effect of describing a field. `disabled` is native,
 * because removing the control from the tab order and from submission is what
 * the word means.
 */
test('describes the control without taking over its submission', () => {
  assert.deepEqual(contract.wiring, {
    id: 'always',
    'aria-describedby': 'merged',
    'aria-invalid': 'invalid',
    'aria-required': 'required',
    disabled: 'disabled',
    readonly: 'readOnly',
  });
  assert.ok(!('required' in contract.wiring));
});

/**
 * Four values for necessity, which is the axis Spectrum spends
 * `necessityIndicator` on, Angular Material `hideRequiredMarker`, and Chakra and
 * Ark a `fallback` prop.
 *
 * `optional` marks only the fields a reader may skip, which is what GOV.UK and
 * Carbon recommend for a form where most fields are required: the exception is
 * what gets the word. `words` says both. The axis was `requiredMark` until it
 * had a value that marks the field that is *not* required, and a name that
 * described one of four answers could not stay.
 */
test('says necessity as a mark, as a word on the optional fields, as words, or not at all', () => {
  assert.deepEqual(contract.axes.necessity, ['mark', 'optional', 'words', 'none']);
  assert.ok(!('requiredMark' in contract.axes));
  assert.equal(field.defaults.necessity, 'mark');
  assert.ok(!('necessityWords' in contract));
  for (const word of ['required', 'optional']) assert.ok(contract.messages.includes(word));
});

/**
 * The mark is hidden from assistive technology and the words are not. The
 * semantics reach a reader through `aria-required` on the control, once; a
 * reader working a form of twenty required fields does not need to hear
 * "asterisk" twenty times, and `(optional)` is information rather than
 * decoration.
 */
test('hides the mark from a reader and never hides the words', () => {
  assert.equal(contract.markHidden, true);
});

/**
 * The label sits above the control or beside it — the axis Fluent calls
 * `orientation`, Primer `layout` and Spectrum `labelPosition`. It is `placement`
 * in this library's shared capability vocabulary, and `orientation` is left to
 * mean what it means everywhere else here: the direction a family's children
 * flow in.
 */
test('places the label above the control or beside it', () => {
  assert.deepEqual(contract.axes.labelPlacement, ['top', 'side']);
  assert.equal(field.defaults.labelPlacement, 'top');
  assert.ok(field.capabilities.includes('placement'));
  assert.ok(!field.capabilities.includes('orientation'));
});

/**
 * A side label reflows to a top label when the field itself is narrow, which
 * nothing surveyed does — a Spectrum side label squeezes its control instead.
 * The breakpoint is a literal because CSS forbids a custom property in a
 * container condition, which `docs/token-foundation.md` rule 4 records.
 */
test('stacks the side label when the field is too narrow to hold both', () => {
  assert.equal(contract.reflowBreakpoint, '320px');
  assert.equal(contract.containerName, 'slotted-field');
});

/**
 * Three steps, reading the control type scales the theme restates per density,
 * so a field in a dense table shrinks whole rather than in parts. Fluent ships
 * the same three under the same capability.
 */
test('steps with the control it wraps', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.width, ['full', 'medium', 'short']);
  assert.equal(field.defaults.size, 'md');
});

/**
 * None of the four shared states is in `defaults`, and the absence is the
 * decision. A default of `false` cannot be told from a consumer saying "not
 * disabled", so a field that defaulted to `false` would quietly override a
 * disabled `field-group`, the field-aware invariant seen from the control's side.
 */
test('leaves every shared state unset, so the group can answer it', () => {
  for (const capability of ['disabled', 'invalid', 'required', 'readOnly']) {
    assert.ok(field.capabilities.includes(capability), `field cannot be ${capability}`);
    assert.ok(!(capability in field.defaults), `${capability} defaults instead of deferring`);
  }
  assert.deepEqual(Object.keys(field.defaults).sort(), [
    'labelPlacement',
    'necessity',
    'size',
    'width',
  ]);
});

/**
 * `readonly` sits above `invalid` in `STATE_PRECEDENCE`, and both sit below
 * `disabled`. The field paints all four on its root so the label, the mark and
 * the messages follow from one place rather than each part repeating the state.
 */
test('declares the states of its root and of its two controls', () => {
  assert.deepEqual(field.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'invalid',
    'required',
    'readonly',
    'open',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    invalid: 'data-invalid',
    required: 'data-required',
    readonly: 'data-readonly',
    open: 'data-open',
  });
});

/**
 * The counter carries its own `data-invalid` rather than reading the field's: a
 * count can pass its limit while the form has not yet decided the field is in
 * error, and a counter that only turned red once the error appeared would say
 * nothing at the moment it is being read.
 */
test('lets the counter go over its limit before the field is in error', () => {
  assert.ok(field.parts.includes('counter'));
  assert.ok(field.capabilities.includes('invalid'));
  assert.equal(contract.stateAttributes.invalid, 'data-invalid');
});

/**
 * The field is told its state and holds one of its own: whether the hint behind
 * the help icon is showing. The value belongs to the control and the validity
 * to `form`, which `docs/process/build-order.md` names as the owner of
 * submission and validation. The assertion keeps every other absence a
 * decision rather than an oversight.
 */
test('moves only the hint, so it declares one state model', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['open']);
  for (const member of Object.values(contract.members)) {
    const mutable = member.capabilities.filter((capability) =>
      MUTABLE_CAPABILITIES.includes(capability),
    );
    assert.deepEqual(mutable, ['open']);
  }
});

/**
 * Every literal in the family, with the reason it is not a token. Both are line
 * lengths, and `docs/token-foundation.md` holds no scale of those; the
 * breakpoint is a literal because CSS forbids a custom property in a container
 * condition.
 */
test('records the reason for every value that is not a token', () => {
  assert.deepEqual(Object.keys(contract.literals), [
    '--slotted-field-label-inline-size',
    'reflowBreakpoint',
    '--slotted-field-width-short',
    '--slotted-field-width-medium',
  ]);
  for (const reason of Object.values(contract.literals)) {
    assert.ok(reason.length > 40, 'a literal is recorded with no reason');
  }
});

/** What an application decides once instead of on every field in a form. */
test('names the decisions an application takes once', () => {
  assert.deepEqual(contract.provides.fieldDefaults, ['size', 'labelPlacement', 'necessity']);
});

test('names one reference page, covering every axis and every state', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['field']);
  assert.deepEqual(contract.scenarios.field, [
    'playground',
    'necessity',
    'placement',
    'sizes',
    'states',
    'messages',
    'counter',
    'header',
    'content',
    'composition',
    'accessibility',
  ]);
});
