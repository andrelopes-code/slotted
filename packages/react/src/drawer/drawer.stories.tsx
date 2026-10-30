import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Skeleton } from '../skeleton';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { Drawer } from './drawer';
import { DrawerDefaultsProvider } from './drawer-defaults';
import { Layer, Shell } from './drawer-demo';
import {
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
  DrawerTrigger,
} from './drawer-parts';
import { REACT_DRAWER_DOCS, REACT_DRAWER_TOKENS } from './drawer.docs';
import type { DrawerHandle, DrawerProps } from './drawer.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DRAWER_DOCS.drawer.scenes, {
    playground: Playground,
    mode: Mode,
    side: Side,
    size: Size,
    resize: Resize,
    snapPoints: SnapPoints,
    sheet: Sheet,
    scrimFrom: ScrimFrom,
    keyboard: Keyboard,
    modal: Modal,
    policy: Policy,
    focus: Focus,
    loading: Loading,
    nested: Nested,
    content: Content,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Drawer',
        description:
          'A panel that comes in from an edge, and either covers the page or stands beside it. One axis decides which, so a breakpoint can change it without taking the panel’s scroll position and focus with it; one cancellable request covers every way it closes; and the edge a reader drags is a separator a keyboard can move.',
        framework: 'React',
        ...REACT_DRAWER_DOCS.drawer,
        tokens: REACT_DRAWER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What a demonstration that stands open has to say for itself.
 *
 * A modal layer takes the page over: `dismissable-layer` writes `inert` on
 * every sibling up to the document root and locks the document scroll, and a
 * page carrying fifteen of them at once is a page nobody can scroll or click.
 * The first published version of these stories did exactly that — twenty-one
 * panels open, `body { overflow: hidden }` on a page twenty-three thousand
 * pixels tall, and one press anywhere closing fifteen of them at once, because
 * each read it as a press outside itself.
 *
 * So a scene that exists to be *looked at* is not modal, does not take focus
 * and cannot be dismissed. Nothing here changes the picture: the scrim belongs
 * to the layer rather than to the dismissal policy, so `modal` decides only
 * what happens to the page behind it. A scene that exists to be *operated*
 * keeps its real behavior and is opened from a trigger, one at a time — which
 * is also what the reader does in an application.
 */
const STILL = {
  escape: 'none',
  initialFocus: false,
  modal: false,
  outsidePress: 'none',
} as const satisfies Partial<DrawerProps>;

/** One panel, written once, so a scene shows the axis rather than the markup. */
function Panel({
  actions = true,
  body = (
    <Text size="sm">A drawer holds a secondary task. The middle row is the one that scrolls.</Text>
  ),
  container,
  description = 'Issued on August 12, due in 11 days.',
  resizer = false,
  title = 'Invoice 4471',
  ...props
}: Partial<DrawerProps> & {
  actions?: boolean;
  body?: ReactNode;
  container: Element;
  description?: string | null;
  resizer?: boolean;
  title?: string;
}) {
  return (
    <Drawer container={container} defaultOpen {...STILL} {...props}>
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description === null ? null : <DrawerDescription>{description}</DrawerDescription>}
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>{body}</DrawerBody>
        {actions ? (
          <DrawerFooter>
            <Button size="sm" tone="secondary" variant="ghost">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </DrawerFooter>
        ) : null}
        {resizer ? <DrawerResizer /> : null}
      </DrawerPanel>
    </Drawer>
  );
}

/**
 * One line of its own. `Text` renders a `span`, so three of them in a drawer's
 * body ran together as `TodasRecentesArquivadas` on the published page — the
 * Angular page reads correctly because `p slText` is a block there.
 */
function Line({ children, tone }: { children: ReactNode; tone?: 'muted' }) {
  return (
    <Text render={(props) => <p {...props} />} size="sm" {...(tone === undefined ? {} : { tone })}>
      {children}
    </Text>
  );
}

/**
 * The page an inline drawer stands beside, so the reflow is visible. The shell
 * primitive owns its inset: a story that padded it inline would answer no
 * density and no scheme, which is what `specs/reference-pages.test.mjs` refuses.
 */
function Page({ children }: { children?: ReactNode }) {
  return (
    <main>
      <Text size="sm" tone="muted">
        {children ??
          'No scrim, no portal and no z-index. The content beside it reflows because the consumer grid says so.'}
      </Text>
    </main>
  );
}

/**
 * The navigation a product would actually have, and not three words standing in
 * for one.
 *
 * `references/stories.md` asks for a real screen rather than a specimen, and the
 * inline scenes were the page's clearest failure of it: a panel called
 * "Collections" holding "All", "Recent" and "Archived" beside a paragraph
 * describing the component. It demonstrated that the family renders. Real
 * labels, real counts and one awkward one — a queue with nothing in it — are
 * what show whether it holds.
 */
function Navigation() {
  return (
    <>
      <Text render={(props) => <p {...props} />} size="sm" weight="semibold">
        Contas a receber
      </Text>
      <Line>Overdue · 14</Line>
      <Line>Due in 7 days · 32</Line>
      <Line>In reconciliation · 3</Line>
      <Line tone="muted">Disputes · none</Line>
      <Line tone="muted">Automatic write-offs not reconciled since 09/02</Line>
    </>
  );
}

/** The invoice the navigation leads to. */
function Workbench() {
  return (
    <main>
      <Text size="lg" weight="semibold">
        Invoice 20,483 · Bay View Metalworks
      </Text>
      <Text size="sm" tone="muted">
        Issued on 09/02/2026 · due 10/02/2026 · $18,420.00 · overdue by 9 days
      </Text>
      <Text size="sm" tone="muted">
        Drag the sidebar edge: the measure it publishes is the same one this layout applies.
      </Text>
    </main>
  );
}

export const Playground: Story = {
  args: {
    escape: 'close',
    loading: false,
    modal: true,
    mode: 'overlay',
    mount: 'active',
    outsidePress: 'close',
    side: 'end',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Layer>
      {(container) => (
        <Drawer {...args} container={container}>
          <DrawerTrigger
            render={({ children, ...props }) => <Button {...props}>{children}</Button>}
          >
            Open details
          </DrawerTrigger>
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Invoice 4471</DrawerTitle>
              <DrawerDescription>Issued on August 12.</DrawerDescription>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <TextField aria-label="Note" defaultValue="Awaiting reconciliation" />
            </DrawerBody>
            <DrawerFooter>
              <Button size="sm" tone="secondary" variant="ghost">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </DrawerFooter>
          </DrawerPanel>
        </Drawer>
      )}
    </Layer>
  ),
};

export const Mode: Story = {
  parameters: scenario('mode'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="overlay — a layer over the page"
        note="Portalled, fixed to the viewport, with a scrim and the whole dismissal policy. In an application the containing block is the viewport; here it is the dashed box."
      >
        <Layer>{(container) => <Panel container={container} />}</Layer>
      </Scene>
      <Scene
        label="inline — a panel beside it"
        note="No portal, no scrim and no z-index: a real sidebar, with the separator on the edge and the invoice beside it. The page reflows because the consumer's grid says so, which is what replaces Angular Material's push and MUI's persistent."
      >
        <Shell>
          <Drawer defaultExtent={0.34} defaultOpen mode="inline" side="start" size="sm">
            <DrawerPanel render={(props) => <nav {...props} aria-label="Accounts" />}>
              <DrawerHeader>
                <DrawerTitle>Receivables</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Navigation />
              </DrawerBody>
              <DrawerResizer />
            </DrawerPanel>
          </Drawer>
          <Workbench />
        </Shell>
      </Scene>
    </Grid>
  ),
};

export const Side: Story = {
  parameters: scenario('side'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="end — the default"
        note="The edge a detail panel comes from in a left-to-right document, and the other one in a mirrored document. Switch the direction in the toolbar: the whole panel mirrors, including the separator."
      >
        <Layer>{(container) => <Panel container={container} size="sm" />}</Layer>
      </Scene>
      <Scene
        label="bottom — a sheet"
        note="The sheet keeps the two corners the reader can see and puts the separator above the header, which is where a hand looks for it. A side drawer keeps no corners at all: it reads as a wall rather than as a card."
      >
        <Layer>
          {(container) => (
            <Panel
              container={container}
              description={null}
              resizer
              side="bottom"
              size="sm"
              title="Filter invoices"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="sm — for a summary"
        note="Eighteen rems. Wide enough for a definition list and two actions, narrow enough that the page behind it is still legible under the scrim."
      >
        <Layer>{(container) => <Panel container={container} size="sm" />}</Layer>
      </Scene>
      <Scene
        label="xl — for a form"
        note="Forty rems, and a title one step larger to match. The step a two-column form needs; below it the columns stack and the panel reads as one long list of fields."
      >
        <Layer>
          {(container) => <Panel container={container} size="xl" title="Edit billing details" />}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Resize: Story = {
  parameters: scenario('resize'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A separator, not a prop"
        note="The edge is the control, and it is visible without touching it: two hairlines with the handle in the middle, running the whole gutter under the hand. Reach it with Tab and use the arrows — sixteen pixels per press, sixty-four with Shift — Home and End go to the limits, Enter collapses and restores, and a double click returns to the size step's measure. Ant's resizer and Vaul's drag are pointer-only."
      >
        <Shell>
          <Drawer defaultExtent={0.32} defaultOpen minExtent={0.18} mode="inline" side="start">
            <DrawerPanel>
              <DrawerHeader>
                <DrawerTitle>Receivables</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Navigation />
              </DrawerBody>
              <DrawerResizer />
            </DrawerPanel>
          </Drawer>
          <Page>
            The public measure is a fraction of the box in which the panel is measured, and it is
            what becomes aria-valuenow.
          </Page>
        </Shell>
      </Scene>
    </Grid>
  ),
};

export const SnapPoints: Story = {
  parameters: scenario('snapPoints'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three heights, all reachable by keyboard"
        note="A snap point is a stop of the same separator, so an arrow moves between them and Home and End reach the first and last. Dragging the edge below the first stop asks to close, carrying pointer."
      >
        <Layer>
          {(container) => (
            <Panel
              actions={false}
              body={
                <Text size="sm">
                  Drag the edge, or use the arrows: the stops are 30%, 60% and 95% of the layer.
                </Text>
              }
              container={container}
              defaultExtent={0.3}
              description={null}
              resizer
              side="bottom"
              snapPoints={[0.3, 0.6, 0.95]}
              title="Filtros"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

/** Thirty customers, which is more than a phone shows, so the body scrolls. */
const CUSTOMERS = [
  ['Acme Logistics', '$12,480.00'],
  ['Horizon Bank', '$3,920.50'],
  ['Green House Foods', '$845.00'],
  ['North Distribution', '$27,300.00'],
  ['Lume Studio', '$1,150.00'],
  ['Downtown Community Pharmacy', '$6,712.30'],
  ['Aurora Print Shop', '$2,004.90'],
  ['Lookout Hotel', '$18,960.00'],
  ['Root Institute', '$540.00'],
  ['Ridge Gardens', '$9,870.00'],
  ['Kline Packaging', '$31,225.75'],
  ['Vitta Laboratory', '$4,380.00'],
  ['High Tide Stores', '$7,410.00'],
  ['Bay View Metalworks', '$18,420.00'],
  ['Native Cosmetics', '$2,980.40'],
  ['Bread Workshop', '$612.00'],
  ['Central Stationery', '$1,845.90'],
  ['Mountain Chemicals', '$22,130.00'],
  ['Solar Network Engineering', '$48,900.00'],
  ['Fair Price Supermarket', '$11,204.65'],
  ['Green Valley Textiles', '$5,330.00'],
  ['White Rock Power Plant', '$63,750.00'],
  ['Coastal Bus Lines', '$3,118.20'],
  ['Xavier & Sons Attorneys', '$9,000.00'],
  ['Zanella Transport', '$14,675.00'],
  ['Clear Water Utilities', '$27,480.00'],
  ['Breeze Hospitality', '$4,190.00'],
  ['Open Field Cooperative', '$16,320.00'],
  ['Delta Computing', '$2,240.00'],
  ['Eco Packaging', '$8,905.10'],
] as const;

function Customers() {
  return (
    <>
      {CUSTOMERS.map(([name, amount]) => (
        <Line key={name}>
          {name} · {amount}
        </Line>
      ))}
    </>
  );
}

/** A sheet opened from its trigger, with the real policy, to be operated. */
function SheetDemo({
  body,
  label,
  title,
  ...props
}: Partial<DrawerProps> & { body: ReactNode; label: string; title: string }) {
  return (
    <Layer size="screen">
      {(container) => (
        <Drawer container={container} side="bottom" {...props}>
          <DrawerTrigger render={(trigger) => <Button {...trigger}>{label}</Button>} />
          <DrawerPanel>
            <DrawerResizer />
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>{body}</DrawerBody>
            <DrawerFooter>
              <Button size="sm" tone="secondary" variant="ghost">
                Limpar
              </Button>
              <Button size="sm">Aplicar</Button>
            </DrawerFooter>
          </DrawerPanel>
        </Drawer>
      )}
    </Layer>
  );
}

export const Sheet: Story = {
  parameters: scenario('sheet'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Content height — the default on a block side"
        note="Three filters and a footer, and nothing under them. No size is written: on top and bottom the panel measures what it holds, and on a layer wider than forty rems it stops there and stands centerd on the scrim."
      >
        <Layer>
          {(container) => (
            <Panel
              body={
                <>
                  <Line>Period: last 30 days</Line>
                  <Line>Status: open, overdue</Line>
                  <Line>Owner: Marina Dunn</Line>
                </>
              }
              container={container}
              description={null}
              resizer
              side="bottom"
              title="Filter invoices"
            />
          )}
        </Layer>
      </Scene>
      <Scene
        label="Operate it — touch, fling, tap the grabber"
        note="It opens at half the layer; the height of its content is the second stop. Drag the body with a finger, or with touch emulation in the browser's device mode: up grows it to its content before the list scrolls, down with the list at its top moves the sheet, and a fling past 500 px/s goes to the next stop or closes. A mouse drags the grabber, and a click on it walks the two stops."
      >
        <SheetDemo
          body={<Customers />}
          defaultExtent={0.5}
          label="Customers with open balances"
          snapPoints={[0.5]}
          title="Customers with open invoices"
        />
      </Scene>
    </Grid>
  ),
};

/** The page a map sheet stands over, with controls that still answer. */
function Territory({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState('Zona Sul');
  return (
    <div className="slotted-demo-stack">
      <Text size="sm" tone="muted">
        Selected region: {selected}
      </Text>
      <div className="slotted-demo-row">
        {['Zona Norte', 'Centro', 'Zona Sul'].map((zone) => (
          <Button key={zone} onClick={() => setSelected(zone)} size="sm" variant="outline">
            {zone}
          </Button>
        ))}
      </div>
      {children}
    </div>
  );
}

export const ScrimFrom: Story = {
  parameters: scenario('scrimFrom'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Undimmed up to the middle stop"
        note="The sheet rests at a quarter of the layer with the page undimmed: the three zone buttons still answer. Tap the grabber, or press the arrows on it, to climb to sixty and ninety-five per cent — the scrim fades in from the middle stop, and a press on it no longer reaches the page."
      >
        <Layer size="screen">
          {(container) => (
            <Territory>
              <Drawer
                container={container}
                defaultExtent={0.25}
                defaultOpen
                escape="none"
                initialFocus={false}
                modal={false}
                outsidePress="none"
                scrimFrom={0.6}
                side="bottom"
                snapPoints={[0.25, 0.6, 0.95]}
              >
                <DrawerPanel>
                  <DrawerResizer />
                  <DrawerHeader>
                    <DrawerTitle>Deliveries in the region</DrawerTitle>
                  </DrawerHeader>
                  <DrawerBody>
                    <Customers />
                  </DrawerBody>
                </DrawerPanel>
              </Drawer>
            </Territory>
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

/**
 * The keyboard a desktop screen does not have. The button writes the property
 * the binding writes from `visualViewport`, on the box the layer is portalled
 * into; the layer inherits it.
 */
function KeyboardDemo() {
  const [box, setBox] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const toggle = () => {
    if (box === null) return;
    if (shown) box.style.removeProperty('--slotted-keyboard-inset');
    else box.style.setProperty('--slotted-keyboard-inset', '260px');
    setShown(!shown);
  };

  return (
    <div className="slotted-demo-stack">
      <Button onClick={toggle} size="sm" variant="outline">
        {shown ? 'Esconder o teclado simulado' : 'Simular um teclado de 260 px'}
      </Button>
      <div className="slotted-demo-viewport" data-size="screen" ref={setBox}>
        {box === null ? null : (
          <Panel
            body={
              <TextField
                aria-label="Note to the customer"
                defaultValue="Payment expected on Friday"
              />
            }
            container={box}
            description={null}
            side="bottom"
            title="Send reminder"
          />
        )}
      </div>
    </div>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The sheet recedes by what the keyboard covers"
        note="On a phone, focus the field: the layer reads the band the keyboard covers from the visual viewport and the sheet lands above the keys, footer included. On this screen the button writes the same 260 pixels the binding would."
      >
        <KeyboardDemo />
      </Scene>
    </Grid>
  ),
};

export const Modal: Story = {
  parameters: scenario('modal'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="modal — the page is out of reach"
        note="Press Open: the scroll locks, everything outside the layer goes inert, and Tab wraps inside the panel. It is opened from a trigger because a modal layer takes the whole page over, and a page showing several at once would be lying about what one does."
      >
        <Layer>
          {(container) => (
            <Drawer container={container} size="sm">
              <DrawerTrigger
                render={({ children, ...props }) => <Button {...props}>{children}</Button>}
              >
                Open modal
              </DrawerTrigger>
              <DrawerPanel>
                <DrawerHeader>
                  <DrawerTitle>Modal</DrawerTitle>
                  <DrawerDescription>
                    Scrolling is locked and the rest of the page is inert.
                  </DrawerDescription>
                  <DrawerClose />
                </DrawerHeader>
              </DrawerPanel>
            </Drawer>
          )}
        </Layer>
      </Scene>
      <Scene
        label="modal={false} — and no aria-modal"
        note="Nothing is inert, nothing is locked and focus is not contained, so the panel writes no aria-modal. The scrim stays: it belongs to the layer rather than to the dismissal policy, and it is why every still demonstration on this page can be this one."
      >
        <Layer>
          {(container) => <Panel container={container} modal={false} size="sm" title="Detalhes" />}
        </Layer>
      </Scene>
    </Grid>
  ),
};

function Guarded({ container }: { container: Element }) {
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(true);

  return (
    <>
      <Button onClick={() => setSaving((value) => !value)} size="sm" variant="outline">
        {saving ? 'Finish saving' : 'Resume saving'}
      </Button>
      <Button disabled={open} onClick={() => setOpen(true)} size="sm" variant="ghost">
        Open again
      </Button>
      <Drawer
        container={container}
        initialFocus={false}
        modal={false}
        onOpenChange={(next, request) => {
          if (!next && saving) return request.cancel();
          setOpen(next);
        }}
        open={open}
        size="sm"
      >
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Salvando</DrawerTitle>
            <DrawerDescription>
              {saving
                ? 'Escape, a click outside and the ✕ are all refused by the same guard.'
                : 'The guard is gone: now the five exits work.'}
            </DrawerDescription>
            <DrawerClose />
          </DrawerHeader>
        </DrawerPanel>
      </Drawer>
    </>
  );
}

export const Policy: Story = {
  parameters: scenario('policy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One guard, every way out"
        layout="stack"
        note="Press Escape, click the scrim, then the ✕: all three are refused by the same three lines, because they are one request carrying a reason rather than four callbacks. Let the save finish and the same three work."
      >
        <Layer>{(container) => <Guarded container={container} />}</Layer>
      </Scene>
    </Grid>
  ),
};

function Focused({ container }: { container: Element }) {
  const search = useRef<HTMLInputElement>(null);

  return (
    <Drawer container={container} initialFocus={search} size="sm">
      <DrawerTrigger render={({ children, ...props }) => <Button {...props}>{children}</Button>}>
        Search invoices
      </DrawerTrigger>
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Search invoices</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <TextField aria-label="Buscar" ref={search} />
        </DrawerBody>
      </DrawerPanel>
    </Drawer>
  );
}

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An overlay drawer takes focus"
        note="Press the trigger: initialFocus names the field rather than the first tabbable element, which here is the close button. Tab wraps inside the panel while it is modal, and Escape gives focus back to the trigger it came from."
      >
        <Layer>{(container) => <Focused container={container} />}</Layer>
      </Scene>
      <Scene
        label="An inline drawer takes none"
        note="Nothing moves when it opens: a sidebar that stole focus every time a breakpoint crossed would be unusable. It still gives focus back when it closes under the reader’s hands."
      >
        <Shell>
          <Drawer defaultOpen mode="inline" side="start" size="sm">
            <DrawerPanel>
              <DrawerHeader>
                <DrawerTitle>Receivables</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Button size="sm" variant="ghost">
                  Vencidas · 14
                </Button>
                <Button size="sm" variant="ghost">
                  In reconciliation · 3
                </Button>
              </DrawerBody>
            </DrawerPanel>
          </Drawer>
          <Page>Angular Material makes the same separation: autoFocus is false in side mode.</Page>
        </Shell>
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Open before the content arrived"
        note="The body carries aria-busy and keeps a floor, so the panel does not jump to size when the data lands. The header, the ✕ and Escape all stay operable."
      >
        <Layer>
          {(container) => (
            <Panel
              body={
                <div className="slotted-demo-stack">
                  <Skeleton shape="text" />
                  <Skeleton shape="text" />
                </div>
              }
              container={container}
              description={null}
              loading
              size="sm"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Nested: Story = {
  parameters: scenario('nested'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A drawer opened from a drawer"
        note="Escape reaches the topmost layer only, and a layer that refuses stops the request reaching the one beneath. The depth comes from the single stack dismissable-layer keeps, so nothing here states a z-index."
      >
        <Layer>
          {(container) => (
            <Panel
              actions={false}
              body={
                <Drawer container={container} size="sm">
                  <DrawerTrigger
                    render={({ children, ...props }) => (
                      <Button {...props} size="sm" variant="outline">
                        {children}
                      </Button>
                    )}
                  >
                    Ver o item 3
                  </DrawerTrigger>
                  <DrawerPanel>
                    <DrawerHeader>
                      <DrawerTitle>Item 3</DrawerTitle>
                      <DrawerClose />
                    </DrawerHeader>
                    <DrawerBody>
                      <Text size="sm">Escape closes this one and leaves the one below open.</Text>
                    </DrawerBody>
                  </DrawerPanel>
                </Drawer>
              }
              container={container}
              description={null}
              title="Order 118"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

const LONG = (
  <Text size="sm">
    The middle row is the only rail that scrolls. Bounded, it scrolls; unbounded, it would push the
    footer off the screen and the reader could not reach the button. Vaul, MUI and Angular Material
    ship no layout at all, so this is the default result of following any of the three examples. A
    third paragraph, so there is something to scroll. And a fourth, which is already below the fold.
  </Text>
);

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A string the family did not choose"
        note="A ninety-character token with no spaces breaks instead of widening the panel: the minimum measure is zero and breaking is allowed at any point."
      >
        <Layer>
          {(container) => (
            <Panel
              actions={false}
              container={container}
              description={null}
              size="sm"
              title="consolidated-bank-reconciliation-report-2026-08.csv"
            />
          )}
        </Layer>
      </Scene>
      <Scene
        label="A body longer than the layer"
        note="The header and the actions hold still while the middle row moves. This is the whole reason the panel is a three-row grid bounded to the layer."
      >
        <Layer>
          {(container) => (
            <Panel
              body={LONG}
              container={container}
              description={null}
              size="sm"
              title="Termos de uso"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The trigger is the library’s Button"
        note="render hands it every attribute the family wrote — aria-expanded, aria-controls, aria-haspopup and the id — so nothing is reimplemented and nothing is wrapped."
      >
        <Layer>
          {(container) => (
            <Drawer container={container} size="sm">
              <DrawerTrigger
                render={({ children, ...props }) => (
                  <Button {...props} tone="secondary" variant="outline">
                    {children}
                  </Button>
                )}
              >
                Open details
              </DrawerTrigger>
              <DrawerPanel>
                <DrawerHeader>
                  <DrawerTitle>Invoice 4471</DrawerTitle>
                  <DrawerClose />
                </DrawerHeader>
                <DrawerBody>
                  <Text size="sm">
                    The trigger is the library's button, with the wiring on top.
                  </Text>
                </DrawerBody>
              </DrawerPanel>
            </Drawer>
          )}
        </Layer>
      </Scene>
      <Scene
        label="The panel is the consumer’s landmark"
        note="An inline drawer writes no role, because a navigation drawer is a navigation landmark and a filter panel is complementary. render is where the consumer says which."
      >
        <Shell>
          <Drawer defaultOpen mode="inline" side="start" size="sm">
            <DrawerPanel render={(props) => <nav {...props} aria-label="Sections" />}>
              <DrawerHeader>
                <DrawerTitle>Sections</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Line>Invoice summary</Line>
                <Line>Billing history · 4 attempts</Line>
              </DrawerBody>
            </DrawerPanel>
          </Drawer>
          <Page>The panel here is a nav, not a div with a role.</Page>
        </Shell>
      </Scene>
    </Grid>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="What the provider decides"
        note="side, size, mode, mount, modal, escape and outsidePress, set once for a subtree instead of repeated on every drawer in a product."
      >
        <DrawerDefaultsProvider side="start" size="sm">
          <Layer>{(container) => <Panel container={container} description={null} />}</Layer>
        </DrawerDefaultsProvider>
      </Scene>
      <Scene
        label="What the consumer decides anyway"
        note="An explicit value always wins over a provider, over inference and over derived state — the same rule every family in the library follows."
      >
        <DrawerDefaultsProvider side="start" size="sm">
          <Layer>
            {(container) => <Panel container={container} description={null} side="end" size="md" />}
          </Layer>
        </DrawerDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="What the title is wired to"
        note="It names the panel through aria-labelledby and it names the separator too, which is the Window Splitter pattern’s own rule: a separator is named for the pane it sizes."
      >
        <Shell>
          <Drawer defaultExtent={0.35} defaultOpen mode="inline" side="start">
            <DrawerPanel>
              <DrawerHeader>
                <DrawerTitle>Receivables</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Navigation />
              </DrawerBody>
              <DrawerResizer />
            </DrawerPanel>
          </Drawer>
          <Page>
            Closed, the panel receives inert: the collapse the eye reads and the focus order agree.
          </Page>
        </Shell>
      </Scene>
    </Grid>
  ),
};

/** The imperative actions, exercised where a reader can see what they do. */
export const Handle: Story = {
  parameters: { docs: { disable: true } },
  render: () => {
    const handle = useRef<DrawerHandle>(null);

    return (
      <Layer>
        {(container) => (
          <>
            <Button onClick={() => handle.current?.open()} size="sm">
              open()
            </Button>
            <Drawer container={container} ref={handle} size="sm">
              <DrawerPanel>
                <DrawerHeader>
                  <DrawerTitle>Opened by code</DrawerTitle>
                  <DrawerClose />
                </DrawerHeader>
                <DrawerBody>
                  <Button onClick={() => handle.current?.close('done')} size="sm" variant="outline">
                    close(&apos;done&apos;)
                  </Button>
                </DrawerBody>
              </DrawerPanel>
            </Drawer>
          </>
        )}
      </Layer>
    );
  },
};
