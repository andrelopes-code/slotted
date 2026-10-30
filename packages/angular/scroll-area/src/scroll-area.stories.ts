import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlScrollArea, SlScrollAreaContent } from './scroll-area';
import { ANGULAR_SCROLL_AREA_DOCS, ANGULAR_SCROLL_AREA_TOKENS } from './scroll-area.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SCROLL_AREA_DOCS.scrollArea.scenes, {
    playground: Playground,
    axis: Axis,
    scrollbars: Scrollbars,
    fade: Fade,
    gutter: Gutter,
    overscroll: Overscroll,
    maximum: Maximum,
    keyboard: Keyboard,
    content: Content,
    composition: Composition,
    print: Print,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<Record<string, never>> = {
  title: 'Components/ScrollArea',
  component: SlScrollArea,
  decorators: [
    moduleMetadata({
      imports: [SlScrollArea, SlScrollAreaContent, SlButton, SlInline, SlLink, SlStack, SlText],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Scroll Area',
        description:
          'A scrollport and the box that frames it. The scrollbar is the platform’s, themed through scrollbar-color; the keyboard is the platform’s too. What the family adds is the measurement of whether the content overflows — published on the frame in logical names and painted as a veil that needs no ink — and the tab stop and name a scrolling region owes, written only while there is something to scroll.',
        framework: 'Angular',
        ...ANGULAR_SCROLL_AREA_DOCS.scrollArea,
        tokens: ANGULAR_SCROLL_AREA_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<Record<string, never>>;

/**
 * The content a scroll area is demonstrated with: one product, the billing
 * back office the other families already live in. The React page carries the
 * same six notes, the same regions and the same paths, so the two pages read
 * as one family rather than as two.
 */
const RELEASES = [
  [
    '2026.9.2 — Billing',
    'An invoice issued before September 1 keeps the old tax lines, and a credit note against it now carries the same.',
  ],
  [
    '2026.9.1 — Billing',
    'A subscription that changes plan mid-cycle is prorated by the day and no longer by the hour. Seven customers were charged twice for the same day and were refunded.',
  ],
  [
    '2026.8.29 — Access',
    'The single sign-on session expires with the identity provider’s instead of after a fixed eight hours.',
  ],
  [
    '2026.8.22 — Exports',
    'An export with more than fifty thousand rows is delivered by email instead of downloaded, and the request now says so before it is made.',
  ],
  [
    '2026.8.15 — Reports',
    'The monthly report now includes regions with no consumption, with zero, instead of omitting them.',
  ],
  [
    '2026.8.8 — Collections',
    'A collection reminder is not sent to a customer whose invoice is in open dispute.',
  ],
];

const notes = (count = RELEASES.length) =>
  `<div slStack gap="4">${RELEASES.slice(0, count)
    .map(
      ([title, note]) => `<div slStack gap="1">
        <p slText size="sm" weight="semibold">${title}</p>
        <p slText size="sm" tone="muted">${note}</p>
      </div>`,
    )
    .join('')}</div>`;

const fits = `<div slStack gap="1">
    <p slText size="sm" weight="semibold">2026.9.2 — Billing</p>
    <p slText size="sm" tone="muted">Three lines that fit entirely.</p>
    <p slText size="sm" tone="muted">Nothing to scroll.</p>
  </div>`;

const REGIONS = [
  'sa-east-1',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'us-east-2',
  'us-west-2',
  'ap-southeast-2',
  'ca-central-1',
  'ap-northeast-1',
];

const regions = `<div slInline gap="5" wrap="nowrap">${REGIONS.map(
  (region) => `<p slText size="sm" wrap="nowrap">${region}</p>`,
).join('')}</div>`;

const LOG = [
  '2026-09-11 14:02 · sa-east-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-sa-east-1.pdf',
  '2026-09-11 14:02 · eu-west-3 · https://billing.example.com/invoices/2026-09/consolidated-statement-eu-west-3.pdf',
  '2026-09-11 14:03 · ap-southeast-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-ap-southeast-1.pdf',
  '2026-09-11 14:03 · us-east-2 · https://billing.example.com/invoices/2026-09/consolidated-statement-us-east-2.pdf',
  '2026-09-11 14:04 · ap-southeast-2 · https://billing.example.com/invoices/2026-09/consolidated-statement-ap-southeast-2.pdf',
  '2026-09-11 14:04 · ca-central-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-ca-central-1.pdf',
  '2026-09-11 14:05 · ap-northeast-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-ap-northeast-1.pdf',
  '2026-09-11 14:05 · us-west-2 · https://billing.example.com/invoices/2026-09/consolidated-statement-us-west-2.pdf',
  '2026-09-11 14:06 · eu-central-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-eu-central-1.pdf',
  '2026-09-11 14:06 · sa-east-1 · https://billing.example.com/invoices/2026-08/consolidated-statement-sa-east-1.pdf',
];

const log = `<div slStack gap="1">${LOG.map(
  (line) => `<p slText size="sm" tone="muted" wrap="nowrap">${line}</p>`,
).join('')}</div>`;

const paths = `<div slStack gap="1">
    <p slText size="sm" wrap="nowrap">https://billing.example.com/invoices/2026-09/consolidated-statement-sa-east-1.pdf</p>
    <p slText size="sm" wrap="nowrap">https://billing.example.com/invoices/2026-09/consolidated-statement-eu-west-3.pdf</p>
    <p slText size="sm" wrap="nowrap">https://billing.example.com/invoices/2026-08/consolidated-statement-sa-east-1.pdf</p>
  </div>`;

const translated =
  '<p slText size="sm" tone="muted">Die Abonnementänderung innerhalb eines Abrechnungszeitraums wird tagesgenau und nicht mehr stundengenau anteilig berechnet. Sieben Kunden wurden zweimal für denselben Tag belastet und haben eine Erstattung erhalten. Die Sitzung der Einmalanmeldung läuft zusammen mit der des Identitätsanbieters ab und nicht mehr nach festen acht Stunden.</p>';

/**
 * A bounded, framed area. The bound and the frame are workbench primitives
 * because a story may not paint inline, and the frame is on the host — the
 * element the veil is not on — which is the anatomy decision the page shows.
 */
const framed = (attributes: string, body: string) =>
  `<div slScrollArea class="slotted-demo-bound slotted-demo-frame" ${attributes}>
    <div slScrollAreaContent>${body}</div>
  </div>`;

const scene = (label: string, note: string, body: string) =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, body: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${body}</div>`;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Release notes · block · auto · both',
        'The default configuration: one axis, the platform scrollbar, the fade at both ends. Scroll to the end and the bottom fade lifts; return to the start and the top one disappears.',
        framed(`[messages]="{ label: 'Release notes' }"`, notes()),
      ),
    ),
  }),
};

export const Axis: Story = {
  parameters: scenario('axis'),
  render: () => ({
    template: grid(
      1,
      scene(
        'block — the default axis',
        'Only the block axis scrolls. The inline axis is locked, so a long line wraps instead of running off to the side.',
        framed(`[messages]="{ label: 'Release notes' }"`, notes()),
      ) +
        scene(
          'inline — a row that overflows the box',
          'The fade falls on the end the reader has not yet reached, and mirrors with the document: in RTL it sits on the left. The horizontal scrollbar is the platform’s.',
          `<div slScrollArea axis="inline" class="slotted-demo-frame" [messages]="{ label: 'Regions' }">
            <div slScrollAreaContent>${regions}</div>
          </div>`,
        ) +
        scene(
          'both — a log wider and taller than the box',
          'Four fades, and the two masks multiply at the corners. The square between the two scrollbars is drawn by the system. Use the buttons to bring it to the middle.',
          `<div slStack gap="4">
            ${framed(`axis="both" #both="slScrollArea" [messages]="{ label: 'Export log' }"`, log)}
            <div slInline gap="3">
              <button slButton size="sm" variant="outline" (click)="both.scrollTo({ block: 40, inline: 60 })">To the middle</button>
              <button slButton size="sm" variant="outline" (click)="both.scrollToEdge('block-start'); both.scrollToEdge('inline-start')">To the start</button>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const Scrollbars: Story = {
  parameters: scenario('scrollbars'),
  render: () => ({
    template: grid(
      2,
      scene(
        'auto',
        'The scrollbar appears when there is something to scroll and reserves its space from the start, so nothing shifts when it appears.',
        framed(`[messages]="{ label: 'Release notes' }"`, notes()),
      ) +
        scene(
          'always',
          'The gutter stays reserved and drawn even on content that fits entirely. It is overflow: scroll, the platform’s way of saying the same.',
          framed(`[messages]="{ label: 'Release notes' }" scrollbars="always"`, notes(2)),
        ) +
        scene(
          'hover',
          'The gutter stays, the scrollbar is not painted until a pointer or the keyboard is inside. It is the CSS half of what Radix and Mantine spend a timer on.',
          framed(`[messages]="{ label: 'Release notes' }" scrollbars="hover"`, notes()),
        ) +
        scene(
          'none',
          'No scrollbar and no gutter. The content still scrolls by wheel, touch, keyboard and scrollTo, and the fade becomes the only thing saying there is more.',
          framed(`[messages]="{ label: 'Release notes' }" scrollbars="none"`, notes()),
        ),
    ),
  }),
};

export const Fade: Story = {
  parameters: scenario('fade'),
  render: () => ({
    template: grid(
      3,
      scene(
        'both',
        'Darkens what the reader has already passed and what still lies ahead. The two ends read as a single idea. Scroll a little to see both.',
        framed(`[messages]="{ label: 'Release notes' }"`, notes()),
      ) +
        scene(
          'end',
          'Only the end toward which there is more content. The start of the list stays sharp, for those who prefer not to darken what has been read.',
          framed(`fade="end" [messages]="{ label: 'Release notes' }"`, notes()),
        ) +
        scene(
          'none',
          'No fade and no mask: the scrollbar alone says there is more, and the area does not pay for a compositing layer.',
          framed(`fade="none" [messages]="{ label: 'Release notes' }"`, notes()),
        ),
    ),
  }),
};

export const Gutter: Story = {
  parameters: scenario('gutter'),
  render: () => ({
    template: grid(
      3,
      scene(
        'auto',
        'The inset reaches the frame. The moment the content grows past the box, the scrollbar appears and pushes the text to the left.',
        framed(`gutter="auto" [messages]="{ label: 'Release notes' }"`, fits),
      ) +
        scene(
          'stable — the default',
          'A scrollbar width is reserved on the right from the start, so nothing shifts when it appears.',
          framed(`[messages]="{ label: 'Release notes' }"`, fits),
        ) +
        scene(
          'both-edges',
          'The same width on both sides, so a centered column stays centered whether or not the scrollbar is there.',
          framed(`gutter="both-edges" [messages]="{ label: 'Release notes' }"`, fits),
        ),
    ),
  }),
};

/**
 * A page that scrolls, with an area inside it: the workbench's scrolling
 * stage, inset by a surface, with enough lines either side of the area that
 * scrolling the page is visibly a different movement from scrolling the area.
 */
const page = (body: string) =>
  `<div class="slotted-demo-scroll">
    <div class="slotted-demo-surface">
      <div slStack gap="4">
        <p slText size="sm" tone="muted">This page scrolls. Scroll it until you reach the area.</p>
        <p slText size="sm" tone="muted">Then scroll the area to the end, and keep going.</p>
        ${body}
        <p slText size="sm" tone="muted">This line is below the area, on the page.</p>
        <p slText size="sm" tone="muted">So is this one.</p>
        <p slText size="sm" tone="muted">And this is the last line of the page.</p>
      </div>
    </div>
  </div>`;

export const Overscroll: Story = {
  parameters: scenario('overscroll'),
  render: () => ({
    template: grid(
      2,
      scene(
        'contain — the default',
        'Reach the end of the area and keep scrolling: the page behind stays still. A bounded region whose last inch moves the page is the defect the property came to fix.',
        page(
          `<div slScrollArea class="slotted-demo-frame" [messages]="{ label: 'Release notes' }" maxBlockSize="7rem">
            <div slScrollAreaContent>${notes(2)}</div>
          </div>`,
        ),
      ) +
        scene(
          'auto',
          'The same gesture chains to the page, which is what the browser does by default. A consumer who wants that says so.',
          page(
            `<div slScrollArea class="slotted-demo-frame" [messages]="{ label: 'Release notes' }" maxBlockSize="7rem" overscroll="auto">
              <div slScrollAreaContent>${notes(2)}</div>
            </div>`,
          ),
        ),
    ),
  }),
};

export const Maximum: Story = {
  parameters: scenario('maximum'),
  render: () => ({
    props: { count: 2, total: RELEASES.length, releases: RELEASES },
    template: grid(
      1,
      scene(
        'maxBlockSize — 12rem',
        'With two notes the area is as tall as the two and does not scroll. Add notes: it grows up to twelve rem and starts to scroll, and the named region with a tab stop appears at the same moment the overflow appears.',
        `<div slStack gap="4">
          <div slScrollArea class="slotted-demo-frame" [messages]="{ label: 'Release notes' }" maxBlockSize="12rem">
            <div slScrollAreaContent>
              <div slStack gap="4">
                @for (release of releases.slice(0, count); track release[0]) {
                  <div slStack gap="1">
                    <p slText size="sm" weight="semibold">{{ release[0] }}</p>
                    <p slText size="sm" tone="muted">{{ release[1] }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
          <div slInline gap="3">
            <button slButton size="sm" variant="outline" [disabled]="count >= total" (click)="count = count + 1">Add a note</button>
            <button slButton size="sm" variant="outline" [disabled]="count <= 1" (click)="count = count - 1">Remove one</button>
          </div>
        </div>`,
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Tab reaches the region; the rest belongs to the platform',
        'Press Tab to the area and then the arrows, PageDown, End and Home. The family writes none of these keys — it writes only the tab stop that makes them reachable.',
        framed(`[messages]="{ label: 'Release notes' }"`, notes()),
      ) +
        scene(
          '[tabbable]="false" — a child already receives focus',
          'The link inside is already a tab stop, and a second one on the scroll port would be one that does nothing. Tab goes straight to the link; the pointer can still focus the area.',
          framed(
            `[messages]="{ label: 'Release notes' }" [tabbable]="false"`,
            `<div slStack gap="4">
              <p slText size="sm" tone="muted">The full note is in <a slLink href="#release-notes">release notes 2026.9</a>, which opens on the same page.</p>
              ${notes()}
            </div>`,
          ),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      3,
      scene(
        'Three unbreakable paths',
        'A token that does not break scrolls on the inline axis and is faded where it leaves the box. The horizontal scrollbar appears below all three.',
        framed(`axis="both" [messages]="{ label: 'Exported files' }"`, paths),
      ) +
        scene(
          'A translation twice as long',
          'It wraps and scrolls on the block axis, like any text. The fade falls over the word that is leaving, not over an inset.',
          framed(`[messages]="{ label: 'Änderungsprotokoll' }"`, translated),
        ) +
        scene(
          'Three lines that fit',
          'Nothing overflows, so the area is a box like any other: no fade, no scrollbar, no tab stop and no role.',
          framed(`[messages]="{ label: 'Release notes' }"`, fits),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { block: 0 },
    template: grid(
      1,
      scene(
        'exportAs, scrollChange and the consumer’s element',
        'The buttons move the area through the instance and nothing around it shifts — reveal moves the container alone, unlike scrollIntoView. The position is emitted on every scroll, and the frame is a section of the consumer’s own.',
        `<div slStack gap="4">
          <section slScrollArea #area="slScrollArea" class="slotted-demo-bound slotted-demo-frame" [messages]="{ label: 'Release notes' }" (scrollChange)="block = $event.position.block">
            <div slScrollAreaContent>
              <div slStack gap="4">
                ${notes(4)}
                <p slText size="sm" weight="semibold"><span #last>2026.8.8 — Collections, the last line</span></p>
              </div>
            </div>
          </section>
          <div slInline gap="3">
            <button slButton size="sm" variant="outline" (click)="area.scrollToEdge('block-end')">End</button>
            <button slButton size="sm" variant="outline" (click)="area.scrollToEdge('block-start')">Start</button>
            <button slButton size="sm" variant="outline" (click)="area.reveal(last)">Reveal the last line</button>
            <p slText size="sm" tone="muted">{{ block | number: '1.0-0' }} px from the start</p>
          </div>
        </div>`,
      ),
    ),
  }),
};

export const Print: Story = {
  parameters: scenario('print'),
  render: () => ({
    template: grid(
      1,
      scene(
        'On paper, everything',
        'Open the print preview of this page: the area drops the maximum and the clip in the print query and prints all six notes, not the two that were in view. None of the five implementations surveyed does this.',
        framed(`[messages]="{ label: 'Release notes' }"`, notes()),
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  decorators: [
    moduleMetadata({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  render: () => ({
    template: grid(
      3,
      scene(
        'Overflows — a named region',
        'role=region, tabindex=0 and the name from the catalog of the language in force. A screen reader hears the name on entry and uses the browser’s own arrows.',
        framed('', notes()),
      ) +
        scene(
          'Fits — nothing',
          'No role, no name, no tab stop. A tab stop on content that fits is one that does nothing, and a page with eight areas would have eight.',
          framed('', fits),
        ) +
        scene(
          'Named by the heading — labelledBy',
          'The heading above is the name of the region, in the order the name resolves: labelledBy, then messages.label, then the catalog.',
          `<div slStack gap="3">
            <p slText id="notes-title" size="sm" weight="semibold">Release notes</p>
            ${framed('labelledBy="notes-title"', notes())}
          </div>`,
        ),
    ),
  }),
};
