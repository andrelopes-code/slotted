import {
  PROGRESS_WAVE_BAR_INDETERMINATE_PATH,
  PROGRESS_WAVE_BAR_PATH,
  PROGRESS_WAVE_BAR_REACH,
  PROGRESS_WAVE_RING_PATH,
} from '@slotted/core/progress';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/progress-indicator/contract.json';
import { SlLoader } from './loader';
import { SlProgressBar } from './progress-bar';
import { SlProgressCircle } from './progress-circle';
import { provideProgressIndicatorDefaults } from './progress-indicator-defaults';

const defaults = contract.members.progressIndicator.defaults;

@Component({
  imports: [SlProgressBar, SlProgressCircle, SlLoader],
  template: `<div
      slProgressBar
      [value]="value()"
      [min]="min()"
      [max]="max()"
      [buffer]="buffer()"
      [label]="label()"
      [hideLabel]="hideLabel()"
      [showValue]="showValue()"
      [valueText]="valueText()"
      [format]="format()"
      [locale]="locale()"
      [placement]="placement()"
      [wave]="wave()"
      [loading]="loading()"
      [delay]="delay()"
      [minDuration]="minDuration()"
      (withdraw)="onWithdraw()"
    ></div>
    <div slProgressCircle id="ring" [value]="value()" [wave]="wave()" label="Rebuilding"></div>
    <div slLoader id="loader" [contained]="contained()" label="Signing you in"></div>`,
})
class TestHost {
  readonly value = signal<number | null | undefined>(40);
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly buffer = signal<number | null | undefined>(undefined);
  readonly label = signal<string | undefined>('Uploading invoices');
  readonly hideLabel = signal<boolean | undefined>(undefined);
  readonly showValue = signal(false);
  readonly valueText = signal<string | undefined>(undefined);
  readonly format = signal<Intl.NumberFormatOptions | undefined>(undefined);
  readonly locale = signal<string | undefined>(undefined);
  readonly placement = signal<'inline' | 'page'>('inline');
  readonly wave = signal(false);
  readonly loading = signal(true);
  readonly delay = signal<number | undefined>(undefined);
  readonly minDuration = signal<number | undefined>(undefined);
  readonly contained = signal(false);
  readonly withdrawals = signal(0);

  onWithdraw() {
    this.withdrawals.update((count) => count + 1);
  }
}

function mount(providers: unknown[] = [], before?: (host: TestHost) => void) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  /**
   * Anything the timing depends on has to be set before the first change
   * detection, because that is when the machine starts the wait — a delay
   * stated afterwards does not retroactively withdraw an indicator that is
   * already painted, which is the machine behaving correctly rather than a
   * defect.
   */
  if (before !== undefined) before(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

const bar = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector<HTMLElement>('[data-shape="linear"]');
const ring = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector<HTMLElement>('[data-shape="circular"]');
const loader = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector<HTMLElement>('[data-shape="morph"]');

describe('SlProgressBar', () => {
  it('starts the sweep over each time it is painted again', () => {
    const fixture = mount([], (host) => host.value.set(null));
    const indicator = () => bar(fixture)!.querySelector('[data-part="indicator"]');
    const first = indicator();

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(indicator()).toBe(first);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(indicator()).not.toBe(first);
  });

  it('writes the family identity, the shape and the parts', () => {
    const fixture = mount();
    const root = bar(fixture);

    expect(root?.getAttribute('data-ui')).toBe('progress-indicator');
    expect(root?.getAttribute('data-part')).toBe('root');
    expect(root?.getAttribute('role')).toBe('progressbar');
    expect(root?.querySelector('[data-part="track"] > [data-part="indicator"]')).not.toBeNull();
    expect(root?.querySelector('[data-part="label"]')?.textContent).toBe('Uploading invoices');
  });

  it('names itself from the rendered label', () => {
    const fixture = mount();
    const root = bar(fixture);
    const label = root?.querySelector('[data-part="label"]');

    expect(root?.getAttribute('aria-labelledby')).toBe(label?.id);
    expect(label?.id).toMatch(/^slotted-progress-/);
  });

  it('reports the range and the value it painted', () => {
    const fixture = mount();
    fixture.componentInstance.min.set(0);
    fixture.componentInstance.max.set(512);
    fixture.componentInstance.value.set(128);
    fixture.detectChanges();
    const root = bar(fixture);

    expect(root?.getAttribute('aria-valuemin')).toBe('0');
    expect(root?.getAttribute('aria-valuemax')).toBe('512');
    expect(root?.getAttribute('aria-valuenow')).toBe('128');
    expect(root?.style.getPropertyValue('--slotted-progress-indicator-percent')).toBe('25');
  });

  /**
   * ARIA 1.3 asks an author to omit `aria-valuenow` while the value is
   * indeterminate, and the omission is what says "in progress, and nobody
   * knows how far".
   */
  it('omits the current value while the wait is indeterminate', () => {
    const fixture = mount();
    fixture.componentInstance.value.set(null);
    fixture.detectChanges();
    const root = bar(fixture);

    expect(root?.hasAttribute('data-indeterminate')).toBe(true);
    expect(root?.hasAttribute('aria-valuenow')).toBe(false);
    expect(root?.hasAttribute('aria-valuetext')).toBe(false);
  });

  it('clamps a value outside the range, and announces what it painted', () => {
    const fixture = mount();
    fixture.componentInstance.value.set(140);
    fixture.componentInstance.showValue.set(true);
    fixture.detectChanges();
    const root = bar(fixture);

    expect(root?.getAttribute('aria-valuenow')).toBe('100');
    expect(root?.getAttribute('aria-valuetext')).toBe('100%');
    expect(root?.hasAttribute('data-complete')).toBe(true);
    expect(root?.querySelector('[data-part="value"]')?.textContent).toBe('100%');
  });

  it('marks the buffer only when there is one, and never behind the value', () => {
    const fixture = mount();
    fixture.componentInstance.buffer.set(72);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('data-buffered')).toBe(true);
    expect(
      bar(fixture)?.style.getPropertyValue('--slotted-progress-indicator-buffer-percent'),
    ).toBe('72');

    fixture.componentInstance.buffer.set(12);
    fixture.detectChanges();
    expect(
      bar(fixture)?.style.getPropertyValue('--slotted-progress-indicator-buffer-percent'),
    ).toBe('40');

    fixture.componentInstance.buffer.set(null);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('data-buffered')).toBe(false);
  });

  it('writes the number in the locale and the format it was given', () => {
    const fixture = mount();
    fixture.componentInstance.max.set(512);
    fixture.componentInstance.value.set(128);
    fixture.componentInstance.locale.set('en-US');
    fixture.componentInstance.format.set({
      style: 'unit',
      unit: 'megabyte',
      unitDisplay: 'narrow',
    });
    fixture.detectChanges();

    expect(bar(fixture)?.getAttribute('aria-valuetext')).toBe('128MB');
  });

  it('lets a consumer say what the family cannot compute', () => {
    const fixture = mount();
    fixture.componentInstance.showValue.set(true);
    fixture.componentInstance.valueText.set('3 of 7 files');
    fixture.detectChanges();
    const root = bar(fixture);

    expect(root?.getAttribute('aria-valuetext')).toBe('3 of 7 files');
    expect(root?.querySelector('[data-part="value"]')?.textContent).toBe('3 of 7 files');
  });

  it('hides the name of a page-level bar without losing it, until told otherwise', () => {
    const fixture = mount();
    fixture.componentInstance.placement.set('page');
    fixture.detectChanges();
    let label = bar(fixture)?.querySelector('[data-part="label"]');

    expect(bar(fixture)?.getAttribute('data-placement')).toBe('page');
    expect(label?.getAttribute('data-ui')).toBe('visually-hidden');
    expect(label?.textContent).toBe('Uploading invoices');

    fixture.componentInstance.hideLabel.set(false);
    fixture.detectChanges();
    label = bar(fixture)?.querySelector('[data-part="label"]');
    expect(label?.hasAttribute('data-ui')).toBe(false);
  });

  it('paints no wave unless asked', () => {
    const fixture = mount();
    expect(bar(fixture)?.hasAttribute('data-wave')).toBe(false);
    expect(bar(fixture)?.querySelector('svg')).toBeNull();

    fixture.componentInstance.wave.set(true);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('data-wave')).toBe(true);
  });

  /**
   * The wavy indicator is a stroked path over the whole track, in the SVG
   * namespace, and the markup states the two numbers the stylesheet's dash
   * arithmetic rests on: one unit is one thickness, and `pathLength` is the
   * reach. An indeterminate bar carries the tighter wave.
   */
  it('draws the wave as one path whose length is its reach', () => {
    const fixture = mount();
    fixture.componentInstance.wave.set(true);
    fixture.detectChanges();
    const indicator = bar(fixture)?.querySelector(
      '[data-part="track"] > svg[data-part="indicator"]',
    );
    expect(indicator?.getAttribute('viewBox')).toBe(`0 -1.25 ${PROGRESS_WAVE_BAR_REACH} 2.5`);
    const path = indicator?.querySelector('path');
    expect(path?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(path?.getAttribute('d')).toBe(PROGRESS_WAVE_BAR_PATH);
    expect(path?.getAttribute('pathLength')).toBe(String(PROGRESS_WAVE_BAR_REACH));

    fixture.componentInstance.value.set(null);
    fixture.detectChanges();
    expect(bar(fixture)?.querySelector('path')?.getAttribute('d')).toBe(
      PROGRESS_WAVE_BAR_INDETERMINATE_PATH,
    );
  });
});

describe('SlProgressCircle', () => {
  it('draws two concentric shapes whose dash is the percentage itself', () => {
    const fixture = mount();
    const shapes = ring(fixture)?.querySelectorAll('svg circle');

    expect(shapes).toHaveLength(2);
    expect(shapes?.[0]?.getAttribute('data-part')).toBe('track');
    expect(shapes?.[1]?.getAttribute('data-part')).toBe('indicator');
    for (const shape of shapes ?? []) expect(shape.getAttribute('pathLength')).toBe('100');
  });

  /**
   * The namespace, and it is the reason the template writes `svg:circle`: an
   * unprefixed element inside a control-flow block is parsed as unknown HTML,
   * and an unknown HTML element inside an `svg` draws nothing.
   */
  it('draws its shapes in the SVG namespace', () => {
    const fixture = mount();
    for (const shape of ring(fixture)?.querySelectorAll('svg circle') ?? []) {
      expect(shape.namespaceURI).toBe('http://www.w3.org/2000/svg');
    }
  });

  /** The track stays a circle: only the active indicator waves, as in M3. */
  it('swaps the indicator for the wavy path, and back', () => {
    const fixture = mount();
    fixture.componentInstance.wave.set(true);
    fixture.detectChanges();
    const track = ring(fixture)?.querySelector('svg circle');
    const indicator = ring(fixture)?.querySelector('svg path');
    expect(track?.getAttribute('data-part')).toBe('track');
    expect(indicator?.getAttribute('data-part')).toBe('indicator');
    expect(indicator?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(indicator?.getAttribute('d')).toBe(PROGRESS_WAVE_RING_PATH);
    expect(indicator?.getAttribute('pathLength')).toBe('100');

    fixture.componentInstance.wave.set(false);
    fixture.detectChanges();
    expect(ring(fixture)?.querySelectorAll('svg path')).toHaveLength(0);
    expect(ring(fixture)?.querySelectorAll('svg circle')).toHaveLength(2);
  });

  it('is the spinner every library ships when it is given no value', () => {
    const fixture = mount();
    fixture.componentInstance.value.set(null);
    fixture.detectChanges();

    expect(ring(fixture)?.hasAttribute('data-indeterminate')).toBe(true);
    expect(ring(fixture)?.hasAttribute('aria-valuenow')).toBe(false);
  });
});

describe('SlLoader', () => {
  it('is always indeterminate, and measures nothing', () => {
    const fixture = mount();
    const root = loader(fixture);

    expect(root?.getAttribute('data-shape')).toBe('morph');
    expect(root?.hasAttribute('data-indeterminate')).toBe(true);
    expect(root?.hasAttribute('aria-valuemin')).toBe(false);
    expect(root?.hasAttribute('aria-valuemax')).toBe(false);
    expect(root?.hasAttribute('aria-valuenow')).toBe(false);
    expect(root?.querySelector('[data-part="track"] > [data-part="indicator"]')).not.toBeNull();
  });

  it('draws M3’s container only when asked', () => {
    const fixture = mount();
    expect(loader(fixture)?.hasAttribute('data-contained')).toBe(false);

    fixture.componentInstance.contained.set(true);
    fixture.detectChanges();
    expect(loader(fixture)?.hasAttribute('data-contained')).toBe(true);
  });
});

describe('the wait, and when it is reported', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('paints immediately when no timing is stated', () => {
    const fixture = mount();
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(false);
  });

  it('paints nothing until the wait has lasted long enough to report', () => {
    const fixture = mount([], (host) => host.delay.set(200));
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(true);

    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(false);
  });

  it('holds an indicator that did appear, and reports the withdrawal', () => {
    const fixture = mount([], (host) => host.minDuration.set(400));

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(false);
    expect(fixture.componentInstance.withdrawals()).toBe(0);

    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(true);
    expect(fixture.componentInstance.withdrawals()).toBe(1);
  });

  it('takes the timing an application set on the injection token', () => {
    const fixture = mount([provideProgressIndicatorDefaults({ delay: 300 })]);
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(true);

    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(bar(fixture)?.hasAttribute('hidden')).toBe(false);
  });
});

describe('the application-wide defaults', () => {
  it('sets the appearance once, and yields to an indicator that states its own', () => {
    const fixture = mount([provideProgressIndicatorDefaults({ size: 'lg', tone: 'success' })]);

    expect(bar(fixture)?.getAttribute('data-size')).toBe('lg');
    expect(bar(fixture)?.getAttribute('data-tone')).toBe('success');

    TestBed.resetTestingModule();
    const stated = mount([provideProgressIndicatorDefaults({ size: 'lg' })]);
    stated.componentInstance.value.set(40);
    stated.detectChanges();
    expect(bar(stated)?.getAttribute('data-size')).toBe('lg');
  });

  it('writes the digits in the language the application chose', () => {
    const fixture = mount([provideProgressIndicatorDefaults({ locale: 'de-DE' })]);
    fixture.componentInstance.value.set(7.5);
    fixture.detectChanges();

    expect(bar(fixture)?.getAttribute('aria-valuetext')).toBe('8 %');
  });
});

describe('the contract this binding answers', () => {
  it('renders the element and the defaults the contract declares', () => {
    const fixture = mount();
    expect(bar(fixture)?.tagName.toLowerCase()).toBe(
      contract.members.progressIndicator.nativeElement,
    );
    expect(bar(fixture)?.getAttribute('data-size')).toBe(defaults.size);
    expect(bar(fixture)?.getAttribute('data-tone')).toBe(defaults.tone);
    expect(loader(fixture)?.getAttribute('data-size')).toBe(defaults.size);
  });

  it('paints every part the contract names, across the three components', () => {
    const fixture = mount();
    fixture.componentInstance.showValue.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const rendered = new Set(
      [...root.querySelectorAll<HTMLElement>('[data-part]')].map(
        (element) => element.dataset['part'],
      ),
    );

    for (const part of contract.members.progressIndicator.parts) {
      expect(rendered.has(part)).toBe(true);
    }
  });
});

@Component({
  standalone: true,
  imports: [SlProgressBar],
  template: `<div slProgressBar label="Refreshing" [placement]="placement()"></div>`,
})
class EdgeHost {
  readonly placement = signal<'inline' | 'edge-start' | 'edge-end'>('edge-start');
}

describe('a bar on an edge of its box', () => {
  it('writes the placement and keeps its name clipped', () => {
    const fixture = TestBed.createComponent(EdgeHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '[data-ui="progress-indicator"]',
    ) as HTMLElement;
    expect(root.getAttribute('data-placement')).toBe('edge-start');
    expect(root.querySelector('[data-part="label"]')?.getAttribute('data-ui')).toBe(
      'visually-hidden',
    );

    fixture.componentInstance.placement.set('edge-end');
    fixture.detectChanges();
    expect(root.getAttribute('data-placement')).toBe('edge-end');

    fixture.componentInstance.placement.set('inline');
    fixture.detectChanges();
    expect(root.hasAttribute('data-placement')).toBe(false);
  });
});
