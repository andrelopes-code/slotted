import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { skeletonMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/skeleton/contract.json';
import { SlSkeleton } from './skeleton';
import { SlSkeletonRegion } from './skeleton-region';
import { SlSkeletonText } from './skeleton-text';
import { provideSkeletonDefaults } from './skeleton-defaults';

const defaults = contract.members.skeleton.defaults;

@Component({
  imports: [SlSkeleton, SlSkeletonText, SlSkeletonRegion],
  template: `<div
    slSkeletonRegion
    [loading]="loading()"
    [animation]="animation()"
    [live]="live()"
    [messages]="messages()"
    [loadedLabel]="loadedLabel()"
    [delay]="delay()"
    [minDuration]="minDuration()"
    (reveal)="onReveal()"
  >
    <div slSkeletonText [lines]="lines()"></div>
    <span slSkeleton [shape]="shape()"></span>
    <span slSkeleton id="stubborn" [loading]="true"></span>
  </div>`,
})
class TestHost {
  readonly loading = signal(true);
  readonly animation = signal<'shimmer' | 'pulse' | 'none' | undefined>(undefined);
  readonly live = signal<'polite' | 'off' | undefined>(undefined);
  readonly messages = signal<{ label: string } | undefined>(undefined);
  readonly loadedLabel = signal<string | undefined>(undefined);
  readonly delay = signal<number | undefined>(undefined);
  readonly minDuration = signal<number | undefined>(undefined);
  readonly lines = signal(defaults.lines);
  readonly shape = signal<'text' | 'block' | 'circle' | 'square'>('text');
  readonly onReveal = vi.fn();
}

/**
 * `configure` runs before the first change detection, because the timing
 * inputs are only timing inputs on the first pass: a delay set after the
 * placeholder is already painted has nothing left to delay, which is what the
 * shared machine means by settled.
 */
function mount(configure?: (host: TestHost) => void) {
  const fixture = TestBed.createComponent(TestHost);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  return {
    fixture,
    host: fixture.componentInstance,
    region: root.querySelector('[data-part="region"]')!,
    text: root.querySelector('[data-part="text"]')!,
    box: root.querySelector('[data-part="root"]')!,
    stubborn: root.querySelector('#stubborn')!,
    rows: () => root.querySelectorAll('[data-part="line"]'),
    status: () => root.querySelector('[role="status"]'),
  };
}

describe('SlSkeleton', () => {
  it('is selected in public by the family identifier on every part', () => {
    const { box, text, region } = mount();

    for (const element of [box, text, region]) {
      expect(element.getAttribute('data-ui')).toBe('skeleton');
    }
    expect(box.getAttribute('data-part')).toBe('root');
    expect(text.getAttribute('data-part')).toBe('text');
    expect(region.getAttribute('data-part')).toBe('region');
  });

  it('is a line of text at the middle avatar step until told otherwise', () => {
    const { box } = mount();

    expect(box.getAttribute('data-shape')).toBe(defaults.shape);
    expect(box.getAttribute('data-size')).toBe(defaults.size);
    expect(box.getAttribute('data-animation')).toBe(defaults.animation);
  });

  it('hides itself and blocks focus while it is painted, and stops doing both after', () => {
    const { box, fixture, host } = mount();

    expect(box.getAttribute('aria-hidden')).toBe('true');
    expect(box.hasAttribute('inert')).toBe(true);

    host.loading.set(false);
    fixture.detectChanges();

    expect(box.hasAttribute('aria-hidden')).toBe(false);
    expect(box.hasAttribute('inert')).toBe(false);
    expect(box.hasAttribute('data-loading')).toBe(false);
  });

  it('reaches the stylesheet through logical custom properties, never width', () => {
    @Component({
      imports: [SlSkeleton],
      template: `<span slSkeleton shape="block" inlineSize="120px" blockSize="3rem"></span>`,
    })
    class Sized {}

    const fixture = TestBed.createComponent(Sized);
    fixture.detectChanges();
    const box: HTMLElement = fixture.nativeElement.querySelector('[data-part="root"]');

    expect(box.style.getPropertyValue('--slotted-skeleton-inline-size')).toBe('120px');
    expect(box.style.getPropertyValue('--slotted-skeleton-block-size')).toBe('3rem');
    expect(box.getAttribute('style')).not.toContain('width');
  });

  /**
   * The escape hatch this family established in August, read once through the
   * token that exists for it: a static attribute has to survive the component
   * placed on top of it.
   */
  it('keeps an aria-hidden the consumer wrote on their own element', () => {
    @Component({
      imports: [SlSkeleton],
      template: `<span slSkeleton aria-hidden="false"></span>`,
    })
    class Announced {}

    const fixture = TestBed.createComponent(Announced);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-part="root"]').getAttribute('aria-hidden'),
    ).toBe('false');
  });
});

describe('SlSkeletonText', () => {
  it('reserves the rows it is asked for, and never fewer than one', () => {
    const { fixture, host, rows } = mount();
    expect(rows()).toHaveLength(defaults.lines);

    host.lines.set(7);
    fixture.detectChanges();
    expect(rows()).toHaveLength(7);

    host.lines.set(0);
    fixture.detectChanges();
    expect(rows()).toHaveLength(1);
  });

  it('draws no rows at all once the paragraph has arrived', () => {
    const { fixture, host, rows, text } = mount();

    host.loading.set(false);
    fixture.detectChanges();

    expect(rows()).toHaveLength(0);
    expect(text.hasAttribute('data-loading')).toBe(false);
  });
});

describe('SlSkeletonRegion', () => {
  it('reports itself busy and announces the wait exactly once', () => {
    const { region, status, fixture } = mount();

    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(status()?.textContent?.trim()).toBe(skeletonMessages.base.label);
    expect(fixture.nativeElement.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  /** Emptying a live region announces nothing, so one load says one thing. */
  it('falls silent when the content arrives, and speaks again only if asked', () => {
    const { fixture, host, status } = mount();

    host.loading.set(false);
    fixture.detectChanges();
    expect(status()?.textContent?.trim()).toBe('');

    host.loadedLabel.set('Members loaded');
    fixture.detectChanges();
    expect(status()?.textContent?.trim()).toBe('Members loaded');
  });

  it('says nothing at all when an application switches the announcement off', () => {
    const { fixture, host, status } = mount();

    host.live.set('off');
    fixture.detectChanges();

    expect(status()).toBeNull();
  });

  it('tells every placeholder inside it whether the data arrived', () => {
    const { box, fixture, host, stubborn, text } = mount();

    host.loading.set(false);
    fixture.detectChanges();

    expect(box.hasAttribute('data-loading')).toBe(false);
    expect(text.hasAttribute('data-loading')).toBe(false);
    expect(stubborn.hasAttribute('data-loading')).toBe(true);
  });

  it('hands its animation down to everything that has not named its own', () => {
    const { box, fixture, host, text } = mount();

    host.animation.set('pulse');
    fixture.detectChanges();

    expect(box.getAttribute('data-animation')).toBe('pulse');
    expect(text.getAttribute('data-animation')).toBe('pulse');
  });

  /** The region is never inert: an inert subtree is never announced. */
  it('keeps itself reachable so the announcement is read', () => {
    const { box, region } = mount();

    expect(region.hasAttribute('inert')).toBe(false);
    expect(box.hasAttribute('inert')).toBe(true);
  });

  it('sets the animation once for a whole application', () => {
    TestBed.configureTestingModule({
      providers: [provideSkeletonDefaults({ animation: 'pulse' })],
    });
    const { box } = mount();

    expect(box.getAttribute('data-animation')).toBe('pulse');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const { fixture, status } = mount();

    expect(status()?.textContent?.trim()).toBe('Carregando…');

    locale.set('en-US');
    fixture.detectChanges();
    expect(status()?.textContent?.trim()).toBe('Loading…');
  });
});

describe('SlSkeletonRegion timing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('paints nothing while the wait is still shorter than the delay', () => {
    const { fixture, region } = mount((host) => host.delay.set(200));

    expect(region.hasAttribute('data-loading')).toBe(false);

    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(region.hasAttribute('data-loading')).toBe(true);
  });

  /** The flash: data that arrives before the delay draws no placeholder at all. */
  it('never paints when the data arrives inside the delay', () => {
    const { fixture, host, region } = mount((instance) => instance.delay.set(200));

    vi.advanceTimersByTime(80);
    host.loading.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(region.hasAttribute('data-loading')).toBe(false);
  });

  it('holds a placeholder that did appear, and announces the withdrawal', () => {
    const { fixture, host, region } = mount((instance) => instance.minDuration.set(400));

    expect(region.hasAttribute('data-loading')).toBe(true);

    vi.advanceTimersByTime(100);
    host.loading.set(false);
    fixture.detectChanges();

    expect(region.hasAttribute('data-loading')).toBe(true);
    expect(host.onReveal).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(region.hasAttribute('data-loading')).toBe(false);
    expect(host.onReveal).toHaveBeenCalledTimes(1);
  });
});
