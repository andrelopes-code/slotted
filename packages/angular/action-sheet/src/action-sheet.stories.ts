import { signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideBell,
  lucideCircleCheck,
  lucideCopy,
  lucideExternalLink,
  lucideFileSpreadsheet,
  lucideFileText,
  lucideTrash2,
  lucideUpload,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { SlButton } from '@slotted/angular/button';
import { SlMenu, SlMenuItem, SlMenuItemDescription, SlMenuTrigger } from '@slotted/angular/menu';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import type { ActionSheetChangeRequest } from './action-sheet-defaults';
import { provideActionSheetDefaults } from './action-sheet-defaults';
import { SL_ACTION_SHEET } from './action-sheet-parts';
import { ANGULAR_ACTION_SHEET_DOCS, ANGULAR_ACTION_SHEET_TOKENS } from './action-sheet.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ACTION_SHEET_DOCS['action-sheet'].scenes, {
    playground: Playground,
    destructive: Destructive,
    groups: Groups,
    content: Content,
    loading: Loading,
    modal: Modal,
    policy: Policy,
    focus: Focus,
    result: Result,
    responsive: Responsive,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta: Meta = {
  title: 'Components/ActionSheet',
  decorators: [
    moduleMetadata({
      imports: [
        ...SL_ACTION_SHEET,
        NgIcon,
        SlButton,
        SlMenu,
        SlMenuItem,
        SlMenuItemDescription,
        SlMenuTrigger,
        SlText,
      ],
      providers: [
        provideIcons({
          lucideArchive,
          lucideBell,
          lucideCircleCheck,
          lucideCopy,
          lucideExternalLink,
          lucideFileSpreadsheet,
          lucideFileText,
          lucideTrash2,
          lucideUpload,
          lucideUserPlus,
        }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ActionSheet',
        description:
          'A short list of actions that rises from the bottom edge, and the explicit way out beneath it. A dialog holding a menu: the keyboard of a menu, the modality of a dialog, the item vocabulary of menu, and a close request that says which action was chosen.',
        framework: 'Angular',
        ...ANGULAR_ACTION_SHEET_DOCS['action-sheet'],
        tokens: ANGULAR_ACTION_SHEET_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * A box a sheet opens inside, so a demonstration is a sheet in a scene rather
 * than a layer over the reference page. `contain: paint` on the primitive makes
 * it the containing block for the fixed layer; in an application that is the
 * viewport.
 */
const layer = (body: string) =>
  `<div class="slotted-demo-viewport" data-size="tall" #box>${body}</div>`;

const scene = (label: string, note: string, body: string) =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (body: string) => `<div class="slotted-demo-grid" data-columns="2">${body}</div>`;

/**
 * A sheet that stands open to be looked at: not modal, no focus taken, not
 * dismissable. A modal layer writes `inert` up to the document root, and a page
 * holding several would be a page nobody can use. Not modal also means no scrim.
 */
const STILL =
  '[open]="true" [modal]="false" escape="none" outsidePress="none" [initialFocus]="false"';

const page = (extra = '') =>
  `<div class="slotted-demo-page">
    <p slText size="lg" weight="semibold">Quarterly report · Q3 2026</p>
    <p slText size="sm" tone="muted">Revenue of $4.82M, gross margin of 38.4%, shared with the finance team.</p>
    ${extra}
  </div>`;

const icon = (name: string) =>
  `<span slActionSheetItemIcon><ng-icon name="${name}" size="1em"></ng-icon></span>`;

const shareHeader = `<header slActionSheetHeader>
  <h2 slActionSheetTitle>Share report</h2>
  <p slActionSheetMessage>Anyone who receives the link sees today's version.</p>
</header>`;

const shareList = `<div slActionSheetList>
  <button slActionSheetItem value="copy">${icon('lucideCopy')}Copy link</button>
  <button slActionSheetItem value="invite">${icon('lucideUserPlus')}Invite people<span slActionSheetItemDescription>Can comment, cannot edit</span></button>
  <button slActionSheetItem value="pdf">${icon('lucideFileText')}Download PDF</button>
  <button slActionSheetItem value="open">${icon('lucideExternalLink')}Open in browser</button>
</div>`;

const invoiceList = `<div slActionSheetList>
  <div slActionSheetGroup>
    <div slActionSheetGroupLabel>Send</div>
    <button slActionSheetItem value="remind">${icon('lucideBell')}Remind the customer</button>
    <button slActionSheetItem value="accounting" disabled>${icon('lucideUpload')}Send to accounting<span slActionSheetItemDescription>Available after approval</span></button>
  </div>
  <hr slActionSheetSeparator />
  <div slActionSheetGroup>
    <div slActionSheetGroupLabel>Estado</div>
    <button slActionSheetItem value="paid" tone="success">${icon('lucideCircleCheck')}Mark as paid</button>
    <button slActionSheetItem value="archive" tone="secondary">${icon('lucideArchive')}Archive</button>
    <button slActionSheetItem value="void" tone="danger">${icon('lucideTrash2')}Void invoice<span slActionSheetItemDescription>The number is not reused</span></button>
  </div>
</div>`;

const cancel = (words = 'Cancelar') =>
  `<div slActionSheetFooter><button slActionSheetCancel>${words}</button></div>`;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({
    template:
      layer(`${page('<button slButton size="sm" [slActionSheetTrigger]="s">Partilhar</button>')}
      <sl-action-sheet #s="slActionSheet" [container]="box">
        ${shareHeader}${shareList}${cancel()}
      </sl-action-sheet>`),
  }),
};

export const Destructive: Story = {
  parameters: scenario('destructive'),
  render: () => ({
    template: layer(`<div class="slotted-demo-page">
        <p slText size="lg" weight="semibold">Nova mensagem</p>
        <p slText size="sm" tone="muted">Para: financeiro@exemplo.pt · Assunto: fecho do trimestre</p>
      </div>
      <sl-action-sheet [container]="box" ${STILL}>
        <header slActionSheetHeader><h2 slActionSheetTitle>Discard the message?</h2></header>
        <div slActionSheetList>
          <button slActionSheetItem value="delete" tone="danger">Delete draft</button>
          <button slActionSheetItem value="save">Save draft</button>
        </div>
        ${cancel()}
      </sl-action-sheet>`),
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({
    template: layer(`${page()}
      <sl-action-sheet [container]="box" ${STILL}>
        <header slActionSheetHeader><h2 slActionSheetTitle>Invoice 4471 · Atlantic Distribution</h2></header>
        ${invoiceList}${cancel()}
      </sl-action-sheet>`),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: layer(`${page()}
      <sl-action-sheet [container]="box" ${STILL}>
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Actions available for order 88213 from customer Atlantic Distribution</h2>
          <p slActionSheetMessage>Changes are recorded in the history and sent to the warehouse on the next sync.</p>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem value="resend">Resend the order confirmation to the billing address</button>
          <button slActionSheetItem value="address">Change the delivery address<span slActionSheetItemDescription>Until the warehouse dispatch, scheduled for tomorrow at 9 AM</span></button>
          <button slActionSheetItem value="copy-ref">Copy ORD-2026-0000088213-ATLANTIC-US-SEATTLE-NORTH</button>
          <button slActionSheetItem value="split">Split into two shipments</button>
          <button slActionSheetItem value="note">Add internal note</button>
          <button slActionSheetItem value="print">Print shipping label</button>
          <button slActionSheetItem value="cancel-order" tone="danger">Cancel order</button>
        </div>
        ${cancel('Close')}
      </sl-action-sheet>`),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => {
    const exporting = signal<string | null>(null);
    const done = signal<string[]>([]);
    const run = (value: string) => {
      exporting.set(value);
      setTimeout(() => {
        exporting.set(null);
        done.update((list) => [...list, value]);
      }, 1600);
    };
    return {
      props: { exporting, done, run },
      template:
        layer(`${page('<p slText size="sm" tone="muted">{{ done().length === 0 ? "No file prepared." : "Prepared: " + done().join(", ") + "." }}</p>')}
        <sl-action-sheet [container]="box" ${STILL} [closeOnSelect]="false">
          <header slActionSheetHeader><h2 slActionSheetTitle>Export</h2></header>
          <div slActionSheetList>
            <button slActionSheetItem value="pdf" [loading]="exporting() === 'pdf'" (select)="run('pdf')">${icon('lucideFileText')}Download PDF<span slActionSheetItemDescription>{{ exporting() === 'pdf' ? 'Preparing 14 pages' : '14 pages' }}</span></button>
            <button slActionSheetItem value="xlsx" [loading]="exporting() === 'xlsx'" (select)="run('xlsx')">${icon('lucideFileSpreadsheet')}Download spreadsheet</button>
          </div>
          ${cancel()}
        </sl-action-sheet>`),
    };
  },
};

export const Modal: Story = {
  parameters: scenario('modal'),
  render: () => ({
    template: grid(
      scene(
        'modal (default)',
        'Scrim, inert page, locked scroll.',
        layer(`${page('<button slButton size="sm" [slActionSheetTrigger]="m">Partilhar</button>')}
          <sl-action-sheet #m="slActionSheet" [container]="box">${shareHeader}${shareList}${cancel()}</sl-action-sheet>`),
      ) +
        scene(
          '[modal]="false"',
          'No scrim; the page stays operable.',
          layer(`<div class="slotted-demo-page">
              <p slText size="lg" weight="semibold">Delivery map</p>
              <button slButton size="sm" tone="secondary" variant="outline">Next route</button>
            </div>
            <sl-action-sheet [container]="box" ${STILL} aria-label="Route 12">
              <div slActionSheetList aria-label="Route 12">
                <button slActionSheetItem value="navigate">Start navigation</button>
                <button slActionSheetItem value="call">Call the driver</button>
              </div>
            </sl-action-sheet>`),
        ),
    ),
  }),
};

export const Policy: Story = {
  parameters: scenario('policy'),
  render: () => {
    const log = signal<string[]>([]);
    const record = (request: ActionSheetChangeRequest) =>
      log.update((lines) => [
        ...lines.slice(-2),
        `${request.value ? 'open' : 'close'} · ${request.reason}`,
      ]);
    return {
      props: { log, record },
      template: layer(`${page(`<button slButton size="sm" [slActionSheetTrigger]="p">Share</button>
          <p slText size="sm" tone="muted">{{ log().length === 0 ? 'No requests yet.' : log().join(' → ') }}</p>`)}
        <sl-action-sheet #p="slActionSheet" [container]="box" escape="none" outsidePress="none" back="none" (openChangeRequest)="record($event)">
          ${shareHeader}${shareList}${cancel()}
        </sl-action-sheet>`),
    };
  },
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => ({
    template: layer(`<div class="slotted-demo-page">
        <p slText size="lg" weight="semibold">New message</p>
        <button slButton size="sm" [slActionSheetTrigger]="f">Discard…</button>
        <button slButton size="sm" tone="secondary" variant="outline" #composer>Back to the text</button>
      </div>
      <sl-action-sheet #f="slActionSheet" [container]="box" [finalFocus]="composer">
        <header slActionSheetHeader><h2 slActionSheetTitle>Discard the message?</h2></header>
        <div slActionSheetList>
          <button slActionSheetItem value="delete" tone="danger">Delete draft</button>
          <button slActionSheetItem value="save">Save draft</button>
        </div>
        ${cancel()}
      </sl-action-sheet>`),
  }),
};

export const Result: Story = {
  parameters: scenario('result'),
  render: () => {
    const said = signal('No action chosen.');
    const read = (request: ActionSheetChangeRequest) => {
      if (request.value) return;
      said.set(
        request.reason === 'select'
          ? `reason: select · result: ${request.result ?? '—'}`
          : `reason: ${request.reason} · sem resultado`,
      );
    };
    return {
      props: { said, read },
      template:
        layer(`${page(`<button slButton size="sm" [slActionSheetTrigger]="r">Invoice 4471</button>
          <p slText size="sm" tone="muted">{{ said() }}</p>`)}
        <sl-action-sheet #r="slActionSheet" [container]="box" (openChangeRequest)="read($event)">
          <header slActionSheetHeader><h2 slActionSheetTitle>Invoice 4471</h2></header>
          ${invoiceList}${cancel()}
        </sl-action-sheet>`),
    };
  },
};

export const Responsive: Story = {
  parameters: scenario('responsive'),
  render: () => ({
    props: {
      actions: [
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'move', label: 'Move to…', description: 'Finance folder' },
        { value: 'lock', label: 'Lock editing', disabled: true },
        { value: 'delete', label: 'Delete', tone: 'danger' },
      ],
    },
    template: grid(
      scene(
        'pointer: fine → menu',
        'The same array as menu items.',
        `<div class="slotted-demo-page">
          <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">More</button>
          <sl-menu #menu aria-label="Actions">
            @for (action of actions; track action.value) {
              <button slMenuItem [tone]="action.tone" [disabled]="action.disabled ?? false">
                {{ action.label }}
                @if (action.description) { <span slMenuItemDescription>{{ action.description }}</span> }
              </button>
            }
          </sl-menu>
        </div>`,
      ) +
        scene(
          'pointer: coarse → action sheet',
          'The same array as sheet actions.',
          layer(`${page()}
            <sl-action-sheet [container]="box" ${STILL} aria-label="Actions">
              <div slActionSheetList aria-label="Actions">
                @for (action of actions; track action.value) {
                  <button slActionSheetItem [value]="action.value" [tone]="action.tone" [disabled]="action.disabled ?? false">
                    {{ action.label }}
                    @if (action.description) { <span slActionSheetItemDescription>{{ action.description }}</span> }
                  </button>
                }
              </div>
              <div slActionSheetFooter><button slActionSheetCancel></button></div>
            </sl-action-sheet>`),
        ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  decorators: [
    moduleMetadata({ providers: [provideActionSheetDefaults({ closeOnSelect: false })] }),
  ],
  render: () => ({
    template: layer(`${page()}
      <sl-action-sheet [container]="box" ${STILL}>
        ${shareHeader}${shareList}
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>`),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template:
      layer(`${page('<button slButton size="sm" [slActionSheetTrigger]="k">Invoice 4471</button>')}
      <sl-action-sheet #k="slActionSheet" [container]="box">
        <header slActionSheetHeader><h2 slActionSheetTitle>Invoice 4471</h2></header>
        ${invoiceList}${cancel()}
      </sl-action-sheet>`),
  }),
};
