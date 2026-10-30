import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { LAYER_ORDER_STATEMENT } from '../dist/layer-order.js';
import { validateContract } from '../dist/index.js';

const contract = JSON.parse(
  await readFile(new URL('../src/contract.json', import.meta.url), 'utf8'),
);
const errors = validateContract(contract);
if (errors.length > 0) {
  throw new Error(`Invalid token contract:\n${errors.map((error) => `- ${error}`).join('\n')}`);
}
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/styles.css', import.meta.url), LAYER_ORDER_STATEMENT);
