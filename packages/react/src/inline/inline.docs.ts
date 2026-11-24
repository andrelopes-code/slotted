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

export const REACT_INLINE_TOKENS = inlineTokens.map((name) => ({
  name,
  purpose: 'The space scale that gap reads.',
}));

const GAP = '0 | 1 | … | 12';

export const REACT_INLINE_DOCS = {
  inline: {
    api: apiRows([
      [
        'gap',
        GAP,
        '4',
        'Inline',
        'Sets the separation between items as a step on the space scale.',
      ],
      [
        'align',
        "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
        'center',
        'Inline',
        'Positions items across the row, along the block axis. baseline puts their text on one line.',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",
        '—',
        'Inline',
        'Positions items along the row and distributes the free space between them.',
      ],
      [
        'wrap',
        "'wrap' | 'nowrap'",
        'wrap',
        'Inline',
        'Decides what happens when the row is full. nowrap keeps one line and overflows a container narrower than it.',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Inline',
        'Renders a different root element from the props it receives.',
      ],
    ]),
    accessibility: [
      'Inline has no role and no ARIA. It arranges what you write inside it, and the items keep whatever semantics they already had.',
      'There is no axis that reverses the items. Visual order stays DOM order, which is what WCAG 2.2 SC 1.3.2 asks for (technique C27, failure F1) and what keeps the Tab order matching the page.',
      'Wrapping is the default because a row that cannot wrap has one answer to a narrow container: overflow it. nowrap accepts that overflow, so check WCAG 1.4.10 Reflow before choosing it.',
      'baseline is the alignment for items that carry text of different sizes. It puts the type on one line where centering only puts the boxes there.',
      'Alignment and distribution use the logical keywords, so a right-to-left document is the same row mirrored.',
    ],
    snippets: [
      defineSnippet({
        id: 'inline-react-actions',
        language: 'tsx',
        label: 'Cancel and confirm, pushed apart',
        source:
          '<Inline gap={4} justify="between">\n  <Button tone="secondary" variant="outline">\n    Cancel\n  </Button>\n  <Button>Save changes</Button>\n</Inline>;',
      }),
      defineSnippet({
        id: 'inline-react-tags',
        language: 'tsx',
        label: 'A list of tags that wraps',
        source:
          '<Inline gap={2} render={(props) => <ul {...props} />}>\n  {tags.map((tag) => (\n    <li key={tag}>\n      <Tag>{tag}</Tag>\n    </li>\n  ))}\n</Inline>;',
      }),
      defineSnippet({
        id: 'inline-react-baseline',
        language: 'tsx',
        label: 'A label and a value on one line',
        source:
          '<Inline align="baseline" gap={5}>\n  <Text tone="muted">Status</Text>\n  <Text size="lg" weight="semibold">\n    Awaiting review\n  </Text>\n</Inline>;',
      }),
    ],
  },
} as const;
