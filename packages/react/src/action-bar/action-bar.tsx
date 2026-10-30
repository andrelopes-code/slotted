import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/action-bar/action-bar.css';

import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ButtonDefaultsProvider } from '../button/button-defaults';
import {
  ActionBarOverflowContext,
  PRIORITY_ATTRIBUTE,
  RANK,
  STACK_PROPERTY,
  UNIT_ATTRIBUTE,
} from './action-bar-context';
import type { ActionBarOverflowValue, ActionBarSurfaceUnit } from './action-bar-context';
import { useActionBarDefaults } from './action-bar-defaults';
import type { ActionBarPriority, ActionBarProps, ActionBarRootProps } from './action-bar.types';

const NO_UNITS: readonly ActionBarSurfaceUnit[] = Object.freeze([]);

/**
 * Everything the run lays out.
 *
 * The trigger is not one of them — a control that took part in its own
 * measurement would be counted twice — and neither is an `always` action, which
 * is never in the bar to give way: `createCollapse` reveals every unit it did
 * not collapse, so a permanently hidden one would be shown by the first pass.
 */
function unitsOf(container: HTMLElement) {
  return [...container.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.getAttribute('data-part') !== 'overflow' &&
      child.getAttribute(PRIORITY_ATTRIBUTE) !== 'always',
  );
}

function priorityOf(unit: HTMLElement): ActionBarPriority {
  return (unit.getAttribute(PRIORITY_ATTRIBUTE) as ActionBarPriority | null) ?? 'pinned';
}

/**
 * Whether one of the bar's own rules sits between two units that are both in the
 * surface. It is read from the DOM rather than from the tree because a separator
 * is a sibling of the units it divides and nothing in React relates them.
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
 * What the surface holds: every `always` action and every collapsed one, in the
 * order the bar holds them. The two are read together because a reader opening
 * the menu sees one list, and a list assembled from two sources in two passes is
 * a list that can disagree with itself about order.
 */
function surfaceOf(container: HTMLElement, collapsed: readonly HTMLElement[]) {
  const hidden = new Set(collapsed);
  const held = [...container.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.hasAttribute(UNIT_ATTRIBUTE) &&
      (hidden.has(child) || child.getAttribute(PRIORITY_ATTRIBUTE) === 'always'),
  );

  return held.map((unit, index) => {
    const previous = held[index - 1];
    return {
      id: unit.getAttribute(UNIT_ATTRIBUTE) ?? '',
      separatorBefore: previous !== undefined && ruleBetween(previous, unit),
    };
  });
}

function sameSurface(a: readonly ActionBarSurfaceUnit[], b: readonly ActionBarSurfaceUnit[]) {
  return (
    a.length === b.length &&
    a.every(
      (unit, index) =>
        unit.id === b[index]?.id && unit.separatorBefore === b[index]?.separatorBefore,
    )
  );
}

/**
 * The actions that finish a task on a page or in a panel.
 *
 * **It is not a composite.** `Tab` reaches every action, in the order the author
 * wrote them, and the arrows are not bound. The controls here are the page's own
 * form actions, and a reader walking a form expects to arrive at Cancel and then
 * at Save; roving focus would make the whole bar one tab stop and put Save
 * behind an arrow key that announces nothing. A strip of ten icon buttons is a
 * `toolbar`, and that family binds the arrows against the APG. The cost of the
 * departure is written in the contract.
 *
 * **What gives way is decided by rank, not by position.** `toolbar` refuses a
 * priority in its own contract and is right to: in a bar of tools the first
 * control is the most used, so giving way from the end gives up the least used
 * one. Here the action that confirms is at the **end** of the line, so giving
 * way from the end would give up Save first.
 *
 * **The action that confirms does not move.** The run carries an `auto` margin
 * against the bar's end edge, so a message appearing in the status, a button
 * going busy and a permission filter removing a control all move what is
 * *before* the last action and never the last action itself.
 *
 * **The bar paints itself and the one control it draws.** Every control keeps
 * its own fill, its own states and its own step; a bar out of action is
 * `<fieldset disabled>` around it, which is the platform disabling controls this
 * family does not own.
 */
export function ActionBar({
  align,
  children,
  className,
  onOverflowChange,
  present,
  ref,
  render,
  size,
  sticky,
  style,
  variant,
  ...nativeProps
}: ActionBarProps) {
  const defaults = useActionBarDefaults();
  const element = useRef<HTMLDivElement | null>(null);
  const counterparts = useRef(new Map<string, ReactNode>());
  const collapsed = useRef<readonly HTMLElement[]>([]);
  const collapse = useRef<CollapseHandle | null>(null);
  const [actions, setActions] = useState<HTMLElement | null>(null);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [stacked, setStacked] = useState(false);
  const [surface, setSurface] = useState<readonly ActionBarSurfaceUnit[]>(NO_UNITS);

  const report = useRef(onOverflowChange);
  report.current = onOverflowChange;

  const resolvedAlign = align ?? defaults.align;
  const resolvedSize = size ?? defaults.size;
  const resolvedSticky = sticky ?? defaults.sticky;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedPresent = present ?? true;

  /**
   * The bar is held through its exit, so a bulk bar slides out rather than
   * vanishing. It leaves the DOM when the exit finishes: Carbon keeps its batch
   * bar mounted and writes `aria-hidden` on it instead, which leaves the buttons
   * inside reachable by `Tab` and puts focus in a region the screen reader
   * announces as absent.
   */
  const [status, setStatus] = useState<PresenceStatus>(resolvedPresent ? 'open' : 'unmounted');
  const presence = useRef<ReturnType<typeof createPresence> | null>(null);
  presence.current ??= createPresence({
    onStatusChange: setStatus,
    present: resolvedPresent,
    skipInitialAnimation: true,
  });

  useEffect(() => {
    presence.current?.sync(resolvedPresent);
  }, [resolvedPresent]);

  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => {
    const handle = presence.current;
    return () => handle?.stop();
  }, []);

  const registerActions = useCallback((node: HTMLElement | null) => setActions(node), []);
  const registerTrigger = useCallback((node: HTMLElement | null) => setTrigger(node), []);

  const overflowValue: ActionBarOverflowValue = useMemo(
    () => ({
      counterpart: (id) => counterparts.current.get(id) ?? null,
      /* Written during render, and idempotent: the map is keyed by an
         identifier the action owns, so a second render of the same action
         replaces its own entry and touches nothing else. */
      declare: (id, node) => {
        counterparts.current.set(id, node);
      },
      registerActions,
      registerTrigger,
      release: (id) => {
        counterparts.current.delete(id);
      },
      surface,
    }),
    [registerActions, registerTrigger, surface],
  );

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      presence.current?.setNode(node);
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
      return undefined;
    },
    [ref],
  );

  /**
   * Whether the bar is drawn as a column. The number lives in the stylesheet's
   * container query, and this asks CSS what it decided rather than comparing
   * widths against a copy of it: two places holding one breakpoint is two places
   * that can disagree.
   */
  useEffect(() => {
    const container = actions;
    if (container === null) return undefined;

    const read = () => {
      const view = container.ownerDocument?.defaultView;
      const raised =
        view?.getComputedStyle(container).getPropertyValue(STACK_PROPERTY).trim() === '1';
      setStacked((was) => (was === raised ? was : raised));
    };

    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(container);
    return () => observer.disconnect();
  }, [actions]);

  /**
   * The collapse. It does not run while the bar is a column: a column has room
   * for every action, and a surface holding what did not fit would be a menu for
   * nothing. Leaving the effect destroys the handle, which reveals every unit it
   * had hidden.
   */
  useEffect(() => {
    const container = actions;
    if (container === null || stacked) return undefined;

    const sync = () => {
      const next = surfaceOf(container, collapsed.current);
      setSurface((held) => (sameSurface(held, next) ? held : next));
    };

    const handle = createCollapse(container, {
      /* A pinned action has nowhere to go. Every other rank does, and `hide`'s
         somewhere is nowhere — it gives way and is not offered in the surface. */
      collapsible: (unit) => priorityOf(unit) !== 'pinned',
      divides: (unit) => unit.getAttribute('data-part') === 'separator',
      onChange: (units) => {
        collapsed.current = units;
        sync();
        report.current?.(units.filter((unit) => unit.hasAttribute(UNIT_ATTRIBUTE)).length);
      },
      rank: (unit) => RANK[priorityOf(unit)],
      trigger: () => trigger,
      /* An `always` action is in the surface while every other one still fits,
         and a control that hid itself then would be a menu nobody can open. */
      triggerAlways: () => container.querySelector(`[${PRIORITY_ATTRIBUTE}='always']`) !== null,
      units: () => unitsOf(container),
    });

    collapse.current = handle;
    sync();

    /**
     * An action arriving or leaving invalidates the measurement — a bar that
     * grows a button collapses one — and an `always` action arriving changes
     * what the surface holds without changing what collapsed.
     */
    const observer = new MutationObserver(() => {
      handle.refresh();
      sync();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      handle.destroy();
      collapse.current = null;
      collapsed.current = [];
      setSurface(NO_UNITS);
    };
  }, [actions, stacked, trigger]);

  if (status === 'unmounted') return null;

  const hidden = collapsed.current.length;
  const rootProps: ActionBarRootProps = keyedProps({
    role: 'group',
    ...nativeProps,
    children: <ButtonDefaultsProvider size={resolvedSize}>{children}</ButtonDefaultsProvider>,
    className,
    'data-align': resolvedAlign,
    ...(trigger === null ? {} : { 'data-collapsed': String(hidden) }),
    'data-part': 'root',
    'data-size': resolvedSize,
    ...(status === 'open' ? {} : { 'data-status': status }),
    ...(resolvedSticky ? { 'data-sticky': '' as const } : {}),
    'data-ui': 'action-bar',
    'data-variant': resolvedVariant,
    style,
  });

  return (
    <ActionBarOverflowContext.Provider value={overflowValue}>
      {render === undefined ? (
        <div {...rootProps} ref={attach} />
      ) : (
        render({ ...rootProps, ref: attach } as ActionBarRootProps)
      )}
    </ActionBarOverflowContext.Provider>
  );
}
