import textareaTokens from '@slotted/styles/textarea/tokens.json';
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

export const REACT_TEXTAREA_TOKENS = textareaTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Textarea decision',
}));

const FROM_FIELD = 'from the field, or false';

export const REACT_TEXTAREA_DOCS = {
  textarea: {
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Textarea', 'The control’s padding and type scale'],
      ['rows', 'number', '3', 'Textarea', 'The smallest the control gets, in lines'],
      [
        'autoSize',
        'boolean',
        'false',
        'Textarea',
        'Grows with the content, up to --slotted-textarea-auto-size-max',
      ],
      [
        'disabled',
        'boolean',
        FROM_FIELD,
        'Textarea',
        'Removes the control from the tab order and from submission',
      ],
      ['invalid', 'boolean', FROM_FIELD, 'Textarea', 'Sets aria-invalid and the error appearance'],
      [
        'required',
        'boolean',
        FROM_FIELD,
        'Textarea',
        'Sets aria-required, never the native attribute',
      ],
      ['readOnly', 'boolean', FROM_FIELD, 'Textarea', 'Keeps the value visible and uneditable'],
      ['className', 'string', '—', 'Textarea', 'Additional class names'],
    ]),
    accessibility: [
      'Inside a Field the control takes the field’s id, so the label’s for resolves to it, and joins the field’s aria-describedby after any value the consumer set.',
      'Every shared state is undefined by default. Unset defers to the field; set wins over it in both directions, so an explicitly enabled input inside a disabled field stays enabled.',
      'required sets aria-required and never the native attribute. The native one engages browser constraint validation and changes submit behaviour, which the library must not impose as a side effect of describing a field. Write required on the control yourself to opt in; it survives.',
      'disabled is set natively, because removing the control from the tab order and from form submission is exactly what the word means.',
      'The resolved state is mirrored onto the control as data attributes, so an input outside a field looks the same as one inside it.',
      'The control registers with the field, so the field’s development-time warning about a missing control does not fire for a field holding a Textarea.',
      'autoSize is CSS field-sizing and nothing else — no measurement, no observer, no effect. Where a browser does not support the property the control keeps the block size rows gives it, which is a smaller box rather than a broken one.',
      'The resize handle is withdrawn while auto-sizing and while disabled, because in neither case is the size the reader’s to set.',
    ],
    snippets: [
      defineSnippet({
        id: 'textarea-react-auto-size',
        language: 'tsx',
        label: 'A control that grows with what is typed into it',
        source:
          '<Field>\n  <FieldLabel>Notes</FieldLabel>\n  <Textarea autoSize rows={2} />\n  <FieldDescription>Anything the team should know.</FieldDescription>\n</Field>;',
      }),
    ],
  },
} as const;
