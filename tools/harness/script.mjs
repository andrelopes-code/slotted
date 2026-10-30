import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A harness page that runs script.
 *
 * The family harness began script-free on purpose: one authored stylesheet
 * against plain markup, and the picture as the evidence. `chart` is the first
 * family with no picture until script runs — its marks are drawn by an engine
 * — and `core.mjs` had already solved the delivery for a core module: the
 * scenes, one page stylesheet and one module script in the same fragment, the
 * script shipped inside the page so a reviewer can open it from disk. This
 * module holds the two halves both pages share.
 */

const STYLE = /<style\b[^>]*>([\s\S]*?)<\/style>/i;
const SCRIPT = /<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/i;

/** The three parts of a fragment, each taken out of the scenes' way. */
export function splitFragment(fragment) {
  const style = STYLE.exec(fragment);
  const script = SCRIPT.exec(fragment);
  const scenes = fragment.replace(STYLE, '').replace(SCRIPT, '');
  return { scenes, css: style?.[1] ?? '', script: script?.[1] ?? '' };
}

/**
 * The fragment's script as one ES module with nothing left to fetch: every
 * `@slotted/core/<module>` it names resolves to that module's source, a bare
 * package resolves from `packages/core`, where the modules' own dependencies
 * are installed, and every dynamic import is folded in. A chunk it still
 * imported would be a second `file:` fetch, which Chrome refuses.
 */
export async function bundleScript(code, root) {
  const { build } = await import('vite');
  const core = new URL('packages/core/', root);
  /* The entry is a file because the bundler resolves an entry as a path. It
     lives outside the repository and is removed after the build; the script
     imports only `@slotted/core/*`, which the plugin maps into the package,
     so nothing has to resolve from where the file sits. */
  const directory = await mkdtemp(join(tmpdir(), 'slotted-harness-script-'));
  const entry = join(directory, 'entry.js');
  await writeFile(entry, code);
  let output;
  try {
    output = await build({
      root: fileURLToPath(core),
      logLevel: 'silent',
      configFile: false,
      /* A library that guards its development checks on `process.env.NODE_ENV`
         — ECharts does — reads a global the browser does not have. An
         application's bundler replaces it; this one does the same. */
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      plugins: [
        {
          name: 'slotted-harness-core',
          enforce: 'pre',
          resolveId(id) {
            const module = /^@slotted\/core\/([a-z-]+)$/.exec(id);
            return module ? fileURLToPath(new URL(`src/${module[1]}/index.ts`, core)) : null;
          },
        },
      ],
      build: {
        write: false,
        minify: false,
        lib: { entry, formats: ['es'], fileName: 'harness' },
        rollupOptions: { output: { codeSplitting: false } },
      },
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  const [result] = Array.isArray(output) ? output : [output];
  const chunk = result?.output?.find((file) => file.type === 'chunk' && file.isEntry);
  if (!chunk) throw new Error('the harness script bundled to nothing');
  /* A dynamic import folded into the one module is listed as an import of
     the module itself; anything else is a second file. */
  const outside = [...chunk.imports, ...chunk.dynamicImports].filter(
    (name) => name !== chunk.fileName,
  );
  if (outside.length > 0) throw new Error(`the harness script still imports ${outside.join(', ')}`);
  return chunk.code;
}

/**
 * The bundle, as the last element of the page. `</script` inside it would end
 * the element early wherever it appeared — in a string, in a comment — so it
 * is written `<\/script`, which JavaScript reads as the same text.
 */
export function attachScript(html, code) {
  const safe = code.replace(/<\/script/gi, '<\\/script');
  return html.replace('</html>', `<script type="module">${safe}</script>\n</html>`);
}
