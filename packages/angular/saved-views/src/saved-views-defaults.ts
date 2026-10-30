import { Injectable } from '@angular/core';
import type { GridView, SavedViewsState } from '@slotted/core/grid';
import type { ChangeRequest } from '@slotted/core/state';

/** What the reader did. One state object answers seven different presses. */
export type SavedViewsAction =
  'apply' | 'save' | 'create' | 'rename' | 'delete' | 'default' | 'revert';

/** Why the views moved. `submit` is a form; `remove` a confirmed delete. */
export type SavedViewsReason = 'pointer' | 'keyboard' | 'submit' | 'remove' | 'programmatic';

/** Why the layer opened or closed: the popover's own reasons. */
export type SavedViewsOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'programmatic'
>;

/**
 * The request every change carries: the state asked for, the one it
 * replaces, the reason, what the reader did, the originating event, and a
 * refusal that stops the change before anything commits.
 */
export interface SavedViewsRequest {
  readonly value: SavedViewsState;
  readonly previous: SavedViewsState;
  readonly reason: SavedViewsReason;
  readonly action: SavedViewsAction;
  readonly source?: Event | undefined;
  readonly cancelled: boolean;
  /** Refuses the request. Nothing commits and no view is applied. */
  cancel(): void;
}

/** What `viewApply` emits: the view to write into the grid, and the request that caused it. */
export interface SavedViewApply {
  readonly view: GridView;
  readonly request: SavedViewsRequest;
}

@Injectable({ providedIn: 'root' })
export class SlSavedViewsIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-saved-views-${this.count}`;
  }
}

let counter = 0;

/** `crypto.randomUUID()` where the platform has it, and a counter otherwise. */
export function newSavedViewId(): string {
  const crypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  counter += 1;
  return `view-${Date.now().toString(36)}-${counter}`;
}
