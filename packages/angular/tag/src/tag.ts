import { tagMessages, type PartialMessages, type TagMessages } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
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
import { injectMessages } from '@slotted/angular/i18n';

import { injectTagDefaults, SlTagIdFactory } from './tag-defaults';
import type { TagShape, TagSize, TagTone, TagVariant } from './tag-defaults';
import { SlTagGroup } from './tag-group';

export type { TagOrientation, TagShape, TagSize, TagTone, TagVariant } from './tag-defaults';

/**
 * How the removal was asked for. `remove` is the control at the end of the
 * chip; `keyboard` is `Backspace` or `Delete` pressed on it.
 */
export type TagRemoveReason = Extract<ChangeReason, 'remove' | 'keyboard'>;

/**
 * A request to be taken out of the collection that holds the tag, and never a
 * value: the tag does not own whether it exists. Refusing it is what stops the
 * group from moving focus, which is the one thing the family would otherwise
 * commit on its own.
 */
export interface TagRemoveRequest {
  readonly reason: TagRemoveReason;
  readonly source: Event;
  readonly cancelled: boolean;
  cancel(): void;
}

/**
 * The chip box: an entity, a filter or a compact value. It is not metadata —
 * that is `badge`, and the two share this tone and this type scale on purpose.
 *
 * **The root is never the interactive element.** A `button` cannot contain a
 * `button` and an `a` cannot contain either, so a chip that both acts and
 * removes has to put its two controls side by side. The chip is written on the
 * consumer's own `span`; what the chip *is* is decided by the element under
 * `slTagBody`: a `span` does nothing, a `button` runs a command, an `a`
 * navigates, and `slTagToggle` holds a selection. The element is the member,
 * which is what keeps `routerLink`, `type` and every native attribute on the
 * element that owns them.
 */
@Component({
  selector: '[slTag]',
  standalone: true,
  exportAs: 'slTag',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/tag/tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'tag',
    'data-ui-tag': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.role]': 'role()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SlTag {
  /** Defaults to the provider, then to `secondary`. */
  readonly tone = input<TagTone | undefined>(undefined);
  /** Defaults to the provider, then to `soft`. */
  readonly variant = input<TagVariant | undefined>(undefined);
  /** Defaults to the provider, then to `md`. */
  readonly size = input<TagSize | undefined>(undefined);
  /** Defaults to the provider, then to `pill`. */
  readonly shape = input<TagShape | undefined>(undefined);
  /** Refuses every interaction the tag offers, including its removal. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Whether the chip can be removed at all. React reads the same fact from
   * whether a handler was passed; Angular cannot see whether an output was
   * subscribed, so the opt-in is stated — the asymmetry `button` recorded for
   * its own toggle.
   */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Refuses the removal while the rest of the tag stays operable. */
  readonly removeDisabled = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: `remove`
   * is the word the remove control announces before the tag's own label, so it
   * reads "Remove Design" rather than "Remove".
   */
  readonly messages = input<PartialMessages<TagMessages> | undefined>(undefined);

  /** One output for one transition, carrying the reason, the event and `cancel()`. */
  readonly remove = output<TagRemoveRequest>();

  private readonly defaults = injectTagDefaults();
  private readonly group = inject(SlTagGroup, { optional: true, skipSelf: true });
  /** An explicit role the consumer wrote is never replaced by an inferred one. */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  /**
   * One identifier for the chip, from which the label's and the hidden word's
   * are derived. Deriving beats registering: the remove control needs the
   * label's id before the body has had a chance to announce one.
   */
  readonly id = inject(SlTagIdFactory).next();
  readonly labelId = `${this.id}-label`;
  readonly removeWordId = `${this.id}-remove`;

  /** Set by `slTagToggle`, which is the one member that holds a selection. */
  private readonly selectedState = signal(false);

  protected readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedShape = computed(() => this.shape() ?? this.defaults.shape);
  protected readonly role = computed(() => this.writtenRole ?? this.group?.itemRole() ?? null);

  readonly selected = computed(() => this.selectedState());
  /** The family's words in the language in force, with this tag's `messages` laid over them. */
  readonly t = injectMessages(tagMessages, this.messages);
  readonly removeRefused = computed(() => this.disabled() || this.removeDisabled());

  /** Called by the toggle, which owns the value and only reports it here. */
  setSelected(selected: boolean) {
    this.selectedState.set(selected);
  }

  /**
   * The request the remove control and the keyboard both make. Nothing is
   * committed here: the tag does not own whether it exists, and a consumer
   * that refuses the request leaves the chip and the keyboard where they were.
   */
  requestRemoval(reason: TagRemoveReason, source: Event) {
    if (!this.removable() || this.removeRefused()) return;

    let cancelled = false;
    this.remove.emit({
      reason,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    });
  }

  /**
   * `Backspace` and `Delete` on a removable chip, which is the shortcut MUI,
   * Primer, React Aria and Angular Material all ship. It is bound to the chip
   * box rather than to either control, so it answers wherever focus is inside
   * the chip, and a consumer's own handler runs first and can refuse it by
   * calling `preventDefault`.
   *
   * A held key repeats, and a repeat would remove the chip focus has just
   * landed on. The default is prevented because `Backspace` still navigates
   * back in some browsers when nothing is being edited.
   */
  protected onKeydown(event: KeyboardEvent) {
    if (event.repeat || event.defaultPrevented) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    if (!this.removable() || this.removeRefused()) return;

    event.preventDefault();
    this.requestRemoval('keyboard', event);
  }
}
