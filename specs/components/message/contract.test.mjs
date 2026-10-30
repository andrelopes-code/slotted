import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, STATE_PRECEDENCE, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const { message, bubble } = contract.members;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'message');
  assert.equal(contract.ui, 'message');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * Two members: the row a sender speaks in, and the surface the words are
 * painted on. A bubble nests inside a message, so the two roots cannot both be
 * `data-part="root"` under one `data-ui` without every selector for one
 * matching the other; the bubble's root is written `data-part="bubble"`.
 */
test('is a row and a surface, and the surface is told apart from the row in the DOM', () => {
  assert.deepEqual(Object.keys(contract.members), ['message', 'bubble']);
  assert.equal(message.nativeElement, 'article');
  assert.equal(bubble.nativeElement, 'div');
  assert.deepEqual(contract.rootPart, { message: 'root', bubble: 'bubble' });
  assert.deepEqual(message.parts, [
    'root',
    'group',
    'avatar',
    'body',
    'header',
    'author',
    'time',
    'footer',
    'receipt',
    'actions',
    'activity',
    'activity-step',
    'versions',
    'version-previous',
    'version-label',
    'version-next',
  ]);
  assert.deepEqual(bubble.parts, [
    'root',
    'content',
    'meta',
    'quote',
    'quote-author',
    'more',
    'stream',
    'stream-chunk',
    'caret',
    'typing',
    'retry',
    'reactions',
    'reaction',
    'reaction-count',
  ]);
});

/**
 * The side is asked once, on the row. The surveyed shadcn examples pass
 * `align` to both `Message` and `Bubble`, which is two answers to one
 * question that can disagree.
 */
test('asks the side once, on the row, and the bubble follows it', () => {
  assert.deepEqual(contract.axes.align, ['start', 'end']);
  assert.ok(!('align' in bubble.defaults), 'a bubble has no side of its own');
  assert.deepEqual(contract.resolution.variant, ['prop', 'message', 'defaults', 'soft']);
  assert.deepEqual(contract.resolution.tone, ['prop', 'message', 'defaults', 'secondary']);
  assert.deepEqual(contract.inference, {
    end: { variant: 'solid', tone: 'accent' },
    thread: { variant: 'plain' },
  });
});

/**
 * Painting and tone are two axes, as they are everywhere else in the library.
 * Seven named variants mixed the two, and two of them (`muted`, `secondary`)
 * measured the same ground.
 */
test('paints with a variant and a tone, never with a variant that names a tone', () => {
  assert.deepEqual(contract.axes.variant, ['solid', 'soft', 'outline', 'plain']);
  assert.deepEqual(contract.axes.tone, TONES);
  assert.deepEqual(contract.axes.layout, ['bubble', 'thread']);
  assert.deepEqual(contract.axes.actionsVisibility, ['always', 'hover']);
});

test('says where a message is in its delivery with a status, and paints the strongest state', () => {
  assert.deepEqual(contract.axes.status, [
    'sending',
    'sent',
    'delivered',
    'read',
    'failed',
    'streaming',
  ]);
  assert.deepEqual(contract.statusStates, {
    sending: ['loading'],
    streaming: ['loading'],
    failed: ['invalid'],
    read: ['read'],
  });
  for (const state of ['loading', 'invalid']) {
    assert.ok(STATE_PRECEDENCE.includes(state));
  }
  assert.deepEqual(Object.keys(contract.receipt.glyphs), ['sending', 'sent', 'delivered', 'read']);
  assert.equal(contract.receipt.glyphs.delivered, 'check-check');
  assert.equal(contract.receipt.glyphs.read, 'check-check');
  assert.match(contract.receipt.inside, /meta/);
  assert.match(contract.receipt.failed, /no mark/);
});

/**
 * Three values a reader moves and a consumer may own: the version on screen,
 * a reaction pressed, a long text shown whole.
 */
test('models every value a reader moves', () => {
  assert.deepEqual(contract.stateModel, {
    current: {
      controlled: 'version',
      uncontrolled: 'defaultVersion',
      request: 'onVersionChange',
      reasons: ['pointer', 'keyboard'],
    },
    pressed: {
      controlled: 'pressed',
      uncontrolled: 'defaultPressed',
      request: 'onPressedChange',
      reasons: ['pointer', 'keyboard'],
    },
    revealed: {
      controlled: 'revealed',
      uncontrolled: 'defaultRevealed',
      request: 'onRevealedChange',
      reasons: ['pointer', 'keyboard'],
    },
  });
});

/**
 * No roving tabindex: a message holds up to six targets and a conversation
 * hundreds; a mode of arrow keys would hide the actions behind it.
 */
test('leaves every target in the page tab sequence, and pages versions by arrow', () => {
  assert.equal(contract.rovingTabindex, false);
  assert.deepEqual(
    contract.keyboard.map((row) => `${row.key}:${row.source}`),
    [
      'Tab:platform',
      'Shift+Tab:platform',
      'Enter:platform',
      'Space:platform',
      'ArrowRight:family',
      'ArrowLeft:family',
    ],
  );
});

/**
 * The article is named by its sender, which is what a screen reader reads when
 * it jumps from one article to the next.
 */
test('names each article by its author', () => {
  assert.equal(contract.labelling.root, 'aria-labelledby author');
  assert.equal(contract.roles.actions, 'toolbar');
  assert.equal(contract.roles.activity, 'status');
  assert.equal(contract.roles.typing, 'img');
  assert.equal(contract.roles.reaction, 'button with aria-pressed');
});

/**
 * Truncation never removes content: a long bubble is clamped in CSS and the
 * text stays in the DOM, whole, for copying and for assistive technology.
 */
/**
 * A message that did not go is said by a control beside its surface, which
 * is also the way to send it again, and by the receipt in words — never by a
 * rim of a second color round the surface.
 */
test('says a failure with a control that resends it, and a wait with a log of steps', () => {
  assert.equal(contract.retry.member, 'bubble');
  assert.equal(contract.retry.glyph, 'rotate-ccw');
  assert.deepEqual(contract.retry.request, { react: 'onRetry', angular: '(retry)' });
  assert.equal(contract.activity.step, 'activity-step');
  assert.deepEqual(Object.keys(contract.activity.states), ['complete', 'current']);
  assert.equal(contract.stateAttributes.complete, 'data-complete');
  assert.equal(contract.stateAttributes.current, 'data-current');
});

test('clamps a long text without removing it', () => {
  assert.equal(contract.clamp.property, '-webkit-line-clamp');
  assert.equal(contract.clamp.part, 'more');
  assert.match(contract.clamp.reason, /DOM/);
});

test('declines what another family or two lines of consumer code already do', () => {
  assert.deepEqual(Object.keys(contract.declined).sort(), [
    'attachments',
    'editing',
    'emptyState',
    'systemMessage',
    'typewriter',
  ]);
  assert.equal(contract.declined.attachments.deferTo, 'attachment');
  assert.equal(contract.declined.emptyState.deferTo, 'result-state');
});

test('has a reference page for each member and an overview', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['overview', 'message', 'bubble']);
});

/**
 * A burst from the transport enters as a wave, and the wave is bounded: the
 * paint never trails what was received by more than one long transition.
 */
test('lets streamed words enter as a bounded wave without holding any back', () => {
  const streaming = contract.streaming;
  assert.equal(streaming.text, 'stream');
  assert.equal(streaming.chunk, 'stream-chunk');
  assert.equal(streaming.engine, '@slotted/core/text-stream');
  assert.match(streaming.arrival, /in the DOM at once/);
  assert.match(streaming.arrival, /320 ms/);
  assert.match(streaming.reducedMotion, /settled/);
});
