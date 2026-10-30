import { keyedProps } from '@slotted/core/selector-key';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { useId, useState } from 'react';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { TagContent, TagFrame, TagRemove, useAppearance, useRemoval } from './tag-chip';
import type { TagButtonBodyProps, TagToggleProps } from './tag.types';

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter, which is why the family uses one — and why the reason a selection
 * moved has to be recovered from the event. A click synthesised by the
 * keyboard reports no detail; a real one reports the click count. The same
 * rule `button` writes for its own toggle.
 */
function activationReason(event: MouseEvent): ChangeReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * A chip that holds a selection: a filter that is on, a facet that is chosen.
 * Carbon calls it a selectable tag, Ant a checkable tag, Fluent a selected
 * tag, React Aria a selected item in a tag group — and none of the four ships
 * the uncontrolled half, so a filter bar cannot be written without a `useState`
 * for every chip in it.
 *
 * It announces `aria-pressed` rather than `aria-selected`, which is a
 * deliberate departure with a cost: `aria-selected` is only valid inside a
 * `listbox`, a `grid` or a `tree`, and an `option` may not contain the remove
 * control this family puts beside the label. The family keeps `selected` as
 * its own word, because that is what the field calls it, and writes
 * `data-selected` for styling.
 *
 * The label never changes with the state — the APG's rule for a toggle — so
 * "Open" stays "Open" and the state is announced beside it.
 */
export function TagToggle({
  children,
  defaultSelected,
  disabled = false,
  end,
  onClick,
  onRemove,
  onSelectedChange,
  removeDisabled = false,
  messages,
  render,
  rootProps,
  selected,
  shape,
  size,
  start,
  tone,
  type = 'button',
  variant,
  ...nativeProps
}: TagToggleProps) {
  const appearance = useAppearance({ shape, size, tone, variant });
  const removal = useRemoval({ disabled, onRemove, removeDisabled, messages });
  const [uncontrolled, setUncontrolled] = useState(defaultSelected ?? false);
  const id = useId();
  const labelId = `${id}label`;
  const wordId = `${id}remove`;

  /**
   * The controlled and uncontrolled pair, decided once by whether `selected`
   * was passed. `@slotted/core/state` owns that decision so the two bindings
   * cannot disagree about who holds the value; the controllable is rebuilt
   * each render over React's own state rather than kept across renders.
   */
  const state = createControllable<boolean>({
    controlled: selected,
    initial: uncontrolled,
    onRequest: (request) => onSelectedChange?.(request.value, request),
  });

  const bodyProps: TagButtonBodyProps = keyedProps({
    ...nativeProps,
    'aria-pressed': state.value,
    children: (
      <TagContent
        end={end}
        indicator={
          /* The selection mark's check, which the sheet uncovers when the chip is on. */
          <span aria-hidden="true" data-part="indicator" data-part-indicator="">
            <Icon>
              <Glyph name="check" />
            </Icon>
          </span>
        }
        labelId={labelId}
        start={start}
      >
        {children}
      </TagContent>
    ),
    'data-part': 'body',
    disabled,
    onClick: (event) => {
      onClick?.(event);
      /* A consumer that calls preventDefault has refused the activation, and a
         refused activation moves nothing. */
      if (event.defaultPrevented) return;
      const next = !state.value;
      if (state.request(next, activationReason(event), event)) setUncontrolled(next);
    },
    type,
  });

  return (
    <TagFrame
      appearance={appearance}
      disabled={disabled}
      removal={removal}
      rootProps={rootProps}
      selected={state.value}
    >
      {render === undefined ? <button {...bodyProps} /> : render(bodyProps)}
      {removal.removable ? <TagRemove labelId={labelId} removal={removal} wordId={wordId} /> : null}
    </TagFrame>
  );
}
