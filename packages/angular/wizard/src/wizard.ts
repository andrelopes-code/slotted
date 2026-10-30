import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { AfterContentInit } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { hasErrors, isDirty, normaliseErrors } from '@slotted/core/form';
import type { FormErrorInput } from '@slotted/core/form';
import { wizardMessages, type PartialMessages, type WizardMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  assertUniqueSteps,
  clampStep,
  createSnapshot,
  firstIncomplete,
  formValues,
  includedValues,
  nextDestination,
  previousStep,
  reachableStep,
  replacementStep,
  stepComplete,
  stepPosition,
} from '@slotted/core/wizard';
import type {
  StepValues,
  WizardPersistence,
  WizardSnapshot,
  WizardStepEntry,
  WizardValue,
} from '@slotted/core/wizard';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { SlForm } from '@slotted/angular/form';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStepper, SlStepperList, SlStepperStep } from '@slotted/angular/stepper';
import { SlTag } from '@slotted/angular/tag';

import { injectWizardDefaults } from './wizard-defaults';
import type {
  WizardAutosave,
  WizardCancelRequest,
  WizardDraftReason,
  WizardDraftRequest,
  WizardFailure,
  WizardLevel,
  WizardProgress,
  WizardProgressOpenRequest,
  WizardScroll,
  WizardStepReason,
  WizardStepRequest,
  WizardSubmit,
  WizardValidate,
  WizardValueRequest,
} from './wizard-defaults';

let counter = 0;

const EMPTY: WizardValue = {};

const isPromise = (candidate: unknown): candidate is Promise<unknown> =>
  typeof candidate === 'object' && candidate !== null && 'then' in candidate;

const optionalBoolean = (raw: unknown) => (raw === undefined ? undefined : booleanAttribute(raw));

function without(map: WizardValue, name: string): WizardValue {
  if (!Object.hasOwn(map, name)) return map;
  const next: Record<string, StepValues> = { ...map };
  delete next[name];
  return next;
}

/** What one step's template is given. */
export interface WizardStepContext {
  /** The answers to show: typed and not yet accepted, else accepted, else none. */
  $implicit: StepValues;
  values: StepValues;
  name: string;
  complete: boolean;
  optional: boolean;
  /**
   * What a failed submission sent back for this step, keyed by control name,
   * for the form's `[defaultErrors]`. The form family reads it once, and the
   * wizard renders the step again when it changes.
   */
  errors: FormErrorInput | undefined;
}

/**
 * One step: its name, its label and its content, which is rendered only while
 * it is the current step. A branch is `@if` around the template; the wizard
 * reacts to the list changing under the reader by the rules of the design
 * (§5.6).
 */
@Directive({ selector: 'ng-template[slWizardStep]', standalone: true, exportAs: 'slWizardStep' })
export class SlWizardStep {
  readonly name = input.required<string>({ alias: 'slWizardStep' });
  readonly label = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Runs after the platform's and Reactive Forms' own validation pass. */
  readonly validate = input<WizardValidate | undefined>(undefined);
  /** The answers to accept instead of the form's values. */
  readonly values = input<StepValues | undefined>(undefined);
  readonly template = inject<TemplateRef<WizardStepContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: SlWizardStep,
    context: unknown,
  ): context is WizardStepContext {
    return context !== null;
  }
}

/** What stands in place of the step and the actions after an accepted submission. */
@Directive({ selector: 'ng-template[slWizardComplete]', standalone: true })
export class SlWizardComplete {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** A row of actions of the consumer's own, in place of the default one. */
@Directive({ selector: 'ng-template[slWizardActions]', standalone: true })
export class SlWizardActions {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The group of actions that leave the flow, at the start of the row. */
@Directive({
  selector: '[slWizardActionsStart]',
  standalone: true,
  host: { 'data-part': 'actions-start', 'data-part-actions-start': '' },
})
export class SlWizardActionsStart {}

/** The group of actions that move the flow, at the end of the row. */
@Directive({
  selector: '[slWizardActionsEnd]',
  standalone: true,
  host: { 'data-part': 'actions-end', 'data-part-actions-end': '' },
})
export class SlWizardActionsEnd {}

/**
 * The step's form. It is the consumer's `form[slForm]`, because
 * `formControlName` resolves its `ControlContainer` through the injector of
 * the template it is written in, and a form the wizard rendered would not be
 * that one. With a `FormGroup` on it, the group's raw value is the step's
 * answers and its pending status holds the step; without one, `FormData`.
 */
@Directive({
  selector: 'form[slWizardForm]',
  standalone: true,
  exportAs: 'slWizardForm',
  host: {
    '[attr.id]': 'wizard.formId',
    '[attr.aria-labelledby]': 'wizard.titleId',
  },
})
export class SlWizardForm {
  protected readonly wizard = inject(forwardRef(() => SlWizard));
  private readonly form = inject(SlForm, { self: true });
  private readonly container = inject(ControlContainer, { optional: true, self: true });
  readonly element = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;

  constructor() {
    this.wizard.registerForm(this);
    inject(DestroyRef).onDestroy(() => this.wizard.unregisterForm(this));
    const subscription = this.form.formSubmit.subscribe(({ event, values, errors, pending }) => {
      const control = this.container?.control;
      const run = (): FormErrorInput | void | Promise<FormErrorInput | void> =>
        this.wizard.commit((control?.getRawValue() as StepValues | undefined) ?? values, event);
      if (control?.pending === true) {
        pending(
          new Promise<FormErrorInput | void>((resolve) => {
            const watch = control.statusChanges.subscribe((status) => {
              if (status === 'PENDING') return;
              watch.unsubscribe();
              if (status === 'INVALID') {
                this.form.validateNow();
                resolve(undefined);
                return;
              }
              const answer = run();
              if (isPromise(answer)) void answer.then(resolve);
              else resolve(answer);
            });
          }),
        );
        return;
      }
      const answer = run();
      if (isPromise(answer)) pending(answer as Promise<FormErrorInput | void>);
      else if (answer !== undefined) errors(answer);
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  /** What is typed now, whatever has been accepted. */
  typed(): StepValues {
    const control = this.container?.control;
    if (control !== null && control !== undefined) return control.getRawValue() as StepValues;
    return formValues(new FormData(this.element));
  }

  dirty(): boolean {
    const control = this.container?.control;
    return control !== null && control !== undefined ? control.dirty : isDirty(this.element);
  }

  submit() {
    this.element.requestSubmit();
  }
}

/**
 * A flow of steps that accumulates answers.
 *
 * **The steps are the templates the consumer writes**, and a branch is `@if`
 * around one. The wizard reacts to the list changing under the reader by the
 * eight rules of the design (§5.6): the current step is never moved because a
 * step appeared before it, a current step that left the list gives way to the
 * next one still present, and an absent step keeps its answers without
 * submitting them.
 *
 * **Each step's form is the consumer's `form[slForm][slWizardForm]`**, so a
 * `FormGroup` lives in the consumer's component, keeps what was typed across
 * steps, and validates through Reactive Forms before the step's own
 * `validate`. The next button stands outside the form and submits it through
 * the platform's `form` attribute.
 *
 * **It holds accepted answers, not typed ones.** A step is complete exactly
 * when its name is in `value`.
 */
@Component({
  selector: '[slWizard]',
  standalone: true,
  exportAs: 'slWizard',
  imports: [
    NgTemplateOutlet,
    SlAlert,
    SlAlertContent,
    SlAlertDescription,
    SlAlertTitle,
    SlButton,
    SlGlyph,
    SlIcon,
    SlSkeleton,
    SlStepper,
    SlStepperList,
    SlStepperStep,
    SlTag,
    forwardRef(() => SlWizardNext),
    forwardRef(() => SlWizardPrevious),
    forwardRef(() => SlWizardCancel),
    forwardRef(() => SlWizardSaveDraft),
    forwardRef(() => SlWizardSkip),
    forwardRef(() => SlWizardDraftStatus),
    SlWizardActionsStart,
    SlWizardActionsEnd,
  ],
  template: `
    <div data-part="layout" data-part-layout="">
      @if (resolvedProgress() !== 'none') {
        <div
          data-part="progress"
          data-part-progress=""
          [attr.data-open]="progressOpen() ? '' : null"
          (keydown)="onProgressKeydown($event)"
        >
          <button
            #toggle
            data-part="progress-toggle"
            data-part-progress-toggle=""
            type="button"
            [attr.aria-controls]="listId"
            [attr.aria-expanded]="progressOpen()"
            (click)="toggleProgress($event)"
          >
            <span data-part="progress-position" data-part-progress-position="">{{
              positionText()
            }}</span>
            <span aria-hidden="true" data-part="progress-track" data-part-progress-track="">
              @for (entry of entries(); track entry.name) {
                <span
                  data-part="progress-segment"
                  data-part-progress-segment=""
                  [attr.data-complete]="
                    finished() || (entry.name !== current() && isComplete(entry.name)) ? '' : null
                  "
                  [attr.data-current]="!finished() && entry.name === current() ? '' : null"
                  [attr.data-invalid]="invalid().has(entry.name) ? '' : null"
                ></span>
              }
            </span>
            <span slIcon><svg slGlyph name="chevron-down"></svg></span>
          </button>
          <div
            slStepper
            [messages]="stepperMessages()"
            [navigation]="phase() === 'complete' ? 'none' : 'button'"
            [orientation]="resolvedProgress() === 'top' ? 'horizontal' : 'vertical'"
            [step]="finished() ? entries().length : currentIndex()"
            (stepChange)="onHeader($event)"
          >
            <ol slStepperList [attr.id]="listId">
              @for (item of steps(); track item.name()) {
                <li
                  slStepperStep
                  [complete]="phase() === 'complete' || isComplete(item.name())"
                  [description]="item.optional() ? t('optional') : undefined"
                  [disabled]="disabled() || item.disabled() || !isReachable(item.name())"
                  [invalid]="invalid().has(item.name())"
                  [label]="item.label()"
                  [loading]="pending() === item.name()"
                ></li>
              }
            </ol>
          </div>
        </div>
      }

      <div data-part="main" data-part-main="">
        @if (errorShown()) {
          <div data-part="error" data-part-error="">
            <section #alert slAlert live="off" reach="section" tone="danger">
              <div slAlertContent>
                <div slAlertTitle>{{ error() ?? t('submitFailed') }}</div>
                @if (error() === undefined && failure()?.message) {
                  <p slAlertDescription>{{ failure()?.message }}</p>
                }
              </div>
            </section>
          </div>
        }

        @if (phase() === 'complete') {
          <div #complete data-part="complete" data-part-complete="" tabindex="-1">
            @if (completeTemplate(); as done) {
              <ng-container *ngTemplateOutlet="done.template"></ng-container>
            }
          </div>
        } @else {
          <div data-part="step" data-part-step="" [attr.aria-busy]="restoring() ? 'true' : null">
            @if (restoring()) {
              @if (skeleton()) {
                <div aria-hidden="true" data-part="step-header" data-part-step-header="">
                  <div data-part="step-title" data-part-step-title="">
                    <span data-part="position" data-part-position=""
                      ><span slSkeleton inlineSize="5.5rem"></span
                    ></span>
                    <span slSkeleton inlineSize="13rem"></span>
                  </div>
                </div>
                <div aria-hidden="true" data-part="skeleton" data-part-skeleton="">
                  <div
                    data-label-placement="top"
                    data-part="root"
                    data-part-root=""
                    data-size="md"
                    data-ui="field"
                    data-ui-field=""
                  >
                    <span data-part="label" data-part-label=""
                      ><span slSkeleton inlineSize="7rem"></span
                    ></span>
                    <div data-part="control" data-part-control="">
                      <span
                        slSkeleton
                        shape="block"
                        blockSize="var(--slotted-control-height-md)"
                      ></span>
                    </div>
                  </div>
                </div>
              }
            } @else if (currentStep(); as step) {
              <div data-part="step-header" data-part-step-header="">
                @switch (resolvedLevel()) {
                  @case (3) {
                    <h3
                      #title
                      data-part="step-title"
                      data-part-step-title=""
                      tabindex="-1"
                      [id]="titleId"
                    >
                      <ng-container *ngTemplateOutlet="heading; context: { $implicit: step }" />
                    </h3>
                  }
                  @case (4) {
                    <h4
                      #title
                      data-part="step-title"
                      data-part-step-title=""
                      tabindex="-1"
                      [id]="titleId"
                    >
                      <ng-container *ngTemplateOutlet="heading; context: { $implicit: step }" />
                    </h4>
                  }
                  @default {
                    <h2
                      #title
                      data-part="step-title"
                      data-part-step-title=""
                      tabindex="-1"
                      [id]="titleId"
                    >
                      <ng-container *ngTemplateOutlet="heading; context: { $implicit: step }" />
                    </h2>
                  }
                }
                @if (step.description()) {
                  <p data-part="step-description" data-part-step-description="">
                    {{ step.description() }}
                  </p>
                }
              </div>
              @for (key of [renderKey()]; track key) {
                <ng-container *ngTemplateOutlet="step.template; context: stepContext()" />
              }
            }
          </div>
          @if (!restoring()) {
            <div data-part="actions" data-part-actions="">
              @if (actionsTemplate(); as custom) {
                <ng-container *ngTemplateOutlet="custom.template"></ng-container>
              } @else {
                <div slWizardActionsStart>
                  @if (canCancel()) {
                    <button
                      slButton
                      slWizardCancel
                      tone="secondary"
                      variant="ghost"
                      focusableWhenDisabled
                      [disabled]="phase() === 'submitting'"
                    >
                      {{ t('cancel') }}
                    </button>
                  }
                  @if (canSaveDraft()) {
                    <button
                      slButton
                      slWizardSaveDraft
                      tone="secondary"
                      variant="ghost"
                      focusableWhenDisabled
                      [disabled]="disabled() || busy()"
                      [loading]="draftState() === 'saving'"
                    >
                      {{ t('saveDraft') }}
                    </button>
                    <span slWizardDraftStatus></span>
                  }
                </div>
                <div slWizardActionsEnd>
                  @if (optionalStep()) {
                    <button
                      slButton
                      slWizardSkip
                      tone="secondary"
                      variant="ghost"
                      focusableWhenDisabled
                      [disabled]="disabled() || busy()"
                    >
                      {{ t('skip') }}
                    </button>
                  }
                  @if (!isFirst()) {
                    <button
                      slButton
                      slWizardPrevious
                      tone="secondary"
                      variant="outline"
                      focusableWhenDisabled
                      [disabled]="disabled() || busy()"
                    >
                      {{ t('previous') }}
                    </button>
                  }
                  <button
                    slButton
                    slWizardNext
                    tone="accent"
                    variant="solid"
                    focusableWhenDisabled
                    [disabled]="disabled()"
                    [loading]="busy()"
                    [type]="hasForm() ? 'submit' : 'button'"
                  >
                    {{ nextLabel() }}
                  </button>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>

    <ng-template #heading let-step>
      <span data-part="position" data-part-position="">{{ positionText() }}</span>
      {{ step.label() }}
      @if (step.optional()) {
        <span data-part="optional" data-part-optional=""
          >{{ ' '
          }}<span slTag shape="pill" size="sm" tone="secondary" variant="soft">{{
            t('optional')
          }}</span>
        </span>
      }
    </ng-template>
  `,
  styleUrls: [
    '../../../styles/src/wizard/wizard.css',
    '../../../styles/src/field/field.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'wizard',
    'data-ui-wizard': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-progress]': 'resolvedProgress()',
    '[attr.data-scroll]': 'resolvedScroll()',
    '[attr.data-loading]': "phase() === 'submitting' || restoring() ? '' : null",
    '[attr.data-invalid]': "errorShown() ? '' : null",
    '[attr.data-complete]': "phase() === 'complete' ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
})
export class SlWizard implements AfterContentInit {
  /** The current step's name. Two-way; a router binds it. */
  readonly step = model<string | undefined>(undefined);
  /** The accepted answers, by step name. Two-way. */
  readonly value = model<WizardValue | undefined>(undefined);
  /** Whether the compact list of steps is open. Two-way. */
  readonly progressOpen = model<boolean>(false);

  /** The step an unbound wizard starts on, read once and clamped to one in reach. */
  readonly defaultStep = input<string | undefined>(undefined);
  readonly defaultValue = input<WizardValue | undefined>(undefined);
  /** Whether an unbound compact list starts open, read once. */
  readonly defaultProgressOpen = input(false, { transform: booleanAttribute });

  readonly progress = input<WizardProgress | undefined>(undefined);
  readonly scroll = input<WizardScroll | undefined>(undefined);
  readonly linear = input(undefined, { transform: optionalBoolean });
  readonly level = input<WizardLevel | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * name of the list of steps (`progress`), the position, the actions, the
   * draft status and the failures.
   */
  readonly messages = input<PartialMessages<WizardMessages> | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** An error of the consumer's own, shown above the step; it wins over a failed submission. */
  readonly error = input<string | undefined>(undefined);
  /** Called with the answers of the steps present, once the last step is accepted. */
  readonly submitWizard = input<WizardSubmit | undefined>(undefined);
  readonly persistence = input<WizardPersistence | undefined>(undefined);
  /** The flow's version; a draft of another version is not restored. */
  readonly version = input<string | number | undefined>(undefined);
  /** Defaults to `step` when `persistence` is given, `none` otherwise. */
  readonly autosave = input<WizardAutosave | undefined>(undefined);
  readonly guardUnsaved = input(false, { transform: booleanAttribute });
  /**
   * Shows the cancel action. An Angular output cannot say whether anything
   * listens to it, which is how the React binding decides; here it is stated.
   */
  readonly cancellable = input(false, { transform: booleanAttribute });
  /** Shows the save-draft action without `persistence`, for a `(draftSave)` of the consumer's own. */
  readonly draftable = input(false, { transform: booleanAttribute });
  readonly delay = input(undefined, {
    transform: (raw: unknown) => (raw === undefined ? undefined : numberAttribute(raw)),
  });
  readonly minDuration = input(undefined, {
    transform: (raw: unknown) => (raw === undefined ? undefined : numberAttribute(raw)),
  });

  /** One output per transition, carrying its reason and `cancel()`. */
  readonly stepChangeRequest = output<WizardStepRequest>();
  readonly valueChangeRequest = output<WizardValueRequest>();
  readonly progressOpenChangeRequest = output<WizardProgressOpenRequest>();
  /** Asked by the cancel action; the family closes nothing itself. */
  readonly cancelRequest = output<WizardCancelRequest>();
  /** A draft was written, before `persistence` keeps it. */
  readonly draftSave = output<WizardDraftRequest>();
  /** The submission was accepted. */
  readonly completed = output<WizardValue>();

  readonly steps = contentChildren(SlWizardStep);
  protected readonly completeTemplate = contentChild(SlWizardComplete);
  protected readonly actionsTemplate = contentChild(SlWizardActions);

  private readonly defaults = injectWizardDefaults();
  private readonly injector = inject(Injector);
  private readonly titleRef = viewChild<ElementRef<HTMLElement>>('title');
  private readonly alertRef = viewChild('alert', { read: ElementRef });
  private readonly completeRef = viewChild<ElementRef<HTMLElement>>('complete');
  private readonly toggleRef = viewChild<ElementRef<HTMLButtonElement>>('toggle');

  private readonly id = `slotted-wizard-${(counter += 1)}`;
  readonly formId = `${this.id}-form`;
  readonly titleId = `${this.id}-title`;
  readonly listId = `${this.id}-list`;

  /** The family's words in the language in force, with this wizard's `messages` laid over them. */
  readonly t = injectMessages(wizardMessages, this.messages);
  /** The locale in force: what the hour a draft was saved is written in. */
  readonly locale = injectLocale();
  /**
   * The list of steps is a stepper named by this family's `progress`: the
   * written word is handed over as a message function, so the stepper never
   * reads it as message grammar again.
   */
  protected readonly stepperMessages = computed(() => {
    const progress = this.t('progress');
    return { label: () => progress };
  });
  readonly resolvedProgress = computed(() => this.progress() ?? this.defaults.progress);
  readonly resolvedScroll = computed(() => this.scroll() ?? this.defaults.scroll);
  readonly resolvedLinear = computed(() => this.linear() ?? this.defaults.linear);
  readonly resolvedLevel = computed(() => this.level() ?? this.defaults.level);
  private readonly resolvedAutosave = computed(
    () => this.autosave() ?? (this.persistence() === undefined ? 'none' : 'step'),
  );

  readonly entries = computed<WizardStepEntry[]>(() =>
    this.steps().map((step) => ({ disabled: step.disabled(), name: step.name() })),
  );

  private readonly accepted = computed(() => this.value() ?? EMPTY);
  protected readonly drafts = signal<WizardValue>(EMPTY);
  protected readonly invalid = signal<ReadonlySet<string>>(new Set());
  readonly pending = signal<string | undefined>(undefined);
  readonly phase = signal<'editing' | 'submitting' | 'complete'>('editing');
  protected readonly failure = signal<WizardFailure | undefined>(undefined);
  readonly draftState = signal<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  readonly savedAt = signal<Date | undefined>(undefined);
  protected readonly restoring = signal(false);
  protected readonly skeleton = signal(false);
  private readonly returnTo = signal<string | undefined>(undefined);
  private readonly epoch = signal(0);
  private readonly stepErrors = signal<Record<string, FormErrorInput>>({});
  private readonly form = signal<SlWizardForm | undefined>(undefined);

  /** The list before its last change, for a current step that left it. */
  private previousEntries: readonly WizardStepEntry[] = [];
  /** The step the family itself last wrote, so a router's write can be told apart. */
  private ownWrite: string | undefined;
  private validation: AbortController | undefined;
  private jumpTarget: string | undefined;
  private focusNext: 'title' | 'alert' | 'complete' | undefined;
  private initialised = false;

  private usable(name: string | undefined) {
    return this.entries().some((entry) => entry.name === name && entry.disabled !== true);
  }

  /**
   * The step shown. A requested step that is absent gives way to the next one
   * still present in the old order (decision 2 shows that one at once); the
   * current step is never moved because a step appeared before it (decision 1).
   */
  readonly current = computed<string | undefined>(() => {
    const requested = this.step();
    const entries = this.entries();
    if (this.usable(requested)) return requested;
    const before = untracked(() => this.previousEntries);
    const linear = this.resolvedLinear();
    return requested === undefined
      ? clampStep({ linear, requested, steps: entries, value: this.accepted() })
      : (replacementStep({ after: entries, before, current: requested }) ??
          clampStep({ linear, requested, steps: entries, value: this.accepted() }));
  });

  /**
   * After an accepted submission the flow has no current step: the stepper is
   * given the index past the last, so every header reads complete. Left on the
   * last step, that header kept its number, because a current step outranks a
   * complete one.
   */
  protected readonly finished = computed(() => this.phase() === 'complete');

  protected readonly currentIndex = computed(() =>
    Math.max(
      0,
      this.entries().findIndex((entry) => entry.name === this.current()),
    ),
  );
  readonly currentStep = computed(() =>
    this.steps().find((step) => step.name() === this.current()),
  );
  protected readonly optionalStep = computed(() => this.currentStep()?.optional() === true);
  readonly position = computed(() => stepPosition(this.entries(), this.current()));
  protected readonly positionText = computed(() =>
    this.t('position', { index: this.position().index, count: this.position().count }),
  );
  readonly isFirst = computed(() => {
    const current = this.current();
    return current === undefined || previousStep({ current, steps: this.entries() }) === undefined;
  });
  readonly returning = computed(() => {
    const back = this.returnTo();
    return back !== undefined && this.entries().some((entry) => entry.name === back);
  });
  readonly isFinal = computed(() => {
    const current = this.current();
    if (current === undefined) return false;
    return (
      nextDestination({
        current,
        returnTo: this.returnTo(),
        steps: this.entries(),
        value: { ...this.accepted(), [current]: {} },
      }).kind === 'submit'
    );
  });
  protected readonly nextLabel = computed(() =>
    this.t(this.returning() ? 'return' : this.isFinal() ? 'submit' : 'next'),
  );
  readonly busy = computed(() => this.pending() !== undefined || this.phase() === 'submitting');
  readonly hasForm = computed(() => this.form() !== undefined);
  protected readonly canCancel = computed(() => this.cancellable());
  protected readonly canSaveDraft = computed(
    () => this.draftable() || this.persistence() !== undefined,
  );
  protected readonly errorShown = computed(
    () => this.error() !== undefined || this.failure() !== undefined,
  );
  protected readonly renderKey = computed(() => `${this.current() ?? ''}-${this.epoch()}`);
  protected readonly stepContext = computed<WizardStepContext>(() => {
    const name = this.current() ?? '';
    const values = this.drafts()[name] ?? this.accepted()[name] ?? {};
    return {
      $implicit: values,
      complete: stepComplete(this.accepted(), name),
      errors: this.stepErrors()[name],
      name,
      optional: this.optionalStep(),
      values,
    };
  });

  constructor() {
    /* A resolved step that differs from the requested one is written back. */
    effect(() => {
      const current = this.current();
      const requested = this.step();
      const entries = this.entries();
      untracked(() => {
        this.previousEntries = entries;
        if (!this.initialised) return;
        assertUniqueSteps(entries);
        if (current === undefined || current === requested) return;
        this.leave();
        this.requestStep(current, 'programmatic', undefined, false);
      });
    });

    /* A step a router wrote on its own is clamped to one in reach. */
    effect(() => {
      const requested = this.step();
      untracked(() => {
        if (!this.initialised || requested === undefined || requested === this.ownWrite) return;
        const clamped = clampStep({
          linear: this.resolvedLinear(),
          requested,
          steps: this.entries(),
          value: this.accepted(),
        });
        if (clamped !== undefined && clamped !== requested) {
          this.requestStep(clamped, 'programmatic', undefined, false);
        }
      });
    });

    /* Focus follows the step, the failure or the completion, after render. */
    effect(() => {
      this.current();
      this.phase();
      this.failure();
      untracked(() => {
        const target = this.focusNext;
        if (target === undefined) return;
        afterNextRender(
          () => {
            if (this.focusNext !== target) return;
            const element =
              target === 'alert'
                ? (this.alertRef()?.nativeElement as HTMLElement | undefined)
                : target === 'complete'
                  ? this.completeRef()?.nativeElement
                  : this.titleRef()?.nativeElement;
            if (element === undefined) return;
            this.focusNext = undefined;
            element.focus();
          },
          { injector: this.injector },
        );
      });
    });

    const destroyRef = inject(DestroyRef);
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (this.guardUnsaved() && this.dirty()) event.preventDefault();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', onBeforeUnload);
      destroyRef.onDestroy(() => window.removeEventListener('beforeunload', onBeforeUnload));
    }
    destroyRef.onDestroy(() => this.validation?.abort());
  }

  ngAfterContentInit() {
    assertUniqueSteps(this.entries());
    if (this.defaultProgressOpen() && !this.progressOpen()) this.progressOpen.set(true);
    const loaded = this.persistence()?.load();
    const snapshot = isPromise(loaded) ? undefined : loaded;
    /* A restored value is requested in either mode, so a consumer that derives
       a branch from it — through [(value)] or (valueChangeRequest) — hears it. */
    if (snapshot !== undefined) this.requestValue(snapshot.value, 'programmatic');
    else if (this.value() === undefined) this.value.set(this.defaultValue() ?? EMPTY);
    if (snapshot !== undefined) {
      this.drafts.set(snapshot.drafts);
      this.resolveRestored(snapshot.step);
    }
    const requested = snapshot?.step ?? this.step() ?? this.defaultStep();
    const start = clampStep({
      linear: this.resolvedLinear(),
      requested,
      steps: this.entries(),
      value: this.accepted(),
    });
    if (start !== undefined && start !== this.step()) {
      if (this.step() === undefined) {
        this.ownWrite = start;
        this.step.set(start);
      } else this.requestStep(start, 'programmatic', undefined, false);
    }
    this.initialised = true;
    if (isPromise(loaded)) this.restore(loaded as Promise<WizardSnapshot | undefined>);
  }

  /* ── Requests ──────────────────────────────────────────────────────── */

  private requestStep(next: string, reason: WizardStepReason, source: unknown, focus = true) {
    const from = this.current();
    if (next === from && next === this.step()) return false;
    let cancelled = false;
    const state = createControllable<string>({
      initial: this.step() ?? from ?? next,
      onRequest: (raw) => {
        this.stepChangeRequest.emit(this.wrap(raw, reason));
        cancelled = raw.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (!moved || cancelled) return false;
    this.ownWrite = next;
    this.step.set(next);
    if (focus) this.focusNext = 'title';
    return true;
  }

  private requestValue(next: WizardValue, reason: WizardValueRequest['reason'], source?: unknown) {
    let cancelled = false;
    const state = createControllable<WizardValue>({
      initial: this.accepted(),
      onRequest: (raw) => {
        this.valueChangeRequest.emit(this.wrap(raw, reason));
        cancelled = raw.cancelled;
      },
    });
    if (!state.request(next, reason, source) || cancelled) return false;
    this.value.set(next);
    return true;
  }

  private requestOpen(
    next: boolean,
    reason: WizardProgressOpenRequest['reason'],
    source?: unknown,
  ) {
    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.progressOpen(),
      onRequest: (raw) => {
        this.progressOpenChangeRequest.emit(this.wrap(raw, reason));
        cancelled = raw.cancelled;
      },
    });
    if (!state.request(next, reason, source) || cancelled) return;
    this.progressOpen.set(next);
  }

  private wrap<T, R extends string>(raw: ChangeRequest<T>, reason: R) {
    return {
      cancel: () => raw.cancel(),
      get cancelled() {
        return raw.cancelled;
      },
      previous: raw.previous,
      reason,
      source: raw.source,
      value: raw.value,
    } as ChangeRequest<T> & { reason: R };
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  registerForm(form: SlWizardForm) {
    this.form.set(form);
  }

  unregisterForm(form: SlWizardForm) {
    if (this.form() === form) this.form.set(undefined);
  }

  isComplete(name: string) {
    return stepComplete(this.accepted(), name);
  }

  isReachable(name: string) {
    return (
      this.phase() === 'complete' ||
      reachableStep({
        current: this.current(),
        linear: this.resolvedLinear(),
        steps: this.entries(),
        target: name,
        value: this.accepted(),
      })
    );
  }

  /* ── The cycle of a step ───────────────────────────────────────────── */

  /**
   * The step's form passed the platform's and Reactive Forms' validation. The
   * step's `validate` runs next; a promise holds the next button in its
   * loading state and is aborted when the reader leaves (decision 4).
   */
  commit(
    typed: StepValues,
    source: unknown,
  ): FormErrorInput | void | Promise<FormErrorInput | void> {
    const name = this.current();
    if (name === undefined || this.pending() !== undefined || this.phase() !== 'editing') return;
    const step = this.currentStep();
    const answers = step?.values() ?? typed;
    const check = step?.validate();
    if (check === undefined) {
      this.accept(name, answers, source);
      return;
    }

    this.validation?.abort();
    const controller = new AbortController();
    this.validation = controller;
    const found = (errors: FormErrorInput | void): FormErrorInput | void => {
      if (controller.signal.aborted) return;
      if (this.validation === controller) this.validation = undefined;
      this.pending.set(undefined);
      if (errors !== undefined && errors !== null && hasErrors(normaliseErrors(errors))) {
        this.markInvalid(name, true);
        this.jumpTarget = undefined;
        return errors;
      }
      if (this.current() !== name) return;
      this.accept(name, answers, source);
    };
    const result = check(answers, { signal: controller.signal, value: this.accepted() });
    if (!isPromise(result)) return found(result);
    this.pending.set(name);
    return (result as Promise<FormErrorInput | void>).then(found, () => {
      if (!controller.signal.aborted) this.pending.set(undefined);
    });
  }

  private accept(name: string, answers: StepValues, source: unknown) {
    const accepted = { ...this.accepted(), [name]: answers };
    if (!this.requestValue(accepted, 'submit', source)) return;
    const drafts = without(this.drafts(), name);
    this.drafts.set(drafts);
    this.stepErrors.update((errors) => {
      if (!(name in errors)) return errors;
      const next = { ...errors };
      delete next[name];
      return next;
    });
    this.markInvalid(name, false);
    /**
     * Where the flow goes is decided after the consumer's template has run
     * again with the new value, not now. A step the answer opens — Company
     * after Business, an `@if` over the value — exists only once the view
     * that declares it has been checked; decided here, the destination
     * skipped it and went to the step after.
     */
    afterNextRender(
      () => {
        if (this.current() !== name || this.phase() !== 'editing') return;
        if (this.resolvedAutosave() === 'step') {
          const destination = nextDestination({
            current: name,
            returnTo: this.returnTo(),
            steps: this.entries(),
            value: accepted,
          });
          void this.write(
            accepted,
            drafts,
            destination.kind === 'step' ? destination.name : name,
            'submit',
            source,
          );
        }
        this.route(accepted, name, source);
      },
      { injector: this.injector },
    );
  }

  private route(accepted: WizardValue, name: string, source: unknown) {
    const steps = this.entries();
    const jump = this.jumpTarget;
    this.jumpTarget = undefined;
    if (
      jump !== undefined &&
      reachableStep({
        current: name,
        linear: this.resolvedLinear(),
        steps,
        target: jump,
        value: accepted,
      })
    ) {
      this.requestStep(jump, 'pointer', source);
      return;
    }
    const back = this.returnTo();
    const destination = nextDestination({ current: name, returnTo: back, steps, value: accepted });
    if (back !== undefined && (destination.kind === 'submit' || destination.name === back)) {
      this.returnTo.set(undefined);
    }
    if (back !== undefined && !steps.some((entry) => entry.name === back))
      this.returnTo.set(undefined);
    if (destination.kind === 'step') this.requestStep(destination.name, 'submit', source);
    else this.submitFlow(accepted, source);
  }

  private submitFlow(accepted: WizardValue, source: unknown) {
    const open = firstIncomplete({ steps: this.entries(), value: accepted });
    if (open !== undefined) {
      this.requestStep(open, 'submit', source);
      this.failure.set({ message: this.t('incomplete') });
      this.focusNext = 'alert';
      return;
    }
    this.failure.set(undefined);
    this.phase.set('submitting');
    const settle = (answer: unknown) => {
      if (typeof answer === 'object' && answer !== null) {
        this.fail(answer as WizardFailure, source);
        return;
      }
      this.phase.set('complete');
      this.drafts.set(EMPTY);
      void this.persistence()?.clear();
      this.focusNext = 'complete';
      this.completed.emit(accepted);
    };
    let answer: unknown;
    try {
      answer = this.submitWizard()?.(includedValues(accepted, this.entries()), {
        reason: 'submit',
        source,
        value: accepted,
      });
    } catch {
      this.fail({}, source);
      return;
    }
    if (isPromise(answer)) {
      answer.then(settle, () => this.fail({}, source));
      return;
    }
    settle(answer);
  }

  private fail(reported: WizardFailure, source: unknown) {
    this.phase.set('editing');
    this.failure.set(reported);
    const target = reported.step;
    if (target !== undefined && this.entries().some((entry) => entry.name === target)) {
      if (reported.errors !== undefined) {
        this.stepErrors.update((errors) => ({
          ...errors,
          [target]: reported.errors as FormErrorInput,
        }));
        this.markInvalid(target, true);
      }
      if (target === this.current()) this.epoch.update((epoch) => epoch + 1);
      else this.requestStep(target, 'programmatic', source);
    }
    this.focusNext = 'alert';
  }

  /** The errors a failed submission sent back for this step, for its form. */
  errorsFor(name: string): FormErrorInput | undefined {
    return this.stepErrors()[name];
  }

  private markInvalid(name: string, invalid: boolean) {
    this.invalid.update((names) => {
      if (names.has(name) === invalid) return names;
      const next = new Set(names);
      if (invalid) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  private leave() {
    this.validation?.abort();
    this.validation = undefined;
    this.pending.set(undefined);
  }

  /** What was typed on this step and not accepted, kept for when it returns. */
  private stash(): WizardValue {
    const form = this.form();
    const name = this.current();
    if (form === undefined || name === undefined || !form.dirty()) return this.drafts();
    const next = { ...this.drafts(), [name]: form.typed() };
    this.drafts.set(next);
    return next;
  }

  private async write(
    value: WizardValue,
    drafts: WizardValue,
    step: string,
    reason: WizardDraftReason,
    source: unknown,
  ) {
    const persistence = this.persistence();
    const snapshot = createSnapshot({ drafts, step, value, version: this.version() });
    this.draftState.set('saving');
    try {
      this.draftSave.emit({ reason, snapshot, source });
      await persistence?.save(snapshot);
      this.savedAt.set(new Date(snapshot.savedAt));
      this.draftState.set('saved');
    } catch {
      this.draftState.set('failed');
    }
  }

  private restore(load: Promise<WizardSnapshot | undefined>) {
    this.restoring.set(true);
    let shownAt: number | undefined;
    const delay = this.delay() ?? this.defaults.delay;
    const minDuration = this.minDuration() ?? this.defaults.minDuration;
    const timer = setTimeout(() => {
      shownAt = Date.now();
      this.skeleton.set(true);
    }, delay);
    const finish = (snapshot: WizardSnapshot | undefined) => {
      clearTimeout(timer);
      const apply = () => {
        this.skeleton.set(false);
        this.restoring.set(false);
        if (snapshot === undefined) return;
        this.requestValue(snapshot.value, 'programmatic');
        this.drafts.set(snapshot.drafts);
        this.resolveRestored(snapshot.step);
      };
      const remaining = shownAt === undefined ? 0 : minDuration - (Date.now() - shownAt);
      if (remaining > 0) setTimeout(apply, remaining);
      else apply();
    };
    load.then(finish, () => finish(undefined));
  }

  /**
   * The step a draft was saved on, resolved after the consumer's template has
   * run with the restored value: the step may be one that value opens, and
   * before that render it does not exist.
   */
  private resolveRestored(step: string) {
    afterNextRender(
      () => {
        const target = clampStep({
          linear: this.resolvedLinear(),
          requested: step,
          steps: this.entries(),
          value: this.accepted(),
        });
        if (target !== undefined && target !== this.current()) {
          this.requestStep(target, 'programmatic', undefined, false);
        }
      },
      { injector: this.injector },
    );
  }

  private dirty() {
    const form = this.form();
    return (
      this.phase() !== 'complete' &&
      ((form !== undefined && form.dirty()) ||
        Object.keys(this.drafts()).length > 0 ||
        Object.keys(this.accepted()).length > 0)
    );
  }

  /* ── The moves ─────────────────────────────────────────────────────── */

  /** Submits the current step, as the next button does. */
  next(source?: unknown) {
    if (this.disabled() || this.phase() !== 'editing') return;
    const form = this.form();
    if (form !== undefined) {
      form.submit();
      return;
    }
    const name = this.current();
    if (name !== undefined) void this.commit({}, source);
  }

  /** One step back, keeping what was typed. */
  previous(source?: unknown) {
    const name = this.current();
    if (name === undefined || this.busy() || this.disabled() || this.phase() !== 'editing') return;
    const target = previousStep({ current: name, steps: this.entries() });
    if (target === undefined) return;
    this.stash();
    this.leave();
    this.requestStep(target, 'pointer', source);
  }

  /** Goes to a step: back freely, forward through a submission of this one. */
  goTo(name: string, reason: WizardStepReason = 'programmatic', source?: unknown) {
    const from = this.current();
    const steps = this.entries();
    if (from === undefined || name === from || this.phase() !== 'editing' || this.disabled())
      return;
    const target = steps.findIndex((entry) => entry.name === name);
    const here = steps.findIndex((entry) => entry.name === from);
    if (target === -1) return;
    if (target < here) {
      this.stash();
      this.leave();
      this.requestStep(name, reason, source);
      return;
    }
    if (this.pending() !== undefined) return;
    if (
      !reachableStep({
        current: from,
        linear: this.resolvedLinear(),
        steps,
        target: name,
        value: { ...this.accepted(), [from]: {} },
      })
    ) {
      return;
    }
    this.jumpTarget = name;
    this.next(source);
    if (this.validation === undefined && this.jumpTarget === name) this.jumpTarget = undefined;
  }

  /** Goes to a step and comes back here once it is accepted. */
  edit(name: string, source?: unknown) {
    const from = this.current();
    if (from === undefined || this.phase() !== 'editing' || this.disabled()) return;
    this.returnTo.set(from);
    this.stash();
    this.leave();
    this.requestStep(name, 'pointer', source);
  }

  /** Accepts an optional step with no answers. */
  skip(source?: unknown) {
    const name = this.current();
    if (name === undefined || !this.optionalStep() || this.busy() || this.disabled()) return;
    if (this.phase() !== 'editing') return;
    this.leave();
    this.accept(name, {}, source);
  }

  cancel(source?: unknown) {
    if (this.phase() === 'submitting') return;
    this.cancelRequest.emit({ dirty: this.dirty(), source });
  }

  saveDraft(reason: WizardDraftReason = 'programmatic', source?: unknown) {
    const name = this.current();
    if (name === undefined || this.phase() !== 'editing') return;
    const drafts = this.stash();
    void this.write(this.accepted(), drafts, name, reason, source);
  }

  clearDraft() {
    this.draftState.set('idle');
    this.savedAt.set(undefined);
    void this.persistence()?.clear();
  }

  /** Back to the first step, with no answers, no draft and no error. */
  reset() {
    this.leave();
    this.jumpTarget = undefined;
    this.returnTo.set(undefined);
    this.failure.set(undefined);
    this.phase.set('editing');
    this.drafts.set(EMPTY);
    this.stepErrors.set({});
    this.invalid.set(new Set());
    this.draftState.set('idle');
    this.savedAt.set(undefined);
    this.requestValue(EMPTY, 'clear');
    const first = clampStep({
      linear: this.resolvedLinear(),
      requested: undefined,
      steps: this.entries(),
      value: EMPTY,
    });
    if (first !== undefined) this.requestStep(first, 'programmatic', undefined);
    void this.persistence()?.clear();
  }

  focus() {
    this.titleRef()?.nativeElement.focus();
  }

  /* ── The progress ──────────────────────────────────────────────────── */

  protected onHeader(request: ChangeRequest<number>) {
    const target = this.entries()[request.value]?.name;
    if (target === undefined) return;
    if (this.progressOpen()) this.requestOpen(false, 'select', request.source);
    this.goTo(target, request.reason === 'keyboard' ? 'keyboard' : 'pointer', request.source);
  }

  protected toggleProgress(event: MouseEvent) {
    this.requestOpen(!this.progressOpen(), event.detail === 0 ? 'keyboard' : 'pointer', event);
  }

  protected onProgressKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !this.progressOpen()) return;
    event.preventDefault();
    this.requestOpen(false, 'escape', event);
    this.toggleRef()?.nativeElement.focus();
  }
}

/* ── The actions ─────────────────────────────────────────────────────── */

/**
 * The next button. On a plain `button` a consumer wrote it submits the step's
 * form; beside `slButton` in the default row it is `type="submit"` associated
 * to the form by the platform's `form` attribute. The part is a binding, so it
 * wins over `slButton`'s static `data-part="root"` and follows the switch to
 * `submit` on the final step.
 */
@Directive({
  selector: 'button[slWizardNext]',
  standalone: true,
  host: {
    '[attr.data-part]': "wizard.isFinal() && !wizard.returning() ? 'submit' : 'next'",
    '[attr.data-part-root]': 'null',
    '[attr.data-part-submit]': "wizard.isFinal() && !wizard.returning() ? '' : null",
    '[attr.data-part-next]': "wizard.isFinal() && !wizard.returning() ? null : ''",
    '[attr.data-final]': "wizard.isFinal() && !wizard.returning() ? '' : null",
    '[attr.form]': 'wizard.hasForm() ? wizard.formId : null',
    '(click)': 'onClick($event)',
  },
})
export class SlWizardNext {
  protected readonly wizard = inject(SlWizard);
  private readonly button = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    if (this.wizard.busy() || this.wizard.disabled()) {
      event.preventDefault();
      return;
    }
    if (this.button.type === 'submit' && this.wizard.hasForm()) return;
    this.wizard.next(event);
  }
}

@Directive({
  selector: 'button[slWizardPrevious]',
  standalone: true,
  host: {
    '[attr.data-part]': "'previous'",
    '[attr.data-part-root]': 'null',
    '[attr.data-part-previous]': "''",
    '(click)': 'onClick($event)',
  },
})
export class SlWizardPrevious {
  private readonly wizard = inject(SlWizard);
  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.wizard.previous(event);
  }
}

@Directive({
  selector: 'button[slWizardCancel]',
  standalone: true,
  host: {
    '[attr.data-part]': "'cancel'",
    '[attr.data-part-root]': 'null',
    '[attr.data-part-cancel]': "''",
    '(click)': 'onClick($event)',
  },
})
export class SlWizardCancel {
  private readonly wizard = inject(SlWizard);
  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.wizard.cancel(event);
  }
}

@Directive({
  selector: 'button[slWizardSaveDraft]',
  standalone: true,
  host: {
    '[attr.data-part]': "'save-draft'",
    '[attr.data-part-root]': 'null',
    '[attr.data-part-save-draft]': "''",
    '(click)': 'onClick($event)',
  },
})
export class SlWizardSaveDraft {
  private readonly wizard = inject(SlWizard);
  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.wizard.saveDraft('pointer', event);
  }
}

@Directive({
  selector: 'button[slWizardSkip]',
  standalone: true,
  host: {
    '[attr.data-part]': "'skip'",
    '[attr.data-part-root]': 'null',
    '[attr.data-part-skip]': "''",
    '(click)': 'onClick($event)',
  },
})
export class SlWizardSkip {
  private readonly wizard = inject(SlWizard);
  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.wizard.skip(event);
  }
}

/** The polite status that says when the draft was saved. */
@Component({
  selector: '[slWizardDraftStatus]',
  standalone: true,
  template: '{{ text() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-part': 'draft-status', 'data-part-draft-status': '', role: 'status' },
})
export class SlWizardDraftStatus {
  private readonly wizard = inject(SlWizard);
  protected readonly text = computed(() => {
    const t = this.wizard.t;
    const state = this.wizard.draftState();
    const savedAt = this.wizard.savedAt();
    if (state === 'saving') return t('saving');
    if (state === 'failed') return t('draftFailed');
    if (state === 'saved' && savedAt !== undefined) {
      const time = new Intl.DateTimeFormat(this.wizard.locale(), {
        hour: '2-digit',
        minute: '2-digit',
      }).format(savedAt);
      return t('saved', { time });
    }
    return '';
  });
}

/**
 * The control a review step puts beside each answer: it goes to the named
 * step and sets the return point. Its name is the label and the step's label,
 * "Change shipping address".
 */
@Component({
  selector: 'button[slWizardEdit]',
  standalone: true,
  template: `<ng-content>{{ wizard.t('edit') }}</ng-content>
    @if (target(); as step) {
      {{ ' ' }}<span data-ui="visually-hidden" data-ui-visually-hidden="">{{ step.label() }}</span>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'edit',
    'data-part-edit': '',
    type: 'button',
    '[attr.aria-disabled]': "unavailable() ? 'true' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlWizardEdit {
  protected readonly wizard = inject(SlWizard);
  readonly step = input.required<string>({ alias: 'slWizardEdit' });
  protected readonly target = computed(() =>
    this.wizard.steps().find((candidate) => candidate.name() === this.step()),
  );
  protected readonly unavailable = computed(
    () => this.wizard.disabled() || this.wizard.busy() || this.target() === undefined,
  );

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.unavailable()) return;
    this.wizard.edit(this.step(), event);
  }
}
