import markdownTokens from '@slotted/styles/markdown/tokens.json';
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

export const REACT_MARKDOWN_TOKENS = markdownTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-markdown-')
    ? 'Family decision: the task box gap or the return glyph'
    : name.startsWith('--slotted-prose-')
      ? 'Read from prose: the list indent and the flow between blocks'
      : 'Theme decision read by the family',
}));

const imports: ReferenceImport = {
  source:
    "import { Markdown, MarkdownDefaultsProvider } from '@slotted/react';\nimport { completeMarkdown, fromMarkedTokens, prepareMarkdown } from '@slotted/core/markdown';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The family: data-ui="markdown", data-status, data-flow, data-loading, data-empty, data-streaming and aria-busy. The empty, error and loading states are drawn here, outside the region’s typography.',
  },
  {
    part: 'embed',
    element: 'div',
    required: false,
    purpose:
      'Holds a code-block or an alert and gives it the region’s flow, read from the public prose tokens; prose only spaces the elements it knows.',
  },
  {
    part: 'alert-body',
    element: 'div',
    required: false,
    purpose:
      'The blocks of a GitHub alert inside the alert’s description; the first starts flush with the title.',
  },
  {
    part: 'task-list',
    element: 'ul | ol',
    required: false,
    purpose: 'A list in which at least one item is a task. The ordinary items keep the marker.',
  },
  {
    part: 'task',
    element: 'li',
    required: false,
    purpose:
      'A two-column grid: the checkbox where the marker was, then the body. The text starts on the same edge as that of an ordinary item.',
  },
  {
    part: 'task-body',
    element: 'div',
    required: false,
    purpose: 'The task content, including a nested list.',
  },
  {
    part: 'backref',
    element: 'a',
    required: false,
    purpose:
      'The return from a footnote to its reference: an up arrow on a 24 px target, one per reference.',
  },
  {
    part: 'empty',
    element: 'p',
    required: false,
    purpose: 'The document has no content: messages.empty, or the consumer’s node in empty.',
  },
  {
    part: 'error',
    element: 'div',
    required: false,
    purpose:
      'The source did not arrive: inline-message in danger with messages.error and, with onRetry, a retry button.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A runbook written in Markdown, passed through the marked lexer and fromMarkedTokens. The controls below the stage move the size, the flow, the anchors and the heading offset.',
    snippet: defineSnippet({
      id: 'markdown-react-playground',
      language: 'tsx',
      label: 'One source, one adapter, the family',
      source:
        "import { marked } from 'marked';\n\nconst tree = fromMarkedTokens(marked.lexer(source));\n\n<Markdown headingAnchors tree={tree} />;",
    }),
  },
  {
    id: 'document',
    title: 'A whole document',
    note: 'Headings with a stable id, emphasis, inline code, nested lists, a quote and a rule: all in prose, whose typography is the region’s. Hover a heading to see the anchor; with Tab it appears too.',
    snippet: defineSnippet({
      id: 'markdown-react-document',
      language: 'tsx',
      label: 'Anchors on the headings',
      source: '<Markdown headingAnchors tree={tree} />;',
    }),
  },
  {
    id: 'tables',
    title: 'GFM tables',
    note: 'The :-- and --: alignment arrives as start and end, so a table seen in RTL keeps the prices against the edge where reading ends. A table wider than the column scrolls inside the prose scroll part, which only gains tabindex and a name while it overflows.',
    snippet: defineSnippet({
      id: 'markdown-tables',
      language: 'markdown',
      label: 'Columns aligned in the Markdown',
      source: '| Plan | Seats |   Price |\n| :--- | :---: | ------: |\n| Team |  10   | $120.00 |',
    }),
  },
  {
    id: 'code',
    title: 'Fences with code-block',
    note: 'Each fence is a CodeBlock: the language from the info string, and what comes after it — title="…", {2} and showLineNumbers — arrives as title, highlighted line and numbers. The syntax highlighting is that of the CodeBlockDefaultsProvider.',
    snippet: defineSnippet({
      id: 'markdown-code',
      language: 'markdown',
      label: 'Metadata in the info string',
      source:
        "```ts title=\"deploy.ts\" {2} showLineNumbers\nimport { deploy } from '@acme/cli';\nawait deploy({ env: 'production' });\n```",
    }),
  },
  {
    id: 'tasks',
    title: 'Task lists',
    note: 'Without onTaskChange the boxes are checkboxes in readOnly: focusable, announced as read only. With it, checking a task requests the change with the index and the offset in the source; the box only moves when the new tree arrives.',
    snippet: defineSnippet({
      id: 'markdown-react-tasks',
      language: 'tsx',
      label: 'Rewriting the source from the request',
      source:
        '<Markdown\n  onTaskChange={({ index, checked }) => setSource(toggleTask(source, index, checked))}\n  tree={fromMarkedTokens(marked.lexer(source))}\n/>;',
    }),
  },
  {
    id: 'alerts',
    title: 'GitHub alerts',
    note: '> [!NOTE], [!TIP], [!IMPORTANT], [!WARNING] and [!CAUTION] become an alert with reach="section" and live="off" — content, not an announcement — in the tones accent, success, secondary, warning and danger. alerts={false} gives back the quote.',
    snippet: defineSnippet({
      id: 'markdown-alerts',
      language: 'markdown',
      label: 'The GitHub syntax',
      source: '> [!WARNING]\n> A deployment during a migration waits for the migration to finish.',
    }),
  },
  {
    id: 'footnotes',
    title: 'Footnotes',
    note: 'Numbered by the first reference, with one return arrow per reference inside the last paragraph of the note. The section has a hidden heading that names the set; a definition nobody references is not drawn, as on GitHub.',
    snippet: defineSnippet({
      id: 'markdown-react-footnotes',
      language: 'tsx',
      label: 'The section label, translated',
      source: "<Markdown messages={{ footnotes: 'Notas' }} tree={tree} />;",
    }),
  },
  {
    id: 'links',
    title: 'Internal and external links',
    note: 'An absolute http(s) address leaves the application: it is a Link with the glyph and the new-tab hint. A relative path is a plain a. external="same-tab" keeps the tab; isExternal decides which hosts belong to the application.',
    snippet: defineSnippet({
      id: 'markdown-react-links',
      language: 'tsx',
      label: 'The application’s own domain counts as internal',
      source:
        "<Markdown\n  isExternal={(href) => /^https?:\\/\\//.test(href) && !href.startsWith('https://acme.example')}\n  tree={tree}\n/>;",
    }),
  },
  {
    id: 'sanitisation',
    title: 'Sanitization by construction',
    note: 'The family never writes innerHTML. Raw HTML is not drawn; javascript:, data: and the disguised spellings lose the link and stay as text; a refused image stays as its alternative text. transformUrl swaps the policy; allow restricts the types.',
    snippet: defineSnippet({
      id: 'markdown-react-sanitisation',
      language: 'tsx',
      label: 'Text, emphasis and links only',
      source:
        "<Markdown\n  allow={['paragraph', 'text', 'emphasis', 'strong', 'link']}\n  tree={tree}\n  unwrapDisallowed\n/>;",
    }),
  },
  {
    id: 'renderers',
    title: 'Renderers and extensions',
    note: 'renderers replaces the element of a known type — here the link becomes the application’s router link. extensions draws a type the family does not know: an @name mention that a pass over the tree created. A type without a renderer does not appear.',
    snippet: defineSnippet({
      id: 'markdown-react-renderers',
      language: 'tsx',
      label: 'A router link and a mention',
      source:
        '<Markdown\n  extensions={{ mention: ({ element }) => <Tag>@{String(element.node.value)}</Tag> }}\n  renderers={{\n    link: ({ element, children }) => <RouterLink to={element.href}>{children}</RouterLink>,\n  }}\n  tree={withMentions(tree)}\n/>;',
    }),
  },
  {
    id: 'streaming',
    title: 'An answer that is still arriving',
    note: 'completeMarkdown closes what the stream left open — the fence, the **, the backtick, the cut link — before the parser. The blocks already drawn keep their key and do not mount again; streaming puts aria-busy on the region until the end.',
    snippet: defineSnippet({
      id: 'markdown-react-streaming',
      language: 'tsx',
      label: 'Closing before parsing',
      source:
        "<Markdown\n  idPrefix={`msg-${message.id}-`}\n  streaming={status === 'streaming'}\n  tree={fromMarkedTokens(marked.lexer(completeMarkdown(message.text)))}\n/>;",
    }),
  },
  {
    id: 'states',
    title: 'Loading, empty and error',
    note: 'loading draws a three-line paragraph after the skeleton delay, in the region’s typography; empty writes messages.empty or the consumer’s node; status="error" replaces the document with a message and, with onRetry, a button.',
    snippet: defineSnippet({
      id: 'markdown-react-states',
      language: 'tsx',
      label: 'The three states outside the region',
      source:
        "<Markdown\n  loading={query.isLoading}\n  onRetry={query.refetch}\n  status={query.isError ? 'error' : 'ready'}\n  tree={query.data}\n/>;",
    }),
  },
  {
    id: 'composition',
    title: 'On a documentation page',
    note: 'Container gives the measure, prepareMarkdown gives the table of contents with the same ids the page draws, and MarkdownDefaultsProvider says once, in Portuguese, what the family writes.',
    snippet: defineSnippet({
      id: 'markdown-react-composition',
      language: 'tsx',
      label: 'The table of contents from the same document',
      source:
        'const { headings } = prepareMarkdown(tree);\n\n<MarkdownDefaultsProvider headingAnchors>\n  <Container size="measure">\n    <Markdown messages={{ footnotes: \'Notas\' }} tree={tree} />\n  </Container>\n</MarkdownDefaultsProvider>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'Keyboard and screen reader',
    note: 'Tab goes through the heading anchors, the links, a table that scrolls, the controls of a code block, the editable tasks and the footnote returns. The family adds no key: each stop belongs to a composed family.',
    snippet: defineSnippet({
      id: 'markdown-react-accessibility',
      language: 'tsx',
      label: 'Headings one level below the page’s',
      source: '<Markdown headingAnchors headingOffset={1} tree={tree} />;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onTaskChange',
    payload: '({ index, checked, offset }, request)',
    when: 'When the reader checks or unchecks a task, with the reason pointer or keyboard. The box does not move: the consumer’s new tree moves it.',
  },
  {
    name: 'onRetry',
    payload: "(reason: 'pointer' | 'keyboard')",
    when: 'When the reader presses the retry button of the error part.',
  },
];

export const REACT_MARKDOWN_DOCS = {
  markdown: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['tree', 'MarkdownNode | null', '—', 'Markdown', 'The document in mdast; never HTML'],
      [
        'source',
        'string',
        '—',
        'Markdown',
        'The document as CommonMark text, read by parseMarkdown in place of tree: the syntax of the types in allow is read and any other stays text. Paragraphs, ATX headings, fenced code, quotes, rules, GFM tables, nested lists, code spans, strong, emphasis, links, escapes and hard breaks; images and HTML need an adapter',
      ],
      ['size', "'md' | 'lg' | 'xl'", 'lg', 'Markdown', 'The region’s type step, from prose'],
      [
        'flow',
        "'tight' | 'normal' | 'loose'",
        'normal',
        'Markdown',
        'The space between blocks, from prose',
      ],
      [
        'status',
        "'ready' | 'error'",
        'ready',
        'Markdown',
        'error replaces the document with the error part',
      ],
      ['loading', 'boolean', 'false', 'Markdown', 'A waiting paragraph, after the skeleton delay'],
      ['streaming', 'boolean', 'false', 'Markdown', 'aria-busy while the source arrives'],
      [
        'external',
        "'new-tab' | 'same-tab'",
        'new-tab',
        'Markdown',
        'Where a link that leaves the application opens',
      ],
      ['headingAnchors', 'boolean', 'false', 'Markdown', 'A permalink on every heading'],
      ['headingOffset', 'number', '0', 'Markdown', 'Added to the level of each heading, up to six'],
      [
        'idPrefix',
        'string',
        '',
        'Markdown',
        'Before each generated id; required with two regions on the page',
      ],
      ['alerts', 'boolean', 'true', 'Markdown', 'Reads > [!NOTE] and its siblings as alert'],
      ['allow', 'string[]', 'CommonMark + GFM without html', 'Markdown', 'The mdast types drawn'],
      [
        'unwrapDisallowed',
        'boolean',
        'false',
        'Markdown',
        'A refused type hands its children to the parent',
      ],
      [
        'transformUrl',
        '(url, kind, node) => string | null',
        'safeUrl',
        'Markdown',
        'The URL policy; null refuses',
      ],
      [
        'isExternal',
        '(href) => boolean',
        'isExternalUrl',
        'Markdown',
        'Whether a link leaves the application',
      ],
      ['renderers', 'MarkdownRenderers', '—', 'Markdown', 'Replaces the element of a known type'],
      [
        'extensions',
        'MarkdownExtensions',
        '—',
        'Markdown',
        'Draws a type the family does not know',
      ],
      [
        'messages',
        'PartialMessages<MarkdownMessages>',
        '—',
        'Markdown',
        'The family’s words over the current locale, key by key',
      ],
      ['empty', 'ReactNode', '—', 'Markdown', 'The content of the empty part'],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Markdown',
        'The root as another element: article, section',
      ],
      ['ref', 'Ref<HTMLDivElement>', '—', 'Markdown', 'The root element'],
      [
        'MarkdownDefaultsProvider',
        'external | headingAnchors | alerts | allow | transformUrl | isExternal',
        '—',
        'Application',
        'Decided once for every document below; a prop wins',
      ],
      [
        'prepareMarkdown',
        '(tree, options) => MarkdownDocument',
        '—',
        '@slotted/core/markdown',
        'headings for a table of contents, with the page’s ids',
      ],
      [
        'completeMarkdown',
        '(source) => string',
        '—',
        '@slotted/core/markdown',
        'Closes a cut source before the parser',
      ],
      [
        'fromMarkedTokens',
        '(tokens) => MarkdownNode',
        '—',
        '@slotted/core/markdown',
        'The marked lexer as mdast',
      ],
      [
        'CodeBlockDefaultsProvider',
        'highlight',
        '—',
        'Application',
        'The highlighting engine of each fence',
      ],
      ['id, aria-*, data-*, on*', 'native props', '—', 'Markdown', 'Reach the root'],
    ]),
    accessibility: [
      'No source string reaches innerHTML: the family receives a tree, refuses raw HTML and executable schemes by default, and each element is created by the framework.',
      'The headings are real headings, shiftable with headingOffset to fit the page outline; the anchor stays in the tab order and in the accessibility tree, with the name "Link to section: <heading>".',
      'A task is a checkbox named by the item’s text; without onTaskChange it is aria-readonly, not disabled, so it stays focusable and readable.',
      'Each note reference has aria-describedby pointing to the hidden heading of the section, and each return says which reference it goes back to; a GitHub alert is live="off", because it is content and not an event.',
      'streaming and loading put aria-busy on the root, and the skeleton makes a single polite announcement; nothing moves focus when the content arrives.',
    ],
    snippets: [
      defineSnippet({
        id: 'markdown-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-flow="normal" data-part="root" data-status="ready" data-ui="markdown">\n  <div data-flow="normal" data-part="root" data-size="lg" data-ui="prose">\n    <h2 id="deploying">Deploying</h2>\n    <div data-part="embed">\n      <div data-ui="code-block">…</div>\n    </div>\n    <ul data-part="task-list">\n      <li data-part="task">\n        <div data-ui="checkbox">…</div>\n        <div data-part="task-body">Write the migration</div>\n      </li>\n    </ul>\n  </div>\n</div>;',
      }),
      defineSnippet({
        id: 'markdown-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='markdown'] {\n  --slotted-markdown-task-gap: var(--slotted-space-4);\n  --slotted-markdown-backref-size: 1em;\n}",
      }),
    ],
  },
} as const;
