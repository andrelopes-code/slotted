import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.carousel;
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'carousel');
  assert.equal(contract.ui, 'carousel');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it implements rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/');
});

/**
 * The anatomy is the APG's terms, one part each: slide, rotation control,
 * previous and next, slide picker. The scroller is a part because it is what
 * the keyboard pages and what the drag moves; the bar and the counter are
 * parts because a consumer places them.
 */
test('declares the APG anatomy plus the scroller, the bar and the counter', () => {
  assert.deepEqual(member.parts, [
    'root',
    'viewport',
    'slide',
    'previous',
    'next',
    'controls',
    'autoplay',
    'indicators',
    'indicator',
    'counter',
  ]);
  assert.equal(member.nativeElement, 'section');
});

test('gives each part the role the pattern asks for', () => {
  assert.deepEqual(contract.roles, {
    root: 'region',
    slide: 'group',
    indicators: 'tablist',
    indicator: 'tab',
  });
  assert.equal(contract.roleDescriptions.root, 'carousel');
  assert.equal(contract.roleDescriptions.slide, 'slide');
});

/**
 * "The label changes to match the action the button will perform … the
 * rotation control does not have any states, e.g., aria-pressed, specified."
 */
test('names the rotation control by its action and never marks it pressed', () => {
  assert.equal(contract.rotation.pressedState, false);
  assert.deepEqual(contract.rotation.messages, ['stop', 'start']);
  assert.equal(contract.rotation.firstInSequence, true);
});

/**
 * "Automatic slide rotation stops when any element in the carousel receives
 * keyboard focus. It does not resume unless the user activates the rotation
 * control." Hover pauses and gives the time back; it is not a change of state.
 */
test('stops the rotation on keyboard focus and only pauses it on hover', () => {
  assert.equal(contract.rotation.keyboardFocus, 'stop');
  assert.equal(contract.rotation.hover, 'pause');
  assert.equal(contract.rotation.hiddenDocument, 'pause');
  assert.equal(contract.rotation.reducedMotion, 'does not start');
  assert.ok(contract.stateModel.playback.reasons.includes('keyboard'));
});

test('declares a state model for both values a consumer can own', () => {
  assert.ok(member.capabilities.includes('current'));
  assert.ok(member.capabilities.includes('playback'));
  assert.ok(MUTABLE_CAPABILITIES.includes('playback'));
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'page',
    uncontrolled: 'defaultPage',
    request: 'onPageChange',
    reasons: ['pointer', 'keyboard', 'scroll', 'timeout', 'resize', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.playback, {
    controlled: 'playing',
    uncontrolled: 'defaultPlaying',
    request: 'onPlayingChange',
    reasons: ['pointer', 'keyboard', 'scroll', 'timeout', 'programmatic'],
  });
});

/**
 * A disabled button drops the focus it holds onto the body, and the reader
 * pressing "next" at the last page would then be nowhere. The ends are
 * announced, not enforced by the platform.
 */
test('keeps focus on a control that reaches an end', () => {
  assert.equal(contract.ends.attribute, 'aria-disabled');
  assert.equal(contract.ends.nativeDisabled, false);
});

/** The slides out of view are hidden from assistive technology, as the APG asks. */
test('hides the slides that are not in view', () => {
  assert.equal(contract.inView.hiddenBy, 'inert');
  assert.equal(contract.inView.threshold, 0.5);
});

test('pages the viewport from the keyboard and mirrors the inline axis', () => {
  for (const key of [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
  ]) {
    assert.ok(keyboard(key), `${key} is not declared`);
    assert.ok(keyboard(key).focus.length > 0, `${key} does not say where focus lands`);
  }
  assert.match(keyboard('ArrowRight').effect, /mirrored/);
  assert.match(keyboard('ArrowDown').effect, /vertical/);
  assert.equal(contract.repeatedKeysAnimate, false);
});

test('implements the slide picker as the tabs pattern without wrapping', () => {
  const picker = contract.keyboard.filter((entry) => entry.target === 'indicators');
  assert.deepEqual(
    picker.map((entry) => entry.key),
    ['Tab', 'ArrowRight', 'ArrowLeft', 'Home', 'End'],
  );
  assert.equal(contract.indicators.activation, 'automatic');
  assert.equal(contract.indicators.loop, false);
});

test('declares every axis and the value the family resolves without one', () => {
  assert.deepEqual(contract.axes, {
    orientation: ['horizontal', 'vertical'],
    transition: ['slide', 'fade'],
    align: ['start', 'center'],
    arrows: ['inset', 'outside'],
    size: ['sm', 'md', 'lg'],
  });
  assert.deepEqual(contract.partAxes, {
    indicators: { variant: ['dots', 'line', 'thumbnails'] },
    controls: { placement: ['below', 'overlay'] },
  });
  for (const [axis, values] of Object.entries(contract.axes)) {
    assert.ok(values.includes(member.defaults[axis]), `${axis} default is not a value`);
    assert.deepEqual(contract.resolution[axis], ['prop', 'defaults', member.defaults[axis]]);
  }
});

/** Clones would duplicate the consumer's ids, focus and form state. */
test('loops without cloning a slide', () => {
  assert.equal(contract.loop.clones, false);
  assert.equal(member.defaults.loop, false);
});

test('never starts a rotation by default', () => {
  assert.equal(member.defaults.autoplay, false);
});

test('states the runtime properties the stylesheet reads', () => {
  assert.deepEqual(contract.runtimeProperties, [
    '--slotted-carousel-slides-per-view',
    '--slotted-carousel-autoplay-delay',
    '--slotted-carousel-overscroll',
  ]);
});

/**
 * Embla, under shadcn and ReUI, runs an attraction simulation and says "drag
 * interactions are not affected because duration is then determined by the
 * drag force". An easing curve starts every movement from rest, so a drag
 * that let go at speed stopped and set off again.
 */
test('moves the scroll on a spring that keeps the speed it is given', () => {
  assert.match(contract.motion.scroll, /critically damped spring/);
  assert.match(contract.motion.scroll, /speed the scroller already has/);
  assert.match(contract.pointer.release, /release speed/);
  assert.match(contract.pointer.edges, /rubber band/);
});

test('declares a scenario for every axis and for the gaps the inventory names', () => {
  for (const scenario of [
    'orientation',
    'transition',
    'align',
    'arrows',
    'sizes',
    'indicators',
    'autoplay',
    'multiple',
    'loop',
    'controlled',
    'empty',
    'keyboard',
  ]) {
    assert.ok(contract.scenarios.carousel.includes(scenario), `${scenario} is missing`);
  }
});
