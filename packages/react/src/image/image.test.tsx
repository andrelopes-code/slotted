import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Image, ImageDefaultsProvider } from './index';

const PHOTO = '/warehouse.jpg';
const SECOND = '/warehouse-cdn.jpg';

/** Native attributes reach the picture, so the root is found by its identifier. */
const root = () => document.querySelector('[data-ui="image"]') as HTMLElement;
const picture = () => document.querySelector('[data-part="image"]') as HTMLImageElement;
const placeholder = () => document.querySelector('[data-part="placeholder"]') as HTMLElement;
const fallback = () => document.querySelector('[data-part="fallback"]') as HTMLElement;
const frame = () => document.querySelector('[data-ui="aspect-ratio"]') as HTMLElement;

describe('Image', () => {
  it('names the family and its parts so the stylesheet and the consumer can select them', () => {
    render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(root()).toHaveAttribute('data-ui', 'image');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(picture()).toHaveAttribute('data-part', 'image');
    expect(placeholder()).toHaveAttribute('data-part', 'placeholder');
    expect(placeholder()).toHaveAttribute('aria-hidden', 'true');
    expect(fallback()).toHaveAttribute('data-part', 'fallback');
    expect(fallback()).not.toHaveAttribute('aria-hidden');
  });

  it('starts with its own size, cropped, centred, square-cornered and on a sunken ground', () => {
    render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(root()).toHaveAttribute('data-layout', 'intrinsic');
    expect(root()).toHaveAttribute('data-fit', 'cover');
    expect(root()).toHaveAttribute('data-position', 'center');
    expect(root()).toHaveAttribute('data-radius', 'none');
    expect(root()).toHaveAttribute('data-placeholder', 'surface');
    expect(root()).not.toHaveAttribute('data-bordered');
  });

  it('states every axis to the stylesheet', () => {
    render(
      <Image
        alt="Warehouse B"
        bordered

        fit="contain"
        layout="fill"
        placeholder="none"
        position="top"
        radius="lg"
        src={PHOTO}
      />,
    );

    expect(root()).toHaveAttribute('data-layout', 'fill');
    expect(root()).toHaveAttribute('data-fit', 'contain');
    expect(root()).toHaveAttribute('data-position', 'top');
    expect(root()).toHaveAttribute('data-radius', 'lg');
    expect(root()).toHaveAttribute('data-placeholder', 'none');
    expect(root()).toHaveAttribute('data-bordered', '');
  });

  /** The platform's own attributes reach the platform's own element. */
  it('hands the picture its native attributes, and the root its class and style', () => {
    render(
      <Image
        alt="Warehouse B"
        className="hero"
        crossOrigin="anonymous"

        height={600}
        sizes="(min-width: 640px) 50vw, 100vw"
        src={PHOTO}
        srcSet={`${PHOTO} 800w, ${SECOND} 1600w`}
        style={{ maxInlineSize: 480 }}
        width={800}
      />,
    );

    expect(picture()).toHaveAttribute('alt', 'Warehouse B');
    expect(picture()).toHaveAttribute('width', '800');
    expect(picture()).toHaveAttribute('height', '600');
    expect(picture()).toHaveAttribute('sizes', '(min-width: 640px) 50vw, 100vw');
    expect(picture()).toHaveAttribute('srcset', `${PHOTO} 800w, ${SECOND} 1600w`);
    expect(picture()).toHaveAttribute('crossorigin', 'anonymous');
    expect(root()).toHaveClass('hero');
    expect(root().style.maxInlineSize).toBe('480px');
    expect(picture()).not.toHaveClass('hero');
  });

  it('loads lazily and decodes asynchronously unless the picture is the one the page waits for', () => {
    const { rerender } = render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(picture()).toHaveAttribute('loading', 'lazy');
    expect(picture()).toHaveAttribute('decoding', 'async');
    expect(picture()).not.toHaveAttribute('fetchpriority');

    rerender(<Image alt="Warehouse B" priority src={PHOTO} />);

    expect(picture()).toHaveAttribute('loading', 'eager');
    expect(picture()).toHaveAttribute('fetchpriority', 'high');

    rerender(<Image alt="Warehouse B" loading="lazy" priority src={PHOTO} />);

    expect(picture()).toHaveAttribute('loading', 'lazy');
  });
});

describe('the frame', () => {
  it('composes an aspect-ratio root inside its own when a ratio is decided', () => {
    render(<Image alt="Warehouse B" ratio="landscape" src={PHOTO} />);

    expect(frame()).toHaveAttribute('data-ratio', 'landscape');
    expect(root().contains(frame())).toBe(true);
    expect(frame().contains(picture())).toBe(true);
    expect(frame().contains(fallback())).toBe(true);
    expect(root()).toHaveAttribute('data-layout', 'framed');
  });

  it('renders no frame, and the layers on its own root, when no ratio was decided', () => {
    render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(frame()).toBeNull();
    expect(picture().parentElement).toBe(root());
  });

  it('lets a stated layout win over the one the ratio implies', () => {
    render(<Image alt="Warehouse B" layout="fill" ratio={[2, 1]} src={PHOTO} />);

    expect(root()).toHaveAttribute('data-layout', 'fill');
    expect(frame().style.getPropertyValue('--slotted-aspect-ratio')).toBe('2 / 1');
  });
});

describe('the focal point', () => {
  it('writes a focal point no name holds on the instance, and says so in the DOM', () => {
    render(<Image alt="Warehouse B" position="30% 20%" src={PHOTO} />);

    expect(root()).toHaveAttribute('data-position', 'custom');
    expect(root().style.getPropertyValue('--slotted-image-position')).toBe('30% 20%');
  });

  it('writes nothing on the instance for a named focal point', () => {
    render(<Image alt="Warehouse B" position="end" src={PHOTO} />);

    expect(root()).toHaveAttribute('data-position', 'end');
    expect(root().style.getPropertyValue('--slotted-image-position')).toBe('');
  });
});

describe('the picture', () => {
  it('starts loading, because the request has been made and has not answered', () => {
    render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(root()).toHaveAttribute('data-status', 'loading');
  });

  it('is idle when nothing was asked for', () => {
    render(<Image alt="" />);

    expect(root()).toHaveAttribute('data-status', 'idle');
    expect(picture()).not.toHaveAttribute('src');
  });

  it('reports the picture once it arrives, and once only', () => {
    const onStatusChange = vi.fn();
    render(<Image alt="Warehouse B" onStatusChange={onStatusChange} src={PHOTO} />);

    fireEvent.load(picture());

    expect(root()).toHaveAttribute('data-status', 'loaded');
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith('loaded');
  });

  it('says the picture failed rather than that it never arrived', () => {
    const onStatusChange = vi.fn();
    render(<Image alt="Warehouse B" onStatusChange={onStatusChange} src={PHOTO} />);

    fireEvent.error(picture());

    expect(root()).toHaveAttribute('data-status', 'error');
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith('error');
  });

  /** The second URL is tried in silence; `error` is what is left when it fails too. */
  it('tries the second URL before reporting a failure', () => {
    const onStatusChange = vi.fn();
    const onError = vi.fn();
    render(
      <Image
        alt="Warehouse B"

        fallbackSrc={SECOND}
        onError={onError}
        onStatusChange={onStatusChange}
        src={PHOTO}
      />,
    );

    fireEvent.error(picture());

    expect(picture()).toHaveAttribute('src', SECOND);
    expect(root()).toHaveAttribute('data-status', 'loading');
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);

    fireEvent.error(picture());

    expect(root()).toHaveAttribute('data-status', 'error');
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith('error');
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('shows the second URL as loaded when it arrives', () => {
    render(<Image alt="Warehouse B" fallbackSrc={SECOND} src={PHOTO} />);

    fireEvent.error(picture());
    fireEvent.load(picture());

    expect(root()).toHaveAttribute('data-status', 'loaded');
    expect(picture()).toHaveAttribute('src', SECOND);
  });

  it('starts again when a new picture is asked for', () => {
    const { rerender } = render(<Image alt="Warehouse B" src={PHOTO} />);
    fireEvent.load(picture());
    expect(root()).toHaveAttribute('data-status', 'loaded');

    rerender(<Image alt="Warehouse B" src={SECOND} />);

    expect(root()).toHaveAttribute('data-status', 'loading');
  });

  it('takes the status the consumer passes over the one it derives, and reports nothing', () => {
    const onStatusChange = vi.fn();
    render(
      <Image
        alt="Warehouse B"

        onStatusChange={onStatusChange}
        src={PHOTO}
        status="loaded"
      />,
    );

    expect(root()).toHaveAttribute('data-status', 'loaded');
    fireEvent.error(picture());
    expect(root()).toHaveAttribute('data-status', 'loaded');
  });

  it('runs the consumer’s own load handler before its own', () => {
    const onLoad = vi.fn();
    render(<Image alt="Warehouse B" onLoad={onLoad} src={PHOTO} />);

    fireEvent.load(picture());

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(root()).toHaveAttribute('data-status', 'loaded');
  });

  it('serves the consumer’s ref with the picture element', () => {
    const ref = vi.fn();
    render(<Image alt="Warehouse B" ref={ref} src={PHOTO} />);

    expect(ref).toHaveBeenCalledWith(picture());
  });
});

describe('what stands in', () => {
  it('draws the blurred preview from the small picture, hidden from assistive technology', () => {
    render(
      <Image
        alt="Warehouse B"

        placeholder="blur"
        placeholderSrc="data:image/gif;base64,R0lGOD"
        src={PHOTO}
      />,
    );

    const preview = placeholder().querySelector('img') as HTMLImageElement;
    expect(preview).toHaveAttribute('src', 'data:image/gif;base64,R0lGOD');
    expect(preview).toHaveAttribute('alt', '');
  });

  it('draws no preview when the placeholder is not blur', () => {
    render(
      <Image
        alt="Warehouse B"

        placeholderSrc="data:image/gif;base64,R0lGOD"
        src={PHOTO}
      />,
    );

    expect(placeholder().querySelector('img')).toBeNull();
  });

  it('renders the consumer’s content over the ground and in place of the glyph', () => {
    render(
      <Image
        alt="Warehouse B"

        fallback={<button type="button">Retry</button>}
        placeholderContent={<span data-testid="skeleton" />}
        src={PHOTO}
      />,
    );

    expect(placeholder()).toContainElement(screen.getByTestId('skeleton'));
    expect(fallback()).toContainElement(screen.getByRole('button', { name: 'Retry' }));
    expect(fallback().querySelector('[data-glyph]')).toBeNull();
  });

  it('draws the image-off glyph in the fallback by default', () => {
    render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(
      fallback().querySelector('[data-ui="icon"] > svg[data-glyph="image-off"]'),
    ).not.toBeNull();
    expect(fallback()).toHaveTextContent('');
  });
});

describe('sources', () => {
  it('writes a picture with one source per entry and the img last', () => {
    render(
      <Image
        alt="Warehouse B"

        sources={[
          { srcSet: '/warehouse.avif', type: 'image/avif' },
          { media: '(max-width: 600px)', srcSet: '/warehouse-portrait.jpg', sizes: '100vw' },
        ]}
        src={PHOTO}
      />,
    );

    const element = document.querySelector('[data-part="picture"]') as HTMLPictureElement;
    expect(element.tagName).toBe('PICTURE');
    const sources = element.querySelectorAll('source');
    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('type', 'image/avif');
    expect(sources[1]).toHaveAttribute('media', '(max-width: 600px)');
    expect(sources[1]).toHaveAttribute('sizes', '100vw');
    expect(element.lastElementChild).toBe(picture());
  });

  it('writes no picture element without sources', () => {
    render(<Image alt="Warehouse B" src={PHOTO} />);

    expect(document.querySelector('[data-part="picture"]')).toBeNull();
  });
});

describe('composition', () => {
  it('renders the root into the element the consumer means', () => {
    render(
      <Image
        alt="Open the photo of warehouse B"

        ratio="square"
        render={(props) => <button type="button" {...props} />}
        src={PHOTO}
      />,
    );

    expect(root().tagName).toBe('BUTTON');
    expect(root()).toHaveAttribute('data-status', 'loading');
  });

  it('renders the picture into the consumer’s own element, and still reads its load', () => {
    render(
      <Image
        alt="Warehouse B"

        renderImage={(props) => <img {...props} data-loader="next" />}
        src={PHOTO}
      />,
    );

    expect(picture()).toHaveAttribute('data-loader', 'next');
    fireEvent.load(picture());
    expect(root()).toHaveAttribute('data-status', 'loaded');
  });

  it('takes its defaults from the provider, and its own value over the provider', () => {
    render(
      <ImageDefaultsProvider bordered fit="contain" radius="md">
        <Image alt="Warehouse B" fit="none" src={PHOTO} />
      </ImageDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-fit', 'none');
    expect(root()).toHaveAttribute('data-radius', 'md');
    expect(root()).toHaveAttribute('data-bordered', '');
  });
});
