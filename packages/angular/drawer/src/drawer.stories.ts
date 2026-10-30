import { SlButton } from '@slotted/angular/button';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlTextField } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDrawer } from './drawer';
import type { DrawerMode, DrawerMount, DrawerSide, DrawerSize } from './drawer-defaults';
import {
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerResizer,
  SlDrawerTitle,
  SlDrawerTrigger,
} from './drawer-parts';
import { ANGULAR_DRAWER_DOCS, ANGULAR_DRAWER_TOKENS } from './drawer.docs';

interface DrawerStoryArgs {
  escape: 'close' | 'none';
  loading: boolean;
  modal: boolean;
  mode: DrawerMode;
  mount: DrawerMount;
  outsidePress: 'close' | 'none';
  side: DrawerSide;
  size: DrawerSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DRAWER_DOCS.drawer.scenes, {
    playground: Playground,
    mode: Mode,
    side: Side,
    size: Size,
    resize: Resize,
    snapPoints: SnapPoints,
    sheet: Sheet,
    scrimFrom: ScrimFrom,
    keyboard: Keyboard,
    modal: Modal,
    policy: Policy,
    focus: Focus,
    loading: Loading,
    nested: Nested,
    content: Content,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

export const DRAWER_IMPORTS = [
  SlDrawer,
  SlDrawerTrigger,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerDescription,
  SlDrawerBody,
  SlDrawerFooter,
  SlDrawerClose,
  SlDrawerResizer,
  SlButton,
  SlText,
  SlTextField,
  SlSkeleton,
];

const meta: Meta<DrawerStoryArgs> = {
  title: 'Components/Drawer',
  decorators: [moduleMetadata({ imports: DRAWER_IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Drawer',
        description:
          'A panel that comes in from an edge, and either covers the page or stands beside it. One axis decides which, so a breakpoint can change it without taking the panel’s scroll position and focus with it; one cancellable request covers every way it closes; and the edge a reader drags is a separator a keyboard can move.',
        framework: 'Angular',
        ...ANGULAR_DRAWER_DOCS.drawer,
        tokens: ANGULAR_DRAWER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DrawerStoryArgs>;

/**
 * A box an overlay drawer opens inside, so a demonstration is a panel in a
 * scene rather than a full-page layer over the reference page it documents.
 * `contain: paint` on the primitive is what makes it the containing block for
 * the fixed layer; in an application that containing block is the viewport.
 */
let layers = 0;
/**
 * Each box has its own template reference. Two scenes in one grid are one
 * template, and a shared `#box` resolved every `[container]="box"` to the
 * first: the second scene's drawer opened inside the first scene's box.
 */
const layer = (body: string, size: 'tall' | 'screen' = 'tall') => {
  layers += 1;
  const ref = `box${layers}`;
  return `<div class="slotted-demo-viewport" data-size="${size}" #${ref}>${body.replaceAll(
    '[container]="box"',
    `[container]="${ref}"`,
  )}</div>`;
};

/**
 * The shape an inline drawer lives in: the consumer's own two-track grid. It is
 * written out rather than hidden, because it is what replaces Angular
 * Material's `push` — the page reflows because this grid says so, not because
 * the family wrote a margin on an element it does not own.
 */
const shell = (body: string) =>
  `<div class="slotted-demo-viewport" data-size="tall" data-layout="shell">${body}</div>`;

const scene = (label: string, note: string, body: string, layout = 'block') =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, body: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${body}</div>`;

const page = (
  text = 'No scrim, no portal and no z-index. The content beside it reflows because the consumer grid says so.',
) =>
  `<main>
    <p slText size="sm" tone="muted">${text}</p>
  </main>`;

/**
 * What a demonstration that stands open has to say for itself.
 *
 * A modal layer takes the page over: `dismissable-layer` writes `inert` on
 * every sibling up to the document root and locks the document scroll, and a
 * page carrying fifteen of them at once is a page nobody can scroll or click.
 * The first published version of these stories did exactly that — twenty-one
 * panels open, `body { overflow: hidden }` on a page twenty-three thousand
 * pixels tall, and one press anywhere closing fifteen of them at once, because
 * each read it as a press outside itself.
 *
 * So a scene that exists to be *looked at* is not modal, does not take focus
 * and cannot be dismissed. Nothing here changes the picture: the scrim belongs
 * to the layer rather than to the dismissal policy, so `modal` decides only
 * what happens to the page behind it. A scene that exists to be *operated*
 * keeps its real behaviour and is opened from a trigger, one at a time.
 */
const STILL = '[modal]="false" escape="none" outsidePress="none" [initialFocus]="false"';

const panel = (
  attributes = '',
  {
    body = '<p slText size="sm">A drawer holds a secondary task. The middle row is the one that scrolls.</p>',
    description = 'Issued on August 12, due in 11 days.',
    footer = `<footer slDrawerFooter>
      <button slButton size="sm" variant="ghost" tone="secondary">Cancel</button>
      <button slButton size="sm">Save</button>
    </footer>`,
    resizer = '',
    title = 'Invoice 4471',
  } = {},
) =>
  layer(`<sl-drawer [container]="box" [open]="true" ${STILL} ${attributes}>
    <header slDrawerHeader>
      <h2 slDrawerTitle>${title}</h2>
      ${description === '' ? '' : `<p slDrawerDescription>${description}</p>`}
      <button slDrawerClose></button>
    </header>
    ${body === '' ? '' : `<div slDrawerBody>${body}</div>`}
    ${footer}
    ${resizer}
  </sl-drawer>`);

/**
 * The navigation a product would actually have: real labels, real counts and
 * one awkward row, a queue with nothing in it. The React page has carried it
 * since its inline scenes were rewritten; this page kept three placeholder
 * words and no separator until the reviewer compared the two.
 */
const NAVIGATION = `<p slText size="sm" weight="semibold">Contas a receber</p>
  <p slText size="sm">Overdue · 14</p>
  <p slText size="sm">Due in 7 days · 32</p>
  <p slText size="sm">In reconciliation · 3</p>
  <p slText size="sm" tone="muted">Disputes · none</p>
  <p slText size="sm" tone="muted">Unreconciled automatic write-offs since 09/02</p>`;

/** The invoice the navigation leads to. */
const WORKBENCH = `<main>
  <p slText size="lg" weight="semibold">Invoice 20,483 · Meridian Metalworks LLC</p>
  <p slText size="sm" tone="muted">
    Issued 09/02/2026 · due 10/02/2026 · $18,420.00 · 9 days overdue
  </p>
  <p slText size="sm" tone="muted">
    Drag the edge of the sidebar: the measure it publishes is the same one this layout applies.
  </p>
</main>`;

export const Playground: Story = {
  args: {
    escape: 'close',
    loading: false,
    modal: true,
    mode: 'overlay',
    mount: 'active',
    outsidePress: 'close',
    side: 'end',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: layer(`<button slButton [slDrawerTrigger]="d">Open details</button>
      <sl-drawer
        #d="slDrawer"
        [container]="box"
        [mode]="mode"
        [side]="side"
        [size]="size"
        [mount]="mount"
        [modal]="modal"
        [escape]="escape"
        [outsidePress]="outsidePress"
        [loading]="loading"
      >
        <header slDrawerHeader>
          <h2 slDrawerTitle>Invoice 4471</h2>
          <p slDrawerDescription>Issued on August 12.</p>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <input slTextField aria-label="Note" value="Awaiting reconciliation" />
        </div>
        <footer slDrawerFooter>
          <button slButton size="sm" variant="ghost" tone="secondary">Cancel</button>
          <button slButton size="sm">Save</button>
        </footer>
      </sl-drawer>`),
  }),
};

export const Mode: Story = {
  parameters: scenario('mode'),
  render: () => ({
    template: grid(
      1,
      scene(
        'overlay — a layer over the page',
        'Portalled, fixed to the viewport, with a scrim and the whole dismissal policy. In an application the containing block is the viewport; here it is the dashed box.',
        panel(),
      ) +
        scene(
          'inline — a panel beside it',
          'No portal, no scrim and no z-index: it is a real sidebar, with the separator on the edge and the invoice beside it. The page reflows because the consumer grid says so, which is what replaces the push of Angular Material and the persistent of MUI.',
          shell(
            `<sl-drawer mode="inline" side="start" size="sm" [open]="true" [extent]="0.34">
              <header slDrawerHeader><h2 slDrawerTitle>Receivables</h2></header>
              <nav slDrawerBody aria-label="Accounts">${NAVIGATION}</nav>
              <div slDrawerResizer></div>
            </sl-drawer>` + WORKBENCH,
          ),
        ),
    ),
  }),
};

export const Side: Story = {
  parameters: scenario('side'),
  render: () => ({
    template: grid(
      2,
      scene(
        'end — the default',
        'The edge a detail panel comes from in a left-to-right document, and the other one in a mirrored document. Switch the direction in the toolbar: the whole panel mirrors, including the separator.',
        panel('size="sm"'),
      ) +
        scene(
          'bottom — a sheet',
          'The sheet keeps the two corners the reader can see and puts the separator above the header, which is where a hand looks for it. A side drawer keeps no corners at all: it reads as a wall rather than as a card.',
          panel('side="bottom" size="sm"', {
            description: '',
            resizer: '<div slDrawerResizer></div>',
            title: 'Filter invoices',
          }),
        ),
    ),
  }),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    template: grid(
      2,
      scene(
        'sm — for a summary',
        'Eighteen rems. Wide enough for a definition list and two actions, narrow enough that the page behind it is still legible under the scrim.',
        panel('size="sm"'),
      ) +
        scene(
          'xl — for a form',
          'Forty rems, and a title one step larger to match. The step a two-column form needs; below it the columns stack and the panel reads as one long list of fields.',
          panel('size="xl"', { title: 'Edit billing details' }),
        ),
    ),
  }),
};

export const Resize: Story = {
  parameters: scenario('resize'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A separator, not a prop',
        'The edge is the control, and it can be seen without touching it: two hairlines with the grip in the middle, running the whole channel under the hand. Get there with Tab and use the arrows — sixteen pixels per press, sixty-four with Shift — Home and End go to the limits, Enter collapses and restores, and a double click returns to the size of the size step. The resizer of Ant and the drag of Vaul are pointer-only.',
        shell(
          `<sl-drawer mode="inline" side="start" [open]="true" [extent]="0.32" [minExtent]="0.18">
            <header slDrawerHeader><h2 slDrawerTitle>Receivables</h2></header>
            <nav slDrawerBody aria-label="Accounts">${NAVIGATION}</nav>
            <div slDrawerResizer></div>
          </sl-drawer>` +
            page(
              'The public measure is a fraction of the box the panel is measured in, and it is what becomes aria-valuenow.',
            ),
        ),
      ),
    ),
  }),
};

export const SnapPoints: Story = {
  parameters: scenario('snapPoints'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Three heights, all reachable by keyboard',
        'A snap point is a stop of the same separator, so an arrow moves between them and Home and End reach the first and last. Dragging the edge below the first stop asks to close, carrying pointer.',
        panel('side="bottom" [extent]="0.3" [snapPoints]="[0.3, 0.6, 0.95]"', {
          body: '<p slText size="sm">Drag the edge, or use the arrows: the stops are 30%, 60% and 95%.</p>',
          description: '',
          footer: '',
          resizer: '<div slDrawerResizer></div>',
          title: 'Filtros',
        }),
      ),
    ),
  }),
};

/** Thirty customers, which is more than a phone shows, so the body scrolls. */
const CUSTOMERS = [
  'Acme Logistics · $12,480.00',
  'Beacon Bank · $3,920.50',
  'Cedar House Foods · $845.00',
  'Dover Distribution · $27,300.00',
  'Elm Studio · $1,150.00',
  'Fairview Downtown Pharmacy · $6,712.30',
  'Gateway Printing · $2,004.90',
  'Hilltop Hotel · $18,960.00',
  'Inland Institute · $540.00',
  'Juniper Gardens · $9,870.00',
  'Kestrel Packaging · $31,225.75',
  'Lakeview Labs · $4,380.00',
  'Lighthouse Stores · $7,410.00',
  'Meridian Metalworks · $18,420.00',
  'Native Cosmetics · $2,980.40',
  'Old Mill Bakery · $612.00',
  'Parkway Stationery · $1,845.90',
  'Quarry Chemicals · $22,130.00',
  'Ridgeline Solar Engineering · $48,900.00',
  'Sunrise Supermarket · $11,204.65',
  'Twin Valley Textiles · $5,330.00',
  'Upland Power Plant · $63,750.00',
  'Vista Coastal Lines · $3,118.20',
  'Xander & Sons Attorneys · $9,000.00',
  'Zenith Transport · $14,675.00',
  'Aqua Clear Sanitation · $27,480.00',
  'Breeze Hospitality · $4,190.00',
  'Clearfield Cooperative · $16,320.00',
  'Delta Computing · $2,240.00',
  'Eco Packaging · $8,905.10',
]
  .map((line) => `<p slText size="sm">${line}</p>`)
  .join('');

const FILTERS = `<p slText size="sm">Period: last 30 days</p>
  <p slText size="sm">Status: open, overdue</p>
  <p slText size="sm">Owner: Mary Duncan</p>`;

export const Sheet: Story = {
  parameters: scenario('sheet'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Content height — the default on a block side',
        'Three filters and a footer, and nothing under them. No size is written: on top and bottom the panel measures what it holds, and on a layer wider than forty rems it stops there and stands centred on the scrim.',
        panel('side="bottom"', {
          body: FILTERS,
          description: '',
          resizer: '<div slDrawerResizer></div>',
          title: 'Filter invoices',
        }),
      ) +
        scene(
          'Operate it — touch, fling, tap the grabber',
          "It opens at half the layer; the height of its content is the second stop. Drag the body with a finger, or with touch emulation in the browser's device mode: up grows it to its content before the list scrolls, down with the list at its top moves the sheet, and a fling past 500 px/s goes to the next stop or closes. A mouse drags the grabber, and a click on it walks the two stops.",
          layer(
            `<button slButton [slDrawerTrigger]="sheet">Open customers</button>
            <sl-drawer #sheet="slDrawer" [container]="box" side="bottom" [snapPoints]="[0.5]" [extent]="0.5">
              <div slDrawerResizer></div>
              <header slDrawerHeader>
                <h2 slDrawerTitle>Customers with open invoices</h2>
                <button slDrawerClose></button>
              </header>
              <div slDrawerBody>${CUSTOMERS}</div>
              <footer slDrawerFooter>
                <button slButton size="sm" variant="ghost" tone="secondary">Limpar</button>
                <button slButton size="sm">Aplicar</button>
              </footer>
            </sl-drawer>`,
            'screen',
          ),
        ),
    ),
  }),
};

export const ScrimFrom: Story = {
  parameters: scenario('scrimFrom'),
  render: () => ({
    props: { zone: 'Zona Sul' },
    template: grid(
      1,
      scene(
        'Undimmed up to the middle stop',
        'The sheet rests at a quarter of the layer with the page undimmed: the three zone buttons still answer. Tap the grabber, or press the arrows on it, to climb to sixty and ninety-five per cent — the scrim fades in from the middle stop, and a press on it no longer reaches the page.',
        layer(
          `<div class="slotted-demo-stack">
            <p slText size="sm" tone="muted">Selected region: {{ zone }}</p>
            <div class="slotted-demo-row">
              <button slButton size="sm" variant="outline" (click)="zone = 'North Zone'">North Zone</button>
              <button slButton size="sm" variant="outline" (click)="zone = 'Centro'">Centro</button>
              <button slButton size="sm" variant="outline" (click)="zone = 'Zona Sul'">Zona Sul</button>
            </div>
          </div>
          <sl-drawer
            [container]="box"
            [open]="true"
            [modal]="false"
            escape="none"
            outsidePress="none"
            [initialFocus]="false"
            side="bottom"
            [extent]="0.25"
            [snapPoints]="[0.25, 0.6, 0.95]"
            [scrimFrom]="0.6"
          >
            <div slDrawerResizer></div>
            <header slDrawerHeader><h2 slDrawerTitle>Deliveries in the region</h2></header>
            <div slDrawerBody>${CUSTOMERS}</div>
          </sl-drawer>`,
          'screen',
        ),
      ),
    ),
  }),
};

/**
 * The keyboard a desktop screen does not have. The button writes the property
 * the binding writes from `visualViewport`, on the box the layer is portalled
 * into; the layer inherits it.
 */
export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { keyboard: false },
    template: grid(
      1,
      scene(
        'The sheet recedes by what the keyboard covers',
        'On a phone, focus the field: the layer reads the band the keyboard covers from the visual viewport and the sheet lands above the keys, footer included. On this screen the button writes the same 260 pixels the binding would.',
        `<div class="slotted-demo-stack">
          <button
            slButton
            size="sm"
            variant="outline"
            (click)="keyboard = !keyboard; keyboard ? keyboardBox.style.setProperty('--slotted-keyboard-inset', '260px') : keyboardBox.style.removeProperty('--slotted-keyboard-inset')"
          >
            {{ keyboard ? 'Esconder o teclado simulado' : 'Simular um teclado de 260 px' }}
          </button>
          <div class="slotted-demo-viewport" data-size="screen" #keyboardBox>
            <sl-drawer [container]="keyboardBox" [open]="true" ${STILL} side="bottom">
              <header slDrawerHeader>
                <h2 slDrawerTitle>Send reminder</h2>
                <button slDrawerClose></button>
              </header>
              <div slDrawerBody>
                <input slTextField aria-label="Note for the customer" value="Payment due Friday" />
              </div>
              <footer slDrawerFooter>
                <button slButton size="sm" variant="ghost" tone="secondary">Cancel</button>
                <button slButton size="sm">Save</button>
              </footer>
            </sl-drawer>
          </div>
        </div>`,
      ),
    ),
  }),
};

export const Modal: Story = {
  parameters: scenario('modal'),
  render: () => ({
    template: grid(
      2,
      scene(
        'modal — the page is out of reach',
        'Press Open: the scroll locks, everything outside the layer goes inert, and Tab wraps inside the panel. It is opened from a trigger because a modal layer takes the whole page over, and a page showing several at once would be lying about what one does.',
        layer(`<button slButton [slDrawerTrigger]="m">Open modal</button>
          <sl-drawer #m="slDrawer" [container]="box" size="sm">
            <header slDrawerHeader>
              <h2 slDrawerTitle>Modal</h2>
              <p slDrawerDescription>Scrolling is locked and the rest of the page is inert.</p>
              <button slDrawerClose></button>
            </header>
          </sl-drawer>`),
      ) +
        scene(
          'modal="false" — and no aria-modal',
          'Nothing is inert, nothing is locked and focus is not contained, so the panel writes no aria-modal. The scrim stays: it belongs to the layer rather than to the dismissal policy, and it is why every still demonstration on this page can be this one.',
          panel('size="sm"', { title: 'Detalhes' }),
        ),
    ),
  }),
};

export const Policy: Story = {
  parameters: scenario('policy'),
  render: () => ({
    props: {
      guard: (request: { cancel(): void; value: boolean }) => request.value || request.cancel(),
    },
    template: grid(
      1,
      scene(
        'One guard, every way out',
        'Press Escape, the ✕ or the scrim: each one asks, and the same handler refuses all three. Angular Material’s disableClose refuses two of them and cannot refuse the third.',
        layer(`<sl-drawer
          [container]="box"
          [open]="true"
          size="sm"
          [modal]="false"
          [initialFocus]="false"
          (openChangeRequest)="guard($event)"
        >
          <header slDrawerHeader>
            <h2 slDrawerTitle>Saving</h2>
            <p slDrawerDescription>Escape, the ✕ and a click outside are all refused.</p>
            <button slDrawerClose></button>
          </header>
          <div slDrawerBody>
            <p slText size="sm">A single guard covers the five ways to close.</p>
          </div>
        </sl-drawer>`),
      ),
    ),
  }),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => ({
    template: grid(
      1,
      scene(
        'An overlay drawer takes focus',
        'Press the trigger: initialFocus names the field rather than the first tabbable element, which here is the close button. Tab wraps inside the panel while it is modal, and Escape gives focus back to the trigger it came from.',
        layer(`<button slButton [slDrawerTrigger]="f">Search invoices</button>
          <sl-drawer #f="slDrawer" [container]="box" size="sm" [initialFocus]="search">
          <header slDrawerHeader>
            <h2 slDrawerTitle>Search invoices</h2>
            <button slDrawerClose></button>
          </header>
          <div slDrawerBody>
            <input #search slTextField aria-label="Buscar" />
          </div>
        </sl-drawer>`),
      ) +
        scene(
          'An inline drawer takes none',
          'Nothing moves when it opens: a sidebar that stole focus every time a breakpoint crossed would be unusable. It still gives focus back when it closes under the reader’s hands.',
          shell(
            `<sl-drawer mode="inline" side="start" size="sm" [open]="true">
              <header slDrawerHeader><h2 slDrawerTitle>Collections</h2></header>
              <div slDrawerBody>
                <button slButton size="sm" variant="ghost">All</button>
              </div>
            </sl-drawer>` +
              page('Angular Material makes the same separation: autoFocus is false in side mode.'),
          ),
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
        'Open before the content arrived',
        'The body carries aria-busy and keeps a floor, so the panel does not jump to size when the data lands. The header, the ✕ and Escape all stay operable.',
        panel('size="sm" [loading]="true"', {
          body: '<sl-skeleton shape="text" /><sl-skeleton shape="text" />',
          description: '',
        }),
      ),
    ),
  }),
};

export const Nested: Story = {
  parameters: scenario('nested'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A drawer opened from a drawer',
        'Escape reaches the topmost layer only, and a layer that refuses stops the request reaching the one beneath. The depth comes from the single stack dismissable-layer keeps, so nothing here states a z-index.',
        panel('', {
          body: `<button slButton size="sm" variant="outline" [slDrawerTrigger]="inner">Ver o item 3</button>
            <sl-drawer #inner="slDrawer" [container]="box" size="sm">
              <header slDrawerHeader>
                <h2 slDrawerTitle>Item 3</h2>
                <button slDrawerClose></button>
              </header>
              <div slDrawerBody>
                <p slText size="sm">Escape closes this one, and leaves the one below open.</p>
              </div>
            </sl-drawer>`,
          description: '',
          footer: '',
          title: 'Order 118',
        }),
      ),
    ),
  }),
};

const LONG = `<p slText size="sm">
  The middle row is the only track that scrolls. Bounded, it scrolls; unbounded, it would push the
  footer off the screen and the reader could not reach the button. MUI and Angular Material deliver
  no layout at all, so this is the default result of following the example of either one. A third
  paragraph, so there is something to scroll. And a fourth, which is already below the fold.
</p>`;

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A string the family did not choose',
        'A token of ninety characters with no spaces breaks instead of widening the panel: the minimum size is zero and the break is allowed at any point.',
        panel('size="sm"', {
          description: '',
          footer: '',
          title: 'consolidated-bank-reconciliation-report-2026-08.csv',
        }),
      ) +
        scene(
          'A body longer than the layer',
          'The header and the actions hold still while the middle row moves. This is the whole reason the panel is a three-row grid bounded to the layer.',
          panel('size="sm"', { body: LONG, description: '', title: 'Termos de uso' }),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The trigger is the library’s button',
        'The directive goes on the consumer’s own element, so it carries aria-expanded, aria-controls, aria-haspopup and the id without anything being wrapped.',
        layer(`<button slButton variant="outline" tone="secondary" [slDrawerTrigger]="d">
            Open details
          </button>
          <sl-drawer #d="slDrawer" [container]="box" size="sm">
            <header slDrawerHeader>
              <h2 slDrawerTitle>Invoice 4471</h2>
              <button slDrawerClose></button>
            </header>
            <div slDrawerBody>
              <p slText size="sm">The trigger is the library button, with the wiring on top.</p>
            </div>
          </sl-drawer>`),
      ) +
        scene(
          'The panel’s content is the consumer’s landmark',
          'An inline drawer writes no role, because a navigation drawer is a navigation landmark and a filter panel is complementary. The projected element is where the consumer says which.',
          shell(
            `<sl-drawer mode="inline" side="start" size="sm" [open]="true">
              <header slDrawerHeader><h2 slDrawerTitle>Sections</h2></header>
              <nav slDrawerBody aria-label="Sections">
                <p slText size="sm">Summary</p>
                <p slText size="sm">History</p>
              </nav>
            </sl-drawer>` + page('The body here is a nav, not a div with a role.'),
          ),
        ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => ({
    template: grid(
      2,
      scene(
        'What the provider decides',
        'side, size, mode, mount, modal, escape and outsidePress, set once for an injector instead of repeated on every drawer in a product.',
        panel('side="start" size="sm"', { description: '' }),
      ) +
        scene(
          'What the consumer decides anyway',
          'An explicit value always wins over a provider, over inference and over derived state — the same rule every family in the library follows.',
          panel('side="end" size="md"', { description: '' }),
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      1,
      scene(
        'What the title is wired to',
        'It names the panel through aria-labelledby and it names the separator too, which is the Window Splitter pattern’s own rule: a separator is named for the pane it sizes.',
        shell(
          `<sl-drawer mode="inline" side="start" [open]="true" [extent]="0.35">
            <header slDrawerHeader><h2 slDrawerTitle>Collections</h2></header>
            <div slDrawerBody>
              <p slText size="sm">
                The separator announces the name of the panel, the orientation and the measure from 0 to 100.
              </p>
            </div>
            <div slDrawerResizer></div>
          </sl-drawer>` +
            page(
              'Closed, the panel receives inert: the collapse the eye reads and the focus order agree.',
            ),
        ),
      ),
    ),
  }),
};
