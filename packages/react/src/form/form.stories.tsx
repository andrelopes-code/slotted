import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldError, FieldLabel } from '../field';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Form } from './form';
import { useFormState } from './form-context';
import { FormDefaultsProvider } from './form-defaults';
import { Grid, Measure, Scene } from './form-demo';
import { FormActions, FormSummary } from './form-parts';
import { REACT_FORM_DOCS, REACT_FORM_TOKENS } from './form.docs';
import type { FormErrors, FormHandle } from './form.types';

const MANY_ERRORS = {
  cartao:
    'The card number must have sixteen digits, with no spaces and no dashes, exactly as printed on the card',
  mes: 'Enter the expiry month',
  ano: 'Enter the expiry year',
  codigo: 'Enter the security code',
  titular: 'Enter the name printed on the card',
  cep: 'Enter the billing ZIP code',
  logradouro: 'Enter the billing street',
  numero: 'Enter the address number',
  cidade: 'Enter the billing city',
  estado: 'Enter the billing state',
  termos: 'Accept the terms of use to continue',
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_FORM_DOCS.form.scenes, {
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

const meta = {
  title: 'Components/Form',
  component: Form,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Form',
        description:
          'Submission, validation, a summary of everything wrong and the focus that follows it — over the platform’s own constraint validation, without owning the value of a single field.',
        framework: 'React',
        ...REACT_FORM_DOCS.form,
        tokens: REACT_FORM_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

function Checkout({ children, ...props }: Parameters<typeof Form>[0]) {
  return (
    <Form {...props}>
      <Stack gap={6}>
        <Field>
          <FieldLabel>Nome completo</FieldLabel>
          <TextField name="nome" required />
        </Field>
        <Field>
          <FieldLabel>E-mail</FieldLabel>
          <TextField name="email" required type="email" />
        </Field>
      </Stack>
      {children}
      <FormActions>
        <Button tone="secondary" type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Place order</Button>
      </FormActions>
    </Form>
  );
}

export const Playground: Story = {
  args: {
    errorFocus: 'summary',
    guardUnsaved: false,
    nativeValidation: false,
    summary: 'auto',
    validate: 'submit',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Checkout {...args} />
    </div>
  ),
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="At submit, and again on every change"
        layout="stack"
        note="The default. Press the button with the fields empty: the platform’s own messages appear, and each one disappears as soon as the field it names is edited."
      >
        <Checkout validate="submit" />
      </Scene>
      <Scene
        label="At blur, one field at a time"
        layout="stack"
        note="Only the control that lost focus is checked. Running the whole form on every blur would tell a reader that six fields they have not reached yet are wrong."
      >
        <Checkout validate="blur" />
      </Scene>
    </Grid>
  ),
};

function ServerAnswer() {
  const [errors, setErrors] = useState<FormErrors>({
    email: ['That address is already in use'],
  });

  return (
    <Checkout errors={errors} onErrorsChange={(next) => setErrors(next)} validate="none">
      <Button
        onClick={() =>
          setErrors({ nome: ['The name provided does not match the one on the card'] })
        }
        size="sm"
        tone="secondary"
        type="button"
        variant="outline"
      >
        Responder de novo
      </Button>
    </Checkout>
  );
}

export const Errors: Story = {
  parameters: scenario('errors'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A server’s answer, keyed by the control’s name"
        layout="stack"
        note="Type in the field the message names: the error is dropped as soon as the value changes, because a server’s answer is about a value that no longer exists."
      >
        <ServerAnswer />
      </Scene>
      <Scene
        label="And the platform’s own, under the same map"
        layout="stack"
        note="Submit with both fields empty and a server error already showing: the two merge into one list, ordered by the document rather than by whichever object arrived last."
      >
        <Checkout errors={{ email: 'That address is already in use' }} />
      </Scene>
    </Grid>
  ),
};

export const Summary: Story = {
  parameters: scenario('summary'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Rendered by the family, first in the form"
        layout="stack"
        note="Submit it: focus moves to the region, which announces itself, and every item links to the field it names. Follow a link and focus lands on the control without the address bar changing."
      >
        <Checkout summaryTitle="Corrija estes campos" />
      </Scene>
      <Scene
        label="Placed by the consumer, or skipped entirely"
        layout="stack"
        note='summary="none" leaves the region to the page; errorFocus="control" skips it and goes to the first field, which is what a form of one question wants.'
      >
        <Form errorFocus="control" summary="none">
          <Stack gap={6}>
            <Field>
              <FieldLabel>Cupom</FieldLabel>
              <TextField name="cupom" required />
            </Field>
            <FormSummary />
          </Stack>
          <FormActions>
            <Button type="submit">Aplicar</Button>
          </FormActions>
        </Form>
      </Scene>
    </Grid>
  ),
};

function BusyButton() {
  const form = useFormState();
  return (
    <Button disabled={form?.submitting} type="submit">
      {form?.submitting === true ? 'Sending…' : 'Send'}
    </Button>
  );
}

function Slow() {
  return (
    <Form
      onSubmit={async () =>
        new Promise<{ email: string }>((resolve) => {
          setTimeout(() => resolve({ email: 'The server rejected that address' }), 1200);
        })
      }
      validate="none"
    >
      <Stack gap={6}>
        <Field>
          <FieldLabel>E-mail</FieldLabel>
          <TextField defaultValue="ana@exemplo.com" name="email" />
        </Field>
      </Stack>
      <FormActions>
        <BusyButton />
      </FormActions>
    </Form>
  );
}

export const Submit: Story = {
  parameters: scenario('submit'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="An answer that takes a second"
        layout="stack"
        note="Press Send and press it again straight away: the second press does nothing, because a submit while one is pending is refused. The button reads the same state the root writes."
      >
        <Slow />
      </Scene>
      <Scene
        label="And the answer it comes back with"
        layout="stack"
        note="A handler that returns an error map re-enters the path a failed validation takes: the map merges, the summary appears, and focus moves to it."
      >
        <Checkout errors={{ email: 'The server rejected that address' }} validate="none" />
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Four alignments"
        layout="stack"
        note="end is the default; between pushes a destructive action away from the one beside it; stretch shares the row; start is for a wizard whose next step is on the left."
      >
        <Form>
          <FormActions>
            <Button tone="secondary" type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </FormActions>
        </Form>
        <Form align="between">
          <FormActions>
            <Button tone="danger" type="button" variant="ghost">
              Delete
            </Button>
            <Button type="submit">Save</Button>
          </FormActions>
        </Form>
        <Form align="stretch">
          <FormActions>
            <Button tone="secondary" type="button" variant="outline">
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </FormActions>
        </Form>
      </Scene>
      <Scene
        label="And one reflow, at 360 container pixels"
        layout="stack"
        note="Below the breakpoint two buttons side by side stop being two buttons and become two half-buttons. The row becomes a column, every action takes the whole width, and the primary one goes first."
      >
        <Measure>
          <Form>
            <FormActions>
              <Button tone="secondary" type="button" variant="ghost">
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </FormActions>
          </Form>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Invalid, and busy"
        layout="stack"
        note="data-invalid while anything is wrong; data-loading and aria-busy while a submit is in flight. The form keeps every value on screen while it saves them, because that is what the reader is waiting on."
      >
        <Checkout errors={{ email: 'Invalid address' }} validate="none" />
        <Form loading>
          <FormActions>
            <BusyButton />
          </FormActions>
        </Form>
      </Scene>
      <Scene
        label="And a form nobody may change"
        layout="stack"
        note="disabled writes the state on the root and leaves the controls to a fieldset, which disables them natively — the family does not reach into a control it does not own."
      >
        <Form disabled>
          <fieldset disabled>
            <Stack gap={6}>
              <Field>
                <FieldLabel>Nome completo</FieldLabel>
                <TextField defaultValue="Ana Ribeiro" name="nome" />
              </Field>
            </Stack>
          </fieldset>
          <FormActions>
            <Button disabled type="submit">
              Save
            </Button>
          </FormActions>
        </Form>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Eleven errors, one of them about a field that is not here"
        layout="stack"
        note="The list scrolls past twelve lines rather than truncating, and the message about the coupon has no link, because the page no longer renders that field. Neither one leaves the DOM."
      >
        <Form errors={{ ...MANY_ERRORS, cupom: 'O cupom informado expirou' }} validate="none">
          <Stack gap={6}>
            <Field>
              <FieldLabel>Card number</FieldLabel>
              <TextField name="cartao" />
            </Field>
          </Stack>
          <FormActions>
            <Button type="submit">Tentar novamente</Button>
          </FormActions>
        </Form>
      </Scene>
    </Grid>
  ),
};

function Handled() {
  const handle = useRef<FormHandle>(null);

  return (
    <Form guardUnsaved handle={handle}>
      <Stack gap={6}>
        <Field>
          <FieldLabel>Assunto</FieldLabel>
          <TextField name="assunto" required />
        </Field>
      </Stack>
      <FormActions align="start">
        <Button onClick={() => handle.current?.validate()} type="button" variant="outline">
          Conferir
        </Button>
        <Button
          onClick={() => handle.current?.reset()}
          tone="secondary"
          type="button"
          variant="ghost"
        >
          Limpar
        </Button>
      </FormActions>
    </Form>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Set once for an application"
        layout="stack"
        note="The provider carries the six decisions an application takes once. A form that states any of them itself still wins, which is how one screen departs from the house rule without changing it."
      >
        <FormDefaultsProvider validate="blur">
          <Checkout />
        </FormDefaultsProvider>
      </Scene>
      <Scene
        label="Reached from outside, and guarded"
        layout="stack"
        note="The handle reaches the four actions a value cannot express. guardUnsaved registers a beforeunload while anything has been edited — type something and try to reload the frame."
      >
        <Handled />
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One map, shown twice, in the same words"
        layout="stack"
        note="The summary and the field say the same string, because the same map feeds both. Submit this empty, then follow the second link: focus lands on the field, and the message beside it is the one you just read."
      >
        <Form>
          <Stack gap={6}>
            <Field>
              <FieldLabel>Nome completo</FieldLabel>
              <TextField name="nome" required />
            </Field>
            <Field invalid>
              <FieldLabel>Email</FieldLabel>
              <TextField defaultValue="anna.rivers" name="email" />
              <FieldError>The email address must contain an at sign.</FieldError>
            </Field>
          </Stack>
          <FormActions>
            <Button type="submit">Send</Button>
          </FormActions>
        </Form>
      </Scene>
    </Grid>
  ),
};
