import {
  Bell,
  ChartNoAxesColumn,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Search,
  Settings,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar } from '../../avatar';
import { Button, IconButton } from '../../button';
import { Icon } from '../../icon';
import { Shortcut } from '../../kbd';
import { Page, PageBody, PageFooter } from '../../page';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderHeading,
  PageHeaderSubheading,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '../../page-header';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '../../table';
import { Tag } from '../../tag';
import { TextField } from '../../text-field';
import { Text } from '../../typography';
import {
  AppShell,
  AppShellActions,
  AppShellAside,
  AppShellAsideBody,
  AppShellAsideFooter,
  AppShellAsideHeader,
  AppShellAsideResizer,
  AppShellAsideToggle,
  AppShellBanner,
  AppShellBrand,
  AppShellCentre,
  AppShellFooter,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavFooter,
  AppShellNavHeader,
  AppShellNavToggle,
} from '../index';
import type { AppShellProps } from '../app-shell.types';
import { MONEY, NavAccount, NavColumn, PaneFields, Viewport, Wordmark } from './shared';
import type { Destination } from './shared';

/**
 * Aurora Logistics: a freight operator's back office. The neutral product —
 * banner across the top, content as a card on the frame, a detail pane that
 * opens on the row the coordinator selects. Real routes, real carriers, real
 * money, real states including the awkward ones.
 */

export const AURORA_DESTINATIONS: readonly Destination[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shipments', label: 'Shipments', icon: Truck, count: 19 },
  { id: 'orders', label: 'Orders', icon: Package, count: 412 },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'billing', label: 'Billing', icon: FileText, count: 7 },
  { id: 'reports', label: 'Reports', icon: ChartNoAxesColumn },
];

const SYSTEM: readonly Destination[] = [
  { id: 'definicoes', label: 'Settings', icon: Settings },
  { id: 'suporte', label: 'Support', icon: LifeBuoy },
];

interface Shipment {
  readonly id: string;
  readonly customer: string;
  readonly route: string;
  readonly carrier: string;
  readonly weight: string;
  readonly due: string;
  readonly value: number | null;
  readonly state: 'in transit' | 'at risk' | 'delivered' | 'pending';
}

export const SHIPMENTS: readonly Shipment[] = [
  {
    id: 'ORD-4521',
    customer: 'Sherman Metalworks',
    route: 'Portland → Boise',
    carrier: 'Transcontinental Freight',
    weight: '3,240 kg',
    due: 'Sep 16, 14:00',
    value: 18420.5,
    state: 'in transit',
  },
  {
    id: 'ENC-4522',
    customer: 'Cooperativa do Vouga',
    route: 'Aveiro → Vigo',
    carrier: 'Galitrans',
    weight: '860 kg',
    due: '15 set, 09:30',
    value: 2380,
    state: 'at risk',
  },
  {
    id: 'ORD-4523',
    customer: 'Beacon Pharma',
    route: 'Denver → Madrid',
    carrier: 'Transcontinental Freight',
    weight: '1,120 kg',
    due: 'Sep 17, 11:00',
    value: 41290.9,
    state: 'pending',
  },
  {
    id: 'ORD-4524',
    customer: 'Avon Textiles',
    route: 'Dallas → Lyon',
    carrier: '—',
    weight: '4,800 kg',
    due: '19 set',
    value: null,
    state: 'pending',
  },
  {
    id: 'ORD-4519',
    customer: 'Atlantic Distribution',
    route: 'Savannah → Las Palmas',
    carrier: 'Naviera Canaria',
    weight: '12,400 kg',
    due: 'Sep 12, 16:20',
    value: 7640.25,
    state: 'delivered',
  },
];

const TONE = {
  'in transit': 'accent',
  'at risk': 'danger',
  delivered: 'success',
  pending: 'warning',
} as const;

/** The bar: the control, the name, the search a coordinator reaches for first, and what is global. */
export function AuroraBanner({
  centre = true,
  toggle = true,
  wordmark = true,
}: {
  centre?: boolean | undefined;
  toggle?: boolean | undefined;
  wordmark?: boolean | undefined;
}) {
  return (
    <AppShellBanner>
      <AppShellBrand>
        {toggle ? <AppShellNavToggle /> : null}
        {wordmark ? <Wordmark>Aurora</Wordmark> : null}
      </AppShellBrand>
      {centre ? (
        <AppShellCentre>
          <TextField
            aria-label="Procurar"
            className="slotted-demo-bar-search"
            end={<Shortcut keys="mod+k" size="sm" variant="soft" />}
            placeholder="Search orders, customers…"
            size="sm"
            start={
              <Icon>
                <Search />
              </Icon>
            }
            type="search"
            variant="subtle"
          />
        </AppShellCentre>
      ) : null}
      <AppShellActions>
        <IconButton
          aria-label="Notifications — 3 unread"
          className="slotted-demo-bar-optional"
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          <Bell aria-hidden size={16} />
        </IconButton>
        <IconButton
          aria-label="Ajuda"
          className="slotted-demo-bar-optional"
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          <CircleHelp aria-hidden size={16} />
        </IconButton>
        <Avatar size="sm" tone="accent" variant="soft">
          AB
        </Avatar>
      </AppShellActions>
    </AppShellBanner>
  );
}

/**
 * The column: the workspace, the destinations in two groups, the person.
 *
 * `longLabels` swaps two destinations for the names a translation produces —
 * the German for "shipment tracking" is one word and it does not fit.
 */
export function AuroraNav({
  current = 'encomendas',
  longLabels = false,
  toggleInFooter = false,
}: {
  current?: string | undefined;
  longLabels?: boolean | undefined;
  toggleInFooter?: boolean | undefined;
}) {
  const destinations = longLabels
    ? AURORA_DESTINATIONS.map((item) =>
        item.id === 'expedicoes'
          ? { ...item, label: 'Sendungsverfolgung' }
          : item.id === 'faturacao'
            ? { ...item, label: 'Rechnungsstellung und Mahnwesen' }
            : item,
      )
    : AURORA_DESTINATIONS;

  return (
    <AppShellNav className="slotted-demo-nav">
      <AppShellNavHeader>
        <NavAccount
          initials="AL"
          label="Aurora Logistics — switch workspace"
          name="Aurora Logistics"
          role="Portland · Operations"
          shape="square"
          tone="accent"
          variant="solid"
        />
      </AppShellNavHeader>
      <AppShellNavBody>
        <NavColumn
          current={current}
          sections={[
            { label: 'Operations', items: destinations },
            { label: 'System', items: SYSTEM },
          ]}
        />
      </AppShellNavBody>
      <AppShellNavFooter>
        {toggleInFooter ? <AppShellNavToggle /> : null}
        <NavAccount
          initials="AB"
          label="Anna Bell — open account menu"
          name="Anna Bell"
          role="Coordinator"
        />
      </AppShellNavFooter>
    </AppShellNav>
  );
}

/** The table a coordinator actually looks at, with the row that has no price. */
export function Shipments({
  onSelect,
  rows = SHIPMENTS,
  selected,
}: {
  onSelect?: ((id: string) => void) | undefined;
  rows?: readonly Shipment[] | undefined;
  selected?: string | undefined;
}) {
  return (
    <Table
      columns={4}
      selectionMode="single"
      value={selected === undefined ? [] : [selected]}
      variant="ruled"
      {...(onSelect === undefined ? {} : { onValueChange: (keys) => onSelect(keys[0] ?? '') })}
    >
      <TableContent>
        <TableCaption>Encomendas em curso</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              value={row.id}
              {...(onSelect === undefined ? {} : { onClick: () => onSelect(row.id) })}
            >
              <TableRowHeader>{row.id}</TableRowHeader>
              <TableCell>{row.customer}</TableCell>
              <TableCell numeric>{row.value === null ? '—' : MONEY.format(row.value)}</TableCell>
              <TableCell>
                <Tag shape="pill" size="sm" tone={TONE[row.state]} variant="soft">
                  {row.state}
                </Tag>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

/** What the content column holds: a page, its header, its table, its footer. */
export function AuroraContent({
  children,
  headerProgress,
  title = 'Encomendas',
}: {
  children?: ReactNode | undefined;
  /** A refresh of the list, drawn on the header's edge. */
  headerProgress?: ReactNode | undefined;
  title?: string | undefined;
}) {
  return (
    <Page
      footer={
        <PageFooter>
          <Button size="sm" tone="secondary" variant="ghost">
            Exportar
          </Button>
          <Button size="sm" tone="accent">
            Nova encomenda
          </Button>
        </PageFooter>
      }
      landmark="none"
      scroll="ancestor"
      width="full"
    >
      <PageHeader level="1" size="md">
        <PageHeaderTitleArea>
          <PageHeaderTitleRow>
            <PageHeaderTitle>
              <PageHeaderHeading>{title}</PageHeaderHeading>
              <PageHeaderSubheading>
                412 in progress · 19 awaiting carrier confirmation
              </PageHeaderSubheading>
            </PageHeaderTitle>
            <PageHeaderActions>
              <Button size="sm" tone="secondary" variant="outline">
                Filtros
              </Button>
            </PageHeaderActions>
          </PageHeaderTitleRow>
        </PageHeaderTitleArea>
        {headerProgress}
      </PageHeader>
      <PageBody>{children ?? <Shipments selected="ENC-4521" />}</PageBody>
    </Page>
  );
}

/**
 * The pane: one consignment, read while the list stays on screen. `resizable`
 * renders the pane's edge, which is the whole of that capability.
 */
export function AuroraPane({
  id = 'ENC-4521',
  resizable = false,
}: {
  id?: string | undefined;
  resizable?: boolean | undefined;
}) {
  const row = SHIPMENTS.find((shipment) => shipment.id === id) ?? SHIPMENTS[0]!;
  return (
    <AppShellAside>
      {resizable ? <AppShellAsideResizer /> : null}
      <AppShellAsideHeader>
        <span className="slotted-demo-pane-title">
          {row.id} · {row.customer}
        </span>
        <AppShellAsideToggle />
      </AppShellAsideHeader>
      <AppShellAsideBody>
        <PaneFields
          fields={[
            ['Rota', row.route],
            ['Transportador', row.carrier],
            ['Weight', row.weight],
            ['Amount', row.value === null ? '—' : MONEY.format(row.value)],
            ['Expected delivery', row.due],
            [
              'Status',
              <Tag key="state" shape="pill" size="sm" tone={TONE[row.state]} variant="soft">
                {row.state}
              </Tag>,
            ],
          ]}
        />
      </AppShellAsideBody>
      <AppShellAsideFooter>
        <Button size="sm" tone="secondary" variant="outline">
          Rastrear
        </Button>
        <Button size="sm" tone="accent">
          Confirmar
        </Button>
      </AppShellAsideFooter>
    </AppShellAside>
  );
}

export function AuroraFooter() {
  return (
    <AppShellFooter>
      <Text size="xs" tone="muted">
        Aurora 4.2.0 · Production environment · Signed in at 08:14
      </Text>
    </AppShellFooter>
  );
}

/**
 * The whole application, in one call. Every scene starts from this and changes
 * one axis, so the page reads as one product rather than as a bag of fragments.
 */
export function Aurora({
  aside = true,
  centre = true,
  children,
  footer = false,
  longLabels = false,
  progress,
  room = 'desktop',
  shell,
  size = 'screen',
  title,
  toggleInFooter = false,
}: {
  aside?: boolean | undefined;
  centre?: boolean | undefined;
  children?: ReactNode | undefined;
  footer?: boolean | undefined;
  longLabels?: boolean | undefined;
  /** The wait for the next page, on the content's edge. */
  progress?: ReactNode | undefined;
  /** The room the window stands in; `false` for a frame measured narrow on purpose. */
  room?: 'desktop' | 'wide' | false | undefined;
  shell?: Partial<AppShellProps> | undefined;
  size?: 'screen' | 'tall' | undefined;
  title?: string | undefined;
  toggleInFooter?: boolean | undefined;
}) {
  return (
    <Viewport room={room} size={size}>
      <AppShell {...shell}>
        <AuroraBanner centre={centre} toggle={!toggleInFooter} />
        <AuroraNav longLabels={longLabels} toggleInFooter={toggleInFooter} />
        <AppShellMain>
          {children ?? <AuroraContent {...(title === undefined ? {} : { title })} />}
        </AppShellMain>
        {progress}
        {aside ? <AuroraPane /> : null}
        {footer ? <AuroraFooter /> : null}
      </AppShell>
    </Viewport>
  );
}

/**
 * The pane driven by the table: selecting a row opens it, and the pane's own
 * control closes it. The shell holds nothing of the selection; the product
 * does, and passes `asideOpen` down from it.
 */
export function AuroraSelection(props: { shell?: Partial<AppShellProps> | undefined }) {
  const [selected, setSelected] = useState<string | undefined>('ENC-4521');
  return (
    <Viewport>
      <AppShell
        asideOpen={selected !== undefined}
        onAsideOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        asideMode="inline"
        {...props.shell}
      >
        <AuroraBanner />
        <AuroraNav />
        <AppShellMain>
          <AuroraContent>
            <Shipments
              onSelect={(id) => setSelected(id === '' ? undefined : id)}
              selected={selected}
            />
          </AuroraContent>
        </AppShellMain>
        <AuroraPane id={selected} resizable />
      </AppShell>
    </Viewport>
  );
}
