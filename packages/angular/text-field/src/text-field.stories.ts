import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  SlField,
  SlFieldCounter,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
} from '@slotted/angular/field';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlButton } from '@slotted/angular/button';
import { SlButtonGroup } from '@slotted/angular/button-group';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlKbd } from '@slotted/angular/kbd';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';
import { SlSwitch } from '@slotted/angular/switch';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';

import { SlTextField } from './text-field';
import type { TextFieldSize, TextFieldVariant } from './text-field-defaults';
import { SlTextFieldInput } from './text-field-input';
import { SlTextFieldAction, SlTextFieldEnd, SlTextFieldStart } from './text-field-parts';
import { ANGULAR_TEXT_FIELD_DOCS, ANGULAR_TEXT_FIELD_TOKENS } from './text-field.docs';

interface TextFieldStoryArgs {
  clearable: boolean;
  mono: boolean;
  revealable: boolean;
  size: TextFieldSize;
  variant: TextFieldVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TEXT_FIELD_DOCS.textField.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    adornments: Adornments,
    actions: Actions,
    menu: MenuInside,
    copy: Copy,
    password: Password,
    loading: Loading,
    states: States,
    count: Count,
    types: Types,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlField,
  SlFieldCounter,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlButton,
  SlButtonGroup,
  SlGlyph,
  SlIcon,
  SlKbd,
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuTrigger,
  SlSwitch,
  SlTextField,
  SlTextFieldAction,
  SlTextFieldEnd,
  SlTextFieldInput,
  SlTextFieldStart,
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
];

const glyph = (name: string) => `<span slIcon><svg slGlyph name="${name}"></svg></span>`;

const meta: Meta<TextFieldStoryArgs> = {
  title: 'Components/TextField',
  component: SlTextField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Text Field',
        description:
          'One line of text and everything that sits inside its border — an adornment, a clear button, a password toggle — around an input that keeps the value, the identifier and every native attribute.',
        framework: 'Angular',
        ...ANGULAR_TEXT_FIELD_DOCS.textField,
        tokens: ANGULAR_TEXT_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TextFieldStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    clearable: true,
    mono: false,
    revealable: false,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>E-mail</label>
          <div
            slTextField
            [size]="size"
            [variant]="variant"
            [mono]="mono"
            [clearable]="clearable"
            [revealable]="revealable"
          >
            <input slTextFieldInput type="email" placeholder="you@company.com" />
          </div>
          <span slFieldDescription>We will use this address for billing.</span>
        </div>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps on their own',
        'Height, inline padding, type and glyph all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
        `<div slTextField size="sm"><input slTextFieldInput defaultValue="Compact" /></div>
         <div slTextField size="md"><input slTextFieldInput defaultValue="Default" /></div>
         <div slTextField size="lg"><input slTextFieldInput defaultValue="Comfortable" /></div>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'A small field holding a medium control is a field and a control disagreeing about one row, so the control reads the field’s step before the application token’s.',
          `<div slField size="sm">
             <label slFieldLabel>Code</label>
             <div slTextField><input slTextFieldInput defaultValue="SR-4412" /></div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Legal name</label>
             <div slTextField><input slTextFieldInput defaultValue="Sirius Group" /></div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A frame that takes the ground it is placed on',
        'outline paints no ground of its own, so the same control looks right on a page, inside a card and inside a sunken panel without a second token.',
        `<div slTextField><input slTextFieldInput defaultValue="outline" /></div>
         <div slTextField variant="subtle"><input slTextFieldInput defaultValue="subtle" /></div>`,
      ) +
        scene(
          'A cell that is only a control while it is used',
          'plain shows no border at rest and keeps exactly the same box, so a table row does not reflow when the pointer crosses it. Hover one and the edge arrives.',
          `<div slTextField variant="plain" mono>
             <input slTextFieldInput defaultValue="20260442" />
           </div>
           <div slTextField variant="plain">
             <input slTextFieldInput defaultValue="Reembolso da nota" />
           </div>`,
        ),
    ),
  }),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A mark before the value and a unit after it',
        'Neither is ever squeezed: the value gives up width first, because the value is the part that can scroll. Switch the toolbar to rtl and R$ stays R$.',
        `<div slTextField>
           <span slTextFieldStart>R$</span>
           <input slTextFieldInput inputmode="decimal" defaultValue="1.480,00" />
           <span slTextFieldEnd>BRL</span>
         </div>
         <div slTextField>
           <span slTextFieldStart>&#64;</span>
           <input slTextFieldInput defaultValue="ada.lovelace" />
         </div>`,
      ) +
        scene(
          'An adornment on the consumer’s own element',
          'Every part but the two buttons is a directive, so a span, an icon or a kbd all work and none of them loses its own semantics or its own attributes.',
          `<div slTextField size="sm">
             <span slTextFieldStart>%</span>
             <input slTextFieldInput defaultValue="12,5" inputmode="decimal" />
           </div>
           <div slTextField>
             <input slTextFieldInput type="search" placeholder="Search orders" />
             <span slTextFieldEnd>⌘K</span>
           </div>`,
        ),
    ),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Clear, and where focus lands after it',
        'The button is drawn only once there is something to clear. Press it: the value goes, the request says reason “clear”, and focus returns to the control rather than staying on a button that has just vanished.',
        `<div slTextField clearable>
           <input slTextFieldInput type="search" defaultValue="invoice 2026" />
         </div>
         <div slTextField clearable>
           <input slTextFieldInput placeholder="Nothing to clear yet" />
         </div>`,
      ) +
        scene(
          'Reveal, and the caret it does not move',
          'Put the caret in the middle of the password and press the toggle: the type swaps and the caret stays. aria-pressed carries the state, so the label never changes with it.',
          `<div slTextField revealable>
             <input
               slTextFieldInput
               type="password"
               autocomplete="current-password"
               defaultValue="senha-secreta"
             />
           </div>
           <div slTextField clearable revealable>
             <input slTextFieldInput type="password" defaultValue="outra-senha" />
           </div>`,
        ),
    ),
  }),
};

export const MenuInside: Story = {
  name: 'Menu',
  parameters: scenario('menu'),
  render: () => ({
    props: { country: '+55', category: 'Todos' },
    template: grid(
      2,
      scene(
        'A menu that names part of the value',
        'The country code is a menu of radio items: open it with Enter, Space or ArrowDown, and the trigger stays pressed while the menu is open. A category beside a search is the same shape at the other end.',
        `<div slTextField>
           <span slTextFieldStart>
             <button slTextFieldAction [slMenuTriggerFor]="countries">{{ country }} ${glyph('chevron-down')}</button>
           </span>
           <input slTextFieldInput type="tel" aria-label="Phone" defaultValue="415 555-0132" />
         </div>
         <sl-menu #countries>
           <sl-menu-radio-group [(value)]="country">
             <button slMenuRadioItem value="+55">Brasil +55</button>
             <button slMenuRadioItem value="+351">Portugal +351</button>
             <button slMenuRadioItem value="+244">Angola +244</button>
             <button slMenuRadioItem value="+1">Estados Unidos +1</button>
           </sl-menu-radio-group>
         </sl-menu>
         <div slTextField>
           <span slTextFieldStart>${glyph('search')}</span>
           <input slTextFieldInput type="search" aria-label="Search products" placeholder="Search products" />
           <span slTextFieldEnd>
             <button slTextFieldAction [slMenuTriggerFor]="categories">{{ category }} ${glyph('chevron-down')}</button>
           </span>
         </div>
         <sl-menu #categories>
           <sl-menu-radio-group [(value)]="category">
             <button slMenuRadioItem value="Todos">Todos</button>
             <button slMenuRadioItem value="Parafusos">Parafusos</button>
             <button slMenuRadioItem value="Arruelas">Arruelas</button>
           </sl-menu-radio-group>
         </sl-menu>`,
      ) +
        scene(
          'A command, an overflow, a hint and a shortcut',
          'A button named by its words is padded and carries the value’s ink; one named by aria-label is square and quiet, like the family’s own. A key sits at the inner height of the control.',
          `<div slTextField>
             <input slTextFieldInput type="search" aria-label="Search notes" defaultValue="invoice" />
             <span slTextFieldEnd><button slTextFieldAction>Search</button></span>
           </div>
           <div slTextField>
             <input slTextFieldInput aria-label="File name" defaultValue="report-q3.pdf" />
             <span slTextFieldEnd>
               <button slTextFieldAction aria-label="More actions" [slMenuTriggerFor]="more">${glyph('ellipsis')}</button>
             </span>
           </div>
           <sl-menu #more>
             <button slMenuItem>Renomear</button>
             <button slMenuItem>Duplicar</button>
             <button slMenuItem>Mover para…</button>
           </sl-menu>
           <div slTextField>
             <span slTextFieldStart>$</span>
             <input slTextFieldInput inputmode="decimal" aria-label="Credit limit" defaultValue="5,000.00" />
             <span slTextFieldEnd>
               <ng-container slTooltip [portal]="false">
                 <button slTextFieldAction slTooltipTrigger aria-label="How the limit is calculated">${glyph('circle-info')}</button>
                 <ng-template slTooltipLayer>
                   <div slTooltipContent>Average of the last six months of billing.</div>
                 </ng-template>
               </ng-container>
             </span>
           </div>
           <div slTextField>
             <input slTextFieldInput type="search" aria-label="Search the documentation" placeholder="Search the documentation" />
             <span slTextFieldEnd><kbd slKbd keyName="mod"></kbd><kbd slKbd>K</kbd></span>
           </div>`,
        ) +
        scene(
          'Joined to a button outside the frame',
          'An addon outside the border is button-group’s shape: shared edges, one seam, corners on the ends. The field takes the width the button leaves, so the button’s label never wraps.',
          `<div slButtonGroup justify="start">
             <div slTextField>
               <span slTextFieldStart>https://</span>
               <input slTextFieldInput aria-label="Domain" defaultValue="nexora.app" />
             </div>
             <button slButton tone="secondary" variant="outline">Verify</button>
           </div>`,
          'block',
        ),
    ),
  }),
};

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A link somebody has to paste elsewhere',
        'Press the copy button: the mark turns to a check in the success ink for two seconds and “Copied” is announced. The value is read-only and still selectable.',
        `<div slTextField copyable>
           <input slTextFieldInput readonly aria-label="Link de convite" defaultValue="https://nexora.app/convite/8f3a" />
         </div>`,
      ) +
        scene(
          'A secret key, set in the monospaced face',
          'Copy stays while the value is read-only and leaves only when there is nothing to copy or the control is disabled.',
          `<div slTextField copyable mono>
             <span slTextFieldStart>${glyph('lock')}</span>
             <input slTextFieldInput readonly aria-label="Chave da API" defaultValue="sk_live_51Hx9fQ2" />
           </div>
           <div slTextField copyable>
             <input slTextFieldInput readonly aria-label="Empty key" placeholder="No key generated" />
           </div>`,
        ),
    ),
  }),
};

export const Password: Story = {
  parameters: scenario('password'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Sign in',
        'Focus the password and switch Caps Lock on: the warning mark appears before the eye, in the warning ink, and “Caps Lock is on” is announced once. Blur the control and it goes.',
        `<div slField>
           <label slFieldLabel>Senha</label>
           <div slTextField revealable>
             <span slTextFieldStart>${glyph('lock')}</span>
             <input slTextFieldInput type="password" autocomplete="current-password" defaultValue="senha-secreta" />
           </div>
         </div>`,
      ) +
        scene(
          'Choose a new one',
          'The rule is the application’s, written in the field’s description; the family counts and reveals, and does not score a password.',
          `<div slField>
             <label slFieldLabel>Nova senha</label>
             <div slTextField revealable>
               <input slTextFieldInput type="password" autocomplete="new-password" showCount countMax="12" />
             </div>
             <span slFieldDescription>At least 12 characters, with a number.</span>
           </div>`,
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: { checking: true },
    template: grid(
      2,
      scene(
        'A check that never takes the keyboard',
        'The ring stands before the clear button and the input is aria-busy, but the value stays editable. Switch the check off and the ring shrinks out on the leaving curve.',
        `<div class="slotted-demo-stack">
           <div slField>
             <label slFieldLabel>Nome de utilizador</label>
             <div slTextField clearable [loading]="checking">
               <span slTextFieldStart>@</span>
               <input slTextFieldInput defaultValue="ada.lovelace" />
             </div>
             <span slFieldDescription>We check whether the name is available as you type.</span>
           </div>
           <span slSwitch [checked]="checking" (checkedChange)="checking = $event.value">Checking</span>
         </div>`,
        'block',
      ) +
        scene(
          'Searching as the reader types',
          'The same ring in a search, with nothing after it: it takes the end of the frame the clear button would take.',
          `<div slTextField loading>
             <input slTextFieldInput type="search" aria-label="Supplier" defaultValue="supplier" />
           </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Invalid, and what says so besides the border',
        'The border is the quietest part of it: aria-invalid announces the state and the field’s error says it in words, because in the high-contrast scheme the border cannot carry it at all.',
        `<div slField invalid>
           <label slFieldLabel>EIN</label>
           <div slTextField><input slTextFieldInput defaultValue="12-3" /></div>
           <span slFieldError>Six digits missing.</span>
         </div>`,
      ) +
        scene(
          'Read-only is not disabled',
          'Read-only keeps full-strength ink, stays focusable and copyable and is still submitted; disabled is muted to a measured colour rather than faded, so a disabled form still says what it holds.',
          `<div slTextField>
             <input slTextFieldInput readonly defaultValue="Somente leitura" />
           </div>
           <div slTextField>
             <input slTextFieldInput disabled defaultValue="Desativado" />
           </div>
           <div slTextField>
             <span slTextFieldStart>R$</span>
             <input slTextFieldInput disabled defaultValue="1.480,00" />
           </div>`,
        ),
    ),
  }),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A limit the browser enforces',
        'The control counts and the field draws it in the spare column of its label row, so a count that appears on the first keystroke never pushes the message below it.',
        `<div slField>
           <label slFieldLabel>Assunto</label>
           <div slTextField>
             <input
               slTextFieldInput
               showCount
               maxlength="60"
               defaultValue="Reembolso da nota 2026-0442"
             />
           </div>
           <span slFieldDescription>Aparece na lista de chamados.</span>
         </div>`,
      ) +
        scene(
          'A limit the browser does not',
          'countMax without maxlength is a soft limit: the value may pass it, and the counter turns red before validation has run — which is the only moment the count is being read.',
          `<div slField>
             <label slFieldLabel>Public nickname</label>
             <div slTextField>
               <input slTextFieldInput showCount countMax="16" defaultValue="Ada Lovelace Byron" />
             </div>
           </div>
           <div slField>
             <label slFieldLabel>Description</label>
             <span slFieldCounter>3 words</span>
             <div slTextField>
               <input slTextFieldInput showCount defaultValue="delivery running late" />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Types: Story = {
  parameters: scenario('types'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The type, and what travels with it',
        'A phone field that offers the wrong keyboard on a phone is a field nobody fills in twice, so inputmode, enterkeyhint and autocomplete all reach the element untouched.',
        `<div slTextField>
           <input slTextFieldInput type="email" autocomplete="email" defaultValue="ada@sirius.com.br" />
         </div>
         <div slTextField>
           <input slTextFieldInput type="tel" inputmode="tel" defaultValue="+55 11 98765-4321" />
         </div>
         <div slTextField>
           <input slTextFieldInput type="url" enterkeyhint="go" defaultValue="https://sirius.com.br" />
         </div>`,
      ) +
        scene(
          'Search, and the decoration the family withdrew',
          'WebKit adds its own clear button to a search input; the family draws one of its own, so the platform’s is withdrawn rather than left to sit beside it.',
          `<div slTextField clearable>
             <input slTextFieldInput type="search" enterkeyhint="search" defaultValue="invoice" />
           </div>
           <div slTextField mono>
             <input slTextFieldInput defaultValue="ghp_9Xk2LmQ4pR7tV0wZ" />
           </div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Longer than the box, and unbreakable',
        'The value ellipsises rather than clipping mid-glyph, and nothing is removed from the DOM: the whole string stays selectable, copyable and reachable with the caret.',
        `<div slTextField>
           <input
             slTextFieldInput
             defaultValue="Kraftfahrzeug-Haftpflichtversicherungsnummer-2026-0442-XZ"
           />
         </div>
         <div slTextField>
           <input slTextFieldInput placeholder="Enter the invoice number, with series and subseries" />
         </div>`,
      ) +
        scene(
          'At 240 pixels, and in the other direction',
          'The value surrenders width first while the adornments keep their target size, so the clear button stays hittable in a drawer as narrow as a phone.',
          measure(
            `<div slTextField clearable>
               <span slTextFieldStart>R$</span>
               <input slTextFieldInput defaultValue="1.480.320.559,00" />
             </div>`,
          ) +
            measure(
              `<div slTextField clearable>
                 <input slTextFieldInput dir="rtl" defaultValue="مرحبا بالعالم" />
               </div>`,
            ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { email: new FormControl('ada@sirius.com.br') },
    template: grid(
      2,
      scene(
        'A control that belongs in a reactive form',
        'ControlValueAccessor is the two-way binding the ecosystem expects, and it is why there is no [(value)]: a two-way binding has one slot and can carry neither a reason nor cancel().',
        `<div slTextField clearable>
           <input slTextFieldInput [formControl]="email" type="email" />
         </div>`,
      ) +
        scene(
          'Reaching the instance, and the element under it',
          'exportAs hands the template the directive, and inputElement is the native element — which already has focus, select and setSelectionRange, so no handle is invented for them.',
          `<div slTextField>
             <input slTextFieldInput #field="slTextFieldInput" defaultValue="Select all" />
             <span slTextFieldEnd>
               <button slTextFieldAction (click)="field.inputElement.select()">Select</button>
             </span>
           </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Tab reaches the value, then each button',
        'Both buttons are real buttons in the tab order, each with its own ring inside the frame — so tabbing from the value moves something visible rather than leaving one ring around the whole box. Nothing is bound to Escape.',
        `<div slTextField clearable revealable>
           <input slTextFieldInput type="password" defaultValue="senha-secreta" />
         </div>
         <div slTextField clearable>
           <input slTextFieldInput type="search" defaultValue="pressione Tab" />
         </div>`,
      ),
    ),
  }),
};
