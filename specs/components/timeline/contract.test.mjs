import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  STATE_PRECEDENCE,
  strongestState,
  TONES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const timeline = contract.members.timeline;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because every part reads one timeline', () => {
  assert.equal(contract.family, 'timeline');
  assert.equal(contract.ui, 'timeline');
  assert.deepEqual(Object.keys(contract.members), ['timeline']);
});

test('names the twenty-one parts an event list is made of', () => {
  assert.deepEqual(timeline.parts, [
    'root',
    'fresh',
    'list',
    'group',
    'group-label',
    'group-trigger',
    'group-indicator',
    'group-list',
    'item',
    'opposite',
    'rail',
    'marker',
    'connector',
    'content',
    'title',
    'actor',
    'time',
    'description',
    'actions',
    'more',
    'empty',
  ]);
});

/**
 * Two semantics, decided by one axis. A timeline that does not grow is an
 * ordered list, which the platform gives for free. One that grows is the APG
 * Feed pattern, whose unit is an `article` — and a `li` admits no `article`
 * role, so the list element changes with the mode rather than the item alone.
 */
test('is an ordered list, or a feed, and the mode decides which', () => {
  assert.equal(timeline.nativeElement, 'div');
  assert.equal(contract.rootRole, 'none');
  assert.deepEqual(contract.axes.mode, ['list', 'feed']);
  assert.equal(timeline.defaults.mode, 'list');
  assert.equal(contract.listElement.list, 'ol');
  assert.equal(contract.listElement.feed, 'div[role=feed]');
  assert.equal(contract.listElement.decidedBy, 'mode');
  assert.equal(contract.itemElement.list, 'li');
  assert.equal(contract.itemElement.feed, 'article');
  assert.equal(contract.pattern.feed, 'https://www.w3.org/WAI/ARIA/apg/patterns/feed/');
});

/**
 * The APG pattern, key by key, so the keyboard table can be audited against
 * the source rather than remembered. The four family keys exist in feed mode
 * only: an ordered list has no keyboard of its own.
 */
test('transcribes the feed keyboard and leaves the list to the platform', () => {
  const keys = Object.fromEntries(contract.keyboard.map((entry) => [entry.key, entry]));
  assert.deepEqual(Object.keys(keys), [
    'Tab',
    'PageDown',
    'PageUp',
    'Control+End',
    'Control+Home',
    'Enter',
    'Space',
  ]);
  for (const key of ['PageDown', 'PageUp', 'Control+End', 'Control+Home']) {
    assert.equal(keys[key].source, 'family');
    assert.match(keys[key].effect, /^feed only/);
  }
  assert.equal(keys.Tab.source, 'platform');
  assert.equal(keys['Control+End'].focus, 'outside the feed');
  assert.equal(keys['Control+Home'].focus, 'outside the feed');
});

/**
 * Every article in the feed is a tab stop, as the APG example writes it: it is
 * what gives `PageDown` a place to start from, and it is the cost written in
 * the design — one more stop per event.
 */
test('makes every article focusable, and says what the set size is', () => {
  assert.deepEqual(contract.focus, {
    item: 'tabindex="0" in feed mode, none in list mode',
    label: 'aria-labelledby: title, then actor, then time',
    description: 'aria-describedby: description, when it exists',
  });
  assert.equal(contract.setSize.count, 'aria-setsize when the consumer states it');
  assert.match(contract.setSize.otherwise, /-1 when more may come/);
});

/**
 * The one mutable value the family holds is whether a group is open. Loading
 * more and revealing fresh items are requests with no value to hold: the
 * consumer owns the array and adds to it.
 */
test('gives the group a controlled and uncontrolled pair, and nothing else a model', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['open']);
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.equal(timeline.defaults.defaultOpen, true);
  assert.equal(timeline.defaults.collapsible, false);
  for (const reason of contract.stateModel.open.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason));
  }
  assert.equal(contract.pattern.group, 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/');
});

test('requests more and reveals fresh items with a reason and no value', () => {
  assert.deepEqual(contract.axes.growing, ['none', 'button', 'scroll']);
  assert.equal(timeline.defaults.growing, 'none');
  assert.match(contract.growing.button, /pointer or keyboard/);
  assert.match(contract.growing.scroll, /IntersectionObserver/);
  assert.match(contract.growing.scroll, /with scroll/);
  assert.equal(contract.fresh.part, 'fresh');
  assert.equal(contract.fresh.request, 'onReveal');
  assert.deepEqual(contract.fresh.reasons, ['pointer', 'keyboard']);
  assert.equal(timeline.defaults.freshCount, 0);
  assert.ok(timeline.capabilities.includes('live'));
});

/**
 * The pill leaves as it came, with a transition: a part that unmounts has no
 * frame to fade in. Once it has appeared it stays mounted, hidden while the
 * count is zero, and keeps the last count as its words while it fades. The
 * reader who pressed it is taken to the first event it revealed, not left on
 * a control that is no longer there.
 */
test('keeps the fresh pill mounted to leave, and moves focus to what it revealed', () => {
  assert.match(contract.fresh.mount, /stays mounted/);
  assert.match(contract.fresh.mount, /hidden while freshCount is 0/);
  assert.match(contract.fresh.mount, /last count/);
  assert.match(contract.fresh.focus, /first revealed event/);
  assert.match(contract.fresh.focus, /newest-first/);
  assert.match(contract.fresh.focus, /oldest-first/);
  assert.equal(contract.fresh.focusLogic, 'revealFocusIndex');
});

/**
 * `current` is a fact the consumer states about one event, mirrored into
 * `aria-current`, and `complete` is either stated or derived — and the
 * derivation needs the order, which is why `order` is an axis rather than a
 * `reverse` flag that flips the array.
 */
test('marks the current event and derives completion from the declared order', () => {
  assert.equal(contract.currentSource, 'aria-current');
  assert.equal(contract.currentValue, 'true');
  assert.deepEqual(contract.statuses, ['pending', 'current', 'complete', 'loading']);
  assert.deepEqual(contract.axes.order, ['oldest-first', 'newest-first']);
  assert.equal(timeline.defaults.order, 'oldest-first');
  assert.equal(timeline.defaults.autoComplete, false);
  assert.match(contract.autoComplete['oldest-first'], /before the current/);
  assert.match(contract.autoComplete['newest-first'], /after the current/);
  assert.match(contract.autoComplete.connector, /dashed/);
  assert.equal(contract.declined.reverse.deferTo, "order, and the consumer's array");
});

test('resolves the four statuses in the order the vocabulary declares', () => {
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.equal(contract.stateAttributes.complete, 'data-complete');
  assert.equal(contract.stateAttributes.loading, 'data-loading');
  assert.equal(contract.stateAttributes.open, 'data-open');
  assert.equal(strongestState(['complete', 'current']), 'current');
  assert.equal(strongestState(['current', 'loading']), 'loading');
  assert.ok(STATE_PRECEDENCE.indexOf('complete') < STATE_PRECEDENCE.indexOf('hover'));
});

/**
 * The value of machine time is written where the platform reads it, and the
 * zone is explicit. No surveyed implementation writes `datetime`, and a plain
 * value — the one the date chain holds — is never converted.
 */
test('writes the timestamp as a time element with an explicit zone', () => {
  assert.equal(contract.timestamp.element, 'time');
  assert.equal(contract.timestamp.value, 'PlainDateTime | ISO 8601 string');
  assert.match(contract.timestamp.instant, /plain value is formatted without conversion/);
  assert.deepEqual(contract.axes.timeFormat, ['absolute', 'relative']);
  assert.equal(timeline.defaults.timeFormat, 'absolute');
  assert.match(contract.timestamp.relative, /title/);
  assert.match(contract.timestamp.reference, /Date\.now\(\) at render/);
});

test('names the three placements and the two orientations', () => {
  assert.deepEqual(contract.axes.placement, ['end', 'start', 'alternate']);
  assert.equal(timeline.defaults.placement, 'end');
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.equal(timeline.defaults.orientation, 'vertical');
  assert.equal(contract.reflow.container, 'slotted-timeline');
  assert.equal(contract.reflow.breakpoint, '30rem');
  assert.match(contract.reflow.below, /alternate falls to end/);
  assert.equal(timeline.defaults.reflow, true);
});

/**
 * `subtle` by default: a solid core in a soft disc of its own tone. A hollow
 * ring on every event read as a column of radio buttons, and a solid disc on
 * every event leaves nothing louder for `complete` and `current` to be.
 */
test('draws a subtle marker by default, in the five tones of the theme', () => {
  assert.deepEqual(contract.axes.variant, ['solid', 'outline', 'subtle', 'plain']);
  assert.equal(timeline.defaults.variant, 'subtle');
  assert.deepEqual([...contract.axes.tone].sort(), [...TONES].sort());
  assert.equal(timeline.defaults.tone, 'secondary');
  assert.deepEqual(contract.resolution.variant, ['item', 'root', 'defaults', 'subtle']);
  assert.deepEqual(contract.resolution.tone, ['item', 'root', 'defaults', 'secondary']);
  assert.deepEqual(contract.axes.connector, ['solid', 'dashed', 'none']);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
});

test('lets an application set its defaults once, and reads its words from the catalog', () => {
  assert.ok(contract.provides.timelineDefaults.includes('timeZone'));
  assert.ok(contract.provides.timelineDefaults.includes('now'));
  assert.ok(!contract.provides.timelineDefaults.includes('messages'));
  assert.deepEqual(contract.messages, [
    'collapse',
    'current',
    'empty',
    'expand',
    'freshItems',
    'loading',
    'loadMore',
  ]);
});

test('declines with a named owner or a composition, never with silence', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(typeof entry.deferTo === 'string' && entry.deferTo.length > 0, name);
    assert.ok(typeof entry.reason === 'string' && entry.reason.length > 40, name);
  }
  assert.equal(contract.declined.expandableItem.deferTo, 'collapsible');
  assert.equal(contract.declined.filters.deferTo, 'filter-bar');
});

test('records every literal the stylesheet states', () => {
  assert.deepEqual(Object.keys(contract.literals), [
    '--slotted-timeline-reflow-breakpoint',
    '--slotted-timeline-core-ratio',
    '--slotted-timeline-opposite-size',
  ]);
  for (const reason of Object.values(contract.literals)) {
    assert.ok(reason.length > 40);
  }
});

test('declares a scenario for every axis, every status and the keyboard', () => {
  assert.deepEqual(contract.scenarios.timeline, [
    'playground',
    'feed',
    'placement',
    'orientation',
    'order',
    'statuses',
    'appearance',
    'groups',
    'growing',
    'fresh',
    'timestamps',
    'content',
    'composition',
    'empty',
    'keyboard',
  ]);
});
