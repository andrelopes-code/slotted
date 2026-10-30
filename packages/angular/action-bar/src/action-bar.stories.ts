import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlButton } from '@slotted/angular/button';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlActionBar,
  SlActionBarAction,
  SlActionBarActions,
  SlActionBarSeparator,
  SlActionBarStatus,
} from './action-bar';
import type { ActionBarAlign, ActionBarSize, ActionBarVariant } from './action-bar-defaults';
import { SlActionBarOverflow } from './action-bar-overflow';
import { ANGULAR_ACTION_BAR_DOCS, ANGULAR_ACTION_BAR_TOKENS } from './action-bar.docs';

interface ActionBarStoryArgs {
  align: ActionBarAlign;
  present: boolean;
  size: ActionBarSize;
  sticky: boolean;
  variant: ActionBarVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ACTION_BAR_DOCS.actionBar.scenes, {
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

const meta: Meta<ActionBarStoryArgs> = {
  title: 'Components/ActionBar',
  decorators: [
    moduleMetadata({
      imports: [
        SlActionBar,
        SlActionBarAction,
        SlActionBarActions,
        SlActionBarOverflow,
        SlActionBarSeparator,
        SlActionBarStatus,
        SlButton,
        SlInlineMessage,
        SlMenuItem,
        SlStatusIndicator,
        SlText,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ActionBar',
        description:
          'The actions that finish a task on a page or in a panel. What gives way is decided by rank rather than by position, the action that confirms never moves, and a sticky bar stops above the page’s own chrome instead of covering it.',
        framework: 'Angular',
        ...ANGULAR_ACTION_BAR_DOCS.actionBar,
        tokens: ANGULAR_ACTION_BAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ActionBarStoryArgs>;

const scene = (label: string, note: string, body: string) =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${scenes}</div>`;

const narrow = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

/** The bar a purchase order waiting for approval actually has. */
const ORDER = (attributes = '') => `<footer slActionBar aria-label="Order actions" ${attributes}>
  <div slActionBarStatus>Draft saved at 14:07</div>
  <div slActionBarActions>
    <div slActionBarAction>
      <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
    </div>
    <div slActionBarAction>
      <button slButton type="button">Submit for approval</button>
    </div>
  </div>
</footer>`;

const RANKED = `<div slActionBarActions>
  <div slActionBarAction="hide">
    <button slButton variant="ghost" tone="secondary" type="button">Preview</button>
  </div>
  <div slActionBarAction [slActionBarActionCounterpart]="duplicate">
    <button slButton variant="ghost" tone="secondary" type="button">Duplicar</button>
  </div>
  <div slActionBarAction="high" [slActionBarActionCounterpart]="send">
    <button slButton variant="outline" tone="secondary" type="button">Devolver</button>
  </div>
  <div slActionBarAction>
    <button slButton type="button">Aprovar</button>
  </div>
  <sl-action-bar-overflow />
</div>`;

const COUNTERPARTS = `<ng-template #duplicate><button slMenuItem type="button">Duplicate</button></ng-template>
<ng-template #send><button slMenuItem type="button">Send back</button></ng-template>
<ng-template #history><button slMenuItem type="button">View history</button></ng-template>
<ng-template #exportPdf><button slMenuItem type="button">Export PDF</button></ng-template>
<ng-template #exported><button slMenuItem type="button">Export</button></ng-template>
<ng-template #reassign><button slMenuItem type="button">Reatribuir</button></ng-template>`;

export const Playground: Story = {
  args: {
    align: 'end',
    present: true,
    size: 'md',
    sticky: false,
    variant: 'raised',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `<div class="slotted-demo-stage" data-layout="block">
      <footer
        slActionBar
        aria-label="Order actions"
        [variant]="variant"
        [size]="size"
        [align]="align"
        [sticky]="sticky"
        [present]="present"
      >
        <div slActionBarStatus>Draft saved at 14:07</div>
        <div slActionBarActions>
          <div slActionBarAction>
            <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
          </div>
          <div slActionBarAction>
            <button slButton type="button">Submit for approval</button>
          </div>
        </div>
      </footer>
    </div>`,
  }),
};

export const Priority: Story = {
  parameters: scenario('priority'),
  render: () => ({
    template:
      grid(
        1,
        scene(
          'Room for all four',
          'Nothing has given way, so the control that holds the surface is not drawn at all — a mark announcing an empty menu is a mark that lies.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
            <div slActionBarStatus>Draft saved at 14:07</div>
            ${RANKED}
          </footer>`,
        ) +
          scene(
            'The same four ranks in a narrower box',
            'hide went without a trace, low became a menu row, high followed it, and Approve is where it was. Giving way from the end would have taken Approve first, which is why a bar of actions ranks rather than counts positions.',
            narrow(
              `<footer slActionBar aria-label="Order actions" variant="raised">${RANKED}</footer>`,
            ),
          ),
      ) + COUNTERPARTS,
  }),
};

export const OverflowMenu: Story = {
  parameters: scenario('overflowMenu'),
  render: () => ({
    props: { count: (hidden: number) => `${hidden} more actions` },
    template:
      grid(
        1,
        scene(
          'An action that is only ever in the menu',
          'always is never drawn in the bar, so the control that holds the surface is drawn even though everything fits. Open it: the history entry is there beside whatever else gave way.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
            <div slActionBarStatus>Approved by Martha Reed on 09/11</div>
            <div slActionBarActions>
              <div slActionBarAction="always" [slActionBarActionCounterpart]="history">
                <button slButton variant="ghost" tone="secondary" type="button">View history</button>
              </div>
              <div slActionBarAction="always" [slActionBarActionCounterpart]="exportPdf">
                <button slButton variant="ghost" tone="secondary" type="button">Exportar PDF</button>
              </div>
              <div slActionBarAction>
                <button slButton type="button">Issue invoice</button>
              </div>
              <sl-action-bar-overflow />
            </div>
          </footer>`,
        ) +
          scene(
            'A sentence instead of a count',
            'The default name counts in the language in force, with its plural; label replaces the whole sentence.',
            `<footer slActionBar aria-label="Order actions" variant="raised">
            <div slActionBarActions>
              <div slActionBarAction="always" [slActionBarActionCounterpart]="history">
                <button slButton variant="ghost" tone="secondary" type="button">View history</button>
              </div>
              <div slActionBarAction>
                <button slButton type="button">Issue invoice</button>
              </div>
              <sl-action-bar-overflow [label]="count" />
            </div>
          </footer>`,
          ),
      ) + COUNTERPARTS,
  }),
};

export const Stability: Story = {
  parameters: scenario('stability'),
  render: () => ({
    template: grid(
      1,
      scene(
        'No message',
        'Read the right edge of all four bars below: Approve is on the same pixel in every one of them.',
        `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Devolver</button>
            </div>
            <div slActionBarAction><button slButton type="button">Aprovar</button></div>
          </div>
        </footer>`,
      ) +
        scene(
          'A message arrives',
          'The status takes the room that was empty. Nothing in the run moved, because the run is anchored to the bar’s edge rather than placed beside its neighbour.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>3 unsaved changes</div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Devolver</button>
            </div>
            <div slActionBarAction><button slButton type="button">Aprovar</button></div>
          </div>
        </footer>`,
        ) +
        scene(
          'A message that fills the bar',
          'The status wraps to a second line rather than pushing the run off the end. A long sentence changes the bar’s height and never its right edge.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>
            This order exceeds the approval limit of cost center 4120 and goes to the finance
            director after you
          </div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Devolver</button>
            </div>
            <div slActionBarAction><button slButton type="button">Aprovar</button></div>
          </div>
        </footer>`,
        ) +
        scene(
          'A permission filter removes one, and the other is busy',
          'Send back is gone and Approve is mid-flight — it keeps its label and its width under loading, which is Button’s own rule. The action that confirms is still on the same pixel.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>3 unsaved changes</div>
          <div slActionBarActions>
            <div slActionBarAction><button slButton loading type="button">Approve</button></div>
          </div>
        </footer>`,
        ),
    ),
  }),
};

export const Danger: Story = {
  parameters: scenario('danger'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A destructive action beside two frequent ones',
        'The rule is half a gap on each side, which is wider than the distance between two controls — so the hand reaching for Save reads a boundary before it reaches Void invoice.',
        `<footer slActionBar aria-label="Invoice actions" variant="raised">
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="danger" type="button">Void invoice</button>
            </div>
            <div slActionBarSeparator></div>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
            </div>
            <div slActionBarAction><button slButton type="button">Guardar</button></div>
          </div>
        </footer>`,
      ) +
        scene(
          'The action that confirms is the destructive one',
          'Nothing in the surveyed field says where this one goes. It is pinned and at the end like any confirming action, the rule separates it from the way out, and the status says what cannot be undone before the press rather than after it.',
          `<footer slActionBar aria-label="Delete supplier" variant="raised">
          <div slActionBarStatus>
            The supplier has 14 open invoices. Deletion cannot be undone.
          </div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Manter</button>
            </div>
            <div slActionBarSeparator></div>
            <div slActionBarAction>
              <button slButton tone="danger" type="button">Delete supplier</button>
            </div>
          </div>
        </footer>`,
        ),
    ),
  }),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A timestamp',
        'Plain text in the muted ink the bar gives the slot. It is the least a save bar says and the most common thing in it.',
        `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>Draft saved at 14:07</div>
          <div slActionBarActions>
            <div slActionBarAction><button slButton type="button">Submit</button></div>
          </div>
        </footer>`,
      ) +
        scene(
          'A status indicator',
          'slStatusIndicator already says warning by shape as well as by color, so the bar adds nothing and repeats nothing.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>
            <span slStatusIndicator status="warning">3 fields to fill in</span>
          </div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Save draft</button>
            </div>
            <div slActionBarAction><button slButton type="button">Submit</button></div>
          </div>
        </footer>`,
        ) +
        scene(
          'An inline message',
          'A whole message in the slot is what a validation summary looks like at the end of a form. The run still ends where it ended in the two bars above.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>
            <div slInlineMessage tone="danger">
              Cost center 4120 does not accept orders above $25,000
            </div>
          </div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Alterar centro de custo</button>
            </div>
            <div slActionBarAction><button slButton disabled type="button">Submeter</button></div>
          </div>
        </footer>`,
        ),
    ),
  }),
};

export const Bulk: Story = {
  parameters: scenario('bulk'),
  render: () => ({
    props: { selected: 12 },
    template:
      grid(
        1,
        scene(
          'The bar a selection brings',
          'Press the button to clear the selection and put it back: the bar slides out of the flow rather than vanishing, and it is painted out once it has gone — a bar that stayed visible to the tab order would be a bar a reader lands in by accident.',
          `<button
            slButton
            size="sm"
            variant="outline"
            tone="secondary"
            type="button"
            (click)="selected = selected === 0 ? 12 : 0"
          >
            {{ selected === 0 ? 'Select 12 invoices' : 'Clear selection' }}
          </button>
          <footer
            slActionBar
            aria-label="Selection actions"
            variant="raised"
            [present]="selected > 0"
          >
            <div slActionBarStatus>
              <span slText weight="semibold">{{ selected }} invoices selected</span>
              <button slButton size="sm" variant="ghost" tone="accent" type="button">
                Select all 248 in the filter
              </button>
            </div>
            <div slActionBarActions>
              <div slActionBarAction [slActionBarActionCounterpart]="exported">
                <button slButton variant="ghost" tone="secondary" type="button">Exportar</button>
              </div>
              <div slActionBarAction="high" [slActionBarActionCounterpart]="reassign">
                <button slButton variant="outline" tone="secondary" type="button">Reatribuir</button>
              </div>
              <div slActionBarSeparator></div>
              <div slActionBarAction>
                <button slButton tone="danger" type="button">Anular</button>
              </div>
              <sl-action-bar-overflow />
            </div>
          </footer>`,
        ),
      ) + COUNTERPARTS,
  }),
};

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Stuck to the end of what scrolls',
        'Scroll the panel to the bottom: the last line of the order stops above the bar rather than under it, because the bar takes its own height in the flow. A fixed bar would cover it and need a padding no token explains.',
        `<div class="slotted-demo-viewport" data-size="tall" data-scroll data-layout="page">
          <p slText>Order PO-2026-0004821 · Supplier Brandon &amp; Sons</p>
          <p slText>Line 1 — Task chair, 24 units — $4,320.00</p>
          <p slText>Line 2 — Adjustable desk, 12 units — $7,188.00</p>
          <p slText>Line 3 — Monitor 27", 24 units — $6,960.00</p>
          <p slText>Line 4 — Monitor arm, 24 units — $1,848.00</p>
          <p slText>Line 5 — Acoustic mat, 30 units — $2,610.00</p>
          <p slText>Line 6 — Desk lamp, 24 units — $1,176.00</p>
          <p slText>Line 7 — Footrest, 24 units — $984.00</p>
          <p slText>Line 8 — Laptop stand, 24 units — $1,104.00</p>
          <p slText>Total — $26,190.00, above the cost center limit</p>
          ${ORDER('variant="raised" sticky')}
        </div>`,
      ),
    ),
  }),
};

export const Align: Story = {
  parameters: scenario('align'),
  render: () => ({
    template: grid(
      1,
      scene(
        'end — the default, and the anchor',
        'The run is pushed against the bar’s end edge, which is what keeps the action that confirms from moving when anything before it changes.',
        ORDER('variant="raised"'),
      ) +
        scene(
          'start',
          'The run sits next to the status instead. It is what a drawer footer often wants, and what Fluent’s command bar does by default.',
          ORDER('variant="raised" align="start"'),
        ) +
        scene(
          'center',
          'The run is centerd in what is left after the status — the placement Salesforce’s docked form footer uses.',
          ORDER('variant="raised" align="center"'),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      1,
      scene(
        'sm',
        'The step moves the bar’s inset, gap, minimum height and rule — and reaches the buttons, so neither of the two below states a size of its own.',
        ORDER('variant="raised" size="sm"'),
      ) +
        scene(
          'md',
          'The default step, and the one a form at comfortable density takes.',
          ORDER('variant="raised" size="md"'),
        ) +
        scene(
          'lg — and a button that states its own step',
          'Submit is lg like the bar; Cancel is sm because it said so. An explicit value on the control wins over the bar, which is the rule Button already implements.',
          `<footer slActionBar aria-label="Order actions" variant="raised" size="lg">
          <div slActionBarStatus>Draft saved at 14:07</div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton size="sm" variant="ghost" tone="secondary" type="button">Cancelar</button>
            </div>
            <div slActionBarAction>
              <button slButton type="button">Submit for approval</button>
            </div>
          </div>
        </footer>`,
        ),
    ),
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: grid(
      1,
      scene(
        'plain — inside something that already paints',
        'No ground and no rule. This is the bar inside a page footer, where that family has already drawn both, and a second ground there reads as a box nobody asked for.',
        `<div class="slotted-demo-surface" data-surface="sunken">${ORDER()}</div>`,
      ) +
        scene(
          'raised — with nothing under it',
          'The surface and one hairline at the top, which is the whole of the separation a bar at the end of a region needs. It is the bar in a drawer, a dialog or a card.',
          ORDER('variant="raised"'),
        ),
    ),
  }),
};

export const Stacked: Story = {
  parameters: scenario('stacked'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Below 24rem of container',
        'The run is a full-width column with the action that confirms on top, and the collapse has stopped running — a column has room for everything, so there is no menu. Tab still reads the order the author wrote: only the paint is reversed.',
        narrow(`<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>3 unsaved changes</div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Discard changes</button>
            </div>
            <div slActionBarAction>
              <button slButton type="button">Save changes</button>
            </div>
          </div>
        </footer>`),
      ) +
        scene(
          'A destructive action in the column',
          'The rule turns with the actions, so the boundary that kept Delete off Keep in a row keeps it off in a column.',
          narrow(`<footer slActionBar aria-label="Delete supplier" variant="raised">
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Manter</button>
            </div>
            <div slActionBarSeparator></div>
            <div slActionBarAction>
              <button slButton tone="danger" type="button">Delete supplier</button>
            </div>
          </div>
        </footer>`),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A translated label twice the length',
        'Änderungen verwerfen and Zur Genehmigung einreichen are wider than the bar together, so the run wraps to a second line. Neither label is cut: a truncated action is an action nobody can read.',
        `<footer slActionBar aria-label="Bestellaktionen" variant="raised">
          <div slActionBarStatus>Entwurf um 14:07 gespeichert</div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Änderungen verwerfen</button>
            </div>
            <div slActionBarAction>
              <button slButton loading type="button">Zur Genehmigung einreichen</button>
            </div>
          </div>
        </footer>`,
      ) +
        scene(
          'A reference with no spaces in it, and an action mid-flight',
          'The status breaks the unbroken token rather than letting it out of the box, and Submit keeps its width while it is busy — so the right edge does not move when the request starts.',
          `<footer slActionBar aria-label="Order actions" variant="raised">
          <div slActionBarStatus>PO-2026-0004821-REV-C-AWAITING-COST-CENTER-4120</div>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
            </div>
            <div slActionBarAction><button slButton loading type="button">Submeter</button></div>
          </div>
        </footer>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The bar is a directive on the page’s own element',
        'Every part but the overflow is an attribute: the bar here is a footer, the status a p, and the run a div — the family adds behavior to the element the page already wanted rather than inserting one of its own.',
        `<footer slActionBar aria-label="Order actions" variant="raised">
          <p slActionBarStatus>Draft saved at 14:07</p>
          <div slActionBarActions>
            <div slActionBarAction>
              <button slButton type="button">Submit for approval</button>
            </div>
          </div>
        </footer>`,
      ) +
        scene(
          'The four decisions an application takes once',
          'provideActionBarDefaults carries them in an injector, and a bar that states any of them itself still wins. Both bars here are raised without saying so; the second states its own alignment.',
          ORDER('variant="raised"') + ORDER('variant="raised" align="center"'),
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template:
      grid(
        1,
        scene(
          'Tab reaches every action',
          'Press Tab from the control above: each action is its own stop, in the order the form is read. No arrow key is bound, which is the deliberate departure from the APG’s Toolbar pattern — a strip of ten icon buttons is the Toolbar family instead.',
          `<button slButton size="sm" variant="outline" tone="secondary" type="button">
            Start here and press Tab
          </button>
          <footer slActionBar aria-label="Order actions" variant="raised">
            <div slActionBarActions>
              <div slActionBarAction>
                <button slButton variant="ghost" tone="secondary" type="button">Devolver</button>
              </div>
              <div slActionBarAction="always" [slActionBarActionCounterpart]="duplicate">
                <button slButton variant="ghost" tone="secondary" type="button">Duplicar</button>
              </div>
              <div slActionBarAction><button slButton type="button">Aprovar</button></div>
              <sl-action-bar-overflow />
            </div>
          </footer>`,
        ) +
          scene(
            'A bar out of action',
            'A fieldset around it disables every control natively and takes them out of the tab order with them. The family writes no disabled state of its own, because a container cannot disable controls it does not own.',
            `<fieldset disabled>
            <footer slActionBar aria-label="Order actions" variant="raised">
              <div slActionBarStatus>Submitting…</div>
              <div slActionBarActions>
                <div slActionBarAction>
                  <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
                </div>
                <div slActionBarAction>
                  <button slButton type="button">Submit for approval</button>
                </div>
              </div>
            </footer>
          </fieldset>`,
          ),
      ) + COUNTERPARTS,
  }),
};
