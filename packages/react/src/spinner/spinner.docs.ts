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

export const REACT_SPINNER_TOKENS = spinnerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Spinner decision',
}));

export const REACT_SPINNER_DOCS = {
  spinner: {
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Spinner', 'Diameter of the ring'],
      ['label', 'string', 'Loading', 'Spinner', 'Text the status region announces'],
      [
        'decorative',
        'boolean',
        'false',
        'Spinner',
        'Drops the status role and the label from the accessibility tree',
      ],
      ['render', '(props) => ReactNode', '—', 'Spinner', 'Renders a different root element'],
      ['className', 'string', '—', 'Spinner', 'Additional class names'],
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
        id: 'spinner-react-standalone',
        language: 'tsx',
        label: 'Reporting a wait on its own',
        source: '<Spinner label="Loading invoices" />;',
      }),
      defineSnippet({
        id: 'spinner-react-decorative',
        language: 'tsx',
        label: 'Beside text that already reports the wait',
        source: '<p>\n  <Spinner decorative size="sm" /> Saving your changes\n</p>;',
      }),
    ],
  },
} as const;
