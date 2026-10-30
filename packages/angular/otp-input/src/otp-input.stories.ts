import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader } from '@slotted/angular/card';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlKbd } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlHeading, SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlOtpInput } from './otp-input';
import { SlOtpInputControl } from './otp-input-control';
import type { OtpInputRejection } from './otp-input-control';
import { provideOtpInputDefaults } from './otp-input-defaults';
import type { OtpInputSize, OtpInputType, OtpInputVariant } from './otp-input-defaults';
import { ANGULAR_OTP_INPUT_DOCS, ANGULAR_OTP_INPUT_TOKENS } from './otp-input.docs';

interface OtpInputStoryArgs {
  attached: boolean;
  length: number;
  mask: boolean;
  placeholder: string;
  size: OtpInputSize;
  type: OtpInputType;
  variant: OtpInputVariant;
}

/** The code every screen on this page verifies against. */
const ACCEPTED = '482915';

/** Two digits, the way a countdown is written. */
const pad = (seconds: number) => String(seconds).padStart(2, '0');

const FIELD = [SlField, SlFieldDescription, SlFieldError, SlFieldLabel];
const FAMILY = [SlOtpInput, SlOtpInputControl];

/**
 * The second step of a sign-in to Nexora Operations: the reader has typed a
 * password, an SMS has gone out, and this is the whole of the screen.
 */
@Component({
  selector: 'sl-otp-input-sign-in-demo',
  standalone: true,
  imports: [
    ...FIELD,
    ...FAMILY,
    SlButton,
    SlCard,
    SlCardBody,
    SlCardFooter,
    SlCardHeader,
    SlHeading,
    SlInlineMessage,
    SlStack,
    SlText,
  ],
  template: `
    <div slCard fill="elevated" size="lg">
      <div slCardHeader>
        <h2 slHeading size="xl">Confirm your access</h2>
        <p slText size="sm" tone="muted">We sent a six-digit code by SMS to +1 206 •••-4821.</p>
      </div>
      <div slCardBody>
        <div slStack [gap]="5">
          <div slField [disabled]="verifying() || verified()" [invalid]="wrong()">
            <label slFieldLabel>Verification code</label>
            <div slOtpInput [groups]="[3, 3]">
              <input slOtpInputControl name="code" autofocus (complete)="verify($event)" />
            </div>
            <span slFieldDescription>The code expires in 10 minutes.</span>
            @if (wrong()) {
              <span slFieldError>{{ message() }}</span>
            }
          </div>
          @if (verified()) {
            <p slInlineMessage tone="success">Access confirmed. Opening the dashboard…</p>
          }
        </div>
      </div>
      <div slCardFooter>
        <button
          slButton
          type="button"
          variant="ghost"
          [disabled]="seconds() > 0 || verified()"
          (click)="restart()"
        >
          {{ seconds() > 0 ? 'Resend code in 0:' + pad(seconds()) : 'Resend code' }}
        </button>
        <button
          slButton
          type="button"
          [disabled]="verified()"
          [loading]="verifying()"
          [messages]="{ loading: 'A verificar' }"
        >
          Confirmar
        </button>
      </div>
    </div>
  `,
})
class SignInDemo {
  readonly attempts = signal(3);
  readonly verifying = signal(false);
  readonly verified = signal(false);
  readonly seconds = signal(42);
  readonly pad = pad;
  private timer: number | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const left = this.seconds();
      if (left === 0) return;
      this.timer = window.setTimeout(() => this.seconds.set(left - 1), 1000);
    });
    destroyRef.onDestroy(() => window.clearTimeout(this.timer));
  }

  wrong() {
    return this.attempts() < 3 && !this.verified();
  }

  message() {
    const left = this.attempts();
    return `Incorrect code. ${left === 1 ? '1 attempt left' : `${left} attempts left`}.`;
  }

  restart() {
    this.seconds.set(42);
  }

  verify(code: string) {
    this.verifying.set(true);
    window.setTimeout(() => {
      this.verifying.set(false);
      if (code === ACCEPTED) this.verified.set(true);
      else this.attempts.update((left) => left - 1);
    }, 600);
  }
}

/** A hint that says what an edit lost, until the next edit. */
@Component({
  selector: 'sl-otp-input-hint-demo',
  standalone: true,
  imports: [...FIELD, ...FAMILY],
  template: `
    <div slField>
      <label slFieldLabel>{{ label() }}</label>
      <div slOtpInput [length]="length()" [groups]="groups()" [attached]="attached()">
        <input
          slOtpInputControl
          [type]="type()"
          [pattern]="pattern()"
          [transform]="transform()"
          (rejected)="reject($event)"
          (valueChange)="hint.set(null)"
        />
      </div>
      <span slFieldDescription>{{ hint() ?? idle() }}</span>
    </div>
  `,
})
class HintDemo {
  readonly label = input('Code');
  readonly idle = input('');
  readonly rejectedAs = input<(text: string) => string>(
    (text) => `“${text}” is not part of the code.`,
  );
  readonly length = input(6);
  readonly groups = input<number[] | undefined>(undefined);
  readonly attached = input(false);
  readonly type = input<OtpInputType>('numeric');
  readonly pattern = input<RegExp | undefined>(undefined);
  readonly transform = input<((text: string) => string) | undefined>(undefined);
  readonly hint = signal<string | null>(null);

  reject(rejection: OtpInputRejection) {
    this.hint.set(this.rejectedAs()(rejection.text));
  }
}

/** Verify on the sixth digit, and submit a form on it. */
@Component({
  selector: 'sl-otp-input-complete-demo',
  standalone: true,
  imports: [...FIELD, ...FAMILY, SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField [disabled]="status() === 'checking'" [invalid]="status() === 'wrong'">
        <label slFieldLabel>Verification code</label>
        <div slOtpInput [groups]="[3, 3]">
          <input slOtpInputControl (complete)="verify($event)" (valueChange)="status.set('idle')" />
        </div>
        <span slFieldDescription>Type 482 915 and watch: nothing to click.</span>
        @if (status() === 'wrong') {
          <span slFieldError>Incorrect code.</span>
        }
      </div>
      @if (status() === 'checking') {
        <p slInlineMessage tone="secondary">A verificar…</p>
      } @else if (status() === 'ok') {
        <p slInlineMessage tone="success">Acesso confirmado.</p>
      }
    </div>
  `,
})
class CompleteDemo {
  readonly status = signal<'idle' | 'checking' | 'ok' | 'wrong'>('idle');

  verify(code: string) {
    this.status.set('checking');
    window.setTimeout(() => this.status.set(code === ACCEPTED ? 'ok' : 'wrong'), 600);
  }
}

@Component({
  selector: 'sl-otp-input-auto-submit-demo',
  standalone: true,
  imports: [...FIELD, ...FAMILY],
  template: `
    <form (submit)="submit($event)">
      <div slField>
        <label slFieldLabel>Verification code</label>
        <div slOtpInput [groups]="[3, 3]">
          <input slOtpInputControl name="code" autoSubmit />
        </div>
        <span slFieldDescription>{{
          submitted() === null
            ? 'The form submits on the sixth digit, with no button.'
            : 'Submitted: code=' + submitted()
        }}</span>
      </div>
    </form>
  `,
})
class AutoSubmitDemo {
  readonly submitted = signal<string | null>(null);

  submit(event: Event) {
    event.preventDefault();
    this.submitted.set(String(new FormData(event.target as HTMLFormElement).get('code')));
  }
}

/** A reactive form with a validator, and a native reset beside it. */
@Component({
  selector: 'sl-otp-input-form-demo',
  standalone: true,
  imports: [...FIELD, ...FAMILY, ReactiveFormsModule, SlButton, SlStack],
  template: `
    <form slStack [gap]="4" [formGroup]="form" (ngSubmit)="submit()">
      <div slField [invalid]="form.controls.code.touched && form.controls.code.invalid">
        <label slFieldLabel>Verification code</label>
        <div slOtpInput [groups]="[3, 3]">
          <input slOtpInputControl formControlName="code" webOtp />
        </div>
        <span slFieldDescription>{{
          result() ?? 'Validators.minLength(6): the form is valid only with six digits.'
        }}</span>
        @if (form.controls.code.touched && form.controls.code.invalid) {
          <span slFieldError>Digits are missing.</span>
        }
      </div>
      <div class="slotted-demo-row">
        <button slButton type="submit" [disabled]="form.invalid">Confirmar</button>
        <button slButton type="button" variant="ghost" (click)="form.reset({ code: '' })">
          Limpar
        </button>
      </div>
    </form>
  `,
})
class ReactiveFormDemo {
  readonly form = new FormGroup({
    code: new FormControl('482', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });
  readonly result = signal<string | null>(null);

  submit() {
    this.result.set(`form.value.code → "${this.form.controls.code.value}"`);
  }
}

/** Where the cursor is, read from the element after every key. */
@Component({
  selector: 'sl-otp-input-selection-demo',
  standalone: true,
  imports: [...FIELD, ...FAMILY],
  template: `
    <div slField>
      <label slFieldLabel>Verification code</label>
      <div slOtpInput [groups]="[3, 3]">
        <input
          #control="slOtpInputControl"
          slOtpInputControl
          defaultValue="482915"
          (focus)="read(control.inputElement)"
          (keyup)="read(control.inputElement)"
          (pointerup)="read(control.inputElement)"
          (input)="read(control.inputElement)"
          (blur)="readout.set('No selection.')"
        />
      </div>
      <span slFieldDescription>{{ readout() }}</span>
    </div>
  `,
})
class SelectionDemo {
  readonly readout = signal('No selection.');

  read(element: HTMLInputElement) {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    this.readout.set(
      start === end
        ? `Cursor before box ${start + 1}, inserting.`
        : end - start === 1
          ? `Box ${start + 1} selected: the next key replaces it.`
          : `Boxes ${start + 1}–${end} selected.`,
    );
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_OTP_INPUT_DOCS.otpInput.scenes, {
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

const DIRECTIVES = [
  ...FIELD,
  ...FAMILY,
  AutoSubmitDemo,
  CompleteDemo,
  HintDemo,
  ReactiveFormDemo,
  SelectionDemo,
  SignInDemo,
  SlButton,
  SlCard,
  SlCardBody,
  SlCardFooter,
  SlCardHeader,
  SlHeading,
  SlKbd,
  SlStack,
  SlText,
  SlTextField,
  SlTextFieldInput,
];

const meta: Meta<OtpInputStoryArgs> = {
  title: 'Components/OtpInput',
  component: SlOtpInput,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'OTP Input',
        description:
          'One real input and N painted boxes: a verification code with one tab stop, one accessible name, one entry in the form, and the SMS autofill a single field gets.',
        framework: 'Angular',
        ...ANGULAR_OTP_INPUT_DOCS.otpInput,
        tokens: ANGULAR_OTP_INPUT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<OtpInputStoryArgs>;

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

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

/** A room of a stated width, for a screen whose picture depends on its width. */
const room = (name: 'desktop' | 'laptop' | 'tablet' | 'phone', body: string) =>
  `<div class="slotted-demo-room" data-room="${name}">
     <div class="slotted-demo-viewport" data-size="tall">${body}</div>
   </div>`;

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
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Verification code</label>
          <div
            slOtpInput
            [size]="size"
            [variant]="variant"
            [attached]="attached"
            [length]="length"
            [mask]="mask"
            [placeholder]="placeholder"
            [groups]="length === 6 ? [3, 3] : undefined"
          >
            <input slOtpInputControl name="code" [type]="type" />
          </div>
          <span slFieldDescription>
            We sent an SMS to +1 206 •••-4821. The code accepted on this page is 482 915.
          </span>
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
        'The three steps, each where it is used',
        'sm confirms a new e-mail inside a settings row; md is the sign-in step; lg is a phone screen where the thumb does the typing. Switch the toolbar to dense: each box shrinks whole.',
        `<div slField size="sm">
           <label slFieldLabel>Confirm the new email</label>
           <div slOtpInput size="sm" length="4"><input slOtpInputControl /></div>
           <span slFieldDescription>Code sent to anna.bell@nexora.com</span>
         </div>
         <div slField size="md">
           <label slFieldLabel>Verification code</label>
           <div slOtpInput size="md" [groups]="[3, 3]"><input slOtpInputControl /></div>
         </div>
         <div slField size="lg">
           <label slFieldLabel>SMS code</label>
           <div slOtpInput size="lg" [groups]="[3, 3]"><input slOtpInputControl /></div>
         </div>`,
        'block',
      ) +
        scene(
          'Beside a text field, on the same row height',
          "A box is a square on the control height of its step, so the code and the field it follows sit on one rhythm — and inside a field, the field's step wins over the control's own.",
          `<div slField size="sm">
             <label slFieldLabel>Mobile phone</label>
             <div slTextField>
               <input slTextFieldInput inputmode="tel" readonly defaultValue="+1 206 555-4821" />
             </div>
           </div>
           <div slField size="sm">
             <label slFieldLabel>Received code</label>
             <div slOtpInput size="lg" [groups]="[3, 3]"><input slOtpInputControl /></div>
             <span slFieldDescription>size="lg" on the frame, and the field's sm wins.</span>
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
        'outline, on the page',
        'The frame takes the ground it is placed on, so the same control looks right on a page, inside a card and inside a sunken panel.',
        `<div slField>
           <label slFieldLabel>Verification code</label>
           <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="482" /></div>
         </div>`,
      ) +
        scene(
          'subtle, inside a raised panel',
          'The boxes sink into the surface with the subtle border step, the way a subtle text field does beside them.',
          `<div class="slotted-demo-surface" data-surface="raised" data-flow="stack">
             <div slField>
               <label slFieldLabel>Verification code</label>
               <div slOtpInput variant="subtle" [groups]="[3, 3]">
                 <input slOtpInputControl defaultValue="482" />
               </div>
             </div>
             <div slField>
               <label slFieldLabel>Dispositivo</label>
               <div slTextField variant="subtle">
                 <input slTextFieldInput defaultValue="iPhone de Ana" />
               </div>
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The way the SMS is written',
        "“Your Nexora code: 482-915” arrives as two groups of three, and the field is partitioned the same way so the reader's eye does not have to regroup the digits.",
        `<div slField>
           <label slFieldLabel>SMS code</label>
           <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="482" /></div>
         </div>`,
      ) +
        scene(
          'A backup code, printed in blocks of four',
          'Eight alphanumeric characters in two joined groups, the way the recovery sheet prints them.',
          `<div slField>
             <label slFieldLabel>Recovery code</label>
             <div slOtpInput length="8" [groups]="[4, 4]" attached>
               <input slOtpInputControl type="alphanumeric" defaultValue="X7KQ" />
             </div>
             <span slFieldDescription>One of the ten codes saved when you enabled 2FA.</span>
           </div>`,
        ) +
        scene(
          'A PIN pad',
          'Four boxes on one seam: attached joins them and keeps a corner only at the ends, which is how a PIN reads on a terminal.',
          `<div slField>
             <label slFieldLabel>Corporate card PIN</label>
             <div slOtpInput length="4" attached><input slOtpInputControl /></div>
           </div>`,
        ) +
        scene(
          'A partition that does not add up',
          '[groups]="[2, 2]" on a six-character code draws one group rather than nothing: a verification screen that renders no field locks the reader out.',
          `<div slField>
             <label slFieldLabel>Verification code</label>
             <div slOtpInput [groups]="[2, 2]"><input slOtpInputControl /></div>
           </div>`,
        ),
    ),
  }),
};

export const Types: Story = {
  parameters: scenario('types'),
  render: () => ({
    props: {
      stripPrefix: (text: string) => text.replace(/^G-/i, '').toUpperCase(),
      lower: (text: string) => text.toLowerCase(),
      hex: /[0-9a-f]/i,
      notHex: (text: string) => `“${text}” is not hexadecimal.`,
    },
    template: grid(
      2,
      scene(
        'Digits, and the numeric keyboard',
        'type=numeric accepts 0–9 and asks a phone for its numeric keypad. Type a letter: nothing appears, and (rejected) says what was dropped.',
        `<sl-otp-input-hint-demo label="SMS code" [groups]="[3, 3]" idle="Digits only." />`,
      ) +
        scene(
          'A backup code with a prefix nobody types',
          'transform strips the printed G- and uppercases before the filter runs, so pasting “g-x7kq2m9p” from the recovery sheet lands as X7KQ 2M9P.',
          `<sl-otp-input-hint-demo
             label="Recovery code"
             idle="Paste the code as it appears on the sheet, with or without the G- prefix."
             [length]="8"
             [groups]="[4, 4]"
             [attached]="true"
             type="alphanumeric"
             [transform]="stripPrefix"
           />`,
        ) +
        scene(
          'A pattern outranks the type',
          "pattern is tested per character: only hexadecimal digits pass, whatever type says, and the keyboard is still type's.",
          `<sl-otp-input-hint-demo
             label="Key fingerprint"
             idle="The first six characters of a3:f9:…"
             type="alphanumeric"
             [pattern]="hex"
             [transform]="lower"
             [rejectedAs]="notHex"
           />`,
        ),
    ),
  }),
};

export const Mask: Story = {
  parameters: scenario('mask'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Authorizing a payment',
        'The PIN is a secret on a shared screen: the control is type=password, so a screen reader counts characters instead of reading them, and every filled box shows a bullet.',
        `<div slCard fill="outline" size="md">
           <div slCardHeader>
             <h3 slHeading size="lg">Authorize payment</h3>
             <p slText size="sm" tone="muted">$12,480.00 to Anderson Metalworks · due 09/30.</p>
           </div>
           <div slCardBody>
             <div slField>
               <label slFieldLabel>Authorization PIN</label>
               <div slOtpInput length="4" mask attached>
                 <input slOtpInputControl autocomplete="off" />
               </div>
               <span slFieldDescription>The four digits set in your preferences.</span>
             </div>
           </div>
           <div slCardFooter>
             <button slButton type="button" variant="ghost">Cancelar</button>
             <button slButton type="button">Autorizar</button>
           </div>
         </div>`,
      ) +
        scene(
          'Masked, but still one value',
          'Paste, arrows, Backspace and the selection all work as they do unmasked: the boxes show bullets, the input holds the digits.',
          `<div slField>
             <label slFieldLabel>Novo PIN</label>
             <div slOtpInput length="4" mask attached>
               <input slOtpInputControl autocomplete="new-password" defaultValue="5391" />
             </div>
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
        'Wrong code, two attempts left',
        'Invalid keeps the danger edge on every box and retargets the focus ring; the error is in words below, so the state is never color alone.',
        `<div slField invalid>
           <label slFieldLabel>Verification code</label>
           <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="482910" /></div>
           <span slFieldError>Incorrect code. 2 attempts left.</span>
         </div>`,
      ) +
        scene(
          'Already verified, shown for the record',
          'Read-only keeps full-strength ink and only its ground changes: the value is real and still submitted, and there is no caret because there is nothing to type.',
          `<div slField readOnly>
             <label slFieldLabel>Code used</label>
             <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="482915" /></div>
             <span slFieldDescription>Verified on 09/16 at 14:02.</span>
           </div>`,
        ) +
        scene(
          'While the code is being checked',
          'Disabled is muted to a measured color rather than faded, so a form that is waiting still says what it holds.',
          `<div slField disabled>
             <label slFieldLabel>Verification code</label>
             <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="482915" /></div>
           </div>
           <div class="slotted-demo-row">
             <button slButton type="button" loading [messages]="{ loading: 'A verificar' }">Confirmar</button>
           </div>`,
        ) +
        scene(
          'Inside a disabled fieldset',
          'The control was never told: the browser disabled it through the fieldset, and the stylesheet matches :disabled beside the attribute.',
          `<fieldset disabled>
             <div slField>
               <label slFieldLabel>Verification code</label>
               <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="48" /></div>
             </div>
           </fieldset>`,
        ),
    ),
  }),
};

export const Complete: Story = {
  parameters: scenario('complete'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Verify on the last digit',
        '(complete) fires the moment the sixth digit lands; the page disables the field while it checks, and a wrong code comes back as the invalid state.',
        `<sl-otp-input-complete-demo />`,
      ) +
        scene(
          'Submit the form on the last digit',
          'autoSubmit calls requestSubmit() on the owning form, so submit handlers and native validation run as if the reader had pressed the button.',
          `<sl-otp-input-auto-submit-demo />`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { dropped: (text: string) => `Dropped: “${text}”. The digits stayed.` },
    template: grid(
      2,
      scene(
        'A value longer than the code',
        'defaultValue=“12-3456789” is cut to what the code accepts before it reaches the element: six digits, the hyphen dropped.',
        `<div slField>
           <label slFieldLabel>Verification code</label>
           <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="12-3456789" /></div>
         </div>`,
      ) +
        scene(
          'A paste with a hyphen in it',
          'The SMS reads 482-915 and the reader pastes it whole: the digits land in six boxes and the hyphen is reported, not swallowed silently.',
          `<sl-otp-input-hint-demo
             label="SMS code"
             idle="Paste “482-915” exactly as it appears in the SMS."
             [groups]="[3, 3]"
             [rejectedAs]="dropped"
           />`,
        ) +
        scene(
          'A right-to-left page',
          'The label and the help mirror; the boxes do not. A code is a number, and the SMS shows 482 915 in that order whichever way the page runs.',
          `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack" dir="rtl">
             <div slField>
               <label slFieldLabel>رمز التحقق</label>
               <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl defaultValue="482" /></div>
               <span slFieldDescription>أرسلنا رسالة نصية إلى ‎+55 11 9••••-4821</span>
             </div>
           </div>`,
        ) +
        scene(
          'A 360-pixel column, and narrower',
          'Eight boxes in a narrow column. Drag the toolbar narrower still: each box gives up width, down to six tenths of its height, before the row overflows, and none is lost.',
          measure(
            `<div slField>
               <label slFieldLabel>Recovery code</label>
               <div slOtpInput length="8" [groups]="[4, 4]">
                 <input slOtpInputControl type="alphanumeric" defaultValue="X7KQ" />
               </div>
             </div>`,
          ),
        ),
    ),
  }),
};

export const Form: Story = {
  parameters: scenario('form'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A reactive form with a validator',
        'The control is the ControlValueAccessor: the FormControl writes it, minLength(6) sees one string, blur marks it touched, and reset restores it. webOtp is on: in Chrome on Android the code arrives from the SMS with reason “programmatic”, and everywhere else nothing happens.',
        `<sl-otp-input-form-demo />`,
      ) +
        scene(
          "Required, the field's way",
          "required on the field writes aria-required, never the native attribute: the browser's own validation bubble would speak over the field's error.",
          `<div slField required>
             <label slFieldLabel>Verification code</label>
             <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl name="code" /></div>
             <span slFieldDescription>Required to complete sign-in.</span>
           </div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideOtpInputDefaults({ attached: true, length: 4, variant: 'subtle' })],
    }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'The whole sign-in step, on a phone',
        'The field names the control and carries its error; the resend is a button with a countdown the page owns; Confirmar shows its waiting state while the sixth digit is checked. Type 482 915 to pass, anything else to see the attempts count down.',
        room(
          'phone',
          `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack">
             <sl-otp-input-sign-in-demo />
           </div>`,
        ),
      ) +
        scene(
          'An application whose codes are all four digits',
          'provideOtpInputDefaults sets length, attached and the subtle variant once for this story; every control under it follows, and one that states its own length still wins. The sign-in above states [groups]="[3, 3]" on a six-digit code of its own.',
          `<div slStack [gap]="5">
             <div slField>
               <label slFieldLabel>PIN de acesso</label>
               <div slOtpInput mask><input slOtpInputControl /></div>
             </div>
             <div slField>
               <label slFieldLabel>Terminal code</label>
               <div slOtpInput><input slOtpInputControl /></div>
             </div>
             <div slField>
               <label slFieldLabel>Recovery code</label>
               <div slOtpInput length="8" [groups]="[4, 4]">
                 <input slOtpInputControl type="alphanumeric" />
               </div>
               <span slFieldDescription>States its own length and wins over the provider.</span>
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One tab stop, and where the cursor is',
        'Tab into the full code: the last digit is selected, and typing replaces it. Press ← and → to walk the boxes, Shift+← to grow the selection, Backspace to delete and move back.',
        `<sl-otp-input-selection-demo />`,
      ) +
        scene(
          "Every key is the browser's",
          'The family binds nothing. What a text field does with these keys, this control does; the only thing added is that a cursor inside the value always has one character selected.',
          `<p>
             <kbd slKbd keyName="tab"></kbd> enters the control.
             <kbd slKbd keyName="arrowleft"></kbd> and <kbd slKbd keyName="arrowright"></kbd> move
             across the boxes. <kbd slKbd keyName="home"></kbd> and <kbd slKbd keyName="end"></kbd>
             jump to the ends. <kbd slKbd keyName="shift"></kbd> + arrows select a range,
             <kbd slKbd keyName="mod"></kbd> + <kbd slKbd keyName="a"></kbd> selects everything.
           </p>
           <p>
             <kbd slKbd keyName="backspace"></kbd> deletes the selected character and moves back;
             <kbd slKbd keyName="delete"></kbd> deletes forward. <kbd slKbd keyName="mod"></kbd> +
             <kbd slKbd keyName="v"></kbd> pastes into the cursor, hyphens and spaces dropped.
             <kbd slKbd keyName="escape"></kbd> does nothing: a dialog around the control keeps it.
           </p>`,
          'prose',
        ),
    ),
  }),
};
