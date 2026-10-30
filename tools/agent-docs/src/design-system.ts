import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import {
  componentName,
  componentReadme,
  loadFamilyDocs,
  previewHtml,
  renderExamples,
} from './design-system-components.ts';
import { designTokens, loadFlatTheme, type FontFile } from './design-system-tokens.ts';
import { loadTokenSource } from './tokens.ts';

/**
 * Writes the Design System export into `<out>/project/`: the files a system
 * made from Claude's Design System type keeps, generated from the repository.
 * Read by the type: `tokens.json`, `README.md`, `components/<Comp>/README.md`
 * and `preview.html`, `components/bundle.css`, `fonts/`, the cover and the
 * index `design-system.json`.
 */
export interface DesignSystemReport {
  files: string[];
  dropped: string[];
  withoutPreview: string[];
  renderErrors: Map<string, string>;
}

interface System {
  url: string;
  title: string;
  namespace: string;
  createdAt: string;
  description: string;
}

const FONTS: readonly { from: string; font: FontFile }[] = [
  {
    from: 'apps/docs/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
    font: {
      family: 'Geist Variable',
      file: 'fonts/geist-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
  },
  {
    from: 'apps/docs/node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
    font: {
      family: 'Geist Mono Variable',
      file: 'fonts/geist-mono-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
  },
];

export async function buildDesignSystem({
  root,
  out,
  ref,
  at,
  by,
}: {
  root: string;
  out: string;
  /** `main@<short sha>`. */
  ref: string;
  /** ISO-8601 time of this export. */
  at: string;
  by: string;
}): Promise<DesignSystemReport> {
  if (basename(out) !== 'design-system')
    throw new Error(`refusing to empty ${out}: its name must be "design-system"`);
  rmSync(out, { recursive: true, force: true });
  const project = join(out, 'project');
  const files: string[] = [];
  const write = (path: string, text: string) => {
    mkdirSync(dirname(join(project, path)), { recursive: true });
    writeFileSync(join(project, path), text);
    files.push(path);
  };
  const source = join(root, 'tools/agent-docs/content/design-system');
  const system = JSON.parse(readFileSync(join(source, 'system.json'), 'utf8')) as System;

  for (const { from, font } of FONTS) {
    mkdirSync(join(project, 'fonts'), { recursive: true });
    copyFileSync(join(root, from), join(project, font.file));
    files.push(font.file);
  }
  const { tokens, dropped } = designTokens({
    source: loadTokenSource(root),
    flat: await loadFlatTheme(root),
    meta: { ref, synced: at.slice(0, 10) },
    fonts: FONTS.map(({ font }) => font),
  });
  write('tokens.json', `${JSON.stringify(tokens, null, 2)}\n`);
  write('README.md', readFileSync(join(source, 'README.md'), 'utf8'));

  const docsDir = join(root, 'packages/react/dist/docs');
  const families = readdirSync(docsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => loadFamilyDocs(docsDir, file.slice(0, -'.json'.length)))
    .sort((a, b) => a.family.localeCompare(b.family));
  const { markup, errors } = await renderExamples(
    root,
    new Map(families.flatMap((docs) => (docs.example ? [[docs.family, docs.example]] : []))),
  );
  for (const docs of families) {
    const name = componentName(docs.family);
    write(`components/${name}/README.md`, componentReadme(docs, docsDir));
    const html = markup.get(docs.family);
    if (html !== undefined) write(`components/${name}/preview.html`, previewHtml(html, docs.group));
  }
  const css = [
    readFileSync(join(root, 'packages/themes/dist/default.css'), 'utf8'),
    readFileSync(join(root, 'packages/react/dist/styles.css'), 'utf8'),
  ].join('\n');
  if (/<\/style/i.test(css)) throw new Error('components/bundle.css holds "</style"');
  write('components/bundle.css', css);
  write('components/Cover/preview.html', readFileSync(join(source, 'cover.html'), 'utf8'));

  const withoutPreview = families
    .filter((docs) => !markup.has(docs.family))
    .map((docs) => docs.family);
  write(
    'design-system.json',
    `${JSON.stringify(
      {
        v: 3,
        layout: 'files',
        createdOnFiles: { v: 1, at: system.createdAt },
        title: system.title,
        namespace: system.namespace,
        libraries: [],
        sections: {},
        groups: [],
        assetGroups: {},
        blobs: {},
        docs: { readme: 'project/README.md', sections: [] },
        lastChange: {
          by,
          at,
          via: `GitHub · andrelopes-code/slotted@${ref.split('@')[1]}`,
          note: `${families.length} families, ${markup.size} with a preview; ${tokens.color.tokens.length} colours in three schemes`,
        },
      },
      null,
      2,
    )}\n`,
  );
  return { files, dropped, withoutPreview, renderErrors: errors };
}
