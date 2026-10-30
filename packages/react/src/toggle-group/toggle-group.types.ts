import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the group and every item inside it sit at. */
export type ToggleGroupSize = 'sm' | 'md' | 'lg';

/**
 * Whether the items are framed or bare. `ghost` is the bar that sits inside
 * something already framed — a toolbar, a card header. There is no tone axis:
 * "on" is one colour across the system, and a bar that wants the whole palette
 * is `button-group` around ToggleButtons.
 */
/**
 * How the items are drawn. `outline` and `ghost` are toggle buttons, joined
 * into one bar when `attached`; `chips` are separate rounded items that wrap,
 * the pressed one in the neutral tone's ink, and never join.
 */
export type ToggleGroupVariant = 'outline' | 'ghost' | 'chips';

/** How the items flow. The arrows follow the same axis. */
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

/** Why the value moved. A toggle group can produce exactly these two. */
export type ToggleGroupSelectionReason = Extract<
  ChangeRequest<readonly string[]>['reason'],
  'pointer' | 'keyboard'
>;

/**
 * The request the group emits. The value is always an array: `multiple` caps
 * it at one entry rather than changing its type, so both bindings hold one
 * shape and an Angular `model()` can hold it too.
 */
export type ToggleGroupChangeRequest = ChangeRequest<readonly string[]>;

/** What an application sets once for every toggle group under it. */
export interface ToggleGroupDefaults {
  attached: boolean;
  deselectable: boolean;
  loop: boolean;
  orientation: ToggleGroupOrientation;
  size: ToggleGroupSize;
  variant: ToggleGroupVariant;
}

export interface ToggleGroupDefaultsProviderProps extends Partial<ToggleGroupDefaults> {
  children?: ReactNode | undefined;
}

/** What the group hands every item inside it. */
export interface ToggleGroupContextValue {
  disabled: boolean | undefined;
  /** Whether one value is on. Read by every item in the set. */
  holds: (value: string) => boolean;
  size: ToggleGroupSize;
  /** Asks the group to turn one value on or off. */
  toggle: (value: string, reason: ToggleGroupSelectionReason, source: unknown) => void;
  variant: ToggleGroupVariant;
}

/** What `render` receives for the group's root. */
export interface ToggleGroupRootProps extends HTMLAttributes<HTMLElement> {
  'data-attached'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-orientation': ToggleGroupOrientation;
  'data-part': string;
  'data-size': ToggleGroupSize;
  'data-ui': string;
  'data-variant': ToggleGroupVariant;
}

/** What `render` receives for one item. */
export interface ToggleGroupItemRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-part': string;
  'data-pressed'?: '' | undefined;
}

export interface ToggleGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  /** Defaults to the provider, then to `true`. A joined bar has one edge. */
  attached?: boolean | undefined;
  /** The value an uncontrolled group starts from, read once. */
  defaultValue?: readonly string[] | undefined;
  /**
   * Whether the last item on may be turned off. Defaults to the provider, then
   * to `true`. Ignored while `multiple` is true, where a set may always empty.
   */
  deselectable?: boolean | undefined;
  /** Unstated rather than `false`. Reaches every item as the native attribute. */
  disabled?: boolean | undefined;
  /** Defaults to the provider, then to `false`. */
  fullWidth?: boolean | undefined;
  /** Whether the arrows wrap past the ends. Defaults to the provider, then `true`. */
  loop?: boolean | undefined;
  /** Whether more than one item may be on at a time. Defaults to `false`. */
  multiple?: boolean | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?:
    ((value: readonly string[], request: ToggleGroupChangeRequest) => void) | undefined;
  /** Defaults to the provider, then to `horizontal`. */
  orientation?: ToggleGroupOrientation | undefined;
  /** Renders the group's root into another element. */
  render?: ((props: ToggleGroupRootProps) => ReactNode) | undefined;
  /**
   * Whether the group holds one tab stop of its own and moves focus with the
   * arrows. Unstated, it is inferred: a group inside a `toolbar` stands down,
   * because a bar is already one tab stop with arrow navigation across every
   * control it holds. Stated, it wins — which is what a bar this library did
   * not write needs.
   */
  rovingFocus?: boolean | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: ToggleGroupSize | undefined;
  /** Present means controlled, for the life of the component. */
  value?: readonly string[] | undefined;
  /** Defaults to the provider, then to `outline`. */
  variant?: ToggleGroupVariant | undefined;
}

export interface ToggleGroupItemProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'value'
> {
  children?: ReactNode | undefined;
  /** Unstated rather than `false`, so the item defers to the group. */
  disabled?: boolean | undefined;
  /** The mark, drawn before the words. Absent on an item that is only words. */
  icon?: ReactNode | undefined;
  /** Renders the item into another element. It stays a two-state button. */
  render?: ((props: ToggleGroupItemRootProps) => ReactNode) | undefined;
  /** What this item turns on. It is what the group's value holds. */
  value: string;
}
