import type { SnippetLanguage } from './snippets';

export type TokenKind =
  'attr' | 'comment' | 'keyword' | 'number' | 'plain' | 'property' | 'string' | 'tag';

export interface Token {
  kind: TokenKind;
  text: string;
}

/**
 * A snippet in a reference page is a few lines of curated code, and it was
 * printed as one grey block. Storybook ships a highlighter, and it reads its
 * colours from a theme context that exists only inside a rendered docs page —
 * so using it made the drawer untestable and the failure mode was a crash in
 * jsdom rather than a missing colour.
 *
 * This is the smaller answer: one ordered rule list per language, matched from
 * the start of the remaining source. It is deliberately not a parser. It
 * colours strings, comments, tags, attributes, properties and keywords, which
 * is what a five-line example needs, and anything it does not recognize stays
 * the body colour rather than being coloured wrongly.
 */
const KEYWORDS =
  /^(?:import|export|from|const|let|var|function|return|type|interface|as|await|async|new|class|extends|implements|default|providers|bootstrapApplication)\b/;

/**
 * A bare attribute — `slLink`, `external`, `visited` — is a word with nothing
 * around it, and the same word in a sentence between two tags is prose. The
 * only thing that separates them is whether the tokenizer is inside a tag, so
 * the rules that colour attributes say so and the loop keeps that one bit of
 * state.
 */
interface Rule {
  kind: TokenKind;
  pattern: RegExp;
  insideTag?: boolean;
}

const RULES: Record<SnippetLanguage, readonly Rule[]> = {
  angular: [
    { kind: 'comment', pattern: /^<!--[\s\S]*?-->/ },
    { kind: 'string', pattern: /^"[^"]*"|^'[^']*'/ },
    { kind: 'tag', pattern: /^<\/?[A-Za-z][\w-]*|^\/?>/ },
    { kind: 'property', pattern: /^\{\{[^}]*\}\}/ },
    { kind: 'attr', pattern: /^[@[(*#]?[A-Za-z][\w.-]*[\])]?(?=\s*=)/, insideTag: true },
    { kind: 'attr', pattern: /^[@[(*#]?[A-Za-z][\w.-]*[\])]?(?=[\s>])/, insideTag: true },
  ],
  css: [
    { kind: 'comment', pattern: /^\/\*[\s\S]*?\*\// },
    { kind: 'string', pattern: /^"[^"]*"|^'[^']*'/ },
    { kind: 'property', pattern: /^--[\w-]+|^[a-z-]+(?=\s*:)/ },
    { kind: 'tag', pattern: /^[.#[][\w\-='"\]]+|^:[a-z-]+/ },
    { kind: 'number', pattern: /^-?\d+(?:\.\d+)?[a-z%]*/ },
  ],
  /**
   * The source a Markdown family is handed: a fence, a heading's hashes, the
   * `[!NOTE]` of an alert and the `[ ]` of a task read as syntax, inline code
   * as a string and a link's destination as its property.
   */
  markdown: [
    { kind: 'tag', pattern: /^(?:`{3,}|~{3,})[^\n]*/ },
    { kind: 'string', pattern: /^`[^`\n]+`/ },
    { kind: 'keyword', pattern: /^#{1,6}(?= )|^\[![A-Z]+\]|^\[[ x]\](?= )|^\[\^[^\]]+\]/ },
    { kind: 'property', pattern: /^\]\([^)\s]*(?:\s+"[^"]*")?\)/ },
  ],
  ts: [
    { kind: 'comment', pattern: /^\/\/[^\n]*|^\/\*[\s\S]*?\*\// },
    { kind: 'string', pattern: /^"[^"]*"|^'[^']*'|^`[^`]*`/ },
    { kind: 'keyword', pattern: KEYWORDS },
    { kind: 'number', pattern: /^\b\d+(?:\.\d+)?\b/ },
    { kind: 'property', pattern: /^[A-Za-z_$][\w$]*(?=\s*:)/ },
  ],
  tsx: [
    { kind: 'comment', pattern: /^\{\/\*[\s\S]*?\*\/\}|^\/\/[^\n]*|^\/\*[\s\S]*?\*\// },
    { kind: 'string', pattern: /^"[^"]*"|^'[^']*'|^`[^`]*`/ },
    { kind: 'tag', pattern: /^<\/?[A-Za-z][\w.]*|^\/?>/ },
    { kind: 'keyword', pattern: KEYWORDS },
    { kind: 'attr', pattern: /^[A-Za-z][\w-]*(?==)/, insideTag: true },
    { kind: 'number', pattern: /^\b\d+(?:\.\d+)?\b/ },
  ],
};

export function highlight(source: string, language: SnippetLanguage): Token[] {
  const rules = RULES[language];
  const tokens: Token[] = [];
  let rest = source;
  let plain = '';
  let insideTag = false;

  const flush = () => {
    if (plain.length > 0) tokens.push({ kind: 'plain', text: plain });
    plain = '';
  };

  while (rest.length > 0) {
    const match = rules
      .filter((rule) => rule.insideTag !== true || insideTag)
      .map((rule) => ({ kind: rule.kind, found: rule.pattern.exec(rest)?.[0] }))
      .find((candidate) => candidate.found !== undefined && candidate.found.length > 0);

    if (match?.found === undefined) {
      plain += rest[0];
      rest = rest.slice(1);
      continue;
    }

    flush();
    if (match.kind === 'tag') insideTag = match.found.startsWith('<');
    tokens.push({ kind: match.kind, text: match.found });
    rest = rest.slice(match.found.length);
  }

  flush();
  return tokens;
}
