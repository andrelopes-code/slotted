import type { FamilyTranslator, PartialMessages, TourMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { TourMissing, TourOutcome, TourTarget } from '@slotted/core/tour';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';

export type { TourMissing, TourOutcome, TourTarget };

export type TourSize = 'sm' | 'md' | 'lg';

export type TourSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

export type TourAlign = 'start' | 'center' | 'end';

/** `auto` follows the viewport's size class; the other two decide it. */
export type TourLayout = 'auto' | 'compact' | 'regular';

export type TourFocusTarget = Element | { current: Element | null } | string;

/** Why the tour opened or closed. */
export type TourOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'dismiss' | 'escape' | 'outsidePress' | 'back' | 'programmatic'
>;

/** Why the current step moved. */
export type TourStepReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/**
 * The request the family emits before the tour opens or closes. A close
 * carries the outcome — what the product stores to decide whether to offer
 * the tour again — on the request itself, as `dialog` carries its `result`.
 */
export interface TourOpenRequest extends ChangeRequest<boolean> {
  readonly reason: TourOpenReason;
  readonly outcome?: TourOutcome | undefined;
}

export interface TourStepRequest extends ChangeRequest<string | null> {
  readonly reason: TourStepReason;
}

/** The words a step may say in place of the tour's: "Start tour", "Got it". */
export type TourStepMessages = PartialMessages<
  Pick<TourMessages, 'next' | 'prev' | 'skip' | 'done'>
>;

/** Which of the card's own actions a step shows. Unstated ones follow the rule in the docs. */
export interface TourStepActions {
  prev?: boolean | undefined;
  next?: boolean | undefined;
  skip?: boolean | undefined;
  close?: boolean | undefined;
}

export interface TourStep {
  /** Unique in the tour. It is the value of `step`. */
  id: string;
  /** An element, a ref, a selector or a function. Absent for a centred step. */
  target?: TourTarget;
  title: ReactNode;
  description?: ReactNode | undefined;
  /** The step's own content, in the body — the only part that scrolls. */
  content?: ReactNode | undefined;
  /** An image or a video above the header. */
  media?: ReactNode | undefined;
  side?: TourSide | undefined;
  align?: TourAlign | undefined;
  /** Read each time navigation reaches the step; `false` passes over it. */
  when?: (() => boolean) | undefined;
  /** Awaited before the target is looked for. It may render the target. */
  prepare?: ((signal: AbortSignal) => void | Promise<void>) | undefined;
  /** The target stays operable, and the step is non-modal. */
  interactive?: boolean | undefined;
  /** A DOM event on the target that goes to the next step — `'click'`, usually. */
  advanceOn?: string | undefined;
  /** Overrides the tour's `spotlight` for this step. */
  spotlight?: boolean | undefined;
  /** Laid over the tour's words for this step: "Start tour", "Got it". */
  messages?: TourStepMessages | undefined;
  actions?: TourStepActions | undefined;
  /** Read aloud when the step arrives while focus is elsewhere. Defaults to the title's text. */
  announcement?: string | undefined;
}

export interface TourDefaults {
  align: TourAlign;
  alignOffset: number;
  arrow: boolean;
  arrowPadding: number;
  autoFocus: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  collisionPadding: number;
  keyboardNavigation: boolean;
  layout: TourLayout;
  missing: TourMissing;
  modal: boolean;
  scrollIntoView: boolean;
  side: TourSide;
  sideOffset: number;
  size: TourSize;
  spotlight: boolean;
  targetTimeout: number;
}

export interface TourDefaultsProviderProps extends Partial<TourDefaults> {
  children?: ReactNode | undefined;
  /** Where every tour's layer is portalled, instead of the end of the body. */
  container?: Element | null | undefined;
}

export interface TourHandle {
  /** Opens the tour at a step, or at the first available one. */
  start: (id?: string) => void;
  next: () => void;
  prev: () => void;
  goTo: (id: string) => void;
  close: (outcome?: TourOutcome) => void;
  /** Measures the target and the card again, after the page moved without scrolling. */
  reposition: () => void;
}

/** What a part reads, and what `useTour()` hands a consumer's own composition. */
export interface TourState<Step extends TourStep = TourStep> {
  readonly step: Step;
  readonly position: number;
  readonly total: number;
  readonly first: boolean;
  readonly last: boolean;
  /** The next step is preparing, or its target has not arrived. */
  readonly pending: boolean;
  /** The step named a target that could not be found; it is shown centred. */
  readonly missing: boolean;
  readonly target: Element | null;
  /** The family's words in the language in force, with the tour's and the step's `messages` laid over them. */
  readonly t: FamilyTranslator<TourMessages>;
  next: (source?: unknown) => void;
  prev: (source?: unknown) => void;
  goTo: (id: string) => void;
  close: (outcome: TourOutcome, source?: unknown) => void;
}

export interface TourContextValue extends TourState {
  readonly modal: boolean;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly hasTitle: boolean;
  readonly hasDescription: boolean;
  readonly setHasTitle: (present: boolean) => void;
  readonly setHasDescription: (present: boolean) => void;
  readonly setContentNode: (node: HTMLElement | null) => void;
  readonly setTitleNode: (node: HTMLElement | null) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly press: (event: { detail: number; nativeEvent: Event }) => 'pointer' | 'keyboard';
}

export interface TourProps<Step extends TourStep = TourStep> {
  steps: readonly Step[];
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: TourOpenRequest) => void) | undefined;
  /** The current step's id. */
  step?: string | null | undefined;
  defaultStep?: string | null | undefined;
  onStepChange?: ((step: string | null, request: TourStepRequest) => void) | undefined;
  /** The consumer's own composition of the card. The whole anatomy when absent. */
  children?: ReactNode | undefined;
  ref?: Ref<TourHandle> | undefined;

  size?: TourSize | undefined;
  /**
   * The phone composition — lateral sides turned vertical, the card as wide
   * as the viewport allows — under `compact`, or never under `regular`.
   * `auto` takes it below 600 pixels of viewport.
   */
  layout?: TourLayout | undefined;
  side?: TourSide | undefined;
  align?: TourAlign | undefined;
  sideOffset?: number | undefined;
  alignOffset?: number | undefined;
  collisionPadding?: number | undefined;
  arrowPadding?: number | undefined;
  arrow?: boolean | undefined;
  /** The page is inert and focus stays in the card. A step marked `interactive` is not modal. */
  modal?: boolean | undefined;
  /** Cut the target out of the scrim. */
  spotlight?: boolean | undefined;
  autoFocus?: boolean | undefined;
  closeOnEscape?: boolean | undefined;
  closeOnOutsidePress?: boolean | undefined;
  scrollIntoView?: boolean | undefined;
  missing?: TourMissing | undefined;
  keyboardNavigation?: boolean | undefined;
  /** How long to wait for a target that is not in the document yet, in milliseconds. */
  targetTimeout?: number | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<TourMessages> | undefined;
  /** Where focus goes when the tour closes, instead of where it was when the tour opened. */
  finalFocus?: TourFocusTarget | undefined;
}

type PartRender<P> = ((props: P) => ReactNode) | undefined;

/**
 * The ref a part hands to `render` is a callback, so it attaches to whatever
 * element the consumer renders — an `h3` for a title — and carries theirs too.
 */
type PartRootProps = HTMLAttributes<HTMLElement> & {
  ref?: ((node: HTMLElement | null) => void) | undefined;
};

export interface TourContentRootProps extends PartRootProps {
  'aria-describedby'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  'aria-modal'?: boolean | 'true' | 'false' | undefined;
  'data-part': 'content';
  role: string;
  tabIndex: -1;
}

export interface TourContentProps extends ComponentPropsWithRef<'div'> {
  render?: PartRender<TourContentRootProps>;
}

export interface TourMediaProps extends ComponentPropsWithRef<'div'> {
  render?: PartRender<PartRootProps>;
}

export interface TourHeaderProps extends ComponentPropsWithRef<'div'> {
  render?: PartRender<PartRootProps>;
}

export interface TourProgressProps extends ComponentPropsWithRef<'p'> {
  render?: PartRender<PartRootProps>;
}

export interface TourTitleProps extends ComponentPropsWithRef<'h2'> {
  render?: PartRender<PartRootProps & { id: string }>;
}

export interface TourDescriptionProps extends ComponentPropsWithRef<'p'> {
  render?: PartRender<PartRootProps & { id: string }>;
}

export interface TourBodyProps extends ComponentPropsWithRef<'div'> {
  render?: PartRender<PartRootProps>;
}

export interface TourFooterProps extends ComponentPropsWithRef<'div'> {
  render?: PartRender<PartRootProps>;
}

export interface TourCloseProps extends ComponentPropsWithRef<'button'> {
  render?: PartRender<PartRootProps>;
}

export interface TourActionProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  /** Receives the `button` family's own props, with the part's `data-part`. */
  render?: ((props: PartRootProps) => ReactElement) | undefined;
}
