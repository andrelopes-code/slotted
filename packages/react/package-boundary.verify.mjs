import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

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

const bundledStyles = readFileSync(join(distDirectory, 'styles.css'), 'utf8');
const requiredSelectors = [
  '.slotted-button{',
  '.slotted-button-group{',
  '@layer slotted.components{',
];
const normalizedStyles = bundledStyles.replace(/\s+/g, '');
const missingSelectors = requiredSelectors.filter(
  (selector) => !normalizedStyles.includes(selector.replace(/\s+/g, '')),
);

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
