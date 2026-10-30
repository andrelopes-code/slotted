import { createArrowNavigation, createRemovalFocus } from '@slotted/core/focus';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import { useMultiSelect } from './multi-select';
import { CHIP_SELECTOR } from './multi-select-collection';
import type { MultiSelectOptionValue } from './multi-select.types';

/** The values the reader cannot take out, whatever key they press. */
function isFrozen(readOnly: boolean, disabled: boolean) {
  return readOnly || disabled;
}

interface ChipProps {
  count: number;
  index: number;
  label: string;
  value: MultiSelectOptionValue;
}

/**
 * One chosen value, as the chip it is.
 *
 * The cell holds focus and the remove button inside it does not: the grid
 * pattern's two optimal cell designs are "one widget that does not need arrows"
 * and "text alone", and a chip is text *and* a widget — the case the pattern
 * calls the one that adds complexity. Focus on the cell, `Delete` and
 * `Backspace` doing what the button does, and the button at `tabindex="-1"` is
 * how React Aria's `TagGroup` and Angular Material's `MatChipGrid` both resolve
 * it, and it is what the contract records as a departure.
 */
function Chip({ count, index, label, value }: ChipProps) {
  const multiSelect = useMultiSelect();
  const [editing, setEditing] = useState<string | null>(null);
  const cell = useRef<HTMLSpanElement | null>(null);

  const frozen = isFrozen(multiSelect.readOnly, multiSelect.disabled);

  /**
   * A duplicate the reader offered is answered by the chip that already holds
   * it: they are shown where their value is instead of being told nothing
   * happened, which is the silence Mantine's `onDuplicate` exists to work
   * around.
   */
  useEffect(() => {
    if (multiSelect.duplicate !== value) return;
    cell.current?.focus({ preventScroll: true });
    multiSelect.setDuplicate(null);
  }, [multiSelect, value]);

  const commitEdit = (text: string, source: unknown) => {
    setEditing(null);
    cell.current?.focus({ preventScroll: true });
    multiSelect.replace(value, text, source);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.defaultPrevented) return;

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (frozen) return;
        event.preventDefault();
        multiSelect.remove(value, event.nativeEvent);
        return;
      case 'Enter':
        if (frozen || !multiSelect.editable) return;
        event.preventDefault();
        setEditing(label);
        return;
      case 'Escape':
        event.preventDefault();
        multiSelect.inputNode?.focus({ preventScroll: true });
        return;
      default:
        break;
    }

    /* Reorder. `Alt` and an arrow, following the writing direction, which no
       surveyed implementation does — Zag and Material both bind the two arrows
       literally, so their chips walk backwards in an Arabic document. */
    if (multiSelect.reorderable && event.altKey && !frozen) {
      const rtl =
        cell.current?.ownerDocument.defaultView?.getComputedStyle(cell.current).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === forward) {
        event.preventDefault();
        multiSelect.move(index, index + 1, event.nativeEvent);
        return;
      }
      if (event.key === back) {
        event.preventDefault();
        multiSelect.move(index, index - 1, event.nativeEvent);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        multiSelect.move(index, 0, event.nativeEvent);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        multiSelect.move(index, count - 1, event.nativeEvent);
        return;
      }
    }

    /**
     * Any printable character returns to the field and types itself there,
     * which is the grid pattern's alphanumeric branch: a cell holding editable
     * content takes focus into its input on an alphanumeric key.
     */
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      multiSelect.inputNode?.focus({ preventScroll: true });
    }
  };

  const onRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    multiSelect.remove(value, event.nativeEvent);
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
                setEditing(null);
                cell.current?.focus({ preventScroll: true });
              }
            }}
            size={Math.max(label.length, 1)}
            type="text"
            value={editing}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      aria-label={
        multiSelect.reorderable
          ? multiSelect.t('reorder', { label, position: index + 1, count })
          : undefined
      }
      data-part="root"
      data-part-root=""
      data-size="sm"
      data-ui="tag"
      data-ui-tag=""
      data-value={value}
      data-variant="soft"
      onKeyDown={onKeyDown}
      ref={cell}
      role="gridcell"
      tabIndex={-1}
      {...(frozen ? { 'data-disabled': '' } : {})}
    >
      <span data-part="body" data-part-body="">
        <span data-part="label" data-part-label="">
          {label}
        </span>
      </span>
      {frozen ? null : (
        <button
          aria-label={multiSelect.t('remove', { label })}
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

export interface ChipRowProps {
  /** The field cell, which is the last cell of the row. */
  children: ReactNode;
}

/**
 * The row: one `role="row"` holding one cell per value and the field at the
 * end.
 *
 * **One DOM row, however many lines it draws.** The wrap is CSS, so the reading
 * order stays linear and "previous" and "next" have one meaning each — which is
 * what leaves `ArrowDown` and `ArrowUp` free for the popup. A second DOM row
 * would put two grids under the same four arrows.
 */
export function ChipRow({ children }: ChipRowProps) {
  const multiSelect = useMultiSelect();
  const row = useRef<HTMLDivElement | null>(null);
  const overflow = useRef<HTMLSpanElement | null>(null);
  const collapse = useRef<CollapseHandle | null>(null);
  const [hidden, setHidden] = useState(0);

  const collapsing = multiSelect.overflow === 'collapse';

  /**
   * The ring over the cells. The field keeps the caret keys while there is
   * anything to move the caret through, and gives them up when the query is
   * empty — Zag's rule, and the only one that stays correct in a right-to-left
   * document, where the caret's arrows are visual and the row's are logical.
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
   * then the previous one, then the field. The third step is the one the field
   * gets wrong — Angular Material leaves focus on a button that no longer
   * exists and the page loses it to the document body.
   */
  useEffect(() => {
    const container = row.current;
    if (container === null) return;
    const handle = createRemovalFocus(container, {
      fallback: () => multiSelect.inputNode,
      itemSelector: CHIP_SELECTOR,
    });
    return () => handle.destroy();
  }, [multiSelect.inputNode]);

  /** What did not fit, measured rather than declared. */
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
      /* The counting chip is the trigger, never a unit: measured as one, it
         counted itself and stood one too high, and was collapsed into itself. */
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
  }, [multiSelect.value]);

  return (
    <div data-part="chips" data-part-chips="" ref={row} role="row">
      {multiSelect.value.map((value, index) => (
        <Chip
          count={multiSelect.value.length}
          index={index}
          key={value}
          label={multiSelect.labelFor(value) ?? value}
          value={value}
        />
      ))}
      {collapsing ? (
        /*
          The count of what did not fit. It is a chip and not a number beside
          them, so the row reads as one run of chips whose last one happens to
          be a count — and `createCollapse` measures it the way it measures
          every other unit, which is why it is always rendered. It wears the
          outline variant where a value wears soft: a count drawn exactly like a
          value is read as a value named "+3". Pressing it opens the popup,
          whose band holds every value it stands for.
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
          onClick={(event) => multiSelect.setOpen(true, 'pointer', event.nativeEvent)}
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
