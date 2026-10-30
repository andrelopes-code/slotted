import stackTokens from '@slotted/styles/stack/tokens.json';
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

export const ANGULAR_STACK_TOKENS = stackTokens.map((name) => ({
  name,
  purpose: 'The foundation scale this family reads',
}));

const GAP = '0 | 1 | … | 12';

export const ANGULAR_STACK_DOCS = {
  stack: {
    api: apiRows([
      ['gap', GAP, '6', 'slStack', 'Separation between children, as a step on the space scale'],
      [
        'align',
        "'start' | 'center' | 'end' | 'stretch'",
        '—',
        'slStack',
        'Positions children across the flow, which for a stack is the inline axis',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",
        '—',
        'slStack',
        'Positions children along the flow; moves nothing until the stack has a block size',
      ],
    ]),
    accessibility: [
      'slStack has no role and no ARIA. It arranges what the consumer wrote, and the children keep whatever semantics they already had.',
      'The directive selector is an attribute, so the element is always the consumer’s. Write ul when the children are list items and form when they are fields.',
      'There is no input that reverses the children. Visual order stays DOM order, which is what WCAG 2.2 SC 1.3.2 asks for (technique C27, failure F1) and what keeps the Tab order matching the page.',
      'Separation is a step on the space scale, stated in rem, so it grows with the browser zoom WCAG 1.4.4 requires.',
      'Alignment uses the logical keywords, so a right-to-left document is the same component mirrored rather than a second stylesheet.',
    ],
    snippets: [
      defineSnippet({
        id: 'stack-angular-form',
        language: 'angular',
        label: 'The element is the consumer’s',
        source:
          '<form slStack [gap]="6" (ngSubmit)="save()">\n  <input slInput name="email" />\n  <input slInput name="password" />\n</form>',
      }),
      defineSnippet({
        id: 'stack-angular-nested',
        language: 'angular',
        label: 'The outer stack separates sections, the inner separates lines',
        source:
          '<div slStack [gap]="8">\n  <div slStack [gap]="2">\n    <span slText weight="semibold">Payment method</span>\n    <span slText tone="muted">Visa ending 4242</span>\n  </div>\n  <div slStack [gap]="2">\n    <span slText weight="semibold">Billing address</span>\n    <span slText tone="muted">200 Maple Street</span>\n  </div>\n</div>',
      }),
      defineSnippet({
        id: 'stack-angular-shell',
        language: 'angular',
        label: 'Header, body and footer pushed apart',
        source:
          '<div slStack [gap]="4" justify="between" style="block-size: 100%">\n  <app-header />\n  <app-body />\n  <app-footer />\n</div>',
      }),
    ],
  },
} as const;
