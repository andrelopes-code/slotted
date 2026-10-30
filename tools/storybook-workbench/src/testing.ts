import { fileURLToPath } from 'node:url';

import { check, resolveConfig } from 'prettier';

import type { SnippetLanguage, WorkbenchSnippet } from './snippets';

/**
 * Every language a snippet may be written in names the parser that formats it.
 * A map rather than a conditional, so adding a language is a compile error
 * here rather than a snippet silently measured against the wrong grammar.
 */
const PARSERS: Record<SnippetLanguage, string> = {
  angular: 'angular',
  css: 'css',
  markdown: 'markdown',
  ts: 'babel-ts',
  tsx: 'babel-ts',
};

/**
 * Prettier searches for a configuration file starting at the *parent* of the
 * path it is given, so `process.cwd()` finds the repository's own config from
 * a package directory and finds nothing from the repository root. The two
 * runners disagree about the working directory, so a snippet was measured
 * against a printWidth of 100 under Vitest and against Prettier's default 80
 * under `ng test`, and a line between the two lengths failed in one run and
 * passed in the other. Resolving from this module's own path removes the
 * working directory from the answer.
 */
const CONFIG_SOURCE = fileURLToPath(import.meta.url);

export async function snippetFormatErrors(snippets: readonly WorkbenchSnippet[]) {
  const errors: string[] = [];
  const config = (await resolveConfig(CONFIG_SOURCE)) ?? {};
  for (const snippet of snippets) {
    const parser = PARSERS[snippet.language];
    try {
      if (!(await check(snippet.source, { ...config, parser })))
        errors.push(`unformatted ${snippet.id}`);
    } catch (error) {
      errors.push(`invalid ${snippet.id}: ${String(error)}`);
    }
  }
  return errors;
}

export { referencePageErrors } from './reference-audit';
export type { ReferenceContractMember, ReferenceDocs, ReferenceSceneMeta } from './reference-audit';
