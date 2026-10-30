import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChartNoAxesColumn,
  CreditCard,
  FileText,
  LifeBuoy,
  MapPin,
  Package,
  Plus,
  Settings,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';

import {
  AppShell,
  AppShellBanner,
  AppShellBrand,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavToggle,
} from '../app-shell';
import { Viewport } from '../app-shell/app-shell-demo/shared';
import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Kbd } from '../kbd';
import { Stack } from '../stack';
import { Text } from '../typography';
import { SideNavigation } from './side-navigation';
import { SideNavigationDefaultsProvider } from './side-navigation-defaults';
import {
  SideNavigationActions,
  SideNavigationCount,
  SideNavigationDescription,
  SideNavigationDivider,
  SideNavigationEnd,
  SideNavigationGroup,
  SideNavigationIcon,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
  SideNavigationSection,
  SideNavigationSectionLabel,
  SideNavigationSkeleton,
  SideNavigationTrigger,
} from './side-navigation-parts';
import { REACT_SIDE_NAVIGATION_DOCS, REACT_SIDE_NAVIGATION_TOKENS } from './side-navigation.docs';
import type { SideNavigationProps } from './side-navigation.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SIDE_NAVIGATION_DOCS.sideNavigation.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    groups: Groups,
    hybrid: Hybrid,
    sections: Sections,
    current: Current,
    compact: Compact,
    flyout: Flyout,
    size: Size,
    states: States,
    content: Content,
    loading: Loading,
    shell: Shell,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  });

const meta = {
  title: 'Components/SideNavigation',
  component: SideNavigation,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'SideNavigation',
        description:
          'A column of destinations: nested groups, a current destination, a rail when the room is under ninety-six pixels, and a tooltip wherever a label cannot show its own words.',
        framework: 'React',
        ...REACT_SIDE_NAVIGATION_DOCS.sideNavigation,
        tokens: REACT_SIDE_NAVIGATION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof SideNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

type Glyph = ComponentType<{ size?: number | string; 'aria-hidden'?: boolean }>;

/** A destination row, as Aurora Logistics's back office writes one. */
function Destination({
  count,
  description,
  end,
  icon: Icon,
  label,
  value,
}: {
  count?: number | undefined;
  description?: string | undefined;
  end?: ReactNode;
  icon?: Glyph | undefined;
  label: string;
  value: string;
}) {
  return (
    <SideNavigationItem value={value}>
      <SideNavigationLink href={`#${value}`}>
        {Icon === undefined ? null : (
          <SideNavigationIcon>
            <Icon aria-hidden size={16} />
          </SideNavigationIcon>
        )}
        <SideNavigationLabel>{label}</SideNavigationLabel>
        {description === undefined ? null : (
          <SideNavigationDescription>{description}</SideNavigationDescription>
        )}
        {count === undefined ? null : <SideNavigationCount>{count}</SideNavigationCount>}
        {end === undefined ? null : <SideNavigationEnd>{end}</SideNavigationEnd>}
      </SideNavigationLink>
    </SideNavigationItem>
  );
}

/** The freight operator's column: two sections, one group, one disabled row. */
function Aurora(props: Partial<SideNavigationProps>) {
  return (
    <SideNavigation defaultValue="orders" {...props}>
      <SideNavigationSection>
        <SideNavigationSectionLabel>Operations</SideNavigationSectionLabel>
        <SideNavigationList>
          <Destination icon={ChartNoAxesColumn} label="Dashboard" value="dashboard" />
          <Destination count={19} icon={Truck} label="Shipments" value="shipments" />
          <Destination count={412} icon={Package} label="Orders" value="orders" />
          <SideNavigationItem value="deliveries">
            <SideNavigationTrigger>
              <SideNavigationIcon>
                <MapPin aria-hidden size={16} />
              </SideNavigationIcon>
              <SideNavigationLabel>Deliveries</SideNavigationLabel>
              <SideNavigationCount>38</SideNavigationCount>
            </SideNavigationTrigger>
            <SideNavigationGroup>
              <Destination label="Today" value="today" />
              <Destination
                end={
                  <Badge size="sm" tone="danger" variant="soft">
                    3
                  </Badge>
                }
                label="Atrasadas"
                value="late"
              />
              <Destination label="Done" value="done" />
            </SideNavigationGroup>
          </SideNavigationItem>
          <Destination icon={Warehouse} label="Warehouses" value="warehouses" />
          <Destination icon={Users} label="Customers" value="customers" />
        </SideNavigationList>
      </SideNavigationSection>
      <SideNavigationSection>
        <SideNavigationSectionLabel>System</SideNavigationSectionLabel>
        <SideNavigationList>
          <Destination icon={Settings} label="Settings" value="settings" />
          <Destination icon={LifeBuoy} label="Support" value="support" />
          <SideNavigationItem disabled value="billing">
            <SideNavigationLink href="#faturacao">
              <SideNavigationIcon>
                <CreditCard aria-hidden size={16} />
              </SideNavigationIcon>
              <SideNavigationLabel>Billing</SideNavigationLabel>
              <SideNavigationDescription>Available on the Team plan</SideNavigationDescription>
            </SideNavigationLink>
          </SideNavigationItem>
        </SideNavigationList>
      </SideNavigationSection>
    </SideNavigation>
  );
}

export const Playground: Story = {
  args: {
    autoExpand: true,
    guides: true,
    mode: 'auto',
    multiple: true,
    size: 'md',
    truncate: 'end',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Measure>
      <Aurora {...args} defaultExpanded={['deliveries']} />
    </Measure>
  ),
};

/** A part drawn as its own name. */
function Part({ name }: { name: string }) {
  return (
    <Text render={(props) => <code {...props} />} size="xs" tone="muted">
      {name}
    </Text>
  );
}

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Measure>
      <SideNavigation defaultExpanded={['branch']} defaultValue="row">
        <SideNavigationSection>
          <SideNavigationSectionLabel>section-label</SideNavigationSectionLabel>
          <SideNavigationList>
            <SideNavigationItem value="row">
              <SideNavigationLink href="#row">
                <SideNavigationIcon>
                  <Package aria-hidden size={16} />
                </SideNavigationIcon>
                <SideNavigationLabel>label</SideNavigationLabel>
                <SideNavigationDescription>description</SideNavigationDescription>
                <SideNavigationCount>12</SideNavigationCount>
              </SideNavigationLink>
              <SideNavigationActions>
                <Part name="actions" />
              </SideNavigationActions>
            </SideNavigationItem>
            <SideNavigationItem value="hybrid">
              <SideNavigationLink href="#hybrid">
                <SideNavigationIcon>
                  <FileText aria-hidden size={16} />
                </SideNavigationIcon>
                <SideNavigationLabel>link + trigger</SideNavigationLabel>
                <SideNavigationEnd>
                  <Badge size="sm" tone="secondary" variant="soft">
                    end
                  </Badge>
                </SideNavigationEnd>
              </SideNavigationLink>
              <SideNavigationTrigger />
              <SideNavigationGroup>
                <SideNavigationItem value="hybrid-child">
                  <SideNavigationLink href="#hybrid-child">
                    <SideNavigationLabel>group › item › link</SideNavigationLabel>
                  </SideNavigationLink>
                </SideNavigationItem>
              </SideNavigationGroup>
            </SideNavigationItem>
            <SideNavigationItem value="branch">
              <SideNavigationTrigger>
                <SideNavigationIcon>
                  <Truck aria-hidden size={16} />
                </SideNavigationIcon>
                <SideNavigationLabel>trigger</SideNavigationLabel>
              </SideNavigationTrigger>
              <SideNavigationGroup>
                <SideNavigationItem value="child">
                  <SideNavigationLink href="#child">
                    <SideNavigationLabel>group › item › link</SideNavigationLabel>
                  </SideNavigationLink>
                </SideNavigationItem>
              </SideNavigationGroup>
            </SideNavigationItem>
            <SideNavigationDivider />
            <SideNavigationSkeleton />
          </SideNavigationList>
        </SideNavigationSection>
      </SideNavigation>
    </Measure>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Any number open"
        note="Press Deliveries and Settings in turn: each opens on its own track, the chevron turns down, and the rows inside fade in as the room for them arrives."
      >
        <Measure>
          <SideNavigation defaultExpanded={['deliveries']} defaultValue="today">
            <SideNavigationList>
              <SideNavigationItem value="deliveries">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <MapPin aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Deliveries</SideNavigationLabel>
                  <SideNavigationCount>38</SideNavigationCount>
                </SideNavigationTrigger>
                <SideNavigationGroup>
                  <Destination label="Today" value="today" />
                  <Destination label="Late" value="late" />
                  <Destination label="Done" value="done" />
                </SideNavigationGroup>
              </SideNavigationItem>
              <SideNavigationItem value="settings">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <Settings aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Settings</SideNavigationLabel>
                </SideNavigationTrigger>
                <SideNavigationGroup>
                  <Destination label="Organization" value="org" />
                  <Destination label="Users" value="users" />
                </SideNavigationGroup>
              </SideNavigationItem>
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
      <Scene
        label="One at a time"
        note="multiple=false: opening Settings closes Deliveries in the same request, so the column never holds two open groups."
      >
        <Measure>
          <SideNavigation defaultExpanded={['deliveries']} multiple={false}>
            <SideNavigationList>
              <SideNavigationItem value="deliveries">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <MapPin aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Deliveries</SideNavigationLabel>
                </SideNavigationTrigger>
                <SideNavigationGroup>
                  <Destination label="Today" value="today" />
                  <Destination label="Atrasadas" value="late" />
                </SideNavigationGroup>
              </SideNavigationItem>
              <SideNavigationItem value="settings">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <Settings aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Settings</SideNavigationLabel>
                </SideNavigationTrigger>
                <SideNavigationGroup>
                  <Destination label="Organization" value="org" />
                  <Destination label="Users" value="users" />
                </SideNavigationGroup>
              </SideNavigationItem>
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Hybrid: Story = {
  parameters: scenario('hybrid'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Link and trigger side by side"
        note="Reports navigates; the chevron beside it opens the children and is named by the same label. Finance holds the current destination and says so while closed."
      >
        <Measure>
          <SideNavigation defaultExpanded={['reports']} defaultValue="invoices">
            <SideNavigationList>
              <SideNavigationItem value="reports">
                <SideNavigationLink href="#reports">
                  <SideNavigationIcon>
                    <ChartNoAxesColumn aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Reports</SideNavigationLabel>
                </SideNavigationLink>
                <SideNavigationTrigger />
                <SideNavigationGroup>
                  <Destination label="Mensal" value="monthly" />
                  <Destination label="Anual" value="yearly" />
                </SideNavigationGroup>
              </SideNavigationItem>
              <SideNavigationItem value="finance">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <CreditCard aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Financeiro</SideNavigationLabel>
                </SideNavigationTrigger>
                <SideNavigationGroup>
                  <Destination label="Invoices" value="invoices" />
                </SideNavigationGroup>
              </SideNavigationItem>
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
      <Scene
        label="Five levels"
        note="Under a row with a mark the children stand under its words; under a row without one the indent is a constant step, so the fifth level still has room for a name."
      >
        <Measure>
          <SideNavigation
            autoExpand={false}
            defaultExpanded={['regions', 'southeast', 'minas']}
            defaultValue="bh"
          >
            <SideNavigationList>
              <SideNavigationItem value="regions">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <MapPin aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>By region</SideNavigationLabel>
                  <SideNavigationCount>128</SideNavigationCount>
                </SideNavigationTrigger>
                <SideNavigationGroup>
                  <Destination label="Norte" value="north" />
                  <SideNavigationItem value="southeast">
                    <SideNavigationTrigger>
                      <SideNavigationLabel>Sudeste</SideNavigationLabel>
                    </SideNavigationTrigger>
                    <SideNavigationGroup>
                      <Destination count={36} label="Seattle" value="sp" />
                      <SideNavigationItem value="minas">
                        <SideNavigationTrigger>
                          <SideNavigationLabel>Minas Gerais</SideNavigationLabel>
                        </SideNavigationTrigger>
                        <SideNavigationGroup>
                          <Destination count={12} label="Portland" value="bh" />
                          <Destination label="Eugene and the Willamette Valley" value="udi" />
                        </SideNavigationGroup>
                      </SideNavigationItem>
                    </SideNavigationGroup>
                  </SideNavigationItem>
                  <SideNavigationItem value="south">
                    <SideNavigationTrigger>
                      <SideNavigationLabel>Sul</SideNavigationLabel>
                    </SideNavigationTrigger>
                    <SideNavigationGroup>
                      <Destination label="Curitiba" value="cwb" />
                    </SideNavigationGroup>
                  </SideNavigationItem>
                </SideNavigationGroup>
              </SideNavigationItem>
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => (
    <Measure>
      <SideNavigation defaultValue="orders">
        <SideNavigationSection>
          <SideNavigationSectionLabel>Operations</SideNavigationSectionLabel>
          <SideNavigationList>
            <Destination icon={ChartNoAxesColumn} label="Dashboard" value="dashboard" />
            <Destination count={412} icon={Package} label="Orders" value="orders" />
            <Destination icon={Warehouse} label="Warehouses" value="warehouses" />
          </SideNavigationList>
        </SideNavigationSection>
        <SideNavigationSection>
          <SideNavigationSectionLabel>Administration</SideNavigationSectionLabel>
          <SideNavigationList>
            <Destination icon={Users} label="Users" value="users" />
            <Destination icon={Settings} label="Settings" value="settings" />
            <SideNavigationDivider />
            <SideNavigationItem value="new">
              <SideNavigationLink>
                <SideNavigationIcon>
                  <Plus aria-hidden size={16} />
                </SideNavigationIcon>
                <SideNavigationLabel>New load</SideNavigationLabel>
                <SideNavigationEnd>
                  <Kbd>N</Kbd>
                </SideNavigationEnd>
              </SideNavigationLink>
            </SideNavigationItem>
          </SideNavigationList>
        </SideNavigationSection>
      </SideNavigation>
    </Measure>
  ),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => {
    function Owned() {
      const [value, setValue] = useState<string | null>('orders');
      const [reason, setReason] = useState('—');
      return (
        <Stack gap={4}>
          <Text size="sm" tone="muted">
            value: {value ?? 'null'} · reason: {reason}
          </Text>
          <Button onClick={() => setValue('late')} size="sm" variant="outline">
            Ir para Atrasadas
          </Button>
          <Aurora
            onValueChange={(next, request) => {
              setValue(next);
              setReason(request.reason);
            }}
            value={value}
          />
        </Stack>
      );
    }
    return (
      <Grid columns={2}>
        <Scene
          label="Owned by the application"
          note="A press asks value to move and the application sets it. Go to Overdue moves it from outside: the destination is inside a closed group, so autoExpand opens Deliveries with the reason select."
        >
          <Measure>
            <Owned />
          </Measure>
        </Scene>
        <Scene
          label="Hidden, and said by the parent"
          note="autoExpand off: Overdue is current inside a closed Deliveries, so the parent row carries the ground until the group opens and the leaf takes it."
        >
          <Measure>
            <Aurora autoExpand={false} defaultValue="late" />
          </Measure>
        </Scene>
      </Grid>
    );
  },
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="mode=compact"
        note="A rail of marks, each a square the width of the mark, centered. Hover or focus a row for its name; Shipments and Orders carry a dot for the count they cannot show."
      >
        <Measure>
          <Aurora mode="compact" />
        </Measure>
      </Scene>
      <Scene
        label="mode=auto, read from the width"
        note="The same column with no mode stated. In this measure it is labelled; in the shell’s collapsed region, fifty pixels wide, the stylesheet makes it a rail before any script runs."
      >
        <Measure>
          <Aurora />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Flyout: Story = {
  parameters: scenario('flyout'),
  render: () => {
    function Owned() {
      const [flyout, setFlyout] = useState<string | null>(null);
      const [reason, setReason] = useState('—');
      return (
        <Stack gap={4}>
          <Text size="sm" tone="muted">
            flyout: {flyout ?? 'null'} · reason: {reason}
          </Text>
          <Aurora
            flyout={flyout}
            mode="compact"
            onFlyoutChange={(next, request) => {
              setFlyout(next);
              setReason(request.reason);
            }}
          />
        </Stack>
      );
    }
    return (
      <Grid columns={2}>
        <Scene
          label="Press Deliveries"
          note="The group is presented beside the rail, from the trigger’s edge. A press outside, Escape, focus leaving it, or a destination inside it closes it, each with its reason."
        >
          <Measure>
            <Aurora mode="compact" />
          </Measure>
        </Scene>
        <Scene
          label="Owned by the application"
          note="flyout names the one group beside the rail, or null. It is transient by design and never writes into expanded."
        >
          <Measure>
            <Owned />
          </Measure>
        </Scene>
      </Grid>
    );
  },
};

/** A shorter column, for the scenes that compare three of them. */
function Short(props: Partial<SideNavigationProps>) {
  return (
    <SideNavigation defaultExpanded={['deliveries']} defaultValue="orders" {...props}>
      <SideNavigationList>
        <Destination icon={ChartNoAxesColumn} label="Dashboard" value="dashboard" />
        <Destination count={412} icon={Package} label="Encomendas" value="orders" />
        <SideNavigationItem value="deliveries">
          <SideNavigationTrigger>
            <SideNavigationIcon>
              <MapPin aria-hidden size={16} />
            </SideNavigationIcon>
            <SideNavigationLabel>Deliveries</SideNavigationLabel>
            <SideNavigationCount>38</SideNavigationCount>
          </SideNavigationTrigger>
          <SideNavigationGroup>
            <Destination label="Today" value="today" />
            <Destination label="Atrasadas" value="late" />
          </SideNavigationGroup>
        </SideNavigationItem>
        <Destination icon={Settings} label="Settings" value="settings" />
      </SideNavigationList>
    </SideNavigation>
  );
}

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sm"
        note="Thirty-pixel rows on the compact control step, for a secondary navigation inside a page."
      >
        <Measure>
          <Short size="sm" />
        </Measure>
      </Scene>
      <Scene
        label="md"
        note="The default. Inside app-shell it reads the row geometry the shell publishes, so every left edge in the frame agrees."
      >
        <Measure>
          <Short size="md" />
        </Measure>
      </Scene>
      <Scene
        label="lg"
        note="Thirty-eight-pixel rows with the larger mark and type step, for a column that is the product’s primary surface."
      >
        <Measure>
          <Short size="lg" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Current, expanded, disabled"
        note="Orders is current on the accent ground; Deliveries is expanded with its chevron down; Billing is disabled, dimmed and refusing the press with its href still in place."
      >
        <Measure>
          <Aurora defaultExpanded={['deliveries']} />
        </Measure>
      </Scene>
      <Scene
        label="Hover, press, focus"
        note="Hover washes the row on the neutral ground; a press darkens it at once; Tab draws the ring inside the row, where a column that scrolls cannot clip it."
      >
        <Measure>
          <Aurora defaultValue="dashboard" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

/** Labels a product has: long, translated, an address, another script. */
function Awkward(props: Partial<SideNavigationProps>) {
  return (
    <SideNavigation defaultValue="september" {...props}>
      <SideNavigationList>
        <Destination
          count={120}
          icon={Settings}
          label="Organization and integrations settings"
          value="config"
        />
        <Destination
          count={12}
          icon={FileText}
          label="Monthly report · September"
          value="september"
        />
        <Destination count={4} icon={FileText} label="Monthly report · October" value="october" />
        <Destination
          icon={MapPin}
          label="https://aurora.example/reports/2026/monthly/september"
          value="url"
        />
        <Destination count={4} icon={Users} label="العملاء" value="customers" />
        <Destination
          description="14 awaiting dispatch at the Tacoma warehouse"
          icon={Package}
          label="Loads"
          value="loads"
        />
      </SideNavigationList>
    </SideNavigation>
  );
}

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="truncate=end"
        note="The default: one line, cut at the end. Hover or focus a cut row and the tooltip carries the whole label — and the whole description under it."
      >
        <Measure>
          <Awkward />
        </Measure>
      </Scene>
      <Scene
        label="truncate=middle"
        note="The start and the tail survive, so setembro and outubro stay two rows. The whole text is the row’s accessible name."
      >
        <Measure>
          <Awkward truncate="middle" />
        </Measure>
      </Scene>
      <Scene
        label="truncate=none"
        note="On request the label wraps and a URL breaks inside itself. A row twice the height of its neighbours is the cost, which is why it is not the default."
      >
        <Measure>
          <Awkward truncate="none" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Destinations on their way"
        note="Three skeleton rows in the geometry of the rows they stand for: the mark’s square and the label’s bar, so nothing moves when the column lands."
      >
        <Measure>
          <SideNavigation aria-busy="true" defaultValue="dashboard">
            <SideNavigationList>
              <Destination icon={ChartNoAxesColumn} label="Dashboard" value="dashboard" />
              <SideNavigationSkeleton labelSize="55%" />
              <SideNavigationSkeleton labelSize="70%" />
              <SideNavigationSkeleton labelSize="45%" />
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
      <Scene
        label="Children on their way"
        note="A group whose destinations are still loading: the row opened, the request carried its reason, and the skeletons hold the room."
      >
        <Measure>
          <SideNavigation defaultExpanded={['deliveries']}>
            <SideNavigationList>
              <SideNavigationItem value="deliveries">
                <SideNavigationTrigger>
                  <SideNavigationIcon>
                    <MapPin aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Deliveries</SideNavigationLabel>
                </SideNavigationTrigger>
                <SideNavigationGroup aria-busy="true">
                  <SideNavigationSkeleton labelSize="50%" />
                  <SideNavigationSkeleton labelSize="65%" />
                </SideNavigationGroup>
              </SideNavigationItem>
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Shell: Story = {
  parameters: scenario('shell'),
  render: () => (
    <Viewport size="tall">
      <AppShell navMode="inline">
        <AppShellBanner>
          <AppShellBrand>
            <AppShellNavToggle />
            <Text size="sm" weight="medium">
              Aurora Logistics
            </Text>
          </AppShellBrand>
        </AppShellBanner>
        <AppShellNav>
          <AppShellNavBody>
            <Aurora defaultExpanded={['deliveries']} />
          </AppShellNavBody>
        </AppShellNav>
        <AppShellMain>
          <Text size="sm" tone="muted">
            Press the toggle: the region narrows to its rail and the column follows, read from the
            region’s own width.
          </Text>
        </AppShellMain>
      </AppShell>
    </Viewport>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One at a time, no guides, middle cut"
        note="The provider carries the three decisions for every column under it."
      >
        <Measure>
          <SideNavigationDefaultsProvider guides={false} multiple={false} truncate="middle">
            <Aurora defaultExpanded={['deliveries']} />
          </SideNavigationDefaultsProvider>
        </Measure>
      </Scene>
      <Scene
        label="A column that states its own"
        note="Under the same provider, guides stated on the column win: the guide is back and the rest still comes from the provider."
      >
        <Measure>
          <SideNavigationDefaultsProvider guides={false} multiple={false} truncate="middle">
            <Aurora defaultExpanded={['deliveries']} guides />
          </SideNavigationDefaultsProvider>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Badge, Avatar, Kbd"
        note="A toned count is a Badge in end; a person is an Avatar in icon; a shortcut is a Kbd. The family draws none of them and gives each its box."
      >
        <Measure>
          <SideNavigation defaultValue="inbox">
            <SideNavigationList>
              <Destination
                end={
                  <Badge size="sm" tone="danger" variant="solid">
                    3
                  </Badge>
                }
                icon={Package}
                label="Caixa de entrada"
                value="inbox"
              />
              <SideNavigationItem value="ana">
                <SideNavigationLink href="#ana">
                  <SideNavigationIcon>
                    <Avatar size="xs" tone="accent" variant="soft">
                      AB
                    </Avatar>
                  </SideNavigationIcon>
                  <SideNavigationLabel>Anna Bell</SideNavigationLabel>
                  <SideNavigationDescription>Coordinator</SideNavigationDescription>
                </SideNavigationLink>
              </SideNavigationItem>
              <Destination
                end={<Kbd>⌘K</Kbd>}
                icon={ChartNoAxesColumn}
                label="Procurar"
                value="search"
              />
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
      <Scene
        label="A router’s link, and actions beside a row"
        note="render hands the row every attribute to the consumer’s own link. Actions stand outside the a, so a control beside a destination is never a control inside a link."
      >
        <Measure>
          <SideNavigation>
            <SideNavigationList>
              <SideNavigationItem value="loads">
                <SideNavigationLink
                  current
                  render={(props) => <a {...props} href="#cargas" data-router-link="" />}
                >
                  <SideNavigationIcon>
                    <Package aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Loads</SideNavigationLabel>
                </SideNavigationLink>
              </SideNavigationItem>
              <SideNavigationItem value="team">
                <SideNavigationLink href="#equipa">
                  <SideNavigationIcon>
                    <Users aria-hidden size={16} />
                  </SideNavigationIcon>
                  <SideNavigationLabel>Equipa</SideNavigationLabel>
                </SideNavigationLink>
                <SideNavigationActions>
                  <Button aria-label="Add member" size="sm" variant="ghost">
                    <Plus aria-hidden size={14} />
                  </Button>
                </SideNavigationActions>
              </SideNavigationItem>
            </SideNavigationList>
          </SideNavigation>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => {
    function Reasons() {
      const [log, setLog] = useState('—');
      return (
        <Stack gap={4}>
          <Text size="sm" tone="muted">
            {log}
          </Text>
          <Aurora
            onExpandedChange={(expanded, request) =>
              setLog(`expanded → [${expanded.join(', ')}] · ${request.reason}`)
            }
            onValueChange={(value, request) => setLog(`value → ${value} · ${request.reason}`)}
          />
        </Stack>
      );
    }
    return (
      <Grid columns={2}>
        <Scene
          label="Tab, arrows, Home, End, Escape"
          note="Tab lands on Dashboard like any link. ArrowDown walks the rows, skipping a closed group; open Deliveries, walk into it, and Escape closes it and lands on its trigger."
        >
          <Measure>
            <Aurora defaultExpanded={['deliveries']} />
          </Measure>
        </Scene>
        <Scene
          label="Which device asked"
          note="Every request carries its reason: pointer or keyboard from a press, escape from the key, select when autoExpand opened a parent."
        >
          <Measure>
            <Reasons />
          </Measure>
        </Scene>
      </Grid>
    );
  },
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The landmark and its name"
        note="A nav named Main navigation holding a list of nine items; each branch a button that says collapsed or expanded; one link that says current page."
      >
        <Measure>
          <Aurora aria-label="Main navigation" defaultExpanded={['deliveries']} />
        </Measure>
      </Scene>
      <Scene
        label="A rail keeps every name"
        note="The label leaves the eye and not the DOM: a reader still hears Encomendas, current page, and a sighted keyboard user sees the tooltip on focus."
      >
        <Measure>
          <Aurora mode="compact" />
        </Measure>
      </Scene>
    </Grid>
  ),
};
