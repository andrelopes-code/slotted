export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_TONES = ['accent', 'neutral', 'danger'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonType = 'button' | 'submit' | 'reset';
