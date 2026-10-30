import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import sectionTokens from '@slotted/styles/section/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_SECTION_TOKENS = sectionTokens.map((name) => ({
  name,
  purpose:
    name === '--slotted-page-ground'
      ? 'The ground a sticky header paints, published by the page. A region inside a page that paints a ground of its own declares it with that ground, so a sticky header under it matches the region.'
      : 'Theme-owned Section decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlSection, SlSectionHeader, SlSectionTitle, SlSectionEyebrow, SlSectionHeading, SlSectionTags, SlSectionDescription, SlSectionActions, SlSectionBody, provideSectionDefaults } from '@slotted/angular/section';",
  selector:
    '[slSection], [slSectionHeader], [slSectionTitle], [slSectionEyebrow], [slSectionHeading], [slSectionTags], [slSectionDescription], [slSectionActions], [slSectionBody]',
  exportAs: 'slSection, slSectionHeading',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the section carrying slSection',
    required: true,
    purpose:
      'The unit, carrying data-ui="section", the five inputs, an id a hash link can reach and a scroll margin the height of the page chrome. aria-labelledby its heading once one is rendered, which makes it a region.',
  },
  {
    part: 'header',
    parent: 'root',
    element: 'the element carrying slSectionHeader',
    required: false,
    purpose:
      'The row above the body: the heading, its tags and the actions on one baseline, the eyebrow above and the description below on rows of their own. Sticky under the page chrome when sticky is set, painted in the page’s ground so what scrolls under it is covered; it carries data-stuck while content passes under it, and its ground is --slotted-section-header-background, which defaults to the page’s; its height is measured and added to the sticky top the body publishes, so a table’s column header or a nested section inside stops under it, not under the page.',
  },
  {
    part: 'title',
    parent: 'header',
    element: 'the element carrying slSectionTitle',
    required: false,
    purpose:
      'Eyebrow, heading, tags and description, in that order, laid out on the header’s rows, so the actions align with the heading and not with the top of an eyebrow.',
  },
  {
    part: 'eyebrow',
    parent: 'title',
    element: 'the element carrying slSectionEyebrow',
    required: false,
    purpose:
      'A short overline above the heading in small capitals — a count, a category. Structural rather than status: status is a tag.',
  },
  {
    part: 'heading',
    parent: 'title',
    element:
      'the h1 to h6 carrying slSectionHeading, or any element, which then gets role="heading"',
    required: false,
    purpose:
      'The heading. Rendering it is what names the region. A native heading written by the consumer is left alone; a div or a link gets role="heading" and aria-level from the rank the section resolved.',
  },
  {
    part: 'tags',
    parent: 'title',
    element: 'the element carrying slSectionTags',
    required: false,
    purpose:
      'Badges or tags beside the heading — a count, a status — aligned on the heading’s baseline. Outside the heading, so they are not read into the region’s name. They never leave the heading’s row: a long heading wraps its words and the badges stack beside it.',
  },
  {
    part: 'description',
    parent: 'title',
    element: 'the p carrying slSectionDescription',
    required: false,
    purpose:
      'A paragraph under the heading, in the muted text, with a measure of seventy characters.',
  },
  {
    part: 'actions',
    parent: 'header',
    element: 'the element carrying slSectionActions',
    required: false,
    purpose:
      'The end of the heading’s row, on its baseline: an slButton, an slToolbar, an slLink. On a header narrower than 20rem it takes a row of its own at the end.',
  },
  {
    part: 'body',
    parent: 'root',
    element: 'the element carrying slSectionBody',
    required: true,
    purpose:
      'The content, with slHeadingLevel as a host directive, so a section inside it takes the next rank without being told.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One section of a purchase order with every input on it, driven by the controls below the canvas. It sits inside a page, so its rank is h2 and its sticky header stops under the page chrome.',
    snippet: defineSnippet({
      id: 'section-angular-playground',
      language: 'angular',
      label: 'A section inside a page body',
      source: `<section slSection>
  <div slSectionHeader>
    <div slSectionTitle><h2 slSectionHeading>Order items</h2></div>
  </div>
  <div slSectionBody>…</div>
</section>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The eyebrow with the count, the heading with a status tag beside it, the description under it, an action at the end of the heading’s row, and the body with the table. The section is a region named by its heading.',
    snippet: defineSnippet({
      id: 'section-angular-anatomy',
      language: 'angular',
      label: 'The nine parts',
      source: `<section slSection divider id="itens">
  <div slSectionHeader>
    <div slSectionTitle>
      <span slSectionEyebrow>36 itens</span>
      <h2 slSectionHeading>Order items</h2>
      <div slSectionTags><span slBadge size="sm" tone="warning">Pending</span></div>
      <p slSectionDescription>Quantities per the accepted quote.</p>
    </div>
    <div slSectionActions><button slButton size="sm" variant="outline">Export</button></div>
  </div>
  <div slSectionBody><div slTable>…</div></div>
</section>`,
    }),
  },
  {
    id: 'level',
    title: 'The rank is the outline’s',
    note: 'Three sections nested with div headings: role="heading" at level 2 directly in the page, 3 inside it, 4 inside that — none of them told. level="5" on the last one overrides the outline.',
    snippet: defineSnippet({
      id: 'section-angular-level',
      language: 'angular',
      label: 'The consumer’s element, the outline’s rank',
      source: `<section slSection>
  <div slSectionHeading>Fleet</div>
  <div slSectionBody>
    <section slSection><div slSectionHeading>Heavy vehicles</div></section>
  </div>
</section>`,
    }),
  },
  {
    id: 'size',
    title: 'The step the label sits at',
    note: 'The heading is a label in tracked small capitals: xs for sm and md, sm for lg. A section nested in another sets its heading in mixed case and the muted tone, on sm, md or lg for its own size. The step says nothing about the rank.',
    snippet: defineSnippet({
      id: 'section-angular-size',
      language: 'angular',
      label: 'Size and rank, apart',
      source: `<section slSection level="3" size="lg">…</section>`,
    }),
  },
  {
    id: 'separation',
    title: 'Space, a rule, or a surface',
    note: 'Three sections on the page’s sunken canvas: separated by the family’s own spacing and the label alone, by a divider under the header, and by a surface with an edge and a radius — no shadow, no hover, because a section is not a card.',
    snippet: defineSnippet({
      id: 'section-angular-separation',
      language: 'angular',
      label: 'A surface, not a card',
      source: `<section slSection ground="surface">…</section>`,
    }),
  },
  {
    id: 'sticky',
    title: 'A header that stays',
    note: 'Scroll the screen: each section’s header stops under the page chrome and the next one pushes it away. Pin the page header and they all stop lower, because the page publishes where its chrome ends. A sticky section republishes it for its body as page plus header, so layers add up: a section in a section, a table in that.',
    snippet: defineSnippet({
      id: 'section-angular-sticky',
      language: 'angular',
      label: 'Under whatever the page keeps at the top',
      source: `<section slSection sticky>…</section>`,
    }),
  },
  {
    id: 'nested',
    title: 'A section inside a section',
    note: 'The fleet, its heavy vehicles, the tractors: three depths, three ranks. The outer heading is a label in small capitals; the inner ones are mixed case in the muted tone, the level read in case, size and tone. Every other rule reaches its part with a child combinator, so the outer header styles nothing else of the inner one.',
    snippet: defineSnippet({
      id: 'section-angular-nested',
      language: 'angular',
      label: 'Three depths',
      source: `<section slSection size="lg">
  <div slSectionHeading>Frota</div>
  <div slSectionBody>
    <section slSection>
      <div slSectionHeading>Heavy vehicles</div>
      <div slSectionBody>
        <section slSection size="sm"><div slSectionHeading>Tractor units</div></section>
      </div>
    </section>
  </div>
</section>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A nine-word heading wraps, a long eyebrow wraps in small capitals, a translated description keeps its measure, and a header with no actions leaves no vacancy at the end of the row.',
    snippet: defineSnippet({
      id: 'section-angular-content',
      language: 'angular',
      label: 'A heading the row cannot hold',
      source: `<h2 slSectionHeading>
  Approval, warranty, retreading and environmentally appropriate disposal requirements for the
  supplied tires
</h2>`,
    }),
  },
  {
    id: 'composition',
    title: 'A section with a table, a collapsible and a description list in it',
    note: 'The body holds other families and steps the outline for them: the collapsible’s header sits one rank under the section. Scroll and the sticky header stays over all of it.',
    snippet: defineSnippet({
      id: 'section-angular-composition',
      language: 'angular',
      label: 'What a body holds',
      source: `<div slSectionBody><div slTable stickyHeader stickyTo="page">…</div></div>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'provideSectionDefaults carries size, divider, ground and sticky for every section under it; the heading directive sits on the consumer’s own link while the family keeps the rank; a hash link reaches the root by its id.',
    snippet: defineSnippet({
      id: 'section-angular-defaults',
      language: 'ts',
      label: 'Four decisions, taken once',
      source: `bootstrapApplication(App, {
  providers: [provideSectionDefaults({ divider: true, size: 'sm' })],
});`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A section with a heading is a region in the landmark list, named by the heading; one without a heading is a plain section, absent from it. Jump to a section by hash and it lands under the page chrome, not behind it.',
    snippet: defineSnippet({
      id: 'section-angular-accessibility',
      language: 'angular',
      label: 'A region, and a hash link to it',
      source: `<a slLink href="#history">Go to history</a>`,
    }),
  },
];

const events: EventRow[] = [];

export const ANGULAR_SECTION_DOCS = {
  section: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slSection, provideSectionDefaults',
        'The step of the heading: the label’s, xs for sm and md and sm for lg; a nested section’s mixed-case heading, sm, md or lg. Independent of its rank',
      ],
      [
        'level',
        "'auto' | '1' | '2' | '3' | '4' | '5' | '6'",
        'auto',
        'slSection',
        'The rank of the heading. auto takes the one typography’s outline gives: 2 directly in a page body, one deeper inside another section. A native heading element keeps its own tag; any other element gets aria-level from this',
      ],
      [
        'divider',
        'boolean',
        'false',
        'slSection, provideSectionDefaults',
        'A rule under the header, for a page where space alone does not separate',
      ],
      [
        'ground',
        "'none' | 'surface'",
        'none',
        'slSection, provideSectionDefaults',
        'none is transparent; surface paints the raised surface with a subtle edge and the large radius — no shadow, no hover, no action, because a section is not a card',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'slSection, provideSectionDefaults',
        'The header stays under the page chrome while the body scrolls, painted in the page’s ground. Without a page it sticks to the top of whatever scrolls. A region inside a page that paints a ground of its own declares --slotted-page-ground with that ground, so a sticky header under it matches the region.',
      ],
      [
        'id',
        'attribute',
        'generated',
        'slSection',
        'The identifier a hash link reaches, read with HostAttributeToken. The heading’s own id is derived from it',
      ],
    ]),
    composition: apiRows([
      [
        'slSectionHeading on any element',
        'directive',
        '—',
        'the consumer’s own element',
        'A native heading gets nothing added; a div or a link gets role="heading" and aria-level, so a linked or editable title keeps its rank',
      ],
      [
        'exportAs slSection',
        'SlSection',
        '—',
        'a template reference',
        'The resolved rank, size, ground and the identifiers, as signals',
      ],
      [
        'provideSectionDefaults()',
        '{ size, divider, ground, sticky }',
        '—',
        'an injector',
        'The four decisions an application takes once. A section that states any of them itself still wins',
      ],
      [
        'slHeadingLevel',
        'from @slotted/angular/typography',
        '—',
        'around a subtree',
        'The outline context the section reads. The body already carries it as a host directive; put it on an element yourself to step the outline elsewhere',
      ],
      [
        'native attributes',
        'on every part',
        '—',
        'every part',
        'Every directive sits on the consumer’s own element, so id, class, routerLink and every listener stay where they were written',
      ],
    ]),
    accessibility: [
      'A description outside slSectionTitle is not styled: the stylesheet reaches it as a child of the title, so slSectionDescription is written inside slSectionTitle and nowhere else.',
      'The practice is the WAI-ARIA APG’s Landmark Regions (w3.org/WAI/ARIA/apg/practices/landmark-regions/): a section element with an accessible name is a region landmark. The root is aria-labelledby its heading once one is rendered, so a section with a heading appears in the landmark list under the heading’s words, and one without a heading is a plain section that clutters nothing.',
      'The rank is real and the element is the consumer’s. Write h2 and the directive adds nothing; write a div or a link and it gets role="heading" and aria-level from the outline typography keeps — 2 directly in a page body, one deeper inside another section’s body — or from level.',
      'The body carries slHeadingLevel as a host directive, which is what keeps a nested section, a collapsible or a table caption at the right rank without either family reading the other. The HTML Standard requires each heading to be at most one deeper than the one before, and stepping by exactly one is the only way to hold that in a tree assembled from components.',
      'The root carries a scroll margin the height of the page chrome, so a hash link to the section lands under the header rather than behind it. The id is the consumer’s or a generated one, and the heading’s id is derived from it, so an anchor-nav family later has both to reach.',
      'Nothing here is interactive. The actions slot holds the consumer’s own controls, in the page tab sequence like any other; the sticky header is CSS and takes no focus.',
    ],
    snippets: [
      defineSnippet({
        id: 'section-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<section
  data-ui="section"
  data-part="root"
  data-size="md"
  data-level="2"
  data-ground="none"
  data-divider
  id="itens"
  aria-labelledby="itens-heading"
>
  <div data-part="header">
    <div data-part="title">
      <span data-part="eyebrow">36 items</span>
      <h2 data-part="heading" id="items-heading">Order items</h2>
      <div data-part="tags">…</div>
      <p data-part="description">…</p>
    </div>
    <div data-part="actions">…</div>
  </div>
  <div data-part="body">…</div>
</section>`,
      }),
      defineSnippet({
        id: 'section-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='section'] {
  --slotted-section-gap: var(--slotted-space-6);
  --slotted-section-spacing: var(--slotted-space-10);
  --slotted-section-heading-size-md: var(--slotted-font-size-sm);
  --slotted-section-surface: var(--slotted-surface);
  --slotted-section-radius: var(--slotted-radius-md);
}`,
      }),
    ],
  },
} as const;
