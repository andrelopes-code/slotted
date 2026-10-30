import { selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/command-palette/command-palette.css';
import '@slotted/styles/skeleton/skeleton.css';
import '@slotted/styles/spinner/spinner.css';

import { moveIndex } from '@slotted/core/collection';
import { createCommandRanker, pushRecent, resolveCommands } from '@slotted/core/commands';
import { commandPaletteMessages } from '@slotted/core/i18n';
import type { CommandRanker, CommandSection } from '@slotted/core/commands';
import { canonicalKey, isEditableTarget, matchesShortcut, parseShortcut } from '@slotted/core/keys';
import type { KbdPlatform } from '@slotted/core/keys';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createPortalRoot } from '@slotted/core/portal';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '../dialog';
import type { DialogChangeRequest } from '../dialog';
import { Highlight } from '../highlight';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Shortcut } from '../kbd';
import { useResolvedPlatform } from '../kbd/kbd-defaults';
import { useCommandPaletteDefaults } from './command-palette-defaults';
import type {
  CommandPaletteHighlightReason,
  CommandPaletteItem,
  CommandPaletteOpenReason,
  CommandPalettePagesReason,
  CommandPalettePresentation,
  CommandPaletteProps,
  CommandPaletteQueryReason,
  CommandPaletteSelectReason,
  CommandPaletteSelectRequest,
  CommandPaletteTriggerProps,
} from './command-palette.types';
import { SPINNER_RING } from '../button/spinner-ring';

/**
 * A search that executes.
 *
 * The family is a `combobox` whose `listbox` popup is always visible, inside
 * a `dialog` — or in line, inside whatever the consumer put it in. DOM focus
 * stays on the input for the whole interaction and the list is walked with
 * `aria-activedescendant`, which is the pattern's own note and the model
 * `combobox` already uses. The layer, the scrim, the focus containment and
 * the Escape that closes are the dialog family's; what this owns is the
 * field, the list, the ranking, the pages and the recents.
 *
 * Which rows are drawn, in which order, is `@slotted/core/commands`: the
 * Angular binding asks the same function, so the two cannot disagree.
 */

interface CommandPaletteContextValue {
  presentation: CommandPalettePresentation;
  disabled: boolean;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

/**
 * The shortcut as `aria-keyshortcuts` states it, as `menu` writes it. A
 * sequence has no syntax in the attribute and is drawn only.
 *
 * The attribute's grammar is the UI Events `key` values — `Control`, `Alt`,
 * `Meta`, `Shift` — which a screen reader parses and speaks in its own
 * language. They are tokens rather than words, so they stay out of the
 * catalog: a translated or platform-named modifier (`Option`, `Command`) is
 * not a value the attribute accepts.
 */
function announceShortcut(keys: string, platform: KbdPlatform): string | undefined {
  const steps = parseShortcut(keys);
  if (steps.length !== 1) return undefined;
  return steps[0]
    ?.map((token) => {
      const canonical = canonicalKey(token);
      if (canonical === 'mod') return platform === 'mac' ? 'Meta' : 'Control';
      if (canonical === 'ctrl') return 'Control';
      const word = canonical ?? token;
      return word.length === 1 ? word.toUpperCase() : `${word[0]?.toUpperCase()}${word.slice(1)}`;
    })
    .join('+');
}

/** A DOM id from an item id, which may hold anything. */
function domId(base: string, id: string) {
  return `${base}-${id.replace(/[^\w-]/g, (character) => `_${character.charCodeAt(0).toString(16)}`)}`;
}

export function CommandPalette<Item extends CommandPaletteItem = CommandPaletteItem>({
  autoHighlight,
  children,
  className,
  clearOnClose,
  closeOnSelect,
  container,
  defaultHighlightedId,
  defaultOpen,
  defaultPages,
  defaultQuery,
  defaultRecent,
  disabled,
  empty,
  footer,
  groups,
  highlightMatch,
  highlightedId,
  hotkey,
  inputProps,
  items,
  limit,
  loading,
  locale,
  loop,
  messages,
  onHighlightedIdChange,
  onOpenChange,
  onPagesChange,
  onQueryChange,
  onRecentChange,
  onSelect,
  open,
  outsidePress,
  pages,
  presentation,
  query,
  rank,
  recent,
  recentLimit,
  ref,
  renderItem,
  size,
  style,
  ...nativeProps
}: CommandPaletteProps<Item>) {
  const defaults = useCommandPaletteDefaults();
  const resolved = {
    presentation: presentation ?? defaults.presentation,
    size: size ?? defaults.size,
    outsidePress: outsidePress ?? defaults.outsidePress,
    loop: loop ?? defaults.loop,
    autoHighlight: autoHighlight ?? defaults.autoHighlight,
    closeOnSelect: closeOnSelect ?? defaults.closeOnSelect,
    clearOnClose: clearOnClose ?? defaults.clearOnClose,
    highlightMatch: highlightMatch ?? defaults.highlightMatch,
    hotkey: hotkey === undefined ? defaults.hotkey : hotkey,
    recentLimit: recentLimit ?? defaults.recentLimit,
    loading: loading ?? false,
    disabled: disabled ?? false,
  };
  const t = useMessages(commandPaletteMessages, messages);
  const appLocale = useLocale();
  const resolvedLocale = locale ?? appLocale;
  const inline = resolved.presentation === 'inline';
  const platform = useResolvedPlatform(undefined);

  const base = useId();
  const listId = `${base}-list`;

  /* ── The five values ──────────────────────────────────────────────────── */

  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const [ownQuery, setOwnQuery] = useState(defaultQuery ?? '');
  const [ownHighlighted, setOwnHighlighted] = useState<string | null>(defaultHighlightedId ?? null);
  const [ownPages, setOwnPages] = useState<readonly string[]>(defaultPages ?? []);
  const [ownRecent, setOwnRecent] = useState<readonly string[]>(defaultRecent ?? []);

  const currentOpen = inline ? true : (open ?? ownOpen);
  const currentQuery = query ?? ownQuery;
  const currentHighlighted = highlightedId === undefined ? ownHighlighted : highlightedId;
  const currentPages = pages ?? ownPages;
  const currentRecent = recent ?? ownRecent;

  const latest = useRef({
    currentHighlighted,
    currentOpen,
    currentPages,
    currentQuery,
    currentRecent,
    highlightedId,
    onHighlightedIdChange,
    onOpenChange,
    onPagesChange,
    onQueryChange,
    onRecentChange,
    open,
    pages,
    query,
    recent,
  });
  latest.current = {
    currentHighlighted,
    currentOpen,
    currentPages,
    currentQuery,
    currentRecent,
    highlightedId,
    onHighlightedIdChange,
    onOpenChange,
    onPagesChange,
    onQueryChange,
    onRecentChange,
    open,
    pages,
    query,
    recent,
  };

  /** The row the pointer last highlighted, which never scrolls the list. */
  const pointerHighlight = useRef<string | null>(null);
  const setHighlighted = useCallback(
    (next: string | null, reason: CommandPaletteHighlightReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentHighlighted) return;
      pointerHighlight.current = reason === 'pointer' ? next : null;
      const controllable = createControllable<string | null>({
        controlled: state.highlightedId,
        initial: state.currentHighlighted,
        onRequest: (request) => state.onHighlightedIdChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnHighlighted(next);
    },
    [],
  );

  const setQuery = useCallback(
    (next: string, reason: CommandPaletteQueryReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentQuery) return;
      const controllable = createControllable<string>({
        controlled: state.query,
        initial: state.currentQuery,
        onRequest: (request) => state.onQueryChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnQuery(next);
    },
    [],
  );

  const setPages = useCallback(
    (next: readonly string[], reason: CommandPalettePagesReason, source?: unknown) => {
      const state = latest.current;
      if (
        next.length === state.currentPages.length &&
        next.every((id, index) => id === state.currentPages[index])
      ) {
        return;
      }
      const controllable = createControllable<readonly string[]>({
        controlled: state.pages,
        initial: state.currentPages,
        onRequest: (request) => state.onPagesChange?.(request.value, request),
        equals: () => false,
      });
      if (controllable.request(next, reason, source)) setOwnPages(next);
    },
    [],
  );

  const setRecent = useCallback((next: readonly string[], source?: unknown) => {
    const state = latest.current;
    const controllable = createControllable<readonly string[]>({
      controlled: state.recent,
      initial: state.currentRecent,
      onRequest: (request) => state.onRecentChange?.(request.value, request),
      equals: (a, b) => a.length === b.length && a.every((id, index) => id === b[index]),
    });
    if (controllable.request(next, 'select', source)) setOwnRecent(next);
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const setOpen = useCallback(
    (next: boolean, reason: CommandPaletteOpenReason, source?: unknown) => {
      const state = latest.current;
      if (inline || next === state.currentOpen) return;
      const controllable = createControllable<boolean>({
        controlled: state.open,
        initial: state.currentOpen,
        onRequest: (request) => state.onOpenChange?.(request.value, request),
      });
      if (!controllable.request(next, reason, source)) return;
      setOwnOpen(next);
    },
    [inline],
  );

  /* Closing puts the palette back where it started, each value by its own
     request, so a consumer owning one of them hears about it. */
  const wasOpen = useRef(currentOpen);
  useEffect(() => {
    if (wasOpen.current && !currentOpen && resolved.clearOnClose) {
      setQuery('', 'programmatic');
      setPages([], 'programmatic');
      setHighlighted(null, 'programmatic');
    }
    wasOpen.current = currentOpen;
  }, [currentOpen, resolved.clearOnClose, setHighlighted, setPages, setQuery]);

  /* ── The rows ─────────────────────────────────────────────────────────── */

  const ranker = useMemo<CommandRanker<Item> | null>(
    () => (rank === undefined ? createCommandRanker<Item>({ locale: resolvedLocale }) : rank),
    [resolvedLocale, rank],
  );

  const model = useMemo(
    () =>
      resolveCommands<Item>({
        items,
        query: currentQuery,
        pages: currentPages,
        recent: currentRecent,
        groups,
        rank: ranker,
        limit,
      }),
    [currentPages, currentQuery, currentRecent, groups, items, limit, ranker],
  );

  const rowIds = useMemo(() => model.rows.map((item) => item.id), [model]);
  const enabled = useMemo(() => model.rows.map((item) => item.disabled !== true), [model]);

  /**
   * Where the highlight stands once the rows have changed: on the row it was
   * on, on the first enabled row with `autoHighlight`, and nowhere otherwise.
   */
  useEffect(() => {
    if (!currentOpen) return;
    const at = currentHighlighted === null ? -1 : rowIds.indexOf(currentHighlighted);
    if (at !== -1 && enabled[at] === true) return;
    const first = resolved.autoHighlight
      ? moveIndex({ enabled, from: -1, intent: 'first', loop: false })
      : -1;
    setHighlighted(first === -1 ? null : (rowIds[first] ?? null), 'programmatic');
  }, [currentHighlighted, currentOpen, enabled, resolved.autoHighlight, rowIds, setHighlighted]);

  /* The row the highlight is on scrolls into view; it is not focused, so the
     browser will not do it. A row the pointer highlighted is already under it,
     and scrolling it would fight a finger or a wheel moving the list. */
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (currentHighlighted === null || currentHighlighted === pointerHighlight.current) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(domId(base, currentHighlighted))}`,
    );
    if (typeof node?.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [base, currentHighlighted]);

  /* ── Executing ────────────────────────────────────────────────────────── */

  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const execution = useRef({ onSelect, resolved, setOpen, setPages, setQuery, setRecent });
  execution.current = { onSelect, resolved, setOpen, setPages, setQuery, setRecent };

  const execute = useCallback(
    (item: Item, reason: CommandPaletteSelectReason, source: unknown) => {
      const {
        onSelect: notify,
        resolved: settings,
        setOpen: close,
        setPages: push,
      } = execution.current;
      if (item.disabled === true) return;
      if (pending.has(item.id)) return;

      if (item.children !== undefined) {
        push(
          [...latest.current.currentPages, item.id],
          reason === 'pointer' ? 'pointer' : 'select',
          source,
        );
        execution.current.setQuery('', 'select', source);
        return;
      }

      let keep = false;
      const request: CommandPaletteSelectRequest<Item> = {
        item,
        reason,
        source,
        keepOpen: () => {
          keep = true;
        },
      };

      const finish = () => {
        execution.current.setRecent(
          pushRecent(latest.current.currentRecent, item.id, settings.recentLimit),
          source,
        );
        notify?.(item, request);
        if (settings.closeOnSelect && !keep) close(false, 'select', source);
      };

      let outcome: unknown;
      try {
        outcome = item.onSelect?.(request);
      } catch (thrown) {
        setError(thrown instanceof Error ? thrown.message : String(thrown));
        return;
      }

      if (outcome instanceof Promise) {
        setError(null);
        setPending((previous) => new Set(previous).add(item.id));
        void outcome.then(
          () => {
            setPending((previous) => {
              const next = new Set(previous);
              next.delete(item.id);
              return next;
            });
            finish();
          },
          (thrown: unknown) => {
            setPending((previous) => {
              const next = new Set(previous);
              next.delete(item.id);
              return next;
            });
            setError(thrown instanceof Error ? thrown.message : String(thrown));
          },
        );
        return;
      }

      finish();
    },
    [pending],
  );

  const rowFor = useCallback(
    (id: string | null) => (id === null ? undefined : model.rows.find((item) => item.id === id)),
    [model],
  );

  /* ── Keys ─────────────────────────────────────────────────────────────── */

  const move = (intent: Parameters<typeof moveIndex>[0]['intent'], event: KeyboardEvent) => {
    const from = currentHighlighted === null ? -1 : rowIds.indexOf(currentHighlighted);
    const paged = intent === 'pageDown' || intent === 'pageUp';
    const next = moveIndex({ enabled, from, intent, loop: resolved.loop && !paged });
    event.preventDefault();
    if (next === -1) return;
    setHighlighted(rowIds[next] ?? null, 'keyboard', event);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
        move('next', event);
        return;
      case 'ArrowUp':
        move('previous', event);
        return;
      case 'PageDown':
        move('pageDown', event);
        return;
      case 'PageUp':
        move('pageUp', event);
        return;
      case 'Home':
        if (event.ctrlKey) move('first', event);
        return;
      case 'End':
        if (event.ctrlKey) move('last', event);
        return;
      case 'Enter': {
        const item = rowFor(currentHighlighted);
        if (item === undefined) return;
        /* A link follows itself under the browser's own modifiers. */
        if (item.href !== undefined && (event.metaKey || event.ctrlKey || event.shiftKey)) {
          const node = listRef.current?.querySelector<HTMLAnchorElement>(
            `#${CSS.escape(domId(base, item.id))}`,
          );
          if (node !== null && node !== undefined) {
            node.dispatchEvent(
              new globalThis.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
              }),
            );
          }
          event.preventDefault();
          return;
        }
        event.preventDefault();
        if (item.href !== undefined) {
          const node = listRef.current?.querySelector<HTMLAnchorElement>(
            `#${CSS.escape(domId(base, item.id))}`,
          );
          execute(item, 'keyboard', event);
          node?.click();
          return;
        }
        execute(item, 'keyboard', event);
        return;
      }
      case 'Escape':
        if (currentQuery !== '') {
          event.preventDefault();
          event.stopPropagation();
          setQuery('', 'clear', event);
          return;
        }
        if (currentPages.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          setPages(currentPages.slice(0, -1), 'keyboard', event);
          return;
        }
        if (!inline) {
          event.preventDefault();
          setOpen(false, 'escape', event);
        }
        return;
      case 'Backspace':
        if (currentQuery === '' && currentPages.length > 0) {
          event.preventDefault();
          setPages(currentPages.slice(0, -1), 'keyboard', event);
        }
        return;
      default:
        return;
    }
  };

  /* ── The hotkey ───────────────────────────────────────────────────────── */

  const focusInput = useCallback(() => {
    const node = inputRef.current;
    if (node === null) return;
    node.focus();
    node.select();
  }, []);

  useEffect(() => {
    const keys = resolved.hotkey;
    if (keys === null || inline || resolved.disabled) return;
    const bare = parseShortcut(keys)[0]?.every(
      (token) => !['mod', 'meta', 'ctrl', 'alt'].includes(canonicalKey(token) ?? ''),
    );
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!matchesShortcut(event, keys, platform)) return;
      if (bare === true && isEditableTarget(event)) return;
      event.preventDefault();
      if (latest.current.currentOpen) {
        focusInput();
        return;
      }
      setOpen(true, 'keyboard', event);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [focusInput, inline, platform, resolved.disabled, resolved.hotkey, setOpen]);

  /* ── Announcing ───────────────────────────────────────────────────────── */

  const status = resolved.loading
    ? t('loading')
    : error !== null
      ? t('error', { message: error })
      : t('count', { count: model.count });

  useEffect(() => {
    if (!currentOpen) return;
    getLiveAnnouncer(inputRef.current?.ownerDocument).announce(status);
  }, [currentOpen, status]);

  useEffect(() => {
    setError(null);
  }, [currentQuery, currentPages]);

  /* ── The handle ───────────────────────────────────────────────────────── */

  useImperativeHandle(
    ref,
    () => ({
      open: () => setOpen(true, 'programmatic'),
      close: () => setOpen(false, 'programmatic'),
      toggle: () => setOpen(!latest.current.currentOpen, 'programmatic'),
      focus: focusInput,
      setQuery: (next) => setQuery(next, 'programmatic'),
      scrollToId: (id) => setHighlighted(id, 'programmatic'),
      get input() {
        return inputRef.current;
      },
    }),
    [focusInput, setHighlighted, setOpen, setQuery],
  );

  /* ── The layer's origin ───────────────────────────────────────────────── */

  /**
   * Where the layer is written, and what it inherits once it has moved. A
   * palette opened by its hotkey has no trigger, and a dialog with no origin
   * lands at the end of the document with none of the region's theme. The
   * marker is the node the layer is written beside — `upload-viewer`'s answer
   * — unless the consumer named a container.
   */
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  const [ownContainer, setOwnContainer] = useState<Element | null>(null);
  useEffect(() => {
    if (origin === null || container !== undefined || inline) return;
    const layer = createPortalRoot({ origin });
    setOwnContainer(layer.container);
    return () => {
      setOwnContainer(null);
      layer.release();
    };
  }, [container, inline, origin]);

  /* ── Rendering ────────────────────────────────────────────────────────── */

  const renderRow = (item: Item) => {
    const current = currentHighlighted === item.id;
    const isDisabled = item.disabled === true;
    const isPending = pending.has(item.id);
    const id = domId(base, item.id);
    /* The spans the query matched, from the same collator the ranker used,
       drawn by the `highlight` family inside this family's label. */
    const labelNode =
      resolved.highlightMatch && currentQuery.trim() !== '' ? (
        <Highlight locale={resolvedLocale} query={currentQuery} text={item.label} />
      ) : (
        item.label
      );
    const shortcut = item.children === undefined ? item.shortcut : undefined;

    const content =
      renderItem === undefined ? (
        <>
          <span data-part="icon" data-part-icon="">
            {item.icon}
          </span>
          <span data-part="label" data-part-label="">
            {labelNode}
          </span>
          {item.description === undefined ? null : (
            <span data-part="description" data-part-description="">
              {item.description}
            </span>
          )}
          {item.meta === undefined ? null : (
            <span aria-hidden="true" data-part="meta" data-part-meta="">
              {item.meta}
            </span>
          )}
          {shortcut === undefined ? null : (
            <span aria-hidden="true" data-part="shortcut" data-part-shortcut="">
              {/* Keycaps, and nothing drawn between them: `Ctrl` `Shift` `D`
                  is how Linear and Raycast write a chord outside a Mac, and
                  the caps say "keys" where plain text says "a word". */}
              <Shortcut keys={shortcut} separator="" size="inherit" variant="outline" />
            </span>
          )}
          {item.children === undefined ? null : (
            /* The mark that says the item opens a page, mirrored in a right-to-left document. */
            <span aria-hidden="true" data-part="arrow" data-part-arrow="">
              <Icon directional>
                <Glyph name="chevron-right" />
              </Icon>
            </span>
          )}
          {isPending ? (
            <span
              aria-hidden="true"
              data-part="busy"
              data-part-busy=""
              data-ui="spinner"
              data-ui-spinner=""
            >
              {SPINNER_RING}
            </span>
          ) : null}
        </>
      ) : (
        renderItem(item, {
          current,
          disabled: isDisabled,
          pending: isPending,
          label: labelNode,
          query: currentQuery,
        })
      );

    const shared = {
      'aria-disabled': isDisabled ? true : undefined,
      'aria-busy': isPending ? true : undefined,
      'aria-keyshortcuts':
        shortcut === undefined ? undefined : announceShortcut(shortcut, platform),
      'aria-selected': current,
      'data-part': 'item',
      ...selectorKeyProps('part', 'item'),
      ...(current ? { 'data-current': '' } : {}),
      ...(isDisabled ? { 'data-disabled': '' } : {}),
      ...(isPending ? { 'data-loading': '' } : {}),
      ...(item.children === undefined ? {} : { 'data-page': '' }),
      id,
      role: 'option',
      title: item.label,
      onPointerMove: (event: PointerEvent) => {
        /* A finger on the list is a scroll until it ends as a tap: the tap's
           click executes, and a highlight on the way would trail the finger. */
        if (isDisabled || event.pointerType === 'touch') return;
        setHighlighted(item.id, 'pointer', event);
      },
      onClick: (event: MouseEvent) => {
        if (isDisabled || isPending) {
          event.preventDefault();
          return;
        }
        /* A link with a modifier is the browser's: a new tab, a download. */
        if (item.href !== undefined && (event.metaKey || event.ctrlKey || event.shiftKey)) return;
        execute(item, 'pointer', event);
      },
    };

    return item.href === undefined ? (
      <div key={item.id} {...shared}>
        {content}
      </div>
    ) : (
      <a key={item.id} {...shared} href={item.href} target={item.target}>
        {content}
      </a>
    );
  };

  const renderSection = (section: CommandSection<Item>, index: number) => {
    const heading = section.recent ? t('recent') : section.label;
    const rows = section.items.map(renderRow);
    const separator =
      index === 0 ? null : (
        <div data-part="separator" data-part-separator="" key={`sep-${index}`} role="separator" />
      );
    if (heading === undefined) {
      return [separator, ...rows];
    }
    const labelId = `${base}-group-${index}`;
    return [
      separator,
      <div
        aria-labelledby={labelId}
        data-part="group"
        data-part-group=""
        key={`group-${index}`}
        role="group"
      >
        <div data-part="group-label" data-part-group-label="" id={labelId} role="presentation">
          {heading}
        </div>
        {rows}
      </div>,
    ];
  };

  const hints: ReactNode =
    footer === null ? null : (
      <div aria-hidden="true" data-part="footer" data-part-footer="">
        {footer !== undefined ? (
          footer
        ) : (
          <>
            <span data-part="hint" data-part-hint="">
              <Shortcut keys="up" separator="" size="inherit" variant="outline" />
              <Shortcut keys="down" separator="" size="inherit" variant="outline" />
              <span>{t('hintNavigate')}</span>
            </span>
            <span data-part="hint" data-part-hint="">
              <Shortcut keys="enter" separator="" size="inherit" variant="outline" />
              <span>{t('hintSelect')}</span>
            </span>
            {currentPages.length === 0 ? null : (
              <span data-part="hint" data-part-hint="">
                <Shortcut keys="backspace" separator="" size="inherit" variant="outline" />
                <span>{t('hintBack')}</span>
              </span>
            )}
            {inline ? null : (
              <span data-part="hint" data-part-hint="">
                <Shortcut keys="escape" separator="" size="inherit" variant="outline" />
                <span>{t('hintClose')}</span>
              </span>
            )}
          </>
        )}
      </div>
    );

  const {
    onChange: theirOnChange,
    onKeyDown: theirOnKeyDown,
    ref: theirInputRef,
    ...restInput
  } = inputProps ?? {};

  const isEmpty = !resolved.loading && model.count === 0;

  const panel = (
    <div
      {...withSelectorKey(nativeProps, 'ui', 'command-palette')}
      className={className}

      data-part="root"
      data-part-root=""
      data-presentation={resolved.presentation}
      data-size={resolved.size}
      {...(currentOpen ? { 'data-open': '' } : {})}
      {...(resolved.loading ? { 'data-loading': '' } : {})}
      {...(resolved.disabled ? { 'data-disabled': '' } : {})}
      {...(currentQuery === '' ? {} : { 'data-query': '' })}
      {...(isEmpty ? { 'data-empty': '' } : {})}
      /* Focus stays in the input while the palette is open, as in a platform
         search field: a press anywhere else — a group label, the list's empty
         space, a row — keeps it there, and on a phone the keyboard stays up.
         The press's click still runs. */
      onMouseDown={compose(nativeProps.onMouseDown, (event) => {
        if (event.target !== inputRef.current) event.preventDefault();
      })}
      style={style}
    >
      <div data-part="header" data-part-header="">
        {resolved.loading ? (
          <span
            aria-hidden="true"
            data-part="busy"
            data-part-busy=""
            data-ui="spinner"
            data-ui-spinner=""
          >
            {SPINNER_RING}
          </span>
        ) : (
          <span aria-hidden="true" data-part="search" data-part-search="">
            <Icon>
              <Glyph name="search" />
            </Icon>
          </span>
        )}
        {model.trail.length === 0 ? null : (
          <ol aria-label={t('back')} data-part="pages" data-part-pages="">
            {model.trail.map((entry, index) => (
              <li key={entry.id}>
                {/* The chevron between two pages, mirrored in a right-to-left document. */}
                {index === 0 ? null : (
                  <Icon directional>
                    <Glyph name="chevron-right" />
                  </Icon>
                )}
                <button
                  data-part="page"
                  data-part-page=""
                  onClick={(event) => setPages(currentPages.slice(0, index + 1), 'pointer', event)}
                  type="button"
                >
                  <span>{entry.label}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        <input
          {...withSelectorKey(restInput, 'part', 'input')}
          aria-activedescendant={
            currentHighlighted === null ? undefined : domId(base, currentHighlighted)
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded="true"
          aria-label={restInput['aria-label'] ?? t('input')}
          autoComplete="off"

          disabled={resolved.disabled}
          onChange={compose(theirOnChange, (event) =>
            setQuery(event.target.value, 'keyboard', event),
          )}
          onKeyDown={compose(theirOnKeyDown, onInputKeyDown)}
          placeholder={restInput.placeholder ?? t('placeholder')}
          ref={(node) => {
            inputRef.current = node;
            if (typeof theirInputRef === 'function') theirInputRef(node);
            else if (theirInputRef !== undefined && theirInputRef !== null) {
              theirInputRef.current = node;
            }
          }}
          role="combobox"
          spellCheck={false}
          type="text"
          value={currentQuery}
        />
        <button
          aria-label={t('clear')}
          data-part="clear"
          data-part-clear=""
          onClick={(event) => {
            setQuery('', 'clear', event);
            inputRef.current?.focus();
          }}
          tabIndex={-1}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
        {inline ? null : (
          /* The way out where the scrim is not: shown by the stylesheet
             under the dialog's full-screen query alone. */
          <button
            data-part="close"
            data-part-close=""
            onClick={(event) => setOpen(false, 'dismiss', event)}
            type="button"
          >
            {t('close')}
          </button>
        )}
      </div>
      <div
        aria-busy={resolved.loading ? true : undefined}
        aria-label={t('input')}
        data-part="list"
        data-part-list=""
        {...(resolved.loading ? { 'data-loading': '' } : {})}
        id={listId}
        ref={listRef}
        role="listbox"
      >
        {resolved.loading && model.count === 0 ? (
          <div aria-hidden="true" data-part="placeholder" data-part-placeholder="">
            {[0, 1, 2].map((row) => (
              <div key={row}>
                <span
                  data-loading
                  data-part="root"
                  data-part-root=""
                  data-shape="text"
                  data-ui="skeleton"
                  data-ui-skeleton=""
                />
              </div>
            ))}
          </div>
        ) : null}
        {isEmpty ? (
          <div data-part="empty" data-part-empty="">
            {empty ?? t('empty')}
          </div>
        ) : null}
        {model.sections.flatMap(renderSection)}
      </div>
      <div data-part="status" data-part-status="" role="status">
        {status}
      </div>
      {hints}
    </div>
  );

  const context: CommandPaletteContextValue = {
    presentation: resolved.presentation,
    disabled: resolved.disabled,
  };

  if (inline) {
    return (
      <CommandPaletteContext.Provider value={context}>
        {children}
        {panel}
      </CommandPaletteContext.Provider>
    );
  }

  const marker = container === undefined ? <span hidden ref={setOrigin} /> : null;
  const layerContainer = container === undefined ? ownContainer : container;

  return (
    <CommandPaletteContext.Provider value={context}>
      {marker}
      <Dialog
        container={layerContainer}
        escape="none"
        fullScreen="narrow"
        initialFocus={inputRef}
        onOpenChange={(next, request: DialogChangeRequest) => {
          const reason: CommandPaletteOpenReason =
            request.reason === 'outsidePress' || request.reason === 'escape'
              ? request.reason
              : request.reason === 'pointer' || request.reason === 'keyboard'
                ? request.reason
                : 'dismiss';
          const state = latest.current;
          const controllable = createControllable<boolean>({
            controlled: state.open,
            initial: state.currentOpen,
            onRequest: (own) => state.onOpenChange?.(own.value, own),
          });
          if (!controllable.request(next, reason, request.source)) {
            request.cancel();
            return;
          }
          setOwnOpen(next);
        }}
        open={currentOpen}
        outsidePress={resolved.outsidePress}
        placement="top"
        size={resolved.size}
        surface="plain"
      >
        {children}
        <DialogContent aria-label={t('label')}>{panel}</DialogContent>
      </Dialog>
    </CommandPaletteContext.Provider>
  );
}

/**
 * The control that opens the palette, composed over the dialog family's
 * trigger: `render` substitutes the element — a real application's trigger is
 * a `Button` with a `Kbd` in it — and the ref the dialog hands over is the
 * layer's focus origin, so it is attached beside the consumer's own.
 * Renders nothing under `presentation="inline"`, where there is nothing to open.
 */
export function CommandPaletteTrigger({
  children,
  render,
  ...nativeProps
}: CommandPaletteTriggerProps) {
  const palette = useContext(CommandPaletteContext);
  if (palette === undefined) {
    throw new Error('CommandPaletteTrigger must be rendered inside CommandPalette.');
  }
  if (palette.presentation === 'inline') return null;
  return (
    <DialogTrigger
      {...nativeProps}
      disabled={nativeProps.disabled ?? (palette.disabled ? true : undefined)}
      {...(render === undefined ? {} : { render })}
    >
      {children}
    </DialogTrigger>
  );
}
