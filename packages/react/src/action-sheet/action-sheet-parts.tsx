import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  ComponentPropsWithRef,
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  Ref,
} from 'react';

import { DrawerDescription, DrawerPanel, DrawerTitle, DrawerTrigger, useDrawer } from '../drawer';
import type { DrawerPanelRootProps, DrawerTriggerRootProps } from '../drawer';
import { useActionSheet } from './action-sheet';
import { entryTarget, items, ITEM_SELECTOR } from './action-sheet-entry';
import type {
  ActionSheetCancelProps,
  ActionSheetCancelRootProps,
  ActionSheetContentProps,
  ActionSheetContentRootProps,
  ActionSheetGroupLabelProps,
  ActionSheetGroupProps,
  ActionSheetHeaderProps,
  ActionSheetItemProps,
  ActionSheetItemRootProps,
  ActionSheetListProps,
  ActionSheetMessageProps,
  ActionSheetMessageRootProps,
  ActionSheetSelectEvent,
  ActionSheetSeparatorProps,
  ActionSheetTitleProps,
  ActionSheetTitleRootProps,
  ActionSheetTriggerProps,
  ActionSheetTriggerRootProps,
} from './action-sheet.types';
import { SPINNER_RING } from '../button/spinner-ring';

export { entryTarget };

/** Two refs on one element: the family's, and whatever the consumer passed. */
function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The family's handler runs after the consumer's, and only if the consumer has
 * not called `preventDefault` — the rule every family in this library composes by.
 */
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
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It tells `Enter` and `Space` from a press without a key listener
 * for something the platform already handles.
 */
function activationReason(event: MouseEvent): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** What typeahead matches on: what the item says it is, or its label. */
const textOf = (item: HTMLElement) =>
  item.dataset['textValue'] ??
  item.querySelector("[data-part='label']")?.textContent?.trim() ??
  item.textContent?.trim() ??
  '';

/**
 * The control that opens the sheet: `drawer`'s trigger, which is also the
 * layer's branch — a press on it counts as inside the layer, or opening would
 * be read as an outside press and close what it had just opened.
 */
export function ActionSheetTrigger({ render, ...nativeProps }: ActionSheetTriggerProps) {
  return (
    <DrawerTrigger
      {...nativeProps}
      {...(render === undefined
        ? {}
        : {
            render: (props: DrawerTriggerRootProps) =>
              render(props as unknown as ActionSheetTriggerRootProps),
          })}
    />
  );
}

/**
 * The family's measure, handed to `drawer`'s sheet. The stylesheet reads the
 * same token on the family's root, so the panel and the root are one width.
 */
const MEASURE = {
  '--slotted-drawer-sheet-inline-size': 'var(--slotted-action-sheet-inline-size, 32rem)',
} as CSSProperties;

/**
 * `drawer`'s panel, with the family's root inside it. `render` substitutes
 * the panel, which is the element with the role.
 *
 * The panel takes focus when the pointer leaves an item, so one row is never
 * left lit under a pointer that has moved on; that is what `tabIndex={-1}` is
 * for, and `Tab` never lands on it.
 */
export function ActionSheetContent({
  children,
  ref,
  render,
  style,
  ...nativeProps
}: ActionSheetContentProps) {
  const sheet = useActionSheet();

  return (
    <DrawerPanel
      {...nativeProps}
      ref={(node: HTMLDivElement | null) => {
        sheet.nodes.panel = node;
        attach(node, ref);
      }}
      style={{ ...MEASURE, ...style }}
      tabIndex={-1}
      {...(render === undefined
        ? {}
        : {
            render: (props: DrawerPanelRootProps) =>
              render(props as unknown as ActionSheetContentRootProps),
          })}
    >
      <div data-part="root" data-part-root="" data-ui="action-sheet" data-ui-action-sheet="">
        {children}
      </div>
    </DrawerPanel>
  );
}

export function ActionSheetHeader(props: ActionSheetHeaderProps) {
  return <header data-part="header" data-part-header="" {...props} />;
}

/**
 * The name of the dialog and of the list: `drawer`'s title, so the panel is
 * named by it, with the family's own element.
 */
export function ActionSheetTitle({ ref, render, ...nativeProps }: ActionSheetTitleProps) {
  return (
    <DrawerTitle
      {...nativeProps}
      render={(props) => {
        const root = {
          ...props,
          ref: (node: HTMLElement | null) => attach(node as HTMLHeadingElement | null, ref),
        } as ActionSheetTitleRootProps;
        return render === undefined ? <h2 {...(root as ActionSheetTitleProps)} /> : render(root);
      }}
    />
  );
}

/**
 * The dialog's description: `drawer`'s, so the panel is described by it, and
 * `message` in this family's words — `description` is the second line of an
 * item here, as it is in `menu`.
 */
export function ActionSheetMessage({ ref, render, ...nativeProps }: ActionSheetMessageProps) {
  return (
    <DrawerDescription
      {...nativeProps}
      render={(props) => {
        const root = keyedProps({
          ...props,
          'data-part': 'message',
          ref: (node: HTMLElement | null) => attach(node as HTMLParagraphElement | null, ref),
        }) as ActionSheetMessageRootProps;
        return render === undefined ? <p {...(root as ActionSheetMessageProps)} /> : render(root);
      }}
    />
  );
}

/**
 * The menu: one tab stop for every action, the arrows, `Home`, `End` and
 * typeahead. It is fixed as a `div` with `role="menu"`, because the role and
 * the keyboard are what it is.
 */
export function ActionSheetList({ onFocus, onKeyDown, ref, ...nativeProps }: ActionSheetListProps) {
  const sheet = useActionSheet();
  const { titleId } = useDrawer();
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const roving = useRef<RovingTabindexHandle | null>(null);
  const typeahead = useRef<TypeaheadHandle | null>(null);

  useEffect(() => {
    if (list === null) return;
    const handle = createRovingTabindex(list, {
      includeAriaDisabled: true,
      itemSelector: ITEM_SELECTOR,
      orientation: () => 'vertical',
    });
    roving.current = handle;
    const search = createTypeahead();
    typeahead.current = search;
    return () => {
      handle.destroy();
      search.destroy();
      roving.current = null;
      typeahead.current = null;
    };
  }, [list]);

  /* An item added, removed or disabled moves the stop; the list re-reads its
     items on every render rather than guessing which change mattered. */
  useEffect(() => {
    roving.current?.refresh();
  });

  const labelled = titleId !== '' && nativeProps['aria-label'] === undefined;

  return (
    <div
      aria-orientation="vertical"
      {...(labelled ? { 'aria-labelledby': titleId } : {})}
      {...withSelectorKey(nativeProps, 'part', 'list')}

      onFocus={compose(onFocus, (event) => {
        /* Focus that arrived by the pointer or by entry moves the stop with
           it, so `Tab` out and back returns to the same item. */
        const index = items(list).indexOf(event.target as HTMLElement);
        if (index !== -1) roving.current?.setActive(index);
      })}
      onKeyDown={compose(onKeyDown, (event: KeyboardEvent<HTMLDivElement>) => {
        const search = typeahead.current;
        if (search === null || event.ctrlKey || event.metaKey || event.altKey) return;
        if (!isPrintable(event.key, search.query.length > 0)) return;
        event.preventDefault();
        const all = items(list);
        const from = all.indexOf(event.target as HTMLElement);
        const index = search.match(event.key, all.map(textOf), from);
        all[index]?.focus();
      })}
      ref={(node) => {
        setList(node);
        sheet.nodes.list = node;
        attach(node, ref);
      }}
      role="menu"
    />
  );
}

export function ActionSheetGroupLabel(props: ActionSheetGroupLabelProps) {
  return <div data-part="group-label" data-part-group-label="" {...props} />;
}

/** A run of related actions, named by its label when it has one. */
export function ActionSheetGroup({ children, label, ...nativeProps }: ActionSheetGroupProps) {
  const labelId = `${useId()}label`;
  return (
    <div
      {...(label === undefined ? {} : { 'aria-labelledby': labelId })}
      {...withSelectorKey(nativeProps, 'part', 'group')}

      role="group"
    >
      {label === undefined ? null : (
        <ActionSheetGroupLabel id={labelId}>{label}</ActionSheetGroupLabel>
      )}
      {children}
    </div>
  );
}

export function ActionSheetSeparator(props: ActionSheetSeparatorProps) {
  return <hr data-part="separator" data-part-separator="" role="separator" {...props} />;
}

/**
 * One action. A native `button` with `role="menuitem"`, as in `menu`: the
 * platform gives the press, `Enter` and `Space`, and the role makes it an item
 * of the list. A disabled or loading item keeps its tab index and takes
 * `aria-disabled`, because the pattern keeps disabled items in the ring.
 */
export function ActionSheetItem({
  children,
  closeOnSelect,
  description,
  disabled,
  icon,
  loading,
  onClick,
  onPointerLeave,
  onPointerMove,
  onSelect,
  ref,
  render,
  textValue,
  tone,
  value,
  ...nativeProps
}: ActionSheetItemProps) {
  const sheet = useActionSheet();
  const descriptionId = `${useId()}description`;
  const inert = disabled === true || loading === true;

  const select = (reason: 'pointer' | 'keyboard', source: Event) => {
    if (inert) return;
    let prevented = false;
    const event: ActionSheetSelectEvent = {
      reason,
      source,
      value,
      get defaultPrevented() {
        return prevented;
      },
      preventDefault: () => {
        prevented = true;
      },
    };
    onSelect?.(event);
    if (prevented) return;
    if (closeOnSelect ?? sheet.closeOnSelect) sheet.close('select', value, source);
  };

  const rootProps: ActionSheetItemRootProps = keyedProps({
    ...(nativeProps as Omit<typeof nativeProps, 'type'>),
    type: 'button',
    children: (
      <>
        {icon === undefined && loading !== true ? null : (
          <span aria-hidden="true" data-part="icon" data-part-icon="">
            {loading === true ? (
              <span data-ui="spinner" data-ui-spinner="">
                {SPINNER_RING}
              </span>
            ) : (
              icon
            )}
          </span>
        )}
        <span data-part="label" data-part-label="">
          {children}
        </span>
        {description === undefined ? null : (
          <span data-part="description" data-part-description="" id={descriptionId}>
            {description}
          </span>
        )}
      </>
    ),
    ...(description === undefined ? {} : { 'aria-describedby': descriptionId }),
    ...(inert ? { 'aria-disabled': true } : {}),
    ...(loading === true ? { 'aria-busy': true, 'data-loading': '' } : {}),
    ...(disabled === true ? { 'data-disabled': '' } : {}),
    ...(textValue === undefined ? {} : { 'data-text-value': textValue }),
    ...(tone === undefined ? {} : { 'data-tone': tone }),
    ...(value === undefined ? {} : { 'data-value': value }),
    'data-part': 'item',
    onClick: compose(onClick, (event: MouseEvent<HTMLButtonElement>) =>
      select(activationReason(event), event.nativeEvent),
    ) as ActionSheetItemRootProps['onClick'],
    /**
     * A mouse or a pen over an item focuses it, so exactly one row is lit
     * whichever device is driving. A finger does not: focus moving under a
     * touch that is about to scroll the list would light rows at random.
     */
    onPointerMove: compose(onPointerMove, (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'touch') return;
      const item = event.currentTarget;
      if (item.ownerDocument.activeElement !== item) item.focus({ preventScroll: true });
    }) as ActionSheetItemRootProps['onPointerMove'],
    onPointerLeave: compose(onPointerLeave, (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'touch') return;
      const item = event.currentTarget;
      if (item.ownerDocument.activeElement === item)
        sheet.nodes.panel?.focus({ preventScroll: true });
    }) as ActionSheetItemRootProps['onPointerLeave'],
    ref: (node: HTMLElement | null) => attach(node as HTMLButtonElement | null, ref),
    role: 'menuitem',
    tabIndex: -1,
  });

  if (render !== undefined) return render(rootProps);
  return <button {...(rootProps as unknown as ComponentPropsWithRef<'button'>)} />;
}

/**
 * The footer and the explicit way out. Never disabled: a sheet that cannot be
 * left is a trap, which is also Ionic's reading.
 */
export function ActionSheetCancel({
  children,
  onClick,
  ref,
  render,
  ...nativeProps
}: ActionSheetCancelProps) {
  const sheet = useActionSheet();

  const rootProps: ActionSheetCancelRootProps = keyedProps({
    ...nativeProps,
    children: children ?? sheet.t('cancel'),
    'data-part': 'cancel',
    onClick: compose(onClick, (event: MouseEvent<HTMLButtonElement>) =>
      sheet.close('dismiss', undefined, event.nativeEvent),
    ) as ActionSheetCancelRootProps['onClick'],
    ref: (node: HTMLElement | null) => attach(node as HTMLButtonElement | null, ref),
    type: 'button',
  });

  return (
    <div data-part="footer" data-part-footer="">
      {render === undefined ? (
        <button {...(rootProps as ActionSheetCancelProps)} disabled={false} />
      ) : (
        render(rootProps)
      )}
    </div>
  );
}
