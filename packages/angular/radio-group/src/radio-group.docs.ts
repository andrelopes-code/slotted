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

export const ANGULAR_RADIO_GROUP_TOKENS = radioGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Radio Group decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideRadioGroupDefaults,\n  SlRadio,\n  SlRadioDescription,\n  SlRadioGroup,\n} from '@slotted/angular/radio-group';",
  selector: '[slRadioGroup]',
  exportAs: 'slRadioGroup',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slRadioGroup',
    required: true,
    purpose:
      'The group. It arranges the items, holds the value, and carries data-ui="radio-group", the four axes (data-size, data-variant, data-orientation, data-label-placement) and data-disabled, data-invalid and data-readonly. Its role is radiogroup; inside a field group the role is withdrawn, because the fieldset and its legend already name the set. formControl, formControlName and ngModel go on this element, which carries the value accessor and the validator.',
  },
  {
    part: 'item',
    element: 'the element carrying slRadio',
    required: true,
    purpose:
      'One choice: a two-column grid holding the control, its mark, its label and its description, with data-checked and data-disabled mirrored onto it. SlRadio is a part of SlRadioGroup rather than an entry point of its own, because a radio outside a group has no exclusive set to belong to: it injects SlRadioGroup without optional, so an SlRadio outside a group fails at construction.',
  },
  {
    part: 'control',
    element: 'input type="radio", in the item’s template',
    required: true,
    purpose:
      'The native radio input. It holds the value, the name the group shares and the identifier. The shared name gives the set the platform’s keyboard behaviour. Reach the element through the item’s exportAs: item.inputElement has focus() and click().',
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
    element: 'label, in the item’s template',
    required: false,
    purpose:
      'Names the item’s control through for, and carries the target and the hover wash: a 24-pixel square around the circle, and a wash behind the circle and the text that stands half the control gap off the circle and half as far again past the text. It is as wide as its text, so the empty space beside it does not toggle the circle. Its content is the item’s default ng-content slot.',
  },
  {
    part: 'description',
    element: 'the element carrying slRadioDescription',
    required: false,
    purpose:
      'Help text under one item’s label, projected into a named slot and wired with aria-describedby. It describes that item, not the set; text about the whole set belongs to the field group around it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every axis on it, driven by the controls below the canvas. Tab into it once: the whole group is a single stop, and the arrows move the choice from there.',
    snippet: defineSnippet({
      id: 'radio-group-angular-playground',
      language: 'angular',
      label: 'A set of exclusive choices',
      source: `<div slRadioGroup name="shipping" defaultValue="standard">
  <div slRadio value="standard">Standard delivery</div>
  <div slRadio value="express">Express delivery</div>
  <div slRadio value="pickup">Store pickup</div>
</div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'How the choices flow',
    note: 'A horizontal set wraps rather than scrolling or clipping, and aria-orientation is written only where the group owns its role — on an element with no role the attribute describes nothing.',
    snippet: defineSnippet({
      id: 'radio-group-angular-orientation',
      language: 'angular',
      label: 'Stacked, and in a row that wraps',
      source: `<div slRadioGroup orientation="vertical" defaultValue="today">
  <div slRadio value="today">Today</div>
  <div slRadio value="tomorrow">Tomorrow</div>
</div>

<div slRadioGroup orientation="horizontal" defaultValue="today">
  <div slRadio value="today">Today</div>
  <div slRadio value="tomorrow">Tomorrow</div>
</div>`,
    }),
  },
  {
    id: 'tile',
    title: 'The plan picker, which is what tiles are for',
    note: 'An exclusive set of framed choices is the case Cloudscape built a whole Tiles family for and Carbon a selectable Tile. Here it is one axis on the group: each item becomes the surface, the arrow keys and the roving tab stop stay the platform’s, and Grid gives the row equal widths and equal heights.',
    snippet: defineSnippet({
      id: 'radio-group-angular-tile',
      language: 'angular',
      label: 'One choice out of a framed set',
      source: `<div slRadioGroup name="plan" variant="tile" defaultValue="team">
  <div slGrid minItemWidth="sm">
    <div slRadio value="starter">
      Starter
      <p slRadioDescription>Up to three projects and one seat.</p>
    </div>
    <div slRadio value="team">
      Team
      <p slRadioDescription>Projetos sem limite e dez assentos.</p>
    </div>
  </div>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the set sits at',
    note: 'The circle is the control glyph scale, so the three steps shrink together with the type and the gap when the toolbar switches to dense — and every label keeps its 24-pixel target at every one of them.',
    snippet: defineSnippet({
      id: 'radio-group-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slRadioGroup size="sm" defaultValue="a">
  <div slRadio value="a">Compacto</div>
</div>

<!-- Inside a field, the field decides and the set follows. -->
<div slField size="sm">
  <label slFieldLabel>Prioridade</label>
  <div slRadioGroup defaultValue="low">
    <div slRadio value="low">Normal</div>
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the set paints',
    note: 'Read-only keeps every tab stop and the chosen item keeps its accent, because the value is real; disabled loses both. A single unavailable option dims from its own element’s state rather than from the group’s.',
    snippet: defineSnippet({
      id: 'radio-group-angular-states',
      language: 'angular',
      label: 'Four shared states, and one item on its own',
      source: `<div slRadioGroup invalid required>
  <div slRadio value="a">No choice yet</div>
</div>

<div slRadioGroup readOnly defaultValue="a">
  <div slRadio value="a">Plano contratado</div>
</div>

<!-- One option out of stock, in an otherwise live set. -->
<div slRadioGroup>
  <div slRadio value="a">Available</div>
  <div slRadio value="b" disabled>Unavailable</div>
</div>`,
    }),
  },
  {
    id: 'placement',
    title: 'Which side of its label the circle is on',
    note: 'start pushes every circle to the end of the row, and the column is a fraction rather than each label’s own width because a column of controls has to line up with itself.',
    snippet: defineSnippet({
      id: 'radio-group-angular-placement',
      language: 'angular',
      label: 'The circle first, or the label first',
      source: `<div slRadioGroup labelPlacement="end" defaultValue="card">
  <div slRadio value="card">Card</div>
</div>

<div slRadioGroup labelPlacement="start" defaultValue="card">
  <div slRadio value="card">Card</div>
</div>`,
    }),
  },
  {
    id: 'description',
    title: 'Saying more about one option',
    note: 'The description belongs to the item and reaches only that item’s control, so a reader on the second option hears the second sentence rather than everything the set has to say.',
    snippet: defineSnippet({
      id: 'radio-group-angular-description',
      language: 'angular',
      label: 'Help that describes one choice',
      source: `<div slRadioGroup defaultValue="monthly">
  <div slRadio value="monthly">
    Monthly
    <p slRadioDescription>Billed on the 5th of every month, no cancellation fee.</p>
  </div>
  <div slRadio value="yearly">
    Annual
    <p slRadioDescription>Two months off, billed at signup.</p>
  </div>
</div>`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a group of fields, and in a reactive form',
    note: 'The fieldset and its legend are what group and name the set, so the group withdraws its own radiogroup role — and the same element takes formControlName, because the accessor and the validator both live on the root.',
    snippet: defineSnippet({
      id: 'radio-group-angular-field',
      language: 'angular',
      label: 'The legend names the set; the form owns the value',
      source: `<fieldset slFieldGroup required>
  <legend slFieldGroupLegend>Payment method</legend>
  <div slRadioGroup required formControlName="payment">
    <div slRadio value="card">Card</div>
    <div slRadio value="zelle">Zelle</div>
  </div>
</fieldset>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An option that wraps to three lines keeps its circle on the first of them, an unbroken token breaks instead of taking the page with it, and a right-to-left label mirrors the whole row.',
    snippet: defineSnippet({
      id: 'radio-group-angular-content',
      language: 'angular',
      label: 'Long, unbroken and right-to-left',
      source: `<div slRadioGroup defaultValue="a">
  <div slRadio value="a">
    I authorize sharing the delivery data with the carrier.
    <p slRadioDescription>The circle stays on the first line of the label.</p>
  </div>
  <div slRadio value="b" dir="rtl">أوافق على مشاركة بيانات التسليم.</div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The token carries the three decisions an application takes once, exportAs reaches both instances, and the root is the consumer’s own element — so a set of choices can be a real list.',
    snippet: defineSnippet({
      id: 'radio-group-angular-composition',
      language: 'angular',
      label: 'A set of choices that is a real list',
      source: `<ul slRadioGroup class="slotted-demo-list" defaultValue="a">
  <li slRadio value="a">One item</li>
  <li slRadio value="b">And another below it</li>
</ul>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The APG table, implemented by the platform',
    note: 'Tab lands on the chosen item or on the first, the arrows move focus and selection together in both axes, the set wraps at both ends, and disabled options are skipped — none of it written here.',
    snippet: defineSnippet({
      id: 'radio-group-angular-keyboard',
      language: 'angular',
      label: 'Why the items share a name',
      source: `<!-- Native radios in one form owner with one name already implement the
     whole APG table, in a right-to-left document too. The group generates
     a name when the consumer writes none, because an unnamed set is not a
     set — the price is that such a group inside a form submits under a
     generated key. -->
<div slRadioGroup name="shipping">
  <div slRadio value="standard">Standard</div>
  <div slRadio value="express">Express</div>
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<string | undefined>',
    when: 'Before the value moves. request.value is the new value and request.previous the value it replaces, which is undefined while nothing is chosen, the state the WAI-ARIA Authoring Practices ask a group to start in. request.reason is pointer or keyboard, request.source is the originating event, and request.cancel() refuses the move before anything commits, including the platform’s own selection. There is no [(value)], because a two-way binding carries only the value and none of the rest of the request.',
  },
  {
    name: 'ControlValueAccessor and Validator',
    payload: 'string',
    when: 'Whenever the value moves under a formControl, formControlName or ngModel written on the root. The radio group also validates the set: when required, it fails with { required: true } while nothing is chosen, because “choose one” is a fact about the group and not about any one option.',
  },
];

export const ANGULAR_RADIO_GROUP_DOCS = {
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
        'SlRadioGroup',
        'The controlled value. When present, the consumer owns the choice. When absent, the radio group owns it and starts from defaultValue, or from the form control bound to the root.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'SlRadioGroup',
        'The value an uncontrolled group starts from, read once when the directive initialises. Left unset, nothing is chosen and Tab lands on the first item, as the WAI-ARIA Authoring Practices recommend for a set with no default.',
      ],
      [
        'name',
        'string',
        'generated',
        'SlRadioGroup',
        'The submission name every item shares, which is what makes the platform treat the items as one set. Generated when unset, because the platform groups radios by name within a form.',
      ],
      [
        'variant',
        "'plain' | 'tile'",
        'plain',
        'SlRadioGroup, provideRadioGroupDefaults',
        'How every item is drawn. tile frames each item and makes its whole surface the target; the inputs still share a name, so the arrow keys, the wrap and the single tab stop do not change. Arranging the tiles is left to Grid.',
      ],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'SlRadioGroup, provideRadioGroupDefaults',
        'How the choices flow. A horizontal set wraps instead of scrolling, and aria-orientation is written only where the group carries the radiogroup role.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SlRadioGroup, provideRadioGroupDefaults',
        'The type step, passed to every item. A field or field group around the radio group decides it first, then the provider. The circle follows the control glyph scale, which the theme restates per density.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'SlRadioGroup, provideRadioGroupDefaults',
        'Which side of its label each circle is on, set once for the set so the circles line up.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'SlRadioGroup, SlRadio',
        'Unset rather than false. Reaches every item as the native attribute, which also makes the browser skip the item with the arrow keys. Set it on one SlRadio to disable that option alone. A disabled form control disables the group as well.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'SlRadioGroup',
        'Unset rather than false. A radio has no native readonly, so the radio group refuses every activation and writes aria-readonly; every item keeps its tab stop, its focus ring and its contrast.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'SlRadioGroup',
        'Unset rather than false. Writes aria-invalid on the group and data-invalid on the root, which draws every circle in the danger tone with a thicker edge.',
      ],
      [
        'required',
        'boolean',
        'from the field, or false',
        'SlRadioGroup',
        'Unset rather than false. Writes aria-required on the group and makes its validator demand a value, never the native required, which would turn on browser constraint validation.',
      ],
      [
        'value, on SlRadio',
        'string',
        '—',
        'SlRadio',
        'What this item selects, and the value the group holds when it is chosen. Required: an item with no value is a choice nobody can make.',
      ],
      [
        'slRadioDescription',
        'directive',
        '—',
        'a projected element',
        'Help text under the item’s label, wired with aria-describedby, so it describes that item and not the set.',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs="slRadioGroup" / "slRadio"',
        'SlRadioGroup / SlRadio',
        '—',
        'a template',
        'Reaches either instance. inputElement on an item is its input, which already has focus() and click(), so there is no imperative handle.',
      ],
      [
        'ControlValueAccessor and Validator',
        'formControl, formControlName, ngModel',
        '—',
        'the host element',
        'Both are on the group’s root, so a form binding goes on the element that already carries slRadioGroup. required becomes a validator over the set; React has no equivalent.',
      ],
      [
        'provideRadioGroupDefaults()',
        '{ size, variant, orientation, labelPlacement }',
        '—',
        'an injector',
        'The four decisions an application takes once for every radio group under the injector. A field or field group around a radio group decides size before the token.',
      ],
      [
        'the host element',
        'any element',
        '—',
        'SlRadioGroup, SlRadio',
        'Each root is the consumer’s own element, one more element than React renders: a set of choices can be a ul with each item written as an li.',
      ],
      [
        'role',
        'string',
        'radiogroup, or none inside a field group',
        'the host element',
        'A role written as a static attribute wins over both, because it is read before the host binding computes.',
      ],
    ]),
    accessibility: [
      'The radio group follows the WAI-ARIA Authoring Practices Radio Group pattern (w3.org/WAI/ARIA/apg/patterns/radio/), and the platform implements its whole keyboard table: Tab lands on the checked item, or on the first when none is checked; Space checks the focused item; the arrow keys move focus and selection together on both axes; the set wraps at both ends; disabled items are skipped. Native radios that share a name within one form provide all of it, including the arrow directions of a right-to-left document.',
      'This is why the items share a name, and why one is generated when none is written: the platform groups radios by name within a form, so radios without a shared name are not a set. The cost is that an unnamed radio group inside a form submits under a generated key.',
      'Each item takes its accessible name from its own label, through for pointing at an identifier the component generates. The group takes its name from the field group’s legend or, outside a field group, from an aria-label the consumer writes. Inside a field group the radiogroup role is withdrawn, so the set is not announced twice.',
      'The group writes aria-required, never the native required on an item, and its validator, not any one item, demands a value, because “choose one” is a fact about the set. disabled is native, because the native attribute is also what makes the browser skip the option with the arrow keys.',
      'A radio has no native read-only state, so the radio group enforces one: it refuses the activation, aria-readonly announces it on the group, and every item keeps its tab stop, its focus ring and its full contrast. The chosen option keeps its accent, because the value is real.',
      'Refusing the activation is not enough on its own. The HTML standard’s canceled activation behaviour restores the clicked radio but not the neighbour it unchecked, so the radio group writes every element from the value afterwards. Without that, a controlled group that refused a change would show no choice at all.',
      'The invalid state does not rely on colour alone. In the high-contrast scheme the theme paints the danger border in the same colour as every other border, so the circle also thickens its edge. The sentence that says what is wrong is the field group’s error.',
      'The target is larger than the circle. A 24-pixel square around the circle meets WCAG 2.2 SC 2.5.8 at every size and density, while the circle is 14 pixels at size="sm"; the label extends the target to the end of the text, and the hover wash covers exactly that area. The row keeps its line height: the target is drawn around the circle, not laid out beside it.',
    ],
    snippets: [
      defineSnippet({
        id: 'radio-group-angular-defaults',
        language: 'ts',
        label: 'The three decisions an application takes once',
        source: `import { provideRadioGroupDefaults } from '@slotted/angular/radio-group';

bootstrapApplication(App, {
  providers: [provideRadioGroupDefaults({ orientation: 'horizontal', size: 'sm' })],
});`,
      }),
      defineSnippet({
        id: 'radio-group-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="radio-group"
  data-part="root"
  data-size="md"
  data-orientation="vertical"
  role="radiogroup"
>
  <div data-part="item" data-checked>
    <input data-part="control" type="radio" name="shipping" id="std" value="standard" checked />
    <span data-part="indicator"
      ><span data-ui="icon" data-part="root" aria-hidden="true"
        ><svg data-part="glyph" data-glyph="dot" aria-hidden="true"></svg></span
    ></span>
    <label data-part="label" for="std">Standard delivery</label>
    <p data-part="description" id="std-description">Arrives within five business days.</p>
  </div>
</div>`,
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
