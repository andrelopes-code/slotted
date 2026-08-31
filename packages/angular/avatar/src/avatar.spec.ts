import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { SlAvatar } from './avatar';
import type { AvatarSize } from './avatar';
import { SlAvatarFallback } from './avatar-fallback';
import { SlAvatarImage } from './avatar-image';

@Component({
  imports: [SlAvatar, SlAvatarFallback, SlAvatarImage],
  template: `
    <span slAvatar id="avatar" [size]="size()">
      <img slAvatarImage alt="Ada Lovelace" src="/ada.png" />
      <span slAvatarFallback>AL</span>
    </span>
  `,
})
class Host {
  readonly size = signal<AvatarSize>('md');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    fallback: () => element.querySelector<HTMLElement>('[data-part="fallback"]')!,
    image: () => element.querySelector<HTMLImageElement>('img')!,
    root: () => element.querySelector<HTMLElement>('#avatar')!,
  };
}

const dispatch = (element: Element, type: string) => element.dispatchEvent(new Event(type));

describe('SlAvatar', () => {
  it('starts unloaded, because the picture may never arrive', () => {
    const { root } = mount();

    expect(root().hasAttribute('data-loaded')).toBe(false);
  });

  it('reports the picture once it arrives', () => {
    const { fixture, image, root } = mount();

    dispatch(image(), 'load');
    fixture.detectChanges();

    expect(root().getAttribute('data-loaded')).toBe('');
  });

  it('stays unloaded when the picture fails, so the fallback keeps standing in', () => {
    const { fixture, image, root } = mount();

    dispatch(image(), 'error');
    fixture.detectChanges();

    expect(root().hasAttribute('data-loaded')).toBe(false);
  });

  it('returns to the fallback if a later picture fails', () => {
    const { fixture, image, root } = mount();

    dispatch(image(), 'load');
    dispatch(image(), 'error');
    fixture.detectChanges();

    expect(root().hasAttribute('data-loaded')).toBe(false);
  });

  it('names each part so the stylesheet can swap them', () => {
    const { fallback, image, root } = mount();

    expect(root().getAttribute('data-part')).toBe('root');
    expect(image().getAttribute('data-part')).toBe('image');
    expect(fallback().getAttribute('data-part')).toBe('fallback');
  });

  it('states its size to the stylesheet, defaulting to medium', () => {
    const { fixture, root } = mount();

    expect(root().getAttribute('data-size')).toBe('md');

    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();

    expect(root().getAttribute('data-size')).toBe('lg');
  });

  it('carries the class the stylesheet paints', () => {
    const { root } = mount();

    expect(root().classList.contains('slotted-avatar')).toBe(true);
  });
});

describe('SlAvatarImage with a picture already in cache', () => {
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

    const { root } = mount();

    expect(root().getAttribute('data-loaded')).toBe('');
  });
});
