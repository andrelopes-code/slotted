import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Avatar, AvatarDefaultsProvider } from './index';

const PORTRAIT = '/ada.png';

const avatar = () => screen.getByTestId('avatar');
const image = () => document.querySelector('[data-part="image"]') as HTMLImageElement;
const fallback = () => document.querySelector('[data-part="fallback"]') as HTMLElement;

describe('Avatar', () => {
  it('names the family and its parts so the stylesheet and the consumer can select them', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} />);

    expect(avatar()).toHaveAttribute('data-ui', 'avatar');
    expect(avatar()).toHaveAttribute('data-part', 'root');
    expect(image()).toHaveAttribute('data-part', 'image');
    expect(fallback()).toHaveAttribute('data-part', 'fallback');
  });

  it('states its size, shape, tone and painting to the stylesheet', () => {
    render(
      <Avatar
        data-testid="avatar"
        name="Ada Lovelace"
        shape="square"
        size="lg"
        tone="accent"
        variant="solid"
      />,
    );

    expect(avatar()).toHaveAttribute('data-size', 'lg');
    expect(avatar()).toHaveAttribute('data-shape', 'square');
    expect(avatar()).toHaveAttribute('data-tone', 'accent');
    expect(avatar()).toHaveAttribute('data-variant', 'solid');
  });

  it('falls back to the circle, the middle size and the tinted painting', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(avatar()).toHaveAttribute('data-size', 'md');
    expect(avatar()).toHaveAttribute('data-shape', 'circle');
    expect(avatar()).toHaveAttribute('data-variant', 'soft');
  });
});

describe('the fallback order', () => {
  it('writes the initials the name reduces to', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(fallback()).toHaveTextContent('AL');
  });

  it('writes one initial at the smallest size, where two do not fit', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" size="xs" />);

    expect(fallback()).toHaveTextContent('A');
  });

  it('takes the consumer initials over the ones it would derive', () => {
    render(<Avatar data-testid="avatar" initials="+7" name="Ada Lovelace" />);

    expect(fallback()).toHaveTextContent('+7');
  });

  it('draws the person glyph when there is no name, and only then', () => {
    const { rerender } = render(<Avatar data-testid="avatar" />);

    expect(fallback().querySelector('[data-ui="icon"] > svg[data-glyph="person"]')).not.toBeNull();
    expect(fallback()).toHaveTextContent('');

    rerender(<Avatar data-testid="avatar" name="Ada Lovelace" />);
    expect(fallback().querySelector('[data-glyph]')).toBeNull();
  });

  it('renders the consumer content in place of the initials', () => {
    render(
      <Avatar data-testid="avatar" name="Acme Inc">
        <svg data-testid="logo" />
      </Avatar>,
    );

    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(fallback()).not.toHaveTextContent('AI');
    expect(fallback().querySelector('[data-glyph]')).toBeNull();
  });

  it('requests no picture at all when there is none to request', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(image()).toBeNull();
  });
});

describe('the picture', () => {
  it('starts loading, because the request has been made and has not answered', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} />);

    expect(avatar()).toHaveAttribute('data-status', 'loading');
  });

  it('is idle when nothing was asked for', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(avatar()).toHaveAttribute('data-status', 'idle');
  });

  it('reports the picture once it arrives, and once only', () => {
    const onStatusChange = vi.fn();
    render(
      <Avatar
        data-testid="avatar"
        name="Ada Lovelace"
        onStatusChange={onStatusChange}
        src={PORTRAIT}
      />,
    );

    fireEvent.load(image());

    expect(avatar()).toHaveAttribute('data-status', 'loaded');
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith('loaded');
  });

  /** A boolean could not say this: the fallback stands in for both, for different reasons. */
  it('says the picture failed rather than that it never arrived', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} />);

    fireEvent.error(image());

    expect(avatar()).toHaveAttribute('data-status', 'error');
  });

  it('starts again when a new picture is asked for', () => {
    const { rerender } = render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} />);
    fireEvent.load(image());
    expect(avatar()).toHaveAttribute('data-status', 'loaded');

    rerender(<Avatar data-testid="avatar" name="Ada Lovelace" src="/grace.png" />);

    expect(avatar()).toHaveAttribute('data-status', 'loading');
  });

  it('takes the status the consumer supplies over the one it derives', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} status="loaded" />);

    expect(avatar()).toHaveAttribute('data-status', 'loaded');
  });

  /**
   * The root carries the name in every status, so the avatar announces the same
   * thing before and after the photograph arrives.
   */
  it('never names the picture, because the root is already named', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} />);

    expect(image()).toHaveAttribute('alt', '');
    expect(avatar()).toHaveAccessibleName('Ada Lovelace');
  });

  it('renders the picture into the consumer element, still reporting its load', () => {
    const onStatusChange = vi.fn();
    render(
      <Avatar
        data-testid="avatar"
        name="Ada Lovelace"
        onStatusChange={onStatusChange}
        renderImage={(props) => <img {...props} data-testid="own-image" />}
        src={PORTRAIT}
      />,
    );

    fireEvent.load(screen.getByTestId('own-image'));

    expect(screen.getByTestId('own-image')).toHaveAttribute('data-part', 'image');
    expect(onStatusChange).toHaveBeenCalledWith('loaded');
  });
});

describe('a picture already in the browser cache', () => {
  const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
  const naturalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');

  afterEach(() => {
    if (complete !== undefined)
      Object.defineProperty(HTMLImageElement.prototype, 'complete', complete);
    if (naturalWidth !== undefined)
      Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidth);
  });

  it('is reported without waiting for a load event that has already fired', () => {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 64,
    });

    render(<Avatar data-testid="avatar" name="Ada Lovelace" src={PORTRAIT} />);

    expect(avatar()).toHaveAttribute('data-status', 'loaded');
  });
});

describe('the color a name resolves to', () => {
  it('gives the same name the same tone, whenever and wherever it is rendered', () => {
    render(
      <>
        <Avatar data-testid="avatar" name="Ada Lovelace" />
        <Avatar data-testid="again" name="Ada Lovelace" />
      </>,
    );

    expect(avatar().getAttribute('data-tone')).toBe(
      screen.getByTestId('again').getAttribute('data-tone'),
    );
  });

  it('never writes the derived value itself, because a stylesheet cannot resolve it', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(avatar().getAttribute('data-tone')).not.toBe('auto');
  });

  it('takes the seed the consumer supplies, for a name that is not the identifier', () => {
    render(
      <>
        <Avatar data-testid="avatar" idFor="user-8842" name="Ada Lovelace" />
        <Avatar data-testid="again" idFor="user-8842" name="Someone Else" />
      </>,
    );

    expect(avatar().getAttribute('data-tone')).toBe(
      screen.getByTestId('again').getAttribute('data-tone'),
    );
  });

  it('is neutral when there is no name to derive one from', () => {
    render(<Avatar data-testid="avatar" />);

    expect(avatar()).toHaveAttribute('data-tone', 'secondary');
  });

  it('takes the tone the consumer states over the derivation', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" tone="danger" />);

    expect(avatar()).toHaveAttribute('data-tone', 'danger');
  });
});

describe('the accessibility tree', () => {
  it('is a named image when it has a name', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(avatar()).toHaveAttribute('role', 'img');
    expect(avatar()).toHaveAccessibleName('Ada Lovelace');
  });

  /** The W3C decision tree: an avatar beside the name it belongs to is decoration. */
  it('leaves the tree when the name is written beside it', () => {
    render(<Avatar data-testid="avatar" decorative name="Ada Lovelace" />);

    expect(avatar()).toHaveAttribute('aria-hidden', 'true');
    expect(avatar()).not.toHaveAttribute('role');
  });

  it('leaves the tree when there is nothing to announce', () => {
    render(<Avatar data-testid="avatar" />);

    expect(avatar()).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the role the consumer wrote', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" role="presentation" />);

    expect(avatar()).toHaveAttribute('role', 'presentation');
  });
});

describe('states and native wiring', () => {
  it('reports disabled to the stylesheet', () => {
    render(<Avatar data-testid="avatar" disabled name="Ada Lovelace" />);

    expect(avatar()).toHaveAttribute('data-disabled', '');
  });

  it('writes no disabled attribute when it is not disabled', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);

    expect(avatar()).not.toHaveAttribute('data-disabled');
  });

  it('renders the wiring into the element the page means', () => {
    render(
      <Avatar
        name="Ada Lovelace"
        render={(props) => <a {...props} data-testid="avatar" href="#profile" />}
      />,
    );

    expect(avatar().tagName).toBe('A');
    expect(avatar()).toHaveAttribute('data-ui', 'avatar');
  });

  it('passes native attributes and events to the element that owns them', () => {
    const onClick = vi.fn();
    render(
      <Avatar
        className="app-avatar"
        data-testid="avatar"
        name="Ada"
        onClick={onClick}
        title="Ada"
      />,
    );

    fireEvent.click(avatar());

    expect(avatar()).toHaveClass('app-avatar');
    expect(avatar()).toHaveAttribute('title', 'Ada');
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('defaults an application sets once', () => {
  it('paints every avatar under the provider', () => {
    render(
      <AvatarDefaultsProvider shape="square" size="xl" variant="solid">
        <Avatar data-testid="avatar" name="Acme Inc" />
      </AvatarDefaultsProvider>,
    );

    expect(avatar()).toHaveAttribute('data-size', 'xl');
    expect(avatar()).toHaveAttribute('data-shape', 'square');
    expect(avatar()).toHaveAttribute('data-variant', 'solid');
  });

  it('loses to an avatar that states its own', () => {
    render(
      <AvatarDefaultsProvider size="xl">
        <Avatar data-testid="avatar" name="Acme Inc" size="xs" />
      </AvatarDefaultsProvider>,
    );

    expect(avatar()).toHaveAttribute('data-size', 'xs');
  });

  /** Turkish `i` upper-cases to `İ`, which is the case no `toUpperCase()` writes. */
  it('cases the initials for the locale the application set', () => {
    render(
      <AvatarDefaultsProvider locale="tr">
        <Avatar data-testid="avatar" name="işık ışık" />
      </AvatarDefaultsProvider>,
    );

    expect(fallback()).toHaveTextContent('İI');
  });
});
