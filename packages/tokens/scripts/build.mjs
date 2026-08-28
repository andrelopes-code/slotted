import { mkdir, readFile, writeFile } from 'node:fs/promises';

const contractUrl = new URL('../src/contract.json', import.meta.url);
const distUrl = new URL('../dist/', import.meta.url);
const contract = JSON.parse(await readFile(contractUrl, 'utf8'));
const allNames = [...contract.base, ...contract.scheme, ...contract.density];

if (new Set(allNames).size !== allNames.length) {
  throw new Error('Token contract contains duplicate names');
}

await mkdir(distUrl, { recursive: true });
await writeFile(new URL('contract.json', distUrl), `${JSON.stringify(contract, null, 2)}\n`);
await writeFile(
  new URL('styles.css', distUrl),
  '@layer slotted.tokens, slotted.theme, slotted.components, slotted.overrides;\n',
);
