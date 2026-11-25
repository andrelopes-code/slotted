import { render } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { cdp } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field';
import { Inline } from '../inline';
import { Loader } from '../progress-indicator';
import { TextField } from '../text-field';
import { Switch, SwitchDefaultsProvider } from './index';

/* No transition, so the computed colors are the end state. */
const still = (node: ReactNode) =>
  render(
    <div
      style={
        {
          '--slotted-control-transition-duration': '0s',
          '--slotted-switch-invalid-border-color': 'rgb(200, 0, 0)',
        } as CSSProperties
      }
    >
      {node}
    </div>,
  );

const parts = (container: HTMLElement) => ({
  thumb: getComputedStyle(container.querySelector('[data-part="thumb"]')!),
  track: getComputedStyle(container.querySelector('[data-part="track"]')!),
});

describe('an invalid switch', () => {
  it.each([true, false])('marks the outer edge of the track alone, checked %s', (checked) => {
    const valid = parts(
      still(<Switch aria-label="Feed" checked={checked} onCheckedChange={() => {}} />).container,
    );
    const invalid = parts(
      still(<Switch aria-label="Feed" checked={checked} invalid onCheckedChange={() => {}} />)
        .container,
    );

    /* One edge outside the track's border, in the invalid color, and nothing inset. */
    expect(invalid.track.boxShadow).toMatch(/^rgb\(200, 0, 0\) 0px 0px 0px \d/);
    expect(invalid.track.boxShadow).not.toContain('inset');
    expect(invalid.thumb.boxShadow).toBe(valid.thumb.boxShadow);
    expect(invalid.thumb.borderTopColor).toBe(valid.thumb.borderTopColor);
  });
});

describe('a switch in a row of fields', () => {
  const center = (element: Element) => {
    const box = element.getBoundingClientRect();
    return box.top + box.height / 2;
  };

  it.each([
    ['md', {}],
    /* The height of the field's control, which the test theme leaves at its fallback. */
    ['sm', { '--slotted-switch-control-block-size': '34px' }],
  ] as const)('sits a %s pill on the line of the controls', (size, style) => {
    const { container } = render(
      <Inline align="end" gap={3} wrap="nowrap">
        <Field>
          <FieldLabel>Rate</FieldLabel>
          <TextField />
        </Field>
        <Switch size={size} style={style as CSSProperties} variant="control">
          Exempt
        </Switch>
      </Inline>,
    );
    const input = container.querySelector('[data-ui="text-field"][data-part="root"]')!;
    const track = container.querySelector('[data-ui="switch"] [data-part="track"]')!;

    expect(Math.abs(center(track) - center(input))).toBeLessThan(0.5);
  });
});

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const thumbOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-ui="switch"] [data-part="thumb"]')!;

const shapeOf = (container: HTMLElement) => getComputedStyle(thumbOf(container), '::after');

/** The motion and ink tokens of the theme, which this package does not load. */
const THEME = {
  '--slotted-control-transition-duration': '100ms',
  '--slotted-control-transition-easing': 'linear',
  '--slotted-duration-loop-slow': '1600ms',
  '--slotted-easing-emphasized': 'cubic-bezier(0.3, 0, 0, 1.3)',
  '--slotted-text-muted': 'rgb(80, 80, 80)',
  '--slotted-tone-accent-on-solid': 'rgb(250, 250, 250)',
} as CSSProperties;

const themed = (node: ReactNode) => <div style={THEME}>{node}</div>;

const list = (value: string) => value.split(/,(?![^(]*\))/).map((entry) => entry.trim());

/** Each animation of a style as `name duration easing`, in one order. */
const animations = (...styles: CSSStyleDeclaration[]) =>
  styles
    .flatMap((style) => {
      const durations = list(style.animationDuration);
      const easings = list(style.animationTimingFunction);

      return list(style.animationName).map(
        (name, index) =>
          `${name} ${durations[index] ?? durations[0]} ${easings[index] ?? easings[0]}`,
      );
    })
    .sort();

describe('a loading switch', () => {
  it('draws the shape of Loader, with its animations, in place of the thumb', () => {
    const { container } = render(
      themed(
        <>
          <Switch aria-label="Feed" checked loading onCheckedChange={() => {}} />
          <Loader decorative />
        </>,
      ),
    );
    const shape = shapeOf(container);
    const loader = container.querySelector('[data-ui="progress-indicator"]')!;
    const of = (part: string) => getComputedStyle(loader.querySelector(`[data-part="${part}"]`)!);

    expect(shape.display).toBe('block');
    expect(shape.borderTopWidth).toBe('0px');
    expect(shape.borderInlineStartColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(animations(shape)).toEqual(animations(of('indicator'), of('track')));
    expect(shape.animationPlayState).toBe('running');
  });

  it.each(['sm', 'md', 'lg'] as const)('keeps every frame inside the track at %s', (size) => {
    const { container } = render(
      themed(<Switch aria-label="Feed" loading onCheckedChange={() => {}} size={size} />),
    );
    const thumb = thumbOf(container);
    const box = thumb.getBoundingClientRect();
    const track = container.querySelector('[data-part="track"]')!.getBoundingClientRect();
    const shape = shapeOf(container);

    expect(parseFloat(shape.width)).toBeCloseTo(box.width, 1);
    expect(parseFloat(shape.height)).toBeCloseTo(box.height, 1);

    const running = thumb.getAnimations({ subtree: true });
    const room = Math.min(box.top - track.top, box.left - track.left);
    for (let time = 0; time < 3200; time += 20) {
      for (const animation of running) {
        animation.pause();
        animation.currentTime = time;
      }
      expect(reach(shape.clipPath) * box.width).toBeLessThanOrEqual(box.width / 2 + room);
    }
  });

  it('takes the ink of the thumb when checked and the pending ink when not', async () => {
    const { container, rerender } = render(
      themed(<Switch aria-label="Feed" checked loading onCheckedChange={() => {}} />),
    );
    const thumb = getComputedStyle(thumbOf(container));
    await wait(150);

    expect(shapeOf(container).backgroundColor).toBe('rgb(250, 250, 250)');
    expect(thumb.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(thumb.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(thumb.boxShadow).toBe('none');

    rerender(
      themed(<Switch aria-label="Feed" checked={false} loading onCheckedChange={() => {}} />),
    );
    await wait(150);

    expect(shapeOf(container).backgroundColor).toBe('rgb(80, 80, 80)');
  });

  it('gives the disc up in a disabled switch as well', async () => {
    const { container } = render(
      themed(<Switch aria-label="Feed" checked disabled loading onCheckedChange={() => {}} />),
    );
    await wait(150);

    expect(getComputedStyle(thumbOf(container)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('returns to the disc over one transition, from the form it reached', async () => {
    const node = (loading: boolean) =>
      themed(<Switch aria-label="Feed" checked loading={loading} onCheckedChange={() => {}} />);
    const { container, rerender } = render(node(true));
    await wait(400);
    const shape = shapeOf(container);
    expect(shape.opacity).toBe('1');

    rerender(node(false));
    await frame();

    expect(shape.display).toBe('block');
    expect(shape.animationPlayState).toBe('paused, paused, paused');
    const form = shape.clipPath;
    await frame();
    expect(shape.clipPath).toBe(form);

    await wait(200);
    expect(shape.display).toBe('none');

    /* The next wait starts at the circle again. */
    rerender(node(true));
    expect(thumbOf(container).getAnimations({ subtree: true })[0]!.currentTime).toBeLessThan(50);
  });

  it('keeps the boxes of the root, the track and the label through the wait', async () => {
    const node = (loading: boolean) =>
      themed(
        <Switch checked loading={loading} onCheckedChange={() => {}}>
          Order sync
        </Switch>,
      );
    const { container, rerender } = render(node(false));
    const boxes = () =>
      ['[data-ui="switch"]', '[data-part="track"]', '[data-part="label"]'].map((selector) =>
        JSON.stringify(container.querySelector(selector)!.getBoundingClientRect()),
      );
    const before = boxes();

    rerender(node(true));
    expect(boxes()).toEqual(before);

    rerender(node(false));
    expect(boxes()).toEqual(before);
  });

  it('moves nothing under reduced motion, and rests at a form that is not the circle', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    try {
      const { container } = render(
        themed(<Switch aria-label="Feed" checked loading onCheckedChange={() => {}} />),
      );
      const shape = shapeOf(container);

      expect(shape.animationName).toBe('none');
      expect(shape.display).toBe('block');
      expect(hollow(shape.clipPath)).toBeLessThan(0.4);
    } finally {
      await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    }
  });
});

describe('the delay of a loading switch', () => {
  it('keeps the mark until it passes, and refuses a press from the first instant', async () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      themed(
        <Switch
          aria-label="Feed"
          checked
          loading
          loadingDelay={300}
          onCheckedChange={onCheckedChange}
        />,
      ),
    );
    const control = container.querySelector<HTMLInputElement>('input')!;
    const mark = container.querySelector('[data-part="thumb"] > [data-ui="icon"]')!;
    await wait(100);

    expect(getComputedStyle(mark).opacity).toBe('1');
    expect(shapeOf(container).display).toBe('none');
    expect(getComputedStyle(control).cursor).not.toBe('progress');
    expect(control.getAttribute('aria-busy')).toBe('true');
    control.click();
    expect(onCheckedChange).not.toHaveBeenCalled();

    await wait(300);
    expect(shapeOf(container).display).toBe('block');
    expect(getComputedStyle(control).cursor).toBe('progress');
  });

  it('draws nothing for a write that ends before it', async () => {
    const node = (loading: boolean) =>
      themed(
        <SwitchDefaultsProvider loadingDelay={300}>
          <Switch aria-label="Feed" checked loading={loading} onCheckedChange={() => {}} />
        </SwitchDefaultsProvider>,
      );
    const { container, rerender } = render(node(true));
    await wait(100);
    rerender(node(false));
    await wait(300);

    expect(shapeOf(container).display).toBe('none');
    expect(container.querySelector('[data-loading]')).toBeNull();
  });
});

/** The distances of the polygon's points from its center, as shares of the box. */
function radii(clipPath: string) {
  const points = clipPath.slice(clipPath.indexOf('(') + 1, clipPath.lastIndexOf(')')).split(',');

  return points.map((point) => {
    const [x, y] = point.trim().split(/\s+/).map(parseFloat) as [number, number];

    return Math.hypot(x - 50, y - 50) / 100;
  });
}

const reach = (clipPath: string) => Math.max(...radii(clipPath));

const hollow = (clipPath: string) => Math.min(...radii(clipPath));
