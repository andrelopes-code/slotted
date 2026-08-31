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

export const ANGULAR_ALERT_TOKENS = alertTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Alert decision',
}));

export const ANGULAR_ALERT_DOCS = {
  alert: {
    api: apiRows([
      [
        'variant',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        'accent',
        'slAlert',
        'Tone the message is painted in',
      ],
      [
        'fill',
        "'subtle' | 'outline' | 'solid'",
        'subtle',
        'slAlert',
        'How much of the tone is painted',
      ],
      ['size', "'sm' | 'md'", 'md', 'slAlert', 'Padding and type size'],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'slAlert',
        'Whether, and how loudly, the message is announced',
      ],
    ]),
    accessibility: [
      'live="off" is the default and sets no role. A message that is on the page before anyone reads it is read in document order, like any other text.',
      'live="polite" sets role="status": the message is announced when a screen reader next pauses. This is the right choice for a result — saved, deleted, sent.',
      'live="assertive" sets role="alert" and cuts the reader off mid-sentence. Reserve it for something that has gone wrong right now and cannot wait.',
      'A live region must be in the document before the message appears in it. An alert rendered for the first time with its text already inside may not be announced at all.',
      'The icon is hidden from assistive technology, because the tone it carries is already in the words. Put aria-hidden="false" on it if it says something the text does not.',
      'Tone is never the only carrier of meaning: a danger alert says what went wrong in words, not only in red.',
    ],
    snippets: [
      defineSnippet({
        id: 'alert-angular-result',
        language: 'angular',
        label: 'The result of an action',
        source:
          '<div slAlert live="polite" variant="success">\n  <span slAlertIcon>&#10003;</span>\n  <div slAlertTitle>Invoice sent</div>\n</div>',
      }),
      defineSnippet({
        id: 'alert-angular-actions',
        language: 'angular',
        label: 'A message with something to do about it',
        source:
          '<div slAlert variant="danger">\n  <div slAlertTitle>Payment failed</div>\n  <p slAlertDescription>The card was declined.</p>\n  <div slAlertActions>\n    <button slButton size="sm">Try another card</button>\n  </div>\n</div>',
      }),
    ],
  },
  alertIcon: { api: [], accessibility: [], snippets: [] },
  alertTitle: { api: [], accessibility: [], snippets: [] },
  alertDescription: { api: [], accessibility: [], snippets: [] },
  alertActions: { api: [], accessibility: [], snippets: [] },
} as const;
