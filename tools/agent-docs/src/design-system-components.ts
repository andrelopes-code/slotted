import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { transformWithOxc } from 'vite';

/**
 * The component folders of the Design System export, read from the React
 * docs the package build wrote (`packages/react/dist/docs`): one folder per
 * family, its guidelines the family's page, its preview the static markup of
 * the family's first complete example rendered on the server.
 */
export interface FamilyDocs {
  family: string;
  summary: string;
  group: string;
  page: string;
  /** The source of the first complete React example, preferring `basic`. */
  example: string | undefined;
}

interface FamilyJson {
  family: string;
  catalog: { summary: string; group: string };
  examples: { id: string; language: string; source: string; verdict: string }[];
}

export function componentName(family: string): string {
  return family.replace(/(^|-)([a-z0-9])/g, (_, __, letter: string) => letter.toUpperCase());
}

export function loadFamilyDocs(docsDir: string, family: string): FamilyDocs {
  const json = JSON.parse(readFileSync(join(docsDir, `${family}.json`), 'utf8')) as FamilyJson;
  const complete = json.examples.filter(
    (example) => example.verdict === 'example' && example.language === 'tsx',
  );
  const example = complete.find((entry) => entry.id === 'basic') ?? complete[0];
  return {
    family,
    summary: json.catalog.summary,
    group: json.catalog.group,
    page: readFileSync(join(docsDir, `${family}.md`), 'utf8'),
    example: example?.source,
  };
}

/** The size the type reads of a component's `README.md`. */
export const README_CAP = 64 * 1024;

/**
 * `components/<Comp>/README.md`: the summary as the first sentence, then the
 * family's page without its index comment and title. A section the page moved
 * to a linked file is inlined while the guidelines stay within the type's
 * cap; past it, the guidelines name the file in the installed package.
 */
export function componentReadme(docs: FamilyDocs, docsDir: string): string {
  let text = `${docs.summary}\n\n${docs.page
    .split('\n')
    .filter((line) => !line.startsWith('<!-- index:') && line !== `# ${docs.family}`)
    .join('\n')
    .trim()}\n`;
  for (const [link, file] of [
    ...text.matchAll(/See \[([a-z0-9.-]+\.md)\]\(\.\/[a-z0-9.-]+\.md\)\./g),
  ].map((match) => [match[0], match[1]!] as const)) {
    const section = readFileSync(join(docsDir, file), 'utf8')
      .split('\n')
      .filter((line) => !line.startsWith('<!-- index:') && !line.startsWith('# '))
      .join('\n')
      .trim();
    const inlined = text.replace(link, section);
    text =
      Buffer.byteLength(inlined) <= README_CAP
        ? inlined
        : text.replace(link, `In the package: \`node_modules/@slotted/react/dist/docs/${file}\`.`);
  }
  return text;
}

/** `components/<Comp>/preview.html`: the card marker, the markup in the default theme, and the scheme kept in step with the page's theme. */
export function previewHtml(markup: string, group: string): string {
  return [
    `<!-- @dsCard group="${group}" height=160 -->`,
    '<div id="preview" data-slotted-theme="default" data-slotted-scheme="light" style="background: var(--slotted-surface); color: var(--slotted-text); padding: var(--slotted-space-6); font-family: var(--slotted-font-family-sans)">',
    markup,
    '</div>',
    '<script>',
    "  const preview = document.getElementById('preview');",
    "  const sync = () => preview.setAttribute('data-slotted-scheme', document.documentElement.dataset.theme || 'light');",
    '  sync();',
    "  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });",
    '</script>',
    '',
  ].join('\n');
}

/**
 * Renders each example to static markup with `react-dom/server`, from a
 * directory under `apps/docs/node_modules`, where `@slotted/react`, `react`
 * and `react-dom` resolve to one instance. Returns the markup per family, and
 * the error of each example that did not render.
 */
export async function renderExamples(
  root: string,
  examples: ReadonlyMap<string, string>,
): Promise<{ markup: Map<string, string>; errors: Map<string, string> }> {
  /* A directory of its own per call: two calls running at once each delete theirs. */
  const cache = join(root, 'apps/docs/node_modules/.cache');
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(join(cache, 'slotted-design-system-'));
  // The package's chunks load a CommonJS dependency through `require`, which an ES module lacks.
  writeFileSync(
    join(dir, 'require.mjs'),
    "import { createRequire } from 'node:module';\nglobalThis.require ??= createRequire(import.meta.url);\n",
  );
  const markup = new Map<string, string>();
  const errors = new Map<string, string>();
  const hadRequire = 'require' in globalThis;
  try {
    for (const [family, source] of examples) {
      try {
        const { code } = await transformWithOxc(source, `${family}.tsx`, {
          lang: 'tsx',
          jsx: { runtime: 'automatic' },
        });
        writeFileSync(join(dir, `${family}.mjs`), code);
        writeFileSync(
          join(dir, `${family}.render.mjs`),
          [
            "import './require.mjs';",
            "import { createElement } from 'react';",
            "import { renderToStaticMarkup } from 'react-dom/server';",
            `import Example from './${family}.mjs';`,
            'export default renderToStaticMarkup(createElement(Example));',
            '',
          ].join('\n'),
        );
        const rendered = (await import(pathToFileURL(join(dir, `${family}.render.mjs`)).href)) as {
          default: string;
        };
        markup.set(family, rendered.default);
      } catch (error) {
        errors.set(family, error instanceof Error ? error.message.split('\n')[0]! : String(error));
      }
    }
  } finally {
    if (!hadRequire) delete (globalThis as { require?: unknown }).require;
    rmSync(dir, { recursive: true, force: true });
  }
  return { markup, errors };
}
