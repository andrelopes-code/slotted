export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_TONES = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export const BUTTON_GROUP_ORIENTATIONS = ['horizontal', 'vertical'] as const;

export const BUTTON_DEFAULTS = { variant: 'solid', tone: 'accent', size: 'md' } as const;
export const ICON_BUTTON_DEFAULTS = { variant: 'ghost', tone: 'neutral', size: 'md' } as const;
export const TOGGLE_BUTTON_DEFAULTS = { variant: 'outline', tone: 'neutral', size: 'md' } as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonGroupOrientation = (typeof BUTTON_GROUP_ORIENTATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';
