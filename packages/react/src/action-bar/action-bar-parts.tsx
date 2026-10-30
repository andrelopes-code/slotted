import { keyedProps } from '@slotted/core/selector-key';
import { useCallback, useEffect, useId } from 'react';
import type { HTMLAttributes } from 'react';

import { resolvePriority, UNIT_ATTRIBUTE, useActionBarOverflow } from './action-bar-context';
import type {
  ActionBarActionProps,
  ActionBarActionsProps,
  ActionBarPriority,
  ActionBarSeparatorProps,
  ActionBarStatusProps,
} from './action-bar.types';

/**
 * The sentence at the start of the bar: a dirty-state marker, a timestamp, the
 * count of what is selected and the control that selects the rest.
 *
 * It is a slot rather than a component. The library already has
 * `inline-message`, `status-indicator` and `badge`, and `table` already owns the
 * selection and its count; what this family supplies is the place, and the
 * guarantee that filling it does not move the action that confirms.
 */
export function ActionBarStatus({ children, ref, render, ...nativeProps }: ActionBarStatusProps) {
  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string } = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'status',
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * The run of actions, and the box the collapse measures.
 *
 * It is the run rather than the root, because the root is the query container
 * and a container is a container for its descendants and not for itself — so the
 * rule that turns the run into a column has to reach a descendant. Measuring the
 * root would also count the status region, which is not something the bar may
 * give away.
 */
export function ActionBarActions({ children, ref, render, ...nativeProps }: ActionBarActionsProps) {
  const bar = useActionBarOverflow();
  const { registerActions } = bar;

  const attach = useCallback(
    (node: HTMLElement | null) => {
      registerActions(node);
      if (typeof ref === 'function') return ref(node as HTMLDivElement | null);
      if (ref) ref.current = node as HTMLDivElement | null;
      return undefined;
    },
    [ref, registerActions],
  );

  useEffect(() => () => registerActions(null), [registerActions]);

  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string } = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'actions',
  });

  return render === undefined ? (
    <div {...rootProps} ref={attach} />
  ) : (
    render({ ...rootProps, ref: attach } as HTMLAttributes<HTMLElement>)
  );
}

/**
 * One action the bar may give up, its rank, and what it becomes when it goes.
 *
 * A unit is a direct child of the run, which is deliberately not the same thing
 * as the control inside it: a `ButtonGroup` in a bar is one unit and four
 * buttons, and the bar gives up the box rather than the buttons.
 *
 * The rank and the counterpart are one fact seen from two sides. A control with
 * nothing to become in the surface is pinned — it has nowhere to go, which is
 * why the action that confirms stays visible — and a rank that needs somewhere
 * to go and has nowhere behaves as pinned too, so a consumer error leaves the
 * control on the bar rather than hiding it silently.
 */
export function ActionBarAction({
  children,
  counterpart,
  priority,
  ref,
  render,
  ...nativeProps
}: ActionBarActionProps) {
  const bar = useActionBarOverflow();
  const id = useId();
  const declared = counterpart !== undefined && counterpart !== null && counterpart !== false;
  const resolved = resolvePriority(priority, declared);

  /* Declared during render rather than in an effect, because a consumer may put
     the trigger before an action and an effect would leave that action's
     counterpart one render behind. */
  if (declared) bar.declare(id, counterpart);

  const { release } = bar;
  useEffect(() => () => release(id), [id, release]);

  const rootProps: HTMLAttributes<HTMLElement> & {
    'data-part': string;
    'data-priority': ActionBarPriority;
  } = keyedProps({
    ...nativeProps,
    ...(declared ? { [UNIT_ATTRIBUTE]: id } : {}),
    /* `always` is never drawn in the bar. The attribute is written by this
       family rather than by the measurement, which is what keeps the collapse
       from revealing it on its first pass. */
    ...(resolved === 'always' ? { hidden: true } : {}),
    children,
    'data-part': 'action',
    'data-priority': resolved,
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * A hairline between two runs of actions.
 *
 * It is the answer to the one line of `docs/component-features.md` §5 that names
 * no mechanism: a destructive action does not sit flush against a frequent one.
 * Half a gap on each side, which is wider than the distance between two
 * controls, so the boundary reads as a boundary.
 *
 * It is a part of this family rather than a `divider` because its geometry
 * belongs to the bar: it is measured against the controls beside it, and it
 * turns with them when the bar becomes a column. `aria-orientation` states the
 * axis of the rule itself, perpendicular to the one the actions run along.
 */
export function ActionBarSeparator({ ref, render, ...nativeProps }: ActionBarSeparatorProps) {
  const rootProps: HTMLAttributes<HTMLElement> & { 'data-part': string; role: 'separator' } =
    keyedProps({
      'aria-orientation': 'vertical',
      ...nativeProps,
      'data-part': 'separator',
      role: 'separator',
    });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}
