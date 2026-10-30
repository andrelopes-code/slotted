import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import pageTokens from '@slotted/styles/page/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_PAGE_TOKENS = pageTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Page decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlPage, SlPageBody, SlPageFooter, providePageDefaults } from '@slotted/angular/page';",
  selector: '[slPage], [slPageBody], [slPageFooter]',
  exportAs: 'slPage, slPageBody, slPageFooter',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element:
      'the main carrying slPage, or any element, which then gets role="main" unless landmark="none"',
    required: true,
    purpose:
      'The column of the screen, carrying data-ui="page", data-scroll, data-ground, data-width, data-fill and data-loading. Under scroll="ancestor" it is at least as tall as what scrolls it; under scroll="self" it is exactly as tall as its parent lets it be. It writes the ground and the sticky offsets its children read.',
  },
  {
    part: 'scroll',
    element: 'div',
    required: true,
    purpose:
      'The box the element carrying slPageHeader is projected into first, beside the body — under self, the scroller. It is the one element a page header may be a direct child of, which is why there is no header part.',
  },
  {
    part: 'body',
    element: 'the element carrying slPageBody',
    required: true,
    purpose:
      'The padded column: one slContainer at the page’s width and inset, slHeadingLevel as a host directive so a section inside takes h2, and aria-busy while loading. Under fill, from 600 pixels of the page’s width up, it stretches to what is left.',
  },
  {
    part: 'footer',
    element: 'the footer carrying slPageFooter',
    required: false,
    purpose:
      'The bar for the actions that finish the task, projected outside the scroll part. In the flow and stuck to the bottom of the root, never fixed; named by the footer message; open keeps it through its exit, with data-status for the stylesheet.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The row inside the footer’s container: the footer’s content, aligned to the end, wrapping when the width runs out.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One purchase order screen with every input on it, driven by the controls below the canvas. Scroll the box: the header snaps, the sections pass, the footer waits at the bottom.',
    snippet: defineSnippet({
      id: 'page-angular-playground',
      language: 'angular',
      label: 'A page, its header, its body and its footer',
      source: `<main slPage>
  <header slPageHeader>…</header>
  <div slPageBody>…</div>
  <footer slPageFooter>…</footer>
</main>`,
    }),
  },
  {
    id: 'width',
    title: 'The measure of the content',
    note: 'The four sizes are the slContainer’s own — measure for prose, content for a form, wide for an application screen, full for a table that needs every pixel — and the header, the body and the footer align to the same column. Below 600 pixels of the page’s own width, the compact size class, an inset above step 4 is held at step 4.',
    snippet: defineSnippet({
      id: 'page-angular-width',
      language: 'angular',
      label: 'One measure, three columns',
      source: `<main slPage width="content" [inset]="4">…</main>`,
    }),
  },
  {
    id: 'scroll',
    title: 'Who scrolls',
    note: 'On the left the page is inside a box that scrolls, as inside a shell’s content column; on the right the page’s own scroll part scrolls and the footer sits below it, never over the last line. The header collapses the same way in both.',
    snippet: defineSnippet({
      id: 'page-angular-scroll',
      language: 'angular',
      label: 'The page as the scroller',
      source: `<main slPage scroll="self">…</main>`,
    }),
  },
  {
    id: 'fill',
    title: 'A body that fills',
    note: 'The body stops growing with its content and the two panes inside it take the rest of the height and scroll on their own, as a master–detail does. Nothing scrolls outside them, so a pane is what moves the header: scrolled down past 16 pixels it snaps the area shut, back at its top it opens it again, and the pill still folds it by hand. Only a principal scroller moves it — not a form control, and at least half the body’s height — so a textarea or a short scroll area in the body leaves the header alone. Below 600 pixels of the page’s width fill does not apply: the body grows with its content, the page scrolls, and the header scrolls away with it.',
    snippet: defineSnippet({
      id: 'page-angular-fill',
      language: 'angular',
      label: 'Two panes that scroll themselves',
      source: `<main slPage fill scroll="self">
  <header slPageHeader>…</header>
  <div slPageBody><div class="split">…</div></div>
</main>`,
    }),
  },
  {
    id: 'ground',
    title: 'The two grounds',
    note: 'sunken is the canvas of an application, where a section on a surface separates from the page; surface is a document page, where the content is the page and a rule separates. The header paints the surface on both.',
    snippet: defineSnippet({
      id: 'page-angular-ground',
      language: 'angular',
      label: 'A document page',
      source: `<main slPage ground="surface">…</main>`,
    }),
  },
  {
    id: 'footer',
    title: 'The footer comes and goes',
    note: 'Press the buttons: open slides the bar out and hides it once it has left, held through its exit by presence. It is in the flow, so the last row scrolls up to it rather than under it, and a table’s sticky summary stops above it.',
    snippet: defineSnippet({
      id: 'page-angular-footer',
      language: 'angular',
      label: 'Kept while open, and through its exit',
      source: `<footer slPageFooter [open]="dirty()">
  <button slButton variant="ghost">Descartar</button>
  <button slButton tone="accent">Guardar</button>
</footer>`,
    }),
  },
  {
    id: 'loading',
    title: 'While the record arrives',
    note: 'The body says aria-busy and the cursor says progress; the header stands its skeleton text and the body its own placeholders, because each family draws its own. Press Chegou and nothing moves.',
    snippet: defineSnippet({
      id: 'page-angular-loading',
      language: 'angular',
      label: 'A fact about the surface',
      source: `<main slPage [loading]="order() === undefined">…</main>`,
    }),
  },
  {
    id: 'composition',
    title: 'A whole screen, and a page that is not the document’s main',
    note: 'The full order: header, sticky sections, a table whose column header stops under the chrome, the footer. Then the same family on a div with landmark="none" inside a scrolling pane, because the document already has its main.',
    snippet: defineSnippet({
      id: 'page-angular-composition',
      language: 'angular',
      label: 'A page that is not the document’s main',
      source: `<div slPage landmark="none" scroll="self" width="content">
  <header slPageHeader level="2" size="sm">…</header>
  <div slPageBody>…</div>
</div>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'providePageDefaults carries width, inset, scroll, ground and landmark for every page under it; the directive sits on the consumer’s own element, so an article is an article; the instance is reachable through exportAs.',
    snippet: defineSnippet({
      id: 'page-angular-defaults',
      language: 'ts',
      label: 'Five decisions, taken once',
      source: `bootstrapApplication(App, {
  providers: [providePageDefaults({ ground: 'surface', width: 'content' })],
});`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The landmarks a reader walks',
    note: 'One main per document — the page — with the header inside it and the footer named; a section with a heading is a region named by it; the outline goes h1, h2, h3 without a skip. Walk the landmark list and the heading list of this screen.',
    snippet: defineSnippet({
      id: 'page-angular-accessibility',
      language: 'angular',
      label: 'The outline the page steps',
      source: `<main slPage>
  <header slPageHeader><h1 slPageHeaderHeading>…</h1></header>
  <div slPageBody>
    <section slSection><h2 slSectionHeading>…</h2></section>
  </div>
</main>`,
    }),
  },
];

const events: EventRow[] = [];

export const ANGULAR_PAGE_DOCS = {
  page: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'width',
        "'measure' | 'content' | 'wide' | 'full' | 'bleed'",
        'wide',
        'slPage, providePageDefaults',
        'The measure of the content column: the slContainer’s own sizes, handed to the container the body renders and read by the header and the footer through injection',
      ],
      [
        'inset',
        '0 to 12',
        '6',
        'slPage, providePageDefaults',
        'The inset of the column from the edge of the page, as a step on the space scale — the slContainer’s own. Held at 4 below 600 pixels of the page’s width',
      ],
      [
        'scroll',
        "'ancestor' | 'self'",
        'ancestor',
        'slPage, providePageDefaults',
        'Who scrolls. ancestor makes the page at least as tall as what scrolls it and sticks the footer to the root’s bottom; self makes the scroll part the scroller and puts the footer below it',
      ],
      [
        'fill',
        'boolean',
        'false',
        'slPage',
        'The body stops growing with its content and its child stretches to what is left, for a master–detail, a splitter or a canvas that scroll their own panes. The body’s principal scroller snaps the header’s area. From 600 pixels of the page’s width up; below it the page scrolls as without fill',
      ],
      [
        'ground',
        "'sunken' | 'surface'",
        'sunken',
        'slPage, providePageDefaults',
        'The canvas of an application, or the plain surface of a document. Written as --slotted-page-ground for a sticky section header to paint',
      ],
      [
        'landmark',
        "'main' | 'none'",
        'main',
        'slPage, providePageDefaults',
        'Whether the root is the document’s main. A main element is left alone; any other element gets role="main" unless this says none, for a page inside a drawer, a dialog or a detail pane',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slPage',
        'The body carries aria-busy and the root data-loading. Each family inside draws its own placeholder',
      ],
      [
        'open',
        'boolean',
        'true',
        'slPageFooter',
        'Whether the bar is shown. false slides it out and hides it once it has left, with data-status for the stylesheet',
      ],
      [
        'messages',
        'Partial<PageMessages>',
        '—',
        'slPage',
        'Words laid over the language in force: the accessible name of the footer (footer). An aria-label written on the footer itself still wins',
      ],
    ]),
    composition: apiRows([
      [
        'slPage on any element',
        'directive',
        '—',
        'the consumer’s own element',
        'main keeps its native landmark; an article or a div gets role="main" unless landmark="none". The scroll part is the component’s, because it is the scroller',
      ],
      [
        'exportAs slPage',
        'SlPage',
        '—',
        'a template reference',
        'The resolved width, inset, scroll and ground as signals, which the header and the footer inject',
      ],
      [
        'providePageDefaults()',
        '{ width, inset, scroll, ground, landmark }',
        '—',
        'an injector',
        'The five decisions an application takes once. A page that states any of them itself still wins',
      ],
      [
        '--slotted-page-sticky-top, --slotted-page-sticky-bottom, --slotted-page-scrollport-block-size',
        'runtime properties on the scroller',
        '—',
        'every family under the page, and the consumer’s own sticky elements inside it',
        'The height of the chrome that stays at the top, written by the header, of the footer, and of the scroller itself, written by the page. A section’s sticky header reads the first; a table with stickyTo="page" reads both through the bridge the page writes on its root. A consumer’s own position: sticky element reads the first as well: inset-block-start: calc(var(--slotted-page-sticky-top, 0px) + gap) stops it under the chrome instead of behind the stuck header, and max-block-size: calc(var(--slotted-page-scrollport-block-size, 100dvh) - var(--slotted-page-sticky-top, 0px) - var(--slotted-page-sticky-bottom, 0px) - 2 * gap) bounds one that may be taller than the scroller. The third is the scroller’s visible height, written by the page; under an inset canvas the scroller is shorter than the viewport',
      ],
      [
        'native attributes',
        'on every part',
        '—',
        'every part',
        'Every directive sits on the consumer’s own element, so id, class, role and every listener stay where they were written; role and aria-label are read with HostAttributeToken before anything is written over them',
      ],
    ]),
    accessibility: [
      'The practice is the WAI-ARIA APG’s Landmark Regions (w3.org/WAI/ARIA/apg/practices/landmark-regions/): each page should have one main landmark, and the page is it. Write it on a main element and the directive adds nothing; on any other element it writes role="main", unless landmark="none" says the document already has one.',
      'The footer is a footer element inside main, which is not a contentinfo landmark, so it is named: the catalog’s footer message by default, an aria-label the consumer writes otherwise — read with HostAttributeToken, so the consumer’s word is never written over.',
      'Content outside slPageBody receives no inset: the inset lives on the body, so content written straight into slPage is drawn against the viewport edges. In development, slPage warns once when it holds content and no slPageBody.',
      'The outline is typography’s. slHeadingLevel is a host directive of the body, so a section written directly in it takes h2 under the header’s h1 and a section inside that takes h3 — without either family reading the other, and without a skip the HTML Standard forbids.',
      'The body carries aria-busy while loading, which is what tells a screen reader the region is not ready. The page draws no placeholder: the header stands skeleton text of the title’s own width, and each family inside stands its own.',
      'Scrolling is the platform’s. The page never writes a scroll position, and under scroll="self" the scroll part is an ordinary scrolling box a keyboard reaches with the arrow keys once something inside it has focus.',
    ],
    snippets: [
      defineSnippet({
        id: 'page-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<main data-ui="page" data-part="root" data-scroll="ancestor" data-ground="sunken" data-width="wide">
  <div data-part="scroll">
    <header data-ui="page-header">…</header>
    <div data-part="body">
      <div data-ui="container" data-size="wide" data-inset="6">…</div>
    </div>
  </div>
  <footer data-part="footer" aria-label="Page actions" data-status="open">
    <div data-ui="container" data-size="wide" data-inset="6">
      <div data-part="actions">…</div>
    </div>
  </footer>
</main>`,
      }),
      defineSnippet({
        id: 'page-sticky-offset',
        language: 'css',
        label: 'A consumer’s own sticky element under the page’s chrome',
        source: `.order-summary {
  position: sticky;
  inset-block-start: calc(var(--slotted-page-sticky-top, 0px) + var(--slotted-space-4));
  max-block-size: calc(
    var(--slotted-page-scrollport-block-size, 100dvh) - var(--slotted-page-sticky-top, 0px) -
      var(--slotted-page-sticky-bottom, 0px) - 2 * var(--slotted-space-4)
  );
  overflow-y: auto;
}`,
      }),
      defineSnippet({
        id: 'page-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='page'] {
  --slotted-page-background-sunken: var(--slotted-surface-sunken);
  --slotted-page-padding-block: var(--slotted-space-9);
  --slotted-page-footer-padding-block: var(--slotted-space-5);
}`,
      }),
    ],
  },
} as const;
