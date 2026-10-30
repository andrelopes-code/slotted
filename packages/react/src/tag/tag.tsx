import { useId } from 'react';

import { TagContent, TagFrame, TagRemove, useAppearance, useRemoval } from './tag-chip';
import type { TagProps } from './tag.types';

/**
 * An entity, a filter or a compact value that does nothing when it is pressed.
 * It is not metadata — that is `badge`, and the two share this tone and this
 * type scale on purpose — and it never becomes a command by accident: a chip
 * that acts is `TagButton`, one that navigates is `TagLink`, and one that
 * holds a selection is `TagToggle`.
 *
 * It can still be removed. A static chip with an X is the commonest shape in
 * the field, and the X is a control while the chip around it is not.
 *
 * The member's own props land on the chip box, which is the element a static
 * tag is, and `render` puts that box into another element — an `<li>` in a
 * list, a `<dd>` in a description list.
 */
export function Tag({
  children,
  disabled = false,
  end,
  onRemove,
  removeDisabled = false,
  messages,
  render,
  shape,
  size,
  start,
  tone,
  variant,
  ...nativeProps
}: TagProps) {
  const appearance = useAppearance({ shape, size, tone, variant });
  const removal = useRemoval({ disabled, onRemove, removeDisabled, messages });
  const id = useId();
  const labelId = `${id}label`;
  const wordId = `${id}remove`;

  return (
    <TagFrame
      appearance={appearance}
      disabled={disabled}
      removal={removal}
      render={render}
      rootProps={nativeProps}
    >
      <span data-part="body" data-part-body="">
        <TagContent end={end} labelId={labelId} start={start}>
          {children}
        </TagContent>
      </span>
      {removal.removable ? <TagRemove labelId={labelId} removal={removal} wordId={wordId} /> : null}
    </TagFrame>
  );
}
