import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const combobox = JSON.parse(
  await readFile(new URL('../combobox/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'highlight');
  assert.equal(contract.ui, 'highlight');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The HTML Standard defines `mark` for exactly this — "a run of text marked or
 * highlighted for reference purposes, due to its relevance in another
 * context", with the term searched for inside a result as its own example —
 * and the APG lists no pattern for it. So the family is two parts: the element
 * that holds the text, and the `mark` inside it, one per contiguous span. A
 * root of its own, rather than `data-ui` on the mark as the shared sheet had
 * it, is what lets a host's `label` hold one without carrying two `data-part`s.
 */
test('is the text and the marks inside it', () => {
  assert.deepEqual(Object.keys(contract.members), ['highlight']);
  assert.deepEqual(contract.members.highlight.parts, ['root', 'match']);
  assert.equal(contract.members.highlight.nativeElement, 'span');
  assert.equal(contract.match.element, 'mark');
});

/**
 * The spans come from one of three places and the order between them is
 * written: explicit ranges from a server, a matcher the consumer wrote, or the
 * default — the collator scan `createFilter` already uses, so a host's filter
 * and its mark cannot disagree. Every one of the three goes through the same
 * normalisation, which is where an overlapping, inverted or out-of-range span
 * stops being an exception and becomes no mark.
 */
test('takes ranges over a matcher over the default, and normalises all three', () => {
  assert.equal(contract.match.engine, '@slotted/core/highlight');
  assert.match(contract.match.precedence, /ranges wins over matcher/);
  assert.match(contract.match.normalisation, /grapheme/);
  assert.match(contract.match.empty, /text alone/);
});

/**
 * Mantine and react-highlight-words mark every occurrence; Chakra marks the
 * first unless `matchAll` is set. The first is the axis default because a
 * reader scanning a long label for the query wants every place it appears,
 * and `first` is kept for the host that reads one span as "why this option is
 * here".
 */
test('marks every occurrence by default', () => {
  assert.deepEqual(contract.axes.occurrences, ['all', 'first']);
  assert.equal(contract.members.highlight.defaults.occurrences, 'all');
});

/**
 * `base` is what `typeahead` and `createFilter` compare at, so `resume` finds
 * `Resumé` in the mark as it does in the filter. The other three are the
 * collator's own steps, for a consumer whose search is stricter.
 */
test("compares at base sensitivity, in the reader's locale", () => {
  assert.deepEqual(contract.axes.sensitivity, ['base', 'accent', 'case', 'variant']);
  assert.equal(contract.members.highlight.defaults.sensitivity, 'base');
  assert.equal(contract.members.highlight.defaults.locale, null);
});

/**
 * `current` is a state without a model, the way `list-item` and `timeline`
 * declare it: the family has no keyboard and cannot move the index, so a
 * model would name a request nothing can emit. `disabled` is read from the
 * root and from any row above it, because the row is where the state lives.
 */
test('declares current and disabled as states, and holds no mutable capability', () => {
  assert.deepEqual(contract.members.highlight.states, ['default', 'current', 'disabled']);
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.equal(contract.stateAttributes.disabled, 'data-disabled');
  assert.equal(contract.members.highlight.defaults.current, null);
  for (const capability of contract.members.highlight.capabilities) {
    assert.ok(!MUTABLE_CAPABILITIES.includes(capability), `${capability} would need a model`);
  }
  assert.equal(contract.stateModel, undefined);
  assert.match(contract.current.model, /none/);
});

/**
 * MDN documents that most screen readers do not announce `mark` by default and
 * offers a hidden `::before` to make them; the family refuses the technique,
 * because a five-match option would become ten announcements, and records
 * that a consumer who needs it writes it in its own scope.
 */
test("keeps the mark's semantics and injects no hidden text", () => {
  assert.match(contract.announcement.decision, /no hidden text/);
});

/**
 * The mark used to be declared by `combobox` — the shared sheet, the
 * identifier its `match` part wore. Now the family declares itself, and
 * `combobox` points at it: one `mark` block that names the family, no
 * stylesheet path of its own.
 */
test('is pointed at by combobox rather than declared by it', () => {
  assert.equal(combobox.mark.family, 'highlight');
  assert.equal(combobox.mark.stylesheet, undefined);
  for (const host of ['combobox', 'select', 'multi-select', 'command-palette', 'listbox']) {
    assert.ok(host in contract.hosts, `${host} is a host`);
  }
});

test('names every declined capability and what replaces it', () => {
  for (const key of ['matchElement', 'wholeWord', 'styleObject']) {
    assert.ok(contract.declined[key].length > 40, `${key} names its replacement`);
  }
});
