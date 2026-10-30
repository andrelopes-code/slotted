import {
  booleanAttribute,
  Component,
  computed,
  effect,
  inject,
  InjectionToken,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import type { ButtonMessages, FamilyTranslator } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import type { ButtonSize, ButtonTone, ButtonVariant } from './button.constants';
import { injectButtonDefaults } from './button-defaults';

/** A state attribute is present or absent; it never carries a value. */
export function stateAttribute(active: boolean) {
  return active ? '' : null;
}

export function blockActivation(event: Event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
}

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter, which is exactly why the family uses one — and why the reason a
 * toggle moved has to be recovered from the event. A click synthesised by the
 * keyboard reports no detail; a real one reports the click count.
 */
export function activationReason(event: Event): ChangeReason {
  return event instanceof MouseEvent && event.detail > 0 ? 'pointer' : 'keyboard';
}

/**
 * Absence has to survive the transform. `booleanAttribute` maps an unset input
 * to `false`, and `false` is a value: it would make every icon button announce
 * itself as an unpressed toggle.
 */
export function optionalBoolean(value: boolean | string | undefined) {
  return value === undefined ? undefined : booleanAttribute(value);
}

interface AppearanceInputs {
  size: Signal<ButtonSize | undefined>;
  tone: Signal<ButtonTone | undefined>;
  variant: Signal<ButtonVariant | undefined>;
}

interface AppearanceFallback {
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

/**
 * An explicit input wins over the injected default, and the injected default
 * over the member's own. The three are read in that order rather than merged,
 * so an application that provides only `size` leaves each member the tone and
 * the paint it was designed with.
 */
export function resolveAppearance(inputs: AppearanceInputs, fallback: AppearanceFallback) {
  const provided = injectButtonDefaults();

  return {
    size: computed(() => inputs.size() ?? provided.size ?? fallback.size),
    tone: computed(() => inputs.tone() ?? provided.tone ?? fallback.tone),
    variant: computed(() => inputs.variant() ?? provided.variant ?? fallback.variant),
  };
}

interface InertInputs {
  disabled: Signal<boolean>;
  focusableWhenDisabled: Signal<boolean>;
  loading: Signal<boolean>;
}

/**
 * Being unavailable and being unreachable are two decisions the platform only
 * offers together. `disabled` takes the control out of the tab sequence, which
 * takes its tooltip and its explanation with it; `aria-disabled` announces the
 * same thing and leaves it reachable, at the price of a refusal the family has
 * to enforce itself.
 *
 * A waiting control is always the second kind. React Aria's pending button and
 * Primer's loading button agree: focus must survive an action the person just
 * started, or the keyboard lands somewhere else mid-task.
 */
export function resolveInertness(inputs: InertInputs) {
  return {
    refuses: computed(() => inputs.disabled() || inputs.loading()),
    nativelyDisabled: computed(() => inputs.disabled() && !inputs.focusableWhenDisabled()),
    ariaDisabled: computed(() =>
      (inputs.disabled() && inputs.focusableWhenDisabled()) || inputs.loading() ? 'true' : null,
    ),
  };
}

/**
 * Whether the ring is drawn yet. The wait itself starts at once — the
 * activation is refused from the first millisecond — but a spinner shown for
 * ninety of them is a flash rather than a status, so the picture can lag the
 * state by as long as the consumer says.
 */
export function resolveLoadingIndicator(
  loading: Signal<boolean>,
  loadingDelay: Signal<number>,
): Signal<boolean> {
  const elapsed = signal(false);

  effect((onCleanup) => {
    if (!loading() || loadingDelay() <= 0) {
      elapsed.set(false);
      return;
    }
    const timer = setTimeout(() => elapsed.set(true), loadingDelay());
    onCleanup(() => clearTimeout(timer));
  });

  return computed(() => loading() && (loadingDelay() <= 0 || elapsed()));
}

/**
 * What the member is waiting for, published to the visual slots it projects.
 * A slot is written by the consumer on the consumer's own element, so the
 * button cannot reach into it: it tells the slot instead, and the slot draws
 * the ring over the glyph it holds.
 */
export interface ButtonWait {
  readonly waiting: Signal<boolean>;
  /** The family's words in the language in force; the ring is named by `loading`. */
  readonly t: FamilyTranslator<ButtonMessages>;
  /**
   * Whether the control has a start slot. The ring takes the first visual slot
   * the control has, and the two slots are siblings — a sibling cannot be
   * injected — so the member that owns both answers for them.
   */
  readonly hasStart: Signal<boolean>;
}

export const BUTTON_WAIT = new InjectionToken<ButtonWait>('slotted button wait');

/**
 * Markers rather than wrappers. The part attribute lands on the element the
 * consumer already wrote, so an absent icon leaves no empty box behind and the
 * rendered tree matches the React binding's exactly.
 *
 * They are components rather than directives because a slot has one thing to
 * render of its own: the ring that stands in for its glyph while the control
 * waits. The glyph is projected under it and fades; it is not taken out, both
 * because Angular cannot take back content the consumer projected and because
 * an element that leaves the flow can move what is beside it.
 */
@Component({
  selector: '[slButtonStart]',
  standalone: true,
  template: `<ng-content></ng-content>
    @if (drawsRing()) {
      <span
        data-part="indicator"
        data-part-indicator=""
        data-ui="spinner"
        data-ui-spinner=""
        role="progressbar"
        [attr.aria-label]="wait?.t('loading') ?? null"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    }`,
  styleUrls: ['../../../styles/src/button/button.css', '../../../styles/src/spinner/spinner.css'],
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slButtonStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlButtonStart {
  protected readonly wait = inject(BUTTON_WAIT, { optional: true });
  protected readonly drawsRing = computed(() => this.wait?.waiting() ?? false);
}

@Component({
  selector: '[slButtonEnd]',
  standalone: true,
  template: `<ng-content></ng-content>
    @if (drawsRing()) {
      <span
        data-part="indicator"
        data-part-indicator=""
        data-ui="spinner"
        data-ui-spinner=""
        role="progressbar"
        [attr.aria-label]="wait?.t('loading') ?? null"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    }`,
  styleUrls: ['../../../styles/src/button/button.css', '../../../styles/src/spinner/spinner.css'],
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slButtonEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlButtonEnd {
  protected readonly wait = inject(BUTTON_WAIT, { optional: true });

  /**
   * The ring takes the first visual slot the control has, so an end slot draws
   * it only when there is no start slot to take it.
   */
  protected readonly drawsRing = computed(
    () => (this.wait?.waiting() ?? false) && !(this.wait?.hasStart() ?? false),
  );
}

interface PressedSource {
  pressed: Signal<boolean | undefined>;
  defaultPressed: Signal<boolean | undefined>;
  emit: (request: ChangeRequest<boolean>) => void;
}

/**
 * The controlled and uncontrolled pair, decided by whether the consumer passed
 * a value. `@slotted/core/state` owns that decision so the two bindings cannot
 * disagree about who holds the value; the signal below is only where an
 * uncontrolled toggle keeps its own.
 */
export class PressedState {
  private readonly own: WritableSignal<boolean | undefined> = signal(undefined);

  constructor(private readonly source: PressedSource) {}

  readonly value = () =>
    this.source.pressed() ?? this.own() ?? this.source.defaultPressed() ?? false;

  request(event: Event) {
    const next = !this.value();
    const state = createControllable<boolean>({
      controlled: this.source.pressed(),
      initial: this.value(),
      onRequest: (request) => this.source.emit(request),
    });

    if (state.request(next, activationReason(event), event)) this.own.set(next);
  }
}
