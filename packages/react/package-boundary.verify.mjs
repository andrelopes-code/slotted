import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

import { LAYER_ORDER_STATEMENT } from '@slotted/theme/layer-order';

const packageDirectory = fileURLToPath(new URL('.', import.meta.url));
const distDirectory = join(packageDirectory, 'dist');
const forbiddenPattern = /storybook-workbench|@storybook|fontsource|@testing-library/i;
const textArtifactPattern = /\.(?:css|d\.ts|html|js|json|map)$/;

function collectTextArtifacts(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return collectTextArtifacts(path);
    return textArtifactPattern.test(entry.name) ? [path] : [];
  });
}

const violations = collectTextArtifacts(distDirectory).flatMap((path) => {
  const content = readFileSync(path, 'utf8');
  return content.match(forbiddenPattern) ? [relative(packageDirectory, path)] : [];
});

/**
 * A declaration file is read by the consumer's compiler, which resolves every
 * module it names — a side-effect import included. A package the manifest
 * does not install for the consumer, such as the `@slotted/styles`
 * devDependency, then fails their type check unless `skipLibCheck` hides it.
 */
const manifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'));
const installed = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
]);
const specifierPatterns = [
  /^\s*import\s+['"]([^'"]+)['"]/gm,
  /^\s*(?:import|export|\})[^'"\n]*\bfrom\s+['"]([^'"]+)['"]/gm,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];
const packageOf = (specifier) =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');
const undeclaredImports = collectTextArtifacts(join(distDirectory, 'types'))
  .filter((path) => path.endsWith('.d.ts'))
  .flatMap((path) => {
    const content = readFileSync(path, 'utf8');
    return specifierPatterns
      .flatMap((pattern) => [...content.matchAll(pattern)].map((match) => match[1]))
      .filter((specifier) => !specifier.startsWith('.') && !installed.has(packageOf(specifier)))
      .map((specifier) => `${relative(packageDirectory, path)}: ${specifier}`);
  });

const bundledStyles = readFileSync(join(distDirectory, 'styles.css'), 'utf8');
/**
 * Canaries for "the bundled stylesheet still carries the families it imports".
 * They are written in the public identifier because a class name is not
 * contract, and the minifier drops the quotes an authored selector keeps, so
 * both sides are normalised the same way.
 */
const requiredSelectors = ['[data-ui-button]{', '[data-ui-divider]{', '@layer slotted.components{'];
const normalize = (css) => css.replace(/\s+/g, '').replace(/['"]/g, '');
const normalizedStyles = normalize(bundledStyles);
const missingSelectors = requiredSelectors.filter(
  (selector) => !normalizedStyles.includes(normalize(selector)),
);

/**
 * Lightning CSS lowers `light-dark()` for engines older than the build target
 * into `var(--lightningcss-light, …) var(--lightningcss-dark, …)`, and declares
 * the pair only beside a `color-scheme` it compiles. The theme writes its
 * `color-scheme` at runtime, so a read of the pair here resolves to nothing.
 */
const lowered = [...new Set(bundledStyles.match(/--lightningcss-[a-z-]+/g) ?? [])];

if (lowered.length > 0) {
  console.error(
    `The bundled stylesheet reads variables no shipped stylesheet declares: ${lowered.join(', ')}`,
  );
  process.exitCode = 1;
}

if (!bundledStyles.startsWith(LAYER_ORDER_STATEMENT)) {
  console.error('The bundled stylesheet does not open with the published layer order.');
  process.exitCode = 1;
}

if (missingSelectors.length > 0) {
  console.error('The bundled stylesheet lost required rules:');
  for (const selector of missingSelectors) console.error(`- ${selector}`);
  process.exitCode = 1;
}

if (violations.length > 0) {
  console.error('Private Storybook dependencies leaked into @slotted/react artifacts:');
  for (const path of violations) console.error(`- ${path}`);
  process.exitCode = 1;
}

if (undeclaredImports.length > 0) {
  console.error('Declaration files import packages @slotted/react does not install:');
  for (const entry of undeclaredImports) console.error(`- ${entry}`);
  process.exitCode = 1;
}

/**
 * A CommonJS module bundled into the library reaches its own dependencies
 * through a `require` shim, and a browser has no `require`: the copy of
 * `react-dom` the build once bundled threw "Calling `require` for "react"" in
 * every consumer's browser bundle the moment a portal rendered. The
 * frameworks the consumer installs stay external, and no shim may ship.
 */
const bundledCommonJs = collectTextArtifacts(distDirectory)
  .filter((path) => path.endsWith('.js'))
  .filter((path) => readFileSync(path, 'utf8').includes('Calling `require` for'))
  .map((path) => relative(packageDirectory, path));

if (bundledCommonJs.length > 0) {
  console.error(
    'A CommonJS module was bundled into @slotted/react, with a require shim a browser cannot run:',
  );
  for (const path of bundledCommonJs) console.error(`- ${path}`);
  process.exitCode = 1;
}

/**
 * A family has its own stylesheet. An application that renders Button, Field
 * and TextField loads their sheets and not the 1.5 MB of every family: a login
 * page blocked its first paint on all of it, and every element's style was
 * matched against the whole sheet. No module imports a stylesheet: Node
 * cannot load one unbundled.
 */
const loginCss = ['button', 'field', 'text-field'].reduce(
  (total, family) => total + readFileSync(join(distDirectory, 'styles', `${family}.css`)).length,
  0,
);
const LOGIN_BUDGET = 150 * 1024;

if (loginCss > LOGIN_BUDGET) {
  console.error(
    `Button, Field and TextField bring ${loginCss} bytes of CSS; the budget is ${LOGIN_BUDGET}.`,
  );
  process.exitCode = 1;
}

const importsCss = collectTextArtifacts(distDirectory)
  .filter((path) => path.endsWith('.js'))
  .filter((path) => /^import\s+["'][^"']+\.css["']/m.test(readFileSync(path, 'utf8')))
  .map((path) => relative(packageDirectory, path));

if (importsCss.length > 0) {
  console.error('Modules import a stylesheet, which Node cannot load unbundled:');
  for (const path of importsCss) console.error(`- ${path}`);
  process.exitCode = 1;
}

for (const family of ['button', 'field', 'text-field']) {
  const sheet = join(distDirectory, 'styles', `${family}.css`);
  if (!readFileSync(sheet, 'utf8').startsWith(LAYER_ORDER_STATEMENT)) {
    console.error(`dist/styles/${family}.css does not open with the published layer order.`);
    process.exitCode = 1;
  }
}
