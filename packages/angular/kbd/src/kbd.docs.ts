import kbdTokens from '@slotted/styles/kbd/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_KBD_TOKENS = kbdTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Kbd decision',
}));

export const ANGULAR_KBD_DOCS = {
  kbd: {
    api: apiRows([['size', "'sm' | 'md'", 'md', 'slKbd', 'Height and type size of the key']]),
    accessibility: [
      'The element is a kbd, which the platform defines as user input, so no role is added.',
      'A key printed as a glyph — ⌘, ⇧, ⌥ — needs an aria-label. A screen reader announces the character, not the key it stands for.',
      'The legend is a picture of a shortcut, not the shortcut itself. Put aria-keyshortcuts on the control that responds to it, so assistive technology can report it where it applies.',
      'A combination is several kbd elements with a separator between them, and the separator is content: it belongs in the consumer’s copy, in the consumer’s language.',
    ],
    snippets: [
      defineSnippet({
        id: 'kbd-angular-combination',
        language: 'angular',
        label: 'A combination is written out',
        source: '<span><kbd slKbd>Ctrl</kbd> + <kbd slKbd>K</kbd></span>',
      }),
      defineSnippet({
        id: 'kbd-angular-glyph',
        language: 'angular',
        label: 'A glyph key needs a name',
        source: '<kbd slKbd aria-label="Command">&#8984;</kbd>',
      }),
    ],
  },
} as const;
