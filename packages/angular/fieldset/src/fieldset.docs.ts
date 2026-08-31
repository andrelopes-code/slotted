import fieldsetTokens from '@slotted/styles/fieldset/tokens.json';
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

export const ANGULAR_FIELDSET_TOKENS = fieldsetTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Fieldset decision',
}));

export const ANGULAR_FIELDSET_DOCS = {
  fieldset: {
    api: apiRows([
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'slFieldset',
        'How the grouped fields are arranged',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slFieldset',
        'Sets the native attribute, which disables every control inside',
      ],
      ['invalid', 'boolean', 'false', 'slFieldset', 'Marks the group and colours its legend'],
    ]),
    accessibility: [
      'A <fieldset> is already a group and a <legend> already names it, so the family adds no role, no aria-label and no aria-labelledby. Give every fieldset a legend; a group without a name is a group a screen reader cannot describe.',
      'disabled sets the native attribute and stops there. The platform disables every control inside, including ones this library has never seen.',
      'What that means is narrower than it looks: a control’s own disabled property stays false, because it reflects that control’s own attribute. The control becomes actually disabled — it matches :disabled, which is what makes it inert and what every control stylesheet here keys its disabled appearance on.',
      'invalid marks the group for the stylesheet and colours the legend. It reaches into none of the controls: which field is at fault is the field’s own to say, through its own invalid and its own error message.',
      'The legend is put back into the fieldset’s flex layout, which the browser otherwise floats it out of. That is the one browser behaviour this family undoes rather than uses.',
    ],
    snippets: [
      defineSnippet({
        id: 'fieldset-angular-basic',
        language: 'angular',
        label: 'Related fields under one name',
        source:
          '<fieldset slFieldset>\n  <legend slFieldsetLegend>Notifications</legend>\n  <div slField>\n    <label slFieldLabel>Email</label>\n    <input slInput type="email" />\n  </div>\n</fieldset>',
      }),
    ],
  },
  fieldsetLegend: { api: [], accessibility: [], snippets: [] },
} as const;
