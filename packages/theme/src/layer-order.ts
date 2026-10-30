/**
 * `slotted` is the only top-level layer. `theme-rules` holds the rules a theme
 * carries, after the family stylesheets they adjust, so a theme rule wins by
 * layer order and never by specificity. `reset` and `tokens` hold no rule;
 * they are declared because a layer takes its position from the first
 * mention of its name.
 */
export const LAYER_NAMES = ['reset', 'tokens', 'theme', 'components', 'theme-rules'] as const;

export const LAYER_ORDER_STATEMENT = `@layer ${LAYER_NAMES.map((name) => `slotted.${name}`).join(', ')};\n`;
