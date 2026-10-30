import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/upload/upload.css';

import { uploadMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import {
  createUploadRunner,
  estimateRemaining,
  isViewable,
  selectFiles,
  splitName,
  uploadSummary,
} from '@slotted/core/upload';
import type { UploadFile, UploadPatch, UploadRunner } from '@slotted/core/upload';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ClipboardEvent, DragEvent, ReactNode } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { ProgressBar } from '../progress-indicator';
import { useUploadDefaults, useUploadFormatters } from './upload-defaults';
import { KIND_GLYPH, UploadViewer } from './upload-viewer';
import type { UploadFilesReason, UploadHandle, UploadProps, UploadRootProps } from './upload.types';

/**
 * Files, and what happens to them.
 *
 * One family for what `docs/component-features.md` §17 lists as three: a drop
 * region, a file input, and the manager that shows what is being sent.
 *
 * **The trigger is the `<label>` and the region is not.** What the reader
 * focuses is an `<input type="file">` clipped to one pixel inside the trigger,
 * so the input's accessible name is the trigger's own text rather than every
 * word in the box, and the guidance can be as long as the product needs.
 *
 * **The family calls an adapter and reports what it says.** It holds no URL, no
 * method, no header and no credential.
 */
export function Upload({
  accept,
  adapter: adapterProp,
  allowDrop: allowDropProp,
  allowPaste: allowPasteProp,
  autoUpload: autoUploadProp,
  capture,
  children,
  className,
  clickToBrowse: clickToBrowseProp,
  concurrency: concurrencyProp,
  defaultFiles,
  defaultViewing = null,
  description,
  directory = false,
  disabled,
  duplicates: duplicatesProp,
  fileKey: fileKeyProp,
  files,
  handleRef,
  id,
  invalid,
  label,
  layout: layoutProp,
  locale: localeProp,
  maxFiles,
  maxRows: maxRowsProp,
  maxSize,
  maxTotalSize,
  messages,
  minFiles,
  minSize,
  multiple = false,
  name,
  onChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFilesChange,
  onPaste,
  onReject,
  onViewingChange,
  pendingBlocksSubmit: pendingProp,
  preventDocumentDrop: preventDocumentDropProp,
  preview: previewProp,
  readOnly,
  render,
  required,
  retries: retriesProp,
  retryDelay: retryDelayProp,
  size: sizeProp,
  stallAfter: stallAfterProp,
  style,
  transform,
  validate,
  variant: variantProp,
  view: viewProp,
  viewing,
  ...nativeProps
}: UploadProps) {
  const defaults = useUploadDefaults();
  const field = useField();
  const generated = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLLabelElement | null>(null);

  const variant = variantProp ?? defaults.variant;
  const layout = layoutProp ?? defaults.layout;
  const size = sizeProp ?? field?.size ?? defaults.size;
  const preview = previewProp ?? defaults.preview;
  const view = viewProp ?? defaults.view;
  const duplicates = duplicatesProp ?? defaults.duplicates;
  const clickToBrowse = clickToBrowseProp ?? defaults.clickToBrowse;
  const allowDrop = allowDropProp ?? defaults.allowDrop;
  const allowPaste = allowPasteProp ?? defaults.allowPaste;
  const preventDocumentDrop = preventDocumentDropProp ?? defaults.preventDocumentDrop;
  const autoUpload = autoUploadProp ?? defaults.autoUpload;
  const pendingBlocksSubmit = pendingProp ?? defaults.pendingBlocksSubmit;
  const adapter = adapterProp ?? defaults.adapter;
  const maxRows = maxRowsProp ?? defaults.maxRows;
  const contextLocale = useLocale();
  const locale = localeProp ?? contextLocale;
  const t = useMessages(uploadMessages, messages);
  const formatters = useUploadFormatters(locale);

  /** Why a file was refused, in the catalog's words for the reason the family measured. */
  const rejection = (file: UploadFile) =>
    file.reason === 'size'
      ? t('rejection.size', { size: formatters.bytes(file.size) })
      : t(`rejection.${file.reason ?? 'custom'}`);

  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedRequired = required ?? field?.required;
  const insideField = field !== undefined && field !== null;

  const [own, setOwn] = useState<readonly UploadFile[]>(defaultFiles ?? []);
  const current = files ?? own;
  const [ownViewing, setOwnViewing] = useState<string | null>(defaultViewing);
  const viewedKey = viewing === undefined ? ownViewing : viewing;

  /** The list as it is right now, for a callback that outlives the render. */
  const listRef = useRef(current);
  listRef.current = current;

  const request = useCallback(
    (next: readonly UploadFile[], reason: UploadFilesReason, source: unknown) => {
      const state = createControllable<readonly UploadFile[]>({
        controlled: files,
        initial: listRef.current,
        onRequest: (change) => onFilesChange?.(change.value, change),
        equals: (a, b) => a === b,
      });
      if (state.request(next, reason as ChangeReason, source)) setOwn(next);
      listRef.current = next;
    },
    [files, onFilesChange],
  );

  const patch = useCallback(
    (key: string, changes: UploadPatch) => {
      const next = listRef.current.map((file) =>
        file.key === key ? ({ ...file, ...changes } as UploadFile) : file,
      );
      request(next, 'programmatic', undefined);
    },
    [request],
  );

  /* ── The transfer ──────────────────────────────────────────────────── */

  const runnerRef = useRef<UploadRunner | null>(null);
  const [pausable, setPausable] = useState(false);
  useEffect(() => {
    if (adapter === undefined) {
      runnerRef.current = null;
      setPausable(false);
      return;
    }
    const runner = createUploadRunner({
      adapter,
      concurrency: concurrencyProp ?? defaults.concurrency,
      retries: retriesProp ?? defaults.retries,
      retryDelay: retryDelayProp ?? defaults.retryDelay,
      stallAfter: stallAfterProp ?? defaults.stallAfter,
      onPatch: patch,
    });
    runnerRef.current = runner;
    setPausable(runner.pausable);
    return () => {
      runner.destroy();
      runnerRef.current = null;
    };
  }, [
    adapter,
    concurrencyProp,
    defaults.concurrency,
    defaults.retries,
    defaults.retryDelay,
    defaults.stallAfter,
    patch,
    retriesProp,
    retryDelayProp,
    stallAfterProp,
  ]);

  /* ── Object URLs ───────────────────────────────────────────────────── */

  /**
   * The family created them, so the family revokes them. §14 requires the
   * revocation by name; Ant Design leaves it to the consumer and Uppy owns a
   * plugin for it.
   */
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(new Map());
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  useEffect(() => {
    const wanted = new Map(urlsRef.current);
    let moved = false;

    for (const file of current) {
      if (file.file === undefined || wanted.has(file.key)) continue;
      if (preview === 'none' && view === 'none') continue;
      if (!isViewable(file)) continue;
      wanted.set(file.key, URL.createObjectURL(file.file));
      moved = true;
    }

    const live = new Set(current.map((file) => file.key));
    for (const [key, url] of wanted) {
      if (live.has(key)) continue;
      URL.revokeObjectURL(url);
      wanted.delete(key);
      moved = true;
    }

    if (moved) setUrls(wanted);
  }, [current, preview, view]);

  useEffect(
    () => () => {
      for (const url of urlsRef.current.values()) URL.revokeObjectURL(url);
    },
    [],
  );

  /* ── Selection ─────────────────────────────────────────────────────── */

  const announce = (message: string) => {
    getLiveAnnouncer()?.announce(message);
  };

  const accepting = resolvedDisabled !== true && resolvedReadOnly !== true;

  const take = async (incoming: readonly File[], reason: UploadFilesReason, source: unknown) => {
    if (!accepting || incoming.length === 0) return;
    const prepared = transform === undefined ? [...incoming] : await transform([...incoming]);

    const existing = listRef.current;
    const outcome = selectFiles(prepared, existing, {
      accept,
      multiple,
      directory,
      maxFiles,
      maxSize,
      minSize,
      maxTotalSize,
      duplicates,
      validate,
      fileKey: fileKeyProp ?? defaults.fileKey,
    });

    request(outcome.files, reason, source);

    /* A refused file joins the list too, and is announced below with its reason. */
    const kept = outcome.files.filter(
      (file) => file.status !== 'rejected' && !existing.includes(file),
    ).length;
    if (kept > 0) announce(t('added', { count: kept }));
    if (outcome.rejected.length > 0) {
      onReject?.(outcome.rejected);
      for (const file of outcome.rejected) {
        announce(t('fileNotice', { name: file.name, message: rejection(file) }));
      }
    }

    if (!autoUpload) return;
    for (const file of outcome.files) {
      if (file.status !== 'ready' || file.file === undefined) continue;
      runnerRef.current?.enqueue(file.key, file.file);
    }
  };

  /* ── The drag ──────────────────────────────────────────────────────── */

  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [verdict, setVerdict] = useState<'target' | 'invalid' | null>(null);

  /**
   * `DataTransfer.items` exposes each item's `kind` and `type` during a drag and
   * neither its name nor its size. Three of the five rules are answerable
   * before the drop and two are not: what cannot be known is not judged, and the
   * refusal happens after the drop with a message. Painting a refusal on a maybe
   * would teach the reader that the red edge means nothing.
   */
  const judge = (transferred: DataTransfer | null): 'target' | 'invalid' => {
    const items = [...(transferred?.items ?? [])].filter((item) => item.kind === 'file');
    if (items.length === 0) return 'invalid';
    if (!multiple && items.length > 1) return 'invalid';
    if (maxFiles !== undefined && items.length > maxFiles) return 'invalid';
    if (accept === undefined || accept.trim() === '') return 'target';

    const refused = items.some((item) => item.type !== '' && !matchesTypeOnly(item.type, accept));
    return refused ? 'invalid' : 'target';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    onDragEnter?.(event);
    if (!allowDrop || !accepting) return;
    depth.current += 1;
    setDragging(true);
    setVerdict(judge(event.dataTransfer));
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    onDragLeave?.(event);
    if (!allowDrop || !accepting) return;
    /*
     * `dragenter` and `dragleave` fire for every element the pointer crosses,
     * so a drag moving onto a child fires `dragleave` on the region. Clearing
     * the state there makes the highlight flicker across the whole zone, which
     * is the single most common defect in a hand-written dropzone.
     */
    depth.current -= 1;
    if (depth.current > 0) return;
    depth.current = 0;
    setDragging(false);
    setVerdict(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    onDragOver?.(event);
    if (!allowDrop || !accepting) return;
    /* The default action of `dragover` is to refuse the drop, so a handler that
       does not cancel it gets no `drop` at all and the browser navigates to the
       dropped file instead. */
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    onDrop?.(event);
    if (!allowDrop || !accepting) return;
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    setVerdict(null);
    void take([...event.dataTransfer.files], 'pointer', event);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    onPaste?.(event);
    if (!allowPaste || !accepting) return;
    const pasted = [...event.clipboardData.files];
    if (pasted.length > 0) void take(pasted, 'keyboard', event);
  };

  /**
   * A file dropped beside the region navigates the browser to that file and
   * loses the form. One reference-counted document listener, and the drag it
   * knows about is published so an application can draw its own full-screen
   * zone — which is a decision about the application, not about a control.
   */
  const [documentDrag, setDocumentDrag] = useState(false);
  useEffect(() => {
    if (!preventDocumentDrop) return;
    const over = (event: globalThis.DragEvent) => {
      if (![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
      setDocumentDrag(true);
      if (!(event.target as Element | null)?.closest?.('[data-ui="upload"]')) {
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'none';
      }
    };
    const drop = (event: globalThis.DragEvent) => {
      setDocumentDrag(false);
      if (!(event.target as Element | null)?.closest?.('[data-ui="upload"]'))
        event.preventDefault();
    };
    document.addEventListener('dragover', over);
    document.addEventListener('drop', drop);
    document.addEventListener('dragend', drop);
    return () => {
      document.removeEventListener('dragover', over);
      document.removeEventListener('drop', drop);
      document.removeEventListener('dragend', drop);
    };
  }, [preventDocumentDrop]);

  /* ── The queue's own numbers ───────────────────────────────────────── */

  const summary = useMemo(() => uploadSummary(current), [current]);
  const samples = useRef<Array<{ at: number; loaded: number }>>([]);
  if (samples.current.at(-1)?.loaded !== summary.loaded) {
    samples.current = [...samples.current, { at: Date.now(), loaded: summary.loaded }].slice(-8);
  }
  const remaining = summary.pending ? estimateRemaining(samples.current, summary) : null;

  /**
   * None of the nine surveyed implementations answers what happens when a form
   * is submitted while the bytes are still moving, and the result is a record
   * saved with an attachment that never arrived. The native submit is refused
   * on the control the reader can see.
   */
  useEffect(() => {
    const element = inputRef.current;
    if (element === null) return;
    const short = minFiles !== undefined && summary.counts.success < minFiles;
    const blocked = pendingBlocksSubmit && summary.pending;
    element.setCustomValidity(blocked || short ? t('pending') : '');
  }, [t, minFiles, pendingBlocksSubmit, summary.counts.success, summary.pending]);

  /*
   * Said when the queue becomes finished, not whenever it is: a list that
   * mounts with every file already stored is the initial content, which the
   * contract keeps silent.
   */
  const finished = summary.complete && summary.total > 0;
  const finishedRef = useRef(finished);
  useEffect(() => {
    const was = finishedRef.current;
    finishedRef.current = finished;
    if (!finished || was) return;
    announce(t('finished', { uploaded: summary.counts.success, total: summary.total }));
  }, [finished, summary.counts.success, summary.total]);

  /*
   * A transfer that fails or is stopped is a status change the reader did not
   * necessarily cause and may not be looking at, so it is said. The previous
   * status of every row is kept to announce the change once rather than on
   * every render that still shows it; a row seen for the first time is the
   * list's initial content, which the contract keeps silent.
   */
  const statusesRef = useRef<ReadonlyMap<string, UploadFile['status']>>(new Map());
  useEffect(() => {
    const previous = statusesRef.current;
    for (const file of current) {
      const before = previous.get(file.key);
      if (before === undefined || before === file.status) continue;
      if (file.status === 'error' || file.status === 'canceled') {
        announce(t('fileNotice', { name: file.name, message: t(file.status) }));
      }
    }
    statusesRef.current = new Map(current.map((file) => [file.key, file.status]));
  }, [current, t]);

  /* ── What the reader can do to one row ─────────────────────────────── */

  const act = (
    file: UploadFile,
    action: 'start' | 'pause' | 'resume' | 'retry' | 'cancel' | 'remove',
    source: unknown,
  ) => {
    const runner = runnerRef.current;
    if (action === 'remove') {
      runner?.remove(file.key);
      request(
        listRef.current.filter((entry) => entry.key !== file.key),
        'remove',
        source,
      );
      if (viewedKey === file.key) setViewing(null, 'dismiss', source);
      return;
    }
    if (file.file === undefined || runner === null) return;
    if (action === 'start' || action === 'retry') runner.start(file.key, file.file);
    else if (action === 'pause') runner.pause(file.key);
    else if (action === 'resume') runner.resume(file.key);
    else runner.cancel(file.key);
  };

  const setViewing = (key: string | null, reason: string, source: unknown) => {
    const state = createControllable<string | null>({
      controlled: viewing,
      initial: viewedKey,
      onRequest: (change) => onViewingChange?.(change.value, change),
    });
    if (state.request(key, reason as ChangeReason, source)) setOwnViewing(key);
  };

  useImperativeHandle(handleRef, (): UploadHandle => ({
    browse: () => inputRef.current?.click(),
    upload: () => {
      for (const file of listRef.current) {
        if (file.status !== 'ready' || file.file === undefined) continue;
        runnerRef.current?.start(file.key, file.file);
      }
    },
    retryAll: () => {
      for (const file of listRef.current) {
        if (file.status !== 'error' || file.file === undefined) continue;
        runnerRef.current?.start(file.key, file.file);
      }
    },
    cancelAll: () => {
      for (const file of listRef.current) runnerRef.current?.cancel(file.key);
    },
    clear: () => {
      for (const file of listRef.current) runnerRef.current?.remove(file.key);
      request([], 'clear', undefined);
    },
    view: (key) => setViewing(key, 'programmatic', undefined),
  }));

  /* ── The picture ───────────────────────────────────────────────────── */

  const controls = (file: UploadFile): ReactNode => {
    if (resolvedReadOnly === true) return null;
    /* The control's name is the action's message holding the file's name, so a
       language writes its own order. */
    const button = (part: UploadAction, action: Parameters<typeof act>[1]) => (
      <button
        aria-label={t(action, { name: file.name })}
        data-part={part}
        {...selectorKeyProps('part', part)}
        key={part}
        onClick={(event) => act(file, action, event)}
        type="button"
      >
        <Icon>
          <Glyph name={ACTION_GLYPH[part]} />
        </Icon>
      </button>
    );

    switch (file.status) {
      case 'ready':
        return [button('start', 'start'), button('remove', 'remove')];
      case 'queued':
        return [button('cancel', 'cancel'), button('remove', 'remove')];
      case 'uploading':
        return [...(pausable ? [button('pause', 'pause')] : []), button('cancel', 'cancel')];
      case 'paused':
        return [button('start', 'resume'), button('cancel', 'cancel')];
      case 'stalled':
        return [button('cancel', 'cancel')];
      case 'error':
        return [button('retry', 'retry'), button('remove', 'remove')];
      case 'canceled':
        return [button('start', 'start'), button('remove', 'remove')];
      default:
        return [button('remove', 'remove')];
    }
  };

  const row = (file: UploadFile) => {
    const { stem, extension } = splitName(file.name);
    const url = urls.get(file.key);
    const openable = view !== 'none' && url !== undefined && isViewable(file);
    const showBar = ['uploading', 'paused', 'stalled'].includes(file.status);
    const percent =
      file.total !== undefined && file.total > 0 ? (file.loaded / file.total) * 100 : null;

    const nameProps = {
      'data-part': 'filename',
      ...selectorKeyProps('part', 'filename'),
      dir: 'auto' as const,
      children: (
        <>
          <span data-part="name" data-part-name="">
            {stem}
          </span>
          {extension === '' ? null : (
            <span data-part="extension" data-part-extension="">
              {extension}
            </span>
          )}
        </>
      ),
    };

    return (
      <li data-part="item" data-part-item="" data-status={file.status} key={file.key}>
        {preview === 'none' && layout === 'list' ? null : (
          <span
            data-extension={extension.replace('.', '').toUpperCase() || t('noExtension')}
            data-kind={file.kind}
            data-part="preview"
            data-part-preview=""
          >
            {url !== undefined && file.type.startsWith('image/') ? (
              <img alt="" src={url} />
            ) : (
              <Icon>
                <Glyph name={KIND_GLYPH[file.kind]} />
              </Icon>
            )}
          </span>
        )}

        <div data-part="body" data-part-body="">
          {openable ? (
            <button
              {...nameProps}
              onClick={(event) => setViewing(file.key, 'pointer', event)}
              type="button"
            />
          ) : (
            <span {...nameProps} />
          )}
          <div data-part="detail" data-part-detail="">
            <span data-part="meta" data-part-meta="">
              {formatters.bytes(file.size)}
            </span>
            <span data-part="status" data-part-status="">
              {t(file.status)}
              {percent !== null && showBar ? ` · ${Math.round(percent)}%` : ''}
            </span>
          </div>
        </div>

        <span data-part="actions" data-part-actions="">
          {controls(file)}
        </span>

        {showBar ? (
          <div data-part="progress" data-part-progress="">
            {/* The bar is `progress-indicator`'s. The row already says what is
                happening in words, so the bar is decorative here — the one case
                the feature guide names for it. */}
            <ProgressBar
              decorative
              size="sm"
              tone={file.status === 'uploading' ? 'accent' : 'warning'}
              value={percent}
            />
          </div>
        ) : null}

        {file.status === 'rejected' || file.status === 'error' ? (
          <p data-part="message" data-part-message="">
            {file.status === 'rejected' ? rejection(file) : t('error')}
          </p>
        ) : null}
      </li>
    );
  };

  const rootProps: UploadRootProps = keyedProps({
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedRequired === true ? { 'data-required': '' } : {}),
    ...(summary.pending ? { 'data-loading': '' } : {}),
    ...(summary.complete ? { 'data-complete': '' } : {}),
    ...(dragging || documentDrag ? { 'data-dragging': '' } : {}),
    className,
    'data-layout': layout,
    'data-part': 'root',
    'data-size': size,
    'data-ui': 'upload',
    'data-variant': variant,
    style,
    children: (
      <>
        {label === undefined || insideField ? null : (
          <span data-part="label" data-part-label="">
            {label}
          </span>
        )}
        {description === undefined || insideField ? null : (
          <p data-part="description" data-part-description="" id={`${id ?? generated}-description`}>
            {description}
          </p>
        )}

        {variant === 'button' ? (
          trigger()
        ) : (
          <div
            data-part="dropzone"
            data-part-dropzone=""
            {...(clickToBrowse && accepting ? { 'data-browsable': '' } : {})}
            {...(verdict === 'target' ? { 'data-drop-target': '' } : {})}
            {...(verdict === 'invalid' ? { 'data-drop-invalid': '' } : {})}
            onClick={(event) => {
              if (!clickToBrowse || !accepting) return;
              if ((event.target as Element).closest('[data-part="trigger"]')) return;
              triggerRef.current?.click();
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onPaste={handlePaste}
          >
            {/* The region carries the mark, so the trigger inside it does not. */}
            {variant === 'dropzone' ? (
              <>
                <Icon>
                  <Glyph name="upload" />
                </Icon>
                {t('dropzone')}
              </>
            ) : null}
            {trigger()}
            {variant === 'field' ? (
              <span data-part="meta" data-part-meta="">
                {current.length === 0
                  ? '—'
                  : current.length === 1
                    ? `${current[0]?.name} · ${formatters.bytes(current[0]?.size ?? 0)}`
                    : t('selection', { count: current.length })}
              </span>
            ) : null}
          </div>
        )}

        {current.length > 1 ? (
          <div data-part="summary" data-part-summary="">
            <span>
              {remaining === null
                ? t('summary', { uploaded: summary.counts.success, total: summary.total })
                : t('summaryRemaining', {
                    uploaded: summary.counts.success,
                    total: summary.total,
                    duration: formatters.duration(remaining),
                  })}
            </span>
            {resolvedReadOnly === true ? null : (
              <button
                data-part="clear"
                data-part-clear=""
                onClick={(event) => {
                  for (const file of listRef.current) runnerRef.current?.remove(file.key);
                  request([], 'clear', event);
                }}
                type="button"
              >
                {t('clear')}
              </button>
            )}
          </div>
        ) : null}

        {current.length === 0 || (variant === 'field' && current.length === 1) ? null : (
          <ul
            data-part="list"
            data-part-list=""
            style={
              {
                '--slotted-upload-visible-rows': maxRows === 0 ? current.length : maxRows,
              } as React.CSSProperties
            }
          >
            {current.map(row)}
          </ul>
        )}

        {children}

        <UploadViewer
          files={current}
          formatters={formatters}
          onViewing={setViewing}
          size={size}
          t={t}
          urls={urls}
          viewing={view === 'none' ? null : viewedKey}
        />
      </>
    ),
    ...nativeProps,
  });

  function trigger() {
    return (
      <label data-part="trigger" data-part-trigger="" ref={triggerRef}>
        {variant === 'dropzone' ? null : (
          <Icon>
            <Glyph name="upload" />
          </Icon>
        )}
        <input
          accept={accept}
          aria-describedby={
            [
              description === undefined ? undefined : `${id ?? generated}-description`,
              field?.describedBy,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          capture={capture}
          data-part="input"
          data-part-input=""
          disabled={resolvedDisabled}
          id={id ?? field?.ids.control}
          multiple={multiple}
          name={name}
          onChange={(event) => {
            onChange?.(event);
            void take([...(event.currentTarget.files ?? [])], 'select', event);
            /* The element is emptied so that choosing the same file twice is
               two selections rather than one silent nothing. */
            event.currentTarget.value = '';
          }}
          ref={inputRef}
          required={resolvedRequired}
          type="file"
          {...(directory ? { webkitdirectory: '' } : {})}
        />
        {t('trigger')}
      </label>
    );
  }

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The half of `accept` a drag can answer. A token that names an extension says
 * nothing about an item whose name the platform has not given us yet, so it is
 * skipped rather than guessed at.
 */
/**
 * Five marks chosen against each other, because they appear together on one
 * row. A cross means *stop this* and a bin means *take it away*: reusing the
 * cross for both would make two controls one control drawn twice.
 */
const ACTION_GLYPH = {
  cancel: 'x',
  pause: 'pause',
  remove: 'trash',
  retry: 'rotate-ccw',
  start: 'play',
} as const satisfies Record<string, GlyphName>;

type UploadAction = keyof typeof ACTION_GLYPH;

function matchesTypeOnly(type: string, accept: string) {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0 && !token.startsWith('.'));
  if (tokens.length === 0) return true;

  const [group, subtype] = type.toLowerCase().split('/');
  return tokens.some((token) => {
    const [tokenGroup, tokenSubtype] = token.split('/');
    return (
      (tokenGroup === '*' || tokenGroup === group) &&
      (tokenSubtype === '*' || tokenSubtype === subtype)
    );
  });
}
