import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/import-export-center/import-export-center.css';

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
  ImportExportTranslator,
  JobControl,
  JobFile,
  JobFileRole,
  ProgressSample,
} from '@slotted/core/import-export-center';
import { importExportCenterMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { formatTimestamp } from '@slotted/core/timeline';
import type { TimestampValue } from '@slotted/core/timeline';
import { fileKind, formatBytes, splitName } from '@slotted/core/upload';
import type { FileKind } from '@slotted/core/upload';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { Button, ButtonLink } from '../button';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { ProgressBar } from '../progress-indicator';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import { Skeleton, SkeletonText } from '../skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
} from '../table';
import { Tab, TabList, Tabs } from '../tabs';
import type { TabsChangeRequest } from '../tabs';
import { Tooltip, TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip';
import { useImportExportCenterDefaults } from './import-export-center-defaults';
import type {
  ImportExportCenterProps,
  ImportExportCenterRootProps,
  ImportExportModelReason,
  ImportExportPressReason,
  ImportExportRequest,
  ImportExportView,
} from './import-export-center.types';
import { SPINNER_RING } from '../button/spinner-ring';

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

/** How many skeleton jobs stand in while nothing has arrived. */
const WAITING_ROWS = 3;

/** How many updates of one job the estimate keeps. */
const SAMPLE_LIMIT = 12;

/** A deadline is a date: day, month and time, in every time format. */
const DEADLINE: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

function createRequest<Reason extends string>(
  reason: Reason,
  source: unknown,
): ImportExportRequest<Reason> {
  let cancelled = false;
  return {
    reason,
    source,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent): ImportExportPressReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function presentNode(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false;
}

/** An identifier a key can be part of: word characters and hyphens stay, the rest is spelled out. */
function escapeKey(key: string): string {
  return key.replace(/[^\w-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`);
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/** The file whose kind the tile draws: the result, then the source, then the format alone. */
function kindOf(job: ImportExportJob): FileKind {
  const file = job.result ?? job.source;
  if (file !== undefined) return fileKind({ name: file.name, type: file.type ?? '' });
  if (job.format !== undefined)
    return fileKind({ name: `job.${job.format.toLowerCase()}`, type: '' });
  return 'other';
}

/** The name and its extension as one run in the name's own direction. */
function FileName({ name }: { name: string }) {
  const { stem, extension } = splitName(name);
  return (
    <span data-part="file-name" data-part-file-name="" dir="auto">
      <span data-part="name" data-part-name="">
        {stem}
      </span>
      {extension === '' ? null : (
        <span data-part="extension" data-part-extension="">
          {extension}
        </span>
      )}
    </span>
  );
}

/**
 * The family's one icon control, named by a tooltip with the words its
 * accessible name carries: a cross with no words beside it is a control
 * nobody can tell apart until it is named.
 */
function RemoveControl({
  label,
  describedBy,
  onPress,
}: {
  label: string;
  describedBy: string;
  onPress: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip openOn="hover" side="bottom">
      <TooltipTrigger
        aria-describedby={describedBy}
        aria-label={label}
        data-part="remove"
        data-part-remove=""
        onClick={onPress}
      >
        <Icon>
          <Glyph name="x" />
        </Icon>
      </TooltipTrigger>
      <TooltipLayer>
        <TooltipContent>{label}</TooltipContent>
      </TooltipLayer>
    </Tooltip>
  );
}

interface JobContext {
  ids: (key: string) => {
    title: string;
    status: string;
    toggle: string;
    details: string;
    control: (part: string) => string;
  };
  locale: string;
  /** The family's words in the language in force, with the center's `messages` laid over them. */
  t: ImportExportTranslator;
  now: number | undefined;
  remaining: ReadonlyMap<string, number | null>;
  timeFormat: 'relative' | 'absolute';
  timeZone: string | undefined;
  expanded: ReadonlySet<string>;
  onToggle: (key: string, reason: ImportExportModelReason, source: unknown) => void;
  onCancel: ImportExportCenterProps['onCancel'];
  onRetry: ImportExportCenterProps['onRetry'];
  onRemove: ImportExportCenterProps['onRemove'];
  onDownload: ImportExportCenterProps['onDownload'];
  onOpen: ImportExportCenterProps['onOpen'];
  renderJobActions: ImportExportCenterProps['renderJobActions'];
}

/**
 * One download: the button family's link when the file has an address, and a
 * button that asks the consumer to produce it when it has none.
 */
function DownloadControl({
  context,
  file,
  job,
  role,
  label,
  id,
  labelledBy,
  describedBy,
  variant,
}: {
  context: JobContext;
  file: JobFile;
  job: ImportExportJob;
  role: JobFileRole;
  label: string;
  id?: string | undefined;
  labelledBy?: string | undefined;
  describedBy?: string | undefined;
  variant: 'outline' | 'ghost';
}) {
  const ask = (event: MouseEvent<HTMLElement>) => {
    const request = createRequest(pressReason(event), event);
    context.onDownload?.({ key: job.key, file: role }, request);
    if (request.cancelled) event.preventDefault();
  };
  const wiring = {
    ...(id === undefined ? {} : { id }),
    ...(labelledBy === undefined ? {} : { 'aria-labelledby': labelledBy }),
    ...(describedBy === undefined ? {} : { 'aria-describedby': describedBy }),
  };
  return (
    <span data-part="download" data-part-download="">
      {file.href === undefined ? (
        <Button {...wiring} onClick={ask} size="sm" tone="secondary" variant={variant}>
          {label}
        </Button>
      ) : (
        <ButtonLink
          {...wiring}
          download={file.name}
          href={file.href}
          onClick={ask}
          size="sm"
          tone="secondary"
          variant={variant}
        >
          {label}
        </ButtonLink>
      )}
    </span>
  );
}

function deadlineText(value: TimestampValue, context: JobContext): string {
  return formatTimestamp(value, {
    absolute: DEADLINE,
    format: 'absolute',
    locale: context.locale,
    timeZone: context.timeZone,
  }).text;
}

/** The sentence under the status: the failure, the denial, or the deadline. */
function messageOf(job: ImportExportJob, context: JobContext): string | null {
  if (job.message !== undefined && job.message !== '') return job.message;
  const clock = { now: context.now, timeZone: context.timeZone };
  const result = job.result;
  const availability = fileAvailability(result, clock);
  if (result === undefined) return null;
  if (availability === 'denied') return result.denied ?? null;
  if (result.expiresAt === undefined) return null;
  if (availability === 'expired')
    return context.t('expired', { date: deadlineText(result.expiresAt, context) });
  if (availability === 'expires')
    return context.t('expires', { date: deadlineText(result.expiresAt, context) });
  return null;
}

function Details({ context, job }: { context: JobContext; job: ImportExportJob }) {
  const { t, locale } = context;
  const ids = context.ids(job.key);
  const count = new Intl.NumberFormat(locale);
  const clock = { now: context.now, timeZone: context.timeZone };
  const counts = job.counts ?? {};
  const countKeys = (
    ['total', 'processed', 'created', 'updated', 'skipped', 'failed'] as const
  ).filter((name) => typeof counts[name] === 'number');
  const files = (
    [
      ['source', job.source],
      ['result', job.result],
      ['errors', job.errorsFile],
    ] as const
  ).filter((entry): entry is readonly [JobFileRole, JobFile] => entry[1] !== undefined);
  const errors = job.errors ?? [];
  const total = Math.max(job.errorCount ?? 0, errors.length);

  return (
    <div
      aria-labelledby={ids.toggle}
      data-part="details"
      data-part-details=""
      id={ids.details}
      role="region"
    >
      {countKeys.length > 0 ? (
        <dl data-part="counts" data-part-counts="">
          {countKeys.map((name) => (
            <div data-count={name} key={name}>
              <dt>{t(`countLabels.${name}`)}</dt>
              <dd>{count.format(counts[name] ?? 0)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {files.length > 0 ? (
        <ul data-part="files" data-part-files="">
          {files.map(([role, file]) => {
            const availability = fileAvailability(file, clock);
            const note =
              availability === 'denied'
                ? file.denied
                : file.expiresAt === undefined
                  ? undefined
                  : availability === 'expired'
                    ? t('expired', { date: deadlineText(file.expiresAt, context) })
                    : t('expires', { date: deadlineText(file.expiresAt, context) });
            const canDownload = availability === 'available' || availability === 'expires';
            return (
              <li data-part="file" data-part-file="" data-availability={availability} key={role}>
                <span data-part="meta" data-part-meta="">
                  <strong>{t(`fileLabels.${role}`)}</strong>
                  <span>
                    <FileName name={file.name} />
                  </span>
                  {file.size === undefined ? null : <span>{formatBytes(file.size, locale)}</span>}
                  {note === undefined ? null : <span>{note}</span>}
                </span>
                {canDownload ? (
                  <DownloadControl
                    context={context}
                    file={file}
                    job={job}
                    label={t('download')}
                    role={role}
                    variant="ghost"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {errors.length > 0 ? (
        <div data-part="errors" data-part-errors="">
          <Table columns={4} variant="framed">
            <TableContent>
              <TableCaption>{t('errorsCaption')}</TableCaption>
              <TableHead>
                <TableRow>
                  <TableColumnHeader numeric>{t('errorColumns.row')}</TableColumnHeader>
                  <TableColumnHeader>{t('errorColumns.message')}</TableColumnHeader>
                  <TableColumnHeader>{t('errorColumns.column')}</TableColumnHeader>
                  <TableColumnHeader>{t('errorColumns.value')}</TableColumnHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {errors.map((error, index) => (
                  <TableRow key={`${error.row}-${index}`}>
                    <TableCell numeric>{count.format(error.row)}</TableCell>
                    <TableCell>{error.message}</TableCell>
                    <TableCell>{error.column ?? ''}</TableCell>
                    <TableCell>{error.value ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContent>
          </Table>
          {total > errors.length ? (
            <p data-part="errors-note" data-part-errors-note="">
              <span>{t('sample', { shown: errors.length, total })}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Job({ context, job }: { context: JobContext; job: ImportExportJob }) {
  const { t, locale } = context;
  const ids = context.ids(job.key);
  const clock = { now: context.now, timeZone: context.timeZone };
  const outcome = jobOutcome(job);
  const controls = jobControls(job, clock);
  const expanded = context.expanded.has(job.key) && controls.controls.includes('toggle');
  const mark = jobGlyph(job);
  const file = job.direction === 'export' ? (job.result ?? job.source) : (job.source ?? job.result);
  const when =
    job.status === 'succeeded' || job.status === 'failed'
      ? (job.finishedAt ?? job.createdAt)
      : job.createdAt;
  const time =
    when === undefined
      ? null
      : formatTimestamp(when, {
          format: context.timeFormat,
          locale,
          now: context.now,
          timeZone: context.timeZone,
        });
  const progressText =
    job.status === 'running'
      ? jobProgressText(job, { locale, t, remaining: context.remaining.get(job.key) })
      : [];
  const summary = jobSummaryText(job, { locale, t });
  const message = messageOf(job, context);
  const actions = context.renderJobActions?.(job);
  const labelled = (part: string) => `${ids.control(part)} ${ids.title}`;

  const onTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const request = createRequest(pressReason(event), event);
    context.onOpen?.(job.key, request);
    if (request.cancelled) event.preventDefault();
  };

  const control = (part: JobControl): ReactNode => {
    switch (part) {
      case 'download': {
        const role = controls.download ?? 'result';
        const target = role === 'errors' ? job.errorsFile : job.result;
        if (target === undefined) return null;
        return (
          <DownloadControl
            context={context}
            describedBy={ids.status}
            file={target}
            id={ids.control('download')}
            job={job}
            key={part}
            label={role === 'errors' ? t('downloadErrors') : t('download')}
            labelledBy={labelled('download')}
            role={role}
            variant="outline"
          />
        );
      }
      case 'cancel':
      case 'retry':
        return (
          <span data-part={part} {...selectorKeyProps('part', part)} key={part}>
            <Button
              aria-describedby={ids.status}
              aria-labelledby={labelled(part)}
              id={ids.control(part)}
              onClick={(event) =>
                (part === 'cancel' ? context.onCancel : context.onRetry)?.(
                  job.key,
                  createRequest(pressReason(event), event),
                )
              }
              size="sm"
              tone="secondary"
              variant="outline"
            >
              {part === 'cancel'
                ? t('cancel')
                : controls.retry === 'regenerate'
                  ? t('regenerate')
                  : t('retry')}
            </Button>
          </span>
        );
      case 'toggle':
        return (
          <span
            data-part="toggle"
            data-part-toggle=""
            key={part}
            {...(expanded ? { 'data-expanded': '' } : {})}
          >
            <Button
              aria-controls={ids.details}
              aria-expanded={expanded}
              aria-labelledby={`${ids.toggle} ${ids.title}`}
              end={
                <span data-part="chevron" data-part-chevron="">
                  <Icon>
                    <Glyph name="chevron-down" />
                  </Icon>
                </span>
              }
              id={ids.toggle}
              onClick={(event) => context.onToggle(job.key, pressReason(event), event)}
              size="sm"
              tone="secondary"
              variant="ghost"
            >
              {t('details')}
            </Button>
          </span>
        );
      case 'remove':
        return (
          <RemoveControl
            describedBy={ids.title}
            key={part}
            label={t('remove')}
            onPress={(event) =>
              context.onRemove?.({ keys: [job.key] }, createRequest(pressReason(event), event))
            }
          />
        );
      default:
        return null;
    }
  };

  const ordered = controls.controls.filter((part) => part !== 'remove');

  return (
    <li
      data-direction={job.direction}
      data-key={job.key}
      data-part="job"
      data-part-job=""
      data-status={job.status}
      {...(outcome === null ? {} : { 'data-outcome': outcome })}
      {...(controls.expired ? { 'data-expired': '' } : {})}
      {...(expanded ? { 'data-expanded': '' } : {})}
    >
      <span aria-hidden="true" data-kind={kindOf(job)} data-part="visual" data-part-visual="">
        <Icon>
          <Glyph name={KIND_GLYPH[kindOf(job)]} />
        </Icon>
      </span>
      <div data-part="body" data-part-body="">
        <div data-part="heading" data-part-heading="">
          {job.href === undefined ? (
            <span data-part="job-title" data-part-job-title="" id={ids.title} tabIndex={-1}>
              {job.title}
            </span>
          ) : (
            <a
              data-part="job-title"
              data-part-job-title=""
              href={job.href}
              id={ids.title}
              onClick={onTitleClick}
            >
              {job.title}
            </a>
          )}
          <p data-part="meta" data-part-meta="">
            <span>{t(job.direction)}</span>
            {job.format === undefined ? null : <span>{job.format}</span>}
            {file === undefined ? null : (
              <span>
                <FileName name={file.name} />
              </span>
            )}
            {file?.size === undefined ? null : <span>{formatBytes(file.size, locale)}</span>}
            {job.actor === undefined ? null : <span>{job.actor}</span>}
            {time === null ? null : (
              <time
                data-part="time"
                data-part-time=""
                dateTime={time.dateTime}
                {...(time.title === null ? {} : { title: time.title })}
              >
                {time.text}
              </time>
            )}
          </p>
        </div>
        <div data-part="status" data-part-status="" id={ids.status}>
          <span aria-hidden="true" data-part="mark" data-part-mark="">
            {mark === 'spinner' ? (
              <span data-ui="spinner" data-ui-spinner="">
                {SPINNER_RING}
              </span>
            ) : (
              <Icon>
                <Glyph name={mark} />
              </Icon>
            )}
          </span>
          <span data-part="status-label" data-part-status-label="">
            <span>{jobStatusText(job, t)}</span>
            {job.stage === undefined || job.stage === '' ? null : (
              <span data-part="stage" data-part-stage="" title={job.stage}>
                {job.stage}
              </span>
            )}
          </span>
        </div>
        {job.status === 'running' ? (
          <div data-part="progress" data-part-progress="">
            <ProgressBar
              aria-labelledby={ids.title}
              delay={0}
              hideLabel
              max={job.progress?.max ?? 100}
              size="sm"
              tone="accent"
              value={job.progress?.value ?? null}
              {...(progressText.length > 0 ? { valueText: progressText.join(', ') } : {})}
            />
            {progressText.length > 0 ? (
              <span data-part="progress-text" data-part-progress-text="">
                {progressText.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            ) : null}
          </div>
        ) : null}
        {summary.length > 0 ? (
          <p data-part="summary" data-part-summary="">
            {summary.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </p>
        ) : null}
        {message === null ? null : (
          <p data-part="message" data-part-message="">
            {message}
          </p>
        )}
      </div>
      {ordered.length > 0 || presentNode(actions) || controls.controls.includes('remove') ? (
        <div data-part="controls" data-part-controls="">
          {ordered.map(control)}
          {presentNode(actions) ? (
            <span data-part="job-actions" data-part-job-actions="">
              {actions}
            </span>
          ) : null}
          {controls.controls.includes('remove') ? control('remove') : null}
        </div>
      ) : null}
      {expanded && hasDetails(job) ? <Details context={context} job={job} /> : null}
    </li>
  );
}

/**
 * The jobs an application runs away from the page — imports and exports —
 * and what the reader can do about each.
 *
 * **It holds none of the facts.** `jobs` is the consumer's array: a job's
 * status, its progress, its files and its rows. Cancelling, retrying,
 * removing, downloading, opening and loading are requests with a reason, and
 * the store answers by changing the array. The family never opens a
 * connection and never transfers a byte: `upload` does, in the import dialog
 * the consumer puts in `actions`.
 *
 * **Two values move:** the view (`view` / `defaultView` / `onViewChange`)
 * and the jobs whose details are shown (`expanded` / `defaultExpanded` /
 * `onExpandedChange`).
 *
 * **What a job offers is one table,** `jobControls` in
 * `@slotted/core/import-export-center`, which the Angular binding renders
 * too. A job that finished with failed rows is `partial`, derived from the
 * counts. A transition is announced once, politely; progress is not.
 *
 * **Focus never falls to the body.** A job that finishes while focus is on
 * Cancel keeps focus in the job; a job that leaves takes focus to the same
 * control of the job in its place.
 */
export function ImportExportCenter({
  actions,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  defaultExpanded,
  defaultView,
  empty,
  expanded,
  footer,
  growing,
  hasMore = false,
  jobs,
  level,
  loading = false,
  locale,
  messages,
  now,
  onCancel,
  onDownload,
  onExpandedChange,
  onLoadMore,
  onOpen,
  onReload,
  onRemove,
  onRetry,
  onViewChange,
  ref,
  render,
  renderJobActions,
  size,
  status = 'ready',
  style,
  timeFormat,
  timeZone,
  view,
  views,
  ...nativeProps
}: ImportExportCenterProps) {
  const defaults = useImportExportCenterDefaults();
  const baseId = `slotted-import-export-center-${useId().replace(/[^\w-]/g, '')}`;
  const titleId = `${baseId}-title`;
  const listId = `${baseId}-list`;

  const resolvedGrowing = growing ?? defaults.growing;
  const resolvedLevel = level ?? defaults.level;
  const contextLocale = useLocale();
  const resolvedLocale = locale ?? contextLocale;
  const resolvedSize = size ?? defaults.size;
  const resolvedTimeFormat = timeFormat ?? defaults.timeFormat;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const t = useMessages(importExportCenterMessages, messages);

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  /* ── The view ──────────────────────────────────────────────────────── */

  const resolvedViews: readonly ImportExportView[] = useMemo(
    () =>
      views ?? [
        { label: t('all'), value: 'all' },
        { label: t('imports'), value: 'import' },
        { label: t('exports'), value: 'export' },
      ],
    [views, t],
  );
  const [ownView, setOwnView] = useState<string | undefined>(defaultView);
  const currentView = view ?? ownView ?? resolvedViews[0]?.value ?? 'all';

  /* ── The expanded set ──────────────────────────────────────────────── */

  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>(defaultExpanded ?? []);
  const currentExpanded = expanded ?? ownExpanded;

  const latest = useRef({
    currentExpanded,
    currentView,
    expanded,
    onExpandedChange,
    onViewChange,
    view,
  });
  latest.current = { currentExpanded, currentView, expanded, onExpandedChange, onViewChange, view };

  const selectView = useCallback((next: string, reason: ChangeReason, source: unknown) => {
    if (next === latest.current.currentView) return;
    let cancelled = false;
    const state = createControllable<string>({
      controlled: latest.current.view,
      initial: latest.current.currentView,
      onRequest: (request) => {
        latest.current.onViewChange?.(request.value, request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (!cancelled && moved) setOwnView(next);
  }, []);

  const requestExpanded = useCallback(
    (next: readonly string[], reason: ChangeReason, source: unknown): boolean => {
      if (sameKeys(next, latest.current.currentExpanded)) return true;
      let cancelled = false;
      const state = createControllable<readonly string[]>({
        controlled: latest.current.expanded,
        equals: sameKeys,
        initial: latest.current.currentExpanded,
        onRequest: (request) => {
          latest.current.onExpandedChange?.(request.value, request);
          cancelled = request.cancelled;
        },
      });
      const moved = state.request(next, reason, source);
      if (!cancelled && moved) setOwnExpanded(next);
      return !cancelled;
    },
    [],
  );

  const toggle = useCallback(
    (key: string, reason: ImportExportModelReason, source: unknown) => {
      const keys = latest.current.currentExpanded;
      requestExpanded(
        keys.includes(key) ? keys.filter((each) => each !== key) : [...keys, key],
        reason,
        source,
      );
    },
    [requestExpanded],
  );

  /** A key that left the jobs leaves an uncontrolled set on the next render. */
  useEffect(() => {
    if (expanded !== undefined) return;
    const present = new Set(jobs.map((job) => job.key));
    const kept = ownExpanded.filter((key) => present.has(key));
    if (kept.length !== ownExpanded.length) setOwnExpanded(kept);
  }, [jobs, expanded, ownExpanded]);

  /* ── Transitions, announced once ───────────────────────────────────── */

  const previous = useRef<ReadonlyMap<string, ImportExportJob> | null>(null);
  useEffect(() => {
    const seen = previous.current;
    previous.current = new Map(jobs.map((job) => [job.key, job]));
    if (seen === null) return;
    for (const job of jobs) {
      const transition = jobTransition(seen.get(job.key), job);
      if (transition === null) continue;
      getLiveAnnouncer().announce(jobAnnouncement(transition, job, t));
    }
    /* The jobs are the dependency; the words are not state. */
  }, [jobs]);

  /* ── The time left ─────────────────────────────────────────────────── */

  const samples = useRef(new Map<string, ProgressSample[]>());
  const [remaining, setRemaining] = useState<ReadonlyMap<string, number | null>>(new Map());
  useEffect(() => {
    const clock = now ?? Date.now();
    const next = new Map<string, number | null>();
    for (const job of jobs) {
      if (job.status !== 'running') {
        samples.current.delete(job.key);
        continue;
      }
      const value = job.progress?.value;
      const max = job.progress?.max;
      const list = samples.current.get(job.key) ?? [];
      if (value !== undefined && max !== undefined && list.at(-1)?.value !== value) {
        list.push({ at: Date.now(), max, value });
        if (list.length > SAMPLE_LIMIT) list.shift();
        samples.current.set(job.key, list);
      }
      next.set(job.key, remainingSeconds(job, list, { now: clock, timeZone: resolvedTimeZone }));
    }
    setRemaining(next);
  }, [jobs, now, resolvedTimeZone]);

  /* ── Focus that never falls to the body ────────────────────────────── */

  const memory = useRef<(FocusMemory & { element: HTMLElement }) | null>(null);

  const rememberFocus = (event: FocusEvent<HTMLUListElement>) => {
    const target = event.target;
    const job = target.closest<HTMLElement>('[data-part="job"]');
    if (job === null || !listRef.current?.contains(job)) {
      memory.current = null;
      return;
    }
    const all = [
      ...(listRef.current?.querySelectorAll<HTMLElement>(':scope > [data-part="job"]') ?? []),
    ];
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
    memory.current = {
      element: target,
      index: all.indexOf(job),
      key: job.dataset['key'] ?? '',
      part,
    };
  };

  const focusPart = (key: string, part: string): boolean => {
    const job = listRef.current?.querySelector<HTMLElement>(
      `:scope > [data-part="job"][data-key="${CSS.escape(key)}"]`,
    );
    const holder = job?.querySelector<HTMLElement>(`[data-part="${part}"]`);
    const target =
      holder === null || holder === undefined
        ? null
        : holder.matches('button, a, [tabindex]')
          ? holder
          : holder.querySelector<HTMLElement>('button, a');
    if (target === null) return false;
    target.focus();
    return true;
  };

  useLayoutEffect(() => {
    const kept = memory.current;
    const list = listRef.current;
    if (kept === null || list === null || kept.element.isConnected) return;
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
    memory.current = null;
    if ('list' in destination) {
      list.focus();
      return;
    }
    focusPart(destination.key, destination.part);
  });

  /* ── Reveal, for the toast's View ──────────────────────────────────── */

  const revealing = useRef<string | null>(null);
  const reveal = useCallback(
    (key: string) => {
      if (!jobs.some((job) => job.key === key)) return;
      const keys = latest.current.currentExpanded;
      if (!keys.includes(key)) requestExpanded([...keys, key], 'programmatic', undefined);
      revealing.current = key;
      /* A job the current view hides is shown by returning to all. */
      const job = jobs.find((each) => each.key === key);
      if (job !== undefined && filterJobs([job], latest.current.currentView).length === 0) {
        selectView('all', 'programmatic', undefined);
      }
    },
    [jobs, requestExpanded, selectView],
  );

  useLayoutEffect(() => {
    const key = revealing.current;
    if (key === null) return;
    revealing.current = null;
    const job = listRef.current?.querySelector<HTMLElement>(
      `:scope > [data-part="job"][data-key="${CSS.escape(key)}"]`,
    );
    if (job === null || job === undefined) return;
    job.scrollIntoView?.({ block: 'nearest' });
    job.querySelector<HTMLElement>('[data-part="job-title"]')?.focus({ preventScroll: true });
  });

  const visibleJobs = useMemo(() => filterJobs(jobs, currentView), [jobs, currentView]);

  const focusFirst = useCallback(() => {
    const first = listRef.current?.querySelector<HTMLElement>(
      ':scope > [data-part="job"] :is(a[data-part="job-title"], [data-part="controls"] button, [data-part="controls"] a)',
    );
    (first ?? listRef.current)?.focus();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return root;
      },
      focus: focusFirst,
      reveal,
    }),
    [root, focusFirst, reveal],
  );

  /* ── Rendering ─────────────────────────────────────────────────────── */

  const ids = useCallback(
    (key: string) => {
      const prefix = `${baseId}-${escapeKey(key)}`;
      return {
        control: (part: string) => `${prefix}-${part}`,
        details: `${prefix}-details`,
        status: `${prefix}-status`,
        title: `${prefix}-title`,
        toggle: `${prefix}-toggle`,
      };
    },
    [baseId],
  );

  const context: JobContext = {
    expanded: new Set(currentExpanded),
    ids,
    locale: resolvedLocale,
    now,
    onCancel,
    onDownload,
    onOpen,
    onRemove,
    onRetry,
    onToggle: toggle,
    remaining,
    renderJobActions,
    t,
    timeFormat: resolvedTimeFormat,
    timeZone: resolvedTimeZone,
  };

  const Heading = `h${resolvedLevel}` as 'h2' | 'h3' | 'h4';
  const active = activeJobCount(jobs);
  const finished = visibleJobs.filter((job) => isFinishedJob(job) && job.removable !== false);
  const waiting = loading && visibleJobs.length === 0;
  const failed = status === 'error';
  const showEmpty = !failed && !waiting && visibleJobs.length === 0;

  const emptyTitle =
    currentView === 'import'
      ? t('emptyImports')
      : currentView === 'export'
        ? t('emptyExports')
        : t('empty');

  const rootProps: ImportExportCenterRootProps = keyedProps({
    ...nativeProps,
    ...(ariaLabel !== undefined
      ? { 'aria-label': ariaLabel }
      : { 'aria-labelledby': ariaLabelledby ?? titleId }),
    children: (
      <>
        <div data-part="header" data-part-header="">
          <Heading data-part="title" data-part-title="" id={titleId}>
            {t('title')}
            {active > 0 ? (
              <>
                {' '}
                <span data-part="count" data-part-count="">
                  {t('active', { count: active })}
                </span>
              </>
            ) : null}
          </Heading>
          {finished.length > 0 || presentNode(actions) ? (
            <div data-part="tools" data-part-tools="">
              {finished.length > 0 ? (
                <span data-part="clear" data-part-clear="">
                  <Button
                    onClick={(event) =>
                      onRemove?.(
                        { keys: finished.map((job) => job.key) },
                        createRequest('clear' as const, event),
                      )
                    }
                    size="sm"
                    tone="secondary"
                    variant="ghost"
                  >
                    {t('clear')}
                  </Button>
                </span>
              ) : null}
              {presentNode(actions) ? (
                <div data-part="actions" data-part-actions="">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {resolvedViews.length > 1 ? (
          <div data-part="views" data-part-views="">
            <Tabs
              onValueChange={(value: string, request: TabsChangeRequest) =>
                selectView(value, request.reason, request.source)
              }
              size={resolvedSize}
              track="none"
              value={currentView}
            >
              <TabList aria-label={t('views')}>
                {resolvedViews.map((entry) => (
                  <Tab controls={listId} key={entry.value} value={entry.value}>
                    {entry.label}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          </div>
        ) : null}
        {failed ? (
          <div data-part="error" data-part-error="">
            <ResultState live="off" reach="section" status="error">
              <ResultStateContent>
                <ResultStateTitle>{t('loadError')}</ResultStateTitle>
                <ResultStateDescription>{t('loadErrorDescription')}</ResultStateDescription>
              </ResultStateContent>
              <ResultStateActions>
                <Button
                  onClick={(event) => onReload?.(createRequest(pressReason(event), event))}
                  size="sm"
                  tone="secondary"
                  variant="outline"
                >
                  {t('reload')}
                </Button>
              </ResultStateActions>
            </ResultState>
          </div>
        ) : showEmpty ? (
          <div data-part="empty" data-part-empty="">
            {empty ?? (
              <ResultState live="off" reach="section" status="empty">
                <ResultStateContent>
                  <ResultStateTitle>{emptyTitle}</ResultStateTitle>
                  <ResultStateDescription>{t('emptyDescription')}</ResultStateDescription>
                </ResultStateContent>
              </ResultState>
            )}
          </div>
        ) : (
          <ul
            aria-busy={loading ? true : undefined}
            aria-labelledby={titleId}
            data-part="list"
            data-part-list=""
            id={listId}
            onFocus={rememberFocus}
            ref={listRef}
            tabIndex={-1}
          >
            {waiting
              ? Array.from({ length: WAITING_ROWS }, (_, index) => (
                  <li aria-hidden="true" data-part="job" data-part-job="" key={index}>
                    <span data-part="visual" data-part-visual="">
                      <Skeleton shape="block" />
                    </span>
                    <div data-part="body" data-part-body="">
                      <SkeletonText lines={2} />
                      <SkeletonText lines={1} />
                    </div>
                  </li>
                ))
              : visibleJobs.map((job) => <Job context={context} job={job} key={job.key} />)}
          </ul>
        )}
        {!failed && resolvedGrowing === 'button' && hasMore && !waiting ? (
          <button
            aria-disabled={loading ? true : undefined}
            data-part="more"
            data-part-more=""
            {...(loading ? { 'data-loading': '' } : {})}
            onClick={(event) => {
              if (loading) return;
              onLoadMore?.(createRequest(pressReason(event), event));
            }}
            type="button"
          >
            {loading ? t('loading') : t('loadMore')}
          </button>
        ) : null}
        {presentNode(footer) ? (
          <div data-part="footer" data-part-footer="">
            {footer}
          </div>
        ) : null}
      </>
    ),
    className,
    'data-growing': resolvedGrowing,
    'data-level': resolvedLevel,
    ...(loading ? { 'data-loading': '' as const } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    ...(failed ? { 'data-status': 'error' as const } : {}),
    'data-time-format': resolvedTimeFormat,
    'data-ui': 'import-export-center',
    'data-view': currentView,
    style,
  });

  return render === undefined ? (
    <section {...rootProps} ref={setRoot} />
  ) : (
    render({ ...rootProps, ref: setRoot })
  );
}
