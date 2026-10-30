import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Sparkline, SparklineDefaultsProvider } from '../sparkline';
import {
  StatCard,
  StatCardAction,
  StatCardComparison,
  StatCardDefaultsProvider,
  StatCardDelta,
  StatCardFigure,
  StatCardHeader,
  StatCardLabel,
  StatCardMessage,
  StatCardPeriod,
  StatCardStatus,
  StatCardTrend,
  StatCardUnit,
  StatCardValue,
  toneOf,
  trendOf,
} from './index';

const root = () => document.querySelector('[data-ui="stat-card"]')!;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`);

function Revenue(props: Partial<Parameters<typeof StatCard>[0]>) {
  return (
    <StatCard delta={0.124} {...props}>
      <StatCardHeader>
        <StatCardLabel>Monthly recurring revenue</StatCardLabel>
        <StatCardStatus>Live</StatCardStatus>
        <StatCardAction>
          <a href="#details">Details</a>
        </StatCardAction>
      </StatCardHeader>
      <StatCardFigure>
        <StatCardValue formatOptions={{ notation: 'compact' }} value={48200}>
          48.2<StatCardUnit>K</StatCardUnit>
        </StatCardValue>
        <StatCardDelta />
        <StatCardComparison>
          from $42.9K <StatCardPeriod>vs. previous month</StatCardPeriod>
        </StatCardComparison>
      </StatCardFigure>
      <StatCardTrend>
        <Sparkline data={[12, 14, 30]} />
      </StatCardTrend>
      <StatCardMessage>No data for this period yet.</StatCardMessage>
    </StatCard>
  );
}

describe('StatCard', () => {
  it('is a group named by its label, with its body one element in', () => {
    render(<Revenue />);

    expect(root()).toHaveAttribute('role', 'group');
    expect(root()).toHaveAccessibleName('Monthly recurring revenue');
    expect(root().firstElementChild).toHaveAttribute('data-part', 'body');
    expect(root()).toHaveAttribute('data-size', 'md');
    expect(root()).toHaveAttribute('data-fill', 'outline');
    expect(root()).toHaveAttribute('data-layout', 'inline');
    expect(root()).toHaveAttribute('data-status', 'ready');
    expect(root()).toHaveAttribute('data-good-when', 'up');
  });

  it('renders every part where the consumer put it', () => {
    render(<Revenue />);

    for (const name of [
      'header',
      'label',
      'status',
      'action',
      'figure',
      'value',
      'unit',
      'delta',
      'indicator',
      'comparison',
      'period',
      'trend',
    ]) {
      expect(part(name), name).not.toBeNull();
    }
    expect(part('message')).toBeNull();
  });

  /**
   * The reason the family exists: the color of a change comes from what the
   * metric means. A rise is good when up is good and bad when down is; the
   * card writes the tone it derived so its trend can read it, and the delta
   * wears the same one.
   */
  it('derives the tone from goodWhen and the sign, never from the sign alone', () => {
    const { rerender } = render(<Revenue delta={0.124} goodWhen="up" />);
    expect(root()).toHaveAttribute('data-tone', 'success');
    expect(part('delta')).toHaveAttribute('data-tone', 'success');
    expect(part('delta')).toHaveAttribute('data-trend', 'up');

    rerender(<Revenue delta={0.124} goodWhen="down" />);
    expect(root()).toHaveAttribute('data-tone', 'danger');
    expect(part('delta')).toHaveAttribute('data-trend', 'up');

    rerender(<Revenue delta={-0.03} goodWhen="down" />);
    expect(root()).toHaveAttribute('data-tone', 'success');
    expect(part('delta')).toHaveAttribute('data-trend', 'down');

    rerender(<Revenue delta={0} />);
    expect(root()).toHaveAttribute('data-tone', 'neutral');
    expect(part('delta')).toHaveAttribute('data-trend', 'flat');

    rerender(<Revenue delta={0.5} goodWhen="none" />);
    expect(root()).toHaveAttribute('data-tone', 'neutral');
  });

  /** One glyph for a rise and a fall, which the sheet turns over, and `minus` for none. */
  it('draws trending-up for a rise or a fall and minus for no change', () => {
    const glyph = () =>
      part('indicator')!
        .querySelector('[data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph');
    const { rerender } = render(<Revenue delta={0.124} />);
    expect(glyph()).toBe('trending-up');

    rerender(<Revenue delta={-0.03} />);
    expect(glyph()).toBe('trending-up');

    rerender(<Revenue delta={0} />);
    expect(glyph()).toBe('minus');
  });

  it('lets an explicit tone win, on the root and on the delta', () => {
    render(
      <StatCard delta={0.1} tone="warning">
        <StatCardDelta tone="accent" />
      </StatCard>,
    );

    expect(root()).toHaveAttribute('data-tone', 'warning');
    expect(part('delta')).toHaveAttribute('data-tone', 'accent');
  });

  it('carries no tone until a delta gives it one', () => {
    render(<StatCard />);

    expect(root()).not.toHaveAttribute('data-tone');
  });

  it('reads the delta as a signed percentage, with the direction said before it', () => {
    render(<Revenue delta={0.124} />);

    expect(part('delta')).toHaveTextContent('up +12.4%');
    expect(part('indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reads a decimal delta as it is, and a second delta with its own value', () => {
    render(
      <StatCard delta={0.1} locale="en-US">
        <StatCardDelta format="decimal" value={-32} />
        <StatCardDelta value={0.05} />
      </StatCard>,
    );

    const [first, second] = document.querySelectorAll('[data-part="delta"]');
    expect(first).toHaveTextContent('down -32');
    expect(second).toHaveTextContent('up +5%');
  });

  it.each([
    ['pt-BR', 'BRL', ['R$', ',88']],
    ['de-DE', 'EUR', [',88', '€']],
  ])(
    'draws the symbol and the decimals of a %s currency as units under emphasis whole',
    (locale, currency, units) => {
      const options = { style: 'currency', currency } as const;
      render(
        <StatCard locale={locale}>
          <StatCardFigure>
            <StatCardValue emphasis="whole" formatOptions={options} value={1999.88} />
          </StatCardFigure>
        </StatCard>,
      );
      const value = part('value')!;
      expect(
        [...value.querySelectorAll('[data-part-unit]')].map((unit) => unit.textContent),
      ).toEqual(units);
      const whole = [...value.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
      expect(whole.map((node) => node.textContent).join('')).toContain('1.999');
      expect(value.textContent).toBe(new Intl.NumberFormat(locale, options).format(1999.88));
    },
  );

  it('formats a numeric value with the card locale, and children win', () => {
    render(
      <StatCard locale="de-DE">
        <StatCardValue formatOptions={{ notation: 'compact' }} value={12900} />
      </StatCard>,
    );
    expect(part('value')).toHaveTextContent('12.900');

    render(
      <StatCard>
        <StatCardValue value={1}>one</StatCardValue>
      </StatCard>,
    );
    expect(document.querySelectorAll('[data-part="value"]')[1]).toHaveTextContent('one');
  });

  it('keeps its place with a dash and a message when the value is missing or failed', () => {
    const { rerender } = render(<Revenue status="empty" />);

    expect(root()).toHaveAttribute('data-status', 'empty');
    expect(part('value')).toHaveTextContent('—');
    expect(part('delta')).toBeNull();
    expect(part('trend')).toBeNull();
    expect(part('comparison')).toBeNull();
    expect(part('message')).toHaveTextContent('No data for this period yet.');

    rerender(<Revenue status="error" />);
    expect(root()).toHaveAttribute('data-status', 'error');
    expect(part('message')).not.toBeNull();
  });

  /**
   * Loading preserves the layout: every text part stands in with a skeleton
   * of its own height, the trend with a block, and the previous value is not
   * shown as if it were current.
   */
  it('stands every part in with a placeholder while loading', () => {
    render(<Revenue loading />);

    expect(root()).toHaveAttribute('data-loading');
    expect(root()).toHaveAttribute('aria-busy', 'true');
    expect(part('value')!.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(part('value')).not.toHaveTextContent('48.2');
    expect(part('delta')!.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(part('comparison')!.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(part('trend')!.querySelector('[data-ui="skeleton"][data-shape="block"]')).not.toBeNull();
    expect(document.querySelector('[data-ui="sparkline"]')).toBeNull();
    expect(part('message')).toBeNull();
  });

  it('takes its defaults from the provider, and an explicit prop wins', () => {
    render(
      <StatCardDefaultsProvider fill="subtle" goodWhen="down" size="sm">
        <StatCard delta={0.2} messages={{ up: 'subiu' }}>
          <StatCardDelta />
        </StatCard>
        <StatCard delta={0.2} goodWhen="up" size="lg">
          <StatCardDelta />
        </StatCard>
      </StatCardDefaultsProvider>,
    );

    const [first, second] = document.querySelectorAll('[data-ui="stat-card"]');
    expect(first).toHaveAttribute('data-fill', 'subtle');
    expect(first).toHaveAttribute('data-size', 'sm');
    expect(first).toHaveAttribute('data-tone', 'danger');
    expect(first!.querySelector('[data-part="delta"]')).toHaveTextContent('subiu');
    expect(second).toHaveAttribute('data-size', 'lg');
    expect(second).toHaveAttribute('data-tone', 'success');
  });

  it('speaks the language in force, and writes its numbers in that locale', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <StatCard delta={-0.032}>
          <StatCardDelta />
        </StatCard>
        <StatCard status="empty">
          <StatCardValue value={1} />
        </StatCard>
      </SlottedProvider>,
    );

    expect(part('delta')).toHaveTextContent('queda -3,2%');
    expect(part('value')).toHaveTextContent('—');
  });

  it('takes a value it may not have yet, and draws an undefined one as an absent one', () => {
    const maybe = undefined as string | undefined;
    const delta = undefined as number | undefined;
    render(
      <>
        <StatCard status="empty">
          <StatCardValue value={maybe} />
          <StatCardDelta value={delta} />
        </StatCard>
        <StatCard status="empty">
          <StatCardValue />
          <StatCardDelta />
        </StatCard>
      </>,
    );

    const [withUndefined, absent] = document.querySelectorAll('[data-ui="stat-card"]');
    expect(withUndefined!.innerHTML).toBe(absent!.innerHTML);
    expect(withUndefined!.querySelector('[data-part="value"]')).toHaveTextContent('—');
  });

  it('keeps the consumer label id and then names the group by it', () => {
    render(
      <StatCard>
        <StatCardLabel id="mrr">MRR</StatCardLabel>
      </StatCard>,
    );

    expect(part('label')).toHaveAttribute('id', 'mrr');
  });

  it('passes native props through, keeps refs, and lets a part be rendered as another element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <StatCard className="app-kpi" data-testid="kpi" ref={ref}>
        <StatCardLabel render={(props) => <h3 {...(props as ComponentPropsWithRef<'h3'>)} />}>
          Orders
        </StatCardLabel>
        <StatCardAction>
          <button type="button">Open</button>
        </StatCardAction>
      </StatCard>,
    );

    expect(root()).toHaveClass('app-kpi');
    expect(root()).toHaveAttribute('data-testid', 'kpi');
    expect(ref.current).toBe(root());
    expect(part('label')!.tagName).toBe('H3');
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('exposes the two derivations for a consumer formatting its own delta', () => {
    expect(trendOf(3)).toBe('up');
    expect(trendOf(-3)).toBe('down');
    expect(trendOf(0)).toBe('flat');
    expect(trendOf(undefined)).toBe('flat');
    expect(toneOf('down', 'down')).toBe('success');
    expect(toneOf('down', 'up')).toBe('danger');
    expect(toneOf('up', 'none')).toBe('neutral');
  });
});

describe('StatCardTrend', () => {
  const card = (sparkline: ReactNode) => (
    <StatCard delta={0.1}>
      <StatCardFigure>
        <StatCardValue value={12} />
      </StatCardFigure>
      <StatCardTrend>{sparkline}</StatCardTrend>
    </StatCard>
  );
  const line = () => document.querySelector('[data-ui="sparkline"]')!;

  it('smooths and washes a line unless the application or the sparkline says otherwise', () => {
    const { rerender } = render(card(<Sparkline data={[1, 3, 2]} label="Orders" />));
    expect(line()).toHaveAttribute('data-curve', 'monotone');
    expect(line().querySelector('[data-part="area"]')).not.toBeNull();

    rerender(card(<Sparkline area={false} curve="linear" data={[1, 3, 2]} label="Orders" />));
    expect(line()).toHaveAttribute('data-curve', 'linear');
    expect(line().querySelector('[data-part="area"]')).toBeNull();

    rerender(
      <SparklineDefaultsProvider area={false} curve="linear">
        {card(<Sparkline data={[1, 3, 2]} label="Orders" />)}
      </SparklineDefaultsProvider>,
    );
    expect(line()).toHaveAttribute('data-curve', 'linear');
    expect(line().querySelector('[data-part="area"]')).toBeNull();
  });
});
