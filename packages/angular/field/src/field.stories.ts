import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlBadge } from '@slotted/angular/badge';

import { SlField } from './field';
import { provideFieldDefaults } from './field-defaults';
import type { FieldLabelPlacement, FieldNecessity, FieldSize } from './field-defaults';
import { SlFieldDescription, SlFieldError } from './field-messages';
import { SlFieldAction, SlFieldControl, SlFieldLabel } from './field-parts';
import { SlFieldCounter } from './field-counter';
import { SlFieldHeader, SlFieldHelp, SlFieldIndicator } from './field-header';
import { ANGULAR_FIELD_DOCS, ANGULAR_FIELD_TOKENS } from './field.docs';

interface FieldStoryArgs {
  labelPlacement: FieldLabelPlacement;
  required: boolean;
  necessity: FieldNecessity;
  size: FieldSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_FIELD_DOCS.field.scenes, {
    playground: Playground,
    necessity: Necessity,
    placement: Placement,
    sizes: Sizes,
    states: States,
    messages: Messages,
    counter: Counter,
    header: Header,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const DIRECTIVES = [
  SlBadge,
  SlField,
  SlFieldAction,
  SlFieldControl,
  SlFieldCounter,
  SlFieldDescription,
  SlFieldError,
  SlFieldHeader,
  SlFieldHelp,
  SlFieldIndicator,
  SlFieldLabel,
];

const meta: Meta<FieldStoryArgs> = {
  title: 'Components/Field',
  component: SlField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Field',
        description:
          'One control, its name, its necessity, its help and its error — and the identifiers that bind them, derived from one base so nothing has to be coordinated between siblings.',
        framework: 'Angular',
        ...ANGULAR_FIELD_DOCS.field,
        tokens: ANGULAR_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FieldStoryArgs>;

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
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
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

/** A narrow column, for showing what a field does below 320 pixels. */
/**
 * A narrow column: 360 pixels, or a drawer's 280 — the one under the 320
 * pixels of its own width below which a side label stacks.
 */
const measure = (body: string, width?: 'drawer') =>
  `<div class="slotted-demo-measure"${width ? ` data-width="${width}"` : ''}>${body}</div>`;

export const Playground: Story = {
  args: {
    labelPlacement: 'top',
    required: true,
    necessity: 'mark',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slField
          [size]="size"
          [labelPlacement]="labelPlacement"
          [necessity]="necessity"
          [required]="required"
        >
          <label slFieldLabel>Email</label>
          <input slFieldControl type="email" placeholder="you@company.com" />
          <span slFieldDescription>We will use this address for billing.</span>
        </div>
      </div>`,
  }),
};

export const Necessity: Story = {
  parameters: scenario('necessity'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The asterisk, and the field that carries none',
        'The mark is drawn by the label rather than written by the page, so it cannot be forgotten — and it is aria-hidden, because aria-required on the control already says it.',
        `<div slField required>
           <label slFieldLabel>Tax ID</label>
           <input slFieldControl value="12.345.678/0001-90" />
         </div>
         <div slField>
           <label slFieldLabel>State registration</label>
           <input slFieldControl />
         </div>`,
      ) +
        scene(
          'The words, for a form where most fields are optional',
          'Marking the two required fields in a form of twenty optional ones leaves the other eighteen ambiguous. necessity="words" names both sides, and the two words come from the token.',
          `<div slField required necessity="words">
             <label slFieldLabel>Tax ID</label>
             <input slFieldControl value="12.345.678/0001-90" />
           </div>
           <div slField necessity="words">
             <label slFieldLabel>State registration</label>
             <input slFieldControl />
           </div>`,
        ) +
        scene(
          'Only the exception, for a form where most fields are required',
          'necessity="optional" writes (optional) on the field a reader may skip and nothing on the others — the recommendation GOV.UK and Carbon make, because twenty asterisks say less than one word.',
          `<div slField required necessity="optional">
             <label slFieldLabel>Legal name</label>
             <input slFieldControl value="Sirius Group Technology Ltd." />
           </div>
           <div slField necessity="optional">
             <label slFieldLabel>Trade name</label>
             <input slFieldControl />
           </div>`,
        ) +
        scene(
          'Nothing, when the form says it once',
          'necessity="none" draws no mark. aria-required still reaches the control, so a reader hears “required” on every field the form marked.',
          `<div slField required necessity="none">
             <label slFieldLabel>Tax ID</label>
             <input slFieldControl value="12.345.678/0001-90" />
           </div>`,
        ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Beside the control, in a page-width form',
        'The label takes a track of its own and the control the rest. A label of twelve words wraps inside its track and stays level with the control’s first line rather than sliding under it.',
        `<div slField labelPlacement="side">
           <label slFieldLabel>Legal name</label>
           <input slFieldControl value="Sirius Group Technology" />
         </div>
         <div slField labelPlacement="side">
           <label slFieldLabel>Headquarters mailing address</label>
           <input slFieldControl value="Avenida Paulista, 1000" />
         </div>`,
      ) +
        scene(
          'The same two fields, in a 280-pixel drawer',
          'Nothing changed but the width the field has. The container query is on the field itself, so a form in a drawer stacks while the same markup in a page grid does not.',
          measure(
            `<div slField labelPlacement="side">
             <label slFieldLabel>Legal name</label>
             <input slFieldControl value="Sirius Group Technology" />
           </div>`,
            'drawer',
          ) +
            measure(
              `<div slField labelPlacement="side">
             <label slFieldLabel>Headquarters mailing address</label>
             <input slFieldControl value="Avenida Paulista, 1000" />
           </div>`,
              'drawer',
            ),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Three steps, matching the control',
        'A field is not a control and has no height of its own; what steps is the type of the label, the message and the counter, so a field sits level with the control it wraps.',
        (['sm', 'md', 'lg'] as const)
          .map(
            (size) => `<div slField size="${size}">
               <label slFieldLabel>Apelido — ${size}</label>
               <input slFieldControl value="${size}" />
               <span slFieldDescription>Appears in the reports.</span>
             </div>`,
          )
          .join(''),
      ) +
        scene(
          'Every step answers the density switch',
          'Set the toolbar to dense: all three steps read the control type scale, which is one of the three the theme restates per density, so a field in a dense table shrinks whole rather than in parts.',
          `<div slField size="lg">
             <label slFieldLabel>Unit description</label>
             <input slFieldControl value="Headquarters — Seattle" />
             <span slFieldDescription>Appears in the report header.</span>
           </div>
           <div slField size="sm">
             <label slFieldLabel>Cost center</label>
             <input slFieldControl value="CC-4021" />
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
        'Invalid, and what stays the color it was',
        'Only the message turns. The label keeps its ink because the error already says the same thing in words and in color, and a red marker on a red label is a marker nobody can see.',
        `<div slField invalid required>
           <label slFieldLabel>Tax ID</label>
           <input slFieldControl value="12.345.678" />
           <span slFieldDescription>Numbers only, with branch and check digit.</span>
           <span slFieldError>Six digits are missing.</span>
         </div>`,
      ) +
        scene(
          'Read-only, and disabled',
          'Read-only stays focusable and copyable and looks nothing like disabled, which is muted to a color the theme measures rather than faded by opacity — a label nobody can read is a field nobody can identify.',
          `<div slField readOnly>
             <label slFieldLabel>Account identifier</label>
             <input slFieldControl value="acc_9f2b7c41" />
             <span slFieldDescription>Generated when the account is created, and copyable.</span>
           </div>
           <div slField disabled required>
             <label slFieldLabel>Cost center</label>
             <input slFieldControl value="Choose a unit first" />
             <span slFieldDescription>Available once a unit is chosen.</span>
           </div>`,
        ),
    ),
  }),
};

export const Messages: Story = {
  parameters: scenario('messages'),
  render: () => ({
    props: { submitted: false },
    template: grid(
      2,
      scene(
        'Help, an error, and a warning that is neither',
        'All three are inline-message roots. The error carries a clipped “Error:” a screen reader reads before the sentence, and the warning is the same part in another tone rather than a member of its own.',
        `<div slField>
           <label slFieldLabel>Password</label>
           <input slFieldControl type="password" value="paulista1000" />
           <span slFieldDescription>Between 8 and 64 characters, with at least one number.</span>
           <span slFieldError tone="warning">The password is valid but easy to guess.</span>
         </div>`,
      ) +
        scene(
          'The line held open before the error arrives',
          'Press the button twice and watch the button itself: reserve keeps one line box of the error’s own leading whether or not there is a message, so nothing below the field moves when the error appears.',
          `<div slField [invalid]="submitted">
             <label slFieldLabel>Phone</label>
             <input slFieldControl value="(11) 90000-0000" />
             <span slFieldError reserve live="polite">{{ submitted ? 'Enter the ninth digit.' : '' }}</span>
           </div>
           <button type="button" (click)="submitted = !submitted">
             {{ submitted ? 'Clear the error' : 'Submit' }}
           </button>`,
        ),
    ),
  }),
};

export const Counter: Story = {
  parameters: scenario('counter'),
  render: () => ({
    props: {
      value:
        'Payroll, time tracking and benefits in one place, with accrual-based accounting close.',
    },
    template: grid(
      2,
      scene(
        'Type past the limit and watch the row above',
        'The count sits in the label row’s spare column, so it never shares a row with the error and never adds one. It turns at its own limit, which a count reaches before the form has decided anything.',
        `<div slField [invalid]="value.length > 140">
           <label slFieldLabel>Public description</label>
           <span slFieldCounter [invalid]="value.length > 140">{{ value.length }}/140</span>
           <textarea
             slFieldControl
             rows="3"
             [value]="value"
             (input)="value = $any($event.target).value"
           ></textarea>
           @if (value.length > 140) {
             <span slFieldError>Corte {{ value.length - 140 }} caracteres.</span>
           }
         </div>`,
      ) +
        scene(
          'The same counter beside a side label',
          'The count stands under the label, at the end of the label’s track — the place a header puts it too — so a side field says its count in one place and the control keeps the whole of its track.',
          `<div slField labelPlacement="side">
             <label slFieldLabel>Assunto</label>
             <span slFieldCounter>12/60</span>
             <input slFieldControl value="March invoice" />
           </div>`,
        ),
    ),
  }),
};

export const Header: Story = {
  parameters: scenario('header'),
  render: () => ({
    props: {
      bio: 'Data engineer; Apache Arrow contributor.',
      generated:
        'Data engineer at Sirius; maintains the ingestion layer and the internal Arrow fork.',
    },
    template:
      grid(
        2,
        scene(
          'A password, its rule and the way back in',
          'Hover the circle or tab to it and the rule opens; press it and it stays until a second press. The link takes the end of the row and a 24-pixel target that gives the line its height back.',
          `<div slField required>
           <div slFieldHeader>
             <label slFieldLabel>Password</label>
             <button slFieldHelp="At least eight characters, with letters and numbers."></button>
             <a slFieldAction href="#recover">Forgot your password?</a>
           </div>
           <input slFieldControl type="password" autocomplete="current-password" />
         </div>`,
        ) +
          scene(
            'What qualifies the field, heard on the control',
            'The badge stands outside the label, so the asterisk stays against the last word, and it joins the control’s description with the help: a reader on the control hears “Beta”, then the rule, then the sentence under it.',
            `<div slField required>
             <div slFieldHeader>
               <label slFieldLabel>Notification endpoint</label>
               <button slFieldHelp="The address that receives a POST for every invoice issued."></button>
               <span slFieldIndicator><span slBadge size="sm" tone="accent" variant="soft">Beta</span></span>
             </div>
             <input slFieldControl type="url" value="https://api.sirius.com/webhooks/invoices" />
             <span slFieldDescription>Use HTTPS; the certificate is checked on every delivery.</span>
           </div>
           <div slField disabled>
             <div slFieldHeader>
               <label slFieldLabel>Cost center</label>
               <button slFieldHelp="Unlocked once a unit is chosen."></button>
               <span slFieldIndicator><span slBadge size="sm" tone="secondary" variant="soft">Pro</span></span>
             </div>
             <input slFieldControl placeholder="Choose a unit first" />
           </div>`,
          ) +
          scene(
            'An action beside a count the page keeps',
            'Press the action and the text is replaced; type past 160 and the count turns before the form has decided anything. A count after an action stands twelve pixels from it, so a link and a number never read as one phrase.',
            `<div slField [invalid]="bio.length > 160">
             <div slFieldHeader>
               <label slFieldLabel>Introduction</label>
               <button slFieldAction (click)="bio = generated">Generate from the job title</button>
               <span slFieldCounter [invalid]="bio.length > 160">{{ bio.length }}/160</span>
             </div>
             <textarea
               slFieldControl
               rows="3"
               [value]="bio"
               (input)="bio = $any($event.target).value"
             ></textarea>
           </div>`,
          ) +
          scene(
            'All of it in a 280-pixel drawer',
            'The row wraps rather than squeezing: the label breaks between words, and the badge, the action and the count move to a line of their own, the action and the count still at its end.',
            measure(
              `<div slField required>
             <div slFieldHeader>
               <label slFieldLabel>Headquarters mailing address</label>
               <button slFieldHelp="Receives the paper invoices."></button>
               <span slFieldIndicator><span slBadge size="sm" tone="warning" variant="soft">Required for companies</span></span>
               <button slFieldAction>Use the billing one</button>
               <span slFieldCounter>0/120</span>
             </div>
             <input slFieldControl />
           </div>`,
              'drawer',
            ),
          ),
      ) +
      grid(
        1,
        scene(
          'The same row beside the control',
          'With the label beside the control the header takes the label’s track: the help follows the label, the action wraps under it, and the count stands on a line of its own at the end of the track.',
          `<div slField labelPlacement="side">
             <div slFieldHeader>
               <label slFieldLabel>Password</label>
               <button slFieldHelp="At least eight characters, with letters and numbers."></button>
               <a slFieldAction href="#recover">Forgot your password?</a>
             </div>
             <input slFieldControl type="password" />
           </div>
           <div slField labelPlacement="side">
             <div slFieldHeader>
               <label slFieldLabel>Assunto</label>
               <span slFieldCounter>12/60</span>
             </div>
             <input slFieldControl value="March invoice" />
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
        'A label no language can break, and a digest for a description',
        'Both break rather than overflowing, and the whole string stays in the DOM and findable by a page search. The necessity word never breaks: it is the one part of a label that is always a word.',
        measure(`<div slField labelPlacement="side" required necessity="words">
             <label slFieldLabel lang="de">Kraftfahrzeug-Haftpflichtversicherungsnummer</label>
             <input slFieldControl />
             <span slFieldDescription>
               sha256:9f2b7c41a8d3e05f6c1b4a97e2d80f3c5b6a1d4e7f0938271a6b5c4d3e2f1a09
             </span>
           </div>`),
      ) +
        scene(
          'The same field, mirrored',
          'Every distance is logical, so the label, the marker and the counter change sides together. Switch the toolbar to rtl and the two fields here read the same way round.',
          `<div slField invalid lang="ar" dir="rtl">
             <label slFieldLabel>رقم التعريف الضريبي</label>
             <span slFieldCounter>3/14</span>
             <input slFieldControl value="٣٠٠" />
             <span slFieldError prefix="خطأ:">الرقم غير مكتمل.</span>
           </div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideFieldDefaults({ necessity: 'words', size: 'sm' })],
    }),
  ],
  render: () => ({
    template: grid(
      2,
      scene(
        'One decision for every field in the application',
        'provideFieldDefaults sets the step and the necessity style once; the words come from the language in force. A field that states its own still wins, which is the same rule the control follows against the field.',
        `<div slField required>
           <label slFieldLabel>Tax ID</label>
           <input slFieldControl value="12.345.678/0001-90" />
         </div>
         <div slField>
           <label slFieldLabel>State registration</label>
           <input slFieldControl />
         </div>`,
      ) +
        scene(
          'The identifiers, handed back to the template',
          'exportAs gives the page the field instance, so an anchor elsewhere can point at the control the field named without the page inventing an identifier of its own.',
          `<div slField #money="slField" id="money">
             <label slFieldLabel>Installment amount</label>
             <span slFieldCounter>1 of 12</span>
             <input slFieldControl inputmode="decimal" value="R$ 1.250,00" />
             <span slFieldDescription>Charged on the 5th of each month.</span>
           </div>
           <a [href]="'#' + money.ids().control">Go to the installment amount</a>`,
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Tab into the control and listen',
        'A screen reader reads the label, then “required”, then the help behind the icon, the description and the error — one name, one description in a fixed order, and no asterisk read aloud.',
        `<div slField id="cnpj" invalid required>
           <div slFieldHeader>
             <label slFieldLabel>Tax ID</label>
             <button slFieldHelp="The headquarters one, with all fourteen digits."></button>
           </div>
           <input slFieldControl value="12.345.678" />
           <span slFieldDescription>Numbers only, with branch and check digit.</span>
           <span slFieldError live="polite">Six digits are missing.</span>
         </div>`,
      ) +
        scene(
          'Click the label, not the control',
          'The association is explicit — for pointing at the derived identifier — so the click moves focus into the control. The implicit form, wrapping the control in the label, is the one the APG records as unreliable.',
          `<div slField id="account">
             <label slFieldLabel>Account identifier</label>
             <input slFieldControl value="acc_9f2b7c41" />
             <span slFieldDescription>
               Click the label above: focus enters the field, with no JavaScript at all.
             </span>
           </div>`,
        ),
    ),
  }),
};
