import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb } from './breadcrumb';
import { BreadcrumbDefaultsProvider } from './breadcrumb-defaults';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '../menu';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbTrigger,
} from './breadcrumb-parts';
import { REACT_BREADCRUMB_DOCS, REACT_BREADCRUMB_TOKENS } from './breadcrumb.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_BREADCRUMB_DOCS.breadcrumb.scenes, {
    playground: Playground,
    collapse: Collapse,
    separator: Separator,
    current: Current,
    context: Context,
    content: Content,
    composition: Composition,
    switcher: Switcher,
    overflow: Overflow,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Breadcrumb',
        description:
          'Where a page sits in the hierarchy, folded when the trail gets deep and expanded in place.',
        framework: 'React',
        ...REACT_BREADCRUMB_DOCS.breadcrumb,
        tokens: REACT_BREADCRUMB_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const DEEP = ['Workspace', 'Northwind Trading', 'Accounts', 'Billing', 'Invoices'];

function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

function Trail({
  levels = DEEP,
  ...props
}: React.ComponentProps<typeof Breadcrumb> & { levels?: string[] }) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        {levels.map((level) => (
          <BreadcrumbItem key={level}>
            <BreadcrumbLink href={`#${level}`}>{level}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>INV-2026-08-0041</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export const Playground: Story = {
  args: {
    itemsAfterCollapse: 2,
    itemsBeforeCollapse: 1,
    maxItems: 8,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="stack">
      <Trail {...args} />
    </div>
  ),
};

export const Collapse: Story = {
  parameters: scenario('collapse'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="maxItems={4}"
        note="Seven levels folded to four items. The button says how many it hides, and pressing it reveals them without leaving the page."
      >
        <Trail maxItems={4} />
      </Scene>
      <Scene
        label="defaultExpanded"
        note="The same trail already open. An application that remembers the reader's choice holds expanded itself and passes it back."
      >
        <Trail defaultExpanded maxItems={4} />
      </Scene>
    </div>
  ),
};

export const Separator: Story = {
  parameters: scenario('separator'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="drawn"
        note="No separator prop: the stylesheet draws a one-pixel rule rotated into a slash, which mirrors in a right-to-left document."
      >
        <Trail levels={['Workspace', 'Billing']} />
      </Scene>
      <Scene
        label='separator="›"'
        note="Your own mark, in the same element. The drawing stops the moment the separator holds anything at all."
      >
        <Trail levels={['Workspace', 'Billing']} separator="›" />
      </Scene>
    </div>
  ),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="BreadcrumbPage"
        note="The last crumb takes the strongest text colour and a heavier weight, so the end of the trail reads without being read."
      >
        <Trail levels={['Workspace', 'Billing', 'Invoices']} />
      </Scene>
    </div>
  ),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Above a page heading"
        layout="prose"
        note="Where a trail actually lives. It sits at interface type size over a title, and it says where the page is rather than where the reader came from."
      >
        <div>
          <Trail levels={['Workspace', 'Billing', 'Invoices']} />
          <h2>INV-2026-08-0041</h2>
        </div>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='Long, translated and unbroken, overflow="wrap"'
        note="A German compound, a pasted identifier and an Arabic label. The row wraps before anything truncates, and the string survives whatever is cut."
      >
        <div className="slotted-demo-measure">
          <Trail
            overflow="wrap"
            levels={[
              'Zahlungsabwicklungseinstellungen',
              'INV-2026-08-0041-RECONCILIATION-REPORT',
              'تسوية',
            ]}
          />
        </div>
      </Scene>
      <Scene
        label="One crumb"
        layout="block"
        note="A trail whose only crumb is the page itself draws no separator, and the landmark keeps its name."
      >
        <Trail levels={[]} />
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="render"
        note="Every part substitutes its element. Here the crumb keeps its destination and its data attributes while another component renders it."
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#invoices" render={(props) => <a {...props} data-router="" />}>
                Invoices
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>INV-2026-08-0041</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Scene>
      <Scene
        label="BreadcrumbDefaultsProvider"
        note="One decision for every trail below it: the separator and how deep a trail may get before it folds. The words come from the language in force."
      >
        <BreadcrumbDefaultsProvider maxItems={4} separator="·">
          <Trail />
        </BreadcrumbDefaultsProvider>
      </Scene>
    </div>
  ),
};

/**
 * A switcher over the crumbs a reader moves sideways between rather than up:
 * which company's books, which ledger, which period. Each menu marks the
 * sibling the trail is on, and the last is the page itself.
 */
function Switch({
  current = false,
  icon,
  label,
  options,
}: {
  current?: boolean;
  icon?: 'inbox' | 'file-text';
  label: string;
  options: string[];
}) {
  return (
    <BreadcrumbItem>
      <Menu>
        <MenuTrigger
          render={(props) => (
            <BreadcrumbTrigger {...props} current={current}>
              {icon === undefined ? null : (
                <Icon>
                  <Glyph name={icon} />
                </Icon>
              )}
              {label}
            </BreadcrumbTrigger>
          )}
        />
        <MenuContent>
          <MenuRadioGroup aria-label={label} defaultValue={label}>
            {options.map((option) => (
              <MenuRadioItem key={option} value={option}>
                {option}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </BreadcrumbItem>
  );
}

export const Switcher: Story = {
  parameters: scenario('switcher'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="BreadcrumbTrigger inside MenuTrigger"
        note="Open a crumb: its chevron turns, the underline stays while the menu is up, and the menu marks the sibling the trail is on. The period is the page itself, so it keeps aria-current."
      >
        <Breadcrumb>
          <BreadcrumbList>
            <Switch
              icon="inbox"
              label="Northwind Trading"
              options={['Northwind Trading', 'Contoso Ltd', 'Fabrikam Inc']}
            />
            <Switch
              label="Accounts receivable"
              options={['Accounts receivable', 'Accounts payable']}
            />
            <Switch
              current
              label="August 2026"
              options={['June 2026', 'July 2026', 'August 2026']}
            />
          </BreadcrumbList>
        </Breadcrumb>
      </Scene>
      <Scene
        label="Beside plain crumbs"
        note="A switcher is one crumb among links: it keeps their colour, their underline and their focus ring, and only the chevron says a list opens here rather than a page."
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#workspace">Workspace</BreadcrumbLink>
            </BreadcrumbItem>
            <Switch label="Billing" options={['Billing', 'Payroll', 'Tax']} />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Icon>
                  <Glyph name="file-text" />
                </Icon>
                INV-2026-08-0041
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Scene>
    </div>
  ),
};

function Room({ children, room }: { children: React.ReactNode; room: 'phone' | 'tablet' }) {
  return (
    <div className="slotted-demo-room" data-room={room}>
      <div className="slotted-demo-viewport">{children}</div>
    </div>
  );
}

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="640 pixels"
        layout="block"
        note="Eight crumbs at tablet width. Whatever does not fit folds into the ellipsis from the crumb nearest the root, and the first and the last two always stay."
      >
        <Room room="tablet">
          <Trail levels={[...DEEP, 'Accounts receivable', 'August 2026']} maxItems={0} />
        </Room>
      </Scene>
      <Scene
        label="375 pixels"
        layout="block"
        note="The same trail on a phone. The ellipsis names every crumb it holds, and pressing it expands the trail onto a second line."
      >
        <Room room="phone">
          <Trail levels={[...DEEP, 'Accounts receivable', 'August 2026']} maxItems={0} />
        </Room>
      </Scene>
      <Scene
        label='overflow="wrap" at 375 pixels'
        layout="block"
        note="Every crumb kept, the row broken onto as many lines as it takes. Lines stand a target apart, so two crumbs above each other are never one tap."
      >
        <Room room="phone">
          <Trail
            levels={[...DEEP, 'Accounts receivable', 'August 2026']}
            maxItems={0}
            overflow="wrap"
          />
        </Room>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Tab, Enter, Space"
        note="Tab reaches every crumb and the ellipsis. Enter follows a crumb; Enter or Space on the ellipsis expands the trail and moves focus to the first crumb it revealed."
      >
        <Trail maxItems={4} />
      </Scene>
    </div>
  ),
};
