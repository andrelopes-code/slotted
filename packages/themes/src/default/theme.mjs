import { defineTheme, recipes } from '@slotted/theme';

import values from './values.json' with { type: 'json' };

/**
 * The theme the library ships by default. Its colors are `recipes.standard`
 * on these five seeds; `values.json` holds every value the recipe does not
 * derive, glyphs included (written by `scripts/generate-icon-glyphs.mjs`).
 */
export default defineTheme({
  name: 'default',
  seeds: {
    accent: '#1d4ed8',
    neutral: '#64748b',
    success: '#15803d',
    info: 'oklch(0.6 0.15 255)',
    warning: '#facc15',
    danger: '#dc2626',
  },
  recipe: recipes.standard,
  ...values,
});
