import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** How the rows are told apart. The vocabulary is `accordion`'s. */
export type ListVariant = 'plain' | 'ruled' | 'framed' | 'separated';

/** The room a row gets. Density is the application's choice; this is not. */
export type ListSize = 'sm' | 'md' | 'lg';

/**
 * What is painted in the marker column. It is a separate question from
 * `ordered`: an ordered set whose rows carry their own badges paints no number
 * and still reads in order.
 */
export type ListMarker = 'none' | 'bullet' | 'number';

/** The heading a group's name is set as. `none` renders a `div`. */
export type ListSectionLevel = 'none' | '1' | '2' | '3' | '4' | '5' | '6';

/** What an application sets once for every list under it. */
export interface ListDefaults {
  inset: boolean;
  marker: ListMarker;
  size: ListSize;
  variant: ListVariant;
}

export interface ListDefaultsProviderProps extends Partial<ListDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What the set hands each row. Every value here is a fact about the set; a
 * fact about one row — its tone, its alignment, whether it is selected — never
 * travels this way.
 */
export interface ListContextValue {
  inset: boolean;
  marker: ListMarker;
  ordered: boolean;
  size: ListSize;
  variant: ListVariant;
}

/* Only the family's own attributes are named. `aria-busy`, `role` and every
   other native one are already on `HTMLAttributes`, and narrowing one of them
   here made the wiring unassignable to the props it was built from. */
export interface ListRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-inset'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-marker': ListMarker;
  'data-part': string;
  'data-size': ListSize;
  'data-ui': string;
  'data-variant': ListVariant;
}

export interface ListProps extends ComponentPropsWithRef<'ul'> {
  /**
   * Takes the rows' inline padding away, for a list inside a box that already
   * pads its own content — a card body, a dialog. The rule and the fill still
   * run edge to edge.
   */
  inset?: boolean | undefined;
  /**
   * `aria-busy` on the set, which ARIA 1.2 §5.2.6 asks of a container whose
   * rows have not arrived. The family draws no placeholder: `skeleton` owns
   * that geometry and goes inside the rows.
   */
  loading?: boolean | undefined;
  /** What is painted in the marker column. Defaults to the provider, then `none`. */
  marker?: ListMarker | undefined;
  /** Renders an `ol`, so the reading order of the set is a fact and not a look. */
  ordered?: boolean | undefined;
  /** Renders the wiring into another element — a `menu`, a router's own list. */
  render?: ((props: ListRootProps) => ReactNode) | undefined;
  /** The room a row gets. Defaults to the provider, then to `md`. */
  size?: ListSize | undefined;
  /** How the rows are told apart. Defaults to the provider, then to `plain`. */
  variant?: ListVariant | undefined;
}

export interface ListSectionRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export type ListSectionLabelVariant = 'caption' | 'ruled';

export interface ListSectionProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  /** The rows of this group. They are nested in a list of their own. */
  children?: ReactNode | undefined;
  /**
   * What stands at the end of the heading, on the line of the name: a day's
   * balance, a count. Set in tabular figures.
   */
  end?: ReactNode | undefined;
  /** The group's name. */
  label: ReactNode;
  /**
   * How the heading is drawn. `caption` is the small muted name; `ruled` is the
   * name in the text colour over a rule, with no ground behind it. Defaults to
   * `caption`.
   */
  labelVariant?: ListSectionLabelVariant | undefined;
  /** Reaches the heading element, for an id or a class the page owns. */
  labelProps?: HTMLAttributes<HTMLElement> | undefined;
  /** The heading this group's name is set as. Defaults to `3`. */
  level?: ListSectionLevel | undefined;
  /** Reaches the nested list element. */
  listProps?: HTMLAttributes<HTMLElement> | undefined;
  render?: ((props: ListSectionRootProps) => ReactNode) | undefined;
  /**
   * Keeps the group's name in place while its own rows scroll past it. It
   * takes the set's surface and the library's sticky stack level, which is
   * what a consumer writing `position: sticky` alone does not get.
   */
  sticky?: boolean | undefined;
}

export interface ListEmptyProps extends ComponentPropsWithRef<'li'> {
  render?: ((props: ListSectionRootProps) => ReactNode) | undefined;
}
