import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import toolbarTokens from '@slotted/styles/toolbar/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TOOLBAR_TOKENS = toolbarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toolbar decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Toolbar, ToolbarDefaultsProvider, ToolbarGroup, ToolbarItem, ToolbarOverflow, ToolbarSeparator, ToolbarSpacer } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[role="toolbar"], or the element render returns',
    required: true,
    purpose:
      'The bar. Carries data-ui="toolbar", the four axes, aria-orientation when vertical, and the label the consumer wrote. It writes the roving tabindex on every focusable control inside it, which is what makes the whole bar one tab stop.',
  },
  {
    part: 'group',
    element: 'div[role="group"]',
    required: false,
    purpose:
      'A run of related controls with a name of its own. The distance inside it is half the bar’s gap and the distance around it is a gap and a half, so the boundary between two groups reads wider than the one between two controls. The arrows do not stop at its edge.',
  },
  {
    part: 'separator',
    element: 'div[role="separator"]',
    required: false,
    purpose:
      'A hairline between two runs, with aria-orientation perpendicular to the bar. It is a part of this family rather than a Divider, because its geometry is measured against the controls beside it.',
  },
  {
    part: 'spacer',
    element: 'div',
    required: false,
    purpose:
      'The free space between two runs, so what follows sits at the end of the bar. It replaces a justify axis: an axis decides where every control sits, and a bar needs one boundary.',
  },
  {
    part: 'item',
    element: 'div',
    required: false,
    purpose:
      'One unit the bar may give up under overflow="menu", carrying what its control becomes in the surface. A unit is a direct child of the root, which is deliberately not the same thing as an item: the keyboard finds items by being focusable at any depth, and the collapse acts on the boxes the bar lays out. A ButtonGroup inside one of these is one unit and four items.',
  },
  {
    part: 'overflow',
    element: 'button, from the Menu family’s own trigger',
    required: false,
    purpose:
      'The control that opens what did not fit. It prints U+2026, its accessible name carries the count, and the bar writes hidden on it while nothing has given way — the same measurement that decides whether it is needed is the one that reveals it to read its width. On a coarse pointer it is the comfortable target wide as well as tall.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bar with every axis on it, driven by the controls below the canvas. Tab into it once, then use the arrows: the whole bar is a single stop however many controls it holds.',
    snippet: defineSnippet({
      id: 'toolbar-react-playground',
      language: 'tsx',
      label: 'A set of controls, one tab stop',
      source: `<Toolbar aria-label="Formatting">
  <Button variant="ghost">Bold</Button>
  <Button variant="ghost">Italic</Button>
  <ToolbarSeparator />
  <Button variant="ghost">Link</Button>
</Toolbar>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'Which way the bar runs',
    note: 'A horizontal bar centres its controls and a vertical one stretches them, because a column at each control’s natural width is a ragged edge; the separator and the group boundary turn with it.',
    snippet: defineSnippet({
      id: 'toolbar-react-orientation',
      language: 'tsx',
      label: 'A row of controls, and a column of them',
      source: `<Toolbar aria-label="Tools" orientation="vertical">
  <Button variant="ghost">Pencil</Button>
  <Button variant="ghost">Brush</Button>
  <ToolbarSeparator />
  <Button variant="ghost">Borracha</Button>
</Toolbar>;`,
    }),
  },
  {
    id: 'variant',
    title: 'Whether the bar paints a ground',
    note: 'plain is the default and paints nothing: a bar inside a card header is already standing on a surface. outline frames it, and pads itself by at least the reach of a focus ring so the two never meet.',
    snippet: defineSnippet({
      id: 'toolbar-react-variant',
      language: 'tsx',
      label: 'Plain, and framed',
      source: `<Toolbar aria-label="Sem moldura" variant="plain" />;
<Toolbar aria-label="Com moldura" variant="outline" />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the bar sits at',
    note: 'The size moves the bar’s own inset, gap and separator inset and never the controls inside it, which is what lets one bar hold a small icon button beside a medium select.',
    snippet: defineSnippet({
      id: 'toolbar-react-sizes',
      language: 'tsx',
      label: 'Three steps of bar, one step of control',
      source: `<Toolbar aria-label="Compacta" size="sm">
  <Button size="sm" variant="ghost">
    Recortar
  </Button>
</Toolbar>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Runs that belong together',
    note: 'A group carries a name a screen reader announces and a boundary the eye reads, and a rule draws the same boundary the other way — which is what keeps a destructive action off a frequent one.',
    snippet: defineSnippet({
      id: 'toolbar-react-groups',
      language: 'tsx',
      label: 'A named run, a rule, and a spacer',
      source: `<Toolbar aria-label="Selection" variant="outline">
  <ToolbarGroup aria-label="Alignment">
    <Button variant="outline">Start</Button>
    <Button pressed variant="outline">
      Center
    </Button>
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarSpacer />
  <Button tone="danger">Delete</Button>
</Toolbar>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The APG table, and where focus lands',
    note: 'Tab enters the bar once and returns to the control that last had focus; the arrows of the flow axis move and wrap, the cross axis duplicates them, and Home and End reach the ends.',
    snippet: defineSnippet({
      id: 'toolbar-react-keyboard',
      language: 'tsx',
      label: 'Nothing to write: the bar writes the tabindex',
      source: `// Every focusable control inside the bar is an item, found in the DOM
// rather than wrapped in a component of its own — so this library's own
// families, and a consumer's own control, drop in unwrapped.
<Toolbar aria-label="Formatting">
  <Button variant="ghost">Bold</Button>
  <Checkbox>Grid</Checkbox>
  <Link href="/ajuda">Ajuda</Link>
</Toolbar>;`,
    }),
  },
  {
    id: 'keyOwners',
    title: 'An item that keeps the arrows',
    note: 'A text field needs the inline arrows for its caret, so the bar leaves them to it and focus moves out on the cross axis instead — the APG’s advice for the author, written as behaviour.',
    snippet: defineSnippet({
      id: 'toolbar-react-key-owners',
      language: 'tsx',
      label: 'The caret keeps its keys',
      source: `<Toolbar aria-label="Filtro">
  <Button variant="outline">Todos</Button>
  <ToolbarSpacer />
  {/* Inferred from the kind of control; data-toolbar-keys states it where
      the kind cannot say — "none", "inline", "block" or "all". */}
  <TextField aria-label="Buscar" type="search" />
</Toolbar>;`,
    }),
  },
  {
    id: 'disabled',
    title: 'A bar out of action',
    note: 'A fieldset around the bar disables every control inside it natively, and because a natively disabled control cannot be focused, the arrows skip exactly those — the platform answers it in two lines.',
    snippet: defineSnippet({
      id: 'toolbar-react-disabled',
      language: 'tsx',
      label: 'The element that can actually do it',
      source: `<fieldset disabled={readOnly}>
  <Toolbar aria-label="Read-only">
    <Button variant="outline">Edit</Button>
    <ToolbarSeparator />
    <Button tone="danger">Delete</Button>
  </Toolbar>
</fieldset>;`,
    }),
  },
  {
    id: 'overflow',
    title: 'More controls than room',
    note: 'wrap keeps every control visible on a second row, and the arrows wrap from row to row because the item list is linear; scroll keeps the bar to one line and scrolls past its controls rather than squeezing them.',
    snippet: defineSnippet({
      id: 'toolbar-react-overflow',
      language: 'tsx',
      label: 'Two answers, and the third arrives with menu',
      source: `<Toolbar aria-label="Many actions" overflow="wrap" />;
<Toolbar aria-label="Many actions, scrolling" overflow="scroll" />;`,
    }),
  },
  {
    id: 'overflowMenu',
    title: 'What is left over, behind one control',
    note: 'The bar measures its own width and gives way from the end, so what holds it gives it a width that does not come from the bar’s content: a bar as wide as what it shows is the trigger alone after a fold, and never sees the room come back. What stays visible is what has nowhere to go: an item that declares no counterpart cannot be hidden, which is how the primary action survives without a priority ranking it above the others.',
    snippet: defineSnippet({
      id: 'toolbar-react-overflow-menu',
      language: 'tsx',
      label: 'A bar that gives way from the end',
      source: `<Toolbar aria-label="Documento" overflow="menu">
  {/* No counterpart, so it is pinned: the primary action stays visible. */}
  <ToolbarItem>
    <Button tone="accent">Publicar</Button>
  </ToolbarItem>
  <ToolbarSeparator />
  <ToolbarItem counterpart={<MenuItem>Duplicar</MenuItem>}>
    <Button variant="ghost">Duplicar</Button>
  </ToolbarItem>
  <ToolbarItem counterpart={<MenuItem>Arquivar</MenuItem>}>
    <Button variant="ghost">Arquivar</Button>
  </ToolbarItem>
  <ToolbarOverflow />
</Toolbar>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and standing beside other families',
    note: 'The provider carries the five decisions an application takes once, and the bar is what belongs in a tab list’s actions slot — one tab stop for however many actions the page puts there.',
    snippet: defineSnippet({
      id: 'toolbar-react-composition',
      language: 'tsx',
      label: 'A provider, and a bar inside a tab list',
      source: `<ToolbarDefaultsProvider size="sm" variant="outline">
  <Tabs defaultValue="summary">
    <TabList aria-label="Order">
      <Tab value="summary">Summary</Tab>
    </TabList>
    <TabActions>
      <Toolbar aria-label="Order actions">
        <Button variant="ghost">Export</Button>
      </Toolbar>
    </TabActions>
  </Tabs>
</ToolbarDefaultsProvider>;`,
    }),
  },
];

export const REACT_TOOLBAR_DOCS = {
  toolbar: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Toolbar, ToolbarDefaultsProvider',
        'Which way the bar runs, and therefore which arrow pair moves between the controls. A vertical bar also writes aria-orientation, which the role’s own default makes unnecessary for a horizontal one',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Toolbar, ToolbarDefaultsProvider',
        'The bar’s own inset, gap and separator inset, from the control scales. It never touches the controls inside it: a bar that resized another family’s control would own state it cannot see',
      ],
      [
        'variant',
        "'plain' | 'outline'",
        'plain',
        'Toolbar, ToolbarDefaultsProvider',
        'Whether the bar paints a ground and a frame. An outline bar pads itself by at least the reach of a focus ring, so a focused control never sits on the bar’s own edge',
      ],
      [
        'overflow',
        "'wrap' | 'scroll' | 'menu'",
        'wrap',
        'Toolbar, ToolbarDefaultsProvider',
        'What a bar does with more controls than it has room for. wrap keeps every control on a second row, scroll is one line the arrows reveal, and menu is one line whose units give way from the end into a surface. A menu bar with no ToolbarOverflow in it has nothing to give way to, so it scrolls',
      ],
      [
        'onOverflowChange',
        '(hidden: number) => void',
        '—',
        'Toolbar',
        'How many units gave way, once per change. There is no controlled pair over the collapsed set: it is a measurement, and a consumer who owned it could assert that a bar fits when the layout says it does not',
      ],
      [
        'counterpart',
        'ReactNode',
        '—',
        'ToolbarItem, ToolbarGroup',
        'What the unit becomes in the surface when the bar has no room for it. A unit that declares none is pinned — pinning is the absence of a counterpart rather than a second prop, so the two can never disagree. It is not called overflow, because that word is the bar’s own axis',
      ],
      [
        'label',
        'string | ((hidden: number) => string)',
        'counted',
        'ToolbarOverflow',
        'The accessible name of the control that holds what did not fit. The default counts — "3 more actions" — because three dots say nothing about how much is behind them. It is a sentence of the language in force, with its plural, and label replaces it',
      ],
      [
        'align, side, size',
        'MenuAlign | MenuSide | MenuSize',
        'from the Menu defaults',
        'ToolbarOverflow',
        'Where the surface sits against the trigger, and its own measure. Everything else about the layer an application sets once with MenuDefaultsProvider: a second configuration surface over the same layer would be two answers to one question',
      ],
      [
        'loop',
        'boolean',
        'true',
        'Toolbar, ToolbarDefaultsProvider',
        'Whether the arrows wrap past the ends of the bar',
      ],
      [
        'aria-label',
        'string',
        '—',
        'Toolbar, ToolbarGroup',
        'The name of the bar, and of each group. The family writes neither: only the page knows what the set of controls is for. aria-labelledby works the same way',
      ],
      [
        'data-toolbar-keys',
        "'none' | 'inline' | 'block' | 'all'",
        'inferred',
        'any item',
        'Which keys an item keeps for itself. A text entry, a select, a slider, a spin button and a contenteditable keep the flow axis without stating anything; this is how a control the kind cannot describe says so',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Toolbar, ToolbarGroup, ToolbarItem, ToolbarOverflow, ToolbarSeparator, ToolbarSpacer',
        'Substitutes any of the six roots and hands it every attribute — a bar can be a nav, a rule an hr, and the overflow trigger the consumer’s own IconButton with the Menu wiring on it',
      ],
      [
        'menuRef',
        'Ref<MenuHandle>',
        '—',
        'ToolbarOverflow',
        'Reaches the surface’s imperative actions — open, close and focus — which belong to the Menu family rather than to this one',
      ],
      [
        'useToolbarOverflow',
        '() => { collapsed, counterpart }',
        '—',
        'inside Toolbar',
        'What the parts read: the units that gave way, in the order the bar held them, and what each one becomes. A consumer’s own trigger reads the same value',
      ],
      [
        'ref',
        'Ref<HTMLDivElement>',
        '—',
        'Toolbar and every part',
        'Reaches the element itself. No imperative handle is invented: focus() on the control a page wants to start from is the platform’s own',
      ],
      [
        'items',
        'any focusable descendant',
        '—',
        'inside Toolbar',
        'Anything focusable is an item, found in the DOM: this library’s button, link, checkbox, switch and text-field, a menu trigger, or a consumer’s own control. An element that cannot hold focus is not reachable by the arrows',
      ],
      [
        'ToolbarDefaultsProvider',
        '{ orientation, size, variant, overflow, loop }',
        '—',
        'a subtree',
        'The five decisions an application takes once. A bar that states any of them itself still wins',
      ],
      [
        'fieldset',
        'the platform’s own element',
        '—',
        'around a Toolbar',
        'How a bar is taken out of action. A container cannot disable controls it does not own, and a bar that refused interaction while its controls still looked operable is the defect the state precedence exists to prevent',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Toolbar (w3.org/WAI/ARIA/apg/patterns/toolbar/): the bar is one tab stop, entry lands on the control that last had focus or on the first that is not disabled, the arrows of the flow axis move between the controls and wrap — from row to row when the bar wrapped — and Home and End reach the ends. The cross axis duplicates the pair, which the pattern permits.',
      'The APG asks an author to avoid controls whose operation needs the navigation arrows and, failing that, to place one such control last. The bar enforces it instead: a text entry, a select, a slider, a spin button and a contenteditable keep the keys of the flow axis, and focus leaves them on the cross axis or with Tab.',
      'A control that announces aria-disabled keeps its place in the ring, which the pattern allows where discoverability of a function is crucial and which is what Button’s focusableWhenDisabled renders. A control carrying the native attribute is skipped, because the platform will not focus it either — including every control inside a disabled fieldset.',
      'The bar names itself with the consumer’s aria-label or aria-labelledby, and each group names itself the same way. The pattern uses the role for three or more controls; that is documented rather than enforced, because a role that disappeared when a permission filter removed a button would be a semantic changing behind the author.',
      'Under overflow="menu" the control that holds what did not fit is a control of the bar like any other: the arrows, Home and End reach it, and it leaves the ring the moment the bar has room for everything, because a hidden control cannot hold focus. Its name carries the count rather than the mark, and focus is moved onto it before the control under focus is hidden — so a reader who was on the fifth button lands on the control that now holds it rather than on the document body.',
      'Nothing in the bar is painted over: every control keeps its own states, its own focus ring and its own contrast. What the bar adds is the boundary between runs — a group, a rule, a spacer — and under forced colours the rule keeps its own paint, because a background flattens to Canvas and would take the boundary with it.',
    ],
    snippets: [
      defineSnippet({
        id: 'toolbar-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="toolbar"
  data-part="root"
  role="toolbar"
  aria-label="Selection"
  data-orientation="horizontal"
  data-size="md"
  data-variant="outline"
  data-overflow="menu"
  data-collapsed="1"
>
  <div data-part="group" role="group" aria-label="Alignment">
    <button tabindex="0">Start</button>
    <button tabindex="-1">Center</button>
  </div>
  <div data-part="separator" role="separator" aria-orientation="vertical" />
  <div data-part="spacer" aria-hidden="true" />
  <div data-part="item" data-unit="«r3»">
    <button tabindex="-1">Delete</button>
  </div>
  <div data-part="item" data-unit="«r4»" hidden>
    <button tabindex="-1">Arquivar</button>
  </div>
  <button data-part="overflow" type="button" tabindex="-1" aria-label="1 more action">
    <span data-ui="icon" data-part="root" aria-hidden="true">
      <svg data-part="glyph" data-glyph="ellipsis" />
    </span>
  </button>
</div>;`,
      }),
      defineSnippet({
        id: 'toolbar-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='toolbar'] {
  --slotted-toolbar-gap: var(--slotted-space-5);
  --slotted-toolbar-inset: var(--slotted-space-4);
  --slotted-toolbar-separator-color: var(--slotted-border-subtle);
  --slotted-toolbar-background: var(--slotted-surface-sunken);
  --slotted-toolbar-overflow-color: var(--slotted-text);
  --slotted-toolbar-overflow-hover-background: var(--slotted-tone-accent-subtle-hover);
}`,
      }),
    ],
  },
} as const;
