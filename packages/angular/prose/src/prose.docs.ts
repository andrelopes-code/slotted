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

export const ANGULAR_PROSE_TOKENS = proseTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-prose-')
    ? 'A reading decision this family owns'
    : 'The foundation scale this family reads',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideProseDefaults,\n  SlProse,\n  SlProseAnchor,\n  SlProseExclude,\n  SlProseFootnotes,\n  SlProseLead,\n  SlProseScroll,\n} from '@slotted/angular/prose';",
  selector: '[slProse]',
  exportAs: 'slProse',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element the page wrote — div, article, section',
    required: true,
    purpose:
      'The region. The selector is an attribute, so the page keeps its own element: a div claims nothing, and article or main is a claim the page makes. Carries data-ui="prose", the two axes, and the container this family answers its own width with.',
  },
  {
    part: 'lead',
    element: 'p, by slProseLead',
    required: false,
    purpose:
      'The opening paragraph, one step up and in the muted role, with a wider gap after it than two ordinary paragraphs get. Tailwind’s equivalent is a class written into the Markdown; here it is contract, so a renderer’s component map can produce it.',
  },
  {
    part: 'anchor',
    element: 'a, by slProseAnchor',
    required: false,
    purpose:
      'A heading’s permalink. The destination is the consumer’s — rehype-autolink-headings writes it — and the family owns the placement, the 24-pixel target, the word joiner before it and the rule that it appears on hover and on focus. Hidden with opacity, never display, so a keyboard reaches it.',
  },
  {
    part: 'scroll',
    element: 'div, by slProseScroll',
    required: false,
    purpose:
      'A wide block — a table, a fence — that scrolls sideways instead of pushing the page over. It takes role="region", tabindex="0" and a name only while it actually overflows, measured through @slotted/core/overflow. exportAs reaches refresh().',
  },
  {
    part: 'exclude',
    element: 'any element, by slProseExclude',
    required: false,
    purpose:
      'A subtree the family does not style. Every content rule carries a guard against it, and the four properties inheritance still carried in — family, size, leading and wrapping — are returned to control type.',
  },
  {
    part: 'footnotes',
    element: 'section, by slProseFootnotes',
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
      id: 'prose-angular-playground',
      language: 'angular',
      label: 'A region of content the page did not author',
      source: '<article slProse size="lg" flow="normal" [innerHTML]="rendered"></article>',
    }),
  },
  {
    id: 'elements',
    title: 'Every element a renderer emits',
    note: 'Headings, lists, a quotation, a fence, a table, media, a rule, a description list, a disclosure and the inline set — all bare tags, styled without a single attribute of their own.',
    snippet: defineSnippet({
      id: 'prose-angular-elements',
      language: 'angular',
      label: 'The whole specimen, from one renderer',
      source: '<div slProse [innerHTML]="sanitized"></div>',
    }),
  },
  {
    id: 'size',
    title: 'Size',
    note: 'The type-scale step the body takes. lg is one rem and is the default; md is the size a button label is set in, for a region inside dense product chrome.',
    snippet: defineSnippet({
      id: 'prose-angular-size',
      language: 'angular',
      label: 'Three reading sizes',
      source:
        '<div slProse size="md">…</div>\n<div slProse size="lg">…</div>\n<div slProse size="xl">…</div>',
    }),
  },
  {
    id: 'flow',
    title: 'Flow',
    note: 'The one number that governs every gap on the page. Heading spacing, list spacing and the room around a rule all derive from it, so a chat message and an article are one input apart.',
    snippet: defineSnippet({
      id: 'prose-angular-flow',
      language: 'angular',
      label: 'The same content at three rhythms',
      source:
        '<div slProse flow="tight">…</div>\n<div slProse flow="normal">…</div>\n<div slProse flow="loose">…</div>',
    }),
  },
  {
    id: 'lead',
    title: 'The lead paragraph',
    note: 'The opening sentence set one step up, in the muted role, with a wider gap under it — so the opening reads as its own movement rather than as the first of several paragraphs.',
    snippet: defineSnippet({
      id: 'prose-angular-lead',
      language: 'angular',
      label: 'An opening the renderer maps to a part',
      source:
        '<div slProse>\n  <h2>Deploying a service</h2>\n  <p slProseLead>Everything a team needs to move a service to production.</p>\n  <p>A deployment is three decisions…</p>\n</div>',
    }),
  },
  {
    id: 'anchor',
    title: 'Heading anchors',
    note: 'Hover a heading, then tab to its permalink: it appears for both, because a control that answers hover alone is a control a keyboard cannot find. It holds its box whether visible or not, so revealing it moves nothing.',
    snippet: defineSnippet({
      id: 'prose-angular-anchor',
      language: 'angular',
      label: 'A permalink the renderer writes',
      source:
        '<h2 id="deploying">\n  Deploying a service<a slProseAnchor href="#deploying" aria-label="Link to this section">#</a>\n</h2>',
    }),
  },
  {
    id: 'scroll',
    title: 'A block wider than its column',
    note: 'Tab into the table below: it takes a tab stop, a region role and a name only because it overflows. Widen the window until it fits and all three disappear, which is the point.',
    snippet: defineSnippet({
      id: 'prose-angular-scroll',
      language: 'angular',
      label: 'A table that a keyboard can scroll',
      source:
        '<div slProseScroll labelledBy="environments" #wide="slProseScroll">\n  <table>\n    <caption id="environments">\n      Environments and their gates\n    </caption>\n  </table>\n</div>\n<button type="button" (click)="wide.refresh()">Measure again</button>',
    }),
  },
  {
    id: 'exclude',
    title: 'Opting a component out',
    note: 'The card below sits inside the region and keeps its own type, rhythm and color. Everything around it is still set by the family, and the boundary is one directive.',
    snippet: defineSnippet({
      id: 'prose-angular-exclude',
      language: 'angular',
      label: 'A component the family leaves alone',
      source:
        '<div slProse>\n  <p>Styled by the family.</p>\n  <div slProseExclude>\n    <div slCard>Untouched.</div>\n  </div>\n</div>',
    }),
  },
  {
    id: 'streaming',
    title: 'Content that is still arriving',
    note: 'Press the button and blocks are appended one at a time, the way a language model answers. Nothing already on screen moves: no rule in this family selects forward, and every gap is on the block that arrives.',
    snippet: defineSnippet({
      id: 'prose-angular-streaming',
      language: 'angular',
      label: 'Appending into a region that is being read',
      source:
        '<div slProse flow="tight">\n  @for (block of blocks(); track block.id) {\n    <p>{{ block.text }}</p>\n  }\n</div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A body that starts at h3, two headings with nothing between them, a pasted destination with no break in it, four levels of list, and a right-to-left paragraph in the middle of the page.',
    snippet: defineSnippet({
      id: 'prose-angular-content',
      language: 'angular',
      label: 'What a real document does',
      source:
        '<div slProse>\n  <h3>A body that does not start at the top level</h3>\n  <h4>Two headings with nothing between them</h4>\n  <p lang="ar" dir="rtl">فقرة عربية داخل نفس المنطقة.</p>\n</div>',
    }),
  },
  {
    id: 'composition',
    title: 'The families it sits with',
    note: 'slContainer bounds the measure, and a real slLink inside the text wins on specificity — every content rule here is written to lose to a family placed inside it.',
    snippet: defineSnippet({
      id: 'prose-angular-composition',
      language: 'angular',
      label: 'Measure, and a real link inside the text',
      source:
        '<div slContainer size="measure">\n  <article slProse>\n    <p>Read <a slLink href="/guide">the guide</a> first.</p>\n  </article>\n</div>',
    }),
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    note: 'The two things in this family a reader operates: the permalink beside a heading, and the scrolling block. Tab through the region and both take focus in the order the document holds them.',
    snippet: defineSnippet({
      id: 'prose-angular-accessibility',
      language: 'angular',
      label: 'The whole keyboard surface of the family',
      source:
        '<div slProse>\n  <h2 id="gates">Gates<a slProseAnchor href="#gates" aria-label="Link to this section">#</a></h2>\n  <div slProseScroll labelledBy="gates">\n    <table></table>\n  </div>\n</div>',
    }),
  },
];

export const ANGULAR_PROSE_DOCS = {
  prose: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'size',
        "'md' | 'lg' | 'xl'",
        'lg',
        'slProse',
        'The type-scale step the body text takes. Named for the scale’s own steps, so the offset from control type is visible: lg is one rem, and md is the size a button label is set in',
      ],
      [
        'flow',
        "'tight' | 'normal' | 'loose'",
        'normal',
        'slProse',
        'The space between blocks, from which every other distance derives — the gap above a heading, between list rows, and around a rule. tight is a chat message, loose an article',
      ],
      [
        'messages',
        'Partial<ProseMessages>',
        '—',
        'slProseScroll',
        'Words laid over the language in force: the last resort name of a scrolling block (scroll), used when neither labelledBy nor aria-label names one. It comes from the catalog rather than a required input because a renderer’s component map cannot supply one per table',
      ],
      [
        'labelledBy',
        'string',
        '—',
        'slProseScroll',
        'Names it from an element already on the page — the block’s own caption is the good answer, and the one Adrian Roselli’s pattern uses',
      ],
    ]),
    composition: apiRows([
      [
        'the attribute selector',
        'directive',
        '—',
        'every part',
        'Each part attaches to the element the template already has, so a page keeps its own tags and the family adds only its data attributes. Nothing is re-projected, and nothing needs NgTemplateOutlet',
      ],
      [
        'exportAs',
        'slProse, slProseScroll',
        '—',
        'slProse, slProseScroll',
        'Reaches the instance from the template. On the scrolling block that is refresh() and isOverflowing(): content that arrived without Angular knowing — an image finishing, a renderer writing into the DOM — changes whether the block overflows after the observer measured',
      ],
      [
        'provideProseDefaults',
        '{ size, flow }',
        '—',
        'a route or the application',
        'Sets both once for every region under it — Typeset’s presets, typed. An explicit input on one region still wins, and providing again on a route narrows the decision for part of an application',
      ],
      [
        'role, aria-label',
        'static attribute',
        '—',
        'slProseScroll',
        'A name or a role the template wrote is read with HostAttributeToken before anything is bound over it, so a consumer who named the region itself keeps that name',
      ],
      [
        'slContainer',
        'composition',
        '—',
        'around slProse',
        'The measure belongs to container and to it alone: size="measure" is the maximum this family refuses to state. Tailwind bakes 65ch in and ships max-w-none to remove it',
      ],
      [
        'slLink, slKbd, slCheckbox',
        'composition',
        '—',
        'inside slProse',
        'Every content rule weighs 0-1-0, so a family placed inside the region wins on specificity and is left exactly as it is. A bare a, hr or kbd from the renderer reads the same theme tokens the family would',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for this family: the Authoring Practices publish patterns for widgets a reader operates, and a region of rendered text is not one. The governing sources are the platform’s own semantics for the elements a renderer emits, SC 1.4.8 and SC 1.4.12 for how that text may be spaced, and the axe rule scrollable-region-focusable for the one block a reader has to move.',
      'A wide block takes role="region", tabindex="0" and a name only while it actually overflows. The axe rule makes an unreachable scroller a level A failure, and anything that takes focus then needs a name and a role or it fails SC 4.1.2 — so both halves are written together, and neither is written on a block that fits. A role the template wrote itself is kept.',
      'The heading anchor is hidden with opacity, never with display: none or visibility: hidden. It stays in the tab sequence and in the accessible tree, appears on hover and on focus-visible, and holds a 24-pixel target — WCAG 2.2 SC 2.5.8. The directive writes a word joiner before it so the last word of a title and its permalink wrap together.',
      'The family sets no fixed block size and clips no text box, so a reader raising line height to 1.5, paragraph spacing to 2 and tracking to 0.12 of the font size loses nothing — SC 1.4.12. Leading is stated once, at 1.5, rather than taken per step: the scale pairs 1.45 with its two largest steps because a control label is one line, and a paragraph is not.',
      'Every rule is written in logical properties, so a right-to-left document is the same component mirrored rather than a second stylesheet. A fence is the exception and is forced left to right: the order of the characters is what the code means.',
      'The family holds no mutable value, so it emits nothing and has no output table. Which words appear here is the renderer’s decision, and so is whether they are announced: a region that announced every appended token would read a whole answer twice.',
      'It does not sanitise. Angular’s own DomSanitizer and the renderer that produced the tree are where that belongs, and a component that both styled and sanitised would hide which of the two failed.',
    ],
    snippets: [
      defineSnippet({
        id: 'prose-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<article data-ui="prose" data-part="root" data-size="lg" data-flow="normal">\n  <p data-part="lead">The opening.</p>\n  <h2 id="gates">Gates<a data-part="anchor" href="#gates">#</a></h2>\n  <div data-part="scroll" role="region" tabindex="0" aria-labelledby="gates">\n    <table></table>\n  </div>\n  <div data-part="exclude"></div>\n  <section data-part="footnotes"></section>\n</article>',
      }),
      defineSnippet({
        id: 'prose-angular-defaults',
        language: 'ts',
        label: 'Setting the reading rhythm once for an application',
        source:
          "import { provideProseDefaults } from '@slotted/angular/prose';\n\nbootstrapApplication(App, {\n  providers: [provideProseDefaults({ flow: 'loose' })],\n});",
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
