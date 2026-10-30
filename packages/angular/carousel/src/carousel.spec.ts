import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { SlCarousel } from './carousel';
import {
  SlCarouselAutoplay,
  SlCarouselControls,
  SlCarouselCounter,
  SlCarouselIndicator,
  SlCarouselIndicators,
  SlCarouselIndicatorTemplate,
  SlCarouselNext,
  SlCarouselPrevious,
  SlCarouselSlide,
  SlCarouselViewport,
} from './carousel-parts';

/**
 * jsdom lays nothing out. Each slide is given the viewport's width and stands
 * after the one before it, and the viewport's scroll offset moves every slide —
 * enough for the engine to read one page per slide.
 */
const WIDTH = 400;

function layout() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.getAttribute('data-part') === 'slide' && this.parentElement !== null) {
      const index = [...this.parentElement.children].indexOf(this);
      const left = index * WIDTH - this.parentElement.scrollLeft;
      return {
        left,
        right: left + WIDTH,
        top: 0,
        bottom: 300,
        width: WIDTH,
        height: 300,
        x: left,
        y: 0,
        toJSON() {},
      } as DOMRect;
    }
    return {
      left: 0,
      right: WIDTH,
      top: 0,
      bottom: 300,
      width: WIDTH,
      height: 300,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.getAttribute('data-part') === 'viewport' ? WIDTH : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.getAttribute('data-part') === 'viewport' ? this.children.length * WIDTH : 0;
  });
}

@Component({
  standalone: true,
  imports: [
    SlCarousel,
    SlCarouselViewport,
    SlCarouselSlide,
    SlCarouselPrevious,
    SlCarouselNext,
    SlCarouselControls,
    SlCarouselAutoplay,
    SlCarouselIndicators,
    SlCarouselCounter,
  ],
  template: `<section
    slCarousel
    aria-label="Autumn Collection"
    [page]="page()"
    [loop]="loop()"
    [autoplay]="autoplay()"
    (pageRequest)="requests.push($event); onRequest($event)"
    (playingRequest)="playing.push($event)"
  >
    <div slCarouselViewport>
      @for (name of names; track name) {
        <div slCarouselSlide>{{ name }}</div>
      }
    </div>
    <button slCarouselPrevious></button>
    <button slCarouselNext></button>
    <div slCarouselControls>
      <button slCarouselAutoplay></button>
      <div slCarouselIndicators></div>
      <span slCarouselCounter></span>
    </div>
  </section>`,
})
class Host {
  readonly names = ['Terracotta Amphora', 'Sage Bottle', 'Lavender Bowl'];
  readonly page = signal<number | undefined>(undefined);
  readonly loop = signal(false);
  readonly autoplay = signal<boolean | number>(false);
  readonly requests: ChangeRequest<number>[] = [];
  readonly playing: ChangeRequest<boolean>[] = [];
  onRequest: (request: ChangeRequest<number>) => void = () => undefined;
}

@Component({
  standalone: true,
  imports: [
    SlCarousel,
    SlCarouselViewport,
    SlCarouselSlide,
    SlCarouselIndicators,
    SlCarouselIndicator,
    SlCarouselIndicatorTemplate,
  ],
  template: `<section slCarousel aria-label="Galeria">
    <div slCarouselViewport>
      <div slCarouselSlide aria-label="Jarro Mel, de frente">a</div>
      <div slCarouselSlide>b</div>
    </div>
    <div slCarouselIndicators variant="thumbnails">
      <ng-template slCarouselIndicatorTemplate let-page>
        <button slCarouselIndicator [page]="page">
          <img [alt]="'Foto ' + (page + 1)" src="data:," />
        </button>
      </ng-template>
    </div>
  </section>`,
})
class Gallery {}

let fixture: ComponentFixture<Host>;
const root = () => fixture.nativeElement.querySelector('[data-ui="carousel"]') as HTMLElement;
const part = (name: string) => root().querySelector(`[data-part="${name}"]`) as HTMLElement;
const all = (name: string) => [...root().querySelectorAll<HTMLElement>(`[data-part="${name}"]`)];

async function settle() {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

describe('SlCarousel', () => {
  beforeEach(async () => {
    layout();
    TestBed.configureTestingModule({ imports: [Host, Gallery] });
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('writes the APG anatomy, in the words of the page', () => {
    expect(root().tagName).toBe('SECTION');
    expect(root().getAttribute('aria-roledescription')).toBe('carousel');
    expect(all('slide')[0]?.getAttribute('aria-roledescription')).toBe('slide');
    expect(all('slide')[0]?.getAttribute('aria-label')).toBe('1 of 3');
    expect(part('indicators').getAttribute('role')).toBe('tablist');
    expect(all('indicator')).toHaveLength(3);
    expect(all('indicator')[0]?.getAttribute('aria-selected')).toBe('true');
    expect(all('indicator')[0]?.getAttribute('aria-controls')).toBe(all('slide')[0]?.id);
    expect(part('counter').textContent?.trim()).toBe('1 / 3');
    expect(part('autoplay').hasAttribute('hidden')).toBe(true);
  });

  it('asks for the next page with the reason, and moves an uncontrolled carousel', async () => {
    part('next').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle();
    expect(fixture.componentInstance.requests[0]).toEqual(
      expect.objectContaining({ value: 1, previous: 0, reason: 'pointer' }),
    );
    expect(all('indicator')[1]?.getAttribute('aria-selected')).toBe('true');
    expect(part('counter').textContent?.trim()).toBe('2 / 3');
    expect(all('slide')[1]?.hasAttribute('data-current')).toBe(true);
  });

  it('keeps focus on a control at the end and says it has nowhere to go', async () => {
    const previous = part('previous');
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(previous.hasAttribute('disabled')).toBe(false);
    previous.click();
    await settle();
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('wraps past the ends with a loop', async () => {
    fixture.componentInstance.loop.set(true);
    await settle();
    part('previous').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    await settle();
    expect(fixture.componentInstance.requests[0]).toEqual(
      expect.objectContaining({ value: 2, reason: 'keyboard' }),
    );
  });

  it('never moves a page the consumer owns', async () => {
    fixture.componentInstance.page.set(0);
    await settle();
    part('next').click();
    await settle();
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(all('indicator')[0]?.getAttribute('aria-selected')).toBe('true');
    fixture.componentInstance.page.set(2);
    await settle();
    expect(all('indicator')[2]?.getAttribute('aria-selected')).toBe('true');
  });

  it('commits nothing when the request is cancelled', async () => {
    fixture.componentInstance.onRequest = (request) => request.cancel();
    part('next').click();
    await settle();
    expect(all('indicator')[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('pages the viewport from the keyboard', async () => {
    const viewport = part('viewport');
    expect(viewport.getAttribute('tabindex')).toBe('0');
    viewport.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'End' }));
    await settle();
    expect(fixture.componentInstance.requests.at(-1)).toEqual(
      expect.objectContaining({ value: 2, reason: 'keyboard' }),
    );
    viewport.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    await settle();
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('hides the slides out of view from assistive technology', () => {
    expect(all('slide')[0]?.hasAttribute('inert')).toBe(false);
    expect(all('slide')[1]?.hasAttribute('inert')).toBe(true);
  });

  it('advances on the timer with the reason timeout and names its control by the action', async () => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.autoplay.set(1000);
    fixture.componentInstance.loop.set(true);
    await settle();
    expect(root().hasAttribute('data-playing')).toBe(true);
    expect(part('autoplay').getAttribute('aria-label')).toBe('Stop rotation');
    expect(part('autoplay').hasAttribute('aria-pressed')).toBe(false);
    vi.advanceTimersByTime(1000);
    await settle();
    expect(fixture.componentInstance.requests[0]).toEqual(
      expect.objectContaining({ value: 1, reason: 'timeout' }),
    );
  });

  it('stops when keyboard focus enters', async () => {
    fixture.componentInstance.autoplay.set(true);
    await settle();
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      return selector === ':focus-visible' ? true : matches.call(this, selector);
    });
    part('viewport').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await settle();
    expect(fixture.componentInstance.playing[0]).toEqual(
      expect.objectContaining({ value: false, reason: 'keyboard' }),
    );
    expect(part('autoplay').getAttribute('aria-label')).toBe('Resume rotation');
  });

  it('leaves a name the consumer gave a slide alone, and draws thumbnails from a template', async () => {
    const gallery = TestBed.createComponent(Gallery);
    gallery.detectChanges();
    await gallery.whenStable();
    await Promise.resolve();
    gallery.detectChanges();
    const element = gallery.nativeElement as HTMLElement;
    const slides = element.querySelectorAll('[data-part="slide"]');
    expect(slides[0]?.getAttribute('aria-label')).toBe('Jarro Mel, de frente');
    expect(slides[1]?.getAttribute('aria-label')).toBe('2 of 2');
    const thumbnails = element.querySelectorAll('[data-part="indicator"]');
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]?.hasAttribute('aria-label')).toBe(false);
    expect(thumbnails[0]?.querySelector('img')?.getAttribute('alt')).toBe('Foto 1');
  });
});

describe('SlCarousel language', () => {
  it('speaks the language in force, and follows a change of it in place', async () => {
    layout();
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    fixture = TestBed.createComponent(Host);
    await settle();
    // language: pt-BR
    expect(part('next').getAttribute('aria-label')).toBe('Próximo slide');
    // language: en-US
    expect(root().getAttribute('aria-roledescription')).toBe('carrossel');

    locale.set('en-US');
    await settle();
    expect(part('next').getAttribute('aria-label')).toBe('Next slide');
    vi.restoreAllMocks();
  });
});
