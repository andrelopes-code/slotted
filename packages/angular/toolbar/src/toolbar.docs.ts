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

export const ANGULAR_TOOLBAR_TOKENS = toolbarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toolbar decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlToolbar, SlToolbarGroup, SlToolbarItem, SlToolbarOverflow, SlToolbarSeparator, SlToolbarSpacer } from '@slotted/angular/toolbar';",
  selector:
    '[slToolbar], [slToolbarGroup], [slToolbarItem], sl-toolbar-overflow, [slToolbarSeparator], [slToolbarSpacer]',
  exportAs:
    'slToolbar, slToolbarGroup, slToolbarItem, slToolbarOverflow, slToolbarSeparator, slToolbarSpacer',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[role="toolbar"] carrying slToolbar',
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
    element: 'div carrying slToolbarItem',
    required: false,
    purpose:
      'One unit the bar may give up under overflow="menu", carrying what its control becomes in the surface. A unit is a direct child of the root, which is deliberately not the same thing as an item: the keyboard finds items by being focusable at any depth, and the collapse acts on the boxes the bar lays out. An slButtonGroup inside one of these is one unit and four items.',
  },
  {
    part: 'overflow',
    element: 'button inside sl-toolbar-overflow, carrying the Menu family’s own trigger',
    required: false,
    purpose:
      'The control that opens what did not fit. It prints U+2026, its accessible name carries the count, and the bar writes hidden on it while nothing has given way — the same measurement that decides whether it is needed is the one that reveals it to read its width. The host is display: contents, so the button is a child of the bar itself. On a coarse pointer it is the comfortable target wide as well as tall.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bar with every axis on it, driven by the controls below the canvas. Tab into it once, then use the arrows: the whole bar is a single stop however many controls it holds.',
    snippet: defineSnippet({
      id: 'toolbar-angular-playground',
      language: 'angular',
      label: 'A set of controls, one tab stop',
      source: `<div slToolbar aria-label="Formatting">
  <button slButton variant="ghost">Bold</button>
  <button slButton variant="ghost">Italic</button>
  <div slToolbarSeparator></div>
  <button slButton variant="ghost">Link</button>
</div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'Which way the bar runs',
    note: 'A horizontal bar centers its controls and a vertical one stretches them, because a column at each control’s natural width is a ragged edge; the separator and the group boundary turn with it.',
    snippet: defineSnippet({
      id: 'toolbar-angular-orientation',
      language: 'angular',
      label: 'A row of controls, and a column of them',
      source: `<div slToolbar aria-label="Tools" orientation="vertical">
  <button slButton variant="ghost">Pencil</button>
  <button slButton variant="ghost">Brush</button>
  <div slToolbarSeparator></div>
  <button slButton variant="ghost">Borracha</button>
</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'Whether the bar paints a ground',
    note: 'plain is the default and paints nothing: a bar inside a card header is already standing on a surface. outline frames it, and pads itself by at least the reach of a focus ring so the two never meet.',
    snippet: defineSnippet({
      id: 'toolbar-angular-variant',
      language: 'angular',
      label: 'Plain, and framed',
      source: `<div slToolbar aria-label="Sem moldura" variant="plain"></div>
<div slToolbar aria-label="Com moldura" variant="outline"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the bar sits at',
    note: 'The size moves the bar’s own inset, gap and separator inset and never the controls inside it, which is what lets one bar hold a small icon button beside a medium select.',
    snippet: defineSnippet({
      id: 'toolbar-angular-sizes',
      language: 'angular',
      label: 'Three steps of bar, one step of control',
      source: `<div slToolbar aria-label="Compacta" size="sm">
  <button slButton size="sm" variant="ghost">Recortar</button>
</div>`,
    }),
  },
  {
    id: 'groups',
    title: 'Runs that belong together',
    note: 'A group carries a name a screen reader announces and a boundary the eye reads, and a rule draws the same boundary the other way — which is what keeps a destructive action off a frequent one.',
    snippet: defineSnippet({
      id: 'toolbar-angular-groups',
      language: 'angular',
      label: 'A named run, a rule, and a spacer',
      source: `<div slToolbar aria-label="Selection" variant="outline">
  <div slToolbarGroup aria-label="Alignment">
    <button slButton variant="outline">Start</button>
    <button slButton variant="outline" pressed>Center</button>
  </div>
  <div slToolbarSeparator></div>
  <div slToolbarSpacer></div>
  <button slButton tone="danger">Delete</button>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The APG table, and where focus lands',
    note: 'Tab enters the bar once and returns to the control that last had focus; the arrows of the flow axis move and wrap, the cross axis duplicates them, and Home and End reach the ends.',
    snippet: defineSnippet({
      id: 'toolbar-angular-keyboard',
      language: 'angular',
      label: 'Nothing to write: the bar writes the tabindex',
      source: `<!-- Every focusable control inside the bar is an item, found in the DOM rather
     than wrapped in a component of its own — so this library's own families,
     and a consumer's own control, drop in unwrapped. -->
<div slToolbar aria-label="Formatting">
  <button slButton variant="ghost">Bold</button>
  <span slCheckbox><input slCheckboxControl type="checkbox" /></span>
  <a slLink href="/ajuda">Ajuda</a>
</div>`,
    }),
  },
  {
    id: 'keyOwners',
    title: 'An item that keeps the arrows',
    note: 'A text field needs the inline arrows for its caret, so the bar leaves them to it and focus moves out on the cross axis instead — the APG’s advice for the author, written as behavior.',
    snippet: defineSnippet({
      id: 'toolbar-angular-key-owners',
      language: 'angular',
      label: 'The caret keeps its keys',
      source: `<div slToolbar aria-label="Filtro">
  <button slButton variant="outline">Todos</button>
  <div slToolbarSpacer></div>
  <!-- Inferred from the kind of control; data-toolbar-keys states it where the
       kind cannot say — "none", "inline", "block" or "all". -->
  <span slTextField><input slTextFieldControl type="search" aria-label="Buscar" /></span>
</div>`,
    }),
  },
  {
    id: 'disabled',
    title: 'A bar out of action',
    note: 'A fieldset around the bar disables every control inside it natively, and because a natively disabled control cannot be focused, the arrows skip exactly those — the platform answers it in two lines.',
    snippet: defineSnippet({
      id: 'toolbar-angular-disabled',
      language: 'angular',
      label: 'The element that can actually do it',
      source: `<fieldset [disabled]="readOnly()">
  <div slToolbar aria-label="Read only">
    <button slButton variant="outline">Edit</button>
    <div slToolbarSeparator></div>
    <button slButton tone="danger">Delete</button>
  </div>
</fieldset>`,
    }),
  },
  {
    id: 'overflow',
    title: 'More controls than room',
    note: 'wrap keeps every control visible on a second row, and the arrows wrap from row to row because the item list is linear; scroll keeps the bar to one line and scrolls past its controls rather than squeezing them.',
    snippet: defineSnippet({
      id: 'toolbar-angular-overflow',
      language: 'angular',
      label: 'One line, or two',
      source: `<div slToolbar aria-label="Many actions" overflow="wrap"></div>
<div slToolbar aria-label="Many actions, scrolling" overflow="scroll"></div>`,
    }),
  },
  {
    id: 'overflowMenu',
    title: 'What is left over, behind one control',
    note: 'The bar measures its own width and gives way from the end, so what holds it gives it a width that does not come from the bar’s content: a bar as wide as what it shows is the trigger alone after a fold, and never sees the room come back. What stays visible is what has nowhere to go: an item that declares no counterpart cannot be hidden, which is how the primary action survives without a priority ranking it above the others. The counterpart is an ng-template, so a menu item that is never reached builds nothing.',
    snippet: defineSnippet({
      id: 'toolbar-angular-overflow-menu',
      language: 'angular',
      label: 'A bar that gives way from the end',
      source: `<div slToolbar aria-label="Documento" overflow="menu">
  <!-- No counterpart, so it is pinned: the primary action stays visible. -->
  <div slToolbarItem>
    <button slButton tone="accent">Publicar</button>
  </div>
  <div slToolbarSeparator></div>
  <div slToolbarItem [slToolbarItemCounterpart]="duplicate">
    <button slButton variant="ghost">Duplicar</button>
  </div>
  <div slToolbarItem [slToolbarItemCounterpart]="archive">
    <button slButton variant="ghost">Arquivar</button>
  </div>
  <sl-toolbar-overflow />
</div>

<ng-template #duplicate><button slMenuItem>Duplicar</button></ng-template>
<ng-template #archive><button slMenuItem>Arquivar</button></ng-template>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and standing beside other families',
    note: 'The provider carries the five decisions an application takes once, and the bar is what belongs in a tab list’s actions slot — one tab stop for however many actions the page puts there.',
    snippet: defineSnippet({
      id: 'toolbar-angular-composition',
      language: 'ts',
      label: 'A provider, and a bar inside a tab list',
      source: `// One decision for every bar in the application, in the bootstrap file.
bootstrapApplication(App, {
  providers: [provideToolbarDefaults({ size: 'sm', variant: 'outline' })],
});

// And in a template, the actions slot of a tab list is where a bar goes:
// <div slTabActions><div slToolbar aria-label="Actions">…</div></div>`,
    }),
  },
];

export const ANGULAR_TOOLBAR_DOCS = {
  toolbar: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slToolbar, provideToolbarDefaults',
        'Which way the bar runs, and therefore which arrow pair moves between the controls. A vertical bar also writes aria-orientation, which the role’s own default makes unnecessary for a horizontal one',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slToolbar, provideToolbarDefaults',
        'The bar’s own inset, gap and separator inset, from the control scales. It never touches the controls inside it: a bar that resized another family’s control would own state it cannot see',
      ],
      [
        'variant',
        "'plain' | 'outline'",
        'plain',
        'slToolbar, provideToolbarDefaults',
        'Whether the bar paints a ground and a frame. An outline bar pads itself by at least the reach of a focus ring, so a focused control never sits on the bar’s own edge',
      ],
      [
        'overflow',
        "'wrap' | 'scroll' | 'menu'",
        'wrap',
        'slToolbar, provideToolbarDefaults',
        'What a bar does with more controls than it has room for. wrap keeps every control on a second row, scroll is one line the arrows reveal, and menu is one line whose units give way from the end into a surface. A menu bar with no sl-toolbar-overflow in it has nothing to give way to, so it scrolls',
      ],
      [
        'overflowChange',
        'output<number>',
        '—',
        'slToolbar',
        'How many units gave way, once per change. There is no two-way binding over the collapsed set: it is a measurement, and a consumer who owned it could assert that a bar fits when the layout says it does not',
      ],
      [
        'slToolbarItemCounterpart, slToolbarGroupCounterpart',
        'TemplateRef',
        '—',
        'slToolbarItem, slToolbarGroup',
        'What the unit becomes in the surface when the bar has no room for it, rendered through NgTemplateOutlet only while it is collapsed. A unit that declares none is pinned — pinning is the absence of a counterpart rather than a second input, so the two can never disagree. It is not called overflow, because that word is the bar’s own axis',
      ],
      [
        'label',
        'string | ((hidden: number) => string)',
        'counted',
        'sl-toolbar-overflow',
        'The accessible name of the control that holds what did not fit. The default counts — "3 more actions" — because three dots say nothing about how much is behind them. It is a sentence of the language in force, with its plural, and label replaces it, and an aria-label written on the host wins over both',
      ],
      [
        'align, side, size',
        'MenuAlign | MenuSide | MenuSize',
        'from provideMenuDefaults',
        'sl-toolbar-overflow',
        'Where the surface sits against the trigger, and its own measure. Everything else about the layer an application sets once with provideMenuDefaults(): a second configuration surface over the same layer would be two answers to one question',
      ],
      [
        'loop',
        'boolean',
        'true',
        'slToolbar, provideToolbarDefaults',
        'Whether the arrows wrap past the ends of the bar',
      ],
      [
        'aria-label',
        'string',
        '—',
        'slToolbar, slToolbarGroup',
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
        'exportAs',
        'slToolbar | slToolbarGroup | slToolbarItem | slToolbarOverflow | slToolbarSeparator | slToolbarSpacer',
        '—',
        'every directive',
        'A template reaches the instance by name: #bar="slToolbar" hands a page the resolved axes, which is what a bar that answers a route needs',
      ],
      [
        'the element you write it on',
        'any element',
        '—',
        'every directive',
        'Five of the six parts are directives on the consumer’s own element, so a bar can be a nav and a rule an hr. The overflow is the exception: it is a component, because it renders both the trigger and the surface, and its host is display: contents so the button it draws is still a child of the bar',
      ],
      [
        'items',
        'any focusable descendant',
        '—',
        'inside slToolbar',
        'Anything focusable is an item, found in the DOM: this library’s slButton, slLink, slCheckbox, slSwitch and slTextField, a menu trigger, or a consumer’s own control. An element that cannot hold focus is not reachable by the arrows',
      ],
      [
        'provideToolbarDefaults()',
        '{ orientation, size, variant, overflow, loop }',
        '—',
        'an injector',
        'The five decisions an application takes once, in the bootstrap file or on a route. A bar that states any of them itself still wins',
      ],
      [
        'collapsedUnits(), counterpart(id)',
        'signal<ToolbarCollapsedUnit[]>, TemplateRef | null',
        '—',
        'slToolbar',
        'What the parts read: the units that gave way, in the order the bar held them, and what each one becomes. A consumer’s own trigger reads the same signals through #bar="slToolbar"',
      ],
      [
        'fieldset',
        'the platform’s own element',
        '—',
        'around a slToolbar',
        'How a bar is taken out of action. A container cannot disable controls it does not own, and a bar that refused interaction while its controls still looked operable is the defect the state precedence exists to prevent',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Toolbar (w3.org/WAI/ARIA/apg/patterns/toolbar/): the bar is one tab stop, entry lands on the control that last had focus or on the first that is not disabled, the arrows of the flow axis move between the controls and wrap — from row to row when the bar wrapped — and Home and End reach the ends. The cross axis duplicates the pair, which the pattern permits.',
      'The APG asks an author to avoid controls whose operation needs the navigation arrows and, failing that, to place one such control last. The bar enforces it instead: a text entry, a select, a slider, a spin button and a contenteditable keep the keys of the flow axis, and focus leaves them on the cross axis or with Tab.',
      'A control that announces aria-disabled keeps its place in the ring, which the pattern allows where discoverability of a function is crucial and which is what Button’s focusableWhenDisabled renders. A control carrying the native attribute is skipped, because the platform will not focus it either — including every control inside a disabled fieldset.',
      'The bar names itself with the consumer’s aria-label or aria-labelledby, and each group names itself the same way. The pattern uses the role for three or more controls; that is documented rather than enforced, because a role that disappeared when a permission filter removed a button would be a semantic changing behind the author.',
      'Under overflow="menu" the control that holds what did not fit is a control of the bar like any other: the arrows, Home and End reach it, and it leaves the ring the moment the bar has room for everything, because a hidden control cannot hold focus. Its name carries the count rather than the mark, and focus is moved onto it before the control under focus is hidden — so a reader who was on the fifth button lands on the control that now holds it rather than on the document body.',
      'Nothing in the bar is painted over: every control keeps its own states, its own focus ring and its own contrast. What the bar adds is the boundary between runs — a group, a rule, a spacer — and under forced colors the rule keeps its own paint, because a background flattens to Canvas and would take the boundary with it.',
    ],
    snippets: [
      defineSnippet({
        id: 'toolbar-angular-anatomy',
        language: 'angular',
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
  <div data-part="separator" role="separator" aria-orientation="vertical"></div>
  <div data-part="spacer" aria-hidden="true"></div>
  <div data-part="item" data-unit="slotted-toolbar-unit-1">
    <button tabindex="-1">Delete</button>
  </div>
  <div data-part="item" data-unit="slotted-toolbar-unit-2" hidden>
    <button tabindex="-1">Arquivar</button>
  </div>
  <button data-part="overflow" type="button" tabindex="-1" aria-label="1 more action">
    <span data-ui="icon" data-part="root" aria-hidden="true">
      <svg data-part="glyph" data-glyph="ellipsis"></svg>
    </span>
  </button>
</div>`,
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
