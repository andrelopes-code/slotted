import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

import { Grid } from './grid';
import { REACT_GRID_DOCS, REACT_GRID_TOKENS } from './grid.docs';
import type { GridColumns, GridMinItemWidth } from './grid.types';

/**
 * Grid paints nothing, so the reference page supplies the edges. The cell is a
 * demonstration device and never part of the family.
 */
function Cell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--slotted-surface-sunken)',
        border: '1px solid var(--slotted-border-subtle)',
        borderRadius: 'var(--slotted-radius-sm)',
        color: 'var(--slotted-text)',
        fontSize: '12px',
        padding: 'var(--slotted-space-4)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--slotted-text-muted)', fontSize: '11px' }}>{children}</span>;
}

const column: CSSProperties = {
  display: 'grid',
  gap: 'var(--slotted-space-8)',
  gridTemplateColumns: 'minmax(0, 1fr)',
  inlineSize: '100%',
};
const row: CSSProperties = { ...column, gap: 'var(--slotted-space-3)' };

const COUNTS: readonly GridColumns[] = [2, 3, 4];
const MINIMA: readonly GridMinItemWidth[] = ['xs', 'sm', 'md'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const SECTIONS = ['Workspace settings', 'Members and roles', 'Billing history', 'Audit log'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Columns as never,
});

const meta = {
  title: 'Components/Grid',
  component: Grid,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Grid',
        description: 'Children across two axes, reflowing on the grid’s own inline size.',
        framework: 'React',
        ...REACT_GRID_DOCS.grid,
        tokens: REACT_GRID_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { gap: 6, minItemWidth: 'sm' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start">
      <Grid {...args} style={{ inlineSize: '100%' }}>
        {SECTIONS.map((section) => (
          <Cell key={section}>{section}</Cell>
        ))}
      </Grid>
    </div>
  ),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A count is a ceiling</span>
          <span className="slotted-demo-scene__note">
            Each grid asks for the count in its caption and gets it while every cell stays at or
            above minItemWidth. Narrow the window and the count comes down on its own.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            {COUNTS.map((count) => (
              <div key={count} style={row}>
                <Caption>columns {count}</Caption>
                <Grid columns={count} gap={2} minItemWidth="xs">
                  {MONTHS.map((month) => (
                    <Cell key={month}>{month}</Cell>
                  ))}
                </Grid>
              </div>
            ))}
            <div style={row}>
              <Caption>columns 3, with two children: the third track stays empty</Caption>
              <Grid columns={3} minItemWidth="xs">
                <Cell>Revenue</Cell>
                <Cell>Refunds</Cell>
              </Grid>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Reflow: Story = {
  parameters: scenario('reflow'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">As many tracks as fit</span>
          <span className="slotted-demo-scene__note">
            With no count, the narrowest a cell may become is the only thing deciding how many
            tracks there are. The grid measures itself, so one inside a narrow panel behaves like
            one inside a narrow window.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            {MINIMA.map((minimum) => (
              <div key={minimum} style={row}>
                <Caption>minItemWidth {minimum}</Caption>
                <Grid minItemWidth={minimum}>
                  {SECTIONS.map((section) => (
                    <Cell key={section}>{section}</Cell>
                  ))}
                </Grid>
              </div>
            ))}
            <div style={row}>
              <Caption>a token longer than the cell breaks instead of widening it</Caption>
              <Grid columns={2} minItemWidth="xs">
                <Cell style={{ overflowWrap: 'anywhere' }}>
                  postgresql://reporting-service@analytics-primary.internal:5432/warehouse_events
                </Cell>
                <Cell>Neighbour</Cell>
              </Grid>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Inside the cell, on both axes</span>
          <span className="slotted-demo-scene__note">
            align positions a child across the flow and justify positions it along the flow, both
            inside its own cell. Neither distributes tracks: the tracks already fill the row.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>align stretch · the platform default · cells share a height</Caption>
              <Grid columns={2} minItemWidth="xs">
                <Cell style={{ paddingBlock: 'var(--slotted-space-9)' }}>Taller cell</Cell>
                <Cell>Shorter cell</Cell>
              </Grid>
            </div>
            <div style={row}>
              <Caption>align start · each cell keeps its own height</Caption>
              <Grid align="start" columns={2} minItemWidth="xs">
                <Cell style={{ paddingBlock: 'var(--slotted-space-9)' }}>Taller cell</Cell>
                <Cell>Shorter cell</Cell>
              </Grid>
            </div>
            <div style={row}>
              <Caption>align center · justify center</Caption>
              <Grid align="center" columns={2} justify="center" minItemWidth="xs">
                <Cell style={{ paddingBlock: 'var(--slotted-space-9)' }}>Taller cell</Cell>
                <Cell>Shorter cell</Cell>
              </Grid>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A layout, not a widget</span>
          <span className="slotted-demo-scene__note">
            Rendering into a ul keeps the list semantics a screen reader announces. There is no
            role=&quot;grid&quot;: that pattern is a composite widget with one tab stop and
            arrow-key navigation, and this family navigates nothing.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Grid
            columns={3}
            minItemWidth="xs"
            render={(props) => <ul {...props} style={{ ...props.style, margin: 0, padding: 0 }} />}
            style={{ inlineSize: '100%' }}
          >
            {['First, and read first', 'Second', 'Third'].map((label) => (
              <li key={label} style={{ listStyle: 'none' }}>
                <Cell>{label}</Cell>
              </li>
            ))}
          </Grid>
        </div>
      </section>
    </div>
  ),
};
