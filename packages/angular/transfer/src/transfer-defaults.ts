import { inject, Injectable, InjectionToken } from '@angular/core';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { TransferDirection, TransferSide } from '@slotted/core/transfer';

export type { TransferDirection, TransferSide };

/** The type step of the lists, the search fields and the move buttons. */
export type TransferSize = 'sm' | 'md' | 'lg';

/**
 * How the two panes are laid out. `auto` answers the root's own inline size:
 * two columns from 36rem, one pane at a time below it.
 */
export type TransferLayout = 'auto' | 'columns' | 'steps';

export type TransferMoveReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;
export type TransferSelectionReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'select' | 'programmatic'
>;
export type TransferQueryReason = Extract<ChangeReason, 'keyboard' | 'clear' | 'programmatic'>;
export type TransferPaneReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;

/** A move asks once, with what moved and which way. */
export interface TransferMoveRequest extends ChangeRequest<readonly string[]> {
  readonly reason: TransferMoveReason;
  readonly direction: TransferDirection;
  readonly keys: readonly string[];
}

export interface TransferSelectionRequest extends ChangeRequest<readonly string[]> {
  readonly reason: TransferSelectionReason;
}

export interface TransferQueryRequest extends ChangeRequest<string> {
  readonly reason: TransferQueryReason;
}

export interface TransferPaneRequest extends ChangeRequest<TransferSide> {
  readonly reason: TransferPaneReason;
}

/** The shape the family reads without accessors. */
export interface TransferItem {
  key: string;
  label: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
}

/** What an application sets once for every transfer under it. */
export interface TransferDefaults {
  size: TransferSize;
  layout: TransferLayout;
  searchable: boolean;
  selectAll: boolean;
  reorderable: boolean;
  rows: number;
}

const FALLBACK: TransferDefaults = {
  size: 'md',
  layout: 'auto',
  searchable: true,
  selectAll: true,
  reorderable: false,
  rows: 8,
};

export const TRANSFER_DEFAULTS = new InjectionToken<TransferDefaults>('slotted transfer defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its transfers look. A transfer that states
 * any of it itself still wins. The words come from the language in force
 * (`provideSlotted`).
 */
export function provideTransferDefaults(defaults: Partial<TransferDefaults>) {
  return {
    provide: TRANSFER_DEFAULTS,
    useFactory: (): TransferDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectTransferDefaults(): TransferDefaults {
  return inject(TRANSFER_DEFAULTS);
}

@Injectable({ providedIn: 'root' })
export class SlTransferIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-transfer-${this.count}`;
  }
}
