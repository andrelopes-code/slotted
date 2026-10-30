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

export const ANGULAR_MARKDOWN_TOKENS = markdownTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-markdown-')
    ? 'Family decision: the task box gap or the return glyph'
    : name.startsWith('--slotted-prose-')
      ? 'Read from prose: the list indent and the flow between blocks'
      : 'Theme decision read by the family',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlMarkdown,\n  SlMarkdownChildren,\n  SlMarkdownEmpty,\n  SlMarkdownNode,\n  provideMarkdownDefaults,\n} from '@slotted/angular/markdown';\nimport { completeMarkdown, fromMarkedTokens, prepareMarkdown } from '@slotted/core/markdown';",
  selector: '[slMarkdown], ng-template[slMarkdownNode], [slMarkdownChildren], [slMarkdownEmpty]',
  exportAs: 'slMarkdown',
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
      'The source did not arrive: inline-message in danger with messages.error and, with retryable, a retry button.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A runbook written in Markdown, passed through the marked lexer and fromMarkedTokens. The controls below the stage move the size, the flow, the anchors and the heading offset.',
    snippet: defineSnippet({
      id: 'markdown-angular-playground',
      language: 'angular',
      label: 'One source, one adapter, the family',
      source: '<div slMarkdown headingAnchors [tree]="tree"></div>',
    }),
  },
  {
    id: 'document',
    title: 'A whole document',
    note: 'Headings with a stable id, emphasis, inline code, nested lists, a quote and a rule: all in prose, whose typography is the region’s. Hover a heading to see the anchor; with Tab it appears too.',
    snippet: defineSnippet({
      id: 'markdown-angular-document',
      language: 'angular',
      label: 'Anchors on the headings',
      source: '<div slMarkdown headingAnchors [tree]="tree"></div>',
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
    note: 'Without editableTasks the boxes are checkboxes in readOnly: focusable, announced as read only. With it, checking a task requests the change with the index and the offset in the source; the box only moves when the new tree arrives.',
    snippet: defineSnippet({
      id: 'markdown-angular-tasks',
      language: 'angular',
      label: 'Rewriting the source from the request',
      source:
        '<div\n  slMarkdown\n  editableTasks\n  [tree]="tree"\n  (taskChange)="source.set(toggleTask(source(), $event.index, $event.checked))"\n></div>',
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
      id: 'markdown-angular-footnotes',
      language: 'angular',
      label: 'The section label, translated',
      source: '<div slMarkdown [messages]="{ footnotes: \'Notas\' }" [tree]="tree"></div>',
    }),
  },
  {
    id: 'links',
    title: 'Internal and external links',
    note: 'An absolute http(s) address leaves the application: it is a Link with the glyph and the new-tab hint. A relative path is a plain a. external="same-tab" keeps the tab; isExternal decides which hosts belong to the application.',
    snippet: defineSnippet({
      id: 'markdown-angular-links',
      language: 'angular',
      label: 'The application’s own domain counts as internal',
      source: '<div slMarkdown [isExternal]="isOwnDomainInternal" [tree]="tree"></div>',
    }),
  },
  {
    id: 'sanitisation',
    title: 'Sanitization by construction',
    note: 'The family never writes innerHTML. Raw HTML is not drawn; javascript:, data: and the disguised spellings lose the link and stay as text; a refused image stays as its alternative text. transformUrl swaps the policy; allow restricts the types.',
    snippet: defineSnippet({
      id: 'markdown-angular-sanitisation',
      language: 'angular',
      label: 'Text, emphasis and links only',
      source:
        "<div\n  slMarkdown\n  unwrapDisallowed\n  [allow]=\"['paragraph', 'text', 'emphasis', 'strong', 'link']\"\n  [tree]=\"tree\"\n></div>",
    }),
  },
  {
    id: 'renderers',
    title: 'Renderers and extensions',
    note: 'ng-template[slMarkdownNode] with the name of a known type replaces its element — here the link becomes the application’s routerLink — and slMarkdownChildren draws the children in place. With the name of an unknown type, it draws that type: here a mention of a person, which a pass over the tree created. A type without a renderer does not appear.',
    snippet: defineSnippet({
      id: 'markdown-angular-renderers',
      language: 'angular',
      label: 'A router link and a mention',
      source:
        '<div slMarkdown [tree]="withMentions(tree)">\n  <ng-template slMarkdownNode="mention" let-element\n    ><span slTag>&#64;{{ element.node?.value }}</span></ng-template\n  >\n  <ng-template slMarkdownNode="link" let-element\n    ><a [routerLink]="element.href"><ng-container [slMarkdownChildren]="element" /></a\n  ></ng-template>\n</div>',
    }),
  },
  {
    id: 'streaming',
    title: 'An answer that is still arriving',
    note: 'completeMarkdown closes what the stream left open — the fence, the **, the backtick, the cut link — before the parser. The blocks already drawn keep their key and do not mount again; streaming puts aria-busy on the region until the end.',
    snippet: defineSnippet({
      id: 'markdown-angular-streaming',
      language: 'angular',
      label: 'Closing before parsing',
      source:
        '<div\n  slMarkdown\n  [idPrefix]="\'msg-\' + message.id + \'-\'"\n  [streaming]="streaming()"\n  [tree]="tree()"\n></div>',
    }),
  },
  {
    id: 'states',
    title: 'Loading, empty and error',
    note: 'loading draws a three-line paragraph after the skeleton delay, in the region’s typography; empty writes messages.empty or the content projected in slMarkdownEmpty; status="error" replaces the document with a message and, with retryable, a button that emits retry.',
    snippet: defineSnippet({
      id: 'markdown-angular-states',
      language: 'angular',
      label: 'The three states outside the region',
      source:
        '<div\n  slMarkdown\n  retryable\n  [loading]="loading()"\n  [status]="failed() ? \'error\' : \'ready\'"\n  [tree]="tree()"\n  (retry)="reload()"\n>\n  <span slMarkdownEmpty>This service has no runbook yet.</span>\n</div>',
    }),
  },
  {
    id: 'composition',
    title: 'On a documentation page',
    note: 'slContainer gives the measure, prepareMarkdown gives the table of contents with the same ids the page draws — and exportAs gives the same document() from the template —, and provideMarkdownDefaults says once, in Portuguese, what the family writes.',
    snippet: defineSnippet({
      id: 'markdown-angular-composition',
      language: 'angular',
      label: 'The table of contents from the same document',
      source:
        '<nav aria-label="On this page">\n  @for (heading of outline.headings; track heading.id) {\n    <a [href]="\'#\' + heading.id">{{ heading.text }}</a>\n  }\n</nav>\n<div slContainer size="measure"><div slMarkdown headingAnchors [tree]="tree"></div></div>',
    }),
  },
  {
    id: 'accessibility',
    title: 'Keyboard and screen reader',
    note: 'Tab goes through the heading anchors, the links, a table that scrolls, the controls of a code block, the editable tasks and the footnote returns. The family adds no key: each stop belongs to a composed family.',
    snippet: defineSnippet({
      id: 'markdown-angular-accessibility',
      language: 'angular',
      label: 'Headings one level below the page’s',
      source: '<div slMarkdown headingAnchors [headingOffset]="1" [tree]="tree"></div>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'taskChange',
    payload: '{ index, checked, offset, request }',
    when: 'When the reader checks or unchecks a task with editableTasks on, with the reason pointer or keyboard in request. The box does not move: the consumer’s new tree moves it.',
  },
  {
    name: 'retry',
    payload: "'pointer' | 'keyboard'",
    when: 'When the reader presses the retry button of the error part, drawn with retryable.',
  },
];

export const ANGULAR_MARKDOWN_DOCS = {
  markdown: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['tree', 'MarkdownNode | null', '—', '[slMarkdown]', 'The document in mdast; never HTML'],
      [
        'source',
        'string',
        '—',
        '[slMarkdown]',
        'The document as CommonMark text, read by parseMarkdown in place of tree: the syntax of the types in allow is read and any other stays text. Paragraphs, ATX headings, fenced code, quotes, rules, GFM tables, nested lists, code spans, strong, emphasis, links, escapes and hard breaks; images and HTML need an adapter',
      ],
      ['size', "'md' | 'lg' | 'xl'", 'lg', '[slMarkdown]', 'The region’s type step, from prose'],
      [
        'flow',
        "'tight' | 'normal' | 'loose'",
        'normal',
        '[slMarkdown]',
        'The space between blocks, from prose',
      ],
      [
        'status',
        "'ready' | 'error'",
        'ready',
        '[slMarkdown]',
        'error replaces the document with the error part',
      ],
      [
        'loading',
        'boolean',
        'false',
        '[slMarkdown]',
        'A waiting paragraph, after the skeleton delay',
      ],
      ['streaming', 'boolean', 'false', '[slMarkdown]', 'aria-busy while the source arrives'],
      [
        'external',
        "'new-tab' | 'same-tab'",
        'new-tab',
        '[slMarkdown]',
        'Where a link that leaves the application opens',
      ],
      ['headingAnchors', 'boolean', 'false', '[slMarkdown]', 'A permalink on every heading'],
      [
        'headingOffset',
        'number',
        '0',
        '[slMarkdown]',
        'Added to the level of each heading, up to six',
      ],
      [
        'idPrefix',
        'string',
        '',
        '[slMarkdown]',
        'Before each generated id; required with two regions on the page',
      ],
      ['alerts', 'boolean', 'true', '[slMarkdown]', 'Reads > [!NOTE] and its siblings as alert'],
      [
        'allow',
        'string[]',
        'CommonMark + GFM without html',
        '[slMarkdown]',
        'The mdast types drawn',
      ],
      [
        'unwrapDisallowed',
        'boolean',
        'false',
        '[slMarkdown]',
        'A refused type hands its children to the parent',
      ],
      [
        'transformUrl',
        '(url, kind, node) => string | null',
        'safeUrl',
        '[slMarkdown]',
        'The URL policy; null refuses',
      ],
      [
        'isExternal',
        '(href) => boolean',
        'isExternalUrl',
        '[slMarkdown]',
        'Whether a link leaves the application',
      ],
      [
        'messages',
        'PartialMessages<MarkdownMessages>',
        '—',
        '[slMarkdown]',
        'The family’s words over the current locale, key by key',
      ],
      [
        'editableTasks',
        'boolean',
        'false',
        '[slMarkdown]',
        'Turns on the task checkboxes; an output does not say whether anyone listens to it',
      ],
      ['retryable', 'boolean', 'false', '[slMarkdown]', 'Draws the retry button in the error part'],
    ]),
    composition: apiRows([
      [
        'ng-template[slMarkdownNode]',
        'kind | type',
        '—',
        'content',
        'Replaces the element of a known type, or draws an unknown type; receives the prepared element',
      ],
      [
        '[slMarkdownChildren]',
        'MarkdownElement',
        '—',
        'ng-container',
        'Draws the children of an element inside a template, without an element of its own',
      ],
      ['[slMarkdownEmpty]', 'projected content', '—', 'content', 'The content of the empty part'],
      [
        'exportAs',
        'slMarkdown',
        '—',
        '[slMarkdown]',
        'document(): the headings and the notes, with the page’s ids',
      ],
      [
        'provideMarkdownDefaults',
        'external | headingAnchors | alerts | allow | transformUrl | isExternal',
        '—',
        'Application',
        'Decided once for every document below; an input wins',
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
        'id, aria-*, data-*',
        'native attributes',
        '—',
        '[slMarkdown]',
        'Stay on the consumer’s element',
      ],
    ]),
    accessibility: [
      'No source string reaches innerHTML: the family receives a tree, refuses raw HTML and executable schemes by default, and each element is created by the framework.',
      'The headings are real headings, shiftable with headingOffset to fit the page outline; the anchor stays in the tab order and in the accessibility tree, with the name "Link to section: <heading>".',
      'A task is a checkbox named by the item’s text; without editableTasks it is aria-readonly, not disabled, so it stays focusable and readable.',
      'Each note reference has aria-describedby pointing to the hidden heading of the section, and each return says which reference it goes back to; a GitHub alert is live="off", because it is content and not an event.',
      'streaming and loading put aria-busy on the root, and the skeleton makes a single polite announcement; nothing moves focus when the content arrives.',
    ],
    snippets: [
      defineSnippet({
        id: 'markdown-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div slMarkdown data-flow="normal" data-status="ready">\n  <div slProse>\n    <h2 id="deploying">Deploying</h2>\n    <div data-part="embed"><div slCodeBlock></div></div>\n    <ul data-part="task-list">\n      <li data-part="task">\n        <div slCheckbox></div>\n        <div data-part="task-body">Write the migration</div>\n      </li>\n    </ul>\n  </div>\n</div>',
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
