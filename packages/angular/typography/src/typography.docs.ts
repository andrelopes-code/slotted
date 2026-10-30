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

export const ANGULAR_TYPOGRAPHY_TOKENS = typographyTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-typography-')
    ? 'A decision the type scale does not hold'
    : 'The foundation scale this family reads',
}));

const SIZE = "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'";
const TONE =
  "'inherit' | 'default' | 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'inverse'";
const WRAP = "'normal' | 'nowrap' | 'balance' | 'pretty'";

export const ANGULAR_TYPOGRAPHY_DOCS = {
  text: {
    api: apiRows([
      ['size', SIZE, 'md', 'slText', 'Step on the type scale, with the line height paired to it'],
      ['weight', "'regular' | 'medium' | 'semibold'", 'regular', 'slText', 'Typographic emphasis'],
      ['tone', TONE, 'inherit', 'slText', 'Colour; inherit takes the colour of the surface'],
      [
        'align',
        "'start' | 'center' | 'end'",
        '—',
        'slText',
        'Alignment, which turns an inline element into a block',
      ],
      ['wrap', WRAP, '—', 'slText', 'How lines break'],
      [
        'transform',
        "'none' | 'uppercase' | 'capitalize'",
        '—',
        'slText',
        'Letter case, with the tracking capitals need',
      ],
      ['numeric', "'normal' | 'tabular'", '—', 'slText', 'Tabular figures for a column of numbers'],
      [
        'truncate',
        'boolean | number',
        '—',
        'slText',
        'Keeps one line, or the given number; the string stays whole',
      ],
    ]),
    accessibility: [
      'The directive sits on the element the consumer wrote, so the semantics are whatever that element already means. A span is not a paragraph.',
      'Truncation is CSS, not content: the whole string stays in the document, so a screen reader reads it, a page search finds it and a selection copies it. Only the picture is shorter.',
      'A truncated line gives a sighted pointer user no way to see the rest. Compose a Tooltip, or reveal the value, when the hidden part carries meaning.',
      'The size scale is stated in rem, so text doubles under the browser zoom that WCAG 1.4.4 requires and reflows under 1.4.10.',
      'A word longer than its container breaks rather than escaping it, and the element stops demanding the width of its longest token, so a narrow layout reflows instead of scrolling sideways.',
    ],
    snippets: [
      defineSnippet({
        id: 'typography-angular-paragraph',
        language: 'angular',
        label: 'The element is the consumer’s',
        source:
          '<p slText wrap="pretty">Invoices are issued on the first working day of each month.</p>',
      }),
      defineSnippet({
        id: 'typography-angular-truncate',
        language: 'angular',
        label: 'Two lines kept, the string whole',
        source: '<p slText [truncate]="2">{{ note }}</p>',
      }),
      defineSnippet({
        id: 'typography-angular-figures',
        language: 'angular',
        label: 'A column of figures aligns on its digits',
        source: '<span slText align="end" numeric="tabular">{{ amount }}</span>',
      }),
    ],
  },
  heading: {
    api: apiRows([
      [
        'size',
        SIZE,
        'level',
        'slHeading',
        'Step on the type scale; follows the rank until it is set',
      ],
      [
        'weight',
        "'regular' | 'medium' | 'semibold'",
        'semibold',
        'slHeading',
        'Typographic emphasis',
      ],
      ['tone', TONE, 'inherit', 'slHeading', 'Colour; inherit takes the colour of the surface'],
      ['wrap', WRAP, 'balance', 'slHeading', 'How lines break; a heading is balanced by default'],
      ['align', "'start' | 'center' | 'end'", '—', 'slHeading', 'Alignment'],
      ['transform', "'none' | 'uppercase' | 'capitalize'", '—', 'slHeading', 'Letter case'],
      ['numeric', "'normal' | 'tabular'", '—', 'slHeading', 'Tabular figures'],
      [
        'truncate',
        'boolean | number',
        '—',
        'slHeading',
        'Keeps the given number of lines; the string stays whole',
      ],
    ]),
    accessibility: [
      'The rank is the element, and the element is the one the consumer wrote: slHeading applies to h1 through h6 and reads the rank from the tag. There is no level input, because the template already states it.',
      'slHeadingLevel makes a subtree one section deeper. It sits on the section element the consumer already has, so it adds nothing to the DOM.',
      'The HTML Standard requires each heading to be less than, equal to, or one greater than the heading before it. A tag deeper than the section allows is reported in development and still rendered: the consumer wrote it.',
      'The platform has six ranks. Nesting slHeadingLevel past the sixth says so, rather than emitting a role=heading with aria-level and losing native semantics.',
      'A heading names the section it opens (WCAG 2.4.6). Give it the content, not a size: rank and size are separate for exactly that reason.',
    ],
    snippets: [
      defineSnippet({
        id: 'typography-angular-outline',
        language: 'angular',
        label: 'The section states the rank it expects',
        source:
          '<h1 slHeading>Billing</h1>\n<section slHeadingLevel>\n  <h2 slHeading>Invoices</h2>\n</section>',
      }),
      defineSnippet({
        id: 'typography-angular-quiet-heading',
        language: 'angular',
        label: 'A rank that reads quietly',
        source: '<h2 slHeading size="md">Payment method</h2>',
      }),
    ],
  },
} as const;
