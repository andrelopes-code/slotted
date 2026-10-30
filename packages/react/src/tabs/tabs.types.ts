import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** Whether moving focus to a tab also selects it. */
export type TabsActivation = 'automatic' | 'manual';

/** Which way the list runs. A horizontal list scrolls; a vertical one stacks. */
export type TabsOrientation = 'horizontal' | 'vertical';

/** The type step the list and its tabs sit at. */
export type TabsSize = 'sm' | 'md' | 'lg';

/**
 * How the list is drawn. `line` is a row of labels over a hairline; `contained`
 * is a sunken track holding a surface per tab. Both paint the same marker,
 * which is what survives the `high-contrast` scheme.
 */
export type TabsVariant = 'line' | 'contained';

/**
 * Whether the list draws the line its tabs stand on. `none` is for a list that
 * sits on a line the page already drew — a card header's edge, a table's own
 * rule — where two hairlines a pixel apart read as one smudge.
 */
export type TabsTrack = 'line' | 'none';

/** Whether each tab is as wide as its label or takes an equal share of the line. */
export type TabsFit = 'auto' | 'equal';

/**
 * When a panel exists. `active` builds it on selection and drops it after,
 * `lazy` builds it on first selection and keeps it, `eager` builds every panel
 * up front. The names are Cloudscape's, which are the clearest three words in
 * the field for the same three behaviours.
 */
export type TabsMount = 'active' | 'lazy' | 'eager';

/** Which way the selection travelled, from the two indices. */
export type TabsActivationDirection = 'forward' | 'backward' | 'none';

/** Why the selection moved. */
export type TabsSelectionReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard' | 'remove' | 'programmatic'
>;

/** Why a tab was dismissed. */
export type TabsDismissReason = Extract<ChangeRequest<string>['reason'], 'pointer' | 'keyboard'>;

/** The request the family emits before the value moves. */
export type TabsChangeRequest = ChangeRequest<string | undefined>;

/**
 * The request a dismissal carries. It holds no value pair, because nothing is
 * replacing anything: the value being dismissed is the first argument, and the
 * shape is `tag`'s, which set the convention for a removal in this library.
 */
export interface TabsDismissRequest {
  readonly reason: TabsDismissReason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

/** What an application sets once for every tabs family under it. */
export interface TabsDefaults {
  activation: TabsActivation;
  fit: TabsFit;
  track: TabsTrack;
  loop: boolean;
  mount: TabsMount;
  orientation: TabsOrientation;
  size: TabsSize;
  variant: TabsVariant;
}

export interface TabsDefaultsProviderProps extends Partial<TabsDefaults> {
  children?: ReactNode | undefined;
}

/** What the family hands every tab and every panel inside it. */
export interface TabsContextValue {
  activation: TabsActivation;
  /**
   * How the list hands the root its element. The root owns the roving tab stop,
   * the removal focus and the overflow observer, and all three are about the
   * list; a ref passed down is what lets the list stay the consumer's own
   * element while the behaviour stays with the family that holds the value.
   */
  attachList: (element: HTMLElement | null) => void;
  /** Whether the family as a whole is out of action. */
  disabled: boolean;
  /** The identifier a tab and its panel are wired together with. */
  identify: (value: string) => { panelId: string; tabId: string };
  mount: TabsMount;
  orientation: TabsOrientation;
  /** Whether this value has ever been selected, which is what `lazy` reads. */
  seen: (value: string) => boolean;
  /** Asks for a new selection, carrying the reason and the originating event. */
  select: (value: string, reason: TabsSelectionReason, source: unknown) => void;
  /** Asks for a tab to be dismissed, and moves the selection when it held it. */
  dismiss: (value: string, reason: TabsDismissReason, source: unknown) => void;
  /**
   * The value the panels render. It is `value` itself, or under `deferPanels`
   * its deferred copy, which lags while the selected panel is still rendering.
   * A panel rendered outside `Tabs` — a page header's tabs whose region is the
   * page body — renders from this one.
   */
  shownValue: string | undefined;
  /** The selected tab, which moves in the interaction's own frame. */
  value: string | undefined;
}

/** What `render` receives for the family's root. */
export interface TabsRootProps extends HTMLAttributes<HTMLElement> {
  'data-activation-direction': TabsActivationDirection;
  'data-disabled'?: '' | undefined;
  'data-fit': TabsFit;
  'data-orientation': TabsOrientation;
  'data-overflowing'?: '' | undefined;
  'data-part': string;
  'data-size': TabsSize;
  'data-track': TabsTrack;
  'data-ui': string;
  'data-variant': TabsVariant;
}

/** What `render` receives for the list. */
export interface TabListRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  role: 'tablist';
}

/** What `render` receives for one item. */
export interface TabRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-selected'?: '' | undefined;
  role: 'presentation';
}

/** What `render` receives for one panel. */
export interface TabPanelRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  /** Written while this panel is on screen and the selected tab's panel is still rendering. */
  'data-pending'?: '' | undefined;
  role: 'tabpanel';
}

export interface TabsProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onSelect'> {
  /** Defaults to the provider, then to `automatic`, which is what the APG recommends. */
  activation?: TabsActivation | undefined;
  /** The value an uncontrolled family starts from, read once. */
  defaultValue?: string | undefined;
  /**
   * Unstated rather than `false`. Reaches every tab as the native attribute,
   * which is also what makes the browser skip it with the arrow keys.
   */
  disabled?: boolean | undefined;
  /** Defaults to the provider, then to `auto`. */
  fit?: TabsFit | undefined;
  /** Whether the arrows wrap past the ends of the list. */
  loop?: boolean | undefined;
  /** Defaults to the provider, then to `active`. */
  mount?: TabsMount | undefined;
  /**
   * Whether the panels render from a deferred copy of the value. The selected
   * tab then paints in the click's frame while the panel it opens renders
   * after it, and the panel on screen carries `aria-busy` and `data-pending`
   * until the new one is ready. On by default under `mount="active"`, where
   * selecting a tab mounts its panel; off under `lazy` and `eager`.
   */
  deferPanels?: boolean | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: string, request: TabsChangeRequest) => void) | undefined;
  /**
   * Called before a tab is dismissed. The family removes nothing: the consumer
   * owns the collection, and a component that removed itself would render
   * nothing while the consumer's array still held the item.
   */
  onTabDismiss?: ((value: string, request: TabsDismissRequest) => void) | undefined;
  /** Defaults to the provider, then to `horizontal`. */
  orientation?: TabsOrientation | undefined;
  /** Renders the family's root into another element. */
  render?: ((props: TabsRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: TabsSize | undefined;
  /**
   * Defaults to the provider, then to `line`. `none` draws no line at all, for a
   * list standing on one the page already drew.
   */
  track?: TabsTrack | undefined;
  /** Present means controlled, for the life of the component. */
  value?: string | undefined;
  /** Defaults to the provider, then to `line`. */
  variant?: TabsVariant | undefined;
}

export interface TabListProps extends ComponentPropsWithRef<'div'> {
  /** Renders the list into another element. */
  render?: ((props: TabListRootProps) => ReactNode) | undefined;
}

export interface TabProps extends Omit<ComponentPropsWithRef<'button'>, 'value'> {
  /** The label. Wrapped in the `label` part, which is what clips and mirrors it. */
  children?: ReactNode | undefined;
  /**
   * The id of the element this tab controls, when it is not a `TabPanel` of
   * this family: a strip over one region whose content the value filters —
   * a feed, a table — names that region here, and `aria-controls` says so.
   */
  controls?: string | undefined;
  /** Unstated rather than `false`, so the tab defers to the family. */
  disabled?: boolean | undefined;
  /** Whether this tab carries a control that closes it. */
  dismissible?: boolean | undefined;
  /**
   * What follows the label inside the tab, such as a count: wrapped in the
   * `end` part, beside the words rather than inside them.
   */
  end?: ReactNode | undefined;
  /** The accessible name of that control. Required whenever it is drawn. */
  dismissLabel?: string | undefined;
  /**
   * Makes the tab an anchor. A plain click still selects, and a click carrying
   * a modifier key is left to the browser, so a deep link opens in a new
   * browser tab instead of being swallowed.
   */
  href?: string | undefined;
  /** Renders the item — the box around the tab and its dismiss control. */
  render?: ((props: TabRootProps) => ReactNode) | undefined;
  /**
   * What precedes the label inside the tab, such as an icon: wrapped in the
   * `start` part, which sizes an icon to the tab's icon step.
   */
  start?: ReactNode | undefined;
  /** What this tab selects. It is what the family's value holds. */
  value: string;
}

export interface TabPanelProps extends ComponentPropsWithRef<'div'> {
  /** Renders the panel into another element. */
  render?: ((props: TabPanelRootProps) => ReactNode) | undefined;
  /** The tab this panel belongs to. */
  value: string;
}

export interface TabActionsProps extends ComponentPropsWithRef<'div'> {
  /** Renders the actions slot into another element — a `toolbar`, usually. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}
