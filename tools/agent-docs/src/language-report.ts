import { compileBlocks } from './render.ts';
import type { FamilyInput } from './types.ts';

/** Typographic punctuation an English example uses; anything else outside printable ASCII is reported. */
const ALLOWED = new Set([
  '…',
  '—',
  '–',
  '’',
  '‘',
  '“',
  '”',
  '·',
  '→',
  '←',
  '↑',
  '↓',
  '×',
  '⌘',
  '⇧',
  '⌥',
]);

export interface LanguageFinding {
  binding: string;
  family: string;
  key: string;
  characters: string;
}

/**
 * A report, never a gate: a name, a locale example or a glyph can be correct and
 * still fall outside the set. It lists where to look; a person decides.
 */
export function nonEnglishSnippets(
  families: readonly Omit<FamilyInput, 'verdicts'>[],
): LanguageFinding[] {
  return families.flatMap((family) =>
    compileBlocks(family).flatMap((block) => {
      const characters = [
        ...new Set(
          [...block.source].filter((char) => !/[\x20-\x7e\n\t]/.test(char) && !ALLOWED.has(char)),
        ),
      ];
      return characters.length === 0
        ? []
        : [
            {
              binding: family.binding,
              family: family.contract.family,
              key: block.key,
              characters: characters.join(''),
            },
          ];
    }),
  );
}

/**
 * Words of Portuguese that English prose never uses. Short words shared with
 * English ("a", "no", "do", "as") are left out; a text is Portuguese when it
 * holds two distinct entries, so one quoted name does not trip it.
 */
// language: pt-BR
const PORTUGUESE_WORDS = new Set([
  'não',
  'uma',
  'um',
  'é',
  'são',
  'está',
  'estão',
  'com',
  'para',
  'quando',
  'pelo',
  'pela',
  'também',
  'já',
  'dos',
  'das',
  'nas',
  'nos',
  'ao',
  'aos',
  'à',
  'às',
  'seu',
  'sua',
  'que',
  'em',
  'na',
  'os',
  'o',
  'ou',
  'mas',
  'cada',
  'sem',
  'como',
  'mais',
]);
// language: en-US

export interface ProseFinding {
  binding: string;
  family: string;
  /** Where the text is rendered: section, member and row. */
  location: string;
  text: string;
}

function isPortuguese(text: string): boolean {
  const words = text
    .replace(/`[^`]*`/g, ' ')
    .toLowerCase()
    .split(/[^\p{L}]+/u);
  return new Set(words.filter((word) => PORTUGUESE_WORDS.has(word))).size >= 2;
}

/** Every prose string a family page renders, with where it appears. */
function proseOf(family: Omit<FamilyInput, 'verdicts'>): [string, string][] {
  const entries: [string, string][] = [['summary', family.contract.catalog.summary]];
  for (const [member, docs] of Object.entries(family.docs)) {
    for (const row of [...(docs.api ?? []), ...(docs.composition ?? [])]) {
      entries.push([`${member} prop ${row.name}`, row.description]);
      entries.push([`${member} prop ${row.name} default`, row.defaultValue]);
      entries.push([`${member} prop ${row.name} applies to`, row.appliesTo]);
    }
    for (const row of docs.events ?? []) entries.push([`${member} event ${row.name}`, row.when]);
    for (const rule of docs.accessibility ?? []) entries.push([`${member} rule`, rule]);
    for (const scene of docs.scenes ?? []) {
      entries.push([`${member} example ${scene.id} title`, scene.title]);
      entries.push([`${member} example ${scene.id} note`, scene.note]);
    }
    if ((docs.scenes ?? []).length === 0)
      for (const snippet of docs.snippets ?? [])
        entries.push([`${member} example ${snippet.id} title`, snippet.label]);
  }
  return entries;
}

/**
 * A gate: the generated family pages are written in English, and a page whose
 * prose reads as Portuguese fails the build. Names the family, binding and row.
 */
export function nonEnglishProse(
  families: readonly Omit<FamilyInput, 'verdicts'>[],
): ProseFinding[] {
  return families.flatMap((family) =>
    proseOf(family)
      .filter(([, text]) => isPortuguese(text))
      .map(([location, text]) => ({
        binding: family.binding,
        family: family.contract.family,
        location,
        text,
      })),
  );
}
