import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.notificationCenter;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'notification-center');
  assert.equal(contract.ui, 'notification-center');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A feed of articles, as the APG pattern says, with the Feed keyboard taken
 * from `@slotted/core/timeline` and none of timeline's paint: a
 * notification is a row with a dot, not an event on a rail.
 */
test('is a region holding a feed of articles, with the keyboard the Feed pattern asks for', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/feed/');
  assert.equal(member.nativeElement, 'section');
  assert.equal(contract.roles.feed, 'feed');
  assert.equal(contract.roles.item, 'article');
  assert.match(contract.engine, /feedFocusTarget/);
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of ['PageDown', 'PageUp', 'Control+End', 'Control+Home', 'Delete']) {
    assert.ok(keys.includes(key), `no ${key}`);
  }
  assert.match(contract.wiring['aria-posinset / aria-setsize'], /-1 while more may come/);
  assert.equal(contract.declined.rail.reason.includes('rail'), true);
});

/**
 * Read is a fact of the consumer's store. The family asks with keys, a value
 * and a reason, and paints `data-read` from what it is given; it never
 * flips the fact itself. `read` is the word the schema gained for it.
 */
test('asks to mark read and never marks itself', () => {
  assert.ok(member.capabilities.includes('read'));
  assert.ok(!MUTABLE_CAPABILITIES.includes('read'));
  assert.equal(contract.stateAttributes.read, 'data-read');
  assert.deepEqual(contract.requests.onReadChange.reasons, ['pointer', 'keyboard', 'programmatic']);
  assert.match(contract.requests.onReadChange.from, /mark-all/);
  assert.ok(member.parts.includes('read-toggle'));
  assert.ok(member.parts.includes('mark-all'));
  assert.ok(!member.parts.includes('unread'), 'unread is a state on the item, not a part');
  assert.match(contract.unreadMark.signals, /wash/);
  assert.match(contract.unreadMark.signals, /semibold/);
});

/** The family's visual for a toned item: every glyph a circle; no triangle. */
test('draws a circle glyph for every tone and never a triangle', () => {
  for (const tone of contract.axes.tone) {
    assert.ok(typeof contract.toneGlyph[tone] === 'string', tone);
    assert.doesNotMatch(contract.toneGlyph[tone], /triangle/);
  }
});

/** Removal is the consumer's collection's, as tag and tabs already hold it. */
test('asks to be removed, from the control and from the Delete key', () => {
  assert.ok(member.capabilities.includes('removable'));
  assert.deepEqual(contract.requests.onRemove.reasons, ['pointer', 'keyboard']);
  assert.ok(member.parts.includes('dismiss'));
  const del = contract.keyboard.find((entry) => entry.key === 'Delete');
  assert.match(del.effect, /asks to remove/);
});

/**
 * The one mutable value: which view the reader is on. `all` and `unread`
 * are built in; any other view is the consumer's query.
 */
test('holds the view as its one mutable value, over the tabs strip', () => {
  assert.deepEqual(contract.stateModel, {
    current: {
      controlled: 'view',
      uncontrolled: 'defaultView',
      request: 'onViewChange',
      reasons: ['pointer', 'keyboard', 'programmatic'],
    },
  });
  assert.equal(member.defaults.view, 'all');
  assert.deepEqual(contract.views.builtIn, ['all', 'unread']);
  assert.match(contract.roles.views, /tabs/);
  assert.match(contract.wiring['aria-controls'], /feed/);
});

/**
 * The scope's guarantee: live updates neither steal focus nor reorder while
 * the reader reads. The family holds them behind `fresh` itself, reading
 * focus and scroll, and a switch turns it off.
 */
test('holds arrivals while the reader reads, and says so once', () => {
  assert.deepEqual(contract.axes.arrivals, ['hold', 'show']);
  assert.equal(member.defaults.arrivals, 'hold');
  assert.match(contract.arrivals.hold, /activeElement is inside the feed/);
  assert.match(contract.arrivals.immediate, /apply at once/);
  assert.match(contract.arrivals.announce, /polite/);
  assert.ok(member.parts.includes('fresh'));
  assert.deepEqual(contract.requests.onReveal.reasons, ['pointer', 'keyboard']);
  assert.ok(member.capabilities.includes('live'));
});

test('loads a page at a time in the vocabulary timeline holds', () => {
  assert.deepEqual(contract.axes.growing, ['none', 'button', 'scroll']);
  assert.equal(member.defaults.growing, 'none');
  assert.deepEqual(contract.requests.onLoadMore.reasons, ['pointer', 'keyboard', 'scroll']);
  assert.ok(member.parts.includes('more'));
  assert.equal(contract.declined.virtualization.deferTo, 'growing');
});

test('formats time with the shared formatter and clamps the words', () => {
  assert.deepEqual(contract.axes.timeFormat, ['relative', 'absolute']);
  assert.equal(member.defaults.timeFormat, 'relative');
  assert.match(contract.time.format, /formatTimestamp/);
  assert.equal(contract.clamp.title, 2);
  assert.equal(contract.clamp.description, 3);
});

test('reports the count for the bell and leaves the bell and the popover to their families', () => {
  assert.equal(contract.declined.bell.deferTo, 'top-navigation');
  assert.equal(contract.declined.open.deferTo, 'popover');
  assert.equal(contract.requests.onUnreadChange.payload, 'count');
  assert.ok(!('open' in (contract.stateModel ?? {})));
});

test('offers two sizes, three ranks and the five tones on the item', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md']);
  assert.equal(member.defaults.size, 'md');
  assert.deepEqual(contract.axes.level, ['2', '3', '4']);
  assert.equal(member.defaults.level, '2');
  assert.deepEqual(contract.axes.tone, [
    'accent',
    'secondary',
    'info',
    'success',
    'warning',
    'danger',
  ]);
  assert.ok(!('tone' in member.defaults), 'the tone is the item’s, accent when unstated');
});
