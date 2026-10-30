import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Drawer, DrawerBody, DrawerPanel, DrawerTrigger } from '../drawer';
import { Grid, Scene } from '../field/field-demo';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderArea,
  PageHeaderContent,
  PageHeaderControls,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderSubheading,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
  PageHeaderToggle,
} from '../page-header';
import {
  Section,
  SectionBody,
  SectionDescription,
  SectionHeader,
  SectionHeading,
  SectionTitle,
} from '../section';
import { Stack } from '../stack';
import { Switch } from '../switch';
import { Text } from '../typography';
import { Page, PageBody, PageFooter } from './page';
import { PageDefaultsProvider } from './page-defaults';
import {
  LINES,
  OrderFooter,
  OrderHeader,
  OrderLines,
  OrderScreen,
  OrderSections,
  Viewport,
} from './page-demo';
import { REACT_PAGE_DOCS, REACT_PAGE_TOKENS } from './page.docs';
import type { PageProps } from './page.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_PAGE_DOCS.page.scenes, {
    playground: Playground,
    width: Width,
    scroll: Scroll,
    fill: Fill,
    ground: Ground,
    footer: Footer,
    loading: Loading,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Page',
  component: Page,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Page',
        description:
          'The column of a screen: who scrolls, how wide the content is, where the footer stays, how much air the body has. The header is a direct child of what scrolls, the footer sits outside it, and the outline steps once for the body.',
        framework: 'React',
        ...REACT_PAGE_DOCS.page,
        tokens: REACT_PAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    fill: false,
    ground: 'sunken',
    inset: 6,
    landmark: 'main',
    loading: false,
    scroll: 'ancestor',
    width: 'wide',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <OrderScreen page={args as Partial<PageProps>} />,
};

/* ── Width ─────────────────────────────────────────────────────────────── */

function Policy({ note, ...props }: Partial<PageProps> & { note: string }) {
  return (
    <Viewport size="tall">
      <Page {...props}>
        <PageHeader level="2" size="sm">
          <PageHeaderTitleArea>
            <PageHeaderTitleRow>
              <PageHeaderTitle>
                <PageHeaderHeading>Purchasing policy</PageHeaderHeading>
                <PageHeaderSubheading>{note}</PageHeaderSubheading>
              </PageHeaderTitle>
              <PageHeaderActions>
                <Button size="sm" tone="accent">
                  Aceitar
                </Button>
              </PageHeaderActions>
            </PageHeaderTitleRow>
          </PageHeaderTitleArea>
        </PageHeader>
        <PageBody>
          <Stack gap={5}>
            <Text size="sm">
              1. Every purchase starts from a requisition approved by the cost center manager, with
              the description of the good or service, the quantity and the justification.
            </Text>
            <Text size="sm">
              2. Above $50,000.00, three quotes are required and are attached to the case file.
            </Text>
            <Text size="sm">
              3. Ongoing contracts are reviewed annually by the purchasing department.
            </Text>
            <Text size="sm">
              4. New suppliers go through tax, labor, and environmental vetting before the first
              purchase order.
            </Text>
            <Text size="sm">
              5. Advances to suppliers depend on a bank guarantee or surety bond of equal value.
            </Text>
            <Text size="sm">
              6. Any discrepancy between the invoice and the purchase order blocks payment until it
              is resolved by the responsible buyer.
            </Text>
          </Stack>
        </PageBody>
      </Page>
    </Viewport>
  );
}

export const Width: Story = {
  parameters: scenario('width'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="measure"
        note="Sixty-five characters: the width a paragraph is read at. The header’s rows and the body share the column, so the title starts exactly over the first line of prose."
      >
        <Policy note="measure — 65ch" width="measure" />
      </Scene>
      <Scene
        label="content"
        note="Fifty-six rems, the width of a form or a document page. The default inset is six steps of the space scale; inset={4} tightens it for a pane."
      >
        <Policy inset={4} note="content — 56rem, inset 4" width="content" />
      </Scene>
      <Scene
        label="wide, the default"
        note="Eighty rems, the width of an application screen with a table in it. Beyond it the column centers and the gutters grow."
      >
        <Policy note="wide — 80rem" width="wide" />
      </Scene>
      <Scene
        label="full"
        note="The space the frame gives, up to --slotted-container-full — 120rem, a 1920-pixel display. Past it the column centers, so an ultra-wide screen does not stretch a line of text across three thousand pixels."
      >
        <Policy note="full — 120rem" width="full" />
      </Scene>
      <Scene
        label="bleed"
        note="No maximum, only the gutters: a table that needs every pixel, a canvas, a board. Asked for by name, because full is what a person types without thinking."
      >
        <Policy note="bleed — no maximum" width="bleed" />
      </Scene>
    </Grid>
  ),
};

/* ── Scroll ────────────────────────────────────────────────────────────── */

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="scroll='ancestor', the default"
        note="The page lives inside the box that scrolls, as inside a shell’s content column, and is at least as tall as it. The footer sticks to the bottom of the page; scroll to the end and the last row meets it."
      >
        <OrderScreen page={{ scroll: 'ancestor' }} sections={{ compact: true }} />
      </Scene>
      <Scene
        label="scroll='self'"
        note="The page is the scroller: its scroll part scrolls and the footer sits below it in the flow, outside the scroller. The header collapses against the scroll part instead of the box around it."
      >
        <div className="slotted-demo-viewport" data-size="screen">
          <Page footer={<OrderFooter />} scroll="self">
            <OrderHeader />
            <PageBody>
              <OrderSections compact />
            </PageBody>
          </Page>
        </div>
      </Scene>
    </Grid>
  ),
};

/* ── Fill ──────────────────────────────────────────────────────────────── */

export const Fill: Story = {
  parameters: scenario('fill'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two panes that scroll themselves"
        note="fill makes the body exactly the height that is left; the list and the detail inside it scroll on their own. Nothing scrolls outside them, so a pane scrolling down past 16 pixels snaps the header’s area shut and back at its top opens it again; the chevron still folds it. Below 600 pixels fill does not apply and the page scrolls."
      >
        <div className="slotted-demo-viewport" data-size="screen">
          <Page fill scroll="self" width="full">
            <PageHeader size="sm">
              <PageHeaderTitleArea>
                <PageHeaderTitleRow>
                  <PageHeaderTitle>
                    <PageHeaderHeading>Suppliers</PageHeaderHeading>
                    <PageHeaderSubheading>312 active · 8 in vetting</PageHeaderSubheading>
                  </PageHeaderTitle>
                  <PageHeaderActions>
                    <Button size="sm" tone="accent">
                      New supplier
                    </Button>
                  </PageHeaderActions>
                </PageHeaderTitleRow>
              </PageHeaderTitleArea>
              <PageHeaderArea>
                <PageHeaderContent>
                  <PageHeaderDescription>
                    Suppliers vetted for the fleet, with the current contract and the latest
                    performance review.
                  </PageHeaderDescription>
                </PageHeaderContent>
              </PageHeaderArea>
              <PageHeaderControls>
                <PageHeaderToggle />
              </PageHeaderControls>
            </PageHeader>
            <PageBody>
              <SplitView />
            </PageBody>
          </Page>
        </div>
      </Scene>
    </Grid>
  ),
};

const SUPPLIERS = [
  'Aurora Logistics',
  'Michelin North America',
  'Pirelli Tire',
  'Bridgestone',
  'Goodyear',
  'Continental',
  'Dunlop',
  'Firestone',
  'Yokohama',
  'Hankook',
  'Kumho',
  'Toyo Tires',
  'Nexen',
  'Maxxis',
  'BFGoodrich',
];

function SplitView() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="slotted-demo-split">
      <div className="slotted-demo-split__pane">
        <Stack gap={2}>
          {SUPPLIERS.map((supplier, index) => (
            <Button
              key={supplier}
              onClick={() => setSelected(index)}
              size="sm"
              variant={index === selected ? 'outline' : 'ghost'}
            >
              {supplier}
            </Button>
          ))}
        </Stack>
      </div>
      <div className="slotted-demo-split__pane">
        <Section level="2" size="md">
          <SectionHeader>
            <SectionTitle>
              <SectionHeading>{SUPPLIERS[selected]}</SectionHeading>
              <SectionDescription>
                Current contract until 09/30/2028 · rating 4.6 of 5.
              </SectionDescription>
            </SectionTitle>
          </SectionHeader>
          <SectionBody>
            <OrderLines compact rows={LINES.slice(0, 18)} sticky={false} />
          </SectionBody>
        </Section>
      </div>
    </div>
  );
}

/* ── Ground ────────────────────────────────────────────────────────────── */

export const Ground: Story = {
  parameters: scenario('ground'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="sunken, the default"
        note="The canvas of an application. Sections on a surface separate from it, the header paints the surface, and the footer too."
      >
        <OrderScreen page={{ ground: 'sunken' }} sections={{ compact: true, ground: 'surface' }} />
      </Scene>
      <Scene
        label="surface"
        note="A document page: the content is the page, the header and the footer are the same white, and a rule under each section header is what separates."
      >
        <OrderScreen page={{ ground: 'surface' }} sections={{ compact: true }} />
      </Scene>
    </Grid>
  ),
};

/* ── Footer ────────────────────────────────────────────────────────────── */

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => {
    function Dirty() {
      const [dirty, setDirty] = useState(true);
      return (
        <Stack gap={4}>
          <Switch checked={dirty} onCheckedChange={setDirty}>
            Unsaved changes
          </Switch>
          <Viewport>
            <Page
              footer={
                dirty ? (
                  <PageFooter>
                    <Button onClick={() => setDirty(false)} variant="ghost">
                      Descartar
                    </Button>
                    <Button onClick={() => setDirty(false)} tone="accent">
                      Save changes
                    </Button>
                  </PageFooter>
                ) : undefined
              }
            >
              <OrderHeader navigation={false} tabs={false} />
              <PageBody>
                <OrderSections />
              </PageBody>
            </Page>
          </Viewport>
        </Stack>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="A bar that comes with the first change and leaves with the save"
          note="Toggle the switch, or press a button in the bar: the footer slides out and the property the table’s summary reads returns to nought. It is in the flow, so scroll to the end and see the last row stop above it."
        >
          <Dirty />
        </Scene>
      </Grid>
    );
  },
};

/* ── Loading ───────────────────────────────────────────────────────────── */

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => {
    function Fetching() {
      const [loading, setLoading] = useState(true);
      return (
        <Stack gap={4}>
          <Button
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1800);
            }}
            size="sm"
            variant="outline"
          >
            Load again
          </Button>
          <Viewport>
            <Page loading={loading}>
              <OrderHeader loading={loading} navigation={false} tabs={false} />
              <PageBody>
                {loading ? (
                  <Text size="sm" tone="muted">
                    Loading the order…
                  </Text>
                ) : (
                  <OrderSections />
                )}
              </PageBody>
            </Page>
          </Viewport>
        </Stack>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="The body is busy"
          note="aria-busy on the body, data-loading on the root, the cursor saying progress over the body. The header stands its skeleton text; what stands in the body is the consumer’s, because each family draws its own placeholder."
        >
          <Fetching />
        </Scene>
      </Grid>
    );
  },
};

/* ── Composition ───────────────────────────────────────────────────────── */

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The whole order"
        note="Header, sticky section headers, a table whose column header stops under the page chrome, the footer at the bottom. Scroll it end to end; pin the header and watch every sticky thing stop lower."
      >
        <OrderScreen sticky />
      </Scene>
      <Scene
        label="A page inside a drawer"
        note="Open the drawer: a page with landmark='none' and scroll='self' scrolls inside the drawer’s body, its header collapsing against that box, while the document keeps its one main. The body has inset='none', so the page meets the panel’s edges and the inset is the page’s own."
      >
        <Drawer side="end" size="lg">
          <DrawerTrigger
            render={({ children, ...props }) => (
              <Button {...props} variant="outline">
                {children}
              </Button>
            )}
          >
            Open the order in a panel
          </DrawerTrigger>
          <DrawerPanel>
            <DrawerBody inset="none">
              <Page
                footer={<OrderFooter />}
                ground="surface"
                inset={4}
                landmark="none"
                scroll="self"
                width="content"
              >
                <OrderHeader
                  breadcrumbs={false}
                  level="2"
                  navigation={false}
                  size="sm"
                  tabs={false}
                />
                <PageBody>
                  <OrderSections />
                </PageBody>
              </Page>
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
      </Scene>
    </Grid>
  ),
};

/* ── Defaults ──────────────────────────────────────────────────────────── */

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Five decisions an application takes once"
        note="The provider carries width, inset, scroll, ground and landmark for every page under it — here a document application. A page that states any of them itself still wins, and its messages name the footer."
      >
        <PageDefaultsProvider ground="surface" width="content">
          <Viewport>
            <Page
              messages={{ footer: 'Decisions' }}
              footer={
                <PageFooter>
                  <Button variant="ghost">Discard</Button>
                  <Button tone="accent">Save</Button>
                </PageFooter>
              }
              render={(props) => <article {...props} />}
            >
              <OrderHeader breadcrumbs={false} navigation={false} tabs={false} />
              <PageBody>
                <OrderSections />
              </PageBody>
            </Page>
          </Viewport>
        </PageDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

/* ── Accessibility ─────────────────────────────────────────────────────── */

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One main, named regions, an outline without a skip"
        note="Open the screen reader’s landmark list: main, then the regions the sections make, then the footer named by the catalog — “Page actions” in English. Open the heading list: h1 for the order, h2 for each section, h3 for what is inside."
      >
        <OrderScreen />
      </Scene>
    </Grid>
  ),
};
