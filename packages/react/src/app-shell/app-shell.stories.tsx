import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inbox } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../button';
import { Container } from '../container';
import { PageHeaderProgress } from '../page-header';
import { Drawer, DrawerBody, DrawerPanel, DrawerTrigger } from '../drawer';
import { Grid, Scene } from '../field/field-demo';
import { Inline } from '../inline';
import { Stack } from '../stack';
import { Text } from '../typography';
import { AppShell } from './app-shell';
import { AppShellDefaultsProvider } from './app-shell-defaults';
import {
  Anatomy,
  Atrio,
  AtrioBanner,
  AtrioContent,
  AtrioNav,
  AtrioPane,
  Aurora,
  AuroraBanner,
  AuroraRail,
  AuroraContent,
  AuroraFooter,
  AuroraNav,
  AuroraPane,
  AuroraSelection,
  Cadence,
  CadenceBanner,
  CadenceContent,
  CadenceNav,
  Shipments,
  Viewport,
} from './app-shell-demo';
import { AppShellMain, AppShellProgress } from './app-shell-parts';
import { REACT_APP_SHELL_DOCS, REACT_APP_SHELL_TOKENS } from './app-shell.docs';
import type { AppShellHandle, AppShellOpenReason, AppShellProps } from './app-shell.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_APP_SHELL_DOCS.appShell.scenes, {
    playground: Playground,
    anatomy: AnatomyScene,
    regions: Regions,
    banner: BannerScene,
    canvas: Canvas,
    separation: Separation,
    theming: Theming,
    navModes: NavModes,
    rail: Rail,
    navRail: NavRail,
    aside: Aside,
    overlay: Overlay,
    primary: Primary,
    sides: Sides,
    scroll: Scroll,
    progress: Progress,
    skipLinks: SkipLinks,
    persistence: Persistence,
    defaults: Defaults,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/App Shell',
  component: AppShell,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'App Shell',
        description:
          'The outer frame of a route: the regions that do not change when the content does. Five landmarks earned from their elements, a navigation region and a secondary pane that are each one element in every mode, a bar of three clusters, and a content column that is a card on the frame. Three products on this page — a freight back office, a product tracker, a clinic’s front desk — and every one of them is the same family.',
        framework: 'React',
        ...REACT_APP_SHELL_DOCS.appShell,
        tokens: REACT_APP_SHELL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Playground ─────────────────────────────────────────────────────────── */

export const Playground: Story = {
  args: {
    asideMode: 'auto',
    asideSize: 'md',
    canvas: 'inset',
    closeOnNavigate: true,
    collapsedTo: 'rail',
    defaultAsideOpen: true,
    defaultNavOpen: true,
    escape: 'close',
    modal: true,
    navMode: 'auto',
    navSide: 'start',
    navSize: 'md',
    outsidePress: 'close',
    primary: 'banner',
    scroll: 'content',
    separation: 'rule',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <Aurora footer shell={args as Partial<AppShellProps>} />,
};

/* ── Anatomy ────────────────────────────────────────────────────────────── */

export const AnatomyScene: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="What arrives with AppShell, and nothing else"
        note="Every part the contract declares, drawn as its own name. This is the whole of what the family brings: the tracks, the gutter, the card the content stands on, the three clusters of the bar, the three parts of the pane, the boxes the two controls fill. Every other scene on this page fills these boxes with a product — none of that is the family."
      >
        <Anatomy />
      </Scene>
    </Grid>
  ),
};

/* ── Regions ────────────────────────────────────────────────────────────── */

export const Regions: Story = {
  parameters: scenario('regions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="banner · navigation · main · complementary · contentinfo"
        note="Open the accessibility tree on Aurora: five landmarks, one of each, and not a single role attribute in the markup. The names come from the elements; the navigation and the pane are labelled, because a document may hold more than one of either."
      >
        <Aurora footer shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="The regions a product may not have"
        note="Cadence has no pane and no footer: the tracks they would have taken are nought wide and nought tall, nothing is left holding space, and the skip links drop to two because a link to a region nobody rendered is a dead destination."
      >
        <Cadence shell={{ navMode: 'inline' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Banner ─────────────────────────────────────────────────────────────── */

export const BannerScene: Story = {
  parameters: scenario('banner'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="brand · centre · actions — a search in the middle"
        note="Aurora's bar: the control and the name start the line, a search field with its shortcut takes the room in the middle, and notifications, help and the account end it. Narrow the frame below thirty rems of bar and the search gives way; below twenty the optional controls go too. Nothing in actions ever breaks its label."
      >
        <Aurora size="tall" shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="A trail in the middle, the route's actions at the end"
        note="Cadence's bar holds the route rather than the application: a Breadcrumb in centre, a filter and a primary action in actions, and an empty brand because the workspace lives in the column's own head under primary='nav'. An empty cluster costs nothing."
      >
        <Cadence size="tall" shell={{ navMode: 'inline' }} />
      </Scene>
      <Scene
        label="A title in the middle, the pane's control at the end"
        note="Atrium's bar names the day, and when the pane is closed its control stands in actions so the receptionist can reopen it from a fixed place — the same control that stands in the pane's own head while it is open."
      >
        <Viewport size="tall">
          <AppShell
            asideMode="inline"
            defaultAsideOpen={false}
            defaultNavOpen={false}
            navMode="overlay"
            navSide="end"
          >
            <AtrioBanner paneToggle />
            <AtrioNav />
            <AppShellMain>
              <AtrioContent />
            </AppShellMain>
            <AtrioPane />
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Canvas ─────────────────────────────────────────────────────────────── */

export const Canvas: Story = {
  parameters: scenario('canvas'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="canvas='inset', the default"
        note="The frame takes the sunken ground and carries no surface of its own; the content and the pane are cards with a radius, an edge and a shadow, and the gutter between them is what separates the regions. No rule is drawn anywhere."
      >
        <Aurora footer shell={{ asideMode: 'inline', canvas: 'inset', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="canvas='flush'"
        note="Every region runs edge to edge and each seam is drawn — between the regions, and between the pane's head, body and foot. The rows of the column stand one inset from the screen's edge and from the seam on both sides, so the closed strip stays centred."
      >
        <Aurora footer shell={{ asideMode: 'inline', canvas: 'flush', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="canvas='floating'"
        note="The column is a card as well as the content: two cards and the pane on the sunken ground, a gutter apart. The control in the bar stands over the marks in the card, because the bar's inset counts the card's edge."
      >
        <Aurora footer shell={{ asideMode: 'inline', canvas: 'floating', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="canvas='panel'"
        note="One card holds the column, the content and the pane, with the bar and the footer on the frame outside it. Inside the card the regions meet at seams, and separation decides how those are drawn. The card is one box — the root's own pseudo-element — so no shadow falls across a seam."
      >
        <Aurora footer shell={{ asideMode: 'inline', canvas: 'panel', navMode: 'inline' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Separation ─────────────────────────────────────────────────────────── */

export const Separation: Story = {
  parameters: scenario('separation'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="separation='rule' on flush, the default"
        note="A line of the thin border width at every seam where two regions touch without a gutter."
      >
        <Aurora shell={{ asideMode: 'inline', canvas: 'flush', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="separation='tone' on flush"
        note="No line: the bar, the column and the pane take a ground of their own, 0.036 OKLab L from the surface in light and in dark, and the content keeps the surface. Hover a destination — the subtle tones inside a toned region are recomputed from its ground, so the row still answers."
      >
        <Aurora
          shell={{ asideMode: 'inline', canvas: 'flush', navMode: 'inline', separation: 'tone' }}
        />
      </Scene>
      <Scene
        label="separation='tone' on panel, primary='main'"
        note="Inside the one card the column and the pane are toned and the bar belongs to the content, so the only seam left is none at all. Under forced colours every ground is Canvas and the rule comes back whatever this axis says."
      >
        <Aurora
          shell={{
            asideMode: 'inline',
            canvas: 'panel',
            navMode: 'inline',
            primary: 'main',
            separation: 'tone',
          }}
          toggleInFooter
        />
      </Scene>
    </Grid>
  ),
};

/* ── Theming ────────────────────────────────────────────────────────────── */

export const Theming: Story = {
  parameters: scenario('theming'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A dark column on a light frame — Cadence"
        note="Two declarations and no variant: data-slotted-scheme='dark' on the region, so every tone inside it is restated rather than borrowed from the page it left, and --slotted-app-shell-nav-surface on the same element for the ground. The counts, the current destination and the focus ring are calibrated against the column they are on. Switch the page to dark: the column stays the column."
      >
        <Cadence shell={{ navMode: 'inline' }} />
      </Scene>
      <Scene
        label="The same frame, unpainted — Aurora"
        note="What the family ships, and what Aurora keeps. Each region has its own ground and its own ink, each falling back to the plane's, so a product states only what differs — and the parts are addressable by data-part, so anything the properties do not reach is still one selector away."
      >
        <Aurora shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="A wash behind the frame — --slotted-app-shell-frame-image"
        note="One theme token, a background-image layer over the frame's colour: two pools of the accent tone behind floating cards. The cards keep their own surface, so everything a reader reads stays on the ground it was calibrated for."
      >
        <Aurora
          shell={{
            asideMode: 'inline',
            canvas: 'floating',
            className: 'slotted-demo-frame-wash',
            navMode: 'inline',
            primary: 'main',
          }}
          toggleInFooter
        />
      </Scene>
    </Grid>
  ),
};

/* ── Navigation modes ───────────────────────────────────────────────────── */

export const NavModes: Story = {
  parameters: scenario('navModes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="navMode='inline'"
        note="A column of the grid. The content column takes what is left, and closing the region widens it rather than covering it."
      >
        <Aurora shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="navMode='auto' — the same shell, in a frame narrower than 600 pixels"
        note="The shell answers its own inline size and not the window's: this frame is 420 pixels wide inside a page that is not, and both regions have already left the grid. Press the control — the panel comes in over the content and the veil covers what is behind it."
      >
        <div className="slotted-demo-measure">
          <Aurora room={false} size="tall" shell={{ defaultAsideOpen: false }} />
        </div>
      </Scene>
      <Scene
        label="navMode='overlay' at any width — Atrium"
        note="The mode forced, so a wide shell behaves like a narrow one: for a product whose navigation is a command surface rather than a column, and whose screen belongs to the agenda. Escape closes it, a press outside closes it, and focus returns to the control."
      >
        <Atrio shell={{ asideMode: 'inline' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Rail ───────────────────────────────────────────────────────────────── */

export const Rail: Story = {
  parameters: scenario('rail'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="collapsedTo='rail', the default — closed, control in the bar"
        note="A strip one mark column wide, with every destination still on it and still in the tab order. The labels went because the region is a query container of its own and each row answered its width — the shell told it nothing. Under primary='banner' the control stands at the start of the bar, over the column it moves."
      >
        <Aurora
          shell={{
            asideMode: 'inline',
            collapsedTo: 'rail',
            defaultNavOpen: false,
            navMode: 'inline',
          }}
        />
      </Scene>
      <Scene
        label="collapsedTo='rail' — closed, control in the column's own foot"
        note="Under primary='nav' the column reaches the corner and the bar starts beside it, so the control belongs in the column: here in its foot, above the person, where it survives the rail because the control is the width of a mark. Press it and the labels come back."
      >
        <Viewport>
          <AppShell
            asideMode="inline"
            collapsedTo="rail"
            defaultNavOpen={false}
            navMode="inline"
            primary="nav"
          >
            <AuroraBanner centre={false} toggle={false} />
            <AuroraNav toggleInFooter />
            <AppShellMain>
              <AuroraContent />
            </AppShellMain>
          </AppShell>
        </Viewport>
      </Scene>
      <Scene
        label="collapsedTo='hidden' — closed"
        note="The region keeps no measure and no tab stop. Press the control in the bar and it comes back, animating its width from nought. Mantine and Ant leave a zero-width navbar in the flow instead, and Tab still crosses every link inside it."
      >
        <Aurora
          shell={{
            asideMode: 'inline',
            collapsedTo: 'hidden',
            defaultNavOpen: false,
            navMode: 'inline',
          }}
        />
      </Scene>
    </Grid>
  ),
};

/* ── A rail of its own ─────────────────────────────────────────────────── */

export const NavRail: Story = {
  parameters: scenario('navRail'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="AppShellNavRail — open"
        note="A two-level navigation inside one nav landmark: the modules in a strip of marks, the destinations of the chosen module in the column beside it. Press a module: the column changes, and the region's width does not. The module is the product's state; the shell holds only whether the region is open."
      >
        <AuroraRail />
      </Scene>
      <Scene
        label="AppShellNavRail — closed to its strip"
        note="collapsedTo='rail' with a strip of the rail's own keeps the strip and lets the column go: cut by the region while the width moves, then out of the tab order and the accessibility tree. The control at the foot of the strip brings the column back."
      >
        <AuroraRail shell={{ defaultNavOpen: false }} />
      </Scene>
      <Scene
        label="AppShellNavRail on flush, separation='tone', primary='banner'"
        note="The strip on the tone, the column and the bar on the tone beside it, the content on the surface — no line anywhere."
      >
        <AuroraRail shell={{ canvas: 'flush', primary: 'banner', separation: 'tone' }} />
      </Scene>
      <Scene
        label="AppShellNavRail on floating, with the pane"
        note="The strip and the column share one card; the seam between them is the axis's, here a rule."
      >
        <AuroraRail aside shell={{ canvas: 'floating' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Aside ──────────────────────────────────────────────────────────────── */

export const Aside: Story = {
  parameters: scenario('aside'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Opened by a selection, closed from its own head"
        note="Select a row: the product sets asideOpen from its selection and the pane opens with the consignment. Press the control in the pane's head: the shell asks with the reason pointer, the product clears the selection, and the content takes the room — a closed pane leaves no rail. The skip link to the pane exists only while it is open. Drag the pane's inner edge, or focus it and press the arrows, Home and End: the column follows asideExtent between 16 and 60 per cent of the shell, and the body's fields stand on the title's edge with no padding of their own."
      >
        <AuroraSelection shell={{ navMode: 'inline' }} />
      </Scene>
      <Scene
        label="asideMode='inline' in a frame narrower than 600 pixels"
        note="No room beside the content, so the inline pane drops under it as a row of its own. The head, the body and the foot hold: the body is what scrolls."
      >
        <div className="slotted-demo-measure">
          <Aurora
            room={false}
            size="tall"
            shell={{ asideMode: 'inline', defaultNavOpen: false, navMode: 'inline' }}
          />
        </div>
      </Scene>
      <Scene
        label="asideMode='overlay' — the pane as a layer, from the other end"
        note="The navigation's layer mirrored: the pane slides in from the end the navigation is not on, stops under the banner, takes the veil, and returns focus to the control that opened it. Escape closes it. On the inset plane it is a card like every other region."
      >
        <Viewport size="tall">
          <AppShell asideMode="overlay" defaultNavOpen={false} navMode="overlay">
            <AuroraBanner centre={false} />
            <AuroraNav />
            <AppShellMain>
              <AuroraContent>
                <Shipments selected="ENC-4521" />
              </AuroraContent>
            </AppShellMain>
            <AuroraPane />
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Overlay ────────────────────────────────────────────────────────────── */

export const Overlay: Story = {
  parameters: scenario('overlay'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="modal — the default, Atrium's navigation open"
        note="Open, and Tab: the keyboard never leaves the panel, and every region beside it carries inert — the banner included — so a screen reader does not read them either. That is the whole modal contract: the ways out are Escape, the veil and a destination, and Escape gives the focus back to the control."
      >
        <Atrio shell={{ asideMode: 'inline', defaultNavOpen: true, modal: true }} />
      </Scene>
      <Scene
        label="modal={false}"
        note="The panel is over the content and nothing behind it is inert: for a shell whose navigation is a reference the reader consults while working. No veil is drawn, because a veil that stops nothing is a lie about what is reachable."
      >
        <Atrio shell={{ asideMode: 'inline', defaultNavOpen: true, modal: false }} />
      </Scene>
      <Scene
        label="escape='none' and outsidePress='none' — on the pane"
        note="Both dismissals refused, so the pane closes only from its own control — for a form the receptionist is halfway through. Press Escape here and nothing happens; press the control in the pane's head and it closes. The same two axes govern the navigation's layer."
      >
        <Viewport size="tall">
          <AppShell
            asideMode="overlay"
            defaultNavOpen={false}
            escape="none"
            navMode="overlay"
            navSide="end"
            outsidePress="none"
          >
            <AtrioBanner />
            <AtrioNav />
            <AppShellMain>
              <AtrioContent />
            </AppShellMain>
            <AtrioPane />
          </AppShell>
        </Viewport>
      </Scene>
      <Scene
        label="closeOnNavigate={false}"
        note="A click on a destination leaves the navigation open, for an application that loads the route behind it and wants the reader to keep their place in the list. With the default, the same click asks to close and says so with the reason select."
      >
        <Atrio shell={{ asideMode: 'inline', closeOnNavigate: false, defaultNavOpen: true }} />
      </Scene>
    </Grid>
  ),
};

/* ── Primary ────────────────────────────────────────────────────────────── */

export const Primary: Story = {
  parameters: scenario('primary'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="primary='banner', the default — Aurora"
        note="The bar spans the full width and the navigation starts under it, which is what an application with one global bar and several workspaces wants. The control stands at the start of the bar, over the column it moves."
      >
        <Aurora shell={{ asideMode: 'inline', navMode: 'inline', primary: 'banner' }} />
      </Scene>
      <Scene
        label="primary='nav' — Cadence"
        note="The navigation reaches the corner and the bar starts beside it. The column's own head grows to the bar's height so the workspace and the trail sit on one line, and the control that moves the column stands in that head — and Tab still goes skip, banner, control, navigation, content, because the grid moved the drawing and not the writing."
      >
        <Cadence shell={{ navMode: 'inline' }} />
      </Scene>
      <Scene
        label="primary='main' — Aurora"
        note="The column reaches both corners and the bar belongs to the content: it stands inside the card that holds the page, over the content's column alone, and the pane beside it spans the bar's row. The control moves to the column's foot. The focus order is still skip, banner, navigation, content."
      >
        <Aurora
          shell={{ asideMode: 'inline', navMode: 'inline', primary: 'main' }}
          toggleInFooter
        />
      </Scene>
    </Grid>
  ),
};

/* ── Sides and sizes ────────────────────────────────────────────────────── */

export const Sides: Story = {
  parameters: scenario('sides'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="navSide='end' — Atrium, with the navigation in line"
        note="The region moves to the other end of the line and the pane moves with it, to the side the navigation is not — so the two never stack on one edge. Both controls turn their marks with them. Switch the direction to right-to-left: the whole frame mirrors, because every distance is logical."
      >
        <Atrio shell={{ asideMode: 'inline', defaultNavOpen: true, navMode: 'inline' }} />
      </Scene>
      <Scene
        label="navSize='sm' with asideSize='lg'"
        note="Both are steps on the family's own scale rather than pixel strings: a theme retunes a step for every shell at once, and a consumer who needs an exact measure writes --slotted-app-shell-nav-size-md on the element."
      >
        <Aurora
          shell={{ asideMode: 'inline', asideSize: 'lg', navMode: 'inline', navSize: 'sm' }}
        />
      </Scene>
      <Scene
        label="navSize='lg' — and a destination whose name is long"
        note="Fourteen characters of German where the mock had six: the label truncates inside its own row and the count stays put, because the row reserves the count first. The region did not grow and nothing wrapped."
      >
        <Aurora longLabels shell={{ asideMode: 'inline', navMode: 'inline', navSize: 'lg' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Scroll ─────────────────────────────────────────────────────────────── */

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="scroll='content', the default"
        note="The shell is the height it was given, capped at 100dvh so a mobile browser's collapsing toolbar never makes it taller than the space there is. Scroll the table: the banner, the column, the pane's head and foot and the footer all stay, and only the column and the pane's body move."
      >
        <Aurora footer shell={{ asideMode: 'inline', navMode: 'inline', scroll: 'content' }}>
          <AuroraContent>
            <Stack gap={6}>
              <Shipments selected="ENC-4521" />
              <Shipments />
              <Shipments />
            </Stack>
          </AuroraContent>
        </Aurora>
      </Scene>
      <Scene
        label="scroll='document'"
        note="The shell grows with its content and the document scrolls, which is what a documentation site wants. The banner travels with it — the cost written in the contract, because a sticky banner here would have to write a custom property PageHeader owns writing."
      >
        <Viewport size="tall">
          <AppShell asideMode="inline" navMode="inline" scroll="document">
            <AuroraBanner />
            <AuroraNav />
            <AppShellMain>
              <Container inset={6} size="wide">
                <Stack gap={6}>
                  <Text size="lg" weight="semibold">
                    Encomendas
                  </Text>
                  <Shipments />
                  <Shipments />
                </Stack>
              </Container>
            </AppShellMain>
            <AuroraFooter />
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Progress ───────────────────────────────────────────────────────────── */

/** A wait that ends by itself, the way a navigation or a refresh does. */
function useWait(duration: number): [boolean, () => void] {
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setTimeout(() => setWaiting(false), duration);
    return () => clearTimeout(timer);
  }, [duration, waiting]);
  return [waiting, () => setWaiting(true)];
}

function TwoWaits() {
  const [navigating, navigate] = useWait(1600);
  const [refreshing, refresh] = useWait(1400);
  const [order, setOrder] = useState('Encomendas');
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button
          onClick={() => {
            navigate();
            setOrder((current) => (current === 'Encomendas' ? 'ENC-4521' : 'Encomendas'));
          }}
          size="sm"
          tone="accent"
        >
          Open another page
        </Button>
        <Button onClick={refresh} size="sm" tone="secondary" variant="outline">
          Refresh the list
        </Button>
        <Button
          onClick={() => {
            navigate();
            refresh();
          }}
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          Both at once
        </Button>
      </Inline>
      <Aurora
        aside={false}
        progress={<AppShellProgress loading={navigating} />}
        shell={{ navMode: 'inline' }}
        size="tall"
      >
        <AuroraContent headerProgress={<PageHeaderProgress loading={refreshing} />} title={order} />
      </Aurora>
    </Stack>
  );
}

const CANVAS_EDGES = [
  ['inset', 'The bar covers the top border of the content card and is clipped by its corners.'],
  ['flush', 'The bar covers the banner’s seam, from the navigation column’s edge to the frame’s.'],
  ['floating', 'Two cards on the sunken ground; the bar is the content card’s, under its corners.'],
  ['panel', 'One card holds the regions; the bar covers the card’s top edge over the content.'],
] as const;

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => (
    <>
      <Grid columns={1}>
        <Scene
          label="The next page, then a refresh of this one"
          note="Open another page: after 200 ms the bar grows out of the content card's top border, travels until the page is ready, holds for at least 400 ms and goes back into the border; the content is aria-busy for exactly that long. Refresh the list draws the page header's own bar on its hairline instead. Both at once draws one bar, the shell's, because the header's gives way inside a busy region."
        >
          <TwoWaits />
        </Scene>
      </Grid>
      <Grid columns={1}>
        {CANVAS_EDGES.map(([canvas, note]) => (
          <Scene key={canvas} label={`canvas='${canvas}'`} note={note}>
            <Aurora
              aside={false}
              centre={false}
              progress={<AppShellProgress delay={0} />}
              shell={{ canvas, navMode: 'inline' }}
              size="tall"
            />
          </Scene>
        ))}
      </Grid>
    </>
  ),
};

/* ── Skip links ─────────────────────────────────────────────────────────── */

export const SkipLinks: Story = {
  parameters: scenario('skipLinks'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three regions, three links"
        note="Click the frame and press Tab: the first link appears over the bar. Press Enter and the focus moves into the content itself — not only the scroll — because the link writes tabindex='-1' on main for that one focus. Tab again for the navigation, again for the pane."
      >
        <Aurora shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="One region, one link"
        note="The same shell without a pane and without a navigation: the links are written from the regions that actually rendered, so there is exactly one and it points at the content. A pane the reader closed drops its link the same way."
      >
        <Viewport size="tall">
          <AppShell navMode="inline">
            <AuroraBanner toggle={false} />
            <AppShellMain>
              <AuroraContent title="Monthly report" />
            </AppShellMain>
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Persistence ────────────────────────────────────────────────────────── */

function RequestLog() {
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<
    readonly { at: number; open: boolean; reason: AppShellOpenReason; region: string }[]
  >([]);
  const record = (region: string, next: boolean, reason: AppShellOpenReason) =>
    setLog((entries) => [{ at: Date.now(), open: next, reason, region }, ...entries].slice(0, 6));

  return (
    <Stack gap={4}>
      <Viewport size="tall">
        <AppShell
          navOpen={open}
          onAsideOpenChange={(next, request) => record('panel', next, request.reason)}
          onNavOpenChange={(next, request) => {
            setOpen(next);
            record('navigation', next, request.reason);
          }}
        >
          <AuroraBanner />
          <AuroraNav />
          <AppShellMain>
            <AuroraContent />
          </AppShellMain>
          <AuroraPane />
        </AppShell>
      </Viewport>
      <div className="slotted-demo-rows">
        {log.length === 0 ? (
          <>
            <span>No requests yet</span>
            <span>press a control, or narrow the window</span>
          </>
        ) : (
          log.flatMap((entry, index) => [
            <span key={`${index}-reason`}>
              <code>{entry.reason}</code>
            </span>,
            <span key={`${index}-value`}>
              {entry.region} {entry.open ? 'open' : 'closed'}
            </span>,
          ])
        )}
      </div>
    </Stack>
  );
}

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every request says why, for both regions"
        note="Press a control: pointer. Press it with the keyboard: keyboard. Drag the browser window narrow until the frame crosses 600 pixels: resize, for the navigation and for the pane — the one reason a product ignores when it persists the reader's preference, and the only one no surveyed implementation reports."
      >
        <RequestLog />
      </Scene>
    </Grid>
  ),
};

/* ── Defaults and escape hatches ────────────────────────────────────────── */

function Imperative() {
  const shell = useRef<AppShellHandle>(null);
  return (
    <Stack gap={4}>
      <div className="slotted-demo-row">
        <Button
          onClick={() => shell.current?.openNav()}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          openNav()
        </Button>
        <Button
          onClick={() => shell.current?.closeNav()}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          closeNav()
        </Button>
        <Button
          onClick={() => shell.current?.openAside()}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          openAside()
        </Button>
        <Button
          onClick={() => shell.current?.closeAside()}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          closeAside()
        </Button>
        <Button onClick={() => shell.current?.focusMain()} size="sm" tone="accent">
          focusMain()
        </Button>
      </div>
      <Viewport size="tall">
        <AppShell asideMode="inline" navMode="inline" ref={shell}>
          <AuroraBanner />
          <AuroraNav />
          <AppShellMain>
            <AuroraContent />
          </AppShellMain>
          <AuroraPane />
        </AppShell>
      </Viewport>
    </Stack>
  );
}

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="AppShellDefaultsProvider"
        note="Every shell under the provider is on the flush plane, with a large region — and the shell below states none of it. A shell that states any of them itself still wins. The words come from the language in force."
      >
        <AppShellDefaultsProvider canvas="flush" navSize="lg">
          <Aurora shell={{ asideMode: 'inline', navMode: 'inline' }} />
        </AppShellDefaultsProvider>
      </Scene>
      <Scene
        label="The handle, and the five actions a prop cannot express"
        note="ref gives an AppShellHandle rather than a DOM node: openNav, closeNav, openAside and closeAside ask with the reason programmatic, and focusMain does what the skip link does. The root element is on the handle too, for the consumer who needs to measure it."
      >
        <Imperative />
      </Scene>
      <Scene
        label="render, on the root"
        note="The root becomes the consumer's own element and keeps every attribute, listener and data-*. Here it is a form, for an application whose whole screen submits — the skip links, the veil and the portal root are still the shell's, because they are not parts a consumer replaces."
      >
        <Viewport size="tall">
          <AppShell
            asideMode="inline"
            navMode="inline"
            render={(props) => <form {...props} onSubmit={(event) => event.preventDefault()} />}
          >
            <AuroraBanner />
            <AuroraNav />
            <AppShellMain>
              <AuroraContent />
            </AppShellMain>
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Composition ────────────────────────────────────────────────────────── */

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Page, PageHeader, Table — inside the content region"
        note="The Page carries landmark='none' because the document already has its main; its header sticks to the top of the column the shell gave it, and its footer waits at the bottom. The table's column header stops under the chrome without either family measuring the other."
      >
        <Aurora shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="A Drawer opened from the page lands in the shell's own layer"
        note="The shell names its layer part as the portal root once, so a Drawer, a Dialog, a Menu or a Toast opened anywhere under it lands over the content and inside the application's stacking context rather than on the body. Open it: the veil covers the frame, and Escape gives the focus back to the button."
      >
        <Viewport size="tall">
          <AppShell asideMode="inline" navMode="inline">
            <CadenceNav />
            <CadenceBanner />
            <AppShellMain>
              <CadenceContent>
                <Drawer side="end" size="md">
                  <DrawerTrigger
                    render={({ children, ...props }) => (
                      <Button {...props} size="sm" tone="accent">
                        {children}
                      </Button>
                    )}
                  >
                    Open PLT-812
                  </DrawerTrigger>
                  <DrawerPanel>
                    <DrawerBody>
                      <Stack gap={3}>
                        <Text size="sm" weight="semibold">
                          PLT-812 · Migrate queues to the new broker
                        </Text>
                        <Text size="xs" tone="muted">
                          The drawer opens on the shell's layer, above the content and inside the
                          application's stacking context.
                        </Text>
                      </Stack>
                    </DrawerBody>
                  </DrawerPanel>
                </Drawer>
              </CadenceContent>
            </AppShellMain>
          </AppShell>
        </Viewport>
      </Scene>
      <Scene
        label="An empty content region"
        note="The shell holds while the application has nothing to show: the frame, the navigation and the chrome are all still there, and only the card is empty. A shell that collapsed here would take the reader's way out with it."
      >
        <Viewport size="tall">
          <AppShell asideMode="inline" navMode="inline">
            <AuroraBanner />
            <AuroraNav current="armazens" />
            <AppShellMain>
              <Container inset={8} size="wide">
                <Stack align="center" gap={4}>
                  <Inbox aria-hidden size={28} />
                  <Text size="sm" weight="medium">
                    No warehouses in this workspace
                  </Text>
                  <Text size="xs" tone="muted">
                    Add the first one to start receiving orders.
                  </Text>
                  <Button size="sm" tone="accent">
                    Add warehouse
                  </Button>
                </Stack>
              </Container>
            </AppShellMain>
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The landmark list, and the tab order"
        note="Five landmarks, none of them a role attribute. Tab: skip link, bar, control, navigation, content, pane, the pane's control, footer — the DOM order, and it is the same under primary='nav'. Enter and Space both work either control, which is the whole of the Disclosure pattern's keyboard."
      >
        <Aurora footer shell={{ asideMode: 'inline', navMode: 'inline' }} />
      </Scene>
      <Scene
        label="The control, anywhere"
        note="Each control takes its id, its aria-expanded, its aria-controls, its name and its handler from the shell rather than from where it stands — so here the navigation's is in the column's own foot and the pane's is in the bar, and there is still exactly one control carrying the state of each region."
      >
        <Viewport size="tall">
          <AppShell
            asideMode="inline"
            asideSize="sm"
            defaultAsideOpen={false}
            defaultNavOpen={false}
            navMode="inline"
            navSide="end"
            navSize="sm"
            primary="nav"
          >
            <AtrioBanner paneToggle />
            <AtrioNav />
            <AppShellMain>
              <AtrioContent />
            </AppShellMain>
            <AtrioPane />
          </AppShell>
        </Viewport>
      </Scene>
    </Grid>
  ),
};
