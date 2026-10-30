import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  MUTABLE_CAPABILITIES,
  STATE_PRECEDENCE,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const upload = JSON.parse(
  await readFile(new URL('../upload/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.attachment;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'attachment');
  assert.equal(contract.ui, 'attachment');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member, and the set is a part of it rather than a second member: `tag`
 * took the same decision for its group. A second member would be a second
 * reference page for a `ul` with one axis, and the `li` inside it is the same
 * attachment whether it stands in a set or alone.
 */
test('is one attachment, whose set is a part rather than a member', () => {
  assert.deepEqual(Object.keys(contract.members), ['attachment']);
  assert.equal(member.nativeElement, 'li');
  assert.deepEqual(member.parts, [
    'root',
    'group',
    'preview',
    'body',
    'trigger',
    'filename',
    'name',
    'extension',
    'detail',
    'message',
    'progress',
    'actions',
    'action',
    'remove',
  ]);
  assert.equal(contract.group.element, 'ul');
  assert.equal(contract.group.itemElement, 'li');
  assert.equal(contract.group.aloneElement, 'div');
});

/**
 * `upload` acquires and transfers; this family shows a file that already
 * belongs to something. The file vocabulary is shared through
 * `@slotted/core/upload` and nothing else is.
 */
test('shares the file vocabulary with upload and no implementation', () => {
  assert.deepEqual(contract.vocabulary.module, '@slotted/core/upload');
  assert.deepEqual(contract.vocabulary.functions, ['fileKind', 'splitName', 'formatBytes']);
  assert.deepEqual(contract.composesFamilies, ['icon', 'progress-indicator']);
});

/**
 * The kind decides the tile's color and the mark knocked out of it, and a
 * reader who meets a PDF in an upload and the same PDF in a reply has to meet
 * the same tile. The map is read against `upload`'s, so the two cannot drift.
 */
test('draws every kind with the tile and the mark upload draws it with', () => {
  assert.deepEqual(Object.keys(contract.kinds).sort(), Object.keys(upload.kinds).sort());
  for (const [kind, entry] of Object.entries(contract.kinds)) {
    assert.equal(entry.glyph, upload.kinds[kind].glyph, `${kind} has a second mark`);
    assert.equal(entry.tile, upload.kinds[kind].tile, `${kind} has a second color`);
  }
  assert.equal(contract.kindsForeground, upload.kindsForeground);
});

/**
 * Interactive content may not nest inside `a` or `button`, so the file's own
 * target and the actions beside it are siblings. The target covers the whole
 * attachment by a stretched pseudo-element, and the actions rise above it —
 * the decision `list-item` took for `content` and `actions`.
 */
test('stretches the file target over the attachment and keeps the actions beside it', () => {
  assert.equal(contract.trigger.part, 'trigger');
  assert.deepEqual(contract.trigger.elements, { navigation: 'a', action: 'button' });
  assert.equal(contract.trigger.accessibleName, 'filename');
  assert.match(contract.trigger.stretch, /::after/);
  assert.equal(contract.actionsPlacement.part, 'actions');
  assert.equal(contract.actionsPlacement.sibling, 'body');
  assert.ok(member.parts.indexOf('actions') > member.parts.indexOf('trigger'));
});

/**
 * The name shrinks and the extension does not. `splitName` makes the split;
 * the full name stays in the document and in the `title`, because truncation
 * never removes content (`docs/build-briefing.md`).
 */
test('truncates the stem and keeps the extension, isolated in its own direction', () => {
  assert.deepEqual(contract.filename.split, ['name', 'extension']);
  assert.equal(contract.filename.dir, 'auto');
  assert.match(contract.filename.reason, /title/);
});

/**
 * Removal is a request, not a value: the list belongs to the consumer, and
 * the family never commits a removal on its own. Focus is kept by
 * `removal-focus`, observed on the set.
 */
test('asks to be removed and keeps the keyboard where it was', () => {
  assert.deepEqual(contract.removal.reasons, ['remove', 'keyboard']);
  assert.deepEqual(contract.removal.keys, ['Backspace', 'Delete']);
  assert.equal(contract.removal.focus.module, '@slotted/core/focus');
  assert.deepEqual(contract.removal.focus.order, ['next', 'previous', 'group']);
  assert.ok(!('stateModel' in contract), 'the family holds no value a consumer can own');
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(!member.capabilities.includes(capability), `claims mutable ${capability}`);
  }
});

/** A transfer the application runs is drawn with `progress-indicator`'s bar. */
test('draws a transfer with the progress bar, and waits without a value', () => {
  assert.equal(contract.progress.family, 'progress-indicator');
  assert.equal(contract.progress.range, '0..100');
  assert.match(contract.progress.indeterminate, /loading/);
  assert.match(contract.progress.accessibleName, /file name/);
});

test('scales in three steps and lays out in two orientations and three arrangements', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.deepEqual(contract.axes.layout, ['list', 'grid', 'strip']);
  assert.equal(member.defaults.size, 'md');
  assert.equal(member.defaults.orientation, 'horizontal');
  assert.equal(member.defaults.layout, 'list');
});

/** A value an attachment inherits from its set still loses to its own prop. */
test('resolves every inherited value from the consumer first', () => {
  assert.deepEqual(contract.resolution.size, ['prop', 'group', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.orientation, ['prop', 'group', 'defaults', 'horizontal']);
  assert.deepEqual(contract.resolution.layout, ['prop', 'defaults', 'list']);
  for (const [axis, order] of Object.entries(contract.resolution)) {
    assert.equal(order[0], 'prop', `${axis} lets something outrank the consumer`);
  }
  assert.deepEqual(contract.provides.attachmentDefaults, ['size', 'orientation', 'layout']);
});

test('paints seven states, the three attributes in the order a stylesheet holds them', () => {
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'invalid',
    'loading',
    'disabled',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    invalid: 'data-invalid',
    loading: 'data-loading',
    disabled: 'data-disabled',
  });
  const ranked = STATE_PRECEDENCE.filter((state) => member.states.includes(state));
  assert.deepEqual(ranked.slice(0, 3), ['disabled', 'loading', 'invalid']);
});

/**
 * `listitem` deprecates `aria-invalid` and `aria-disabled` (ARIA 1.2), so the
 * row paints both from data and the controls that can refuse carry the
 * attribute. The message reaches a reader as the trigger's description.
 */
test('announces an invalid file through the trigger rather than the row', () => {
  assert.match(contract.invalid.announcedBy, /aria-describedby/);
  assert.ok(contract.invalid.describedBy.includes('message'));
  assert.ok(contract.invalid.describedBy.includes('detail'));
  assert.match(contract.invalid.row, /data-invalid/);
});

test('binds only the removal keys and leaves the rest to the platform', () => {
  const keys = contract.keyboard.map((row) => row.key);
  assert.deepEqual(keys, ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Backspace', 'Delete']);
  for (const row of contract.keyboard) {
    const own = row.key === 'Backspace' || row.key === 'Delete';
    assert.equal(row.source, own ? 'family' : 'platform', row.key);
  }
  assert.equal(contract.rovingTabindex, false);
});

test('declines nothing without naming what answers it instead', () => {
  assert.match(contract.declined.empty.reason, /result-state/);
  assert.match(contract.declined.hoverCard.reason, /HoverCard/);
  assert.match(contract.declined.fade.reason, /scroll-area/);
  assert.match(contract.declined.processing.reason, /loading/);
});

test('names one reference page', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['attachment']);
  assert.deepEqual(contract.scenarios.attachment, [
    'playground',
    'anatomy',
    'sizes',
    'orientation',
    'layout',
    'kinds',
    'trigger',
    'actions',
    'states',
    'content',
    'composition',
    'keyboard',
  ]);
});
