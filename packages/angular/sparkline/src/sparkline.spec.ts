import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import { SlSparkline } from './sparkline';
import { provideSparklineDefaults } from './sparkline-defaults';

@Component({
  imports: [SlSparkline],
  template: `<span
    slSparkline
    [data]="data()"
    [type]="type()"
    [size]="size()"
    [tone]="tone()"
    [series]="series()"
    [area]="area()"
    [marker]="marker()"
    [reference]="reference()"
    [label]="label()"
    [description]="description()"
    [locale]="locale()"
    [formatOptions]="formatOptions()"
    [messages]="messages()"
  ></span>`,
})
class TestHost {
  readonly data = signal<(number | null)[]>([12, 14, 30]);
  readonly type = signal<'line' | 'bar'>('line');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly tone = signal<'neutral' | 'success' | 'danger' | undefined>(undefined);
  readonly series = signal<1 | 2 | 3 | undefined>(undefined);
  readonly area = signal<boolean | undefined>(undefined);
  readonly marker = signal<boolean | undefined>(undefined);
  readonly reference = signal<number | undefined>(undefined);
  readonly label = signal<string | undefined>('Revenue');
  readonly description = signal<string | undefined>(undefined);
  readonly locale = signal<string | undefined>(undefined);
  readonly formatOptions = signal<Intl.NumberFormatOptions | undefined>(undefined);
  readonly messages = signal<{ up?: string } | undefined>(undefined);
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="sparkline"]') as HTMLElement;
  const part = (name: string) => root.querySelector(`[data-part="${name}"]`);
  const parts = (name: string) => root.querySelectorAll(`[data-part="${name}"]`);
  return { fixture, host: fixture.componentInstance, root, part, parts };
}

describe('SlSparkline', () => {
  it('eases a change of data and nothing else', () => {
    const { fixture, host, root } = mount();
    expect(root.hasAttribute('data-animate')).toBe(false);

    host.data.set([30, 14, 12]);
    fixture.detectChanges();
    expect(root.hasAttribute('data-animate')).toBe(true);

    host.size.set('lg');
    fixture.detectChanges();
    expect(root.hasAttribute('data-animate')).toBe(false);
  });

  it('is an image named by what it shows, with the drawing hidden', () => {
    const { root, part } = mount();

    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Revenue: 30, up 18 since 12');
    expect(part('plot')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('data-type')).toBe('line');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-curve')).toBe('linear');
    expect(root.hasAttribute('data-tone')).toBe(false);
    expect(root.hasAttribute('data-series')).toBe(false);
  });

  it('writes the tone and the series slot the consumer names', () => {
    const { fixture, host, root } = mount();
    host.tone.set('danger');
    host.series.set(3);
    fixture.detectChanges();

    expect(root.getAttribute('data-tone')).toBe('danger');
    expect(root.getAttribute('data-series')).toBe('3');
  });

  it('draws a line, a disc on the last point with its ring under it, and no bars', () => {
    const { part, parts } = mount();

    expect(part('line')).not.toBeNull();
    expect(part('ring')?.getAttribute('d')).toBe(part('marker')?.getAttribute('d'));
    expect(part('marker')?.getAttribute('d')).toMatch(/h0\.001$/);
    expect(part('area')).toBeNull();
    expect(parts('bar').length).toBe(0);
  });

  it('draws bars and marks the last one as current, skipping a gap', () => {
    const { fixture, host, part, parts } = mount();
    host.type.set('bar');
    host.data.set([3, null, 5]);
    fixture.detectChanges();

    const bars = parts('bar');
    expect(bars.length).toBe(2);
    expect(bars[1]?.hasAttribute('data-current')).toBe(true);
    expect(bars[0]?.hasAttribute('data-current')).toBe(false);
    expect(part('marker')).toBeNull();
  });

  it('washes the area, dashes a reference and leaves the marker off when told', () => {
    const { fixture, host, part } = mount();
    host.area.set(true);
    host.reference.set(20);
    host.marker.set(false);
    fixture.detectChanges();

    expect(part('area')).not.toBeNull();
    expect(part('reference')?.getAttribute('y1')).toBe(part('reference')?.getAttribute('y2'));
    expect(part('marker')).toBeNull();
    expect(part('ring')).toBeNull();
  });

  it('says there is nothing when the series has no real point', () => {
    const { fixture, host, root, part } = mount();
    host.data.set([null]);
    fixture.detectChanges();

    expect(root.getAttribute('aria-label')).toBe('Revenue: no data');
    expect(part('line')).toBeNull();
  });

  it('reads numbers in the locale and format it is given, and lets a description replace the whole', () => {
    const { fixture, host, root } = mount();
    host.data.set([1000, 1250.5]);
    host.label.set(undefined);
    host.locale.set('pt-BR');
    host.formatOptions.set({ style: 'currency', currency: 'BRL' });
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toMatch(
      /^R\$\s1\.250,50, up R\$\s250,50 since R\$\s1\.000,00$/,
    );

    host.description.set('Twelve weeks of revenue, rising');
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Twelve weeks of revenue, rising');
  });

  it('takes its defaults from the provider, and its own messages over the language', () => {
    const { fixture, host, root, part } = mount([
      provideSparklineDefaults({ area: true, curve: 'monotone' }),
    ]);

    expect(root.getAttribute('data-curve')).toBe('monotone');
    expect(part('area')).not.toBeNull();

    host.messages.set({ up: '{last} (+{change})' });
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Revenue: 30 (+18)');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { fixture, host, root } = mount([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    host.data.set([1000, 1250.5]);
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Revenue: 1.250,5, alta de 250,5 desde 1.000');

    locale.set('en-US');
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Revenue: 1,250.5, up 250.5 since 1,000');
  });

  it('keeps an aria-label the consumer wrote on their own element', () => {
    @Component({
      imports: [SlSparkline],
      template: `<span slSparkline aria-label="Own words" [data]="[1, 2]"></span>`,
    })
    class Own {}
    TestBed.configureTestingModule({ imports: [Own] });
    const fixture = TestBed.createComponent(Own);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-ui="sparkline"]').getAttribute('aria-label'),
    ).toBe('Own words');
  });
});
