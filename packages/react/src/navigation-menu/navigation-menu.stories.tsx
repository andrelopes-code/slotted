import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CalendarDays,
  ChartNoAxesColumn,
  FileText,
  Package,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Button, ButtonLink } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Text } from '../typography';
import {
  TopNavigation,
  TopNavigationAccount,
  TopNavigationActions,
  TopNavigationBrand,
  TopNavigationContext,
  TopNavigationHome,
  TopNavigationName,
} from '../top-navigation';
import { NavigationMenu } from './navigation-menu';
import { NavigationMenuDefaultsProvider } from './navigation-menu-defaults';
import {
  NavigationMenuContent,
  NavigationMenuDescription,
  NavigationMenuFooter,
  NavigationMenuGroup,
  NavigationMenuGroupLabel,
  NavigationMenuIcon,
  NavigationMenuItem,
  NavigationMenuLabel,
  NavigationMenuLink,
  NavigationMenuLinks,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu-parts';
import { REACT_NAVIGATION_MENU_DOCS, REACT_NAVIGATION_MENU_TOKENS } from './navigation-menu.docs';
import type { NavigationMenuHandle, NavigationMenuProps } from './navigation-menu.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_NAVIGATION_MENU_DOCS.navigationMenu.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    links: Links,
    rich: Rich,
    groups: Groups,
    footer: Footer,
    current: Current,
    vertical: Vertical,
    nested: Nested,
    states: States,
    size: Size,
    content: Content,
    controlled: Controlled,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  });

const meta = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'NavigationMenu',
        description:
          'The sections of a site or an application in a row or a column, each a button that shows a panel of links on one shared surface that moves between them.',
        framework: 'React',
        ...REACT_NAVIGATION_MENU_DOCS.navigationMenu,
        tokens: REACT_NAVIGATION_MENU_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

type Glyph = ComponentType<{ size?: number | string; 'aria-hidden'?: boolean }>;

/**
 * A box with room under the row for the panel, which is laid over the page
 * and takes no room of its own. The box clips, as a region of an application
 * does, and the surface measures itself against it.
 */
function Room({ children, size = 'tall' }: { children: ReactNode; size?: 'tall' | 'screen' }) {
  return (
    <div className="slotted-demo-viewport" data-place="top" data-size={size}>
      {children}
    </div>
  );
}

/** A destination with a mark, a title and a description, as Aurora's catalogue writes one. */
function RichLink({
  current,
  description,
  disabled,
  href,
  icon: Icon,
  label,
}: {
  current?: boolean;
  description: string;
  disabled?: boolean;
  href: string;
  icon?: Glyph;
  label: string;
}) {
  return (
    <li>
      <NavigationMenuLink current={current} disabled={disabled} href={href}>
        {Icon === undefined ? null : (
          <NavigationMenuIcon>
            <Icon aria-hidden size={16} />
          </NavigationMenuIcon>
        )}
        <NavigationMenuLabel>{label}</NavigationMenuLabel>
        <NavigationMenuDescription>{description}</NavigationMenuDescription>
      </NavigationMenuLink>
    </li>
  );
}

function Plain({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <NavigationMenuLink href={href}>{label}</NavigationMenuLink>
    </li>
  );
}

function ProductsPanel({ footer = true }: { footer?: boolean }) {
  return (
    <NavigationMenuContent columns={2}>
      <NavigationMenuLinks>
        <RichLink
          description="Receipts, shipments, and inventory by location."
          href="#warehouse"
          icon={Warehouse}
          label="Warehouse"
        />
        <RichLink
          current
          description="Routes, fuel use, and vehicle maintenance."
          href="#fleet"
          icon={Truck}
          label="Frota"
        />
        <RichLink
          description="Invoices, credit notes, and reconciliation."
          href="#billing"
          icon={FileText}
          label="Billing"
        />
        <RichLink
          description="Loading windows and scheduled deliveries."
          href="#schedule"
          icon={CalendarDays}
          label="Agenda"
        />
        <RichLink
          description="Accounts, contacts, and commercial terms."
          href="#customers"
          icon={Users}
          label="Customers"
        />
        <RichLink
          description="Available on the Enterprise plan."
          disabled
          href="#reports"
          icon={ChartNoAxesColumn}
          label="Reports"
        />
      </NavigationMenuLinks>
      {footer ? (
        <NavigationMenuFooter>
          <Text size="xs" tone="muted">
            New: demand forecasting by warehouse.
          </Text>
          <ButtonLink href="#products" size="sm">
            Ver todos
          </ButtonLink>
        </NavigationMenuFooter>
      ) : null}
    </NavigationMenuContent>
  );
}

function SolutionsPanel() {
  return (
    <NavigationMenuContent columns={3}>
      <NavigationMenuGroup>
        <NavigationMenuGroupLabel>Por setor</NavigationMenuGroupLabel>
        <NavigationMenuLinks>
          <Plain href="#retail" label="Retail" />
          <Plain href="#manufacturing" label="Manufacturing" />
          <Plain href="#healthcare" label="Healthcare" />
        </NavigationMenuLinks>
      </NavigationMenuGroup>
      <NavigationMenuGroup>
        <NavigationMenuGroupLabel>By size</NavigationMenuGroupLabel>
        <NavigationMenuLinks>
          <Plain href="#small-business" label="Small businesses" />
          <Plain href="#mid-market" label="Mid-size" />
          <Plain href="#enterprise" label="Large accounts" />
        </NavigationMenuLinks>
      </NavigationMenuGroup>
      <NavigationMenuGroup>
        <NavigationMenuGroupLabel>By team</NavigationMenuGroupLabel>
        <NavigationMenuLinks>
          <Plain href="#operations" label="Operations" />
          <Plain href="#finance" label="Finance" />
          <Plain href="#sales" label="Sales" />
        </NavigationMenuLinks>
      </NavigationMenuGroup>
    </NavigationMenuContent>
  );
}

function CompanyPanel() {
  return (
    <NavigationMenuContent>
      <NavigationMenuLinks>
        <Plain href="#about" label="About us" />
        <Plain href="#careers" label="Careers" />
        <Plain href="#press" label="Press" />
        <Plain href="#contactos" label="Contactos" />
      </NavigationMenuLinks>
    </NavigationMenuContent>
  );
}

/** Aurora Logistics's site header: three sections and a direct link. */
function Aurora(props: Partial<NavigationMenuProps>) {
  return (
    <NavigationMenu aria-label="Principal" {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="produtos">
          <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
          <ProductsPanel />
        </NavigationMenuItem>
        <NavigationMenuItem value="solucoes">
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <SolutionsPanel />
        </NavigationMenuItem>
        <NavigationMenuItem value="documentacao">
          <NavigationMenuLink href="#documentation">Documentation</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="company">
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <CompanyPanel />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export const Playground: Story = {
  args: {
    arrow: false,
    closeDelay: 300,
    closeOnSelect: true,
    openDelay: 200,
    orientation: 'horizontal',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Room size="screen">
      <Aurora {...args} defaultValue="produtos" />
    </Room>
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
    <Room>
      <NavigationMenu arrow aria-label="Anatomia" defaultValue="section">
        <NavigationMenuList>
          <NavigationMenuItem value="section">
            <NavigationMenuTrigger>trigger</NavigationMenuTrigger>
            <NavigationMenuContent columns={2}>
              <NavigationMenuGroup>
                <NavigationMenuGroupLabel>group-label</NavigationMenuGroupLabel>
                <NavigationMenuLinks>
                  <RichLink
                    description="description"
                    href="#a"
                    icon={Package}
                    label="link › icon · label"
                  />
                </NavigationMenuLinks>
              </NavigationMenuGroup>
              <NavigationMenuGroup>
                <NavigationMenuGroupLabel>links</NavigationMenuGroupLabel>
                <NavigationMenuLinks>
                  <Plain href="#b" label="link" />
                  <Plain href="#c" label="link" />
                </NavigationMenuLinks>
              </NavigationMenuGroup>
              <NavigationMenuFooter>
                <Part name="footer" />
                <Part name="viewport ▸ arrow" />
              </NavigationMenuFooter>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="link">
            <NavigationMenuLink href="#link">link</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Room>
  ),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => (
    <Room>
      <Aurora defaultValue="company" />
    </Room>
  ),
};

export const Rich: Story = {
  parameters: scenario('rich'),
  render: () => (
    <Room>
      <NavigationMenu aria-label="Produtos" defaultValue="produtos">
        <NavigationMenuList>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <ProductsPanel footer={false} />
          </NavigationMenuItem>
          <NavigationMenuItem value="precos">
            <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Room>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Room>
      <Aurora defaultValue="solucoes" />
    </Room>
  ),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => (
    <Room>
      <Aurora defaultValue="produtos" />
    </Room>
  ),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Every section closed"
        note="Frota is the page: Produtos takes the accent ink on its trigger, so the reader sees which section they are in before opening anything."
      >
        <Room>
          <Aurora />
        </Room>
      </Scene>
      <Scene
        label="The section open"
        note="Inside the panel the current link stands on the accent ground, with the accent edge in high-contrast."
      >
        <Room>
          <Aurora defaultValue="produtos" />
        </Room>
      </Scene>
    </Grid>
  ),
};

function Column({ defaultValue }: { defaultValue?: string }) {
  return (
    <NavigationMenu arrow aria-label="Help" defaultValue={defaultValue} orientation="vertical">
      <NavigationMenuList>
        <NavigationMenuItem value="home">
          <NavigationMenuLink href="#home">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="ajuda">
          <NavigationMenuTrigger>Ajuda</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLinks>
              <Plain href="#guides" label="Guides" />
              <Plain href="#api" label="API reference" />
              <Plain href="#status" label="Service status" />
            </NavigationMenuLinks>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="conta">
          <NavigationMenuTrigger>Conta</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLinks>
              <Plain href="#profile" label="Profile" />
              <Plain href="#invoices" label="Invoices" />
            </NavigationMenuLinks>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export const Vertical: Story = {
  parameters: scenario('vertical'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Beside the column"
        note="The panel opens at the column’s end, level with Ajuda, with the arrow on the trigger’s middle."
      >
        <Room>
          <Column defaultValue="ajuda" />
        </Room>
      </Scene>
      <Scene
        label="On a phone"
        note="At 375 pixels the column has no room at its end: the panel drops under the trigger and the chevron turns down."
      >
        <div className="slotted-demo-room" data-room="phone">
          <Room>
            <Column defaultValue="ajuda" />
          </Room>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Nested: Story = {
  parameters: scenario('nested'),
  render: () => (
    <Room>
      <NavigationMenu aria-label="Catalog" defaultValue="catalogo">
        <NavigationMenuList>
          <NavigationMenuItem value="catalogo">
            <NavigationMenuTrigger>Catalog</NavigationMenuTrigger>
            <NavigationMenuContent columns={3}>
              <NavigationMenu defaultValue="ferramentas">
                <NavigationMenuList>
                  <NavigationMenuItem value="ferramentas">
                    <NavigationMenuTrigger>Ferramentas</NavigationMenuTrigger>
                    <NavigationMenuContent columns={2}>
                      <NavigationMenuLinks>
                        <Plain href="#manual" label="Hand tools" />
                        <Plain href="#power" label="Power tools" />
                        <Plain href="#measuring" label="Measuring" />
                        <Plain href="#cutting" label="Cutting" />
                      </NavigationMenuLinks>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem value="embalagem">
                    <NavigationMenuTrigger>Embalagem</NavigationMenuTrigger>
                    <NavigationMenuContent columns={2}>
                      <NavigationMenuLinks>
                        <Plain href="#caixas" label="Caixas" />
                        <Plain href="#paletes" label="Paletes" />
                      </NavigationMenuLinks>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem value="seguranca">
                    <NavigationMenuTrigger>Safety</NavigationMenuTrigger>
                    <NavigationMenuContent columns={2}>
                      <NavigationMenuLinks>
                        <Plain href="#ppe" label="Personal protection" />
                      </NavigationMenuLinks>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="marcas">
            <NavigationMenuLink href="#marcas">Marcas</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Room>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Room>
      <NavigationMenu aria-label="Estados">
        <NavigationMenuList>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLinks>
                <li>
                  <NavigationMenuLink current href="#frota">
                    Frota
                  </NavigationMenuLink>
                </li>
              </NavigationMenuLinks>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="precos">
            <NavigationMenuLink current href="#pricing">
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem disabled value="parceiros">
            <NavigationMenuTrigger>Parceiros</NavigationMenuTrigger>
            <NavigationMenuContent />
          </NavigationMenuItem>
          <NavigationMenuItem value="blogue">
            <NavigationMenuLink disabled href="#blogue">
              Blogue
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Room>
  ),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Grid columns={3}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Scene
          key={size}
          label={size}
          note={`size="${size}" on the control scale: the trigger and the link stand at the height of a ${size} field.`}
        >
          <Room>
            <NavigationMenu aria-label={`Size ${size}`} size={size}>
              <NavigationMenuList>
                <NavigationMenuItem value="company">
                  <NavigationMenuTrigger>Company</NavigationMenuTrigger>
                  <CompanyPanel />
                </NavigationMenuItem>
                <NavigationMenuItem value="precos">
                  <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </Room>
        </Scene>
      ))}
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Room>
      <NavigationMenu aria-label="Extreme content" defaultValue="longo">
        <NavigationMenuList>
          <NavigationMenuItem value="longo">
            <NavigationMenuTrigger>Warehouse and distribution management</NavigationMenuTrigger>
            <NavigationMenuContent columns={2}>
              <NavigationMenuLinks>
                <RichLink
                  description="Calculates transfers between warehouses from the forecast demand, the supplier lead times and the safety stock set per item and per location."
                  href="#replenishment"
                  icon={Warehouse}
                  label="Replenishment planning across regional warehouses"
                />
                <RichLink
                  description="A rich link without an icon starts the title at the margin."
                  href="#no-icon"
                  label="No icon"
                />
                <RichLink
                  description="A string with no break."
                  href="#reference"
                  icon={FileText}
                  label="Article_reference_without_spaces_ABCDEFGHIJ"
                />
              </NavigationMenuLinks>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Room>
  ),
};

function ControlledDemo() {
  const [value, setValue] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  return (
    <Room>
      <Aurora
        onValueChange={(next, request) => {
          setLog((entries) => [`${next ?? 'null'} · ${request.reason}`, ...entries].slice(0, 3));
          setValue(next);
        }}
        value={value}
      />
      <Text render={(props) => <output {...props} />} size="xs" tone="muted">
        {log.length === 0 ? 'Open a section.' : log.join(' — ')}
      </Text>
    </Room>
  );
}

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => <ControlledDemo />,
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Room>
      <NavigationMenuDefaultsProvider arrow openDelay={50} size="sm">
        <Aurora />
      </NavigationMenuDefaultsProvider>
    </Room>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-room" data-room="desktop">
      <Room>
        <TopNavigation>
          <TopNavigationBrand>
            <TopNavigationHome href="#home">
              <TopNavigationName>Aurora Logistics</TopNavigationName>
            </TopNavigationHome>
          </TopNavigationBrand>
          <TopNavigationContext>
            <Aurora />
          </TopNavigationContext>
          <TopNavigationActions>
            <TopNavigationAccount aria-label="Conta de Ana Barros">
              <Avatar size="xs" tone="accent" variant="soft">
                AB
              </Avatar>
            </TopNavigationAccount>
          </TopNavigationActions>
        </TopNavigation>
      </Room>
    </div>
  ),
};

function KeyboardDemo() {
  const menu = useRef<NavigationMenuHandle>(null);
  return (
    <Room>
      <Aurora ref={menu} />
      <Button onClick={() => menu.current?.focus('produtos')} size="sm" variant="outline">
        Focar Produtos
      </Button>
    </Room>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => <KeyboardDemo />,
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Room>
      <Aurora />
    </Room>
  ),
};
