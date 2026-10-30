import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlImage } from './image';
import type { ImageFit, ImageLayout, ImageSource, ImageStatus } from './image';
import { provideImageDefaults } from './image-defaults';
import { SlImageMedia } from './image-media';
import { SlImageFallback, SlImagePlaceholder } from './image-slots';

const PHOTO = '/warehouse.jpg';
const SECOND = '/warehouse-cdn.jpg';

@Component({
  imports: [SlImage, SlImageMedia, SlImageFallback, SlImagePlaceholder],
  template: `
    <div
      slImage
      id="plain"
      alt="Warehouse B"
      [src]="src()"
      [fit]="fit()"
      [layout]="layout()"
      [status]="status()"
      [sources]="sources()"
      (statusChange)="seen($event)"
    ></div>

    <div slImage id="framed" alt="Warehouse B" [src]="src()" ratio="landscape"></div>
    <div slImage id="paired" alt="Warehouse B" [src]="src()" [ratio]="[2, 1]" layout="fill"></div>

    <div
      slImage
      id="stated"
      alt="Warehouse B"
      [src]="src()"
      bordered
      fit="contain"
      layout="fill"
      placeholder="none"
      position="top"
      radius="lg"
      width="800"
      height="600"
      sizes="100vw"
      srcset="/warehouse.jpg 800w, /warehouse-cdn.jpg 1600w"
      crossOrigin="anonymous"
    ></div>

    <div slImage id="focal" alt="Warehouse B" [src]="src()" position="30% 20%"></div>
    <div slImage id="priority" alt="Warehouse B" [src]="src()" priority></div>
    <div slImage id="lazy-priority" alt="Warehouse B" [src]="src()" priority loading="lazy"></div>
    <div slImage id="idle" alt=""></div>
    <div slImage id="second" alt="Warehouse B" [src]="src()" [fallbackSrc]="second()"></div>

    <div slImage id="projected">
      <img slImageMedia src="/grace.jpg" alt="Grace Hopper" loading="eager" />
    </div>

    <div
      slImage
      id="blurred"
      alt="Warehouse B"
      [src]="src()"
      placeholder="blur"
      placeholderSrc="data:image/gif;base64,R0lGOD"
    ></div>

    <div slImage id="slotted" alt="Warehouse B" [src]="src()">
      <span slImagePlaceholder id="skeleton"></span>
      <button slImageFallback type="button" id="retry">Retry</button>
    </div>

    <button
      slImage
      id="button"
      type="button"
      alt="Open the photo"
      [src]="src()"
      ratio="square"
    ></button>
  `,
})
class Host {
  readonly src = signal<string | undefined>(PHOTO);
  readonly second = signal<string | undefined>(SECOND);
  readonly fit = signal<ImageFit | undefined>(undefined);
  readonly layout = signal<ImageLayout | undefined>(undefined);
  readonly status = signal<ImageStatus | undefined>(undefined);
  readonly sources = signal<readonly ImageSource[]>([]);
  readonly seen = vi.fn<(status: ImageStatus) => void>();
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const query = <T extends HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  return { fixture, host: fixture.componentInstance, query };
}

const pictureOf = (root: HTMLElement) =>
  root.querySelector('[data-part="image"]') as HTMLImageElement;
const placeholderOf = (root: HTMLElement) =>
  root.querySelector('[data-part="placeholder"]') as HTMLElement;
const fallbackOf = (root: HTMLElement) =>
  root.querySelector('[data-part="fallback"]') as HTMLElement;
const frameOf = (root: HTMLElement) =>
  root.querySelector('[data-ui="aspect-ratio"]') as HTMLElement;

describe('SlImage', () => {
  it('names the family and its parts so the stylesheet and the consumer can select them', () => {
    const { query } = mount();
    const root = query('#plain');

    expect(root.getAttribute('data-ui')).toBe('image');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(pictureOf(root)).not.toBeNull();
    expect(placeholderOf(root).getAttribute('aria-hidden')).toBe('true');
    expect(fallbackOf(root)).not.toBeNull();
    expect(fallbackOf(root).hasAttribute('aria-hidden')).toBe(false);
  });

  it('starts with its own size, cropped, centred, square-cornered and on a sunken ground', () => {
    const { query } = mount();
    const root = query('#plain');

    expect(root.getAttribute('data-layout')).toBe('intrinsic');
    expect(root.getAttribute('data-fit')).toBe('cover');
    expect(root.getAttribute('data-position')).toBe('center');
    expect(root.getAttribute('data-radius')).toBe('none');
    expect(root.getAttribute('data-placeholder')).toBe('surface');
    expect(root.hasAttribute('data-bordered')).toBe(false);
  });

  it('states every axis to the stylesheet, and hands the picture its native attributes', () => {
    const { query } = mount();
    const root = query('#stated');

    expect(root.getAttribute('data-layout')).toBe('fill');
    expect(root.getAttribute('data-fit')).toBe('contain');
    expect(root.getAttribute('data-position')).toBe('top');
    expect(root.getAttribute('data-radius')).toBe('lg');
    expect(root.getAttribute('data-placeholder')).toBe('none');
    expect(root.getAttribute('data-bordered')).toBe('');
    const picture = pictureOf(root);
    expect(picture.getAttribute('alt')).toBe('Warehouse B');
    expect(picture.getAttribute('width')).toBe('800');
    expect(picture.getAttribute('height')).toBe('600');
    expect(picture.getAttribute('sizes')).toBe('100vw');
    expect(picture.getAttribute('srcset')).toBe('/warehouse.jpg 800w, /warehouse-cdn.jpg 1600w');
    expect(picture.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('loads lazily and decodes asynchronously unless the picture is the one the page waits for', () => {
    const { query } = mount();

    expect(pictureOf(query('#plain')).getAttribute('loading')).toBe('lazy');
    expect(pictureOf(query('#plain')).getAttribute('decoding')).toBe('async');
    expect(pictureOf(query('#plain')).hasAttribute('fetchpriority')).toBe(false);
    expect(pictureOf(query('#priority')).getAttribute('loading')).toBe('eager');
    expect(pictureOf(query('#priority')).getAttribute('fetchpriority')).toBe('high');
    expect(pictureOf(query('#lazy-priority')).getAttribute('loading')).toBe('lazy');
  });

  it('is written on the element the consumer chose', () => {
    const { query } = mount();

    expect(query('#button').tagName).toBe('BUTTON');
    expect(query('#button').getAttribute('data-status')).toBe('loading');
  });
});

describe('the frame', () => {
  it('composes an aspect-ratio root inside its own when a ratio is decided', () => {
    const { query } = mount();
    const root = query('#framed');

    expect(frameOf(root).getAttribute('data-ratio')).toBe('landscape');
    expect(frameOf(root).contains(pictureOf(root))).toBe(true);
    expect(frameOf(root).contains(fallbackOf(root))).toBe(true);
    expect(root.getAttribute('data-layout')).toBe('framed');
  });

  it('renders no frame, and the layers on its own root, when no ratio was decided', () => {
    const { query } = mount();
    const root = query('#plain');

    expect(frameOf(root)).toBeNull();
    expect(pictureOf(root).parentElement).toBe(root);
  });

  it('lets a stated layout win over the one the ratio implies', () => {
    const { query } = mount();
    const root = query('#paired');

    expect(root.getAttribute('data-layout')).toBe('fill');
    expect(frameOf(root).style.getPropertyValue('--slotted-aspect-ratio')).toBe('2 / 1');
  });
});

describe('the focal point', () => {
  it('writes a focal point no name holds on the instance, and says so in the DOM', () => {
    const { query } = mount();

    expect(query('#focal').getAttribute('data-position')).toBe('custom');
    expect(query('#focal').style.getPropertyValue('--slotted-image-position')).toBe('30% 20%');
    expect(query('#stated').style.getPropertyValue('--slotted-image-position')).toBe('');
  });
});

describe('the picture', () => {
  it('starts loading, and is idle when nothing was asked for', () => {
    const { query } = mount();

    expect(query('#plain').getAttribute('data-status')).toBe('loading');
    expect(query('#idle').getAttribute('data-status')).toBe('idle');
    expect(pictureOf(query('#idle'))).toBeNull();
  });

  it('reports the picture once it arrives, and once only', () => {
    const { fixture, host, query } = mount();

    pictureOf(query('#plain')).dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-status')).toBe('loaded');
    expect(host.seen).toHaveBeenCalledExactlyOnceWith('loaded');
  });

  it('says the picture failed rather than that it never arrived', () => {
    const { fixture, host, query } = mount();

    pictureOf(query('#plain')).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-status')).toBe('error');
    expect(host.seen).toHaveBeenCalledExactlyOnceWith('error');
  });

  /** The second URL is tried in silence; `error` is what is left when it fails too. */
  it('tries the second URL before reporting a failure', () => {
    const { fixture, query } = mount();
    const root = query('#second');

    pictureOf(root).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(pictureOf(root).getAttribute('src')).toBe(SECOND);
    expect(root.getAttribute('data-status')).toBe('loading');

    pictureOf(root).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(root.getAttribute('data-status')).toBe('error');
  });

  it('starts again when a new picture is asked for', () => {
    const { fixture, host, query } = mount();

    pictureOf(query('#plain')).dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(query('#plain').getAttribute('data-status')).toBe('loaded');

    host.src.set(SECOND);
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-status')).toBe('loading');
  });

  it('takes the status the consumer passes over the one it derives', () => {
    const { fixture, host, query } = mount();

    host.status.set('loaded');
    fixture.detectChanges();
    pictureOf(query('#plain')).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-status')).toBe('loaded');
  });

  /**
   * The projected picture is the consumer's own `<img>`, which is what lets
   * `NgOptimizedImage` do its work; the family reads its load all the same,
   * and writes nothing over the attributes the consumer wrote.
   */
  it('reports a picture the consumer projected, on the element the consumer owns', () => {
    const { fixture, query } = mount();
    const root = query('#projected');
    const picture = root.querySelector('img') as HTMLImageElement;

    expect(picture.getAttribute('data-part')).toBe('image');
    expect(picture.getAttribute('alt')).toBe('Grace Hopper');
    expect(picture.getAttribute('loading')).toBe('eager');
    expect(root.querySelectorAll('img')).toHaveLength(1);
    expect(root.getAttribute('data-status')).toBe('loading');

    picture.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(root.getAttribute('data-status')).toBe('loaded');
  });
});

describe('what stands in', () => {
  it('draws the blurred preview from the small picture, hidden from assistive technology', () => {
    const { query } = mount();
    const preview = placeholderOf(query('#blurred')).querySelector('img') as HTMLImageElement;

    expect(preview.getAttribute('src')).toBe('data:image/gif;base64,R0lGOD');
    expect(preview.getAttribute('alt')).toBe('');
    expect(placeholderOf(query('#plain')).querySelector('img')).toBeNull();
  });

  it('projects the consumer’s content over the ground and in place of the glyph', () => {
    const { query } = mount();
    const root = query('#slotted');

    expect(placeholderOf(root).contains(query('#skeleton'))).toBe(true);
    expect(fallbackOf(root).contains(query('#retry'))).toBe(true);
    expect(fallbackOf(root).querySelector('[data-glyph]')).toBeNull();
    expect(
      fallbackOf(query('#plain')).querySelector('[data-ui="icon"] > svg[data-glyph="image-off"]'),
    ).not.toBeNull();
  });
});

describe('sources', () => {
  it('writes a picture with one source per entry and the img last', () => {
    const { fixture, host, query } = mount();

    host.sources.set([
      { srcSet: '/warehouse.avif', type: 'image/avif' },
      { media: '(max-width: 600px)', srcSet: '/warehouse-portrait.jpg', sizes: '100vw' },
    ]);
    fixture.detectChanges();

    const element = query('#plain').querySelector('[data-part="picture"]') as HTMLElement;
    expect(element.tagName).toBe('PICTURE');
    const sources = element.querySelectorAll('source');
    expect(sources).toHaveLength(2);
    expect(sources[0]?.getAttribute('type')).toBe('image/avif');
    expect(sources[1]?.getAttribute('media')).toBe('(max-width: 600px)');
    expect(sources[1]?.getAttribute('sizes')).toBe('100vw');
    expect(element.lastElementChild).toBe(pictureOf(query('#plain')));
  });
});

describe('defaults', () => {
  it('takes its defaults from the provider, and its own value over the provider', () => {
    const { query } = mount([
      provideImageDefaults({ bordered: true, fit: 'contain', radius: 'md' }),
    ]);

    expect(query('#plain').getAttribute('data-fit')).toBe('contain');
    expect(query('#plain').getAttribute('data-radius')).toBe('md');
    expect(query('#plain').getAttribute('data-bordered')).toBe('');
    expect(query('#stated').getAttribute('data-fit')).toBe('contain');
    expect(query('#stated').getAttribute('data-radius')).toBe('lg');
  });
});
