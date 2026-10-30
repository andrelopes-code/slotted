import { createContext, useContext } from 'react';
import {
  Boxes,
  CalendarDays,
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@slotted/react/badge';
import {
  SideNavigation,
  SideNavigationCount,
  SideNavigationEnd,
  SideNavigationGroup,
  SideNavigationIcon,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
  SideNavigationSection,
  SideNavigationSectionLabel,
  SideNavigationTrigger,
} from '@slotted/react/side-navigation';

import { INVOICES, ORDERS, PRODUCTS, PURCHASE_ORDERS, RETURNS, SHIPMENTS, isLate } from './data';

export type Screen =
  | 'overview'
  | 'orders'
  | 'shipments'
  | 'returns'
  | 'stock'
  | 'purchasing'
  | 'calendar'
  | 'invoices'
  | 'customers';

export const SCREEN_TITLES: Record<Screen, string> = {
  overview: 'Overview',
  orders: 'Orders',
  shipments: 'Shipments',
  returns: 'Returns',
  stock: 'Stock',
  purchasing: 'Purchase orders',
  calendar: 'Calendar',
  invoices: 'Invoices',
  customers: 'Customers',
};

/** What each destination's number counts: the work waiting on the reader. */
export const COUNTS = {
  toShip: ORDERS.filter(
    (order) =>
      order.status !== 'voided' && ['unfulfilled', 'picking', 'packed'].includes(order.fulfillment),
  ).length,
  late: ORDERS.filter(isLate).length,
  inTransit: SHIPMENTS.filter((shipment) => shipment.state !== 'delivered').length,
  delayed: SHIPMENTS.filter((shipment) => shipment.state === 'delayed').length,
  openReturns: RETURNS.filter((entry) => entry.state !== 'refunded').length,
  lowStock: PRODUCTS.filter((product) => product.onHand < product.reorderAt).length,
  inbound: PURCHASE_ORDERS.filter((po) =>
    ['sent', 'confirmed', 'partially-received'].includes(po.state),
  ).length,
  overdue: INVOICES.filter((invoice) => invoice.state === 'overdue').length,
};

/**
 * The console routes in state. A destination is still an anchor with an
 * address, so the shell closes its layer on a phone; the press is handled
 * here, and the default navigation (and with it the family's own select) is
 * prevented, as a client-side router does.
 */
const Pick = createContext<(screen: Screen) => void>(() => {});

const icon = (Glyph: LucideIcon) => (
  <SideNavigationIcon>
    <Glyph aria-hidden="true" size={16} strokeWidth={1.75} />
  </SideNavigationIcon>
);

function Destination({
  value,
  glyph,
  count,
  badge,
}: {
  value: Screen;
  glyph?: LucideIcon | undefined;
  count?: number | undefined;
  badge?: { text: string; tone: 'warning' | 'danger' } | undefined;
}) {
  const pick = useContext(Pick);
  return (
    <SideNavigationItem value={value}>
      <SideNavigationLink
        href={`#${value}`}
        onClick={(event) => {
          event.preventDefault();
          pick(value);
        }}
      >
        {glyph && icon(glyph)}
        <SideNavigationLabel>{SCREEN_TITLES[value]}</SideNavigationLabel>
        {count !== undefined && <SideNavigationCount>{count}</SideNavigationCount>}
        {badge && (
          <SideNavigationEnd>
            <Badge size="sm" tone={badge.tone} variant="soft">
              {badge.text}
            </Badge>
          </SideNavigationEnd>
        )}
      </SideNavigationLink>
    </SideNavigationItem>
  );
}

function Group({
  value,
  label,
  glyph,
  children,
}: {
  value: string;
  label: string;
  glyph: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <SideNavigationItem value={value}>
      <SideNavigationTrigger>
        {icon(glyph)}
        <SideNavigationLabel>{label}</SideNavigationLabel>
      </SideNavigationTrigger>
      <SideNavigationGroup>{children}</SideNavigationGroup>
    </SideNavigationItem>
  );
}

export function ConsoleNav({
  screen,
  onScreen,
}: {
  screen: Screen;
  onScreen: (next: Screen) => void;
}) {
  return (
    <Pick.Provider value={onScreen}>
      <SideNavigation
        value={screen}
        onValueChange={(next) => {
          if (typeof next === 'string' && next in SCREEN_TITLES) onScreen(next as Screen);
        }}
        defaultExpanded={['fulfillment', 'inventory']}
      >
        <SideNavigationSection>
          <SideNavigationSectionLabel>Operations</SideNavigationSectionLabel>
          <SideNavigationList>
            <Destination value="overview" glyph={LayoutDashboard} />
            <Destination value="orders" glyph={ShoppingCart} count={COUNTS.toShip} />
            <Group value="fulfillment" label="Fulfillment" glyph={Truck}>
              <Destination
                value="shipments"
                badge={
                  COUNTS.delayed > 0
                    ? { text: `${COUNTS.delayed} late`, tone: 'warning' }
                    : undefined
                }
              />
              <Destination value="returns" count={COUNTS.openReturns} />
            </Group>
            <Group value="inventory" label="Inventory" glyph={Boxes}>
              <Destination
                value="stock"
                badge={{ text: `${COUNTS.lowStock} low`, tone: 'warning' }}
              />
              <Destination value="purchasing" count={COUNTS.inbound} />
            </Group>
            <Destination value="calendar" glyph={CalendarDays} />
          </SideNavigationList>
        </SideNavigationSection>
        <SideNavigationSection>
          <SideNavigationSectionLabel>Finance</SideNavigationSectionLabel>
          <SideNavigationList>
            <Destination
              value="invoices"
              glyph={ReceiptText}
              badge={{ text: `${COUNTS.overdue} overdue`, tone: 'danger' }}
            />
            <Destination value="customers" glyph={Users} />
          </SideNavigationList>
        </SideNavigationSection>
      </SideNavigation>
    </Pick.Provider>
  );
}
