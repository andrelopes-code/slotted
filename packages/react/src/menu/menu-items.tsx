import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { keysMessages } from '@slotted/core/i18n';
import type { KbdPlatform, KeysTranslator } from '@slotted/core/keys';
import { canonicalKey, parseShortcut, resolveShortcut } from '@slotted/core/keys';
import { createControllable } from '@slotted/core/state';
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { useResolvedPlatform } from '../kbd/kbd-defaults';
import { useMenu, useMenuSurface } from './menu';
import type {
  MenuCheckboxItemProps,
  PartRef,
  MenuEmptyProps,
  MenuGroupLabelProps,
  MenuGroupProps,
  MenuHeaderProps,
  MenuItemDescriptionProps,
  MenuItemIconProps,
  MenuItemLabelProps,
  MenuItemMetaProps,
  MenuItemProps,
  MenuItemRootProps,
  MenuItemShortcutProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSelectEvent,
  MenuSeparatorProps,
  MenuValueReason,
} from './menu.types';

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
 * What ARIA calls each modifier. The attribute's grammar is the platform's own
 * key names joined by `+`, which is not what a reader sees: `⌘K` is drawn and
 * `Meta+K` is announced.
 */
const ARIA_MODIFIERS: Record<string, string> = {
  alt: 'Alt',
  ctrl: 'Control',
  meta: 'Meta',
  shift: 'Shift',
};

/**
 * The shortcut as `aria-keyshortcuts` states it, or nothing.
 *
 * A sequence — `g` then `i` — has no syntax in the attribute, whose separator
 * means *or* rather than *then*. Announcing `G I` would tell a reader that
 * either key runs the command, so a sequence is left unannounced and is printed
 * only. None of the five surveyed implementations writes the attribute at all.
 */
function announce(keys: string, platform: KbdPlatform): string | undefined {
  const steps = parseShortcut(keys);
  if (steps.length !== 1) return undefined;

  return steps[0]
    ?.map((token) => {
      const canonical = canonicalKey(token);
      if (canonical === 'mod') return platform === 'mac' ? 'Meta' : 'Control';
      if (canonical !== undefined && canonical in ARIA_MODIFIERS) {
        return ARIA_MODIFIERS[canonical] as string;
      }
      const word = canonical ?? token;
      return word.length === 1 ? word.toUpperCase() : `${word[0]?.toUpperCase()}${word.slice(1)}`;
    })
    .join('+');
}

/** The legends a reader sees, in the order the platform writes them, in the language in force. */
function legends(keys: string, platform: KbdPlatform, t: KeysTranslator): string {
  const shortcut = resolveShortcut(keys, { platform, t });
  return shortcut.steps
    .map((step) => step.map((key) => key.legend).join(shortcut.separator))
    .join(` ${shortcut.thenLabel} `);
}

/** The mark in the item's first column: a glyph, or the consumer's own node. */
export function MenuItemIcon({ children, ...nativeProps }: MenuItemIconProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'icon')}>{children}</span>;
}

/** The prefix of the ids an item's label and description take, so the item can point at them. */
const MenuItemPartsContext = createContext<string | null>(null);

export function MenuItemLabel({ children, ...nativeProps }: MenuItemLabelProps) {
  const ids = useContext(MenuItemPartsContext);
  const props = { ...(ids === null ? {} : { id: `${ids}label` }), ...nativeProps };

  return <span {...withSelectorKey(props, 'part', 'label')}>{children}</span>;
}

export function MenuItemDescription({ children, ...nativeProps }: MenuItemDescriptionProps) {
  const ids = useContext(MenuItemPartsContext);
  const props = { ...(ids === null ? {} : { id: `${ids}description` }), ...nativeProps };

  return <span {...withSelectorKey(props, 'part', 'description')}>{children}</span>;
}

/** What the item holds or counts, in its own column before the shortcut. */
export function MenuItemMeta({ children, ...nativeProps }: MenuItemMetaProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'meta')}>{children}</span>;
}

/**
 * The binding printed at the end of the item.
 *
 * Every surveyed implementation prints whatever string the consumer wrote, on
 * every operating system. Here the notation is the library's own — `Mod+K` —
 * and the legends are the platform's: `⌘K` on a Mac and `Ctrl+K` elsewhere,
 * decided by the same provider `kbd` reads, so an application states its
 * audience once.
 */
export function MenuItemShortcut({ children, keys, ...nativeProps }: MenuItemShortcutProps) {
  const platform = useResolvedPlatform(undefined);
  const t = useMessages(keysMessages);
  return (
    <span
      {...nativeProps}
      /* Drawn for the eye and hidden from the reader who cannot see it: the
         binding reaches them through `aria-keyshortcuts` on the item, and an
         item named "Duplicate ⌘D" is a name with a legend stuck to it. */
      {...withSelectorKey(keys === undefined ? {} : { 'aria-hidden': true }, 'part', 'shortcut')}
    >
      {keys === undefined ? children : legends(keys, platform, t)}
    </span>
  );
}

interface ItemOptions extends MenuItemProps {
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | undefined;
  checked?: boolean | undefined;
  /** The mark's own cell, drawn by the family rather than by the consumer. */
  indicator?: ReactNode;
  /** Runs before the consumer hears about it, and whatever closing decides. */
  commit?: (reason: MenuValueReason, source: Event | undefined) => void;
  /** What this kind of item does when nothing says otherwise. */
  closesByDefault?: boolean;
}

/**
 * One command.
 *
 * A native `button` carrying `role="menuitem"`: the platform gives the press,
 * the `Enter` and `Space` handling and the pointer semantics, and the role
 * replaces `button` so a reader hears an item rather than a control. Base UI
 * and Ark render a `div` and reimplement all three.
 *
 * A disabled item keeps `tabindex` and takes `aria-disabled`, because the
 * pattern asks that disabled items stay focusable and the native attribute
 * would take them out of the ring the arrows walk.
 */
function Item({
  checked,
  children,
  closeOnSelect,
  closesByDefault,
  commit,
  description,
  disabled,
  icon,
  indicator,
  meta,
  onSelect,
  ref,
  render,
  role = 'menuitem',
  shortcut,
  textValue,
  tone,
  ...nativeProps
}: ItemOptions) {
  const menu = useMenu();
  const surface = useMenuSurface();
  const platform = useResolvedPlatform(undefined);
  const ids = useId();
  /* An item written from its parts holds its own label; one written from props
     has its children wrapped in one. */
  const parts = Children.toArray(children).flatMap((child) =>
    isValidElement(child) ? [child.type] : [],
  );
  const written = parts.includes(MenuItemLabel);
  /* The label names the item alone, or the line under it would be read twice:
     once in the name, once as the description. */
  const described = description !== undefined || parts.includes(MenuItemDescription);
  const named =
    nativeProps['aria-label'] !== undefined || nativeProps['aria-labelledby'] !== undefined;

  const select = (reason: MenuValueReason, source: Event | undefined) => {
    if (disabled === true) return;

    commit?.(reason, source);

    let prevented = false;
    const event: MenuSelectEvent = {
      reason,
      source,
      get defaultPrevented() {
        return prevented;
      },
      preventDefault: () => {
        prevented = true;
      },
    };
    onSelect?.(event);
    if (prevented) return;

    if (closeOnSelect ?? closesByDefault ?? menu.closeOnSelect) {
      surface?.closeAll('select', source);
    }
  };

  const onClick = (event: MouseEvent<HTMLElement>) => {
    /* A click a keyboard produced carries no pointer coordinates, which is how
       `Enter` on a button is told from a press without listening for both. */
    select(event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    /**
     * The pattern's optional rule, taken: `Space` on a checkbox or radio item
     * changes the state without closing the menu, so a reader can turn three
     * things on without opening the menu three times. `Enter` runs the item as
     * a command does.
     */
    if (event.key === ' ' && role !== 'menuitem') {
      event.preventDefault();
      if (disabled === true) return;
      commit?.('keyboard', event.nativeEvent);
      onSelect?.({
        reason: 'keyboard',
        source: event.nativeEvent,
        defaultPrevented: true,
        preventDefault: () => undefined,
      });
    }
  };

  /**
   * The pointer moving over an item focuses it, which is what keeps exactly one
   * item highlighted whichever device is driving — and what lets the stylesheet
   * paint the highlight on `:focus` instead of splitting it in two.
   */
  const onPointerMove = (event: { currentTarget: HTMLElement }) => {
    const item = event.currentTarget;
    if (item.ownerDocument.activeElement === item) return;
    item.focus({ preventScroll: true });
  };

  const onPointerLeave = (event: { currentTarget: HTMLElement }) => {
    const item = event.currentTarget;
    if (item.ownerDocument.activeElement !== item) return;
    /* Focus goes back to the surface rather than out of the layer: an item that
       kept focus after the pointer left it would leave two items highlighted
       the moment the reader pressed an arrow. */
    if (surface?.openItem === item) return;
    surface?.node?.focus({ preventScroll: true });
  };

  /* `type` is the family's own button's: the element `render` returns is the
     consumer's, and on the anchor a link item renders it would be a MIME type. */
  const rootProps: MenuItemRootProps = keyedProps({
    ...nativeProps,
    children: (
      <MenuItemPartsContext.Provider value={ids}>
        {indicator}
        {icon === undefined ? null : <MenuItemIcon>{icon}</MenuItemIcon>}
        {written ? children : <MenuItemLabel>{children}</MenuItemLabel>}
        {description === undefined ? null : (
          <MenuItemDescription>{description}</MenuItemDescription>
        )}
        {meta === undefined ? null : <MenuItemMeta>{meta}</MenuItemMeta>}
        {shortcut === undefined ? null : <MenuItemShortcut keys={shortcut} />}
      </MenuItemPartsContext.Provider>
    ),
    ...(checked === undefined ? {} : { 'aria-checked': checked }),
    ...(described ? { 'aria-describedby': `${ids}description` } : {}),
    ...(described && !named ? { 'aria-labelledby': `${ids}label` } : {}),
    ...(checked ? { 'data-checked': '' } : {}),
    ...(disabled === true ? { 'aria-disabled': true, 'data-disabled': '' } : {}),
    ...(shortcut === undefined ? {} : { 'aria-keyshortcuts': announce(shortcut, platform) }),
    ...(textValue === undefined ? {} : { 'data-text-value': textValue }),
    ...(tone === undefined ? {} : { 'data-tone': tone }),
    'data-part': 'item',
    onClick: compose(nativeProps.onClick, onClick),
    onKeyDown: compose(nativeProps.onKeyDown, onKeyDown),
    onPointerLeave: compose(nativeProps.onPointerLeave, onPointerLeave),
    onPointerMove: compose(nativeProps.onPointerMove, onPointerMove),
    role,
    tabIndex: -1,
  });

  /* The consumer's ref is the element's own; `render` receives the callback
     shape every part hands out, so a consumer's component can take it. */
  const attach: PartRef = (node) => {
    if (typeof ref === 'function') ref(node as HTMLButtonElement | null);
    else if (ref !== null && ref !== undefined) ref.current = node as HTMLButtonElement | null;
  };

  if (render !== undefined) return render({ ...rootProps, ref: attach });
  return <button type="button" {...rootProps} ref={ref} />;
}

export function MenuItem(props: MenuItemProps) {
  return <Item {...props} />;
}

/**
 * An item that carries a state of its own.
 *
 * It does not close the menu by default, and neither does a radio item: a
 * reader turning three things on in a View menu would otherwise open it three
 * times. Base UI made the same choice for the same reason, and the pattern
 * describes `Space` as changing the state without closing.
 */
export function MenuCheckboxItem({
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: MenuCheckboxItemProps) {
  const [own, setOwn] = useState<boolean>(defaultChecked ?? false);
  const held = checked ?? own;

  const commit = (reason: MenuValueReason, source: Event | undefined) => {
    const controllable = createControllable<boolean>({
      controlled: checked,
      initial: held,
      onRequest: (request) => onCheckedChange?.(request.value, request as never),
    });
    if (controllable.request(!held, reason, source)) setOwn(!held);
  };

  return (
    <Item
      {...props}
      checked={held}
      closesByDefault={false}
      commit={commit}
      indicator={<MenuIndicator glyph="check" />}
      role="menuitemcheckbox"
    />
  );
}

/**
 * The mark's box, which exists whether or not the mark is drawn: a check for a
 * checkbox item, a dot for a radio item. The stylesheet shows it while the
 * item is checked.
 */
function MenuIndicator({ glyph }: { glyph: GlyphName }) {
  return (
    <span data-part="indicator" data-part-indicator="">
      <Icon>
        <Glyph name={glyph} />
      </Icon>
    </span>
  );
}

interface RadioGroupValue {
  value: string | undefined;
  select: (value: string, reason: MenuValueReason, source: Event | undefined) => void;
}

const MenuRadioContext = createContext<RadioGroupValue | null>(null);

/** One value, chosen among the items inside it. */
export function MenuRadioGroup({
  children,
  defaultValue,
  onValueChange,
  value,
  ...nativeProps
}: MenuRadioGroupProps) {
  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const held = value ?? own;

  const select = useCallback(
    (next: string, reason: MenuValueReason, source: Event | undefined) => {
      const controllable = createControllable<string>({
        controlled: value,
        initial: held ?? '',
        onRequest: (request) => onValueChange?.(request.value, request as never),
      });
      if (controllable.request(next, reason, source)) setOwn(next);
    },
    [held, onValueChange, value],
  );

  return (
    <div {...withSelectorKey(nativeProps, 'part', 'group')} role="group">
      <MenuRadioContext.Provider value={{ select, value: held }}>
        {children}
      </MenuRadioContext.Provider>
    </div>
  );
}

export function MenuRadioItem({ value, ...props }: MenuRadioItemProps) {
  const group = useContext(MenuRadioContext);
  if (group === null) throw new Error('MenuRadioItem has to be inside a MenuRadioGroup.');

  return (
    <Item
      {...props}
      checked={group.value === value}
      closesByDefault={false}
      commit={(reason, source) => group.select(value, reason, source)}
      indicator={<MenuIndicator glyph="dot" />}
      role="menuitemradio"
    />
  );
}

/**
 * A set of items with a name. The label is inside the group and named by it,
 * because a heading outside one belongs to nothing a reader can hear.
 */
export function MenuGroup({ children, label, ...nativeProps }: MenuGroupProps) {
  const id = `${useId()}group`;

  return (
    <div
      {...nativeProps}
      {...withSelectorKey(label === undefined ? {} : { 'aria-labelledby': id }, 'part', 'group')}

      role="group"
    >
      {label === undefined ? null : <MenuGroupLabel id={id}>{label}</MenuGroupLabel>}
      {children}
    </div>
  );
}

export function MenuGroupLabel({ children, ...nativeProps }: MenuGroupLabelProps) {
  return <div {...withSelectorKey(nativeProps, 'part', 'group-label')}>{children}</div>;
}

/**
 * Who the menu belongs to: an avatar, a name, a line under it, above the
 * commands. Not an item — the arrows and typeahead never reach it, because a
 * `menu` owns only items, groups and separators — so the surface names it as
 * its description and a reader hears it once, as the menu opens. The name and
 * the line under it are `MenuItemLabel` and `MenuItemDescription`; any other
 * child is the media, set beside both.
 */
export function MenuHeader({ children, id, ...nativeProps }: MenuHeaderProps) {
  const surface = useMenuSurface();
  const generated = `${useId()}header`;
  const own = id ?? generated;
  const register = surface?.setHeaderId;

  useEffect(() => {
    register?.(own);
    return () => register?.(null);
  }, [own, register]);

  return (
    <div {...withSelectorKey(nativeProps, 'part', 'header')} id={own}>
      {children}
    </div>
  );
}

/** Not focusable and not interactive, which is what the pattern asks of it. */
export function MenuSeparator(nativeProps: MenuSeparatorProps) {
  return (
    <hr
      {...withSelectorKey(nativeProps, 'part', 'separator')}
      aria-orientation="horizontal"
      role="separator"
    />
  );
}

/** What a menu whose items were all filtered away says instead of nothing. */
export function MenuEmpty({ children, ...nativeProps }: MenuEmptyProps) {
  return <div {...withSelectorKey(nativeProps, 'part', 'empty')}>{children}</div>;
}
