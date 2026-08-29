import { check, resolveConfig } from 'prettier';

import type { WorkbenchSnippet } from './snippets';

export async function snippetFormatErrors(snippets: readonly WorkbenchSnippet[]) {
  const errors: string[] = [];
  const config = (await resolveConfig(process.cwd())) ?? {};
  for (const snippet of snippets) {
    const parser = snippet.language === 'angular' ? 'angular' : 'babel-ts';
    try {
      if (!(await check(snippet.source, { ...config, parser })))
        errors.push(`unformatted ${snippet.id}`);
    } catch (error) {
      errors.push(`invalid ${snippet.id}: ${String(error)}`);
    }
  }
  return errors;
}
