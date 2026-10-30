import { readFile } from 'node:fs/promises';

import { contract, flattenTheme } from '@slotted/theme';
import { themeConformance } from '@slotted/theme/conformance';

import theme from '../src/default/theme.mjs';

themeConformance({
  contract,
  theme: flattenTheme(theme),
  css: await readFile(new URL('../dist/default.css', import.meta.url), 'utf8'),
});
