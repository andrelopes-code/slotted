import descriptionListTokens from '@slotted/styles/description-list/tokens.json';
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

export const ANGULAR_DESCRIPTION_LIST_TOKENS = descriptionListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned DescriptionList decision',
}));

export const ANGULAR_DESCRIPTION_LIST_DOCS = {
  descriptionList: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'vertical',
        'slDescriptionList',
        'Axis the term and its details are arranged along',
      ],
    ]),
    accessibility: [
      'dl, dt and dd carry the pairing themselves, so no role and no aria-describedby is added.',
      'Put the dt and dd elements directly inside the dl. A wrapping div is valid HTML but takes the pair out of the grid the stylesheet lays out.',
      'A term may be followed by several dd elements. The stylesheet keeps them in one column so the list does not shear.',
      'A description list is not a layout device. Use it where the content really is a set of terms and their values; a two-column arrangement of unrelated things is a grid.',
    ],
    snippets: [
      defineSnippet({
        id: 'description-list-angular-basic',
        language: 'angular',
        label: 'A short set of facts',
        source:
          '<dl slDescriptionList orientation="horizontal">\n  <dt slDescriptionTerm>Owner</dt>\n  <dd slDescriptionDetails>Ada Lovelace</dd>\n</dl>',
      }),
    ],
  },
  descriptionTerm: { api: [], accessibility: [], snippets: [] },
  descriptionDetails: { api: [], accessibility: [], snippets: [] },
} as const;
