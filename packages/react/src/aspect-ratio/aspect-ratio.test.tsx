import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AspectRatio, resolveAspectRatio } from './index';

const frame = () => screen.getByTestId('frame');

describe('AspectRatio', () => {
  it('names the family and its one part so the stylesheet and the consumer can select it', () => {
    render(
      <AspectRatio data-testid="frame" ratio="video">
        <iframe title="player" />
      </AspectRatio>,
    );

    expect(frame()).toHaveAttribute('data-ui', 'aspect-ratio');
    expect(frame()).toHaveAttribute('data-part', 'root');
    expect(frame()).toHaveAttribute('data-ratio', 'video');
    expect(frame().style.getPropertyValue('--slotted-aspect-ratio')).toBe('');
    expect(screen.getByTitle('player')).toBeInTheDocument();
  });

  /** A pair is written as it was given; a number as its quotient. */
  it('writes a number the consumer stated on the instance, and says so in the DOM', () => {
    const { rerender } = render(<AspectRatio data-testid="frame" ratio={[21, 9]} />);

    expect(frame()).toHaveAttribute('data-ratio', 'custom');
    expect(frame().style.getPropertyValue('--slotted-aspect-ratio')).toBe('21 / 9');

    rerender(<AspectRatio data-testid="frame" ratio={1.85} />);

    expect(frame().style.getPropertyValue('--slotted-aspect-ratio')).toBe('1.85');
  });

  it('keeps the consumer’s own style beside the token', () => {
    render(<AspectRatio data-testid="frame" ratio={2} style={{ maxInlineSize: 320 }} />);

    expect(frame().style.maxInlineSize).toBe('320px');
    expect(frame().style.getPropertyValue('--slotted-aspect-ratio')).toBe('2');
  });

  it('renders into the element the consumer means', () => {
    render(
      <AspectRatio
        data-testid="frame"
        ratio="square"
        render={(props) => <figure {...props} aria-label="Map" />}
      />,
    );

    expect(frame().tagName).toBe('FIGURE');
    expect(frame()).toHaveAttribute('aria-label', 'Map');
    expect(frame()).toHaveAttribute('data-ratio', 'square');
  });

  it('resolves every name to itself and everything else to custom', () => {
    expect(resolveAspectRatio('landscape')).toEqual({ attribute: 'landscape', token: undefined });
    expect(resolveAspectRatio([4, 3])).toEqual({ attribute: 'custom', token: '4 / 3' });
    expect(resolveAspectRatio(0.5)).toEqual({ attribute: 'custom', token: '0.5' });
  });
});
