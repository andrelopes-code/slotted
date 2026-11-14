import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Meter } from './meter';
import { MeterDefaultsProvider } from './meter-defaults';

describe('Meter', () => {
  it('is a meter with its value and range, and never a progressbar', () => {
    render(<Meter aria-label="Share" value={41} />);
    const meter = screen.getByRole('meter', { name: 'Share' });

    expect(meter).toHaveAttribute('aria-valuenow', '41');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '41%');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(meter.style.getPropertyValue('--slotted-meter-ratio')).toBe('0.41');
  });

  it('carries no role and is hidden under decorative', () => {
    const { container } = render(<Meter decorative max={10000} value={4380} />);
    const root = container.querySelector('[data-ui="meter"]')!;

    expect(screen.queryByRole('meter')).toBeNull();
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('aria-valuenow');
  });

  it('takes its tone from the region the value falls in, unless a tone is stated', () => {
    const { rerender } = render(
      <Meter aria-label="Disk" high={85} low={60} optimum={0} value={95} />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'danger');

    rerender(<Meter aria-label="Disk" high={85} low={60} optimum={0} tone="info" value={95} />);

    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'info');
  });

  it('writes the share in the language in force and with the application’s defaults', () => {
    render(
      <SlottedProvider locale="pt-BR">
        <MeterDefaultsProvider
          formatOptions={{ style: 'percent', minimumFractionDigits: 1 }}
          size="sm"
        >
          <Meter aria-label="Renda fixa" max={10000} value={4380} />
        </MeterDefaultsProvider>
      </SlottedProvider>,
    );
    const meter = screen.getByRole('meter');

    expect(meter).toHaveAttribute('aria-valuetext', '43,8%');
    expect(meter).toHaveAttribute('data-size', 'sm');
  });

  it('keeps the consumer’s valueText and style', () => {
    render(
      <Meter aria-label="Used" style={{ color: 'red' }} value={3} max={5} valueText="3 of 5 GB" />,
    );
    const meter = screen.getByRole('meter');

    expect(meter).toHaveAttribute('aria-valuetext', '3 of 5 GB');
    expect(meter.style.color).toBe('red');
  });
});
