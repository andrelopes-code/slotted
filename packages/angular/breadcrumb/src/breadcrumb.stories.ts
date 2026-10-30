import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';

import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
  SlBreadcrumbTrigger,
} from './breadcrumb';
import { provideBreadcrumbDefaults } from './breadcrumb.constants';
import { ANGULAR_BREADCRUMB_DOCS, ANGULAR_BREADCRUMB_TOKENS } from './breadcrumb.docs';

interface BreadcrumbStoryArgs {
  itemsAfterCollapse: number;
  itemsBeforeCollapse: number;
  maxItems: number;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_BREADCRUMB_DOCS.breadcrumb.scenes, {
    playground: Playground,
    collapse: Collapse,
    separator: Separator,
    current: Current,
    context: Context,
    content: Content,
    composition: Composition,
    switcher: Switcher,
    overflow: Overflow,
    keyboard: Keyboard,
  }) as never;

const parts = [
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
  SlBreadcrumbTrigger,
  SlGlyph,
  SlIcon,
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuTrigger,
];

const meta: Meta<BreadcrumbStoryArgs> = {
  title: 'Components/Breadcrumb',
  component: SlBreadcrumb,
  decorators: [moduleMetadata({ imports: parts })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Breadcrumb',
        description:
          'Where a page sits in the hierarchy, folded when the trail gets deep and expanded in place.',
        framework: 'Angular',
        ...ANGULAR_BREADCRUMB_DOCS.breadcrumb,
        tokens: ANGULAR_BREADCRUMB_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<BreadcrumbStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

/** The five ancestors above the invoice, written out so the markup reads. */
const DEEP = `
  <li slBreadcrumbItem><a slBreadcrumbLink href="#workspace">Workspace</a></li>
  <li slBreadcrumbItem><a slBreadcrumbLink href="#org">Northwind Trading</a></li>
  <li slBreadcrumbItem><a slBreadcrumbLink href="#accounts">Accounts</a></li>
  <li slBreadcrumbItem><a slBreadcrumbLink href="#billing">Billing</a></li>
  <li slBreadcrumbItem><a slBreadcrumbLink href="#invoices">Invoices</a></li>
  <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>`;

const SHORT = `
  <li slBreadcrumbItem><a slBreadcrumbLink href="#workspace">Workspace</a></li>
  <li slBreadcrumbItem><a slBreadcrumbLink href="#billing">Billing</a></li>
  <li slBreadcrumbItem><span slBreadcrumbPage>Invoices</span></li>`;

export const Playground: Story = {
  args: {
    itemsAfterCollapse: 2,
    itemsBeforeCollapse: 1,
    maxItems: 8,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-layout="stack">
  <nav
    slBreadcrumb
    [maxItems]="maxItems"
    [itemsBeforeCollapse]="itemsBeforeCollapse"
    [itemsAfterCollapse]="itemsAfterCollapse"
  >
    <ol slBreadcrumbList>${DEEP}</ol>
  </nav>
</div>`,
  }),
};

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    '[maxItems]="4"',
    'Six levels folded to four items. The button says how many it hides, and pressing it reveals them without leaving the page.',
    `<nav slBreadcrumb [maxItems]="4"><ol slBreadcrumbList>${DEEP}</ol></nav>`,
  )}
  ${scene(
    'defaultExpanded',
    'The same trail already open. An application that remembers the reader’s choice holds expanded itself and passes it back.',
    `<nav slBreadcrumb defaultExpanded [maxItems]="4"><ol slBreadcrumbList>${DEEP}</ol></nav>`,
  )}
</div>`,
  }),
};

export const Separator: Story = {
  parameters: scenario('separator'),
  render: () => ({
    template: `
<ng-template #mark>›</ng-template>
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'drawn',
    'No separator input: the stylesheet draws a one-pixel rule rotated into a slash, which mirrors in a right-to-left document.',
    `<nav slBreadcrumb><ol slBreadcrumbList>${SHORT}</ol></nav>`,
  )}
  ${scene(
    '[separator]="mark"',
    'Your own TemplateRef, rendered into the same element. The drawing stops the moment the separator holds anything at all.',
    `<nav slBreadcrumb [separator]="mark"><ol slBreadcrumbList>${SHORT}</ol></nav>`,
  )}
</div>`,
  }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'slBreadcrumbPage',
    'The last crumb takes the strongest text colour and a heavier weight, so the end of the trail reads without being read.',
    `<nav slBreadcrumb><ol slBreadcrumbList>${SHORT}</ol></nav>`,
  )}
</div>`,
  }),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Above a page heading',
    'Where a trail actually lives. It sits at interface type size over a title, and it says where the page is rather than where the reader came from.',
    `<div>
       <nav slBreadcrumb><ol slBreadcrumbList>${SHORT}</ol></nav>
       <h2>INV-2026-08-0041</h2>
     </div>`,
    'prose',
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Long, translated and unbroken, overflow="wrap"',
    'A German compound, a pasted identifier and an Arabic label. The row wraps before anything truncates, and the string survives whatever is cut.',
    `<div class="slotted-demo-measure">
       <nav slBreadcrumb overflow="wrap">
         <ol slBreadcrumbList>
           <li slBreadcrumbItem>
             <a slBreadcrumbLink href="#settings">Zahlungsabwicklungseinstellungen</a>
           </li>
           <li slBreadcrumbItem>
             <a slBreadcrumbLink href="#report">INV-2026-08-0041-RECONCILIATION-REPORT</a>
           </li>
           <li slBreadcrumbItem><span slBreadcrumbPage>تسوية</span></li>
         </ol>
       </nav>
     </div>`,
  )}
  ${scene(
    'One crumb',
    'A trail whose only crumb is the page itself draws no separator, and the landmark keeps its name.',
    `<nav slBreadcrumb>
       <ol slBreadcrumbList>
         <li slBreadcrumbItem><span slBreadcrumbPage>Dashboard</span></li>
       </ol>
     </nav>`,
    'block',
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideBreadcrumbDefaults({ maxItems: 4 })],
    }),
  ],
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'provideBreadcrumbDefaults',
    'This page provides a fold at four for every trail on it. The first inherits it; the second states its own and wins.',
    `<nav slBreadcrumb><ol slBreadcrumbList>${DEEP}</ol></nav>
     <nav slBreadcrumb [maxItems]="0"><ol slBreadcrumbList>${SHORT}</ol></nav>`,
  )}
  ${scene(
    'The consumer’s own anchor',
    'The link directive claims no destination, so href, routerLink and every native attribute stay on the element the consumer wrote them on.',
    `<nav slBreadcrumb>
       <ol slBreadcrumbList>
         <li slBreadcrumbItem>
           <a slBreadcrumbLink href="#invoices" hreflang="pt-BR" rel="prev">Invoices</a>
         </li>
         <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
       </ol>
     </nav>`,
  )}
</div>`,
  }),
};

/**
 * A switcher over the crumbs a reader moves sideways between rather than up:
 * which company's books, which ledger, which period. Each menu marks the
 * sibling the trail is on, and the last is the page itself.
 */
const SWITCH = (label: string, options: string[], extra = '', icon = '') => {
  const id = label.replace(/[^a-z]/gi, '').toLowerCase();
  return `
  <li slBreadcrumbItem>
    <button slBreadcrumbTrigger ${extra} [slMenuTriggerFor]="${id}">${icon}${label}</button>
    <sl-menu #${id}>
      <sl-menu-radio-group aria-label="${label}" value="${label}">
        ${options.map((option) => `<button slMenuRadioItem value="${option}">${option}</button>`).join('')}
      </sl-menu-radio-group>
    </sl-menu>
  </li>`;
};

const INBOX = '<span slIcon><svg slGlyph name="inbox"></svg></span>';

export const Switcher: Story = {
  parameters: scenario('switcher'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'slBreadcrumbTrigger with slMenuTriggerFor',
    'Open a crumb: its chevron turns, the underline stays while the menu is up, and the menu marks the sibling the trail is on. The period is the page itself, so it keeps aria-current.',
    `<nav slBreadcrumb>
       <ol slBreadcrumbList>
         ${SWITCH('Northwind Trading', ['Northwind Trading', 'Contoso Ltd', 'Fabrikam Inc'], '', INBOX)}
         ${SWITCH('Accounts receivable', ['Accounts receivable', 'Accounts payable'])}
         ${SWITCH('August 2026', ['June 2026', 'July 2026', 'August 2026'], 'current')}
       </ol>
     </nav>`,
  )}
  ${scene(
    'Beside plain crumbs',
    'A switcher is one crumb among links: it keeps their colour, their underline and their focus ring, and only the chevron says a list opens here rather than a page.',
    `<nav slBreadcrumb>
       <ol slBreadcrumbList>
         <li slBreadcrumbItem><a slBreadcrumbLink href="#workspace">Workspace</a></li>
         ${SWITCH('Billing', ['Billing', 'Payroll', 'Tax'])}
         <li slBreadcrumbItem>
           <span slBreadcrumbPage><span slIcon><svg slGlyph name="file-text"></svg></span>INV-2026-08-0041</span>
         </li>
       </ol>
     </nav>`,
  )}
</div>`,
  }),
};

const WIDE = `${DEEP.replace(
  '<li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>',
  `<li slBreadcrumbItem><a slBreadcrumbLink href="#receivable">Accounts receivable</a></li>
  <li slBreadcrumbItem><a slBreadcrumbLink href="#august">August 2026</a></li>
  <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>`,
)}`;

const room = (size: 'phone' | 'tablet', body: string) =>
  `<div class="slotted-demo-room" data-room="${size}"><div class="slotted-demo-viewport">${body}</div></div>`;

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    '640 pixels',
    'Eight crumbs at tablet width. Whatever does not fit folds into the ellipsis from the crumb nearest the root, and the first and the last two always stay.',
    room('tablet', `<nav slBreadcrumb [maxItems]="0"><ol slBreadcrumbList>${WIDE}</ol></nav>`),
    'block',
  )}
  ${scene(
    '375 pixels',
    'The same trail on a phone. The ellipsis names every crumb it holds, and pressing it expands the trail onto a second line.',
    room('phone', `<nav slBreadcrumb [maxItems]="0"><ol slBreadcrumbList>${WIDE}</ol></nav>`),
    'block',
  )}
  ${scene(
    'overflow="wrap" at 375 pixels',
    'Every crumb kept, the row broken onto as many lines as it takes. Lines stand a target apart, so two crumbs above each other are never one tap.',
    room(
      'phone',
      `<nav slBreadcrumb overflow="wrap" [maxItems]="0"><ol slBreadcrumbList>${WIDE}</ol></nav>`,
    ),
    'block',
  )}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Tab, Enter, Space',
    'Tab reaches every crumb and the ellipsis. Enter follows a crumb; Enter or Space on the ellipsis expands the trail and moves focus to the first crumb it revealed.',
    `<nav slBreadcrumb [maxItems]="4"><ol slBreadcrumbList>${DEEP}</ol></nav>`,
  )}
</div>`,
  }),
};
