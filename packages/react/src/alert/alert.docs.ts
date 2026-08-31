import alertTokens from '@slotted/styles/alert/tokens.json';
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

export const REACT_ALERT_TOKENS = alertTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Alert decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_ALERT_DOCS = {
  alert: {
    api: apiRows([
      [
        'variant',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        'accent',
        'Alert',
        'Tone the message is painted in',
      ],
      [
        'fill',
        "'subtle' | 'outline' | 'solid'",
        'subtle',
        'Alert',
        'How much of the tone is painted',
      ],
      ['size', "'sm' | 'md'", 'md', 'Alert', 'Padding and type size'],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'Alert',
        'Whether, and how loudly, the message is announced',
      ],
      ['render', '(props) => ReactNode', '—', 'Alert', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'live="off" is the default and sets no role. A message that is on the page before anyone reads it is read in document order, like any other text.',
      'live="polite" sets role="status": the message is announced when a screen reader next pauses. This is the right choice for a result — saved, deleted, sent.',
      'live="assertive" sets role="alert" and cuts the reader off mid-sentence. Reserve it for something that has gone wrong right now and cannot wait.',
      'A live region must be in the document before the message appears in it. An alert rendered for the first time with its text already inside may not be announced at all.',
      'The icon is hidden from assistive technology, because the tone it carries is already in the words. Pass aria-hidden={false} if it says something the text does not.',
      'Tone is never the only carrier of meaning: a danger alert says what went wrong in words, not only in red.',
    ],
    snippets: [
      defineSnippet({
        id: 'alert-react-result',
        language: 'tsx',
        label: 'The result of an action',
        source:
          '<Alert live="polite" variant="success">\n  <AlertIcon>✓</AlertIcon>\n  <AlertTitle>Invoice sent</AlertTitle>\n</Alert>;',
      }),
      defineSnippet({
        id: 'alert-react-actions',
        language: 'tsx',
        label: 'A message with something to do about it',
        source:
          '<Alert variant="danger">\n  <AlertTitle>Payment failed</AlertTitle>\n  <AlertDescription>The card was declined.</AlertDescription>\n  <AlertActions>\n    <Button size="sm">Try another card</Button>\n  </AlertActions>\n</Alert>;',
      }),
    ],
  },
  alertIcon: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  alertTitle: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  alertDescription: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  alertActions: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
