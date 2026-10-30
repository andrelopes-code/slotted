import type { MenuAlign, MenuHandle, MenuSide, MenuSize } from '../menu';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** Whether the bar paints a ground and a rule of its own. */
export type ActionBarVariant = 'plain' | 'raised';

/** The step the bar's own inset, gap and separator sit at. */
export type ActionBarSize = 'sm' | 'md' | 'lg';

/** Where the run of actions sits in the room left after the status. */
export type ActionBarAlign = 'end' | 'start' | 'center';

/**
 * Where an action stands in the order of giving way.
 *
 * The five are adapted from `sap.m.OverflowToolbarPriority`, and they exist here
 * and not in `toolbar` because the two bars read in opposite directions. In a
 * bar of tools the first control is the most used, so giving way from the end
 * gives up the least used one. In a bar of actions the action that confirms is
 * at the **end** of the line — Polaris, Salesforce and SAP's own page footer all
 * put it there — so giving way from the end gives up Save first.
 *
 * - `pinned` never gives way. It is what the action that confirms takes.
 * - `high` gives way after `low` and `hide`, into the surface.
 * - `low` is the first rank to reach the surface, and the default for an action
 *   that declares a counterpart.
 * - `hide` gives way before every other rank and is **not** offered in the
 *   surface: a draft marker, a timestamp, a preview link — a control that is not
 *   worth a row in a menu. SAP calls it `Disappear` and no other surveyed
 *   implementation ships it.
 * - `always` is never drawn in the bar; its counterpart is in the surface from
 *   the start.
 */
export type ActionBarPriority = 'pinned' | 'high' | 'low' | 'hide' | 'always';

/**
 * The accessible name of the control that holds what did not fit. A string is
 * used verbatim; a function is given the number of actions behind the control,
 * because three dots say nothing about how much is behind them.
 */
export type ActionBarOverflowLabel = string | ((hidden: number) => string);

/** What an application sets once for every bar under it. */
export interface ActionBarDefaults {
  align: ActionBarAlign;
  size: ActionBarSize;
  sticky: boolean;
  variant: ActionBarVariant;
}

export interface ActionBarDefaultsProviderProps extends Partial<ActionBarDefaults> {
  children?: ReactNode | undefined;
}

/** What `render` receives for the bar. */
export interface ActionBarRootProps extends HTMLAttributes<HTMLElement> {
  'data-align': ActionBarAlign;
  'data-collapsed'?: string | undefined;
  'data-part': string;
  'data-size': ActionBarSize;
  'data-status'?: string | undefined;
  'data-sticky'?: '' | undefined;
  'data-ui': string;
  'data-variant': ActionBarVariant;
  role?: string | undefined;
}

export interface ActionBarProps extends ComponentPropsWithRef<'div'> {
  /** Defaults to the provider, then to `end`. */
  align?: ActionBarAlign | undefined;
  /**
   * Reports how many actions gave way, once per change. The collapsed set is a
   * measurement rather than a value, so there is no controlled pair over it: a
   * consumer who owned it could assert that a bar fits when the layout says it
   * does not.
   */
  onOverflowChange?: ((hidden: number) => void) | undefined;
  /**
   * Whether the bar belongs on screen at all. A bulk bar exists while there is a
   * selection and a contextual save bar while there are unsaved changes; both
   * enter from below and leave the same way, and the bar leaves the DOM once it
   * has left the view. Defaults to `true`.
   *
   * It is an input rather than a state model: the bar never asks to appear or to
   * leave, so there is nothing to cancel.
   */
  present?: boolean | undefined;
  /** Renders the bar into another element. */
  render?: ((props: ActionBarRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. Sizes the bar and the buttons in it. */
  size?: ActionBarSize | undefined;
  /**
   * Whether the bar sticks to the end of the region that scrolls. It stops above
   * whatever `page` publishes as its own chrome rather than covering it.
   * Defaults to the provider, then to `false`.
   */
  sticky?: boolean | undefined;
  /** Defaults to the provider, then to `plain`. */
  variant?: ActionBarVariant | undefined;
}

export interface ActionBarStatusProps extends ComponentPropsWithRef<'div'> {
  /** Renders the status region into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ActionBarActionsProps extends ComponentPropsWithRef<'div'> {
  /** Renders the run into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ActionBarActionProps extends ComponentPropsWithRef<'div'> {
  /**
   * What the action becomes in the surface when the bar has no room for it.
   *
   * It is deliberately not called `overflow`: that word names what a container
   * does with more content than it has room for, and one term with two meanings
   * is the ambiguity the contract exists to prevent.
   */
  counterpart?: ReactNode | undefined;
  /**
   * Where this action stands in the order of giving way. Defaults to `low` when
   * a counterpart is declared and to `pinned` when none is — a unit with nowhere
   * to go cannot give way, which is how the action that confirms stays visible.
   */
  priority?: ActionBarPriority | undefined;
  /** Renders the unit into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ActionBarSeparatorProps extends ComponentPropsWithRef<'div'> {
  /** Renders the rule into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface ActionBarOverflowProps extends Omit<
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
  label?: ActionBarOverflowLabel | undefined;
  /** Reaches the surface's imperative actions: `open`, `close`, `focus`. */
  menuRef?: Ref<MenuHandle> | undefined;
  ref?: Ref<HTMLElement> | undefined;
  /** Renders the trigger as the consumer's own control. */
  render?: ((props: ActionBarOverflowRootProps) => ReactNode) | undefined;
  side?: MenuSide | undefined;
  /** The surface's own measure, which is `menu`'s axis rather than the bar's. */
  size?: MenuSize | undefined;
}

/** What `render` receives for the control that opens what did not fit. */
export type ActionBarOverflowRootProps = Omit<ComponentPropsWithRef<'button'>, 'ref'> & {
  children: ReactNode;
  'data-part': string;
  ref?: Ref<HTMLElement> | undefined;
};
