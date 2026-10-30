import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/toolbar/toolbar.css';

import { createRovingTabindex, TOOLBAR_ITEM_SELECTOR, toolbarOwnedKeys } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ToolbarOverflowContext, UNIT_ATTRIBUTE } from './toolbar-context';
import type { ToolbarCollapsedUnit, ToolbarOverflowValue } from './toolbar-context';
import { useToolbarDefaults } from './toolbar-defaults';
import type { ToolbarProps, ToolbarRootProps } from './toolbar.types';

/** Everything the bar lays out. The trigger is not one of them: it is what the
    units give way *to*, and a control that took part in its own measurement
    would be counted twice. */
const UNIT_SELECTOR = ':scope > *:not([data-part="overflow"])';

const NO_UNITS: readonly ToolbarCollapsedUnit[] = Object.freeze([]);

/**
 * Whether one of the bar's own rules sits between two units that both gave way.
 * It is read from the DOM rather than from the tree because a separator is a
 * sibling of the units it divides and nothing in React relates them.
 */
function ruleBetween(from: Element, to: Element) {
  for (
    let node = from.nextElementSibling;
    node !== null && node !== to;
    node = node.nextElementSibling
  ) {
    if (node.getAttribute('data-part') === 'separator') return true;
  }
  return false;
}

/**
 * A set of controls that share one tab stop.
 *
 * **The keyboard is the whole point of the role.** `Tab` enters the bar once
 * and lands on the control that last had focus, the arrows of the flow axis
 * move between the controls and wrap — from row to row when the bar wrapped,
 * because the item list is linear — and `Home` and `End` reach the ends. The
 * cross axis duplicates the pair, which the APG permits and which is what gives
 * focus a way out of an item that keeps the flow arrows for itself.
 *
 * **The items are the consumer's own controls.** Anything focusable inside the
 * bar is an item, found through `TOOLBAR_ITEM_SELECTOR`, so this library's
 * `button`, `link`, `checkbox`, `switch` and `text-field` — and a menu trigger,
 * and a consumer's own control — drop in unwrapped. Radix and Base UI wrap each
 * item in a component of their own instead. An element that cannot hold focus
 * is not an item.
 *
 * **The bar paints itself and nothing inside it.** Every control keeps its own
 * fill, its own states and its own step, which is what lets one bar hold a
 * small icon button beside a medium select. A bar out of action is
 * `<fieldset disabled>` around it: the platform disables every control inside
 * and, because a natively disabled control cannot be focused, the arrows skip
 * exactly those.
 *
 * The APG uses the role for three or more controls. That is guidance rather
 * than a rule here: a role that disappeared when a permission filter removed a
 * button would be a semantic changing behind the author.
 */
export function Toolbar({
  children,
  className,
  loop,
  onOverflowChange,
  orientation,
  overflow,
  ref,
  render,
  size,
  style,
  variant,
  ...nativeProps
}: ToolbarProps) {
  const defaults = useToolbarDefaults();
  const element = useRef<HTMLDivElement | null>(null);
  const tabindex = useRef<RovingTabindexHandle | null>(null);
  const collapse = useRef<CollapseHandle | null>(null);
  const counterparts = useRef(new Map<string, ReactNode>());
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState<readonly ToolbarCollapsedUnit[]>(NO_UNITS);

  const report = useRef(onOverflowChange);
  report.current = onOverflowChange;

  const resolvedLoop = loop ?? defaults.loop;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedOverflow = overflow ?? defaults.overflow;
  const resolvedSize = size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;

  const registerTrigger = useCallback((node: HTMLElement | null) => setTrigger(node), []);

  const overflowValue: ToolbarOverflowValue = useMemo(
    () => ({
      collapsed,
      counterpart: (id) => counterparts.current.get(id) ?? null,
      /* Written during render, and idempotent: the map is keyed by an
         identifier the unit owns, so a second render of the same unit replaces
         its own entry and touches nothing else. */
      declare: (id, node) => {
        counterparts.current.set(id, node);
      },
      orientation: resolvedOrientation,
      registerTrigger,
      release: (id) => {
        counterparts.current.delete(id);
      },
    }),
    [collapsed, registerTrigger, resolvedOrientation],
  );

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
    if (container === null) return undefined;

    const ring = createRovingTabindex(container, {
      /**
       * The APG lets a toolbar duplicate the cross-axis pair, and here it earns
       * its keep twice: it is how focus leaves a text field that owns the flow
       * arrows, and it is what a reader tries first in a bar that wrapped.
       */
      crossAxis: true,
      /**
       * A control that announces `aria-disabled` keeps its place in the ring,
       * which the APG allows where "discoverability of a function is crucial" —
       * and which is exactly what `button`'s `focusableWhenDisabled` renders. A
       * control carrying the native attribute is skipped, because the platform
       * will not focus it either.
       */
      includeAriaDisabled: true,
      itemSelector: TOOLBAR_ITEM_SELECTOR,
      loop: resolvedLoop,
      orientation: () => resolvedOrientation,
      ownedKeys: (item) => toolbarOwnedKeys(item, resolvedOrientation),
    });

    tabindex.current = ring;

    /**
     * A control arriving or leaving has to reach the tab stop, and neither
     * binding can be told by the other's change detection. The DOM is the one
     * thing they agree on — and the same event invalidates the measurement,
     * because a bar that grows a button collapses one.
     */
    const observer = new MutationObserver(() => {
      ring.refresh();
      collapse.current?.refresh();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      ring.destroy();
      tabindex.current = null;
    };
  }, [resolvedLoop, resolvedOrientation]);

  /**
   * The collapse. It runs only under `overflow="menu"`, and only once the bar
   * holds a trigger: with nothing to give way *to*, every unit is pinned and
   * the bar scrolls instead — the same degradation a bar of pinned units gets.
   */
  useEffect(() => {
    const container = element.current;
    if (container === null || resolvedOverflow !== 'menu') return undefined;

    const handle = createCollapse(container, {
      collapsible: (unit) => unit.hasAttribute(UNIT_ATTRIBUTE),
      divides: (unit) => unit.getAttribute('data-part') === 'separator',
      /* A spacer grows into whatever is left, so its room is nought — and it is
         still one of the boxes the gaps run between. */
      fixedSize: (unit) => (unit.getAttribute('data-part') === 'spacer' ? 0 : undefined),
      onChange: (units) => {
        const named = units.filter((unit) => unit.hasAttribute(UNIT_ATTRIBUTE));
        setCollapsed(
          named.map((unit, index) => {
            const previous = named[index - 1];
            return {
              id: unit.getAttribute(UNIT_ATTRIBUTE) ?? '',
              separatorBefore: previous !== undefined && ruleBetween(previous, unit),
            };
          }),
        );
        /* A unit that left the bar leaves the ring with it, and one that came
           back rejoins it. */
        tabindex.current?.refresh();
        report.current?.(named.length);
      },
      orientation: () => resolvedOrientation,
      trigger: () => trigger,
      units: () => [...container.querySelectorAll<HTMLElement>(UNIT_SELECTOR)],
    });

    collapse.current = handle;
    return () => {
      handle.destroy();
      collapse.current = null;
      setCollapsed(NO_UNITS);
    };
  }, [resolvedOrientation, resolvedOverflow, trigger]);

  const rootProps: ToolbarRootProps = keyedProps({
    ...nativeProps,
    ...(resolvedOverflow === 'menu' ? { 'data-collapsed': String(collapsed.length) } : {}),
    ...(resolvedOrientation === 'vertical' ? { 'aria-orientation': 'vertical' as const } : {}),
    children,
    className,
    'data-orientation': resolvedOrientation,
    'data-overflow': resolvedOverflow,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'toolbar',
    'data-variant': resolvedVariant,
    role: 'toolbar',
    style,
  });

  return (
    <ToolbarOverflowContext.Provider value={overflowValue}>
      {render === undefined ? (
        <div {...rootProps} ref={attach} />
      ) : (
        render({ ...rootProps, ref: attach } as ToolbarRootProps)
      )}
    </ToolbarOverflowContext.Provider>
  );
}
