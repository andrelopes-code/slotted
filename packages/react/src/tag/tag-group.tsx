import { keyedProps } from '@slotted/core/selector-key';
import { createRemovalFocus, createRovingTabindex } from '@slotted/core/focus';
import { useCallback, useEffect, useRef } from 'react';

import { TAG_CONTROL_SELECTOR, TagItemRoleProvider } from './tag-chip';
import type { TagGroupProps, TagGroupRootProps } from './tag.types';

/**
 * The run of tags, and the keyboard that belongs to it.
 *
 * It is a toolbar: the APG pattern for "a container for grouping a set of
 * controls, such as buttons". One tab stop, arrow keys between the controls
 * inside it, `Home` and `End` at the ends. React Aria and Angular Material
 * reach for the Grid pattern instead, which buys a second axis — "the next
 * chip" apart from "the next control in this chip" — at the price of two
 * wrapper elements per chip and a `gridcell` role over every button. A single
 * wrapping run does not need the second axis.
 *
 * The roving order is every control in DOM order: a chip's body, then its
 * remove control, then the next chip's. That is what makes the X reachable
 * without a second dimension.
 *
 * Writing `role="list"` turns the keyboard off. A list is a structure rather
 * than a widget, its items are not controls to move between, and a screen
 * reader announces its length — which a toolbar does not.
 */
export function TagGroup({
  children,
  loop = true,
  orientation = 'horizontal',
  ref,
  render,
  role = 'toolbar',
  ...nativeProps
}: TagGroupProps) {
  const element = useRef<HTMLDivElement | null>(null);
  const roving = role === 'toolbar';

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
      return undefined;
    },
    [ref],
  );

  useEffect(() => {
    const container = element.current;
    if (container === null || !roving) return undefined;

    const tabindex = createRovingTabindex(container, {
      itemSelector: TAG_CONTROL_SELECTOR,
      loop,
      orientation: () => orientation,
    });
    /**
     * Where the keyboard goes when the chip it was on is taken away. The
     * container is the last resort, which is why it holds `tabIndex={-1}`: a
     * group emptied by its final removal keeps focus rather than returning it
     * to the top of the page.
     */
    const removal = createRemovalFocus(container, { itemSelector: TAG_CONTROL_SELECTOR });
    /**
     * The tab stop has to survive a chip arriving or leaving, and neither
     * binding can be told by the other's change detection. The DOM is the one
     * thing both of them agree on.
     */
    const observer = new MutationObserver(() => tabindex.refresh());
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      removal.destroy();
      tabindex.destroy();
    };
  }, [loop, orientation, roving]);

  const rootProps: TagGroupRootProps = keyedProps({
    tabIndex: -1,
    ...nativeProps,
    children: (
      <TagItemRoleProvider role={role === 'list' ? 'listitem' : undefined}>
        {children}
      </TagItemRoleProvider>
    ),
    'data-orientation': orientation,
    'data-part': 'group',
    'data-ui': 'tag',
    ref: attach,
    role,
    /* `horizontal` is the toolbar role's own default, so only the other one is
       written; a list has no orientation to state. */
    ...(roving && orientation === 'vertical' ? { 'aria-orientation': orientation } : {}),
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
