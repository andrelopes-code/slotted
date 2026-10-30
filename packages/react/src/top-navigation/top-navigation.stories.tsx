import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronsUpDown, ClipboardCheck, Search } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import {
  AppShell,
  AppShellBanner,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavToggle,
} from '../app-shell';
import { Viewport } from '../app-shell/app-shell-demo/shared';
import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Icon } from '../icon';
import { Shortcut } from '../kbd';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '../menu';
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '../popover';
import {
  NavigationMenuContent,
  NavigationMenuDescription,
  NavigationMenuLabel,
  NavigationMenuLink,
  NavigationMenuLinks,
} from '../navigation-menu/navigation-menu-parts';
import { Page, PageBody } from '../page';
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderSubheading,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '../page-header';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { TopNavigation } from './top-navigation';
import { TopNavigationDefaultsProvider } from './top-navigation-defaults';
import {
  TopNavigationAccount,
  TopNavigationAction,
  TopNavigationActions,
  TopNavigationBrand,
  TopNavigationContext,
  TopNavigationCount,
  TopNavigationHelp,
  TopNavigationHome,
  TopNavigationItem,
  TopNavigationLink,
  TopNavigationList,
  TopNavigationMark,
  TopNavigationName,
  TopNavigationNav,
  TopNavigationNotifications,
  TopNavigationSearch,
  TopNavigationTrigger,
} from './top-navigation-parts';
import { REACT_TOP_NAVIGATION_DOCS, REACT_TOP_NAVIGATION_TOKENS } from './top-navigation.docs';
import type { TopNavigationPriority, TopNavigationProps } from './top-navigation.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOP_NAVIGATION_DOCS.topNavigation.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    priority: Priority,
    panel: Panel,
    search: SearchScene,
    sections: Sections,
    current: Current,
    actions: Actions,
    context: ContextScene,
    size: Size,
    states: States,
    content: Content,
    shell: Shell,
    standalone: Standalone,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  });

const meta = {
  title: 'Components/TopNavigation',
  component: TopNavigation,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TopNavigation',
        description:
          'The bar across the top of an application: the mark, what the application is right now, the destinations, the search and the global controls, folding by priority into a panel as its own width goes.',
        framework: 'React',
        ...REACT_TOP_NAVIGATION_DOCS.topNavigation,
        tokens: REACT_TOP_NAVIGATION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TopNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Aurora Logistics ───────────────────────────────────────────────────── */

/** The freight operator's mark: a consumer's own artwork, as any mark is. */
function AuroraMark() {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <rect fill="var(--slotted-tone-accent-solid)" height="18" rx="5" width="18" x="3" y="3" />
      <path
        d="M7 15.5 12 7l5 8.5"
        stroke="var(--slotted-tone-accent-on-solid)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

/** The four rooms a bar is read in; each lands in one of the family's steps. */
type Room = 'desktop' | 'laptop' | 'tablet' | 'phone';

/**
 * A bar's stage: a room of a stated width — the documentation column is
 * narrower than the bar's widest step, so the width is the scene's to say —
 * holding a viewport four rems tall for a bar on its own, or a tall window
 * when a layer opens under it.
 */
function Stage({
  children,
  room = 'desktop',
  tall = false,
}: {
  children: ReactNode;
  room?: Room;
  tall?: boolean;
}) {
  return (
    <div className="slotted-demo-room" data-room={room}>
      <div className="slotted-demo-viewport" {...(tall ? { 'data-size': 'tall' } : {})}>
        {children}
      </div>
    </div>
  );
}

interface Destination {
  readonly label: string;
  readonly priority?: TopNavigationPriority;
  readonly value: string;
}

/**
 * Aurora's destinations, and what gives way first. Four links and a section
 * is what a bar with a workspace switcher, a field and three controls holds
 * at 1024 with the field still a field — the reference page's own arithmetic,
 * and the arithmetic a product does when it assigns priorities.
 */
const DESTINATIONS: readonly Destination[] = [
  { label: 'Dashboard', priority: 'high', value: 'dashboard' },
  { label: 'Loads', priority: 'high', value: 'loads' },
  { label: 'Reports', priority: 'low', value: 'reports' },
  { label: 'Billing', priority: 'low', value: 'billing' },
];

function Brand({ name = 'Aurora Logistics' }: { name?: string }) {
  return (
    <TopNavigationBrand>
      <TopNavigationHome href="#home">
        <TopNavigationMark>
          <AuroraMark />
        </TopNavigationMark>
        <TopNavigationName>{name}</TopNavigationName>
      </TopNavigationHome>
    </TopNavigationBrand>
  );
}

/** The section that opens a panel of destinations: Frota, after Cargas. */
function Fleet() {
  return (
    <TopNavigationItem value="frota">
      <TopNavigationTrigger>Frota</TopNavigationTrigger>
      <NavigationMenuContent columns={2}>
        <NavigationMenuLinks>
          <li>
            <NavigationMenuLink href="#vehicles">
              <NavigationMenuLabel>Vehicles</NavigationMenuLabel>
              <NavigationMenuDescription>
                License plates, capacity and documents.
              </NavigationMenuDescription>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="#motoristas">
              <NavigationMenuLabel>Drivers</NavigationMenuLabel>
              <NavigationMenuDescription>
                Schedules, licenses and driving hours.
              </NavigationMenuDescription>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="#maintenance">
              <NavigationMenuLabel>Maintenance</NavigationMenuLabel>
              <NavigationMenuDescription>
                Scheduled services and open breakdowns.
              </NavigationMenuDescription>
            </NavigationMenuLink>
          </li>
        </NavigationMenuLinks>
      </NavigationMenuContent>
    </TopNavigationItem>
  );
}

function Destinations({
  disabled = [],
  items = DESTINATIONS,
  fleet = true,
}: {
  disabled?: readonly string[];
  fleet?: boolean;
  items?: readonly Destination[];
}) {
  return (
    <TopNavigationNav>
      <TopNavigationList>
        {items.map((item) => (
          <Fragment key={item.value}>
            <TopNavigationItem
              disabled={disabled.includes(item.value)}
              priority={item.priority ?? 'medium'}
              value={item.value}
            >
              <TopNavigationLink href={`#${item.value}`}>{item.label}</TopNavigationLink>
            </TopNavigationItem>
            {item.value === 'cargas' && fleet ? <Fleet /> : null}
          </Fragment>
        ))}
      </TopNavigationList>
    </TopNavigationNav>
  );
}

function SearchField() {
  return (
    <TopNavigationSearch>
      <TextField
        aria-label="Search"
        end={<Shortcut keys="mod+k" size="sm" variant="soft" />}
        placeholder="Search loads, customers, routes…"
        start={
          <Icon>
            <Search />
          </Icon>
        }
        type="search"
        variant="subtle"
      />
    </TopNavigationSearch>
  );
}

function Workspace() {
  return (
    <Menu align="start" side="bottom">
      <MenuTrigger
        render={(props) => (
          <Button
            {...props}
            end={<ChevronsUpDown aria-hidden />}
            size="sm"
            tone="secondary"
            variant="ghost"
          >
            Portland · Operations
          </Button>
        )}
      />
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Workspaces</MenuGroupLabel>
          <MenuItem>Portland · Operations</MenuItem>
          <MenuItem>Austin · Distribution</MenuItem>
          <MenuItem>Madrid · Cross-border</MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

function Context({ environment = false }: { environment?: boolean }) {
  return (
    <TopNavigationContext>
      <Workspace />
      {environment ? (
        <Badge size="sm" tone="warning" variant="soft">
          Staging
        </Badge>
      ) : null}
    </TopNavigationContext>
  );
}

function Notifications({ count = 3 }: { count?: number | string }) {
  return (
    <Popover align="end" side="bottom">
      <PopoverTrigger
        render={(props) => (
          <TopNavigationNotifications {...props}>
            <TopNavigationCount>{count}</TopNavigationCount>
          </TopNavigationNotifications>
        )}
      />
      <PopoverLayer>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Notifications</PopoverTitle>
          </PopoverHeader>
          <PopoverBody>
            <PopoverDescription>
              Load 4821 delivered in Boston · North Route 40 min late · Invoice 2026-0917 pending
              approval
            </PopoverDescription>
          </PopoverBody>
        </PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}

/** A control of the product's own beside the bell: approvals, with its own glyph and the same count. */
function Approvals({ count = 7 }: { count?: number | string }) {
  return (
    <Popover align="end" side="bottom">
      <PopoverTrigger
        render={(props) => (
          <TopNavigationAction {...props} aria-label={`Approvals, ${count} pending`}>
            <ClipboardCheck />
            <TopNavigationCount>{count}</TopNavigationCount>
          </TopNavigationAction>
        )}
      />
      <PopoverLayer>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Approvals</PopoverTitle>
          </PopoverHeader>
          <PopoverBody>
            <PopoverDescription>
              Quote 2026-114 above the discount · Credit note 88 awaiting validation
            </PopoverDescription>
          </PopoverBody>
        </PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}

function Account({ name }: { name?: string }) {
  return (
    <Menu align="end" side="bottom">
      <MenuTrigger
        render={(props) => (
          <TopNavigationAccount {...props}>
            <Avatar size="xs" tone="accent" variant="soft">
              AB
            </Avatar>
            {name === undefined ? null : <span>{name}</span>}
          </TopNavigationAccount>
        )}
      />
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Anna Barnes · Dispatcher</MenuGroupLabel>
          <MenuItem>Profile</MenuItem>
          <MenuItem>Preferences</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem>Sign out</MenuItem>
      </MenuContent>
    </Menu>
  );
}

function GlobalActions({
  accountName,
  count,
  help = 'link',
}: {
  accountName?: string;
  count?: number | string;
  help?: 'link' | 'popover';
}) {
  return (
    <TopNavigationActions>
      {help === 'link' ? (
        <TopNavigationHelp href="#ajuda" />
      ) : (
        <Popover align="end" side="bottom">
          <PopoverTrigger render={(props) => <TopNavigationHelp {...props} />} />
          <PopoverLayer>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Ajuda</PopoverTitle>
              </PopoverHeader>
              <PopoverBody>
                <PopoverDescription>
                  Documentation, keyboard shortcuts and Aurora's support channel.
                </PopoverDescription>
              </PopoverBody>
            </PopoverContent>
          </PopoverLayer>
        </Popover>
      )}
      <Notifications {...(count === undefined ? {} : { count })} />
      <Account {...(accountName === undefined ? {} : { name: accountName })} />
    </TopNavigationActions>
  );
}

/** The whole bar of Aurora Logistics' back office. */
function Aurora({
  context = true,
  search = true,
  ...props
}: Partial<TopNavigationProps> & { context?: boolean; search?: boolean }) {
  return (
    <TopNavigation defaultValue="dashboard" {...props}>
      <Brand />
      {context ? <Context /> : null}
      <Destinations />
      {search ? <SearchField /> : null}
      <GlobalActions />
    </TopNavigation>
  );
}

/* ── The scenes ─────────────────────────────────────────────────────────── */

export const Playground: Story = {
  args: { frame: true, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Stage room="desktop" tall>
      <Aurora {...args} skipTo="conteudo" />
    </Stage>
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
    <Stage room="desktop">
      <TopNavigation defaultValue="link">
        <TopNavigationBrand>
          <TopNavigationHome href="#home">
            <TopNavigationMark>
              <AuroraMark />
            </TopNavigationMark>
            <TopNavigationName>name</TopNavigationName>
          </TopNavigationHome>
        </TopNavigationBrand>
        <TopNavigationContext>
          <Part name="context" />
        </TopNavigationContext>
        <TopNavigationNav>
          <TopNavigationList>
            <TopNavigationItem priority="high" value="link">
              <TopNavigationLink href="#link">link</TopNavigationLink>
            </TopNavigationItem>
            <TopNavigationItem priority="high" value="trigger">
              <TopNavigationTrigger>trigger › indicator</TopNavigationTrigger>
              <NavigationMenuContent>
                <NavigationMenuLinks>
                  <li>
                    <NavigationMenuLink href="#content">
                      navigation-menu › content › link
                    </NavigationMenuLink>
                  </li>
                </NavigationMenuLinks>
              </NavigationMenuContent>
            </TopNavigationItem>
            <TopNavigationItem priority="low" value="folded">
              <TopNavigationLink href="#folded">item priority=low</TopNavigationLink>
            </TopNavigationItem>
          </TopNavigationList>
        </TopNavigationNav>
        <TopNavigationSearch>
          <TextField aria-label="search" placeholder="search › text-field" variant="subtle" />
        </TopNavigationSearch>
        <TopNavigationActions>
          <TopNavigationHelp href="#help">help</TopNavigationHelp>
          <TopNavigationNotifications>
            <TopNavigationCount>3</TopNavigationCount>
          </TopNavigationNotifications>
          <TopNavigationAccount>
            <Avatar size="xs" tone="secondary" variant="soft">
              ac
            </Avatar>
          </TopNavigationAccount>
        </TopNavigationActions>
      </TopNavigation>
    </Stage>
  ),
};

export const Priority: Story = {
  parameters: scenario('priority'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Desktop, 1024 pixels"
        note="Above 1024 every destination stands in the bar, the search is a field, and more is nowhere."
      >
        <Stage room="desktop">
          <Aurora />
        </Stage>
      </Scene>
      <Scene
        label="Laptop, 900 pixels"
        note="Under 1024: Reports and Billing — the low ones — have folded, and more counts two. Everything else keeps its place, and the field keeps its floor."
      >
        <Stage room="laptop">
          <Aurora />
        </Stage>
      </Scene>
      <Scene
        label="Tablet, 640 pixels"
        note="Under 1024 and from 600 up, the bar folds as on the laptop: Reports and Billing are in more, which counts two. Fleet — the medium one — the workspace, the field and the name keep their places in the bar."
      >
        <Stage room="tablet">
          <Aurora />
        </Stage>
      </Scene>
      <Scene
        label="Phone, 375 pixels"
        note="Under 600 Fleet — the medium one — folds, the workspace moves to the panel and the search becomes a magnifier in the actions; under 480 Dashboard and Loads — the high ones — fold too, help moves to the panel, the name leaves the eye, and the gaps close up. More counts five. What stays is the mark, more, the magnifier, the bell and the account."
      >
        <Stage room="phone">
          <Aurora />
        </Stage>
      </Scene>
      <Scene
        label="Nothing to fold"
        note="A bar with no destinations, no context and no help renders no more at any width: there is nothing for a panel to hold."
      >
        <Stage room="phone">
          <TopNavigation>
            <Brand />
            <TopNavigationActions>
              <Notifications />
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

function ControlledPanel() {
  const [moreOpen, setMoreOpen] = useState(true);
  const [reason, setReason] = useState('—');
  return (
    <Stack gap={4}>
      <Stage room="phone" tall>
        <Aurora
          moreOpen={moreOpen}
          onMoreOpenChange={(open, request) => {
            setReason(request.reason);
            setMoreOpen(open);
          }}
        />
      </Stage>
      <Text size="sm" tone="muted">
        Last request: {reason}
      </Text>
    </Stack>
  );
}

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Open on a phone, everything folded"
        note="The panel takes the bar's whole width: the workspace first, the destinations as rows — Dashboard current, Fleet with its chevron — and Help last. Press Loads: the panel closes with select."
      >
        <ControlledPanel />
      </Scene>
      <Scene
        label="Open on a tablet, the low ones folded"
        note="Above 480 the panel stands under the bar's end at 20rem. Tab from more into it, press Escape, and focus returns to more; a press outside closes it too, and a press on more toggles it."
      >
        <Stage room="tablet" tall>
          <Aurora defaultMoreOpen />
        </Stage>
      </Scene>
      <Scene
        label="A folded section keeps its menu"
        note="Frota folded into the panel still opens its own menu: the row is the same element, wrapped in the same Menu."
      >
        <Stage room="phone" tall>
          <TopNavigation defaultMoreOpen>
            <Brand />
            <Destinations items={DESTINATIONS.slice(0, 2)} />
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const SearchScene: Story = {
  parameters: scenario('search'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Laptop: the field"
        note="Above 600 the field stands in the middle of the bar, up to 28rem wide, with the shortcut at its end. Nothing here needs the magnifier."
      >
        <Stage room="laptop">
          <Aurora context={false} />
        </Stage>
      </Scene>
      <Scene
        label="Phone: the magnifier"
        note="Below 600 the field has left and a magnifier stands first in the actions. Press it: the field takes the bar and focus lands in it."
      >
        <Stage room="phone">
          <Aurora context={false} />
        </Stage>
      </Scene>
      <Scene
        label="Phone: the field open over the bar"
        note="Everything else has left the eye; the cross at the end and Escape hand the bar back and return focus to the magnifier. Focus leaving the field closes it too."
      >
        <Stage room="phone">
          <Aurora context={false} defaultSearchOpen />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Frota opens a menu"
        note="Press Frota: Menu writes aria-expanded and data-open on the trigger, the chevron turns, and the items are the menu's own. Arrow keys inside are Menu's."
      >
        <Stage room="laptop" tall>
          <TopNavigation defaultValue="dashboard">
            <Brand />
            <Destinations items={DESTINATIONS.slice(0, 2)} />
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="Two sections side by side"
        note="Operations and Administration as two sections of one navigation menu: one surface, one open at a time, and moving the pointer from one to the other switches without a delay."
      >
        <Stage room="laptop" tall>
          <TopNavigation>
            <Brand />
            <TopNavigationNav>
              <TopNavigationList>
                <TopNavigationItem priority="high" value="operacoes">
                  <TopNavigationTrigger>Operations</TopNavigationTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLinks>
                      <li>
                        <NavigationMenuLink href="#cargas">Cargas</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#rotas">Rotas</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#deliveries">Deliveries</NavigationMenuLink>
                      </li>
                    </NavigationMenuLinks>
                  </NavigationMenuContent>
                </TopNavigationItem>
                <TopNavigationItem priority="high" value="administracao">
                  <TopNavigationTrigger>Administration</TopNavigationTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLinks>
                      <li>
                        <NavigationMenuLink href="#utilizadores">Utilizadores</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#billing">Billing</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#integrations">Integrations</NavigationMenuLink>
                      </li>
                    </NavigationMenuLinks>
                  </NavigationMenuContent>
                </TopNavigationItem>
              </TopNavigationList>
            </TopNavigationNav>
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

function ControlledCurrent() {
  const [value, setValue] = useState<string | null>('cargas');
  const [reason, setReason] = useState('—');
  return (
    <Stack gap={4}>
      <Stage room="desktop">
        <TopNavigation
          onValueChange={(next, request) => {
            setReason(request.reason);
            setValue(next);
          }}
          value={value}
        >
          <Brand />
          <Destinations fleet={false} />
          <TopNavigationActions>
            <Account />
          </TopNavigationActions>
        </TopNavigation>
      </Stage>
      <Text size="sm" tone="muted">
        value: {value ?? 'null'} · last reason: {reason}
      </Text>
    </Stack>
  );
}

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Owned by the application"
        note="Press a destination: the request carries pointer, or keyboard for Enter, and the application moves value. Nothing moves until it does."
      >
        <ControlledCurrent />
      </Scene>
      <Scene
        label="A link that says so itself"
        note="Routes states current on the row — what a router's active link writes — and wins over the root's value, which names Dashboard."
      >
        <Stage room="laptop">
          <TopNavigation value="dashboard">
            <Brand />
            <TopNavigationNav>
              <TopNavigationList>
                <TopNavigationItem priority="high" value="dashboard">
                  <TopNavigationLink href="#dashboard">Dashboard</TopNavigationLink>
                </TopNavigationItem>
                <TopNavigationItem priority="high" value="routes">
                  <TopNavigationLink current href="#rotas">
                    Rotas
                  </TopNavigationLink>
                </TopNavigationItem>
              </TopNavigationList>
            </TopNavigationNav>
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="The current destination, folded"
        note="Billing is current and low priority; on a laptop it has folded, and more carries the current mark in its place."
      >
        <Stage room="laptop">
          <TopNavigation defaultValue="faturacao">
            <Brand />
            <Destinations fleet={false} />
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Help as a destination, the bell, the account"
        note="Help is a link to the help centre; the bell opens a popover with what is waiting; the account opens a menu under the avatar. Hover any of them for its name."
      >
        <Stage room="laptop" tall>
          <TopNavigation>
            <Brand />
            <Destinations fleet={false} items={DESTINATIONS.slice(0, 2)} />
            <GlobalActions />
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="Help as a trigger"
        note="Without an href, help is a button the consumer wraps: here a popover with the documentation, the shortcuts and the support channel."
      >
        <Stage room="laptop" tall>
          <TopNavigation>
            <Brand />
            <GlobalActions help="popover" />
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="A control of the product's own"
        note="Approvals beside the bell: the same square, ink, hover and focus ring as the controls the family marks, the product's own glyph inside, and the count over its corner. Nothing in the cluster is a different kind of button."
      >
        <Stage room="laptop" tall>
          <TopNavigation>
            <Brand />
            <TopNavigationActions>
              <TopNavigationHelp href="#ajuda" />
              <Approvals />
              <Notifications />
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="One digit, two, three"
        note="The count is a disc for one digit and a pill from two, growing outward so it never covers the bell or the control beside it. 99+ is the product's own format."
      >
        <Stage room="tablet">
          <TopNavigation>
            <Brand />
            <TopNavigationActions>
              <Notifications count={3} />
              <Notifications count={12} />
              <Notifications count="99+" />
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const ContextScene: Story = {
  parameters: scenario('context'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="After the brand"
        note="The workspace switcher opens a menu of the operator's three sites; the environment badge says this is not production. Both are the consumer's own content in the context region."
      >
        <Stage room="laptop" tall>
          <TopNavigation>
            <Brand />
            <Context environment />
            <Destinations fleet={false} items={DESTINATIONS.slice(0, 2)} />
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="Moved to the panel"
        note="On a phone the whole region has moved to the top of the panel — the same elements, so the switcher still opens its menu from there."
      >
        <Stage room="phone" tall>
          <TopNavigation defaultMoreOpen>
            <Brand />
            <Context environment />
            <Destinations fleet={false} items={DESTINATIONS.slice(0, 2)} />
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Grid columns={1}>
      <Scene label="sm" note="Thirty-pixel controls at comfortable: a bar for a dense tool.">
        <Stage room="desktop">
          <Aurora context={false} size="sm" />
        </Stage>
      </Scene>
      <Scene
        label="md"
        note="The default, and the step the shell's row geometry is read at: thirty-four pixels."
      >
        <Stage room="desktop">
          <Aurora context={false} size="md" />
        </Stage>
      </Scene>
      <Scene label="lg" note="Thirty-eight-pixel controls, for a product with room to breathe.">
        <Stage room="desktop">
          <Aurora context={false} size="lg" />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Current, open, disabled"
        note="Dashboard is current; press Fleet to see the open section hold its ground; Billing is disabled — grey, still focusable, its href kept and its press refused; the account is disabled too."
      >
        <Stage room="desktop" tall>
          <TopNavigation defaultValue="dashboard">
            <Brand />
            <Destinations disabled={['billing']} />
            <TopNavigationActions>
              <TopNavigationHelp href="#ajuda" />
              <Notifications />
              <TopNavigationAccount disabled>
                <Avatar size="xs" tone="secondary" variant="soft">
                  JR
                </Avatar>
              </TopNavigationAccount>
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="Hover, press, focus"
        note="Every control answers the pointer with a ground and a press with a darker one; Tab draws the ring outside each."
      >
        <Stage room="desktop">
          <TopNavigation>
            <Brand />
            <Destinations fleet={false} items={DESTINATIONS.slice(0, 3)} />
            <TopNavigationActions>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="Open layers hold the ground"
        note="A bell whose popover is open, an account whose menu is open: data-open keeps the hover ground while the layer is up."
      >
        <Stage room="laptop" tall>
          <TopNavigation>
            <Brand />
            <TopNavigationActions>
              <Popover align="end" defaultOpen side="bottom">
                <PopoverTrigger
                  render={(props) => (
                    <TopNavigationNotifications {...props}>
                      <TopNavigationCount>2</TopNavigationCount>
                    </TopNavigationNotifications>
                  )}
                />
                <PopoverLayer>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>Two notifications</PopoverTitle>
                    </PopoverHeader>
                    <PopoverBody>
                      <PopoverDescription>
                        Load 4821 delivered · North Route late
                      </PopoverDescription>
                    </PopoverBody>
                  </PopoverContent>
                </PopoverLayer>
              </Popover>
              <Account />
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

const LONG: readonly Destination[] = [
  { label: 'Acompanhamento de encomendas', priority: 'high', value: 'acompanhamento' },
  { label: 'Planeamento de rotas e janelas', priority: 'low', value: 'planeamento' },
];

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A long name and long destinations"
        note="Integrated International Logistics Operations Management Platform is cut at 16rem; the destinations keep their words; the count keeps its three characters."
      >
        <Stage room="desktop">
          <TopNavigation defaultValue="acompanhamento">
            <Brand name="Integrated International Logistics Operations Management Platform" />
            <Destinations fleet={false} items={LONG} />
            <GlobalActions count="99+" />
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="The same content on a tablet"
        note="The longer destination has folded, the name has shortened to its ellipsis — it gives way before any control does — and the pill still reads 99+."
      >
        <Stage room="tablet">
          <TopNavigation defaultValue="acompanhamento">
            <Brand name="Integrated International Logistics Operations Management Platform" />
            <Destinations fleet={false} items={LONG} />
            <GlobalActions count="99+" />
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="A name beside the avatar"
        note="Maria Bartolomeu stands beside her avatar above 600 pixels and gives way below it; the avatar is the whole control on a phone."
      >
        <Stage room="desktop">
          <TopNavigation defaultValue="dashboard">
            <Brand />
            <Destinations fleet={false} items={DESTINATIONS.slice(0, 2)} />
            <SearchField />
            <GlobalActions accountName="Maria Bartolomeu" />
          </TopNavigation>
        </Stage>
      </Scene>
      <Scene
        label="Right to left"
        note="The same bar under dir=rtl: the brand at the start, the actions at the end, the count at the bell's inline-end corner, the chevron still pointing down."
      >
        <Stage room="desktop">
          <TopNavigation defaultValue="lawha" dir="rtl">
            <TopNavigationBrand>
              <TopNavigationHome href="#home">
                <TopNavigationMark>
                  <AuroraMark />
                </TopNavigationMark>
                <TopNavigationName>أورورا للخدمات اللوجستية</TopNavigationName>
              </TopNavigationHome>
            </TopNavigationBrand>
            <TopNavigationNav aria-label="التنقل">
              <TopNavigationList>
                <TopNavigationItem priority="high" value="lawha">
                  <TopNavigationLink href="#lawha">لوحة التحكم</TopNavigationLink>
                </TopNavigationItem>
                <TopNavigationItem priority="high" value="shahnat">
                  <TopNavigationLink href="#shahnat">الشحنات</TopNavigationLink>
                </TopNavigationItem>
                <TopNavigationItem value="masarat">
                  <TopNavigationTrigger>الأسطول</TopNavigationTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLinks>
                      <li>
                        <NavigationMenuLink href="#markabat">المركبات</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#saiqun">السائقون</NavigationMenuLink>
                      </li>
                    </NavigationMenuLinks>
                  </NavigationMenuContent>
                </TopNavigationItem>
              </TopNavigationList>
            </TopNavigationNav>
            <TopNavigationSearch>
              <TextField
                aria-label="بحث"
                placeholder="ابحث عن الشحنات والعملاء…"
                type="search"
                variant="subtle"
              />
            </TopNavigationSearch>
            <TopNavigationActions>
              <TopNavigationHelp aria-label="مساعدة" href="#ajuda" />
              <TopNavigationNotifications aria-label="الإشعارات">
                <TopNavigationCount>٣</TopNavigationCount>
              </TopNavigationNotifications>
              <TopNavigationAccount aria-label="الحساب">
                <Avatar size="xs" tone="accent" variant="soft">
                  أب
                </Avatar>
              </TopNavigationAccount>
            </TopNavigationActions>
          </TopNavigation>
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Shell: Story = {
  parameters: scenario('shell'),
  render: () => (
    <div className="slotted-demo-room" data-room="desktop">
      <Viewport size="tall">
        <AppShell navMode="inline">
          <AppShellBanner>
            <TopNavigation defaultValue="dashboard">
              <TopNavigationBrand>
                <AppShellNavToggle />
                <TopNavigationHome href="#home">
                  <TopNavigationMark>
                    <AuroraMark />
                  </TopNavigationMark>
                  <TopNavigationName>Aurora Logistics</TopNavigationName>
                </TopNavigationHome>
              </TopNavigationBrand>
              <Context />
              <Destinations />
              <SearchField />
              <GlobalActions />
            </TopNavigation>
          </AppShellBanner>
          <AppShellNav>
            <AppShellNavBody>
              <Text size="sm" tone="muted">
                The shell's navigation column.
              </Text>
            </AppShellNavBody>
          </AppShellNav>
          <AppShellMain>
            <Text size="sm" tone="muted">
              The bar is a div inside the shell's banner: no second landmark, no ground of its own,
              and its brand on the shell's row inset so the toggle and the mark stand over the
              column's marks. Press the toggle: the column narrows to its rail and the bar gains the
              width.
            </Text>
          </AppShellMain>
        </AppShell>
      </Viewport>
    </div>
  ),
};

export const Standalone: Story = {
  parameters: scenario('standalone'),
  render: () => (
    <div className="slotted-demo-room" data-room="desktop">
      <Viewport size="tall">
        <Aurora skipTo="conteudo-standalone" />
        <Page id="conteudo-standalone" landmark="none" scroll="ancestor" tabIndex={-1} width="full">
          <PageHeader level="1" size="md">
            <PageHeaderTitleArea>
              <PageHeaderTitleRow>
                <PageHeaderTitle>
                  <PageHeaderHeading>Operations dashboard</PageHeaderHeading>
                  <PageHeaderSubheading>
                    412 loads in progress · 19 awaiting transport
                  </PageHeaderSubheading>
                </PageHeaderTitle>
              </PageHeaderTitleRow>
            </PageHeaderTitleArea>
          </PageHeader>
          <PageBody>
            <Text size="sm" tone="muted">
              Press Tab once from the top of the page: the skip link appears at the start of the bar
              and Enter lands focus on this page, past every control in it.
            </Text>
          </PageBody>
        </Page>
      </Viewport>
    </div>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An application at the large step"
        note="The provider carries the size; the bar does not state it. The words the icon-only controls are named by — hover the bell — come from the language in force."
      >
        <TopNavigationDefaultsProvider size="lg">
          <Stage room="laptop">
            <TopNavigation defaultValue="dashboard">
              <Brand />
              <Destinations fleet={false} items={DESTINATIONS.slice(0, 3)} />
              <TopNavigationActions>
                <TopNavigationHelp href="#help" />
                <TopNavigationNotifications>
                  <TopNavigationCount>3</TopNavigationCount>
                </TopNavigationNotifications>
                <Account />
              </TopNavigationActions>
            </TopNavigation>
          </Stage>
        </TopNavigationDefaultsProvider>
      </Scene>
      <Scene
        label="The bar still wins"
        note="Under the same provider, a bar that states size=sm renders at the small step."
      >
        <TopNavigationDefaultsProvider size="lg">
          <Stage room="laptop">
            <TopNavigation size="sm">
              <Brand />
              <Destinations fleet={false} items={DESTINATIONS.slice(0, 3)} />
              <TopNavigationActions>
                <Account />
              </TopNavigationActions>
            </TopNavigation>
          </Stage>
        </TopNavigationDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

/** A router's link, as any router writes one: an anchor that knows whether it is active. */
function RouterLink({
  active,
  to,
  ...props
}: { active?: boolean; to: string } & ComponentPropsWithRef<'a'>) {
  return <a {...props} {...(active ? { 'aria-current': 'page' } : {})} href={to} />;
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Scene
      label="Everything the bar composes"
      note="A router link as the destination through render, the workspace menu and the environment badge in the context, the shortcut in the search, Menu on Frota and on the account, Popover on the bell."
    >
      <Stage room="desktop" tall>
        <TopNavigation>
          <Brand />
          <Context environment />
          <TopNavigationNav>
            <TopNavigationList>
              <TopNavigationItem priority="high" value="dashboard">
                <TopNavigationLink render={(props) => <RouterLink {...props} to="#dashboard" />}>
                  Dashboard
                </TopNavigationLink>
              </TopNavigationItem>
              <TopNavigationItem priority="high" value="cargas">
                <TopNavigationLink
                  render={(props) => <RouterLink {...props} active to="#cargas" />}
                >
                  Cargas
                </TopNavigationLink>
              </TopNavigationItem>
              <Fleet />
            </TopNavigationList>
          </TopNavigationNav>
          <SearchField />
          <GlobalActions />
        </TopNavigation>
      </Stage>
    </Scene>
  ),
};

function KeyboardLog() {
  const [log, setLog] = useState<string[]>([]);
  const record = (what: string) => setLog((entries) => [what, ...entries].slice(0, 6));
  return (
    <Stack gap={4}>
      <Stage room="tablet" tall>
        <TopNavigation
          defaultValue="dashboard"
          onMoreOpenChange={(open, request) =>
            record(`more ${open ? 'open' : 'closed'} · ${request.reason}`)
          }
          onSearchOpenChange={(open, request) =>
            record(`search ${open ? 'open' : 'closed'} · ${request.reason}`)
          }
          onValueChange={(value, request) => record(`value ${value} · ${request.reason}`)}
          skipTo="conteudo-keyboard"
        >
          <Brand />
          <Destinations />
          <SearchField />
          <GlobalActions />
        </TopNavigation>
      </Stage>
      <Stack gap={1}>
        {log.length === 0 ? (
          <Text size="sm" tone="muted">
            Tab through the bar; press Enter on a destination or on more; press Escape inside the
            panel.
          </Text>
        ) : (
          log.map((entry, index) => (
            <Text key={`${index}-${entry}`} size="sm" tone="muted">
              {entry}
            </Text>
          ))
        )}
      </Stack>
    </Stack>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Scene
      label="Every control is a tab stop, on a tablet"
      note="Skip, the mark, Dashboard, Loads, Fleet, more, the panel's rows when it is open, the field, help, the bell, the account — in that order, with no arrow keys."
    >
      <KeyboardLog />
    </Scene>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Scene
      label="Two landmarks, one list, four named buttons"
      note="Open the accessibility tree: banner › navigation Main › list › link Dashboard, current page …; button More, 2, collapsed; search Search; link Help; button Notifications 3; button Account."
    >
      <Stage room="laptop">
        <TopNavigation aria-label="Aurora" defaultValue="dashboard">
          <Brand />
          <TopNavigationNav aria-label="Main">
            <TopNavigationList>
              {DESTINATIONS.map((item) => (
                <TopNavigationItem
                  key={item.value}
                  priority={item.priority ?? 'medium'}
                  value={item.value}
                >
                  <TopNavigationLink href={`#${item.value}`}>{item.label}</TopNavigationLink>
                </TopNavigationItem>
              ))}
            </TopNavigationList>
          </TopNavigationNav>
          <SearchField />
          <GlobalActions />
        </TopNavigation>
      </Stage>
    </Scene>
  ),
};
