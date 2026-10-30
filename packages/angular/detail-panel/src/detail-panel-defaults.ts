import { inject, Injectable, InjectionToken } from '@angular/core';

/** Every section in the flow with a heading each, or a strip with one section shown. */
export type DetailPanelLayout = 'stacked' | 'tabs';

/** Which side the aside column takes above 600 pixels; `none` when the consumer renders no aside. */
export type DetailPanelAside = 'end' | 'start' | 'none';

/** The heading rank the page-header defaults to. Stacked sections take the rank below. */
export type DetailPanelLevel = '1' | '2' | '3';

/** The page-header's size default, the sections' size, the body's gap and inset. */
export type DetailPanelSize = 'sm' | 'md' | 'lg';

/** Who scrolls: the host, or the root itself. */
export type DetailPanelScroll = 'ancestor' | 'self';

/** Under `tabs`, when a section's content exists. Inert under `stacked`. */
export type DetailPanelMount = 'active' | 'lazy' | 'eager';

/** Whether the record is there. Under either failure the columns give way to the message. */
export type DetailPanelStatus = 'ready' | 'not-found' | 'error';

/** Why the current section moved. */
export type DetailPanelSectionReason = 'pointer' | 'keyboard' | 'programmatic';

export interface DetailPanelDefaults {
  aside: DetailPanelAside;
  layout: DetailPanelLayout;
  level: DetailPanelLevel;
  mount: DetailPanelMount;
  scroll: DetailPanelScroll;
  size: DetailPanelSize;
}

const FALLBACK: DetailPanelDefaults = {
  aside: 'end',
  layout: 'stacked',
  level: '2',
  mount: 'active',
  scroll: 'ancestor',
  size: 'md',
};

export const DETAIL_PANEL_DEFAULTS = new InjectionToken<DetailPanelDefaults>(
  'slotted detail-panel defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its records read — stacked or tabbed, the
 * aside's side, the rank, the size, who scrolls — rather than repeating them
 * on every screen. A panel that states any of them itself still wins. Its
 * words come from the language in force (`provideSlotted`).
 */
export function provideDetailPanelDefaults(defaults: Partial<DetailPanelDefaults>) {
  return {
    provide: DETAIL_PANEL_DEFAULTS,
    useFactory: (): DetailPanelDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectDetailPanelDefaults(): DetailPanelDefaults {
  return inject(DETAIL_PANEL_DEFAULTS);
}

@Injectable({ providedIn: 'root' })
export class SlDetailPanelIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-detail-panel-${this.count}`;
  }
}
