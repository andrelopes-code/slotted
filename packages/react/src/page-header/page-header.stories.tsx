import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { Avatar } from '../avatar';
import { Button, IconButton } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Page, PageBody } from '../page';
import {
  HISTORY,
  LINES,
  OrderFacts,
  OrderFooter,
  OrderHeader,
  OrderLines,
  OrderScreen,
  OrderSections,
  RECORDS,
  Viewport,
} from '../page/page-demo';
import { Section, SectionBody, SectionHeader, SectionHeading, SectionTitle } from '../section';
import { Stack } from '../stack';
import { Tab, TabList, Tabs } from '../tabs';
import { Tag } from '../tag';
import { Text } from '../typography';
import { PageHeader } from './page-header';
import { PageHeaderDefaultsProvider } from './page-header-defaults';
import {
  PageHeaderActions,
  PageHeaderArea,
  PageHeaderBack,
  PageHeaderContent,
  PageHeaderControls,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderMarks,
  PageHeaderNav,
  PageHeaderNavigation,
  PageHeaderPin,
  PageHeaderSubheading,
  PageHeaderProgress,
  PageHeaderTabs,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
  PageHeaderToggle,
  PageHeaderVisual,
} from './page-header-parts';
import { REACT_PAGE_HEADER_DOCS, REACT_PAGE_HEADER_TOKENS } from './page-header.docs';
import type { PageHeaderHandle, PageHeaderProps } from './page-header.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_PAGE_HEADER_DOCS.pageHeader.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    collapse: Collapse,
    pin: Pin,
    when: When,
    size: Size,
    navigation: Navigation,
    actions: Actions,
    tabs: TabsScene,
    loading: Loading,
    progress: Progress,
    content: Content,
    narrow: Narrow,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Page header',
        description:
          'The shell of a screen’s top: a title area that never leaves, a header area that scrolls away under it and comes back, a pill of controls on the chrome’s edge, and a slot for tabs. SAP Fiori’s Dynamic Page, rebuilt on one sticky root.',
        framework: 'React',
        ...REACT_PAGE_HEADER_DOCS.pageHeader,
        tokens: REACT_PAGE_HEADER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Playground ────────────────────────────────────────────────────────── */

export const Playground: Story = {
  args: {
    collapse: 'scroll',
    defaultExpanded: true,
    defaultPinned: false,
    level: '1',
    loading: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <OrderScreen header={args as Partial<PageHeaderProps>} />,
};

/* ── Anatomy ───────────────────────────────────────────────────────────── */

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every part, at rest"
        note="The nav row — the way back is written too, and yields to the breadcrumbs beside it; narrow the stage below 600 pixels and it returns — the title row with visual — the supplier’s mark as an image here, the kind of record as an icon on the other screens, initials where nothing else exists — heading, mark, subheading, actions and record navigation, the area with the description and the facts, the pill on the edge, and the tabs. Scroll the screen to see which of them stay."
      >
        <OrderScreen header={{ figure: true, visual: 'image' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Collapse ──────────────────────────────────────────────────────────── */

function ReasonLog({ children }: { children: (log: (reason: string) => void) => React.ReactNode }) {
  const [reasons, setReasons] = useState<string[]>([]);
  const log = (reason: string) => setReasons((previous) => [reason, ...previous].slice(0, 6));
  return (
    <Stack gap={4}>
      {children(log)}
      <Text size="sm" tone="muted">
        {reasons.length === 0 ? 'No requests yet.' : `Reasons: ${reasons.join(' · ')}`}
      </Text>
    </Stack>
  );
}

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="collapse='scroll', the default"
        note="Scroll down: the area slides under the title and the request says scroll. Press the chevron while scrolled: the area comes back in place, revealed, until the next scroll. Scroll to the top: it returns on its own."
      >
        <ReasonLog>
          {(log) => (
            <OrderScreen
              header={{
                onExpandedChange: (expanded, request) =>
                  log(`${request.reason} → ${expanded ? 'open' : 'closed'}`),
              }}
            />
          )}
        </ReasonLog>
      </Scene>
      <Scene
        label="The toggle at rest"
        note="Without scrolling, press the chevron: the area folds as a grid track — the content’s own height at every frame — and its filters leave the tab sequence. Press again and it unfolds."
      >
        <Viewport size="tall">
          <Page footer={undefined}>
            <OrderHeader tabs={false} />
            <PageBody>
              <Text size="sm">
                Short content: nothing scrolls, and only the control collapses the area.
              </Text>
            </PageBody>
          </Page>
        </Viewport>
      </Scene>
      <Scene
        label="collapse='manual'"
        note="The whole header stays while the page scrolls — sap.f’s preserveHeaderStateOnScroll. Only the chevron, the pin and the application move the area, and the pill is then the one way to take it out of the way."
      >
        <OrderScreen header={{ collapse: 'manual' }} />
      </Scene>
    </Grid>
  ),
};

/* ── Pin ───────────────────────────────────────────────────────────────── */

export const Pin: Story = {
  parameters: scenario('pin'),
  render: () => {
    function Remembered() {
      const [pinned, setPinned] = useState(true);
      return (
        <Stack gap={4}>
          <OrderScreen header={{ pinned, onPinnedChange: setPinned }} />
          <Text size="sm" tone="muted">
            pinned: {String(pinned)} — the value belongs to the consumer and survives a new visit.
          </Text>
        </Stack>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="Pinned from the start, and owned"
          note="Scroll: the whole header stays and the table’s header stops under it, lower than it would. Let go while scrolled: the area stays revealed until the next scroll. Press the chevron while pinned: the pin lets go first."
        >
          <Remembered />
        </Scene>
      </Grid>
    );
  },
};

/* ── When ──────────────────────────────────────────────────────────────── */

export const When: Story = {
  parameters: scenario('when'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two headings, one at a time"
        note="Expanded, the report’s full title and its subtitle; scrolled, the short title alone, and the accessibility tree holds one heading either way. Scroll down and up to watch the swap."
      >
        <Viewport>
          <Page>
            <PageHeader>
              <PageHeaderTitleArea>
                <PageHeaderNav>
                  <PageHeaderBack href="#reports">Reports</PageHeaderBack>
                </PageHeaderNav>
                <PageHeaderTitleRow>
                  <PageHeaderTitle>
                    <PageHeaderHeading data-when="expanded">
                      Third-quarter tax compliance report
                    </PageHeaderHeading>
                    <PageHeaderHeading data-when="snapped">
                      Conformidade fiscal · T3
                    </PageHeaderHeading>
                    <PageHeaderMarks>
                      <Tag shape="pill" size="sm" tone="success">
                        Publicado
                      </Tag>
                    </PageHeaderMarks>
                    <PageHeaderSubheading data-when="expanded">
                      Consolidated from the 14 branches, generated on September 10, 2026 at 06:00
                    </PageHeaderSubheading>
                  </PageHeaderTitle>
                  <PageHeaderActions>
                    <Button variant="outline">Exportar PDF</Button>
                  </PageHeaderActions>
                </PageHeaderTitleRow>
              </PageHeaderTitleArea>
              <PageHeaderArea>
                <PageHeaderContent>
                  <PageHeaderDescription>
                    Sales, payroll, and excise tax reconciliation by branch, with the discrepancies
                    flagged by internal audit and the remediation deadline for each one.
                  </PageHeaderDescription>
                </PageHeaderContent>
              </PageHeaderArea>
              <PageHeaderControls>
                <PageHeaderToggle />
                <PageHeaderPin />
              </PageHeaderControls>
            </PageHeader>
            <PageBody>
              <OrderSections />
            </PageBody>
          </Page>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Size ──────────────────────────────────────────────────────────────── */

function Sized({ note, size }: { note: string; size: 'sm' | 'md' | 'lg' }) {
  return (
    <PageHeader level={size === 'sm' ? '2' : '1'} size={size}>
      <PageHeaderTitleArea>
        <PageHeaderTitleRow>
          <PageHeaderTitle>
            <PageHeaderHeading>Notas fiscais de entrada</PageHeaderHeading>
            <PageHeaderSubheading>{note}</PageHeaderSubheading>
          </PageHeaderTitle>
          <PageHeaderActions>
            <Button size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} tone="accent">
              Importar XML
            </Button>
          </PageHeaderActions>
        </PageHeaderTitleRow>
      </PageHeaderTitleArea>
    </PageHeader>
  );
}

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sm"
        note="A header inside a pane or a drawer: the title on the xl step, the snapped title on md. Here it is an h2, because the pane is not the page — size and rank are two decisions."
      >
        <Sized note="sm — 1.125rem, an h2 inside a pane" size="sm" />
      </Scene>
      <Scene
        label="md, the default"
        note="The title of a screen, on the 2xl step; snapped it drops to lg. Everything geometric — the pill, the gaps, the padding — comes from the control scales, so a dense page tightens rather than shrinks."
      >
        <Sized note="md — 1.25rem, the default" size="md" />
      </Scene>
      <Scene
        label="lg"
        note="The landing screen of a module: 3xl, snapped to xl. The actions step with it when the consumer asks; the header itself never sizes another family’s control."
      >
        <Sized note="lg — 1.5rem, the landing screen of a module" size="lg" />
      </Scene>
    </Grid>
  ),
};

/* ── Navigation ────────────────────────────────────────────────────────── */

export const Navigation: Story = {
  parameters: scenario('navigation'),
  render: () => {
    function Records() {
      const [index, setIndex] = useState(2);
      const record = RECORDS[index] as string;
      return (
        <Viewport>
          <Page footer={<OrderFooter />}>
            <PageHeader>
              <PageHeaderTitleArea>
                <PageHeaderNav>
                  <PageHeaderBack href="#orders">Purchase orders</PageHeaderBack>
                </PageHeaderNav>
                <PageHeaderTitleRow>
                  <PageHeaderVisual>
                    <Avatar name="Aurora Logistics" shape="square" size="lg" tone="accent" />
                  </PageHeaderVisual>
                  <PageHeaderTitle>
                    <PageHeaderHeading>Purchase order {record}</PageHeaderHeading>
                    <PageHeaderMarks>
                      <Tag shape="pill" size="sm" tone={index % 2 === 0 ? 'warning' : 'success'}>
                        {index % 2 === 0 ? 'Under review' : 'Approved'}
                      </Tag>
                    </PageHeaderMarks>
                    <PageHeaderSubheading>
                      {index + 1} of {RECORDS.length} · Aurora Logistics LLC
                    </PageHeaderSubheading>
                  </PageHeaderTitle>
                  <PageHeaderActions>
                    <Button variant="outline">Reprovar</Button>
                    <Button tone="accent">Aprovar</Button>
                  </PageHeaderActions>
                  <PageHeaderNavigation>
                    <IconButton
                      aria-label="Previous order"
                      disabled={index === 0}
                      onClick={() => setIndex((current) => Math.max(0, current - 1))}
                      variant="ghost"
                    >
                      <ChevronLeft aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      aria-label="Next order"
                      disabled={index === RECORDS.length - 1}
                      onClick={() =>
                        setIndex((current) => Math.min(RECORDS.length - 1, current + 1))
                      }
                      variant="ghost"
                    >
                      <ChevronRight aria-hidden="true" />
                    </IconButton>
                  </PageHeaderNavigation>
                </PageHeaderTitleRow>
              </PageHeaderTitleArea>
              <PageHeaderArea>
                <PageHeaderContent>
                  <OrderFacts />
                </PageHeaderContent>
              </PageHeaderArea>
              <PageHeaderControls>
                <PageHeaderToggle />
                <PageHeaderPin />
              </PageHeaderControls>
            </PageHeader>
            <PageBody>
              <OrderSections />
            </PageBody>
          </Page>
        </Viewport>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="Four orders, one screen"
          note="The arrows change the record in place: heading, mark and subheading follow, the first and the last arrow disable at the ends. Scroll first, then move: the header stays where the scroll left it."
        >
          <Records />
        </Scene>
      </Grid>
    );
  },
};

/* ── Actions ───────────────────────────────────────────────────────────── */

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Six actions in a toolbar that folds"
        note="Drag the stage narrower by its corner: Duplicar, Imprimir and Exportar fold into the toolbar’s menu first, Reprovar next, and Aprovar — the one with no counterpart — never leaves the row."
      >
        <Viewport size="tall">
          <Page>
            <OrderHeader actions="full" navigation={false} tabs={false} />
            <PageBody>
              <Text size="sm">
                Resize the stage: overflow belongs to the toolbar, not the header.
              </Text>
            </PageBody>
          </Page>
        </Viewport>
      </Scene>
      <Scene
        label="Two actions and no toolbar"
        note="A header with a primary and a secondary action needs no toolbar: two buttons in the slot, and the row wraps them under the title when the width runs out."
      >
        <Viewport size="tall">
          <Page>
            <OrderHeader actions="two" navigation={false} tabs={false} />
            <PageBody>
              <Text size="sm">Two actions, no menu.</Text>
            </PageBody>
          </Page>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Tabs ──────────────────────────────────────────────────────────────── */

export const TabsScene: Story = {
  name: 'Tabs',
  parameters: scenario('tabs'),
  render: () => {
    function Tabbed() {
      const [tab, setTab] = useState('itens');
      return (
        <Viewport>
          <Page footer={<OrderFooter />}>
            <PageHeader>
              <PageHeaderTitleArea>
                <PageHeaderNav>
                  <PageHeaderBack href="#orders">Purchase orders</PageHeaderBack>
                </PageHeaderNav>
                <PageHeaderTitleRow>
                  <PageHeaderTitle>
                    <PageHeaderHeading>Purchase order PC-2026-004521</PageHeaderHeading>
                    <PageHeaderMarks>
                      <Tag shape="pill" size="sm" tone="warning">
                        Under review
                      </Tag>
                    </PageHeaderMarks>
                    <PageHeaderSubheading>
                      Aurora Logistics LLC · EIN 12-3456789
                    </PageHeaderSubheading>
                  </PageHeaderTitle>
                  <PageHeaderActions>
                    <Button variant="outline">Reprovar</Button>
                    <Button tone="accent">Aprovar</Button>
                  </PageHeaderActions>
                </PageHeaderTitleRow>
              </PageHeaderTitleArea>
              <PageHeaderArea>
                <PageHeaderContent>
                  <OrderFacts />
                </PageHeaderContent>
              </PageHeaderArea>
              <PageHeaderControls>
                <PageHeaderToggle />
                <PageHeaderPin />
              </PageHeaderControls>
              <PageHeaderTabs>
                <Tabs onValueChange={setTab} value={tab}>
                  <TabList aria-label="Order sections">
                    <Tab value="itens">Items ({LINES.length})</Tab>
                    <Tab value="historico">History ({HISTORY.length})</Tab>
                    <Tab value="anexos">Attachments (3)</Tab>
                  </TabList>
                </Tabs>
              </PageHeaderTabs>
            </PageHeader>
            <PageBody>
              {tab === 'itens' ? (
                <OrderLines />
              ) : tab === 'historico' ? (
                <Stack gap={4}>
                  {HISTORY.map(([when, who, what]) => (
                    <Text key={when} size="sm">
                      <strong>
                        {when} · {who}
                      </strong>{' '}
                      — {what}
                    </Text>
                  ))}
                </Stack>
              ) : (
                <Stack gap={4}>
                  <Text size="sm">cotacao-aurora-2026-09.pdf · 412 kB</Text>
                  <Text size="sm">cotacao-michelin-2026-09.pdf · 388 kB</Text>
                  <Text size="sm">parecer-juridico-04-09.pdf · 1,2 MB</Text>
                </Stack>
              )}
            </PageBody>
          </Page>
        </Viewport>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="Tabs that stay under the title"
          note="Scroll until the area has gone: the tabs sit under the title with the rule between. Switch tabs there: the body changes and the header does not move, because the tabs are the root’s last row and the root is what sticks."
        >
          <Tabbed />
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
              window.setTimeout(() => setLoading(false), 1600);
            }}
            size="sm"
            variant="outline"
          >
            Load again
          </Button>
          <Viewport size="tall">
            <Page>
              <OrderHeader loading={loading} navigation={false} tabs={false} />
              <PageBody>
                {loading ? <Text size="sm">Loading the order…</Text> : <OrderFacts />}
              </PageBody>
            </Page>
          </Viewport>
          {loading ? (
            <Button onClick={() => setLoading(false)} size="sm" tone="accent">
              Chegou
            </Button>
          ) : null}
        </Stack>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="The title has not arrived"
          note="The heading, the subheading and the description stand as Skeleton text of their own width — 24, 32 and 40 characters — while the actions stay pressable and the root says aria-busy. Press Chegou: nothing under them moves."
        >
          <Fetching />
        </Scene>
      </Grid>
    );
  },
};

/* ── Progress ──────────────────────────────────────────────────────────── */

function Refreshing({ tabs }: { tabs: boolean }) {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <Stack gap={4}>
      <div className="slotted-demo-row">
        <Button
          onClick={() => {
            setRefreshing(true);
            window.setTimeout(() => setRefreshing(false), 1600);
          }}
          size="sm"
          variant="outline"
        >
          Refresh the order
        </Button>
      </div>
      <Viewport size="tall">
        <Page>
          <OrderHeader
            navigation={false}
            progress={<PageHeaderProgress loading={refreshing} />}
            tabs={tabs}
          />
          <PageBody>
            <OrderFacts />
          </PageBody>
        </Page>
      </Viewport>
    </Stack>
  );
}

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A refresh, over the edge the pill straddles"
        note="Press Atualizar: after 200 ms an indeterminate bar grows out of the line the pill straddles, above the tabs and not on the tab strip's own edge, where it would read as the selected tab's indicator. The header and the order stay readable, nothing moves, and the bar holds for at least 400 ms."
      >
        <Refreshing tabs />
      </Scene>
      <Scene
        label="With no tabs, on the header's own hairline"
        note="Without tabs the line where the chrome ends is the root's hairline, and the bar covers it the whole width of the header. Scroll until the header snaps: the bar stays on the snapped edge, because it keeps its place beside the controls."
      >
        <Refreshing tabs={false} />
      </Scene>
    </Grid>
  ),
};

/* ── Content ───────────────────────────────────────────────────────────── */

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A nine-word title, five marks, a long subheading"
        note="Expanded, the title wraps and clamps at two lines with the whole string in its title attribute; the marks wrap to a second row; the subheading wraps. Scroll: the bar holds the title to one line and the subheading to another."
      >
        <Viewport>
          <Page footer={<OrderFooter />}>
            <PageHeader>
              <PageHeaderTitleArea>
                <PageHeaderNav>
                  <PageHeaderBack href="#contratos">
                    Contratos de fornecimento continuado
                  </PageHeaderBack>
                </PageHeaderNav>
                <PageHeaderTitleRow>
                  <PageHeaderTitle>
                    <PageHeaderHeading>
                      Renewal of the ongoing supply contract for tires, tubes, and retreading
                      services for the heavy fleet of the Southeast region
                    </PageHeaderHeading>
                    <PageHeaderMarks>
                      <Tag shape="pill" size="sm" tone="warning">
                        Under legal review
                      </Tag>
                      <Tag shape="pill" size="sm" tone="accent">
                        Renewal
                      </Tag>
                      <Tag shape="pill" size="sm" tone="secondary">
                        Sudeste
                      </Tag>
                      <Tag shape="pill" size="sm" tone="danger">
                        Vence em 12 dias
                      </Tag>
                      <Tag shape="pill" size="sm" tone="success">
                        Garantia ativa
                      </Tag>
                    </PageHeaderMarks>
                    <PageHeaderSubheading>
                      Aurora Logistics LLC · Michelin North America · Term 10/01/2026 – 09/30/2028 ·
                      Manager: Maria Duncan · Auto-renewal disabled
                    </PageHeaderSubheading>
                  </PageHeaderTitle>
                  <PageHeaderActions>
                    <Button variant="outline">Send to legal</Button>
                    <Button tone="accent">Approve renewal</Button>
                  </PageHeaderActions>
                </PageHeaderTitleRow>
              </PageHeaderTitleArea>
              <PageHeaderArea>
                <PageHeaderContent>
                  <PageHeaderDescription>
                    Zweijährige Verlängerung des Rahmenvertrags für Reifen, Schläuche und
                    Runderneuerungsdienste; die Konditionen der ersten Laufzeit bleiben bestehen,
                    die Preisgleitklausel wird an den Index des dritten Quartals gekoppelt.
                  </PageHeaderDescription>
                </PageHeaderContent>
              </PageHeaderArea>
              <PageHeaderControls>
                <PageHeaderToggle />
                <PageHeaderPin />
              </PageHeaderControls>
            </PageHeader>
            <PageBody>
              <OrderSections />
            </PageBody>
          </Page>
        </Viewport>
      </Scene>
      <Scene
        label="The least a header can be"
        note="One heading and nothing else. No nav row, no area, no pill: the parts that are not written leave no vacancy behind, because the stylesheet asks the DOM and not a prop."
      >
        <PageHeader>
          <PageHeaderTitleArea>
            <PageHeaderTitleRow>
              <PageHeaderTitle>
                <PageHeaderHeading>Dashboard</PageHeaderHeading>
              </PageHeaderTitle>
            </PageHeaderTitleRow>
          </PageHeaderTitleArea>
        </PageHeader>
      </Scene>
    </Grid>
  ),
};

/* ── Narrow ────────────────────────────────────────────────────────────── */

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The same header in a 360-pixel column"
        note="Below 600 pixels the breadcrumbs go and the way back stays, the title steps down a size, the toolbar folds its actions and the arrows take the row under the title. Scroll inside the column: the bar is still one line."
      >
        <Measure>
          <Viewport>
            <Page footer={<OrderFooter />}>
              <OrderHeader figure />
              <PageBody>
                <OrderSections compact />
              </PageBody>
            </Page>
          </Viewport>
        </Measure>
      </Scene>
    </Grid>
  ),
};

/* ── Composition ───────────────────────────────────────────────────────── */

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Page, sticky sections, sticky table header, footer"
        note="Scroll: the header snaps, then each section’s header stops under the chrome, and inside the first the table’s column header stops under that. Pin the header and everything stops lower. The footer waits at the bottom throughout."
      >
        <OrderScreen sticky />
      </Scene>
      <Scene
        label="A header that is not a page’s"
        note="Outside a page the rows take the content width and the header still sticks to whatever scrolls — here, a plain box. A detail pane in a master–detail layout is this."
      >
        <Viewport size="tall">
          <div className="slotted-demo-page">
            <OrderHeader breadcrumbs={false} level="2" navigation={false} size="sm" tabs={false} />
            <Stack gap={4}>
              {LINES.slice(0, 12).map((line) => (
                <Text key={line.code} size="sm">
                  {line.code} · {line.description}
                </Text>
              ))}
            </Stack>
          </div>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

/* ── Defaults ──────────────────────────────────────────────────────────── */

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => {
    function Handle() {
      const ref = useRef<PageHeaderHandle>(null);
      return (
        <Stack gap={4}>
          <Stack gap={2}>
            <Button onClick={() => ref.current?.collapse()} size="sm" variant="outline">
              collapse()
            </Button>
            <Button onClick={() => ref.current?.expand()} size="sm" variant="outline">
              expand()
            </Button>
            <Button onClick={() => ref.current?.pin()} size="sm" variant="outline">
              pin()
            </Button>
            <Button onClick={() => ref.current?.unpin()} size="sm" variant="outline">
              unpin()
            </Button>
          </Stack>
          <OrderScreen header={{ ref }} />
        </Stack>
      );
    }
    return (
      <Grid columns={1}>
        <Scene
          label="Three decisions an application takes once"
          note="The provider carries collapse, level and size for every header under it — here manual. A header that states any of them itself still wins: this one says size='md'. The words come from the language in force."
        >
          <PageHeaderDefaultsProvider collapse="manual" level="2" size="sm">
            <Viewport size="tall">
              <Page>
                <OrderHeader navigation={false} size="md" tabs={false} />
                <PageBody>
                  <Text size="sm">Hover the pill: the names are the catalog’s.</Text>
                </PageBody>
              </Page>
            </Viewport>
          </PageHeaderDefaultsProvider>
        </Scene>
        <Scene
          label="The handle, and an editable heading"
          note="The four buttons move the header through the ref with the reason programmatic. Below, render turns the heading into the consumer’s own input while the family keeps the rank and the identifier."
        >
          <Handle />
          <PageHeader level="2" size="sm">
            <PageHeaderTitleArea>
              <PageHeaderTitleRow>
                <PageHeaderTitle>
                  <PageHeaderHeading
                    render={(props) => (
                      <input
                        {...props}
                        aria-label="Order title"
                        children={undefined}
                        defaultValue="Purchase order PO-2026-004521"
                      />
                    )}
                  >
                    Purchase order PC-2026-004521
                  </PageHeaderHeading>
                </PageHeaderTitle>
              </PageHeaderTitleRow>
            </PageHeaderTitleArea>
          </PageHeader>
        </Scene>
      </Grid>
    );
  },
};

/* ── Accessibility ─────────────────────────────────────────────────────── */

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tab through it, then read the reasons"
        note="Tab walks the way back, the breadcrumbs, the actions, the arrows, the chevron, the pin, then the buttons inside the area. Press Enter on the chevron and read keyboard; click it and read pointer; scroll and read scroll. Collapse it, then Tab into the section below and back up: the area was inert."
      >
        <ReasonLog>
          {(log) => (
            <Viewport>
              <Page footer={<OrderFooter />}>
                <OrderHeader
                  onExpandedChange={(_next, request) => log(request.reason)}
                  onPinnedChange={(next, request) => log(`pin ${request.reason} → ${String(next)}`)}
                />
                <PageBody>
                  <Section>
                    <SectionHeader>
                      <SectionTitle>
                        <SectionHeading>Order items</SectionHeading>
                      </SectionTitle>
                    </SectionHeader>
                    <SectionBody>
                      <OrderLines />
                    </SectionBody>
                  </Section>
                </PageBody>
              </Page>
            </Viewport>
          )}
        </ReasonLog>
      </Scene>
    </Grid>
  ),
};
