/**
 * A snippet is not always framework code. A family whose public contract is
 * `data-ui` answers questions — the default every icon takes, the stroke weight
 * an icon set needs — with a stylesheet rule that belongs to neither binding,
 * and a drawer that can only say React or Angular leaves that answer
 * undocumented in both reference pages.
 *
 * `ts` is the same gap on the other side. An application sets a family's
 * defaults once, and in Angular that is a provider in a bootstrap file rather
 * than a template: labelling it `angular` would put template syntax
 * highlighting on TypeScript, and labelling it `tsx` would name the wrong
 * framework on an Angular page.
 */
export type SnippetLanguage = 'angular' | 'css' | 'markdown' | 'ts' | 'tsx';

export interface WorkbenchSnippet {
  id: string;
  label: string;
  language: SnippetLanguage;
  source: string;
}

export function defineSnippet(snippet: WorkbenchSnippet): WorkbenchSnippet {
  return Object.freeze({ ...snippet, source: `${snippet.source.trim()}\n` });
}
