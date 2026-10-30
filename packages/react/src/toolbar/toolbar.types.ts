import type { MenuAlign, MenuHandle, MenuSide, MenuSize } from '../menu';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** Which way the bar runs. */
export type ToolbarOrientation = 'horizontal' | 'vertical';

/** The step the bar's own inset, gap and separator sit at. */
export type ToolbarSize = 'sm' | 'md' | 'lg';

/** Whether the bar paints a ground of its own. */
export type ToolbarVariant = 'plain' | 'outline';

/**
 * What a bar does with more controls than it has room for.
 *
 * `wrap` keeps every one of them visible on a second row, and the arrows wrap
 * from row to row because the item list is linear. `scroll` is one line the
 * arrows reveal. `menu` is one line whose units give way from the end into a
 * surface, and it takes what is left over rather than what is convenient to
 * hide: what must stay visible is what declares no counterpart.
 */
export type ToolbarOverflowMode = 'wrap' | 'scroll' | 'menu';

/**
 * The accessible name of the control that holds what did not fit. A string is
 * used verbatim; a function is given the number of units behind the control,
 * because three dots say nothing about how much is behind them.
 */
export type ToolbarOverflowLabel = string | ((hidden: number) => string);

/** What an application sets once for every toolbar under it. */
export interface ToolbarDefaults {
  loop: boolean;
  orientation: ToolbarOrientation;
  overflow: ToolbarOverflowMode;
  size: ToolbarSize;
  variant: ToolbarVariant;
}

export interface ToolbarDefaultsProviderProps extends Partial<ToolbarDefaults> {
  children?: ReactNode | undefined;
}

/** What `render` receives for the bar. */
export interface ToolbarRootProps extends HTMLAttributes<HTMLElement> {
  'data-collapsed'?: string | undefined;
  'data-orientation': ToolbarOrientation;
  'data-overflow': ToolbarOverflowMode;
  'data-part': string;
  'data-size': ToolbarSize;
  'data-ui': string;
  'data-variant': ToolbarVariant;
  role: 'toolbar';
}

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {
  /** Whether the arrows wrap past the ends of the bar. */
  loop?: boolean | undefined;
  /** Defaults to the provider, then to `horizontal`. */
  orientation?: ToolbarOrientation | undefined;
  /** Defaults to the provider, then to `wrap`. */
  overflow?: ToolbarOverflowMode | undefined;
  /**
   * Reports how many units gave way, once per change. The collapsed set is a
   * measurement rather than a value, so there is no controlled pair over it: a
   * consumer who owned it could assert that a bar fits when the layout says it
   * does not.
   */
  onOverflowChange?: ((hidden: number) => void) | undefined;
  /** Renders the bar into another element. */
  render?: ((props: ToolbarRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. Sizes the bar, never its controls. */
  size?: ToolbarSize | undefined;
  /** Defaults to the provider, then to `plain`. */
  variant?: ToolbarVariant | undefined;
}

export interface ToolbarGroupProps extends ComponentPropsWithRef<'div'> {
  /**
   * What the whole run becomes when the bar has no room for it, under
   * `overflow="menu"`. A group that declares none is pinned.
   */
  counterpart?: ReactNode | undefined;
  /** Renders the group into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ToolbarItemProps extends ComponentPropsWithRef<'div'> {
  /**
   * What the control becomes in the surface when the bar has no room for it.
   * An item that declares none cannot be hidden, which is how a primary action
   * stays visible: it has nowhere to go, rather than a rank above the others.
   *
   * It is deliberately not called `overflow`: that word is the bar's own axis,
   * and one term with two meanings is the ambiguity the contract exists to
   * prevent.
   */
  counterpart?: ReactNode | undefined;
  /** Renders the unit into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ToolbarOverflowProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'ref'
> {
  /** Where the surface sits against the trigger. */
  align?: MenuAlign | undefined;
  /**
   * The accessible name. Defaults to a count — "3 more actions" — because the
   * mark says nothing about how much is behind it — in the language in force,
   * with its plural. `label` replaces the sentence.
   */
  label?: ToolbarOverflowLabel | undefined;
  /** Reaches the surface's imperative actions: `open`, `close`, `focus`. */
  menuRef?: Ref<MenuHandle> | undefined;
  /** Renders the trigger as the consumer's own control. */
  render?: ((props: ToolbarOverflowRootProps) => ReactNode) | undefined;
  ref?: Ref<HTMLElement> | undefined;
  side?: MenuSide | undefined;
  /** The surface's own measure, which is `menu`'s axis rather than the bar's. */
  size?: MenuSize | undefined;
}

/** What `render` receives for the control that opens what did not fit. */
export type ToolbarOverflowRootProps = Omit<ComponentPropsWithRef<'button'>, 'ref'> & {
  children: ReactNode;
  'data-part': string;
  ref?: Ref<HTMLElement> | undefined;
};

export interface ToolbarSeparatorProps extends ComponentPropsWithRef<'div'> {
  /** Renders the rule into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ToolbarSpacerProps extends ComponentPropsWithRef<'div'> {
  /** Renders the spacer into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}
