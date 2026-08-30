export const BUTTON_VARIANTS = ['accent', 'secondary', 'success', 'warning', 'danger'] as const;
export const BUTTON_FILLS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export const BUTTON_GROUP_ORIENTATIONS = ['horizontal', 'vertical'] as const;

export const BUTTON_DEFAULTS = { variant: 'accent', fill: 'solid', size: 'md' } as const;
export const ICON_BUTTON_DEFAULTS = { variant: 'secondary', fill: 'ghost', size: 'md' } as const;
export const TOGGLE_BUTTON_DEFAULTS = {
  variant: 'secondary',
  fill: 'outline',
  size: 'md',
} as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonFill = (typeof BUTTON_FILLS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonGroupOrientation = (typeof BUTTON_GROUP_ORIENTATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';
