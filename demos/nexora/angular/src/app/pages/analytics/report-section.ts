import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlButton } from '@slotted/angular/button';
import { SlChart } from '@slotted/angular/chart';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableEmpty,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSummary,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import type { ChartAnnotation, ChartNumberFormat, ChartPoint, ChartRecord, ChartSeries } from '@slotted/core/chart';
import type { ReportAnswer, ReportGrain, ReportRow, ReportTable, ReportValue } from '@slotted/demo-nexora-backend';

import {
  AXIS_LABEL,
  bucketLabel,
  dateWords,
  doorLink,
  formatValue,
  LIST_PERMISSION,
  plotted,
  RECORDS_WORD,
  type DoorLink,
  type ReportUnit,
} from '../../core/analytics/report.model';
import { SessionStore } from '../../core/session/session.store';
import type { ColumnSpec, SectionSpec } from './report-specs';

/** One cell as the table draws it: the words, and the list it opens where the reader may open it. */
interface Cell {
  readonly text: string;
  readonly link: DoorLink | null;
  readonly missing: boolean;
}

interface Line {
  readonly key: string;
  readonly label: string;
  readonly cells: readonly Cell[];
}

const AXIS_FORMAT: Record<ReportUnit, ChartNumberFormat> = {
  usd: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 },
  count: { maximumFractionDigits: 0 },
  share: { maximumFractionDigits: 1 },
  days: { maximumFractionDigits: 0 },
  minutes: { maximumFractionDigits: 1 },
  score: { maximumFractionDigits: 1 },
  turns: { maximumFractionDigits: 1 },
  cubic: { maximumFractionDigits: 0 },
};

/**
 * One breakdown of a report: the chart that answers the section's question,
 * the table of the same numbers under it, and the table as a CSV file. Every
 * bar, point and cell opens the list that holds its records, with the
 * condition and the period as the list's pills (OV-01).
 *
 * The section is the plain body of a titled region (OV-05). A ranking of one
 * row is a sentence, not a chart (OV-03). A column the answer does not carry —
 * a margin withheld from the reader — is not drawn (PM-01).
 */
@Component({
  selector: 'app-report-section',
  imports: [
    RouterLink,
    SlButton,
    SlChart,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSkeleton,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableEmpty,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSummary,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* On a finger a cell's link is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
      /* An inline link takes the height of its text: on a finger it is a box a target tall. */
      a.number {
        display: inline-block;
        line-height: var(--slotted-target-comfortable);
      }
    }
    .number {
      font-variant-numeric: tabular-nums;
    }
    .row-shape {
      display: block;
    }
    @media (pointer: coarse) {
      .row-shape {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    <section slSection [attr.data-section]="spec().table">
      <div slSectionHeader>
        <div slSectionTitle><h2 slSectionHeading>{{ spec().title }}</h2></div>
        <div slSectionActions>
          <!-- The file is the table the reader sees, so it says nothing the page withholds. -->
          <button
            slButton
            variant="ghost"
            tone="secondary"
            size="sm"
            type="button"
            [attr.data-testid]="'download-' + spec().table"
            [disabled]="lines().length === 0"
            (click)="download()"
          >
            Download CSV
          </button>
        </div>
      </div>
      <div slSectionBody [attr.aria-busy]="busy() ? 'true' : null">
        <div slStack [gap]="4">
          @if (notKept()) {
            <div slInlineMessage tone="secondary" data-testid="not-kept">
              <span slInlineMessageIcon></span>
              <span slText size="sm">{{ notKeptWords() }}</span>
            </div>
          } @else if (single(); as sentence) {
            <p slText size="sm" data-testid="single">{{ sentence }}</p>
          } @else if (spec().chart) {
            <figure
              slChart
              recordKey="key"
              locale="en-US"
              toolbar="hover"
              selectable
              [attr.data-testid]="'chart-' + spec().table"
              [title]="chartTitle()"
              [description]="chartDescription()"
              [size]="chartSize()"
              [orientation]="spec().chart?.orientation ?? 'vertical'"
              [stackMode]="'normal'"
              [legend]="series().length > 1"
              [texture]="series().length > 1"
              [data]="chartData()"
              [series]="series()"
              [x]="{ field: 'label' }"
              [y]="{ label: axisLabel(), format: axisFormat() }"
              [annotations]="annotations()"
              [loading]="table() === null && !failed()"
              [error]="table() === null && failed()"
              (selectionChange)="openPoint($event)"
              (retry)="retry()()"
            ></figure>
          }
          @if (!notKept()) {
            <div
              slTable
              variant="framed"
              [columns]="columns().length + 1"
              [layout]="phone() ? 'fixed' : 'auto'"
              [attr.data-testid]="'table-' + spec().table"
            >
              <div slTableContent>
                <caption slTableCaption>{{ spec().caption }}</caption>
                <thead slTableHead>
                  <tr slTableRow>
                    <th slTableColumnHeader>{{ spec().rows }}</th>
                    @for (column of columns(); track column.key) {
                      <th slTableColumnHeader align="end" numeric>{{ column.label }}</th>
                    }
                  </tr>
                </thead>
                @if (table() !== null) {
                  @if (lines().length === 0) {
                    <tbody slTableBody>
                      <tr slTableRow>
                        <td slTableEmpty>
                          <div slResultState status="empty" reach="section">
                            <div slResultStateContent>
                              <h3 slResultStateTitle>{{ emptyWords() }}</h3>
                              <p slResultStateDescription>Choose a longer period, or remove a filter.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  } @else {
                    <tbody slTableBody [attr.aria-busy]="busy() ? 'true' : null">
                      @for (line of lines(); track line.key) {
                        <tr slTableRow [attr.data-row]="line.key">
                          <th slTableRowHeader><span class="cell-text" [title]="line.label">{{ line.label }}</span></th>
                          @for (cell of line.cells; track $index) {
                            <td slTableCell align="end" numeric>
                              @if (cell.link; as link) {
                                <a
                                  slLink
                                  class="number"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="link.route"
                                  [queryParams]="link.params"
                                  >{{ cell.text }}</a
                                >
                              } @else {
                                <span class="number" [attr.data-missing]="cell.missing ? 'true' : null">{{ cell.text }}</span>
                              }
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                    @if (totalLine(); as total) {
                      <tfoot slTableSummary>
                        <tr slTableRow>
                          <th slTableRowHeader><span class="cell-text" [title]="total.label">{{ total.label }}</span></th>
                          @for (cell of total.cells; track $index) {
                            <td slTableCell align="end" numeric>
                              @if (cell.link; as link) {
                                <a
                                  slLink
                                  class="number"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="link.route"
                                  [queryParams]="link.params"
                                  >{{ cell.text }}</a
                                >
                              } @else {
                                <span class="number">{{ cell.text }}</span>
                              }
                            </td>
                          }
                        </tr>
                      </tfoot>
                    }
                  }
                } @else if (failed()) {
                  <tbody slTableBody>
                    <tr slTableRow>
                      <td slTableEmpty>
                        <div slResultState status="error" reach="section">
                          <div slResultStateContent>
                            <h3 slResultStateTitle>These numbers did not arrive</h3>
                            <p slResultStateDescription>
                              <button slButton size="sm" type="button" (click)="retry()()">Try again</button>
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                } @else {
                  <tbody slTableBody>
                    @for (row of placeholderRows(); track row) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span class="row-shape"><span slSkeleton shape="text" [inlineSize]="row % 3 === 0 ? '55%' : '70%'"></span></span>
                        </th>
                        @for (column of columns(); track column.key) {
                          <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="4.5rem"></span></td>
                        }
                      </tr>
                    }
                  </tbody>
                  @if (spec().total) {
                    <!-- The summary row the answer adds back up with (RP-07), reserved with its words. -->
                    <tfoot slTableSummary>
                      <tr slTableRow>
                        <th slTableRowHeader><span class="cell-text row-shape">{{ spec().total }}</span></th>
                        @for (column of columns(); track column.key) {
                          <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="4.5rem"></span></td>
                        }
                      </tr>
                    </tfoot>
                  }
                }
              </div>
            </div>
          }
          @if (spec().note && !notKept()) {
            <span slText size="sm" tone="muted">{{ spec().note }}</span>
          }
        </div>
      </div>
    </section>
  `,
})
export class ReportSection {
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);

  readonly spec = input.required<SectionSpec>();
  /** The answer the table belongs to; null before the first one. */
  readonly answer = input.required<ReportAnswer | null>();
  readonly report = input.required<string>();
  readonly busy = input(false);
  readonly failed = input(false);
  readonly phone = input(false);
  /** The rows the wait reserves: the buckets of the period, or the ranking's length. */
  readonly reserve = input(5);
  /** The period's grain, which the title names before the answer arrives. */
  readonly grain = input.required<ReportGrain>();
  readonly retry = input.required<() => void>();

  readonly table = computed<ReportTable | null>(
    () => this.answer()?.tables.find((table) => table.key === this.spec().table) ?? null,
  );

  readonly notKept = computed(() => this.table()?.missing === 'not-kept');

  readonly notKeptWords = computed(() => {
    const answer = this.answer();
    const table = this.table();
    if (!answer || !table) return '';
    const from = answer.coverage[table.records];
    return `Nexora keeps ${RECORDS_WORD[table.records]} from ${from ? dateWords(from) : 'the operational window'} (§75.4), and this period starts ${dateWords(answer.period.from)}. Choose a period that starts then or later to read this breakdown.`;
  });

  /** The columns the answer carries, in the spec's order; on a phone, the ones it keeps. */
  readonly columns = computed<readonly ColumnSpec[]>(() => {
    const table = this.table();
    const spec = this.spec();
    const carried = new Set<string>();
    for (const row of [...(table?.rows ?? []), ...(table?.total ? [table.total] : [])])
      for (const key of Object.keys(row.cells)) carried.add(key);
    // Before the answer the columns are the spec's, less the ones a permission will leave out.
    const known = table === null ? spec.columns.filter((column) => this.session.can('cost.view') || column.key !== 'margin') : spec.columns.filter((column) => carried.has(column.key));
    return this.phone() ? known.filter((column) => spec.phoneColumns.includes(column.key)) : known;
  });

  private rowLabel(row: ReportRow): string {
    const answer = this.answer();
    const labels = this.spec().labels;
    if (labels && labels[row.key]) return labels[row.key] as string;
    if (row.range && answer) return bucketLabel(row.range, answer.grain, this.phone());
    return row.label;
  }

  private cell(value: ReportValue | undefined, unit: ReportUnit): Cell {
    if (!value) return { text: '', link: null, missing: true };
    if (value.missing === 'not-kept') return { text: 'Not kept', link: null, missing: true };
    if (value.value === null) return { text: '—', link: null, missing: true };
    const text = formatValue(value.value, unit);
    const door = value.door;
    const link =
      door && this.session.can(LIST_PERMISSION[door.list]) ? doorLink(door, this.answer()?.labels ?? {}) : null;
    return { text, link, missing: false };
  }

  private line(row: ReportRow): Line {
    return {
      key: row.key,
      label: this.rowLabel(row),
      cells: this.columns().map((column) => this.cell(row.cells[column.key], column.unit)),
    };
  }

  readonly lines = computed<readonly Line[]>(() => (this.table()?.rows ?? []).map((row) => this.line(row)));
  readonly totalLine = computed<Line | null>(() => {
    const total = this.table()?.total;
    return total ? this.line(total) : null;
  });

  readonly placeholderRows = computed(() => Array.from({ length: this.reserve() }, (_, index) => index));

  readonly emptyWords = computed(() => {
    const answer = this.answer();
    return answer ? `Nothing to rank between ${dateWords(answer.period.from)} and ${dateWords(answer.period.to)}` : '';
  });

  /** A ranking of one category compares nothing: its numbers are a sentence (OV-03). */
  readonly single = computed<string | null>(() => {
    const spec = this.spec();
    const table = this.table();
    if (!spec.chart?.orientation || !table) return null;
    const ranked = table.rows.filter((row) => !(spec.chart?.skipRows ?? []).includes(row.key));
    if (ranked.length !== 1) return null;
    const row = ranked[0]!;
    const words = this.columns()
      .map((column) => {
        const value = row.cells[column.key];
        return value && value.value !== null ? `${column.label.toLowerCase()} ${formatValue(value.value, column.unit)}` : null;
      })
      .filter((entry) => entry !== null);
    return `Only ${this.rowLabel(row)} falls in this period: ${words.join(', ')}.`;
  });

  readonly unit = computed<ReportUnit>(() => {
    const first = this.spec().chart?.columns[0];
    return this.spec().columns.find((column) => column.key === first)?.unit ?? 'count';
  });

  readonly axisLabel = computed(() => AXIS_LABEL[this.unit()]);

  /** The measure the chart draws, not the section's question again (OV-05). */
  readonly chartTitle = computed(() => {
    const measure = this.spec().chart?.measure ?? '';
    return this.spec().rows === 'Period' ? `${measure}, by ${this.grain()}` : measure;
  });
  readonly axisFormat = computed(() => AXIS_FORMAT[this.unit()]);

  /** The chart's series: the spec's columns the answer carries, one mark kind each. */
  readonly series = computed<readonly ChartSeries[]>(() => {
    const spec = this.spec();
    const chart = spec.chart;
    if (!chart) return [];
    // Before the answer the columns are the ones the answer will carry, so the legend keeps its line.
    const carried = new Set(this.columns().map((column) => column.key));
    return chart.columns
      .filter((key) => carried.has(key))
      .map((key, index) => {
        const kind = chart.kinds?.[index] ?? 'bar';
        return {
          id: key,
          kind,
          field: key,
          label: spec.columns.find((column) => column.key === key)?.label ?? key,
          ...(chart.stacked ? { stack: 'all' } : {}),
          ...(kind === 'line' ? { markers: 'all' as const, connectNulls: false } : {}),
        };
      });
  });

  readonly chartData = computed<readonly ChartRecord[]>(() => {
    const table = this.table();
    const spec = this.spec();
    if (!table) return [];
    const skip = new Set(spec.chart?.skipRows ?? []);
    return table.rows
      .filter((row) => !skip.has(row.key))
      .slice(0, spec.chart?.limit ?? table.rows.length)
      .map((row) => {
        const record: Record<string, unknown> = { key: row.key, label: this.rowLabel(row) };
        for (const series of this.series()) {
          const value = row.cells[series.field];
          record[series.field] = value && value.value !== null ? plotted(value.value, this.unit()) : null;
        }
        return record;
      });
  });

  /** Decided by the question, not by the answer: the plot keeps its box while it waits (loading-states §3). */
  readonly chartSize = computed(() => {
    if (this.phone()) return 'sm';
    const chart = this.spec().chart;
    return chart?.orientation === 'horizontal' && (chart.limit ?? this.reserve()) > 6 ? 'lg' : 'md';
  });

  /** Known before the answer, so the plot's header keeps its lines: the period is the page's subheading. */
  readonly chartDescription = computed(() => {
    const unit = this.unit();
    const when = this.spec().today ? ', as of today' : '';
    return `${unit === 'usd' ? 'In US dollars' : AXIS_LABEL[unit]}${when}; the table below holds the same numbers, and each bar opens its records`;
  });

  /**
   * The facts the period holds — the day a scenario was loaded, the month's
   * last business day, the day records start being kept — on the bucket that
   * holds each, for a series over time.
   */
  readonly annotations = computed<readonly ChartAnnotation[]>(() => {
    const answer = this.answer();
    const table = this.table();
    if (!answer || !table || this.spec().chart?.orientation) return [];
    const notes: ChartAnnotation[] = [];
    for (const note of answer.annotations) {
      const row = table.rows.find((candidate) => candidate.range && candidate.range.from <= note.date && note.date <= candidate.range.to);
      if (!row) continue;
      notes.push({
        kind: 'line',
        axis: 'x',
        value: row.key,
        label: note.kind === 'month-end' ? `Month end ${dateWords(note.date).replace(/, \d{4}$/, '')}` : note.label,
        tone: note.kind === 'scenario' ? 'warning' : 'neutral',
      });
    }
    return notes;
  });

  /** A bar or a point opens the records of its cell, as its table cell does. */
  openPoint(point: ChartPoint | null): void {
    if (point === null) return;
    const row = this.table()?.rows.find((candidate) => candidate.key === point.key);
    const door = row?.cells[point.series]?.door;
    if (!door || !this.session.can(LIST_PERMISSION[door.list])) return;
    const link = doorLink(door, this.answer()?.labels ?? {});
    void this.router.navigate([link.route], { queryParams: link.params });
  }

  /** The table as the reader sees it, rows and the summary row, one CSV line each. */
  download(): void {
    const answer = this.answer();
    if (!answer) return;
    const quote = (text: string) => (/[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);
    const header = [this.spec().rows, ...this.columns().map((column) => column.label)];
    const body = [...this.lines(), ...(this.totalLine() ? [this.totalLine()!] : [])].map((line) => [
      line.label,
      ...line.cells.map((cell) => cell.text),
    ]);
    const csv = [header, ...body].map((row) => row.map(quote).join(',')).join('\n');
    const blob = new Blob([`${csv}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nexora-${this.report()}-${this.spec().table}-${answer.period.from}-to-${answer.period.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
