import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('uses icon defaults and an explicit accessible name', () => {
    render(<IconButton aria-label="Close">×</IconButton>);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-fill', 'ghost');
    expect(button).toHaveAttribute('data-part-root', 'icon');
  });

  it('forwards its native button ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton ref={ref} aria-label="Close">
        ×
      </IconButton>,
    );

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('throws a development error when runtime callers bypass the name type', () => {
    expect(() =>
      render(<IconButton {...({} as unknown as ComponentProps<typeof IconButton>)}>×</IconButton>),
    ).toThrow('IconButton requires aria-label or aria-labelledby');
  });

  it.each(['', '   '])('rejects an empty aria-label of %j', (ariaLabel) => {
    expect(() =>
      render(
        <IconButton
          {...({ 'aria-label': ariaLabel } as unknown as ComponentProps<typeof IconButton>)}
        >
          ×
        </IconButton>,
      ),
    ).toThrow('IconButton requires aria-label or aria-labelledby');
  });

  it.each(['', '   '])('rejects an empty aria-labelledby of %j', (ariaLabelledBy) => {
    expect(() =>
      render(
        <IconButton
          {...({ 'aria-labelledby': ariaLabelledBy } as unknown as ComponentProps<
            typeof IconButton
          >)}
        >
          ×
        </IconButton>,
      ),
    ).toThrow('IconButton requires aria-label or aria-labelledby');
  });

  it('accepts a meaningful aria-labelledby reference', () => {
    render(
      <>
        <span id="close-label">Close dialog</span>
        <IconButton aria-labelledby="close-label">×</IconButton>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('blocks activation while loading without removing focus', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Refresh" loading onClick={onClick}>
        ↻
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Refresh' });
    button.focus();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('blocks capture and bubble handlers while loading', () => {
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    render(
      <IconButton aria-label="Refresh" loading onClick={onClick} onClickCapture={onClickCapture}>
        ↻
      </IconButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(onClickCapture).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each<true | 'true'>([true, 'true'])(
    'blocks capture and bubble handlers for aria-disabled=%s',
    (ariaDisabled) => {
      const onClick = vi.fn();
      const onClickCapture = vi.fn();
      render(
        <IconButton
          aria-label="Archive"
          aria-disabled={ariaDisabled}
          onClick={onClick}
          onClickCapture={onClickCapture}
        >
          A
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'Archive' });
      fireEvent.click(button);

      expect(onClickCapture).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
      expect(button).not.toHaveAttribute('data-loading');
    },
  );

  it.each<false | 'false'>([false, 'false'])(
    'keeps handlers interactive for aria-disabled=%s',
    (ariaDisabled) => {
      const onClick = vi.fn();
      const onClickCapture = vi.fn();
      render(
        <IconButton
          aria-label="Archive"
          aria-disabled={ariaDisabled}
          onClick={onClick}
          onClickCapture={onClickCapture}
        >
          A
        </IconButton>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

      expect(onClickCapture).toHaveBeenCalledOnce();
      expect(onClick).toHaveBeenCalledOnce();
    },
  );
});
