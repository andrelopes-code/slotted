import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlAvatar } from './avatar';
import type { AvatarSize, AvatarStatus, AvatarTone } from './avatar';
import { provideAvatarDefaults } from './avatar-defaults';
import { SlAvatarFallback } from './avatar-fallback';
import { SlAvatarImage } from './avatar-image';

@Component({
  imports: [SlAvatar, SlAvatarFallback, SlAvatarImage],
  template: `
    <span
      slAvatar
      id="plain"
      [name]="name()"
      [size]="size()"
      [tone]="tone()"
      [status]="status()"
    ></span>

    <span slAvatar id="pictured" name="Ada Lovelace" [src]="src()" (statusChange)="seen($event)">
    </span>

    <span slAvatar id="projected" name="Grace Hopper">
      <img slAvatarImage src="/grace.png" />
    </span>

    <span slAvatar id="alt-written" name="Grace Hopper">
      <img slAvatarImage src="/grace.png" alt="A portrait" />
    </span>

    <span slAvatar id="custom" name="Acme Inc">
      <svg slAvatarFallback id="logo"></svg>
    </span>

    <span slAvatar id="nameless"></span>
    <span slAvatar id="decorative" name="Ada Lovelace" decorative></span>
    <span slAvatar id="written-role" name="Ada Lovelace" role="presentation"></span>
    <span slAvatar id="off" name="Ada Lovelace" disabled></span>
    <span slAvatar id="seeded" name="Ada Lovelace" idFor="user-8842"></span>
    <span slAvatar id="seeded-too" name="Someone Else" idFor="user-8842"></span>
    <a slAvatar id="linked" name="Ada Lovelace" href="#profile"></a>
  `,
})
class Host {
  readonly name = signal<string | undefined>('Ada Lovelace');
  readonly size = signal<AvatarSize | undefined>(undefined);
  readonly tone = signal<AvatarTone | undefined>(undefined);
  readonly status = signal<AvatarStatus | undefined>(undefined);
  readonly src = signal<string | undefined>('/ada.png');
  readonly seen = vi.fn<(status: AvatarStatus) => void>();
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const query = <T extends HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  return { fixture, host: fixture.componentInstance, query };
}

const fallbackOf = (root: HTMLElement) =>
  root.querySelector('[data-part="fallback"]') as HTMLElement;

describe('SlAvatar', () => {
  it('names the family and its parts so the stylesheet and the consumer can select them', () => {
    const { query } = mount();
    const root = query('#pictured');

    expect(root.getAttribute('data-ui')).toBe('avatar');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.querySelector('[data-part="image"]')).not.toBeNull();
    expect(fallbackOf(root)).not.toBeNull();
  });

  it('states its size, shape, tone and painting to the stylesheet', () => {
    const { fixture, host, query } = mount();
    host.size.set('xl');
    host.tone.set('danger');
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-size')).toBe('xl');
    expect(query('#plain').getAttribute('data-tone')).toBe('danger');
    expect(query('#plain').getAttribute('data-shape')).toBe('circle');
    expect(query('#plain').getAttribute('data-variant')).toBe('soft');
  });

  it('writes the initials the name reduces to, and one of them at the smallest size', () => {
    const { fixture, host, query } = mount();
    expect(fallbackOf(query('#plain')).textContent?.trim()).toBe('AL');

    host.size.set('xs');
    fixture.detectChanges();

    expect(fallbackOf(query('#plain')).textContent?.trim()).toBe('A');
  });

  it('draws the person glyph when there is no name, and only then', () => {
    const { query } = mount();

    const nameless = fallbackOf(query('#nameless'));
    expect(nameless.textContent?.trim()).toBe('');
    expect(nameless.querySelector('[data-ui="icon"] > svg[data-glyph="person"]')).not.toBeNull();
    expect(fallbackOf(query('#plain')).querySelector('[data-glyph]')).toBeNull();
  });

  it('renders the projected fallback in place of the initials', () => {
    const { query } = mount();

    expect(query('#custom').querySelector('#logo')).not.toBeNull();
    expect(fallbackOf(query('#custom')).textContent?.trim()).toBe('');
    expect(fallbackOf(query('#custom')).querySelector('[data-glyph]')).toBeNull();
  });

  it('requests no picture at all when there is none to request', () => {
    const { query } = mount();

    expect(query('#plain').querySelector('[data-part="image"]')).toBeNull();
    expect(query('#plain').getAttribute('data-status')).toBe('idle');
  });
});

describe('the picture', () => {
  it('starts loading, because the request has been made and has not answered', () => {
    const { query } = mount();

    expect(query('#pictured').getAttribute('data-status')).toBe('loading');
  });

  it('reports the picture once it arrives', () => {
    const { fixture, host, query } = mount();

    query('#pictured').querySelector('img')?.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(query('#pictured').getAttribute('data-status')).toBe('loaded');
    expect(host.seen).toHaveBeenCalledWith('loaded');
  });

  /** A boolean could not say this: the fallback stands in for both, for different reasons. */
  it('says the picture failed rather than that it never arrived', () => {
    const { fixture, query } = mount();

    query('#pictured').querySelector('img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(query('#pictured').getAttribute('data-status')).toBe('error');
  });

  it('starts again when a new picture is asked for', () => {
    const { fixture, host, query } = mount();
    query('#pictured').querySelector('img')?.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(query('#pictured').getAttribute('data-status')).toBe('loaded');

    host.src.set('/grace.png');
    fixture.detectChanges();

    expect(query('#pictured').getAttribute('data-status')).toBe('loading');
  });

  it('takes the status the consumer supplies over the one it derives', () => {
    const { fixture, host, query } = mount();
    host.status.set('error');
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-status')).toBe('error');
  });

  /**
   * The projected picture is the consumer's own `<img>`, which is what lets
   * `NgOptimizedImage` reach it. React has no equivalent, and answers the same
   * need with `renderImage`.
   */
  it('reports a picture the consumer projected, on the element the consumer owns', () => {
    const { fixture, query } = mount();
    const image = query('#projected').querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('data-part')).toBe('image');
    expect(query('#projected').getAttribute('data-status')).toBe('loading');

    image.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(query('#projected').getAttribute('data-status')).toBe('loaded');
  });

  it('never names the picture, because the root is already named', () => {
    const { query } = mount();

    expect(query('#pictured').querySelector('img')?.getAttribute('alt')).toBe('');
    expect(query('#pictured').getAttribute('aria-label')).toBe('Ada Lovelace');
  });

  it('keeps an alt the consumer wrote', () => {
    const { query } = mount();

    expect(query('#alt-written').querySelector('img')?.getAttribute('alt')).toBe('A portrait');
  });
});

describe('the color a name resolves to', () => {
  it('never writes the derived value itself, because a stylesheet cannot resolve it', () => {
    const { query } = mount();

    expect(query('#plain').getAttribute('data-tone')).not.toBe('auto');
  });

  it('takes the seed the consumer supplies, for a name that is not the identifier', () => {
    const { query } = mount();

    expect(query('#seeded').getAttribute('data-tone')).toBe(
      query('#seeded-too').getAttribute('data-tone'),
    );
  });

  it('is neutral when there is no name to derive one from', () => {
    const { query } = mount();

    expect(query('#nameless').getAttribute('data-tone')).toBe('secondary');
  });
});

describe('the accessibility tree', () => {
  it('is a named image when it has a name', () => {
    const { query } = mount();

    expect(query('#plain').getAttribute('role')).toBe('img');
    expect(query('#plain').getAttribute('aria-label')).toBe('Ada Lovelace');
  });

  it('leaves the tree when the name is written beside it', () => {
    const { query } = mount();

    expect(query('#decorative').getAttribute('aria-hidden')).toBe('true');
    expect(query('#decorative').getAttribute('role')).toBeNull();
  });

  it('leaves the tree when there is nothing to announce', () => {
    const { query } = mount();

    expect(query('#nameless').getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the role the consumer wrote', () => {
    const { query } = mount();

    expect(query('#written-role').getAttribute('role')).toBe('presentation');
  });
});

describe('states and native wiring', () => {
  it('reports disabled to the stylesheet', () => {
    const { query } = mount();

    expect(query('#off').getAttribute('data-disabled')).toBe('');
    expect(query('#plain').getAttribute('data-disabled')).toBeNull();
  });

  it('is written on the element the page chose, and keeps what that element is', () => {
    const { query } = mount();

    expect(query('#linked').tagName).toBe('A');
    expect(query('#linked').getAttribute('href')).toBe('#profile');
    expect(query('#linked').getAttribute('data-ui')).toBe('avatar');
  });
});

describe('defaults an application sets once', () => {
  it('paints every avatar under the provider', () => {
    const { query } = mount([
      provideAvatarDefaults({ shape: 'square', size: 'lg', variant: 'solid' }),
    ]);

    expect(query('#plain').getAttribute('data-size')).toBe('lg');
    expect(query('#plain').getAttribute('data-shape')).toBe('square');
    expect(query('#plain').getAttribute('data-variant')).toBe('solid');
  });

  it('loses to an avatar that states its own', () => {
    const { fixture, host, query } = mount([provideAvatarDefaults({ size: 'lg' })]);
    host.size.set('xs');
    fixture.detectChanges();

    expect(query('#plain').getAttribute('data-size')).toBe('xs');
  });

  /** Turkish `i` upper-cases to `İ`, which is the case no `toUpperCase()` writes. */
  it('cases the initials for the locale the application set', () => {
    const { fixture, host, query } = mount([provideAvatarDefaults({ locale: 'tr' })]);
    host.name.set('işık ışık');
    fixture.detectChanges();

    expect(fallbackOf(query('#plain')).textContent?.trim()).toBe('İI');
  });
});
