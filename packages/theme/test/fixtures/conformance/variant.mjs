import { contract, extendTheme, flattenTheme, renderTheme } from '@slotted/theme';
import { themeConformance } from '@slotted/theme/conformance';

import proof from '../proof/theme.mjs';

/**
 * The proof theme with a `depth` axis whose `oled` value puts the dark page at
 * black and its raised layer `RAISED` above it in OKLab lightness (0.02 unless
 * set), run through the conformance.
 */
/* Its rule file is a URL the CLI resolves; the layer check reads no rule. */
const raised = Number(process.env['RAISED'] ?? 0.02);
const theme = extendTheme(
  { ...proof, rules: [] },
  {
    variants: {
      depth: {
        oled: {
          dark: {
            '--slotted-surface': { seed: 'neutral', l: 0, c: { scale: 0, max: 0 } },
            '--slotted-surface-raised': { seed: 'neutral', l: raised, c: { scale: 0, max: 0 } },
          },
        },
      },
    },
  },
  { name: 'proof-variant' },
);
themeConformance({ contract, theme: flattenTheme(theme), css: renderTheme(theme) });
