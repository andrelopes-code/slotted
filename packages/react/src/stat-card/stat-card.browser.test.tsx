import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { StatCard } from './stat-card';
import { StatCardDelta } from './stat-card-delta';
import { StatCardFigure, StatCardHeader, StatCardLabel } from './stat-card-parts';
import { StatCardValue } from './stat-card-value';
import type { StatCardProps } from './stat-card.types';

// The tone roles, stated on a wrapper so the expected colours do not depend on a theme.
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
