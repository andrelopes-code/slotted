import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from './progress-bar';

/** Properties Chrome animates on the compositor, away from the main thread. */
const COMPOSITED = new Set([
  'translate',
  'scale',
  'rotate',
  'transform',
  'opacity',
  'offset',
  'computedOffset',
  'easing',
  'composite',
]);

/* The theme's motion tokens, which the test document does not load. */
const MOTION = {
  '--slotted-duration-loop-slow': '2s',
  '--slotted-easing-standard': 'ease',
} as CSSProperties;

const block = (milliseconds: number) => {
  const end = performance.now() + milliseconds;
  while (performance.now() < end) {
    /* A long task: the main thread does nothing else. */
  }
};

/**
 * The indeterminate bar is the sign that the page is busy, so it keeps moving
 * while the main thread is. Moved by its inset and its width it needed a
 * layout every frame and stood still under any long task.
 */
describe('an indeterminate bar', () => {
  it('animates only what the compositor runs', () => {
    render(
      <div style={MOTION}>
        <ProgressBar label="Refreshing" />
      </div>,
    );
    const indicator = document.querySelector('[data-part="indicator"]') as HTMLElement;
    const [animation] = indicator.getAnimations();
    const properties = new Set(
      (animation?.effect as KeyframeEffect).getKeyframes().flatMap((frame) => Object.keys(frame)),
    );

    expect([...properties].filter((name) => !COMPOSITED.has(name))).toEqual([]);
    expect(properties.has('translate')).toBe(true);
  });

  it('keeps travelling through a long task', async () => {
    render(
      <div style={MOTION}>
        <ProgressBar label="Refreshing" />
      </div>,
    );
    const indicator = document.querySelector('[data-part="indicator"]') as HTMLElement;
    const [animation] = indicator.getAnimations();
    await animation!.ready;
    const before = Number(animation!.currentTime);

    block(500);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(Number(animation!.currentTime) - before).toBeGreaterThan(400);
  });
});
