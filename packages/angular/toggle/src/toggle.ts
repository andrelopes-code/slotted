import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { injectToggleDefaults } from './toggle-defaults';
import type { ToggleSize, ToggleVariant } from './toggle-defaults';

/** Why the state moved. A toggle can produce exactly these two. */
export type TogglePressedReason = 'pointer' | 'keyboard';

/**
 * The mark beside the words, or the whole content of an icon-only toggle. A
 * marker on the consumer's own element rather than a wrapper, so an `svg`, an
 * `sl-icon` and a masked `span` all work and none loses its own semantics. It
 * is hidden from the reading order, because the words beside it — or the
 * `aria-label` on the button — are what a reader hears.
 */
@Directive({
  selector: '[slToggleIcon]',
  standalone: true,
  exportAs: 'slToggleIcon',
  host: {
    'data-part': 'icon',
    'data-part-icon': '',
    'aria-hidden': 'true',
  },
})
export class SlToggleIcon {}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is why `Space`, `Enter` and a pointer are told apart
 * without a key listener existing anywhere in the family.
 */
function activationReason(event: Event): TogglePressedReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * A two-state button standing on its own: a mode — Bold, Wrap, Pin — that is
 * true the moment it is pressed. `aria-pressed` is written in both states, so
 * the control is announced as a toggle rather than as a button that happens
 * to be pressed, and its label never changes with its state, which the APG
 * Button pattern calls critical.
 *
 * `SlToggleButton` is the other member: an action that persists — Follow,
 * Subscribe — which reaches a server and waits, in one of five tones. The two
 * hold one state model and one output shape, so a consumer moving between
 * them changes no handler. Inside `slToolbar` the bar owns the tab stop and
 * the arrows, and this control writes no listener of its own.
 *
 * The component is a directive on the element the consumer wrote, so
 * substituting the element is writing a different one — and it has to stay a
 * `button`: `aria-pressed` on a link is a link announcing a state a link does
 * not hold.
 */
@Component({
  selector: 'button[slToggle]',
  standalone: true,
  exportAs: 'slToggle',
  template: `<ng-content select="[slToggleIcon]" />
    <span data-part="label" data-part-label=""><ng-content /></span>`,
  styleUrl: '../../../styles/src/toggle/toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'toggle',
    'data-ui-toggle': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.type]': 'type',
    '[attr.aria-pressed]': 'isPressed()',
    '[attr.data-pressed]': "isPressed() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[disabled]': 'disabled()',
  },
})
export class SlToggle implements AfterViewInit {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<ToggleSize | undefined>(undefined);
  readonly variant = input<ToggleVariant | undefined>(undefined);

  /** Present means controlled, for the life of the component. */
  readonly pressed = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** The value an uncontrolled toggle starts from, read once. */
  readonly defaultPressed = input(false, { transform: booleanAttribute });
  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no
   * `[(pressed)]` because a two-way binding has one slot and cannot carry any
   * of those — the reason `SlToggleButton` records for the same choice.
   */
  readonly pressedChange = output<ChangeRequest<boolean>>();

  private readonly defaults = injectToggleDefaults();
  private readonly element = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  /**
   * A `type` the consumer wrote survives: a toggle inside a form is a
   * `button` unless the consumer says `submit`, and the attribute is read
   * before the host binding writes it.
   */
  private readonly writtenType = inject(new HostAttributeToken('type'), { optional: true });
  protected readonly type = this.writtenType ?? 'button';

  private readonly own: WritableSignal<boolean | undefined> = signal(undefined);

  readonly isPressed = computed(() => this.pressed() ?? this.own() ?? this.defaultPressed());
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);

  /**
   * After the view, not in the constructor. A `(click)` written on the same
   * element is bound when the view is created, so a listener registered any
   * earlier runs first and reads `defaultPrevented` before the consumer has
   * had the chance to set it — and a refused activation would move the state
   * anyway.
   */
  ngAfterViewInit() {
    const listener = (event: Event) => {
      if (this.disabled() || event.defaultPrevented) return;
      this.request(event);
    };
    this.element.addEventListener('click', listener);
    this.destroyRef.onDestroy(() => this.element.removeEventListener('click', listener));
  }

  private request(event: Event) {
    const next = !this.isPressed();
    const state = createControllable<boolean>({
      controlled: this.pressed(),
      initial: this.isPressed(),
      onRequest: (request) => this.pressedChange.emit(request),
    });
    if (state.request(next, activationReason(event), event)) this.own.set(next);
  }
}
