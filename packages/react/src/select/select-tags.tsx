import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { createWidthGate } from '@slotted/core/measure';
import '@slotted/styles/tag/tag.css';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import type { SelectOptionValue } from './select.types';

/**
 * The preview of a multiple selection: the chosen values as the chips they
 * are, and one more chip counting what did not fit (SL4).
 *
 * Three decisions live here and nowhere else:
 *
 * **The chips are `tag`s.** They wear `data-ui='tag'` beside the row this
 * family owns, so the chip a reader removes here is the chip they know from
 * everywhere else, and the geometry — the pill, the small step, the remove
 * control floored at the target minimum — is stated once, in `tag.css`.
 *
 * **What does not fit is measured, not guessed.** `createCollapse` is the same
 * ResizeObserver arithmetic `toolbar` collapses a bar with: it hides the units
 * that overrun and reveals the trigger from the first one that does. The
 * trigger is the `+N` chip, so the count is whatever the collapse reports and
 * cannot disagree with what is on screen.
 *
 * **Under 120px there is no chip.** A chip narrower than a word is a shape,
 * so the control says "3 selected" instead. The width is watched by
 * `createWidthGate`, which is a width and a callback rather than a container
 * query: `container-type: inline-size` would stop the frame's own width
 * depending on its contents, which is exactly how a select that is not
 * `fullWidth` is measured.
 */
export interface ChipRowProps {
  /** The chosen values, in the order the reader chose them. */
  values: readonly SelectOptionValue[];
  /** The label for a value, when the collection could resolve one. */
  labelFor: (value: SelectOptionValue) => string | undefined;
  /** The accessible name of a chip's remove control, given the value's own label. */
  removeLabel: (label: string) => string;
  /** Takes a value out of the selection. */
  onRemove: (value: SelectOptionValue, event: MouseEvent<HTMLButtonElement>) => void;
  /** The frame whose width decides whether a chip is the right answer at all. */
  frame: HTMLElement | null;
  /** Told whether the frame is under the width. */
  onNarrow: (narrow: boolean) => void;
  /** Whether the row answers the pointer at all. */
  disabled?: boolean;
}

/** The width, in CSS pixels, under which a chip has no room for a word. */
export const NARROW_WIDTH = 120;

export function ChipRow({
  disabled,
  frame,
  labelFor,
  onNarrow,
  onRemove,
  removeLabel,
  values,
}: ChipRowProps) {
  const row = useRef<HTMLSpanElement | null>(null);
  const overflow = useRef<HTMLSpanElement | null>(null);
  const collapse = useRef<CollapseHandle | null>(null);
  const [hidden, setHidden] = useState(0);

  useEffect(() => {
    const container = row.current;
    if (container === null) return undefined;

    const handle = createCollapse(container, {
      collapsible: () => true,
      onChange: (units) => setHidden(units.length),
      trigger: () => overflow.current,
      units: () => [...container.querySelectorAll<HTMLElement>(':scope > *:not([data-overflow])')],
    });

    collapse.current = handle;
    return () => {
      handle.destroy();
      collapse.current = null;
      setHidden(0);
    };
  }, []);

  /* A value arriving or leaving changes what there is to fit. */
  useEffect(() => {
    collapse.current?.refresh();
  }, [values]);

  useEffect(() => {
    if (frame === null) return undefined;
    const gate = createWidthGate(frame, { at: NARROW_WIDTH, onChange: onNarrow });
    return () => gate.destroy();
  }, [frame, onNarrow]);

  return (
    <span data-part="tags" data-part-tags="" ref={row}>
      {values.map((value) => {
        const label = labelFor(value) ?? String(value);
        return (
          <span
            data-part="root"
            data-part-root=""
            data-size="sm"
            data-ui="tag"
            data-ui-tag=""
            data-variant="soft"
            key={String(value)}
          >
            <span data-part="body" data-part-body="">
              <span data-part="label" data-part-label="">
                {label}
              </span>
            </span>
            <button
              aria-label={removeLabel(label)}
              data-part="remove"
              data-part-remove=""
              disabled={disabled}
              onClick={(event) => onRemove(value, event)}
              type="button"
            >
              <Icon>
                <Glyph name="x" />
              </Icon>
            </button>
          </span>
        );
      })}
      {/*
        The count of what did not fit. It is always rendered, because
        `createCollapse` measures it to know whether it will fit before it
        reveals it, and it carries `hidden` until the collapse takes it off.
      */}
      <span
        data-overflow=""
        data-part="root"
        data-part-root=""
        data-size="sm"
        data-ui="tag"
        data-ui-tag=""
        data-variant="soft"
        hidden
        ref={overflow}
      >
        <span data-part="body" data-part-body="">
          <span data-part="label" data-part-label="">{`+${Math.max(hidden, 1)}`}</span>
        </span>
      </span>
    </span>
  );
}
