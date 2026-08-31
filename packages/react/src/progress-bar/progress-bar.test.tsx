import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProgressBar } from './index';

describe('ProgressBar', () => {
  it('reports its position against the maximum', () => {
    render(<ProgressBar aria-label="Upload" value={40} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('measures against the maximum it was given', () => {
    render(<ProgressBar aria-label="Files" max={7} value={3} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '7');
    expect(bar.querySelector('[data-part="indicator"]')).toHaveStyle({ inlineSize: '42.8571%' });
  });

  it('says nothing about a position it does not know', () => {
    render(<ProgressBar aria-label="Working" />);

    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate', '');
  });

  it('holds the indicator inside the track when the value overshoots', () => {
    render(<ProgressBar aria-label="Upload" value={140} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('[data-part="indicator"]')).toHaveStyle({ inlineSize: '100%' });
  });

  it('treats a negative value as no progress rather than as a reversed bar', () => {
    render(<ProgressBar aria-label="Upload" value={-20} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('reports words when a percentage would say less', () => {
    render(<ProgressBar aria-label="Files" max={7} value={3} valueText="3 of 7 files" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 7 files');
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<ProgressBar value={40} />);

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('stays quiet when the consumer named it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<ProgressBar aria-labelledby="heading" value={40} />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<ProgressBar aria-label="Upload" className="app-progress" value={10} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveClass('slotted-progress-bar');
    expect(bar).toHaveClass('app-progress');
  });
});
