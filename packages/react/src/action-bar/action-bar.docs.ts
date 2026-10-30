import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import actionBarTokens from '@slotted/styles/action-bar/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_ACTION_BAR_TOKENS = actionBarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Action Bar decision',
}));

const imports: ReferenceImport = {
  source:
    "import { ActionBar, ActionBarAction, ActionBarActions, ActionBarDefaultsProvider, ActionBarOverflow, ActionBarSeparator, ActionBarStatus } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[role="group"], or the element render returns',
    required: true,
    purpose:
      'The bar. Carries data-ui="action-bar", the four axes, the count of what gave way, and the label the consumer wrote. It is the query container the stacking rule reads, and the element that sticks.',
  },
  {
    part: 'status',
    element: 'div',
    required: false,
    purpose:
      'The sentence at the start: a dirty-state marker, a timestamp, the count of what is selected. It is a slot rather than a component — InlineMessage, StatusIndicator, Badge and plain text all belong here — and it takes what room is left, so filling it never moves the action that confirms.',
  },
  {
    part: 'actions',
    element: 'div',
    required: true,
    purpose:
      'The run that gives way, and the box the collapse measures. It carries margin-inline-start: auto, which anchors it to the bar’s end edge; below 24rem of container, with no overflow control in the bar, it becomes a full-width column with the action that confirms on top.',
  },
  {
    part: 'action',
    element: 'div',
    required: false,
    purpose:
      'One action the bar may give up: its rank, and what it becomes in the surface. A unit is a direct child of the run, which is not the same thing as the control inside it — a ButtonGroup here is one unit and four buttons.',
  },
  {
    part: 'separator',
    element: 'div[role="separator"]',
    required: false,
    purpose:
      'A hairline between two runs, half a gap on each side. It is what keeps a destructive action off a frequent one, and it turns with the actions when the bar becomes a column.',
  },
  {
    part: 'overflow',
    element: 'button, from the Menu family’s own trigger',
    required: false,
    purpose:
      'The control that opens what did not fit. Its mark is the ellipsis glyph and its accessible name carries the count; the bar writes hidden on it while the surface is empty, because the same measurement that decides whether it is needed is the one that reveals it to read its width.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bar with every axis on it, driven by the controls below the canvas. Tab through it: each action is its own stop, in the order the form is read, and no arrow key is bound.',
    snippet: defineSnippet({
      id: 'action-bar-react-playground',
      language: 'tsx',
      label: 'The actions that finish a task',
      source: `<ActionBar aria-label="Order actions">
  <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
  <ActionBarActions>
    <ActionBarAction>
      <Button variant="ghost" tone="secondary">
        Cancelar
      </Button>
    </ActionBarAction>
    <ActionBarAction>
      <Button>Submit for approval</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'priority',
    title: 'Which action gives way first',
    note: 'Narrow the stage and watch the order: “Preview” goes without a trace, “Duplicate” becomes a menu row, “Return” follows it, and “Approve” never moves. Position decides nothing here — the rank does.',
    snippet: defineSnippet({
      id: 'action-bar-react-priority',
      language: 'tsx',
      label: 'Five ranks, from the one that goes first',
      source: `<ActionBarActions>
  {/* Gives way before every other rank, and is not offered in the menu. */}
  <ActionBarAction priority="hide">
    <Button variant="ghost">Preview</Button>
  </ActionBarAction>
  {/* low is the default for an action that declares a counterpart. */}
  <ActionBarAction counterpart={<MenuItem>Duplicar</MenuItem>}>
    <Button variant="ghost">Duplicar</Button>
  </ActionBarAction>
  <ActionBarAction priority="high" counterpart={<MenuItem>Devolver</MenuItem>}>
    <Button variant="outline">Devolver</Button>
  </ActionBarAction>
  {/* No counterpart, so it is pinned: it has nowhere to go. */}
  <ActionBarAction>
    <Button>Aprovar</Button>
  </ActionBarAction>
  <ActionBarOverflow />
</ActionBarActions>;`,
    }),
  },
  {
    id: 'overflowMenu',
    title: 'What is left over, behind one control',
    note: 'The surface holds what gave way and what was never in the bar, in the bar’s own order, with a rule wherever one of the bar’s own rules divided two of them. The trigger’s name is the count, not three dots.',
    snippet: defineSnippet({
      id: 'action-bar-react-overflow-menu',
      language: 'tsx',
      label: 'An action that starts in the menu and stays there',
      source: `<ActionBarActions>
  <ActionBarAction priority="always" counterpart={<MenuItem>View history</MenuItem>}>
    <Button variant="ghost">View history</Button>
  </ActionBarAction>
  <ActionBarAction>
    <Button>Approve</Button>
  </ActionBarAction>
  <ActionBarOverflow label={(hidden) => \`\${hidden} more actions\`} />
</ActionBarActions>;`,
    }),
  },
  {
    id: 'stability',
    title: 'The action that confirms does not move',
    note: 'Four bars on one stage: no message, a short one, one that fills the bar, and a secondary action removed by a permission filter. Read the right edge — “Aprovar” is on the same pixel in all four.',
    snippet: defineSnippet({
      id: 'action-bar-react-stability',
      language: 'tsx',
      label: 'Nothing to write: the run is anchored to the edge',
      source: `// The run carries margin-inline-start: auto, so what grows or leaves
// moves what is *before* the last action and never the last action.
<ActionBar aria-label="Order actions">
  {dirty ? <ActionBarStatus>{message}</ActionBarStatus> : null}
  <ActionBarActions>
    {canReturn ? (
      <ActionBarAction>
        <Button variant="ghost">Devolver</Button>
      </ActionBarAction>
    ) : null}
    <ActionBarAction>
      <Button loading={saving}>Aprovar</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'danger',
    title: 'A destructive action, and the rule beside it',
    note: 'The first bar keeps “Void invoice” away from the two frequent actions with the bar’s own rule. The second is the case nobody writes down: the action that confirms *is* the destructive one, and the rule is what a hand about to press Keep reads.',
    snippet: defineSnippet({
      id: 'action-bar-react-danger',
      language: 'tsx',
      label: 'The boundary a gap cannot draw',
      source: `<ActionBarActions>
  <ActionBarAction>
    <Button variant="ghost" tone="danger">
      Void invoice
    </Button>
  </ActionBarAction>
  <ActionBarSeparator />
  <ActionBarAction>
    <Button variant="ghost" tone="secondary">
      Cancelar
    </Button>
  </ActionBarAction>
  <ActionBarAction>
    <Button>Guardar</Button>
  </ActionBarAction>
</ActionBarActions>;`,
    }),
  },
  {
    id: 'status',
    title: 'The sentence at the start',
    note: 'Four things a product actually puts there — a timestamp, a dirty-state marker, an inline message and a validation count — and the same two actions under each. The slot takes what room is left and shortens itself rather than pushing.',
    snippet: defineSnippet({
      id: 'action-bar-react-status',
      language: 'tsx',
      label: 'A slot, not a fourth way of saying a sentence',
      source: `<ActionBarStatus>
  <StatusIndicator status="warning">3 campos por preencher</StatusIndicator>
</ActionBarStatus>;`,
    }),
  },
  {
    id: 'bulk',
    title: 'The bar a selection brings',
    note: 'Table owns the selection and its count; this family supplies the place, the ranks and the entry. Toggle the selection and watch the bar arrive from below rather than appear — and leave the document when it goes, rather than staying hidden and still reachable by Tab.',
    snippet: defineSnippet({
      id: 'action-bar-react-bulk',
      language: 'tsx',
      label: 'present, and the count the table already holds',
      source: `<ActionBar aria-label="Selection actions" present={selected.length > 0} variant="raised">
  <ActionBarStatus>
    <strong>{selected.length} invoices selected</strong>
    <Button size="sm" variant="ghost" tone="accent" onClick={selectAll}>
      Select all {total} matching the filter
    </Button>
  </ActionBarStatus>
  <ActionBarActions>
    <ActionBarAction counterpart={<MenuItem>Exportar</MenuItem>}>
      <Button variant="ghost">Exportar</Button>
    </ActionBarAction>
    <ActionBarSeparator />
    <ActionBarAction>
      <Button tone="danger">Anular</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'sticky',
    title: 'Stuck to the end of what scrolls',
    note: 'Scroll the panel: the bar stays at the bottom and the last line of content scrolls up to it rather than under it. Inside a Page it reads --slotted-page-sticky-bottom and stops above that page’s own footer instead of covering it.',
    snippet: defineSnippet({
      id: 'action-bar-react-sticky',
      language: 'tsx',
      label: 'Sticky, never fixed',
      source: `<ActionBar aria-label="Form actions" sticky variant="raised">
  <ActionBarActions>
    <ActionBarAction>
      <Button>Guardar</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'align',
    title: 'Where the run sits',
    note: 'end is the anchor and the default; start puts the run beside the status; center places it in what is left. The field disagrees about this one — Salesforce centers a docked footer, Polaris ends it, Fluent starts it — so it is an axis.',
    snippet: defineSnippet({
      id: 'action-bar-react-align',
      language: 'tsx',
      label: 'Three placements of one run',
      source: `<ActionBar aria-label="Actions" align="center" variant="raised" />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the bar sits at',
    note: 'The size moves the bar’s own inset, gap, minimum height and rule — and it reaches the buttons through the Button family’s own defaults, so a bar does not make a consumer repeat size on every control. A button that states its own still wins.',
    snippet: defineSnippet({
      id: 'action-bar-react-sizes',
      language: 'tsx',
      label: 'One step, stated once',
      source: `<ActionBar aria-label="Actions" size="sm" variant="raised">
  <ActionBarActions>
    {/* No size here: the bar hands its own down. */}
    <ActionBarAction>
      <Button variant="ghost">Cancelar</Button>
    </ActionBarAction>
    <ActionBarAction>
      <Button size="lg">Guardar</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'variant',
    title: 'Whether the bar paints a ground',
    note: 'plain is the default and paints nothing — a bar inside a Page footer is already standing on a ground that family painted. raised takes the surface and one hairline at the top, which is the bar with no page around it: a drawer, a dialog, a card.',
    snippet: defineSnippet({
      id: 'action-bar-react-variant',
      language: 'tsx',
      label: 'Inside a page footer, and on its own',
      source: `<ActionBar aria-label="Actions" variant="plain" />;
<ActionBar aria-label="Actions" variant="raised" />;`,
    }),
  },
  {
    id: 'stacked',
    title: 'The bar on a phone',
    note: 'Below 24rem of container a bar with no overflow control becomes a full-width column with the action that confirms on top, and the collapse stops running — a column has room for everything, so there is no menu. A bar with an overflow control keeps one row: the actions without a counterpart stay and the rest fold into the menu. The DOM order does not change, so Tab still reads the form’s order.',
    snippet: defineSnippet({
      id: 'action-bar-react-stacked',
      language: 'tsx',
      label: 'Nothing to write: the bar answers its own width',
      source: `// The breakpoint lives in the stylesheet's container query, and the
// binding reads back the property that query raises rather than holding
// a copy of the number.
<ActionBar aria-label="Order actions" variant="raised">
  <ActionBarActions>
    <ActionBarAction>
      <Button variant="ghost">Discard changes</Button>
    </ActionBarAction>
    <ActionBarAction>
      <Button>Save changes</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German label twice the length of the Portuguese one, a reference number with no spaces in it, and an action mid-flight. The bar never truncates a label: it wraps, or the action goes to the menu where there is a whole row for it.',
    snippet: defineSnippet({
      id: 'action-bar-react-content',
      language: 'tsx',
      label: 'A label that wraps rather than one that is cut',
      source: `<ActionBar aria-label="Bestellaktionen" variant="raised">
  <ActionBarStatus>Entwurf um 14:07 gespeichert</ActionBarStatus>
  <ActionBarActions>
    <ActionBarAction>
      <Button variant="ghost">Änderungen verwerfen</Button>
    </ActionBarAction>
    <ActionBarAction>
      <Button loading>Zur Genehmigung einreichen</Button>
    </ActionBarAction>
  </ActionBarActions>
</ActionBar>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and standing beside other families',
    note: 'The provider carries the four decisions an application takes once. The bar is what goes inside a Page footer, inside a Drawer and under a Table — and every part can be rendered as the consumer’s own element.',
    snippet: defineSnippet({
      id: 'action-bar-react-composition',
      language: 'tsx',
      label: 'A provider, and the bar in a page footer',
      source: `<ActionBarDefaultsProvider size="sm" variant="plain">
  <Page
    footer={
      <ActionBar aria-label="Order actions" render={(props) => <div {...props} />}>
        <ActionBarActions>
          <ActionBarAction>
            <Button>Submeter</Button>
          </ActionBarAction>
        </ActionBarActions>
      </ActionBar>
    }
  >
    <PageBody>…</PageBody>
  </Page>
</ActionBarDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The keyboard, and what a reader hears',
    note: 'Tab reaches each action in the order the author wrote it. The bar is role="group" with the consumer’s own name; a fieldset around it is how it goes out of action, and the platform takes the controls out of the tab order with it.',
    snippet: defineSnippet({
      id: 'action-bar-react-accessibility',
      language: 'tsx',
      label: 'The name, and the element that disables the run',
      source: `<fieldset disabled={submitting}>
  <ActionBar aria-label="Order actions">
    <ActionBarActions>
      <ActionBarAction>
        <Button variant="ghost">Cancelar</Button>
      </ActionBarAction>
      <ActionBarAction>
        <Button>Guardar</Button>
      </ActionBarAction>
    </ActionBarActions>
  </ActionBar>
</fieldset>;`,
    }),
  },
];

export const REACT_ACTION_BAR_DOCS = {
  actionBar: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'variant',
        "'plain' | 'raised'",
        'plain',
        'ActionBar, ActionBarDefaultsProvider',
        'Whether the bar paints a ground and a rule of its own. plain is for a bar that already stands on one — a Page footer, a Card footer; raised is the bar with nothing under it',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'ActionBar, ActionBarDefaultsProvider',
        'The bar’s own inset, gap, minimum height and rule, from the control scales. It also reaches the buttons inside through the Button family’s own defaults token, so a button that states its own size still wins',
      ],
      [
        'align',
        "'end' | 'start' | 'center'",
        'end',
        'ActionBar, ActionBarDefaultsProvider',
        'Where the run sits in the room left after the status. end is the anchor that keeps the action that confirms still, and it is the default for that reason',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'ActionBar, ActionBarDefaultsProvider',
        'Whether the bar sticks to the end of the region that scrolls. Sticky and never fixed: it takes its own height in the flow, and its offset is whatever Page publishes as --slotted-page-sticky-bottom, so it stops above that page’s footer rather than covering it',
      ],
      [
        'present',
        'boolean',
        'true',
        'ActionBar',
        'Whether the bar belongs on screen at all — a bulk bar while there is a selection, a save bar while there are unsaved changes. It enters from below, leaves the same way, and leaves the document once it has left the view. It is an input rather than a state model: the bar never asks to appear, so there is nothing to cancel',
      ],
      [
        'onOverflowChange',
        '(hidden: number) => void',
        '—',
        'ActionBar',
        'How many actions gave way, once per change. There is no controlled pair over the collapsed set: it is a measurement, and a consumer who owned it could assert that a bar fits when the layout says it does not',
      ],
      [
        'priority',
        "'pinned' | 'high' | 'low' | 'hide' | 'always'",
        'low with a counterpart, pinned without',
        'ActionBarAction',
        'Where the action stands in the order of giving way. pinned never goes; high goes after low and hide; low is the first into the surface; hide goes first and is not offered in the surface at all; always is never in the bar. A rank that needs a counterpart and has none behaves as pinned, so a consumer error leaves the control on the bar',
      ],
      [
        'counterpart',
        'ReactNode',
        '—',
        'ActionBarAction',
        'What the action becomes in the surface. An action that declares none is pinned — pinning is the absence of a counterpart rather than a second prop, so the two can never disagree. It is not called overflow, because that word names what a container does with more content than it has room for',
      ],
      [
        'label',
        'string | ((hidden: number) => string)',
        'counted',
        'ActionBarOverflow',
        'The accessible name of the control that holds what did not fit. The default counts — "3 more actions" — because three dots say nothing about how much is behind them, in the language in force, with its plural',
      ],
      [
        'align, side, size',
        'MenuAlign | MenuSide | MenuSize',
        'from the Menu defaults',
        'ActionBarOverflow',
        'Where the surface sits against the trigger, and its own measure. Everything else about the layer an application sets once with MenuDefaultsProvider',
      ],
      [
        'aria-label',
        'string',
        '—',
        'ActionBar',
        'The name of the bar. The family writes none: only the page knows which task the bar finishes. aria-labelledby works the same way',
      ],
      [
        'role',
        'string',
        'group',
        'ActionBar',
        'group, because there is no roving focus to declare — ARIA makes toolbar a subclass of group, and the subclass is what is asserted when there is focus management. A consumer with ten icon-only actions may write toolbar themselves and keeps it, but that consumer wants the Toolbar family',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes any of the six roots and hands it every attribute — the bar can be a footer, the status a p, and the overflow trigger the consumer’s own IconButton with the Menu wiring on it',
      ],
      [
        'ActionBarDefaultsProvider',
        '{ variant, size, align, sticky }',
        '—',
        'a subtree',
        'The four decisions an application takes once. A bar that states any of them itself still wins',
      ],
      [
        'menuRef',
        'Ref<MenuHandle>',
        '—',
        'ActionBarOverflow',
        'Reaches the surface’s imperative actions — open, close and focus — which belong to the Menu family rather than to this one',
      ],
      [
        'useActionBarOverflow',
        '() => { surface, counterpart }',
        '—',
        'inside ActionBar',
        'What the parts read: the actions the surface holds, in the order the bar holds them, and what each one becomes. A consumer’s own trigger reads the same value',
      ],
      [
        'ref',
        'Ref<HTMLDivElement>',
        '—',
        'ActionBar and every part',
        'Reaches the element itself. No imperative handle is invented: focus() on the action a page wants to start from is the platform’s own',
      ],
      [
        'fieldset',
        'the platform’s own element',
        '—',
        'around an ActionBar',
        'How a bar is taken out of action. A container cannot disable controls it does not own, and a bar that refused interaction while its controls still looked operable is the defect the state precedence exists to prevent',
      ],
      [
        'Page footer',
        'the Page family’s own slot',
        '—',
        'around an ActionBar',
        'Where a page’s bar belongs. Page paints the ground, the rule and the sticky behavior; this family arranges what is on it, which is why variant="plain" paints nothing',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for a bar of actions, and the closest official guidance is the Toolbar pattern (w3.org/WAI/ARIA/apg/patterns/toolbar/). This family departs from it deliberately: there is no roving focus, so Tab reaches every action in the order the author wrote it. The controls here are the page’s own form actions, and a reader walking a form expects to arrive at Cancel and then at Save; a composite would make the whole bar one tab stop and put Save behind an arrow key that announces nothing. The cost is written down — a bar of ten icon-only actions is ten tab stops, and that bar is the Toolbar family.',
      'The role follows the departure. ARIA 1.2 makes toolbar a subclass of group, and the subclass is what is asserted when there is focus management to declare; without it, group is what is true. The bar names itself with the consumer’s aria-label or aria-labelledby, because only the page knows which task it finishes — and a role the consumer wrote on the element survives the family’s own.',
      'The only keyboard this family owns is the overflow trigger’s, and it is the Menu family’s: Enter, Space and ArrowDown open the surface, Escape closes it and returns focus to the trigger. Focus is moved onto the trigger before the action holding it is hidden, so a reader who was on the fifth button lands on the control that now holds it rather than on the document body.',
      'The trigger’s accessible name carries the count rather than the mark, so a reader hears “3 more actions” instead of three dots, in the language in force with its plural. The count in the DOM, data-collapsed, is the same fact for a stylesheet or a test.',
      'A bar out of action is a fieldset around it: the platform disables every control inside and takes them out of the tab order with it. The family writes no data-disabled and declares no disabled state, because it does not own the capability — a container that refused interaction while its controls still looked operable is the defect the state precedence exists to prevent.',
      'A bar that is not present leaves the document once it has left the view, rather than staying mounted and hidden. Carbon’s batch bar writes aria-hidden on its root and leaves the buttons inside reachable by Tab, which puts focus in a region the screen reader announces as absent. Appearing never moves focus either: the bar is not a dialog, and taking focus from a reader who is ticking boxes is exactly the jump a selection bar must not make.',
      'Under forced colors the rule between two runs keeps its own paint, because a background flattens to Canvas and would take the boundary between a destructive action and a frequent one with it. Everything else the reader sees belongs to the controls the consumer placed, and each keeps its own states, its own focus ring and its own contrast.',
    ],
    snippets: [
      defineSnippet({
        id: 'action-bar-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="action-bar"
  data-part="root"
  role="group"
  aria-label="Order actions"
  data-variant="raised"
  data-size="md"
  data-align="end"
  data-collapsed="1"
>
  <div data-part="status">Draft saved at 14:07</div>
  <div data-part="actions">
    <div data-part="action" data-priority="hide" hidden>
      <button>Preview</button>
    </div>
    <div data-part="action" data-priority="low" data-unit="«r3»">
      <button>Duplicar</button>
    </div>
    <div data-part="separator" role="separator" aria-orientation="vertical" />
    <div data-part="action" data-priority="pinned">
      <button>Aprovar</button>
    </div>
    <button data-part="overflow" type="button" aria-label="1 more action">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="ellipsis" />
      </span>
    </button>
  </div>
</div>;`,
      }),
      defineSnippet({
        id: 'action-bar-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='action-bar'] {
  --slotted-action-bar-gap: var(--slotted-space-5);
  --slotted-action-bar-inset-block: var(--slotted-space-5);
  --slotted-action-bar-inset-inline: var(--slotted-space-6);
  --slotted-action-bar-background: var(--slotted-surface-raised);
  --slotted-action-bar-border-color: var(--slotted-border-strong);
  --slotted-action-bar-separator-color: var(--slotted-border-subtle);
  --slotted-action-bar-status-color: var(--slotted-text);
}`,
      }),
    ],
  },
} as const;
