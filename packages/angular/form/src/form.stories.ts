import { ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlFormActions } from './form-actions';
import type { FormErrorFocus, FormSummaryMode, FormValidate } from './form-defaults';
import { SlForm, SlFormSummary } from './form';
import { ANGULAR_FORM_DOCS, ANGULAR_FORM_TOKENS } from './form.docs';

interface FormStoryArgs {
  errorFocus: FormErrorFocus;
  guardUnsaved: boolean;
  nativeValidation: boolean;
  summary: FormSummaryMode;
  validate: FormValidate;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_FORM_DOCS.form.scenes, {
    playground: Playground,
    validation: Validation,
    errors: Errors,
    summary: Summary,
    submit: Submit,
    actions: Actions,
    states: States,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlButton,
  SlField,
  SlFieldError,
  SlFieldLabel,
  SlForm,
  SlFormActions,
  SlFormSummary,
  SlStack,
  SlTextField,
  SlTextFieldInput,
];

const MANY_ERRORS = {
  cartao:
    'The card number must have sixteen digits, with no spaces and no dashes, exactly as printed on the card',
  mes: 'Enter the expiry month',
  ano: 'Enter the expiry year',
  codigo: 'Enter the security code',
  titular: 'Enter the name printed on the card',
  cep: 'Enter the billing ZIP code',
  logradouro: 'Enter the billing street',
  numero: 'Enter the street number',
  cidade: 'Enter the billing city',
  estado: 'Enter the billing state',
  termos: 'Accept the terms of use to continue',
  cupom: 'The coupon provided has expired',
};

const meta: Meta<FormStoryArgs> = {
  title: 'Components/Form',
  component: SlForm,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Form',
        description:
          'Submission, validation, a summary of everything wrong and the focus that follows it — over the platform’s own constraint validation and over Reactive Forms, without owning the value of a single field.',
        framework: 'Angular',
        ...ANGULAR_FORM_DOCS.form,
        tokens: ANGULAR_FORM_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FormStoryArgs>;

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

/** A narrow column, for showing what a form does below 360 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

const fields = `
  <div slStack gap="6">
    <div slField>
      <label slFieldLabel>Nome completo</label>
      <div slTextField><input slTextFieldInput name="nome" required /></div>
    </div>
    <div slField>
      <label slFieldLabel>E-mail</label>
      <div slTextField><input slTextFieldInput name="email" type="email" required /></div>
    </div>
  </div>`;

const actions = `
  <div slFormActions>
    <button slButton type="button" tone="secondary" variant="ghost">Cancel</button>
    <button slButton type="submit">Place order</button>
  </div>`;

export const Playground: Story = {
  args: {
    errorFocus: 'summary',
    guardUnsaved: false,
    nativeValidation: false,
    summary: 'auto',
    validate: 'submit',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <form
          slForm
          [validate]="validate"
          [errorFocus]="errorFocus"
          [summary]="summary"
          [nativeValidation]="nativeValidation"
          [guardUnsaved]="guardUnsaved"
        >
          ${fields}
          ${actions}
        </form>
      </div>`,
  }),
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => ({
    template: grid(
      2,
      scene(
        'At submit, and again on every change',
        'The default. Press the button with the fields empty: the platform’s own messages appear, and each one disappears as soon as the field it names is edited.',
        `<form slForm validate="submit">${fields}${actions}</form>`,
      ) +
        scene(
          'At blur, one field at a time',
          'Only the control that lost focus is checked. Running the whole form on every blur would tell a reader that six fields they have not reached yet are wrong.',
          `<form slForm validate="blur">${fields}${actions}</form>`,
        ),
    ),
  }),
};

export const Errors: Story = {
  parameters: scenario('errors'),
  render: () => ({
    props: { server: { email: 'This address is already in use' } },
    template: grid(
      2,
      scene(
        'A server’s answer, keyed by the control’s name',
        'Type in the field the message names: the error is dropped as soon as the value changes, because a server’s answer is about a value that no longer exists.',
        `<form slForm validate="none" [errors]="server">${fields}${actions}</form>`,
      ) +
        scene(
          'And the platform’s own, under the same map',
          'Submit with both fields empty and a server error already showing: the two merge into one list, ordered by the document rather than by whichever object arrived last.',
          `<form slForm [errors]="server">${fields}${actions}</form>`,
        ),
    ),
  }),
};

export const Summary: Story = {
  parameters: scenario('summary'),
  render: () => ({
    props: { one: { cupom: 'Enter a valid coupon' } },
    template: grid(
      2,
      scene(
        'Rendered by the family, first in the form',
        'Submit it: focus moves to the region, which announces itself, and every item links to the field it names. Follow a link and focus lands on the control without the address bar changing.',
        `<form slForm [messages]="{ summaryTitle: 'Corrija estes campos' }">${fields}${actions}</form>`,
      ) +
        scene(
          'Placed by the consumer, or skipped entirely',
          'summary="none" leaves the region to the page; errorFocus="control" skips it and goes to the first field, which is what a form of one question wants.',
          `<form slForm summary="none" errorFocus="control" [errors]="one">
             <div slStack gap="6">
               <div slField>
                 <label slFieldLabel>Cupom</label>
                 <div slTextField><input slTextFieldInput name="cupom" required /></div>
               </div>
               <div slFormSummary></div>
             </div>
             <div slFormActions><button slButton type="submit">Aplicar</button></div>
           </form>`,
        ),
    ),
  }),
};

export const Submit: Story = {
  parameters: scenario('submit'),
  render: () => ({
    props: { refused: { email: 'The server refused this address' } },
    template: grid(
      2,
      scene(
        'A form that is waiting on an answer',
        'loading marks the form busy for work the family did not start. The root writes data-loading and aria-busy, the cursor says so, and a second submit is refused while it is set.',
        `<form slForm [loading]="true" validate="none">
           ${fields}
           <div slFormActions>
             <button slButton type="submit" [loading]="true">Enviando…</button>
           </div>
         </form>`,
      ) +
        scene(
          'And the answer it comes back with',
          'A handler that answers with an error map re-enters the path a failed validation takes: the map merges, the summary appears, and focus moves to it.',
          `<form slForm validate="none" [errors]="refused">${fields}${actions}</form>`,
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
        'Four alignments',
        'end is the default; between pushes a destructive action away from the one beside it; stretch shares the row; start is for a wizard whose next step is on the left.',
        `<form slForm>${actions}</form>
         <form slForm align="between">
           <div slFormActions>
             <button slButton type="button" tone="danger" variant="ghost">Delete</button>
             <button slButton type="submit">Save</button>
           </div>
         </form>
         <form slForm align="stretch">
           <div slFormActions>
             <button slButton type="button" tone="secondary" variant="outline">Back</button>
             <button slButton type="submit">Continue</button>
           </div>
         </form>`,
      ) +
        scene(
          'And one reflow, at 360 container pixels',
          'Below the breakpoint two buttons side by side stop being two buttons and become two half-buttons. The row becomes a column, every action takes the whole width, and the primary one goes first.',
          measure(`<form slForm>${actions}</form>`),
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { invalid: { email: 'Invalid address' } },
    template: grid(
      2,
      scene(
        'Invalid, and busy',
        'data-invalid while anything is wrong; data-loading and aria-busy while a submit is in flight. The form keeps every value on screen while it saves them, because that is what the reader is waiting on.',
        `<form slForm validate="none" [errors]="invalid">${fields}${actions}</form>`,
      ) +
        scene(
          'And a form nobody may change',
          'disabled writes the state on the root and leaves the controls to a fieldset, which disables them natively — the family does not reach into a control it does not own.',
          `<form slForm [disabled]="true">
             <fieldset disabled>
               <div slStack gap="6">
                 <div slField>
                   <label slFieldLabel>Nome completo</label>
                   <div slTextField>
                     <input slTextFieldInput name="nome" defaultValue="Ana Ribeiro" />
                   </div>
                 </div>
               </div>
             </fieldset>
             <div slFormActions><button slButton type="submit" disabled>Save</button></div>
           </form>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { many: MANY_ERRORS },
    template: grid(
      1,
      scene(
        'Eleven errors, one of them about a field that is not here',
        'The list scrolls past twelve lines rather than truncating, and the message about the coupon has no link, because the page no longer renders that field. Neither one leaves the DOM.',
        `<form slForm validate="none" [errors]="many">
           <div slStack gap="6">
             <div slField>
               <label slFieldLabel>Card number</label>
               <div slTextField><input slTextFieldInput name="card" /></div>
             </div>
           </div>
           <div slFormActions><button slButton type="submit">Tentar novamente</button></div>
         </form>`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Reached from the template',
        'exportAs hands the template the four actions a value cannot express. Press Conferir with the fields empty: validation runs without a submit, and the summary appears.',
        `<form slForm guardUnsaved #checkout="slForm">
           ${fields}
           <div slFormActions align="start">
             <button slButton type="button" variant="outline" (click)="checkout.validateNow()">
               Conferir
             </button>
             <button slButton type="button" tone="secondary" variant="ghost" (click)="checkout.reset()">
               Limpar
             </button>
           </div>
         </form>`,
      ) +
        scene(
          'And set once for an application',
          'Two tokens carry what an application decides once: provideFormDefaults for how its forms behave, and provideFormErrorMessages for the sentence of a validator the application adds. The words come from the language in force.',
          `<form slForm validate="blur">${fields}${actions}</form>`,
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { email: { email: 'The email address must contain an at sign.' } },
    template: grid(
      1,
      scene(
        'One map, shown twice, in the same words',
        'The summary and the field say the same string, because the same map feeds both. Follow the link: focus lands on the field, and the message beside it is the one you just read.',
        `<form slForm validate="none" [errors]="email">
           <div slStack gap="6">
             <div slField>
               <label slFieldLabel>Nome completo</label>
               <div slTextField><input slTextFieldInput name="nome" /></div>
             </div>
             <div slField [invalid]="true">
               <label slFieldLabel>E-mail</label>
               <div slTextField>
                 <input slTextFieldInput name="email" defaultValue="anna.bell" />
               </div>
               <p slFieldError>The email address must contain an at sign.</p>
             </div>
           </div>
           <div slFormActions><button slButton type="submit">Submit</button></div>
         </form>`,
      ),
    ),
  }),
};
