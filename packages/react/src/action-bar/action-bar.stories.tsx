import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { InlineMessage } from '../inline-message';
import { MenuItem } from '../menu';
import { StatusIndicator } from '../status-indicator';
import { Text } from '../typography';
import { ActionBar } from './action-bar';
import { ActionBarDefaultsProvider } from './action-bar-defaults';
import { ScrollingPanel, Selection } from './action-bar-demo';
import { ActionBarOverflow } from './action-bar-overflow';
import {
  ActionBarAction,
  ActionBarActions,
  ActionBarSeparator,
  ActionBarStatus,
} from './action-bar-parts';
import { REACT_ACTION_BAR_DOCS, REACT_ACTION_BAR_TOKENS } from './action-bar.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_ACTION_BAR_DOCS.actionBar.scenes, {
    playground: Playground,
    priority: Priority,
    overflowMenu: OverflowMenu,
    stability: Stability,
    danger: Danger,
    status: Status,
    bulk: Bulk,
    sticky: Sticky,
    align: Align,
    sizes: Sizes,
    variant: Variant,
    stacked: Stacked,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/ActionBar',
  component: ActionBar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ActionBar',
        description:
          'The actions that finish a task on a page or in a panel. What gives way is decided by rank rather than by position, the action that confirms never moves, and a sticky bar stops above the page’s own chrome instead of covering it.',
        framework: 'React',
        ...REACT_ACTION_BAR_DOCS.actionBar,
        tokens: REACT_ACTION_BAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bar a purchase order waiting for approval actually has. */
function Order(props: Record<string, unknown>) {
  return (
    <ActionBar aria-label="Order actions" {...props}>
      <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
      <ActionBarActions>
        <ActionBarAction>
          <Button tone="secondary" variant="ghost">
            Cancelar
          </Button>
        </ActionBarAction>
        <ActionBarAction>
          <Button>Submit for approval</Button>
        </ActionBarAction>
      </ActionBarActions>
    </ActionBar>
  );
}

export const Playground: Story = {
  args: {
    'aria-label': 'Order actions',
    align: 'end',
    present: true,
    size: 'md',
    sticky: false,
    variant: 'raised',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <ActionBar {...args}>
        <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
        <ActionBarActions>
          <ActionBarAction>
            <Button tone="secondary" variant="ghost">
              Cancelar
            </Button>
          </ActionBarAction>
          <ActionBarAction>
            <Button>Submit for approval</Button>
          </ActionBarAction>
        </ActionBarActions>
      </ActionBar>
    </div>
  ),
};

export const Priority: Story = {
  parameters: scenario('priority'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Room for all four"
        note="Nothing has given way, so the control that holds the surface is not drawn at all — a mark announcing an empty menu is a mark that lies."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction priority="hide">
              <Button tone="secondary" variant="ghost">
                Preview
              </Button>
            </ActionBarAction>
            <ActionBarAction counterpart={<MenuItem>Duplicar</MenuItem>}>
              <Button tone="secondary" variant="ghost">
                Duplicar
              </Button>
            </ActionBarAction>
            <ActionBarAction counterpart={<MenuItem>Devolver</MenuItem>} priority="high">
              <Button tone="secondary" variant="outline">
                Devolver
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Aprovar</Button>
            </ActionBarAction>
            <ActionBarOverflow />
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="The same four ranks in a narrower box"
        note="hide went without a trace, low became a menu row, high followed it, and Aprovar is where it was. Giving way from the end would have taken Aprovar first, which is why a bar of actions ranks rather than counts positions."
      >
        <Measure>
          <ActionBar aria-label="Order actions" variant="raised">
            <ActionBarActions>
              <ActionBarAction priority="hide">
                <Button tone="secondary" variant="ghost">
                  Preview
                </Button>
              </ActionBarAction>
              <ActionBarAction counterpart={<MenuItem>Duplicar</MenuItem>}>
                <Button tone="secondary" variant="ghost">
                  Duplicar
                </Button>
              </ActionBarAction>
              <ActionBarAction counterpart={<MenuItem>Devolver</MenuItem>} priority="high">
                <Button tone="secondary" variant="outline">
                  Devolver
                </Button>
              </ActionBarAction>
              <ActionBarAction>
                <Button>Aprovar</Button>
              </ActionBarAction>
              <ActionBarOverflow />
            </ActionBarActions>
          </ActionBar>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const OverflowMenu: Story = {
  parameters: scenario('overflowMenu'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An action that is only ever in the menu"
        note="always is never drawn in the bar, so the control that holds the surface is drawn even though everything fits. Open it: the history entry is there beside whatever else gave way."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>Approved by Martha Rivers on 09/11</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction counterpart={<MenuItem>View history</MenuItem>} priority="always">
              <Button tone="secondary" variant="ghost">
                View history
              </Button>
            </ActionBarAction>
            <ActionBarAction counterpart={<MenuItem>Exportar PDF</MenuItem>} priority="always">
              <Button tone="secondary" variant="ghost">
                Exportar PDF
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Issue invoice</Button>
            </ActionBarAction>
            <ActionBarOverflow />
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A sentence instead of a count"
        note="The default name counts in the language in force, with its plural; label replaces the whole sentence."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarActions>
            <ActionBarAction counterpart={<MenuItem>View history</MenuItem>} priority="always">
              <Button tone="secondary" variant="ghost">
                View history
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Issue invoice</Button>
            </ActionBarAction>
            <ActionBarOverflow label={(hidden) => `${hidden} more actions`} />
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Stability: Story = {
  parameters: scenario('stability'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="No message"
        note="Read the right edge of all four bars below: Approve is on the same pixel in every one of them."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Devolver
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Aprovar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A message arrives"
        note="The status takes the room that was empty. Nothing in the run moved, because the run is anchored to the bar's edge rather than placed beside its neighbour."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>3 unsaved changes</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Devolver
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Aprovar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A message that fills the bar"
        note="The status wraps to a second line rather than pushing the run off the end. A long sentence changes the bar's height and never its right edge."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>
            This order exceeds the approval limit of cost center 4120 and goes to the finance
            director after you
          </ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Devolver
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Aprovar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A permission filter removes one, and the other is busy"
        note="Return is gone and Approve is mid-flight — it keeps its label and its width under loading, which is Button's own rule. The action that confirms is still on the same pixel."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>3 unsaved changes</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button loading>Aprovar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Danger: Story = {
  parameters: scenario('danger'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A destructive action beside two frequent ones"
        note="The rule is half a gap on each side, which is wider than the distance between two controls — so the hand reaching for Save reads a boundary before it reaches Void invoice."
      >
        <ActionBar aria-label="Invoice actions" variant="raised">
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="danger" variant="ghost">
                Void invoice
              </Button>
            </ActionBarAction>
            <ActionBarSeparator />
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Cancelar
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Guardar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="The action that confirms is the destructive one"
        note="Nothing in the surveyed field says where this one goes. It is pinned and at the end like any confirming action, the rule separates it from the way out, and the status says what cannot be undone before the press rather than after it."
      >
        <ActionBar aria-label="Delete supplier" variant="raised">
          <ActionBarStatus>
            The supplier has 14 open invoices. Deletion cannot be undone.
          </ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Manter
              </Button>
            </ActionBarAction>
            <ActionBarSeparator />
            <ActionBarAction>
              <Button tone="danger">Delete supplier</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A timestamp"
        note="Plain text in the muted ink the bar gives the slot. It is the least a save bar says and the most common thing in it."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button>Submeter</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A status indicator"
        note="StatusIndicator already says warning by shape as well as by color, so the bar adds nothing and repeats nothing."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>
            <StatusIndicator status="warning">3 fields left to fill in</StatusIndicator>
          </ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Save draft
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Submeter</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="An inline message"
        note="A whole message in the slot is what a validation summary looks like at the end of a form. The run still ends where it ended in the two bars above."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>
            <InlineMessage tone="danger">
              Cost center 4120 does not accept orders above €25,000
            </InlineMessage>
          </ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Alterar centro de custo
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button disabled>Submeter</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Bulk: Story = {
  parameters: scenario('bulk'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The bar a selection brings"
        note="Press the button to clear the selection and put it back: the bar slides out of the flow rather than vanishing, and it leaves the document once it has gone — a bar that stayed hidden would still be reachable by Tab."
      >
        <Selection>
          {({ count, toggle }) => (
            <>
              <Button onClick={toggle} size="sm" tone="secondary" variant="outline">
                {count === 0 ? 'Select 12 invoices' : 'Clear selection'}
              </Button>
              <ActionBar aria-label="Selection actions" present={count > 0} variant="raised">
                <ActionBarStatus>
                  <Text weight="semibold">{count} invoices selected</Text>
                  <Button size="sm" tone="accent" variant="ghost">
                    Select all 248 matching the filter
                  </Button>
                </ActionBarStatus>
                <ActionBarActions>
                  <ActionBarAction counterpart={<MenuItem>Exportar</MenuItem>}>
                    <Button tone="secondary" variant="ghost">
                      Exportar
                    </Button>
                  </ActionBarAction>
                  <ActionBarAction counterpart={<MenuItem>Reatribuir</MenuItem>} priority="high">
                    <Button tone="secondary" variant="outline">
                      Reatribuir
                    </Button>
                  </ActionBarAction>
                  <ActionBarSeparator />
                  <ActionBarAction>
                    <Button tone="danger">Anular</Button>
                  </ActionBarAction>
                  <ActionBarOverflow />
                </ActionBarActions>
              </ActionBar>
            </>
          )}
        </Selection>
      </Scene>
    </Grid>
  ),
};

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Stuck to the end of what scrolls"
        note="Scroll the panel to the bottom: the last line of the order stops above the bar rather than under it, because the bar takes its own height in the flow. A fixed bar would cover it and need a padding no token explains."
      >
        <ScrollingPanel>
          <Text>Order PO-2026-0004821 · Supplier Brandon &amp; Sons</Text>
          <Text>Line 1 — Task chair, 24 units — €4,320.00</Text>
          <Text>Line 2 — Adjustable desk, 12 units — €7,188.00</Text>
          <Text>Line 3 — Monitor 27&quot;, 24 units — €6,960.00</Text>
          <Text>Line 4 — Monitor arm, 24 units — €1,848.00</Text>
          <Text>Line 5 — Acoustic mat, 30 units — €2,610.00</Text>
          <Text>Line 6 — Desk lamp, 24 units — €1,176.00</Text>
          <Text>Line 7 — Footrest, 24 units — €984.00</Text>
          <Text>Line 8 — Laptop stand, 24 units — €1,104.00</Text>
          <Text>Total — €26,190.00, above the cost center limit</Text>
          <ActionBar aria-label="Order actions" sticky variant="raised">
            <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
            <ActionBarActions>
              <ActionBarAction>
                <Button tone="secondary" variant="ghost">
                  Cancelar
                </Button>
              </ActionBarAction>
              <ActionBarAction>
                <Button>Submit for approval</Button>
              </ActionBarAction>
            </ActionBarActions>
          </ActionBar>
        </ScrollingPanel>
      </Scene>
    </Grid>
  ),
};

export const Align: Story = {
  parameters: scenario('align'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="end — the default, and the anchor"
        note="The run is pushed against the bar's end edge, which is what keeps the action that confirms from moving when anything before it changes."
      >
        <Order variant="raised" />
      </Scene>
      <Scene
        label="start"
        note="The run sits next to the status instead. It is what a drawer footer often wants, and what Fluent's command bar does by default."
      >
        <Order align="start" variant="raised" />
      </Scene>
      <Scene
        label="center"
        note="The run is centerd in what is left after the status — the placement Salesforce's docked form footer uses."
      >
        <Order align="center" variant="raised" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sm"
        note="The step moves the bar's inset, gap, minimum height and rule — and reaches the buttons, so neither of the two below states a size of its own."
      >
        <Order size="sm" variant="raised" />
      </Scene>
      <Scene label="md" note="The default step, and the one a form at comfortable density takes.">
        <Order size="md" variant="raised" />
      </Scene>
      <Scene
        label="lg — and a button that states its own step"
        note="Submit is lg like the bar; Cancel is sm because it said so. An explicit value on the control wins over the bar, which is the rule Button already implements."
      >
        <ActionBar aria-label="Order actions" size="lg" variant="raised">
          <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button size="sm" tone="secondary" variant="ghost">
                Cancelar
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Submit for approval</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="plain — inside something that already paints"
        note="No ground and no rule. This is the bar inside a Page footer, where that family has already drawn both, and a second ground there reads as a box nobody asked for."
      >
        <div className="slotted-demo-surface" data-surface="sunken">
          <Order />
        </div>
      </Scene>
      <Scene
        label="raised — with nothing under it"
        note="The surface and one hairline at the top, which is the whole of the separation a bar at the end of a region needs. It is the bar in a drawer, a dialog or a card."
      >
        <Order variant="raised" />
      </Scene>
    </Grid>
  ),
};

export const Stacked: Story = {
  parameters: scenario('stacked'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Below 24rem of container"
        note="The run is a full-width column with the action that confirms on top, and the collapse has stopped running — a column has room for everything, so there is no menu. Tab still reads the order the author wrote: only the paint is reversed."
      >
        <Measure>
          <ActionBar aria-label="Order actions" variant="raised">
            <ActionBarStatus>3 unsaved changes</ActionBarStatus>
            <ActionBarActions>
              <ActionBarAction>
                <Button tone="secondary" variant="ghost">
                  Discard changes
                </Button>
              </ActionBarAction>
              <ActionBarAction>
                <Button>Save changes</Button>
              </ActionBarAction>
            </ActionBarActions>
          </ActionBar>
        </Measure>
      </Scene>
      <Scene
        label="A destructive action in the column"
        note="The rule turns with the actions, so the boundary that kept Eliminar off Manter in a row keeps it off in a column."
      >
        <Measure>
          <ActionBar aria-label="Delete supplier" variant="raised">
            <ActionBarActions>
              <ActionBarAction>
                <Button tone="secondary" variant="ghost">
                  Manter
                </Button>
              </ActionBarAction>
              <ActionBarSeparator />
              <ActionBarAction>
                <Button tone="danger">Delete supplier</Button>
              </ActionBarAction>
            </ActionBarActions>
          </ActionBar>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A translated label twice the length"
        note="Änderungen verwerfen and Zur Genehmigung einreichen are wider than the bar together, so the run wraps to a second line. Neither label is cut: a truncated action is an action nobody can read."
      >
        <ActionBar aria-label="Bestellaktionen" variant="raised">
          <ActionBarStatus>Entwurf um 14:07 gespeichert</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Änderungen verwerfen
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Zur Genehmigung einreichen</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A reference with no spaces in it, and an action mid-flight"
        note="The status breaks the unbroken token rather than letting it out of the box, and Submit keeps its width while it is busy — so the right edge does not move when the request starts."
      >
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarStatus>PO-2026-0004821-REV-C-AWAITS-COST-CENTER-4120</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Cancelar
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button loading>Submeter</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An application sets the four decisions once"
        note="Both bars below are raised and sm without saying so; the second states its own alignment and wins over the provider."
      >
        <ActionBarDefaultsProvider size="sm" variant="raised">
          <Order />
          <Order align="center" />
        </ActionBarDefaultsProvider>
      </Scene>
      <Scene
        label="The bar as the consumer’s own element"
        note="render substitutes any of the six roots and hands it every attribute: the bar here is a footer element, which is what a page’s own markup wants at the end of a form."
      >
        <ActionBar
          aria-label="Order actions"
          render={(props) => <footer {...props} />}
          variant="raised"
        >
          <ActionBarStatus render={(props) => <p {...props} />}>
            Draft saved at 14:07
          </ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button>Submit for approval</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tab reaches every action"
        note="Press Tab from the control above: each action is its own stop, in the order the form is read. No arrow key is bound, which is the deliberate departure from the APG's Toolbar pattern — a strip of ten icon buttons is the Toolbar family instead."
      >
        <Button size="sm" tone="secondary" variant="outline">
          Start here and press Tab
        </Button>
        <ActionBar aria-label="Order actions" variant="raised">
          <ActionBarActions>
            <ActionBarAction>
              <Button tone="secondary" variant="ghost">
                Devolver
              </Button>
            </ActionBarAction>
            <ActionBarAction counterpart={<MenuItem>Duplicar</MenuItem>} priority="always">
              <Button tone="secondary" variant="ghost">
                Duplicar
              </Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Aprovar</Button>
            </ActionBarAction>
            <ActionBarOverflow />
          </ActionBarActions>
        </ActionBar>
      </Scene>
      <Scene
        label="A bar out of action"
        note="A fieldset around it disables every control natively and takes them out of the tab order with them. The family writes no disabled state of its own, because a container cannot disable controls it does not own."
      >
        <fieldset disabled>
          <ActionBar aria-label="Order actions" variant="raised">
            <ActionBarStatus>Submitting…</ActionBarStatus>
            <ActionBarActions>
              <ActionBarAction>
                <Button tone="secondary" variant="ghost">
                  Cancelar
                </Button>
              </ActionBarAction>
              <ActionBarAction>
                <Button>Submit for approval</Button>
              </ActionBarAction>
            </ActionBarActions>
          </ActionBar>
        </fieldset>
      </Scene>
    </Grid>
  ),
};
