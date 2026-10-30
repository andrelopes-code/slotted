import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SlButton, SlButtonEnd, SlButtonLink } from '@slotted/angular/button';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton, SlSkeletonText } from '@slotted/angular/skeleton';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
} from '@slotted/angular/table';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import {
  activeJobCount,
  fileAvailability,
  filterJobs,
  focusDestination,
  hasDetails,
  isFinishedJob,
  jobAnnouncement,
  jobControls,
  jobGlyph,
  jobOutcome,
  jobProgressText,
  jobStatusText,
  jobSummaryText,
  jobTransition,
  remainingSeconds,
} from '@slotted/core/import-export-center';
import type {
  FocusableJob,
  FocusMemory,
  ImportExportJob,
  JobControls,
  JobCounts,
  JobFile,
  JobFileRole,
  ProgressSample,
} from '@slotted/core/import-export-center';
import {
  importExportCenterMessages,
  type ImportExportCenterMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { formatTimestamp } from '@slotted/core/timeline';
import type { FormattedTimestamp, TimestampValue } from '@slotted/core/timeline';
import { fileKind, formatBytes, splitName } from '@slotted/core/upload';
import type { FileKind } from '@slotted/core/upload';

import {
  injectImportExportCenterDefaults,
  SlImportExportCenterIdFactory,
  type ImportExportCenterGrowing,
  type ImportExportCenterLevel,
  type ImportExportCenterSize,
  type ImportExportCenterStatus,
  type ImportExportCenterTimeFormat,
  type ImportExportDownloadRequest,
  type ImportExportJobRequest,
  type ImportExportPressReason,
  type ImportExportRemoveRequest,
  type ImportExportRequest,
  type ImportExportView,
} from './import-export-center-defaults';
import { SlImportExportControl } from './import-export-control';

/** The mark of a file's kind, the drawing `upload` puts in the same tile. */
const KIND_GLYPH: Record<FileKind, GlyphName> = {
  pdf: 'file-text',
  document: 'file-type',
  spreadsheet: 'file-spreadsheet',
  presentation: 'presentation',
  image: 'file-image',
  video: 'file-video',
  audio: 'file-audio',
  archive: 'file-archive',
  other: 'file',
};

/** The parts focus can rest on in a job, in the order they are drawn. */
const FOCUSABLE_PARTS = ['job-title', 'download', 'retry', 'cancel', 'toggle', 'remove'] as const;

const WAITING_ROWS = [0, 1, 2];

const SAMPLE_LIMIT = 12;

const COUNT_KEYS = ['total', 'processed', 'created', 'updated', 'skipped', 'failed'] as const;

/** A deadline is a date: day, month and time, in every time format. */
const DEADLINE: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

function createRequest<Reason extends string>(
  reason: Reason,
  event: Event | undefined,
): ImportExportRequest<Reason> {
  let cancelled = false;
  return {
    reason,
    event,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** A click with no coordinates is a key. */
function pressReason(event: Event): ImportExportPressReason {
  return (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
}

function escapeKey(key: string): string {
  return key.replace(/[^\w-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`);
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/** What a job's own actions template is handed. */
export interface ImportExportJobContext {
  $implicit: ImportExportJob;
}

/** One row of a job's files, resolved for the template. */
interface FileRow {
  role: JobFileRole;
  label: string;
  file: JobFile;
  stem: string;
  extension: string;
  size: string | null;
  note: string | null;
  downloadable: boolean;
  availability: string;
}

/** Everything the template draws for one job, resolved once per render. */
interface JobView {
  job: ImportExportJob;
  ids: {
    title: string;
    status: string;
    toggle: string;
    details: string;
    control: (part: string) => string;
  };
  outcome: string | null;
  controls: JobControls;
  ordered: readonly string[];
  removable: boolean;
  expanded: boolean;
  kind: FileKind;
  kindGlyph: GlyphName;
  directionText: string;
  mark: GlyphName | 'spinner';
  file: { stem: string; extension: string; size: string | null } | null;
  time: FormattedTimestamp | null;
  statusText: string;
  progressText: readonly string[];
  summary: readonly string[];
  message: string | null;
  downloadFile: JobFile | null;
  downloadLabel: string;
  retryLabel: string;
  counts: readonly { key: string; label: string; value: string }[];
  files: readonly FileRow[];
  errorNote: string | null;
}

/**
 * The consumer's own controls for one job, after the family's.
 *
 * ```html
 * <ng-template slImportExportJobActions let-job>
 *   <a slButtonLink size="sm" variant="ghost" [href]="'/jobs/' + job.key">Open</a>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[slImportExportJobActions]', standalone: true })
export class SlImportExportJobActions {
  readonly template = inject(TemplateRef<ImportExportJobContext>);
}

/** The consumer's controls in the header: an import dialog's trigger, an export button. */
@Directive({
  selector: '[slImportExportCenterActions]',
  standalone: true,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlImportExportCenterActions {}

/** Replaces the view's empty page. */
@Directive({ selector: '[slImportExportCenterEmpty]', standalone: true })
export class SlImportExportCenterEmpty {}

/** The consumer's footer: the link from a popover to the whole page. */
@Directive({
  selector: '[slImportExportCenterFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlImportExportCenterFooter {}

/**
 * The jobs an application runs away from the page — imports and exports —
 * and what the reader can do about each.
 *
 * **It holds none of the facts.** `jobs` is the consumer's array. Cancelling,
 * retrying, removing, downloading, opening and loading are outputs with a
 * reason, and the store answers by changing the array. The family never
 * opens a connection and never transfers a byte: `upload` does, in the
 * import dialog the consumer projects into the actions slot.
 *
 * **Two values move:** `[(view)]` and `[(expanded)]`, each with a request
 * output that carries the reason and can be cancelled.
 *
 * **What a job offers is one table,** `jobControls` in
 * `@slotted/core/import-export-center`, which the React binding renders too.
 *
 * **Focus never falls to the body.** A job that finishes while focus is on
 * Cancel keeps focus in the job; a job that leaves takes focus to the same
 * control of the job in its place.
 */
@Component({
  selector: 'section[slImportExportCenter]',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlButtonEnd,
    SlButtonLink,
    SlGlyph,
    SlIcon,
    SlImportExportControl,
    SlProgressBar,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
    SlSkeletonText,
    SlTab,
    SlTabList,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTabs,
  ],
  template: `
    <div data-part="header" data-part-header="">
      @switch (levelValue()) {
        @case ('3') {
          <h3 data-part="title" data-part-title="" [id]="titleId">
            {{ t('title') }}
            @if (active() > 0) {
              <span data-part="count" data-part-count="">{{
                t('active', { count: active() })
              }}</span>
            }
          </h3>
        }
        @case ('4') {
          <h4 data-part="title" data-part-title="" [id]="titleId">
            {{ t('title') }}
            @if (active() > 0) {
              <span data-part="count" data-part-count="">{{
                t('active', { count: active() })
              }}</span>
            }
          </h4>
        }
        @default {
          <h2 data-part="title" data-part-title="" [id]="titleId">
            {{ t('title') }}
            @if (active() > 0) {
              <span data-part="count" data-part-count="">{{
                t('active', { count: active() })
              }}</span>
            }
          </h2>
        }
      }
      <div data-part="tools" data-part-tools="">
        @if (finished().length > 0) {
          <span data-part="clear" data-part-clear="">
            <button
              slButton
              size="sm"
              tone="secondary"
              variant="ghost"
              type="button"
              (click)="clear($event)"
            >
              {{ t('clear') }}
            </button>
          </span>
        }
        <ng-content select="[slImportExportCenterActions]" />
      </div>
    </div>
    @if (viewList().length > 1) {
      <div data-part="views" data-part-views="">
        <div
          slTabs
          track="none"
          [size]="sizeValue()"
          [value]="currentView()"
          (valueChange)="forwardView($event)"
        >
          <div slTabList [attr.aria-label]="t('views')">
            @for (entry of viewList(); track entry.value) {
              <div slTab [value]="entry.value" [controls]="listId">{{ entry.label }}</div>
            }
          </div>
        </div>
      </div>
    }
    @if (status() === 'error') {
      <div data-part="error" data-part-error="">
        <section slResultState reach="section" status="error" live="off">
          <div slResultStateContent>
            <div slResultStateTitle>{{ t('loadError') }}</div>
            <p slResultStateDescription>{{ t('loadErrorDescription') }}</p>
          </div>
          <div slResultStateActions>
            <button
              slButton
              size="sm"
              tone="secondary"
              variant="outline"
              type="button"
              (click)="reload($event)"
            >
              {{ t('reload') }}
            </button>
          </div>
        </section>
      </div>
    } @else if (showEmpty()) {
      <div data-part="empty" data-part-empty="">
        <ng-content select="[slImportExportCenterEmpty]">
          <section slResultState reach="section" status="empty" live="off">
            <div slResultStateContent>
              <div slResultStateTitle>{{ emptyTitle() }}</div>
              <p slResultStateDescription>{{ t('emptyDescription') }}</p>
            </div>
          </section>
        </ng-content>
      </div>
    } @else {
      <ul
        #list
        data-part="list"
        data-part-list=""
        tabindex="-1"
        [id]="listId"
        [attr.aria-labelledby]="titleId"
        [attr.aria-busy]="loading() ? 'true' : null"
        (focusin)="rememberFocus($event)"
      >
        @if (waiting()) {
          @for (row of waitingRows; track row) {
            <li data-part="job" data-part-job="" aria-hidden="true">
              <span data-part="visual" data-part-visual=""
                ><span slSkeleton shape="block"></span
              ></span>
              <div data-part="body" data-part-body="">
                <span slSkeletonText [lines]="2"></span>
                <span slSkeletonText [lines]="1"></span>
              </div>
            </li>
          }
        } @else {
          @for (view of jobViews(); track view.job.key) {
            <ng-container
              [ngTemplateOutlet]="jobTemplate"
              [ngTemplateOutletContext]="{ $implicit: view }"
            />
          }
        }
      </ul>
    }
    @if (status() !== 'error' && growingValue() === 'button' && hasMore() && !waiting()) {
      <button
        data-part="more"
        data-part-more=""
        type="button"
        [attr.aria-disabled]="loading() ? 'true' : null"
        [attr.data-loading]="loading() ? '' : null"
        (click)="loadMore($event)"
      >
        {{ loading() ? t('loading') : t('loadMore') }}
      </button>
    }
    <ng-content select="[slImportExportCenterFooter]" />

    <ng-template #fileName let-stem="stem" let-extension="extension">
      <span data-part="file-name" data-part-file-name="" dir="auto"
        ><span data-part="name" data-part-name="">{{ stem }}</span>
        @if (extension !== '') {
          <span data-part="extension" data-part-extension="">{{ extension }}</span>
        }
      </span>
    </ng-template>

    <ng-template
      #download
      let-view="view"
      let-file="file"
      let-role="role"
      let-label="label"
      let-primary="primary"
    >
      <span data-part="download" data-part-download="">
        @if (file.href === undefined) {
          <button
            slButton
            size="sm"
            tone="secondary"
            type="button"
            [variant]="primary ? 'outline' : 'ghost'"
            [attr.id]="primary ? view.ids.control('download') : null"
            [attr.aria-labelledby]="
              primary ? view.ids.control('download') + ' ' + view.ids.title : null
            "
            [attr.aria-describedby]="primary ? view.ids.status : null"
            (click)="askDownload(view.job.key, role, $event)"
          >
            {{ label }}
          </button>
        } @else {
          <a
            slButtonLink
            size="sm"
            tone="secondary"
            [variant]="primary ? 'outline' : 'ghost'"
            [href]="file.href"
            [attr.download]="file.name"
            [attr.id]="primary ? view.ids.control('download') : null"
            [attr.aria-labelledby]="
              primary ? view.ids.control('download') + ' ' + view.ids.title : null
            "
            [attr.aria-describedby]="primary ? view.ids.status : null"
            (click)="askDownload(view.job.key, role, $event)"
            >{{ label }}</a
          >
        }
      </span>
    </ng-template>

    <ng-template #jobTemplate let-view>
      <li
        data-part="job"
        data-part-job=""
        [attr.data-key]="view.job.key"
        [attr.data-direction]="view.job.direction"
        [attr.data-status]="view.job.status"
        [attr.data-outcome]="view.outcome"
        [attr.data-expired]="view.controls.expired ? '' : null"
        [attr.data-expanded]="view.expanded ? '' : null"
      >
        <span data-part="visual" data-part-visual="" aria-hidden="true" [attr.data-kind]="view.kind"
          ><span slIcon><svg slGlyph [name]="view.kindGlyph"></svg></span
        ></span>
        <div data-part="body" data-part-body="">
          <div data-part="heading" data-part-heading="">
            @if (view.job.href === undefined) {
              <span
                data-part="job-title"
                data-part-job-title=""
                tabindex="-1"
                [id]="view.ids.title"
                >{{ view.job.title }}</span
              >
            } @else {
              <a
                data-part="job-title"
                data-part-job-title=""
                [id]="view.ids.title"
                [attr.href]="view.job.href"
                (click)="open(view.job.key, $event)"
                >{{ view.job.title }}</a
              >
            }
            <p data-part="meta" data-part-meta="">
              <span>{{ view.directionText }}</span>
              @if (view.job.format !== undefined) {
                <span>{{ view.job.format }}</span>
              }
              @if (view.file !== null) {
                <span
                  ><ng-container
                    [ngTemplateOutlet]="fileName"
                    [ngTemplateOutletContext]="{
                      stem: view.file.stem,
                      extension: view.file.extension,
                    }"
                /></span>
                @if (view.file.size !== null) {
                  <span>{{ view.file.size }}</span>
                }
              }
              @if (view.job.actor !== undefined) {
                <span>{{ view.job.actor }}</span>
              }
              @if (view.time !== null) {
                <time
                  data-part="time"
                  data-part-time=""
                  [attr.datetime]="view.time.dateTime"
                  [attr.title]="view.time.title"
                  >{{ view.time.text }}</time
                >
              }
            </p>
          </div>
          <div data-part="status" data-part-status="" [id]="view.ids.status">
            <span data-part="mark" data-part-mark="" aria-hidden="true">
              @if (view.mark === 'spinner') {
                <span data-ui="spinner" data-ui-spinner=""
                  ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="8.875" />
                    <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
                ></span>
              } @else {
                <span slIcon><svg slGlyph [name]="view.mark"></svg></span>
              }
            </span>
            <span data-part="status-label" data-part-status-label=""
              ><span>{{ view.statusText }}</span>
              @if (view.job.stage) {
                <span data-part="stage" data-part-stage="" [attr.title]="view.job.stage">{{
                  view.job.stage
                }}</span>
              }
            </span>
          </div>
          @if (view.job.status === 'running') {
            <div data-part="progress" data-part-progress="">
              <div
                slProgressBar
                hideLabel
                size="sm"
                tone="accent"
                [delay]="0"
                [label]="view.job.title"
                [max]="view.job.progress?.max ?? 100"
                [value]="view.job.progress?.value ?? null"
                [valueText]="
                  view.progressText.length > 0 ? view.progressText.join(', ') : undefined
                "
              ></div>
              @if (view.progressText.length > 0) {
                <span data-part="progress-text" data-part-progress-text="">
                  @for (item of view.progressText; track item) {
                    <span>{{ item }}</span>
                  }
                </span>
              }
            </div>
          }
          @if (view.summary.length > 0) {
            <p data-part="summary" data-part-summary="">
              @for (item of view.summary; track item) {
                <span>{{ item }}</span>
              }
            </p>
          }
          @if (view.message !== null) {
            <p data-part="message" data-part-message="">{{ view.message }}</p>
          }
        </div>
        @if (view.ordered.length > 0 || view.removable || jobActionsTemplate()) {
          <div data-part="controls" data-part-controls="">
            @for (part of view.ordered; track part) {
              @switch (part) {
                @case ('download') {
                  @if (view.downloadFile !== null) {
                    <ng-container
                      [ngTemplateOutlet]="download"
                      [ngTemplateOutletContext]="{
                        view,
                        file: view.downloadFile,
                        role: view.controls.download,
                        label: view.downloadLabel,
                        primary: true,
                      }"
                    />
                  }
                }
                @case ('toggle') {
                  <span
                    data-part="toggle"
                    data-part-toggle=""
                    [attr.data-expanded]="view.expanded ? '' : null"
                  >
                    <button
                      slButton
                      size="sm"
                      tone="secondary"
                      variant="ghost"
                      type="button"
                      [id]="view.ids.toggle"
                      [attr.aria-expanded]="view.expanded ? 'true' : 'false'"
                      [attr.aria-controls]="view.ids.details"
                      [attr.aria-labelledby]="view.ids.toggle + ' ' + view.ids.title"
                      (click)="toggle(view.job.key, pressReason($event), $event)"
                    >
                      {{ t('details') }}
                      <span slButtonEnd
                        ><span data-part="chevron" data-part-chevron=""
                          ><span slIcon><svg slGlyph name="chevron-down"></svg></span></span
                      ></span>
                    </button>
                  </span>
                }
                @default {
                  <span
                    [attr.data-part]="part"
                    [attr.data-part-cancel]="part === 'cancel' ? '' : null"
                    [attr.data-part-retry]="part === 'retry' ? '' : null"
                  >
                    <button
                      slButton
                      size="sm"
                      tone="secondary"
                      variant="outline"
                      type="button"
                      [id]="view.ids.control(part)"
                      [attr.aria-labelledby]="view.ids.control(part) + ' ' + view.ids.title"
                      [attr.aria-describedby]="view.ids.status"
                      (click)="press(part, view.job.key, $event)"
                    >
                      {{ part === 'cancel' ? t('cancel') : view.retryLabel }}
                    </button>
                  </span>
                }
              }
            }
            @if (jobActionsTemplate(); as own) {
              <span data-part="job-actions" data-part-job-actions=""
                ><ng-container
                  [ngTemplateOutlet]="own.template"
                  [ngTemplateOutletContext]="{ $implicit: view.job }"
              /></span>
            }
            @if (view.removable) {
              <button
                slImportExportControl
                data-part="remove"
                data-part-remove=""
                [text]="t('remove')"
                [describedBy]="view.ids.title"
                (click)="removeOne(view.job.key, $event)"
              >
                <span slIcon><svg slGlyph name="x"></svg></span>
              </button>
            }
          </div>
        }
        @if (view.expanded) {
          <div
            data-part="details"
            data-part-details=""
            role="region"
            [id]="view.ids.details"
            [attr.aria-labelledby]="view.ids.toggle"
          >
            @if (view.counts.length > 0) {
              <dl data-part="counts" data-part-counts="">
                @for (count of view.counts; track count.key) {
                  <div [attr.data-count]="count.key">
                    <dt>{{ count.label }}</dt>
                    <dd>{{ count.value }}</dd>
                  </div>
                }
              </dl>
            }
            @if (view.files.length > 0) {
              <ul data-part="files" data-part-files="">
                @for (row of view.files; track row.role) {
                  <li
                    data-part="file"
                    data-part-file=""
                    [attr.data-availability]="row.availability"
                  >
                    <span data-part="meta" data-part-meta="">
                      <strong>{{ row.label }}</strong>
                      <span
                        ><ng-container
                          [ngTemplateOutlet]="fileName"
                          [ngTemplateOutletContext]="{ stem: row.stem, extension: row.extension }"
                      /></span>
                      @if (row.size !== null) {
                        <span>{{ row.size }}</span>
                      }
                      @if (row.note !== null) {
                        <span>{{ row.note }}</span>
                      }
                    </span>
                    @if (row.downloadable) {
                      <ng-container
                        [ngTemplateOutlet]="download"
                        [ngTemplateOutletContext]="{
                          view,
                          file: row.file,
                          role: row.role,
                          label: t('download'),
                          primary: false,
                        }"
                      />
                    }
                  </li>
                }
              </ul>
            }
            @if ((view.job.errors?.length ?? 0) > 0) {
              <div data-part="errors" data-part-errors="">
                <div slTable variant="framed" [columns]="4">
                  <div slTableContent>
                    <caption slTableCaption>
                      {{
                        t('errorsCaption')
                      }}
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader numeric>{{ t('errorColumns.row') }}</th>
                        <th slTableColumnHeader>{{ t('errorColumns.message') }}</th>
                        <th slTableColumnHeader>{{ t('errorColumns.column') }}</th>
                        <th slTableColumnHeader>{{ t('errorColumns.value') }}</th>
                      </tr>
                    </thead>
                    <tbody slTableBody>
                      @for (error of view.job.errors; track $index) {
                        <tr slTableRow>
                          <td slTableCell numeric>{{ formatCount(error.row) }}</td>
                          <td slTableCell>{{ error.message }}</td>
                          <td slTableCell>{{ error.column ?? '' }}</td>
                          <td slTableCell>{{ error.value ?? '' }}</td>
                        </tr>
                      }
                    </tbody>
                  </div>
                </div>
                @if (view.errorNote !== null) {
                  <p data-part="errors-note" data-part-errors-note="">
                    <span>{{ view.errorNote }}</span>
                  </p>
                }
              </div>
            }
          </div>
        }
      </li>
    </ng-template>
  `,
  styleUrl: '../../../styles/src/import-export-center/import-export-center.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slImportExportCenter',
  host: {
    'data-ui': 'import-export-center',
    'data-ui-import-export-center': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-level]': 'levelValue()',
    '[attr.data-growing]': 'growingValue()',
    '[attr.data-time-format]': 'timeFormatValue()',
    '[attr.data-view]': 'currentView()',
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-status]': "status() === 'error' ? 'error' : null",
    '[attr.aria-labelledby]': 'labelledBy()',
  },
})
export class SlImportExportCenter {
  /** The consumer's jobs, in the order they are drawn. The family changes none of them. */
  readonly jobs = input.required<readonly ImportExportJob[]>();
  /** The strip's entries. `all`, `import` and `export` when unstated; one entry draws no strip. */
  readonly views = input<readonly ImportExportView[] | undefined>(undefined);
  readonly size = input<ImportExportCenterSize | undefined>(undefined);
  readonly level = input<ImportExportCenterLevel | undefined>(undefined);
  readonly growing = input<ImportExportCenterGrowing | undefined>(undefined);
  readonly timeFormat = input<ImportExportCenterTimeFormat | undefined>(undefined);
  /** What numbers, sizes, times and deadlines are written in. Absent, the language in force. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /** The moment a relative reading and a deadline count from. State it for a stable server render. */
  readonly now = input<number | undefined>(undefined);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly status = input<ImportExportCenterStatus>('ready');
  /** Whether the history has another page; `growing="button"` draws `more` while it has. */
  readonly hasMore = input(false, { transform: booleanAttribute });
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<ImportExportCenterMessages> | undefined>(undefined);
  /** The view an unbound centre starts on, read once. */
  readonly defaultView = input<string | undefined>(undefined);
  /** The keys an unbound centre starts with shown, read once. */
  readonly defaultExpanded = input<readonly string[] | undefined>(undefined);
  /** The current view. Two-way. */
  readonly view = model<string | undefined>(undefined);
  /** The keys whose details are shown. Two-way. */
  readonly expanded = model<readonly string[] | undefined>(undefined);

  readonly viewRequest = output<ChangeRequest<string | undefined>>();
  readonly expandedRequest = output<ChangeRequest<readonly string[] | undefined>>();
  readonly cancelRequest = output<ImportExportJobRequest>();
  readonly retryRequest = output<ImportExportJobRequest>();
  readonly removeRequest = output<ImportExportRemoveRequest>();
  /** Asked before a download. With an `href` the link navigates unless cancelled; without one the consumer produces the file. */
  readonly downloadRequest = output<ImportExportDownloadRequest>();
  /** Asked before the title's link navigates to the job's page; cancellable. */
  readonly openRequest = output<ImportExportJobRequest>();
  readonly loadMoreRequest = output<ImportExportRequest<ImportExportPressReason>>();
  readonly reloadRequest = output<ImportExportRequest<ImportExportPressReason>>();

  private readonly defaults = injectImportExportCenterDefaults();
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  private readonly listElement = viewChild<ElementRef<HTMLUListElement>>('list');
  protected readonly jobActionsTemplate = contentChild(SlImportExportJobActions);

  readonly id = inject(SlImportExportCenterIdFactory).next();
  readonly titleId = `${this.id}-title`;
  readonly listId = `${this.id}-list`;
  protected readonly waitingRows = WAITING_ROWS;
  protected readonly pressReason = pressReason;

  readonly sizeValue = computed(() => this.size() ?? this.defaults.size);
  readonly levelValue = computed(() => this.level() ?? this.defaults.level);
  readonly growingValue = computed(() => this.growing() ?? this.defaults.growing);
  readonly timeFormatValue = computed(() => this.timeFormat() ?? this.defaults.timeFormat);
  private readonly contextLocale = injectLocale();
  readonly localeValue = computed(() => this.locale() ?? this.contextLocale());
  readonly timeZoneValue = computed(() => this.timeZone() ?? this.defaults.timeZone);
  /** The family's words in the language in force, with this centre's `messages` laid over them. */
  readonly t = injectMessages(importExportCenterMessages, this.messages);

  protected readonly labelledBy = computed(() =>
    this.writtenLabel !== null ? null : (this.writtenLabelledBy ?? this.titleId),
  );

  readonly viewList = computed<readonly ImportExportView[]>(
    () =>
      this.views() ?? [
        { label: this.t('all'), value: 'all' },
        { label: this.t('imports'), value: 'import' },
        { label: this.t('exports'), value: 'export' },
      ],
  );

  /** The view: the model, then defaultView, then the first entry. */
  readonly currentView = computed(
    () => this.view() ?? this.defaultView() ?? this.viewList()[0]?.value ?? 'all',
  );

  /** The shown keys: the model, then defaultExpanded. */
  readonly currentExpanded = computed<readonly string[]>(
    () => this.expanded() ?? this.defaultExpanded() ?? [],
  );

  readonly visibleJobs = computed(() => filterJobs(this.jobs(), this.currentView()));
  readonly active = computed(() => activeJobCount(this.jobs()));
  readonly finished = computed(() =>
    this.visibleJobs().filter((job) => isFinishedJob(job) && job.removable !== false),
  );
  readonly waiting = computed(() => this.loading() && this.visibleJobs().length === 0);
  readonly showEmpty = computed(() => !this.waiting() && this.visibleJobs().length === 0);
  readonly emptyTitle = computed(() => {
    const view = this.currentView();
    return view === 'import'
      ? this.t('emptyImports')
      : view === 'export'
        ? this.t('emptyExports')
        : this.t('empty');
  });

  private readonly remaining = signal<ReadonlyMap<string, number | null>>(new Map());
  private readonly samples = new Map<string, ProgressSample[]>();

  readonly jobViews = computed<readonly JobView[]>(() => {
    const expanded = new Set(this.currentExpanded());
    return this.visibleJobs().map((job) => this.viewOf(job, expanded));
  });

  private memory: (FocusMemory & { element: HTMLElement }) | null = null;
  private revealing: string | null = null;
  private previous: ReadonlyMap<string, ImportExportJob> | null = null;

  constructor() {
    /* A transition of a shown job is announced once; the first render is not. */
    effect(() => {
      const jobs = this.jobs();
      untracked(() => {
        const seen = this.previous;
        this.previous = new Map(jobs.map((job) => [job.key, job]));
        if (seen === null) return;
        for (const job of jobs) {
          const transition = jobTransition(seen.get(job.key), job);
          if (transition !== null) {
            getLiveAnnouncer().announce(jobAnnouncement(transition, job, this.t));
          }
        }
      });
    });

    /* The time left: samples of the progress the family has seen, and the server's eta first. */
    effect(() => {
      const jobs = this.jobs();
      const now = this.now() ?? Date.now();
      const timeZone = this.timeZoneValue();
      untracked(() => {
        const next = new Map<string, number | null>();
        for (const job of jobs) {
          if (job.status !== 'running') {
            this.samples.delete(job.key);
            continue;
          }
          const value = job.progress?.value;
          const max = job.progress?.max;
          const list = this.samples.get(job.key) ?? [];
          if (value !== undefined && max !== undefined && list.at(-1)?.value !== value) {
            list.push({ at: Date.now(), max, value });
            if (list.length > SAMPLE_LIMIT) list.shift();
            this.samples.set(job.key, list);
          }
          next.set(job.key, remainingSeconds(job, list, { now, timeZone }));
        }
        this.remaining.set(next);
      });
    });

    /* A key that left the jobs leaves the set. */
    effect(() => {
      const present = new Set(this.jobs().map((job) => job.key));
      untracked(() => {
        const own = this.expanded();
        if (own === undefined) return;
        const kept = own.filter((key) => present.has(key));
        if (kept.length !== own.length) this.expanded.set(kept);
      });
    });

    /* After every render: focus that lost its element, and a job being revealed. */
    afterRenderEffect(() => {
      this.jobViews();
      untracked(() => {
        this.restoreFocus();
        this.finishReveal();
      });
    });
  }

  /** Focuses the first job's first control, or the list when there is none. */
  focus(): void {
    const list = this.listElement()?.nativeElement;
    const first = list?.querySelector<HTMLElement>(
      ':scope > [data-part="job"] :is(a[data-part="job-title"], [data-part="controls"] button, [data-part="controls"] a)',
    );
    (first ?? list)?.focus();
  }

  /** Shows a job's details, scrolls it into view and focuses its title: where a toast's View takes the reader. */
  reveal(key: string): void {
    const job = this.jobs().find((each) => each.key === key);
    if (job === undefined) return;
    const keys = this.currentExpanded();
    if (!keys.includes(key)) this.requestExpanded([...keys, key], 'programmatic', undefined);
    if (filterJobs([job], this.currentView()).length === 0) {
      this.selectView('all', 'programmatic', undefined);
    }
    this.revealing = key;
  }

  protected formatCount(value: number): string {
    return new Intl.NumberFormat(this.localeValue()).format(value);
  }

  private deadline(value: TimestampValue): string {
    return formatTimestamp(value, {
      absolute: DEADLINE,
      format: 'absolute',
      locale: this.localeValue(),
      timeZone: this.timeZoneValue(),
    }).text;
  }

  private viewOf(job: ImportExportJob, expandedKeys: ReadonlySet<string>): JobView {
    const t = this.t;
    const locale = this.localeValue();
    const clock = { now: this.now(), timeZone: this.timeZoneValue() };
    const prefix = `${this.id}-${escapeKey(job.key)}`;
    const ids = {
      control: (part: string) => `${prefix}-${part}`,
      details: `${prefix}-details`,
      status: `${prefix}-status`,
      title: `${prefix}-title`,
      toggle: `${prefix}-toggle`,
    };
    const controls = jobControls(job, clock);
    const kindFile = job.result ?? job.source;
    const kind: FileKind =
      kindFile !== undefined
        ? fileKind({ name: kindFile.name, type: kindFile.type ?? '' })
        : job.format !== undefined
          ? fileKind({ name: `job.${job.format.toLowerCase()}`, type: '' })
          : 'other';
    const shown =
      job.direction === 'export' ? (job.result ?? job.source) : (job.source ?? job.result);
    const when =
      job.status === 'succeeded' || job.status === 'failed'
        ? (job.finishedAt ?? job.createdAt)
        : job.createdAt;
    const counts: JobCounts = job.counts ?? {};
    const count = new Intl.NumberFormat(locale);
    const errors = job.errors ?? [];
    const total = Math.max(job.errorCount ?? 0, errors.length);
    const files: FileRow[] = (
      [
        ['source', job.source],
        ['result', job.result],
        ['errors', job.errorsFile],
      ] as const
    )
      .filter((entry): entry is readonly [JobFileRole, JobFile] => entry[1] !== undefined)
      .map(([role, file]) => {
        const availability = fileAvailability(file, clock);
        const { stem, extension } = splitName(file.name);
        return {
          availability,
          downloadable: availability === 'available' || availability === 'expires',
          extension,
          file,
          label: t(`fileLabels.${role}`),
          note:
            availability === 'denied'
              ? (file.denied ?? null)
              : file.expiresAt === undefined
                ? null
                : availability === 'expired'
                  ? t('expired', { date: this.deadline(file.expiresAt) })
                  : t('expires', { date: this.deadline(file.expiresAt) }),
          role,
          size: file.size === undefined ? null : formatBytes(file.size, locale),
          stem,
        };
      });

    const downloadFile =
      controls.download === 'errors'
        ? (job.errorsFile ?? null)
        : controls.download === 'result'
          ? (job.result ?? null)
          : null;
    const mark = jobGlyph(job);

    return {
      controls,
      counts: COUNT_KEYS.filter((name) => typeof counts[name] === 'number').map((name) => ({
        key: name,
        label: t(`countLabels.${name}`),
        value: count.format(counts[name] ?? 0),
      })),
      downloadFile,
      downloadLabel: controls.download === 'errors' ? t('downloadErrors') : t('download'),
      errorNote:
        total > errors.length && errors.length > 0
          ? t('sample', { shown: errors.length, total })
          : null,
      expanded:
        expandedKeys.has(job.key) && controls.controls.includes('toggle') && hasDetails(job),
      file:
        shown === undefined
          ? null
          : {
              ...splitName(shown.name),
              size: shown.size === undefined ? null : formatBytes(shown.size, locale),
            },
      files,
      ids,
      job,
      directionText: t(job.direction),
      kind,
      kindGlyph: KIND_GLYPH[kind],
      mark,
      message: this.messageOf(job, clock),
      ordered: controls.controls.filter((part) => part !== 'remove'),
      outcome: jobOutcome(job),
      progressText:
        job.status === 'running'
          ? jobProgressText(job, {
              locale,
              t,
              remaining: this.remaining().get(job.key),
            })
          : [],
      removable: controls.controls.includes('remove'),
      retryLabel: controls.retry === 'regenerate' ? t('regenerate') : t('retry'),
      statusText: jobStatusText(job, t),
      summary: jobSummaryText(job, { locale, t }),
      time:
        when === undefined
          ? null
          : formatTimestamp(when, {
              format: this.timeFormatValue(),
              locale,
              now: this.now(),
              timeZone: this.timeZoneValue(),
            }),
    };
  }

  private messageOf(
    job: ImportExportJob,
    clock: { now: number | undefined; timeZone: string | undefined },
  ): string | null {
    if (job.message !== undefined && job.message !== '') return job.message;
    const result = job.result;
    if (result === undefined) return null;
    const availability = fileAvailability(result, clock);
    if (availability === 'denied') return result.denied ?? null;
    if (result.expiresAt === undefined) return null;
    if (availability === 'expired')
      return this.t('expired', { date: this.deadline(result.expiresAt) });
    if (availability === 'expires')
      return this.t('expires', { date: this.deadline(result.expiresAt) });
    return null;
  }

  /* ── The two models ────────────────────────────────────────────────── */

  protected forwardView(request: ChangeRequest<string | undefined>) {
    if (request.value === undefined) return;
    this.selectView(request.value, request.reason, request.source);
  }

  private selectView(next: string, reason: ChangeReason, source: unknown) {
    if (next === this.currentView()) return;
    let cancelled = false;
    const state = createControllable<string | undefined>({
      initial: this.currentView(),
      onRequest: (request) => {
        this.viewRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    /* The model is the state: written once the request is accepted, which is
       what `[(view)]` binds and what an unbound centre keeps. */
    if (!cancelled && moved) this.view.set(next);
  }

  private requestExpanded(next: readonly string[], reason: ChangeReason, source: unknown) {
    if (sameKeys(next, this.currentExpanded())) return;
    let cancelled = false;
    const state = createControllable<readonly string[] | undefined>({
      equals: (a, b) => sameKeys(a ?? [], b ?? []),
      initial: this.currentExpanded(),
      onRequest: (request) => {
        this.expandedRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (!cancelled && moved) this.expanded.set(next);
  }

  protected toggle(key: string, reason: ImportExportPressReason, event: Event) {
    const keys = this.currentExpanded();
    this.requestExpanded(
      keys.includes(key) ? keys.filter((each) => each !== key) : [...keys, key],
      reason,
      event,
    );
  }

  /* ── Requests ──────────────────────────────────────────────────────── */

  protected press(part: string, key: string, event: Event) {
    const request = Object.assign(createRequest(pressReason(event), event), { key });
    (part === 'cancel' ? this.cancelRequest : this.retryRequest).emit(request);
  }

  protected removeOne(key: string, event: Event) {
    this.removeRequest.emit(
      Object.assign(createRequest(pressReason(event), event), { keys: [key] }),
    );
  }

  protected clear(event: Event) {
    this.removeRequest.emit(
      Object.assign(createRequest('clear' as const, event), {
        keys: this.finished().map((job) => job.key),
      }),
    );
  }

  protected askDownload(key: string, file: JobFileRole, event: Event) {
    const request = Object.assign(createRequest(pressReason(event), event), { file, key });
    this.downloadRequest.emit(request);
    if (request.cancelled) event.preventDefault();
  }

  protected open(key: string, event: Event) {
    const request = Object.assign(createRequest(pressReason(event), event), { key });
    this.openRequest.emit(request);
    if (request.cancelled) event.preventDefault();
  }

  protected loadMore(event: Event) {
    if (this.loading()) return;
    this.loadMoreRequest.emit(createRequest(pressReason(event), event));
  }

  protected reload(event: Event) {
    this.reloadRequest.emit(createRequest(pressReason(event), event));
  }

  /* ── Focus ─────────────────────────────────────────────────────────── */

  protected rememberFocus(event: FocusEvent) {
    const list = this.listElement()?.nativeElement;
    const target = event.target as HTMLElement | null;
    const job = target?.closest<HTMLElement>('[data-part="job"]') ?? null;
    if (list === undefined || target === null || job === null || !list.contains(job)) {
      this.memory = null;
      return;
    }
    const all = [...list.querySelectorAll<HTMLElement>(':scope > [data-part="job"]')];
    let part = 'job-title';
    for (
      let node: HTMLElement | null = target;
      node !== null && node !== job;
      node = node.parentElement
    ) {
      const name = node.dataset['part'];
      if (name !== undefined && (FOCUSABLE_PARTS as readonly string[]).includes(name)) {
        part = name;
        break;
      }
    }
    this.memory = { element: target, index: all.indexOf(job), key: job.dataset['key'] ?? '', part };
  }

  private focusPart(list: HTMLElement, key: string, part: string) {
    const job = list.querySelector<HTMLElement>(
      `:scope > [data-part="job"][data-key="${CSS.escape(key)}"]`,
    );
    const holder = job?.querySelector<HTMLElement>(`[data-part="${part}"]`) ?? null;
    const target =
      holder === null
        ? null
        : holder.matches('button, a, [tabindex]')
          ? holder
          : holder.querySelector<HTMLElement>('button, a');
    target?.focus();
  }

  private restoreFocus() {
    const kept = this.memory;
    const list = this.listElement()?.nativeElement;
    if (kept === null || list === undefined || kept.element.isConnected) return;
    const active = list.ownerDocument.activeElement;
    if (active !== null && active !== list.ownerDocument.body) return;
    const drawn: FocusableJob[] = [
      ...list.querySelectorAll<HTMLElement>(':scope > [data-part="job"][data-key]'),
    ].map((job) => ({
      key: job.dataset['key'] ?? '',
      parts: FOCUSABLE_PARTS.filter(
        (part) => part !== 'job-title' && job.querySelector(`[data-part="${part}"]`) !== null,
      ),
    }));
    const destination = focusDestination(kept, drawn);
    this.memory = null;
    if ('list' in destination) list.focus();
    else this.focusPart(list, destination.key, destination.part);
  }

  private finishReveal() {
    const key = this.revealing;
    const list = this.listElement()?.nativeElement;
    if (key === null || list === undefined) return;
    this.revealing = null;
    const job = list.querySelector<HTMLElement>(
      `:scope > [data-part="job"][data-key="${CSS.escape(key)}"]`,
    );
    if (job === null) return;
    job.scrollIntoView?.({ block: 'nearest' });
    job.querySelector<HTMLElement>('[data-part="job-title"]')?.focus({ preventScroll: true });
  }

  /** The element the family renders on: the region a consumer's ref reaches. */
  get element(): HTMLElement {
    return this.native;
  }
}
