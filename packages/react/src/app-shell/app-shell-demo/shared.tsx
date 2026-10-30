import { ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { Avatar } from '../../avatar';
import { Badge } from '../../badge';
import {
  SideNavigation,
  SideNavigationCount,
  SideNavigationEnd,
  SideNavigationIcon,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
  SideNavigationSection,
  SideNavigationSectionLabel,
} from '../../side-navigation';
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

/**
 * What every product on the reference page is built from. The column of
 * destinations is `side-navigation`, which reads the row geometry the shell
 * publishes; the workspace and account rows at the ends of the column are
 * still drawn here, on the same geometry, until `top-navigation` lands.
 */

export const MONEY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export type Glyph = ComponentType<{ size?: number | string; 'aria-hidden'?: boolean }>;

/**
 * A shell owns a screen, so every scene stands in a window the height of one,
 * and in a room the width of one: the docs column is 676 pixels at 1280, and a
 * column, a content card and a pane squeezed into it drew a content column a
 * few dozen pixels wide. `room={false}` is for the frame a scene measures
 * narrow on purpose.
 */
export function Viewport({
  children,
  room = 'desktop',
  size = 'screen',
}: {
  children: ReactNode;
  room?: 'desktop' | 'wide' | false | undefined;
  size?: 'screen' | 'tall' | undefined;
}) {
  const frame = (
    <div className="slotted-demo-viewport" data-frame="window" data-layout="page" data-size={size}>
      {children}
    </div>
  );
  return room === false ? (
    frame
  ) : (
    <div className="slotted-demo-room" data-room={room}>
      {frame}
    </div>
  );
}

export interface Destination {
  readonly id: string;
  readonly label: string;
  readonly icon: Glyph;
  readonly count?: number;
  /** A count that carries a tone is a Badge; a plain one is the family's own count. */
  readonly tone?: 'accent' | 'secondary';
}

/** A titled run of destinations, or an untitled one at the top of the column. */
export interface NavSection {
  readonly label?: string;
  readonly items: readonly Destination[];
}

/** A destination: a link, its mark, its label, and a count where a product has one. */
function NavItem({ item }: { item: Destination }) {
  const Icon = item.icon;
  return (
    <SideNavigationItem value={item.id}>
      <SideNavigationLink href={`#${item.id}`}>
        <SideNavigationIcon>
          <Icon aria-hidden size={16} />
        </SideNavigationIcon>
        <SideNavigationLabel>{item.label}</SideNavigationLabel>
        {item.count === undefined ? null : item.tone === 'accent' ? (
          <SideNavigationEnd>
            <Badge size="sm" tone="accent" variant="solid">
              {item.count}
            </Badge>
          </SideNavigationEnd>
        ) : (
          <SideNavigationCount>{item.count}</SideNavigationCount>
        )}
      </SideNavigationLink>
    </SideNavigationItem>
  );
}

/**
 * The column of destinations, which is `side-navigation` inside the shell's
 * nav region: a div rather than a second landmark, rows on the geometry the
 * shell publishes, and the rail read from the region's own width.
 */
export function NavColumn({
  current,
  sections,
}: {
  current?: string | undefined;
  sections: readonly NavSection[];
}) {
  return (
    <SideNavigation value={current ?? null}>
      {sections.map((section, index) =>
        section.label === undefined ? (
          <SideNavigationList key={index}>
            {section.items.map((item) => (
              <NavItem item={item} key={item.id} />
            ))}
          </SideNavigationList>
        ) : (
          <SideNavigationSection key={section.label}>
            <SideNavigationSectionLabel>{section.label}</SideNavigationSectionLabel>
            <SideNavigationList>
              {section.items.map((item) => (
                <NavItem item={item} key={item.id} />
              ))}
            </SideNavigationList>
          </SideNavigationSection>
        ),
      )}
    </SideNavigation>
  );
}

/**
 * A two-line row pinned at either end of the column: the workspace at the top,
 * the person at the bottom. Both are pressable, because both open something.
 */
export function NavAccount({
  initials,
  label,
  name,
  role,
  shape = 'circle',
  tone = 'secondary',
  variant = 'soft',
}: {
  initials: string;
  label: string;
  name: string;
  role: string;
  shape?: 'circle' | 'square' | undefined;
  tone?: 'accent' | 'secondary' | undefined;
  variant?: 'soft' | 'solid' | undefined;
}) {
  return (
    <button
      aria-label={label}
      className="slotted-demo-nav-brand slotted-demo-nav-account"
      type="button"
    >
      <span className="slotted-demo-nav-item__mark">
        <Avatar shape={shape} size="sm" tone={tone} variant={variant}>
          {initials}
        </Avatar>
      </span>
      <span className="slotted-demo-nav-aside">
        <Text size="sm" tone="default" weight="medium">
          {name}
        </Text>
        <Text size="xs" tone="muted">
          {role}
        </Text>
      </span>
      <span className="slotted-demo-nav-account__more">
        <ChevronsUpDown aria-hidden size={14} />
      </span>
    </button>
  );
}

/** The application's name beside its mark, in the bar. */
export function Wordmark({ children }: { children: ReactNode }) {
  return <span className="slotted-demo-bar-wordmark">{children}</span>;
}

/** A record's fields, on the pane's own inset. */
export function PaneFields({ fields }: { fields: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="slotted-demo-pane-fields">
      {fields.map(([term, value]) => (
        <Fragment key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** A part drawn as its own name, for the scene that shows the frame empty. */
export function Slot({ fill = true, note, part }: { fill?: boolean; note: string; part: string }) {
  return (
    <span className="slotted-demo-slot" {...(fill ? { 'data-fill': '' } : {})}>
      <span>{`[data-part="${part}"]`}</span>
      <span className="slotted-demo-slot__note">{note}</span>
    </span>
  );
}

/**
 * The frame with no product in it: every part the contract declares, drawn as
 * its own name. Every other scene puts a product in these boxes, and a reader
 * then has no way to tell the family's box from the product's furniture.
 */
export function Anatomy() {
  return (
    <Viewport>
      <AppShell asideMode="inline" navMode="inline">
        <AppShellBanner>
          <AppShellBrand>
            <AppShellNavToggle />
            <Slot fill={false} note="a marca" part="brand" />
          </AppShellBrand>
          <AppShellCentre>
            <Slot note="what grows: search, trail, title" part="centre" />
          </AppShellCentre>
          <AppShellActions>
            <Slot fill={false} note="what is global" part="actions" />
          </AppShellActions>
        </AppShellBanner>
        <AppShellNav>
          <AppShellNavHeader>
            <Slot note="the workspace" part="nav-header" />
          </AppShellNavHeader>
          <AppShellNavBody>
            <Slot note="os destinos, e o que rola" part="nav-body" />
          </AppShellNavBody>
          <AppShellNavFooter>
            <Slot note="a conta" part="nav-footer" />
          </AppShellNavFooter>
        </AppShellNav>
        <AppShellMain>
          <Slot note="a rota" part="main" />
        </AppShellMain>
        <AppShellAside>
          <AppShellAsideResizer />
          <AppShellAsideHeader>
            <Slot fill={false} note="the pane title" part="aside-header" />
            <AppShellAsideToggle />
          </AppShellAsideHeader>
          <AppShellAsideBody>
            <Slot note="the panel, and what scrolls" part="aside-body" />
          </AppShellAsideBody>
          <AppShellAsideFooter>
            <Slot fill={false} note="the pane actions" part="aside-footer" />
          </AppShellAsideFooter>
        </AppShellAside>
        <AppShellFooter>
          <Slot note="the application footer" part="footer" />
        </AppShellFooter>
      </AppShell>
    </Viewport>
  );
}
