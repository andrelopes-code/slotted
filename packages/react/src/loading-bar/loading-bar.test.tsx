import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoadingBar } from './index';

describe('LoadingBar', () => {
  it('reports its position the way a progress bar does', () => {
    render(<LoadingBar aria-label="Loading page" value={40} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('is indeterminate with no value, which is the usual case for a page', () => {
    render(<LoadingBar aria-label="Loading page" />);

    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate', '');
  });

  it('sits in the flow unless it is told to take the viewport', () => {
    render(
      <>
        <LoadingBar aria-label="Inline" data-testid="inline" />
        <LoadingBar aria-label="Fixed" data-testid="fixed" placement="fixed" />
      </>,
    );

    expect(screen.getByTestId('inline')).toHaveAttribute('data-placement', 'inline');
    expect(screen.getByTestId('fixed')).toHaveAttribute('data-placement', 'fixed');
  });

  it('holds the indicator inside the track when the value overshoots', () => {
    render(<LoadingBar aria-label="Loading page" value={140} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('[data-part="indicator"]')).toHaveStyle({ inlineSize: '100%' });
  });

  it('reports words when a percentage would say less', () => {
    render(<LoadingBar aria-label="Loading" max={4} value={1} valueText="Step 1 of 4" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Step 1 of 4');
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<LoadingBar />);

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<LoadingBar aria-label="Loading" className="app-loading" data-testid="bar" />);

    const bar = screen.getByTestId('bar');
    expect(bar).toHaveClass('slotted-loading-bar');
    expect(bar).toHaveClass('app-loading');
  });
});
