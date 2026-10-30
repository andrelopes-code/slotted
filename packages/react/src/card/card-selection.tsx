import { keyedProps } from '@slotted/core/selector-key';
import type { CardRegionProps, CardRegionRootProps } from './card.types';

/**
 * The place a choice card keeps for its control: a native checkbox or radio,
 * and `<Checkbox>` when the family that owns the check ships it.
 *
 * It is the slot and not the glyph. The card sizes the control from the icon
 * scale density moves, tints the platform's own check with the accent, and
 * centers it on the title's first row; what a check and a dot look like is one
 * decision, and it belongs to `checkbox`.
 *
 * The card around it is the `<label>`, so the whole surface is the click target
 * and the title is the control's accessible name. A card that holds a choice
 * holds no other interactive content — Carbon and Cloudscape both state the
 * prohibition, and a second target inside a label is a target nobody can hit.
 */
export function CardSelection({ render, ...nativeProps }: CardRegionProps) {
  const rootProps: CardRegionRootProps = keyedProps({ ...nativeProps, 'data-part': 'selection' });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
