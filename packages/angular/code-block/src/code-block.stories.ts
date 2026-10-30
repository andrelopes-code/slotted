import { SlButton } from '@slotted/angular/button';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import type { CodeLine } from '@slotted/core/code';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCodeBlock, SlCodeBlockAction, SlCodeBlockLine } from './code-block';
import { provideCodeBlockDefaults } from './code-block.constants';
import { ANGULAR_CODE_BLOCK_DOCS, ANGULAR_CODE_BLOCK_TOKENS } from './code-block.docs';

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
  '    "pressed": { "controlled": "wrap", "request": "wrapChangeRequest" },',
  '    "revealed": { "controlled": "revealed", "request": "revealedChangeRequest" }',
  '  },',
  '  "scopes": ["comment", "keyword", "string"],',
  '  "labels": ["region", "copy"],',
  '  "imperative": ["copyCode()"]',
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
      else tokens.push({ text: piece });
    }
    if (comment !== -1) tokens.push({ scope: 'comment', text: line.slice(comment) });
    return tokens;
  });
}
const highlight = async (code: string) => tokenize(code);

interface CodeBlockStoryArgs {
  code: string;
  collapseAfter: number | undefined;
  copy: boolean;
  language: string;
  lineNumbers: boolean;
  loading: boolean;
  title: string;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CODE_BLOCK_DOCS.codeBlock.scenes, {
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
  }) as never;

const IMPORTS = [
  SlButton,
  SlCodeBlock,
  SlCodeBlockAction,
  SlCodeBlockLine,
  SlTab,
  SlTabList,
  SlTabPanel,
  SlTabs,
];

/** Every block on the page reads the same samples and the same toy engine. */
const SAMPLES = {
  contract: CONTRACT_JSON,
  css: DIFF_CSS,
  csv: ORDERS_CSV,
  deploy: DEPLOY_SH,
  group: GROUP_TS,
  highlight,
  log: LOG,
  long: 'x'.repeat(400),
  rtl: 'const مرحبا = "أهلا";\nconsole.log(مرحبا);',
  script: '<script>alert(1)</script>',
  tokens: tokenize(GROUP_TS),
};

const meta: Meta<CodeBlockStoryArgs> = {
  title: 'Components/CodeBlock',
  component: SlCodeBlock,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'CodeBlock',
        description:
          'A code block: title, line numbers, marks, wrapping, copy, collapse — and the tokens of an engine that sits outside the family, painted by the scope scale of the theme.',
        framework: 'Angular',
        ...ANGULAR_CODE_BLOCK_DOCS.codeBlock,
        tokens: ANGULAR_CODE_BLOCK_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CodeBlockStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it.
 */
const scene = (label: string, note: string, body: string, layout = 'block') => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const one = (label: string, note: string, body: string, layout = 'block') =>
  `<div class="slotted-demo-grid" data-columns="1">${scene(label, note, body, layout)}</div>`;

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
  render: (args) => ({
    props: { ...args, highlight },
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <div
    slCodeBlock
    [code]="code"
    [collapseAfter]="collapseAfter"
    [copy]="copy"
    [highlight]="highlight"
    [language]="language"
    [lineNumbers]="lineNumbers"
    [loading]="loading"
    [marks]="{ highlight: '5-6' }"
    [title]="title"
  ></div>
</div>`,
  }),
};

export const Highlight: Story = {
  parameters: scenario('highlight'),
  render: () => ({
    props: {
      ...SAMPLES,
      engine: null as typeof highlight | null,
      deliver(this: { engine: typeof highlight | null }) {
        this.engine = highlight;
      },
    },
    template: one(
      'Plain text, then tokens',
      'Press the button: the tokens enter the same lines, at the same height. Switch the scheme in the toolbar and the twelve colors change with it.',
      `<div class="slotted-demo-stack">
        <div slCodeBlock [code]="group" [highlight]="engine" language="ts" lineNumbers title="group.ts"></div>
        <p><button slButton size="sm" variant="outline" type="button" (click)="deliver()">Entregar o motor agora</button></p>
      </div>`,
    ),
  }),
};

export const Engines: Story = {
  parameters: scenario('engines'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'The two adapters',
      'The block below receives tokens already made — what fromPrismTokens or fromShikiTokens return — and runs no engine at all.',
      `<div slCodeBlock [code]="group" language="ts" [tokens]="tokens"></div>`,
    ),
  }),
};

export const LineNumbers: Story = {
  parameters: scenario('lineNumbers'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'lineNumbers · start="98"',
      'The gutter measures three characters to reach 107; select across the block and paste: the numbers do not come along.',
      `<div slCodeBlock [code]="group" [highlight]="highlight" language="ts" lineNumbers start="98"></div>`,
    ),
  }),
};

export const Marks: Story = {
  parameters: scenario('marks'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'highlight, error, warning',
      'The first line highlighted with the accent, the third in danger, the fourth in warning — each with the bar at the edge.',
      `<div slCodeBlock [code]="deploy" [highlight]="highlight" language="sh" [marks]="{ error: '3', highlight: '1', warning: [4] }" title="deploy.sh"></div>`,
    ),
  }),
};

export const Diff: Story = {
  parameters: scenario('diff'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'Two lines removed, three added',
      'The signs in the gutter are CSS; copy and the two removed lines are left out.',
      `<div slCodeBlock [code]="css" [highlight]="highlight" language="css" lineNumbers [marks]="{ add: '4-6', remove: '2-3' }"></div>`,
    ),
  }),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => ({
    props: SAMPLES,
    template: one(
      `focus: "3-6"`,
      'Lines outside the range fade; hover over them and everything returns.',
      `<div slCodeBlock [code]="contract" [highlight]="highlight" language="json" [marks]="{ focus: '3-6' }" title="contract.json"></div>`,
    ),
  }),
};

export const Wrap: Story = {
  parameters: scenario('wrap'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'A long command line',
      'On top it scrolls; below it starts wrapped, with the continuation indented to its own indent. The control exists only while a line overflows.',
      `<div class="slotted-demo-stack">
        <div slCodeBlock [code]="deploy" [highlight]="highlight" language="sh" title="deploy.sh"></div>
        <div slCodeBlock [code]="deploy" defaultWrap [highlight]="highlight" language="sh" title="deploy.sh"></div>
      </div>`,
    ),
  }),
};

export const Title: Story = {
  parameters: scenario('title'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'A .ts and a .csv',
      'The glyph follows the kind of file: a text sheet, a table sheet. The language stays at the end of the header.',
      `<div class="slotted-demo-stack">
        <div slCodeBlock [code]="group" [highlight]="highlight" language="ts" title="group.ts"></div>
        <div slCodeBlock [code]="csv" language="csv" title="orders-2026-09.csv"></div>
      </div>`,
    ),
  }),
};

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'collapseAfter="6"',
      'Four lines behind the control; the sixth fades into it. Reveal, put focus in the body and press Escape.',
      `<div slCodeBlock [code]="contract" collapseAfter="6" [highlight]="highlight" language="json" lineNumbers title="contract.json"></div>`,
    ),
  }),
};

export const MaxLines: Story = {
  parameters: scenario('maxLines'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'maxLines="12" over 40 lines',
      'The body scrolls and is a named region: Tab reaches it, the arrows scroll.',
      `<div slCodeBlock [code]="log" language="text" lineNumbers maxLines="12" title="deploy.log"></div>`,
    ),
  }),
};

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => ({
    props: {
      ...SAMPLES,
      last: null as string | null,
      copied(this: { last: string | null }, request: { value: string }) {
        this.last = request.value;
      },
    },
    template: one(
      'What the copy writes',
      'Press the control: the check stays two seconds, and the box below shows the text that went to the clipboard — without the removed lines.',
      `<div class="slotted-demo-stack">
        <div slCodeBlock [code]="css" language="css" [marks]="{ remove: '2-3' }" (copyRequest)="copied($event)"></div>
        @if (last !== null) {
          <div slCodeBlock [code]="last" language="css" title="Texto copiado"></div>
        }
      </div>`,
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'loading, and empty code',
      'Skeletons at the height of six lines with no copy control; below, an empty string is a numbered line.',
      `<div class="slotted-demo-stack">
        <div slCodeBlock code="" loading title="deploy.log"></div>
        <div slCodeBlock code="" language="text" lineNumbers></div>
      </div>`,
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: SAMPLES,
    template: one(
      '400 characters, RTL, hostile HTML',
      'In a narrow column the long line scrolls; under wrap it breaks at the token. The Arabic block reads LTR. The script is text.',
      `<div class="slotted-demo-stack">
        <div class="slotted-demo-measure"><div slCodeBlock [code]="long" defaultWrap language="text"></div></div>
        <div dir="rtl"><div slCodeBlock [code]="rtl" [highlight]="highlight" language="js" title="مرحبا.js"></div></div>
        <div slCodeBlock [code]="script" language="html"></div>
      </div>`,
    ),
  }),
};

export const Composition: Story = {
  decorators: [
    moduleMetadata({
      imports: IMPORTS,
      providers: [provideCodeBlockDefaults({ highlight, lineNumbers: true })],
    }),
  ],
  parameters: scenario('composition'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'Tabs, an action, the injector',
      'Two files in tabs; a Run button beside copy; the engine handed once by provideCodeBlockDefaults to both.',
      `<div slTabs defaultValue="ts">
        <div slTabList aria-label="Files">
          <div slTab value="ts">group.ts</div>
          <div slTab value="css">code-block.css</div>
        </div>
        <div slTabPanel value="ts">
          <div slCodeBlock [code]="group" language="ts" title="group.ts">
            <button slCodeBlockAction slButton size="sm" tone="secondary" variant="ghost" type="button">Run</button>
          </div>
        </div>
        <div slTabPanel value="css">
          <div slCodeBlock [code]="css" language="css" title="code-block.css"></div>
        </div>
      </div>`,
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: SAMPLES,
    template: one(
      'Tab to the body',
      'Copy, wrap, and the body — because the line overflows — in this order; in the body, the arrows scroll.',
      `<div slCodeBlock [code]="deploy" [highlight]="highlight" language="sh" lineNumbers title="deploy.sh"></div>`,
    ),
  }),
};
