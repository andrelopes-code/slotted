import { defineSnippet } from '@slotted/storybook-workbench';
import type { AnatomyRow, ApiRow, EventRow, ReferenceImport } from '@slotted/storybook-workbench';
import scrollAreaTokens from '@slotted/styles/scroll-area/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_SCROLL_AREA_TOKENS = scrollAreaTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Scroll Area decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlScrollArea, SlScrollAreaContent, provideScrollAreaDefaults } from '@slotted/angular/scroll-area';",
  selector: '[slScrollArea]',
  exportAs: 'slScrollArea',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element, with slScrollArea',
    required: true,
    purpose:
      'The frame. It holds the maximum, the five measurement attributes and whatever border, radius and ground the consumer gives it — and it is the element the veil is not on, which is why it exists.',
  },
  {
    part: 'viewport',
    element: 'div[role=region]',
    required: true,
    purpose:
      'The scrollport. It clips, scrolls, carries the platform scrollbar and the veil, and takes the tab stop and the name a scrolling region owes — role, tabindex and name written only while the content overflows. Rendered by the component inside the host; reached through the instance’s viewport.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'The inset that scrolls with the content. Padding on a scrollport is not applied at its end edge in every engine, so an inset that has to survive a scroll to the end lives here. Content that carries its own inset needs no slScrollAreaContent at all.',
  },
];

const events: EventRow[] = [
  {
    name: 'scrollChange',
    payload: '{ position: { block: number; inline: number }; source: Event }',
    when: 'On every scroll, with the distance from each logical start. A report and not a request: the browser moves the position on a wheel, a fling, a Tab into a child and a printed page, and nothing here can refuse any of them.',
  },
  {
    name: 'overflowChange',
    payload: '{ block: OverflowState; inline: OverflowState }',
    when: 'Once on mount and once per change: whether each axis overflows and which of its ends show. The same measurement is written on the root as data-overflowing and the four data-at-* attributes.',
  },
];

export const ANGULAR_SCROLL_AREA_DOCS = {
  scrollArea: {
    accessibility: [
      'There is no APG pattern for a scroll container; what governs is WCAG 2.1.1, tested by the scrollable-region-focusable rule, and 4.1.2, which is what a tab stop then owes. The viewport is role="region" with tabindex="0" and a name, written only while the content overflows — a tab stop on content that fits is a tab stop that does nothing.',
      'The name resolves in one order: labelledBy, then messages.label, then the catalog of the language in force, so a product with fifty areas names them once. Base UI and Zag write role="presentation" beside their tab stop, which answers the rule that is tested and breaks the one that is not.',
      'Nine keys are the platform’s on a focused scrollport — the arrows, PageUp and PageDown, Home, End and Space — and the family binds none of them. The one key it owns is Tab, and [tabbable]="false" gives that back when a consumer knows the content is reachable another way.',
      'The scrollbar is the platform’s, themed through scrollbar-color and scrollbar-width. The trough click, the scrollbar context menu, the system’s own overlay behavior and the bar before hydration all survive; a drawn thumb loses every one of them.',
      'The veil is a mask and is removed under forced-colors, where the system owns the palette and a veil over system text loses legibility for nothing. The scrollbar goes back to the system’s own there too.',
    ],
    anatomy,
    api: apiRows([
      [
        'axis',
        "'block' | 'inline' | 'both'",
        'block',
        '[slScrollArea]',
        'Which axes scroll. Logical, so a vertical writing mode needs no second vocabulary',
      ],
      [
        'scrollbars',
        "'auto' | 'always' | 'hover' | 'none'",
        'auto',
        '[slScrollArea]',
        'What the bar does: shown when needed, always reserved, painted only under a hand or the keyboard, or removed with the scrolling kept',
      ],
      [
        'gutter',
        "'auto' | 'stable' | 'both-edges'",
        'stable',
        '[slScrollArea]',
        'scrollbar-gutter. stable stops the content shifting when it first overflows; both-edges keeps a column centerd',
      ],
      [
        'fade',
        "'both' | 'end' | 'none'",
        'both',
        '[slScrollArea]',
        'Where the veil is drawn: over what the reader has passed as well as what is ahead, only what is ahead, or nowhere',
      ],
      [
        'overscroll',
        "'contain' | 'auto' | 'none'",
        'contain',
        '[slScrollArea]',
        'overscroll-behavior. contain keeps the last inch of scroll from moving the page behind the area',
      ],
      [
        'maxBlockSize',
        'string',
        '—',
        '[slScrollArea]',
        'Scroll only past this size, as any CSS length. Mantine’s Autosize as one prop',
      ],
      ['maxInlineSize', 'string', '—', '[slScrollArea]', 'The same bound on the inline axis'],
      [
        'tabbable',
        'boolean',
        'true',
        '[slScrollArea]',
        'Whether the scrollport joins the tab sequence while it overflows. Off only when the content is reachable another way',
      ],
      [
        'messages',
        'Partial<ScrollAreaMessages>',
        '—',
        '[slScrollArea]',
        'Words laid over the language in force: the name the region is announced by (label), when nothing points at a heading',
      ],
      [
        'labelledBy',
        'string',
        '—',
        '[slScrollArea]',
        'The id of the element that names the region. Wins over messages.label',
      ],
    ]),
    composition: apiRows([
      [
        'provideScrollAreaDefaults',
        'Partial<ScrollAreaDefaults>',
        '—',
        'a provider',
        'An application decides once what its scroll areas look like; the region’s name comes from the language in force',
      ],
      [
        'exportAs',
        'slScrollArea',
        '—',
        '[slScrollArea]',
        'The instance: root, viewport, state(), position(), scrollTo(), scrollToEdge(), reveal(), refresh() and focus()',
      ],
      [
        '[slScrollAreaContent]',
        'directive',
        '—',
        'the consumer’s own element inside the host',
        'The inset that scrolls with the content; optional, and a plain element when the content carries its own',
      ],
      [
        'the host element',
        'any element',
        '—',
        '[slScrollArea]',
        'The frame is the consumer’s own element, with its own class, border and attributes; the family writes its wiring on the scrollport it renders inside, so nothing on the host is written over',
      ],
      [
        'data-focus-origin',
        'attribute',
        '—',
        'viewport',
        'keyboard or pointer while the viewport holds focus. The ring is drawn for keyboard only: a click on the content focuses the viewport, and the next Shift would make it match :focus-visible. createFocusOrigin in @slotted/core/focus writes it',
      ],
      [
        'data-overflowing, data-at-block-start, data-at-block-end, data-at-inline-start, data-at-inline-end',
        'attribute',
        '—',
        'root',
        'The measurement in the DOM, in logical names, for a consumer’s own CSS. An edge attribute says that end is showing',
      ],
      [
        'scrollbar-width: none on [data-part=viewport]',
        'CSS',
        '—',
        'the consumer’s stylesheet',
        'The composition for a product that needs a drawn thumb: hide the platform bar and draw one against the edge attributes',
      ],
    ]),
    events,
    imports,
    scenes: [
      {
        id: 'playground',
        title: 'A bounded region, and the platform’s own bar',
        note: 'Scroll the notes. The bar is the browser’s, themed; the veil at the bottom says there is more and lifts when the end is reached. Tab reaches the region, and the arrows and page keys are the platform’s.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-playground',
          language: 'angular',
          label: 'The whole of the common case',
          source:
            '<div slScrollArea class="notes" [messages]="{ label: \'Release notes\' }">\n  <div slScrollAreaContent>…</div>\n</div>',
        }),
      },
      {
        id: 'axis',
        title: 'Which axes scroll',
        note: 'block is the default and holds the inline axis still; inline runs a row past its box and mirrors with the document; both scrolls a log on both, with four veils meeting at the corners.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-axis',
          language: 'angular',
          label: 'One axis per area',
          source: '<div slScrollArea axis="inline">…</div>\n<div slScrollArea axis="both">…</div>',
        }),
      },
      {
        id: 'scrollbars',
        title: 'Four things the bar can do',
        note: 'auto shows the bar when needed; always reserves it on content that fits; hover keeps the gutter and paints nothing until a hand or the keyboard is inside; none removes the bar and leaves the veil to say there is more.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-scrollbars',
          language: 'angular',
          label: 'The policy, and the platform underneath it',
          source: '<div slScrollArea scrollbars="hover">…</div>',
        }),
      },
      {
        id: 'fade',
        title: 'The veil, and where it falls',
        note: 'Each area is scrolled into the middle of its content. both dims what the reader has passed as well as what is ahead; end only what is ahead; none leaves the scrollbar as the only sign.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-fade',
          language: 'angular',
          label: 'A veil that needs no ink',
          source: '<div slScrollArea fade="end">…</div>',
        }),
      },
      {
        id: 'gutter',
        title: 'Room for a bar that is not there yet',
        note: 'The painted inset is the measure. auto reaches the frame and will shift the moment the content overflows; stable holds a bar’s width back so nothing moves; both-edges holds it back on both sides, so a centerd column stays centerd.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-gutter',
          language: 'angular',
          label: 'scrollbar-gutter, as an axis',
          source: '<div slScrollArea gutter="both-edges">…</div>',
        }),
      },
      {
        id: 'overscroll',
        title: 'Where the last inch of scroll goes',
        note: 'Scroll the inner area to its end and keep going. With contain the page behind it stays put; with auto the scroll chains to the page, which is the browser’s default and the defect the property was added for.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-overscroll',
          language: 'angular',
          label: 'Chaining, and the default that stops it',
          source: '<div slScrollArea overscroll="auto">…</div>',
        }),
      },
      {
        id: 'maximum',
        title: 'Scroll only past a maximum',
        note: 'A list of three items takes the height it needs and scrolls nothing. Add items and it grows until it meets the maximum, then scrolls — Mantine’s Autosize as one prop, and the region wiring appears at the same moment the overflow does.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-maximum',
          language: 'angular',
          label: 'A bound rather than a size',
          source: '<div slScrollArea maxBlockSize="12rem">…</div>',
        }),
      },
      {
        id: 'keyboard',
        title: 'One key the family owns, and nine it leaves alone',
        note: 'Tab into the region and press the arrows, PageDown, End and Home: every one is the platform’s. The second area holds a link, so tabbable is off and Tab goes straight to the link — the scrollport is still focusable by pointer.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-keyboard',
          language: 'angular',
          label: 'Giving Tab back when a child already takes it',
          source: '<div slScrollArea [tabbable]="false">\n  <a slLink href="#…">…</a>\n</div>',
        }),
      },
      {
        id: 'content',
        title: 'Content the family did not choose',
        note: 'Three unbroken paths scroll on the inline axis and are veiled where they leave the box; a translated paragraph twice the length wraps and scrolls; three short lines fit, and the area is then a plain box with no veil, no bar and no tab stop.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-content',
          language: 'angular',
          label: 'The same element for all three',
          source: '<div slScrollArea axis="both" class="log">…</div>',
        }),
      },
      {
        id: 'composition',
        title: 'A handle, a report, and a different element',
        note: 'The buttons drive the handle: to the end, back to the start, and to one row by reveal, which moves the area and nothing around it. The position is reported on every scroll and shown beside the area; the frame is rendered as a section.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-composition',
          language: 'angular',
          label: 'The imperative half',
          source:
            '<section slScrollArea #area="slScrollArea" (scrollChange)="block = $event.position.block">\n  …\n</section>\n<button slButton (click)="area.scrollToEdge(\'block-end\')">Fim</button>',
        }),
      },
      {
        id: 'print',
        title: 'What the printer gets',
        note: 'Open the print preview of this page. The area releases its maximum and its clipping under the print media query, so the whole content is on paper rather than the slice that happened to be in view — which is what every surveyed implementation prints.',
        snippet: defineSnippet({
          id: 'scroll-area-print',
          language: 'css',
          label: 'Already in the stylesheet',
          source:
            "@media print {\n  [data-ui='scroll-area'] > [data-part='viewport'] {\n    max-block-size: none;\n    overflow: visible;\n    mask-image: none;\n  }\n}",
        }),
      },
      {
        id: 'accessibility',
        title: 'What a screen reader is told',
        note: 'The first area overflows and is a named region with a tab stop; the second fits and is nothing at all. The third is named by the heading above it rather than by a string, and a provider sets the fallback name once for the page.',
        snippet: defineSnippet({
          id: 'scroll-area-angular-accessibility',
          language: 'angular',
          label: 'The name, in the order it resolves',
          source: '<h3 id="notes">Release notes</h3>\n<div slScrollArea labelledBy="notes">…</div>',
        }),
      },
    ],
    snippets: [
      defineSnippet({
        id: 'scroll-area-theming',
        language: 'css',
        label: 'Retuning the family',
        source:
          ':root {\n  --slotted-scroll-area-thumb-color: var(--slotted-text-muted);\n  --slotted-scroll-area-track-color: transparent;\n  --slotted-scroll-area-fade-size: 2rem;\n}',
      }),
      defineSnippet({
        id: 'scroll-area-drawn',
        language: 'css',
        label: 'A drawn thumb, for the product that needs one',
        source:
          "[data-ui='scroll-area'] > [data-part='viewport'] {\n  scrollbar-width: none;\n}\n\n[data-ui='scroll-area']:not([data-at-block-end])::after {\n  /* your own thumb, against the edge attributes */\n}",
      }),
    ],
  },
};
