import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * When the layer exists. `active` builds it on opening and drops it once the
 * exit is over, `lazy` builds it on the first open and keeps it, `eager` builds
 * it up front and makes it inert.
 */
export type ActionSheetMount = 'active' | 'lazy' | 'eager';

/** Whether a dismissal source closes the sheet. */
export type ActionSheetDismissPolicy = 'close' | 'none';

/** The five tones `menu` paints an item in; `danger` is the destructive action. */
export type ActionSheetTone = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';

/** Why the sheet opened or closed. */
export type ActionSheetOpenReason =
  | 'pointer'
  | 'keyboard'
  | 'select'
  | 'dismiss'
  | 'escape'
  | 'outsidePress'
  | 'back'
  | 'programmatic';

/**
 * The request emitted before the sheet moves. `result` is the value of the item
 * chosen, present when `reason` is `select`.
 */
export interface ActionSheetChangeRequest {
  readonly value: boolean;
  readonly previous: boolean;
  readonly reason: ActionSheetOpenReason;
  readonly result?: string | undefined;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

/** What `(select)` carries. `preventDefault()` keeps the sheet open. */
export interface ActionSheetSelectEvent {
  readonly reason: 'pointer' | 'keyboard';
  readonly source: Event;
  readonly value: string | undefined;
  readonly defaultPrevented: boolean;
  preventDefault(): void;
}

export interface ActionSheetDefaults {
  back: ActionSheetDismissPolicy;
  closeOnSelect: boolean;
  escape: ActionSheetDismissPolicy;
  modal: boolean;
  mount: ActionSheetMount;
  outsidePress: ActionSheetDismissPolicy;
}

const FALLBACK: ActionSheetDefaults = {
  back: 'close',
  closeOnSelect: true,
  escape: 'close',
  modal: true,
  mount: 'active',
  outsidePress: 'close',
};

export const ACTION_SHEET_DEFAULTS = new InjectionToken<ActionSheetDefaults>(
  'slotted action sheet defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its sheets behave. A sheet that states any of
 * them itself still wins. The cancel's words come from the language in force
 * (`provideSlotted`).
 */
export function provideActionSheetDefaults(defaults: Partial<ActionSheetDefaults>) {
  return {
    provide: ACTION_SHEET_DEFAULTS,
    useFactory: (): ActionSheetDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectActionSheetDefaults(): ActionSheetDefaults {
  return inject(ACTION_SHEET_DEFAULTS);
}

/** Ids that are unique across every sheet in the application. */
@Injectable({ providedIn: 'root' })
export class SlActionSheetIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-action-sheet-${this.count}`;
  }
}
