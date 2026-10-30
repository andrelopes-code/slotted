import { SlButton } from '@slotted/angular/button';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlSplitter } from './splitter';
import { provideSplitterDefaults } from './splitter-defaults';
import { ANGULAR_SPLITTER_DOCS, ANGULAR_SPLITTER_TOKENS } from './splitter.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SPLITTER_DOCS.splitter.scenes, {
    playground: Playground,
    orientation: Orientation,
    value: Value,
    limits: Limits,
    collapse: Collapse,
    snapPoints: SnapPoints,
    reset: Reset,
    disabled: Disabled,
    keyboard: Keyboard,
    twoBars: TwoBars,
    persistence: Persistence,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<Record<string, never>> = {
  title: 'Components/Splitter',
  component: SlSplitter,
  decorators: [moduleMetadata({ imports: [SlSplitter, SlButton, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Splitter',
        description:
          'A focusable bar between two regions, and nothing else. It holds the position, the limits, the stops and the whole Window Splitter keyboard; it holds no layout, so the fraction is published as a custom property and one CSS rule turns it into a measure. Its limits take a fraction or a CSS length, which is the one thing none of the surveyed implementations can state.',
        framework: 'Angular',
        ...ANGULAR_SPLITTER_DOCS.splitter,
        tokens: ANGULAR_SPLITTER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<Record<string, never>>;

/**
 * The ground a separator is demonstrated on: two regions and a movable
 * boundary, from `.slotted-demo-workspace` in the workbench. A bar with nothing
 * either side of it shows nothing, and regions painted here would be the inline
 * style `specs/reference-pages.test.mjs` refuses.
 */
const workspace = (body: string, orientation: 'vertical' | 'horizontal' = 'vertical') =>
  `<div class="slotted-demo-viewport" data-size="tall">
    <div class="slotted-demo-workspace" data-orientation="${orientation}">${body}</div>
  </div>`;

const accounts = (extra = '') =>
  `<aside class="slotted-demo-workspace__region">
    <p slText size="sm" weight="semibold">Contas a receber</p>
    <p slText size="sm" tone="muted">Overdue · 14</p>
    <p slText size="sm" tone="muted">Due in 7 days · 32</p>
    <p slText size="sm" tone="muted">In reconciliation · 3</p>
    ${extra}
  </aside>`;

const invoice = (extra = '') =>
  `<main class="slotted-demo-workspace__body">
    <p slText size="lg" weight="semibold">Invoice 20 483 · Goodview Metalworks Inc.</p>
    <p slText size="sm" tone="muted">Issued on 09/02/2026 · due 10/02/2026 · $18,420.00</p>
    ${extra}
  </main>`;

const scene = (label: string, note: string, body: string) =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (columns: 1 | 2, body: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${body}</div>`;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({
    template: grid(
      1,
      scene(
        '0.34 · no limits · no stops',
        'The simplest configuration the family has: an initial fraction and nothing more. Everything the other scenes add — limits, stops, collapse — is optional on top of this.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Account list width" [value]="0.34"></div>
          ${invoice()}`,
        ),
      ),
    ),
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    template: grid(
      2,
      scene(
        'vertical — two regions side by side',
        'The line is vertical and responds to the left and right arrows. The vertical arrows stay with the page: a scrolling document keeps scrolling with focus on the bar.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" [value]="0.38"></div>
          ${invoice()}`,
        ),
      ) +
        scene(
          'horizontal — two stacked regions',
          'The line is horizontal and responds to the up and down arrows. The grip rotates with it: three dots of height become three of width.',
          workspace(
            `${accounts()}
            <div slSplitter aria-label="Entries height" orientation="horizontal" [value]="0.42"></div>
            ${invoice()}`,
            'horizontal',
          ),
        ),
    ),
  }),
};

export const Value: Story = {
  parameters: scenario('value'),
  render: () => ({
    props: { width: 0.3 },
    template: grid(
      2,
      scene(
        'Uncontrolled — the measure lives in CSS',
        'Nothing stores the number. The bar writes --slotted-splitter-value on the region, and a one-line rule turns it into a measure; the component has no state at all for this bar.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" [value]="0.34"></div>
          ${invoice()}`,
        ),
      ) +
        scene(
          'Two-way — the measure lives in the component',
          'The same design with [(value)]: the percentage printed on the left and the position of the bar cannot disagree, because they are the same signal.',
          workspace(
            `${accounts('<p slText size="sm" tone="muted">{{ width * 100 | number: \'1.0-0\' }}% of the container</p>')}
            <div slSplitter aria-label="Accounts width" [(value)]="width"></div>
            ${invoice('<button slButton size="sm" variant="outline" (click)="width = 0.5">Center from code</button>')}`,
          ),
        ),
    ),
  }),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Floor in pixels',
        'Drag to the end, on the left: the region stops at two hundred pixels, and keeps stopping there when the window narrows. None of the seven implementations surveyed can express this — Zag says it in its own words.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" min="200px" [value]="0.34"></div>
          ${invoice()}`,
        ),
      ) +
        scene(
          'Ceiling as a fraction',
          'Drag to the end, on the right: it stops at sixty percent of the container, and the limit follows the window with nobody recalculating it. Both limits accept either unit.',
          workspace(
            `${accounts()}
            <div slSplitter aria-label="Largura das contas" min="200px" [max]="0.6" [value]="0.34"></div>
            ${invoice()}`,
          ),
        ),
    ),
  }),
};

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Collapses until it disappears',
        'Reach the bar with Tab and press Enter: the region closes. Press again and it returns to the fraction it had, not to an arbitrary one — the previous position is stored by the family itself.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" collapsible [value]="0.34"></div>
          ${invoice()}`,
        ),
      ) +
        scene(
          'Collapses to a strip',
          'The same Enter, with collapsedValue: the region shrinks to six percent instead of closing. It is where a navigation that turns into icons only stops.',
          workspace(
            `${accounts()}
            <div slSplitter aria-label="Largura das contas" collapsible [collapsedValue]="0.06" [value]="0.34"></div>
            ${invoice()}`,
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
        '[snapPoints]="[0.2, 0.34, 0.5]"',
        'Notice when it snaps: during the drag the bar follows the pointer exactly, and only on release does it jump. With declared stops the arrows stop moving sixteen pixels and move from stop to stop.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" [snapPoints]="[0.2, 0.34, 0.5]" [value]="0.34"></div>
          ${invoice()}`,
        ),
      ),
    ),
  }),
};

export const Reset: Story = {
  parameters: scenario('reset'),
  render: () => ({
    template: grid(
      1,
      scene(
        'reset(), and the double click that does the same',
        'The button and the double click on the bar go to the same place, which is the initial value of the model. Enter, which collapses, goes to another — the two gestures do not compete for the same destination.',
        workspace(
          `${accounts()}
          <div slSplitter #bar="slSplitter" aria-label="Largura das contas" [value]="0.34"></div>
          ${invoice('<button slButton size="sm" variant="outline" (click)="bar.reset()">reset()</button>')}`,
        ),
      ),
    ),
  }),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => ({
    template: grid(
      1,
      scene(
        'disabled, with [value]="0.34"',
        'Reach it with Tab: focus stops here all the same. This is deliberate — removing the tab stop would also remove the announced value, and someone who cannot move a separator still needs to know where it is.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" disabled [value]="0.34"></div>
          ${invoice()}`,
        ),
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { width: 0.4 },
    template: grid(
      1,
      scene(
        '[min]="0.15" · [max]="0.75" · collapsible',
        'The line printed on the right is what a screen reader says. Press Home and End to see it stop at 15 and 75, not at 0 and 100: the reported value is the already clamped one, so the announcement and the layout cannot disagree.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" collapsible [min]="0.15" [max]="0.75" [(value)]="width"></div>
          ${invoice('<p slText size="sm" tone="muted">aria-valuenow={{ width * 100 | number: \'1.0-0\' }} · aria-valuemin=15 · aria-valuemax=75</p>')}`,
        ),
      ),
    ),
  }),
};

export const TwoBars: Story = {
  parameters: scenario('twoBars'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Two bars, three regions',
        'Push the first bar all the way to the right and then try to move the second: it does not yield ground to its neighbor. It is the written cost of the decision not to hold panels — whoever owns the layout owns the policy, and here the consumer chose to have none.',
        `<div class="slotted-demo-viewport" data-size="tall">
          <div class="slotted-demo-workspace">
            <aside class="slotted-demo-workspace__region" #toc>
              <p slText size="sm" weight="semibold">Contents</p>
              <p slText size="sm" tone="muted">Bank reconciliation</p>
              <p slText size="sm" tone="muted">Automatic write-off</p>
            </aside>
            <div slSplitter aria-label="Contents width" [for]="toc" min="180px" [max]="0.4" [value]="0.24"></div>
            <main class="slotted-demo-workspace__body" #doc>
              <p slText size="lg" weight="semibold">Reconciliation procedure</p>
              <p slText size="sm" tone="muted">Each bar clamps against its own limits and neither negotiates with the other.</p>
            </main>
            <div slSplitter aria-label="Notes width" [for]="doc" [min]="0.4" [max]="0.85" [value]="0.78"></div>
            <aside class="slotted-demo-workspace__region">
              <p slText size="sm" weight="semibold">Notas</p>
              <p slText size="sm" tone="muted">Revisto por Auditoria em 08/09.</p>
            </aside>
          </div>
        </div>`,
      ),
    ),
  }),
};

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () => ({
    props: { saved: 0.34, width: 0.34 },
    template: grid(
      1,
      scene(
        '(resizeEnd), next to [(value)]',
        'The two numbers on the right are the same value read at two moments. Drag slowly and watch the top one change every frame while the bottom one stays still until release: that difference separates one storage write from sixty.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" [(value)]="width" (resizeEnd)="saved = $event"></div>
          ${invoice(
            `<p slText size="sm" tone="muted">Guardado: {{ saved * 100 | number: '1.0-0' }}% · em movimento: {{ width * 100 | number: '1.0-0' }}%</p>
            <button slButton size="sm" variant="outline" (click)="width = saved">Recarregar a partir do guardado</button>`,
          )}`,
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The instance the template reaches',
        'The bar is a directive, so it is written on whatever element the layout wanted there — here a section. The buttons drive the instance through exportAs, which is what a breakpoint needs to collapse without duplicating the clamp.',
        workspace(
          `${accounts()}
          <section slSplitter #bar="slSplitter" aria-label="Largura das contas" collapsible [value]="0.34"></section>
          ${invoice(
            `<button slButton size="sm" variant="outline" (click)="bar.collapse()">collapse()</button>
            <button slButton size="sm" variant="outline" (click)="bar.expand()">expand()</button>
            <button slButton size="sm" variant="ghost" (click)="bar.reset()">reset()</button>`,
          )}`,
        ),
      ) +
        scene(
          'An attribute the author wrote survives',
          'This bar brings its own aria-label and its own tabindex, read with HostAttributeToken before the host bindings run. A binding that resolved to null would erase what the author wrote.',
          workspace(
            `${accounts()}
            <div slSplitter aria-label="Workspace divider" tabindex="0" [value]="0.34"></div>
            ${invoice()}`,
          ),
        ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  decorators: [moduleMetadata({ providers: [provideSplitterDefaults({ min: '200px' })] })],
  render: () => ({
    template: grid(
      2,
      scene(
        'Inherits the provider’s floor',
        'This bar declares no min and stops at two hundred pixels all the same, because provideSplitterDefaults declared it once for the whole application.',
        workspace(
          `${accounts()}
          <div slSplitter aria-label="Largura das contas" [value]="0.34"></div>
          ${invoice()}`,
        ),
      ) +
        scene(
          'Declares its own and wins',
          'Under the same provider, a bar that declares [min]="0.05" goes much lower: an explicit consumer value always wins over the inherited one.',
          workspace(
            `${accounts()}
            <div slSplitter aria-label="Largura das contas" [min]="0.05" [value]="0.34"></div>
            ${invoice()}`,
          ),
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
        'aria-labelledby, pointed at the region title',
        'Inspect the bar: aria-controls points to the aside and aria-labelledby to the title inside it. They are the same element by construction, because [for] hands over only one — what is heard and what is seen cannot diverge.',
        `<div class="slotted-demo-viewport" data-size="tall">
          <div class="slotted-demo-workspace">
            <aside class="slotted-demo-workspace__region" #region>
              <p slText size="sm" weight="semibold" id="accounts-heading">Accounts receivable</p>
              <p slText size="sm" tone="muted">The separator takes its name from this title.</p>
            </aside>
            <div slSplitter [for]="region" aria-labelledby="accounts-heading" [value]="0.34"></div>
            ${invoice('<p slText size="sm" tone="muted">role=separator · tabindex=0 · aria-orientation=vertical · aria-controls points to the region</p>')}
          </div>
        </div>`,
      ),
    ),
  }),
};
