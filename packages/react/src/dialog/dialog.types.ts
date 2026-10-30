import type { DialogMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, RefObject } from 'react';

/**
 * The panel's measure. Five named steps rather than the pixel string Material,
 * Carbon and Ant all take: a theme can retune a step and cannot retune
 * `width: '600px'`, and a family that accepted one would carry a second scale.
 * `full` spends the whole layer minus its padding.
 */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Where the panel sits in the layer. `top` is for content that grows. */
export type DialogPlacement = 'center' | 'top';

/**
 * What scrolls. `content` bounds the panel to the layer and scrolls its body,
 * which is what keeps the footer on screen; `viewport` scrolls the whole panel,
 * for content that is a document rather than a task.
 */
export type DialogScroll = 'content' | 'viewport';

/**
 * Whether the family paints the panel at all. `plain` turns off the surface,
 * the border, the radius, the shadow, the rows and the padding, and keeps
 * everything that is not paint: the portal, the scrim, presence, the focus
 * containment and restoration, the dismissal policy and the z-index stack.
 *
 * `render` substitutes the element the panel is drawn on and not the drawing,
 * so a consumer who wants the layer around a box of their own — a `Card`, a
 * media viewer, an image at its own aspect ratio — reaches for this instead.
 * The cost is that a plain panel does not keep its footer on screen for a long
 * body, because the three rows go with the paint.
 */
export type DialogSurface = 'panel' | 'plain';

/**
 * When the layer exists. `active` builds it on opening and drops it once the
 * exit is over, `lazy` builds it on the first open and keeps it, `eager` builds
 * it up front and hides it.
 *
 * The default is `active`, and it is the opposite of `collapsible`'s for the
 * same reason: a disclosure's panel transitions its own height and has to be in
 * the DOM, while a layer transitions opacity and `@slotted/core/presence`
 * already keeps it mounted for its own exit. A layer left in the document holds
 * its controls in the page tab sequence.
 */
export type DialogMount = 'active' | 'lazy' | 'eager';

/**
 * When the panel spends the whole layer. `narrow` is a container query at a
 * literal breakpoint, which is what `docs/component-features.md` §2.7 means by
 * a responsive mode that can be tested deterministically.
 */
export type DialogFullScreen = 'never' | 'narrow' | 'always';

/** Whether a dismissal source closes the layer. */
export type DialogDismissPolicy = 'close' | 'none';

/** The five semantic tones. An alert dialog draws its mark from this. */
export type DialogTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** Where focus goes when the layer opens. */
export type DialogInitialFocus =
  'first' | 'container' | 'cancel' | RefObject<HTMLElement | null> | false;

/** Where focus goes when the layer closes. Defaults to the trigger. */
export type DialogFinalFocus = RefObject<HTMLElement | null> | false;

/** Why the layer opened or closed. */
export type DialogOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  | 'pointer'
  | 'keyboard'
  | 'dismiss'
  | 'escape'
  | 'outsidePress'
  | 'back'
  | 'submit'
  | 'programmatic'
>;

/**
 * The request the family emits before the layer moves, with the result the
 * close carried. `result` is what the platform calls `returnValue`: it rides on
 * the request rather than declaring a second state model, because nothing about
 * it is controlled and a consumer owning it would own a value only the family
 * can produce.
 */
export interface DialogChangeRequest extends ChangeRequest<boolean> {
  readonly reason: DialogOpenReason;
  readonly result?: string | undefined;
}

/** Why the panel took the layer, or gave it back. */
export type DialogFullscreenReason = 'pointer' | 'keyboard' | 'programmatic';

export interface DialogFullscreenRequest extends ChangeRequest<boolean> {
  readonly reason: DialogFullscreenReason;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DialogHandle {
  /** Opens the layer, carrying `programmatic`. */
  open: () => void;
  /** Closes it, carrying `programmatic` and the result given. */
  close: (result?: string) => void;
  /** Moves focus into the layer, as opening does. */
  focus: () => void;
  /** The panel, once it is in the document. */
  readonly content: HTMLElement | null;
}

/** What an application sets once for every dialog under it. */
export interface DialogDefaults {
  /** The platform's way back — a phone's gesture, a browser's button — closes a modal layer. */
  back: DialogDismissPolicy;
  escape: DialogDismissPolicy;
  fullScreen: DialogFullScreen;
  modal: boolean;
  mount: DialogMount;
  outsidePress: DialogDismissPolicy;
  placement: DialogPlacement;
  scroll: DialogScroll;
  size: DialogSize;
  surface: DialogSurface;
}

export interface DialogDefaultsProviderProps extends Partial<DialogDefaults> {
  children?: ReactNode | undefined;
}

/** Which of the two members a layer is. */
export type DialogMember = 'dialog' | 'alertDialog';

/** What the family hands its own parts. */
export interface DialogContextValue {
  /** Marks a part as present, so the content wires only what was rendered. */
  announce: (part: 'title' | 'description' | 'cancel', node: HTMLElement | null) => () => void;
  /** Asks to close, carrying the reason, the result and the event. */
  close: (reason: DialogOpenReason, result: string | undefined, source: unknown) => void;
  /** The consumer's parent for this layer, or nothing for the shared root. */
  container: Element | null | undefined;
  descriptionId: string;
  back: DialogDismissPolicy;
  escape: DialogDismissPolicy;
  finalFocus: DialogFinalFocus | undefined;
  fullScreen: DialogFullScreen;
  /** Whether the reader has taken the layer, which the stylesheet keys on. */
  fullscreen: boolean;
  /** Whether the header renders the control that takes it. */
  fullscreenToggle: boolean;
  /** Asks to take the layer or give it back, carrying the reason. */
  setFullscreen: (next: boolean, reason: DialogFullscreenReason, source: unknown) => void;
  initialFocus: DialogInitialFocus;
  loading: boolean;
  member: DialogMember;
  modal: boolean;
  /** Whether the layer belongs in the document at all. */
  mounted: boolean;
  mount: DialogMount;
  /**
   * The trigger, the panel and the cancel action, once each is in the document.
   * One stable object for the life of the family, which is what lets it sit on
   * a memoised context value without changing its identity every render.
   */
  nodes: {
    cancel: HTMLElement | null;
    content: HTMLElement | null;
    trigger: HTMLElement | null;
  };
  /** What the consumer asked for, which the trigger reports. */
  open: boolean;
  /** Asks to open, carrying the reason and the event. */
  openWith: (reason: DialogOpenReason, source: unknown) => void;
  outsidePress: DialogDismissPolicy;
  placement: DialogPlacement;
  /** Records the panel, which the layer's focus scope is built on. */
  registerContent: (node: HTMLElement | null) => void;
  /** Records the layer, which presence measures its own exit on. */
  registerLayer: (node: HTMLElement | null) => void;
  /** Records the trigger, which is the layer's branch and its focus origin. */
  registerTrigger: (node: HTMLElement | null) => void;
  scroll: DialogScroll;
  size: DialogSize;
  surface: DialogSurface;
  titleId: string;
  tone: DialogTone | undefined;
  triggerId: string;
  /**
   * What the stylesheet keys on, which is one frame behind what was asked: a
   * layer that appears already open has no closed style to transition from.
   */
  visible: boolean;
  /**
   * Whether the layer takes focus and the pointer. `entering` counts: the
   * focus scope enters in that frame, and a layer still `inert` then refuses
   * the initial focus and leaves it on `body`.
   */
  interactive: boolean;
  /** The family's words in the language in force, with this layer's `messages` laid over them. */
  t: FamilyTranslator<DialogMessages>;
}

/** What the two members share. */
interface DialogOwnProps {
  children?: ReactNode | undefined;
  /** The consumer's value. Present at all puts the layer in controlled mode. */
  open?: boolean | undefined;
  /** The value an uncontrolled layer starts from, read once. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: DialogChangeRequest) => void) | undefined;
  /**
   * After the layer's entrance or exit has ended: `true` once it is settled
   * open, `false` once it has left. An application that unmounts the dialog
   * on close waits for `false`, so the exit runs.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  size?: DialogSize | undefined;
  placement?: DialogPlacement | undefined;
  scroll?: DialogScroll | undefined;
  surface?: DialogSurface | undefined;
  mount?: DialogMount | undefined;
  fullScreen?: DialogFullScreen | undefined;
  escape?: DialogDismissPolicy | undefined;
  /**
   * The platform's way back — a phone's gesture, a browser's button — closes
   * the layer instead of leaving the page, while the layer is modal.
   */
  back?: DialogDismissPolicy | undefined;
  /** Whether the layer's content is still on its way. */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * corner controls' names (`close`, `fullScreen`).
   */
  messages?: PartialMessages<DialogMessages> | undefined;
  /** A parent for this layer alone, instead of the shared portal root. */
  container?: Element | null | undefined;
  initialFocus?: DialogInitialFocus | undefined;
  finalFocus?: DialogFinalFocus | undefined;
  ref?: Ref<DialogHandle> | undefined;
}

export interface DialogProps extends DialogOwnProps {
  /**
   * Whether the background is inert, the scroll is locked and focus is
   * contained. A non-modal layer writes no `aria-modal`, which the APG requires
   * of anything that does not actually make the background unreachable.
   */
  modal?: boolean | undefined;
  outsidePress?: DialogDismissPolicy | undefined;
  /**
   * Whether the header renders the control that takes the layer. Off, because
   * a dialog holds one task and most tasks are the size the consumer chose:
   * the control is for the panel a reader wants the whole screen for.
   *
   * `fullScreen` is the other question and stays separate — it is the
   * responsive rule the consumer set in advance, and this is the reader's own.
   */
  fullscreenToggle?: boolean | undefined;
  /** The consumer's value. Present at all puts the state in controlled mode. */
  fullscreen?: boolean | undefined;
  /** The value an uncontrolled layer starts from, read once. */
  defaultFullscreen?: boolean | undefined;
  onFullscreenChange?:
    ((fullscreen: boolean, request: DialogFullscreenRequest) => void) | undefined;
}

/**
 * An alert dialog fixes the two rules `docs/component-features.md` §8 states:
 * outside press never closes it, and it is always modal. They are not props,
 * because Ark and React Aria make the role a prop and a consumer who sets it
 * and forgets the dismissal policy ships a destructive confirmation a stray
 * click dismisses.
 */
export interface AlertDialogProps extends DialogOwnProps {
  tone?: DialogTone | undefined;
}

/** What `render` receives for a part. */
type PartProps<Element extends HTMLElement> = HTMLAttributes<Element> & {
  'data-part': string;
};

export type DialogRootProps = PartProps<HTMLDivElement> & { 'data-ui': 'dialog' };
export type DialogTriggerRootProps = ComponentPropsWithRef<'button'> & { 'data-part': 'trigger' };

interface WithRender<RootProps> {
  /** Replaces the rendered element. The props are the ones the part writes. */
  render?: ((props: RootProps) => ReactNode) | undefined;
}

export interface DialogTriggerProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children'>, WithRender<DialogTriggerRootProps> {
  children?: ReactNode | undefined;
}

/**
 * `render` receives props written against `HTMLElement`, so the panel can be
 * any element: a `form` that submits, a `section` that is a landmark.
 */
export interface DialogContentProps
  extends ComponentPropsWithRef<'div'>, WithRender<PartProps<HTMLElement>> {}

export interface DialogHeaderProps
  extends ComponentPropsWithRef<'header'>, WithRender<PartProps<HTMLElement>> {}

export interface DialogTitleProps
  extends ComponentPropsWithRef<'h2'>, WithRender<PartProps<HTMLHeadingElement>> {}

export interface DialogDescriptionProps
  extends ComponentPropsWithRef<'p'>, WithRender<PartProps<HTMLParagraphElement>> {}

export interface DialogBodyProps
  extends ComponentPropsWithRef<'div'>, WithRender<PartProps<HTMLDivElement>> {}

export interface DialogFooterProps
  extends ComponentPropsWithRef<'footer'>, WithRender<PartProps<HTMLElement>> {}

interface ClosingButtonProps
  extends ComponentPropsWithRef<'button'>, WithRender<ComponentPropsWithRef<'button'>> {
  /** The result the close carries out, which is the platform's `returnValue`. */
  value?: string | undefined;
}

export type DialogCloseProps = ClosingButtonProps;
export type AlertDialogCancelProps = ClosingButtonProps;
export type AlertDialogActionProps = ClosingButtonProps;

export interface AlertDialogIconProps
  extends ComponentPropsWithRef<'span'>, WithRender<PartProps<HTMLSpanElement>> {}
