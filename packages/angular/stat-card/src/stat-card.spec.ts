import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import { provideSparklineDefaults, SlSparkline } from '@slotted/angular/sparkline';

import { SlStatCard } from './stat-card';
import { SlStatCardDelta } from './stat-card-delta';
import {
  SlStatCardAction,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardMessage,
  SlStatCardPeriod,
  SlStatCardStatus,
  SlStatCardTrend,
  SlStatCardUnit,
} from './stat-card-parts';
import { SlStatCardValue } from './stat-card-value';
import { provideStatCardDefaults } from './stat-card-defaults';
import { toneOf, trendOf } from './stat-card.constants';

@Component({
  imports: [
    SlSparkline,
    SlStatCard,
    SlStatCardAction,
    SlStatCardComparison,
    SlStatCardDelta,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardMessage,
    SlStatCardPeriod,
    SlStatCardStatus,
    SlStatCardTrend,
    SlStatCardUnit,
    SlStatCardValue,
  ],
  template: `<div
    slStatCard
    [delta]="delta()"
    [goodWhen]="goodWhen()"
    [tone]="tone()"
    [attention]="attention()"
    [status]="status()"
    [loading]="loading()"
    [size]="size()"
    [locale]="locale()"
    [messages]="messages()"
  >
    <div slStatCardHeader>
      <span slStatCardLabel>Monthly recurring revenue</span>
      <span slStatCardStatus>Live</span>
      <span slStatCardAction><a href="#details">Details</a></span>
    </div>
    <div slStatCardFigure>
      <span slStatCardValue [value]="48200" [formatOptions]="{ notation: 'compact' }"
        ><span slStatCardUnit>K</span></span
      >
      <span slStatCardDelta></span>
      <span slStatCardDelta [value]="-32" format="decimal"></span>
      <p slStatCardComparison>from $42.9K <span slStatCardPeriod>vs. previous month</span></p>
    </div>
    <div slStatCardTrend><span slSparkline [data]="[12, 14, 30]"></span></div>
    <p slStatCardMessage>No data for this period yet.</p>
  </div>`,
})
class TestHost {
  readonly delta = signal<number | undefined>(0.124);
  readonly goodWhen = signal<'up' | 'down' | 'none' | undefined>(undefined);
  readonly tone = signal<'warning' | undefined>(undefined);
  readonly attention = signal<'warning' | 'danger' | undefined>(undefined);
  readonly status = signal<'ready' | 'empty' | 'error'>('ready');
  readonly loading = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly locale = signal<string | undefined>('en-US');
  readonly messages = signal<{ up?: string } | undefined>(undefined);
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="stat-card"]') as HTMLElement;
  const part = (name: string) => root.querySelector(`[data-part="${name}"]`) as HTMLElement | null;
  const parts = (name: string) => root.querySelectorAll(`[data-part="${name}"]`);
  return { fixture, host: fixture.componentInstance, root, part, parts };
}

describe('SlStatCard', () => {
  it('is a group named by its label, with its body one element in', () => {
    const { root, part } = mount();

    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-labelledby')).toBe(part('label')?.id);
    expect(part('label')?.id).toMatch(/^slotted-stat-card-label-/);
    expect(root.firstElementChild?.getAttribute('data-part')).toBe('body');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-fill')).toBe('outline');
    expect(root.getAttribute('data-layout')).toBe('inline');
    expect(root.getAttribute('data-status')).toBe('ready');
    expect(root.getAttribute('data-good-when')).toBe('up');
    for (const name of [
      'header',
      'status',
      'action',
      'figure',
      'value',
      'unit',
      'delta',
      'indicator',
      'comparison',
      'period',
      'trend',
    ]) {
      expect(part(name), name).not.toBeNull();
    }
  });

  it('derives the tone from goodWhen and the sign, never from the sign alone', () => {
    const { fixture, host, root, part } = mount();
    const glyphOf = (indicator: Element | null) =>
      indicator?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(root.getAttribute('data-tone')).toBe('success');
    expect(part('delta')?.getAttribute('data-tone')).toBe('success');
    expect(part('delta')?.getAttribute('data-trend')).toBe('up');
    expect(glyphOf(part('indicator'))).toBe('trending-up');

    host.goodWhen.set('down');
    fixture.detectChanges();
    expect(root.getAttribute('data-tone')).toBe('danger');

    host.delta.set(-0.03);
    fixture.detectChanges();
    expect(root.getAttribute('data-tone')).toBe('success');
    expect(part('delta')?.getAttribute('data-trend')).toBe('down');
    /* One glyph for a rise and a fall, which the sheet turns over. */
    expect(glyphOf(part('indicator'))).toBe('trending-up');

    host.delta.set(0);
    fixture.detectChanges();
    expect(root.getAttribute('data-tone')).toBe('neutral');
    expect(part('delta')?.getAttribute('data-trend')).toBe('flat');
    expect(glyphOf(part('indicator'))).toBe('minus');

    host.delta.set(undefined);
    fixture.detectChanges();
    expect(root.hasAttribute('data-tone')).toBe(false);

    host.tone.set('warning');
    fixture.detectChanges();
    expect(root.getAttribute('data-tone')).toBe('warning');
  });

  it('writes attention on a ready value, and leaves the delta its own tone', () => {
    const { fixture, host, root, part } = mount();
    expect(root.hasAttribute('data-attention')).toBe(false);

    host.attention.set('danger');
    fixture.detectChanges();
    expect(root.getAttribute('data-attention')).toBe('danger');
    expect(part('delta')?.getAttribute('data-tone')).toBe('success');

    host.loading.set(true);
    fixture.detectChanges();
    expect(root.hasAttribute('data-attention')).toBe(false);

    host.loading.set(false);
    host.status.set('error');
    fixture.detectChanges();
    expect(root.hasAttribute('data-attention')).toBe(false);
  });

  it('reads the delta as a signed percentage with the direction said before it, and a second delta on its own', () => {
    const { parts, part } = mount();

    const [first, second] = parts('delta');
    expect(first?.textContent?.replace(/\s+/g, ' ').trim()).toBe('up +12.4%');
    expect(second?.textContent?.replace(/\s+/g, ' ').trim()).toBe('down -32');
    expect(part('indicator')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('formats a numeric value with the card locale and keeps the unit after it', () => {
    const { part } = mount();

    expect(part('value')?.textContent?.replace(/\s+/g, '')).toBe('48KK');
  });

  it.each([
    ['pt-BR', 'BRL', ['R$', ',88']],
    ['de-DE', 'EUR', [',88', '€']],
  ])(
    'draws the symbol and the decimals of a %s currency as units under emphasis whole',
    (locale, currency, units) => {
      const options = { style: 'currency', currency } as const;
      @Component({
        imports: [SlStatCard, SlStatCardFigure, SlStatCardValue],
        template: `<div slStatCard [locale]="locale">
          <div slStatCardFigure>
            <span
              slStatCardValue
              emphasis="whole"
              [formatOptions]="options"
              [value]="1999.88"
            ></span>
          </div>
        </div>`,
      })
      class Whole {
        readonly locale = locale;
        readonly options = options;
      }
      TestBed.configureTestingModule({ imports: [Whole] });
      const fixture = TestBed.createComponent(Whole);
      fixture.detectChanges();
      const value = fixture.nativeElement.querySelector('[data-part="value"]') as HTMLElement;

      expect(
        [...value.querySelectorAll('[data-part-unit]')].map((unit) => unit.textContent),
      ).toEqual(units);
      const whole = [...value.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
      expect(whole.map((node) => node.textContent).join('')).toContain('1.999');
      expect(value.textContent).toBe(new Intl.NumberFormat(locale, options).format(1999.88));
    },
  );

  it('keeps its place with a dash and a message when the value is missing or failed', () => {
    const { fixture, host, root, part } = mount();
    host.status.set('empty');
    fixture.detectChanges();

    expect(root.getAttribute('data-status')).toBe('empty');
    expect(part('value')?.textContent?.trim()).toBe('—');
    expect(part('delta')?.hasAttribute('hidden')).toBe(true);
    expect(part('trend')?.hasAttribute('hidden')).toBe(true);
    expect(part('comparison')?.hasAttribute('hidden')).toBe(true);
    expect(part('message')?.hasAttribute('hidden')).toBe(false);

    host.status.set('ready');
    fixture.detectChanges();
    expect(part('message')?.hasAttribute('hidden')).toBe(true);
    expect(part('delta')?.hasAttribute('hidden')).toBe(false);
  });

  it('stands every part in with a placeholder while loading', () => {
    const { fixture, host, root, part } = mount();
    host.loading.set(true);
    fixture.detectChanges();

    expect(root.hasAttribute('data-loading')).toBe(true);
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(part('value')?.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(part('value')?.textContent).not.toContain('48');
    expect(part('delta')?.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(part('comparison')?.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(part('trend')?.querySelector('[data-ui="skeleton"][data-shape="block"]')).not.toBeNull();
    expect(part('message')?.hasAttribute('hidden')).toBe(true);
  });

  it('takes its defaults from the token, and an explicit input wins', () => {
    const { fixture, host, root, part } = mount([
      provideStatCardDefaults({ fill: 'subtle', goodWhen: 'down', size: 'sm' }),
    ]);

    expect(root.getAttribute('data-fill')).toBe('subtle');
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.getAttribute('data-tone')).toBe('danger');
    expect(part('delta')?.textContent).toContain('up');

    host.messages.set({ up: 'subiu' });
    fixture.detectChanges();
    expect(part('delta')?.textContent).toContain('subiu');

    host.size.set('lg');
    host.goodWhen.set('up');
    fixture.detectChanges();
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-tone')).toBe('success');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { fixture, host, part } = mount([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    host.locale.set(undefined);
    fixture.detectChanges();
    expect(part('delta')?.textContent).toContain('alta +12,4%');

    locale.set('en-US');
    fixture.detectChanges();
    expect(part('delta')?.textContent).toContain('up +12.4%');
  });

  it('keeps an id and an aria-label the consumer wrote', () => {
    @Component({
      imports: [SlStatCard, SlStatCardLabel],
      template: `<div slStatCard aria-label="Own words">
        <span slStatCardLabel id="mrr">MRR</span>
      </div>`,
    })
    class Own {}
    TestBed.configureTestingModule({ imports: [Own] });
    const fixture = TestBed.createComponent(Own);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="stat-card"]') as HTMLElement;

    expect(root.getAttribute('aria-label')).toBe('Own words');
    expect(root.hasAttribute('aria-labelledby')).toBe(false);
    expect(root.querySelector('[data-part="label"]')?.id).toBe('mrr');
  });

  it('exposes the two derivations for a consumer formatting its own delta', () => {
    expect(trendOf(3)).toBe('up');
    expect(trendOf(0)).toBe('flat');
    expect(toneOf('down', 'down')).toBe('success');
    expect(toneOf('up', 'none')).toBe('neutral');
  });
});

describe('SlStatCardTrend', () => {
  const sparkline = (root: HTMLElement) =>
    root.querySelector('[data-ui="sparkline"]') as HTMLElement;

  it('smooths and washes a line unless the application says otherwise', () => {
    const { part } = mount();
    const line = sparkline(part('trend')!);

    expect(line.getAttribute('data-curve')).toBe('monotone');
    expect(line.querySelector('[data-part="area"]')).not.toBeNull();
  });

  it('leaves the application its own sparkline defaults', () => {
    const { part } = mount([provideSparklineDefaults({ curve: 'linear', area: false })]);
    const line = sparkline(part('trend')!);

    expect(line.getAttribute('data-curve')).toBe('linear');
    expect(line.querySelector('[data-part="area"]')).toBeNull();
  });
});
