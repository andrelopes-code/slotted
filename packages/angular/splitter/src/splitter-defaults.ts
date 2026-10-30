import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * Which way the bar's own line runs.
 *
 * The family holds no panels, so there is nothing else for `orientation` to
 * describe and `aria-orientation` takes the same value. A family that held
 * panels would have to say which of the two the word means — the panes are side
 * by side while the separator between them is vertical — and the two readings
 * are perpendicular. Here they cannot disagree.
 */
export type SplitterOrientation = 'vertical' | 'horizontal';

/**
 * A limit on how far the bar goes: a fraction of the container in `[0, 1]`, or
 * any CSS length resolved against the container at the moment of the clamp.
 *
 * Both, because both are real. Zag, Ark, PrimeNG and allotment are
 * percentage-only — Zag states the limitation outright — and none of them can
 * express "this navigation panel never goes below two hundred pixels", which is
 * the commonest constraint the family has.
 */
export type SplitterLimit = number | string;

/** Why the bar moved. */
export type SplitterValueReason = 'pointer' | 'keyboard' | 'programmatic';

interface Request<Value> {
  readonly value: Value;
  readonly previous: Value;
  readonly reason: SplitterValueReason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

/** The request the bar emits before its position moves. */
export type SplitterValueRequest = Request<number>;

/** The request the bar emits before it collapses or comes back. */
export type SplitterCollapsedRequest = Request<boolean>;

export interface SplitterDefaults {
  orientation: SplitterOrientation;
  min: SplitterLimit;
  max: SplitterLimit;
  collapsedValue: number;
}

const FALLBACK: SplitterDefaults = {
  collapsedValue: 0,
  max: 1,
  min: 0,
  orientation: 'vertical',
};

export const SPLITTER_DEFAULTS = new InjectionToken<SplitterDefaults>('slotted splitter defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how far its bars may travel, rather than
 * repeating the same floor on every one in a product. A workspace whose
 * navigation never goes below two hundred pixels says so here and nowhere else.
 *
 * None of the seven surveyed implementations has an equivalent: each takes its
 * limits per instance, so a product changing its floor changes every call site.
 */
export function provideSplitterDefaults(defaults: Partial<SplitterDefaults>) {
  return {
    provide: SPLITTER_DEFAULTS,
    useFactory: (): SplitterDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a splitter is here, before it states anything of its own. */
export function injectSplitterDefaults(): SplitterDefaults {
  return inject(SPLITTER_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlSplitterIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-splitter-${this.count}`;
  }
}
