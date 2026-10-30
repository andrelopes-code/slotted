import { keyedProps } from '@slotted/core/selector-key';
import { useButtonGroupShape } from './button-group-shape';
import type {
  ButtonGroupSeparatorProps,
  ButtonGroupSeparatorRootProps,
} from './button-group.types';

/**
 * A rule between two runs of actions. It takes no room at all: the bar is one
 * shape, and a rule is not license to cut it — what the rule marks is painted
 * in the column the shared edge already occupies, one step stronger than the
 * seams around it, so the boundary reads without the bar coming apart. A
 * filled run keeps its seam, which is the darkest step of its own tone and the
 * strongest line that bar has.
 *
 * Its axis is the group's, mirrored: a rule across a row is vertical. It is
 * derived rather than accepted, because a rule that could disagree with the
 * group it divides is a rule that eventually does.
 */
export function ButtonGroupSeparator({
  decorative = false,
  render,
  ...nativeProps
}: ButtonGroupSeparatorProps) {
  const { orientation } = useButtonGroupShape();

  const rootProps: ButtonGroupSeparatorRootProps = keyedProps({
    ...(decorative
      ? { 'aria-hidden': true, role: 'none' }
      : {
          role: 'separator',
          'aria-orientation': orientation === 'vertical' ? 'horizontal' : 'vertical',
        }),
    ...nativeProps,
    'data-part': 'separator',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
