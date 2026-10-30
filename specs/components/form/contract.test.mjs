import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  KNOWN_CAPABILITIES,
  MUTABLE_CAPABILITIES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.form;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'form');
  assert.equal(contract.ui, 'form');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * There is no APG pattern for a form. The absence is recorded rather than
 * papered over, and the three sources that decide what the family does are
 * named instead: WCAG 2.2 SC 3.3.1, the GOV.UK error summary, and the HTML
 * `form` element itself.
 */
test('records that no APG pattern covers it, and what does', () => {
  assert.equal(contract.apgPattern, null);
  assert.equal(contract.sources.length, 3);
  for (const source of contract.sources) assert.match(source, /^https:\/\//);
});

/**
 * `docs/component-features.md` § 6: the family coordinates submission,
 * validation and focus "without owning the state of each framework". So it holds
 * exactly one thing — the errors — and Reactive Forms in Angular and the
 * consumer's own state in React keep the values.
 */
test('holds the errors and nothing else', () => {
  assert.equal(contract.ownsFieldState, false);
  assert.ok(member.capabilities.includes('validity'));
  assert.ok(KNOWN_CAPABILITIES.includes('validity'));
  assert.ok(MUTABLE_CAPABILITIES.includes('validity'));
  assert.deepEqual(contract.stateModel, {
    validity: {
      controlled: 'errors',
      uncontrolled: 'defaultErrors',
      request: 'onErrorsChange',
      reasons: ['submit', 'keyboard', 'clear', 'programmatic'],
    },
  });
});

/**
 * `novalidate` is written so the browser's own bubble does not appear beside a
 * control whose error the `field` is already drawing. Constraint validation
 * still runs: `checkValidity()` is called explicitly and each control's
 * `validationMessage` is the platform's localized string.
 */
test('turns the browser’s bubble off and keeps its validation', () => {
  assert.deepEqual(contract.nativeValidation, {
    attribute: 'novalidate',
    writtenByDefault: true,
    harvest: 'checkValidity',
    message: 'validationMessage',
  });
});

/**
 * `name` is the key the platform already uses and the key a server already
 * sends. The order is `form.elements`, which is document order, so the summary
 * lists the fields down the page rather than in whatever order the server
 * serialized its object.
 */
test('keys errors by the control’s name and orders them by the document', () => {
  assert.equal(contract.errorKey, 'name');
  assert.equal(contract.errorOrder, 'document');
  assert.deepEqual(contract.errorSources, ['errors', 'constraint', 'submit']);
  assert.equal(contract.errorMerge, 'replace', 'two messages for one field read as one bug');
});

/**
 * The rule `docs/component-features.md` § 6 states: "server errors persist
 * until the field changes or a new submission".
 */
test('drops a server error when its field changes, and at the next submit', () => {
  assert.deepEqual(contract.errorClearedBy, ['input', 'submit', 'reset']);
});

/** A message a reader cannot reach is still a message they have to be given. */
test('keeps an error naming a control the form does not hold', () => {
  assert.equal(contract.unlinkedErrorsKept, true);
});

/**
 * The four things the GOV.UK error summary states a summary "must" do: move
 * focus to it, carry a heading, link to each answer in error, and word the
 * messages the same way the inline ones are.
 */
test('answers the sourced error-summary contract item by item', () => {
  assert.deepEqual(contract.summary, {
    role: 'alert',
    focusable: true,
    title: 'messages.summaryTitle',
    itemElement: 'a[href]',
    linksTo: 'control',
  });
  assert.ok(contract.axes.errorFocus.includes('summary'));
  assert.equal(contract.resolution.errorFocus.at(-1), 'summary');
  assert.ok(member.parts.includes('summary-item'));
});

/** One map feeds the summary and the field, so the two cannot word it differently. */
test('gives the summary and the inline message one source', () => {
  assert.equal(contract.errorKey, 'name');
  assert.equal(field.messageFamily, 'inline-message');
  assert.ok(field.identifiers.includes('error'));
});

/**
 * A double-clicked button submits twice in a bare `form` and in every surveyed
 * implementation but Mantine's.
 */
test('submits asynchronously and refuses to do it twice at once', () => {
  assert.deepEqual(contract.submit, {
    values: 'FormData',
    async: true,
    reentrant: false,
    busyAttribute: 'aria-busy',
  });
  assert.ok(member.capabilities.includes('loading'));
});

/** Nothing surveyed guards a half-filled form on the way out of the page. */
test('guards unsaved work through the platform’s own event', () => {
  assert.equal(contract.guardUnsaved, 'beforeunload');
  assert.equal(member.defaults.guardUnsaved, false, 'a guard nobody asked for is a trap');
});

/**
 * `inline` can end-align a row of buttons. The reflow below a container width —
 * every button full width, in a column — needs a container query, and a
 * consumer would write the same one for every form in an application.
 */
test('owns the action row, with its own container and a literal breakpoint', () => {
  assert.ok(member.parts.includes('actions'));
  assert.deepEqual(contract.axes.align, ['end', 'start', 'between', 'stretch']);
  assert.equal(contract.containerName, 'slotted-form');
  assert.equal(contract.reflowBreakpoint, '360px');
  assert.ok(
    contract.literals.reflowBreakpoint.includes('custom property'),
    'a literal breakpoint carries the reason CSS forbids a token',
  );
});

test('names when validation runs, and lets it be turned off', () => {
  assert.deepEqual(contract.axes.validate, ['submit', 'blur', 'change', 'none']);
  assert.equal(member.defaults.validate, 'submit');
});

test('draws seven parts, and no message family of its own', () => {
  assert.deepEqual(Object.keys(contract.members), ['form']);
  assert.deepEqual(member.parts, [
    'root',
    'summary',
    'summary-title',
    'summary-list',
    'summary-item',
    'actions',
    'aside',
  ]);
  assert.ok(!member.parts.includes('field'), 'the field family owns a field');
  assert.ok(!member.parts.includes('message'), 'inline-message and alert already say a thing once');
});

test('mirrors onto the root exactly the states it paints', () => {
  assert.deepEqual(Object.keys(contract.stateAttributes), ['invalid', 'loading', 'disabled']);
  assert.deepEqual(member.states, ['default', 'invalid', 'loading', 'disabled']);
});

/**
 * Angular has two form systems in version 22 and React has none. The asymmetry
 * is recorded rather than levelled down: Signal Forms binds a control through
 * its `ControlValueAccessor`, which every Slotted control already provides, so
 * the family adds no second integration.
 */
test('reaches the form systems each ecosystem actually has', () => {
  assert.deepEqual(contract.angular, {
    reactiveForms: 'ControlContainer',
    touchOnSubmit: 'markAllAsTouched',
    messageRegistry: 'SL_FORM_ERROR_MESSAGES',
    signalForms: 'ControlValueAccessor',
  });
});

test('lets an application decide once how its forms behave', () => {
  assert.deepEqual(contract.provides.formDefaults, [
    'validate',
    'errorFocus',
    'summary',
    'summaryDescription',
    'align',
    'nativeValidation',
  ]);
});

test('exposes the four actions a value cannot express', () => {
  assert.deepEqual(contract.imperative, ['validate', 'submit', 'reset', 'focusFirstError']);
});

test('keeps the merging, the ordering and the harvest in the shared core', () => {
  assert.equal(contract.core, '@slotted/core/form');
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.form, [
    'playground',
    'validation',
    'errors',
    'summary',
    'submit',
    'actions',
    'states',
    'content',
    'composition',
    'accessibility',
  ]);
});
