import { defineTheme, recipes } from '@slotted/theme';

import values from '../../../../themes/src/default/values.json' with { type: 'json' };

/**
 * Exercises every part of a theme the compiler handles: seeds in both
 * notations, the standard recipe, component tokens, a font, a rule file with
 * keyframes, and a glyph replaced by another drawing.
 */
export default defineTheme({
  ...values,
  name: 'proof',
  seeds: {
    accent: 'oklch(0.55 0.2 300)',
    neutral: '#78716c',
    success: '#15803d',
    info: 'oklch(0.6 0.15 255)',
    warning: '#facc15',
    danger: '#dc2626',
  },
  recipe: recipes.standard,
  base: { ...values.base, '--slotted-icon-check': values.base['--slotted-icon-plus'] },
  components: {
    '--slotted-text-field-radius': '0px',
    '--slotted-card-radius': 'var(--slotted-radius-lg)',
  },
  fonts: [{ family: 'Proof Sans', src: "local('Arial')" }],
  rules: [new URL('./rules.css', import.meta.url)],
});
