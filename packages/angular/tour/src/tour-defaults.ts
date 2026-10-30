import type { PartialMessages, TourMessages } from '@slotted/core/i18n';
import type { TourMissing, TourOutcome, TourTarget } from '@slotted/core/tour';
import type { ChangeRequest } from '@slotted/core/state';
import { inject, Injectable, InjectionToken } from '@angular/core';
import type { Provider, TemplateRef } from '@angular/core';

export type { TourMissing, TourOutcome, TourTarget };

export type TourSize = 'sm' | 'md' | 'lg';

export type TourSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

export type TourAlign = 'start' | 'center' | 'end';

/** `auto` follows the viewport's size class; the other two decide it. */
export type TourLayout = 'auto' | 'compact' | 'regular';

/** Somewhere to put the focus when the tour closes: an element, or a selector read in the document. */
export type TourFocusTarget = Element | string;

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
 * The request emitted before the tour opens or closes. A close carries the
 * outcome, as `slDialog` carries its `result`.
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

export interface TourStepActions {
  prev?: boolean | undefined;
  next?: boolean | undefined;
  skip?: boolean | undefined;
  close?: boolean | undefined;
}

export interface TourStep {
  /** Unique in the tour; the value of `step`. */
  id: string;
  /** An element, a selector, a ref-like `{ current }` or a function. Absent for a centerd step. */
  target?: TourTarget;
  title: string;
  description?: string | undefined;
  /**
   * The step's body. A template renders lazily, only while its step is shown;
   * `<ng-template slTourStep="id">` in the tour's content does the same
   * without naming the template here.
   */
  content?: TemplateRef<unknown> | string | undefined;
  /** An image or a video above the header, as a template, or an image URL. */
  media?: TemplateRef<unknown> | string | undefined;
  side?: TourSide | undefined;
  align?: TourAlign | undefined;
  when?: (() => boolean) | undefined;
  prepare?: ((signal: AbortSignal) => void | Promise<void>) | undefined;
  interactive?: boolean | undefined;
  advanceOn?: string | undefined;
  spotlight?: boolean | undefined;
  /** Laid over the tour's words for this step: "Start tour", "Got it". */
  messages?: TourStepMessages | undefined;
  actions?: TourStepActions | undefined;
  /** Read aloud when the step arrives while focus is elsewhere. Defaults to the title. */
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

/**
 * `closeOnOutsidePress` is off: a press on the scrim is the easiest press on
 * the page to make by accident, and it would throw away where the reader was.
 * `targetTimeout` is zero: a wait shows nothing new, so a consumer whose
 * target renders late says how late.
 */
export const TOUR_FALLBACK: TourDefaults = {
  align: 'center',
  alignOffset: 0,
  arrow: true,
  arrowPadding: 12,
  autoFocus: true,
  closeOnEscape: true,
  closeOnOutsidePress: false,
  collisionPadding: 8,
  keyboardNavigation: true,
  layout: 'auto',
  missing: 'center',
  modal: true,
  scrollIntoView: true,
  side: 'bottom',
  sideOffset: 0,
  size: 'md',
  spotlight: true,
  targetTimeout: 0,
};

export const TOUR_DEFAULTS = new InjectionToken<TourDefaults>('slotted tour defaults', {
  providedIn: 'root',
  factory: () => TOUR_FALLBACK,
});

/**
 * An application decides once how its tours behave. A tour that states any of
 * it itself still wins, and so does a step. Its words come from the language
 * in force (`provideSlotted`).
 */
export function provideTourDefaults(defaults: Partial<TourDefaults>): Provider {
  return {
    provide: TOUR_DEFAULTS,
    useFactory: (): TourDefaults => ({ ...TOUR_FALLBACK, ...defaults }),
  };
}

/** What a tour renders as here, before it states anything of its own. */
export function injectTourDefaults(): TourDefaults {
  return inject(TOUR_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * two applications rendering in one server process must not share a sequence.
 */
@Injectable({ providedIn: 'root' })
export class SlTourIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-tour-${this.count}`;
  }
}
