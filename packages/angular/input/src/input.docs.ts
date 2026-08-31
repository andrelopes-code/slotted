import inputTokens from '@slotted/styles/input/tokens.json';
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

export const ANGULAR_INPUT_TOKENS = inputTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Input decision',
}));

const FROM_FIELD = 'from the field, or false';

export const ANGULAR_INPUT_DOCS = {
  input: {
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'slInput', 'The control’s height and type scale'],
      [
        'disabled',
        'boolean',
        FROM_FIELD,
        'slInput',
        'Removes the control from the tab order and from submission',
      ],
      ['invalid', 'boolean', FROM_FIELD, 'slInput', 'Sets aria-invalid and the error appearance'],
      [
        'required',
        'boolean',
        FROM_FIELD,
        'slInput',
        'Sets aria-required, never the native attribute',
      ],
      ['readOnly', 'boolean', FROM_FIELD, 'slInput', 'Keeps the value visible and uneditable'],
    ]),
    accessibility: [
      'Inside a field the control takes the field’s id, so the label’s for resolves to it, and joins the field’s aria-describedby after any value the consumer set.',
      'Every shared state is undefined by default. Unset defers to the field; set wins over it in both directions, so an explicitly enabled input inside a disabled field stays enabled.',
      'required sets aria-required and never the native attribute. The native one engages browser constraint validation and changes submit behaviour, which the library must not impose as a side effect of describing a field. Write required on the control yourself to opt in; it survives.',
      'disabled is set natively, because removing the control from the tab order and from form submission is exactly what the word means.',
      'The resolved state is mirrored onto the control as data attributes, so an input outside a field looks the same as one inside it.',
      'The control registers with the field, so the field’s development-time warning about a missing control does not fire for a field holding an Input.',
    ],
    snippets: [
      defineSnippet({
        id: 'input-angular-field',
        language: 'angular',
        label: 'A control that wires itself to the field around it',
        source:
          '<div slField invalid>\n  <label slFieldLabel>Email</label>\n  <input slInput type="email" />\n  <p slFieldError>That address is not valid.</p>\n</div>',
      }),
    ],
  },
} as const;
