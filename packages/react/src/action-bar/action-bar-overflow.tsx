import { actionBarMessages } from '@slotted/core/i18n';
import { keyedProps } from '@slotted/core/selector-key';
import { Fragment, useCallback, useRef } from 'react';
import type { Ref } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuSeparator, MenuTrigger } from '../menu';
import { useActionBarOverflow } from './action-bar-context';
import type { ActionBarOverflowLabel, ActionBarOverflowProps } from './action-bar.types';

/** Two refs on one element: the family's, and whatever the consumer passed. */
function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/** The `label` the consumer gave, or the count in the language in force. */
function nameFor(label: ActionBarOverflowLabel | undefined, hidden: number, more: string) {
  if (typeof label === 'function') return label(hidden);
  if (label !== undefined) return label;
  return more;
}

/**
 * The control that opens what did not fit, and the surface holding it.
 *
 * It is `menu`'s trigger wearing this family's geometry, so the surface, its
 * keyboard, its dismissal and its focus return are `menu`'s and are not written
 * twice. What this family adds is the measurement: the bar decides which actions
 * give way, by rank, and the counterparts they declared are rendered here in the
 * order the bar holds them — with a separator wherever one of the bar's own
 * rules sits between two of them.
 *
 * The surface also holds every action ranked `always`, which was never drawn in
 * the bar at all. A reader opening the menu sees one list, so the two sources
 * are read together and in the bar's own order.
 *
 * **The `hidden` attribute on the trigger belongs to the bar.** It is written by
 * `createCollapse` rather than by this component, because the same measurement
 * that decides whether the control is needed is the one that has to reveal it to
 * read its width. React writes no `hidden` here, so the two never disagree.
 *
 * A bar with no `ActionBarOverflow` in it collapses nothing and wraps to a
 * second row instead — including its `hide` actions, which need a bar that
 * collapses in order to give way at all.
 */
export function ActionBarOverflow({
  align,
  label,
  menuRef,
  ref,
  render,
  side,
  size,
  ...nativeProps
}: ActionBarOverflowProps) {
  const bar = useActionBarOverflow();
  const t = useMessages(actionBarMessages);
  const surface = bar.surface;
  const { registerTrigger } = bar;

  /**
   * The element reaches three places: the positioner's anchor, the bar's own
   * measurement, and the consumer's ref. The anchor is the one that cannot be
   * dropped — a surface whose trigger never reached the positioner is measured
   * against nothing and opens at the corner of the page, which is what a `ref`
   * written after the spread did in `toolbar` until a capture showed it.
   */
  const anchor = useRef<Ref<HTMLElement> | undefined>(undefined);
  const setTriggerNode = useCallback(
    (element: HTMLElement | null) => {
      registerTrigger(element);
      attach(element, anchor.current, ref);
    },
    [ref, registerTrigger],
  );

  return (
    <Menu
      {...(align === undefined ? {} : { align })}
      {...(menuRef === undefined ? {} : { ref: menuRef })}
      {...(side === undefined ? {} : { side })}
      {...(size === undefined ? {} : { size })}
    >
      <MenuTrigger
        render={({ ref: anchorRef, ...props }) => {
          anchor.current = anchorRef;

          const rootProps = keyedProps({
            ...props,
            ...nativeProps,
            'aria-label': nameFor(label, surface.length, t('more', { count: surface.length })),
            children: (
              <Icon>
                <Glyph name="ellipsis" />
              </Icon>
            ),
            'data-part': 'overflow',
          });

          return render === undefined ? (
            <button {...rootProps} ref={setTriggerNode} type="button" />
          ) : (
            render({ ...rootProps, ref: setTriggerNode })
          );
        }}
      />
      <MenuContent>
        {surface.map((unit) => (
          <Fragment key={unit.id}>
            {unit.separatorBefore ? <MenuSeparator /> : null}
            {bar.counterpart(unit.id)}
          </Fragment>
        ))}
      </MenuContent>
    </Menu>
  );
}
