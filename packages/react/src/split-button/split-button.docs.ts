import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import splitButtonTokens from '@slotted/styles/split-button/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SPLIT_BUTTON_TOKENS = splitButtonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Split Button decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SplitButton,\n  SplitButtonChoices,\n  SplitButtonMenu,\n  SplitButtonMenuTrigger,\n  SplitButtonPrimary,\n} from '@slotted/react';\nimport { MenuContent, MenuItem, MenuRadioItem } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The group. It carries role="group", data-ui="split-button", the three appearance axes it hands to both halves, and data-disabled, data-loading and data-full-width. It paints the join; the chevron is the chevron-down Glyph element inside the menu trigger.',
  },
  {
    part: 'primary',
    element: 'button — button’s Button, carrying this family’s part',
    required: true,
    purpose:
      'The action. Everything about it is Button’s: start and end, type, loading with the width held, focusableWhenDisabled, the native attributes. The family adds the part name and folds the root’s disabled and loading into its own.',
  },
  {
    part: 'menu-trigger',
    element: 'button — button’s IconButton, rendered as menu’s trigger',
    required: true,
    purpose:
      'The menu button. It carries aria-haspopup="menu", aria-expanded and aria-controls from menu, the chevron from this family — content the consumer passes replaces it — and an accessible name the type makes mandatory. Square from the control height; it never shrinks.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One split button with every axis on it, driven by the controls below the canvas. Tab reaches the action, then the menu button: two controls, two stops, one shape.',
    snippet: defineSnippet({
      id: 'split-button-react-playground',
      language: 'tsx',
      label: 'An action and the menu of its alternatives',
      source: `<SplitButton>
  <SplitButtonPrimary onClick={save}>Save</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More save options" />
    <MenuContent>
      <MenuItem onSelect={saveDraft}>Save as draft</MenuItem>
      <MenuItem onSelect={saveAndClose}>Save and close</MenuItem>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Five tones, three variants, one seam',
    note: 'Every tone and variant is button’s, handed to both halves at once. Between two solid halves the seam is the tone’s darkest step, painted on the trigger’s leading edge — the one edge the join leaves in the shared column.',
    snippet: defineSnippet({
      id: 'split-button-react-variants',
      language: 'tsx',
      label: 'A danger split button, outlined',
      source: `<SplitButton tone="danger" variant="outline">
  <SplitButtonPrimary onClick={remove}>Delete</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More delete options" />
    <MenuContent>
      <MenuItem onSelect={archive}>Archive instead</MenuItem>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, one control tall',
    note: 'Both halves read the control scale, so the bar is exactly as tall as the field beside it and the trigger stays square at every step. Switch the density in the toolbar: the pair moves together.',
    snippet: defineSnippet({
      id: 'split-button-react-sizes',
      language: 'tsx',
      label: 'The small step',
      source: `<SplitButton size="sm">
  <SplitButtonPrimary onClick={save}>Save</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More save options" />
    <MenuContent>
      <MenuItem onSelect={saveDraft}>Save as draft</MenuItem>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'remember',
    title: 'The choice becomes the action',
    note: 'Under remember the alternatives are radio items bound to the family’s value, and the page renders the action’s label from it — the merge button whose strategy a repository remembers. Choose one, then read the primary. Without remember the items are actions.',
    snippet: defineSnippet({
      id: 'split-button-react-remember',
      language: 'tsx',
      label: 'A remembered merge strategy',
      source: `const [strategy, setStrategy] = useState('squash');

<SplitButton onValueChange={setStrategy} remember value={strategy}>
  <SplitButtonPrimary onClick={() => merge(strategy)}>{labels[strategy]}</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More merge strategies" />
    <MenuContent>
      <SplitButtonChoices>
        <MenuRadioItem value="merge">Criar um commit de merge</MenuRadioItem>
        <MenuRadioItem value="squash">Squash e merge</MenuRadioItem>
        <MenuRadioItem value="rebase">Rebase e merge</MenuRadioItem>
      </SplitButtonChoices>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'loading',
    title: 'The action in flight',
    note: 'Press Save: the primary shows button’s indicator with its width and name held, and the menu button waits with it — aria-disabled, still focusable, still painted in the tone, refusing the click and the arrow keys. The bar is one control that is busy.',
    snippet: defineSnippet({
      id: 'split-button-react-loading',
      language: 'tsx',
      label: 'Loading on the root',
      source: `<SplitButton loading={saving}>
  <SplitButtonPrimary onClick={save}>Save</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More save options" />
    <MenuContent>
      <MenuItem onSelect={saveDraft}>Save as draft</MenuItem>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'disabled on the root takes both halves out natively; disabled on one half leaves the other an action. Hover, press and focus are button’s, and only focus is raised above the seam, because a hover repaints a fill and never an edge.',
    snippet: defineSnippet({
      id: 'split-button-react-states',
      language: 'tsx',
      label: 'One half out',
      source: `<SplitButton>
  <SplitButtonPrimary disabled>Merge</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More merge options" />
    <MenuContent>
      <MenuItem onSelect={closeRequest}>Close without merging</MenuItem>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'width',
    title: 'The line, and a narrow room',
    note: 'fullWidth gives the line to the action alone and the trigger stays square. In a narrow column the label wraps inside its own control, which is button’s rule, and the bar never pushes past the container.',
    snippet: defineSnippet({
      id: 'split-button-react-width',
      language: 'tsx',
      label: 'The action takes the line',
      source: `<SplitButton fullWidth>
  <SplitButtonPrimary onClick={order}>Place order</SplitButtonPrimary>
  <SplitButtonMenu>
    <SplitButtonMenuTrigger aria-label="More order options" />
    <MenuContent>
      <MenuItem onSelect={schedule}>Schedule delivery</MenuItem>
    </MenuContent>
  </SplitButtonMenu>
</SplitButton>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An icon before the label is Button’s start slot and reaches the primary unchanged; a long translated action wraps rather than growing the bar; a right-to-left document puts the trigger at the other end of the action. Switch the direction in the toolbar.',
    snippet: defineSnippet({
      id: 'split-button-react-content',
      language: 'tsx',
      label: 'Button’s own start slot on the action',
      source: `<SplitButtonPrimary onClick={save} start={<Save size={16} />}>
  Save
</SplitButtonPrimary>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Defaults once, the consumer’s own elements, and the handle',
    note: 'The provider sets tone, variant and size for every split button under it, and button’s own provider is consulted after it. render substitutes the root and either half and keeps the part; the ref on SplitButtonMenu is menu’s handle — open(), close(), focus().',
    snippet: defineSnippet({
      id: 'split-button-react-composition',
      language: 'tsx',
      label: 'A provider over substituted halves',
      source: `<SplitButtonDefaultsProvider size="sm" variant="outline">
  <SplitButton render={(props) => <section {...props} />}>
    <SplitButtonPrimary render={(props) => <button {...props} data-track="save" />}>
      Save
    </SplitButtonPrimary>
    <SplitButtonMenu ref={menu}>
      <SplitButtonMenuTrigger aria-label="More save options" />
      <MenuContent>
        <MenuItem onSelect={saveDraft}>Save as draft</MenuItem>
      </MenuContent>
    </SplitButtonMenu>
  </SplitButton>
</SplitButtonDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the action, then the menu button. Space and Enter run the action from the first and open the menu from the second; ArrowDown opens on the first item, ArrowUp on the last; Escape closes and returns to the trigger. ArrowDown on the action does nothing.',
    snippet: defineSnippet({
      id: 'split-button-react-keyboard',
      language: 'tsx',
      label: 'Reading why the menu opened',
      source: `<SplitButtonMenu onOpenChange={(open, request) => log(request.reason)}>
  <SplitButtonMenuTrigger aria-label="More save options" />
  <MenuContent>
    <MenuItem onSelect={saveDraft}>Save as draft</MenuItem>
  </MenuContent>
</SplitButtonMenu>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange, on SplitButtonMenu',
    payload: '(open: boolean, request: MenuChangeRequest)',
    when: 'Before the menu opens or closes. It is menu’s own request — the same reasons in the same order: pointer, keyboard, escape, outsidePress, select, dismiss, programmatic — so a handler moved from a menu changes nothing.',
  },
  {
    name: 'onValueChange, on SplitButton',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Under remember, before the remembered value moves. The request carries the new value, the one it replaces, the reason — pointer or keyboard — the originating event, and cancel(). Nothing is emitted for a value equal to the one held.',
  },
  {
    name: 'onClick, on SplitButtonPrimary and SplitButtonMenuTrigger',
    payload: 'the element’s own events',
    when: 'Whenever that button fires them. The consumer’s handler runs first, and always runs; preventDefault() in the primary’s refuses the activation, and in the trigger’s it is menu’s composition rule that holds.',
  },
];

export const REACT_SPLIT_BUTTON_DOCS = {
  splitButton: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'accent',
        'SplitButton',
        'The tone both halves are painted in. Resolved from the prop, then SplitButtonDefaultsProvider, then button’s own provider, then the contract',
      ],
      [
        'variant',
        "'solid' | 'outline' | 'ghost'",
        'solid',
        'SplitButton',
        'How the tone is painted on both halves. Between two solid halves the family paints the seam; outline and ghost share the edge the join leaves',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SplitButton',
        'The control step. The trigger is square from the same height',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'SplitButton',
        'Whether the action takes the whole line. The trigger stays square either way',
      ],
      [
        'remember',
        'boolean',
        'false',
        'SplitButton',
        'Whether the choice in the menu becomes the action. On, the items inside SplitButtonChoices are radio items bound to value and the page renders the primary’s label from it; off, the items are actions',
      ],
      [
        'value',
        'string',
        '—',
        'SplitButton',
        'The remembered value. Present means the consumer owns it, for the life of the component; absent, the family owns it and starts from defaultValue',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'SplitButton',
        'What an uncontrolled split button remembers first, read once',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'SplitButton',
        'Takes both halves out natively. Each half also accepts its own, which adds to the root’s',
      ],
      [
        'loading',
        'boolean',
        'false',
        'SplitButton',
        'The action is in flight: the primary shows button’s indicator with its width and name held, and the trigger is aria-disabled for the duration, still in the tab sequence and still painted',
      ],
      [
        'open',
        'boolean',
        '—',
        'SplitButtonMenu',
        'menu’s own controlled value, forwarded unchanged. Present means the consumer owns whether the menu shows',
      ],
      [
        'defaultOpen',
        'boolean',
        'false',
        'SplitButtonMenu',
        'menu’s own uncontrolled start, forwarded unchanged',
      ],
      [
        'side, align, size, closeOnSelect, mount, and the rest, on SplitButtonMenu',
        'MenuProps',
        'menu’s',
        'SplitButtonMenu',
        'Every prop of Menu reaches the menu unchanged: the surface is menu’s and nothing of it is re-declared here',
      ],
      [
        'start, end, type, loadingDelay, messages, focusableWhenDisabled, on SplitButtonPrimary',
        'ButtonProps',
        'Button’s',
        'SplitButtonPrimary',
        'Button’s own props reach the action unchanged; only the three appearance axes are the root’s',
      ],
      [
        'aria-label or aria-labelledby, on SplitButtonMenuTrigger',
        'string',
        '—',
        'SplitButtonMenuTrigger',
        'The menu button’s own name, distinct from the action’s, and mandatory at the type level: “More save options” beside “Save”',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'SplitButton, SplitButtonPrimary, SplitButtonMenuTrigger',
        'Substitutes the root or either half and hands it every attribute the family was going to write, the part name included. The trigger’s render is composed with menu’s, so the anchor the positioner measures is kept',
      ],
      [
        'ref',
        'Ref<HTMLDivElement> | Ref<HTMLButtonElement> | Ref<MenuHandle>',
        '—',
        'SplitButton, SplitButtonPrimary, SplitButtonMenuTrigger, SplitButtonMenu',
        'Reaches each element, and on SplitButtonMenu reaches menu’s handle: open(), close() and focus()',
      ],
      [
        'SplitButtonChoices',
        'MenuRadioGroupProps minus value',
        '—',
        'inside MenuContent, under remember',
        'menu’s radio group bound to the family’s value. Its children are MenuRadioItems, and it throws outside remember rather than holding a value nobody reads',
      ],
      [
        'SplitButtonDefaultsProvider',
        '{ tone, variant, size }',
        '—',
        'a subtree',
        'The three decisions an application takes once. A split button that states an axis itself still wins, and button’s own provider is consulted after this one',
      ],
      [
        'useSplitButton()',
        '() => SplitButtonContextValue',
        '—',
        'inside a SplitButton',
        'What a half reads: disabled, loading, remember, the value and select(). It throws outside a root',
      ],
      [
        'MenuContent, MenuItem, MenuRadioItem, MenuGroup, MenuSeparator, …',
        'menu’s parts',
        '—',
        'inside SplitButtonMenu',
        'Imported from menu as they are. Nothing of the surface is re-exported under this family’s name',
      ],
    ]),
    accessibility: [
      'There is no APG split-button pattern. The action is the Button pattern’s button and the menu button is the Menu Button pattern’s (w3.org/WAI/ARIA/apg/patterns/menu-button/), each with its own tab stop — which is what every surveyed implementation does.',
      'The trigger carries aria-haspopup="menu", aria-expanded and, while open, aria-controls, all written by menu; its accessible name is the consumer’s and the type refuses a trigger without one. A default string was declined: “More options” beside “Save” names the menu for no reader.',
      'Enter and Space open the menu on the first item, ArrowDown on the first and ArrowUp on the last, from menu; Escape closes and returns focus to the trigger. ArrowDown on the action does nothing — a key that opens a surface from a button whose name says the action is a surprise.',
      'disabled is the native attribute on both halves. loading keeps the trigger reachable and announces aria-disabled, so a reader who lands on it hears why nothing opens, while the primary announces its progress bar.',
      'Under remember the alternatives are menuitemradio items with aria-checked, so a reader hears which strategy is the action and that choosing another persists — the honest semantics of a choice that changes what the next click does.',
    ],
    snippets: [
      defineSnippet({
        id: 'split-button-react-anatomy',
        language: 'tsx',
        label: 'The anatomy as it reaches the DOM',
        source: `<div
  data-ui="split-button"
  data-part="root"
  role="group"
  data-tone="accent"
  data-variant="solid"
  data-size="md"
>
  <button
    data-ui="button"
    data-part="primary"
    data-tone="accent"
    data-variant="solid"
    data-size="md"
    type="button"
  >
    <span data-part="label">Save</span>
  </button>
  <button
    data-ui="button"
    data-part="menu-trigger"
    data-tone="accent"
    data-variant="solid"
    data-size="md"
    data-shape="square"
    type="button"
    aria-label="More save options"
    aria-haspopup="menu"
    aria-expanded="false"
  >
    <span data-part="icon">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="chevron-down" />
      </span>
    </span>
  </button>
</div>;`,
      }),
      defineSnippet({
        id: 'split-button-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='split-button'] {
  --slotted-split-button-radius: var(--slotted-radius-full);
}`,
      }),
    ],
  },
} as const;
