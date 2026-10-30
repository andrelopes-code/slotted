import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../button';
import { Card, CardBody, CardFooter, CardHeader } from '../card';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { InlineMessage } from '../inline-message';
import { Kbd } from '../kbd';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Heading, Text } from '../typography';
import { OtpInput } from './otp-input';
import { OtpInputDefaultsProvider } from './otp-input-defaults';
import { Grid, Measure, pad, Room, Scene } from './otp-input-demo';
import { REACT_OTP_INPUT_DOCS, REACT_OTP_INPUT_TOKENS } from './otp-input.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_OTP_INPUT_DOCS.otpInput.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    groups: Groups,
    types: Types,
    mask: Mask,
    states: States,
    complete: Complete,
    content: Content,
    form: Form,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/OtpInput',
  component: OtpInput,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'OTP Input',
        description:
          'One real input and N painted boxes: a verification code with one tab stop, one accessible name, one entry in the form, and the SMS autofill a single field gets.',
        framework: 'React',
        ...REACT_OTP_INPUT_DOCS.otpInput,
        tokens: REACT_OTP_INPUT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The code every screen on this page verifies against. */
const ACCEPTED = '482915';

/** A countdown the page owns: the family has no clock. */
function useCountdown(start: number) {
  const [seconds, setSeconds] = useState(start);
  useEffect(() => {
    if (seconds === 0) return;
    const timer = window.setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);
  return [seconds, () => setSeconds(start)] as const;
}

/**
 * The second step of a sign-in to Nexora Operations: the reader has typed a
 * password, an SMS has gone out, and this is the whole of the screen.
 */
function SignInStep({
  attached,
  groups,
  mask,
  size,
  variant,
}: {
  attached?: boolean | undefined;
  groups?: readonly number[] | undefined;
  mask?: boolean | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  variant?: 'outline' | 'subtle' | undefined;
}) {
  const [attempts, setAttempts] = useState(3);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [seconds, restart] = useCountdown(42);
  const wrong = attempts < 3 && !verified;

  const verify = (code: string) => {
    setVerifying(true);
    window.setTimeout(() => {
      setVerifying(false);
      if (code === ACCEPTED) setVerified(true);
      else setAttempts((left) => left - 1);
    }, 600);
  };

  return (
    <Card fill="elevated" size="lg">
      <CardHeader>
        <Heading level={2} size="xl">
          Confirme o seu acesso
        </Heading>
        <Text size="sm" tone="muted">
          We sent a six-digit code by SMS to +1 206 •••-4821.
        </Text>
      </CardHeader>
      <CardBody>
        <Stack gap={5}>
          <Field disabled={verifying || verified} invalid={wrong}>
            <FieldLabel>Verification code</FieldLabel>
            <OtpInput
              attached={attached}
              autoFocus
              groups={groups ?? [3, 3]}
              mask={mask}
              name="code"
              onComplete={verify}
              size={size}
              variant={variant}
            />
            <FieldDescription>The code expires in 10 minutes.</FieldDescription>
            {wrong ? (
              <FieldError>
                {`Incorrect code. ${attempts === 1 ? '1 attempt left' : `${attempts} attempts left`}.`}
              </FieldError>
            ) : null}
          </Field>
          {verified ? (
            <InlineMessage tone="success">Access confirmed. Opening the dashboard…</InlineMessage>
          ) : null}
        </Stack>
      </CardBody>
      <CardFooter>
        <Button disabled={seconds > 0 || verified} onClick={restart} variant="ghost">
          {seconds > 0 ? `Resend code in 0:${pad(seconds)}` : 'Resend code'}
        </Button>
        <Button
          disabled={verified}
          loading={verifying}
          messages={{ loading: 'A verificar' }}
          type="button"
        >
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  );
}

export const Playground: Story = {
  args: {
    attached: false,
    length: 6,
    mask: false,
    placeholder: '',
    size: 'md',
    type: 'numeric',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput {...args} groups={args.length === 6 ? [3, 3] : undefined} name="code" />
        <FieldDescription>
          We sent an SMS to +1 206 •••-4821. The code accepted on this page is 482 915.
        </FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps, each where it is used"
        note="sm confirms a new e-mail inside a settings row; md is the sign-in step; lg is a phone screen where the thumb does the typing. Switch the toolbar to dense: each box shrinks whole."
        layout="block"
      >
        <Field size="sm">
          <FieldLabel>Confirm the new email</FieldLabel>
          <OtpInput length={4} size="sm" />
          <FieldDescription>Code sent to anna.rivers@nexora.com</FieldDescription>
        </Field>
        <Field size="md">
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput groups={[3, 3]} size="md" />
        </Field>
        <Field size="lg">
          <FieldLabel>SMS code</FieldLabel>
          <OtpInput groups={[3, 3]} size="lg" />
        </Field>
      </Scene>
      <Scene
        label="Beside a text field, on the same row height"
        note="A box is a square on the control height of its step, so the code and the field it follows sit on one rhythm — and inside a field, the field's step wins over the control's own."
        layout="block"
      >
        <Field size="sm">
          <FieldLabel>Phone</FieldLabel>
          <TextField defaultValue="+1 206 555-4821" inputMode="tel" readOnly />
        </Field>
        <Field size="sm">
          <FieldLabel>Code received</FieldLabel>
          <OtpInput groups={[3, 3]} size="lg" />
          <FieldDescription>size="lg" on the control, and the field's sm wins.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="outline, on the page"
        note="The frame takes the ground it is placed on, so the same control looks right on a page, inside a card and inside a sunken panel."
        layout="block"
      >
        <Field>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput defaultValue="482" groups={[3, 3]} />
        </Field>
      </Scene>
      <Scene
        label="subtle, inside a raised panel"
        note="The boxes sink into the surface with the subtle border step, the way a subtle text field does beside them."
        layout="block"
      >
        <div className="slotted-demo-surface" data-surface="raised" data-flow="stack">
          <Field>
            <FieldLabel>Verification code</FieldLabel>
            <OtpInput defaultValue="482" groups={[3, 3]} variant="subtle" />
          </Field>
          <Field>
            <FieldLabel>Dispositivo</FieldLabel>
            <TextField defaultValue="iPhone de Ana" variant="subtle" />
          </Field>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The way the SMS is written"
        note="“Your Nexora code: 482-915” arrives as two groups of three, and the field is partitioned the same way so the reader's eye does not have to regroup the digits."
        layout="block"
      >
        <Field>
          <FieldLabel>SMS code</FieldLabel>
          <OtpInput defaultValue="482" groups={[3, 3]} />
        </Field>
      </Scene>
      <Scene
        label="A backup code, printed in blocks of four"
        note="Eight alphanumeric characters in two joined groups, the way the recovery sheet prints them."
        layout="block"
      >
        <Field>
          <FieldLabel>Recovery code</FieldLabel>
          <OtpInput attached defaultValue="X7KQ" groups={[4, 4]} length={8} type="alphanumeric" />
          <FieldDescription>One of the ten codes saved when you enabled 2FA.</FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="A PIN pad"
        note="Four boxes on one seam: attached joins them and keeps a corner only at the ends, which is how a PIN reads on a terminal."
        layout="block"
      >
        <Field>
          <FieldLabel>Corporate card PIN</FieldLabel>
          <OtpInput attached length={4} />
        </Field>
      </Scene>
      <Scene
        label="A partition that does not add up"
        note="groups={[2, 2]} on a six-character code draws one group rather than nothing: a verification screen that renders no field locks the reader out."
        layout="block"
      >
        <Field>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput groups={[2, 2]} />
        </Field>
      </Scene>
    </Grid>
  ),
};

function BackupCode() {
  const [hint, setHint] = useState<string | null>(null);
  return (
    <Field>
      <FieldLabel>Recovery code</FieldLabel>
      <OtpInput
        attached
        groups={[4, 4]}
        length={8}
        onRejected={(text) => setHint(`“${text}” is not part of the code.`)}
        onValueChange={() => setHint(null)}
        transform={(text) => text.replace(/^G-/i, '').toUpperCase()}
        type="alphanumeric"
      />
      <FieldDescription>
        {hint ?? 'Paste the code as it appears on the sheet, with or without the G- prefix.'}
      </FieldDescription>
    </Field>
  );
}

function HexCode() {
  const [hint, setHint] = useState<string | null>(null);
  return (
    <Field>
      <FieldLabel>Key fingerprint</FieldLabel>
      <OtpInput
        length={6}
        onRejected={(text) => setHint(`“${text}” is not hexadecimal.`)}
        onValueChange={() => setHint(null)}
        pattern={/[0-9a-f]/i}
        transform={(text) => text.toLowerCase()}
        type="alphanumeric"
      />
      <FieldDescription>{hint ?? 'Os seis primeiros caracteres de a3:f9:…'}</FieldDescription>
    </Field>
  );
}

export const Types: Story = {
  parameters: scenario('types'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Digits, and the numeric keyboard"
        note="type=numeric accepts 0–9 and asks a phone for its numeric keypad. Type a letter: nothing appears, and onRejected says what was dropped."
        layout="block"
      >
        <Field>
          <FieldLabel>SMS code</FieldLabel>
          <OtpInput groups={[3, 3]} />
        </Field>
      </Scene>
      <Scene
        label="A backup code with a prefix nobody types"
        note="transform strips the printed G- and uppercases before the filter runs, so pasting “g-x7kq2m9p” from the recovery sheet lands as X7KQ 2M9P."
        layout="block"
      >
        <BackupCode />
      </Scene>
      <Scene
        label="A pattern outranks the type"
        note="pattern is tested per character: only hexadecimal digits pass, whatever type says, and the keyboard is still type's."
        layout="block"
      >
        <HexCode />
      </Scene>
    </Grid>
  ),
};

export const Mask: Story = {
  parameters: scenario('mask'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Authorising a payment"
        note="The PIN is a secret on a shared screen: the control is type=password, so a screen reader counts characters instead of reading them, and every filled box shows a bullet."
        layout="block"
      >
        <Card fill="outline" size="md">
          <CardHeader>
            <Heading level={3} size="lg">
              Authorize payment
            </Heading>
            <Text size="sm" tone="muted">
              $12,480.00 to Anderson Metalworks · due 09/30.
            </Text>
          </CardHeader>
          <CardBody>
            <Field>
              <FieldLabel>Authorization PIN</FieldLabel>
              <OtpInput attached autoComplete="off" length={4} mask />
              <FieldDescription>The four digits set in your preferences.</FieldDescription>
            </Field>
          </CardBody>
          <CardFooter>
            <Button variant="ghost">Cancelar</Button>
            <Button>Autorizar</Button>
          </CardFooter>
        </Card>
      </Scene>
      <Scene
        label="Masked, but still one value"
        note="Paste, arrows, Backspace and the selection all work as they do unmasked: the boxes show bullets, the input holds the digits."
        layout="block"
      >
        <Field>
          <FieldLabel>Novo PIN</FieldLabel>
          <OtpInput attached autoComplete="new-password" defaultValue="5391" length={4} mask />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Wrong code, two attempts left"
        note="Invalid keeps the danger edge on every box and retargets the focus ring; the error is in words below, so the state is never colour alone."
        layout="block"
      >
        <Field invalid>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput defaultValue="482910" groups={[3, 3]} />
          <FieldError>Incorrect code. 2 attempts left.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Already verified, shown for the record"
        note="Read-only keeps full-strength ink and only its ground changes: the value is real and still submitted, and there is no caret because there is nothing to type."
        layout="block"
      >
        <Field readOnly>
          <FieldLabel>Code used</FieldLabel>
          <OtpInput defaultValue="482915" groups={[3, 3]} />
          <FieldDescription>Verified on 09/16 at 14:02.</FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="While the code is being checked"
        note="Disabled is muted to a measured colour rather than faded, so a form that is waiting still says what it holds."
        layout="block"
      >
        <Field disabled>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput defaultValue="482915" groups={[3, 3]} />
        </Field>
        <div className="slotted-demo-row">
          <Button loading messages={{ loading: 'A verificar' }}>
            Confirmar
          </Button>
        </div>
      </Scene>
      <Scene
        label="Inside a disabled fieldset"
        note="The control was never told: the browser disabled it through the fieldset, and the stylesheet matches :disabled beside the attribute."
        layout="block"
      >
        <fieldset disabled>
          <Field>
            <FieldLabel>Verification code</FieldLabel>
            <OtpInput defaultValue="48" groups={[3, 3]} />
          </Field>
        </fieldset>
      </Scene>
    </Grid>
  ),
};

function VerifyOnComplete() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'wrong'>('idle');
  const verify = (code: string) => {
    setStatus('checking');
    window.setTimeout(() => setStatus(code === ACCEPTED ? 'ok' : 'wrong'), 600);
  };
  return (
    <Stack gap={4}>
      <Field disabled={status === 'checking'} invalid={status === 'wrong'}>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput groups={[3, 3]} onComplete={verify} onValueChange={() => setStatus('idle')} />
        <FieldDescription>Type 482 915 and watch: nothing to click.</FieldDescription>
        {status === 'wrong' ? <FieldError>Incorrect code.</FieldError> : null}
      </Field>
      {status === 'checking' ? (
        <InlineMessage tone="secondary">A verificar…</InlineMessage>
      ) : status === 'ok' ? (
        <InlineMessage tone="success">Acesso confirmado.</InlineMessage>
      ) : null}
    </Stack>
  );
}

function AutoSubmitForm() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(String(new FormData(event.currentTarget).get('code')));
  };
  return (
    <form onSubmit={onSubmit}>
      <Field>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput autoSubmit groups={[3, 3]} name="code" />
        <FieldDescription>
          {submitted === null
            ? 'The form is submitted at the sixth digit, with no button.'
            : `Submitted: code=${submitted}`}
        </FieldDescription>
      </Field>
    </form>
  );
}

export const Complete: Story = {
  parameters: scenario('complete'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Verify on the last digit"
        note="onComplete fires the moment the sixth digit lands; the page disables the field while it checks, and a wrong code comes back as the invalid state."
        layout="block"
      >
        <VerifyOnComplete />
      </Scene>
      <Scene
        label="Submit the form on the last digit"
        note="autoSubmit calls requestSubmit() on the owning form, so submit handlers and native validation run as if the reader had pressed the button."
        layout="block"
      >
        <AutoSubmitForm />
      </Scene>
    </Grid>
  ),
};

function PasteHint() {
  const [hint, setHint] = useState('Paste “482-915” exactly as it appears in the SMS.');
  return (
    <Field>
      <FieldLabel>SMS code</FieldLabel>
      <OtpInput
        groups={[3, 3]}
        onRejected={(text) => setHint(`Discarded: “${text}”. The digits stayed.`)}
      />
      <FieldDescription>{hint}</FieldDescription>
    </Field>
  );
}

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A value longer than the code"
        note="defaultValue=“12-3456789” is cut to what the code accepts before it reaches the element: six digits, the hyphen dropped."
        layout="block"
      >
        <Field>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput defaultValue="12-3456789" groups={[3, 3]} />
        </Field>
      </Scene>
      <Scene
        label="A paste with a hyphen in it"
        note="The SMS reads 482-915 and the reader pastes it whole: the digits land in six boxes and the hyphen is reported, not swallowed silently."
        layout="block"
      >
        <PasteHint />
      </Scene>
      <Scene
        label="A right-to-left page"
        note="The label and the help mirror; the boxes do not. A code is a number, and the SMS shows 482 915 in that order whichever way the page runs."
        layout="block"
      >
        <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack" dir="rtl">
          <Field>
            <FieldLabel>رمز التحقق</FieldLabel>
            <OtpInput defaultValue="482" groups={[3, 3]} />
            <FieldDescription>أرسلنا رسالة نصية إلى ‎+55 11 9••••-4821</FieldDescription>
          </Field>
        </div>
      </Scene>
      <Scene
        label="A 360-pixel column, and narrower"
        note="Eight boxes in a narrow column. Drag the toolbar narrower still: each box gives up width, down to six tenths of its height, before the row overflows, and none is lost."
        layout="block"
      >
        <Measure>
          <Field>
            <FieldLabel>Recovery code</FieldLabel>
            <OtpInput defaultValue="X7KQ" groups={[4, 4]} length={8} type="alphanumeric" />
          </Field>
        </Measure>
      </Scene>
    </Grid>
  ),
};

function NativeForm() {
  const [entry, setEntry] = useState<string | null>(null);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntry(String(new FormData(event.currentTarget).get('code')));
  };
  return (
    <Stack gap={4} render={(props) => <form {...props} onSubmit={onSubmit} />}>
      <Field>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput defaultValue="482" groups={[3, 3]} name="code" webOtp />
        <FieldDescription>
          {entry === null
            ? 'name="code": one entry in FormData.'
            : `FormData.get('code') → "${entry}"`}
        </FieldDescription>
      </Field>
      <div className="slotted-demo-row">
        <Button type="submit">Confirmar</Button>
        <Button type="reset" variant="ghost">
          Limpar
        </Button>
      </div>
    </Stack>
  );
}

export const Form: Story = {
  parameters: scenario('form'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One native input in a native form"
        note="Submit reads one entry from FormData; reset restores defaultValue and the boxes follow. webOtp is on: in Chrome on Android the code arrives from the SMS with reason “programmatic”, and everywhere else nothing happens."
        layout="block"
      >
        <NativeForm />
      </Scene>
      <Scene
        label="Required, the field's way"
        note="required on the field writes aria-required, never the native attribute: the browser's own validation bubble would speak over the field's error."
        layout="block"
      >
        <Field required>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput groups={[3, 3]} name="code" />
          <FieldDescription>Required to complete sign-in.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The whole sign-in step, on a phone"
        note="The field names the control and carries its error; the resend is a button with a countdown the page owns; Confirmar shows its waiting state while the sixth digit is checked. Type 482 915 to pass, anything else to see the attempts count down."
        layout="block"
      >
        <Room room="phone">
          <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
            <SignInStep />
          </div>
        </Room>
      </Scene>
      <Scene
        label="An application whose codes are all four digits"
        note="OtpInputDefaultsProvider sets length, attached and the subtle variant once; every control under it follows, and one that states its own length still wins."
        layout="block"
      >
        <OtpInputDefaultsProvider attached length={4} variant="subtle">
          <Stack gap={5}>
            <Field>
              <FieldLabel>PIN de acesso</FieldLabel>
              <OtpInput mask />
            </Field>
            <Field>
              <FieldLabel>Terminal code</FieldLabel>
              <OtpInput />
            </Field>
            <Field>
              <FieldLabel>Recovery code</FieldLabel>
              <OtpInput groups={[4, 4]} length={8} type="alphanumeric" />
              <FieldDescription>States its own length and wins over the provider.</FieldDescription>
            </Field>
          </Stack>
        </OtpInputDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

function SelectionReadout() {
  const ref = useRef<HTMLInputElement>(null);
  const [readout, setReadout] = useState('No selection.');
  const read = () => {
    const element = ref.current;
    if (element === null) return;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    setReadout(
      start === end
        ? `Cursor before box ${start + 1}, inserting.`
        : end - start === 1
          ? `Box ${start + 1} selected: the next key replaces it.`
          : `Boxes ${start + 1}–${end} selected.`,
    );
  };
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput
          defaultValue="482915"
          groups={[3, 3]}
          onBlur={() => setReadout('No selection.')}
          onChange={read}
          onFocus={read}
          onKeyUp={read}
          onPointerUp={read}
          ref={ref}
        />
        <FieldDescription>{readout}</FieldDescription>
      </Field>
    </Stack>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One tab stop, and where the cursor is"
        note="Tab into the full code: the last digit is selected, and typing replaces it. Press ← and → to walk the boxes, Shift+← to grow the selection, Backspace to delete and move back."
        layout="block"
      >
        <SelectionReadout />
      </Scene>
      <Scene
        label="Every key is the browser's"
        note="The family binds nothing. What a text field does with these keys, this control does; the only thing added is that a cursor inside the value always has one character selected."
        layout="prose"
      >
        <p>
          <Kbd keyName="tab" /> enters the control. <Kbd keyName="arrowleft" /> and{' '}
          <Kbd keyName="arrowright" /> move across the boxes. <Kbd keyName="home" /> and{' '}
          <Kbd keyName="end" /> jump to the ends. <Kbd keyName="shift" /> + arrows select a range,{' '}
          <Kbd keyName="mod" /> + <Kbd keyName="a" /> selects everything.
        </p>
        <p>
          <Kbd keyName="backspace" /> deletes the selected character and moves back;{' '}
          <Kbd keyName="delete" /> deletes forward. <Kbd keyName="mod" /> + <Kbd keyName="v" />{' '}
          pastes into the cursor, hyphens and spaces dropped. <Kbd keyName="escape" /> does nothing:
          a dialog around the control keeps it.
        </p>
      </Scene>
    </Grid>
  ),
};
