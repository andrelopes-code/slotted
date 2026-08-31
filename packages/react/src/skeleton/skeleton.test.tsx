import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './index';

describe('Skeleton', () => {
  it('stays out of the accessibility tree, because it stands for nothing yet', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lets the consumer put it back in, for a placeholder that is the whole message', () => {
    render(<Skeleton aria-hidden={false} data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'false');
  });

  it('takes the shape of a line of text unless told otherwise', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveAttribute('data-shape', 'text');
  });

  it('states every shape it was given to the stylesheet', () => {
    render(
      <>
        <Skeleton data-testid="rectangle" shape="rectangle" />
        <Skeleton data-testid="circle" shape="circle" />
      </>,
    );

    expect(screen.getByTestId('rectangle')).toHaveAttribute('data-shape', 'rectangle');
    expect(screen.getByTestId('circle')).toHaveAttribute('data-shape', 'circle');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Skeleton className="app-skeleton" data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('slotted-skeleton');
    expect(skeleton).toHaveClass('app-skeleton');
  });

  it('hands the wiring to another element through render', () => {
    render(
      <Skeleton render={(props) => <div {...props} data-testid="skeleton" />} shape="circle" />,
    );

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.tagName).toBe('DIV');
    expect(skeleton).toHaveAttribute('data-shape', 'circle');
  });
});
