import { inject, InjectionToken } from '@angular/core';

/** Which way the bar runs. */
export type ToolbarOrientation = 'horizontal' | 'vertical';

/** The step the bar's own inset, gap and separator sit at. */
export type ToolbarSize = 'sm' | 'md' | 'lg';

/** Whether the bar paints a ground of its own. */
export type ToolbarVariant = 'plain' | 'outline';

/**
 * What a bar does with more controls than it has room for. `wrap` keeps every
 * one of them visible on a second row, and the arrows wrap from row to row
 * because the item list is linear.
 */
export type ToolbarOverflowMode = 'wrap' | 'scroll' | 'menu';

export interface ToolbarDefaults {
  loop: boolean;
  orientation: ToolbarOrientation;
  overflow: ToolbarOverflowMode;
  size: ToolbarSize;
  variant: ToolbarVariant;
}

const FALLBACK: ToolbarDefaults = {
  loop: true,
  orientation: 'horizontal',
  overflow: 'wrap',
  size: 'md',
  variant: 'plain',
};

export const TOOLBAR_DEFAULTS = new InjectionToken<ToolbarDefaults>('slotted toolbar defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its bars are drawn and how they behave — a
 * product whose bars are all framed and compact says so in one place rather
 * than on every bar. A bar that states any of them itself still wins.
 */
export function provideToolbarDefaults(defaults: Partial<ToolbarDefaults>) {
  return {
    provide: TOOLBAR_DEFAULTS,
    useFactory: (): ToolbarDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a toolbar renders as here, before it states anything of its own. */
export function injectToolbarDefaults(): ToolbarDefaults {
  return inject(TOOLBAR_DEFAULTS);
}
