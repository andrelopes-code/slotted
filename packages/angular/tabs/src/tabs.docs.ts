import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tabsTokens from '@slotted/styles/tabs/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TABS_TOKENS = tabsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tabs decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideTabsDefaults,\n  SlTab,\n  SlTabActions,\n  SlTabEnd,\n  SlTabList,\n  SlTabPanel,\n  SlTabPanelContent,\n  SlTabs,\n  SlTabStart,\n} from '@slotted/angular/tabs';",
  selector:
    '[slTabs], [slTabList], [slTab], [slTabStart], [slTabEnd], [slTabPanel], ng-template[slTabPanelContent], [slTabActions]',
  exportAs: 'slTabs, slTabList, slTab, slTabStart, slTabEnd, slTabPanel, slTabActions',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slTabs',
    required: true,
    purpose:
      'The Tabs root: a grid of four columns and two rows that carries data-ui="tabs", the axes (data-size, data-variant, data-track, data-orientation, data-fit), data-disabled, data-overflowing and data-activation-direction. It renders the two paging controls itself, because it observes whether the list overflows.',
  },
  {
    part: 'list',
    element: 'the element carrying slTabList, with role="tablist"',
    required: true,
    purpose:
      'The scroll container, and the single Tab stop of the list. Name it with aria-label or aria-labelledby: Tabs writes neither, because only the page knows what the set of views is for.',
  },
  {
    part: 'item',
    element: 'the slTab host, with role="presentation"',
    required: true,
    purpose:
      'One tab and its optional close button. It exists because a button cannot contain a button, and it carries the hover bar under the tab. A class or an attribute written on slTab lands on it.',
  },
  {
    part: 'tab',
    element: 'button[role="tab"], or a[role="tab"] with href',
    required: true,
    purpose:
      'The control. It holds aria-selected, aria-controls, the generated id and data-value, which the keyboard reads. A template reaches the SlTab instance through exportAs="slTab".',
  },
  {
    part: 'start',
    element: 'the element carrying slTabStart',
    required: false,
    purpose:
      'The element marked slTabStart, before the label: an icon, as a flex item of the tab that never shrinks and that sizes an icon to the tab’s icon step.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The words, in a box of their own: text-overflow cuts it when fit="equal" leaves too little room, and unicode-bidi: plaintext lets a label in another script read in its own direction.',
  },
  {
    part: 'end',
    element: 'the element carrying slTabEnd',
    required: false,
    purpose:
      'The element marked slTabEnd, after the label: a count or a status, as a flex item of the tab that never shrinks.',
  },
  {
    part: 'dismiss',
    element: 'button',
    required: false,
    purpose:
      'The close button. It has tabindex="-1", so the arrow keys move between tabs only, and it stays in the accessibility tree, so a screen reader can press it. From the keyboard, Delete closes the focused tab, which aria-keyshortcuts on the tab announces.',
  },
  {
    part: 'marker',
    element: 'span, aria-hidden',
    required: false,
    purpose:
      'The bar under the selected tab. The list draws one and slides it between tabs; it spans the tab’s content box, never the close button. --slotted-tabs-marker-size, --slotted-tabs-marker-radius, --slotted-tabs-marker-inset and --slotted-tabs-marker-offset (1px above the list’s edge) shape it, and the hover bar takes the same geometry at --slotted-tabs-hover-marker-opacity.',
  },
  {
    part: 'panel',
    element: 'the element carrying slTabPanel, with role="tabpanel"',
    required: true,
    purpose:
      'The content of one tab, with aria-labelledby pointing at its tab and tabindex="0". It carries the hidden attribute while another tab is selected. The panel element always exists, so every tab’s aria-controls names an element; mount decides whether its content exists. Content written in <ng-template slTabPanelContent> is created only when mount says so.',
  },
  {
    part: 'scroll',
    element: 'button',
    required: false,
    purpose:
      'One paging control at each end, drawn only while the list overflows. It is aria-hidden and outside the Tab sequence, because the arrow keys reach every tab and scroll it into view.',
  },
  {
    part: 'actions',
    element: 'the element carrying slTabActions',
    required: false,
    purpose:
      'A slot at the end of the tab row, for controls that act on what the tabs show. Put a Toolbar in it: one Tab stop however many buttons it holds.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One family with every axis on it, driven by the controls below the canvas. Tab into it once: the list is a single stop, and the arrows move the selection from there.',
    snippet: defineSnippet({
      id: 'tabs-angular-playground',
      language: 'angular',
      label: 'A set of views over one panel',
      source: `<div slTabs defaultValue="summary">
  <div slTabList aria-label="Order">
    <div slTab value="summary">Summary</div>
    <div slTab value="items">Items</div>
  </div>
  <div slTabPanel value="summary">Delivery expected on September 12.</div>
  <div slTabPanel value="items">Three items.</div>
</div>`,
    }),
  },
  {
    id: 'activation',
    title: 'Whether focus selects',
    note: 'Automatic is the APG’s recommendation for panels that are already loaded; manual moves focus and waits for Enter or Space, which is what a panel that fetches needs.',
    snippet: defineSnippet({
      id: 'tabs-angular-activation',
      language: 'angular',
      label: 'Selection following focus, and not',
      source: `<div slTabs activation="automatic" defaultValue="a"></div>
<div slTabs activation="manual" defaultValue="a"></div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'Which way the list runs',
    note: 'A horizontal list scrolls and refuses the up and down arrows, so the page keeps scrolling with focus inside it; a vertical one stacks, turns the track and the marker, and announces aria-orientation.',
    snippet: defineSnippet({
      id: 'tabs-angular-orientation',
      language: 'angular',
      label: 'A row of views, and a column of them',
      source: `<div slTabs defaultValue="a" orientation="vertical">
  <div slTabList aria-label="Settings">
    <div slTab value="a">Profile</div>
    <div slTab value="b">Notifications</div>
  </div>
  <div slTabPanel value="a">Name and photo.</div>
  <div slTabPanel value="b">Email notices.</div>
</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'The two ways a list is drawn',
    note: 'Line is a row of labels over a hairline; contained is a sunken track holding a surface per tab; and track="none" keeps the labels and drops the hairline, for a list standing on a line the page already drew. All three keep the accent marker, which is what survives the high-contrast scheme after every surface flattens.',
    snippet: defineSnippet({
      id: 'tabs-angular-variant',
      language: 'angular',
      label: 'Line, contained, and no line at all',
      source: `<div slTabs defaultValue="a" variant="line"></div>
<div slTabs defaultValue="a" variant="contained"></div>

<!-- Standing on a line the page already drew — a card header, a table's rule. -->
<div slTabs defaultValue="a" track="none"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the list sits at',
    note: 'Height, type, padding and the inner gap all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
    snippet: defineSnippet({
      id: 'tabs-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slTabs defaultValue="a" size="sm"></div>
<div slTabs defaultValue="a" size="md"></div>
<div slTabs defaultValue="a" size="lg"></div>`,
    }),
  },
  {
    id: 'fit',
    title: 'How the line is divided',
    note: 'auto makes each tab as wide as its label and scrolls what does not fit; equal divides the line between them and is the one place a horizontal label is ever truncated.',
    snippet: defineSnippet({
      id: 'tabs-angular-fit',
      language: 'angular',
      label: 'As wide as the label, or an equal share',
      source: `<div slTabs defaultValue="a" fit="auto"></div>
<div slTabs defaultValue="a" fit="equal" variant="contained"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family paints',
    note: 'A tab that is not selected raises its ink on hover. In the line variant a neutral bar appears where the mark would go and darkens on press; in the contained variant the cell fills instead. A selected one does neither, because it is already at full strength. Disabled is the native attribute, which is also what makes the browser skip it.',
    snippet: defineSnippet({
      id: 'tabs-angular-states',
      language: 'angular',
      label: 'One tab out of reach, and a whole family',
      source: `<div slTabs defaultValue="a">
  <div slTabList aria-label="Document">
    <div slTab value="a">Available</div>
    <div slTab value="b" disabled>Unavailable</div>
  </div>
  <div slTabPanel value="a">…</div>
</div>

<div slTabs defaultValue="a" disabled></div>`,
    }),
  },
  {
    id: 'mount',
    title: 'When a panel exists',
    note: 'active builds the panel on selection and drops it after, lazy keeps it once built, eager builds every one up front. A panel holding a table or a chart is the reason the default is active.',
    snippet: defineSnippet({
      id: 'tabs-angular-mount',
      language: 'angular',
      label: 'Three strategies, one axis',
      source: `<div slTabs defaultValue="a" mount="active"></div>
<div slTabs defaultValue="a" mount="lazy"></div>
<div slTabs defaultValue="a" mount="eager"></div>`,
    }),
  },
  {
    id: 'dismissible',
    title: 'Tabs a reader can close',
    note: 'Delete closes the focused tab and the pointer closes it from the control; the family then asks for the neighbour — the following tab, or the preceding one when the closed tab was last — and removes nothing itself.',
    snippet: defineSnippet({
      id: 'tabs-angular-dismissible',
      language: 'angular',
      label: 'The consumer owns the collection',
      source: `<div
  slTabs
  [value]="active()"
  (valueChange)="active.set($event.value)"
  (tabDismiss)="queries.set(queries().filter(close($event.value)))"
>
  <div slTabList aria-label="Queries">
    @for (query of queries(); track query) {
      <div slTab [value]="query" dismissible [dismissLabel]="'Close ' + query">{{ query }}</div>
    }
  </div>
</div>`,
    }),
  },
  {
    id: 'overflow',
    title: 'A list that does not fit',
    note: 'The list scrolls rather than wrapping or truncating, two paging controls appear only while there is somewhere to scroll, and the arrow keys bring each tab into view as focus reaches it.',
    snippet: defineSnippet({
      id: 'tabs-angular-overflow',
      language: 'angular',
      label: 'Twenty views in a narrow column',
      source: `<!-- Nothing to write: the list scrolls, the paging controls appear when they
     are needed, and the selected tab is brought into view on every change. -->
<div slTabs defaultValue="v1">
  <div slTabList aria-label="Versions">
    @for (version of versions(); track version) {
      <div slTab [value]="version">{{ version }}</div>
    }
  </div>
</div>`,
    }),
  },
  {
    id: 'links',
    title: 'A view a router can deep-link to',
    note: 'href makes the control an anchor, so the destination is real: a plain click selects, and a click carrying a modifier key is left to the browser, which opens the view in a new browser tab.',
    snippet: defineSnippet({
      id: 'tabs-angular-links',
      language: 'angular',
      label: 'Selection and navigation in one control',
      source: `<div slTabs [value]="view()" (valueChange)="navigate($event.value)">
  <div slTabList aria-label="Order">
    <div slTab value="summary" href="/order/summary">Summary</div>
    <div slTab value="items" href="/order/items">Items</div>
  </div>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An unbroken digest breaks inside its own tab instead of setting the list’s width, a right-to-left label reads its own way inside a page that reads the other, and a long label scrolls rather than wrapping.',
    snippet: defineSnippet({
      id: 'tabs-angular-content',
      language: 'angular',
      label: 'Long, unbroken and right-to-left',
      source: `<div slTabs defaultValue="a">
  <div slTabList aria-label="Extreme content">
    <div slTab value="a">sha256:9f86d081884c7d659a2feaa0c55ad015</div>
    <div slTab value="b">بيانات التسليم</div>
  </div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the seven decisions an application takes once, render substitutes every root so a list can be a real nav, and the actions slot is where a Toolbar goes.',
    snippet: defineSnippet({
      id: 'tabs-angular-composition',
      language: 'ts',
      label: 'A provider, and the actions slot',
      source: `// One decision for every family in the application, in the bootstrap file.
bootstrapApplication(App, {
  providers: [provideTabsDefaults({ size: 'sm', variant: 'contained' })],
});

// And in a template, the slot beside the list is where a toolbar goes:
// <div slTabActions><div slToolbar aria-label="Actions">…</div></div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The APG table, and where focus lands',
    note: 'Tab enters on the selected tab and leaves to the panel, the arrows of the flow axis move and wrap, Home and End reach the ends, and Delete closes a dismissible tab and moves focus to its neighbour.',
    snippet: defineSnippet({
      id: 'tabs-angular-keyboard',
      language: 'ts',
      label: 'Which device asked, and why',
      source: `export class PanelTabs {
  // 'pointer', 'keyboard' or 'remove' — and request.cancel() refuses the move
  // before anything commits, which is what an unsaved panel needs.
  onValueChange(request: ChangeRequest<string | undefined>) {
    if (this.dirty()) request.cancel();
    else this.reason.set(request.reason);
  }
}`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<string | undefined>',
    when: 'Before the selection moves. The request carries the new value, the previous value (undefined while no tab is selected), the reason (pointer, keyboard, remove or programmatic), the originating event, and cancel(), which keeps the current tab.',
  },
  {
    name: 'tabDismiss',
    payload: 'TabsDismissRequest, which also carries the value being closed',
    when: 'Before a tab is closed, by Delete or by its close button. The request carries the reason (pointer or keyboard) and cancel(), which stops both the dismissal and the selection move that would follow it. Tabs removes nothing itself: remove the tab from your own data.',
  },
  {
    name: 'click, keydown, focus, on each slTab',
    payload: 'the element’s own events',
    when: 'When the tab’s control fires them. A listener bound on the slTab host runs after the tab’s own handler.',
  },
];

export const ANGULAR_TABS_DOCS = {
  tabs: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'slTabs',
        'The value of the selected tab. Passing it makes the selection controlled for the life of the component; without it, slTabs keeps the selection and starts from defaultValue.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slTabs',
        'The value an uncontrolled slTabs starts from, read once. When it is unset, no tab is selected and no panel is shown.',
      ],
      [
        'activation',
        "'automatic' | 'manual'",
        'automatic',
        'slTabs, provideTabsDefaults',
        'Whether moving focus to a tab also selects it. The APG recommends automatic when panels show without a noticeable delay, and manual when a panel has to be fetched.',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slTabs, provideTabsDefaults',
        'Which way the list runs, and so which arrow keys move between tabs. A horizontal list ignores Up and Down, so those keys keep scrolling the page.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slTabs, provideTabsDefaults',
        'The control step of the list: height, type, padding and inner gap, all from the control scales the theme restates per density.',
      ],
      [
        'variant',
        "'line' | 'contained'",
        'line',
        'slTabs, provideTabsDefaults',
        'How the list is drawn. Both variants paint the accent marker, which keeps the selected tab visible in the high-contrast scheme, where every surface is flattened.',
      ],
      [
        'track',
        "'line' | 'none'",
        'line',
        'slTabs, provideTabsDefaults',
        'Whether the list draws the line its tabs stand on. none is for a list placed on a line the page already draws, such as a card header’s edge or a table’s rule, where two hairlines a pixel apart read as one smudge. The marker then sits on the item’s own edge, on the line that is there.',
      ],
      [
        'fit',
        "'auto' | 'equal'",
        'auto',
        'slTabs, provideTabsDefaults',
        'Whether each tab is as wide as its label or takes an equal share of the line. equal cuts a label longer than its share with an ellipsis; auto never cuts a label and scrolls the list instead.',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager'",
        'active',
        'slTabs, provideTabsDefaults',
        'When a panel’s content exists: only while its tab is selected (active), from its first selection on (lazy), or from the start (eager). A panel that is not selected carries the hidden attribute. Angular creates projected content with the page; write a panel’s content in <ng-template slTabPanelContent> for mount to decide when it is created.',
      ],
      [
        'loop',
        'boolean',
        'true',
        'slTabs, provideTabsDefaults',
        'Whether the arrow keys wrap past the ends of the list.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slTabs',
        'Disables every tab with the native attribute, which also makes the arrow keys skip them, and dims the track.',
      ],
      [
        'value, on slTab',
        'string',
        '—',
        'slTab',
        'What this tab selects, and what the value of slTabs holds. It reaches the DOM as data-value, which the keyboard reads.',
      ],
      [
        'disabled, on slTab',
        'boolean',
        'from slTabs, or false',
        'slTab',
        'Disables this tab only, so one tab can be unavailable in a working list. Unset rather than false, so the tab follows slTabs.',
      ],
      [
        'dismissible',
        'boolean',
        'false',
        'slTab',
        'Draws the close button and binds Delete on the tab, announced through aria-keyshortcuts.',
      ],
      [
        'dismissLabel',
        'string',
        '—',
        'slTab',
        'The accessible name of the close button, required whenever it is drawn. Name what closes: “Close customers.sql” rather than “Close”.',
      ],
      [
        'slTabStart',
        'directive',
        '—',
        'an element inside slTab',
        'Marks the content before the label, such as an icon, and places it in the start part beside the words.',
      ],
      [
        'slTabEnd',
        'directive',
        '—',
        'an element inside slTab',
        'Marks the content after the label, such as a badge with a count, and places it in the end part beside the words.',
      ],
      [
        'controls',
        'string',
        '—',
        'slTab',
        'The id of the region this tab controls when it is not a slTabPanel, such as a table the selected value filters. aria-controls names that region.',
      ],
      [
        'href',
        'string',
        '—',
        'slTab',
        'Renders the tab as a link. A plain click selects the tab without navigating; a click with a modifier key is left to the browser, which opens the address in a new browser tab or window.',
      ],
      [
        'value, on slTabPanel',
        'string',
        '—',
        'slTabPanel',
        'The tab this panel belongs to. slTabs wires the pair with ids generated from the value.',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        'slTabs | slTabList | slTab | slTabPanel | slTabActions | slTabStart | slTabEnd',
        '—',
        'every directive',
        'A template reaches an instance by name: #tabs="slTabs" gives a page select(value, reason), the resolved axes and the ids, for a view a router changes.',
      ],
      [
        'the element you write it on',
        'any element',
        '—',
        'every directive',
        'The five roots are directives on your own elements, so a list can be a nav and slTabs a section. The tab control itself cannot be replaced: it holds the role, the value and the keyboard, and href covers the substitution that matters.',
      ],
      [
        'ng-content',
        'projected content',
        '—',
        'slTab, slTabPanel, slTabActions',
        'The label, the panel content and the actions are your own markup. Under mount="active", a closed panel keeps its projected content out of the DOM, but Angular creates projected components with the page.',
      ],
      [
        'slTabPanelContent',
        'ng-template directive',
        '—',
        'a direct child of slTabPanel',
        'Holds a panel’s content as a template that mount instantiates: on selection and destroyed after under active, on first selection and kept under lazy, up front under eager.',
      ],
      [
        'provideTabsDefaults()',
        '{ activation, orientation, size, variant, track, fit, mount, loop }',
        '—',
        'an injector',
        'The eight settings an application decides once, in the bootstrap providers, on a route or on a component. A value set on one slTabs still wins.',
      ],
      [
        'aria-label, on slTabList',
        'string',
        '—',
        'slTabList',
        'The name of the set of views. slTabs writes no name of its own; aria-labelledby works the same way.',
      ],
    ]),
    accessibility: [
      'Tabs implements the WAI-ARIA APG Tabs pattern (w3.org/WAI/ARIA/apg/patterns/tabs/) and its whole keyboard table: Tab enters the list on the selected tab and leaves to the panel, the arrow keys of the list’s direction move focus and wrap at both ends, Home and End reach the first and last enabled tab, Enter and Space select under manual activation, and Delete closes a dismissible tab. A horizontal list does not listen for Up and Down, so those keys keep scrolling the page while focus is in the list.',
      'After a dismissal, focus follows the pattern: the next tab, the previous one when the closed tab was last, or the list itself when no tab is left, which is why the list carries tabindex="-1". The selection follows the same rule, with the reason remove.',
      'The close button is outside the arrow-key sequence and inside the accessibility tree. A screen reader reaches and presses it; from the keyboard, Delete closes the focused tab, and the tab announces the key with aria-keyshortcuts. In the arrow-key sequence, close buttons would double the presses it takes to cross the list.',
      'The paging controls are aria-hidden and outside the Tab sequence, because the arrow keys reach every tab and scroll it into view. Cloudscape’s guidance warns against extra Tab stops between a tab list and its panel.',
      'A list that starts to overflow scrolls the selected tab into view once its paging controls are drawn, so the selected tab is not left behind the end control.',
      'Each tab names its panel with aria-controls and each panel names its tab with aria-labelledby. The ids come from the value, with the characters an id cannot hold escaped rather than replaced, so two values that differ only by a space never share a panel.',
      'The selected tab is never shown by colour alone: the marker is a bar never thinner than a thick border, which stays visible in the high-contrast scheme, where the theme paints every surface Canvas and the fill of the contained variant disappears.',
      'A panel carries tabindex="0", so the Tab key reaches it from the list. The pattern permits that stop even when the panel’s first content is focusable.',
    ],
    snippets: [
      defineSnippet({
        id: 'tabs-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="tabs"
  data-part="root"
  data-size="md"
  data-variant="line"
  data-orientation="horizontal"
  data-fit="auto"
  data-activation-direction="forward"
>
  <div data-part="list" role="tablist" aria-label="Order" tabindex="-1">
    <div data-part="item" role="presentation" data-selected>
      <button data-part="tab" role="tab" id="t-a" aria-controls="p-a" aria-selected="true">
        <span data-part="label">Summary</span>
      </button>
      <button data-part="dismiss" tabindex="-1" aria-label="Close Summary"></button>
    </div>
    <span data-part="marker" aria-hidden="true" data-moving></span>
  </div>
  <div data-part="actions">…</div>
  <div data-part="panel" role="tabpanel" id="p-a" aria-labelledby="t-a" tabindex="0">…</div>
</div>`,
      }),
      defineSnippet({
        id: 'tabs-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='tabs'] {
  --slotted-tabs-gap: var(--slotted-space-8);
  --slotted-tabs-marker-color: var(--slotted-tone-success-solid);
  --slotted-tabs-selected-color: var(--slotted-tone-success-text);
  --slotted-tabs-track-color: var(--slotted-border-strong);
}`,
      }),
    ],
  },
} as const;
