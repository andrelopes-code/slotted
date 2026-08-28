import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { assertValidTheme } from '@slotted/tokens/validate-theme';

function declarations(names, values) {
  return names.map((name) => `    ${name}: ${values[name]};`).join('\n');
}

export function renderThemeCss(contract, theme) {
  const blocks = [
    `  [data-slotted-theme="${theme.name}"] {\n${declarations(contract.base, theme.base)}\n  }`,
  ];

  for (const [scheme, values] of Object.entries(theme.schemes)) {
    blocks.push(
      `  [data-slotted-theme="${theme.name}"][data-slotted-scheme="${scheme}"],\n` +
        `  [data-slotted-theme="${theme.name}"] [data-slotted-scheme="${scheme}"] {\n` +
        `${declarations(contract.scheme, values)}\n  }`,
    );
  }

  for (const [density, values] of Object.entries(theme.densities)) {
    blocks.push(
      `  [data-slotted-theme="${theme.name}"][data-slotted-density="${density}"],\n` +
        `  [data-slotted-theme="${theme.name}"] [data-slotted-density="${density}"] {\n` +
        `${declarations(contract.density, values)}\n  }`,
    );
  }

  return `@layer slotted.theme {\n${blocks.join('\n\n')}\n}\n`;
}

async function build() {
  const contract = JSON.parse(
    await readFile(new URL('../../../tokens/src/contract.json', import.meta.url), 'utf8'),
  );
  const theme = JSON.parse(await readFile(new URL('../src/theme.json', import.meta.url), 'utf8'));
  assertValidTheme(contract, theme);
  const distUrl = new URL('../dist/', import.meta.url);
  await mkdir(distUrl, { recursive: true });
  await writeFile(new URL('styles.css', distUrl), renderThemeCss(contract, theme));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await build();
}
