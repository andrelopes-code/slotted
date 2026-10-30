import kbdTokens from '@slotted/styles/kbd/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

const KBD_TOKEN_PURPOSES: Record<string, string> = {
  '--slotted-kbd-surface':
    'The ground of a raised or soft key cap. A theme sets it to keep key caps opaque inside a region that re-tints the tone tokens; absent, the variant’s own ground.',
  '--slotted-kbd-border-color':
    'The rim of a key cap in every variant but plain. Absent, the variant’s own edge.',
  '--slotted-kbd-color': 'The ink of a key cap in every variant. Absent, the variant’s own ink.',
};

export const ANGULAR_KBD_TOKENS = kbdTokens.map((name) => ({
  name,
  purpose: KBD_TOKEN_PURPOSES[name] ?? 'Theme-owned Kbd decision',
}));

const imports: ReferenceImport = {
  source: "import { SlKbd, SlShortcut, provideKbdDefaults } from '@slotted/angular/kbd';",
  selector: 'kbd[slKbd] · kbd[slShortcut]',
  exportAs: 'slKbd · slShortcut',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'kbd',
    required: true,
    purpose:
      'One key — the consumer’s own kbd element, which the directive attaches to. Carries data-ui="kbd", the axes as data attributes, and data-key when the token is in the vocabulary.',
  },
  {
    part: 'legend',
    element: 'span',
    required: true,
    purpose:
      'What the eye sees. Hidden from assistive technology whenever the key is in the vocabulary, and marked data-legend="symbol" when what it draws is a mark rather than a word.',
  },
  {
    part: 'name',
    element: 'span',
    required: false,
    purpose:
      'What a reader hears in place of the legend — “Command”, “Control”, “Up arrow”. Clipped from view by the family’s own rule. Rendered only for a key in the vocabulary.',
  },
  {
    part: 'shortcut',
    element: 'kbd',
    required: false,
    purpose:
      'A whole combination, holding the key roots. The one part that contains the family’s root instead of sitting inside it, so it carries data-ui itself, plus data-platform for the resolution it made.',
  },
  {
    part: 'separator',
    element: 'span',
    required: false,
    purpose:
      'Between two keys. data-separator="plus" joins keys pressed together and is hidden from assistive technology; data-separator="then" joins two steps of a sequence and is read aloud.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One key with every input on it, driven by the controls below the canvas. Change platform and watch the legend change without the template changing.',
    snippet: defineSnippet({
      id: 'kbd-angular-playground',
      language: 'angular',
      label: 'One key',
      source:
        '<kbd slKbd keyName="mod"></kbd>\n\n<!-- Or a word this library has never heard of. -->\n<kbd slKbd>Any key</kbd>',
    }),
  },
  {
    id: 'variants',
    title: 'How the key is painted',
    note: 'raised is the only value that looks like an object; outline owns no ground, so it survives on a solid surface where raised would cut a white hole.',
    snippet: defineSnippet({
      id: 'kbd-angular-variants',
      language: 'angular',
      label: 'The four paintings',
      source:
        '<kbd slShortcut keys="mod+b"></kbd>\n<kbd slShortcut keys="mod+b" variant="outline"></kbd>\n<kbd slShortcut keys="mod+b" variant="soft"></kbd>\n<kbd slShortcut keys="mod+b" variant="plain"></kbd>',
    }),
  },
  {
    id: 'sizes',
    title: 'How large the key is',
    note: 'Four absolute heights, 16, 20, 24 and 28 pixels, that no legend and no variant changes; the legend reads the control type scale, so it shrinks with density inside the same box. xs fits a caption or a tooltip. inherit reads the text around it and stays inside its line, which is the step a heading and a footnote both need.',
    snippet: defineSnippet({
      id: 'kbd-angular-sizes',
      language: 'angular',
      label: 'Absolute steps, and the relative one',
      source:
        '<kbd slKbd keyName="escape" size="xs"></kbd>\n<kbd slKbd keyName="escape" size="sm"></kbd>\n<kbd slKbd keyName="escape" size="lg"></kbd>\n\n<h2>Press <kbd slKbd keyName="escape" size="inherit"></kbd> to close</h2>',
    }),
  },
  {
    id: 'shortcut',
    title: 'A whole combination',
    note: 'One kbd nested inside another, which is what the HTML Standard says a combination is. The plus is a part of its own, so an application can restyle or replace it.',
    snippet: defineSnippet({
      id: 'kbd-angular-shortcut',
      language: 'angular',
      label: 'The shortcut, written once',
      source: '<kbd slShortcut keys="mod+shift+p"></kbd>',
    }),
  },
  {
    id: 'platform',
    title: 'The same string on three keyboards',
    note: 'The modifiers are reordered into each platform’s own convention and the legends redrawn; on a Mac the separator is not rendered at all, because a Mac joins with nothing.',
    snippet: defineSnippet({
      id: 'kbd-angular-platform',
      language: 'angular',
      label: 'One authored string, three keyboards',
      source:
        '<kbd slShortcut keys="mod+shift+alt+p" platform="mac"></kbd>\n<kbd slShortcut keys="mod+shift+alt+p" platform="windows"></kbd>\n\n<!-- Left to itself it asks the reader’s browser. -->\n<kbd slShortcut keys="mod+shift+alt+p"></kbd>',
    }),
  },
  {
    id: 'sequence',
    title: 'One key after another',
    note: 'Whitespace between two groups is a step break, so “g i” is G then I. The word is read aloud where the plus is not, because it is the only thing that tells a sequence from a chord.',
    snippet: defineSnippet({
      id: 'kbd-angular-sequence',
      language: 'angular',
      label: 'The Gmail and Linear form',
      source: '<kbd slShortcut keys="g i"></kbd>\n<kbd slShortcut keys="mod+k mod+s"></kbd>',
    }),
  },
  {
    id: 'context',
    title: 'Where a shortcut actually lives',
    note: 'A menu, where the label takes the room and the shortcut takes the end of the row. plain inherits the row’s colour, so a row that dims dims its shortcut with no state to set.',
    snippet: defineSnippet({
      id: 'kbd-angular-context',
      language: 'angular',
      label: 'A menu row',
      source:
        '<li>\n  <span>Open command palette</span>\n  <kbd slShortcut keys="mod+k" variant="plain"></kbd>\n</li>',
    }),
  },
  {
    id: 'states',
    title: 'Available and unavailable',
    note: 'disabled dims the ground, the rim and the ink, and writes no aria-disabled: kbd may carry only the global ARIA attributes, so the item owns the semantics.',
    snippet: defineSnippet({
      id: 'kbd-angular-states',
      language: 'angular',
      label: 'A shortcut the item cannot run',
      source: '<kbd slShortcut keys="mod+z"></kbd>\n<kbd slShortcut keys="mod+z" disabled></kbd>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'The longest real key name, a German legend replaced through the injection token, and a four-key combination in a narrow column: it wraps between caps and never inside one.',
    snippet: defineSnippet({
      id: 'kbd-angular-content',
      language: 'ts',
      label: 'Long, translated, and too wide',
      source:
        "provideKbdDefaults({\n  platform: 'windows',\n  legends: { ctrl: 'Strg', shift: 'Umschalt', delete: 'Entf' },\n  names: { ctrl: 'Steuerung', delete: 'Entfernen' },\n});",
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'Projected keys are rendered in the order written, which is the way out of the platform reordering. The directive is already on the consumer’s element, so no render prop is needed.',
    snippet: defineSnippet({
      id: 'kbd-angular-composition',
      language: 'angular',
      label: 'Projected keys, and the instance a template can reach',
      source:
        '<kbd slShortcut>\n  <kbd slKbd keyName="mod"></kbd>\n  <kbd slKbd>K</kbd>\n</kbd>\n\n<kbd slShortcut keys="mod+k" #combination="slShortcut"></kbd>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'Every mark and every abbreviation hides its legend and carries the word beside it, so ⌘ is announced “Command” rather than “place of interest sign” and Ctrl is not left to a pronunciation dictionary.',
    snippet: defineSnippet({
      id: 'kbd-angular-accessibility',
      language: 'angular',
      label: 'What each of these announces',
      source:
        '<!-- “Command Shift K” -->\n<kbd slShortcut keys="mod+shift+k" platform="mac"></kbd>\n\n<!-- “G then I” -->\n<kbd slShortcut keys="g i"></kbd>\n\n<!-- “Any key” — a word the page wrote, so the page owns it. -->\n<kbd slKbd>Any key</kbd>',
    }),
  },
];

export const ANGULAR_KBD_DOCS = {
  kbd: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'keyName',
        'string',
        '—',
        'slKbd',
        'A token from the vocabulary — mod, meta, ctrl, alt, shift, fn, enter, escape, tab, space, backspace, delete, capslock, pageup, pagedown, home, end, plus, up, down, left, right — or an alias such as cmd, option, esc or arrowup. Wins over projected content where both are written',
      ],
      [
        'keys',
        'string',
        '—',
        'slShortcut',
        'The whole combination: + joins keys pressed together, whitespace joins the steps of a sequence',
      ],
      [
        'platform',
        "'auto' | 'mac' | 'windows' | 'linux' | 'other'",
        'auto',
        'slKbd, slShortcut',
        'Which keyboard the legends are drawn for. auto reads the browser and never the server, so a server-rendered application states it through provideKbdDefaults',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'inherit'",
        'md',
        'slKbd, slShortcut',
        'xs to lg are fixed heights of 16, 20, 24 and 28 pixels whose legend answers density; inherit reads the text around the key and stays inside its line',
      ],
      [
        'variant',
        "'raised' | 'outline' | 'soft' | 'plain'",
        'raised',
        'slKbd, slShortcut',
        'raised is a key with a bottom edge, outline owns no ground, soft is the tinted chip, plain takes the colour of the text it sits in',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slKbd, slShortcut',
        'Dims the key without writing aria-disabled, which kbd may not carry. The item the shortcut belongs to owns the semantics',
      ],
      [
        'separator',
        'string',
        '+',
        'slShortcut',
        'Between two simultaneous keys. A Mac joins with nothing whatever this says',
      ],
      [
        'messages',
        'PartialMessages<KeysMessages>',
        '—',
        'slKbd, slShortcut',
        'Words laid over the keys catalog of the language in force, key by key: legends.*, names.*, and then — the word between two steps of a sequence, read aloud',
      ],
      [
        'legends',
        'Record<string, string>',
        '—',
        'slShortcut',
        'Replaces what the eye sees, per key token: { ctrl: "Strg" }. Falls back to the injection token',
      ],
      [
        'names',
        'Record<string, string>',
        '—',
        'slShortcut',
        'Replaces what a reader hears, per key token: { ctrl: "Steuerung" }. Falls back to the injection token',
      ],
    ]),
    composition: apiRows([
      [
        'projected content',
        'ng-content',
        '—',
        'slKbd',
        'The legend written verbatim — the application’s own word, neither resolved nor given a hidden name',
      ],
      [
        'projected content',
        'ng-content',
        '—',
        'slShortcut',
        'Keys authored one by one. They are rendered in the order written, which is the way out of the platform reordering, and they take the combination’s painting',
      ],
      [
        'the host element',
        'kbd',
        '—',
        'slKbd, slShortcut',
        'The directive is written on the consumer’s own kbd, so substituting the element is the default rather than a prop. Every static attribute on it survives the host bindings',
      ],
      [
        'exportAs',
        "'slKbd' | 'slShortcut'",
        '—',
        'slKbd, slShortcut',
        'Reaches the instance from a template. There is no imperative method on it: the family has no action a template cannot express declaratively',
      ],
      [
        'provideKbdDefaults',
        '{ platform, size, variant, separator, legends, names }',
        '—',
        'an injector',
        'Sets all six once for everything under it; an explicit input on a key still wins',
      ],
    ]),
    accessibility: [
      'There is no kbd pattern in the WAI-ARIA Authoring Practices — the pattern index carries no entry — and ARIA in HTML (W3C Recommendation, 11 August 2026) maps the kbd element to no corresponding role and declares it Naming Prohibited. The family therefore writes no role, no aria-label and no aria-disabled, and every word a reader hears is content.',
      'A key in the vocabulary hides its legend with aria-hidden and carries the word in a name part the family clips from view itself. ⌘ is U+2318 PLACE OF INTEREST SIGN and would otherwise be read as one; Ctrl is an abbreviation whose pronunciation belongs to the screen reader’s dictionary. Both are announced “Control” or “Command” here.',
      'The plus between two keys is aria-hidden — it is punctuation joining two caps, and “Command Shift K” is what the operating systems announce for the same shortcut. The word between two steps of a sequence is not hidden, because it is the only thing that distinguishes “G then I” from “G and I together”.',
      'Nothing here is focusable and nothing here binds a key. WCAG 2.2 2.1.4 Character Key Shortcuts belongs to whoever registers the shortcut, because only the application knows whether a single-character shortcut can be turned off.',
      'The keys inside a combination keep their left-to-right order in a right-to-left document. A combination is one formula, the bidi algorithm renders the same string as one left-to-right run inside an Arabic paragraph, and a mirrored K + ⌘ is a shortcut no operating system displays. The combination as a whole still sits where the paragraph puts it.',
      'An arrow legend is never mirrored: ← is the physical Left arrow key, not a direction of travel.',
      'A key label is never truncated. A shortcut too wide for its column wraps between caps and never inside one, because half a key name is a wrong instruction where a wrapped shortcut is only a taller row.',
      'The platform is resolved in the browser and never on the server, so a server-rendered application calls provideKbdDefaults({ platform }) — a development-mode warning says so rather than leaving a reader to discover Ctrl on their Mac.',
    ],
    snippets: [
      defineSnippet({
        id: 'kbd-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<kbd\n  data-ui="kbd"\n  data-part="shortcut"\n  data-platform="windows"\n  data-size="md"\n  data-variant="raised"\n>\n  <kbd data-ui="kbd" data-part="root" data-key="mod" data-size="md" data-variant="raised">\n    <span aria-hidden="true" data-part="legend">Ctrl</span>\n    <span data-part="name">Control</span>\n  </kbd>\n  <span aria-hidden="true" data-part="separator" data-separator="plus">+</span>\n  <kbd data-ui="kbd" data-part="root" data-size="md" data-variant="raised">\n    <span data-part="legend">K</span>\n  </kbd>\n</kbd>',
      }),
      defineSnippet({
        id: 'kbd-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='kbd'] {\n  --slotted-kbd-radius: var(--slotted-radius-md);\n  --slotted-kbd-base-width: 3px;\n  --slotted-kbd-font-family: 'Berkeley Mono', ui-monospace, monospace;\n}",
      }),
    ],
  },
} as const;
