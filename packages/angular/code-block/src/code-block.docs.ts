import codeBlockTokens from '@slotted/styles/code-block/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_CODE_BLOCK_TOKENS = codeBlockTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-code-')
    ? 'The color of one kind of word, from the theme’s code scale'
    : 'Theme decision about the code block',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlCodeBlock,\n  SlCodeBlockAction,\n  SlCodeBlockLine,\n  provideCodeBlockDefaults,\n} from '@slotted/angular/code-block';\nimport { fromPrismTokens, fromShikiTokens } from '@slotted/core/code';",
  selector: '[slCodeBlock], [slCodeBlockAction], ng-template[slCodeBlockLine]',
  exportAs: 'slCodeBlock',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame: the sunken background, the edge and the radius that prose already draws on a fence. Carries data-ui="code-block", data-language, data-wrap, data-revealed, data-line-numbers, data-loading, data-marks and the four runtime values.',
  },
  {
    part: 'header',
    element: 'div',
    required: false,
    purpose:
      'The file name, the language at the end and the controls. Exists when there is a title, a language, copy or consumer actions. Keeps the page direction.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose: 'The glyph of the file kind next to the title, chosen by fileKind from the name.',
  },
  {
    part: 'title',
    element: 'span',
    required: false,
    purpose:
      'The file name, in mono, truncated with an ellipsis. It is the name of the scroll region.',
  },
  {
    part: 'language',
    element: 'span',
    required: false,
    purpose: 'The language in small caps, at the end of the header.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The controls: the consumer’s, projected by slCodeBlockAction, wrap and copy. Without a header it floats over the first line, at the end of the block.',
  },
  {
    part: 'wrap',
    element: 'button',
    required: false,
    purpose:
      'aria-pressed: wraps the lines in the box. Drawn only while a line overflows, or while it is already wrapped.',
  },
  {
    part: 'copy',
    element: 'button',
    required: false,
    purpose:
      'The copy control: writes the code, not the DOM, without the removed lines; data-complete for two seconds with the check in place of the sheets.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose:
      'A scroll-area dressed as data-ui: the named region and tab stop only while the code overflows, the platform scrollbar, the veil at the end.',
  },
  {
    part: 'pre',
    element: 'pre',
    required: true,
    purpose: 'white-space: pre, direction: ltr whatever the page, pre-wrap under data-wrap.',
  },
  {
    part: 'code',
    element: 'code',
    required: true,
    purpose: 'class="language-<x>", the convention of the HTML specification; a grid of lines.',
  },
  {
    part: 'line',
    element: 'span',
    required: true,
    purpose:
      'A row of the grid: number, marker, text. data-line, data-mark and data-dim; --slotted-code-block-indent under wrap.',
  },
  {
    part: 'number',
    element: 'span',
    required: true,
    purpose:
      'The number, aria-hidden and not selectable; hidden without lineNumbers, but in the DOM, so nothing moves when it is turned on.',
  },
  {
    part: 'marker',
    element: 'span',
    required: true,
    purpose: 'The sign column: + and − on diff lines, written by CSS and outside any selection.',
  },
  {
    part: 'text',
    element: 'span',
    required: true,
    purpose:
      'The token run of the line, the third column. It is what an ng-template slCodeBlockLine replaces.',
  },
  {
    part: 'token',
    element: 'span',
    required: false,
    purpose: 'A scoped token, data-token among the twelve; a token without a scope is plain text.',
  },
  {
    part: 'reveal',
    element: 'button',
    required: false,
    purpose:
      '"Show n more lines" when collapseAfter hides lines; "Show less" when they are revealed. Escape in the revealed block folds it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A TypeScript file with a title, line numbers and a highlighted range, moved by the controls below the stage.',
    snippet: defineSnippet({
      id: 'code-block-angular-playground',
      language: 'angular',
      label: 'A block with a title and numbers',
      source:
        '<div\n  slCodeBlock\n  [code]="source"\n  language="ts"\n  lineNumbers\n  [marks]="{ highlight: \'5-6\' }"\n  title="group.ts"\n></div>',
    }),
  },
  {
    id: 'highlight',
    title: 'Text first, tokens when they arrive',
    note: 'The block draws the plain text on the first paint and swaps in the tokens line by line when the engine answers: the height does not change, because each line is a row of the grid. The colors are the theme’s --slotted-code-* scale, and change with the scheme.',
    snippet: defineSnippet({
      id: 'code-block-angular-highlight',
      language: 'angular',
      label: 'An engine handed to the block',
      source: '<div slCodeBlock [code]="source" [highlight]="tokenize" language="ts"></div>',
    }),
  },
  {
    id: 'engines',
    title: 'Prism and Shiki come in through the mappings',
    note: 'The family loads no grammar. fromPrismTokens folds the standard Prism names onto the twelve scopes; fromShikiTokens reads the last TextMate scope of each token. Engine HTML never enters: what arrives is text in spans.',
    snippet: defineSnippet({
      id: 'code-block-angular-engines',
      language: 'ts',
      label: 'The two adapters, without importing any engine',
      source:
        "const prism = (code, lang) => fromPrismTokens(Prism.tokenize(code, Prism.languages[lang]));\nconst shiki = async (code, lang) =>\n  fromShikiTokens(\n    await codeToTokens(code, { includeExplanation: 'scopeName', lang, theme: 'none' }),\n  );",
    }),
  },
  {
    id: 'lineNumbers',
    title: 'Line numbers',
    note: 'lineNumbers draws a counter in a gutter wide enough for the last number, measured in ch; start says where it begins. The gutter is aria-hidden and user-select: none, so a selection across the block copies code and nothing else.',
    snippet: defineSnippet({
      id: 'code-block-angular-line-numbers',
      language: 'angular',
      label: 'From line 98',
      source: '<div slCodeBlock [code]="source" language="ts" lineNumbers start="98"></div>',
    }),
  },
  {
    id: 'marks',
    title: 'Marked lines',
    note: 'marks takes ranges "1,4-6" or lists of numbers: highlight tints with the accent and a bar at the edge; error and warning with danger and warning. The tint is the tone’s text color at 7.5%, so no scope falls below 4.5:1.',
    snippet: defineSnippet({
      id: 'code-block-angular-marks',
      language: 'angular',
      label: 'Highlight, error and warning',
      source:
        '<div\n  slCodeBlock\n  [code]="source"\n  language="sh"\n  [marks]="{ error: \'3\', highlight: \'1\', warning: [4] }"\n></div>',
    }),
  },
  {
    id: 'diff',
    title: 'A diff',
    note: 'add and remove tint with success and danger and write + and − in the gutter, by CSS. The copy control leaves the removed lines out, because the code after the change is what gets pasted; copyRemoved keeps them.',
    snippet: defineSnippet({
      id: 'code-block-angular-diff',
      language: 'angular',
      label: 'Two lines out, three in',
      source:
        '<div\n  slCodeBlock\n  [code]="source"\n  language="css"\n  lineNumbers\n  [marks]="{ add: \'4-6\', remove: \'2-3\' }"\n></div>',
    }),
  },
  {
    id: 'focus',
    title: 'Focus on one part of the block',
    note: 'focus dims and blurs the lines outside the range; the block lifts the veil with the pointer over it or focus inside, so whoever wants the rest gets it. Under reduced-motion the blur goes and the dimming stays, because the dimming is the information.',
    snippet: defineSnippet({
      id: 'code-block-angular-focus',
      language: 'angular',
      label: 'The reader looks at three lines',
      source:
        '<div slCodeBlock [code]="source" language="json" [marks]="{ focus: \'3-6\' }"></div>',
    }),
  },
  {
    id: 'wrap',
    title: 'Wrapping long lines',
    note: 'The wrap control appears only while a line overflows — the Docusaurus rule — and is a pressed button. The continuation of a wrapped line indents to the code’s own indent, measured once per line in ch.',
    snippet: defineSnippet({
      id: 'code-block-angular-wrap',
      language: 'angular',
      label: 'Starting wrapped, and being told',
      source:
        '<div\n  slCodeBlock\n  [code]="command"\n  defaultWrap\n  language="sh"\n  (wrapChangeRequest)="log($event.reason)"\n></div>',
    }),
  },
  {
    id: 'title',
    title: 'A named file',
    note: 'title puts up the header with the name in mono, the glyph of the file kind — a text sheet for a .ts, a table sheet for a .csv — and the language at the end. The title is also the name of the scroll region.',
    snippet: defineSnippet({
      id: 'code-block-angular-title',
      language: 'angular',
      label: 'The name the region inherits',
      source: '<div slCodeBlock [code]="rows" language="csv" title="orders-2026-09.csv"></div>',
    }),
  },
  {
    id: 'collapse',
    title: 'Folded behind "Show more"',
    note: 'collapseAfter hides what goes past n lines behind a control; the last visible line fades into it. revealed is the state model; Escape inside the revealed block folds it and keeps focus. The hidden lines stay in the DOM and in a selection.',
    snippet: defineSnippet({
      id: 'code-block-angular-collapse',
      language: 'angular',
      label: 'Six lines, then a button',
      source:
        '<div\n  slCodeBlock\n  [code]="source"\n  collapseAfter="6"\n  language="json"\n  [(revealed)]="revealed"\n  (revealedChangeRequest)="track($event.value)"\n></div>',
    }),
  },
  {
    id: 'maxLines',
    title: 'Scrolling past a maximum',
    note: 'maxLines limits the body height and the scroll-area scrolls the rest, with the region named and reachable by Tab. It composes with collapseAfter: a block folded at eight and, revealed, scrolling past forty.',
    snippet: defineSnippet({
      id: 'code-block-angular-max-lines',
      language: 'angular',
      label: 'A 40-line log in 12',
      source: '<div slCodeBlock [code]="log" language="text" lineNumbers maxLines="12"></div>',
    }),
  },
  {
    id: 'copy',
    title: 'Copying',
    note: 'The control writes the code the consumer gave, never the DOM text: no numbers, no signs, no wraps. When done, the check stays two seconds in place of the sheets and "Copied" is announced; copy="false" removes the control; copyCode() copies without it.',
    snippet: defineSnippet({
      id: 'code-block-angular-copy',
      language: 'angular',
      label: 'What reaches the clipboard',
      source:
        '<div slCodeBlock [code]="source" (copyRequest)="$event.copied && toast(\'Copied\')"></div>',
    }),
  },
  {
    id: 'loading',
    title: 'Code on the way, and no code',
    note: 'loading draws the frame at the height of six lines with skeletons inside and aria-busy, without a copy control — not a spinner, which is for a region that already has content. An empty string is an empty line with its number.',
    snippet: defineSnippet({
      id: 'code-block-angular-loading',
      language: 'angular',
      label: 'Before the file arrives',
      source: '<div slCodeBlock code="" loading title="deploy.log"></div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A 400-character line scrolls and, under wrap, breaks inside an indivisible token instead of escaping the box; Arabic code on an RTL page reads from left to right; a <script> in the sample is six characters.',
    snippet: defineSnippet({
      id: 'code-block-angular-content',
      language: 'angular',
      label: 'Hostile HTML, drawn as text',
      source: '<div slCodeBlock [code]="\'<script>alert(1)</script>\'" language="html"></div>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'Several files are tabs with one block per panel; a consumer action goes in actions next to copy, through slCodeBlockAction; an ng-template slCodeBlockLine draws a line the application’s way; provideCodeBlockDefaults hands the engine once to the injector.',
    snippet: defineSnippet({
      id: 'code-block-angular-composition',
      language: 'ts',
      label: 'The engine once, for all',
      source:
        'providers: [provideCodeBlockDefaults({ highlight: shiki, lineNumbers: true })];\n\n// <div slCodeBlock [code]="a" language="ts" title="a.ts"></div>\n// <div slCodeBlock [code]="b" language="css" title="a.css">\n//   <button slCodeBlockAction slButton size="xs" variant="ghost">Run</button>\n// </div>',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab: copy, wrap, reveal, and the body when it overflows. In the body the arrows, Page, Home, End and Space are the platform’s; Enter and Space on the controls; Escape in a revealed block folds it and keeps focus.',
    snippet: defineSnippet({
      id: 'code-block-angular-keyboard',
      language: 'angular',
      label: 'What is heard on reaching the body',
      source:
        '<!-- "group.ts, region" — the title, because the body is a named region only while the code overflows. -->\n<div slCodeBlock [code]="wide" language="ts" title="group.ts"></div>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(wrapChangeRequest)',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the lines wrap or unwrap; [(wrap)] is the other half, the value. The request carries the reason — pointer, keyboard or programmatic — and the source event; cancelling it moves nothing.',
  },
  {
    name: '(revealedChangeRequest)',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the block reveals or folds the hidden lines; [(revealed)] is the value. The reason is pointer, keyboard, escape or programmatic.',
  },
  {
    name: '(copyRequest)',
    payload: '{ value, copied, reason, source }',
    when: 'After the control, or copyCode(), writes to the clipboard. copied is false when the platform refused.',
  },
  {
    name: '(highlightError)',
    payload: 'unknown',
    when: 'When the engine rejects. The plain text stays.',
  },
];

export const ANGULAR_CODE_BLOCK_DOCS = {
  codeBlock: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['code', 'string', '—', 'CodeBlock', 'The source, as text. Never HTML'],
      ['language', 'string', 'text', 'CodeBlock', 'data-language and class="language-<x>"'],
      [
        'highlight',
        'CodeHighlighter | null',
        '—',
        'CodeBlock',
        'The engine; null refuses the injector’s',
      ],
      ['tokens', 'CodeLine[]', '—', 'CodeBlock', 'Lines the consumer already tokenized'],
      ['title', 'string', '—', 'CodeBlock', 'The file name in the header, and the region name'],
      [
        'fileName',
        'string',
        '—',
        'CodeBlock',
        'The name for the glyph, when the title is not the name',
      ],
      ['lineNumbers', 'boolean', 'false', 'CodeBlock', 'The counter in the gutter'],
      ['start', 'number', '1', 'CodeBlock', 'The number of the first line'],
      [
        'marks',
        'CodeMarks',
        '—',
        'CodeBlock',
        'highlight, add, remove, focus, error, warning — ranges "1,4-6" or lists',
      ],
      [
        'wrap',
        'model<boolean | undefined>',
        '—',
        'CodeBlock',
        '[(wrap)]: present means controlled, for the life of the block',
      ],
      ['defaultWrap', 'boolean', 'false', 'CodeBlock', 'Where an uncontrolled block starts'],
      ['collapseAfter', 'number', '—', 'CodeBlock', 'Visible lines before the reveal control'],
      [
        'revealed',
        'model<boolean | undefined>',
        '—',
        'CodeBlock',
        '[(revealed)]: present means controlled',
      ],
      ['defaultRevealed', 'boolean', 'false', 'CodeBlock', 'Where an uncontrolled block starts'],
      ['maxLines', 'number', '—', 'CodeBlock', 'Lines before the body scrolls'],
      ['copy', 'boolean', 'true', 'CodeBlock', 'The copy control'],
      ['copyRemoved', 'boolean', 'false', 'CodeBlock', 'Keeps the removed lines in the copy'],
      [
        'loading',
        'boolean',
        'false',
        'CodeBlock',
        'Skeletons at the height of six lines, aria-busy, no copy',
      ],
      ['tabSize', 'number', '2', 'CodeBlock', 'Width of a tab, for the continuation indent'],
      [
        'messages',
        'PartialMessages<CodeBlockMessages>',
        '—',
        'slCodeBlock',
        'The family’s words over the current locale, key by key',
      ],
      [
        'ng-template[slCodeBlockLine]',
        'projection',
        '—',
        'CodeBlock',
        'Replaces the token run of each line; receives the tokens, the number, the mark and the dimming',
      ],
      [
        '[slCodeBlockAction]',
        'projection',
        '—',
        'CodeBlock',
        'Consumer controls next to copy and wrap',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        'slCodeBlock',
        '—',
        'CodeBlock',
        'Reaches the instance from the template: #block="slCodeBlock" and block.copyCode() or block.scrollToLine(12)',
      ],
      [
        'ng-template[slCodeBlockLine]',
        'let-tokens, let-number="number", let-mark="mark", let-dim="dim"',
        '—',
        'CodeBlock',
        'The line the application’s way; the gutter stays the family’s',
      ],
      [
        '[slCodeBlockAction]',
        'ng-content',
        '—',
        'CodeBlock',
        'A "Run" or an "Open in editor" next to the controls',
      ],
      [
        'provideCodeBlockDefaults()',
        'highlight | lineNumbers | copy',
        '—',
        'Injector',
        'The engine loaded once, for every block below; an input on the block wins',
      ],
      ['slTabs', 'composition', '—', 'around', 'Several files: one block per panel'],
      [
        'id, aria-*, data-*, (keydown)',
        'native attributes',
        '—',
        'CodeBlock',
        'Stay on the host element; the consumer’s listener runs alongside the family’s',
      ],
    ]),
    accessibility: [
      'The block has no role: it is text, read as text. Carbon’s role="textbox" with aria-readonly on a block nobody edits is refused in writing in the contract.',
      'The body is a scroll-area: role="region", tabindex="0" and a name — the title, then aria-label, then "Code" — only while the code overflows, which is what SC 2.1.1 and scrollable-region-focusable ask for. The scroll keys are the platform’s; the family writes none.',
      'The gutter of numbers and signs is aria-hidden and user-select: none: a screen reader hears the code and not a count, and a selection across the block copies code and nothing else.',
      'The copy control announces "Copied" or "Copy failed" through the shared live-announcer and swaps the glyph as well as the color; the wrap control is aria-pressed; the reveal control carries aria-expanded and aria-controls pointing to the body.',
      'Engine HTML never enters: the tokens are text in spans, and a <script> in a sample is the six characters it is.',
    ],
    snippets: [
      defineSnippet({
        id: 'code-block-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-language="ts" data-line-numbers data-part="root" data-ui="code-block">\n  <div data-part="header">\n    <span data-part="title">group.ts</span>\n    <span data-part="language">ts</span>\n    <div data-part="actions">\n      <button aria-label="Copy code" data-part="copy"></button>\n    </div>\n  </div>\n  <div data-part="body" data-ui="scroll-area">\n    <div data-part="viewport">\n      <div data-part="content">\n        <pre\n          data-part="pre"\n        ><code class="language-ts" data-part="code"><span data-line="1" data-part="line"><span aria-hidden="true" data-part="number">1</span><span aria-hidden="true" data-part="marker"></span><span data-part="text"><span data-part="token" data-token="keyword">export</span></span></span></code></pre>\n      </div>\n    </div>\n  </div>\n</div>',
      }),
      defineSnippet({
        id: 'code-block-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='code-block'] {\n  --slotted-code-block-font-size: var(--slotted-font-size-md);\n  --slotted-code-block-radius: var(--slotted-radius-lg);\n  --slotted-code-block-tab-size: 4;\n}",
      }),
    ],
  },
} as const;
