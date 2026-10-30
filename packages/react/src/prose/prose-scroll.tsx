import { keyedProps } from '@slotted/core/selector-key';
import { proseMessages } from '@slotted/core/i18n';
import { createScrollAffordance } from '@slotted/core/overflow';
import type { ScrollAffordanceHandle } from '@slotted/core/overflow';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useMessages } from '../i18n';
import type { ProseScrollHandle, ProseScrollProps, ProseScrollRootProps } from './prose.types';

/**
 * A wide block — a table, a fence — that scrolls sideways instead of pushing
 * the page over. The axe rule `scrollable-region-focusable` makes that a WCAG
 * 2.2 level A failure unless a keyboard can reach it, and anything that takes
 * focus then needs a name and a role or it fails SC 4.1.2. Adrian Roselli's
 * pattern is `<div role="region" aria-labelledby tabindex="0">`.
 *
 * None of the four surveyed implementations of this family ships it: Typeset's
 * `typeset-scroll` is a `div` with `overflow: auto`, and GitHub's table
 * wrapper is the same.
 *
 * The wiring is written **only while the block actually overflows**, measured
 * by `@slotted/core/overflow` — the module `Tabs` already uses. A tab stop on
 * a block that fits is a tab stop that does nothing, and a reader tabbing a
 * documentation page would hit one per table.
 *
 * The name resolves in one order, so a renderer's component map can use the
 * part with no arguments at all:
 *
 * 1. `labelledBy`, which is the block's own caption and is Roselli's answer;
 * 2. a native `aria-label` this instance states;
 * 3. `scroll` from the catalog of the language in force, with this instance's
 *    `messages` laid over it.
 */
export function ProseScroll({
  handleRef,
  labelledBy,
  messages,
  ref,
  render,
  ...nativeProps
}: ProseScrollProps) {
  const t = useMessages(proseMessages, messages);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const affordance = useRef<ScrollAffordanceHandle | null>(null);

  /**
   * The consumer's own ref is answered from the same callback that starts the
   * measurement, so a consumer keeps its element and the family keeps its
   * observer. Composing rather than replacing is the rule for handlers, and a
   * ref is the same promise.
   */
  const attach = useCallback(
    (node: HTMLElement | null) => {
      setElement(node);
      if (typeof ref === 'function') ref(node);
      else if (ref !== null && ref !== undefined) ref.current = node;
    },
    [ref],
  );

  /**
   * The measurement never runs during render, so the server renders a plain
   * scroller and hydration finds the same DOM. The wiring appears in the first
   * effect after mount, which is also the first moment a browser can say
   * whether the block overflows at all.
   */
  useEffect(() => {
    if (element === null) return undefined;

    const handle = createScrollAffordance(element, {
      onChange: (state) => setOverflowing(state.overflowing),
    });
    affordance.current = handle;
    setOverflowing(handle.state().overflowing);

    return () => {
      handle.destroy();
      affordance.current = null;
    };
  }, [element]);

  useImperativeHandle<ProseScrollHandle, ProseScrollHandle>(
    handleRef,
    () => ({
      overflowing: () => affordance.current?.state().overflowing ?? false,
      refresh: () => affordance.current?.refresh(),
    }),
    [],
  );

  const rootProps: ProseScrollRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'scroll',
    ref: attach,
  });

  /**
   * A role or a name the consumer wrote is kept: the family adds the wiring a
   * scrolling region needs and never argues with the one already there. It is
   * the same promise `HostAttributeToken` keeps in the Angular binding.
   */
  if (overflowing) {
    rootProps.role = nativeProps.role ?? 'region';
    rootProps.tabIndex = nativeProps.tabIndex ?? 0;
    if (labelledBy !== undefined) rootProps['aria-labelledby'] = labelledBy;
    else if (nativeProps['aria-label'] === undefined) {
      rootProps['aria-label'] = t('scroll');
    }
  }

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
