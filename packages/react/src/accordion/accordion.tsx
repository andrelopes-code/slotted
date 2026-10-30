import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/accordion/accordion.css';

import { isHeldOpen, nextOpenValues, sameOpenValues } from '@slotted/core/disclosure';
import { createArrowNavigation } from '@slotted/core/focus';
import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useAccordionDefaults } from './accordion-defaults';
import type {
  AccordionContextValue,
  AccordionProps,
  AccordionRootProps,
  AccordionSelectionReason,
  AccordionVariant,
} from './accordion.types';

/**
 * The header of every item this set owns, and of no set nested inside it.
 * `:scope` is what stops a nested accordion's headers from joining the outer
 * one's arrow ring: root, item, header, trigger is exactly four levels.
 */
export const ACCORDION_TRIGGER_SELECTOR =
  ':scope > * > [data-part="header"] > [data-part="trigger"]';

/** The variant the set hands its items, per variant the set is drawn in. */
const ITEM_VARIANT: Record<AccordionVariant, 'plain' | 'ruled' | 'framed'> = {
  plain: 'plain',
  ruled: 'ruled',
  framed: 'ruled',
  separated: 'framed',
};

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

/**
 * The items, read from the DOM rather than from a registry. It is the one order
 * that is never stale, and it is how `tabs` reads its own collection: neither
 * binding can be told about an item by the other's change detection.
 */
function itemValues(root: HTMLElement | null) {
  if (root === null) return [];
  return [...root.querySelectorAll<HTMLElement>(':scope > [data-value]')].map((item) => ({
    disabled: item.hasAttribute('data-disabled'),
    value: item.getAttribute('data-value') ?? '',
  }));
}

/**
 * The set around this disclosure, or `undefined` for one standing on its own.
 *
 * It is `undefined` rather than a throw because a `Collapsible` outside an
 * accordion is a complete component: it owns its own `open`, and the group is
 * one of three places that value can come from.
 */
export function useAccordion(): AccordionContextValue | undefined {
  return useContext(AccordionContext);
}

/**
 * A set of disclosures that share a value.
 *
 * **The keyboard is the pattern's, plus four keys that are not.** `Enter`,
 * `Space`, `Tab` and `Shift + Tab` are the platform's, and every header stays in
 * the page tab sequence — `w3c/aria-practices#3434` removed the roving
 * alternative from the pattern, and Base UI deprecated its own `loopFocus` and
 * `orientation` in the same change. `ArrowDown`, `ArrowUp`, `Home` and `End` are
 * shipped on top of that sequence, because Radix and Ark both ship them and
 * readers have learned them; they move focus and write no `tabindex`.
 *
 * **`requireOpen` marks the header it holds.** The pattern asks an accordion
 * that does not permit a panel to be collapsed to write `aria-disabled="true"`
 * on that header, and the APG's own example is the only surveyed source that
 * ships it.
 *
 * **The items are `collapsible`s, and nothing here selects into them.** The set
 * hands each one its appearance as a value, which is the rule `checkbox-group`
 * set for every group family in the library.
 */
export function Accordion({
  children,
  className,
  defaultValue,
  disabled,
  handle,
  headingLevel,
  indicator,
  loop,
  mount,
  multiple,
  onValueChange,
  ref,
  render,
  requireOpen,
  size,
  style,
  togglePlacement,
  truncate,
  value,
  variant,
  ...nativeProps
}: AccordionProps) {
  const defaults = useAccordionDefaults();

  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const current = value ?? own;

  /**
   * A ref rather than state: the element is read by the effect below and by the
   * handle, and neither renders it. Held in state, attaching it re-rendered the
   * accordion on mount — and with a new context value, every item in it.
   */
  const element = useRef<HTMLElement | null>(null);

  const resolvedDisabled = disabled === true;
  const resolvedHeadingLevel = headingLevel ?? defaults.headingLevel;
  const resolvedIndicator = indicator ?? defaults.indicator;
  const resolvedLoop = loop ?? defaults.loop;
  const resolvedMount = mount ?? defaults.mount;
  const resolvedMultiple = multiple ?? defaults.multiple;
  const resolvedRequireOpen = requireOpen ?? defaults.requireOpen;
  const resolvedSize = size ?? defaults.size;
  const resolvedTogglePlacement = togglePlacement ?? defaults.togglePlacement;
  const resolvedTruncate = truncate ?? defaults.truncate;
  const resolvedVariant = variant ?? defaults.variant;

  const options = { multiple: resolvedMultiple, requireOpen: resolvedRequireOpen };

  /**
   * The arrows move focus and nothing else. The engine writes no `tabindex`,
   * which is the whole difference between it and the roving stop `tabs` uses.
   */
  useEffect(() => {
    const node = element.current;
    if (node === null) return undefined;

    const navigation = createArrowNavigation(node, {
      itemSelector: ACCORDION_TRIGGER_SELECTOR,
      loop: resolvedLoop,
      orientation: () => 'vertical',
    });
    const observer = new MutationObserver(() => navigation.refresh());
    observer.observe(node, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      navigation.destroy();
    };
  }, [resolvedLoop]);

  function commit(next: readonly string[], reason: AccordionSelectionReason, source: unknown) {
    let cancelled = false;
    const state = createControllable<readonly string[]>({
      controlled: value,
      /* Two arrays are never `Object.is`, so a set states its own equality or
         emits a request on every render. */
      equals: sameOpenValues,
      initial: current,
      onRequest: (request) => {
        cancelled = request.cancelled;
        onValueChange?.(request.value, request);
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;
    if (moved) setOwn(next);
  }

  const context: AccordionContextValue = {
    disabled: resolvedDisabled,
    indicator: resolvedIndicator,
    isHeld: (candidate) => isHeldOpen(current, candidate, options),
    isOpen: (candidate) => current.includes(candidate),
    level: resolvedHeadingLevel,
    mount: resolvedMount,
    size: resolvedSize,
    togglePlacement: resolvedTogglePlacement,
    toggle: (candidate, reason, source) => {
      const next = nextOpenValues(current, candidate, options);
      if (next === current) return;
      commit(next, reason, source);
    },
    truncate: resolvedTruncate,
    variant: ITEM_VARIANT[resolvedVariant],
  };

  /**
   * The two Angular Material ships on `mat-accordion`. A controlled consumer
   * owns the array and needs neither; an uncontrolled one has no array to set,
   * which is the case an escape hatch exists for.
   *
   * They arrive on a handle of their own rather than on `ref`, so `ref` keeps
   * reaching the element — which is the library's rule for every other family,
   * and what lets a consumer call the platform's own methods on the set.
   */
  useImperativeHandle(
    handle,
    () => ({
      openAll: () => {
        const values = itemValues(element.current)
          .filter((item) => !item.disabled)
          .map((item) => item.value);
        commit(resolvedMultiple ? values : values.slice(0, 1), 'programmatic', undefined);
      },
      closeAll: () => {
        if (resolvedRequireOpen && current.length > 0) {
          commit(current.slice(0, 1), 'programmatic', undefined);
          return;
        }
        commit([], 'programmatic', undefined);
      },
    }),
    /* `commit` closes over the render it was made in, and the three values below
       are everything it reads. Listing the function itself would rebuild the
       handle on every render and hand the consumer a new object each time. */
    [current, resolvedMultiple, resolvedRequireOpen],
  );

  const rootProps: AccordionRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    ...(resolvedDisabled ? { 'data-disabled': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'accordion',
    'data-variant': resolvedVariant,
    style,
  });

  return (
    <AccordionContext.Provider value={context}>
      {render === undefined ? (
        <div
          {...rootProps}
          ref={(node) => {
            element.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref !== null && ref !== undefined) ref.current = node;
          }}
        />
      ) : (
        render(rootProps)
      )}
    </AccordionContext.Provider>
  );
}
