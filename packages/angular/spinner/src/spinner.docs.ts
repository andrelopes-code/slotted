import spinnerTokens from '@slotted/styles/spinner/tokens.json';
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

export const ANGULAR_SPINNER_TOKENS = spinnerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Spinner decision',
}));

export const ANGULAR_SPINNER_DOCS = {
  spinner: {
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'slSpinner', 'Diameter of the ring'],
      ['label', 'string', 'Loading', 'slSpinner', 'Text the status region announces'],
      [
        'decorative',
        'boolean',
        'false',
        'slSpinner',
        'Drops the status role and the label from the accessibility tree',
      ],
    ]),
    accessibility: [
      'The root is role="status", a polite live region, so the label is announced when the spinner appears rather than interrupting.',
      'The label is hidden text inside that region, not an aria-label, because a live region announces content and an attribute is not content.',
      'The ring carries aria-hidden, so a screen reader reads the label once and not the shape.',
      'Use decorative whenever visible text beside the spinner already reports the wait. Two announcements of one wait is one too many.',
      'The ring is painted in currentColor and slows rather than stops under prefers-reduced-motion, since a frozen ring still claims to be reporting something.',
    ],
    snippets: [
      defineSnippet({
        id: 'spinner-angular-standalone',
        language: 'angular',
        label: 'Reporting a wait on its own',
        source: '<span slSpinner label="Loading invoices"></span>',
      }),
      defineSnippet({
        id: 'spinner-angular-decorative',
        language: 'angular',
        label: 'Beside text that already reports the wait',
        source: '<p><span slSpinner decorative size="sm"></span> Saving your changes</p>',
      }),
    ],
  },
} as const;
