import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button, ButtonLink, ToggleButton } from '../button';
import { Checkbox } from '../checkbox';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Tab, TabActions, TabList, TabPanel, Tabs } from '../tabs';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { MenuItem } from '../menu';
import { Toolbar } from './toolbar';
import { ToolbarDefaultsProvider } from './toolbar-defaults';
import { ToolbarOverflow } from './toolbar-overflow';
import { ToolbarGroup, ToolbarItem, ToolbarSeparator, ToolbarSpacer } from './toolbar-parts';
import { REACT_TOOLBAR_DOCS, REACT_TOOLBAR_TOKENS } from './toolbar.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOOLBAR_DOCS.toolbar.scenes, {
    playground: Playground,
    orientation: Orientation,
    variant: Variant,
    sizes: Sizes,
    groups: Groups,
    keyboard: Keyboard,
    keyOwners: KeyOwners,
    disabled: Disabled,
    overflow: Overflow,
    overflowMenu: OverflowMenu,
    composition: Composition,
  }) as never;

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toolbar',
        description:
          'A set of controls that share one tab stop. The APG’s arrow model over the consumer’s own controls, groups and rules that say what belongs together, and an item that may keep the arrows it needs to operate.',
        framework: 'React',
        ...REACT_TOOLBAR_DOCS.toolbar,
        tokens: REACT_TOOLBAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function Formatting(props: Record<string, unknown>) {
  return (
    <Toolbar aria-label="Formatting" {...props}>
      <Button size="sm" variant="ghost">
        Bold
      </Button>
      <Button size="sm" variant="ghost">
        Italic
      </Button>
      <ToolbarSeparator />
      <Button size="sm" variant="ghost">
        Link
      </Button>
      <Button focusableWhenDisabled disabled size="sm" variant="ghost">
        Code
      </Button>
    </Toolbar>
  );
}

export const Playground: Story = {
  args: {
    'aria-label': 'Formatting',
    loop: true,
    orientation: 'horizontal',
    overflow: 'wrap',
    size: 'md',
    variant: 'plain',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Toolbar {...args}>
        <Button variant="ghost">Bold</Button>
        <Button variant="ghost">Italic</Button>
        <ToolbarSeparator />
        <Button variant="ghost">Link</Button>
      </Toolbar>
    </div>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A row of controls"
        note="The controls share a middle rather than a height, so an icon button beside a wider one still reads as one line."
      >
        <Formatting variant="outline" />
      </Scene>
      <Scene
        label="A column of them"
        note="A column stretches its controls, because a column at each control's natural width is a ragged edge rather than a bar; the rule turns with it."
      >
        <Toolbar aria-label="Tools" orientation="vertical" variant="outline">
          <Button size="sm" variant="ghost">
            Pencil
          </Button>
          <Button size="sm" variant="ghost">
            Pincel de pintura
          </Button>
          <ToolbarSeparator />
          <Button size="sm" variant="ghost">
            Borracha
          </Button>
        </Toolbar>
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="plain — the default"
        note="No ground at all: a bar inside a card header or above a table is already standing on a surface, and a second one there reads as a box nobody asked for."
      >
        <Formatting />
      </Scene>
      <Scene
        label="outline"
        note="A framed bar pads itself by at least the reach of a focus ring, so a focused control never sits on the bar's own edge — visible if you tab into it."
      >
        <Formatting variant="outline" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The compact bar, for a card header or the row above a dense table.">
        <Formatting size="sm" variant="outline" />
      </Scene>
      <Scene label="md" note="The default inset and gap, with controls at their own middle step.">
        <Formatting size="md" variant="outline" />
      </Scene>
      <Scene
        label="lg"
        note="The bar grows and the controls do not: the size moves the inset, the gap and the rule's inset, never another family's control."
      >
        <Formatting size="lg" variant="outline" />
      </Scene>
    </Grid>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="What belongs together, and what belongs apart"
        note="The two aligned buttons sit half a gap apart inside their group and a gap and a half from what follows; the rule draws the same boundary, and the spacer keeps the destructive action at the far end."
      >
        <Toolbar aria-label="Selection" variant="outline">
          <ToolbarGroup aria-label="Alignment">
            <Button size="sm" variant="outline">
              Start
            </Button>
            <ToggleButton pressed size="sm" variant="outline">
              Centro
            </ToggleButton>
            <Button size="sm" variant="outline">
              Fim
            </Button>
          </ToolbarGroup>
          <ToolbarSeparator />
          <Checkbox size="sm">Grade</Checkbox>
          <ToolbarSpacer />
          <Button size="sm" tone="danger">
            Delete
          </Button>
        </Toolbar>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One stop for four families"
        note="Tab in once: a button, a checkbox and a link share the ring, because an item is anything focusable rather than a component the bar had to wrap."
      >
        <Toolbar aria-label="Mixed actions" variant="outline">
          <Button size="sm" variant="ghost">
            Publish
          </Button>
          <Checkbox size="sm">Draft</Checkbox>
          <ToolbarSeparator />
          <ButtonLink href="#help" size="sm" variant="ghost">
            Ajuda
          </ButtonLink>
        </Toolbar>
      </Scene>
      <Scene
        label="And it comes back where it left"
        note="Move to the third control, tab away, tab back: entry lands on the control that last had focus, which is what the pattern asks for."
      >
        <Formatting variant="outline" />
      </Scene>
    </Grid>
  ),
};

export const KeyOwners: Story = {
  parameters: scenario('keyOwners'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The caret keeps its own keys"
        note="Focus the field and press the left and right arrows: the caret moves and focus stays. Up or down leaves the field, which is the way out the cross axis exists to give."
      >
        <Toolbar aria-label="Filtro" variant="outline">
          <Button size="sm" variant="outline">
            Todos
          </Button>
          <Button size="sm" variant="outline">
            Abertos
          </Button>
          <ToolbarSeparator />
          <ToolbarSpacer />
          <TextField aria-label="Buscar" placeholder="Buscar" size="sm" type="search" />
        </Toolbar>
      </Scene>
    </Grid>
  ),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A bar out of action"
        note="A fieldset disables every control inside it natively, and a natively disabled control cannot be focused — so the bar loses its tab stop without the family owning a disabled axis at all."
      >
        <fieldset className="slotted-demo-fieldset" disabled>
          <Toolbar aria-label="Read-only" variant="outline">
            <Button size="sm" variant="outline">
              Edit
            </Button>
            <ToolbarSeparator />
            <Button size="sm" tone="danger">
              Delete
            </Button>
          </Toolbar>
        </fieldset>
      </Scene>
      <Scene
        label="One control unavailable, and still findable"
        note="“Code” announces aria-disabled and keeps its place in the ring, which is what the pattern allows where discoverability matters; a natively disabled control is skipped instead."
      >
        <Formatting variant="outline" />
      </Scene>
    </Grid>
  ),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="wrap — the default"
        note="Every control stays visible on a second row, and the arrows wrap from row to row because the item list is linear. The rule can end a row, which is the cost of keeping every control on screen."
      >
        <Measure>
          <Toolbar aria-label="Many actions" size="sm" variant="outline">
            {['Duplicate', 'Move', 'Rename', 'Share', 'Archive'].map((action) => (
              <Button key={action} size="sm" variant="ghost">
                {action}
              </Button>
            ))}
          </Toolbar>
        </Measure>
      </Scene>
      <Scene
        label="scroll — one line, whatever it holds"
        note="The bar scrolls past its controls rather than squeezing them, and the arrows still reach every one. The overflow menu the field agrees on arrives with the menu family."
      >
        <Measure>
          <Toolbar
            aria-label="Many actions, scrolling"
            overflow="scroll"
            size="sm"
            variant="outline"
          >
            {['Duplicate', 'Move', 'Rename', 'Share', 'Archive'].map((action) => (
              <Button key={action} size="sm" variant="ghost">
                {action}
              </Button>
            ))}
          </Toolbar>
        </Measure>
      </Scene>
    </Grid>
  ),
};

/**
 * The two bars are the same markup with different amounts of work in them, so
 * the collapse reads as a decision rather than as a state: one runs out of room
 * and the other does not, at whatever width the page gives them.
 */
function DocumentBar({ actions, label }: { actions: readonly string[]; label: string }) {
  return (
    <Toolbar aria-label={label} overflow="menu" size="sm" variant="outline">
      <ToolbarItem>
        <Button size="sm" tone="accent">
          Publicar
        </Button>
      </ToolbarItem>
      <ToolbarSeparator />
      {actions.map((action) => (
        <ToolbarItem key={action} counterpart={<MenuItem>{action}</MenuItem>}>
          <Button size="sm" variant="ghost">
            {action}
          </Button>
        </ToolbarItem>
      ))}
      <ToolbarOverflow />
    </Toolbar>
  );
}

export const OverflowMenu: Story = {
  parameters: scenario('overflowMenu'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A bar that ran out of room"
        note="Resize the panel and watch the end give way first. Publicar declares no counterpart, so it cannot be hidden — that is the whole of how a primary action survives, and there is no priority prop ranking it above the others."
      >
        <Measure>
          <DocumentBar
            actions={['Duplicar', 'Renomear', 'Exportar', 'Arquivar']}
            label="Documento, estreito"
          />
        </Measure>
      </Scene>
      <Scene
        label="The same bar with room to spare"
        note="Nothing has given way, so the control that would hold it is not drawn at all: a bar that permanently spent a control's width on a menu with nothing in it would have lost a control's width."
      >
        <DocumentBar actions={['Duplicar']} label="Documento, com folga" />
      </Scene>
      <Scene
        label="A run that moves as one"
        note="A group carries its own counterpart, so the whole run reaches the surface together and keeps its name there. The rule that divided it goes with it: a hairline dividing nothing is a stray line."
      >
        <Measure>
          <Toolbar aria-label="Paragraph" overflow="menu" size="sm" variant="outline">
            <ToolbarItem>
              <Button size="sm" tone="accent">
                Save
              </Button>
            </ToolbarItem>
            <ToolbarSeparator />
            <ToolbarGroup
              aria-label="Alinhamento"
              counterpart={
                <>
                  <MenuItem>Align left</MenuItem>
                  <MenuItem>Center</MenuItem>
                  <MenuItem>Justify</MenuItem>
                  <MenuItem>Distribuir</MenuItem>
                </>
              }
            >
              <Button size="sm" variant="ghost">
                Esquerda
              </Button>
              <Button size="sm" variant="ghost">
                Centro
              </Button>
              <Button size="sm" variant="ghost">
                Justificar
              </Button>
              <Button size="sm" variant="ghost">
                Distribuir
              </Button>
            </ToolbarGroup>
            <ToolbarOverflow />
          </Toolbar>
        </Measure>
      </Scene>
      <Scene
        label="The name says how much, not what the mark is"
        note="The trigger announces the count in the page’s own words rather than three dots. The sentence is the language in force’s, with its plural; label replaces it, and a glyph cannot be translated."
      >
        <Measure>
          <Toolbar aria-label="Report" overflow="menu" size="sm" variant="outline">
            <ToolbarItem>
              <Button size="sm" tone="accent">
                Gerar
              </Button>
            </ToolbarItem>
            <ToolbarItem counterpart={<MenuItem>Agendar</MenuItem>}>
              <Button size="sm" variant="ghost">
                Agendar
              </Button>
            </ToolbarItem>
            <ToolbarItem counterpart={<MenuItem>Compartilhar</MenuItem>}>
              <Button size="sm" variant="ghost">
                Compartilhar
              </Button>
            </ToolbarItem>
            <ToolbarItem counterpart={<MenuItem>Download as PDF</MenuItem>}>
              <Button size="sm" variant="ghost">
                Download as PDF
              </Button>
            </ToolbarItem>
            <ToolbarOverflow
              label={(hidden) => `${hidden} more ${hidden === 1 ? 'action' : 'actions'}`}
            />
          </Toolbar>
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
        label="Five decisions an application takes once"
        note="Every bar under the provider is framed and compact, and a bar that states a step itself still wins — which is how one page holds a dense table bar and a comfortable header bar."
      >
        <ToolbarDefaultsProvider size="sm" variant="outline">
          <Formatting />
        </ToolbarDefaultsProvider>
      </Scene>
      <Scene
        label="Where a bar belongs beside a tab list"
        note="The actions slot of a tab list is a cell of the same grid row, and a toolbar there keeps the whole header to two tab stops: the list, then the bar."
      >
        <Tabs defaultValue="summary">
          <TabList aria-label="Order">
            <Tab value="summary">Summary</Tab>
            <Tab value="items">Items</Tab>
          </TabList>
          <TabActions>
            <Toolbar aria-label="Order actions" size="sm">
              <Button size="sm" variant="ghost">
                Export
              </Button>
              <Button size="sm" variant="ghost">
                Imprimir
              </Button>
            </Toolbar>
          </TabActions>
          <TabPanel value="summary">
            <Text size="sm">Delivery scheduled for September 12.</Text>
          </TabPanel>
          <TabPanel value="items">
            <Text size="sm">Three items.</Text>
          </TabPanel>
        </Tabs>
      </Scene>
    </Grid>
  ),
};
