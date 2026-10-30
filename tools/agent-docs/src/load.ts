import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import type { ReferenceDocs } from '@slotted/storybook-workbench';
import { runnerImport } from 'vite';

import type { Binding, ContractInput, FamilyInput, SiteExample } from './types.ts';

const DOCS_GLOB: Readonly<Record<Binding, string>> = {
  react: '/packages/react/src/*/*.docs.ts',
  angular: '/packages/angular/*/src/*.docs.ts',
};

const EXAMPLE_LANGUAGE: Readonly<Record<Binding, SiteExample['language']>> = {
  react: 'tsx',
  angular: 'ts',
};

const ENTRY = 'virtual:agent-docs-entry';

/**
 * Every reference module of a binding, through one module runner. The
 * workbench barrel renders Storybook blocks that need a DOM; a reference module
 * only calls `defineSnippet`, so the barrel is replaced by the module that
 * declares it.
 */
async function referenceModules(
  binding: Binding,
  root: string,
): Promise<Record<string, Record<string, unknown>>> {
  const { module } = await runnerImport<{ default: Record<string, Record<string, unknown>> }>(
    ENTRY,
    {
      root,
      configFile: false,
      logLevel: 'error',
      resolve: {
        alias: {
          '@slotted/storybook-workbench': join(root, 'tools/storybook-workbench/src/snippets.tsx'),
        },
      },
      plugins: [
        {
          name: 'agent-docs-entry',
          resolveId: (id) => (id === ENTRY ? `\0${ENTRY}` : null),
          load: (id) =>
            id === `\0${ENTRY}`
              ? `export default import.meta.glob(${JSON.stringify(DOCS_GLOB[binding])}, { eager: true });`
              : null,
        },
      ],
    },
  );
  return module.default;
}

function familyOf(path: string, binding: Binding): string {
  const segments = path.split('/');
  return segments[segments.length - (binding === 'react' ? 2 : 3)]!;
}

function docsExport(module: Record<string, unknown>, path: string): Record<string, ReferenceDocs> {
  const names = Object.keys(module).filter((name) => name.endsWith('_DOCS'));
  if (names.length !== 1)
    throw new Error(`${path} exports ${names.length} *_DOCS objects; expected one`);
  return module[names[0]!] as Record<string, ReferenceDocs>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function siteExamples(root: string, binding: Binding, family: string): SiteExample[] {
  const dir = join(root, 'apps/docs/examples', binding, family);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /\.(tsx|ts)$/.test(file))
    .sort()
    .map((file) => ({
      id: basename(file, extname(file)),
      fileName: file,
      language: EXAMPLE_LANGUAGE[binding],
      source: readFileSync(join(dir, file), 'utf8'),
    }));
}

export async function loadFamilies(
  binding: Binding,
  root: string,
): Promise<Omit<FamilyInput, 'verdicts'>[]> {
  const modules = await referenceModules(binding, root);
  const docsByFamily = new Map(
    Object.entries(modules).map(([path, module]) => [
      familyOf(path, binding),
      docsExport(module, path),
    ]),
  );

  const specs = join(root, 'specs/components');
  const families = readdirSync(specs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return families.map((family) => {
    const docs = docsByFamily.get(family);
    if (docs === undefined)
      throw new Error(`${family} has a contract and no ${binding} reference module`);
    const tokensPath = join(root, 'packages/styles/src', family, `${family}.tokens.json`);
    return {
      binding,
      contract: readJson<ContractInput>(join(specs, family, 'contract.json')),
      docs,
      tokens: existsSync(tokensPath) ? readJson<string[]>(tokensPath) : [],
      examples: siteExamples(root, binding, family),
    };
  });
}
