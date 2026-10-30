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

export const REACT_STACK_TOKENS = stackTokens.map((name) => ({
  name,
  purpose: 'The foundation scale this family reads',
}));

const GAP = '0 | 1 | … | 12';

export const REACT_STACK_DOCS = {
  stack: {
    api: apiRows([
      ['gap', GAP, '6', 'Stack', 'Separation between children, as a step on the space scale'],
      [
        'align',
        "'start' | 'center' | 'end' | 'stretch'",
        '—',
        'Stack',
        'Positions children across the flow, which for a stack is the inline axis',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",
        '—',
        'Stack',
        'Positions children along the flow; moves nothing until the stack has a block size',
      ],
      ['render', '(props) => ReactNode', '—', 'Stack', 'Renders a different root element'],
    ]),
    accessibility: [
      'Stack has no role and no ARIA. It arranges what the consumer wrote, and the children keep whatever semantics they already had.',
      'There is no axis that reverses the children. Visual order stays DOM order, which is what WCAG 2.2 SC 1.3.2 asks for (technique C27, failure F1) and what keeps the Tab order matching the page.',
      'The element is the consumer’s. Render a ul when the children are list items and a form when they are fields, so the document says what it means.',
      'Separation is a step on the space scale, stated in rem, so it grows with the browser zoom WCAG 1.4.4 requires.',
      'Alignment uses the logical keywords, so a right-to-left document is the same component mirrored rather than a second stylesheet.',
    ],
    snippets: [
      defineSnippet({
        id: 'stack-react-form',
        language: 'tsx',
        label: 'A form is a claim the consumer makes',
        source:
          '<Stack gap={6} render={(props) => <form {...props} onSubmit={save} />}>\n  <Field name="email" />\n  <Field name="password" />\n</Stack>;',
      }),
      defineSnippet({
        id: 'stack-react-nested',
        language: 'tsx',
        label: 'The outer stack separates sections, the inner separates lines',
        source:
          '<Stack gap={8}>\n  <Stack gap={2}>\n    <Text weight="semibold">Payment method</Text>\n    <Text tone="muted">Visa ending 4242</Text>\n  </Stack>\n  <Stack gap={2}>\n    <Text weight="semibold">Billing address</Text>\n    <Text tone="muted">200 Harbor Street</Text>\n  </Stack>\n</Stack>;',
      }),
      defineSnippet({
        id: 'stack-react-shell',
        language: 'tsx',
        label: 'Header, body and footer pushed apart',
        source:
          '<Stack gap={4} justify="between" style={{ blockSize: \'100%\' }}>\n  <Header />\n  <Body />\n  <Footer />\n</Stack>;',
      }),
    ],
  },
} as const;
