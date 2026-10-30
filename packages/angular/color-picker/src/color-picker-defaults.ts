import { inject, InjectionToken } from '@angular/core';
import type { ColorFormat } from '@slotted/core/color';

export type { ColorFormat };
export type ColorPickerSize = 'sm' | 'md' | 'lg';

export interface ColorPickerDefaults {
  format: ColorFormat;
  presets: readonly string[] | undefined;
  size: ColorPickerSize;
}

const FALLBACK: ColorPickerDefaults = {
  format: 'hex',
  presets: undefined,
  size: 'md',
};

export const COLOR_PICKER_DEFAULTS = new InjectionToken<ColorPickerDefaults>(
  'slotted color picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once its notation, its palette and its size. The
 * words come from the language in force (`provideSlotted`).
 */
export function provideColorPickerDefaults(defaults: Partial<ColorPickerDefaults>) {
  return {
    provide: COLOR_PICKER_DEFAULTS,
    useFactory: (): ColorPickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectColorPickerDefaults(): ColorPickerDefaults {
  return inject(COLOR_PICKER_DEFAULTS);
}
