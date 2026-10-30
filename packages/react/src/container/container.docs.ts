import containerTokens from '@slotted/styles/container/tokens.json';
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

export const REACT_CONTAINER_TOKENS = containerTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-container-')
    ? 'A maximum this family owns, because the foundation has no scale of widths'
    : 'The foundation scale this family reads',
}));

const SIZE = "'measure' | 'content' | 'wide' | 'full' | 'bleed'";
const INSET = '0 | 1 | … | 12';

export const REACT_CONTAINER_DOCS = {
  container: {
    api: apiRows([
      [
        'size',
        SIZE,
        'content',
        'Container',
        'What the column bounds. measure is the comfortable reading line, counted in characters; full is the space the frame gives up to --slotted-container-full, 120rem; bleed removes the maximum. Both keep the inset',
      ],
      [
        'inset',
        INSET,
        '6',
        'Container',
        'The gap between the column and the edge of the space the container was given, as a step on the space scale',
      ],
      [
        'align',
        "'center' | 'start' | 'end'",
        'center',
        'Container',
        'Where the column sits when there is space left over. Logical, so a right-to-left document mirrors',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Container, ContainerBreakout',
        'Renders a different root element',
      ],
    ]),
    accessibility: [
      'Container has no role and no ARIA. It bounds what the consumer wrote, and the children keep whatever semantics they already had. Render a main, a section or an article through render so the document says what it means.',
      'size="measure" bounds the line at 65ch. WCAG 2.2 SC 1.4.8 asks for no more than 80 characters per line, and technique C20 asks that the width be set in a relative measurement; ch is relative to the inherited type, so the bound follows a reader who enlarges the text rather than fighting them.',
      'Every other step is stated in rem, so the whole page grows with the browser zoom WCAG SC 1.4.4 requires.',
      'The column collapses continuously through min(), and every child is allowed to shrink below its content, so a long unbroken token overflows its own box rather than widening the page — the two-axis scroll SC 1.4.10 refuses.',
      'Nothing reorders children. Visual order stays DOM order, which is what SC 1.3.2 asks for, and a breakout is read where it is written.',
      'The root is a grid, so a run of text written directly inside it becomes an item nothing can place in the column. Wrap text in an element.',
    ],
    snippets: [
      defineSnippet({
        id: 'container-react-page',
        language: 'tsx',
        label: 'A reading page holding a table that reaches both edges',
        source:
          '<Container render={(props) => <main {...props} />} size="measure">\n  <Stack gap={6}>\n    <Heading level={1}>Usage this month</Heading>\n    <Text>Billed per seat, settled with the invoice.</Text>\n  </Stack>\n  <ContainerBreakout>\n    <UsageTable />\n  </ContainerBreakout>\n  <Text>Bounded content resumes at the same column.</Text>\n</Container>;',
      }),
      defineSnippet({
        id: 'container-react-nested',
        language: 'tsx',
        label: 'Bounded content returns inside a breakout',
        source:
          '<Container size="measure">\n  <Article />\n  <ContainerBreakout style={{ background: \'var(--slotted-surface-sunken)\' }}>\n    <Container size="wide" inset={9}>\n      <RelatedAccounts />\n    </Container>\n  </ContainerBreakout>\n</Container>;',
      }),
      defineSnippet({
        id: 'container-react-defaults',
        language: 'tsx',
        label: 'An application decides once what its pages are bounded to',
        source:
          '<ContainerDefaultsProvider inset={8} size="wide">\n  <App />\n</ContainerDefaultsProvider>;',
      }),
      defineSnippet({
        id: 'container-maxima',
        language: 'css',
        label: 'Retuning the maxima, which is the whole theming story',
        source:
          "[data-slotted-theme='acme'] {\n  --slotted-container-measure: 60ch;\n  --slotted-container-content: 48rem;\n  --slotted-container-wide: 90rem;\n}",
      }),
    ],
  },
} as const;
