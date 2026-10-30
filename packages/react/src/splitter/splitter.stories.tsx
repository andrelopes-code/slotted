import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Badge } from '../badge';
import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Text } from '../typography';
import { Splitter } from './splitter';
import { SplitterDefaultsProvider } from './splitter-defaults';
import { Body, Region, Workspace } from './splitter-demo';
import { REACT_SPLITTER_DOCS, REACT_SPLITTER_TOKENS } from './splitter.docs';
import type { SplitterHandle } from './splitter.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SPLITTER_DOCS.splitter.scenes, {
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

const meta = {
  title: 'Components/Splitter',
  component: Splitter,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Splitter',
        description:
          'A focusable bar between two regions, and nothing else. It holds the position, the limits, the stops and the whole Window Splitter keyboard; it holds no layout, so the fraction is published as a custom property and one CSS rule turns it into a measure. Its limits take a fraction or a CSS length, which is the one thing none of the surveyed implementations can state.',
        framework: 'React',
        ...REACT_SPLITTER_DOCS.splitter,
        tokens: REACT_SPLITTER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Splitter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A line of its own.
 *
 * `Text` renders a `span`, so a column of them is one paragraph with no spaces
 * in it: the first capture of this page read
 * "Accounts receivableOverdue · 14Due in 7 days · 32". `drawer.stories.tsx`
 * records the same defect from its own first publish, which is how this one is
 * a repeat rather than a discovery.
 */
function Line({
  children,
  id,
  tone,
  weight,
  size = 'sm',
}: {
  children: ReactNode;
  id?: string;
  tone?: 'muted';
  weight?: 'semibold';
  size?: 'sm' | 'lg';
}) {
  return (
    <Text id={id} render={(props) => <p {...props} />} size={size} tone={tone} weight={weight}>
      {children}
    </Text>
  );
}

/** One account, as the product's own navigation lists them. */
function Accounts({ children }: { children?: ReactNode }) {
  return (
    <Region>
      <Line size="sm" weight="semibold">
        Contas a receber
      </Line>
      <Line size="sm" tone="muted">
        Vencidas · 14
      </Line>
      <Line size="sm" tone="muted">
        A vencer em 7 dias · 32
      </Line>
      <Line size="sm" tone="muted">
        Reconciling · 3
      </Line>
      {children}
    </Region>
  );
}

function Invoice({ children }: { children?: ReactNode }) {
  return (
    <Body>
      <Line size="lg" weight="semibold">
        Invoice 20,483 · Boise Metalworks LLC
      </Line>
      <Line size="sm" tone="muted">
        Issued 09/02/2026 · due 10/02/2026 · $18,420.00
      </Line>
      <Badge tone="warning">Overdue by 9 days</Badge>
      {children}
    </Body>
  );
}

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="0.34 · no limits · no stops"
        note="The simplest configuration the family has: an initial fraction and nothing else. Everything the other scenes add — limits, stops, collapse — is optional on top of this."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Accounts list width" defaultValue={0.34} />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="vertical — two regions side by side"
        note="The line is vertical and responds to the left and right arrows. The vertical arrows stay with the page: a scrolling document keeps scrolling with focus on the bar."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" defaultValue={0.38} />
          <Invoice />
        </Workspace>
      </Scene>
      <Scene
        label="horizontal — two regions stacked"
        note="The line is horizontal and responds to the up and down arrows. The grip rotates with it: three dots of height become three of width."
      >
        <Workspace orientation="horizontal">
          <Accounts />
          <Splitter aria-label="Entries height" defaultValue={0.42} orientation="horizontal" />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

function Controlled() {
  const [value, setValue] = useState(0.3);

  return (
    <Workspace>
      <Accounts>
        <Line size="sm" tone="muted">
          {Math.round(value * 100)}% do contentor
        </Line>
      </Accounts>
      <Splitter
        aria-label="Largura das contas"
        onValueChange={(next) => setValue(next)}
        value={value}
      />
      <Invoice>
        <Button onClick={() => setValue(0.5)} size="sm" variant="outline">
          Set to the middle by code
        </Button>
      </Invoice>
    </Workspace>
  );
}

export const Value: Story = {
  parameters: scenario('value'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Uncontrolled — the measure lives in CSS"
        note="Nothing stores the number. The bar writes --slotted-splitter-value on the region, and a one-line rule turns it into a measure; the page has no state at all for this bar."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" defaultValue={0.34} />
          <Invoice />
        </Workspace>
      </Scene>
      <Scene
        label="Controlled — the measure lives in the application"
        note="The same drawing with the number in state: the percentage printed on the left and the position of the bar cannot disagree, because they are the same value."
      >
        <Controlled />
      </Scene>
    </Grid>
  ),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Floor in pixels"
        note="Drag all the way to the left: the region stops at two hundred pixels, and keeps stopping there when the window narrows. None of the seven implementations surveyed can express this — Zag says it in its own words."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" defaultValue={0.34} min="200px" />
          <Invoice />
        </Workspace>
      </Scene>
      <Scene
        label="Ceiling as a fraction"
        note="Drag all the way to the right: it stops at sixty percent of the container, and the limit follows the window without anyone recalculating it. Both limits accept either unit."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" defaultValue={0.34} max={0.6} min="200px" />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Collapses until it disappears"
        note="Reach the bar with Tab and press Enter: the region closes. Press again and it returns to the fraction it had, not to an arbitrary one — the previous position is stored by the family itself."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" collapsible defaultValue={0.34} />
          <Invoice />
        </Workspace>
      </Scene>
      <Scene
        label="Collapses to a strip"
        note="The same Enter, with collapsedValue: the region shrinks to six percent instead of closing. It is where a navigation that turns into icons only stops."
      >
        <Workspace>
          <Accounts />
          <Splitter
            aria-label="Largura das contas"
            collapsedValue={0.06}
            collapsible
            defaultValue={0.34}
          />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

export const SnapPoints: Story = {
  parameters: scenario('snapPoints'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="snapPoints={[0.2, 0.34, 0.5]}"
        note="Notice when it snaps: during the drag the bar follows the pointer exactly, and only jumps on release. With stops declared, the arrows stop moving sixteen pixels and move from stop to stop."
      >
        <Workspace>
          <Accounts />
          <Splitter
            aria-label="Largura das contas"
            defaultValue={0.34}
            snapPoints={[0.2, 0.34, 0.5]}
          />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

export const Reset: Story = {
  parameters: scenario('reset'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="defaultValue={0.34}"
        note="The same number serves as the starting point and as the reset target, which is why there is no second input for it. Enter, which collapses, goes elsewhere — the two gestures do not compete."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" defaultValue={0.34} />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="disabled, with value={0.34}"
        note="Reach it with Tab: focus stops here all the same. This is deliberate — removing the tab stop would also remove the announced value, and whoever cannot move a separator still needs to know where it is."
      >
        <Workspace>
          <Accounts />
          <Splitter aria-label="Largura das contas" disabled value={0.34} />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

function Announced() {
  const [value, setValue] = useState(0.4);

  return (
    <Workspace>
      <Accounts />
      <Splitter
        aria-label="Largura das contas"
        collapsible
        max={0.75}
        min={0.15}
        onValueChange={(next) => setValue(next)}
        value={value}
      />
      <Invoice>
        <Line size="sm" tone="muted">
          aria-valuenow={Math.round(value * 100)} · aria-valuemin=15 · aria-valuemax=75
        </Line>
      </Invoice>
    </Workspace>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="min={0.15} · max={0.75} · collapsible"
        note="The line printed on the right is what a screen reader says. Press Home and End to see that it stops at 15 and 75, not at 0 and 100: the reported value is the already clamped one, so the announcement and the layout cannot disagree."
      >
        <Announced />
      </Scene>
    </Grid>
  ),
};

function Workspace3() {
  const toc = useRef<HTMLElement>(null);
  const document = useRef<HTMLElement>(null);

  return (
    <div className="slotted-demo-viewport" data-size="tall">
      <div className="slotted-demo-workspace">
        <Region ref={toc}>
          <Line size="sm" weight="semibold">
            Contents
          </Line>
          <Line size="sm" tone="muted">
            Bank reconciliation
          </Line>
          <Line size="sm" tone="muted">
            Automatic posting
          </Line>
        </Region>
        <Splitter aria-label="Contents width" defaultValue={0.24} for={toc} max={0.4} min="180px" />
        <Body>
          <Line size="lg" weight="semibold">
            Reconciliation procedure
          </Line>
          <Line size="sm" tone="muted">
            Each bar clamps against its own limits and none negotiates with the other: whoever owns
            the layout owns the policy.
          </Line>
        </Body>
        <Splitter
          aria-label="Largura das notas"
          defaultValue={0.78}
          for={document}
          max={0.85}
          min={0.4}
        />
        <Region>
          <Line size="sm" weight="semibold">
            Notas
          </Line>
          <Line size="sm" tone="muted">
            Revisto por Auditoria em 08/09.
          </Line>
        </Region>
      </div>
    </div>
  );
}

export const TwoBars: Story = {
  parameters: scenario('twoBars'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two bars, three regions"
        note="Push the first bar all the way to the right and then try to move the second: it does not take ground from its neighbor. This is the written cost of the decision not to hold panels — whoever owns the layout owns the policy, and here the consumer chose to have none."
      >
        <Workspace3 />
      </Scene>
    </Grid>
  ),
};

function Persisted() {
  const [saved, setSaved] = useState(0.34);
  const [value, setValue] = useState(saved);

  return (
    <Workspace>
      <Accounts />
      <Splitter
        aria-label="Largura das contas"
        onResizeEnd={(next) => setSaved(next)}
        onValueChange={(next) => setValue(next)}
        value={value}
      />
      <Invoice>
        <Line size="sm" tone="muted">
          Guardado: {Math.round(saved * 100)}% · em movimento: {Math.round(value * 100)}%
        </Line>
        <Button onClick={() => setValue(saved)} size="sm" variant="outline">
          Recarregar a partir do guardado
        </Button>
      </Invoice>
    </Workspace>
  );
}

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="onResizeEnd, next to onValueChange"
        note="The two numbers on the right are the same value read at two moments. Drag slowly and watch the top one change every frame while the bottom one stays still until release: that difference separates one write to storage from sixty."
      >
        <Persisted />
      </Scene>
    </Grid>
  ),
};

function Composed() {
  const handle = useRef<SplitterHandle>(null);

  return (
    <Workspace>
      <Accounts />
      <Splitter
        aria-label="Largura das contas"
        collapsible
        defaultValue={0.34}
        ref={handle}
        render={(props) => <section {...props} />}
      />
      <Invoice>
        <Button onClick={() => handle.current?.collapse()} size="sm" variant="outline">
          collapse()
        </Button>
        <Button onClick={() => handle.current?.expand()} size="sm" variant="outline">
          expand()
        </Button>
        <Button onClick={() => handle.current?.reset()} size="sm" variant="ghost">
          reset()
        </Button>
      </Invoice>
    </Workspace>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Another element, and the imperative handle"
        note="The bar is drawn as a section through render, and the two lines and the handle travel with it. The buttons drive the handle, which is what a breakpoint needs to collapse without duplicating the clamp."
      >
        <Composed />
      </Scene>
      <Scene
        label="The consumer’s handler overrules the family’s"
        note="This bar calls preventDefault() in its own onKeyDown: the arrows and Enter stop moving it, and the pointer still moves it. Composed, never replaced."
      >
        <Workspace>
          <Accounts />
          <Splitter
            aria-label="Largura das contas"
            defaultValue={0.34}
            onKeyDown={(event) => event.preventDefault()}
          />
          <Invoice />
        </Workspace>
      </Scene>
    </Grid>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Inherits the floor from the provider"
        note="This bar declares no min and stops at two hundred pixels all the same, because the provider around it declared it once for the whole application."
      >
        <SplitterDefaultsProvider min="200px">
          <Workspace>
            <Accounts />
            <Splitter aria-label="Largura das contas" defaultValue={0.34} />
            <Invoice />
          </Workspace>
        </SplitterDefaultsProvider>
      </Scene>
      <Scene
        label="Declares its own and wins"
        note="Inside the same provider, a bar that declares min={0.05} goes much lower: an explicit consumer value always beats the inherited one."
      >
        <SplitterDefaultsProvider min="200px">
          <Workspace>
            <Accounts />
            <Splitter aria-label="Largura das contas" defaultValue={0.34} min={0.05} />
            <Invoice />
          </Workspace>
        </SplitterDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

function Named() {
  const region = useRef<HTMLElement>(null);

  return (
    <Workspace>
      <Region ref={region}>
        <Line id="contas-heading" size="sm" weight="semibold">
          Contas a receber
        </Line>
        <Line size="sm" tone="muted">
          The separator takes its name from this heading.
        </Line>
      </Region>
      <Splitter aria-labelledby="contas-heading" defaultValue={0.34} for={region} />
      <Invoice>
        <Line size="sm" tone="muted">
          role=separator · tabindex=0 · aria-orientation=vertical · aria-controls points to the
          region
        </Line>
      </Invoice>
    </Workspace>
  );
}

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="aria-labelledby, pointed at the region heading"
        note="Inspect the bar: aria-controls points to the aside and aria-labelledby to the h3 inside it. They are the same element by construction, because for hands over only one — what is heard and what is seen cannot diverge."
      >
        <Named />
      </Scene>
    </Grid>
  ),
};
