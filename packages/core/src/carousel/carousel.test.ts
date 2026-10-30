import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canStep,
  carouselKeyIntent,
  carouselPages,
  createCarouselEngine,
  createCarouselRotation,
  indicatorDistance,
  intentPage,
  nearestPage,
  parseCssTime,
  rubberBand,
  slidesInView,
  springAt,
  springLaunch,
  stepPage,
} from './carousel';
import type { CarouselMetrics } from './carousel';

/** A row of equal slides with a gap, in a viewport of a given width. */
function row(
  count: number,
  size: number,
  gap: number,
  viewport: number,
  padding = 0,
): CarouselMetrics {
  const slides = Array.from({ length: count }, (_, index) => ({
    start: padding + index * (size + gap),
    size,
  }));
  const content = padding * 2 + count * size + (count - 1) * gap;
  return {
    viewport,
    paddingStart: padding,
    paddingEnd: padding,
    maxScroll: Math.max(0, content - viewport),
    slides,
  };
}

describe('carouselPages', () => {
  it('makes one page per slide when one slide fills the view', () => {
    const pages = carouselPages(row(5, 400, 16, 400));
    expect(pages.starts).toEqual([0, 1, 2, 3, 4]);
    expect(pages.positions).toEqual([0, 416, 832, 1248, 1664]);
  });

  it('pages by the slides wholly in view, and ends the last page flush', () => {
    /* Three cards of 120 with 16 between them fill 392; eight cards make three pages. */
    const pages = carouselPages(row(8, 120, 16, 392));
    expect(pages.starts).toEqual([0, 3, 6]);
    expect(pages.positions.at(-1)).toBe(row(8, 120, 16, 392).maxScroll);
    expect(pages.pageOfSlide).toEqual([0, 0, 0, 1, 1, 1, 2, 2]);
  });

  it('moves by a stated number of slides and still reaches the end', () => {
    const metrics = row(8, 120, 16, 392);
    const pages = carouselPages(metrics, { slidesPerMove: 2 });
    expect(pages.starts).toEqual([0, 2, 4, 6]);
    expect(pages.positions.at(-1)).toBe(metrics.maxScroll);
  });

  it('subtracts the scroll padding so a peeking neighbour stays in view', () => {
    const pages = carouselPages(row(4, 300, 16, 380, 40));
    expect(pages.positions[1]).toBe(316);
  });

  it('centres every slide and lets the end slides share a page', () => {
    const pages = carouselPages(row(5, 300, 16, 400), { align: 'center' });
    expect(pages.positions[0]).toBe(0);
    expect(pages.positions[1]).toBe(316 + 150 - 200);
    expect(pages.pageOfSlide).toEqual([0, 1, 2, 3, 4]);
  });

  it('has no pages without slides', () => {
    expect(carouselPages(row(0, 100, 0, 400))).toEqual({
      positions: [],
      starts: [],
      pageOfSlide: [],
    });
  });
});

describe('page arithmetic', () => {
  it('finds the nearest page', () => {
    expect(nearestPage([0, 416, 832], 300)).toBe(1);
    expect(nearestPage([], 0)).toBe(-1);
  });

  it('stops at the ends without a loop and wraps with one', () => {
    expect(stepPage(4, 1, 5, false)).toBe(4);
    expect(stepPage(4, 1, 5, true)).toBe(0);
    expect(stepPage(0, -1, 5, true)).toBe(4);
    expect(stepPage(0, 1, 0, true)).toBe(-1);
  });

  it('says whether a step has anywhere to go', () => {
    expect(canStep(0, -1, 5, false)).toBe(false);
    expect(canStep(0, -1, 5, true)).toBe(true);
    expect(canStep(0, 1, 1, true)).toBe(false);
  });

  it('reads the keys of the axis and mirrors them', () => {
    expect(carouselKeyIntent('ArrowRight', 'horizontal', 'ltr')).toBe('next');
    expect(carouselKeyIntent('ArrowRight', 'horizontal', 'rtl')).toBe('previous');
    expect(carouselKeyIntent('ArrowDown', 'horizontal', 'ltr')).toBeNull();
    expect(carouselKeyIntent('ArrowDown', 'vertical', 'ltr')).toBe('next');
    expect(carouselKeyIntent('Home', 'horizontal', 'ltr')).toBe('first');
    expect(carouselKeyIntent('PageDown', 'vertical', 'rtl')).toBe('next');
    expect(intentPage('last', 1, 5, false)).toBe(4);
    expect(intentPage('previous', 0, 5, true)).toBe(4);
  });

  it('counts a slide in view from half of it', () => {
    const metrics = row(3, 200, 0, 300);
    expect(slidesInView(metrics, 0)).toEqual([true, true, false]);
    expect(slidesInView(metrics, 300)).toEqual([false, true, true]);
  });

  it('keeps every dot whole below eight pages and windows them above', () => {
    expect(indicatorDistance(0, 3, 7)).toBeNull();
    expect(indicatorDistance(6, 6, 14)).toBe('0');
    expect(indicatorDistance(8, 6, 14)).toBe('2');
    expect(indicatorDistance(12, 6, 14)).toBe('far');
    /* At the start the window still holds five whole dots. */
    expect(indicatorDistance(4, 0, 14)).toBe('2');
  });
});

describe('motion parsing', () => {
  it('reads a CSS time', () => {
    expect(parseCssTime('320ms')).toBe(320);
    expect(parseCssTime(' 0.2s ')).toBe(200);
    expect(parseCssTime('')).toBe(0);
  });
});

describe('the spring', () => {
  const omega = 8 / 320;

  it('starts where it is and at the speed it is given', () => {
    const start = springAt(0, 830, 2, omega, 0);
    expect(start.position).toBe(0);
    expect(start.velocity).toBeCloseTo(2, 6);
  });

  it('leaves under half a per cent of the way at the theme’s long duration and never passes the target', () => {
    let previous = 0;
    for (let t = 0; t <= 600; t += 8) {
      const { position } = springAt(0, 830, 0, omega, t);
      expect(position).toBeGreaterThanOrEqual(previous - 1e-9);
      expect(position).toBeLessThanOrEqual(830 + 1e-9);
      previous = position;
    }
    expect(830 - springAt(0, 830, 0, omega, 320).position).toBeLessThan(4.15);
  });

  it('moves at once rather than easing in', () => {
    expect(springAt(0, 830, 0, omega, 16).position).toBeGreaterThan(40);
  });

  it('holds a flick to the speed that lands without passing', () => {
    expect(springLaunch(0, 100, 50, omega)).toBeCloseTo(omega * 100, 9);
    expect(springLaunch(0, 100, 1, omega)).toBe(1);
    expect(springLaunch(0, 100, -3, omega)).toBe(-3);
  });

  it('pulls less the further an edge is dragged, and never past the viewport', () => {
    const near = rubberBand(40, 400);
    const far = rubberBand(400, 400);
    expect(near).toBeLessThan(40);
    expect(far / 400).toBeLessThan(near / 40);
    expect(rubberBand(1e6, 400)).toBeLessThan(400);
    expect(rubberBand(-40, 400)).toBeCloseTo(-near, 9);
  });
});

describe('createCarouselRotation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks once per delay while started', () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    const rotation = createCarouselRotation({ delay: () => 1000, onTick });
    rotation.start();
    vi.advanceTimersByTime(2500);
    expect(onTick).toHaveBeenCalledTimes(2);
    rotation.stop();
    vi.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(2);
    rotation.destroy();
  });

  it('keeps the time that was left across a hold', () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    const onHeldChange = vi.fn();
    const rotation = createCarouselRotation({ delay: () => 1000, onTick, onHeldChange });
    rotation.start();
    vi.advanceTimersByTime(600);
    rotation.hold('hover');
    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
    expect(onHeldChange).toHaveBeenLastCalledWith(true);
    rotation.release('hover');
    vi.advanceTimersByTime(399);
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledOnce();
    expect(onHeldChange).toHaveBeenLastCalledWith(false);
    rotation.destroy();
  });

  it('gives a full delay after a restart', () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    const rotation = createCarouselRotation({ delay: () => 1000, onTick });
    rotation.start();
    vi.advanceTimersByTime(900);
    rotation.restart();
    vi.advanceTimersByTime(900);
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onTick).toHaveBeenCalledOnce();
    rotation.destroy();
  });
});

describe('createCarouselEngine', () => {
  function viewportWith(count: number): HTMLElement {
    const viewport = document.createElement('div');
    for (let index = 0; index < count; index += 1) {
      const slide = document.createElement('div');
      slide.setAttribute('data-part', 'slide');
      viewport.append(slide);
    }
    document.body.append(viewport);
    return viewport;
  }

  const base = {
    orientation: () => 'horizontal' as const,
    align: () => 'start' as const,
    slidesPerMove: () => 'page' as const,
    draggable: () => true,
    page: () => 0,
  };

  it('names every slide it was not given a name for, and leaves the consumer name alone', () => {
    const viewport = viewportWith(3);
    viewport.children[1]?.setAttribute('aria-label', 'Jarro Mel');
    const engine = createCarouselEngine(viewport, {
      ...base,
      transition: () => 'slide',
      slideLabel: (index, count) => `${index + 1} de ${count}`,
    });
    expect(viewport.children[0]?.getAttribute('aria-label')).toBe('1 de 3');
    expect(viewport.children[1]?.getAttribute('aria-label')).toBe('Jarro Mel');
    expect(viewport.children[2]?.id).not.toBe('');
    engine.destroy();
    viewport.remove();
  });

  it('shows only the current slide in fade, and hides the others from assistive technology', () => {
    const viewport = viewportWith(3);
    const engine = createCarouselEngine(viewport, { ...base, transition: () => 'fade' });
    engine.setCurrent(1);
    expect(viewport.children[1]?.hasAttribute('data-current')).toBe(true);
    expect(viewport.children[1]?.hasAttribute('inert')).toBe(false);
    expect(viewport.children[0]?.hasAttribute('inert')).toBe(true);
    expect(engine.pages().starts).toEqual([0, 1, 2]);
    engine.destroy();
    viewport.remove();
  });

  it('reports a swipe between stacked slides along the reading direction', () => {
    const viewport = viewportWith(3);
    const onSwipe = vi.fn();
    const engine = createCarouselEngine(viewport, { ...base, transition: () => 'fade', onSwipe });
    const pointer = (type: string, x: number) => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: 10, button: 0 });
      Object.assign(event, { pointerId: 1, pointerType: 'touch' });
      viewport.dispatchEvent(event);
    };
    pointer('pointerdown', 200);
    pointer('pointerup', 120);
    expect(onSwipe).toHaveBeenCalledWith(1, expect.anything());
    engine.destroy();
    viewport.remove();
  });
});
