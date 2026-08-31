import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Avatar, AvatarFallback, AvatarImage } from './index';

const setup = () =>
  render(
    <Avatar data-testid="avatar">
      <AvatarImage alt="Ada Lovelace" src="/ada.png" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>,
  );

describe('Avatar', () => {
  it('starts unloaded, because the picture may never arrive', () => {
    setup();

    expect(screen.getByTestId('avatar')).not.toHaveAttribute('data-loaded');
  });

  it('reports the picture once it arrives', () => {
    setup();

    fireEvent.load(screen.getByRole('img', { hidden: true }));

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-loaded', '');
  });

  it('stays unloaded when the picture fails, so the fallback keeps standing in', () => {
    setup();

    fireEvent.error(screen.getByRole('img', { hidden: true }));

    expect(screen.getByTestId('avatar')).not.toHaveAttribute('data-loaded');
  });

  it('returns to the fallback if a later picture fails', () => {
    setup();
    const image = screen.getByRole('img', { hidden: true });

    fireEvent.load(image);
    fireEvent.error(image);

    expect(screen.getByTestId('avatar')).not.toHaveAttribute('data-loaded');
  });

  it('keeps the consumer handlers alongside its own', () => {
    let loaded = 0;
    render(
      <Avatar data-testid="avatar">
        <AvatarImage
          alt="Ada Lovelace"
          onLoad={() => {
            loaded += 1;
          }}
          src="/ada.png"
        />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    fireEvent.load(screen.getByRole('img', { hidden: true }));

    expect(loaded).toBe(1);
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-loaded', '');
  });

  it('names each part so the stylesheet can swap them', () => {
    setup();

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-part', 'root');
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('data-part', 'image');
    expect(screen.getByText('AL')).toHaveAttribute('data-part', 'fallback');
  });

  it('states its size to the stylesheet, defaulting to medium', () => {
    render(
      <>
        <Avatar data-testid="default" />
        <Avatar data-testid="large" size="lg" />
      </>,
    );

    expect(screen.getByTestId('default')).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('large')).toHaveAttribute('data-size', 'lg');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Avatar className="app-avatar" data-testid="avatar" />);

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('slotted-avatar');
    expect(avatar).toHaveClass('app-avatar');
  });

  it('renders a fallback with no image at all', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).not.toHaveAttribute('data-loaded');
  });
});

describe('AvatarImage with a picture already in cache', () => {
  const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
  const naturalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');

  afterEach(() => {
    if (complete !== undefined)
      Object.defineProperty(HTMLImageElement.prototype, 'complete', complete);
    if (naturalWidth !== undefined)
      Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidth);
  });

  it('reports it without waiting for a load event that has already fired', () => {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 64,
    });

    setup();

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-loaded', '');
  });
});
