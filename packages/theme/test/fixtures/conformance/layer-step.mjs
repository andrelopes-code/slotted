import { contract, flattenTheme, renderTheme } from '@slotted/theme';
import { themeConformance } from '@slotted/theme/conformance';

import proof from '../proof/theme.mjs';

/**
 * The proof theme with a dark layer 0.0155 above its page in OKLab lightness,
 * run through the conformance with `LAYER_STEP` as `thresholds.layerStep` when
 * it is set.
 */
/* Its rule file is a URL the CLI resolves; the layer check reads no rule. */
const theme = { ...proof, rules: [] };
const flat = flattenTheme(theme);
const dark = {
  ...flat.schemes.dark,
  '--slotted-surface': 'oklch(0.2 0.01 250)',
  '--slotted-surface-raised': 'oklch(0.2155 0.01 250)',
};
const layerStep = process.env['LAYER_STEP'];
themeConformance({
  contract,
  theme: { ...flat, schemes: { ...flat.schemes, dark } },
  css: renderTheme(theme),
  ...(layerStep === undefined ? {} : { thresholds: { layerStep: Number(layerStep) } }),
});
