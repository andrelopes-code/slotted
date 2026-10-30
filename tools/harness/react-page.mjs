import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { coreSourceAliases } from '../../scripts/source-aliases.mjs';

/**
 * A page that runs the React binding from source, for a scenario that has to
 * measure what the binding does rather than what a stylesheet draws.
 *
 * The family harness renders authored markup against the stylesheet, and a
 * fragment's script reaches `@slotted/core` only. A timing defect in the
 * binding — a state set in a promise, an effect chain, a read between two
 * writes — exists only where React renders, so the page is one bundle: the
 * entry, `react`, `react-dom`, `@slotted/react` and `@slotted/core` from
 * source, the family stylesheets the binding imports, and the default theme,
 * inlined into one file Chrome opens from disk.
 *
 * The entry is written inside `packages/react/node_modules`, so `react` and
 * the stylesheets resolve the way they resolve for the package itself.
 */

const root = new URL('../../', import.meta.url);
const reactRoot = fileURLToPath(new URL('packages/react/', root));
const reactSource = fileURLToPath(new URL('packages/react/src/', root));
const out = fileURLToPath(new URL('tools/harness/out/', root));

/**
 * Bundles `entry` (TypeScript source, `createElement` rather than JSX) and
 * writes `out/<name>.html`. `mode` is `production` or `development`: the two
 * React builds differ by several times in what they cost.
 */
export async function buildReactPage(name, entry, { mode = 'production' } = {}) {
  const { build } = await import('vite');
  const scratch = join(reactRoot, 'node_modules/.harness');
  mkdirSync(scratch, { recursive: true });
  const entryFile = join(scratch, `${name}.ts`);
  writeFileSync(entryFile, entry);

  const result = await build({
    configFile: false,
    logLevel: 'silent',
    mode,
    root: reactRoot,
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    resolve: {
      alias: [
        ...coreSourceAliases(),
        { find: /^@slotted\/react\/(.+)$/, replacement: `${reactSource}$1/index.ts` },
        { find: /^@slotted\/react$/, replacement: `${reactSource}index.ts` },
      ],
    },
    build: {
      write: false,
      minify: process.env.HARNESS_MINIFY === '0' ? false : mode === 'production',
      cssCodeSplit: false,
      rollupOptions: {
        input: entryFile,
        output: { format: 'iife' },
      },
    },
  });

  const outputs = (Array.isArray(result) ? result : [result]).flatMap((entry) => entry.output);
  const script = outputs
    .filter((chunk) => chunk.type === 'chunk')
    .map((chunk) => chunk.code)
    .join('\n');
  const styles = outputs
    .filter((asset) => asset.type === 'asset' && asset.fileName.endsWith('.css'))
    .map((asset) => String(asset.source))
    .join('\n');
  /* What an application loads once at its entry: the token layer and a theme. */
  const theme = ['packages/theme/dist/styles.css', 'packages/themes/dist/default.css']
    .map((path) => readFileSync(fileURLToPath(new URL(path, root)), 'utf8'))
    .join('\n');

  const html = `<!doctype html>
<html lang="en" data-slotted-theme="default" data-slotted-scheme="light">
<head>
<meta charset="utf-8">
<title>${name}</title>
<style>${theme}</style>
<style>${styles}</style>
</head>
<body>
<div id="root"></div>
<script>${script.replaceAll('</script', '<\\/script')}</script>
</body>
</html>
`;
  mkdirSync(out, { recursive: true });
  const file = join(out, `${name}.html`);
  writeFileSync(file, html);
  return pathToFileURL(file);
}
