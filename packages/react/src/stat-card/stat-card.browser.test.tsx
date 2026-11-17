import { render, renderHook } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { StatCard } from './stat-card';
import { StatCardDelta } from './stat-card-delta';
import { StatCardFigure, StatCardHeader, StatCardLabel } from './stat-card-parts';
import { StatCardValue } from './stat-card-value';
import type { StatCardProps } from './stat-card.types';
import { useCountTransition } from './use-count-transition';

// The tone roles, stated on a wrapper so the expected colors do not depend on a theme.
const TONES = {
  '--slotted-tone-danger-text': 'rgb(200, 0, 0)',
  '--slotted-tone-danger-border': 'rgb(0, 0, 200)',
} as CSSProperties;

describe('a stat card with attention', () => {
  it('paints the value and the edge in the attention tone, and keeps the delta its own', () => {
    const { container } = renderCard({ attention: 'danger' });
    const root = container.querySelector<HTMLElement>('[data-ui="stat-card"]')!;
    const value = container.querySelector<HTMLElement>('[data-part="value"]')!;
    const delta = container.querySelector<HTMLElement>('[data-part="delta"]')!;

    expect(root.getAttribute('data-attention')).toBe('danger');
    expect(delta.getAttribute('data-tone')).toBe('success');
    expect(getComputedStyle(value).color).toBe('rgb(200, 0, 0)');
    expect(getComputedStyle(root, '::before').borderTopColor).toBe('rgb(0, 0, 200)');
  });

  it('paints neither without attention', () => {
    const { container } = renderCard({});
    const root = container.querySelector<HTMLElement>('[data-ui="stat-card"]')!;
    const value = container.querySelector<HTMLElement>('[data-part="value"]')!;

    expect(root.getAttribute('data-attention')).toBeNull();
    expect(getComputedStyle(value).color).not.toBe('rgb(200, 0, 0)');
    expect(getComputedStyle(root, '::before').borderTopColor).not.toBe('rgb(0, 0, 200)');
  });

  it('applies to a ready value only', () => {
    const { container } = renderCard({ attention: 'danger', loading: true });
    const root = container.querySelector<HTMLElement>('[data-ui="stat-card"]')!;

    expect(root.getAttribute('data-attention')).toBeNull();
  });
});

function renderCard(props: Partial<StatCardProps>) {
  return render(
    <div style={TONES}>
      <StatCard delta={0.08} goodWhen="up" {...props}>
        <StatCardHeader>
          <StatCardLabel>Uptime</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue value={0.91} />
          <StatCardDelta />
        </StatCardFigure>
      </StatCard>
    </div>,
  );
}

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The loading card keeps the boxes of the loaded card. The value's bar is one
 * cap tall, as every text placeholder is, and stands at the middle of the
 * value's line, where the figure's capitals stand, not at its top.
 */
describe('a loading stat card', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'centers the value placeholder in the line the value takes at size %s',
    (size) => {
      const loaded = boxes(size, false);
      const loading = boxes(size, true);
      const bar = loading.container
        .querySelector('[data-part="value"] [data-ui="skeleton"]')!
        .getBoundingClientRect();

      expect(loading.value.height).toBeCloseTo(loaded.value.height, 0);
      expect(loading.value.top - loading.label.bottom).toBeCloseTo(
        loaded.value.top - loaded.label.bottom,
        0,
      );
      expect(bar.top + bar.height / 2).toBeCloseTo(loading.value.top + loading.value.height / 2, 0);
      expect(bar.top - loading.label.bottom).toBeGreaterThan(
        loading.value.top - loading.label.bottom,
      );
    },
  );
});

function boxes(size: 'sm' | 'md' | 'lg', loading: boolean) {
  const { container } = render(
    <StatCard layout="stacked" loading={loading} size={size}>
      <StatCardHeader>
        <StatCardLabel>Balance</StatCardLabel>
      </StatCardHeader>
      <StatCardFigure>
        <StatCardValue value="1,234.56" />
      </StatCardFigure>
    </StatCard>,
  );

  return {
    container,
    label: container.querySelector('[data-part="label"]')!.getBoundingClientRect(),
    value: container.querySelector('[data-part="value"]')!.getBoundingClientRect(),
  };
}

/* A changed figure moves from the number it showed, and a reader hears the final one. */
describe('a stat card value with transition count', () => {
  const timed = {
    '--slotted-duration-long': '320ms',
    '--slotted-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  } as CSSProperties;

  function card(value: number, style: CSSProperties = timed) {
    return (
      <StatCard aria-label="Revenue" style={style}>
        <StatCardFigure>
          <StatCardValue transition="count" value={value} />
        </StatCardFigure>
      </StatCard>
    );
  }

  const valueNode = () => document.querySelector<HTMLElement>('[data-part="value"]')!;
  const shown = () => Number(valueNode().querySelector('[aria-hidden="true"]')?.textContent ?? NaN);

  it('draws a number between the two during the move, and the final text after it', async () => {
    const { rerender } = render(card(100));
    expect(valueNode().textContent).toBe('100');

    rerender(card(200));
    let between = false;
    for (let index = 0; index < 60 && valueNode().textContent !== '200'; index += 1) {
      await frame();
      const number = shown();
      if (number > 100 && number < 200) between = true;
    }

    expect(between).toBe(true);
    expect(valueNode().textContent).toBe('200');
  });

  it('says the final number throughout the move', async () => {
    const { rerender } = render(card(100));

    rerender(card(200));
    await frame();
    await frame();

    const said = valueNode().querySelector('[data-ui="visually-hidden"]');
    expect(said?.textContent).toBe('200');
    expect(valueNode().querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('moves in one step when the long duration is 1ms', async () => {
    const quick = { '--slotted-duration-long': '1ms' } as CSSProperties;
    const { rerender } = render(card(100, quick));

    rerender(card(200, quick));
    await frame();

    expect(valueNode().textContent).toBe('200');
  });
});

describe('useCountTransition', () => {
  it('returns the value on the first render, and reaches a new one after a change', async () => {
    const root = document.documentElement;
    root.style.setProperty('--slotted-duration-long', '320ms');
    const { result, rerender } = renderHook(({ value }) => useCountTransition(value), {
      initialProps: { value: 100 },
    });
    expect(result.current).toBe(100);

    rerender({ value: 200 });
    let between = false;
    for (let index = 0; index < 60 && result.current !== 200; index += 1) {
      await frame();
      if (result.current > 100 && result.current < 200) between = true;
    }

    expect(between).toBe(true);
    expect(result.current).toBe(200);
    root.style.removeProperty('--slotted-duration-long');
  });
});
