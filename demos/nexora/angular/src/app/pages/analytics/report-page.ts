import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderControls,
  SlPageHeaderPin,
  SlPageHeaderToggle,
  SlPageHeaderHeading,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardAction,
  SlStatCardComparison,
  SlStatCardDelta,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardMessage,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlTooltip, SlTooltipContent, SlTooltipLayer, SlTooltipTrigger } from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';
import type { ReportAnomaly, ReportGrain, ReportKey } from '@slotted/demo-nexora-backend';
import { map } from 'rxjs';

import { PeriodMemory } from '../../core/analytics/period-memory';
import {
  bucketLabel,
  change,
  changeWords,
  choiceParams,
  COMPARISONS,
  comparisonWords,
  dateWords,
  doorLink,
  FILTER_LABEL,
  formatValue,
  holderWords,
  LIST_PERMISSION,
  offeredPeriods,
  periodOf,
  periodRange,
  rangeWords,
  readChoice,
  RECORDS_WORD,
  reportQuery,
  type DoorLink,
  type PeriodKey,
  type ReportChoice,
  type ReportComparison,
  type ReportFilterKey,
  type ReportUnit,
} from '../../core/analytics/report.model';
import { ReportStore } from '../../core/analytics/report.store';
import { invoiceDoorParams } from '../../core/finance/finance.model';
import {
  OVERDUE_DANGER_SHARE,
  OVERDUE_WARNING_SHARE,
  overdueShare,
  overdueTone,
} from '../../core/finance/finance-overview.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { REPORT_SPECS, type FigureSpec, type ReportSpec } from './report-specs';
import { ReportSection } from './report-section';

/** One figure as a card at the desk and as a row on a phone (OV-02). */
interface Figure {
  readonly key: string;
  readonly label: string;
  /** The number in its unit; null before the answer. */
  readonly value: string | null;
  /** Why there is no number, said in the card's message line. */
  readonly message: string | null;
  readonly status: 'ready' | 'empty' | 'error';
  /** The change against the comparison, with its sign, and how the card reads it. */
  readonly delta: { value: number; format: 'percent' | 'decimal'; suffix: string } | null;
  readonly goodWhen: 'up' | 'down' | 'none';
  /** One line under the number: the base the change is read against, or the records counted. */
  readonly comparison: string;
  /** The row's second line on a phone. */
  readonly description: string;
  readonly door: DoorLink | null;
  /** A threshold crossed, said in the comparison line (OV-04). */
  readonly tone?: 'warning' | 'danger';
}

/** What a permission withholds from a report, in the words the page says it with (PM-02). */
const PART_WORDS: Record<string, string> = {
  revenue: 'invoiced revenue',
  grossMargin: 'gross margin',
  margin: 'margins',
  orders: 'bookings',
  inventoryValue: 'inventory value',
  inventory: 'every stock figure',
  valuation: 'stock values and turns',
  stockouts: 'orders short of stock',
  service: 'service levels',
  tickets: 'every ticket figure',
  conversion: 'quote conversion',
  purchaseOrders: 'every purchase order figure',
  spend: 'spend and price variance',
  invoicing: 'invoicing',
  collections: 'collections and payment methods',
  receivables: 'the book of receivables',
  backlog: 'today’s backlog',
};

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const plural = (count: number, [one, many]: readonly [string, string]) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;

/** A compact base for a one-line comparison: "$15.2M", "1,645", "36.1%". */
function compact(value: number, unit: ReportUnit): string {
  if (unit === 'usd')
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value / 100);
  return formatValue(value, unit);
}

/** How a change is drawn: a share moves by points, a duration by its own unit, an amount by a fraction. */
function deltaOf(spec: FigureSpec, now: number | null, before: number | null | undefined): Figure['delta'] {
  const found = change({ value: now, previous: before === undefined ? undefined : { value: before } }, spec.unit);
  if (!found) return null;
  if (found.kind === 'relative') return { value: found.value, format: 'percent', suffix: '' };
  switch (spec.unit) {
    case 'share':
      return { value: found.value / 100, format: 'decimal', suffix: ' pts' };
    case 'minutes':
      return { value: Math.round((found.value / 60) * 10) / 10, format: 'decimal', suffix: ' h' };
    case 'days':
      return { value: found.value, format: 'decimal', suffix: found.value === 1 || found.value === -1 ? ' day' : ' days' };
    default:
      return { value: Math.round(found.value * 10) / 10, format: 'decimal', suffix: '' };
  }
}

/**
 * A report of §16 over a period and against another (§72's definitions, in US
 * dollars, §72.1). One page draws the six: the report is the route's, and its
 * figures, questions and columns are `REPORT_SPECS`.
 *
 * The period, its comparison and the segment filters are the address, so a
 * report is a link a colleague can paste and the back gesture returns to the
 * period it left; a report opened with no period takes the one last chosen on
 * any report. A period the report's records are not kept for is not offered
 * (§75.4). Changing it keeps the numbers on screen and marks them busy until
 * the answer (AF-02, AF-07), and moves no box (CP-08).
 *
 * At the desk the figures are cards, each with its change and its base and a
 * door to the list it counts (OV-01); then what needs attention, by a rule the
 * page states; then one section per question, a chart over the table of the
 * same numbers. On a phone the figures are a list of doors, then what needs
 * attention, then the sections (OV-02).
 */
@Component({
  selector: 'app-report-page',
  imports: [
    NgIcon,
    NgTemplateOutlet,
    RouterLink,
    ReportSection,
    SlButton,
    SlField,
    SlFieldLabel,
    SlGrid,
    SlIconButton,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderControls,
    SlPageHeaderPin,
    SlPageHeaderToggle,
    SlPageHeaderHeading,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlSkeleton,
    SlStack,
    SlStatCard,
    SlStatCardAction,
    SlStatCardComparison,
    SlStatCardDelta,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardMessage,
    SlStatCardValue,
    SlText,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  providers: [ReportStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .report {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .period {
      container-type: inline-size;
    }
    .controls {
      display: grid;
      /* literal: a select's floor beside its label; two of them share a phone's line */
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 11rem), 1fr));
      align-items: start;
      gap: var(--slotted-space-3) var(--slotted-space-4);
    }
    /* literal: below the compact size class two controls share a line */
    @container (width < 600px) {
      .controls {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .sections {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    /* literal: the expanded size class (EXPANDED_FROM in @slotted/core/measure), where two sections fit */
    @container (width >= 1024px) {
      .sections {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .sections > .wide {
        grid-column: 1 / -1;
      }
    }
    /* One line whatever the period says, cut and read whole from its title (CP-08). */
    .one-line {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .value-shape {
      display: block;
    }
    .warning {
      color: var(--slotted-tone-warning-text);
    }
    .danger {
      color: var(--slotted-tone-danger-text);
    }
  `,
  template: `
    <div slPage>
      <!-- On a phone the figures come first (OV-02): the filters wait behind the header's toggle, and the subheading says the period. -->
      <header slPageHeader [(expanded)]="headerOpen">
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>{{ spec().title }}</h1>
              <p slPageHeaderSubheading>
                <span class="one-line" [title]="subheading()" data-testid="period-words">{{ subheading() }}</span>
              </p>
            </div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="Report actions" overflow="menu">
                <!-- Another actor writes the records while the report is open (AF-07): the read keeps the values and marks the page busy. -->
                <div slToolbarItem [slToolbarItemCounterpart]="refreshItem">
                  <ng-container slTooltip openOn="hover" side="bottom">
                    <button
                      slIconButton
                      slTooltipTrigger
                      variant="ghost"
                      tone="secondary"
                      type="button"
                      aria-label="Refresh"
                      data-testid="refresh"
                      [loading]="refreshing()"
                      [messages]="{ loading: 'Refreshing' }"
                      (click)="refresh()"
                    >
                      <ng-icon name="lucideRefreshCw" />
                    </button>
                    <ng-template slTooltipLayer><div slTooltipContent>Refresh</div></ng-template>
                  </ng-container>
                </div>
                <sl-toolbar-overflow />
              </div>
            </div>
          </div>
        </div>
        <!-- The period and the segments are the header's filters (page-header 'content'): pinned, they stay over a long report. -->
        <div slPageHeaderArea aria-label="Period and filters">
          <div slPageHeaderContent>
          <div class="period" slStack [gap]="2">
            <div class="controls" data-testid="controls">
              <div slField>
                <label slFieldLabel>Period</label>
                <sl-select name="period" data-testid="period" [value]="choice().period" (valueChangeRequest)="choosePeriod($event.value)">
                  @for (option of periods(); track option.key) {
                    <sl-select-item [value]="option.key">{{ option.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
              <div slField>
                <label slFieldLabel>Compared with</label>
                <sl-select name="compare" data-testid="compare" [value]="choice().compare" (valueChangeRequest)="chooseComparison($event.value)">
                  @for (option of comparisons; track option.key) {
                    <sl-select-item [value]="option.key">{{ option.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
              @for (filter of filters(); track filter.key) {
                <div slField>
                  <label slFieldLabel>{{ filter.label }}</label>
                  <sl-select
                    [name]="filter.key"
                    [attr.data-testid]="'filter-' + filter.key"
                    [value]="choice().filters[filter.key] ?? 'all'"
                    (valueChangeRequest)="chooseFilter(filter.key, $event.value)"
                  >
                    <sl-select-item value="all">{{ filter.all }}</sl-select-item>
                    @for (option of filter.options; track option.value) {
                      <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                    }
                  </sl-select>
                </div>
              }
            </div>
            <!-- Known once the first answer arrives: one line, reserved before it and cut after it (CP-08). -->
            <span slText size="sm" tone="muted" data-testid="coverage">
              @if (coverageWords(); as words) {
                <span class="one-line" [title]="words">{{ words }}</span>
              } @else if (!neverAnswered()) {
                <span class="value-shape"><span slSkeleton shape="text" inlineSize="60%"></span></span>
              } @else {
                <span class="value-shape">&nbsp;</span>
              }
            </span>
          </div>
          </div>
        </div>
        <div slPageHeaderControls>
          <button slPageHeaderToggle type="button"></button>
          <button slPageHeaderPin type="button"></button>
        </div>
      </header>

      <div slPageBody>
        <div class="report" [attr.aria-busy]="busy() ? 'true' : null">
          @if (withheldWords(); as words) {
            <div slInlineMessage tone="secondary" data-testid="withheld">
              <span slInlineMessageIcon></span>
              <span slText size="sm">{{ words }}</span>
            </div>
          }

          @if (neverAnswered()) {
            <!-- No answer and the read failed: nothing is drawn as a zero that is not true (§77.10). -->
            <div slResultState status="error" reach="section" data-testid="report-failed">
              <div slResultStateContent>
                <h2 slResultStateTitle>The report did not arrive</h2>
                <p slResultStateDescription>Nexora did not answer. Nothing is shown rather than numbers that are not true.</p>
              </div>
              <div slResultStateActions>
                <button slButton type="button" data-testid="report-retry" [loading]="store.answer().pending" [messages]="{ loading: 'Asking again' }" (click)="retry()">
                  Try again
                </button>
              </div>
            </div>
          } @else {
            <div slStack [gap]="3">
              @if (phone()) {
                <ul slList variant="ruled" [attr.aria-label]="spec().title + ' figures'" data-testid="figures">
                  @for (figure of figures(); track figure.key) {
                    <li slListItem [attr.data-figure]="figure.key">
                      @if (figure.door; as door) {
                        <a slListItemContent [routerLink]="door.route" [queryParams]="door.params">
                          <ng-container *ngTemplateOutlet="row; context: { $implicit: figure }" />
                        </a>
                      } @else {
                        <span slListItemContent>
                          <ng-container *ngTemplateOutlet="row; context: { $implicit: figure }" />
                        </span>
                      }
                    </li>
                  }
                </ul>
              } @else {
                <div slGrid [columns]="4" minItemWidth="xs" [gap]="4" data-testid="figures">
                  @for (figure of figures(); track figure.key) {
                    <div
                      slStatCard
                      size="sm"
                      [attr.data-figure]="figure.key"
                      [goodWhen]="figure.goodWhen"
                      [delta]="figure.delta?.value"
                      [status]="figure.status"
                      [loading]="figure.value === null && figure.status === 'ready'"
                    >
                      <div slStatCardHeader>
                        <span slStatCardLabel>{{ figure.label }}</span>
                        @if (figure.door; as door) {
                          <span slStatCardAction>
                            <a slLink [routerLink]="door.route" [queryParams]="door.params" [attr.aria-label]="'Open what ' + figure.label.toLowerCase() + ' counts'">Open</a>
                          </span>
                        }
                      </div>
                      <div slStatCardFigure>
                        <span slStatCardValue>{{ figure.value ?? '—' }}</span>
                        @if (figure.delta; as delta) {
                          <span slStatCardDelta [format]="delta.format" [formatOptions]="{ maximumFractionDigits: 1 }">{{ delta.suffix }}</span>
                        }
                        <p slStatCardComparison>
                          <span class="one-line" [class.warning]="figure.tone === 'warning'" [class.danger]="figure.tone === 'danger'" [title]="figure.comparison">{{ figure.comparison }}</span>
                        </p>
                      </div>
                      <!-- One line cut, as the comparison it stands in for, so a row of cards keeps one height (CP-08). -->
                      <p slStatCardMessage><span class="one-line" [title]="figure.message ?? ''">{{ figure.message }}</span></p>
                    </div>
                  }
                </div>
              }
              @if (staleFailure()) {
                <div slInlineMessage tone="warning" data-testid="stale">
                  <span slInlineMessageIcon></span>
                  <span slStack [gap]="1">
                    <span slText size="sm">{{ staleWords() }}</span>
                    <span><button slButton size="sm" variant="outline" tone="secondary" type="button" (click)="retry()">Try again</button></span>
                  </span>
                </div>
              }
              <span slText size="sm" tone="muted" data-testid="figures-rule">{{ figuresRule() }}</span>
            </div>

            <section slSection data-testid="attention">
              <div slSectionHeader>
                <div slSectionTitle><h2 slSectionHeading>What needs attention</h2></div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="3">
                  @if (store.answer().value === null) {
                    <!-- The line the sentence will take, at the sentence's own size. -->
                    <p slText size="sm"><span class="value-shape"><span slSkeleton shape="text" inlineSize="75%"></span></span></p>
                  } @else if (attention().length === 0) {
                    <p slText size="sm" data-testid="attention-none">{{ quietWords() }}</p>
                  } @else {
                    <ul slList variant="ruled" aria-label="What needs attention">
                      @for (item of attention(); track item.key) {
                        <li slListItem [attr.data-anomaly]="item.key">
                          @if (item.door; as door) {
                            <a slListItemContent [routerLink]="door.route" [queryParams]="door.params">
                              <span slListItemBody>
                                <span slListItemLabel>{{ item.label }}</span>
                                <span slListItemDescription>{{ item.description }}</span>
                              </span>
                            </a>
                          } @else {
                            <span slListItemContent>
                              <span slListItemBody>
                                <span slListItemLabel>{{ item.label }}</span>
                                <span slListItemDescription>{{ item.description }}</span>
                              </span>
                            </span>
                          }
                        </li>
                      }
                    </ul>
                  }
                  <span slText size="sm" tone="muted">{{ ruleWords() }}</span>
                </div>
              </div>
            </section>

            <div class="sections">
              @for (section of spec().sections; track section.table; let first = $first) {
                <app-report-section
                  [class.wide]="first || section.columns.length > 2"
                  [spec]="section"
                  [answer]="store.answer().value"
                  [report]="spec().key"
                  [busy]="busy()"
                  [failed]="store.answer().failed"
                  [phone]="phone()"
                  [reserve]="reserveFor(section.table)"
                  [grain]="grain()"
                  [retry]="retryFn"
                />
              }
            </div>
          }
        </div>
      </div>

      <ng-template #row let-figure>
        <span slListItemBody>
          <span slListItemLabel>{{ figure.label }}</span>
          <span slListItemDescription>
            <span class="one-line" [class.warning]="figure.tone === 'warning'" [class.danger]="figure.tone === 'danger'">{{ figure.message ?? figure.description }}</span>
          </span>
        </span>
        <span slListItemEnd>
          @if (figure.value === null && figure.status === 'ready') {
            <span class="value-shape"><span slSkeleton shape="text" inlineSize="5rem"></span></span>
          } @else {
            {{ figure.value ?? '—' }}
          }
        </span>
      </ng-template>
      <ng-template #refreshItem><button slMenuItem type="button" (click)="refresh()">Refresh</button></ng-template>
    </div>
  `,
})
export class ReportPage {
  readonly store = inject(ReportStore);
  private readonly session = inject(SessionStore);
  private readonly memory = inject(PeriodMemory);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly phone = phoneSignal();
  readonly headerOpen = signal(true);
  readonly comparisons = COMPARISONS;
  readonly retryFn = (): void => this.retry();

  /** The report is the route's: `/analytics/<key>`. */
  readonly key = computed<ReportKey>(() => String(this.route.snapshot.data['path'] ?? '').split('/').pop() as ReportKey);
  readonly spec = computed<ReportSpec>(() => REPORT_SPECS[this.key()] ?? REPORT_SPECS.executive);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly choice = computed<ReportChoice>(() => readChoice(this.params()));
  private readonly hasPeriod = toSignal(this.route.queryParamMap.pipe(map((params) => params.has('period'))), {
    initialValue: this.route.snapshot.queryParamMap.has('period'),
  });

  readonly today = computed(() => this.session.session()?.demo.today ?? '');

  private readonly can = (permission: string): boolean => {
    void this.session.session();
    return this.session.can(permission);
  };

  /** Numbers on screen while a newer read is on its way (AF-02). */
  readonly busy = computed(() => {
    const answer = this.store.answer();
    return answer.value !== null && answer.pending;
  });
  readonly refreshing = computed(() => this.store.answer().pending || this.store.finance().pending || this.store.support().pending);

  readonly neverAnswered = computed(() => this.store.answer().value === null && this.store.answer().failed);
  readonly staleFailure = computed(
    () =>
      (this.store.answer().value !== null && this.store.answer().failed) ||
      (this.spec().today === 'finance' && this.store.finance().failed) ||
      (this.spec().today === 'support' && this.store.support().failed),
  );

  readonly staleWords = computed(() => {
    const parts: string[] = [];
    if (this.store.answer().value !== null && this.store.answer().failed) parts.push('The report could not be read again; these are the last numbers Nexora gave.');
    if (this.spec().today === 'finance' && this.store.finance().failed)
      parts.push(this.store.finance().value === null ? 'The book of receivables did not arrive; the rest of the report is current.' : 'The book of receivables could not be read again; it shows the last answer.');
    if (this.spec().today === 'support' && this.store.support().failed)
      parts.push('Today’s backlog did not arrive; the rest of the report is current.');
    return parts.join(' ');
  });

  /** The periods offered: those whose first day the report's records are kept from (§75.4). */
  readonly periods = computed(() => {
    const keptFrom = this.store.answer().value?.coverage[this.spec().primary] ?? this.memory.coverage()[this.spec().primary] ?? null;
    const offered = offeredPeriods(this.today(), keptFrom);
    return offered.some((period) => period.key === this.choice().period) ? offered : [...offered, periodOf(this.choice().period)];
  });

  readonly filters = computed(() => {
    const answer = this.store.answer().value;
    return this.spec().filters.map((key) => ({
      key,
      label: FILTER_LABEL[key],
      all: key === 'region' ? 'Every region' : key === 'segment' ? 'Every segment' : key === 'warehouseId' ? 'Every warehouse' : key === 'categoryId' ? 'Every category' : 'Everyone',
      options: answer?.options[key] ?? [],
    }));
  });

  readonly subheading = computed(() => {
    const today = this.today();
    if (!today) return this.spec().question;
    const choice = this.choice();
    const range = periodRange(choice.period, today);
    const against =
      choice.compare === 'none' ? 'no comparison' : choice.compare === 'previous' ? `against the ${periodOf(choice.period).days} days before` : 'against the same weeks a year earlier';
    // The reporting currency is said once, where the report counts money (§72.1).
    const money = this.spec().figures.some((figure) => figure.unit === 'usd') ? ' · amounts in US dollars' : '';
    // A phone's one line keeps the period and its base; the dates are the period's own words.
    if (this.phone())
      return `${periodOf(choice.period).label} · ${choice.compare === 'none' ? 'no comparison' : choice.compare === 'previous' ? 'vs the period before' : 'vs a year earlier'}`;
    return `${periodOf(choice.period).label}, ${rangeWords(range)} · ${against}${money}`;
  });

  readonly coverageWords = computed(() => {
    const answer = this.store.answer().value;
    if (!answer) return null;
    // One sentence: the earliest day each kind of record the report reads is kept from (§75.4).
    const byDate = new Map<string, string[]>();
    for (const [kind, from] of Object.entries(answer.coverage)) {
      if (kind === 'positions' || !from) continue;
      const kinds = byDate.get(from) ?? [];
      kinds.push(RECORDS_WORD[kind as keyof typeof RECORDS_WORD]);
      byDate.set(from, kinds);
    }
    const kept = [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([from, kinds]) => `${kinds.length > 1 && byDate.size > 1 ? 'the rest' : kinds.join(', ')} from ${dateWords(from)}`);
    return kept.length === 0 ? '' : `Records kept: ${kept.join('; ')}, so an earlier period is not offered (§75.4).`;
  });

  readonly withheldWords = computed(() => {
    const answer = this.store.answer().value;
    const left = [...(answer?.withheld ?? [])];
    // The state of today is the overview's own read, under the overview's own permission.
    const today = this.spec().today;
    if (today === 'finance' && !this.can('finance.dashboard'))
      left.push({ permission: 'finance.dashboard', roles: ['executive', 'finance_manager', 'accountant', 'auditor', 'administrator'], parts: ['receivables'] });
    if (today === 'support' && !this.can('support.view'))
      left.push({ permission: 'support.view', roles: ['sales_manager', 'sales_representative', 'finance_manager', 'accountant', 'support_manager', 'support_agent', 'executive', 'auditor', 'administrator'], parts: ['backlog'] });
    if (left.length === 0) return null;
    const clauses = left.map(
      (entry) =>
        `${entry.parts.map((part) => PART_WORDS[part] ?? part).join(' and ')}, which ${entry.permission} gives to ${holderWords(entry.roles)}`,
    );
    return `This report leaves out ${clauses.join('; and ')}.`;
  });

  readonly figures = computed<readonly Figure[]>(() => {
    const answer = this.store.answer().value;
    const failed = this.store.answer().failed;
    const base = answer ? comparisonWords(answer) : '';
    const out: Figure[] = [];
    const todayFigures = this.todayFigures();
    for (const spec of this.spec().figures) {
      if (answer === null) {
        // Before the answer the cards a permission will leave out are not reserved.
        if (!failed && this.expected(spec.key)) out.push(this.pendingFigure(spec));
        continue;
      }
      const figure = answer.figures.find((entry) => entry.key === spec.key);
      if (!figure) continue;
      const door = figure.door && this.can(LIST_PERMISSION[figure.door.list]) ? doorLink(figure.door, answer.labels) : null;
      if (figure.missing === 'not-kept') {
        const from = answer.coverage[figure.records];
        out.push({
          ...this.pendingFigure(spec),
          status: 'empty',
          message: `Not kept for this period: ${RECORDS_WORD[figure.records]} start ${from ? dateWords(from) : 'later'}`,
          comparison: '',
          door: null,
        });
        continue;
      }
      if (figure.missing === 'not-recorded') {
        out.push({
          ...this.pendingFigure(spec),
          status: 'empty',
          message: `Not measured: ${plural(figure.count ?? 0, ['stocked position has', 'stocked positions have'])} no SKU dimensions`,
          comparison: '',
          door: null,
        });
        continue;
      }
      const value = figure.value === null ? 'None' : formatValue(figure.value, spec.unit);
      const counted = plural(figure.count ?? 0, spec.noun);
      const previous = figure.previous;
      let comparison = counted;
      if (answer.comparison !== null && figure.basis === 'period') {
        if (previous?.missing === 'not-kept')
          comparison = `${counted} · kept from ${dateWords(answer.coverage[figure.records] ?? answer.period.from).replace(/, \d{4}$/, '')}`;
        else if (previous && previous.value !== null) comparison = `vs ${compact(previous.value, spec.unit)}, ${base}`;
        else if (previous) comparison = `${counted} · none ${base}`;
      } else if (figure.basis === 'today') comparison = `${counted} · as of today`;
      out.push({
        key: spec.key,
        label: spec.label,
        value,
        message: figure.value === null ? `No ${spec.noun[1]} in this period to measure` : null,
        status: figure.value === null ? 'empty' : 'ready',
        delta: figure.basis === 'period' && previous?.missing !== 'not-kept' ? deltaOf(spec, figure.value, previous?.value) : null,
        goodWhen: spec.goodWhen,
        comparison,
        // A phone row has one line under the label: the comparison, which the card says in its own line.
        description: comparison,
        door,
      });
    }
    return [...out, ...todayFigures];
  });

  /** What the reader's permissions will let the answer carry, so the wait reserves only those cards. */
  private expected(key: string): boolean {
    const needs: Record<string, string[]> = {
      revenue: ['invoices.view'],
      grossMargin: ['invoices.view', 'cost.view'],
      bookedMargin: ['orders.view', 'cost.view'],
      inventoryValue: ['inventory.view', 'cost.view'],
      valuation: ['cost.view'],
      turns: ['cost.view'],
      agedValue: ['cost.view'],
      spend: ['cost.view'],
      priceVariance: ['cost.view'],
      firstResponseSla: ['support.view'],
      collected: ['payments.view'],
      conversionRate: ['quotes.view'],
      stockoutRate: ['orders.view'],
      bookedValue: ['orders.view'],
      orders: ['orders.view'],
      averageOrderValue: ['orders.view'],
      topAccountShare: ['orders.view'],
      overdueOfInvoiced: ['invoices.view'],
    };
    return (needs[key] ?? []).every((permission) => this.can(permission));
  }

  private pendingFigure(spec: FigureSpec): Figure {
    return {
      key: spec.key,
      label: spec.label,
      value: null,
      message: null,
      status: 'ready',
      delta: null,
      goodWhen: spec.goodWhen,
      comparison: '',
      description: spec.description,
      door: null,
    };
  }

  /** Today's state, read as the overview reads it: the same read, the same number and the same door. */
  private todayFigures(): Figure[] {
    const spec = this.spec();
    if (spec.today === 'finance' && this.can('finance.dashboard')) {
      const region = this.store.finance();
      const o = region.value;
      const failed = o === null && region.failed;
      const status = failed ? ('error' as const) : ('ready' as const);
      const message = failed ? 'Did not arrive' : null;
      const tone = o ? overdueTone(o) : 'neutral';
      const share = o ? overdueShare(o) : null;
      const crossed = tone === 'danger' ? `, above ${percent.format(OVERDUE_DANGER_SHARE)}` : tone === 'warning' ? `, above ${percent.format(OVERDUE_WARNING_SHARE)}` : '';
      const figures: Figure[] = [
        {
          key: 'receivables',
          label: 'Receivables',
          value: o ? formatValue(o.receivables.minor, 'usd') : null,
          message,
          status,
          delta: null,
          goodWhen: 'none',
          comparison: o ? `${plural(o.openInvoiceCount, ['open invoice', 'open invoices'])} · as of today` : '',
          description: 'owed on open invoices, as of today (§72.6)',
          door: this.can('invoices.view') ? { route: '/finance/invoices', params: { owing: '1' } } : null,
        },
        {
          key: 'overdue',
          label: 'Overdue',
          value: o ? formatValue(o.overdueReceivables.minor, 'usd') : null,
          message,
          status,
          delta: null,
          goodWhen: 'none',
          comparison: o ? `${share === null ? '—' : percent.format(share)} of receivables${crossed}` : '',
          description: o ? `${plural(o.overdueInvoiceCount, ['invoice', 'invoices'])}, ${share === null ? '—' : percent.format(share)} of receivables${crossed}` : 'past due and not disputed, as of today',
          door: this.can('invoices.view') ? { route: '/finance/invoices', params: invoiceDoorParams({ collection: 'overdue' }) } : null,
          ...(tone === 'neutral' ? {} : { tone }),
        },
      ];
      if (spec.key === 'finance')
        figures.push({
          key: 'dso',
          label: 'Days sales outstanding',
          value: o ? (o.dsoDays === null ? '—' : formatValue(o.dsoDays, 'days')) : null,
          message: failed ? message : o && o.dsoDays === null ? (o.dsoUndefined === 'not-kept' ? `Needs 90 days of invoices; kept from ${dateWords(o.keptFrom)}` : 'Nothing invoiced in 90 days') : null,
          status: failed ? 'error' : o && o.dsoDays === null ? 'empty' : 'ready',
          delta: null,
          goodWhen: 'down',
          comparison: o?.dsoDays !== null && o ? 'receivables over 90 days invoiced' : '',
          description: 'receivables against the last 90 days invoiced (§72.7)',
          door: null,
        });
      return figures;
    }
    if (spec.today === 'support' && this.can('support.view')) {
      const region = this.store.support();
      const m = region.value;
      const failed = m === null && region.failed;
      return [
        {
          key: 'backlog',
          label: 'Open now',
          value: m ? formatValue(m.openTickets, 'count') : null,
          message: failed ? 'Did not arrive' : null,
          status: failed ? 'error' : 'ready',
          delta: null,
          goodWhen: 'none',
          comparison: m ? `${plural(m.breachedResolution, ['past its resolution target', 'past their resolution target'])}` : '',
          description: 'tickets neither resolved nor closed, as of today',
          door: { route: '/support/inbox', params: { queue: 'open' } },
        },
      ];
    }
    return [];
  }

  /** Known before the answer, so the line keeps its height: the base of a change is the subheading's and each card's. */
  readonly figuresRule = computed(() => {
    const parts = ['Each figure opens the list of the records it counts.'];
    if (this.spec().today === 'finance' && this.can('finance.dashboard'))
      parts.push(`Overdue is a warning from ${percent.format(OVERDUE_WARNING_SHARE)} of receivables and a danger from ${percent.format(OVERDUE_DANGER_SHARE)}, as on the Finance overview.`);
    return parts.join(' ');
  });

  readonly attention = computed(() => {
    const answer = this.store.answer().value;
    if (!answer) return [];
    const items = answer.anomalies.map((anomaly) => this.anomalyItem(anomaly, answer));
    const o = this.spec().today === 'finance' ? this.store.finance().value : null;
    if (o && overdueTone(o) !== 'neutral') {
      const share = overdueShare(o) ?? 0;
      const line = overdueTone(o) === 'danger' ? OVERDUE_DANGER_SHARE : OVERDUE_WARNING_SHARE;
      items.push({
        key: 'finance.overdueShare',
        label: `Overdue is ${percent.format(share)} of receivables, above ${percent.format(line)}`,
        description: `${formatValue(o.overdueReceivables.minor, 'usd')} on ${plural(o.overdueInvoiceCount, ['invoice', 'invoices'])} past due, as of today`,
        door: this.can('invoices.view') ? { route: '/finance/invoices', params: invoiceDoorParams({ collection: 'overdue' }) } : null,
      });
    }
    return items;
  });

  private anomalyItem(anomaly: ReportAnomaly, answer: NonNullable<ReturnType<ReportStore['answer']>['value']>) {
    const words: Record<string, { label: string; unit: ReportUnit }> = {
      bookedValue: { label: 'Booked value', unit: 'usd' },
      orders: { label: 'Orders booked', unit: 'count' },
      losses: { label: 'Stock losses', unit: 'count' },
      ticketVolume: { label: 'Tickets opened', unit: 'count' },
    };
    const measure = words[anomaly.measure] ?? { label: anomaly.measure, unit: 'count' as ReportUnit };
    const where =
      anomaly.against === 'periods'
        ? `in ${rangeWords(anomaly.range)}`
        : `in ${bucketLabel(anomaly.range, answer.grain).replace(/^Week of/, 'the week of')}`;
    const history =
      anomaly.against === 'periods'
        ? `the ${anomaly.samples} periods of ${anomaly.range.days} days before it`
        : `the ${anomaly.samples} ${answer.grain === 'day' ? 'days' : answer.grain === 'week' ? 'weeks' : 'months'} before it`;
    return {
      key: anomaly.key,
      label: `${measure.label}: ${formatValue(anomaly.value, measure.unit)} ${where}, ${anomaly.direction} its usual range`,
      description: `${history} drew ${formatValue(anomaly.low, measure.unit)} to ${formatValue(anomaly.high, measure.unit)}`,
      door: anomaly.door && this.can(LIST_PERMISSION[anomaly.door.list]) ? doorLink(anomaly.door, answer.labels) : null,
    };
  }

  readonly ruleWords = computed(
    () =>
      'A figure is flagged when it falls outside the mean of its own history plus or minus two standard deviations — the six periods of the same length before it for bookings, the earlier weeks or days of the period for the rest — and a count never closer than its own chance variation.',
  );

  readonly quietWords = computed(() => {
    const answer = this.store.answer().value;
    return answer ? `Nothing in ${rangeWords(answer.period)} falls outside its usual range.` : '';
  });

  /** The grain the backend buckets the chosen period by, known before its answer. */
  readonly grain = computed<ReportGrain>(() => {
    const days = periodOf(this.choice().period).days;
    return days <= 14 ? 'day' : days <= 92 ? 'week' : 'month';
  });

  /** The rows a section's wait reserves: the buckets of the period, or the ranking's length. */
  reserveFor(table: string): number {
    const section = this.spec().sections.find((entry) => entry.table === table);
    if (!section) return 5;
    if (section.reserve !== undefined) return section.reserve;
    if (section.rows === 'Period' || section.rows === 'Issued in') {
      const days = periodOf(this.choice().period).days;
      return days <= 14 ? days : days <= 92 ? Math.ceil(days / 7) : Math.ceil(days / 30.4) + 1;
    }
    if (section.labels) return Object.keys(section.labels).length;
    // The warehouses the reader's scope holds are known before the answer.
    if (section.table === 'byWarehouse') return this.session.warehouses().length || 6;
    // A ranking cut at ten adds the row of the rest under them.
    return section.chart?.skipRows?.includes('others') ? 11 : 10;
  }

  constructor() {
    this.headerOpen.set(!untracked(this.phone));
    // A report opened with no period takes the one last chosen on any report.
    effect(() => {
      if (this.hasPeriod()) return;
      untracked(() => {
        const choice: ReportChoice = { period: this.memory.period(), compare: this.memory.compare(), filters: this.choice().filters };
        void this.router.navigate([], { relativeTo: this.route, queryParams: choiceParams(choice), replaceUrl: true });
      });
    });
    // The period, its filters, the persona, the scenario or the day: read again.
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      const choice = this.choice();
      const hasPeriod = this.hasPeriod();
      if (session === null || !hasPeriod) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) {
          this.store.forget();
          this.memory.forget();
        }
        tenant = key;
        this.memory.remember(choice.period, choice.compare);
        void this.store.read(this.key(), reportQuery(choice, session.demo.today), this.spec().today ?? null).then(() => {
          const coverage = this.store.answer().value?.coverage;
          if (coverage) this.memory.learn(coverage);
        });
      });
    });
  }

  private navigate(choice: ReportChoice): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: choiceParams(choice), replaceUrl: true });
  }

  choosePeriod(value: unknown): void {
    if (typeof value !== 'string') return;
    this.navigate({ ...this.choice(), period: value as PeriodKey });
  }

  chooseComparison(value: unknown): void {
    if (typeof value !== 'string') return;
    this.navigate({ ...this.choice(), compare: value as ReportComparison });
  }

  chooseFilter(key: ReportFilterKey, value: unknown): void {
    const filters = { ...this.choice().filters };
    if (typeof value !== 'string' || value === 'all') delete filters[key];
    else filters[key] = value;
    this.navigate({ ...this.choice(), filters });
  }

  refresh(): void {
    void this.store.refresh();
  }

  retry(): void {
    void this.store.retry();
  }

  /** The words a change says, for a spec. */
  changeText(spec: FigureSpec, now: number | null, before: number | null | undefined): string {
    const found = change({ value: now, previous: before === undefined ? undefined : { value: before } }, spec.unit);
    return found ? changeWords(found, spec.unit) : '';
  }
}
