import { serializeSavedViews, type SavedViewsState } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { SavedViews } from './saved-views';
import {
  BUILT_IN,
  HIGH,
  LATE,
  OrdersDesk,
  sortedByTotal,
  useMemoryStore,
  VIEWS,
  ViewsBar,
} from './saved-views-demo';
import { REACT_SAVED_VIEWS_DOCS, REACT_SAVED_VIEWS_TOKENS } from './saved-views.docs';
import type { SavedViewsHandle } from './saved-views.types';
import { usePersistedSavedViews } from './use-persisted-saved-views';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SAVED_VIEWS_DOCS.savedViews.scenes, {
    playground: Playground,
    'modified-and-revert': ModifiedAndRevert,
    'save-as': SaveAs,
    rename: Rename,
    delete: Delete,
    'default-view': DefaultView,
    'built-in': BuiltIn,
    persistence: Persistence,
    'with-data-grid': WithDataGrid,
    keyboard: Keyboard,
    accessibility: Accessibility,
    'long-names': LongNames,
  }) as never;

const meta = {
  title: 'Components/SavedViews',
  component: SavedViews,
  args: { builtIn: BUILT_IN, current: LATE },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Saved Views',
        description:
          'The named arrangements of a grid a reader keeps: the view in use on a trigger, a mark and a revert while the grid differs from it, and a panel to apply, save, save as, rename, delete and choose the view a visit opens on. The family applies nothing to the grid — it hands the consumer the view to write.',
        framework: 'React',
        ...REACT_SAVED_VIEWS_DOCS.savedViews,
        tokens: REACT_SAVED_VIEWS_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof SavedViews>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: () => <ViewsBar />,
};

export const ModifiedAndRevert: Story = {
  parameters: scenario('modified-and-revert'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Late orders, sorted by total"
        note="The dot and the word on the trigger, Revert beside it. Revert, or apply Late orders again, and the line goes back to the saved form."
      >
        <ViewsBar initialView={sortedByTotal(LATE)} />
      </Scene>
    </Grid>
  ),
};

export const SaveAs: Story = {
  parameters: scenario('save-as'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="From the view in use"
        note="Open the panel and press Save as new view…; submit it empty, then as “my region”, then as “Midwest backlog”."
      >
        <ViewsBar initialView={sortedByTotal(LATE)} />
      </Scene>
    </Grid>
  ),
};

export const Rename: Story = {
  parameters: scenario('rename'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Rename My region"
        note="The row’s menu, then Rename. Enter submits; Escape cancels the form and keeps the panel open."
      >
        <ViewsBar />
      </Scene>
    </Grid>
  ),
};

export const Delete: Story = {
  parameters: scenario('delete'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Delete the view in use"
        note="Delete Late orders from its menu and confirm: the trigger falls back to Default, and the line keeps the late-orders arrangement, now modified."
      >
        <ViewsBar />
      </Scene>
    </Grid>
  ),
};

export const DefaultView: Story = {
  parameters: scenario('default-view'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="High value opens every visit"
        note="The pin sits after High value. Choose Set as default on another row and the pin moves; the built-in view can take it back."
      >
        <ViewsBar
          defaultState={{ ...VIEWS, activeId: 'high', defaultId: 'high' }}
          initialView={HIGH}
        />
      </Scene>
    </Grid>
  ),
};

export const BuiltIn: Story = {
  parameters: scenario('built-in'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="On the application’s defaults"
        note="Default is in use: Save is disabled, the menu holds only Set as default. Sort by total, then Save as new view… to keep it."
      >
        <ViewsBar defaultState={{ ...VIEWS, activeId: null }} initialView={BUILT_IN} />
      </Scene>
    </Grid>
  ),
};

function PersistedBar() {
  const { data, storage } = useMemoryStore({
    'orders:views': serializeSavedViews(VIEWS),
  });
  const views = usePersistedSavedViews({ key: 'orders:views', storage });
  return (
    <Stack gap={4}>
      <SavedViews
        builtIn={BUILT_IN}
        current={LATE}
        onStateChange={views.onStateChange}
        state={views.state}
      />
      <TextField aria-label="The stored entry" mono readOnly value={data['orders:views'] ?? ''} />
    </Stack>
  );
}

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The entry, as it is written"
        note="Rename, delete or move the default: the JSON below is what the store holds after each change."
      >
        <PersistedBar />
      </Scene>
    </Grid>
  ),
};

export const WithDataGrid: Story = {
  parameters: scenario('with-data-grid'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Orders"
        note="The store opens on Late orders, the default. Sort, hide a column or search, then Revert or Save."
      >
        <OrdersDesk />
      </Scene>
    </Grid>
  ),
};

function Handled() {
  const views = useRef<SavedViewsHandle>(null);
  return (
    <Stack gap={4}>
      <Button onClick={() => views.current?.open()} size="sm" tone="secondary" variant="outline">
        Open the views
      </Button>
      <SavedViews builtIn={BUILT_IN} current={LATE} defaultState={VIEWS} ref={views} />
    </Stack>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="From the keyboard, and from the application"
        note="Tab to the trigger and press Enter, or press Open the views, which opens it through the handle."
      >
        <Handled />
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Translated once, named in context"
        // language: pt-BR
        note="SlottedProvider sets the Portuguese words for the subtree; aria-label names the group Visualizações de pedidos."
        // language: en-US
      >
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          {/* language: pt-BR */}
          <ViewsBar aria-label="Visualizações de pedidos" initialView={sortedByTotal(LATE)} />
          {/* language: en-US */}
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

const LONG: SavedViewsState = {
  views: [
    {
      id: 'mw',
      name: 'Late orders from the Midwest distributors awaiting carrier confirmation',
      view: VIEWS.views[0]!.view,
    },
    {
      id: 'ref',
      name: 'SO-2026-Q3-HELIOS-AUTOMATION-GMBH-PREPAID-OVER-10000-USD',
      view: VIEWS.views[2]!.view,
    },
  ],
  defaultId: 'mw',
  activeId: 'mw',
};

export const LongNames: Story = {
  parameters: scenario('long-names'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="At 360 pixels"
        note="The trigger cuts the name with an ellipsis and keeps it whole in title; the list wraps both names."
      >
        <Measure>
          <ViewsBar defaultState={LONG} initialView={sortedByTotal(LATE)} />
        </Measure>
      </Scene>
    </Grid>
  ),
};
