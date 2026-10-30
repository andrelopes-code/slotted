import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { describe, expect, it } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Sparkline, SparklineDefaultsProvider } from './index';

const root = () => document.querySelector('[data-ui="sparkline"]')!;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`);
const parts = (name: string) => document.querySelectorAll(`[data-part="${name}"]`);

describe('Sparkline', () => {
  it('is an image named by what it shows, with the drawing hidden', () => {
    render(<Sparkline data={[12, 14, 30]} label="Revenue" />);

    expect(root()).toHaveAttribute('role', 'img');
    expect(root()).toHaveAttribute('aria-label', 'Revenue: 30, up 18 since 12');
    expect(part('plot')).toHaveAttribute('aria-hidden', 'true');
    expect(root()).toHaveAttribute('data-type', 'line');
    expect(root()).toHaveAttribute('data-size', 'md');
    expect(root()).toHaveAttribute('data-curve', 'linear');
  });

  it('names neither a tone nor a series until told, so a container can decide', () => {
    render(<Sparkline data={[1, 2]} />);

    expect(root()).not.toHaveAttribute('data-tone');
    expect(root()).not.toHaveAttribute('data-series');
  });

  it('writes the tone and the series slot the consumer names', () => {
    render(<Sparkline data={[1, 2]} series={3} tone="danger" />);

    expect(root()).toHaveAttribute('data-tone', 'danger');
    expect(root()).toHaveAttribute('data-series', '3');
  });

  /**
   * Without layout the box measures nought, and nought is not a box: the
   * drawing stays on the nominal grid of its size step, which the contract
   * states, and the stylesheet stretches it to whatever box it lands in.
   */
  it('lays out on the nominal grid where nothing can measure it', () => {
    render(<Sparkline data={[0, 10]} size="sm" />);

    expect(part('plot')).toHaveAttribute('viewBox', '0 0 96 20');
    expect(part('plot')).toHaveAttribute('preserveAspectRatio', 'none');
  });

  it('draws a line, a disc on the last point with its ring under it, and no bars', () => {
    render(<Sparkline data={[0, 10, 5]} />);

    expect(part('line')).toHaveAttribute('d', expect.stringMatching(/^M4 28L48 4L92 16$/));
    expect(part('ring')?.getAttribute('d')).toBe(part('marker')?.getAttribute('d'));
    expect(part('marker')).toHaveAttribute('d', 'M92 16h0.001');
    expect(part('area')).toBeNull();
    expect(parts('bar')).toHaveLength(0);
  });

  it('draws bars from a zero baseline and marks the last one as current', () => {
    render(<Sparkline data={[3, null, 5]} type="bar" />);

    const bars = parts('bar');
    expect(bars).toHaveLength(2);
    expect(bars[1]).toHaveAttribute('data-current', '');
    expect(bars[0]).not.toHaveAttribute('data-current');
    expect(part('marker')).toBeNull();
  });

  it('washes the area and dashes a reference when asked', () => {
    render(<Sparkline area data={[1, 2, 3]} reference={2} />);

    expect(part('area')).not.toBeNull();
    expect(part('reference')).toHaveAttribute('y1', part('reference')!.getAttribute('y2')!);
  });

  it('leaves the marker off when told', () => {
    render(<Sparkline data={[1, 2]} marker={false} />);

    expect(part('marker')).toBeNull();
    expect(part('ring')).toBeNull();
  });

  it('says there is nothing when the series has no real point', () => {
    render(<Sparkline data={[null, Number.NaN]} label="Errors" />);

    expect(root()).toHaveAttribute('aria-label', 'Errors: no data');
    expect(part('line')).toBeNull();
    expect(part('marker')).toBeNull();
  });

  it('reads numbers in the locale and format it is given', () => {
    render(
      <Sparkline
        data={[1000, 1250.5]}
        formatOptions={{ style: 'currency', currency: 'BRL' }}
        locale="pt-BR"
      />,
    );

    expect(root().getAttribute('aria-label')).toMatch(
      /^R\$\s1\.250,50, up R\$\s250,50 since R\$\s1\.000,00$/,
    );
  });

  it('speaks the language in force, and writes its numbers in that locale', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Sparkline data={[1000, 1250.5]} label="Receita" />
      </SlottedProvider>,
    );

    expect(root()).toHaveAttribute('aria-label', 'Receita: 1.250,5, alta de 250,5 desde 1.000');
  });

  it('lets the consumer replace the whole description', () => {
    render(<Sparkline data={[1, 2]} description="Twelve weeks of revenue, rising" />);

    expect(root()).toHaveAttribute('aria-label', 'Twelve weeks of revenue, rising');
  });

  it('takes its defaults from the provider, and an explicit prop wins', () => {
    render(
      <SparklineDefaultsProvider area curve="monotone">
        <Sparkline data={[1, 3]} messages={{ up: '{last} (+{change})' }} />
        <Sparkline curve="linear" data={[1, 3]} />
      </SparklineDefaultsProvider>,
    );

    const [first, second] = document.querySelectorAll('[data-ui="sparkline"]');
    expect(first).toHaveAttribute('data-curve', 'monotone');
    expect(first).toHaveAttribute('aria-label', '3 (+2)');
    expect(first!.querySelector('[data-part="area"]')).not.toBeNull();
    expect(second).toHaveAttribute('data-curve', 'linear');
  });

  it('passes native props through and keeps the consumer ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Sparkline className="app-spark" data={[1]} data-testid="spark" ref={ref} />);

    expect(root()).toHaveClass('app-spark');
    expect(root()).toHaveAttribute('data-testid', 'spark');
    expect(ref.current).toBe(root());
  });

  it('lets the consumer render the root as another element', () => {
    render(
      <Sparkline
        data={[1, 2]}
        render={(props) => <div {...(props as ComponentPropsWithRef<'div'>)} />}
      />,
    );

    expect(root().tagName).toBe('DIV');
    expect(root()).toHaveAttribute('role', 'img');
  });
});
