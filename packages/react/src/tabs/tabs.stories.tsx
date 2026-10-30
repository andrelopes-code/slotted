import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Toolbar } from '../toolbar';
import { Text } from '../typography';
import { Tabs } from './tabs';
import { TabsDefaultsProvider } from './tabs-defaults';
import { Tab, TabActions, TabList, TabPanel } from './tabs-parts';
import { REACT_TABS_DOCS, REACT_TABS_TOKENS } from './tabs.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TABS_DOCS.tabs.scenes, {
    playground: Playground,
    activation: Activation,
    orientation: Orientation,
    variant: Variant,
    sizes: Sizes,
    fit: Fit,
    states: States,
    mount: Mount,
    dismissible: Dismissible,
    overflow: Overflow,
    links: Links,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tabs',
        description:
          'One view out of several, and the panels under it. The APG’s whole keyboard table, a marker that moves without a layout read, tabs a reader can close, and a list that scrolls rather than truncating.',
        framework: 'React',
        ...REACT_TABS_DOCS.tabs,
        tokens: REACT_TABS_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const VIEWS = [
  { label: 'Summary', panel: 'Delivery expected on September 12.', value: 'summary' },
  { label: 'Items', panel: 'Three items, two being picked.', value: 'items' },
  { label: 'Payment', panel: 'Credit card, approved.', value: 'payment' },
];

function Order(props: Record<string, unknown>) {
  return (
    <Tabs defaultValue="summary" {...props}>
      <TabList aria-label="Order">
        {VIEWS.map((view) => (
          <Tab key={view.value} value={view.value}>
            {view.label}
          </Tab>
        ))}
      </TabList>
      {VIEWS.map((view) => (
        <TabPanel key={view.value} value={view.value}>
          <Text size="sm">{view.panel}</Text>
        </TabPanel>
      ))}
    </Tabs>
  );
}

export const Playground: Story = {
  args: {
    activation: 'automatic',
    disabled: false,
    fit: 'auto',
    loop: true,
    mount: 'active',
    orientation: 'horizontal',
    size: 'md',
    variant: 'line',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Order {...args} />
    </div>
  ),
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Automatic, the default"
        note="Arrow along the list: every tab opens as focus reaches it, which is what the APG recommends while the panels are already loaded."
      >
        <Order />
      </Scene>
      <Scene
        label="Manual, for a panel that fetches"
        note="Focus moves and the panel stays; Enter or Space opens the one focus is on, so arrowing past four tabs makes no four requests."
      >
        <Order activation="manual" />
      </Scene>
    </Grid>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A row of views"
        note="The track runs under the whole list and the marker sits on it, so the selected label and the edge of the panel are one line."
      >
        <Order />
      </Scene>
      <Scene
        label="A column of them"
        note="The track and the marker turn a quarter, the labels read down their own start edge, and the panel takes the second column."
      >
        <Order orientation="vertical" />
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Line"
        note="A row of labels over a hairline. The marker covers the track exactly, so the two lines read as one that thickens where the selection is."
      >
        <Order />
      </Scene>
      <Scene
        label="Contained"
        note="A sunken track that hugs its tabs, with a surface under the selected one. The marker stays, which is what the high-contrast scheme is left with once every fill flattens."
      >
        <Order variant="contained" />
      </Scene>
      <Scene
        label='track="none", for a line that is already there'
        note="The labels and the marker stay and the hairline goes, so a list sitting on a card header's edge or a table's own rule draws one line instead of two a pixel apart. The marker moves onto the item's own edge, which is where that line is."
      >
        <Order track="none" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="sm"
        note="The compact step, for a bar inside a card header or above a dense table."
      >
        <Order size="sm" />
      </Scene>
      <Scene label="md" note="The default, and the step a page-level set of views sits at.">
        <Order size="md" />
      </Scene>
      <Scene
        label="lg"
        note="The comfortable step. Height, type and padding move together, because all three read the control scales."
      >
        <Order size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Fit: Story = {
  parameters: scenario('fit'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="auto — as wide as the label"
        note="Each tab is the width of what it says, and a list that outgrows its container scrolls rather than squeezing every label."
      >
        <Order />
      </Scene>
      <Scene
        label="equal — a share of the line"
        note="Angular Material's stretchTabs and Carbon's grid-aware alignment: equal columns, so the length of a translated string never decides the emphasis. It is the one place a horizontal label truncates."
      >
        <Tabs defaultValue="a" fit="equal" variant="contained">
          <TabList aria-label="Reports">
            <Tab value="a">Today</Tab>
            <Tab value="b">A long label that needs to be truncated</Tab>
          </TabList>
          <TabPanel value="a">
            <Text size="sm">Equal shares of the line.</Text>
          </TabPanel>
          <TabPanel value="b">
            <Text size="sm">The label is what gives way.</Text>
          </TabPanel>
        </Tabs>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One view out of reach"
        note="A single unavailable tab carries the native attribute, so it dims, refuses its click and is skipped by the arrow keys — three behaviours from one word."
      >
        <Tabs defaultValue="a">
          <TabList aria-label="Document">
            <Tab value="a">Content</Tab>
            <Tab disabled value="b">
              Subscriptions
            </Tab>
            <Tab value="c">History</Tab>
          </TabList>
          <TabPanel value="a">
            <Text size="sm">Subscriptions become available after submission.</Text>
          </TabPanel>
        </Tabs>
      </Scene>
      <Scene
        label="The whole family, while a job runs"
        note="One attribute reaches every tab and the track dims with them, so a family waiting on a server does not read as a live one with grey labels."
      >
        <Order disabled />
      </Scene>
    </Grid>
  ),
};

export const Mount: Story = {
  parameters: scenario('mount'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="active — the default"
        note="Only the selected panel exists. A panel holding a table, a chart or a form is not built until it is asked for."
      >
        <Order />
      </Scene>
      <Scene
        label="lazy — built once, then kept"
        note="A panel survives its first selection, so a form half filled in is still there when the reader comes back to it."
      >
        <Order mount="lazy" />
      </Scene>
      <Scene
        label="eager — every panel up front"
        note="All three exist from the start and the hidden ones carry the hidden attribute, which find-in-page understands."
      >
        <Order mount="eager" />
      </Scene>
    </Grid>
  ),
};

export const Dismissible: Story = {
  parameters: scenario('dismissible'),
  render: () => {
    function Editor() {
      const [queries, setQueries] = useState(['customers.sql', 'billing.sql', 'inventory.sql']);
      const [active, setActive] = useState('customers.sql');

      return (
        <Tabs
          onTabDismiss={(value) => setQueries((open) => open.filter((query) => query !== value))}
          onValueChange={setActive}
          value={active}
        >
          <TabList aria-label="Open queries">
            {queries.map((query) => (
              <Tab dismissLabel={`Close ${query}`} dismissible key={query} value={query}>
                {query}
              </Tab>
            ))}
          </TabList>
          <TabPanel value={active}>
            <Text size="sm">select * from {active.replace('.sql', '')};</Text>
          </TabPanel>
        </Tabs>
      );
    }

    return (
      <Grid columns={1}>
        <Scene
          label="Close one, and the neighbour takes over"
          note="Press Delete on a tab, or its control with the pointer. The family asks to close and asks for the neighbour — the following tab, or the preceding one when the closed tab was last — and removes nothing itself."
        >
          <Editor />
        </Scene>
      </Grid>
    );
  },
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Twenty views in a narrow column"
        note="The list scrolls rather than wrapping, the two paging controls appear only while there is somewhere to scroll, and each one disables at its own end."
      >
        <Measure>
          <Tabs defaultValue="v1" size="sm">
            <TabList aria-label="Versions">
              {Array.from({ length: 12 }, (_, index) => (
                <Tab key={index} value={`v${index + 1}`}>
                  Version {index + 1}
                </Tab>
              ))}
            </TabList>
            <TabPanel value="v1">
              <Text size="sm">Published on September 12.</Text>
            </TabPanel>
          </Tabs>
        </Measure>
      </Scene>
      <Scene
        label="The keyboard reaches what the eye cannot"
        note="Arrow to the end of the list: the browser brings each tab into view as focus lands on it, which is why the paging controls stay out of the tab sequence."
      >
        <Measure>
          <Tabs activation="manual" defaultValue="v1" size="sm">
            <TabList aria-label="Versions, manual activation">
              {Array.from({ length: 12 }, (_, index) => (
                <Tab key={index} value={`v${index + 1}`}>
                  Version {index + 1}
                </Tab>
              ))}
            </TabList>
            <TabPanel value="v1">
              <Text size="sm">Enter opens the focused version.</Text>
            </TabPanel>
          </Tabs>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A destination, not a decoration"
        note="Each tab is an anchor with a real href: a plain click selects the view, and ⌘-click or middle-click opens it in a new browser tab, because the family leaves a modified click to the browser."
      >
        <Tabs defaultValue="summary">
          <TabList aria-label="Order, with destinations">
            <Tab href="#summary" value="summary">
              Summary
            </Tab>
            <Tab href="#items" value="items">
              Items
            </Tab>
            <Tab href="#payment" value="payment">
              Payment
            </Tab>
          </TabList>
          <TabPanel value="summary">
            <Text size="sm">The address bar follows the view.</Text>
          </TabPanel>
          <TabPanel value="items">
            <Text size="sm">Three items.</Text>
          </TabPanel>
          <TabPanel value="payment">
            <Text size="sm">Credit card.</Text>
          </TabPanel>
        </Tabs>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Content the family did not choose"
        note="An unbroken digest scrolls with the list instead of setting its width, and a right-to-left label reads its own way inside a page that reads the other."
      >
        <Measure>
          <Tabs defaultValue="a" size="sm">
            <TabList aria-label="Extreme content">
              <Tab value="a">sha256:9f86d081884c7d659a2feaa0c55ad015</Tab>
              <Tab value="b">بيانات التسليم</Tab>
              <Tab value="c">Consolidated report</Tab>
            </TabList>
            <TabPanel value="a">
              <Text size="sm">
                sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
              </Text>
            </TabPanel>
          </Tabs>
        </Measure>
      </Scene>
      <Scene
        label="A label with an icon and a count"
        note="The tab is a row with its own gap, so anything composed into it — a status dot, a badge — sits on the label's optical line rather than on the box's."
      >
        <Tabs defaultValue="open">
          <TabList aria-label="Tickets">
            <Tab value="open">Open · 12</Tab>
            <Tab value="closed">Closed · 340</Tab>
          </TabList>
          <TabPanel value="open">
            <Text size="sm">Twelve tickets awaiting triage.</Text>
          </TabPanel>
          <TabPanel value="closed">
            <Text size="sm">Three hundred and forty closed.</Text>
          </TabPanel>
        </Tabs>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Seven decisions an application takes once"
        note="The provider carries them for every family under it, and a family that states one itself still wins — a compact section stays compact inside a comfortable application."
      >
        <TabsDefaultsProvider size="sm" variant="contained">
          <Order />
        </TabsDefaultsProvider>
      </Scene>
      <Scene
        label="A toolbar beside the list"
        note="The actions slot is a cell of the same grid row, and what belongs in it is a toolbar: one tab stop for however many actions, which keeps the distance from the list to the panel at two stops."
      >
        <Tabs defaultValue="summary">
          <TabList aria-label="Order, with actions">
            <Tab value="summary">Summary</Tab>
            <Tab value="items">Items</Tab>
          </TabList>
          <TabActions>
            <Toolbar aria-label="Order actions" size="sm">
              <Button size="sm" variant="ghost">
                Export
              </Button>
              <Button size="sm" variant="ghost">
                Print
              </Button>
            </Toolbar>
          </TabActions>
          <TabPanel value="summary">
            <Text size="sm">Delivery expected on September 12.</Text>
          </TabPanel>
          <TabPanel value="items">
            <Text size="sm">Three items.</Text>
          </TabPanel>
        </Tabs>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => {
    function Reasons() {
      const [reason, setReason] = useState('—');
      return (
        <>
          <Tabs defaultValue="a" onValueChange={(_value, request) => setReason(request.reason)}>
            <TabList aria-label="Which device asked">
              <Tab value="a">With the pointer</Tab>
              <Tab value="b">Then with the arrows</Tab>
              <Tab value="c">And back</Tab>
            </TabList>
            <TabPanel value="a">
              <Text size="sm">Click, then use the arrows.</Text>
            </TabPanel>
            <TabPanel value="b">
              <Text size="sm">The reason changes with the device.</Text>
            </TabPanel>
            <TabPanel value="c">
              <Text size="sm">And it changes again.</Text>
            </TabPanel>
          </Tabs>
          <Text size="sm" tone="muted">
            reason: {reason}
          </Text>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="One tab stop for the whole list"
          note="Tab lands on the selected tab and the next Tab leaves to the panel; the arrows move and wrap, and Home and End reach the ends. No key listener exists for activation."
          layout="stack"
        >
          <Order defaultValue="items" />
        </Scene>
        <Scene
          label="Which device asked"
          note="A click synthesised by the keyboard reports no detail and a real one reports the click count, which is how the reason is recovered without a key listener anywhere."
          layout="stack"
        >
          <Reasons />
        </Scene>
      </Grid>
    );
  },
};
