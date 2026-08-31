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

export const REACT_DESCRIPTION_LIST_TOKENS = descriptionListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned DescriptionList decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_DESCRIPTION_LIST_DOCS = {
  descriptionList: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'vertical',
        'DescriptionList',
        'Axis the term and its details are arranged along',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'DescriptionList',
        'Renders a different root element',
      ],
      ...wiringApi,
    ]),
    accessibility: [
      'dl, dt and dd carry the pairing themselves, so no role and no aria-describedby is added.',
      'Put the dt and dd elements directly inside the dl. A wrapping div is valid HTML but takes the pair out of the grid the stylesheet lays out.',
      'A term may be followed by several dd elements. The stylesheet keeps them in one column so the list does not shear.',
      'A description list is not a layout device. Use it where the content really is a set of terms and their values; a two-column arrangement of unrelated things is a grid.',
    ],
    snippets: [
      defineSnippet({
        id: 'description-list-react-basic',
        language: 'tsx',
        label: 'A short set of facts',
        source:
          '<DescriptionList orientation="horizontal">\n  <DescriptionTerm>Owner</DescriptionTerm>\n  <DescriptionDetails>Ada Lovelace</DescriptionDetails>\n</DescriptionList>;',
      }),
    ],
  },
  descriptionTerm: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  descriptionDetails: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
