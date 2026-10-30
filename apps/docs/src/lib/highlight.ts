import { fromShikiTokens, type CodeLine } from '@slotted/core/code';
import { createHighlighter, type BundledLanguage } from 'shiki';

const LANGUAGES = [
  'tsx',
  'ts',
  'angular-ts',
  'angular-html',
  'html',
  'css',
  'bash',
  'json',
] as const satisfies readonly BundledLanguage[];

export type CodeLanguage = (typeof LANGUAGES)[number];

/**
 * Shiki is asked for TextMate scopes, not colors: `fromShikiTokens` folds them
 * onto the twelve scopes `code-block` paints from `--slotted-code-<scope>`, so
 * the theme and the scheme decide the colors. The theme named here is never
 * drawn.
 */
const highlighter = createHighlighter({ themes: ['github-light'], langs: [...LANGUAGES] });

export async function highlight(code: string, language: CodeLanguage): Promise<CodeLine[]> {
  const shiki = await highlighter;
  return fromShikiTokens(
    shiki.codeToTokens(code, {
      lang: language,
      theme: 'github-light',
      includeExplanation: 'scopeName',
    }),
  );
}
