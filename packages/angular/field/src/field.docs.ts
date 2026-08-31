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

export const ANGULAR_FIELD_TOKENS = fieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Field family decision',
}));

const wiringApi: ApiTuple[] = [
  ['content', 'projected', '—', 'Part', 'Projected content'],
  ['class', 'string', '—', 'Part', 'Additional class names'],
];

export const ANGULAR_FIELD_DOCS = {
  field: {
    api: apiRows([
      ['id', 'string', '—', 'SlField', 'Base every identifier derives from'],
      ['invalid', 'boolean', 'false', 'SlField', 'Marks the field and its control invalid'],
      ['required', 'boolean', 'false', 'SlField', 'Marks the field and its control required'],
      ['disabled', 'boolean', 'false', 'SlField', 'Disables the control'],
      ['readOnly', 'boolean', 'false', 'SlField', 'Makes the control read-only'],
      ...wiringApi,
    ]),
    accessibility: [
      'The label resolves to the control through a derived identifier, so no ordering between siblings matters.',
      'A description and an error join aria-describedby in that order, after any value already on the element.',
      'aria-required is set rather than the native required attribute, which would change submit behaviour.',
      'No implicit role="alert": whether an error interrupts depends on when it appears, which is application context.',
    ],
    snippets: [
      defineSnippet({
        id: 'field-angular-basic',
        language: 'angular',
        label: 'A described field',
        source:
          '<div slField invalid>\n  <label slFieldLabel>Email</label>\n  <input slFieldControl name="email" />\n  <p slFieldDescription>Used for sign-in</p>\n  <p slFieldError>Email is not valid</p>\n</div>',
      }),
    ],
  },
  fieldLabel: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  fieldDescription: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  fieldError: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  fieldControl: {
    api: apiRows([
      ['slFieldControl', 'directive', '—', 'SlFieldControl', 'Applies the wiring to any element'],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
} as const;
