import { defineTheme, recipes } from '@slotted/theme';

import values from '../../../../themes/src/default/values.json' with { type: 'json' };

export default defineTheme({
  ...values,
  name: 'cli-fixture',
  seeds: {
    accent: '#e11d48',
    neutral: '#64748b',
    success: '#15803d',
    info: 'oklch(0.6 0.15 255)',
    warning: '#facc15',
    danger: '#dc2626',
  },
  recipe: recipes.standard,
  rules: [new URL('./rules.css', import.meta.url), "[data-ui='button'] { border-radius: 9999px; }"],
});
