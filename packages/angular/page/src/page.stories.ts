import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideClipboardList } from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderControls,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderPin,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlPageHeaderToggle,
  SlPageHeaderVisual,
} from '@slotted/angular/page-header';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionDescription,
  SlSectionEyebrow,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';
import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlPage, SlPageBody, SlPageFooter } from './page';
import type { PageGround, PageInset, PageLandmark, PageScroll, PageWidth } from './page-defaults';
import { providePageDefaults } from './page-defaults';
import { ANGULAR_PAGE_DOCS, ANGULAR_PAGE_TOKENS } from './page.docs';

/* ── The order, again ─────────────────────────────────────────────────────── */

const MONEY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const KINDS = [
  ['Radial tire 295/80 R22.5 Michelin X Multi Z', 'Tire 295/80 R22.5', 2980],
  ['Radial tire 275/80 R22.5 Bridgestone R268', 'Tire 275/80 R22.5', 2640],
  ['Inner tube 22.5 Pirelli', 'Tube 22.5', 190],
  ['Tube flap 22.5', 'Flap 22.5', 85],
  ['Cold retreading service', 'Cold retread', 1240],
  ['Alignment and balancing, axle', 'Alignment, axle', 320],
] as const;
const LINES = Array.from({ length: 36 }, (_, index) => {
  const [description, short, unit] = KINDS[index % KINDS.length] as (typeof KINDS)[number];
  return {
    code: `SKU-${String(7891234 + index * 17).padStart(7, '0')}`,
    description,
    short,
    quantity: 4 + ((index * 7) % 20),
    unit: MONEY.format(unit),
  };
});
const HISTORY = [
  ['09/02/2026 09:14', 'Marina Davis', 'Requested approval with three quotes attached.'],
  ['09/03/2026 11:02', 'Charles Prescott', 'Approved the budget within management authority.'],
  ['09/04/2026 16:40', 'Legal', 'Returned with reservations about the price adjustment clause.'],
  ['09/05/2026 10:21', 'Marina Davis', 'Resubmitted with the clause corrected by the supplier.'],
  ['09/08/2026 08:55', 'Charles Prescott', 'Approved the corrected version.'],
  ['09/09/2026 14:30', 'Finance', 'Reserved the amount in the cost center budget.'],
  ['09/10/2026 09:00', 'System', 'Awaiting issuance of the purchase order.'],
].map(([when, who, what]) => ({ when, who, what }));
const SUPPLIERS = [
  'Aurora Logistics',
  'Michelin North America',
  'Pirelli Tires',
  'Bridgestone',
  'Goodyear',
  'Continental',
  'Dunlop',
  'Firestone',
  'Yokohama',
  'Hankook',
  'Kumho',
  'Toyo Tires',
];

function HEADER(attributes = '', tabs = false) {
  return `<header slPageHeader ${attributes}>
  <div slPageHeaderTitleArea>
    <div slPageHeaderNav><a slPageHeaderBack href="#orders">Purchase orders</a></div>
    <div slPageHeaderTitleRow>
      <span slPageHeaderVisual><span slAvatar name="Purchase order" shape="square" size="lg" tone="accent"><span slAvatarFallback><ng-icon name="lucideClipboardList"></ng-icon></span></span></span>
      <div slPageHeaderTitle>
        <h1 slPageHeaderHeading>Purchase order PC-2026-004521</h1>
        <span slPageHeaderMarks><span slTag tone="warning" shape="pill" size="sm"><span slTagBody>Under review</span></span></span>
        <p slPageHeaderSubheading>Aurora Logistics Inc. · EIN 12-3456789</p>
      </div>
      <div slPageHeaderActions>
        <button slButton variant="outline">Reprovar</button>
        <button slButton tone="accent">Aprovar</button>
      </div>
    </div>
  </div>
  <div slPageHeaderArea>
    <div slPageHeaderContent>
      <p slPageHeaderDescription>Replenishment of 22.5-inch radial tires for the Tacoma fleet. Delivery expected September 24, 2026, with payment due 45 days after the invoice.</p>
    </div>
  </div>
  <div slPageHeaderControls>
    <button slPageHeaderToggle></button>
    <button slPageHeaderPin></button>
  </div>
  ${tabs ? '' : ''}
</header>`;
}

function TABLE(rows = 'lines', sticky = true, compact = false) {
  /* Two columns for a narrow pane, three for a header held under the page
     chrome (the table is then as wide as its content), four otherwise. One
     return and no local: the Angular compiler evaluates this for a template. */
  return `<div slTable [columns]="${compact ? 2 : sticky ? 3 : 4}" variant="ruled" ${sticky ? 'stickyHeader stickyTo="page"' : ''}>
  <div slTableContent>
    <caption slTableCaption>Order items</caption>
    <thead slTableHead>
      <tr slTableRow>
        ${compact ? '' : '<th slTableColumnHeader>Code</th>'}
        <th slTableColumnHeader>Description</th>
        <th slTableColumnHeader numeric>${compact || sticky ? 'Qty.' : 'Quantity'}</th>
        ${compact || sticky ? '' : '<th slTableColumnHeader numeric>Unit price</th>'}
      </tr>
    </thead>
    <tbody slTableBody>
      @for (line of ${rows}; track line.code) {
        <tr slTableRow [value]="line.code">
          ${compact ? '<th slTableRowHeader>{{ line.short }}</th>' : '<th slTableRowHeader>{{ line.code }}</th>'}
          ${compact ? '' : sticky ? '<td slTableCell>{{ line.short }}</td>' : '<td slTableCell>{{ line.description }}</td>'}
          <td slTableCell numeric>{{ line.quantity }}</td>
          ${compact || sticky ? '' : '<td slTableCell numeric>{{ line.unit }}</td>'}
        </tr>
      }
    </tbody>
  </div>
</div>`;
}

function SECTIONS(sticky = false, ground = 'none', compact = false) {
  return `<section slSection id="itens" ${ground === 'surface' ? 'ground="surface"' : 'divider'} ${sticky ? 'sticky' : ''}>
  <div slSectionHeader>
    <div slSectionTitle>
      <span slSectionEyebrow>36 items</span>
      <h2 slSectionHeading>Order items</h2>
      <p slSectionDescription>Quantities and unit prices per the quote accepted on September 2.</p>
    </div>
    <div slSectionActions>
      <button slButton size="sm" variant="outline">Export</button>
      <button slButton size="sm" tone="accent">Add item</button>
    </div>
  </div>
  <div slSectionBody>${TABLE('lines', sticky, compact)}</div>
</section>
<section slSection id="terms" ${ground === 'surface' ? 'ground="surface"' : 'divider'} ${sticky ? 'sticky' : ''}>
  <div slSectionHeader>
    <div slSectionTitle><h2 slSectionHeading>Commercial terms</h2></div>
    <div slSectionActions><button slButton size="sm" variant="ghost">Edit</button></div>
  </div>
  <div slSectionBody>
    <div slDescriptionList [columns]="2">
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Payment terms</dt>
        <dd slDescriptionListDescription>45 days from invoice</dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Freight</dt>
        <dd slDescriptionListDescription>CIF, paid by the supplier</dd>
      </div>
    </div>
  </div>
</section>
<section slSection id="historico" ${ground === 'surface' ? 'ground="surface"' : 'divider'} ${sticky ? 'sticky' : ''}>
  <div slSectionHeader>
    <div slSectionTitle>
      <span slSectionEyebrow>7 events</span>
      <h2 slSectionHeading>Approval history</h2>
    </div>
  </div>
  <div slSectionBody>
    <div slStack [gap]="4">
      @for (event of history; track event.when) {
        <p slText size="sm"><strong>{{ event.when }} · {{ event.who }}</strong> — {{ event.what }}</p>
      }
    </div>
  </div>
</section>`;
}

function FOOTER(attributes = '') {
  return `<footer slPageFooter ${attributes}>
  <button slButton variant="ghost">Cancel</button>
  <button slButton variant="outline">Save draft</button>
  <button slButton tone="accent">Submit for approval</button>
</footer>`;
}

function viewport(body: string, size = 'screen', scroll = true) {
  return `<div class="slotted-demo-viewport" ${scroll ? 'data-layout="page" data-scroll' : ''} data-size="${size}">${body}</div>`;
}

function screen(
  page = '',
  options: { compact?: boolean; footer?: string | false; sticky?: boolean; ground?: string } = {},
) {
  return viewport(`<main slPage ${page}>
  ${HEADER()}
  <div slPageBody>${SECTIONS(options.sticky === true, options.ground || 'none', options.compact === true)}</div>
  ${options.footer === false ? '' : FOOTER(options.footer || '')}
</main>`);
}

function scene(label: string, note: string, body: string, layout = 'block') {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;
}

function grid(columns: 1 | 2 | 3, scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="${columns}">${scenes}</div>`;
}

const PROPS = { history: HISTORY, lines: LINES };

function POLICY(attributes: string, note: string) {
  return viewport(
    `<main slPage ${attributes}>
  <header slPageHeader level="2" size="sm">
    <div slPageHeaderTitleArea>
      <div slPageHeaderTitleRow>
        <div slPageHeaderTitle>
          <h2 slPageHeaderHeading>Purchasing policy</h2>
          <p slPageHeaderSubheading>${note}</p>
        </div>
        <div slPageHeaderActions><button slButton size="sm" tone="accent">Aceitar</button></div>
      </div>
    </div>
  </header>
  <div slPageBody>
    <div slStack [gap]="5">
      <p slText size="sm">1. Every purchase starts from a requisition approved by the cost center manager, with the description of the good or service, the quantity and the justification for the expense.</p>
      <p slText size="sm">2. Above $50,000.00, three quotes are required and are attached to the file.</p>
      <p slText size="sm">3. Continuing contracts are reviewed annually by the purchasing department.</p>
      <p slText size="sm">4. New suppliers undergo tax, labor and environmental vetting before the first purchase order.</p>
      <p slText size="sm">5. Advances to suppliers require a bank guarantee or a surety bond of equal value.</p>
      <p slText size="sm">6. Any discrepancy between the invoice and the purchase order blocks payment until the responsible buyer resolves it.</p>
    </div>
  </div>
</main>`,
    'tall',
  );
}

/* ── A split view with a selection of its own ──────────────────────────── */

@Component({
  selector: 'sl-page-fill-demo',
  standalone: true,
  imports: [
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPageHeaderTitle,
    SlPageHeaderHeading,
    SlPageHeaderSubheading,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderControls,
    SlPageHeaderToggle,
    SlSection,
    SlSectionHeader,
    SlSectionTitle,
    SlSectionHeading,
    SlSectionDescription,
    SlSectionBody,
    SlStack,
    SlButton,
    SlTable,
    SlTableContent,
    SlTableCaption,
    SlTableHead,
    SlTableBody,
    SlTableRow,
    SlTableColumnHeader,
    SlTableRowHeader,
    SlTableCell,
  ],
  template: viewport(
    `<main slPage fill scroll="self" width="full">
  <header slPageHeader size="sm">
    <div slPageHeaderTitleArea>
      <div slPageHeaderTitleRow>
        <div slPageHeaderTitle>
          <h1 slPageHeaderHeading>Suppliers</h1>
          <p slPageHeaderSubheading>312 active · 8 in vetting</p>
        </div>
        <div slPageHeaderActions><button slButton size="sm" tone="accent">New supplier</button></div>
      </div>
    </div>
    <div slPageHeaderArea>
      <div slPageHeaderContent>
        <p slPageHeaderDescription>Suppliers approved for the fleet, with the current contract and the latest performance review.</p>
      </div>
    </div>
    <div slPageHeaderControls><button slPageHeaderToggle></button></div>
  </header>
  <div slPageBody>
    <div class="slotted-demo-split">
      <div class="slotted-demo-split__pane">
        <div slStack [gap]="2">
          @for (supplier of suppliers; track supplier; let i = $index) {
            <button slButton size="sm" [variant]="i === selected() ? 'outline' : 'ghost'" (click)="selected.set(i)">{{ supplier }}</button>
          }
        </div>
      </div>
      <div class="slotted-demo-split__pane">
        <section slSection level="2">
          <div slSectionHeader>
            <div slSectionTitle>
              <h2 slSectionHeading>{{ suppliers[selected()] }}</h2>
              <p slSectionDescription>Contract in force until 09/30/2028 · rating 4.6 of 5.</p>
            </div>
          </div>
          <div slSectionBody>${TABLE('lines', false, true)}</div>
        </section>
      </div>
    </div>
  </div>
</main>`,
    'screen',
    false,
  ),
})
class FillDemo {
  readonly suppliers = SUPPLIERS;
  readonly selected = signal(0);
  readonly lines = LINES.slice(0, 18);
}

/* ── A footer that comes with the first change ─────────────────────────── */

@Component({
  selector: 'sl-page-footer-demo',
  standalone: true,
  imports: [
    SlPage,
    SlPageBody,
    SlPageFooter,
    SlPageHeader,
    SlPageHeaderTitleArea,
    SlPageHeaderNav,
    SlPageHeaderBack,
    SlPageHeaderTitleRow,
    SlPageHeaderVisual,
    SlPageHeaderTitle,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderSubheading,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderControls,
    SlPageHeaderToggle,
    SlPageHeaderPin,
    SlSection,
    SlSectionHeader,
    SlSectionTitle,
    SlSectionEyebrow,
    SlSectionHeading,
    SlSectionDescription,
    SlSectionActions,
    SlSectionBody,
    SlStack,
    SlText,
    SlButton,
    SlAvatar,
    SlAvatarFallback,
    NgIcon,
    SlTag,
    SlTagBody,
    SlTable,
    SlTableContent,
    SlTableCaption,
    SlTableHead,
    SlTableBody,
    SlTableRow,
    SlTableColumnHeader,
    SlTableRowHeader,
    SlTableCell,
    SlDescriptionList,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDescriptionListDescription,
  ],
  template: `<div slStack [gap]="4">
    <button slButton size="sm" variant="outline" (click)="dirty.set(!dirty())">
      {{ dirty() ? 'Marcar como guardado' : 'Alterar algo' }}
    </button>
    ${viewport(`<main slPage>
  ${HEADER()}
  <div slPageBody>${SECTIONS()}</div>
  <footer slPageFooter [open]="dirty()">
    <button slButton variant="ghost" (click)="dirty.set(false)">Discard</button>
    <button slButton tone="accent" (click)="dirty.set(false)">Save changes</button>
  </footer>
</main>`)}
  </div>`,
})
class FooterDemo {
  readonly dirty = signal(true);
  readonly history = HISTORY;
  readonly lines = LINES;
}

/* ── A page still loading ──────────────────────────────────────────────── */

@Component({
  selector: 'sl-page-loading-demo',
  standalone: true,
  imports: [
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderTitleArea,
    SlPageHeaderNav,
    SlPageHeaderBack,
    SlPageHeaderTitleRow,
    SlPageHeaderVisual,
    SlPageHeaderTitle,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderSubheading,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderControls,
    SlPageHeaderToggle,
    SlPageHeaderPin,
    SlSection,
    SlSectionHeader,
    SlSectionTitle,
    SlSectionEyebrow,
    SlSectionHeading,
    SlSectionDescription,
    SlSectionActions,
    SlSectionBody,
    SlStack,
    SlText,
    SlButton,
    SlAvatar,
    SlAvatarFallback,
    NgIcon,
    SlTag,
    SlTagBody,
    SlTable,
    SlTableContent,
    SlTableCaption,
    SlTableHead,
    SlTableBody,
    SlTableRow,
    SlTableColumnHeader,
    SlTableRowHeader,
    SlTableCell,
    SlDescriptionList,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDescriptionListDescription,
  ],
  template: `<div slStack [gap]="4">
    <button slButton size="sm" variant="outline" (click)="reload()">Load again</button>
    ${viewport(`<main slPage [loading]="loading()">
  ${HEADER('[loading]="loading()"')}
  <div slPageBody>
    @if (loading()) {
      <p slText size="sm" tone="muted">Loading the order…</p>
    } @else {
      ${SECTIONS()}
    }
  </div>
</main>`)}
  </div>`,
})
class LoadingDemo {
  readonly loading = signal(true);
  readonly history = HISTORY;
  readonly lines = LINES;
  reload() {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 1800);
  }
}

interface PageStoryArgs {
  fill: boolean;
  ground: PageGround;
  inset: PageInset;
  landmark: PageLandmark;
  loading: boolean;
  scroll: PageScroll;
  width: PageWidth;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_PAGE_DOCS.page.scenes, {
    playground: Playground,
    width: Width,
    scroll: Scroll,
    fill: Fill,
    ground: Ground,
    footer: Footer,
    loading: Loading,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<PageStoryArgs> = {
  title: 'Components/Page',
  decorators: [
    moduleMetadata({
      imports: [
        SlPage,
        SlPageBody,
        SlPageFooter,
        SlPageHeader,
        SlPageHeaderTitleArea,
        SlPageHeaderNav,
        SlPageHeaderBack,
        SlPageHeaderTitleRow,
        SlPageHeaderVisual,
        SlPageHeaderTitle,
        SlPageHeaderHeading,
        SlPageHeaderMarks,
        SlPageHeaderSubheading,
        SlPageHeaderActions,
        SlPageHeaderArea,
        SlPageHeaderContent,
        SlPageHeaderDescription,
        SlPageHeaderControls,
        SlPageHeaderToggle,
        SlPageHeaderPin,
        SlSection,
        SlSectionHeader,
        SlSectionTitle,
        SlSectionEyebrow,
        SlSectionHeading,
        SlSectionDescription,
        SlSectionActions,
        SlSectionBody,
        SlAvatar,
        SlAvatarFallback,
        NgIcon,
        SlTag,
        SlTagBody,
        SlButton,
        SlDescriptionList,
        SlDescriptionListItem,
        SlDescriptionListTerm,
        SlDescriptionListDescription,
        SlTable,
        SlTableContent,
        SlTableCaption,
        SlTableHead,
        SlTableBody,
        SlTableRow,
        SlTableColumnHeader,
        SlTableRowHeader,
        SlTableCell,
        SlStack,
        SlText,
        FillDemo,
        FooterDemo,
        LoadingDemo,
      ],
      providers: [provideIcons({ lucideClipboardList })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Page',
        description:
          'The column of a screen: who scrolls, how wide the content is, where the footer stays, how much air the body has. The header is a direct child of what scrolls, the footer is projected outside it, and the outline steps once for the body.',
        framework: 'Angular',
        ...ANGULAR_PAGE_DOCS.page,
        tokens: ANGULAR_PAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<PageStoryArgs>;

export const Playground: Story = {
  args: {
    fill: false,
    ground: 'sunken',
    inset: 6,
    landmark: 'main',
    loading: false,
    scroll: 'ancestor',
    width: 'wide',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...PROPS, ...args },
    template: screen(
      '[width]="width" [inset]="inset" [scroll]="scroll" [ground]="ground" [fill]="fill" [loading]="loading" [landmark]="landmark"',
    ),
  }),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => ({
    template: grid(
      1,
      scene(
        'measure',
        'Sixty-five characters: the width a paragraph is read at. The header’s rows and the body share the column, so the title starts exactly over the first line of prose.',
        POLICY('width="measure"', 'measure — 65ch'),
      ) +
        scene(
          'content',
          'Fifty-six rems, the width of a form or a document page. The default inset is six steps of the space scale; [inset]="4" tightens it for a pane.',
          POLICY('width="content" [inset]="4"', 'content — 56rem, inset 4'),
        ) +
        scene(
          'wide, the default',
          'Eighty rems, the width of an application screen with a table in it. Beyond it the column centres and the gutters grow.',
          POLICY('width="wide"', 'wide — 80rem'),
        ) +
        scene(
          'full',
          'The space the frame gives, up to --slotted-container-full — 120rem, a 1920-pixel display. Past it the column centres, so an ultra-wide screen does not stretch a line of text across three thousand pixels.',
          POLICY('width="full"', 'full — 120rem'),
        ) +
        scene(
          'bleed',
          'No maximum, only the gutters: a table that needs every pixel, a canvas, a board. Asked for by name, because full is what a person types without thinking.',
          POLICY('width="bleed"', 'bleed — no maximum'),
        ),
    ),
  }),
};

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'scroll="ancestor", the default',
        'The page lives inside the box that scrolls, as inside a shell’s content column, and is at least as tall as it. The footer sticks to the bottom of the page; scroll to the end and the last row meets it.',
        screen('scroll="ancestor"', { compact: true }),
      ) +
        scene(
          'scroll="self"',
          'The page is the scroller: its scroll part scrolls and the footer sits below it in the flow, outside the scroller. The header collapses against the scroll part instead of the box around it.',
          viewport(
            `<main slPage scroll="self">${HEADER()}<div slPageBody>${SECTIONS(false, 'none', true)}</div>${FOOTER()}</main>`,
            'screen',
            false,
          ),
        ),
    ),
  }),
};

export const Fill: Story = {
  parameters: scenario('fill'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Two panes that scroll themselves',
        'fill makes the body exactly the height that is left; the list and the detail inside it scroll on their own. Nothing scrolls outside them, so a pane scrolling down past 16 pixels snaps the header’s area shut and back at its top opens it again; the chevron still folds it. Below 600 pixels fill does not apply and the page scrolls.',
        '<sl-page-fill-demo />',
      ),
    ),
  }),
};

export const Ground: Story = {
  parameters: scenario('ground'),
  render: () => ({
    props: PROPS,
    template: grid(
      2,
      scene(
        'sunken, the default',
        'The canvas of an application. Sections on a surface separate from it, the header paints the surface, and the footer too.',
        screen('ground="sunken"', { compact: true, ground: 'surface' }),
      ) +
        scene(
          'surface',
          'A document page: the content is the page, the header and the footer are the same white, and a rule under each section header is what separates.',
          screen('ground="surface"', { compact: true }),
        ),
    ),
  }),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A bar that comes with the first change and leaves with the save',
        'Press the button above the screen, or one in the bar: open slides the footer out, hides it once it has left, and the property the table’s summary reads returns to nought. It is in the flow, so scroll to the end and see the last row stop above it.',
        '<sl-page-footer-demo />',
      ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The body is busy',
        'aria-busy on the body, data-loading on the root, the cursor saying progress over the body. The header stands its skeleton text; what stands in the body is the consumer’s, because each family draws its own placeholder.',
        '<sl-page-loading-demo />',
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'The whole order',
        'Header, sticky section headers, a table whose column header stops under the page chrome, the footer at the bottom. Scroll it end to end; pin the header and watch every sticky thing stop lower.',
        screen('', { sticky: true }),
      ) +
        scene(
          'A page that is not the document’s main',
          'The same family on a div with landmark="none" and scroll="self", inside a pane of its own: it scrolls inside the pane, its header collapsing against that box, while the document keeps its one main.',
          viewport(
            `<div slPage landmark="none" scroll="self" width="content" [inset]="4">
  ${HEADER('level="2" size="sm"')}
  <div slPageBody>${SECTIONS()}</div>
  ${FOOTER()}
</div>`,
            'screen',
            false,
          ),
        ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  decorators: [
    moduleMetadata({
      providers: [
        providePageDefaults({
          ground: 'surface',
          width: 'content',
        }),
      ],
    }),
  ],
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Five decisions an application takes once',
        'providePageDefaults carries width, inset, scroll, ground and landmark for every page under it — here a document application, on an article. A page that states any of them itself still wins, and its messages name the footer.',
        viewport(`<article slPage [messages]="{ footer: 'Decisions' }">
  ${HEADER()}
  <div slPageBody>${SECTIONS()}</div>
  <footer slPageFooter>
    <button slButton variant="ghost">Discard</button>
    <button slButton tone="accent">Save</button>
  </footer>
</article>`),
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'One main, named regions, an outline without a skip',
        'Open the screen reader’s landmark list: main, then the regions the sections make, then the footer named by the catalog — “Page actions” in English. Open the heading list: h1 for the order, h2 for each section, h3 for what is inside.',
        screen(),
      ),
    ),
  }),
};
