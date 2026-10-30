import { withSelectorKey } from '@slotted/core/selector-key';
import {
  BUILT_IN_VIEW_ID,
  emptySavedViews,
  isViewNameTaken,
  parseGridView,
  sameSavedView,
  savedViewText,
  serializeSavedViews,
  withActiveView,
  withDefaultView,
  withViewCreated,
  withViewDeleted,
  withViewRenamed,
  withViewSaved,
  type SavedView,
  type SavedViewsState,
} from '@slotted/core/grid';
import { savedViewsMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeRequest } from '@slotted/core/state';
import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react';

import { Button } from '../button';
import { Field, FieldError, FieldLabel } from '../field';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import { Popover, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';
import { TextField } from '../text-field';
import type {
  SavedViewsAction,
  SavedViewsOpenReason,
  SavedViewsProps,
  SavedViewsReason,
  SavedViewsRequest,
} from './saved-views.types';

/** What replaces a row, or opens above the footer. */
type Editing =
  { kind: 'create' } | { kind: 'rename'; id: string } | { kind: 'delete'; id: string } | null;

/** Where focus goes after the render a change causes. */
type FocusTarget =
  | { id: string; part: 'apply' | 'actions' | 'input' | 'cancel' }
  | { id: null; part: 'input' | 'save-as' | 'trigger' };

let counter = 0;

/** `crypto.randomUUID()` where the platform has it, and a counter otherwise. */
export function newSavedViewId(): string {
  const crypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  counter += 1;
  return `view-${Date.now().toString(36)}-${counter}`;
}

/** A click the keyboard produced has no pointer detail. */
const pressReason = (event: { detail?: number } | undefined): 'pointer' | 'keyboard' =>
  event?.detail === 0 ? 'keyboard' : 'pointer';

/**
 * The named views of a grid, and the one in use: a trigger naming it, a mark
 * and a revert while the grid differs from it, and a popover listing every
 * view with its actions. The family applies nothing to a grid — it asks with
 * a state request and hands the consumer the view to write, through
 * `onViewApply`.
 */
export function SavedViews({
  builtIn,
  columns,
  current,
  defaultOpen,
  defaultState,
  messages,
  onOpenChange,
  onStateChange,
  onViewApply,
  open: openProp,
  ref,
  state: stateProp,
  ...rest
}: SavedViewsProps) {
  const t = useMessages(savedViewsMessages, messages);
  const base = useId();

  const [own, setOwn] = useState<SavedViewsState>(() => defaultState ?? emptySavedViews());
  const state = stateProp ?? own;
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const isOpen = openProp ?? ownOpen;

  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<'empty' | 'duplicate' | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const active = state.views.find((view) => view.id === state.activeId) ?? null;
  const activeView = active ? parseGridView(active.view, columns) : builtIn;
  const modified = !sameSavedView(current, activeView, columns);
  const activeName = active?.name ?? t('builtIn');
  const panelId = `${base}-panel`;

  function announce(text: string) {
    getLiveAnnouncer(rootRef.current?.ownerDocument).announce(text);
  }

  /** Asks for a new state. Not emitted when nothing would change; refused when cancelled. */
  function request(
    next: SavedViewsState,
    action: SavedViewsAction,
    reason: SavedViewsReason,
    source?: unknown,
  ): SavedViewsRequest | null {
    let cancelled = false;
    const change: SavedViewsRequest = {
      value: next,
      previous: state,
      reason,
      action,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    };
    if (serializeSavedViews(next) === serializeSavedViews(state)) return change;
    onStateChange?.(next, change);
    if (cancelled) return null;
    if (stateProp === undefined) setOwn(next);
    return change;
  }

  function closeForms() {
    setEditing(null);
    setDraft('');
    setError(null);
  }

  function setOpen(next: boolean, reason: SavedViewsOpenReason, source?: unknown) {
    if (next === isOpen) return;
    let cancelled = false;
    const change: ChangeRequest<boolean> = {
      value: next,
      previous: isOpen,
      reason,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    };
    onOpenChange?.(next, change);
    if (cancelled) return;
    if (openProp === undefined) setOwnOpen(next);
    if (!next) closeForms();
  }

  function apply(id: string | null, reason: SavedViewsReason, source?: unknown) {
    const target = id === null ? null : (state.views.find((view) => view.id === id) ?? null);
    if (id !== null && target === null) return;
    const change = request(withActiveView(state, id), 'apply', reason, source);
    if (change === null) return;
    onViewApply?.(target ? parseGridView(target.view, columns) : builtIn, change);
    announce(t('applied', { name: target?.name ?? t('builtIn') }));
    setOpen(
      false,
      reason === 'keyboard' ? 'keyboard' : reason === 'pointer' ? 'pointer' : 'programmatic',
      source,
    );
  }

  function revert(event: ReactMouseEvent) {
    const change = request(state, 'revert', pressReason(event), event);
    if (change === null) return;
    onViewApply?.(activeView, change);
    announce(t('applied', { name: activeName }));
    setFocusTarget({ id: null, part: 'trigger' });
  }

  function save(event: ReactMouseEvent) {
    if (active === null || !modified) return;
    const reason = pressReason(event);
    const next = withViewSaved(state, active.id, savedViewText(current, columns));
    if (request(next, 'save', reason, event) === null) return;
    announce(t('saved', { name: active.name }));
    setOpen(false, reason, event);
  }

  function setDefault(id: string | null, reason: SavedViewsReason, source?: unknown) {
    const change = request(withDefaultView(state, id), 'default', reason, source);
    if (change === null) return;
    const name = state.views.find((view) => view.id === id)?.name ?? t('builtIn');
    announce(t('defaultChanged', { name }));
  }

  function startCreate() {
    setEditing({ kind: 'create' });
    setDraft('');
    setError(null);
    setFocusTarget({ id: null, part: 'input' });
  }

  function startRename(view: SavedView) {
    setEditing({ kind: 'rename', id: view.id });
    setDraft(view.name);
    setError(null);
    setFocusTarget({ id: view.id, part: 'input' });
  }

  function startDelete(view: SavedView) {
    setEditing({ kind: 'delete', id: view.id });
    setError(null);
    setFocusTarget({ id: view.id, part: 'cancel' });
  }

  /** Cancelling returns focus to the control that opened the form. */
  function cancelEditing() {
    const was = editing;
    closeForms();
    if (was === null) return;
    setFocusTarget(
      was.kind === 'create' ? { id: null, part: 'save-as' } : { id: was.id, part: 'actions' },
    );
  }

  /** The name, or the reason it is refused. */
  function validate(except: string | null): string | null {
    const name = draft.trim();
    if (name === '') {
      setError('empty');
      return null;
    }
    const builtInName = t('builtIn').trim().toLocaleLowerCase();
    if (isViewNameTaken(state, name, except) || name.toLocaleLowerCase() === builtInName) {
      setError('duplicate');
      return null;
    }
    return name;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editing === null || editing.kind === 'delete') return;
    const except = editing.kind === 'rename' ? editing.id : null;
    const name = validate(except);
    if (name === null) {
      setFocusTarget(
        editing.kind === 'rename' ? { id: editing.id, part: 'input' } : { id: null, part: 'input' },
      );
      return;
    }
    if (editing.kind === 'create') {
      const id = newSavedViewId();
      const next = withViewCreated(state, name, savedViewText(current, columns), id);
      if (request(next, 'create', 'submit', event) === null) return;
      announce(t('saved', { name }));
      closeForms();
      setFocusTarget({ id, part: 'apply' });
      return;
    }
    const next = withViewRenamed(state, editing.id, name);
    if (request(next, 'rename', 'submit', event) === null) return;
    announce(t('renamed', { name }));
    closeForms();
    setFocusTarget({ id: editing.id, part: 'apply' });
  }

  function confirmDelete(id: string, event: ReactMouseEvent) {
    const index = state.views.findIndex((view) => view.id === id);
    const view = state.views[index];
    if (view === undefined) return;
    if (request(withViewDeleted(state, id), 'delete', 'remove', event) === null) return;
    announce(t('deleted', { name: view.name }));
    closeForms();
    const before = state.views[index - 1];
    setFocusTarget({ id: before?.id ?? BUILT_IN_VIEW_ID, part: 'apply' });
  }

  useEffect(() => {
    if (focusTarget === null) return;
    setFocusTarget(null);
    if (focusTarget.part === 'trigger') {
      triggerRef.current?.focus();
      return;
    }
    const panel = panelRef.current;
    if (panel === null) return;
    let scope: Element | null = panel;
    if (focusTarget.id !== null) {
      scope =
        [...panel.querySelectorAll('[data-part="item"]')].find(
          (item) => (item as HTMLElement).dataset['view'] === focusTarget.id,
        ) ?? null;
    }
    const selector = {
      apply: '[data-part="apply"]',
      actions: '[data-part="actions"]',
      input: focusTarget.id === null ? ':scope > [data-part="form"] input' : 'input',
      cancel: '[data-cancel]',
      'save-as': '[data-save-as]',
    }[focusTarget.part];
    scope?.querySelector<HTMLElement>(selector)?.focus();
  });

  useImperativeHandle(ref, () => ({
    get element() {
      return rootRef.current;
    },
    focus: () => triggerRef.current?.focus(),
    open: () => setOpen(true, 'programmatic'),
    close: () => setOpen(false, 'programmatic'),
    apply: (id: string | null) => apply(id, 'programmatic'),
  }));

  function renderForm(kind: 'create' | 'rename', name?: string) {
    const invalid = error !== null;
    return (
      <form
        aria-label={kind === 'create' ? t('saveAs') : t('renameView', { name: name ?? '' })}
        data-part="form"
        data-part-form=""
        noValidate
        onSubmit={submit}
      >
        <Field invalid={invalid} size="sm">
          <FieldLabel>{t('name')}</FieldLabel>
          <TextField
            autoComplete="off"
            onValueChange={(value) => {
              setDraft(value);
              setError(null);
            }}
            size="sm"
            value={draft}
          />
          {invalid ? (
            <FieldError>{error === 'empty' ? t('empty') : t('duplicate')}</FieldError>
          ) : null}
        </Field>
        <div data-buttons="">
          <Button data-cancel="" onClick={cancelEditing} size="sm" tone="secondary" variant="ghost">
            {t('cancel')}
          </Button>
          <Button size="sm" type="submit">
            {kind === 'create' ? t('create') : t('rename')}
          </Button>
        </div>
      </form>
    );
  }

  function renderItem(view: SavedView | null) {
    const id = view?.id ?? null;
    const key = id ?? BUILT_IN_VIEW_ID;
    const name = view?.name ?? t('builtIn');
    const current = state.activeId === id;
    const isDefault = state.defaultId === id;
    const edit =
      editing !== null && editing.kind !== 'create' && editing.id === id ? editing : null;

    return (
      <li
        data-part="item"
        data-part-item=""
        data-view={key}
        key={key}
        {...(current ? { 'data-current': '' } : {})}
        {...(isDefault ? { 'data-default': '' } : {})}
        {...(view === null ? { 'data-built-in': '' } : {})}
        {...(edit ? { 'data-editing': '' } : {})}
      >
        {edit?.kind === 'rename' ? (
          renderForm('rename', name)
        ) : edit?.kind === 'delete' && view !== null ? (
          <div
            aria-labelledby={`${base}-confirm-${key}`}
            data-part="confirm"
            data-part-confirm=""
            role="group"
          >
            <p id={`${base}-confirm-${key}`}>{t('confirmDelete', { name })}</p>
            <div data-buttons="">
              <Button
                data-cancel=""
                onClick={cancelEditing}
                size="sm"
                tone="secondary"
                variant="ghost"
              >
                {t('cancel')}
              </Button>
              <Button onClick={(event) => confirmDelete(view.id, event)} size="sm" tone="danger">
                {t('delete')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button
              data-part="apply"
              data-part-apply=""
              onClick={(event) => apply(id, pressReason(event), event)}
              type="button"
              {...(current ? { 'aria-current': 'true' as const } : {})}
            >
              {current ? (
                <Icon size="sm">
                  <Glyph name="check" />
                </Icon>
              ) : null}
              <span data-label="">{name}</span>
              {isDefault ? ' ' : null}
              {isDefault ? (
                <span data-part="default-mark" data-part-default-mark="">
                  <Icon size="sm">
                    <Glyph name="pin" />
                  </Icon>
                  <span>{t('isDefault')}</span>
                </span>
              ) : null}
            </button>
            <Menu>
              <MenuTrigger
                render={(props) => (
                  <button
                    {...withSelectorKey(props, 'part', 'actions')}
                    aria-label={t('actions', { name })}

                    type="button"
                  >
                    <Icon size="md">
                      <Glyph name="ellipsis" />
                    </Icon>
                  </button>
                )}
              />
              <MenuContent>
                {view !== null ? (
                  <MenuItem onSelect={() => startRename(view)}>{t('rename')}</MenuItem>
                ) : null}
                <MenuItem
                  disabled={isDefault}
                  onSelect={(event) => setDefault(id, event.reason, event.source)}
                >
                  {t('setDefault')}
                </MenuItem>
                {view !== null ? (
                  <MenuItem onSelect={() => startDelete(view)} tone="danger">
                    {t('delete')}
                  </MenuItem>
                ) : null}
              </MenuContent>
            </Menu>
          </>
        )}
      </li>
    );
  }

  return (
    <div
      {...withSelectorKey(rest, 'part', 'root')}
      aria-label={rest['aria-label'] ?? t('label')}

      data-ui="saved-views"
      data-ui-saved-views=""
      ref={rootRef}
      role={rest.role ?? 'group'}
      {...(modified ? { 'data-modified': '' } : {})}
      {...(isOpen ? { 'data-open': '' } : {})}
    >
      <Popover
        initialFocus="[aria-current='true']"
        onOpenChange={(next, change) => {
          /* The dismissable layer asks in the capture phase; a form open
             inside is cancelled first and the close is refused. */
          if (!next && change.reason === 'escape' && editing !== null) {
            change.cancel();
            cancelEditing();
            return;
          }
          setOpen(next, change.reason as SavedViewsOpenReason, change.source);
        }}
        open={isOpen}
      >
        <PopoverTrigger
          render={({ ref: anchor, ...props }) => (
            <button
              {...withSelectorKey(props, 'part', 'trigger')}

              ref={(node) => {
                anchor?.(node);
                triggerRef.current = node;
              }}
              title={activeName}
              type="button"
            >
              <span data-label="">{activeName}</span>
              {modified ? (
                <span data-part="modified" data-part-modified="">
                  {t('modified')}
                </span>
              ) : null}
              <Icon size="md">
                <Glyph name="chevron-down" />
              </Icon>
            </button>
          )}
        />
        <PopoverLayer>
          <PopoverContent aria-label={rest['aria-label'] ?? t('label')}>
            {/* The family's identifier is on its own element rather than on
                the popover's: PopoverContent names its own part. */}
            <div
              data-part="panel"
              data-part-panel=""
              data-ui="saved-views"
              data-ui-saved-views=""
              id={panelId}
              ref={panelRef}
            >
              <ul data-part="list" data-part-list="" role="list">
                {renderItem(null)}
                {state.views.map((view) => renderItem(view))}
              </ul>
              {editing?.kind === 'create' ? renderForm('create') : null}
              <div data-part="footer" data-part-footer="">
                <Button
                  data-save-as=""
                  onClick={startCreate}
                  size="sm"
                  tone="secondary"
                  variant="ghost"
                >
                  {t('saveAs')}
                </Button>
                <Button disabled={active === null || !modified} onClick={save} size="sm">
                  {t('save')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </PopoverLayer>
      </Popover>
      {modified ? (
        <button data-part="revert" data-part-revert="" onClick={revert} type="button">
          {/* An arrow that turns back turns the other way in a right-to-left document. */}
          <Icon directional size="sm">
            <Glyph name="rotate-ccw" />
          </Icon>
          {t('revert')}
        </button>
      ) : null}
    </div>
  );
}
