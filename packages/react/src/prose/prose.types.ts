import type { PartialMessages, ProseMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, RefCallback } from 'react';

/**
 * The type-scale step the body text takes. Named for the scale's own steps, as
 * `Text` names its own, so the offset from control type is visible rather than
 * hidden: `lg` is one rem, and `--slotted-font-size-md` is the size a button
 * label is set in.
 */
export type ProseSize = 'md' | 'lg' | 'xl';

/**
 * The space between blocks, from which every other distance in the region
 * derives. `tight` is a message in a thread, `normal` a documentation page,
 * `loose` an article.
 */
export type ProseFlow = 'tight' | 'normal' | 'loose';

/** What an application sets once for every region under it. */
export interface ProseDefaults {
  flow: ProseFlow;
  size: ProseSize;
}

export interface ProseDefaultsProviderProps extends Partial<ProseDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives on the region. It names the family's own attributes
 * over the native ones every element shares; `ref` is not named because the
 * element the consumer renders decides its own type.
 */
export interface ProseRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-flow': ProseFlow;
  'data-part': string;
  'data-size': ProseSize;
  'data-ui': string;
}

export interface ProseProps extends ComponentPropsWithRef<'div'> {
  /** The space between blocks. Falls back to the injected default. */
  flow?: ProseFlow | undefined;
  /** Renders the wiring into another element — `article`, `section`, `main`. */
  render?: ((props: ProseRootProps) => ReactNode) | undefined;
  /** The type-scale step the body text takes. */
  size?: ProseSize | undefined;
}

export interface ProsePartProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface ProseLeadProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: ProsePartProps) => ReactNode) | undefined;
}

export interface ProseAnchorProps extends ComponentPropsWithRef<'a'> {
  render?: ((props: ProsePartProps) => ReactNode) | undefined;
}

export interface ProseExcludeProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: ProsePartProps) => ReactNode) | undefined;
}

export interface ProseFootnotesProps extends ComponentPropsWithRef<'section'> {
  render?: ((props: ProsePartProps) => ReactNode) | undefined;
}

/** What `ProseScroll` writes on its element once it knows whether it scrolls. */
export interface ProseScrollRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
  /**
   * Named here, unlike every other part's render props, because this one part
   * has to be measured: a consumer who substitutes the element still hands the
   * family the node whose width decides whether the wiring appears at all.
   */
  ref: RefCallback<HTMLElement>;
}

export interface ProseScrollProps extends Omit<ComponentPropsWithRef<'div'>, 'ref'> {
  /**
   * Words laid over the catalog of the language in force: the last resort name
   * of the region (`scroll`). A native `aria-label` still wins.
   */
  messages?: PartialMessages<ProseMessages> | undefined;
  /** Names it from an element already on the page — a table's own caption. */
  labelledBy?: string | undefined;
  /** The handle a consumer needs when content arrives outside React's cycle. */
  handleRef?: ProseScrollHandleRef | undefined;
  ref?: Ref<HTMLElement> | undefined;
  render?: ((props: ProseScrollRootProps) => ReactNode) | undefined;
}

/**
 * The one thing a consumer cannot express declaratively: content that arrived
 * without React knowing — a renderer writing into the DOM, a font landing, an
 * image finishing — changes whether the block overflows, and the observer has
 * already measured.
 */
export interface ProseScrollHandle {
  /** Measures the block again and rewrites the wiring if the answer changed. */
  refresh: () => void;
  /** Whether the block is scrollable as of the last measurement. */
  overflowing: () => boolean;
}

export type ProseScrollHandleRef =
  ((handle: ProseScrollHandle | null) => void) | { current: ProseScrollHandle | null };
