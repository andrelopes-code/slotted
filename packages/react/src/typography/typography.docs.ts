import typographyTokens from '@slotted/styles/typography/tokens.json';
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

export const REACT_TYPOGRAPHY_TOKENS = typographyTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-typography-')
    ? 'A decision the type scale does not hold'
    : 'The foundation scale this family reads',
}));

const SIZE = "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'";
const TONE =
  "'inherit' | 'default' | 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'inverse'";
const WRAP = "'normal' | 'nowrap' | 'balance' | 'pretty'";

export const REACT_TYPOGRAPHY_DOCS = {
  text: {
    api: apiRows([
      ['size', SIZE, 'md', 'Text', 'Step on the type scale, with the line height paired to it'],
      ['weight', "'regular' | 'medium' | 'semibold'", 'regular', 'Text', 'Typographic emphasis'],
      ['tone', TONE, 'inherit', 'Text', 'Color; inherit takes the color of the surface'],
      [
        'align',
        "'start' | 'center' | 'end'",
        '—',
        'Text',
        'Alignment, which turns the span into a block',
      ],
      ['wrap', WRAP, '—', 'Text', 'How lines break'],
      [
        'transform',
        "'none' | 'uppercase' | 'capitalize'",
        '—',
        'Text',
        'Letter case, with the tracking capitals need',
      ],
      ['numeric', "'normal' | 'tabular'", '—', 'Text', 'Tabular figures for a column of numbers'],
      [
        'truncate',
        'boolean | number',
        '—',
        'Text',
        'Keeps one line, or the given number; the string stays whole',
      ],
      ['render', '(props) => ReactNode', '—', 'Text', 'Renders a different root element'],
    ]),
    accessibility: [
      'Truncation is CSS, not content: the whole string stays in the document, so a screen reader reads it, a page search finds it and a selection copies it. Only the picture is shorter.',
      'A truncated line gives a sighted pointer user no way to see the rest. Compose a Tooltip, or reveal the value, when the hidden part carries meaning.',
      'The size scale is stated in rem, so text doubles under the browser zoom that WCAG 1.4.4 requires and reflows under 1.4.10.',
      'A word longer than its container breaks rather than escaping it, and the element stops demanding the width of its longest token, so a narrow layout reflows instead of scrolling sideways.',
      'Text carries no role. A span is not a paragraph: render a p, a dd, or the element the content actually is.',
    ],
    snippets: [
      defineSnippet({
        id: 'typography-react-paragraph',
        language: 'tsx',
        label: 'A paragraph is a claim the consumer makes',
        source:
          '<Text render={(props) => <p {...props} />} wrap="pretty">\n  Invoices are issued on the first working day of each month.\n</Text>;',
      }),
      defineSnippet({
        id: 'typography-react-truncate',
        language: 'tsx',
        label: 'Two lines kept, the string whole',
        source: '<Text truncate={2}>{note}</Text>;',
      }),
      defineSnippet({
        id: 'typography-react-figures',
        language: 'tsx',
        label: 'A column of figures aligns on its digits',
        source: '<Text align="end" numeric="tabular">\n  {amount}\n</Text>;',
      }),
    ],
  },
  heading: {
    api: apiRows([
      [
        'level',
        '1 | 2 | 3 | 4 | 5 | 6',
        '—',
        'Heading',
        'The rank, which decides the element; taken from the section when absent',
      ],
      [
        'size',
        SIZE,
        'level',
        'Heading',
        'Step on the type scale; follows the rank until it is set',
      ],
      [
        'weight',
        "'regular' | 'medium' | 'semibold'",
        'semibold',
        'Heading',
        'Typographic emphasis',
      ],
      ['tone', TONE, 'inherit', 'Heading', 'Color; inherit takes the color of the surface'],
      ['wrap', WRAP, 'balance', 'Heading', 'How lines break; a heading is balanced by default'],
      ['align', "'start' | 'center' | 'end'", '—', 'Heading', 'Alignment'],
      ['transform', "'none' | 'uppercase' | 'capitalize'", '—', 'Heading', 'Letter case'],
      ['numeric', "'normal' | 'tabular'", '—', 'Heading', 'Tabular figures'],
      [
        'truncate',
        'boolean | number',
        '—',
        'Heading',
        'Keeps the given number of lines; the string stays whole',
      ],
    ]),
    accessibility: [
      'The rank is the element. A Heading renders h1 to h6, so the outline the browser and every screen reader already build is the one the page has.',
      'HeadingLevel makes a subtree one section deeper, and a Heading inside it takes the next rank. Nesting steps by exactly one, so an inferred rank can never skip.',
      'The HTML Standard requires each heading to be less than, equal to, or one greater than the heading before it. A stated level deeper than the section allows is reported in development and still rendered: the consumer decided it.',
      'The platform has six ranks. Nesting past the sixth keeps the heading at 6 and says so, rather than emitting a role=heading with aria-level and losing native semantics.',
      'A heading names the section it opens (WCAG 2.4.6). Give it the content, not a size: level and size are separate props for exactly that reason.',
    ],
    snippets: [
      defineSnippet({
        id: 'typography-react-outline',
        language: 'tsx',
        label: 'The section decides the rank',
        source:
          '<Heading>Billing</Heading>;\n<HeadingLevel>\n  <Heading>Invoices</Heading>\n</HeadingLevel>;',
      }),
      defineSnippet({
        id: 'typography-react-quiet-heading',
        language: 'tsx',
        label: 'A rank that reads quietly',
        source: '<Heading level={2} size="md">\n  Payment method\n</Heading>;',
      }),
    ],
  },
} as const;
