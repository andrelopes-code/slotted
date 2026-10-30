import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/attachment/attachment.css';

import { createRemovalFocus } from '@slotted/core/focus';
import { attachmentMessages } from '@slotted/core/i18n';
import { fileKind, splitName } from '@slotted/core/upload';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, Ref, SyntheticEvent } from 'react';

import { useLocale, useMessages } from '../i18n';
import { useAttachmentDefaults } from './attachment-defaults';
import { ATTACHMENT_CONTROL_SELECTOR } from './attachment-kinds';
import type {
  AttachmentContextValue,
  AttachmentGroupProps,
  AttachmentGroupRootProps,
  AttachmentLayout,
  AttachmentOrientation,
  AttachmentProps,
  AttachmentRemoveReason,
  AttachmentRootProps,
  AttachmentSize,
} from './attachment.types';

interface GroupContextValue {
  layout: AttachmentLayout;
  orientation: AttachmentOrientation | undefined;
  size: AttachmentSize | undefined;
}

const GroupContext = createContext<GroupContextValue | null>(null);
const AttachmentContext = createContext<AttachmentContextValue | null>(null);

/**
 * What the attachment around a part knows. A part outside one is a mistake
 * the page can see at once, so it throws rather than drawing an empty tile.
 */
export function useAttachment(): AttachmentContextValue {
  const context = useContext(AttachmentContext);
  if (context === null) throw new Error('An Attachment part is rendered outside an Attachment.');
  return context;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref != null) (ref as { current: T | null }).current = value;
}

/**
 * A set of attachments: a native list, arranged as a column, a wrapping grid
 * or one line that scrolls. It hands its size and orientation to every
 * attachment that does not state its own.
 *
 * It keeps the keyboard where it was when an attachment leaves: focus goes to
 * the control that took the removed one's place, then to the last one, then
 * to the list itself — which is why the list takes `tabIndex={-1}`.
 * `removal-focus` observes the DOM, so it is right however the consumer
 * removed the file.
 */
export function AttachmentGroup({
  layout,
  orientation,
  ref,
  render,
  size,
  ...nativeProps
}: AttachmentGroupProps) {
  const defaults = useAttachmentDefaults();
  const resolvedLayout = layout ?? defaults.layout;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedSize = size ?? defaults.size;
  const cleanup = useRef<(() => void) | null>(null);

  const attach = useCallback(
    (node: HTMLElement | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (node !== null) {
        const removal = createRemovalFocus(node, { itemSelector: ATTACHMENT_CONTROL_SELECTOR });
        cleanup.current = () => removal.destroy();
      }
      assignRef(ref as Ref<HTMLElement> | undefined, node);
    },
    [ref],
  );

  const rootProps: AttachmentGroupRootProps = keyedProps({
    tabIndex: -1,
    ...nativeProps,
    'data-layout': resolvedLayout,
    'data-orientation': resolvedOrientation,
    'data-part': 'group',
    'data-size': resolvedSize,
    'data-ui': 'attachment',
    ref: attach,
  }) as AttachmentGroupRootProps;

  const value = useMemo(
    () => ({ layout: resolvedLayout, orientation, size }),
    [orientation, resolvedLayout, size],
  );

  return (
    <GroupContext.Provider value={value}>
      {render === undefined ? <ul {...rootProps} /> : render(rootProps)}
    </GroupContext.Provider>
  );
}

/**
 * One file that already belongs to something — a message, a record, a tray.
 * The parts inside it read the file from here: the tile its kind, the trigger
 * its name, the detail its size.
 *
 * It renders an `li` inside an `AttachmentGroup` and a `div` alone, because a
 * list item outside a list is an error a reader hears.
 *
 * **Removal is a request.** `onRemove` is what makes the attachment removable:
 * `AttachmentRemove` renders, and `Backspace` and `Delete` answer anywhere
 * inside the attachment. A repeat of a held key is ignored, because it would
 * remove the attachment focus has just landed on.
 */
export function Attachment({
  disabled = false,
  file,
  invalid = false,
  loading = false,
  messages,
  onKeyDown,
  onRemove,
  orientation,
  render,
  size,
  ...nativeProps
}: AttachmentProps) {
  const defaults = useAttachmentDefaults();
  const group = useContext(GroupContext);
  const id = useId();
  const locale = useLocale();
  const t = useMessages(attachmentMessages, messages);

  const resolvedSize = size ?? group?.size ?? defaults.size;
  const resolvedOrientation = orientation ?? group?.orientation ?? defaults.orientation;
  const kind = fileKind({ name: file.name, type: file.type ?? '' });
  const { stem, extension } = splitName(file.name);
  const removable = onRemove !== undefined;

  const [described, setDescribed] = useState<AttachmentContextValue['described']>({
    detail: null,
    message: null,
  });
  const describe = useCallback((part: 'detail' | 'message', owned: string | null) => {
    setDescribed((current) => (current[part] === owned ? current : { ...current, [part]: owned }));
  }, []);

  const request = useCallback(
    (reason: AttachmentRemoveReason, source: SyntheticEvent) => {
      if (disabled) return;
      onRemove?.({ reason, file, source });
    },
    [disabled, file, onRemove],
  );

  const context: AttachmentContextValue = {
    describe,
    described,
    disabled,
    extension,
    file,
    ids: { detail: `${id}-detail`, message: `${id}-message` },
    invalid,
    kind,
    loading,
    locale,
    orientation: resolvedOrientation,
    removable,
    request,
    stem,
    t,
  };

  const rootProps: AttachmentRootProps = keyedProps({
    ...nativeProps,
    ...(loading ? { 'aria-busy': true } : {}),
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(invalid ? { 'data-invalid': '' } : {}),
    ...(loading ? { 'data-loading': '' } : {}),
    'data-kind': kind,
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'attachment',
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event as KeyboardEvent<HTMLLIElement>);
      if (!removable || disabled || event.defaultPrevented || event.repeat) return;
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      /* A field the page put inside an attachment keeps its own editing keys. */
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.closest('input, textarea, select') !== null) return;
      event.preventDefault();
      request('keyboard', event);
    },
  });

  const element =
    render !== undefined ? (
      render(rootProps)
    ) : group === null ? (
      <div {...(rootProps as AttachmentRootProps)} />
    ) : (
      <li {...rootProps} />
    );

  return <AttachmentContext.Provider value={context}>{element}</AttachmentContext.Provider>;
}

/**
 * Registers a describing part with the attachment for as long as it is on the
 * page, so the trigger's `aria-describedby` names only what exists. It runs
 * after the first paint, so the server's markup and the client's first render
 * agree and the description arrives with the effect.
 */
export function useDescribes(part: 'detail' | 'message', own: string | undefined): string {
  const { describe, ids } = useAttachment();
  const id = own ?? ids[part];
  useEffect(() => {
    describe(part, id);
    return () => describe(part, null);
  }, [describe, id, part]);
  return id;
}
