import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.importExportCenter;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'import-export-center');
  assert.equal(contract.ui, 'import-export-center');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * No APG pattern covers a job center. The details follow Disclosure, which is
 * the one pattern the family cites as `pattern`; the rest is the platform's
 * list and the progressbar role `progress-indicator` already carries.
 */
test('is a region holding a native list, with the Disclosure pattern on the toggle', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/');
  assert.match(contract.patternStatus, /no pattern for a job center/);
  assert.equal(member.nativeElement, 'section');
  assert.match(contract.roles.list, /native ul/);
  assert.match(contract.roles.job, /native li/);
  assert.match(contract.roles.toggle, /Disclosure/);
  assert.match(contract.wiring['aria-expanded'], /toggle/);
  assert.match(contract.anatomy.toggle, /words stay/);
  assert.match(contract.wiring['aria-controls'], /details/);
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of ['Tab', 'Shift+Tab', 'Enter', 'Space']) {
    assert.ok(keys.includes(key), `no ${key}`);
  }
});

/**
 * Five statuses a consumer writes, and an outcome the family derives. A job
 * that finished with failed rows is `partial`, never painted as success.
 */
test('keeps success, partial and failure apart, and derives partial from the counts', () => {
  assert.deepEqual(contract.statuses, ['queued', 'running', 'succeeded', 'failed', 'canceled']);
  assert.deepEqual(contract.axes.outcome, ['success', 'partial', 'failed', 'canceled']);
  assert.match(contract.outcomes.partial, /counts\.failed/);
  assert.match(contract.outcomes.partial, /errorCount/);
  assert.equal(contract.tones.partial, 'warning');
  assert.equal(contract.tones.failed, 'danger');
  assert.equal(contract.tones.success, 'success');
  assert.ok(!contract.statuses.includes('partial'), 'partial is derived, not written');
});

test('draws a circle or a clock for every status and never a triangle', () => {
  for (const key of ['queued', 'running', 'success', 'partial', 'failed', 'canceled']) {
    assert.equal(typeof contract.statusGlyph[key], 'string', key);
    assert.doesNotMatch(contract.statusGlyph[key], /triangle/);
  }
  assert.notEqual(contract.statusGlyph.canceled, contract.statusGlyph.failed);
});

/**
 * Which controls a job offers is one table, decided in core and rendered by
 * both bindings. A finished job can be removed; a running one cannot.
 */
test('offers the controls each status allows, from one owner', () => {
  assert.deepEqual(contract.controls.running, ['cancel', 'toggle']);
  assert.deepEqual(contract.controls.success, ['download', 'toggle', 'remove']);
  assert.deepEqual(contract.controls.failed, ['retry', 'toggle', 'remove']);
  assert.ok(!contract.controls.running.includes('remove'));
  assert.match(contract.controls.owner, /jobControls/);
  assert.match(contract.controls.expired, /retry/);
  for (const part of ['download', 'cancel', 'retry', 'toggle', 'remove', 'job-actions']) {
    assert.ok(member.parts.includes(part), `no ${part}`);
  }
});

/** Expiry and permission are communicated, as the feature guide asks by name. */
test('says when a file expires, when it expired, and why it cannot be downloaded', () => {
  assert.deepEqual(contract.files.availability, [
    'available',
    'expires',
    'expired',
    'denied',
    'none',
  ]);
  assert.match(contract.files.expiry, /absolute date in every timeFormat/);
  assert.match(contract.files.permission, /denied/);
  assert.ok(contract.messages.includes('expires'));
  assert.ok(contract.messages.includes('expired'));
});

/** The jobs are the consumer's facts; the family asks, with a reason. */
test('asks for every change to a job and never makes one', () => {
  assert.deepEqual(contract.requests.onCancel.reasons, ['pointer', 'keyboard']);
  assert.deepEqual(contract.requests.onRetry.reasons, ['pointer', 'keyboard']);
  assert.deepEqual(contract.requests.onRemove.reasons, ['pointer', 'keyboard', 'clear']);
  assert.match(contract.requests.onRemove.from, /clear/);
  assert.match(contract.requests.onDownload.from, /cancellable/);
  assert.match(contract.requests.onOpen.from, /cancellable/);
  assert.ok(member.capabilities.includes('removable'));
  assert.ok(!MUTABLE_CAPABILITIES.includes('removable'));
});

/** Two mutable values: which view, and which jobs show their details. */
test('holds the view and the expanded set, each with a model', () => {
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'view',
    uncontrolled: 'defaultView',
    request: 'onViewChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.equal(contract.stateModel.open.controlled, 'expanded');
  assert.equal(contract.stateModel.open.uncontrolled, 'defaultExpanded');
  assert.equal(contract.stateModel.open.request, 'onExpandedChange');
  assert.deepEqual(contract.stateModel.open.reasons, ['pointer', 'keyboard', 'programmatic']);
  assert.equal(contract.stateAttributes.expanded, 'data-expanded');
});

/**
 * Status changes are spoken once; progress is not. The toast points at the
 * job under the job's own id, so the finishing notice replaces the starting
 * one rather than stacking beside it.
 */
test('announces transitions, stays silent on progress, and points the toast at the job', () => {
  assert.equal(contract.announcement.politeness, 'polite');
  assert.ok(contract.announcement.silent.includes('progress'));
  assert.ok(contract.announcement.silent.includes('the first render'));
  assert.equal(contract.progress.announced, false);
  assert.match(contract.notice.id, /job's key/);
  assert.match(contract.notice.reason, /no progress, no cancel and no download/);
  assert.match(contract.notice.react, /useJobToasts/);
  assert.match(contract.notice.angular, /jobToasts/);
});

/** Focus never falls to the body: not on removal, not when a status takes a control away. */
test('keeps focus inside the family when a job or a control disappears', () => {
  assert.match(contract.focus.removal.owner, /focusDestination/);
  assert.match(contract.focus.withdrawn.destination, /first control the same job still has/);
  assert.match(contract.focus.reveal, /programmatic/);
  assert.match(contract.wiring['aria-labelledby'], /job-title's id/);
});

test('names every row a failed job reports, and holds a sample in a box of its own', () => {
  assert.deepEqual(contract.errors.columns, ['row', 'message', 'column', 'value']);
  assert.match(contract.errors.sample, /errorCount above errors\.length/);
  assert.match(contract.errors.block, /scrolls/);
  assert.ok(member.parts.includes('errors-note'));
});

test('truncates a file name in the middle and keeps it whole in the DOM', () => {
  assert.equal(contract.content.truncation, 'middle');
  assert.equal(contract.content.removesFromDom, false);
  assert.equal(contract.content.direction, 'auto');
  for (const part of ['file-name', 'name', 'extension']) {
    assert.ok(member.parts.includes(part), `no ${part}`);
  }
});

test('declines what another family or three lines of consumer code already hold', () => {
  assert.equal(contract.declined.bulkSelection.deferTo, 'selection-toolbar');
  for (const name of ['importFromUrl', 'exportDialog', 'columnMapping', 'transport']) {
    assert.equal(typeof contract.declined[name].reason, 'string', name);
  }
  assert.deepEqual(contract.axes.growing, ['none', 'button']);
});
