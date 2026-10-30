import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/collapsible/collapsible.css';

import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useId, useRef, useState } from 'react';

import { useAccordion } from '../accordion';
import { useCollapsibleDefaults } from './collapsible-defaults';
import type {
  CollapsibleContextValue,
  CollapsibleOpenReason,
  CollapsibleProps,
  CollapsibleRootProps,
} from './collapsible.types';

/** The trigger of one disclosure, in the order the DOM holds them. */
export const COLLAPSIBLE_TRIGGER_SELECTOR = '[data-part="trigger"]';

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);

/**
 * What the disclosure around this part says. A trigger outside one has no panel
 * to control and no state to report, so this throws rather than rendering a
 * button that looks right and does nothing.
 */
export function useCollapsible(): CollapsibleContextValue {
  const context = useContext(CollapsibleContext);
  if (context === undefined) {
    throw new Error(
      'CollapsibleHeader, CollapsibleTrigger, CollapsibleActions and CollapsiblePanel must be rendered inside Collapsible.',
    );
  }
  return context;
}

/**
 * One disclosure: a header the reader operates and a panel it controls.
 *
 * **The keyboard is the platform's.** The trigger is a `button`, so `Enter` and
 * `Space` toggle without the family binding a key, and every trigger stays in
 * the page tab sequence — which is what the APG's accordion pattern requires
 * and what `w3c/aria-practices#3434` removed the roving alternative for.
 *
 * **The panel opens without being measured.** The stylesheet transitions a grid
 * track between `0fr` and `1fr`, so the height is the content's own at every
 * frame. Radix, Base UI, Ark and Angular Material each read the layout and
 * write a custom property, which is wrong for one frame on the server and stale
 * until a resize observer fires.
 *
 * **Inside an `Accordion` the value belongs to the group.** The disclosure then
 * reports its own request as well, so a consumer may watch one panel without
 * unpacking the group's array.
 */
export function Collapsible({
  children,
  className,
  defaultOpen,
  disabled,
  indicator,
  level,
  loading,
  mount,
  onOpenChange,
  open,
  region,
  ref,
  render,
  size,
  style,
  togglePlacement,
  truncate,
  value,
  variant,
  ...nativeProps
}: CollapsibleProps) {
  const defaults = useCollapsibleDefaults();
  const group = useAccordion();
  const baseId = useId();
  const generated = `${baseId}item`;
  const identity = value ?? generated;

  const [own, setOwn] = useState<boolean>(defaultOpen ?? false);

  /**
   * Three owners, in one order. The group's value wins over the disclosure's
   * own state because the group is what a consumer set when they wrote an
   * accordion; a controlled `open` still wins over both, because an explicit
   * consumer value always does.
   */
  const grouped = group?.isOpen(identity);
  const current = open ?? grouped ?? own;

  const resolvedDisabled = (disabled ?? group?.disabled) === true;
  const resolvedIndicator = indicator ?? group?.indicator ?? defaults.indicator;
  const resolvedLevel = level ?? group?.level ?? defaults.level;
  const resolvedMount = mount ?? group?.mount ?? defaults.mount;
  const resolvedSize = size ?? group?.size ?? defaults.size;
  const resolvedTogglePlacement =
    togglePlacement ?? group?.togglePlacement ?? defaults.togglePlacement;
  const resolvedTruncate = (truncate ?? group?.truncate ?? defaults.truncate) === true;
  const resolvedVariant = variant ?? group?.variant ?? defaults.variant;

  /** Whether this panel has ever been open, which is what `lazy` reads. */
  const seen = useRef(current);
  if (current) seen.current = true;

  function toggle(next: boolean, reason: CollapsibleOpenReason, source: unknown) {
    if (next === current) return;

    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: open ?? grouped,
      initial: current,
      onRequest: (request) => {
        cancelled = request.cancelled;
        onOpenChange?.(request.value, request);
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;

    /**
     * The group is asked after this disclosure's own consumer has had the
     * chance to refuse. It owns the array, so it decides what `multiple` and
     * `requireOpen` make of the request; nothing here removes a value from it.
     */
    if (group !== undefined) {
      group.toggle(identity, reason, source);
      return;
    }
    if (moved) setOwn(next);
  }

  const context: CollapsibleContextValue = {
    disabled: resolvedDisabled,
    held: group?.isHeld(identity) ?? false,
    ids: { panelId: `${baseId}panel`, triggerId: `${baseId}trigger` },
    indicator: resolvedIndicator,
    level: resolvedLevel,
    loading: loading === true,
    mount: resolvedMount,
    open: current,
    region: region === true,
    seen: seen.current,
    toggle,
  };

  const rootProps: CollapsibleRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    ...(resolvedDisabled ? { 'data-disabled': '' } : {}),
    'data-indicator': resolvedIndicator,
    ...(loading === true ? { 'data-loading': '' } : {}),
    'data-mount': resolvedMount,
    ...(current ? { 'data-open': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-toggle-placement': resolvedTogglePlacement,
    ...(resolvedTruncate ? { 'data-truncate': '' } : {}),
    'data-ui': 'collapsible',
    'data-value': identity,
    'data-variant': resolvedVariant,
    style,
  });

  return (
    <CollapsibleContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps)}
    </CollapsibleContext.Provider>
  );
}
