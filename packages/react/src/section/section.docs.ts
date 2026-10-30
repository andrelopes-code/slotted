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

export const REACT_SECTION_TOKENS = sectionTokens.map((name) => ({
  name,
  purpose:
    name === '--slotted-page-ground'
      ? 'The ground a sticky header paints, published by the page. A region inside a page that paints a ground of its own declares it with that ground, so a sticky header under it matches the region.'
      : 'Theme-owned Section decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Section, SectionHeader, SectionTitle, SectionEyebrow, SectionHeading, SectionTags, SectionDescription, SectionActions, SectionBody, SectionDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section, or the element render returns',
    required: true,
    purpose:
      'The unit, carrying data-ui="section", the five axes, an id a hash link can reach and a scroll margin the height of the page chrome. aria-labelledby its heading once one is rendered, which makes it a region.',
  },
  {
    part: 'header',
    parent: 'root',
    element: 'div',
    required: false,
    purpose:
      'The row above the body: the heading, its tags and the actions on one baseline, the eyebrow above and the description below on rows of their own. Sticky under the page chrome when sticky is set, painted in the page’s ground so what scrolls under it is covered; it carries data-stuck while content passes under it, and its ground is --slotted-section-header-background, which defaults to the page’s; its height is measured and added to the sticky top the body publishes, so a table’s column header or a nested section inside stops under it, not under the page.',
  },
  {
    part: 'title',
    parent: 'header',
    element: 'div',
    required: false,
    purpose:
      'Eyebrow, heading, tags and description, in that order, laid out on the header’s rows, so the actions align with the heading and not with the top of an eyebrow.',
  },
  {
    part: 'eyebrow',
    parent: 'title',
    element: 'span',
    required: false,
    purpose:
      'A short overline above the heading in small capitals — a count, a category. Structural rather than status: status is a tag.',
  },
  {
    part: 'heading',
    parent: 'title',
    element: 'h1 to h6, from the outline or level, or the element render returns',
    required: false,
    purpose:
      'The heading at the rank the section resolved. Rendering it is what names the region; render keeps the rank through aria-level when the element is not a heading.',
  },
  {
    part: 'tags',
    parent: 'title',
    element: 'div',
    required: false,
    purpose:
      'Badges or tags beside the heading — a count, a status — aligned on the heading’s baseline. Outside the heading, so they are not read into the region’s name. They never leave the heading’s row: a long heading wraps its words and the badges stack beside it.',
  },
  {
    part: 'description',
    parent: 'title',
    element: 'p',
    required: false,
    purpose:
      'A paragraph under the heading, in the muted text, with a measure of seventy characters.',
  },
  {
    part: 'actions',
    parent: 'header',
    element: 'div',
    required: false,
    purpose:
      'The end of the heading’s row, on its baseline: a Button, a Toolbar, a Link. On a header narrower than 20rem it takes a row of its own at the end.',
  },
  {
    part: 'body',
    parent: 'root',
    element: 'div',
    required: true,
    purpose:
      'The content, wrapped one HeadingLevel deeper, so a section inside it takes the next rank without being told.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One section of a purchase order with every axis on it, driven by the controls below the canvas. It sits inside a page, so its rank is h2 and its sticky header stops under the page chrome.',
    snippet: defineSnippet({
      id: 'section-react-playground',
      language: 'tsx',
      label: 'A section inside a page body',
      source: `<Section>
  <SectionHeader>
    <SectionTitle>
      <SectionHeading>Order items</SectionHeading>
    </SectionTitle>
  </SectionHeader>
  <SectionBody>…</SectionBody>
</Section>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The eyebrow with the count, the heading with a status tag beside it, the description under it, an action at the end of the heading’s row, and the body with the table. The section is a region named by its heading.',
    snippet: defineSnippet({
      id: 'section-react-anatomy',
      language: 'tsx',
      label: 'The nine parts',
      source: `<Section divider id="itens">
  <SectionHeader>
    <SectionTitle>
      <SectionEyebrow>36 items</SectionEyebrow>
      <SectionHeading>Order items</SectionHeading>
      <SectionTags>
        <Badge size="sm" tone="warning">
          Pending
        </Badge>
      </SectionTags>
      <SectionDescription>Quantities per the accepted quote.</SectionDescription>
    </SectionTitle>
    <SectionActions>
      <Button size="sm" variant="outline">
        Exportar
      </Button>
    </SectionActions>
  </SectionHeader>
  <SectionBody>
    <Table>…</Table>
  </SectionBody>
</Section>;`,
    }),
  },
  {
    id: 'level',
    title: 'The rank is the outline’s',
    note: 'Three sections nested: h2 directly in the page, h3 inside it, h4 inside that — none of them told. level="5" on the last one overrides the outline and typography warns in development about a skip.',
    snippet: defineSnippet({
      id: 'section-react-level',
      language: 'tsx',
      label: 'Nothing to write, and one override',
      source: `<Section>
  <SectionHeading>Frota</SectionHeading>
  <SectionBody>
    <Section>
      <SectionHeading>Heavy vehicles</SectionHeading>
    </Section>
  </SectionBody>
</Section>;`,
    }),
  },
  {
    id: 'size',
    title: 'The step the label sits at',
    note: 'The heading is a label in tracked small capitals: xs for sm and md, sm for lg. A section nested in another sets its heading in mixed case and the muted tone, on sm, md or lg for its own size. The step says nothing about the rank.',
    snippet: defineSnippet({
      id: 'section-react-size',
      language: 'tsx',
      label: 'Size and rank, apart',
      source: `<Section level="3" size="lg">
  …
</Section>;`,
    }),
  },
  {
    id: 'separation',
    title: 'Space, a rule, or a surface',
    note: 'Three sections on the page’s sunken canvas: separated by the family’s own spacing and the label alone, by a divider under the header, and by a surface with an edge and a radius — no shadow, no hover, because a section is not a card.',
    snippet: defineSnippet({
      id: 'section-react-separation',
      language: 'tsx',
      label: 'A surface, not a card',
      source: `<Section ground="surface">…</Section>;`,
    }),
  },
  {
    id: 'sticky',
    title: 'A header that stays',
    note: 'Scroll the screen: each section’s header stops under the page chrome and the next one pushes it away. Pin the page header and they all stop lower, because the page publishes where its chrome ends. A sticky section republishes it for its body as page plus header, so layers add up: a section in a section, a table in that.',
    snippet: defineSnippet({
      id: 'section-react-sticky',
      language: 'tsx',
      label: 'Under whatever the page keeps at the top',
      source: `<Section sticky>…</Section>;`,
    }),
  },
  {
    id: 'nested',
    title: 'A section inside a section',
    note: 'The fleet, its heavy vehicles, the tractors: three depths, three ranks. The outer heading is a label in small capitals; the inner ones are mixed case in the muted tone, the level read in case, size and tone. Every other rule reaches its part with a child combinator, so the outer header styles nothing else of the inner one.',
    snippet: defineSnippet({
      id: 'section-react-nested',
      language: 'tsx',
      label: 'Three depths',
      source: `<Section size="lg">
  <SectionHeading>Frota</SectionHeading>
  <SectionBody>
    <Section>
      <SectionHeading>Heavy vehicles</SectionHeading>
      <SectionBody>
        <Section size="sm">
          <SectionHeading>Tractor units</SectionHeading>
        </Section>
      </SectionBody>
    </Section>
  </SectionBody>
</Section>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A nine-word heading wraps, a long eyebrow wraps in small capitals, a translated description keeps its measure, and a header with no actions leaves no vacancy at the end of the row.',
    snippet: defineSnippet({
      id: 'section-react-content',
      language: 'tsx',
      label: 'A heading the row cannot hold',
      source: `<SectionHeading>
  Approval, warranty, retreading, and environmentally appropriate disposal requirements for the
  tires supplied
</SectionHeading>;`,
    }),
  },
  {
    id: 'composition',
    title: 'A section with a table, a list and a form in it',
    note: 'The body holds other families and steps the outline for them: the table’s caption, the collapsible’s header and the form’s legend all sit one rank under the section. Scroll and the sticky header stays over all of it.',
    snippet: defineSnippet({
      id: 'section-react-composition',
      language: 'tsx',
      label: 'What a body holds',
      source: `<SectionBody>
  <Table stickyHeader stickyTo="page">
    …
  </Table>
</SectionBody>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries size, divider, ground and sticky for every section under it; render turns the heading into a link while the family keeps the rank and the identifier; a hash link reaches the root by its id.',
    snippet: defineSnippet({
      id: 'section-react-defaults',
      language: 'tsx',
      label: 'Four decisions, taken once',
      source: `<SectionDefaultsProvider divider size="sm">
  <Section>…</Section>
</SectionDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A section with a heading is a region in the landmark list, named by the heading; one without a heading is a plain section, absent from it. Jump to a section by hash and it lands under the page chrome, not behind it.',
    snippet: defineSnippet({
      id: 'section-react-accessibility',
      language: 'tsx',
      label: 'A region, and a hash link to it',
      source: `<a href="#history">Go to history</a>;`,
    }),
  },
];

const events: EventRow[] = [];

export const REACT_SECTION_DOCS = {
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
        'Section, SectionDefaultsProvider',
        'The step of the heading: the label’s, xs for sm and md and sm for lg; a nested section’s mixed-case heading, sm, md or lg. Independent of its rank',
      ],
      [
        'level',
        "'auto' | '1' | '2' | '3' | '4' | '5' | '6'",
        'auto',
        'Section',
        'The rank of the heading. auto takes the one typography’s outline gives: h2 directly in a page, one deeper inside another section',
      ],
      [
        'divider',
        'boolean',
        'false',
        'Section, SectionDefaultsProvider',
        'A rule under the header, for a page where space alone does not separate',
      ],
      [
        'ground',
        "'none' | 'surface'",
        'none',
        'Section, SectionDefaultsProvider',
        'none is transparent; surface paints the raised surface with a subtle edge and the large radius — no shadow, no hover, no action, because a section is not a card',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'Section, SectionDefaultsProvider',
        'The header stays under the page chrome while the body scrolls, painted in the page’s ground. Without a page it sticks to the top of whatever scrolls. A region inside a page that paints a ground of its own declares --slotted-page-ground with that ground, so a sticky header under it matches the region.',
      ],
      [
        'id',
        'string',
        'from useId',
        'Section',
        'The identifier a hash link reaches. The heading’s own id is derived from it',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the element and hands it every attribute. A heading rendered into another element keeps its rank through role="heading" and aria-level',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the element itself; no imperative handle is invented for a family with no state',
      ],
      [
        'useSection()',
        '() => SectionContextValue',
        '—',
        'inside Section',
        'What the parts read: the rank, the heading’s identifier, and registerHeading, which is how the root learns it has a name',
      ],
      [
        'SectionDefaultsProvider',
        '{ size, divider, ground, sticky }',
        '—',
        'a subtree',
        'The four decisions an application takes once. A section that states any of them itself still wins',
      ],
      [
        'HeadingLevel',
        'from @slotted/react/typography',
        '—',
        'around a subtree',
        'The outline context the section reads. The body is already one step deeper; wrap a subtree in it to step the outline yourself',
      ],
    ]),
    accessibility: [
      'A description outside SectionTitle is not styled: the stylesheet reaches it as a child of the title, so SectionDescription is written inside SectionTitle and nowhere else.',
      'The practice is the WAI-ARIA APG’s Landmark Regions (w3.org/WAI/ARIA/apg/practices/landmark-regions/): a section element with an accessible name is a region landmark. The root is aria-labelledby its heading once one is rendered, so a section with a heading appears in the landmark list under the heading’s words, and one without a heading is a plain section that clutters nothing.',
      'The rank is real. The heading renders h1 to h6 from the outline typography keeps — h2 directly in a page body, one deeper inside another section’s body — and level overrides it. A heading rendered into another element through render carries role="heading" and aria-level, so the outline survives an editable or linked title.',
      'The body is one HeadingLevel deeper, which is what keeps a nested section, a collapsible or a table caption at the right rank without either family reading the other. The HTML Standard requires each heading to be at most one deeper than the one before, and stepping by exactly one is the only way to hold that in a tree assembled from components.',
      'The root carries a scroll margin the height of the page chrome, so a hash link to the section lands under the header rather than behind it. The id comes from useId or the consumer, and the heading’s id is derived from it, so an anchor-nav family later has both to reach.',
      'Nothing here is interactive. The actions slot holds the consumer’s own controls, in the page tab sequence like any other; the sticky header is CSS and takes no focus.',
    ],
    snippets: [
      defineSnippet({
        id: 'section-react-dom',
        language: 'tsx',
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
      <h2 data-part="heading" id="items-heading">
        Order items
      </h2>
      <div data-part="tags">…</div>
      <p data-part="description">…</p>
    </div>
    <div data-part="actions">…</div>
  </div>
  <div data-part="body">…</div>
</section>;`,
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
