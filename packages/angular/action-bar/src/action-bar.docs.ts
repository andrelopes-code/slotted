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

export const ANGULAR_ACTION_BAR_TOKENS = actionBarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Action Bar decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlActionBar, SlActionBarAction, SlActionBarActions, SlActionBarOverflow, SlActionBarSeparator, SlActionBarStatus, provideActionBarDefaults } from '@slotted/angular/action-bar';",
  selector:
    '[slActionBar], [slActionBarStatus], [slActionBarActions], [slActionBarAction], [slActionBarSeparator], sl-action-bar-overflow',
  exportAs:
    'slActionBar, slActionBarStatus, slActionBarActions, slActionBarAction, slActionBarSeparator, slActionBarOverflow',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element carrying slActionBar, with role="group"',
    required: true,
    purpose:
      'The bar. Carries data-ui="action-bar", the four axes, the count of what gave way, and the label the consumer wrote. It is the query container the stacking rule reads, and the element that sticks.',
  },
  {
    part: 'status',
    element: 'an element carrying slActionBarStatus',
    required: false,
    purpose:
      'The sentence at the start: a dirty-state marker, a timestamp, the count of what is selected. It is a slot rather than a component — slInlineMessage, slStatusIndicator, slBadge and plain text all belong here — and it takes what room is left, so filling it never moves the action that confirms.',
  },
  {
    part: 'actions',
    element: 'an element carrying slActionBarActions',
    required: true,
    purpose:
      'The run that gives way, and the box the collapse measures. It carries margin-inline-start: auto, which anchors it to the bar’s end edge; below 24rem of container, with no overflow control in the bar, it becomes a full-width column with the action that confirms on top.',
  },
  {
    part: 'action',
    element: 'an element carrying slActionBarAction',
    required: false,
    purpose:
      'One action the bar may give up: its rank, and the ng-template it becomes in the surface. A unit is a direct child of the run, which is not the same thing as the control inside it — a slButtonGroup here is one unit and four buttons.',
  },
  {
    part: 'separator',
    element: 'an element carrying slActionBarSeparator, with role="separator"',
    required: false,
    purpose:
      'A hairline between two runs, half a gap on each side. It is what keeps a destructive action off a frequent one, and it turns with the actions when the bar becomes a column.',
  },
  {
    part: 'overflow',
    element: 'sl-action-bar-overflow, whose host is display: contents',
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
      id: 'action-bar-angular-playground',
      language: 'angular',
      label: 'The actions that finish a task',
      source: `<footer slActionBar aria-label="Order actions">
  <div slActionBarStatus>Draft saved at 14:07</div>
  <div slActionBarActions>
    <div slActionBarAction>
      <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
    </div>
    <div slActionBarAction>
      <button slButton type="button">Submit for approval</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'priority',
    title: 'Which action gives way first',
    note: 'Narrow the stage and watch the order: “Preview” goes without a trace, “Duplicate” becomes a menu row, “Send back” follows it, and “Approve” never moves. Position decides nothing here — the rank does.',
    snippet: defineSnippet({
      id: 'action-bar-angular-priority',
      language: 'angular',
      label: 'Five ranks, from the one that goes first',
      source: `<div slActionBarActions>
  <!-- Gives way before every other rank, and is not offered in the menu. -->
  <div slActionBarAction="hide">
    <button slButton variant="ghost" type="button">Preview</button>
  </div>
  <!-- low is the default for an action that declares a counterpart. -->
  <div slActionBarAction [slActionBarActionCounterpart]="duplicate">
    <button slButton variant="ghost" type="button">Duplicar</button>
  </div>
  <div slActionBarAction="high" [slActionBarActionCounterpart]="send">
    <button slButton variant="outline" type="button">Devolver</button>
  </div>
  <!-- No counterpart, so it is pinned: it has nowhere to go. -->
  <div slActionBarAction>
    <button slButton type="button">Aprovar</button>
  </div>
  <sl-action-bar-overflow />
</div>

<ng-template #duplicate><button slMenuItem type="button">Duplicar</button></ng-template>
<ng-template #send><button slMenuItem type="button">Devolver</button></ng-template>`,
    }),
  },
  {
    id: 'overflowMenu',
    title: 'What is left over, behind one control',
    note: 'The surface holds what gave way and what was never in the bar, in the bar’s own order, with a rule wherever one of the bar’s own rules divided two of them. The trigger’s name is the count, not three dots.',
    snippet: defineSnippet({
      id: 'action-bar-angular-overflow-menu',
      language: 'angular',
      label: 'A counterpart is a template, rendered only when it is reached',
      source: `<div slActionBarActions>
  <div slActionBarAction="always" [slActionBarActionCounterpart]="history">
    <button slButton variant="ghost" type="button">View history</button>
  </div>
  <div slActionBarAction>
    <button slButton type="button">Aprovar</button>
  </div>
  <sl-action-bar-overflow [label]="count" />
</div>

<ng-template #history><button slMenuItem type="button">View history</button></ng-template>`,
    }),
  },
  {
    id: 'stability',
    title: 'The action that confirms does not move',
    note: 'Four bars on one stage: no message, a short one, one that fills the bar, and a secondary action removed by a permission filter. Read the right edge — “Aprovar” is on the same pixel in all four.',
    snippet: defineSnippet({
      id: 'action-bar-angular-stability',
      language: 'angular',
      label: 'Nothing to write: the run is anchored to the edge',
      source: `<!-- The run carries margin-inline-start: auto, so what grows or leaves
     moves what is *before* the last action and never the last action. -->
<footer slActionBar aria-label="Order actions">
  @if (dirty()) {
    <div slActionBarStatus>{{ message() }}</div>
  }
  <div slActionBarActions>
    @if (canReturn()) {
      <div slActionBarAction>
        <button slButton variant="ghost" type="button">Devolver</button>
      </div>
    }
    <div slActionBarAction>
      <button slButton [loading]="saving()" type="button">Aprovar</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'danger',
    title: 'A destructive action, and the rule beside it',
    note: 'The first bar keeps “Void invoice” away from the two frequent actions with the bar’s own rule. The second is the case nobody writes down: the action that confirms *is* the destructive one, and the rule is what a hand about to press Keep reads.',
    snippet: defineSnippet({
      id: 'action-bar-angular-danger',
      language: 'angular',
      label: 'The boundary a gap cannot draw',
      source: `<div slActionBarActions>
  <div slActionBarAction>
    <button slButton variant="ghost" tone="danger" type="button">Void invoice</button>
  </div>
  <div slActionBarSeparator></div>
  <div slActionBarAction>
    <button slButton variant="ghost" tone="secondary" type="button">Cancelar</button>
  </div>
  <div slActionBarAction>
    <button slButton type="button">Guardar</button>
  </div>
</div>`,
    }),
  },
  {
    id: 'status',
    title: 'The sentence at the start',
    note: 'Three things a product actually puts there — a timestamp, a status indicator and an inline message — and the same actions under each. The slot takes what room is left and shortens itself rather than pushing.',
    snippet: defineSnippet({
      id: 'action-bar-angular-status',
      language: 'angular',
      label: 'A slot, not a fourth way of saying a sentence',
      source: `<div slActionBarStatus>
  <span slStatusIndicator status="warning">3 campos por preencher</span>
</div>`,
    }),
  },
  {
    id: 'bulk',
    title: 'The bar a selection brings',
    note: 'Table owns the selection and its count; this family supplies the place, the ranks and the entry. Toggle the selection and watch the bar arrive from below rather than appear — and be painted out when it goes, rather than staying reachable by Tab.',
    snippet: defineSnippet({
      id: 'action-bar-angular-bulk',
      language: 'angular',
      label: 'present, and the count the table already holds',
      source: `<footer
  slActionBar
  aria-label="Selection actions"
  variant="raised"
  [present]="selected().length > 0"
>
  <div slActionBarStatus>
    <strong>{{ selected().length }} invoices selected</strong>
    <button slButton size="sm" variant="ghost" tone="accent" type="button" (click)="selectAll()">
      Select all {{ total() }} in the filter
    </button>
  </div>
  <div slActionBarActions>
    <div slActionBarAction [slActionBarActionCounterpart]="exported">
      <button slButton variant="ghost" type="button">Exportar</button>
    </div>
    <div slActionBarSeparator></div>
    <div slActionBarAction>
      <button slButton tone="danger" type="button">Anular</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'sticky',
    title: 'Stuck to the end of what scrolls',
    note: 'Scroll the panel: the bar stays at the bottom and the last line of content scrolls up to it rather than under it. Inside a page it reads --slotted-page-sticky-bottom and stops above that page’s own footer instead of covering it.',
    snippet: defineSnippet({
      id: 'action-bar-angular-sticky',
      language: 'angular',
      label: 'Sticky, never fixed',
      source: `<footer slActionBar aria-label="Form actions" variant="raised" sticky>
  <div slActionBarActions>
    <div slActionBarAction>
      <button slButton type="button">Guardar</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'align',
    title: 'Where the run sits',
    note: 'end is the anchor and the default; start puts the run beside the status; center places it in what is left. The field disagrees about this one — Salesforce centres a docked footer, Polaris ends it, Fluent starts it — so it is an axis.',
    snippet: defineSnippet({
      id: 'action-bar-angular-align',
      language: 'angular',
      label: 'Three placements of one run',
      source: `<footer slActionBar aria-label="Actions" align="center" variant="raised"></footer>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the bar sits at',
    note: 'The size moves the bar’s own inset, gap, minimum height and rule — and it reaches the buttons through the Button family’s own defaults, so a bar does not make a consumer repeat size on every control. A button that states its own still wins.',
    snippet: defineSnippet({
      id: 'action-bar-angular-sizes',
      language: 'angular',
      label: 'One step, stated once',
      source: `<footer slActionBar aria-label="Actions" size="sm" variant="raised">
  <div slActionBarActions>
    <!-- No size here: the bar hands its own down. -->
    <div slActionBarAction>
      <button slButton variant="ghost" type="button">Cancelar</button>
    </div>
    <div slActionBarAction>
      <button slButton size="lg" type="button">Guardar</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'variant',
    title: 'Whether the bar paints a ground',
    note: 'plain is the default and paints nothing — a bar inside a page footer is already standing on a ground that family painted. raised takes the surface and one hairline at the top, which is the bar with no page around it: a drawer, a dialog, a card.',
    snippet: defineSnippet({
      id: 'action-bar-angular-variant',
      language: 'angular',
      label: 'Inside a page footer, and on its own',
      source: `<footer slActionBar aria-label="Actions" variant="plain"></footer>
<footer slActionBar aria-label="Actions" variant="raised"></footer>`,
    }),
  },
  {
    id: 'stacked',
    title: 'The bar on a phone',
    note: 'Below 24rem of container a bar with no overflow control becomes a full-width column with the action that confirms on top, and the collapse stops running — a column has room for everything, so there is no menu. A bar with an overflow control keeps one row: the actions without a counterpart stay and the rest fold into the menu. The DOM order does not change, so Tab still reads the form’s order.',
    snippet: defineSnippet({
      id: 'action-bar-angular-stacked',
      language: 'angular',
      label: 'Nothing to write: the bar answers its own width',
      source: `<!-- The breakpoint lives in the stylesheet's container query, and the
     directive reads back the property that query raises rather than
     holding a copy of the number. -->
<footer slActionBar aria-label="Order actions" variant="raised">
  <div slActionBarActions>
    <div slActionBarAction>
      <button slButton variant="ghost" type="button">Discard changes</button>
    </div>
    <div slActionBarAction>
      <button slButton type="button">Save changes</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German label twice the length of the Portuguese one, a reference number with no spaces in it, and an action mid-flight. The bar never truncates a label: it wraps, or the action goes to the menu where there is a whole row for it.',
    snippet: defineSnippet({
      id: 'action-bar-angular-content',
      language: 'angular',
      label: 'A label that wraps rather than one that is cut',
      source: `<footer slActionBar aria-label="Bestellaktionen" variant="raised">
  <div slActionBarStatus>Entwurf um 14:07 gespeichert</div>
  <div slActionBarActions>
    <div slActionBarAction>
      <button slButton variant="ghost" type="button">Änderungen verwerfen</button>
    </div>
    <div slActionBarAction>
      <button slButton loading type="button">Zur Genehmigung einreichen</button>
    </div>
  </div>
</footer>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and standing beside other families',
    note: 'provideActionBarDefaults carries the four decisions an application takes once. The bar is what goes inside a page footer, inside a drawer and under a table — and every part is a directive on the consumer’s own element.',
    snippet: defineSnippet({
      id: 'action-bar-angular-composition',
      language: 'ts',
      label: 'A provider, and the directive on the page’s own footer',
      source: `bootstrapApplication(App, {
  providers: [provideActionBarDefaults({ size: 'sm', variant: 'plain' })],
});

// The bar is a directive, so the element is the page's own:
// <footer slActionBar aria-label="Order actions">…</footer>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The keyboard, and what a reader hears',
    note: 'Tab reaches each action in the order the author wrote it. The bar is role="group" with the consumer’s own name; a fieldset around it is how it goes out of action, and the platform takes the controls out of the tab order with it.',
    snippet: defineSnippet({
      id: 'action-bar-angular-accessibility',
      language: 'angular',
      label: 'The name, and the element that disables the run',
      source: `<fieldset [disabled]="submitting()">
  <footer slActionBar aria-label="Order actions">
    <div slActionBarActions>
      <div slActionBarAction>
        <button slButton variant="ghost" type="button">Cancelar</button>
      </div>
      <div slActionBarAction>
        <button slButton type="button">Guardar</button>
      </div>
    </div>
  </footer>
</fieldset>`,
    }),
  },
];

export const ANGULAR_ACTION_BAR_DOCS = {
  actionBar: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'variant',
        "'plain' | 'raised'",
        'plain',
        'slActionBar, provideActionBarDefaults',
        'Whether the bar paints a ground and a rule of its own. plain is for a bar that already stands on one — a page footer, a card footer; raised is the bar with nothing under it',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slActionBar, provideActionBarDefaults',
        'The bar’s own inset, gap, minimum height and rule, from the control scales. It also reaches the buttons inside through the Button family’s own defaults token, so a button that states its own size still wins',
      ],
      [
        'align',
        "'end' | 'start' | 'center'",
        'end',
        'slActionBar, provideActionBarDefaults',
        'Where the run sits in the room left after the status. end is the anchor that keeps the action that confirms still, and it is the default for that reason',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'slActionBar, provideActionBarDefaults',
        'Whether the bar sticks to the end of the region that scrolls. Sticky and never fixed: it takes its own height in the flow, and its offset is whatever a page publishes as --slotted-page-sticky-bottom, so it stops above that page’s footer rather than covering it',
      ],
      [
        'present',
        'boolean',
        'true',
        'slActionBar',
        'Whether the bar belongs on screen at all — a bulk bar while there is a selection, a save bar while there are unsaved changes. It enters from below and leaves the same way, and is painted out with display:none once it has gone, which takes it out of the accessibility tree and the tab order alike. A directive cannot remove the host the consumer wrote: a consumer who wants the node itself gone writes @if around it and gives up the exit',
      ],
      [
        'overflowChange',
        'EventEmitter<number>',
        '—',
        'slActionBar',
        'How many actions gave way, once per change. There is no two-way binding over the collapsed set: it is a measurement, and a consumer who owned it could assert that a bar fits when the layout says it does not',
      ],
      [
        'slActionBarAction',
        "'pinned' | 'high' | 'low' | 'hide' | 'always'",
        'low with a counterpart, pinned without',
        'slActionBarAction',
        'The selector’s own value is the rank. pinned never goes; high goes after low and hide; low is the first into the surface; hide goes first and is not offered in the surface at all; always is never in the bar. A rank that needs a counterpart and has none behaves as pinned, so a consumer error leaves the control on the bar',
      ],
      [
        'slActionBarActionCounterpart',
        'TemplateRef<unknown>',
        '—',
        'slActionBarAction',
        'What the action becomes in the surface, as an ng-template rendered only while the action is in it — so a menu item that is never reached builds nothing. An action that declares none is pinned: pinning is the absence of a counterpart rather than a second input',
      ],
      [
        'label',
        'string | ((hidden: number) => string)',
        'counted',
        'sl-action-bar-overflow',
        'The accessible name of the control that holds what did not fit. The default counts — "3 more actions" — because three dots say nothing about how much is behind them, in the language in force, with its plural. An aria-label written on the host wins over it',
      ],
      [
        'align, side, size',
        'MenuAlign | MenuSide | MenuSize',
        'from the Menu defaults',
        'sl-action-bar-overflow',
        'Where the surface sits against the trigger, and its own measure. Everything else about the layer an application sets once with provideMenuDefaults',
      ],
      [
        'aria-label',
        'string',
        '—',
        'slActionBar',
        'The name of the bar. The family writes none: only the page knows which task the bar finishes. aria-labelledby works the same way',
      ],
      [
        'role',
        'string',
        'group',
        'slActionBar',
        'group, because there is no roving focus to declare — ARIA makes toolbar a subclass of group, and the subclass is what is asserted when there is focus management. A role written on the host is read with HostAttributeToken and survives, but a consumer who wants the composite wants the Toolbar family',
      ],
    ]),
    composition: apiRows([
      [
        'the directive form',
        'an attribute on the consumer’s own element',
        '—',
        'every part but the overflow',
        'The bar is a footer, the status a p, the run a div — the family adds behaviour to the element the page already wanted rather than inserting one of its own',
      ],
      [
        'provideActionBarDefaults',
        '{ variant, size, align, sticky }',
        '—',
        'an injector',
        'The four decisions an application takes once. A bar that states any of them itself still wins',
      ],
      [
        'exportAs',
        "'slActionBar' and one per part",
        '—',
        'a template',
        'Reaches the instance from the template — surfaceUnits() for what the menu holds, and refresh() to measure again after something the DOM cannot report',
      ],
      [
        'ng-template',
        'TemplateRef',
        '—',
        'slActionBarActionCounterpart',
        'The counterpart is lazy: the outlet renders it only while the action is in the surface, and it is given an injector carrying the menu this component draws — so slMenuItem finds the surface it is actually inside',
      ],
      [
        'fieldset',
        'the platform’s own element',
        '—',
        'around an slActionBar',
        'How a bar is taken out of action. A container cannot disable controls it does not own, and a bar that refused interaction while its controls still looked operable is the defect the state precedence exists to prevent',
      ],
      [
        'OnPush and zoneless',
        'signals throughout',
        '—',
        'the whole family',
        'Every public value is an input signal and every derived one a computed; the measurement writes a signal and nothing calls markForCheck to compensate',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for a bar of actions, and the closest official guidance is the Toolbar pattern (w3.org/WAI/ARIA/apg/patterns/toolbar/). This family departs from it deliberately: there is no roving focus, so Tab reaches every action in the order the author wrote it. The controls here are the page’s own form actions, and a reader walking a form expects to arrive at Cancel and then at Save; a composite would make the whole bar one tab stop and put Save behind an arrow key that announces nothing. The cost is written down — a bar of ten icon-only actions is ten tab stops, and that bar is the Toolbar family.',
      'The role follows the departure. ARIA 1.2 makes toolbar a subclass of group, and the subclass is what is asserted when there is focus management to declare; without it, group is what is true. The bar names itself with the consumer’s aria-label or aria-labelledby, because only the page knows which task it finishes — and a role written on the host is read with HostAttributeToken before the host binding, so what the consumer wrote survives.',
      'The only keyboard this family owns is the overflow trigger’s, and it is the Menu family’s: Enter, Space and ArrowDown open the surface, Escape closes it and returns focus to the trigger. Focus is moved onto the trigger before the action holding it is hidden, so a reader who was on the fifth button lands on the control that now holds it rather than on the document body.',
      'The trigger’s accessible name carries the count rather than the mark, so a reader hears “3 more actions” instead of three dots, in the language in force with its plural. The count in the DOM, data-collapsed, is the same fact for a stylesheet or a test.',
      'A bar out of action is a fieldset around it: the platform disables every control inside and takes them out of the tab order with it. The family writes no data-disabled and declares no disabled state, because it does not own the capability — a container that refused interaction while its controls still looked operable is the defect the state precedence exists to prevent.',
      'A bar that is not present is painted out with display:none once its exit has finished, which takes it out of the accessibility tree and out of the tab order together. Carbon’s batch bar writes aria-hidden on its root instead and leaves the buttons inside reachable by Tab, which puts focus in a region the screen reader announces as absent. Appearing never moves focus either: the bar is not a dialog, and taking focus from a reader who is ticking boxes is exactly the jump a selection bar must not make.',
      'Under forced colours the rule between two runs keeps its own paint, because a background flattens to Canvas and would take the boundary between a destructive action and a frequent one with it. Everything else the reader sees belongs to the controls the consumer placed, and each keeps its own states, its own focus ring and its own contrast.',
    ],
    snippets: [
      defineSnippet({
        id: 'action-bar-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<footer
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
    <div data-part="action" data-priority="low" data-unit="slotted-action-bar-unit-3">
      <button>Duplicar</button>
    </div>
    <div data-part="separator" role="separator" aria-orientation="vertical"></div>
    <div data-part="action" data-priority="pinned">
      <button>Aprovar</button>
    </div>
    <button data-part="overflow" type="button" aria-label="1 more action">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="ellipsis"></svg>
      </span>
    </button>
  </div>
</footer>`,
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
