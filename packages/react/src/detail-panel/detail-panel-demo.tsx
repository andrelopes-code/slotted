import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import type { ReactNode } from 'react';

import { ActionBar, ActionBarAction, ActionBarActions } from '../action-bar';
import { Avatar } from '../avatar';
import { Button, IconButton } from '../button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '../description-list';
import { MenuItem } from '../menu';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderArea,
  PageHeaderBack,
  PageHeaderContent,
  PageHeaderControls,
  PageHeaderHeading,
  PageHeaderMarks,
  PageHeaderNav,
  PageHeaderNavigation,
  PageHeaderPin,
  PageHeaderSubheading,
  PageHeaderTabs,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
  PageHeaderToggle,
  PageHeaderVisual,
} from '../page-header';
import type { PageHeaderProps } from '../page-header';
import { Stack } from '../stack';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '../table';
import { Tag } from '../tag';
import { Timeline, TimelineItem } from '../timeline';
import { Toolbar, ToolbarItem, ToolbarOverflow } from '../toolbar';
import { Text } from '../typography';
import { DetailPanel } from './detail-panel';
import { DetailPanelBody, DetailPanelSection, DetailPanelTabs } from './detail-panel-parts';
import type { DetailPanelBodyProps, DetailPanelProps } from './detail-panel.types';

/* ── One sales order of Nexora Operations ─────────────────────────────── */

export const MONEY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });

export interface SalesOrder {
  id: string;
  customer: string;
  po: string;
  confirmed: string;
  status: string;
  tone: 'accent' | 'warning' | 'danger' | 'success';
  total: number;
  delivery: string;
  warehouse: string;
  owner: string;
  team: string;
  terms: string;
  approval: string;
  outstanding: number;
  invoice: string;
}

export const ORDERS: SalesOrder[] = [
  {
    id: 'SO-2026-01841',
    customer: 'Northwind Fabrication',
    po: 'NF-2026-118',
    confirmed: '3 de setembro de 2026',
    status: 'Confirmado',
    tone: 'accent',
    total: 12_480,
    delivery: '15 set 2026',
    warehouse: 'Dallas (TX-2)',
    owner: 'Daniel Okafor',
    team: 'Inside sales — South',
    terms: 'Net 45',
    approval: 'Approved · Sep 3',
    outstanding: 12_480,
    invoice: 'INV-2026-02887',
  },
  {
    id: 'SO-2026-01842',
    customer: 'Meridian Controls Group',
    po: 'MCG-77120',
    confirmed: '4 de setembro de 2026',
    status: 'Parcialmente atendido',
    tone: 'warning',
    total: 86_420,
    delivery: '18 set 2026',
    warehouse: 'Columbus (OH-1)',
    owner: 'Priya Raman',
    team: 'Inside sales — Midwest',
    terms: 'Net 30',
    approval: 'Approved · Sep 4',
    outstanding: 41_860,
    invoice: 'INV-2026-02891',
  },
  {
    id: 'SO-2026-01843',
    customer: 'Helios Automation GmbH',
    po: 'HA-DE-2026-Q3-00092817',
    confirmed: '5 de setembro de 2026',
    status: 'Em espera',
    tone: 'danger',
    total: 4_120,
    delivery: '22 set 2026',
    warehouse: 'Columbus (OH-1)',
    owner: 'Martha Silver',
    team: 'Key accounts',
    terms: 'Prepaid',
    approval: 'Pending',
    outstanding: 4_120,
    invoice: '—',
  },
];

export const ORDER = ORDERS[1] as SalesOrder;

export const LINES = [
  { sku: 'MX-240', product: 'Servo Motor MX-240', quantity: 12, unit: 3_240, fulfilled: 6 },
  { sku: 'PLC-8', product: 'Controlador PLC-8 Series', quantity: 4, unit: 5_180, fulfilled: 4 },
  {
    sku: 'CB-4x15',
    product: 'Cabo blindado 4×1,5 mm²',
    quantity: 30,
    unit: 412,
    fulfilled: 30,
  },
  { sku: 'IS-18', product: 'Sensor indutivo IS-18', quantity: 60, unit: 148, fulfilled: 60 },
];

export const SHIPMENTS = [
  { id: 'SHP-009841', carrier: 'FedEx Freight', status: 'In transit', packages: 3 },
];

export const HISTORY = [
  {
    title: 'Partial shipment SHP-009841',
    description: '6 units of Servo Motor MX-240 on backorder.',
    time: '2026-09-12T14:20:00Z',
    tone: 'warning' as const,
  },
  { title: 'Order confirmed', actor: 'Priya Raman', time: '2026-09-04T10:02:00Z' },
  { title: 'Order created', actor: 'Daniel Okafor', time: '2026-09-03T16:45:00Z' },
];

const BRAZIL = {
  locale: 'pt-BR',
  now: Date.UTC(2026, 8, 17, 9),
  timeZone: 'America/Sao_Paulo',
} as const;

/* ── The pieces ───────────────────────────────────────────────────────── */

/** The key facts under the title, in the header area. */
export function OrderFacts({ order = ORDER }: { order?: SalesOrder }) {
  return (
    <DescriptionList columns={3} layout="row">
      <DescriptionListItem>
        <DescriptionListTerm>Total</DescriptionListTerm>
        <DescriptionListDescription>{MONEY.format(order.total)}</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Requested delivery</DescriptionListTerm>
        <DescriptionListDescription>{order.delivery}</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Warehouse</DescriptionListTerm>
        <DescriptionListDescription>{order.warehouse}</DescriptionListDescription>
      </DescriptionListItem>
    </DescriptionList>
  );
}

/** The fields of the aside. */
export function OrderFields({ order = ORDER }: { order?: SalesOrder }) {
  return (
    <DescriptionList layout="stack">
      <DescriptionListItem>
        <DescriptionListTerm>Owner</DescriptionListTerm>
        <DescriptionListDescription>{order.owner}</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Equipa</DescriptionListTerm>
        <DescriptionListDescription>{order.team}</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Terms</DescriptionListTerm>
        <DescriptionListDescription>{order.terms}</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Approval</DescriptionListTerm>
        <DescriptionListDescription>{order.approval}</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Payment</DescriptionListTerm>
        <DescriptionListDescription>
          {MONEY.format(order.outstanding)} outstanding
        </DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>Invoice</DescriptionListTerm>
        <DescriptionListDescription copy={order.invoice !== '—'}>
          {order.invoice}
        </DescriptionListDescription>
      </DescriptionListItem>
    </DescriptionList>
  );
}

/** The order lines, as a table. */
export function OrderLines() {
  return (
    <Table aria-label="Order lines" columns={3} variant="plain">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Product</TableColumnHeader>
            <TableColumnHeader align="end">Qty.</TableColumnHeader>
            <TableColumnHeader align="end">Unit price</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {LINES.map((line) => (
            <TableRow key={line.sku}>
              <TableRowHeader>{line.product}</TableRowHeader>
              <TableCell align="end">
                {line.fulfilled === line.quantity
                  ? line.quantity
                  : `${line.fulfilled} / ${line.quantity}`}
              </TableCell>
              <TableCell align="end">{MONEY.format(line.unit)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

/** The history of the order, as a feed. */
export function OrderHistory() {
  return (
    <Timeline label="Order history" order="newest-first" {...BRAZIL}>
      {HISTORY.map((event) => (
        <TimelineItem key={event.time} {...event} />
      ))}
    </Timeline>
  );
}

/**
 * The top of the record: a page-header with the back link, the identifier
 * and the customer as the heading, the status as a mark, the actions, the
 * previous and next controls, the facts in the header area, and the strip in
 * the tabs slot — which draws nothing under `layout="stacked"`.
 */
export function OrderHeader({
  close,
  order = ORDER,
  navigation = true,
  onNavigate,
  strip = true,
  ...props
}: Partial<PageHeaderProps> & {
  /** A host's own close control, after the toolbar. */
  close?: ReactNode;
  order?: SalesOrder;
  navigation?: boolean;
  onNavigate?: ((direction: -1 | 1) => void) | undefined;
  strip?: boolean;
}) {
  return (
    <PageHeader {...props}>
      <PageHeaderTitleArea>
        <PageHeaderNav>
          <PageHeaderBack href="#orders">Sales orders</PageHeaderBack>
        </PageHeaderNav>
        <PageHeaderTitleRow>
          <PageHeaderVisual>
            <Avatar name="Sales order" shape="square" size="lg" tone="accent">
              <Package aria-hidden="true" focusable="false" strokeWidth={1.75} />
            </Avatar>
          </PageHeaderVisual>
          <PageHeaderTitle>
            <PageHeaderHeading>
              {order.id} · {order.customer}
            </PageHeaderHeading>
            <PageHeaderMarks>
              <Tag shape="pill" size="sm" tone={order.tone}>
                {order.status}
              </Tag>
            </PageHeaderMarks>
            <PageHeaderSubheading>
              Confirmed on {order.confirmed} · Customer PO {order.po}
            </PageHeaderSubheading>
          </PageHeaderTitle>
          <PageHeaderActions>
            <Toolbar aria-label="Order actions" overflow="menu">
              <ToolbarItem counterpart={<MenuItem>Export</MenuItem>}>
                <Button variant="ghost">Export</Button>
              </ToolbarItem>
              <ToolbarItem counterpart={<MenuItem>Issue invoice</MenuItem>}>
                <Button variant="outline">Issue invoice</Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button tone="accent">Create shipment</Button>
              </ToolbarItem>
              <ToolbarOverflow />
            </Toolbar>
            {close}
          </PageHeaderActions>
          {navigation ? (
            <PageHeaderNavigation>
              <IconButton
                aria-label="Previous order"
                onClick={() => onNavigate?.(-1)}
                variant="ghost"
              >
                <ChevronLeft aria-hidden="true" />
              </IconButton>
              <IconButton aria-label="Next order" onClick={() => onNavigate?.(1)} variant="ghost">
                <ChevronRight aria-hidden="true" />
              </IconButton>
            </PageHeaderNavigation>
          ) : null}
        </PageHeaderTitleRow>
      </PageHeaderTitleArea>
      <PageHeaderArea>
        <PageHeaderContent>
          <OrderFacts order={order} />
        </PageHeaderContent>
      </PageHeaderArea>
      <PageHeaderControls>
        <PageHeaderToggle />
        <PageHeaderPin />
      </PageHeaderControls>
      {strip ? (
        <PageHeaderTabs>
          <DetailPanelTabs label="Order sections" />
        </PageHeaderTabs>
      ) : null}
    </PageHeader>
  );
}

/** The three sections every order has. */
export function OrderSections({ actions = true }: { actions?: boolean }) {
  return (
    <>
      <DetailPanelSection
        actions={
          actions ? (
            <>
              <Button size="sm" variant="outline">
                Exportar
              </Button>
              <Button size="sm" tone="accent">
                Add line
              </Button>
            </>
          ) : undefined
        }
        count={LINES.length}
        label="Linhas"
        name="linhas"
      >
        <OrderLines />
      </DetailPanelSection>
      <DetailPanelSection count={SHIPMENTS.length} label="Shipments" name="expedicoes">
        <Stack gap={3}>
          {SHIPMENTS.map((shipment) => (
            <Text key={shipment.id} size="sm">
              <strong>{shipment.id}</strong> · {shipment.carrier} · {shipment.status} ·{' '}
              {shipment.packages} volumes
            </Text>
          ))}
        </Stack>
      </DetailPanelSection>
      <DetailPanelSection label="History" name="historico">
        <OrderHistory />
      </DetailPanelSection>
    </>
  );
}

/** The footer a drawer host gives the record. */
export function OrderFooter({ onClose }: { onClose?: (() => void) | undefined }) {
  return (
    <ActionBar aria-label="Order actions" variant="plain">
      <ActionBarActions>
        <ActionBarAction>
          <Button onClick={onClose} tone="secondary" variant="ghost">
            Close
          </Button>
        </ActionBarAction>
        <ActionBarAction>
          <Button tone="accent">Record payment</Button>
        </ActionBarAction>
      </ActionBarActions>
    </ActionBar>
  );
}

/** The whole record: the header, the body with the sections and the aside, and an optional footer. */
export function OrderPanel({
  banner,
  children,
  fields = <OrderFields />,
  header,
  message,
  order = ORDER,
  ...props
}: Partial<DetailPanelProps> & {
  banner?: ReactNode;
  fields?: ReactNode;
  header?: ReactNode;
  message?: DetailPanelBodyProps['message'];
  order?: SalesOrder;
}) {
  return (
    <DetailPanel recordKey={order.id} {...props}>
      {header ?? <OrderHeader order={order} />}
      <DetailPanelBody aside={fields} banner={banner} message={message}>
        {children ?? <OrderSections />}
      </DetailPanelBody>
    </DetailPanel>
  );
}
