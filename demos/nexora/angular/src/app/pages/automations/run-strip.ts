import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { injectLocale } from '@slotted/angular/i18n';
import { SlText } from '@slotted/angular/typography';

import { phoneSignal } from '../../core/layout/phone';
import type { WorkflowInsight } from '@slotted/demo-nexora-backend';

type Day = WorkflowInsight['days'][number];
const OUTCOMES = [
  { key: 'failed', label: 'failed', tone: 'danger' },
  { key: 'partially_failed', label: 'partly failed', tone: 'warning' },
  { key: 'succeeded', label: 'succeeded', tone: 'success' },
  { key: 'skipped', label: 'skipped', tone: 'secondary' },
] as const;

/**
 * Fourteen days of runs as one strip: a column per day, its runs stacked by
 * outcome, the failures on top where the eye lands first. Every column is a
 * button that says its day and its counts in words and opens that day in the
 * history. A chart would draw the same bars with an axis, a legend layer and
 * an engine for a forty-pixel strip; the strip is the screen's own (CP-04),
 * painted with the tone tokens the run marks use.
 */
@Component({
  selector: 'app-run-strip',
  imports: [SlText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      gap: var(--slotted-space-2);
    }
    .days {
      display: grid;
      grid-template-columns: repeat(14, minmax(0, 1fr));
      align-items: end;
      gap: var(--slotted-space-1);
      block-size: var(--slotted-space-12);
      /* The baseline every day stands on: a day with no run is the baseline alone. */
      border-block-end: var(--slotted-border-width-thin) solid var(--slotted-border-strong);
    }
    .column {
      display: flex;
      flex-direction: column-reverse;
      justify-content: flex-start;
      block-size: 100%;
      min-inline-size: 0;
      padding: 0;
      border: 0;
      border-radius: var(--slotted-radius-xs) var(--slotted-radius-xs) 0 0;
      background: transparent;
      overflow: hidden;
    }
    button.column:hover {
      background: var(--slotted-surface-sunken);
    }
    button.column {
      cursor: pointer;
    }
    button:focus-visible {
      outline: var(--slotted-focus-ring-width) solid var(--slotted-focus-ring-color);
      outline-offset: var(--slotted-focus-ring-offset);
    }
    button[aria-pressed='true'] {
      outline: var(--slotted-border-width-thick) solid var(--slotted-tone-accent-solid);
    }
    .column > span {
      display: block;
      flex: none;
    }
    [data-tone='danger'] {
      background: var(--slotted-tone-danger-solid);
    }
    [data-tone='warning'] {
      background: var(--slotted-tone-warning-solid);
    }
    [data-tone='success'] {
      background: var(--slotted-tone-success-solid);
    }
    [data-tone='secondary'] {
      background: var(--slotted-tone-secondary-border);
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--slotted-space-1) var(--slotted-space-4);
      align-items: center;
    }
    .swatch {
      display: inline-block;
      inline-size: var(--slotted-space-2);
      block-size: var(--slotted-space-2);
      border-radius: var(--slotted-radius-xs);
      margin-inline-end: var(--slotted-space-1);
    }
    .ends {
      display: flex;
      justify-content: space-between;
    }
  `,
  template: `
    <div class="days" role="group" [attr.aria-label]="'Runs per day, ' + range()" data-testid="run-strip">
      @for (day of days(); track day.date) {
        <!-- Under a finger a column is narrower than a touch target: it is read, and the day is the bar's date pill. -->
        @if (coarse() || !interactive()) {
          <span class="column" role="img" [attr.aria-label]="dayWords(day)" [title]="dayWords(day)">
            @for (outcome of outcomes; track outcome.key) {
              @if (day[outcome.key] > 0) {
                <span [attr.data-tone]="outcome.tone" [style.block-size.%]="height(day[outcome.key])"></span>
              }
            }
          </span>
        } @else {
          <button
            class="column"
            type="button"
            [attr.aria-label]="dayWords(day)"
            [attr.aria-pressed]="selected() === day.date"
            [title]="dayWords(day)"
            [attr.data-date]="day.date"
            (click)="pick.emit(selected() === day.date ? null : day.date)"
          >
            @for (outcome of outcomes; track outcome.key) {
              @if (day[outcome.key] > 0) {
                <span [attr.data-tone]="outcome.tone" [style.block-size.%]="height(day[outcome.key])"></span>
              }
            }
          </button>
        }
      }
    </div>
    <div class="ends" aria-hidden="true">
      <span slText size="sm" tone="muted">{{ first() }}</span>
      <span slText size="sm" tone="muted">{{ last() }}</span>
    </div>
    <div class="legend">
      @for (entry of legend(); track entry.key) {
        <span slText size="sm" tone="muted"
          ><span class="swatch" aria-hidden="true" [attr.data-tone]="entry.tone"></span>{{ entry.count }} {{ entry.label }}</span
        >
      }
      @if (totals().failed + totals().partially_failed === 0) {
        <span slText size="sm" tone="muted">No failure</span>
      }
    </div>
  `,
})
export class RunStrip {
  private readonly locale = injectLocale();

  readonly days = input.required<readonly Day[]>();
  /** The day the history is narrowed to, if any. */
  readonly selected = input<string | null>(null);
  /** False where a day opens nothing. */
  readonly interactive = input(true);
  readonly pick = output<string | null>();
  readonly coarse = phoneSignal('(pointer: coarse)');

  readonly outcomes = OUTCOMES;
  /** The busiest day fills the strip's height; every other day is measured against it. */
  readonly peak = computed(() =>
    Math.max(1, ...this.days().map((day) => day.succeeded + day.partially_failed + day.failed + day.skipped)),
  );
  readonly totals = computed(() => {
    const totals = { failed: 0, partially_failed: 0, succeeded: 0, skipped: 0 };
    for (const day of this.days()) for (const outcome of OUTCOMES) totals[outcome.key] += day[outcome.key];
    return totals;
  });

  /** The outcomes the fourteen days hold, failures first; an outcome with no run is not listed. */
  readonly legend = computed(() =>
    OUTCOMES.filter((outcome) => this.totals()[outcome.key] > 0).map((outcome) => ({
      ...outcome,
      count: this.count(this.totals()[outcome.key]),
    })),
  );

  readonly first = computed(() => this.date(this.days()[0]?.date));
  readonly last = computed(() => this.date(this.days().at(-1)?.date));
  readonly range = computed(() => `${this.first()} to ${this.last()}`);

  height(count: number): number {
    return Math.max(8, (count / this.peak()) * 100);
  }

  count(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }

  date(value: string | undefined): string {
    if (!value) return '';
    return new Intl.DateTimeFormat(this.locale(), { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  }

  dayWords(day: Day): string {
    const total = day.succeeded + day.partially_failed + day.failed + day.skipped;
    if (total === 0) return `${this.date(day.date)}: no run`;
    const parts = OUTCOMES.filter((outcome) => day[outcome.key] > 0).map((outcome) => `${day[outcome.key]} ${outcome.label}`);
    return `${this.date(day.date)}: ${total} ${total === 1 ? 'run' : 'runs'} — ${parts.join(', ')}`;
  }
}
