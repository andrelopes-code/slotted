import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { defineTheme, renderTheme } from '../dist/index.js';
import { validateRules } from './validate-rules.mjs';

/**
 * Builds one theme module into `<name>.css`, `<name>.js` and `<name>.d.ts`. A
 * rule given as a URL is read here, so the published module carries every
 * rule as text and `applyTheme` never fetches.
 */
export async function buildTheme(modulePath, outDir) {
  let theme;
  try {
    theme = (await import(pathToFileURL(resolve(modulePath)).href)).default;
  } catch (error) {
    // `defineTheme` refuses a rule given as text while the module evaluates, naming it by its
    // index; the build names the module too, as it does for the rules it validates itself.
    throw new Error(error.message.replaceAll(/^- rules\[/gm, `- ${modulePath}#rules[`), {
      cause: error,
    });
  }
  if (theme?.kind !== 'slotted-theme') {
    throw new Error(`${modulePath}: the default export is not a theme from defineTheme`);
  }
  const errors = [];
  const rules = [];
  for (const [index, rule] of (theme.rules ?? []).entries()) {
    const text = typeof rule === 'string' ? rule : await readFile(rule, 'utf8');
    const filename =
      typeof rule === 'string' ? `${modulePath}#rules[${index}]` : fileURLToPath(rule);
    errors.push(...validateRules(text, filename));
    rules.push(text);
  }
  if (errors.length > 0) {
    throw new Error(`Invalid theme rules:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
  const { kind: _kind, ...definition } = theme;
  const built = defineTheme({ ...definition, rules });
  const css = renderTheme(built);
  await mkdir(resolve(outDir), { recursive: true });
  await writeFile(resolve(outDir, `${built.name}.css`), css);
  await writeFile(
    resolve(outDir, `${built.name}.js`),
    `export default ${JSON.stringify(built, null, 2)};\n`,
  );
  await writeFile(
    resolve(outDir, `${built.name}.d.ts`),
    "import type { Theme } from '@slotted/theme';\n\ndeclare const theme: Theme;\nexport default theme;\n",
  );
  return { name: built.name, css };
}
