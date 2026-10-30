import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';

import { LAYER_ORDER_STATEMENT } from '@slotted/theme/layer-order';

const dist = new URL('dist/', import.meta.url);
const allInOne = new URL('dist-styles/styles.css', import.meta.url);
const manifestUrl = new URL('.vite/manifest.json', dist);

/**
 * Every stylesheet the package ships opens with the layer order, so the
 * cascade holds whichever loads first: a family's own sheet, the all-in-one
 * `styles.css`, or the theme's.
 *
 * The modules import no stylesheet. A module that imports one cannot be
 * loaded by Node unbundled — server rendering, Jest, Vitest with its
 * dependencies external — so an application imports the sheets of the
 * families it renders, or `styles.css`.
 */
async function withLayerOrder(url) {
  const css = await readFile(url, 'utf8');
  if (!css.startsWith(LAYER_ORDER_STATEMENT))
    await writeFile(url, `${LAYER_ORDER_STATEMENT}${css}`);
}

/* The all-in-one sheet, built apart (`vite.styles.config.ts`). */
await rename(allInOne, new URL('styles.css', dist));
await rm(new URL('dist-styles/', import.meta.url), { recursive: true, force: true });

const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const chunks = Object.values(manifest);

for (const file of await readdir(dist)) {
  if (file.endsWith('.css')) await withLayerOrder(new URL(file, dist));
}

/**
 * One sheet per family entry, for an application that links stylesheets by
 * hand: everything the entry's chunks import, in import order, at
 * `@slotted/react/<family>/styles.css`.
 */
const byKey = new Map(Object.entries(manifest));
await mkdir(new URL('styles/', dist), { recursive: true });
for (const entry of chunks.filter((chunk) => chunk.isEntry)) {
  const order = [];
  const seen = new Set();
  const visit = (key, chunk) => {
    if (seen.has(key)) return;
    seen.add(key);
    for (const dependency of chunk.imports ?? []) visit(dependency, byKey.get(dependency));
    for (const css of chunk.css ?? []) if (!order.includes(css)) order.push(css);
  };
  visit(entry.src, entry);
  const sheets = await Promise.all(order.map((css) => readFile(new URL(css, dist), 'utf8')));
  const body = sheets.map((css) => css.replace(LAYER_ORDER_STATEMENT, '')).join('\n');
  await writeFile(new URL(`styles/${entry.name}.css`, dist), `${LAYER_ORDER_STATEMENT}${body}`);
}

/* The chunks' own sheets were the parts of the family sheets; only those ship. */
for (const chunk of chunks) {
  for (const css of chunk.css ?? []) await rm(new URL(css, dist), { force: true });
}
await rm(new URL('.vite/', dist), { recursive: true, force: true });
if (!existsSync(new URL('styles.css', dist))) throw new Error('dist/styles.css was not written');
