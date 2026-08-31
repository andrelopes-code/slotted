import switchTokens from '@slotted/styles/switch/tokens.json';
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

export const REACT_SWITCH_TOKENS = switchTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Switch decision',
}));

const FROM_FIELD = 'from the field, or false';

export const REACT_SWITCH_DOCS = {
  switch: {
    api: apiRows([
      ['checked', 'boolean', 'false', 'Switch', 'The setting, when the consumer holds it'],
      [
        'defaultChecked',
        'boolean',
        'false',
        'Switch',
        'The starting setting when the consumer holds none',
      ],
      [
        'onCheckedChange',
        '(checked: boolean) => void',
        '—',
        'Switch',
        'Called with the new setting each time it turns',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Switch', 'The track and thumb scale'],
      ['type', "'button' | 'submit' | 'reset'", 'button', 'Switch', 'Never submits by default'],
      [
        'disabled',
        'boolean',
        FROM_FIELD,
        'Switch',
        'Removes the control from the tab order and stops it turning',
      ],
      ['invalid', 'boolean', FROM_FIELD, 'Switch', 'Sets aria-invalid and the error border'],
      [
        'required',
        'boolean',
        FROM_FIELD,
        'Switch',
        'Sets aria-required, never the native attribute',
      ],
      ['className', 'string', '—', 'Switch', 'Additional class names'],
    ]),
    accessibility: [
      'The control is a button reporting role="switch" and aria-checked, which is the Authoring Practices pattern. It binds no keys — a button already answers Space and Enter.',
      'It is not an <input type="checkbox">, so it does not submit with a form. Drawing a track and a thumb on a checkbox needs pseudo-elements on a replaced element, which no specification promises. A consumer who needs form submission adds a hidden input beside it.',
      'There is no read-only state. A setting that cannot be changed is disabled, with an explanation beside it — a control that looks operable and swallows the click is worse than one that says it is unavailable.',
      'Inside a Field the control takes the field’s id, so the label’s for resolves to it, and joins the field’s aria-describedby after any value the consumer set.',
      'Every shared state is undefined by default. Unset defers to the field; set wins over it in both directions, so an explicitly enabled input inside a disabled field stays enabled.',
      'required sets aria-required and never the native attribute. The native one engages browser constraint validation and changes submit behaviour, which the library must not impose as a side effect of describing a field. Write required on the control yourself to opt in; it survives.',
      'disabled is set natively, because removing the control from the tab order and from form submission is exactly what the word means.',
      'The resolved state is mirrored onto the control as data attributes, so an input outside a field looks the same as one inside it.',
      'The control registers with the field, so the field’s development-time warning about a missing control does not fire for a field holding a Switch.',
    ],
    snippets: [
      defineSnippet({
        id: 'switch-react-field',
        language: 'tsx',
        label: 'A setting that takes effect as it is turned',
        source:
          '<Field>\n  <FieldLabel>Email alerts</FieldLabel>\n  <Switch checked={alerts} onCheckedChange={setAlerts} />\n  <FieldDescription>Sent when a build fails.</FieldDescription>\n</Field>;',
      }),
    ],
  },
} as const;
