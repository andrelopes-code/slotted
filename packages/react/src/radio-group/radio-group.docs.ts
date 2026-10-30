import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import radioGroupTokens from '@slotted/styles/radio-group/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_RADIO_GROUP_TOKENS = radioGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Radio Group decision',
}));

const imports: ReferenceImport = {
  source: "import { Radio, RadioGroup, RadioGroupDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The group. It arranges the items, holds the value, and carries data-ui="radio-group", the four axes (data-size, data-variant, data-orientation, data-label-placement) and data-disabled, data-invalid and data-readonly. Its role is radiogroup; inside a field group the role is withdrawn, because the fieldset and its legend already name the set.',
  },
  {
    part: 'item',
    element: 'div, or the element Radio’s render returns',
    required: true,
    purpose:
      'One choice: a two-column grid holding the control, its mark, its label and its description, with data-checked and data-disabled mirrored onto it. Radio is a part of RadioGroup rather than a component of its own, because a radio outside a group has no exclusive set to belong to.',
  },
  {
    part: 'control',
    element: 'input type="radio"',
    required: true,
    purpose:
      'The native radio input. It holds the value, the name the group shares, the identifier and every native attribute written on Radio. The shared name gives the set the platform’s keyboard behavior, and ref reaches the element, so focus() needs no handle of its own.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose:
      'The dot, drawn as a mask from the glyph scale over the control. It is a sibling element rather than a pseudo-element, because Firefox renders neither ::before nor ::after on an input, and it takes no pointer events.',
  },
  {
    part: 'label',
    element: 'label',
    required: false,
    purpose:
      'Names the item’s control through for, and carries the target and the hover wash: a 24-pixel square around the circle, and a wash behind the circle and the text that stands half the control gap off the circle and half as far again past the text. It is as wide as its text, so the empty space beside it does not toggle the circle.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose:
      'Help text under one item’s label, aligned to the label rather than to the circle and wired with aria-describedby. It describes that item, not the set; text about the whole set belongs to the field group around it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every axis on it, driven by the controls below the canvas. Tab into it once: the whole group is a single stop, and the arrows move the choice from there.',
    snippet: defineSnippet({
      id: 'radio-group-react-playground',
      language: 'tsx',
      label: 'A set of exclusive choices',
      source: `<RadioGroup defaultValue="standard" name="shipping">
  <Radio value="standard">Standard delivery</Radio>
  <Radio value="express">Express delivery</Radio>
  <Radio value="pickup">Pick up in store</Radio>
</RadioGroup>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'How the choices flow',
    note: 'A horizontal set wraps rather than scrolling or clipping, and aria-orientation is written only where the group owns its role — on an element with no role the attribute describes nothing.',
    snippet: defineSnippet({
      id: 'radio-group-react-orientation',
      language: 'tsx',
      label: 'Stacked, and in a row that wraps',
      source: `<RadioGroup orientation="vertical" defaultValue="today">
  <Radio value="today">Today</Radio>
  <Radio value="tomorrow">Tomorrow</Radio>
</RadioGroup>;

<RadioGroup orientation="horizontal" defaultValue="today">
  <Radio value="today">Today</Radio>
  <Radio value="tomorrow">Tomorrow</Radio>
</RadioGroup>;`,
    }),
  },
  {
    id: 'tile',
    title: 'The plan picker, which is what tiles are for',
    note: 'An exclusive set of framed choices is the case Cloudscape built a whole Tiles family for and Carbon a selectable Tile. Here it is one axis on the group: each item becomes the surface, the arrow keys and the roving tab stop stay the platform’s, and Grid gives the row equal widths and equal heights.',
    snippet: defineSnippet({
      id: 'radio-group-react-tile',
      language: 'tsx',
      label: 'One choice out of a framed set',
      source: `<RadioGroup defaultValue="team" name="plan" variant="tile">
  <Grid minItemWidth="sm">
    <Radio description="Up to three projects and one seat." value="starter">
      Starter
    </Radio>
    <Radio description="Projetos sem limite e dez assentos." value="team">
      Team
    </Radio>
  </Grid>
</RadioGroup>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the set sits at',
    note: 'The circle is the control glyph scale, so the three steps shrink together with the type and the gap when the toolbar switches to dense — and every label keeps its 24-pixel target at every one of them.',
    snippet: defineSnippet({
      id: 'radio-group-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<RadioGroup size="sm" defaultValue="a" />;
<RadioGroup size="md" defaultValue="a" />;
<RadioGroup size="lg" defaultValue="a" />;

// Inside a field, the field decides and the set follows.
<Field size="sm">
  <RadioGroup defaultValue="a" />
</Field>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the set paints',
    note: 'Read-only keeps every tab stop and the chosen item keeps its accent, because the value is real; disabled loses both. A single unavailable option dims from its own element’s state rather than from the group’s.',
    snippet: defineSnippet({
      id: 'radio-group-react-states',
      language: 'tsx',
      label: 'Four shared states, and one item on its own',
      source: `<RadioGroup invalid required>
  <Radio value="a">No choice yet</Radio>
</RadioGroup>;

<RadioGroup readOnly defaultValue="a" />;
<RadioGroup disabled defaultValue="a" />;

// One option out of stock, in an otherwise live set.
<RadioGroup>
  <Radio value="a">Available</Radio>
  <Radio disabled value="b">
    Unavailable
  </Radio>
</RadioGroup>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Which side of its label the circle is on',
    note: 'start pushes every circle to the end of the row, and the column is a fraction rather than each label’s own width because a column of controls has to line up with itself.',
    snippet: defineSnippet({
      id: 'radio-group-react-placement',
      language: 'tsx',
      label: 'The circle first, or the label first',
      source: `<RadioGroup labelPlacement="end" defaultValue="card" />;
<RadioGroup labelPlacement="start" defaultValue="card" />;

// Never inherited from a field: that family's labelPlacement answers
// where a field's label sits relative to its control.`,
    }),
  },
  {
    id: 'description',
    title: 'Saying more about one option',
    note: 'The description belongs to the item and reaches only that item’s control, so a reader on the second option hears the second sentence rather than everything the set has to say.',
    snippet: defineSnippet({
      id: 'radio-group-react-description',
      language: 'tsx',
      label: 'Help that describes one choice',
      source: `<RadioGroup defaultValue="monthly">
  <Radio description="Billed on the 5th of every month, no cancellation fee." value="monthly">
    Monthly
  </Radio>
  <Radio description="Two months off, billed at signup." value="yearly">
    Yearly
  </Radio>
</RadioGroup>;`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a group of fields',
    note: 'The fieldset and its legend are what group and name the set, so the group withdraws its own radiogroup role rather than announcing the same set twice under the same name.',
    snippet: defineSnippet({
      id: 'radio-group-react-field',
      language: 'tsx',
      label: 'The legend names the set; the group holds the value',
      source: `<FieldGroup required>
  <FieldGroupLegend>Payment method</FieldGroupLegend>
  <RadioGroup defaultValue="card" name="payment">
    <Radio value="card">Card</Radio>
    <Radio value="zelle">Zelle</Radio>
  </RadioGroup>
</FieldGroup>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An option that wraps to three lines keeps its circle on the first of them, an unbroken token breaks instead of taking the page with it, and a right-to-left label mirrors the whole row.',
    snippet: defineSnippet({
      id: 'radio-group-react-content',
      language: 'tsx',
      label: 'Long, unbroken and right-to-left',
      source: `<RadioGroup defaultValue="a">
  <Radio description="The circle stays on the first line of the label." value="a">
    I authorize sharing the delivery data with the carrier responsible for the last leg of the
    route.
  </Radio>
  <Radio dir="rtl" value="b">
    أوافق على مشاركة بيانات التسليم مع شركة الشحن.
  </Radio>
</RadioGroup>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the three decisions an application takes once, render substitutes both roots so a set can be a real list, and useRadioGroup reads the same state an item reads.',
    snippet: defineSnippet({
      id: 'radio-group-react-composition',
      language: 'tsx',
      label: 'A provider, and a set that is a list',
      source: `<RadioGroupDefaultsProvider orientation="horizontal" size="sm">
  <RadioGroup defaultValue="a" />
</RadioGroupDefaultsProvider>;

<RadioGroup render={(props) => <ul {...props} />} defaultValue="a">
  <Radio render={(props) => <li {...props} />} value="a">
    Um item
  </Radio>
</RadioGroup>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The APG table, implemented by the platform',
    note: 'Tab lands on the chosen item or on the first, the arrows move focus and selection together in both axes, the set wraps at both ends, and disabled options are skipped — none of it written here.',
    snippet: defineSnippet({
      id: 'radio-group-react-keyboard',
      language: 'tsx',
      label: 'Why the items share a name',
      source: `// Native radios in one form owner with one name already implement the
// whole APG table, in a right-to-left document too. The group generates
// a name when the consumer writes none, because an unnamed set is not a
// set — the price is that such a group inside a form submits under a
// generated key.
<RadioGroup name="shipping">
  <Radio value="standard">Standard</Radio>
  <Radio value="express">Express</Radio>
</RadioGroup>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string | undefined>)',
    when: 'Before the value moves. request.value is the new value and request.previous the value it replaces, which is undefined while nothing is chosen, the state the WAI-ARIA Authoring Practices ask a group to start in. request.reason is pointer or keyboard, request.source is the originating event, and request.cancel() refuses the move before anything commits, including the platform’s own selection.',
  },
  {
    name: 'onChange, onClick, onFocus, onBlur, on each Radio',
    payload: 'the element’s own events',
    when: 'Whenever that item’s input fires them. Radio composes the consumer’s handler with its own instead of replacing it: the consumer’s runs first and always runs. Calling preventDefault() in onClick also stops the change.',
  },
];

export const REACT_RADIO_GROUP_DOCS = {
  radioGroup: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'RadioGroup',
        'The controlled value. When present, the consumer owns the choice for the life of the component. When absent, the radio group owns it and starts from defaultValue.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'RadioGroup',
        'The value an uncontrolled group starts from, read once. Left unset, nothing is chosen and Tab lands on the first item, as the WAI-ARIA Authoring Practices recommend for a set with no default.',
      ],
      [
        'name',
        'string',
        'generated',
        'RadioGroup',
        'The submission name every item shares, which is what makes the platform treat the items as one set. Generated when unset, because the platform groups radios by name within a form.',
      ],
      [
        'variant',
        "'plain' | 'tile'",
        'plain',
        'RadioGroup, RadioGroupDefaultsProvider',
        'How every item is drawn. tile frames each item and makes its whole surface the target; the inputs still share a name, so the arrow keys, the wrap and the single tab stop do not change. Arranging the tiles is left to Grid.',
      ],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'RadioGroup, RadioGroupDefaultsProvider',
        'How the choices flow. A horizontal set wraps instead of scrolling, and aria-orientation is written only where the group carries the radiogroup role.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'RadioGroup, RadioGroupDefaultsProvider',
        'The type step, passed to every item. A field or field group around the radio group decides it first, then the provider. The circle follows the control glyph scale, which the theme restates per density.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'RadioGroup, RadioGroupDefaultsProvider',
        'Which side of its label each circle is on, set once for the set so the circles line up.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'RadioGroup, Radio',
        'Unset rather than false. Reaches every item as the native attribute, which also makes the browser skip the item with the arrow keys. Set it on one Radio to disable that option alone.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'RadioGroup',
        'Unset rather than false. A radio has no native readonly, so the radio group refuses every change and writes aria-readonly; every item keeps its tab stop, its focus ring and its contrast.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'RadioGroup',
        'Unset rather than false. Writes aria-invalid on the group and data-invalid on the root, which draws every circle in the danger tone with a thicker edge.',
      ],
      [
        'required',
        'boolean',
        'from the field, or false',
        'RadioGroup',
        'Unset rather than false. Writes aria-required on the group, never the native required, which would turn on browser constraint validation.',
      ],
      [
        'value, on Radio',
        'string',
        '—',
        'Radio',
        'What this item selects, and the value the group holds when it is chosen. Required: an item with no value is a choice nobody can make.',
      ],
      [
        'description, on Radio',
        'ReactNode',
        '—',
        'Radio',
        'Help text under the item’s label, wired with aria-describedby, so it describes that item and not the set.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: RadioGroupRootProps | RadioRootProps) => ReactNode',
        '—',
        'RadioGroup, Radio',
        'Replaces either root and hands it every attribute. The props are typed as HTMLAttributes<HTMLElement>, so a set of choices can render as a ul with each item as an li. The control has no render: it holds the value and the platform’s keyboard behavior.',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'Radio',
        'Reaches the item’s input. focus() and click() are the element’s own, so there is no imperative handle.',
      ],
      [
        'useRadioGroup()',
        '() => RadioGroupContextValue',
        '—',
        'inside a RadioGroup',
        'Returns what an item reads: whether it is chosen, its size, and how to request a change. It throws outside a RadioGroup instead of rendering a control that looks right and does nothing.',
      ],
      [
        'RadioGroupDefaultsProvider',
        '{ size, variant, orientation, labelPlacement }',
        '—',
        'a subtree',
        'The four decisions an application takes once for every radio group under it. A field or field group around a radio group decides size before the provider.',
      ],
      [
        'role',
        'string',
        'radiogroup, or none inside a field group',
        'RadioGroup',
        'A role the consumer writes wins. Otherwise the role is radiogroup, withdrawn inside a field group, because a fieldset with a legend is already a named group and a second group named by the same legend announces the set twice.',
      ],
    ]),
    accessibility: [
      'The radio group follows the WAI-ARIA Authoring Practices Radio Group pattern (w3.org/WAI/ARIA/apg/patterns/radio/), and the platform implements its whole keyboard table: Tab lands on the checked item, or on the first when none is checked; Space checks the focused item; the arrow keys move focus and selection together on both axes; the set wraps at both ends; disabled items are skipped. Native radios that share a name within one form provide all of it, including the arrow directions of a right-to-left document.',
      'This is why the items share a name, and why one is generated when none is written: the platform groups radios by name within a form, so radios without a shared name are not a set. The cost is that an unnamed radio group inside a form submits under a generated key.',
      'Each item takes its accessible name from its own label, through for pointing at an identifier the control generates. The group takes its name from the field group’s legend or, outside a field group, from an aria-label the consumer writes. Inside a field group the radiogroup role is withdrawn, so the set is not announced twice.',
      'The group writes aria-required, never the native required on an item. The native attribute turns on browser constraint validation and changes how the form submits, which describing the set must not do as a side effect. disabled is native, because the native attribute is also what makes the browser skip the option with the arrow keys.',
      'A radio has no native read-only state, so the radio group enforces one: it refuses the change on the click that a pointer and Space share, aria-readonly announces it on the group, and every item keeps its tab stop, its focus ring and its full contrast. The chosen option keeps its accent, because the value is real.',
      'The invalid state does not rely on color alone. In the high-contrast scheme the theme paints the danger border in the same color as every other border, so the circle also thickens its edge. The sentence that says what is wrong is the field group’s error.',
      'The target is larger than the circle. A 24-pixel square around the circle meets WCAG 2.2 SC 2.5.8 at every size and density, while the circle is 14 pixels at size="sm"; the label extends the target to the end of the text, and the hover wash covers exactly that area. The row keeps its line height: the target is drawn around the circle, not laid out beside it.',
    ],
    snippets: [
      defineSnippet({
        id: 'radio-group-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="radio-group"
  data-part="root"
  data-size="md"
  data-orientation="vertical"
  data-label-placement="end"
  role="radiogroup"
>
  <div data-part="item" data-checked>
    <input data-part="control" type="radio" name="shipping" id="std" value="standard" checked />
    <span data-part="indicator">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="dot" aria-hidden="true"></svg>
      </span>
    </span>
    <label data-part="label" for="std">
      Standard delivery
    </label>
    <p data-part="description" id="std-description">
      Arrives within five business days.
    </p>
  </div>
</div>;`,
      }),
      defineSnippet({
        id: 'radio-group-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='radio-group'] {
  --slotted-radio-group-size: 18px;
  --slotted-radio-group-gap: var(--slotted-space-5);
  --slotted-radio-group-checked-border-color: var(--slotted-tone-success-solid);
  --slotted-radio-group-halo-color: var(--slotted-tone-success-text);
}`,
      }),
    ],
  },
} as const;
