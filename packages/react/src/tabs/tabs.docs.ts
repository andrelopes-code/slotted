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

export const REACT_TABS_TOKENS = tabsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tabs decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Tab, TabActions, TabList, TabPanel, Tabs, TabsDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The Tabs root: a grid of four columns and two rows that carries data-ui="tabs", the axes (data-size, data-variant, data-track, data-orientation, data-fit), data-disabled, data-overflowing and data-activation-direction. It renders the two paging controls itself, because it observes whether the list overflows.',
  },
  {
    part: 'list',
    element: 'div[role="tablist"], or the element render returns',
    required: true,
    purpose:
      'The scroll container, and the single Tab stop of the list. Name it with aria-label or aria-labelledby: Tabs writes neither, because only the page knows what the set of views is for.',
  },
  {
    part: 'item',
    element: 'div[role="presentation"], or the element the render of Tab returns',
    required: true,
    purpose:
      'One tab and its optional close button. It exists because a button cannot contain a button, and it carries the hover bar under the tab. className and style reach it.',
  },
  {
    part: 'tab',
    element: 'button[role="tab"], or a[role="tab"] with href',
    required: true,
    purpose:
      'The control. It holds aria-selected, aria-controls, the generated id and data-value, which the keyboard reads. Every other native prop and the ref reach it.',
  },
  {
    part: 'start',
    element: 'span',
    required: false,
    purpose:
      'The content of start, before the label: an icon, as a flex item of the tab that never shrinks and that sizes an icon to the tab’s icon step.',
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
    element: 'span',
    required: false,
    purpose:
      'The content of end, after the label: a count or a status, as a flex item of the tab that never shrinks.',
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
    element: 'div[role="tabpanel"]',
    required: true,
    purpose:
      'The content of one tab, with aria-labelledby pointing at its tab and tabindex="0". It carries the hidden attribute while another tab is selected. The panel element always exists, so every tab’s aria-controls names an element; mount decides whether its content exists.',
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
    element: 'div, or the element render returns',
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
      id: 'tabs-react-playground',
      language: 'tsx',
      label: 'A set of views over one panel',
      source: `<Tabs defaultValue="summary">
  <TabList aria-label="Order">
    <Tab value="summary">Summary</Tab>
    <Tab value="items">Items</Tab>
  </TabList>
  <TabPanel value="summary">Delivery expected on September 12.</TabPanel>
  <TabPanel value="items">Three items.</TabPanel>
</Tabs>;`,
    }),
  },
  {
    id: 'activation',
    title: 'Whether focus selects',
    note: 'Automatic is the APG’s recommendation for panels that are already loaded; manual moves focus and waits for Enter or Space, which is what a panel that fetches needs.',
    snippet: defineSnippet({
      id: 'tabs-react-activation',
      language: 'tsx',
      label: 'Selection following focus, and not',
      source: `<Tabs activation="automatic" defaultValue="a" />;
<Tabs activation="manual" defaultValue="a" />;`,
    }),
  },
  {
    id: 'orientation',
    title: 'Which way the list runs',
    note: 'A horizontal list scrolls and refuses the up and down arrows, so the page keeps scrolling with focus inside it; a vertical one stacks, turns the track and the marker, and announces aria-orientation.',
    snippet: defineSnippet({
      id: 'tabs-react-orientation',
      language: 'tsx',
      label: 'A row of views, and a column of them',
      source: `<Tabs defaultValue="a" orientation="vertical">
  <TabList aria-label="Settings">
    <Tab value="a">Profile</Tab>
    <Tab value="b">Notifications</Tab>
  </TabList>
  <TabPanel value="a">Name and photo.</TabPanel>
  <TabPanel value="b">Email notices.</TabPanel>
</Tabs>;`,
    }),
  },
  {
    id: 'variant',
    title: 'The two ways a list is drawn',
    note: 'Line is a row of labels over a hairline; contained is a sunken track holding a surface per tab; and track="none" keeps the labels and drops the hairline, for a list standing on a line the page already drew. All three keep the accent marker, which is what survives the high-contrast scheme after every surface flattens.',
    snippet: defineSnippet({
      id: 'tabs-react-variant',
      language: 'tsx',
      label: 'Line, contained, and no line at all',
      source: `<Tabs defaultValue="a" variant="line" />;
<Tabs defaultValue="a" variant="contained" />;

// Standing on a line the page already drew — a card header, a table's rule.
<Tabs defaultValue="a" track="none" />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the list sits at',
    note: 'Height, type, padding and the inner gap all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
    snippet: defineSnippet({
      id: 'tabs-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<Tabs defaultValue="a" size="sm" />;
<Tabs defaultValue="a" size="md" />;
<Tabs defaultValue="a" size="lg" />;`,
    }),
  },
  {
    id: 'fit',
    title: 'How the line is divided',
    note: 'auto makes each tab as wide as its label and scrolls what does not fit; equal divides the line between them and is the one place a horizontal label is ever truncated.',
    snippet: defineSnippet({
      id: 'tabs-react-fit',
      language: 'tsx',
      label: 'As wide as the label, or an equal share',
      source: `<Tabs defaultValue="a" fit="auto" />;
<Tabs defaultValue="a" fit="equal" variant="contained" />;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family paints',
    note: 'A tab that is not selected raises its ink on hover. In the line variant a neutral bar appears where the mark would go and darkens on press; in the contained variant the cell fills instead. A selected one does neither, because it is already at full strength. Disabled is the native attribute, which is also what makes the browser skip it.',
    snippet: defineSnippet({
      id: 'tabs-react-states',
      language: 'tsx',
      label: 'One tab out of reach, and a whole family',
      source: `<Tabs defaultValue="a">
  <TabList aria-label="Order">
    <Tab value="a">Available</Tab>
    <Tab disabled value="b">
      Unavailable
    </Tab>
  </TabList>
  <TabPanel value="a">…</TabPanel>
</Tabs>;

<Tabs defaultValue="a" disabled />;`,
    }),
  },
  {
    id: 'mount',
    title: 'When a panel exists',
    note: 'active builds the panel on selection and drops it after, lazy keeps it once built, eager builds every one up front. A panel holding a table or a chart is the reason the default is active.',
    snippet: defineSnippet({
      id: 'tabs-react-mount',
      language: 'tsx',
      label: 'Three strategies, one axis',
      source: `<Tabs defaultValue="a" mount="active" />;
<Tabs defaultValue="a" mount="lazy" />;
<Tabs defaultValue="a" mount="eager" />;`,
    }),
  },
  {
    id: 'dismissible',
    title: 'Tabs a reader can close',
    note: 'Delete closes the focused tab and the pointer closes it from the control; the family then asks for the neighbour — the following tab, or the preceding one when the closed tab was last — and removes nothing itself.',
    snippet: defineSnippet({
      id: 'tabs-react-dismissible',
      language: 'tsx',
      label: 'The consumer owns the collection',
      source: `<Tabs
  onTabDismiss={(value) => setQueries((open) => open.filter((query) => query !== value))}
  onValueChange={setActive}
  value={active}
>
  <TabList aria-label="Queries">
    {queries.map((query) => (
      <Tab dismissLabel={\`Close \${query}\`} dismissible key={query} value={query}>
        {query}
      </Tab>
    ))}
  </TabList>
</Tabs>;`,
    }),
  },
  {
    id: 'overflow',
    title: 'A list that does not fit',
    note: 'The list scrolls rather than wrapping or truncating, two paging controls appear only while there is somewhere to scroll, and the arrow keys bring each tab into view as focus reaches it.',
    snippet: defineSnippet({
      id: 'tabs-react-overflow',
      language: 'tsx',
      label: 'Twenty views in a narrow column',
      source: `// Nothing to write: the list scrolls, the controls appear when they are
// needed, and the selected tab is brought into view on every change.
<Tabs defaultValue="v1">
  <TabList aria-label="Versions">{versions.map(renderTab)}</TabList>
</Tabs>;`,
    }),
  },
  {
    id: 'links',
    title: 'A view a router can deep-link to',
    note: 'href makes the control an anchor, so the destination is real: a plain click selects, and a click carrying a modifier key is left to the browser, which opens the view in a new browser tab. usePressSelection paints the press before the route renders: the tab is selected at once, and the navigation runs after the frame that shows it.',
    snippet: defineSnippet({
      id: 'tabs-react-links',
      language: 'tsx',
      label: 'Selection and navigation in one control',
      source: `const { selected, select } = usePressSelection(view);

<Tabs onValueChange={(value) => select(value, () => navigate(\`/order/\${value}\`))} value={selected}>
  <TabList aria-label="Order">
    <Tab href="/order/summary" value="summary">
      Summary
    </Tab>
    <Tab href="/order/items" value="items">
      Items
    </Tab>
  </TabList>
</Tabs>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An unbroken digest breaks inside its own tab instead of setting the list’s width, a right-to-left label reads its own way inside a page that reads the other, and a long label scrolls rather than wrapping.',
    snippet: defineSnippet({
      id: 'tabs-react-content',
      language: 'tsx',
      label: 'Long, unbroken and right-to-left',
      source: `<Tabs defaultValue="a">
  <TabList aria-label="Extreme content">
    <Tab value="a">sha256:9f86d081884c7d659a2feaa0c55ad015</Tab>
    <Tab value="b">بيانات التسليم</Tab>
  </TabList>
</Tabs>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the seven decisions an application takes once, render substitutes every root so a list can be a real nav, and the actions slot is where a Toolbar goes.',
    snippet: defineSnippet({
      id: 'tabs-react-composition',
      language: 'tsx',
      label: 'A provider, a nav, and a toolbar beside the list',
      source: `<TabsDefaultsProvider size="sm" variant="contained">
  <Tabs defaultValue="a" render={(props) => <section {...props} />}>
    <TabList aria-label="Order" render={(props) => <nav {...props} />} />
    <TabActions>
      <Toolbar aria-label="Order actions" size="sm">
        <Button variant="ghost">Export</Button>
      </Toolbar>
    </TabActions>
  </Tabs>
</TabsDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The APG table, and where focus lands',
    note: 'Tab enters on the selected tab and leaves to the panel, the arrows of the flow axis move and wrap, Home and End reach the ends, and Delete closes a dismissible tab and moves focus to its neighbour.',
    snippet: defineSnippet({
      id: 'tabs-react-keyboard',
      language: 'tsx',
      label: 'Which device asked, and why',
      source: `<Tabs
  defaultValue="a"
  onValueChange={(value, request) => {
    // 'pointer', 'keyboard' or 'remove' — and request.cancel() refuses the
    // move before anything commits, which is what an unsaved panel needs.
    setReason(request.reason);
  }}
/>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string | undefined>)',
    when: 'Before the selection moves. The request carries the new value, the previous value (undefined while no tab is selected), the reason (pointer, keyboard, remove or programmatic), the originating event, and cancel(), which keeps the current tab.',
  },
  {
    name: 'onTabDismiss',
    payload: '(value: string, request: TabsDismissRequest)',
    when: 'Before a tab is closed, by Delete or by its close button. The request carries the reason (pointer or keyboard) and cancel(), which stops both the dismissal and the selection move that would follow it. Tabs removes nothing itself: remove the tab from your own data.',
  },
  {
    name: 'onClick, onKeyDown, onFocus, on each Tab',
    payload: 'the element’s own events',
    when: 'When the tab’s control fires them. Your handler runs first, and preventDefault() in onClick also stops the selection.',
  },
];

export const REACT_TABS_DOCS = {
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
        'Tabs',
        'The value of the selected tab. Passing it makes the selection controlled for the life of the component; without it, Tabs keeps the selection and starts from defaultValue.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'Tabs',
        'The value an uncontrolled Tabs starts from, read once. When it is unset, no tab is selected and no panel is shown.',
      ],
      [
        'activation',
        "'automatic' | 'manual'",
        'automatic',
        'Tabs, TabsDefaultsProvider',
        'Whether moving focus to a tab also selects it. The APG recommends automatic when panels show without a noticeable delay, and manual when a panel has to be fetched.',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Tabs, TabsDefaultsProvider',
        'Which way the list runs, and so which arrow keys move between tabs. A horizontal list ignores Up and Down, so those keys keep scrolling the page.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Tabs, TabsDefaultsProvider',
        'The control step of the list: height, type, padding and inner gap, all from the control scales the theme restates per density.',
      ],
      [
        'variant',
        "'line' | 'contained'",
        'line',
        'Tabs, TabsDefaultsProvider',
        'How the list is drawn. Both variants paint the accent marker, which keeps the selected tab visible in the high-contrast scheme, where every surface is flattened.',
      ],
      [
        'track',
        "'line' | 'none'",
        'line',
        'Tabs, TabsDefaultsProvider',
        'Whether the list draws the line its tabs stand on. none is for a list placed on a line the page already draws, such as a card header’s edge or a table’s rule, where two hairlines a pixel apart read as one smudge. The marker then sits on the item’s own edge, on the line that is there.',
      ],
      [
        'fit',
        "'auto' | 'equal'",
        'auto',
        'Tabs, TabsDefaultsProvider',
        'Whether each tab is as wide as its label or takes an equal share of the line. equal cuts a label longer than its share with an ellipsis; auto never cuts a label and scrolls the list instead.',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager'",
        'active',
        'Tabs, TabsDefaultsProvider',
        'When a panel’s content exists: only while its tab is selected (active), from its first selection on (lazy), or from the start (eager). A panel that is not selected carries the hidden attribute.',
      ],
      [
        'deferPanels',
        'boolean',
        'true under mount="active", false otherwise',
        'Tabs',
        'Whether the panels render from useDeferredValue(value). The selected tab paints in the click’s frame and its panel renders after it; until it is ready the panel on screen stays, with aria-busy and data-pending. A panel that suspends keeps the shown one when its Suspense boundary is outside Tabs; a boundary inside the new panel shows its own fallback.',
      ],
      [
        'loop',
        'boolean',
        'true',
        'Tabs, TabsDefaultsProvider',
        'Whether the arrow keys wrap past the ends of the list.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Tabs',
        'Disables every tab with the native attribute, which also makes the arrow keys skip them, and dims the track.',
      ],
      [
        'value, on Tab',
        'string',
        '—',
        'Tab',
        'What this tab selects, and what the value of Tabs holds. It reaches the DOM as data-value, which the keyboard reads.',
      ],
      [
        'disabled, on Tab',
        'boolean',
        'from Tabs, or false',
        'Tab',
        'Disables this tab only, so one tab can be unavailable in a working list. Unset rather than false, so the tab follows Tabs.',
      ],
      [
        'dismissible',
        'boolean',
        'false',
        'Tab',
        'Draws the close button and binds Delete on the tab, announced through aria-keyshortcuts.',
      ],
      [
        'dismissLabel',
        'string',
        '—',
        'Tab',
        'The accessible name of the close button, required whenever it is drawn. Name what closes: “Close customers.sql” rather than “Close”.',
      ],
      [
        'start',
        'ReactNode',
        '—',
        'Tab',
        'Content before the label, such as an Icon, placed in the start part beside the words.',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'Tab',
        'Content after the label, such as a Badge with a count, placed in the end part beside the words.',
      ],
      [
        'controls',
        'string',
        '—',
        'Tab',
        'The id of the region this tab controls when it is not a TabPanel, such as a table the selected value filters. aria-controls names that region.',
      ],
      [
        'href',
        'string',
        '—',
        'Tab',
        'Renders the tab as a link. A plain click selects the tab without navigating; a click with a modifier key is left to the browser, which opens the address in a new browser tab or window.',
      ],
      [
        'value, on TabPanel',
        'string',
        '—',
        'TabPanel',
        'The tab this panel belongs to. Tabs wires the pair with ids generated from the value.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Tabs, TabList, Tab, TabPanel, TabActions',
        'Replaces the root element of any of the five and passes it every attribute, so a list can be a nav and Tabs a section. The tab control itself cannot be replaced: it holds the role, the value and the keyboard, and href covers the substitution that matters.',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'Tab, TabPanel, Tabs',
        'On Tab, reaches the tab’s own control, so focus() and click() are the element’s own methods and no imperative handle stands in for them.',
      ],
      [
        'useTabs()',
        '() => TabsContextValue',
        '—',
        'inside Tabs',
        'What a tab and a panel read: the value, shownValue (the value the panels render, deferred under deferPanels), the mount strategy, the ids, and select(value, reason, source) for a view the page changes on its own. A region rendered outside the panels — a page header’s tab with controls= — renders from shownValue. It throws outside Tabs instead of rendering a control that looks right and does nothing.',
      ],
      [
        'TabsDefaultsProvider',
        '{ activation, orientation, size, variant, track, fit, mount, loop }',
        '—',
        'a subtree',
        'The eight settings an application decides once. A value set on one Tabs still wins.',
      ],
      [
        'aria-label, on TabList',
        'string',
        '—',
        'TabList',
        'The name of the set of views. Tabs writes no name of its own; aria-labelledby works the same way.',
      ],
    ]),
    accessibility: [
      'Selecting a tab never waits for its panel: keep value urgent and render the region from useDeferredValue(value), which deferPanels does for the panels and useTabs().shownValue hands a region outside them. Wrapping the setter in startTransition delays the marker too.',
      'Tabs implements the WAI-ARIA APG Tabs pattern (w3.org/WAI/ARIA/apg/patterns/tabs/) and its whole keyboard table: Tab enters the list on the selected tab and leaves to the panel, the arrow keys of the list’s direction move focus and wrap at both ends, Home and End reach the first and last enabled tab, Enter and Space select under manual activation, and Delete closes a dismissible tab. A horizontal list does not listen for Up and Down, so those keys keep scrolling the page while focus is in the list.',
      'After a dismissal, focus follows the pattern: the next tab, the previous one when the closed tab was last, or the list itself when no tab is left, which is why the list carries tabindex="-1". The selection follows the same rule, with the reason remove.',
      'The close button is outside the arrow-key sequence and inside the accessibility tree. A screen reader reaches and presses it; from the keyboard, Delete closes the focused tab, and the tab announces the key with aria-keyshortcuts. In the arrow-key sequence, close buttons would double the presses it takes to cross the list.',
      'The paging controls are aria-hidden and outside the Tab sequence, because the arrow keys reach every tab and scroll it into view. Cloudscape’s guidance warns against extra Tab stops between a tab list and its panel.',
      'A list that starts to overflow scrolls the selected tab into view once its paging controls are drawn, so the selected tab is not left behind the end control.',
      'Each tab names its panel with aria-controls and each panel names its tab with aria-labelledby. The ids come from the value, with the characters an id cannot hold escaped rather than replaced, so two values that differ only by a space never share a panel.',
      'The selected tab is never shown by color alone: the marker is a bar never thinner than a thick border, which stays visible in the high-contrast scheme, where the theme paints every surface Canvas and the fill of the contained variant disappears.',
      'A panel carries tabindex="0", so the Tab key reaches it from the list. The pattern permits that stop even when the panel’s first content is focusable.',
    ],
    snippets: [
      defineSnippet({
        id: 'tabs-react-anatomy',
        language: 'tsx',
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
      <button data-part="dismiss" tabindex="-1" aria-label="Close Summary" />
    </div>
    <span data-part="marker" aria-hidden="true" data-moving />
  </div>
  <div data-part="actions">…</div>
  <div data-part="panel" role="tabpanel" id="p-a" aria-labelledby="t-a" tabindex="0">
    …
  </div>
</div>;`,
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
