import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.eventCalendar;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'event-calendar');
  assert.equal(contract.ui, 'event-calendar');
  assert.equal(contract.schemaVersion, 5);
  assert.equal(member.nativeElement, 'div');
});

/** The anatomy of the design, §4, part for part and in document order. */
test('declares the parts of the design, each described', () => {
  assert.deepEqual(member.parts, [
    'root',
    'header',
    'title',
    'navigation',
    'previous',
    'today',
    'next',
    'views',
    'filter',
    'actions',
    'body',
    'loader',
    'error',
    'month',
    'weekdays',
    'week-number-header',
    'weekday',
    'week',
    'week-number',
    'day',
    'day-header',
    'day-number',
    'day-content',
    'day-events',
    'event',
    'event-time',
    'event-title',
    'event-location',
    'event-meta',
    'resize-handle',
    'continuation',
    'more',
    'time-grid',
    'time-head',
    'columns',
    'zone',
    'column-header',
    'offset-change',
    'all-day-row',
    'all-day-label',
    'all-day-cell',
    'scroller',
    'time-row',
    'gutter',
    'hour',
    'column',
    'off-hours',
    'now',
    'offset-line',
    'selection',
    'list',
    'list-day',
    'list-day-heading',
    'detail-day',
    'detail-range',
    'list-weekday',
    'list-date',
    'list-events',
    'empty',
  ]);
  for (const part of member.parts) {
    assert.equal(typeof contract.anatomy[part], 'string', `anatomy ${part}`);
  }
});

test('offers four views and declares the range and step of each', () => {
  assert.deepEqual(contract.axes.view, ['month', 'week', 'day', 'list']);
  for (const view of contract.axes.view) {
    assert.equal(typeof contract.views[view].range, 'string', `${view} range`);
    assert.equal(typeof contract.views[view].step, 'string', `${view} step`);
  }
  assert.match(contract.views.month.range, /monthGrid/);
  assert.deepEqual(contract.axes.listRange, ['week', 'month']);
  assert.deepEqual(contract.axes.weekends, ['shown', 'hidden']);
  assert.deepEqual(contract.axes.compact, ['list', 'keep']);
});

/**
 * The library holds wall-clock values and no instant (`docs/build-briefing.md`,
 * Decisions already taken). The zone answers today, now and the gutter's label;
 * the application converts, and the calendar states what it does on the two
 * days a year the clock is not a straight line.
 */
test('holds wall-clock time and declares its daylight-saving policy', () => {
  assert.match(contract.time.values, /PlainDate/);
  assert.match(contract.time.values, /PlainDateTime/);
  assert.match(contract.time.conversion, /wallClockIn/);
  assert.deepEqual(Object.keys(contract.time.dst), [
    'skippedHour',
    'repeatedHour',
    'duration',
    'recurrence',
    'marker',
  ]);
  assert.match(contract.time.end.allDay, /inclusive/);
  assert.match(contract.time.end.timed, /exclusive/);
});

test('reads recurrence from its own core module and says what it refuses', () => {
  assert.ok(contract.core.includes('@slotted/core/recurrence'));
  assert.ok(contract.core.includes('@slotted/core/event-calendar'));
  assert.ok(contract.core.includes('@slotted/core/date'));
  assert.deepEqual(contract.recurrence.keys, [
    'FREQ',
    'INTERVAL',
    'COUNT',
    'UNTIL',
    'BYDAY',
    'BYMONTHDAY',
    'BYMONTH',
    'WKST',
  ]);
  assert.match(contract.recurrence.refused, /BYSETPOS/);
  assert.match(contract.recurrence.parse, /null/);
  assert.equal(contract.recurrence.maxPeriods, 50000);
});

/**
 * A calendar is dropped into domains the family cannot know: a clinic's
 * opening hours, a hotel's nightly price, a room's free slots. The two places
 * a domain writes into are declared, not left to a class name.
 */
test('takes working hours and day content from the consumer', () => {
  assert.match(contract.workingHours.shape, /PlainTime/);
  assert.match(contract.workingHours.grid, /off-hours/);
  assert.match(contract.workingHours.selection, /does not refuse/);
  assert.match(contract.dayContent.react, /renderDayContent/);
  assert.match(contract.dayContent.angular, /slEventCalendarDayContent/);
  assert.equal(contract.dataAttributes['data-non-working'].length > 0, true);
});

/**
 * Moving and resizing is a request, not a model: the event is the
 * application's, and the family asks where it should go, with the placement in
 * the kind the event already holds.
 */
test('asks to move and resize an event, by pointer and by key', () => {
  assert.match(contract.editing.request, /onEventChange/);
  assert.match(contract.editing.request, /eventChangeRequest/);
  assert.match(contract.editing.notAModel, /not mutable/);
  assert.match(contract.editing.preview, /withPlacement/);
  assert.equal(contract.stateAttributes.dragging, 'data-dragging');
  assert.ok(member.states.includes('dragging'));
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.ok(keys.includes('Alt+Arrow'));
  assert.ok(keys.includes('Alt+Shift+Arrow'));
  assert.equal(member.defaults.editable, false);
});

/**
 * The application can refuse a destination while the event is still moving:
 * the same change it would be asked for, asked before, so a reader sees the
 * refusal where the event is and not after letting go.
 */
test('asks canDrop about each destination before it asks to move', () => {
  assert.match(contract.editing.canDrop, /canDrop\(change\)/);
  assert.match(contract.editing.canDrop, /data-drop-invalid/);
  assert.match(contract.editing.canDrop, /asks for nothing/);
  assert.match(contract.editing.canDrop, /nextAllowedPlacement/);
  assert.ok(contract.dataAttributes['data-drop-invalid'].length > 0);
  assert.ok(contract.messages.includes('dropInvalid'));
  const alt = contract.keyboard.find((entry) => entry.key === 'Alt+Arrow');
  assert.match(alt.effect, /refused/);
});

test('declares one overlap policy and where the excess goes', () => {
  assert.match(contract.layout.overlap, /columns/);
  assert.match(contract.layout.overflow, /maxColumns/);
  assert.match(contract.layout.month, /maxEvents/);
  assert.equal(member.defaults.maxEvents, 3);
  assert.equal(member.defaults.maxColumns, 6);
});

test('holds five models, each with a request that carries a reason', () => {
  assert.deepEqual(contract.stateModel.current, {
    date: {
      controlled: 'date',
      uncontrolled: 'defaultDate',
      request: 'onDateChange',
      reasons: ['pointer', 'keyboard', 'programmatic'],
    },
    view: {
      controlled: 'view',
      uncontrolled: 'defaultView',
      request: 'onViewChange',
      reasons: ['pointer', 'keyboard', 'programmatic'],
    },
  });
  assert.deepEqual(contract.stateModel.visibility, {
    controlled: 'visibleCalendars',
    uncontrolled: 'defaultVisibleCalendars',
    request: 'onVisibleCalendarsChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'selection',
    uncontrolled: 'defaultSelection',
    request: 'onSelectionChange',
    reasons: ['pointer', 'keyboard', 'escape', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'openEvent',
    uncontrolled: 'defaultOpenEvent',
    request: 'onOpenEventChange',
    reasons: ['pointer', 'keyboard', 'dismiss', 'escape', 'outsidePress', 'programmatic'],
  });
  for (const capability of ['current', 'visibility', 'selection', 'open']) {
    assert.ok(member.capabilities.includes(capability), capability);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability));
  }
  assert.match(contract.facts.onRangeChange, /not a model/);
});

/**
 * WAI-ARIA APG has no pattern for an event calendar. The layout grid with
 * widgets in its cells is the closest, and every key below cites it or says
 * why it departs.
 */
test('sources its keyboard from the APG grid and names every key', () => {
  assert.equal(contract.pattern.url, 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/');
  assert.match(contract.pattern.absent, /no pattern/);
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Control+Home',
    'Control+End',
    'PageUp',
    'PageDown',
    'Shift+PageUp',
    'Shift+PageDown',
    'Enter',
    'F2',
    'Space',
    'Shift+Arrow',
    'Escape',
  ]) {
    assert.ok(keys.includes(key), `keyboard ${key}`);
  }
  for (const entry of contract.keyboard) {
    assert.equal(typeof entry.effect, 'string', `${entry.key} effect`);
    assert.equal(typeof entry.focus, 'string', `${entry.key} focus`);
  }
  assert.match(contract.focusModel, /roving/);
  assert.match(contract.declined.singleLetterShortcuts, /screen reader/);
});

test('names every event without position or colour', () => {
  assert.match(contract.wiring.eventName, /title/);
  assert.match(contract.wiring.eventName, /calendar/);
  assert.match(contract.wiring.eventName, /status/);
  assert.match(contract.wiring.continuation, /visually hidden/);
});

test('composes the families it draws with and defers what it does not own', () => {
  for (const family of [
    'segmented-control',
    'menu',
    'popover',
    'drawer',
    'context-menu',
    'progress-indicator',
  ]) {
    assert.ok(contract.composes.includes(family), `composes ${family}`);
  }
  assert.match(contract.composesNot.button, /data-part/);
  assert.equal(contract.declined.dragAndResize, undefined);
  assert.match(contract.declined.resources, /resource-scheduler/);
});

test('reports loading with one indicator and keeps the grid painted', () => {
  assert.match(contract.loading.indicator, /progress-indicator/);
  assert.match(contract.loading.grid, /painted/);
  assert.equal(member.defaults.loadingDelay, 200);
  assert.equal(member.defaults.loadingMinDuration, 400);
});

/**
 * The compact layout is a presentation, not a state change: the reader's
 * chosen view survives a narrow window and is there again when it widens.
 */
test('draws month and week as a list below the compact size class without moving the view', () => {
  assert.match(contract.compact.threshold, /COMPACT_BELOW/);
  assert.match(contract.compact.view, /does not change/);
  assert.deepEqual(contract.compact.applies, ['month', 'week']);
  assert.match(contract.compact.sheets, /drawer/);
  assert.match(contract.compact.sheets, /root/);
});

/**
 * The menu is the `context-menu` family's, over the body as one target; the
 * calendar only aims it. A target the application gives nothing for keeps the
 * browser's own menu, which is the rule that family states for its target.
 */
test('opens the application’s context menu on an event or on a stretch of the grid', () => {
  assert.match(contract.contextMenu.target, /event/);
  assert.deepEqual(contract.partIdentity.parts, { body: 'context-menu' });
  assert.match(contract.contextMenu.target, /selection/);
  assert.match(contract.contextMenu.opens, /Shift\+F10/);
  assert.match(contract.contextMenu.opens, /long press/);
  assert.match(contract.contextMenu.nothing, /browser/);
  assert.match(contract.dataAttributes['data-context'], /context menu/);
  assert.ok(contract.keyboard.some((entry) => entry.key.includes('Shift+F10')));
});

test('publishes its runtime custom properties under the names that say so', () => {
  assert.deepEqual(
    contract.runtimeProperties.map((entry) => entry.name),
    [
      '--slotted-event-lane',
      '--slotted-event-span',
      '--slotted-event-start',
      '--slotted-event-length',
      '--slotted-event-column',
      '--slotted-event-columns',
      '--slotted-event-calendar-days',
      '--slotted-event-calendar-lanes',
      '--slotted-event-calendar-slot',
    ],
  );
});

test('declares a scenario for every capability the reference page must show', () => {
  assert.deepEqual(contract.scenarios.eventCalendar, [
    'playground',
    'views',
    'month',
    'week',
    'day',
    'list',
    'all-day',
    'overlap',
    'recurrence',
    'time-zone',
    'calendars',
    'working-hours',
    'day-content',
    'detail',
    'context-menu',
    'selection',
    'editing',
    'loading',
    'empty',
    'error',
    'compact',
    'custom-event',
    'locale',
    'density',
    'keyboard',
  ]);
});
