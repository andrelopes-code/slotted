import type { FloatingCorner, FloatingPlace } from '@slotted/core/floating-panel';
import type { FamilyTranslator, FloatingPanelMessages, PartialMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent, ReactNode } from 'react';

export type { FloatingCorner, FloatingPlace } from '@slotted/core/floating-panel';

export interface FloatingPanelProps extends Omit<ComponentPropsWithoutRef<'section'>, 'children'> {
  children?: ReactNode | undefined;
  /** Whether the panel is drawn. The page under it stays usable either way. */
  open: boolean;
  /** Asked with `false` on Escape inside the panel and on its close control. */
  onOpenChange: (open: boolean) => void;
  /** The corner the panel stands in until its first move, in the reading direction. Defaults to `bottom-end`. */
  defaultPlace?: FloatingCorner | undefined;
  /** A controlled place, its top-left corner in viewport pixels; drawn inside the viewport. */
  place?: FloatingPlace | undefined;
  /** Pixels an arrow key on the grip moves the panel. Defaults to 8. */
  step?: number | undefined;
  /** Pixels an arrow key with Shift moves it. Defaults to 32. */
  largeStep?: number | undefined;
  /** Fired once at the end of a move, by pointer or by key, for the application to store. */
  onPlaceChange?: ((place: FloatingPlace) => void) | undefined;
  /** Words laid over the catalog of the language in force. */
  messages?: PartialMessages<FloatingPanelMessages> | undefined;
}

export type FloatingPanelHandleProps = ComponentPropsWithoutRef<'div'>;
export type FloatingPanelTitleProps = ComponentPropsWithoutRef<'h2'>;
export type FloatingPanelCloseProps = Omit<ComponentPropsWithoutRef<'button'>, 'type'>;
export type FloatingPanelBodyProps = ComponentPropsWithoutRef<'div'>;

/** What the panel hands its parts. */
export interface FloatingPanelContextValue {
  close: () => void;
  move: (event: KeyboardEvent) => void;
  startDrag: (event: PointerEvent<HTMLElement>) => void;
  t: FamilyTranslator<FloatingPanelMessages>;
  titleId: string;
}
