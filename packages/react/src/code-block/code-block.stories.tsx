import type { CodeLine } from '@slotted/core/code';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Tab, TabList, TabPanel, Tabs } from '../tabs';
import { CodeBlock } from './code-block';
import { CodeBlockDefaultsProvider } from './code-block-defaults';
import { REACT_CODE_BLOCK_DOCS, REACT_CODE_BLOCK_TOKENS } from './code-block.docs';
import type { CodeBlockProps } from './code-block.types';

/* ── Samples ────────────────────────────────────────────────────────────── */

const GROUP_TS = [
  'export function ruleFor(',
  '  group: FilterGroup | null | undefined,',
  '  field: string,',
  '): FilterDescriptor | undefined {',
  '  // The first level as a map: what a column header reads.',
  '  return firstLevelRules(group).find((rule) => rule.field === field)?.filter;',
  '}',
  '',
  "const DEFAULT_PREFIX = 'f.';",
  'const LIMIT = 2;',
].join('\n');

const DIFF_CSS = [
  "[data-ui='code-block'] {",
  '  color: #0f172a;',
  '  background: #f8fafd;',
  '  color: var(--slotted-text);',
  '  background: var(--slotted-surface-sunken);',
  '  font-family: var(--slotted-font-family-mono);',
  '}',
].join('\n');

const DEPLOY_SH = [
  'pnpm --filter @slotted/core build && pnpm --filter @slotted/themes build && node tools/harness/build.mjs code-block && node tools/harness/shoot.mjs code-block --scheme dark',
  '    --width 420 --density dense --dir rtl --out /tmp/claude-1000/-home-dreco-dev-slotted/scratchpad/shots/code-block-wrapped-continuation-keeps-the-indent.png',
  'rm -rf tools/harness/out # refused: the harness output is shared',
  'git add -A # another lane writes here',
].join('\n');

const CONTRACT_JSON = [
  '{',
  '  "family": "code-block",',
  '  "stateModel": {',
  '    "pressed": { "controlled": "wrap", "request": "onWrapChange" },',
  '    "revealed": { "controlled": "revealed", "request": "onRevealedChange" }',
  '  },',
  '  "scopes": ["comment", "keyword", "string"],',
  '  "labels": ["region", "copy"],',
  '  "imperative": ["copy()"]',
  '}',
].join('\n');

const ORDERS_CSV = [
  'id,customer,status,amount',
  'PED-48211,Ana Souza,paid,1250.90',
  'PED-48212,Bruno Lima,pending,89.90',
  'PED-48219,Mariana Costa,refunded,412.00',
].join('\n');

const LOG = Array.from(
  { length: 40 },
  (_, index) =>
    `${String(index + 1).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}  ${index % 9 === 0 ? 'WARN' : 'INFO'}  worker-${(index % 4) + 1}  ${index % 9 === 0 ? 'retrying upload after 503' : 'processed batch of 250 rows'}`,
).join('\n');

/**
 * A toy tokenizer for the page: keywords, strings, numbers, comments,
 * punctuation. A real application hands the block Prism or Shiki through the
 * two mappings in `@slotted/core/code`; the page has neither and needs
 * nothing that heavy to show what a token looks like.
 */
const KEYWORDS = new Set([
  'export',
  'function',
  'return',
  'const',
  'let',
  'import',
  'from',
  'null',
  'undefined',
  'true',
  'false',
]);
function tokenize(code: string): CodeLine[] {
  return code.split('\n').map((line) => {
    const tokens: {
      text: string;
      scope?: 'comment' | 'keyword' | 'string' | 'number' | 'punctuation' | 'constant' | 'property';
    }[] = [];
    const comment = line.indexOf('//');
    const source = comment === -1 ? line : line.slice(0, comment);
    for (const piece of source
      .split(/("[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[{}()[\];:,.=<>|?]+|\s+)/)
      .filter(Boolean)) {
      if (/^["']/.test(piece)) tokens.push({ scope: 'string', text: piece });
      else if (/^\d/.test(piece)) tokens.push({ scope: 'number', text: piece });
      else if (piece === 'null' || piece === 'undefined' || piece === 'true' || piece === 'false')
        tokens.push({ scope: 'constant', text: piece });
      else if (KEYWORDS.has(piece)) tokens.push({ scope: 'keyword', text: piece });
      else if (/^[{}()[\];:,.=<>|?]+$/.test(piece))
        tokens.push({ scope: 'punctuation', text: piece });
      else if (/^"[^"]*"$/.test(piece)) tokens.push({ scope: 'property', text: piece });
      else tokens.push({ text: piece });
    }
    if (comment !== -1) tokens.push({ scope: 'comment', text: line.slice(comment) });
    return tokens;
  });
}
const highlight = async (code: string) => tokenize(code);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CODE_BLOCK_DOCS.codeBlock.scenes, {
    playground: Playground,
    highlight: Highlight,
    engines: Engines,
    lineNumbers: LineNumbers,
    marks: Marks,
    diff: Diff,
    focus: Focus,
    wrap: Wrap,
    title: Title,
    collapse: Collapse,
    maxLines: MaxLines,
    copy: Copy,
    loading: Loading,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  });

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  args: { code: GROUP_TS },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'CodeBlock',
        description:
          'A code block: title, line numbers, marks, wrapping, copy, collapse — and the tokens of an engine that stays outside the family, painted by the theme’s scope scale.',
        framework: 'React',
        ...REACT_CODE_BLOCK_DOCS.codeBlock,
        tokens: REACT_CODE_BLOCK_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

function Block(props: Partial<CodeBlockProps>) {
  return <CodeBlock code={GROUP_TS} highlight={highlight} language="ts" {...props} />;
}

export const Playground: Story = {
  args: {
    code: GROUP_TS,
    collapseAfter: undefined,
    copy: true,
    language: 'ts',
    lineNumbers: true,
    loading: false,
    title: 'group.ts',
  },
  argTypes: {
    collapseAfter: { control: 'number' },
    copy: { control: 'boolean' },
    lineNumbers: { control: 'boolean' },
    loading: { control: 'boolean' },
    title: { control: 'text' },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Block marks={{ highlight: '5-6' }} {...args} />
    </div>
  ),
};

function LateHighlight() {
  const [engine, setEngine] = useState<typeof highlight | null>(null);
  return (
    <>
      <CodeBlock code={GROUP_TS} highlight={engine} language="ts" lineNumbers title="group.ts" />
      <p>
        <Button onClick={() => setEngine(() => highlight)} size="sm" variant="outline">
          Entregar o motor agora
        </Button>
      </p>
    </>
  );
}

export const Highlight: Story = {
  parameters: scenario('highlight'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Plain text, then tokens"
        note="Press the button: the tokens enter the same lines, at the same height. Switch the scheme in the bar and the twelve colors change with it."
      >
        <LateHighlight />
      </Scene>
    </Grid>
  ),
};

export const Engines: Story = {
  parameters: scenario('engines'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The two adapters"
        note="The block below receives ready-made tokens — what fromPrismTokens or fromShikiTokens return — and runs no engine at all."
      >
        <CodeBlock code={GROUP_TS} language="ts" tokens={tokenize(GROUP_TS)} />
      </Scene>
    </Grid>
  ),
};

export const LineNumbers: Story = {
  parameters: scenario('lineNumbers'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="lineNumbers · start={98}"
        note="The gutter measures three characters to reach 107; select across the block and paste: the numbers do not come along."
      >
        <Block lineNumbers start={98} />
      </Scene>
    </Grid>
  ),
};

export const Marks: Story = {
  parameters: scenario('marks'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="highlight, error, warning"
        note="The first line highlighted with the accent, the third in danger, the fourth in warning — each with the bar at its edge."
      >
        <CodeBlock
          code={DEPLOY_SH}
          highlight={highlight}
          language="sh"
          marks={{ error: '3', highlight: '1', warning: [4] }}
          title="deploy.sh"
        />
      </Scene>
    </Grid>
  ),
};

export const Diff: Story = {
  parameters: scenario('diff'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two lines removed, three added"
        note="The signs in the gutter are CSS; copy and the two removed lines stay out."
      >
        <CodeBlock
          code={DIFF_CSS}
          highlight={highlight}
          language="css"
          lineNumbers
          marks={{ add: '4-6', remove: '2-3' }}
        />
      </Scene>
    </Grid>
  ),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='focus: "3-6"'
        note="Lines outside the range fade; hover over the block and everything comes back."
      >
        <CodeBlock
          code={CONTRACT_JSON}
          highlight={highlight}
          language="json"
          marks={{ focus: '3-6' }}
          title="contract.json"
        />
      </Scene>
    </Grid>
  ),
};

export const Wrap: Story = {
  parameters: scenario('wrap'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A long command line"
        note="On the left it scrolls; on the right it starts wrapped, with the continuation indented to the line’s own indent. The control exists only while a line overflows."
      >
        <>
          <CodeBlock code={DEPLOY_SH} highlight={highlight} language="sh" title="deploy.sh" />
          <CodeBlock
            code={DEPLOY_SH}
            defaultWrap
            highlight={highlight}
            language="sh"
            title="deploy.sh"
          />
        </>
      </Scene>
    </Grid>
  ),
};

export const Title: Story = {
  parameters: scenario('title'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A .ts and a .csv"
        note="The glyph follows the kind of file: a text sheet, a table sheet. The language stays at the end of the header."
      >
        <>
          <Block title="packages/core/src/filter/group.ts" />
          <CodeBlock code={ORDERS_CSV} language="csv" title="orders-2026-09.csv" />
        </>
      </Scene>
    </Grid>
  ),
};

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="collapseAfter={6}"
        note="Four lines behind the control; the sixth fades into it. Reveal, put focus in the body and press Escape."
      >
        <CodeBlock
          code={CONTRACT_JSON}
          collapseAfter={6}
          highlight={highlight}
          language="json"
          lineNumbers
          title="contract.json"
        />
      </Scene>
    </Grid>
  ),
};

export const MaxLines: Story = {
  parameters: scenario('maxLines'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="maxLines={12} over 40 lines"
        note="The body scrolls and is a named region: Tab reaches it, the arrows scroll."
      >
        <CodeBlock code={LOG} language="text" lineNumbers maxLines={12} title="deploy.log" />
      </Scene>
    </Grid>
  ),
};

function CopyDemo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <>
      <CodeBlock
        code={DIFF_CSS}
        language="css"
        marks={{ remove: '2-3' }}
        onCopy={(request) => setLast(request.value)}
      />
      {last !== null ? <CodeBlock code={last} language="css" title="Texto copiado" /> : null}
    </>
  );
}

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="What the copy writes"
        note="Press the control: the check stays for two seconds, and the box below shows the text that went to the clipboard — without the removed lines."
      >
        <CopyDemo />
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="loading, and empty code"
        note="Skeletons at the height of six lines with no copy control; below, an empty string is a numbered line."
      >
        <>
          <CodeBlock code="" loading title="deploy.log" />
          <CodeBlock code="" language="ts" lineNumbers title="empty.ts" />
        </>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="400 characters, RTL, hostile HTML"
        note="In a narrow column the long line scrolls; under wrap it breaks at the token. The Arabic block reads LTR. The script is text."
      >
        <>
          <Measure>
            <CodeBlock code={'x'.repeat(400)} defaultWrap language="text" />
          </Measure>
          <div dir="rtl">
            <CodeBlock
              code={'const مرحبا = "أهلا";\nconsole.log(مرحبا);'}
              highlight={highlight}
              language="js"
              title="مرحبا.js"
            />
          </div>
          <CodeBlock code={'<script>alert(1)</script>'} language="html" />
        </>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tabs, an action, the provider"
        note="Two files in tabs; a Run button beside copy; the engine handed once by the provider to both."
      >
        <CodeBlockDefaultsProvider highlight={highlight} lineNumbers>
          <Tabs defaultValue="ts">
            <TabList aria-label="Ficheiros">
              <Tab value="ts">group.ts</Tab>
              <Tab value="css">code-block.css</Tab>
            </TabList>
            <TabPanel value="ts">
              <CodeBlock
                actions={
                  <Button size="sm" tone="secondary" variant="ghost">
                    Run
                  </Button>
                }
                code={GROUP_TS}
                language="ts"
                title="group.ts"
              />
            </TabPanel>
            <TabPanel value="css">
              <CodeBlock code={DIFF_CSS} language="css" title="code-block.css" />
            </TabPanel>
          </Tabs>
        </CodeBlockDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tab to the body"
        note="Copy, wrap, and the body — because the line overflows — in this order; in the body, the arrows scroll."
      >
        <CodeBlock
          code={DEPLOY_SH}
          highlight={highlight}
          language="sh"
          lineNumbers
          title="deploy.sh"
        />
      </Scene>
    </Grid>
  ),
};
