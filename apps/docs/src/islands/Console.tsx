import { ArrowUpRight, LayoutDashboard, ShoppingCart, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import {
  AppShell,
  AppShellAside,
  AppShellAsideBody,
  AppShellAsideFooter,
  AppShellAsideHeader,
  AppShellAsideResizer,
  AppShellAsideToggle,
  AppShellBanner,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavFooter,
  AppShellNavHeader,
  AppShellNavToggle,
} from '@slotted/react/app-shell';
import { Avatar } from '@slotted/react/avatar';
import { Button } from '@slotted/react/button';
import {
  CommandPalette,
  CommandPaletteTrigger,
  type CommandPaletteItem,
} from '@slotted/react/command-palette';
import { Glyph, Icon } from '@slotted/react/icon';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';
import { NotificationCenter, type NotificationItem } from '@slotted/react/notification-center';
import { Popover, PopoverContent, PopoverLayer, PopoverTrigger } from '@slotted/react/popover';
import { StatusIndicator } from '@slotted/react/status-indicator';
import {
  TopNavigation,
  TopNavigationAccount,
  TopNavigationActions,
  TopNavigationBrand,
  TopNavigationCount,
  TopNavigationMark,
  TopNavigationName,
  TopNavigationNotifications,
  TopNavigationSearch,
} from '@slotted/react/top-navigation';

import { Calendar } from '../console/Calendar';
import { CUSTOMERS, NOW, ORDERS, money, orderById, type Order } from '../console/data';
import { ConsoleNav, SCREEN_TITLES, type Screen } from '../console/nav';
import { OrderDetail, OrderDetailTitle } from '../console/OrderDetail';
import { Overview } from '../console/Overview';
import {
  Customers,
  Invoices,
  Orders,
  PurchaseOrders,
  Returns,
  Shipments,
  Stock,
} from '../console/screens';

const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const NOTIFICATIONS: NotificationItem[] = [
  {
    key: 'delayed',
    title: 'Shipments running late',
    description: 'UPS Ground out of Reno missed yesterday’s delivery window.',
    time: minutesAgo(18),
    read: false,
    tone: 'warning',
  },
  {
    key: 'stock',
    title: 'Stoneware mug below reorder point',
    description: 'Purchase order PO-3478 to Kiln & Co. covers 240 units.',
    time: minutesAgo(52),
    read: false,
    tone: 'danger',
  },
  {
    key: 'payout',
    title: 'Marketplace payout settled',
    description: '$18,240.55 deposited to the operating account.',
    time: minutesAgo(140),
    read: false,
    tone: 'success',
  },
  {
    key: 'invoice',
    title: 'Harbor & Pine paid INV-21462',
    time: minutesAgo(190),
    read: true,
  },
  {
    key: 'count',
    title: 'Cycle count finished in aisle C',
    description: '2 variances, both under 1%.',
    time: minutesAgo(410),
    read: true,
  },
];

/** The brand's mark: a needle pointing north. Inherits the bar's ink. */
function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="currentColor" />
      <path d="M12 5.5 16 17l-4-2.4L8 17z" fill="var(--slotted-surface)" />
    </svg>
  );
}

/** The palette's commands: every destination, then the records it reaches. */
function usePaletteItems(go: (screen: Screen) => void, open: (id: string) => void) {
  return useMemo<CommandPaletteItem[]>(
    () => [
      ...(Object.keys(SCREEN_TITLES) as Screen[]).map((screen) => ({
        id: `go-${screen}`,
        label: SCREEN_TITLES[screen],
        group: 'destinations',
        icon: <LayoutDashboard aria-hidden="true" size={16} strokeWidth={1.75} />,
        meta: 'Go to',
        onSelect: () => go(screen),
      })),
      ...ORDERS.slice(0, 40).map((order) => ({
        id: `order-${order.id}`,
        label: `${order.id} · ${order.customer}`,
        keywords: [order.customer, order.city],
        group: 'orders',
        icon: <ShoppingCart aria-hidden="true" size={16} strokeWidth={1.75} />,
        meta: money.format(order.total),
        onSelect: () => open(order.id),
      })),
      ...CUSTOMERS.map((customer) => ({
        id: `customer-${customer.id}`,
        label: customer.name,
        keywords: [customer.contact, customer.city],
        group: 'customers',
        icon: <Users aria-hidden="true" size={16} strokeWidth={1.75} />,
        meta: customer.city,
        onSelect: () => go('customers'),
      })),
    ],
    [go, open],
  );
}

/** An operations console, built only from the library, running inside the home page. */
export default function Console() {
  const [screen, setScreen] = useState<Screen>('overview');
  const [open, setOpen] = useState<Order | undefined>(undefined);
  /* An open record takes the room the navigation gave up: the column folds to its rail. */
  const [navOpen, setNavOpen] = useState(true);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unread = notifications.filter((item) => !item.read).length;

  /*
   * Whether an open record folded the column. Only then does leaving the
   * record open it again: forcing it open on every navigation kept the
   * column's layer over the list on a phone, where it closes on a choice.
   */
  const folded = useRef(false);
  const unfold = () => {
    if (!folded.current) return;
    folded.current = false;
    setNavOpen(true);
  };
  const go = useMemo(
    () => (next: Screen) => {
      setScreen(next);
      setOpen(undefined);
      unfold();
    },
    [],
  );
  const openOrder = useMemo(
    () => (id: string) => {
      const order = orderById.get(id);
      if (!order) return;
      setScreen((current) => (current === 'orders' ? current : 'orders'));
      setOpen(order);
      setNavOpen((current) => {
        if (current) folded.current = true;
        return false;
      });
    },
    [],
  );
  const items = usePaletteItems(go, openOrder);

  return (
    <div className="console">
      <AppShell
        navMode="auto"
        navSize="sm"
        asideMode="auto"
        collapsedTo="rail"
        navOpen={navOpen}
        onNavOpenChange={(next) => setNavOpen(next)}
        asideSize="md"
        asideOpen={open !== undefined}
        onAsideOpenChange={(next) => {
          if (next) return;
          setOpen(undefined);
          unfold();
        }}
      >
        <AppShellBanner>
          <TopNavigation>
            <TopNavigationBrand>
              <AppShellNavToggle />
              <TopNavigationMark>
                <Mark />
              </TopNavigationMark>
              <TopNavigationName>Northwind</TopNavigationName>
            </TopNavigationBrand>
            <TopNavigationSearch className="console-search">
              <CommandPalette
                items={items}
                groups={[
                  { id: 'destinations', label: 'Go to' },
                  { id: 'orders', label: 'Recent orders' },
                  { id: 'customers', label: 'Customers' },
                ]}
                hotkey={null}
                messages={{ placeholder: 'Search orders, customers and screens' }}
              >
                <CommandPaletteTrigger
                  render={(props) => (
                    <button {...props} type="button" className="console-search-trigger">
                      <Icon size="sm" tone="muted">
                        <Glyph name="search" />
                      </Icon>
                      <span className="console-search-label">Search orders, customers, SKUs…</span>
                    </button>
                  )}
                />
              </CommandPalette>
            </TopNavigationSearch>
            <TopNavigationActions>
              <Popover align="end" side="bottom" size="lg">
                <PopoverTrigger
                  render={(props) => (
                    <TopNavigationNotifications {...props}>
                      {unread > 0 && <TopNavigationCount>{unread}</TopNavigationCount>}
                    </TopNavigationNotifications>
                  )}
                />
                <PopoverLayer>
                  <PopoverContent aria-label="Notifications" className="console-notifications">
                    <NotificationCenter
                      items={notifications}
                      size="sm"
                      level="3"
                      locale="en-US"
                      now={NOW}
                      onReadChange={({ keys, read }) =>
                        setNotifications((list) =>
                          list.map((item) => (keys.includes(item.key) ? { ...item, read } : item)),
                        )
                      }
                      onRemove={(key) =>
                        setNotifications((list) => list.filter((item) => item.key !== key))
                      }
                    />
                  </PopoverContent>
                </PopoverLayer>
              </Popover>
              <Menu align="end" side="bottom">
                <MenuTrigger
                  render={(props) => (
                    <TopNavigationAccount {...props}>
                      <Avatar name="Avery Collins" size="xs" tone="accent" variant="soft" />
                    </TopNavigationAccount>
                  )}
                />
                <MenuContent>
                  <MenuGroup>
                    <MenuGroupLabel>Avery Collins · Operations lead</MenuGroupLabel>
                    <MenuItem>Profile</MenuItem>
                    <MenuItem>Notification settings</MenuItem>
                    <MenuItem>Workspace settings</MenuItem>
                  </MenuGroup>
                  <MenuSeparator />
                  <MenuItem>Sign out</MenuItem>
                </MenuContent>
              </Menu>
            </TopNavigationActions>
          </TopNavigation>
        </AppShellBanner>

        <AppShellNav>
          <AppShellNavHeader>
            <div className="console-nav-row">
              <span className="console-nav-mark">
                <Avatar
                  name="Northwind Trading"
                  shape="square"
                  size="sm"
                  tone="accent"
                  variant="solid"
                />
              </span>
              <span className="console-workspace">
                <span className="console-workspace-name">Northwind Trading</span>
                <span className="console-workspace-scope">3 warehouses · US</span>
              </span>
            </div>
          </AppShellNavHeader>
          <AppShellNavBody>
            <ConsoleNav screen={screen} onScreen={go} />
          </AppShellNavBody>
          <AppShellNavFooter>
            <div className="console-nav-row console-sync">
              <span className="console-nav-mark" aria-hidden="true">
                <StatusIndicator size="sm" status="success" label="Carriers in sync" />
              </span>
              <span className="console-workspace">
                <span className="console-workspace-name">Carriers in sync</span>
                <span className="console-workspace-scope">UPS, FedEx, DHL, USPS · 2 min ago</span>
              </span>
            </div>
          </AppShellNavFooter>
        </AppShellNav>

        <AppShellMain>
          {screen === 'overview' && <Overview onScreen={go} />}
          {screen === 'orders' && <Orders onOpen={openOrder} />}
          {screen === 'shipments' && <Shipments onOrder={openOrder} />}
          {screen === 'returns' && <Returns onOrder={openOrder} />}
          {screen === 'stock' && <Stock />}
          {screen === 'purchasing' && <PurchaseOrders />}
          {screen === 'calendar' && <Calendar />}
          {screen === 'invoices' && <Invoices onOrder={openOrder} />}
          {screen === 'customers' && <Customers />}
        </AppShellMain>

        <AppShellAside>
          <AppShellAsideResizer />
          <AppShellAsideHeader>
            {open ? <OrderDetailTitle order={open} /> : <span>Order</span>}
            <AppShellAsideToggle />
          </AppShellAsideHeader>
          <AppShellAsideBody>{open && <OrderDetail order={open} />}</AppShellAsideBody>
          <AppShellAsideFooter>
            <Button size="sm" variant="outline" tone="secondary">
              Refund
            </Button>
            <Button
              size="sm"
              end={<ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.75} />}
            >
              {open?.fulfillment === 'unfulfilled' || open?.fulfillment === 'picking'
                ? 'Create shipment'
                : 'Track shipment'}
            </Button>
          </AppShellAsideFooter>
        </AppShellAside>
      </AppShell>
    </div>
  );
}
