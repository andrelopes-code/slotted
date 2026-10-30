import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const message = JSON.parse(
  await readFile(new URL('../inline-message/contract.json', import.meta.url), 'utf8'),
);
const group = contract.members.fieldGroup;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'field-group');
  assert.equal(contract.ui, 'field-group');
  assert.equal(contract.schemaVersion, 5);
});

test('is one member, and the four parts the group draws', () => {
  assert.deepEqual(Object.keys(contract.members), ['fieldGroup']);
  assert.deepEqual(group.parts, ['root', 'legend', 'mark', 'content']);
});

/**
 * The platform's own grouping element, named by the platform's own naming
 * element. The APG's naming practice records both as the native technique its
 * Rule 3 prefers: the `group` role and the accessible name arrive without a
 * single ARIA attribute.
 */
test('groups with a fieldset and names it with a legend', () => {
  assert.equal(group.nativeElement, 'fieldset');
  assert.ok(group.parts.includes('legend'));
  assert.equal(contract.role, null);
});

/**
 * A `legend` inside a grid container is laid out by rules of its own in every
 * engine, so the fieldset stays a block and draws a `content` element that is
 * the grid holding the fields. That element is the group's part rather than an
 * implementation detail, because a consumer restyling the rhythm needs a
 * selector for it.
 */
test('keeps the legend out of the grid that holds the fields', () => {
  assert.ok(group.parts.includes('content'));
});

/**
 * The same message family the field speaks through, in the same two tones. What
 * differs is where they sit: a group's description and error come *before* its
 * controls, which is where GOV.UK's fieldset example puts the hint and the
 * error, and a field's come after its own.
 */
test('speaks through the message family, before the controls rather than after', () => {
  assert.equal(contract.messageFamily, 'inline-message');
  assert.equal(message.ui, contract.messageFamily);
  assert.deepEqual(contract.messageTones, field.messageTones);
  assert.equal(contract.messagePlacement, 'before');
  assert.equal(field.messagePlacement, 'after');
  /* The mark is the one value the two agree on: a group's messages draw no
     mark for the reason a field's do not (F2), so a set and the fields inside
     it read as one form. */
  assert.equal(contract.messageMark, field.messageMark);
  assert.ok(
    !group.parts.includes('description') && !group.parts.includes('error'),
    'the group claims a part it does not own',
  );
});

/**
 * `aria-describedby` goes on the `fieldset` itself rather than on each control
 * inside, which is what GOV.UK's error-message-with-legend example does: a
 * reader entering any control in the group hears the group's hint and its error
 * once, from the element that owns them both.
 */
test('describes the whole set from the element that names it', () => {
  assert.deepEqual(contract.identifiers, ['legend', 'description', 'error']);
  assert.deepEqual(contract.describedBy, ['description', 'error']);
  assert.equal(contract.describedByTarget, 'root');
});

/**
 * Native `disabled` on the fieldset, which the platform propagates to every
 * control inside with nothing passed down. The family still writes
 * `data-disabled` and provides `disabled` to its fields, because the platform
 * disables controls and a label is not one.
 */
test('disables its controls through the platform and mutes its labels itself', () => {
  assert.equal(contract.nativeDisabled, true);
  assert.ok(group.capabilities.includes('disabled'));
  assert.ok(contract.provides.fieldDefaults.includes('disabled'));
});

/**
 * How the fields inside flow. This is `orientation` in the sense every other
 * family here uses it, which is why the field's label axis is called
 * `labelPlacement` rather than borrowing the word.
 */
test('arranges its fields in a column or in a row', () => {
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.equal(group.defaults.orientation, 'vertical');
  assert.ok(group.capabilities.includes('orientation'));
});

/**
 * The distance between one field and the next is a token rather than a `gap`
 * input, and there is no `align` or `justify`. A group that took all three
 * would be a second `stack` that also happens to draw a legend; a consumer who
 * needs a two-column form puts a `grid` inside the group's content.
 */
test('spaces its fields without becoming a layout family', () => {
  assert.ok(!group.capabilities.includes('arrangement'));
});

/**
 * Every literal in the family, with the reason it is not a token.
 */
test('records the reason for every value that is not a token', () => {
  assert.deepEqual(Object.keys(contract.literals), ['--slotted-field-group-track-min']);
  for (const reason of Object.values(contract.literals)) {
    assert.ok(reason.length > 40, 'a literal is recorded with no reason');
  }
});

/**
 * A group sets for its fields what an application sets for every field, through
 * the same mechanism — so a compact section, or a disabled one, is one attribute
 * rather than one per field. Among the surveyed implementations only Angular
 * Material has application-wide defaults, and only for Angular.
 */
test('provides for the fields inside it what an application provides for all of them', () => {
  assert.deepEqual(contract.provides.fieldDefaults, [
    'size',
    'labelPlacement',
    'necessity',
    'disabled',
    'readOnly',
  ]);
  for (const provided of field.provides.fieldDefaults) {
    assert.ok(
      contract.provides.fieldDefaults.includes(provided),
      `the group cannot provide ${provided}, which a field reads`,
    );
  }
});

test('leaves every shared state unset, so the application can answer it', () => {
  for (const capability of ['disabled', 'invalid', 'required', 'readOnly']) {
    assert.ok(group.capabilities.includes(capability), `the group cannot be ${capability}`);
    assert.ok(!(capability in group.defaults), `${capability} defaults instead of deferring`);
  }
  assert.deepEqual(Object.keys(group.defaults).sort(), [
    'kind',
    'necessity',
    'orientation',
    'size',
  ]);
});

/**
 * The legend says the group's necessity with the field's four answers, so a
 * form of optional sections marks them the way it marks its optional fields.
 */
test('says necessity for the group with the answers a field gives', () => {
  assert.deepEqual(contract.axes.necessity, field.axes.necessity);
  assert.ok(!('requiredMark' in contract.axes));
  assert.equal(group.defaults.necessity, field.members.field.defaults.necessity);
});

test('paints the four states a group can be in, on one element', () => {
  assert.deepEqual(group.states, ['default', 'disabled', 'invalid', 'required', 'readonly']);
  /* The four a group shares with its fields; `open` is the field's help, which
     a group does not draw. */
  const { open: _help, ...shared } = field.stateAttributes;
  assert.deepEqual(contract.stateAttributes, shared);
});

test('moves nothing, so it declares no state model', () => {
  assert.ok(!('stateModel' in contract));
  for (const member of Object.values(contract.members)) {
    for (const capability of member.capabilities) {
      assert.ok(!MUTABLE_CAPABILITIES.includes(capability), `${capability} holds state`);
    }
  }
});

test('names one reference page, covering every axis and every state', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['fieldGroup']);
  assert.deepEqual(contract.scenarios.fieldGroup, [
    'playground',
    'orientation',
    'states',
    'messages',
    'provision',
    'content',
    'composition',
    'accessibility',
  ]);
});
