import proseTokens from '@slotted/styles/prose/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
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

export const REACT_PROSE_TOKENS = proseTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Prose decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Prose,\n  ProseAnchor,\n  ProseDefaultsProvider,\n  ProseExclude,\n  ProseFootnotes,\n  ProseLead,\n  ProseScroll,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The region. Carries data-ui="prose", the two axes, and the container this family answers its own width with. A div claims nothing; article, section or main is a claim the page makes through render.',
  },
  {
    part: 'lead',
    element: 'p, or the element render returns',
    required: false,
    purpose:
      'The opening paragraph, one step up and in the muted role, with a wider gap after it than two ordinary paragraphs get. Tailwind’s equivalent is a class written into the Markdown; here it is contract, so a renderer’s component map can produce it.',
  },
  {
    part: 'anchor',
    element: 'a',
    required: false,
    purpose:
      'A heading’s permalink. The destination is the consumer’s — rehype-autolink-headings writes it — and the family owns the placement, the 24-pixel target and the rule that it appears on hover and on focus. Hidden with opacity, never display, so a keyboard reaches it.',
  },
  {
    part: 'scroll',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'A wide block — a table, a fence — that scrolls sideways instead of pushing the page over. It takes role="region", tabindex="0" and a name only while it actually overflows, measured through @slotted/core/overflow.',
  },
  {
    part: 'exclude',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'A subtree the family does not style. Every content rule carries a guard against it, and the four properties inheritance still carried in — family, size, leading and wrapping — are returned to control type.',
  },
  {
    part: 'footnotes',
    element: 'section, or the element render returns',
    required: false,
    purpose:
      'What GitHub Flavored Markdown emits at the end of a document: a rule, a step down in size and the muted role.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One region of rendered Markdown with both axes on it, driven by the controls below the canvas. Nothing inside carries an attribute the application wrote.',
    snippet: defineSnippet({
      id: 'prose-react-playground',
      language: 'tsx',
      label: 'A region of content the page did not author',
      source: '<Prose size="lg" flow="normal" dangerouslySetInnerHTML={{ __html: rendered }} />;',
    }),
  },
  {
    id: 'elements',
    title: 'Every element a renderer emits',
    note: 'Headings, lists, a quotation, a fence, a table, media, a rule, a description list, a disclosure and the inline set — all bare tags, styled without a single attribute of their own.',
    snippet: defineSnippet({
      id: 'prose-react-elements',
      language: 'tsx',
      label: 'The whole specimen, from one renderer',
      source:
        '<Prose>\n  <Markdown>{source}</Markdown>\n</Prose>;\n\n// Or, when the renderer hands back a string:\n<Prose dangerouslySetInnerHTML={{ __html: sanitized }} />;',
    }),
  },
  {
    id: 'size',
    title: 'Size',
    note: 'The type-scale step the body takes. lg is one rem and is the default; md is the size a button label is set in, for a region inside dense product chrome.',
    snippet: defineSnippet({
      id: 'prose-react-size',
      language: 'tsx',
      label: 'Three reading sizes',
      source:
        '<>\n  <Prose size="md">{compact}</Prose>\n  <Prose size="lg">{documentation}</Prose>\n  <Prose size="xl">{article}</Prose>\n</>;',
    }),
  },
  {
    id: 'flow',
    title: 'Flow',
    note: 'The one number that governs every gap on the page. Heading spacing, list spacing and the room around a rule all derive from it, so a chat message and an article are one prop apart.',
    snippet: defineSnippet({
      id: 'prose-react-flow',
      language: 'tsx',
      label: 'The same content at three rhythms',
      source:
        '<>\n  <Prose flow="tight">{message}</Prose>\n  <Prose flow="normal">{page}</Prose>\n  <Prose flow="loose">{article}</Prose>\n</>;',
    }),
  },
  {
    id: 'lead',
    title: 'The lead paragraph',
    note: 'The opening sentence set one step up, in the muted role, with a wider gap under it — so the opening reads as its own movement rather than as the first of several paragraphs.',
    snippet: defineSnippet({
      id: 'prose-react-lead',
      language: 'tsx',
      label: 'An opening the renderer maps to a part',
      source:
        '<Prose>\n  <h2>Deploying a service</h2>\n  <ProseLead>Everything a team needs to move a service to production.</ProseLead>\n  <p>A deployment is three decisions…</p>\n</Prose>;',
    }),
  },
  {
    id: 'anchor',
    title: 'Heading anchors',
    note: 'Hover a heading, then tab to its permalink: it appears for both, because a control that answers hover alone is a control a keyboard cannot find. It holds its box whether visible or not, so revealing it moves nothing.',
    snippet: defineSnippet({
      id: 'prose-react-anchor',
      language: 'tsx',
      label: 'A permalink the renderer writes',
      source:
        '<h2 id="deploying">\n  Deploying a service\n  <ProseAnchor href="#deploying" aria-label="Link to this section">\n    #\n  </ProseAnchor>\n</h2>;',
    }),
  },
  {
    id: 'scroll',
    title: 'A block wider than its column',
    note: 'Tab into the table below: it takes a tab stop, a region role and a name only because it overflows. Widen the window until it fits and all three disappear, which is the point.',
    snippet: defineSnippet({
      id: 'prose-react-scroll',
      language: 'tsx',
      label: 'A table that a keyboard can scroll',
      source:
        '<ProseScroll labelledBy="environments">\n  <table>\n    <caption id="environments">Environments and their gates</caption>…\n  </table>\n</ProseScroll>;',
    }),
  },
  {
    id: 'exclude',
    title: 'Opting a component out',
    note: 'The card below sits inside the region and keeps its own type, rhythm and colour. Everything around it is still set by the family, and the boundary is one attribute.',
    snippet: defineSnippet({
      id: 'prose-react-exclude',
      language: 'tsx',
      label: 'A component the family leaves alone',
      source:
        '<Prose>\n  <p>Styled by the family.</p>\n  <ProseExclude>\n    <Card>\n      <CardBody>Untouched.</CardBody>\n    </Card>\n  </ProseExclude>\n</Prose>;',
    }),
  },
  {
    id: 'streaming',
    title: 'Content that is still arriving',
    note: 'Press the button and blocks are appended one at a time, the way a language model answers. Nothing already on screen moves: no rule in this family selects forward, and every gap is on the block that arrives.',
    snippet: defineSnippet({
      id: 'prose-react-streaming',
      language: 'tsx',
      label: 'Appending into a region that is being read',
      source:
        '<Prose flow="tight">\n  {blocks.map((block) => (\n    <p key={block.id}>{block.text}</p>\n  ))}\n</Prose>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A body that starts at h3, two headings with nothing between them, a pasted destination with no break in it, four levels of list, and a right-to-left paragraph in the middle of the page.',
    snippet: defineSnippet({
      id: 'prose-react-content',
      language: 'tsx',
      label: 'What a real document does',
      source:
        '<Prose>\n  <h3>A body that does not start at the top level</h3>\n  <h4>Two headings with nothing between them</h4>\n  <p lang="ar" dir="rtl">\n    فقرة عربية داخل نفس المنطقة.\n  </p>\n</Prose>;',
    }),
  },
  {
    id: 'composition',
    title: 'The families it sits with',
    note: 'Container bounds the measure, Card frames the region and a Link inside the text wins on specificity — every content rule here is written to lose to a family placed inside it.',
    snippet: defineSnippet({
      id: 'prose-react-composition',
      language: 'tsx',
      label: 'Measure, frame, and a real Link inside the text',
      source:
        '<Container size="measure">\n  <Prose render={(props) => <article {...props} />}>\n    <p>\n      Read <Link href="/guide">the guide</Link> first.\n    </p>\n  </Prose>\n</Container>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    note: 'The two things in this family a reader operates: the permalink beside a heading, and the scrolling block. Tab through the region and both take focus in the order the document holds them.',
    snippet: defineSnippet({
      id: 'prose-react-accessibility',
      language: 'tsx',
      label: 'The whole keyboard surface of the family',
      source:
        '<Prose>\n  <h2 id="gates">\n    Gates\n    <ProseAnchor href="#gates" aria-label="Link to this section">\n      #\n    </ProseAnchor>\n  </h2>\n  <ProseScroll labelledBy="gates">\n    <table>…</table>\n  </ProseScroll>\n</Prose>;',
    }),
  },
];

export const REACT_PROSE_DOCS = {
  prose: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'size',
        "'md' | 'lg' | 'xl'",
        'lg',
        'Prose',
        'The type-scale step the body text takes. Named for the scale’s own steps, so the offset from control type is visible: lg is one rem, and md is the size a button label is set in',
      ],
      [
        'flow',
        "'tight' | 'normal' | 'loose'",
        'normal',
        'Prose',
        'The space between blocks, from which every other distance derives — the gap above a heading, between list rows, and around a rule. tight is a chat message, loose an article',
      ],
      [
        'messages',
        'Partial<ProseMessages>',
        '—',
        'ProseScroll',
        'Words laid over the language in force: the last resort name of a scrolling block (scroll), used when neither labelledBy nor aria-label names one. It comes from the catalog rather than a required prop because a renderer’s component map cannot supply one per table',
      ],
      [
        'labelledBy',
        'string',
        '—',
        'ProseScroll',
        'Names it from an element already on the page — the block’s own caption is the good answer, and the one Adrian Roselli’s pattern uses',
      ],
      [
        'handleRef',
        'Ref<ProseScrollHandle>',
        '—',
        'ProseScroll',
        'Reaches refresh() and overflowing(). Content that arrived without React knowing — a renderer writing into the DOM, an image finishing — changes whether the block overflows after the observer measured',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the rendered element of Prose, ProseLead, ProseAnchor, ProseScroll, ProseExclude or ProseFootnotes, and hands it every data attribute. A region rendered as an article is how a page makes the claim a div does not',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element. On ProseScroll the family answers the same callback that starts its observer, so a consumer keeps its element and the family keeps its measurement',
      ],
      [
        'ProseDefaultsProvider',
        '{ size, flow }',
        '—',
        'a subtree',
        'Sets both once for every region under it — Typeset’s presets, typed. An explicit prop on one region still wins, and nesting a provider narrows the decision for part of a page',
      ],
      [
        'Container',
        'composition',
        '—',
        'around Prose',
        'The measure belongs to container and to it alone: <Container size="measure"> is the maximum this family refuses to state. Tailwind bakes 65ch in and ships max-w-none to remove it',
      ],
      [
        'Link, Kbd, Checkbox',
        'composition',
        '—',
        'inside Prose',
        'Every content rule weighs 0-1-0, so a family placed inside the region wins on specificity and is left exactly as it is. A bare a, hr or kbd from the renderer reads the same theme tokens the family would',
      ],
      [
        'code-block, table',
        'deferred',
        '—',
        'inside Prose',
        'Prose paints a fence and a table’s rhythm and nothing more. Highlighting, a copy control and line numbers belong to code-block; sorting, sticky headers and row selection to table',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for this family: the Authoring Practices publish patterns for widgets a reader operates, and a region of rendered text is not one. The governing sources are the platform’s own semantics for the elements a renderer emits, SC 1.4.8 and SC 1.4.12 for how that text may be spaced, and the axe rule scrollable-region-focusable for the one block a reader has to move.',
      'A wide block takes role="region", tabindex="0" and a name only while it actually overflows. The axe rule makes an unreachable scroller a level A failure, and anything that takes focus then needs a name and a role or it fails SC 4.1.2 — so both halves are written together, and neither is written on a block that fits. A tab stop on a table that needs no scrolling is a tab stop that does nothing.',
      'The heading anchor is hidden with opacity, never with display: none or visibility: hidden. It stays in the tab sequence and in the accessible tree, appears on hover and on focus-visible, and holds a 24-pixel target — WCAG 2.2 SC 2.5.8 — so revealing it moves nothing on the line.',
      'The family sets no fixed block size and clips no text box, so a reader raising line height to 1.5, paragraph spacing to 2 and tracking to 0.12 of the font size loses nothing — SC 1.4.12. Leading is stated once, at 1.5, rather than taken per step: the scale pairs 1.45 with its two largest steps because a control label is one line, and a paragraph is not.',
      'Every rule is written in logical properties, so a right-to-left document is the same component mirrored rather than a second stylesheet. A fence is the exception and is forced left to right: the order of the characters is what the code means.',
      'The native ::marker is kept. list-item draws its own because its row is a grid and CSS has no display that is both; an editorial li is not, and removing the marker costs the list semantics Safari drops with it.',
      'The family holds no mutable value, so it emits nothing and has no event table. Which words appear here is the renderer’s decision, and so is whether they are announced: a region that announced every appended token would read a whole answer twice.',
      'It does not sanitise. The renderer that produced the tree is where a sanitiser belongs, and a component that both styled and sanitised would hide which of the two failed.',
    ],
    snippets: [
      defineSnippet({
        id: 'prose-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-ui="prose" data-part="root" data-size="lg" data-flow="normal">\n  <p data-part="lead">The opening.</p>\n  <h2 id="gates">\n    Gates\n    {\'\\u2060\'}\n    <a data-part="anchor" href="#gates" aria-label="Link to this section">\n      #\n    </a>\n  </h2>\n  <div data-part="scroll" role="region" tabIndex={0} aria-labelledby="gates">\n    <table>…</table>\n  </div>\n  <div data-part="exclude">…</div>\n  <section data-part="footnotes">…</section>\n</div>;',
      }),
      defineSnippet({
        id: 'prose-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='prose'] {\n  --slotted-prose-font-family: var(--app-serif);\n  --slotted-prose-line-height: 1.65;\n  --slotted-prose-flow-normal: 1.3em;\n  --slotted-prose-h1-size: 2.25em;\n  --slotted-prose-quote-color: var(--slotted-tone-accent-border);\n}",
      }),
    ],
  },
} as const;
