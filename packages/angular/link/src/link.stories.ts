import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlLink } from './link';
import { provideLinkDefaults } from './link-defaults';
import type { LinkUnderline, LinkVariant } from './link.constants';
import { ANGULAR_LINK_DOCS, ANGULAR_LINK_TOKENS } from './link.docs';

interface LinkStoryArgs {
  content: string;
  disabled: boolean;
  external: boolean;
  underline: LinkUnderline;
  variant: LinkVariant;
  visited: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_LINK_DOCS.link.scenes, {
    playground: Playground,
    underline: Underline,
    variants: Variants,
    external: External,
    states: States,
    current: Current,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<LinkStoryArgs> = {
  title: 'Components/Link',
  component: SlLink,
  decorators: [moduleMetadata({ imports: [SlLink] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Link',
        description:
          'Navigation inside a sentence, underlined by default and honest about where it goes.',
        framework: 'Angular',
        ...ANGULAR_LINK_DOCS.link,
        tokens: ANGULAR_LINK_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<LinkStoryArgs>;

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
  layout: 'row' | 'stack' | 'block' | 'prose' = 'row',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

export const Playground: Story = {
  args: {
    content: 'the terms of service',
    disabled: false,
    external: false,
    underline: 'always',
    variant: 'accent',
    visited: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-layout="prose">
  <p>
    Read
    <a
      slLink
      href="/terms"
      [disabled]="disabled"
      [external]="external"
      [underline]="underline"
      [variant]="variant"
      [visited]="visited"
      >{{ content }}</a
    >
    before continuing. The sentence is here because a link is only ever as legible as the text it
    sits in.
  </p>
</div>`,
  }),
};

export const Underline: Story = {
  parameters: scenario('underline'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${scene(
    'underline="always"',
    'Prose. The only value that survives a reader who cannot separate the colours.',
    '<p>Charges are listed in the <a slLink href="/invoices">payment history</a>.</p>',
    'prose',
  )}
  ${scene(
    'underline="hover"',
    'Dense navigation, where a column of underlines is noise. Focus reveals it.',
    '<p>Charges are listed in the <a slLink href="/invoices" underline="hover">payment history</a>.</p>',
    'prose',
  )}
  ${scene(
    'underline="none"',
    'A link a heading or a cell already frames as one.',
    '<p>Charges are listed in the <a slLink href="/invoices" underline="none">payment history</a>.</p>',
    'prose',
  )}
</div>`,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${scene(
    'variant="accent"',
    'The invitation to leave this page. Hover darkens it toward the body colour and fills the underline.',
    '<p>Charges are listed in the <a slLink href="/history">payment history</a>.</p>',
    'prose',
  )}
  ${scene(
    'variant="neutral"',
    'The colour of the text around it, reaching the accent under the pointer. It belongs where nothing on the line could be mistaken for it.',
    `<a slLink href="/invoices/0041" underline="hover" variant="neutral">INV-2026-08-0041</a>
     <a slLink href="/invoices/0038" underline="hover" variant="neutral">INV-2026-07-0038</a>`,
    'stack',
  )}
  ${scene(
    'variant="inverse"',
    'On a solid ground the text colour is already the strongest available, so hover is carried by the underline alone.',
    `<div class="slotted-demo-surface" data-surface="inverse">
       Your trial ends in three days.
       <a slLink href="/plans" variant="inverse">Choose a plan</a>
     </div>`,
    'stack',
  )}
</div>`,
  }),
};

export const External: Story = {
  parameters: scenario('external'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'external',
    'The marker says it to the eye and the hidden text says it to a screen reader, before the link is followed rather than after.',
    `<p>
       The full specification lives at
       <a slLink external href="https://www.w3.org/TR/wai-aria-1.2/">the WAI-ARIA specification</a>.
     </p>
     <p>
       The wording is a message, so an application in another language reads
       <!-- language: pt-BR -->
       <a slLink external [messages]="{ externalHint: '(abre numa nova aba)' }" href="https://www.w3.org/TR/wai-aria-1.2/"
         >a hint of its own</a
       >.
       <!-- language: en-US -->
     </p>`,
    'prose',
  )}
  ${scene(
    'target="_blank"',
    'The warning follows the fact rather than the input, so an attribute written by hand earns the same marker, the same hidden text and the same safe rel.',
    `<p>
       Written by hand, and
       <a slLink href="https://www.w3.org/TR/wai-aria-1.2/" target="_blank">warned about all the same</a>.
     </p>`,
    'prose',
  )}
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Available',
    'Hover darkens the text and fills the underline; press goes one step further. Both are worth exercising with the pointer rather than reading here.',
    `<a slLink href="/invoices">At rest</a>
     <a slLink href="/invoices" visited>Followed before, where the application asked for it</a>`,
    'stack',
  )}
  ${scene(
    'disabled',
    'The destination is gone, which is what stops a middle click too. Tab still reaches it, so the state can be discovered rather than guessed at.',
    `<a slLink disabled href="/invoices/0042">Unavailable until the invoice is issued</a>
     <a slLink disabled external href="https://example.com/status"
       >Unavailable, and it would have left the application</a
     >`,
    'stack',
  )}
</div>`,
  }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'aria-current="page"',
    'The link to the page you are already on takes the body colour and keeps its underline. Nothing about its width changes, so the column does not shift.',
    `<nav aria-label="Workspace" class="slotted-demo-stack">
       <a slLink aria-current="page" href="/invoices" underline="hover">Invoices</a>
       <a slLink href="/members" underline="hover">Members</a>
       <a slLink href="/settings" underline="hover">Settings</a>
     </nav>`,
    'stack',
  )}
  ${scene(
    'Inside a sentence',
    'The same attribute in running text: still a link, still underlined, and no longer an invitation to go anywhere.',
    `<p>
       You are reading the <a slLink aria-current="page" href="/terms">terms of service</a>, and the
       <a slLink href="/privacy">privacy notice</a> is next.
     </p>`,
    'prose',
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'A destination as the label',
    'One unbroken token. Without overflow-wrap it widens the column it sits in rather than wrapping inside it, which a 240-pixel container shows immediately.',
    `<div class="slotted-demo-measure">
       <a slLink href="/reconciliation"
         >https://billing.example.com/accounts/8412/invoices/2026-08/reconciliation-report</a
       >
     </div>`,
    'prose',
  )}
  ${scene(
    'Translated, and right to left',
    'A German compound wraps mid-word; an Arabic sentence mirrors the marker, and the Latin island inside it does not mirror with it.',
    `<p>
       Die <a slLink href="/uebersicht">Zahlungsempfängerverwaltungsübersicht</a> listet jede
       Rechnung auf.
     </p>
     <p dir="rtl" lang="ar">
       تصدر الفواتير إلى العنوان المسجل في
       <a slLink external href="https://example.com/terms">موقع الجهة التنظيمية</a>.
     </p>`,
    'prose',
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideLinkDefaults({ underline: 'hover', variant: 'neutral' })],
    }),
  ],
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'provideLinkDefaults',
    'This page provides hover and neutral for every link on it. The first link inherits both; the second states its own and wins.',
    `<a slLink href="/invoices">Inherited</a>
     <a slLink href="/members" underline="always" variant="accent">Stated on the link</a>`,
    'stack',
  )}
  ${scene(
    'In a dense row',
    "Where the neutral variant earns its place: the name is the link, the type is the row's, and nothing is painted blue until the pointer reaches it.",
    `<div class="slotted-demo-rows">
       <span><a slLink href="/invoices/0041">INV-2026-08-0041</a></span>
       <span>Paid</span>
       <span><a slLink href="/invoices/0038">INV-2026-07-0038</a></span>
       <span>Overdue</span>
     </div>`,
    'stack',
  )}
  ${scene(
    'A download',
    'The download attribute is the platform’s and reaches the anchor unchanged. Arbitrary artwork beside the label belongs to the icon family, never to this one.',
    '<a slLink download href="/reports/2026-08.pdf">Download the August report</a>',
    'stack',
  )}
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Tab, then Enter',
    'Tab reaches all three, including the unavailable one. Enter follows the link that has a destination; Space does nothing, because Space does not activate a link.',
    `<a slLink href="/invoices">A link with a destination</a>
     <a slLink external href="https://example.com/status">A link that leaves the application</a>
     <a slLink disabled href="/invoices/0042">A link that is unavailable</a>`,
    'stack',
  )}
</div>`,
  }),
};
