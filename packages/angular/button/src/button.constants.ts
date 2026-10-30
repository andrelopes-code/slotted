/**
 * The five colors are tones in `docs/token-foundation.md`, so the axis that
 * selects one is `tone`. `variant` names what it actually selects: how the
 * chosen tone is painted.
 */
export const BUTTON_TONES = [
  'accent',
  'secondary',
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
] as const;
export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export const BUTTON_SHAPES = ['square', 'circle'] as const;
export const BUTTON_JUSTIFICATIONS = ['center', 'between'] as const;

export const BUTTON_DEFAULTS = { tone: 'accent', variant: 'solid', size: 'md' } as const;
export const BUTTON_LINK_DEFAULTS = BUTTON_DEFAULTS;
export const ICON_BUTTON_DEFAULTS = {
  tone: 'secondary',
  variant: 'ghost',
  size: 'md',
  shape: 'square',
} as const;
export const TOGGLE_BUTTON_DEFAULTS = {
  tone: 'secondary',
  variant: 'outline',
  size: 'md',
} as const;

export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonShape = (typeof BUTTON_SHAPES)[number];
export type ButtonJustify = (typeof BUTTON_JUSTIFICATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';
