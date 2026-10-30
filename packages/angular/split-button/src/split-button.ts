import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { BUTTON_DEFAULTS_TOKEN } from '@slotted/angular/button';
import type {
  ButtonDefaults,
  ButtonSize,
  ButtonTone,
  ButtonVariant,
} from '@slotted/angular/button';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { injectSplitButtonDefaults } from './split-button-defaults';

/**
 * Why the remembered value moved. The menu's radio group produces exactly
 * these two, and the family surfaces them unchanged.
 */
export type SplitButtonValueReason = 'pointer' | 'keyboard';

/**
 * The three axes the root hands down to both halves, through the button
 * family's own defaults token rather than through a second channel of this
 * family's invention — the mechanism `button-group` uses, and the reason an
 * explicit input on a half still wins. Getters, so a half's `computed` tracks
 * the root's signals.
 */
function provideHalvesPaint() {
  return {
    provide: BUTTON_DEFAULTS_TOKEN,
    useFactory: (): ButtonDefaults => {
      const root = inject(SlSplitButton);
      return {
        get size() {
          return root.resolvedSize();
        },
        get tone() {
          return root.resolvedTone();
        },
        get variant() {
          return root.resolvedVariant();
        },
      };
    },
  };
}

/**
 * An action and the menu of its alternatives, joined into one shape.
 *
 * The root is a `group` of two `button`s: the primary, `SlButton` carrying
 * this family's part, and the menu trigger, `SlIconButton` carrying the
 * other and hosting `slMenuTriggerFor`. Each keeps its role, its state and
 * its own tab stop — every surveyed split button gives the pair two — and
 * the root hands them one appearance through `button`'s own token. The menu
 * is the consumer's own `sl-menu`, written inside the root, and nothing of
 * it is restated here.
 *
 * `remember` is the one decision the family adds. Off, the alternatives are
 * actions. On, the radio group carrying `slSplitButtonChoices` is bound to
 * the root's value, and the consumer renders the primary's label from that
 * value — the merge button whose strategy a repository remembers. A silent
 * update was refused because it changes what the next click does.
 */
@Component({
  selector: '[slSplitButton]',
  standalone: true,
  exportAs: 'slSplitButton',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/split-button/split-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideHalvesPaint()],
  host: {
    'data-ui': 'split-button',
    'data-ui-split-button': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
  },
})
export class SlSplitButton {
  readonly size = input<ButtonSize | undefined>(undefined);
  readonly tone = input<ButtonTone | undefined>(undefined);
  readonly variant = input<ButtonVariant | undefined>(undefined);
  /** The action takes the line; the menu trigger stays square. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Takes both halves out. Each half keeps the native attribute for itself. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * The action is in flight: the primary shows `button`'s indicator with its
   * width and name held, and the menu trigger is `aria-disabled` for the
   * duration — still in the tab sequence, still named, still painted — so a
   * second alternative cannot be chosen while the first runs.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * The choice in the menu becomes the action. Off, the menu's items are
   * actions; on, the items inside the radio group carrying
   * `slSplitButtonChoices` are bound to `value`.
   */
  readonly remember = input(false, { transform: booleanAttribute });

  /** The remembered value. Present at all puts it in controlled mode. */
  readonly value = input<string | undefined>(undefined);
  /** The value an uncontrolled split button remembers first, read once. */
  readonly defaultValue = input<string | undefined>(undefined);
  /**
   * One output for one transition, carrying the value, the value it
   * replaces, the reason, the originating event and `cancel()`.
   */
  readonly valueChange = output<ChangeRequest<string>>();

  private readonly defaults = injectSplitButtonDefaults();
  private readonly inherited = inject(BUTTON_DEFAULTS_TOKEN, { skipSelf: true });
  /**
   * A static attribute the consumer wrote survives the host binding, so a
   * root that is already inside a named group can give the role up with
   * `role=""`, the way `button-group` lets it.
   */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  protected readonly role = this.writtenRole === '' ? null : (this.writtenRole ?? 'group');

  private readonly own: WritableSignal<string | undefined> = signal(undefined);

  /* Resolution: the input, the family's defaults, `button`'s defaults, then
     the contract's. */
  readonly resolvedSize = computed(
    () => this.size() ?? this.defaults.size ?? this.inherited.size ?? 'md',
  );
  readonly resolvedTone = computed(
    () => this.tone() ?? this.defaults.tone ?? this.inherited.tone ?? 'accent',
  );
  readonly resolvedVariant = computed(
    () => this.variant() ?? this.defaults.variant ?? this.inherited.variant ?? 'solid',
  );
  /** The remembered value, under `remember`; nothing otherwise. */
  readonly resolvedValue = computed(() =>
    this.remember() ? (this.value() ?? this.own() ?? this.defaultValue()) : undefined,
  );

  /** Asks the family to remember one alternative as the action. */
  select(next: string, reason: SplitButtonValueReason, source?: unknown): boolean {
    const state = createControllable<string>({
      controlled: this.value(),
      initial: this.resolvedValue() ?? '',
      onRequest: (request) => this.valueChange.emit(request),
    });
    const accepted = state.request(next, reason, source);
    if (accepted) this.own.set(next);
    return accepted;
  }
}
