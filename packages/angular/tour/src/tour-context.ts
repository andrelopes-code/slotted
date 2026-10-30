import { InjectionToken } from '@angular/core';
import type { Signal, TemplateRef } from '@angular/core';
import type { FamilyTranslator, TourMessages } from '@slotted/core/i18n';

import type { TourOutcome, TourStep } from './tour-defaults';

/**
 * What a part reads from the tour around it. A token rather than the class,
 * so the parts and `sl-tour` — whose own template renders the parts — do not
 * import each other.
 */
export interface TourContext {
  readonly current: Signal<TourStep | null>;
  readonly position: Signal<number>;
  readonly total: Signal<number>;
  readonly first: Signal<boolean>;
  readonly last: Signal<boolean>;
  readonly pending: Signal<boolean>;
  readonly modal: Signal<boolean>;
  /** The family's words in the language in force, with the tour's and the step's `messages` laid over them. */
  readonly t: FamilyTranslator<TourMessages>;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly hasDescription: Signal<boolean>;
  readonly showPrev: Signal<boolean>;
  readonly showNext: Signal<boolean>;
  readonly showSkip: Signal<boolean>;
  readonly showClose: Signal<boolean>;
  /** The body the current step renders: its own template, one written for it in the tour, or text. */
  readonly bodyTemplate: Signal<TemplateRef<unknown> | null>;
  readonly mediaTemplate: Signal<TemplateRef<unknown> | null>;
  next(source?: Event): void;
  prev(source?: Event): void;
  close(outcome: TourOutcome, source?: Event, dismiss?: boolean): void;
  onKeyDown(event: KeyboardEvent): void;
}

export const SL_TOUR = new InjectionToken<TourContext>('slotted tour');
