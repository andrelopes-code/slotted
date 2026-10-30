import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';
import { currentSlots, spreadPlaceholder } from '@slotted/core/otp';
import { SlField } from '@slotted/angular/field';

import { injectOtpInputDefaults, SlOtpInputState } from './otp-input-defaults';
import type { OtpInputSize, OtpInputVariant } from './otp-input-defaults';

export type { OtpInputSize, OtpInputType, OtpInputVariant } from './otp-input-defaults';

/** The character a masked box shows, which is the one a password field shows. */
const MASK = '•';

interface Slot {
  readonly index: number;
  readonly shown: string;
  readonly placeholder: string;
  readonly current: boolean;
}

/**
 * `groups` has to add up to `length`; a partition that does not is one group.
 * A silent fallback rather than a throw, because a code field that renders
 * nothing on a verification screen locks the reader out of the product.
 */
function partition(length: number, groups: readonly number[] | undefined): number[] {
  if (groups === undefined) return [length];
  const sum = groups.reduce((total, size) => total + size, 0);
  return sum === length && groups.every((size) => size > 0) ? [...groups] : [length];
}

/**
 * The frame: N painted boxes around one real input.
 *
 * **It is not the control.** The element carrying `data-ui` is the consumer's
 * own box with no role; the `input` inside it holds the value, the identifier
 * and every native attribute, and lies over the boxes, transparent. The boxes
 * are drawn here from what the control reports, and are hidden from assistive
 * technology.
 *
 * **Angular pays one element for that frame, and React pays none.** React can
 * render a wrapper from inside a component; an Angular directive cannot create
 * a box around its own host. `slOtpInputControl` injects this class, so a
 * control written without the frame is a compile-time failure rather than a
 * silent one.
 */
@Component({
  selector: '[slOtpInput]',
  standalone: true,
  exportAs: 'slOtpInput',
  /**
   * The character is bound as `textContent` rather than interpolated: an
   * interpolation on its own line leaves a whitespace text node either side of
   * it, and a box that holds " " is not `:empty`, which is what the caret and
   * the placeholder select on.
   */
  template: `<ng-content />
    @for (group of groups(); track $index; let first = $first) {
      @if (!first) {
        <div data-part="separator" data-part-separator="" aria-hidden="true"></div>
      }
      <div data-part="group" data-part-group="" aria-hidden="true">
        @for (slot of group; track slot.index) {
          <div
            data-part="slot"
            data-part-slot=""
            [attr.data-index]="slot.index"
            [attr.data-current]="slot.current ? '' : null"
            [attr.data-placeholder]="
              slot.shown === '' && slot.placeholder !== '' ? slot.placeholder : null
            "
            [textContent]="slot.shown"
          ></div>
        }
      </div>
    }`,
  styleUrl: '../../../styles/src/otp-input/otp-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'otp-input',
    'data-ui-otp-input': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-attached]': "resolvedAttached() ? '' : null",
    '[attr.data-mask]': "mask() ? '' : null",
    '[attr.data-complete]': "complete() ? '' : null",
    '[attr.data-disabled]': "control()?.resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "control()?.resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "control()?.resolvedReadOnly() === true ? '' : null",
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class SlOtpInput {
  /** Defaults to the field, then to the token, then to `md`. */
  readonly size = input<OtpInputSize | undefined>(undefined);
  /** Defaults to the token, then to `outline`. */
  readonly variant = input<OtpInputVariant | undefined>(undefined);
  /** Joins the boxes of a group along one seam. Defaults to the token's. */
  readonly attached = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** How many characters the code has. Defaults to the token's, then 6. */
  readonly length = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /**
   * How the boxes are partitioned: `[3, 3]` draws two groups of three with a
   * separator between them. The sum has to be `length`; a partition that does
   * not add up draws one group.
   */
  readonly groupsInput = input<readonly number[] | undefined>(undefined, { alias: 'groups' });
  /**
   * What an empty box shows: one character repeats over every box, and a
   * string as long as the code distributes. Defaults to the token's.
   */
  readonly placeholder = input<string | undefined>(undefined);
  /**
   * Hides the characters: the control becomes `type="password"`, so the
   * platform treats the value as a secret, and each filled box shows a bullet.
   */
  readonly mask = input(false, { transform: booleanAttribute });

  private readonly defaults = injectOtpInputDefaults();
  private readonly field = inject(SlField, { optional: true });

  /**
   * The control inside. It provides itself as `SlOtpInputState`, so the frame
   * can paint the value and the cursor without either directive importing the
   * other.
   */
  readonly control = contentChild(SlOtpInputState, { descendants: true });

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedAttached = computed(() => this.attached() ?? this.defaults.attached);
  readonly resolvedLength = computed(() => this.length() ?? this.defaults.length);
  readonly resolvedPlaceholder = computed(() => this.placeholder() ?? this.defaults.placeholder);

  readonly complete = computed(() => {
    const control = this.control();
    return control !== undefined && control.code().length === this.resolvedLength();
  });

  protected readonly groups = computed<Slot[][]>(() => {
    const length = this.resolvedLength();
    const control = this.control();
    const code = control?.code() ?? '';
    const selection = control?.focused() === true ? control.selection() : null;
    const active = new Set(
      selection === null ? [] : currentSlots({ ...selection, length, valueLength: code.length }),
    );
    const placeholders = spreadPlaceholder(this.resolvedPlaceholder(), length);
    const mask = this.mask();

    let index = 0;
    return partition(length, this.groupsInput()).map((count) =>
      Array.from({ length: count }, () => {
        const character = code[index] ?? '';
        const slot: Slot = {
          index,
          shown: character === '' ? '' : mask ? MASK : character,
          placeholder: placeholders[index] ?? '',
          current: active.has(index),
        };
        index += 1;
        return slot;
      }),
    );
  });

  /**
   * A press on a box puts the cursor in that box. The input lies over the
   * boxes and would otherwise place its caret by the x of transparent text;
   * the box under the pointer is what the reader meant, so it is found from
   * the point and handed to the control.
   */
  protected onPointerDown(event: PointerEvent) {
    const control = this.control();
    if (control === undefined || control.resolvedDisabled() === true) return;
    if (typeof document.elementsFromPoint !== 'function') return;
    const host = event.currentTarget as HTMLElement;
    const slot = document
      .elementsFromPoint(event.clientX, event.clientY)
      .find(
        (candidate): candidate is HTMLElement =>
          candidate instanceof HTMLElement &&
          candidate.dataset['part'] === 'slot' &&
          candidate.closest("[data-ui='otp-input']") === host,
      );
    if (slot === undefined) return;
    event.preventDefault();
    control.pressAt(Number(slot.dataset['index'] ?? 0));
  }
}
