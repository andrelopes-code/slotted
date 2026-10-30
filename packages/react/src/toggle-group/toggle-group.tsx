import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/toggle-group/toggle-group.css';

import { createRovingTabindex } from '@slotted/core/focus';
import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useField } from '../field';
import { useToggleGroupDefaults } from './toggle-group-defaults';
import type {
  ToggleGroupContextValue,
  ToggleGroupProps,
  ToggleGroupRootProps,
  ToggleGroupSelectionReason,
} from './toggle-group.types';

const ToggleGroupContext = createContext<ToggleGroupContextValue | undefined>(undefined);

/**
 * What the group around this item says. An item outside one has no shared
 * value to move, so this throws rather than rendering a button that looks
 * right and toggles nothing.
 */
export function useToggleGroup(): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext);
  if (context === undefined) {
    throw new Error('ToggleGroupItem must be rendered inside a ToggleGroup.');
  }
  return context;
}

/** The items the arrows move between. */
const ITEM_SELECTOR = '[data-part="item"]';

/**
 * A set of two-state buttons that share one value.
 *
 * **The arrows move focus and never toggle.** Each item is the APG Button
 * pattern's toggle button, activated by `Space` and `Enter` alone; the
 * movement between them is the Toolbar pattern's roving tabindex. The family
 * whose arrows move the value is `segmented-control`, and it is a radio group
 * because that is the pattern describing that interaction.
 *
 * **Inside a `toolbar` the group stands down.** A bar is one tab stop with
 * arrow navigation across every control it holds, so a group running a second
 * ring inside it would put two tab stops where the APG asks for one. The bar is
 * found in the DOM by its public identifier rather than through an imported
 * context, so neither family depends on the other; the cost is that the check
 * runs after mount, so a server-rendered group carries its own tab stop for one
 * frame. `rovingFocus` states it outright for a bar this library did not write.
 *
 * **The value is always an array.** `multiple` caps it at one entry rather than
 * changing its type, so both bindings hold one shape. A single-select consumer
 * writes an array of one, which is the price.
 */
export function ToggleGroup({
  attached,
  children,
  className,
  defaultValue,
  deselectable,
  disabled,
  fullWidth,
  loop,
  multiple,
  onValueChange,
  orientation,
  ref,
  render,
  role,
  rovingFocus,
  size,
  value,
  variant,
  ...nativeProps
}: ToggleGroupProps) {
  const defaults = useToggleGroupDefaults();
  const field = useField();
  const element = useRef<HTMLElement | null>(null);
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const [insideToolbar, setInsideToolbar] = useState(false);

  const current = value ?? own;
  const resolvedSize = size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedOrientation = orientation ?? defaults.orientation;
  /* Chips stand apart by definition: a joined row of them is a bar. */
  const resolvedAttached = resolvedVariant !== 'chips' && (attached ?? defaults.attached);
  const resolvedDeselectable = deselectable ?? defaults.deselectable;
  const resolvedLoop = loop ?? defaults.loop;
  const resolvedRoving = rovingFocus ?? !insideToolbar;

  useEffect(() => {
    setInsideToolbar(element.current?.closest('[data-ui="toolbar"]') !== null);
  }, []);

  useEffect(() => {
    const container = element.current;
    if (container === null || !resolvedRoving) return undefined;

    const handle = createRovingTabindex(container, {
      itemSelector: ITEM_SELECTOR,
      loop: () => resolvedLoop,
      orientation: () => resolvedOrientation,
    });
    return handle.destroy;
  }, [resolvedLoop, resolvedOrientation, resolvedRoving, children]);

  const context: ToggleGroupContextValue = {
    disabled,
    holds: (candidate) => current.includes(candidate),
    size: resolvedSize,
    toggle: (candidate, reason: ToggleGroupSelectionReason, source) => {
      const on = current.includes(candidate);
      let next: readonly string[];

      if (multiple === true) {
        next = on ? current.filter((entry) => entry !== candidate) : [...current, candidate];
      } else if (on) {
        /* The last one on stays on unless the group was told it may empty. */
        if (!resolvedDeselectable) return;
        next = [];
      } else {
        next = [candidate];
      }

      let cancelled = false;
      const state = createControllable<readonly string[]>({
        controlled: value,
        equals: (a, b) => a.length === b.length && a.every((entry, at) => entry === b[at]),
        initial: current,
        onRequest: (request) => {
          cancelled = request.cancelled;
          onValueChange?.(request.value, request);
        },
      });
      const moved = state.request(next, reason, source);
      if (!cancelled && moved) setOwn(next);
    },
    variant: resolvedVariant,
  };

  const rootProps: ToggleGroupRootProps = keyedProps({
    ...nativeProps,
    /**
     * Written only when the group flows the other way: `group` carries no
     * implied orientation, so the attribute says something exactly when the
     * arrows have moved to the block axis. A consumer's own wins.
     */
    'aria-orientation':
      nativeProps['aria-orientation'] ??
      (resolvedOrientation === 'vertical' ? 'vertical' : undefined),
    /* Named by the field's label when the consumer named it no other way:
       a `div` is not labelable, so the label's `for` reaches nothing. */
    'aria-labelledby':
      nativeProps['aria-labelledby'] ??
      (nativeProps['aria-label'] === undefined ? field?.ids.label : undefined),
    children: <ToggleGroupContext.Provider value={context}>{children}</ToggleGroupContext.Provider>,
    className,
    ...(resolvedAttached ? { 'data-attached': '' } : {}),
    ...((fullWidth ?? false) ? { 'data-full-width': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'toggle-group',
    'data-variant': resolvedVariant,
    role: role ?? 'group',
  });

  /**
   * The group keeps the element for its own ring and still hands it to the
   * consumer: a ref composed rather than replaced, which is the rule
   * `docs/build-briefing.md` records after a family dropped another's.
   */
  const attach = (node: HTMLDivElement | null) => {
    element.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  };

  return render === undefined ? (
    <div {...rootProps} ref={attach} />
  ) : (
    render({ ...rootProps, ref: attach } as ToggleGroupRootProps)
  );
}
