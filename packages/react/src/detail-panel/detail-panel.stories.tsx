import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Alert, AlertActions, AlertContent, AlertDescription, AlertTitle } from '../alert';
import { Button } from '../button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '../description-list';
import { Drawer, DrawerBody, DrawerClose, DrawerPanel } from '../drawer';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Inline } from '../inline';
import { Page, PageBody } from '../page';
import { Viewport } from '../page/page-demo';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import { Stack } from '../stack';
import { Switch } from '../switch';
import { Text } from '../typography';
import { DetailPanel } from './detail-panel';
import { DetailPanelDefaultsProvider } from './detail-panel-defaults';
import {
  HISTORY,
  MONEY,
  ORDER,
  ORDERS,
  OrderFields,
  OrderFooter,
  OrderHeader,
  OrderHistory,
  OrderLines,
  OrderPanel,
  OrderSections,
} from './detail-panel-demo';
import { DetailPanelBody, DetailPanelSection } from './detail-panel-parts';
import { REACT_DETAIL_PANEL_DOCS, REACT_DETAIL_PANEL_TOKENS } from './detail-panel.docs';
import type {
  DetailPanelChangeRequest,
  DetailPanelHandle,
  DetailPanelProps,
} from './detail-panel.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DETAIL_PANEL_DOCS.detailPanel.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    layout: Layout,
    aside: Aside,
    hosts: Hosts,
    navigation: Navigation,
    sections: Sections,
    loading: Loading,
    status: Status,
    banner: Banner,
    footer: Footer,
    sizes: Sizes,
    narrow: Narrow,
    content: Content,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/DetailPanel',
  component: DetailPanel,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Detail Panel',
        description:
          'One record on screen: what identifies it, what state it is in, what can be done to it, and what happened to it. A page-header on top, sections stacked or tabbed, a column of fields beside them, a footer that stays — the same anatomy in a page, a drawer or a pane.',
        framework: 'React',
        ...REACT_DETAIL_PANEL_DOCS.detailPanel,
        tokens: REACT_DETAIL_PANEL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A room exactly as wide as the two-column breakpoint, with a screen's height. */
function Room({
  children,
  room = 'tablet',
  size = 'screen',
}: {
  children: ReactNode;
  room?: 'desktop' | 'laptop' | 'tablet' | 'phone';
  size?: 'screen' | 'tall';
}) {
  return (
    <div className="slotted-demo-room" data-room={room}>
      <Viewport size={size}>{children}</Viewport>
    </div>
  );
}

const FIRST = ORDERS[0] ?? ORDER;

function StaleAlert() {
  return (
    <Alert tone="warning">
      <AlertContent>
        <AlertTitle>This order was changed by someone else</AlertTitle>
        <AlertDescription>Martha Silver recorded a partial payment 2 minutes ago.</AlertDescription>
      </AlertContent>
      <AlertActions>
        <Button size="sm" tone="warning">
          Recarregar
        </Button>
      </AlertActions>
    </Alert>
  );
}

export const Playground: Story = {
  args: {
    layout: 'stacked',
    aside: 'end',
    level: '2',
    size: 'md',
    scroll: 'ancestor',
    mount: 'active',
    status: 'ready',
    loading: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Room>
      <OrderPanel {...(args as Partial<DetailPanelProps>)} />
    </Room>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every part, written out"
        note="The page-header with its facts and its pill on the chrome’s edge; the banner; three stacked sections at h3, each with its count and the first with its actions; the aside with a rule beside it; the footer stuck at the bottom while the box scrolls."
      >
        <Room>
          <OrderPanel banner={<StaleAlert />} footer={<OrderFooter />} scroll="self" />
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="stacked, the default"
        note="Each section is a region with a heading at h3 — one below the panel’s level 2 — its count as a badge after the words and its actions in the heading row. The strip in the header’s tabs slot draws nothing."
      >
        <Room>
          <OrderPanel layout="stacked" />
        </Room>
      </Scene>
      <Scene
        label="tabs"
        note="The same three sections: the strip appears at the bottom of the header, the lines section is the tabpanel, its actions move to a row above the table, and the aside stays beside every tab. Press History, or Tab to the strip and press ArrowRight."
      >
        <Room>
          <OrderPanel layout="tabs" />
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Aside: Story = {
  parameters: scenario('aside'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="aside='end', the default"
        note="The fields at the inline end, the rule on their start edge at the gap’s distance from both columns — Jira’s and GitHub’s sidebar."
      >
        <Room>
          <OrderPanel aside="end" layout="tabs" />
        </Room>
      </Scene>
      <Scene
        label="aside='start'"
        note="The fields first, the rule on their end edge — HubSpot’s “about” column. The DOM order does not change: the sections still come first for a reader, and the grid moves the column."
      >
        <Room>
          <OrderPanel aside="start" layout="tabs" />
        </Room>
      </Scene>
      <Scene
        label="aside='none'"
        note="No aside is rendered and the sections take the whole width; the grid has one track rather than an empty second one."
      >
        <Room>
          <OrderPanel aside="none" layout="tabs" />
        </Room>
      </Scene>
    </Grid>
  ),
};

function DrawerHost() {
  const [open, setOpen] = useState(true);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div className="slotted-demo-room" data-room="laptop">
      <div
        className="slotted-demo-viewport"
        data-size="screen"
        data-layout="page"
        ref={setContainer}
      >
        <Page>
          <PageBody>
            <Stack gap={4}>
              <Text>Sales orders · 4,812 records</Text>
              <Button onClick={() => setOpen(true)} variant="outline">
                Open SO-2026-01842
              </Button>
            </Stack>
          </PageBody>
        </Page>
        {container === null ? null : (
          <Drawer
            container={container}
            modal={false}
            onOpenChange={(next) => setOpen(next)}
            open={open}
            side="end"
            size="lg"
          >
            <DrawerPanel>
              <DrawerBody>
                <DetailPanel
                  footer={<OrderFooter onClose={() => setOpen(false)} />}
                  recordKey={ORDER.id}
                >
                  <OrderHeader close={<DrawerClose />} navigation={false} />
                  <DetailPanelBody aside={<OrderFields />}>
                    <OrderSections />
                  </DetailPanelBody>
                </DetailPanel>
              </DrawerBody>
            </DrawerPanel>
          </Drawer>
        )}
      </div>
    </div>
  );
}

export const Hosts: Story = {
  parameters: scenario('hosts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A page of its own"
        note="Inside a Page the panel is the content and its level is 1: the page-header is an h1 and the sections h2. The header sticks under the page’s chrome and the body’s container takes the page’s width and inset, so the columns align with the title."
      >
        <Room>
          <Page>
            <OrderPanel level="1" />
          </Page>
        </Room>
      </Scene>
      <Scene
        label="A drawer beside the list"
        note="The drawer is the host: it scrolls, closes on Escape and gives focus back; its Close stands in the header’s actions and Close in the panel’s footer. The panel writes none of that. Close it and open it again from the button."
      >
        <DrawerHost />
      </Scene>
      <Scene
        label="A pane that scrolls itself"
        note="scroll='self': the root is the scroll container, a flex parent may shrink it, the page-header sticks inside it and the footer at its bottom edge. This is the second pane of a master–detail split."
      >
        <Room>
          <OrderPanel footer={<OrderFooter />} scroll="self" />
        </Room>
      </Scene>
    </Grid>
  ),
};

function Browser({ layout = 'stacked' }: { layout?: 'stacked' | 'tabs' }) {
  const [index, setIndex] = useState(1);
  const order = ORDERS[index] ?? ORDER;
  const navigate = (step: -1 | 1) => setIndex((ORDERS.length + index + step) % ORDERS.length);
  return (
    <OrderPanel
      header={<OrderHeader onNavigate={navigate} order={order} />}
      fields={<OrderFields order={order} />}
      layout={layout}
      order={order}
    />
  );
}

export const Navigation: Story = {
  parameters: scenario('navigation'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three orders, and the controls in the header"
        note="Press the next control: the header, the facts and the fields change to the next order, the scroller returns to its start and the heading takes focus — read the focus ring on the title. Tab to the control first and press Enter to hear the new record announced."
      >
        <Room>
          <Browser />
        </Room>
      </Scene>
    </Grid>
  ),
};

function Model() {
  const [section, setSection] = useState<string | undefined>('linhas');
  const [log, setLog] = useState<string[]>([]);
  const handle = useRef<DetailPanelHandle>(null);
  const onSectionChange = (next: string | undefined, request: DetailPanelChangeRequest) => {
    const refused = request.reason === 'keyboard' && next === 'historico';
    if (refused) request.cancel();
    setLog((entries) =>
      [
        `${request.previous ?? '—'} → ${next} · ${request.reason}${refused ? ' · cancelled' : ''}`,
        ...entries,
      ].slice(0, 5),
    );
    if (!refused) setSection(next);
  };
  return (
    <Stack gap={5}>
      <Room>
        <OrderPanel
          layout="tabs"
          mount="lazy"
          onSectionChange={onSectionChange}
          ref={handle}
          section={section}
        />
      </Room>
      <Inline gap={3}>
        <Button
          onClick={() => handle.current?.scrollToSection('historico')}
          size="sm"
          variant="outline"
        >
          scrollToSection('historico')
        </Button>
        <Button onClick={() => setSection('expedicoes')} size="sm" variant="outline">
          section = 'expedicoes'
        </Button>
      </Inline>
      <Stack gap={1}>
        {log.length === 0 ? (
          <Text size="sm">No requests yet.</Text>
        ) : (
          log.map((entry) => (
            <Text key={entry} size="sm">
              {entry}
            </Text>
          ))
        )}
      </Stack>
    </Stack>
  );
}

function Stacked() {
  const handle = useRef<DetailPanelHandle>(null);
  return (
    <Stack gap={5}>
      <Room>
        <OrderPanel ref={handle} scroll="self" />
      </Room>
      <Inline gap={3}>
        <Button
          onClick={() => handle.current?.scrollToSection('historico')}
          size="sm"
          variant="outline"
        >
          Go to history
        </Button>
        <Button
          onClick={() => handle.current?.scrollToSection('linhas')}
          size="sm"
          variant="outline"
        >
          Go to lines
        </Button>
      </Inline>
    </Stack>
  );
}

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Controlled, with a reason, and mount='lazy'"
        note="The application owns section. The strip asks with pointer or keyboard; the buttons ask with programmatic; the log shows each request. Reaching History by keyboard is refused here — the request is cancelled and the strip stays — while a press is accepted. Lazy: once a tab has been seen its content stays mounted."
      >
        <Model />
      </Scene>
      <Scene
        label="Stacked: the value is a place"
        note="Under stacked the same value scrolls the named section under the sticky header — scroll-margin-block-start reads the chrome’s height — and marks it data-current. No control of the family moves it; a link, the URL or scrollToSection() does."
      >
        <Stacked />
      </Scene>
    </Grid>
  ),
};

function Waiting({ layout }: { layout: 'stacked' | 'tabs' }) {
  const [loading, setLoading] = useState(true);
  return (
    <Stack gap={5}>
      <Switch checked={loading} onCheckedChange={(next) => setLoading(next)}>
        loading
      </Switch>
      <Room>
        <OrderPanel header={<OrderHeader loading={loading} />} layout={layout} loading={loading} />
      </Room>
    </Stack>
  );
}

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tabbed, loading"
        note="The heading and the subheading are the page-header’s skeleton, bound on the header; the tab labels stay; the shown section has three placeholder lines and the aside four short ones. Switch it off: the words land and nothing moves."
      >
        <Waiting layout="tabs" />
      </Scene>
      <Scene
        label="Stacked, loading"
        note="Every section keeps its heading and its count — the frame is known before the record is — and shows placeholder lines in its body. The content is not mounted until loading ends."
      >
        <Waiting layout="stacked" />
      </Scene>
    </Grid>
  ),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="status='not-found'"
        note="The record was deleted. The header keeps the identifier and the back link, the message stands where the columns stood with a way back, and the footer’s Close still closes the drawer this would be in."
      >
        <Room>
          <DetailPanel footer={<OrderFooter />} recordKey="SO-2026-01900" status="not-found">
            <OrderHeader
              navigation={false}
              order={{ ...ORDER, id: 'SO-2026-01900', customer: '', status: '' }}
              strip={false}
            />
            <DetailPanelBody
              message={
                <ResultState status="not-found">
                  <ResultStateContent>
                    <ResultStateTitle>This order no longer exists</ResultStateTitle>
                    <ResultStateDescription>
                      SO-2026-01900 was deleted on September 10 by Priya Raman. The list of orders
                      was updated.
                    </ResultStateDescription>
                  </ResultStateContent>
                  <ResultStateActions>
                    <Button variant="outline">Back to orders</Button>
                  </ResultStateActions>
                </ResultState>
              }
            />
          </DetailPanel>
        </Room>
      </Scene>
      <Scene
        label="status='error'"
        note="The request failed, which is a different sentence and a different action: the record exists, and Tentar de novo is the one thing to do. Same chrome, same place."
      >
        <Room>
          <DetailPanel footer={<OrderFooter />} recordKey={ORDER.id} status="error">
            <OrderHeader strip={false} />
            <DetailPanelBody
              message={
                <ResultState status="error">
                  <ResultStateContent>
                    <ResultStateTitle>Could not load the order</ResultStateTitle>
                    <ResultStateDescription>
                      The sales service did not respond. The data in the header is the last known.
                    </ResultStateDescription>
                  </ResultStateContent>
                  <ResultStateActions>
                    <Button tone="accent">Tentar de novo</Button>
                  </ResultStateActions>
                </ResultState>
              }
            />
          </DetailPanel>
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Banner: Story = {
  parameters: scenario('banner'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An alert in the banner"
        note="The record changed on the server while the reader has it open. The alert sits under the sticky header and above the columns, the width of both, in the flow — read before the stale content — and Recarregar is the one action."
      >
        <Room>
          <OrderPanel banner={<StaleAlert />} />
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An action bar that stays"
        note="In a box that scrolls itself the footer stays at the bottom edge, painted so the content passes under it, its ActionBar aligned with the column above. Scroll to the end: the last section stops above the footer, not behind it."
      >
        <Room>
          <OrderPanel footer={<OrderFooter />} scroll="self" />
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sm"
        note="A record in a narrow drawer: the title on xl, the section headings on md, a 14 rem aside and a tighter gap."
      >
        <Room>
          <OrderPanel size="sm" />
        </Room>
      </Scene>
      <Scene
        label="md, the default"
        note="A record in a page or a wide drawer: the title on 2xl, the section headings on lg, a 16 rem aside."
      >
        <Room>
          <OrderPanel size="md" />
        </Room>
      </Scene>
      <Scene
        label="lg"
        note="A record that is the screen: the title on 3xl, the section headings on xl, an 18 rem aside and the widest gap."
      >
        <Room>
          <OrderPanel size="lg" />
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A 375-pixel phone"
        note="Below 600 pixels of the root’s own width the columns are one: the fields follow the sections with a rule above them, the header’s actions wrap under the title into the toolbar’s overflow, and every field a desktop reader has is still here."
      >
        <Room room="phone" size="tall">
          <OrderPanel />
        </Room>
      </Scene>
      <Scene
        label="The same at 360 pixels, tabbed"
        note="The strip scrolls when the tabs do not fit; the aside follows the shown section. Nothing is hidden by width."
      >
        <Measure>
          <Viewport size="tall">
            <OrderPanel layout="tabs" />
          </Viewport>
        </Measure>
      </Scene>
    </Grid>
  ),
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const LONG = {
  ...ORDER,
  id: 'PO-2026-00731',
  customer:
    'Replacement of servo motors, controllers and shielded cabling for line 3 of the Columbus plant after the September audit',
  po: 'HA-DE-2026-Q3-00092817-COLUMBUS-L3-SERVO-PLC-REPL',
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A title of a whole sentence, and a reference with no spaces"
        note="The page-header clamps the heading at three lines with the full text in its title attribute; the aside wraps the supplier reference at any character rather than widening its 16 rem track."
      >
        <Room>
          <OrderPanel
            fields={
              <DescriptionList layout="stack">
                <DescriptionListItem>
                  <DescriptionListTerm>Supplier</DescriptionListTerm>
                  <DescriptionListDescription>Helios Automation GmbH</DescriptionListDescription>
                </DescriptionListItem>
                <DescriptionListItem>
                  <DescriptionListTerm>Supplier reference</DescriptionListTerm>
                  <DescriptionListDescription>{LONG.po}</DescriptionListDescription>
                </DescriptionListItem>
              </DescriptionList>
            }
            header={<OrderHeader navigation={false} order={LONG} />}
            order={LONG}
          />
        </Room>
      </Scene>
      <Scene
        label="Twelve sections"
        note="A record with a section per month: the strip overflows and scrolls with the tabs family’s paging controls, and the section value still names one of them."
      >
        <Room>
          <DetailPanel layout="tabs" recordKey={ORDER.id}>
            <OrderHeader navigation={false} />
            <DetailPanelBody>
              {MONTHS.map((month, index) => (
                <DetailPanelSection count={index + 1} key={month} label={month} name={month}>
                  <Text size="sm">
                    {index + 1} order{index === 0 ? '' : 's'} in {month} 2026 ·{' '}
                    {MONEY.format((index + 1) * 4_120)}
                  </Text>
                </DetailPanelSection>
              ))}
            </DetailPanelBody>
          </DetailPanel>
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The families a record is made of"
        note="A Table in the lines, a Timeline feed in the history, a DescriptionList in the aside with a copy control on the invoice, a Toolbar with overflow in the header’s actions and a Tag in its marks. The panel places each and owns none of their behaviour."
      >
        <Room>
          <DetailPanel recordKey={ORDER.id}>
            <OrderHeader />
            <DetailPanelBody aside={<OrderFields />}>
              <DetailPanelSection count={4} label="Linhas" name="linhas">
                <OrderLines />
              </DetailPanelSection>
              <DetailPanelSection count={HISTORY.length} label="History" name="historico">
                <OrderHistory />
              </DetailPanelSection>
            </DetailPanelBody>
          </DetailPanel>
        </Room>
      </Scene>
    </Grid>
  ),
};

function Named() {
  const handle = useRef<DetailPanelHandle>(null);
  return (
    <Stack gap={5}>
      <Button onClick={() => handle.current?.focus()} size="sm" variant="outline">
        handle.focus()
      </Button>
      <Room>
        <OrderPanel aria-label="Sales order SO-2026-01842" ref={handle} />
      </Room>
    </Stack>
  );
}

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two panels under one provider"
        note="Neither panel states a layout or an aside side; both read tabbed with the fields at the start. A panel that states its own still wins. The aside's name comes from the language in force."
      >
        <DetailPanelDefaultsProvider aside="start" layout="tabs">
          <Stack gap={6}>
            <Room>
              <OrderPanel />
            </Room>
            <Room>
              <OrderPanel order={FIRST} fields={<OrderFields order={FIRST} />} />
            </Room>
          </Stack>
        </DetailPanelDefaultsProvider>
      </Scene>
      <Scene
        label="The handle"
        note="focus() puts focus on the page-header’s heading, which is where a new record starts; scrollToSection() asks with the reason programmatic. A consumer’s own aria-label replaces the heading wiring on the article."
      >
        <Named />
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Landmarks and the tab sequence"
        note="The article is named by its heading and the aside is a complementary landmark named by the aside message. Tab from the strip’s selected tab: the shown section takes the outward ring, then the table inside it, then the fields. Press next in the header and the heading takes focus."
      >
        <Room>
          <Browser layout="tabs" />
        </Room>
      </Scene>
    </Grid>
  ),
};
