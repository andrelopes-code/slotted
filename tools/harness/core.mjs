import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { composedFamilies, renderHarness } from './build.mjs';
import { splitFragment } from './script.mjs';

/**
 * A harness for a module of `packages/core` that has no stylesheet of its own.
 *
 * The family harness runs no script: one authored stylesheet against plain
 * markup is the whole point, and the picture is the evidence. A core module
 * has no picture. What a reviewer can open instead is the module *running* —
 * a keyboard session to drive, a pointer to drag, an edge to scroll against —
 * and that needs the module on the page. `positioner` shipped with its tests
 * alone, and its gate had nothing to open.
 *
 * The fragment lives beside the module, `packages/core/src/<module>/<module>.harness.html`,
 * and is three things in one file: the scenes, in the family harness's own
 * `<section data-scene>` form; one `<style>` the page owns, because the states
 * a module reports are painted by whoever renders them and here that is the
 * page; and one `<script type="module">` that imports `@slotted/core/<module>`
 * exactly as a consumer would and wires every stage on the page.
 *
 * The import resolves through an import map to a `data:` URL holding the
 * module bundled by Vite. A `file:` page cannot import a sibling `file:`
 * module — Chrome treats the origin as opaque — and a reviewer opens the
 * page by double-clicking it, so the bundle travels inside the document.
 */

export { splitFragment };

/**
 * The bundled module, as a single ES module with no import left in it. A
 * chunk it still imported would be a second `file:` fetch, which is the thing
 * the data URL exists to avoid.
 */
export async function bundleModule(entry, root) {
  const { build } = await import('vite');
  const output = await build({
    root: fileURLToPath(root),
    logLevel: 'silent',
    configFile: false,
    build: {
      write: false,
      minify: false,
      lib: { entry: fileURLToPath(entry), formats: ['es'], fileName: 'module' },
      rollupOptions: { output: { codeSplitting: false } },
    },
  });
  const [result] = Array.isArray(output) ? output : [output];
  const chunk = result?.output?.find((file) => file.type === 'chunk' && file.isEntry);
  if (!chunk) throw new Error(`${entry}: nothing was bundled`);
  if (chunk.imports.length > 0 || chunk.dynamicImports.length > 0) {
    throw new Error(
      `${entry}: the bundle still imports ${[...chunk.imports, ...chunk.dynamicImports].join(', ')}`,
    );
  }
  return chunk.code;
}

export function renderCoreHarness({ module, fragment, composedCss, themeCss, bundle, theme }) {
  const { scenes, css, script } = splitFragment(fragment);
  const page = renderHarness({
    family: module,
    fragment: scenes,
    familyCss: css,
    composedCss,
    themeCss,
    theme,
  });
  const specifier = `@slotted/core/${module}`;
  const url = `data:text/javascript;base64,${Buffer.from(bundle, 'utf8').toString('base64')}`;
  const importMap = JSON.stringify({ imports: { [specifier]: url } });
  return page.replace(
    '</html>',
    `<script type="importmap">${importMap}</script>\n<script type="module">${script}</script>\n</html>`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const module = args.find((argument) => !argument.startsWith('--'));
  if (!module) throw new Error('usage: node tools/harness/core.mjs <module> [--theme=<name>]');
  const theme =
    args.find((argument) => argument.startsWith('--theme='))?.slice('--theme='.length) ?? 'default';

  const root = new URL('../../', import.meta.url);
  const read = (path) => readFile(new URL(path, root), 'utf8');
  const fragment = await read(`packages/core/src/${module}/${module}.harness.html`);
  const composed = await Promise.all(
    composedFamilies(fragment, module).map((name) =>
      read(`packages/styles/src/${name}/${name}.css`).catch(() => ''),
    ),
  );

  const html = renderCoreHarness({
    module,
    fragment,
    composedCss: composed.join('\n'),
    themeCss: await read(`packages/theme-${theme}/dist/styles.css`),
    bundle: await bundleModule(
      new URL(`packages/core/src/${module}/index.ts`, root),
      new URL('packages/core/', root),
    ),
    theme,
  });

  const out = new URL('tools/harness/out/', root);
  await mkdir(out, { recursive: true });
  await writeFile(new URL(`${module}.html`, out), html);
  console.log(fileURLToPath(new URL(`${module}.html`, out)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
