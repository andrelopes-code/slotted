import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Loader } from './loader';
import { ProgressBar } from './progress-bar';
import { ProgressCircle } from './progress-circle';

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

describe('a compact bar in a table cell', () => {
  it('draws the value alone at the end over a hairline track, named by its hidden label', () => {
    const { container } = render(
      <div style={{ inlineSize: 160 }}>
        <ProgressBar hideLabel label="Seats used" max={50} showValue size="sm" value={42} />
      </div>,
    );
    const root = container.querySelector<HTMLElement>('[data-ui="progress-indicator"]')!;
    const label = root.querySelector<HTMLElement>('[data-part="label"]');
    const value = root.querySelector<HTMLElement>('[data-part="value"]')!;
    const track = root.querySelector<HTMLElement>('[data-part="track"]')!;
    const bar = screen.getByRole('progressbar', { name: 'Seats used' });

    expect(bar).toBe(root);
    expect(label === null || label.getBoundingClientRect().width <= 1).toBe(true);
    expect(track.getBoundingClientRect().height).toBe(4);
    expect(value.getBoundingClientRect().right).toBeCloseTo(track.getBoundingClientRect().right, 0);
    expect(value.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      track.getBoundingClientRect().top,
    );
  });
});

/**
 * The withheld indicator draws no box and stands in no accessibility tree. The
 * root's own `display` outranked the rule that withholds it.
 */
describe('an indicator that is not loading', () => {
  it.each([
    ['bar', <ProgressBar key="bar" label="Refreshing" loading={false} />],
    [
      'edge bar',
      <ProgressBar key="edge" label="Refreshing" loading={false} placement="edge-start" />,
    ],
    ['ring', <ProgressCircle key="ring" label="Refreshing" loading={false} />],
    ['loader', <Loader key="loader" label="Refreshing" loading={false} />],
  ])('draws nothing: %s', (_, indicator) => {
    render(indicator);

    const root = document.querySelector('[data-ui="progress-indicator"]')!;

    expect(getComputedStyle(root).display).toBe('none');
  });
});
