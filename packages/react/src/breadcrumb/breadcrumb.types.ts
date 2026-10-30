import type { DefinedProps } from '@slotted/core/selector-key';
import type { BreadcrumbMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode } from 'react';

/**
 * What a trail does with crumbs its width cannot hold. `collapse` folds the
 * middle ones into the ellipsis; `wrap` lets the row break onto a second line
 * and only the count collapses.
 */
export type BreadcrumbOverflow = 'collapse' | 'wrap';

/** Why the trail expanded. Only two things can ask: a press and a key. */
export type BreadcrumbExpandReason = 'pointer' | 'keyboard';

export type BreadcrumbChangeRequest = ChangeRequest<boolean>;

/**
 * What every trail on the page does before it states anything of its own. The
 * three collapse numbers are here because how deep a trail may get before it
 * folds is a decision about the application rather than about one page.
 */
export interface BreadcrumbDefaults {
  itemsAfterCollapse?: number | undefined;
  itemsBeforeCollapse?: number | undefined;
  maxItems?: number | undefined;
  overflow?: BreadcrumbOverflow | undefined;
  /** The mark drawn between two crumbs. Absent, the stylesheet draws its own. */
  separator?: ReactNode | undefined;
}

export interface BreadcrumbDefaultsProviderProps extends BreadcrumbDefaults {
  children?: ReactNode;
}

export interface BreadcrumbRootProps extends ComponentPropsWithRef<'nav'> {
  /** How many crumbs are folded into the ellipsis, count and width together. */
  'data-collapsed': string | undefined;
  'data-expanded': '' | undefined;
  'data-part': string;
  'data-ui': string;
}

export interface BreadcrumbListProps extends ComponentPropsWithRef<'ol'> {
  render?: ((props: BreadcrumbListRootProps) => ReactNode) | undefined;
}

export interface BreadcrumbListRootProps extends ComponentPropsWithRef<'ol'> {
  'data-part': string;
}

export interface BreadcrumbItemRootProps extends ComponentPropsWithRef<'li'> {
  'data-part': string;
}

export interface BreadcrumbItemProps extends ComponentPropsWithRef<'li'> {
  render?: ((props: BreadcrumbItemRootProps) => ReactNode) | undefined;
}

export interface BreadcrumbLinkRootProps extends ComponentPropsWithRef<'a'> {
  'data-part': string;
}

export interface BreadcrumbLinkProps extends ComponentPropsWithRef<'a'> {
  /** Substitutes the anchor — a router's own link, typically. */
  render?: ((props: DefinedProps<BreadcrumbLinkRootProps>) => ReactNode) | undefined;
}

export interface BreadcrumbTriggerRootProps extends ComponentPropsWithRef<'button'> {
  'data-part': string;
}

export interface BreadcrumbTriggerProps extends ComponentPropsWithRef<'button'> {
  /**
   * The page the reader is on. The switcher still says so, with
   * `aria-current="page"`, and takes the page's weight.
   */
  current?: boolean | undefined;
  /** Substitutes the button — a `MenuTrigger`'s own, typically. */
  render?: ((props: BreadcrumbTriggerRootProps) => ReactNode) | undefined;
}

export interface BreadcrumbPageRootProps extends ComponentPropsWithRef<'span'> {
  'aria-current': 'page';
  'data-part': string;
}

export interface BreadcrumbPageProps extends ComponentPropsWithRef<'span'> {
  render?: ((props: BreadcrumbPageRootProps) => ReactNode) | undefined;
}

export interface BreadcrumbProps extends ComponentPropsWithRef<'nav'> {
  /** The value an uncontrolled trail starts from, read once. */
  defaultExpanded?: boolean | undefined;
  /** Present means controlled, for the life of the component. */
  expanded?: boolean | undefined;
  /** How many crumbs survive at the end of a collapsed trail. */
  itemsAfterCollapse?: number | undefined;
  /** How many survive at its start. */
  itemsBeforeCollapse?: number | undefined;
  /** The count above which the trail collapses. `0` never collapses. */
  maxItems?: number | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name (`label`) and the ellipsis. A native `aria-label` still wins.
   */
  messages?: PartialMessages<BreadcrumbMessages> | undefined;
  /** Called before the trail expands, with the request that carries the reason. */
  onExpandedChange?: ((expanded: boolean, request: BreadcrumbChangeRequest) => void) | undefined;
  /** What the trail does with crumbs its width cannot hold. `collapse` by default. */
  overflow?: BreadcrumbOverflow | undefined;
  render?: ((props: BreadcrumbRootProps) => ReactNode) | undefined;
  /** The mark between two crumbs. Absent, the stylesheet draws a rotated rule. */
  separator?: ReactNode | undefined;
}

/** What the trail tells the parts inside it. */
export interface BreadcrumbContextValue {
  expand: (reason: BreadcrumbExpandReason, source?: unknown) => void;
  expanded: boolean;
  /** The id of the item focus moves to once the ellipsis stops existing. */
  firstRevealedId: string;
  itemsAfterCollapse: number;
  itemsBeforeCollapse: number;
  maxItems: number;
  overflow: BreadcrumbOverflow;
  separator: ReactNode;
  /** The list reports how many crumbs it folded, so the root can say so. */
  setCollapsed: (count: number) => void;
  /** The family's words in the language in force, with this trail's `messages` laid over them. */
  t: FamilyTranslator<BreadcrumbMessages>;
}

/** What one crumb is told by the list that laid it out. */
export interface BreadcrumbItemContextValue {
  hidden: boolean;
  /** The last item draws no separator, because there is nothing after it. */
  last: boolean;
  /** Set on the first crumb the ellipsis reveals, so focus can reach it. */
  revealedId: string | undefined;
}
