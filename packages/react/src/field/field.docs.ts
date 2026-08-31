import fieldTokens from '@slotted/styles/field/tokens.json';
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

export const REACT_FIELD_TOKENS = fieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Field family decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_FIELD_DOCS = {
  field: {
    api: apiRows([
      ['id', 'string', '—', 'Field', 'Base every identifier derives from'],
      ['invalid', 'boolean', 'false', 'Field', 'Marks the field and its control invalid'],
      ['required', 'boolean', 'false', 'Field', 'Marks the field and its control required'],
      ['disabled', 'boolean', 'false', 'Field', 'Disables the control'],
      ['readOnly', 'boolean', 'false', 'Field', 'Makes the control read-only'],
      ['render', '(props) => ReactNode', '—', 'Field', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'The label resolves to the control through a derived identifier, so no ordering between siblings matters.',
      'A description and an error join aria-describedby in that order, after any value the consumer set.',
      'aria-required is set rather than the native required attribute, which would change submit behaviour.',
      'No implicit role="alert": whether an error interrupts depends on when it appears, which is application context.',
    ],
    snippets: [
      defineSnippet({
        id: 'field-react-basic',
        language: 'tsx',
        label: 'A described field',
        source:
          '<Field invalid>\n  <FieldLabel>Email</FieldLabel>\n  <FieldControl name="email" />\n  <FieldDescription>Used for sign-in</FieldDescription>\n  <FieldError>Email is not valid</FieldError>\n</Field>;',
      }),
    ],
  },
  fieldLabel: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  fieldDescription: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  fieldError: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  fieldControl: {
    api: apiRows([
      ['render', '(props) => ReactNode', '—', 'FieldControl', 'Applies the wiring to any element'],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
} as const;
