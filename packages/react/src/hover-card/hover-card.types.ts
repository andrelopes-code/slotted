import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { PopoverContentProps, PopoverHandle, PopoverProps } from '../popover';

/** The ref a part hands to `render`, as `menu` and `popover` declare it. */
export type PartRef = (node: HTMLElement | null) => void;

/**
 * The popover's reasons, plus `blur`: focus leaving the trigger is the one
 * way this family closes that the popover never does.
 */
export type HoverCardOpenReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'blur' | 'dismiss' | 'programmatic';

export type HoverCardChangeRequest = ChangeRequest<boolean>;

/** Every decision an application takes once rather than per card. */
export interface HoverCardDefaults {
  /** Milliseconds the pointer rests on the trigger before the card opens. */
  openDelay: number;
  /** Milliseconds after the pointer has left trigger and card before it closes. */
  closeDelay: number;
  /**
   * Whether the card holds controls a keyboard reader can reach. On, `Tab`
   * from the open trigger enters it, the panel is a `dialog` and the trigger
   * says so; off, the card is a `presentation` the link never announces.
   */
  navigable: boolean;
  /** The card never opens. The link still navigates. */
  disabled: boolean;
}

export interface HoverCardDefaultsProviderProps extends Partial<HoverCardDefaults> {
  children?: ReactNode;
}

/**
 * The popover's props minus the two the family decides — the card never takes
 * focus, and its state is this family's — plus the family's four.
 */
export interface HoverCardProps
  extends
    Omit<PopoverProps, 'autoFocus' | 'open' | 'defaultOpen' | 'onOpenChange' | 'ref' | 'disabled'>,
    Partial<HoverCardDefaults> {
  children?: ReactNode;
  /** The consumer's value. Present at all puts the card in controlled mode. */
  open?: boolean | undefined;
  /** The value an uncontrolled card starts from, read once. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: HoverCardChangeRequest) => void) | undefined;
  ref?: Ref<PopoverHandle> | undefined;
}

/**
 * What `render` receives for the trigger: the anchor's props, extended with
 * the identity and the state the family writes, and the wiring when the card
 * is navigable. `ref` is part of it because the trigger is the anchor the
 * card is measured against.
 */
export interface HoverCardTriggerRootProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'aria-haspopup' | 'aria-expanded'
> {
  ref?: PartRef | undefined;
  'data-ui': 'hover-card';
  'data-part': 'root';
  'data-open'?: '' | undefined;
  'aria-haspopup'?: 'dialog' | undefined;
  'aria-expanded'?: boolean | undefined;
  'aria-controls'?: string | undefined;
}

/** The family owns the two popup attributes: they follow `navigable`. */
export interface HoverCardTriggerProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'aria-haspopup' | 'aria-expanded'
> {
  /** The consumer's own element in place of the `a`: a `Link`, an avatar button. */
  render?: ((props: HoverCardTriggerRootProps) => ReactNode) | undefined;
}

/**
 * The layer and the panel in one, with the family's pointer handlers on the
 * layer. The props are the panel's: a consumer's `aria-label` and `ref` reach
 * the element that carries the role.
 */
export type HoverCardContentProps = PopoverContentProps;

/** What the family hands its trigger and its content. */
export interface HoverCardContextValue {
  closeDelay: number;
  disabled: boolean;
  navigable: boolean;
  open: boolean;
  openDelay: number;
  /** Cancels a pending open or close. */
  cancelPending: () => void;
  /** Opens after `openDelay`, unless something cancels it first. */
  openAfterDelay: (source?: unknown) => void;
  /** Closes after `closeDelay`, unless the pointer comes back first. */
  closeAfterDelay: (source?: unknown) => void;
  /**
   * The grace area: the card stays while the pointer's path from `origin`
   * still points into `target`, and closes once it does not — unless
   * `stillOver` says the pointer is on the trigger or the card after all.
   */
  graceToward: (
    target: () => DOMRect | null,
    origin: () => DOMRect | null,
    stillOver: () => boolean,
    source?: unknown,
  ) => void;
  /** Focus the family put back on the trigger must not reopen the card. */
  suppressFocusOpen: { current: boolean };
  toggle: (open: boolean, reason: HoverCardOpenReason, source?: unknown) => void;
}
