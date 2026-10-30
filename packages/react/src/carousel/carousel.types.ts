import type {
  CarouselAlign,
  CarouselOrientation,
  CarouselPages,
  CarouselSlidesPerMove,
  CarouselTransition,
} from '@slotted/core/carousel';
import type { CarouselMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react';

export type { CarouselAlign, CarouselOrientation, CarouselSlidesPerMove, CarouselTransition };

/** Where previous and next stand when they are children of the root. */
export type CarouselArrows = 'inset' | 'outside';

/** The step of the control scale the round controls take. */
export type CarouselSize = 'sm' | 'md' | 'lg';

/** What the indicators draw: a dot per page, a segment per page, or the consumer's picture. */
export type CarouselIndicatorsVariant = 'dots' | 'line' | 'thumbnails';

/** Where the bar stands: under the viewport, or over its foot. */
export type CarouselControlsPlacement = 'below' | 'overlay';

/** Why the page moved. */
export type CarouselPageReason = Extract<
  ChangeRequest<number>['reason'],
  'pointer' | 'keyboard' | 'scroll' | 'timeout' | 'resize' | 'programmatic'
>;

/** Why the rotation started or stopped. */
export type CarouselPlayingReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'scroll' | 'timeout' | 'programmatic'
>;

export type CarouselPageRequest = ChangeRequest<number>;
export type CarouselPlayingRequest = ChangeRequest<boolean>;

/** What an application sets once for every carousel under it. */
export interface CarouselDefaults {
  orientation: CarouselOrientation;
  transition: CarouselTransition;
  align: CarouselAlign;
  arrows: CarouselArrows;
  size: CarouselSize;
  loop: boolean;
  draggable: boolean;
  /** The rotation's wait on a page, in milliseconds, when `autoplay` is `true`. */
  autoplayDelay: number;
}

export interface CarouselDefaultsProviderProps extends Partial<CarouselDefaults> {
  children?: ReactNode | undefined;
}

/** The actions a consumer cannot express declaratively. */
export interface CarouselHandle {
  /** Asks for a page with reason `programmatic`. */
  scrollTo: (page: number) => void;
  /** Asks for the page that holds a slide, with reason `programmatic`. */
  scrollToSlide: (slide: number) => void;
  /** Reads the layout again: after a consumer changed slide sizes in a way no observer sees. */
  refresh: () => void;
}

/** What every part reads from the family around it. */
export interface CarouselContextValue {
  attachViewport: (element: HTMLElement | null) => void;
  viewportId: string;
  orientation: CarouselOrientation;
  transition: CarouselTransition;
  size: CarouselSize;
  loop: boolean;
  /** The family's words in the language in force, with this carousel's `messages` laid over them. */
  t: FamilyTranslator<CarouselMessages>;
  /** The locale in force: what the counter's numbers are written in. */
  locale: string;
  /** The page the parts draw: the committed page, or the page a gesture is crossing. */
  page: number;
  pageCount: number;
  pages: CarouselPages;
  slideIds: string[];
  /** Whether the rotation is on, and whether something holds it. */
  playing: boolean;
  autoplay: boolean;
  canPrevious: boolean;
  canNext: boolean;
  go: (
    page: number,
    reason: CarouselPageReason,
    source: unknown,
    options?: { instant?: boolean },
  ) => void;
  step: (delta: 1 | -1, reason: CarouselPageReason, source: unknown) => void;
  setPlaying: (playing: boolean, reason: CarouselPlayingReason, source: unknown) => void;
}

interface PartRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface CarouselRootProps extends PartRootProps {
  'aria-roledescription': string;
  'data-ui': string;
  'data-orientation': CarouselOrientation;
  'data-transition': CarouselTransition;
  'data-align': CarouselAlign;
  'data-arrows': CarouselArrows;
  'data-size': CarouselSize;
  'data-draggable'?: '' | undefined;
  'data-dragging'?: '' | undefined;
  'data-measured'?: '' | undefined;
  'data-playing'?: '' | undefined;
  'data-paused'?: '' | undefined;
}

export interface CarouselProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'defaultValue' | 'onChange'
> {
  /** Defaults to the provider, then to `start`. `center` makes every slide a page. */
  align?: CarouselAlign | undefined;
  /** Defaults to the provider, then to `inset`. */
  arrows?: CarouselArrows | undefined;
  /**
   * Turns the rotation on: `true` waits the provider's delay on each page, a
   * number waits that many milliseconds. Absent, the carousel never rotates —
   * a product screen does not move on its own unless it was asked to.
   */
  autoplay?: boolean | number | undefined;
  /** The page an uncontrolled carousel starts on, read once. */
  defaultPage?: number | undefined;
  /**
   * Whether an uncontrolled rotation starts running. Defaults to `true` with
   * `autoplay`, and to `false` whatever it says when the reader asked the
   * system for reduced motion.
   */
  defaultPlaying?: boolean | undefined;
  /** Whether a mouse can drag the row. Defaults to the provider, then to `true`. */
  draggable?: boolean | undefined;
  /** The actions a consumer cannot express declaratively. */
  handleRef?: Ref<CarouselHandle> | undefined;
  /** Whether next on the last page goes to the first. Defaults to the provider, then to `false`. */
  loop?: boolean | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<CarouselMessages> | undefined;
  /** Called before the page moves, with the request that carries the reason. */
  onPageChange?: ((page: number, request: CarouselPageRequest) => void) | undefined;
  /** Called before the rotation starts or stops. */
  onPlayingChange?: ((playing: boolean, request: CarouselPlayingRequest) => void) | undefined;
  /** Defaults to the provider, then to `horizontal`. */
  orientation?: CarouselOrientation | undefined;
  /** Present means controlled, for the life of the component. */
  page?: number | undefined;
  /** Present means the rotation is controlled. */
  playing?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: CarouselRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: CarouselSize | undefined;
  /**
   * How many slides one view holds. Written as `--slotted-carousel-slides-per-view`;
   * leave it unset to write that property in a container query of your own.
   */
  slidesPerView?: number | undefined;
  /** How many slides a page moves: a number, or `page` for the slides wholly in view. */
  slidesPerMove?: CarouselSlidesPerMove | undefined;
  /** Defaults to the provider, then to `slide`. */
  transition?: CarouselTransition | undefined;
}

export interface CarouselViewportProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: PartRootProps & { role?: string; tabIndex?: number }) => ReactNode) | undefined;
}

export interface CarouselSlideProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: PartRootProps) => ReactNode) | undefined;
}

export interface CarouselButtonRootProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-part': string;
  'data-disabled'?: '' | undefined;
  type: 'button';
}

export interface CarouselButtonProps extends ComponentPropsWithRef<'button'> {
  /** Replaces the family's glyph. The accessible name stays the message unless `aria-label` is given. */
  children?: ReactNode | undefined;
  render?: ((props: CarouselButtonRootProps) => ReactNode) | undefined;
}

export interface CarouselControlsProps extends ComponentPropsWithRef<'div'> {
  /** Under the viewport, or over its foot on a pill of the raised surface. */
  placement?: CarouselControlsPlacement | undefined;
  render?:
    | ((props: PartRootProps & { 'data-placement': CarouselControlsPlacement }) => ReactNode)
    | undefined;
}

export interface CarouselIndicatorsProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * One indicator per page, drawn by the family when absent. A function
   * renders each one — a thumbnail, a label — and receives the page.
   */
  children?: ((page: number) => ReactNode) | undefined;
  /** Defaults to `dots`; `thumbnails` when `children` draws pictures is the consumer's to say. */
  variant?: CarouselIndicatorsVariant | undefined;
  render?: ((props: PartRootProps & { role: 'tablist' }) => ReactNode) | undefined;
}

export interface CarouselIndicatorRootProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-part': string;
  role: 'tab';
  type: 'button';
  'aria-selected': boolean;
  'aria-controls'?: string | undefined;
  'data-current'?: '' | undefined;
  'data-distance'?: string | undefined;
  tabIndex: number;
}

export interface CarouselIndicatorProps extends ComponentPropsWithRef<'button'> {
  /** The page this indicator shows. */
  page: number;
  render?: ((props: CarouselIndicatorRootProps) => ReactNode) | undefined;
}

export interface CarouselCounterProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Writes the counter from the page, counted from one, and the count. Defaults to `3 / 8`. */
  children?: ((page: number, count: number) => ReactNode) | undefined;
  render?: ((props: PartRootProps) => ReactNode) | undefined;
}
