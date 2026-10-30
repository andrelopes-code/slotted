import { DestroyRef, signal } from '@angular/core';
import type { SplitterValueRequest } from '@slotted/angular/splitter';

function rootRem(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element.ownerDocument.documentElement).fontSize) || 16;
}

/**
 * The width of a workspace's queue beside a `splitter`, held in pixels. The
 * family speaks fractions of the row; a fraction kept as the window is resized
 * widens and narrows the queue with the window, and a fraction restored from a
 * wider window opens the queue at another width. The row is watched, and the
 * fraction is rewritten so the queue keeps the width the reader left it at —
 * or the opening width, until they move it. A double click returns it to the
 * opening width.
 *
 * Only a settled move is kept: a drag's end, an arrow press. A fraction the
 * bar brings inside its limits as the window narrows is not the reader's, and
 * the queue returns to their width when the window widens again.
 */
export class PaneSplit {
  /** The fraction the bar holds, bound `[(value)]`. */
  readonly value = signal(0.3);
  /** The opening width as a fraction of the row, bound `[defaultValue]`. */
  readonly opening = signal(0.3);

  private row = 0;
  private rem = 16;
  private pixels: number | null;

  constructor(
    private readonly key: string,
    private readonly openingRem: number,
  ) {
    this.pixels = this.stored();
  }

  /** Watches the row the queue and the bar stand in; called once it is rendered. */
  observe(row: HTMLElement, destroyRef: DestroyRef): void {
    this.rem = rootRem(row);
    this.measure(row.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => this.measure(entry?.contentRect.width ?? 0));
    observer.observe(row);
    destroyRef.onDestroy(() => observer.disconnect());
  }

  /** A drag that settled: its fraction, as pixels of the row it was made in. */
  keep(value: number): void {
    if (this.row <= 0) return;
    this.pixels = value * this.row;
    try {
      localStorage.setItem(this.key, String(Math.round(this.pixels)));
    } catch {
      // Storage refused (a private window): the width lasts for this visit only.
    }
  }

  /** An arrow press is a settled move of its own: `resizeEnd` answers a drag only. */
  keyed(request: SplitterValueRequest): void {
    if (request.reason === 'keyboard') this.keep(request.value);
  }

  /** A double click returns to the opening width, which is the reader's again. */
  reset(): void {
    this.pixels = null;
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Nothing was stored.
    }
  }

  private measure(width: number): void {
    if (width <= 0) return;
    this.row = width;
    const opening = Math.min(1, (this.openingRem * this.rem) / width);
    this.opening.set(opening);
    this.value.set(this.pixels === null ? opening : Math.min(1, this.pixels / width));
  }

  private stored(): number | null {
    try {
      const value = Number(localStorage.getItem(this.key));
      return value > 0 ? value : null;
    } catch {
      return null;
    }
  }
}
