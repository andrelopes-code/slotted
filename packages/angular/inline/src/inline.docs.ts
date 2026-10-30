import inlineTokens from '@slotted/styles/inline/tokens.json';
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

export const ANGULAR_INLINE_TOKENS = inlineTokens.map((name) => ({
  name,
  purpose: 'The foundation scale this family reads',
}));

const GAP = '0 | 1 | … | 12';

export const ANGULAR_INLINE_DOCS = {
  inline: {
    api: apiRows([
      ['gap', GAP, '4', 'slInline', 'Separation between items, as a step on the space scale'],
      [
        'align',
        "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
        'center',
        'slInline',
        'Positions items across the flow; baseline puts their type on one line',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",
        '—',
        'slInline',
        'Positions items along the flow, and distributes the space between them',
      ],
      [
        'wrap',
        "'wrap' | 'nowrap'",
        'wrap',
        'slInline',
        'nowrap keeps one line, and overflows a container narrower than it',
      ],
    ]),
    accessibility: [
      'slInline has no role and no ARIA. It arranges what the consumer wrote, and the items keep whatever semantics they already had.',
      'The directive selector is an attribute, so the element is always the consumer’s. Write ul when the items are list items.',
      'There is no input that reverses the items. Visual order stays DOM order, which is what WCAG 2.2 SC 1.3.2 asks for (technique C27, failure F1) and what keeps the Tab order matching the page.',
      'Wrapping is the default because a row that cannot wrap has one answer to a narrow container: overflow it. Asking for nowrap is asking for that, and WCAG 1.4.10 Reflow is what it costs.',
      'baseline is the alignment for items that carry text of different sizes. It puts the type on one line where centring only puts the boxes there.',
    ],
    snippets: [
      defineSnippet({
        id: 'inline-angular-actions',
        language: 'angular',
        label: 'Cancel and confirm, pushed apart',
        source:
          '<div slInline [gap]="4" justify="between">\n  <button slButton variant="secondary">Cancel</button>\n  <button slButton>Save changes</button>\n</div>',
      }),
      defineSnippet({
        id: 'inline-angular-tags',
        language: 'angular',
        label: 'A list of tags that wraps',
        source:
          '<ul slInline [gap]="2">\n  @for (tag of tags; track tag) {\n    <li>\n      <span slTag>{{ tag }}</span>\n    </li>\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'inline-angular-baseline',
        language: 'angular',
        label: 'A label and a value on one line',
        source:
          '<div slInline [gap]="5" align="baseline">\n  <span slText tone="muted">Status</span>\n  <span slText size="lg" weight="semibold">Awaiting review</span>\n</div>',
      }),
    ],
  },
} as const;
