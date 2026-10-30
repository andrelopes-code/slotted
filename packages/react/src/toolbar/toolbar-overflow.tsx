import { toolbarMessages } from '@slotted/core/i18n';
import { keyedProps } from '@slotted/core/selector-key';
import { Fragment, useCallback, useRef } from 'react';
import type { Ref } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuSeparator, MenuTrigger } from '../menu';
import { useToolbarOverflow } from './toolbar-context';
import type { ToolbarOverflowLabel, ToolbarOverflowProps } from './toolbar.types';

/** Two refs on one element: the family's, and whatever the consumer passed. */
function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/** The `label` the consumer gave, or the count in the language in force. */
function nameFor(label: ToolbarOverflowLabel | undefined, hidden: number, more: string) {
  if (typeof label === 'function') return label(hidden);
  if (label !== undefined) return label;
  return more;
}

/**
 * The control that opens what did not fit, and the surface holding it.
 *
 * It is `menu`'s trigger wearing this family's geometry, so the surface, its
 * keyboard, its dismissal and its focus return are `menu`'s and are not written
 * twice. What this family adds is the measurement: the bar decides which units
 * give way, and the counterparts they declared are rendered here in the order
 * the bar held them, with a separator wherever one of the bar's own rules sat
 * between two of them.
 *
 * **The `hidden` attribute on the trigger belongs to the bar.** It is written
 * by `createCollapse` rather than by this component, because the same
 * measurement that decides whether the control is needed is the one that has to
 * reveal it to read its width. React writes no `hidden` here, so the two never
 * disagree.
 *
 * A bar with no `ToolbarOverflow` in it collapses nothing and scrolls instead,
 * which is the same degradation a bar of pinned units gets — one rule rather
 * than two.
 */
export function ToolbarOverflow({
  align,
  label,
  menuRef,
  ref,
  render,
  side,
  size,
  ...nativeProps
}: ToolbarOverflowProps) {
  const toolbar = useToolbarOverflow();
  const t = useMessages(toolbarMessages);
  const collapsed = toolbar.collapsed;
  const { registerTrigger } = toolbar;

  /**
   * The element reaches three places: the positioner's anchor, the bar's own
   * measurement, and the consumer's ref. The anchor is the one that cannot be
   * dropped — a surface whose trigger never reached the positioner is measured
   * against nothing and opens at the corner of the page, which is what a `ref`
   * written after the spread did until the capture showed it.
   *
   * The callback is stable and reads the trigger's own ref from a box written
   * during render. A callback rebuilt each render would detach and reattach on
   * every pass, and each attachment sets state on the bar.
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
            'aria-label': nameFor(label, collapsed.length, t('more', { count: collapsed.length })),
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
        {collapsed.map((unit) => (
          <Fragment key={unit.id}>
            {unit.separatorBefore ? <MenuSeparator /> : null}
            {toolbar.counterpart(unit.id)}
          </Fragment>
        ))}
      </MenuContent>
    </Menu>
  );
}
