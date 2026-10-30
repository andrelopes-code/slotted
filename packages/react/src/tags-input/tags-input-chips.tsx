import type { FamilyTranslator, TagsInputMessages } from '@slotted/core/i18n';
import { createArrowNavigation, createRemovalFocus } from '@slotted/core/focus';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import type { TagsVerdict } from '@slotted/core/tags';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { Glyph, Icon } from '../icon';

/** The chips in the row, in the order the row holds them. */
export const CHIP_SELECTOR = "[data-part='chips'] > [role='gridcell']:not([data-part='field'])";

/** What the row and its chips read from the control that renders them. */
export interface TagsInputChipsContext {
  announce: (message: string) => void;
  /** The row is one line and a `+N` at rest, and every chip while focus is within. */
  collapsing: boolean;
  copy: (value: string) => void;
  disabled: boolean;
  /** The value a refused duplicate is already held under, for its chip to take focus. */
  duplicate: string | null;
  editable: boolean;
  inputNode: HTMLInputElement | null;
  labelFor: (value: string) => string;
  lockedValues: readonly string[];
  move: (from: number, to: number, source?: unknown) => void;
  readOnly: boolean;
  remove: (index: number, source?: unknown) => void;
  reorderable: boolean;
  replace: (index: number, text: string, source?: unknown) => void;
  /** The family's words in the language in force. */
  t: FamilyTranslator<TagsInputMessages>;
  value: readonly string[];
  verdicts: readonly TagsVerdict[];
}

interface ChipProps {
  context: TagsInputChipsContext;
  index: number;
  value: string;
}

/**
 * One value, as the chip it is.
 *
 * The cell holds focus and the remove button inside it does not: the grid
 * pattern's two optimal cell designs are "one widget that does not need
 * arrows" and "text alone", and a chip is text *and* a widget — the case the
 * pattern calls the one that adds complexity. Focus on the cell, `Delete` and
 * `Backspace` doing what the button does, and the button at `tabindex="-1"` is
 * how React Aria's `TagGroup`, Angular Material's `MatChipGrid` and
 * `multi-select` all resolve it.
 *
 * **An invalid value is this chip in the danger tone**, with the alert mark in
 * `tag`'s `start` slot, `aria-invalid` on the cell, and the reason as its
 * description and its `title`. The value stays where the reader can see it and
 * fix it, which is what no surveyed implementation does.
 */
function Chip({ context, index, value }: ChipProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const cell = useRef<HTMLSpanElement | null>(null);
  /* `Escape` moves focus back to the cell, and the field it leaves blurs on the
     way out: the blur must not commit what the key just reverted. */
  const reverting = useRef(false);
  const messageId = useId();

  const label = context.labelFor(value);
  const locked = context.lockedValues.includes(value);
  const frozen = context.disabled || context.readOnly || locked;
  const verdict = context.verdicts[index] ?? { valid: true };
  const message = verdict.valid ? null : verdict.message || context.t('invalid');
  const count = context.value.length;

  /* A duplicate the reader offered is answered by the chip that already holds
     it: they are shown where their value is instead of being told nothing
     happened. */
  useEffect(() => {
    if (context.duplicate !== value) return;
    cell.current?.focus({ preventScroll: true });
  }, [context.duplicate, value]);

  const commitEdit = (text: string, source: unknown) => {
    if (reverting.current) {
      reverting.current = false;
      return;
    }
    setEditing(null);
    cell.current?.focus({ preventScroll: true });
    if (text.trim() === '' || text === value) return;
    context.replace(index, text, source);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.defaultPrevented) return;
    const meta = event.ctrlKey || event.metaKey;

    if (meta && (event.key === 'c' || event.key === 'C')) {
      event.preventDefault();
      context.copy(value);
      return;
    }
    if (meta && (event.key === 'x' || event.key === 'X')) {
      if (frozen) return;
      event.preventDefault();
      context.copy(value);
      context.remove(index, event.nativeEvent);
      return;
    }

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (frozen) return;
        event.preventDefault();
        context.remove(index, event.nativeEvent);
        return;
      case 'Enter':
        if (frozen || !context.editable) return;
        event.preventDefault();
        reverting.current = false;
        setEditing(value);
        return;
      case 'Escape':
        event.preventDefault();
        context.inputNode?.focus({ preventScroll: true });
        return;
      default:
        break;
    }

    /* Reorder: `Alt` and an arrow, following the writing direction. */
    if (context.reorderable && event.altKey && !frozen) {
      const rtl =
        cell.current?.ownerDocument.defaultView?.getComputedStyle(cell.current).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      const to =
        event.key === forward
          ? index + 1
          : event.key === back
            ? index - 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? count - 1
                : null;
      if (to !== null) {
        event.preventDefault();
        context.move(index, to, event.nativeEvent);
        return;
      }
    }

    /* A printable character returns to the field and types itself there: the
       grid pattern's alphanumeric branch. */
    if (event.key.length === 1 && !meta && !event.altKey) {
      context.inputNode?.focus({ preventScroll: true });
    }
  };

  const onRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    context.remove(index, event.nativeEvent);
  };

  const onDoubleClick = () => {
    if (frozen || !context.editable) return;
    reverting.current = false;
    setEditing(value);
  };

  if (editing !== null) {
    return (
      <span
        data-part="root"
        data-part-root=""
        data-size="sm"
        data-ui="tag"
        data-ui-tag=""
        data-value={value}
        data-variant="soft"
        ref={cell}
        role="gridcell"
        tabIndex={-1}
      >
        <span data-part="body" data-part-body="">
          <input
            aria-label={label}
            autoFocus
            onBlur={(event) => commitEdit(event.currentTarget.value, event.nativeEvent)}
            onChange={(event) => setEditing(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitEdit(event.currentTarget.value, event.nativeEvent);
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                reverting.current = true;
                setEditing(null);
                cell.current?.focus({ preventScroll: true });
              }
            }}
            size={Math.max(value.length, 1)}
            type="text"
            value={editing}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      aria-describedby={message === null ? undefined : messageId}
      aria-invalid={message === null ? undefined : true}
      aria-label={
        context.reorderable
          ? context.t('reorder', { label, position: index + 1, count })
          : undefined
      }
      data-part="root"
      data-part-root=""
      data-size="sm"
      data-ui="tag"
      data-ui-tag=""
      data-value={value}
      data-variant="soft"
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      ref={cell}
      role="gridcell"
      tabIndex={-1}
      title={message ?? undefined}
      {...(message === null ? {} : { 'data-invalid': '', 'data-tone': 'danger' })}
      {...(context.duplicate === value ? { 'data-current': '' } : {})}
      {...(locked || context.disabled ? { 'data-disabled': '' } : {})}
    >
      <span data-part="body" data-part-body="">
        {message === null ? null : (
          <span data-part="start" data-part-start="">
            <Icon>
              <Glyph name="circle-alert" />
            </Icon>
          </span>
        )}
        <span data-part="label" data-part-label="">
          {label}
        </span>
      </span>
      {message === null ? null : (
        <span data-part="message" data-part-message="" id={messageId}>
          {message}
        </span>
      )}
      {frozen ? null : (
        <button
          aria-label={context.t('remove', { label })}
          data-part="remove"
          data-part-remove=""
          onClick={onRemove}
          tabIndex={-1}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      )}
    </span>
  );
}

/**
 * A key per value that survives a reorder: the value itself, and its ordinal
 * among equal values when duplicates are allowed. A key by index would
 * re-create the chip a reader just moved and drop the focus that travels
 * with it.
 */
function keysFor(values: readonly string[]) {
  const seen = new Map<string, number>();
  return values.map((value) => {
    const times = seen.get(value) ?? 0;
    seen.set(value, times + 1);
    return times === 0 ? value : `${value}\u0000${times}`;
  });
}

export interface ChipRowProps {
  /** The field cell, which is the last cell of the row. */
  children: ReactNode;
  context: TagsInputChipsContext;
  describedBy: string;
  label: string;
}

/**
 * The row: one `role="row"` holding one cell per value and the field at the
 * end. One DOM row, however many lines it draws — the wrap is CSS, so the
 * reading order stays linear and "previous" and "next" have one meaning each.
 */
export function ChipRow({ children, context, describedBy, label }: ChipRowProps) {
  const row = useRef<HTMLDivElement | null>(null);
  const overflow = useRef<HTMLSpanElement | null>(null);
  const collapse = useRef<CollapseHandle | null>(null);
  const [hidden, setHidden] = useState(0);

  const latest = useRef(context);
  latest.current = context;

  /**
   * The ring over the cells. The field keeps the caret keys while there is
   * anything to move the caret through, and gives them up when the text is
   * empty — the only rule that stays correct in a right-to-left document,
   * where the caret's arrows are visual and the row's are logical.
   */
  useEffect(() => {
    const container = row.current;
    if (container === null) return;
    const handle = createArrowNavigation(container, {
      itemSelector: `${CHIP_SELECTOR}, [data-part='field'] > [data-part='input']`,
      loop: false,
      ownedKeys: (item) =>
        item instanceof HTMLInputElement && item.value !== ''
          ? ['ArrowLeft', 'ArrowRight', 'Home', 'End']
          : [],
    });
    return () => handle.destroy();
  }, []);

  /**
   * Where focus goes when a chip is taken out: the cell that took its index,
   * then the previous one, then the field.
   */
  useEffect(() => {
    const container = row.current;
    if (container === null) return;
    const handle = createRemovalFocus(container, {
      fallback: () => latest.current.inputNode,
      itemSelector: CHIP_SELECTOR,
    });
    return () => handle.destroy();
  }, []);

  /** What did not fit, measured rather than declared — and only while the row is closed. */
  const collapsing = context.collapsing;
  useEffect(() => {
    const container = row.current;
    if (container === null || !collapsing) {
      setHidden(0);
      return;
    }
    const handle = createCollapse(container, {
      collapsible: () => true,
      onChange: (units) => setHidden(units.length),
      trigger: () => overflow.current,
      /* The count is the trigger, not a unit: counted among the units it
         reported itself as one more hidden chip. */
      units: () =>
        [...container.querySelectorAll<HTMLElement>(CHIP_SELECTOR)].filter(
          (unit) => !unit.hasAttribute('data-count'),
        ),
    });
    collapse.current = handle;
    return () => {
      handle.destroy();
      collapse.current = null;
      setHidden(0);
    };
  }, [collapsing]);

  /* A value arriving or leaving changes what there is to fit. */
  useLayoutEffect(() => {
    collapse.current?.refresh();
  }, [context.value]);

  return (
    <div
      aria-describedby={describedBy}
      aria-label={label}
      data-part="chips"
      data-part-chips=""
      ref={row}
      role="row"
    >
      {keysFor(context.value).map((key, index) => (
        <Chip context={context} index={index} key={key} value={context.value[index] as string} />
      ))}
      {collapsing ? (
        /*
          The count of what did not fit. It is a chip and not a number beside
          them, so the row reads as one run of chips whose last one happens to
          be a count. It wears the outline variant where a value wears soft.
          Pressing it focuses the input, which opens the row.
        */
        <span
          data-count=""
          data-part="root"
          data-part-root=""
          data-size="sm"
          data-ui="tag"
          data-ui-tag=""
          data-variant="outline"
          hidden
          onClick={() => latest.current.inputNode?.focus({ preventScroll: true })}
          ref={overflow}
          role="gridcell"
          tabIndex={-1}
        >
          <span data-part="body" data-part-body="">
            <span data-part="label" data-part-label="">{`+${Math.max(hidden, 1)}`}</span>
          </span>
        </span>
      ) : null}
      {children}
    </div>
  );
}
