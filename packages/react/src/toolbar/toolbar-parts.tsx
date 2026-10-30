import { keyedProps } from '@slotted/core/selector-key';
import { useEffect, useId } from 'react';
import type { HTMLAttributes } from 'react';

import { UNIT_ATTRIBUTE, useToolbarOverflow } from './toolbar-context';
import type {
  ToolbarGroupProps,
  ToolbarItemProps,
  ToolbarSeparatorProps,
  ToolbarSpacerProps,
} from './toolbar.types';

/**
 * Records what a unit becomes in the surface, and says so in the DOM.
 *
 * The attribute is what the measurement reads: a unit carrying it has somewhere
 * to go, and one without it is pinned. Pinning is therefore the absence of a
 * counterpart rather than a second prop — one fact, in the place a reader is
 * already looking, and no way for the two to disagree.
 *
 * The declaration is made during render rather than in an effect, because a
 * consumer may put the trigger before an item and an effect would leave that
 * item's counterpart one render behind.
 */
function useCounterpart(counterpart: ToolbarItemProps['counterpart']) {
  const toolbar = useToolbarOverflow();
  const id = useId();
  const declared = counterpart !== undefined && counterpart !== null && counterpart !== false;

  if (declared) toolbar.declare(id, counterpart);

  const { release } = toolbar;
  useEffect(() => () => release(id), [id, release]);

  return declared ? { [UNIT_ATTRIBUTE]: id } : {};
}

/**
 * One unit the bar may give up, and what it becomes when it does.
 *
 * A unit is a direct child of the root, which is deliberately not the same
 * thing as an item: the keyboard finds items by being focusable, at any depth,
 * and the collapse acts on the boxes the bar lays out. A `ButtonGroup` inside
 * one of these is one unit and four items.
 *
 * It is only needed under `overflow="menu"`, and only around a control the bar
 * is allowed to hide. A control placed in a bar unwrapped is a unit too — a
 * pinned one, because it declares nothing to become.
 */
export function ToolbarItem({
  children,
  counterpart,
  ref,
  render,
  ...nativeProps
}: ToolbarItemProps) {
  const unit = useCounterpart(counterpart);

  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string } = keyedProps({
    ...nativeProps,
    ...unit,
    children,
    'data-part': 'item',
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * A run of related controls, announced as a group.
 *
 * The distance inside it is half the bar's gap and the distance around it is a
 * gap and a half, so the boundary between two groups reads wider than the
 * boundary between two controls — which is what keeps a destructive action off a
 * frequent one. Its accessible name is the consumer's own `aria-label`: only the
 * page knows what the run is for.
 *
 * The arrows do not stop at its edge. A group is a label around a run, not a
 * second keyboard: the item list stays linear, which is what the APG's own
 * multi-row bullet needs.
 *
 * It is a unit as well as a part, so `counterpart` on it moves the whole run
 * into the surface at once — no wrapper around a box the family already owns.
 */
export function ToolbarGroup({
  children,
  counterpart,
  ref,
  render,
  ...nativeProps
}: ToolbarGroupProps) {
  const unit = useCounterpart(counterpart);

  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string; role: 'group' } =
    keyedProps({
      ...nativeProps,
      ...unit,
      children,
      'data-part': 'group',
      role: 'group',
    });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * A hairline between two runs.
 *
 * It is a part of this family rather than a `divider`, because its geometry
 * belongs to the bar: it is measured against the controls beside it, and it
 * turns with the bar. `aria-orientation` states the axis of the rule itself,
 * which is perpendicular to the one the controls run along.
 */
export function ToolbarSeparator({ ref, render, ...nativeProps }: ToolbarSeparatorProps) {
  const { orientation } = useToolbarOverflow();
  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string; role: 'separator' } =
    keyedProps({
      ...nativeProps,
      'aria-orientation': orientation === 'vertical' ? 'horizontal' : 'vertical',
      'data-part': 'separator',
      role: 'separator',
    });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * The free space between two runs, so what follows sits at the end of the bar.
 *
 * It replaces a `justify` axis: an axis decides the placement of every control
 * at once, and what a bar needs is one boundary — the editing controls at the
 * start, the destructive one at the end.
 */
export function ToolbarSpacer({ ref, render, ...nativeProps }: ToolbarSpacerProps) {
  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string } = keyedProps({
    'aria-hidden': true,
    ...nativeProps,
    'data-part': 'spacer',
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}
