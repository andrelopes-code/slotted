import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';
import { injectLocale } from '@slotted/angular/i18n';
import type { WorkflowInsight } from '@slotted/demo-nexora-backend';

interface Bar {
  x: number;
  y: number;
  h: number;
  tone: string;
}
interface Band {
  d: string;
  tone: string;
}

/** The strip's height, and the gap between the two ways out of the decision. */
const HEIGHT = 132;
const GAP = 14;
const BAR = 6;

/**
 * Fourteen days of a workflow as one flow: every event of its trigger on the
 * left, split where the conditions decide — the events let through, the ones
 * dropped — and the ones let through split again by how their run ended.
 * Each band is as thick as the events in it. The three figures over the
 * columns say the same numbers in words, so the drawing is decoration. No
 * family draws a flow split by volume (`chart` has no Sankey series), so the
 * funnel is the screen's own (CP-04).
 */
@Component({
  selector: 'app-run-funnel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      gap: var(--slotted-space-6);
      container-type: inline-size;
    }
    .figures {
      display: grid;
      grid-template-columns: 42fr 33fr 25fr;
      margin: 0;
    }
    .figures > div:last-child {
      text-align: end;
    }
    dt {
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
    }
    dd {
      margin: 0;
      font-size: var(--slotted-font-size-2xl);
      line-height: var(--slotted-line-height-2xl);
      font-weight: var(--slotted-font-weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    dd small {
      margin-inline-start: var(--slotted-space-3);
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
      font-weight: var(--slotted-font-weight-regular);
    }
    small[data-tone='danger'] {
      color: var(--slotted-tone-danger-text);
    }
    .stage {
      position: relative;
    }
    svg {
      display: block;
      overflow: visible;
    }
    rect {
      fill: var(--_tone);
    }
    path {
      fill: var(--_tone);
      fill-opacity: 0.22;
    }
    [data-tone='all'] {
      --_tone: var(--slotted-text-muted);
    }
    [data-tone='success'] {
      --_tone: var(--slotted-tone-success-solid);
    }
    [data-tone='warning'] {
      --_tone: var(--slotted-tone-warning-solid);
    }
    [data-tone='danger'] {
      --_tone: var(--slotted-tone-danger-solid);
    }
    [data-tone='skip'] {
      --_tone: var(--slotted-border-strong);
    }
    .skipped {
      position: absolute;
      transform: translateY(-50%);
      margin: 0;
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
    }
    .skipped b {
      color: var(--slotted-text);
      font-weight: var(--slotted-font-weight-semibold);
    }
    @container (width < 30rem) {
      dd {
        font-size: var(--slotted-font-size-xl);
        line-height: var(--slotted-line-height-xl);
      }
      dd small {
        display: block;
        margin: 0;
      }
    }
  `,
  template: `
    <dl class="figures">
      <div>
        <dt>Events, 14 days</dt>
        <dd>{{ count(totals().events) }}</dd>
      </div>
      <div>
        <dt>Matched the conditions</dt>
        <dd>{{ count(totals().matched) }}<small>{{ percent() }}</small></dd>
      </div>
      <div>
        <dt>Ran to the end</dt>
        <dd>
          {{ count(totals().succeeded) }}
          @if (totals().failed + totals().partial > 0) {
            <small data-tone="danger">{{ count(totals().failed + totals().partial) }} failed</small>
          }
        </dd>
      </div>
    </dl>
    <div class="stage" aria-hidden="true">
      @if (width() > 0) {
        <svg [attr.width]="width()" [attr.height]="height">
          @for (band of geometry().bands; track $index) {
            <path [attr.d]="band.d" [attr.data-tone]="band.tone" />
          }
          @for (bar of geometry().bars; track $index) {
            <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="barWidth" [attr.height]="bar.h" [attr.data-tone]="bar.tone" rx="1" />
          }
        </svg>
        @if (geometry().skipAt; as at) {
          <p class="skipped" [style.left.px]="at.x" [style.top.px]="at.y"><b>{{ count(totals().events - totals().matched) }}</b> skipped: the conditions did not match</p>
        }
      }
    </div>
  `,
})
export class RunFunnel {
  private readonly locale = injectLocale();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly insight = input.required<WorkflowInsight>();

  readonly width = signal(0);
  readonly height = HEIGHT;
  readonly barWidth = BAR;

  readonly totals = computed(() => {
    const data = this.insight();
    const sum = (key: 'succeeded' | 'partially_failed' | 'failed') => data.days.reduce((total, day) => total + day[key], 0);
    return { events: data.events, matched: data.matched, succeeded: sum('succeeded'), partial: sum('partially_failed'), failed: sum('failed') };
  });
  readonly percent = computed(() => {
    const { events, matched } = this.totals();
    return events === 0 ? '' : new Intl.NumberFormat(this.locale(), { style: 'percent', maximumFractionDigits: 1 }).format(matched / events);
  });

  readonly geometry = computed(() => {
    const width = this.width();
    const { events, matched, succeeded, partial, failed } = this.totals();
    const bars: Bar[] = [];
    const bands: Band[] = [];
    if (width === 0 || events === 0) return { bars, bands, skipAt: null };
    const skipped = events - matched;
    const room = HEIGHT - (matched > 0 && skipped > 0 ? GAP : 0);
    /** A share of the room, never thinner than a band the eye can follow where there is anything in it. */
    const span = (part: number, whole: number, of: number, least: number) => (part === 0 ? 0 : Math.max(least, (part / whole) * of));
    const matchedHeight = Math.min(span(matched, events, room, 10), skipped > 0 ? room - 10 : room);
    const skippedHeight = skipped === 0 ? 0 : room - matchedHeight;
    const middle = Math.round(width * 0.42) - BAR / 2;
    const end = width - BAR;
    const ribbon = (xa: number, ya: number, xb: number, yb: number, h: number, hb = h) => {
      const xm = (xa + xb) / 2;
      return `M${xa} ${ya}C${xm} ${ya} ${xm} ${yb} ${xb} ${yb}L${xb} ${yb + hb}C${xm} ${yb + hb} ${xm} ${ya + h} ${xa} ${ya + h}Z`;
    };

    bars.push({ x: 0, y: 0, h: matchedHeight + skippedHeight, tone: 'all' });
    if (matchedHeight > 0) {
      bars.push({ x: middle, y: 0, h: matchedHeight, tone: 'success' });
      bands.push({ d: ribbon(BAR, 0, middle, 0, matchedHeight), tone: 'success' });
    }
    let skipAt: { x: number; y: number } | null = null;
    if (skippedHeight > 0) {
      const top = matchedHeight > 0 ? matchedHeight + GAP : 0;
      bars.push({ x: middle, y: top, h: skippedHeight, tone: 'skip' });
      bands.push({ d: ribbon(BAR, matchedHeight, middle, top, skippedHeight), tone: 'skip' });
      skipAt = { x: middle + BAR + 12, y: top + skippedHeight / 2 };
    }
    // The events let through, by how their run ended.
    let y = 0;
    let from = 0;
    const ended = succeeded + partial + failed;
    for (const [part, tone] of [
      [succeeded, 'success'],
      [partial, 'warning'],
      [failed, 'danger'],
    ] as const) {
      if (part === 0 || ended === 0) continue;
      const h = span(part, ended, matchedHeight, 4);
      bars.push({ x: end, y, h, tone });
      bands.push({ d: ribbon(middle + BAR, from, end, y, h), tone });
      from += h;
      y += h + 2;
    }
    return { bars, bands, skipAt };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.host.nativeElement;
      this.width.set(Math.floor(element.getBoundingClientRect().width));
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.width.set(Math.floor(element.getBoundingClientRect().width)));
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  count(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }
}
