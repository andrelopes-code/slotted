import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { AfterViewInit, OnInit } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import type { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { injectMessages } from '@slotted/angular/i18n';
import {
  collectValidity,
  hasErrors,
  isDirty,
  mergeErrors,
  namedControls,
  normaliseErrors,
  orderErrors,
  withoutError,
} from '@slotted/core/form';
import type { FormErrorInput, FormErrors } from '@slotted/core/form';
import { formMessages, type FormMessages, type PartialMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import { injectFormDefaults, injectFormErrorMessages, SlFormOwner } from './form-defaults';
import type {
  FormActionsAlign,
  FormErrorFocus,
  FormSummaryMode,
  FormValidate,
} from './form-defaults';

export type {
  FormActionsAlign,
  FormDefaults,
  FormErrorFocus,
  FormErrorMessageContext,
  FormErrorMessages,
  FormSummaryMode,
  FormValidate,
} from './form-defaults';

let summaryCounter = 0;

/**
 * The summary of everything wrong with the form: a focusable region with a
 * heading, and a link per error pointing at the control it is about.
 *
 * It is the GOV.UK error summary, item for item — "move keyboard focus to the
 * error summary", "include the heading", "link to each of the answers that have
 * validation errors", "make sure the error messages in the error summary are
 * worded the same as those which appear next to the inputs". The last one is
 * free here: one map feeds the summary and the field.
 *
 * The form renders this itself under `summary="auto"`. A consumer who wants it
 * somewhere else writes `summary="none"` and puts `slFormSummary` on their own
 * element.
 */
@Component({
  selector: '[slFormSummary]',
  standalone: true,
  exportAs: 'slFormSummary',
  template: `<h2 data-part="summary-title" data-part-summary-title="" [attr.id]="form.summaryId()">
      {{ form.resolvedSummaryTitle() }}
    </h2>
    @if (form.resolvedSummaryDescription(); as description) {
      <p>{{ description }}</p>
    }
    <ul data-part="summary-list" data-part-summary-list="">
      @for (entry of form.entries(); track entry.name) {
        @for (message of entry.messages; track message) {
          <li>
            @if (entry.id) {
              <a
                data-part="summary-item"
                data-part-summary-item=""
                [attr.href]="'#' + entry.id"
                (click)="focus($event, entry.id)"
              >
                {{ message }}
              </a>
            } @else {
              <span data-part="summary-item" data-part-summary-item="">{{ message }}</span>
            }
          </li>
        }
      }
    </ul>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    // The family's identifier on the part: its rules reach it by name, never as any descendant.
    'data-ui': 'form',
    'data-ui-form': '',
    'data-part': 'summary',
    'data-part-summary': '',
    role: 'alert',
    tabindex: '-1',
    '[attr.aria-labelledby]': 'form.summaryId()',
  },
})
export class SlFormSummary implements AfterViewInit {
  protected readonly form = inject(SlFormOwner);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  ngAfterViewInit() {
    this.form.registerSummary(this.element);
  }

  /**
   * The fragment is not followed. A link that navigated would write the
   * control's identifier into the address bar and add an entry to the history
   * of a page that never left; focusing the control is the whole of what the
   * link is for, and the browser scrolls it into view with the focus.
   */
  protected focus(event: Event, id: string) {
    const target = this.element.ownerDocument.getElementById(id);
    if (target === null) return;
    event.preventDefault();
    target.focus();
  }
}

/**
 * A form, its errors and its row of actions.
 *
 * **It owns the errors and nothing else.** `docs/component-features.md` § 6 puts
 * the boundary there: the family coordinates submission, validation, global
 * messages and focus "without owning each framework's state". Values come from
 * `FormData`, validity from `checkValidity()` and from Reactive Forms, and the
 * values themselves stay with whichever of the two owns them.
 *
 * **`novalidate` is written, and constraint validation still runs.** The
 * attribute stops the browser drawing its own bubble beside a control whose
 * error the `field` is already showing; `checkValidity()` is called explicitly
 * and each control's `validationMessage` is the platform's localized string.
 *
 * **Reactive Forms is the second source.** When there is a `ControlContainer`,
 * every control is marked touched at submit and each failing one becomes a
 * sentence: a built-in validator's through the catalog's `errors.*` messages,
 * an application's own through `SL_FORM_ERROR_MESSAGES`.
 *
 * **Signal Forms needs nothing here.** Angular 22's `[field]` binds a control
 * through its `ControlValueAccessor`, which every Slotted control provides, so
 * they work under it today and this family adds no second integration.
 */
@Component({
  selector: 'form[slForm]',
  standalone: true,
  exportAs: 'slForm',
  imports: [SlFormSummary],
  template: `@if (showsOwnSummary()) {
      <div slFormSummary></div>
    }
    <ng-content />`,
  styleUrl: '../../../styles/src/form/form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: SlFormOwner, useExisting: forwardRef(() => SlForm) }],
  host: {
    'data-ui': 'form',
    'data-ui-form': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.novalidate]': "resolvedNativeValidation() ? null : ''",
    '[attr.aria-busy]': "submitting() ? 'true' : null",
    '[attr.data-invalid]': "hasAnyError() ? '' : null",
    '[attr.data-loading]': "submitting() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '(submit)': 'onSubmit($event)',
    '(reset)': 'onReset()',
    '(input)': 'onInput($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class SlForm implements SlFormOwner, OnInit {
  /**
   * Present means the consumer owns the error map, for the life of the
   * component. Keyed by the `name` attribute of the control each error is about.
   */
  readonly errorsInput = input<FormErrorInput | undefined>(undefined, { alias: 'errors' });
  /** The errors an uncontrolled form starts from, read once. */
  readonly defaultErrors = input<FormErrorInput | undefined>(undefined);

  readonly validate = input<FormValidate | undefined>(undefined);
  readonly errorFocus = input<FormErrorFocus | undefined>(undefined);
  readonly summary = input<FormSummaryMode | undefined>(undefined);
  readonly summaryDescription = input<string | undefined>(undefined);
  readonly align = input<FormActionsAlign | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * summary's heading (`summaryTitle`) and the built-in validators' sentences
   * (`errors.*`).
   */
  readonly messages = input<PartialMessages<FormMessages> | undefined>(undefined);
  /** Lets the browser draw its own validation bubble. Off by default. */
  readonly nativeValidation = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });
  /** Marks the form and every control in it as unavailable. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Marks the form busy for work the family did not start — a mutation a
   * consumer's own client is running. It is merged with the family's own
   * submission, so either one puts the root in its busy state.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Registers a `beforeunload` guard while anything in the form has been
   * edited. Off by default: a guard nobody asked for is a trap.
   */
  readonly guardUnsaved = input(false, { transform: booleanAttribute });

  /** One output for one transition, carrying the reason and `cancel()`. */
  readonly errorsChange = output<ChangeRequest<FormErrors>>();
  /**
   * Emitted when the form submits and nothing is wrong with it. The values are
   * read from `FormData`, and `errors` is how a handler publishes what a server
   * answered.
   */
  readonly formSubmit = output<{
    values: Record<string, FormDataEntryValue | FormDataEntryValue[]>;
    event: SubmitEvent;
    /** Publishes a server's answer, and moves focus the way a failed submit does. */
    errors: (errors: FormErrorInput) => void;
    /** Holds the form in its busy state until the promise settles. */
    pending: (work: Promise<FormErrorInput | void>) => void;
  }>();

  private readonly element = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;
  private readonly defaults = injectFormDefaults();
  private readonly errorMessages = injectFormErrorMessages();
  /** The family's words in the language in force, with this form's `messages` laid over them. */
  readonly t = injectMessages(formMessages, this.messages);
  /** The Reactive Forms group around this element, when a consumer wrote one. */
  private readonly container = inject(ControlContainer, { optional: true, self: true });
  private readonly writtenNoValidate = inject(new HostAttributeToken('novalidate'), {
    optional: true,
  });

  private readonly own = signal<FormErrors>({});
  private readonly controls = signal<{ name: string; id: string | undefined }[]>([]);
  private summaryElement: HTMLElement | null = null;
  /** Set when a publish should be followed by the focus a failed submit moves. */
  private pendingFocus = false;
  private readonly ownSubmitting = signal(false);
  /** Either the family's own submission or a consumer's own work. */
  protected readonly submitting = computed(() => this.ownSubmitting() || this.loading());
  private readonly submitted = signal(false);

  private readonly external = computed(() => normaliseErrors(this.errorsInput()));
  private readonly controlled = computed(() => this.errorsInput() !== undefined);

  readonly errors = computed(() => (this.controlled() ? this.external() : this.own()));
  readonly entries = computed(() => orderErrors(this.errors(), this.controls()));
  protected readonly hasAnyError = computed(() => hasErrors(this.errors()));

  readonly summaryId = signal(`slotted-form-summary-${(summaryCounter += 1)}`);
  readonly resolvedSummaryTitle = computed(() => this.t('summaryTitle'));
  readonly resolvedSummaryDescription = computed(
    () => this.summaryDescription() ?? this.defaults.summaryDescription,
  );
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  protected readonly resolvedValidate = computed(() => this.validate() ?? this.defaults.validate);
  protected readonly resolvedErrorFocus = computed(
    () => this.errorFocus() ?? this.defaults.errorFocus,
  );
  protected readonly resolvedSummary = computed(() => this.summary() ?? this.defaults.summary);
  protected readonly resolvedNativeValidation = computed(
    () =>
      this.nativeValidation() ??
      (this.writtenNoValidate === null ? this.defaults.nativeValidation : false),
  );
  protected readonly showsOwnSummary = computed(
    () => this.resolvedSummary() === 'auto' && this.entries().length > 0,
  );

  constructor() {
    this.attachUnloadGuard();
  }

  ngOnInit() {
    this.own.set(normaliseErrors(this.defaultErrors()));
    this.readControls();
  }

  /**
   * The summary says when it exists, and takes the focus a failed submit asked
   * for. The move waits for the region rather than racing it: the errors and
   * the element that shows them are published in the same change, and a
   * `focus()` called before the region rendered would land on nothing.
   */
  registerSummary(element: HTMLElement | null) {
    this.summaryElement = element;
    if (element === null || !this.pendingFocus) return;
    this.pendingFocus = false;
    element.focus();
  }

  /** Runs validation now and publishes what it found. */
  validateNow(): FormErrors {
    const found = this.collect();
    this.publish(found, 'programmatic', undefined);
    return found;
  }

  /** Submits as though the submit button had been pressed. */
  submit() {
    this.element.requestSubmit();
  }

  /** Resets the controls and clears the errors. */
  reset() {
    this.element.reset();
  }

  /** Moves focus where a failed submit would have moved it. */
  focusFirstError() {
    const focus = this.resolvedErrorFocus();
    if (focus === 'none') return;
    if (focus === 'summary' && this.summaryElement !== null) {
      this.summaryElement.focus();
      return;
    }
    const first = this.entries()[0];
    if (first === undefined) return;
    const control = this.element.elements.namedItem(first.name);
    const element = control instanceof RadioNodeList ? control[0] : control;
    if (element instanceof HTMLElement) element.focus();
  }

  protected onSubmit(event: SubmitEvent) {
    this.submitted.set(true);
    this.readControls();

    if (this.submitting()) {
      /* A second submit while one is pending is refused. */
      event.preventDefault();
      return;
    }

    const found = this.resolvedValidate() === 'none' ? this.external() : this.collect();

    if (hasErrors(found)) {
      event.preventDefault();
      this.publish(found, 'submit', event);
      return;
    }

    this.publish({}, 'submit', event);
    event.preventDefault();

    const data = new FormData(this.element);
    const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
    for (const key of new Set(data.keys())) {
      const all = data.getAll(key);
      values[key] = all.length > 1 ? all : (all[0] as FormDataEntryValue);
    }

    this.formSubmit.emit({
      values,
      event,
      errors: (errors) => this.publish(normaliseErrors(errors), 'submit', event),
      pending: (work) => {
        this.ownSubmitting.set(true);
        void work
          .then((settled) => {
            if (settled !== undefined && settled !== null) {
              this.publish(normaliseErrors(settled), 'submit', event);
            }
          })
          .finally(() => this.ownSubmitting.set(false));
      },
    });
  }

  protected onReset() {
    this.submitted.set(false);
    this.publish({}, 'clear', undefined);
  }

  /**
   * A server error is dropped when the control it names is edited. After a
   * failed submit under `validate="change"`, the whole form is checked again
   * instead, because a reader who has seen the list is fixing it.
   */
  protected onInput(event: Event) {
    const name = nameOf(event.target);
    if (name === null) return;

    if (this.resolvedValidate() === 'change' && this.submitted()) {
      this.publish(this.collect(), 'keyboard', event, false);
      return;
    }
    const next = withoutError(this.errors(), name);
    if (next !== this.errors()) this.publish(next, 'keyboard', event, false);
  }

  /**
   * On blur only the control that lost focus is checked. Running the whole form
   * would tell a reader that six fields they have not reached yet are wrong,
   * which is the noise `validate="submit"` exists to avoid.
   */
  protected onFocusOut(event: Event) {
    if (this.resolvedValidate() !== 'blur') return;
    const name = nameOf(event.target);
    if (name === null) return;

    const found = this.collect();
    const messages = found[name];
    const next =
      messages === undefined
        ? withoutError(this.errors(), name)
        : mergeErrors(this.errors(), { [name]: messages });
    if (next !== this.errors()) this.publish(next, 'keyboard', event, false);
  }

  /**
   * Three sources, latest last: whatever a server sent, the platform's own
   * constraint validation, and Reactive Forms.
   */
  private collect(): FormErrors {
    return mergeErrors(this.external(), collectValidity(this.element), this.angularErrors());
  }

  /**
   * Every failing control in the group around this form, as a sentence. Angular
   * reports a key and a shape and never a message, because a message is the
   * application's and so is its language; the registry is where it is written.
   */
  private angularErrors(): FormErrors {
    const group = this.container?.control as FormGroup | FormArray | null | undefined;
    if (group === null || group === undefined) return {};
    group.markAllAsTouched();

    const found: Record<string, string[]> = {};
    for (const [name, control] of Object.entries(
      group.controls as Record<string, AbstractControl>,
    )) {
      const errors = control.errors;
      if (errors === null || control.disabled) continue;
      const messages = Object.entries(errors)
        .map(
          ([key, detail]) =>
            this.errorMessages[key]?.({ name, key, detail }) ?? this.builtInMessage(key, detail),
        )
        .filter((message): message is string => typeof message === 'string');
      if (messages.length > 0) found[name] = messages;
    }
    return found;
  }

  /**
   * The sentence for one of Angular's own validators, from the catalog; for a
   * key the catalog does not know, nothing — the application's validator names
   * its own message through `SL_FORM_ERROR_MESSAGES`.
   */
  private builtInMessage(key: string, detail: unknown): string | undefined {
    const shape = (detail ?? {}) as { min?: unknown; max?: unknown; requiredLength?: unknown };
    switch (key) {
      case 'required':
        return this.t('errors.required');
      case 'email':
        return this.t('errors.email');
      case 'min':
        return this.t('errors.min', { min: Number(shape.min) });
      case 'max':
        return this.t('errors.max', { max: Number(shape.max) });
      case 'minlength':
        return this.t('errors.minlength', { length: Number(shape.requiredLength) });
      case 'maxlength':
        return this.t('errors.maxlength', { length: Number(shape.requiredLength) });
      case 'pattern':
        return this.t('errors.pattern');
      default:
        return undefined;
    }
  }

  private readControls() {
    this.controls.set(namedControls(this.element));
  }

  private publish(
    next: FormErrors,
    reason: ChangeReason,
    source: Event | undefined,
    moveFocus = true,
  ) {
    this.readControls();

    let cancelled = false;
    const state = createControllable<FormErrors>({
      controlled: undefined,
      initial: this.errors(),
      equals: sameErrors,
      onRequest: (pending) => {
        this.errorsChange.emit(pending);
        cancelled = pending.cancelled;
      },
    });
    state.request(next, reason, source);
    if (cancelled) return;

    if (!this.controlled()) this.own.set(next);

    if (!moveFocus || !hasErrors(next) || this.resolvedErrorFocus() === 'none') return;
    /* A summary that has not been rendered yet takes the focus when it is, and
       one that is already on the page takes it now. */
    if (this.resolvedErrorFocus() === 'summary' && this.summaryElement === null) {
      this.pendingFocus = true;
      return;
    }
    this.focusFirstError();
  }

  /**
   * The guard nobody else ships. It is off by default, because a page that
   * refuses to close after a reader typed one character is a trap.
   */
  private attachUnloadGuard() {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!this.guardUnsaved() || this.submitting()) return;
      if (!isDirty(this.element)) return;
      event.preventDefault();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('beforeunload', onBeforeUnload));
  }
}

function nameOf(target: EventTarget | null): string | null {
  if (!(target instanceof HTMLElement)) return null;
  const name = (target as { name?: string }).name;
  return typeof name === 'string' && name !== '' ? name : null;
}

function sameErrors(a: FormErrors, b: FormErrors) {
  const names = Object.keys(a);
  if (names.length !== Object.keys(b).length) return false;
  return names.every(
    (name) =>
      b[name] !== undefined &&
      a[name]!.length === b[name]!.length &&
      a[name]!.every((message, index) => message === b[name]![index]),
  );
}
