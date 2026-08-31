import tagTokens from '@slotted/styles/tag/tokens.json';
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

export const ANGULAR_TAG_TOKENS = tagTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tag decision',
}));

export const ANGULAR_TAG_DOCS = {
  tag: {
    api: apiRows([
      [
        'variant',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        'secondary',
        'slTag',
        'Tone the tag is painted in',
      ],
      [
        'fill',
        "'solid' | 'outline' | 'subtle'",
        'solid',
        'slTag',
        'How much of the tone is painted',
      ],
      ['size', "'sm' | 'md'", 'md', 'slTag', 'Height and type size'],
    ]),
    accessibility: [
      'The tag itself carries no role. It is a value, and the list of values around it is the consumer’s to mark up — often a ul of li elements.',
      'Every remove control needs a name that says what it removes: "Remove design", not "Remove". A development build warns when neither aria-label nor aria-labelledby is present.',
      'Removing a tag takes a focused control out of the document. Move focus deliberately — to the next tag’s remove control, or to the input the tags belong to — or focus falls to the body.',
      'A tag that can be turned on and off is slToggleButton, not this component. Two components answering for one interaction is worse than one that admits its scope.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-angular-removable',
        language: 'angular',
        label: 'A removable value',
        source:
          '<span slTag fill="subtle" variant="accent">\n  Design\n  <button slTagRemove aria-label="Remove design" (click)="remove()"></button>\n</span>',
      }),
    ],
  },
  tagRemove: {
    api: apiRows([
      ['disabled', 'boolean', 'false', 'slTagRemove', 'Blocks removal and leaves the tab order'],
      ['aria-label', 'string', '—', 'slTagRemove', 'Names the value being removed'],
    ]),
    accessibility: [],
    snippets: [],
  },
} as const;
