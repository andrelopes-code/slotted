import { keyedProps } from '@slotted/core/selector-key';
import { useId } from 'react';

import { TagContent, TagFrame, TagRemove, useAppearance, useRemoval } from './tag-chip';
import type { TagButtonBodyProps, TagButtonProps } from './tag.types';

/**
 * A chip that runs a command — Carbon's operational tag, Fluent's
 * `InteractionTag`, a clickable chip in MUI and PatternFly. The command is a
 * real `<button>`, and it is the chip's body rather than the chip itself,
 * because a chip that both acts and removes would otherwise be a button inside
 * a button.
 *
 * The member's own props are the button's, and land on that control: `onClick`,
 * `type`, `form`, `aria-*` and `ref` all reach the element that owns them.
 * `rootProps` reaches the chip box for the rare thing that belongs there.
 */
export function TagButton({
  children,
  disabled = false,
  end,
  onRemove,
  removeDisabled = false,
  messages,
  render,
  rootProps,
  shape,
  size,
  start,
  tone,
  type = 'button',
  variant,
  ...nativeProps
}: TagButtonProps) {
  const appearance = useAppearance({ shape, size, tone, variant });
  const removal = useRemoval({ disabled, onRemove, removeDisabled, messages });
  const id = useId();
  const labelId = `${id}label`;
  const wordId = `${id}remove`;

  const bodyProps: TagButtonBodyProps = keyedProps({
    ...nativeProps,
    children: (
      <TagContent end={end} labelId={labelId} start={start}>
        {children}
      </TagContent>
    ),
    'data-part': 'body',
    disabled,
    type,
  });

  return (
    <TagFrame appearance={appearance} disabled={disabled} removal={removal} rootProps={rootProps}>
      {render === undefined ? <button {...bodyProps} /> : render(bodyProps)}
      {removal.removable ? <TagRemove labelId={labelId} removal={removal} wordId={wordId} /> : null}
    </TagFrame>
  );
}
