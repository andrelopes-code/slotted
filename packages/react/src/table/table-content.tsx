import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createFocusOrigin } from '@slotted/core/focus';
import { createScrollAffordance } from '@slotted/core/overflow';
import type { ScrollAffordanceHandle } from '@slotted/core/overflow';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useTable } from './table';
import type { TableContentProps, TableHandle } from './table.types';

/**
 * The scroller and the table it holds.
 *
 * Two elements and one component, because neither is a decision a consumer
 * makes: the `table` carries the semantics and the scroller carries the
 * overflow. Native props reach the `table`, which is the element the platform
 * gives the role to; `scrollProps` reaches the box around it.
 *
 * **The region wiring is written only while the table overflows.** `role`,
 * `tabindex` and a name arrive together, measured by `@slotted/core/overflow` —
 * the rule `prose` set. A tab stop on a table that fits makes a reader press
 * Tab for nothing, and a wide table with no tab stop is unreachable without a
 * pointer. The measurement never runs during render, so the server renders a
 * plain scroller and hydration finds the same DOM.
 */
export function TableContent({
  children,
  handleRef,
  ref,
  scrollLabelledBy,
  scrollProps,
  totalRowCount,
  ...nativeProps
}: TableContentProps) {
  const table = useTable();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [state, setState] = useState({ overflowing: false, atStart: true, atEnd: true });
  const affordance = useRef<ScrollAffordanceHandle | null>(null);

  const { ref: consumerScrollRef, ...restScrollProps } = scrollProps ?? {};

  /**
   * The consumer's own ref is answered from the same callback that starts the
   * measurement, so a consumer keeps its element and the family keeps its
   * observer. Composing rather than replacing is the rule for handlers, and a
   * ref is the same promise.
   */
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      setElement(node);
      if (typeof consumerScrollRef === 'function') consumerScrollRef(node);
      else if (consumerScrollRef !== null && consumerScrollRef !== undefined) {
        consumerScrollRef.current = node;
      }
    },
    [consumerScrollRef],
  );

  /**
   * Nothing is measured under `stickyTo="page"`: the family has released its own
   * scroll container so the header can stick to what scrolls outside it, and a
   * box that does not scroll has no overflow to answer and no tab stop to earn.
   */
  useEffect(() => {
    if (element === null || table.stickyTo === 'page') return undefined;

    const handle = createScrollAffordance(element, { onChange: setState });
    affordance.current = handle;
    setState(handle.state());

    return () => {
      handle.destroy();
      affordance.current = null;
    };
  }, [element, table.stickyTo]);

  /** A click on a cell focuses the scroller; its ring is for the keyboard (`createFocusOrigin`). */
  useEffect(() => (element === null ? undefined : createFocusOrigin(element).destroy), [element]);

  useImperativeHandle<TableHandle, TableHandle>(
    handleRef,
    () => ({
      overflowing: () => affordance.current?.state().overflowing ?? false,
      refresh: () => affordance.current?.refresh(),
      scrollToRow: (value) => {
        const row = element?.querySelector(`[data-part="row"][data-value="${CSS.escape(value)}"]`);
        if (row !== null && row !== undefined) affordance.current?.reveal(row);
      },
    }),
    [element],
  );

  const scroll: Record<string, unknown> = keyedProps({
    ...restScrollProps,
    'data-part': 'scroll',
    ref: attach,
  });

  if (state.overflowing) {
    scroll['data-overflowing'] = '';
    if (state.atStart) scroll['data-at-start'] = '';
    if (state.atEnd) scroll['data-at-end'] = '';
    scroll['role'] = restScrollProps.role ?? 'region';
    scroll['tabIndex'] = restScrollProps.tabIndex ?? 0;
    if (scrollLabelledBy !== undefined) scroll['aria-labelledby'] = scrollLabelledBy;
    else if (restScrollProps['aria-label'] === undefined) {
      scroll['aria-label'] = table.t('scroll');
    }
  }

  return (
    <div {...scroll}>
      <table
        {...nativeProps}
        /**
         * The practice requires the pair exactly when the DOM is not the whole
         * set, so a complete table writes neither and never counts itself
         * twice. The row states its own index under the same condition.
         */
        {...(totalRowCount === undefined ? {} : { 'aria-rowcount': totalRowCount })}
        {...withSelectorKey(table.loading ? { 'aria-busy': true } : {}, 'part', 'table')}

        ref={ref}
      >
        {children}
      </table>
    </div>
  );
}
