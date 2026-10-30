import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlGrid } from './grid';
import { ANGULAR_GRID_DOCS, ANGULAR_GRID_TOKENS } from './grid.docs';
import type { GridAlign, GridColumns, GridGap, GridJustify, GridMinItemWidth } from './grid';

interface GridStoryArgs {
  align?: GridAlign;
  columns?: GridColumns;
  gap: GridGap;
  justify?: GridJustify;
  minItemWidth: GridMinItemWidth;
}

/**
 * Grid paints nothing, so the reference page supplies the edges. The cell and
 * the caption are demonstration devices and never part of the family.
 */
const demo = {
  cell: [
    'background: var(--slotted-surface-sunken)',
    'border: 1px solid var(--slotted-border-subtle)',
    'border-radius: var(--slotted-radius-sm)',
    'font-size: 12px',
    'padding: var(--slotted-space-4)',
  ].join('; '),
  caption: 'color: var(--slotted-text-muted); font-size: 11px',
  column: 'display: grid; gap: var(--slotted-space-8); grid-template-columns: minmax(0, 1fr)',
  row: 'display: grid; gap: var(--slotted-space-3); grid-template-columns: minmax(0, 1fr)',
  fill: 'inline-size: 100%',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const SECTIONS = ['Workspace settings', 'Members and roles', 'Billing history', 'Audit log'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Columns as never,
});

const meta: Meta<GridStoryArgs> = {
  title: 'Components/Grid',
  component: SlGrid,
  decorators: [moduleMetadata({ imports: [SlGrid] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Grid',
        description: 'Children across two axes, reflowing on the grid’s own inline size.',
        framework: 'Angular',
        ...ANGULAR_GRID_DOCS.grid,
        tokens: ANGULAR_GRID_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<GridStoryArgs>;

export const Playground: Story = {
  args: { gap: 6, minItemWidth: 'sm' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, demo, sections: SECTIONS },
    template: `
<div class="slotted-demo-stage" data-align="start">
  <div
    slGrid
    [gap]="gap"
    [columns]="columns"
    [minItemWidth]="minItemWidth"
    [align]="align"
    [justify]="justify"
    [style]="demo.fill"
  >
    @for (section of sections; track section) {
      <div [style]="demo.cell">{{ section }}</div>
    }
  </div>
</div>`,
  }),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: () => ({
    props: { demo, counts: [2, 3, 4], months: MONTHS },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A count is a ceiling</span>
      <span class="slotted-demo-scene__note">
        Each grid asks for the count in its caption and gets it while every cell stays at or above
        minItemWidth. Narrow the window and the count comes down on its own.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column + '; ' + demo.fill">
        @for (count of counts; track count) {
          <div [style]="demo.row">
            <span [style]="demo.caption">columns {{ count }}</span>
            <div slGrid [columns]="count" [gap]="2" minItemWidth="xs">
              @for (month of months; track month) {
                <div [style]="demo.cell">{{ month }}</div>
              }
            </div>
          </div>
        }
        <div [style]="demo.row">
          <span [style]="demo.caption">columns 3, with two children: the third track stays empty</span>
          <div slGrid [columns]="3" minItemWidth="xs">
            <div [style]="demo.cell">Revenue</div>
            <div [style]="demo.cell">Refunds</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Reflow: Story = {
  parameters: scenario('reflow'),
  render: () => ({
    props: { demo, minima: ['xs', 'sm', 'md'], sections: SECTIONS },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">As many tracks as fit</span>
      <span class="slotted-demo-scene__note">
        With no count, the narrowest a cell may become is the only thing deciding how many tracks
        there are. The grid measures itself, so one inside a narrow panel behaves like one inside a
        narrow window.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column + '; ' + demo.fill">
        @for (minimum of minima; track minimum) {
          <div [style]="demo.row">
            <span [style]="demo.caption">minItemWidth {{ minimum }}</span>
            <div slGrid [minItemWidth]="minimum">
              @for (section of sections; track section) {
                <div [style]="demo.cell">{{ section }}</div>
              }
            </div>
          </div>
        }
        <div [style]="demo.row">
          <span [style]="demo.caption">a token longer than the cell breaks instead of widening it</span>
          <div slGrid [columns]="2" minItemWidth="xs">
            <div [style]="demo.cell + '; overflow-wrap: anywhere'">
              postgresql://reporting-service&#64;analytics-primary.internal:5432/warehouse_events
            </div>
            <div [style]="demo.cell">Neighbour</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Inside the cell, on both axes</span>
      <span class="slotted-demo-scene__note">
        align positions a child across the flow and justify positions it along the flow, both inside
        its own cell. Neither distributes tracks: the tracks already fill the row.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column + '; ' + demo.fill">
        <div [style]="demo.row">
          <span [style]="demo.caption">align stretch · the platform default · cells share a height</span>
          <div slGrid [columns]="2" minItemWidth="xs">
            <div [style]="demo.cell + '; padding-block: var(--slotted-space-9)'">Taller cell</div>
            <div [style]="demo.cell">Shorter cell</div>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">align start · each cell keeps its own height</span>
          <div slGrid [columns]="2" minItemWidth="xs" align="start">
            <div [style]="demo.cell + '; padding-block: var(--slotted-space-9)'">Taller cell</div>
            <div [style]="demo.cell">Shorter cell</div>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">align center · justify center</span>
          <div slGrid [columns]="2" minItemWidth="xs" align="center" justify="center">
            <div [style]="demo.cell + '; padding-block: var(--slotted-space-9)'">Taller cell</div>
            <div [style]="demo.cell">Shorter cell</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { demo, items: ['First, and read first', 'Second', 'Third'] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A layout, not a widget</span>
      <span class="slotted-demo-scene__note">
        The selector is an attribute, so a ul stays a ul and a screen reader still announces a list
        of three items. There is no role="grid": that pattern is a composite widget with one tab
        stop and arrow-key navigation, and this family navigates nothing.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <ul slGrid [columns]="3" minItemWidth="xs" [style]="demo.fill + '; margin: 0; padding: 0'">
        @for (item of items; track item) {
          <li [style]="'list-style: none'">
            <div [style]="demo.cell">{{ item }}</div>
          </li>
        }
      </ul>
    </div>
  </section>
</div>`,
  }),
};
