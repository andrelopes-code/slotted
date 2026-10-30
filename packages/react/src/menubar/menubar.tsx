import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/menubar/menubar.css';

import { createRovingTabindex } from '@slotted/core/focus';
import { createControllable } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { MenubarSurfaceProvider } from '../menu';
import type { MenuEntry, MenuOpenReason, MenubarSurfaceValue } from '../menu';
import { useMenubarDefaults } from './menubar-defaults';
import type { MenubarProps, MenubarRootProps } from './menubar.types';

const TRIGGER_SELECTOR = "[data-part='trigger']";

function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

/**
 * A row of triggers with one tab stop, each opening a `menu`.
 *
 * The bar holds which menu is open and nothing else: every part inside it
 * belongs to the `menu` family and is imported from it. Radix's menubar
 * re-exports the sixteen parts its dropdown menu already has, which is two
 * copies of one machine and one place for a later capability to go missing.
 */
export function Menubar({
  children,
  defaultValue,
  disabled,
  loop,
  onValueChange,
  orientation,
  ref,
  render,
  size,
  typeahead,
  value,
  ...nativeProps
}: MenubarProps) {
  const defaults = useMenubarDefaults();

  const resolvedDisabled = disabled ?? defaults.disabled;
  const resolvedLoop = loop ?? defaults.loop;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedSize = size ?? defaults.size;
  const resolvedTypeahead = typeahead ?? defaults.typeahead;

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const held = value ?? own;

  /** Where focus goes when the bar opens one of its menus. */
  const entry = useRef<MenuEntry>('first');
  const registry = useRef(new Map<string, HTMLElement>());
  const typeaheadHandle = useRef<TypeaheadHandle | null>(null);

  const latest = useRef({ held, node, onValueChange, value });
  latest.current = { held, node, onValueChange, value };

  const move = useCallback((next: string | undefined, reason: MenuOpenReason, source?: unknown) => {
    const state = latest.current;
    if (next === state.held) return;

    let cancelled = false;
    const controllable = createControllable<string>({
      controlled: state.value,
      initial: state.held ?? '',
      onRequest: (request) => {
        cancelled = request.cancelled;
        state.onValueChange?.(request.value, request as never);
      },
    });
    const moved = controllable.request(next ?? '', reason, source);
    if (cancelled) return;
    if (moved) setOwn(next === '' ? undefined : next);
  }, []);

  const triggers = useCallback(
    () => [...(latest.current.node?.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR) ?? [])],
    [],
  );

  const nameOf = useCallback((trigger: HTMLElement | undefined) => {
    if (trigger === undefined) return undefined;
    for (const [name, candidate] of registry.current) if (candidate === trigger) return name;
    return undefined;
  }, []);

  /**
   * The pattern's three-step rule for the inline axis: close what is open, move
   * to the neighbouring trigger, and open its menu. Focus stays on the trigger
   * — the recommended half of the pattern's choice — so the next arrow keeps
   * moving along the bar rather than walking into a list the reader has not
   * asked for.
   */
  const step = useCallback(
    (direction: 1 | -1, options?: { open?: boolean; focus?: boolean }) => {
      const list = triggers();
      if (list.length === 0) return;

      const active = latest.current.node?.ownerDocument.activeElement;
      const open = latest.current.held;
      const from = list.findIndex((trigger) => trigger === active || nameOf(trigger) === open);
      const index = from === -1 ? 0 : from + direction;
      const wrapped = resolvedLoop
        ? (index + list.length) % list.length
        : Math.min(Math.max(index, 0), list.length - 1);

      const next = list[wrapped];
      if (next === undefined) return;
      if (options?.focus !== false) next.focus({ preventScroll: true });
      if (options?.open === true) {
        entry.current = 'trigger';
        move(nameOf(next), 'keyboard');
      }
    },
    [move, nameOf, resolvedLoop, triggers],
  );

  const surface: MenubarSurfaceValue = {
    close: (reason, source) => move(undefined, reason, source),
    disabled: resolvedDisabled,
    entry,
    open: (value, reason, source) => move(value, reason, source),
    orientation: resolvedOrientation,
    register: (value, trigger) => {
      if (trigger === null) registry.current.delete(value);
      else registry.current.set(value, trigger);
    },
    size: resolvedSize,
    step,
    value: held,
  };

  /**
   * One tab stop for the whole bar, and the item the reader last left. Moving
   * along a bar that already has a menu open switches menus under the pointer
   * of the arrows, which is what makes it a bar rather than a row of buttons.
   */
  useEffect(() => {
    if (node === null) return;
    const handle = createRovingTabindex(node, {
      includeAriaDisabled: true,
      itemSelector: TRIGGER_SELECTOR,
      loop: () => resolvedLoop,
      orientation: () => resolvedOrientation,
      onMove: (_index, trigger) => {
        if (latest.current.held === undefined) return;
        entry.current = 'trigger';
        move(nameOf(trigger), 'keyboard');
      },
    });
    return () => handle.destroy();
  }, [move, nameOf, node, resolvedLoop, resolvedOrientation]);

  useEffect(() => {
    if (!resolvedTypeahead) return;
    const handle = createTypeahead();
    typeaheadHandle.current = handle;
    return () => {
      handle.destroy();
      typeaheadHandle.current = null;
    };
  }, [resolvedTypeahead]);

  useImperativeHandle(
    ref,
    () => ({
      close: () => move(undefined, 'programmatic'),
      focus: () => {
        const list = triggers();
        const stop = list.find((trigger) => trigger.tabIndex === 0) ?? list[0];
        stop?.focus({ preventScroll: true });
      },
    }),
    [move, triggers],
  );

  /** The pattern asks for typeahead on a menubar as well as inside a menu. */
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const handle = typeaheadHandle.current;
    if (handle === null || !resolvedTypeahead) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!isPrintable(event.key, handle.query.length > 0)) return;

    const list = triggers();
    const from = list.findIndex((trigger) => trigger === event.target);
    const index = handle.match(
      event.key,
      list.map((trigger) => trigger.textContent?.trim() ?? ''),
      from,
    );
    if (index === -1) return;

    event.preventDefault();
    const trigger = list[index];
    trigger?.focus({ preventScroll: true });
    if (held !== undefined) {
      entry.current = 'trigger';
      move(nameOf(trigger), 'keyboard');
    }
  };

  const rootProps: MenubarRootProps = keyedProps({
    ...nativeProps,
    children: <MenubarSurfaceProvider value={surface}>{children}</MenubarSurfaceProvider>,
    ...(resolvedOrientation === 'vertical' ? { 'aria-orientation': 'vertical' } : {}),
    ...(resolvedDisabled ? { 'aria-disabled': true, 'data-disabled': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'menubar',
    onKeyDown: compose(nativeProps.onKeyDown, onKeyDown),
    role: 'menubar',
  });

  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <div {...rootProps} ref={setNode} />;
}
