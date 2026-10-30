import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlTextField } from '@slotted/angular/text-field';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlLoadingOverlay,
  SlLoadingOverlayCancel,
  SlLoadingOverlayIndicator,
} from './loading-overlay';
import { provideLoadingOverlayDefaults } from './loading-overlay-defaults';
import type {
  LoadingOverlayScope,
  LoadingOverlaySize,
  LoadingOverlayVeil,
} from './loading-overlay.constants';
import {
  ANGULAR_LOADING_OVERLAY_DOCS,
  ANGULAR_LOADING_OVERLAY_TOKENS,
} from './loading-overlay.docs';

/**
 * A load that finishes every nine hundred milliseconds, so the difference the
 * two durations make is visible standing still. The same boolean drives both
 * regions: on the left it paints every flip, on the right it paints none of
 * them.
 */
@Component({
  selector: 'sl-loading-overlay-timing-demo',
  imports: [SlLoadingOverlay, SlText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="slotted-demo-stack">
    <span slText tone="muted">Neither duration set — the layer paints on every flip.</span>
    <div slLoadingOverlay [loading]="pending()" [messages]="{ label: 'Reconciling September' }">
      <div class="slotted-demo-rows">
        <span>ACME Ltda.</span><span>R$ 1 240,00</span> <span>Papelaria Vento Norte</span
        ><span>R$ 318,90</span>
      </div>
    </div>
    <span slText tone="muted">
      delay 600, minDuration 600 — the same flips, and nothing flashes.
    </span>
    <div
      slLoadingOverlay
      [loading]="pending()"
      [delay]="600"
      [minDuration]="600"
      [messages]="{ label: 'Reconciling' }"
    >
      <div class="slotted-demo-rows">
        <span>ACME Ltda.</span><span>R$ 1 240,00</span> <span>Papelaria Vento Norte</span
        ><span>R$ 318,90</span>
      </div>
    </div>
  </div>`,
})
class TimingDemo {
  readonly pending = signal(true);

  constructor() {
    const toggle = setInterval(() => this.pending.update((on) => !on), 900);
    inject(DestroyRef).onDestroy(() => clearInterval(toggle));
  }
}

interface LoadingOverlayStoryArgs {
  cancellable: boolean;
  loading: boolean;
  messages: { label: string };
  scope: LoadingOverlayScope;
  size: LoadingOverlaySize;
  veil: LoadingOverlayVeil;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_LOADING_OVERLAY_DOCS.loadingOverlay.scenes, {
    playground: Playground,
    region: Region,
    page: Page,
    veil: Veil,
    sizes: Sizes,
    shapes: Shapes,
    timing: Timing,
    cancel: Cancel,
    focus: Focus,
    indicator: Indicator,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const family = moduleMetadata({
  imports: [
    SlLoadingOverlay,
    SlLoadingOverlayCancel,
    SlLoadingOverlayIndicator,
    TimingDemo,
    SlButton,
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlHeading,
    SlProgressBar,
    SlText,
    SlTextField,
  ],
  providers: [provideLoadingOverlayDefaults({})],
});

const meta: Meta<LoadingOverlayStoryArgs> = {
  title: 'Components/Loading overlay',
  component: SlLoadingOverlay,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Loading overlay',
        description:
          'Content that is already on the page, kept measured and taken out of reach until a wait the consumer owns has ended.',
        framework: 'Angular',
        ...ANGULAR_LOADING_OVERLAY_DOCS.loadingOverlay,
        tokens: ANGULAR_LOADING_OVERLAY_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<LoadingOverlayStoryArgs>;

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
  layout: 'row' | 'stack' | 'block' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

/** The form every demonstration covers, so one product is on the page. */
const billingAddress = `
  <div slCard>
    <div slCardHeader><h3 slHeading [level]="3">Billing address</h3></div>
    <div slCardBody>
      <div class="slotted-demo-stack">
        <div slTextField label="Street" value="12 Maple Street"></div>
        <div slTextField label="City" value="Boston"></div>
        <button slButton variant="solid">Save</button>
      </div>
    </div>
  </div>`;

const invoices = `
  <div class="slotted-demo-rows">
    <span>ACME Inc.</span><span>$1,240.00</span>
    <span>North Wind Stationery</span><span>$318.90</span>
    <span>Ironwood Construction</span><span>$24,700.00</span>
  </div>`;

export const Playground: Story = {
  args: {
    cancellable: false,
    loading: true,
    messages: { label: 'Saving changes' },
    scope: 'region',
    size: 'md',
    veil: 'wash',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div
    slLoadingOverlay
    [loading]="loading"
    [scope]="scope"
    [size]="size"
    [veil]="veil"
    [cancellable]="cancellable"
    [messages]="messages"
  >${billingAddress}</div>
</div>`,
  }),
};

export const Region: Story = {
  parameters: scenario('region'),
  render: () => ({
    template: scene(
      'A card mid-save',
      'The card keeps its height while it is covered, so nothing below it moves twice per save. Tab from the button above the canvas: the keyboard walks past the covered fields, because they are inert rather than dimmed.',
      `
        <div class="slotted-demo-row">
          <button slButton variant="outline">Focus starts here</button>
        </div>
        <div slLoadingOverlay [messages]="{ label: 'Saving changes' }">${billingAddress}</div>
        <span slText tone="muted">Nothing below the region moves while the wash is up.</span>`,
    ),
  }),
};

export const Page: Story = {
  parameters: scenario('page'),
  render: () => ({
    props: { closing: false },
    template: scene(
      'The whole application waits',
      'Reach for page scope only where partial interaction would be unsafe — a month-end close, not a row that is saving. The guide warns against making a page unreachable for a local operation.',
      `
        <div class="slotted-demo-stack">
          <button slButton variant="solid" (click)="closing = true">Close the period</button>
          <span slText tone="muted">
            The layer is portalled, every sibling of the portal root goes inert and the document
            scroll is locked. Press Escape to end this demonstration.
          </span>
          <div
            slLoadingOverlay
            scope="page"
            size="lg"
            [loading]="closing"
            cancellable
            [messages]="{ cancel: 'Interromper', label: 'Closing the accounting period' }"
            description="Do not close this tab. The ledger is locked until this finishes."
            (cancel)="closing = false"
          ></div>
        </div>`,
      'stack',
    ),
  }),
};

export const Veil: Story = {
  parameters: scenario('veil'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'wash',
        'The theme’s own scrim, restated per color scheme and turned opaque under forced colors. It is the same token dialog and drawer read, so three families dim a surface in one tint.',
        `<div slLoadingOverlay veil="wash" [messages]="{ label: 'Reconciling September' }">${invoices}</div>`,
      )}
      ${scene(
        'blur',
        'The wash and a backdrop filter together. Text under it stops being legible before it stops being visible, which is exactly the message the layer is carrying.',
        `<div slLoadingOverlay veil="blur" [messages]="{ label: 'Reconciling September' }">${invoices}</div>`,
      )}
      ${scene(
        'none',
        'Nothing is dimmed and nothing is reachable: the panel is what says so. It is the form to reach for when the wait is short enough that a wash would read as a flash.',
        `<div slLoadingOverlay veil="none" [messages]="{ label: 'Reconciling September' }">${invoices}</div>`,
      )}
    </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${(
        [
          [
            'sm',
            'The step for a table cell, a metric tile, a row: the mark is the height of a small control and the two lines take the small control type step.',
          ],
          [
            'md',
            'The default, and the step for a card or a panel. A wait beside a medium button is the height of that button, at every density.',
          ],
          [
            'lg',
            'The step for a region that owns the screen — a page-scoped layer, a full-width panel — where a small mark would be lost in the space around it.',
          ],
        ] as const
      )
        .map(([size, note]) =>
          scene(
            size,
            note,
            `<div
              slLoadingOverlay
              size="${size}"
              [messages]="{ label: 'Reconciling September' }"
              description="1 284 entries"
            >${invoices}</div>`,
          ),
        )
        .join('')}
    </div>`,
  }),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'A tall region takes a column',
        'The mark above the two lines above the control, centerd. It is the arrangement for a card, a panel or anything with room to spare in the block axis.',
        `<div
          slLoadingOverlay
          [messages]="{ label: 'Importing 4 812 rows' }"
          description="About a minute left."
          cancellable
        >${billingAddress}</div>`,
      )}
      ${scene(
        'A short region takes a bar',
        'Nothing is dropped: the mark moves beside the text, the two lines stack next to it, and the control goes to the end of the row. Sixty pixels tall carrying what the column carried.',
        `<div
          slLoadingOverlay
          [messages]="{ label: 'Importing 4 812 rows' }"
          description="About a minute left."
          cancellable
        >${invoices}</div>`,
      )}
      ${scene(
        'A small region keeps the mark',
        'Under 220 pixels across, or 88 down, the words go and the panel gives up its ground. They are not lost: the live region holds the same sentence, which is where it was doing the work for the reader who needed it.',
        `<div class="slotted-demo-measure">
          <div slLoadingOverlay [messages]="{ label: 'Loading the sparkline' }">
            <div slCard>
              <div slCardBody>
                <span slText tone="muted" size="sm">Receita</span>
                <h3 slHeading [level]="3">R$ 128 400</h3>
              </div>
            </div>
          </div>
        </div>`,
        'stack',
      )}
    </div>`,
  }),
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => ({
    template: scene(
      'Two flashes, and the two durations that prevent them',
      'Both default to zero, so a family that turns neither on schedules no timer. Set them once for the application through provideLoadingOverlayDefaults — latency is a property of the application, not of one overlay.',
      `<sl-loading-overlay-timing-demo />`,
    ),
  }),
};

export const Cancel: Story = {
  parameters: scenario('cancel'),
  render: () => ({
    props: { state: 'running' },
    template: scene(
      'A wait that has gone wrong',
      'Press Interromper, or Escape while focus is in the layer. The request carries the reason and the family commits nothing — the label changes because the application changed it, which is the only thing that knows the work has stopped.',
      `
        <div
            slLoadingOverlay
            [loading]="state !== 'idle'"
            cancellable
            [messages]="{ cancel: state === 'stopping' ? 'Interrompendo…' : 'Interromper', label: state === 'stopping' ? 'Rolling the batch back' : 'Importing 4 812 rows' }"
            [description]="
              state === 'stopping'
                ? 'Nothing has been committed.'
                : 'This usually takes about a minute.'
            "
            (cancel)="state = 'stopping'"
          >${invoices}</div>
        <div class="slotted-demo-row">
          <button slButton variant="outline" (click)="state = 'running'">
            Start the import again
          </button>
        </div>`,
    ),
  }),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => ({
    props: { saving: false },
    template: scene(
      'Where the keyboard goes',
      'Making an element inert while it holds focus drops focus to the body. None of the surveyed implementations has the defect because none of them makes anything inert; this one does, so it owns both halves of the move.',
      `
        <div class="slotted-demo-stack">
          <div
            slLoadingOverlay
            [loading]="saving"
            cancellable
            [minDuration]="1600"
            [messages]="{ label: 'Saving changes' }"
            (cancel)="saving = false"
            (reveal)="field.focus()"
          >
            <div slCard>
              <div slCardBody>
                <div class="slotted-demo-stack">
                  <input #field aria-label="Street" value="12 Maple Street" />
                  <button slButton variant="solid" (click)="saving = true">Save</button>
                </div>
              </div>
            </div>
          </div>
          <span slText tone="muted">
            Put the caret in the field, then press Save with the keyboard. Focus was inside
            content that is about to go inert, so it moves into the panel and comes back when the
            wait ends.
          </span>
        </div>`,
      'stack',
    ),
  }),
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => ({
    template: scene(
      'A wait with a number on it',
      'The mark is a projection slot and the default is the contained loader. A determinate wait projects progress-indicator’s own slProgressBar, and the family that owns a measured quantity draws it — this one has no value input and never will.',
      `
        <div slLoadingOverlay [messages]="{ label: 'Uploading contrato.pdf' }" description="2,4 MB of 3,9 MB">
          <div slLoadingOverlayIndicator slProgressBar [value]="62" label="Uploaded" hideLabel></div>
          ${invoices}
        </div>`,
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'A translated sentence',
        'Longer than the English one that was measured. The panel wraps it, keeps its own measure, and never truncates — the announcement holds the same sentence whole for the reader who would otherwise lose it.',
        `<div
          slLoadingOverlay
          [messages]="{ label: 'Reconciling the entries for the period against the imported bank statement', cancel: 'Stop' }"
          description="Stopping now would leave half the period reconciled."
          cancellable
        >${billingAddress}</div>`,
      )}
      ${scene(
        'One unbroken token',
        'A file name with nowhere to break. It wraps inside the panel rather than pushing the panel past the region it is centerd in.',
        `<div class="slotted-demo-measure">
          <div
            slLoadingOverlay
            size="sm"
            [messages]="{ label: 'Uploading conciliacao-bancaria-setembro-2026-consolidado-final.pdf' }"
          >${invoices}</div>
        </div>`,
        'stack',
      )}
    </div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'The region is the element the page already has',
        'The selector is a bare attribute, so the region is a section here rather than a div the family inserted. Your own attributes and listeners stay on it.',
        `<section slLoadingOverlay [messages]="{ label: 'Reconciling September' }">${invoices}</section>`,
      )}
      ${scene(
        'The control is the consumer’s own',
        'slLoadingOverlayCancel takes the part and the press. The family’s own control paint is written :not([data-ui]), so the slButton keeps its own — the part stays the part, and only the paint steps back.',
        `<div slLoadingOverlay [messages]="{ label: 'Importing 4 812 rows' }" cancellable>
          <button slLoadingOverlayCancel slButton variant="outline" size="sm">Interromper</button>
          ${invoices}
        </div>`,
      )}
      ${scene(
        'The instance, from the template',
        'exportAs reaches painted(), which is not the same signal as loading: with minDuration holding, the layer is still up after the data has arrived.',
        `<div slLoadingOverlay #overlay="slLoadingOverlay" [minDuration]="600" [messages]="{ label: 'Reconciling September' }">
          ${invoices}
        </div>
        <span slText tone="muted">painted(): {{ overlay.painted() }}</span>`,
      )}
    </div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'One wait, one announcement',
        'A visually-hidden role="status" holds the label while the layer blocks and is emptied afterwards, because emptying a live region announces nothing. loadedLabel opts into a second message.',
        `<div slLoadingOverlay [messages]="{ label: 'Saving changes' }" loadedLabel="Changes saved">
          ${billingAddress}
        </div>`,
      )}
      ${scene(
        'The wait can also be silent',
        'live="off" renders no live region at all, for a page that already announces the same wait somewhere else — a route transition that speaks for the whole screen, say.',
        `<div slLoadingOverlay live="off" [messages]="{ label: 'Saving changes' }">${invoices}</div>`,
      )}
    </div>`,
  }),
};
