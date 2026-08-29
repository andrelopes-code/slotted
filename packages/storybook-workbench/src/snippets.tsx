export type SnippetLanguage = 'angular' | 'tsx';

export interface WorkbenchSnippet {
  id: string;
  label: string;
  language: SnippetLanguage;
  source: string;
}

export function defineSnippet(snippet: WorkbenchSnippet): WorkbenchSnippet {
  return Object.freeze({ ...snippet, source: `${snippet.source.trim()}\n` });
}
