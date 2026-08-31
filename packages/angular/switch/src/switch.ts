import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
import { SlField } from '@slotted/angular/field';

export type SwitchSize = 'sm' | 'md' | 'lg';

/**
 * An immediate binary setting, drawn on a button that reports `aria-checked`.
 *
 * It binds no keys: a button already answers Space and Enter, and the switch
 * pattern asks for nothing else. It has no read-only state either — a setting
 * that cannot be changed is disabled, with an explanation beside it, rather
 * than a control that looks operable and swallows the click.
 */
@Component({
  selector: 'button[slSwitch]',
  standalone: true,
  template: '<span data-part="thumb"></span>',
  styleUrl: '../../../styles/src/switch/switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-switch',
    'data-slotted-component': 'switch',
    'data-part': 'root',
    role: 'switch',
    type: 'button',
    '[attr.data-size]': 'size()',
    '[attr.data-checked]': "checked() ? '' : null",
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-invalid]': "isInvalid() ? '' : null",
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': "isInvalid() ? 'true' : null",
    '[attr.aria-required]': "isRequired() ? 'true' : null",
    '[attr.id]': 'controlId()',
    '[attr.disabled]': "isDisabled() ? '' : null",
    '(click)': 'toggle()',
  },
})
export class SlSwitch {
  readonly checked = model(false);
  readonly disabled = input<boolean | undefined>(undefined);
  readonly invalid = input<boolean | undefined>(undefined);
  readonly required = input<boolean | undefined>(undefined);
  readonly size = input<SwitchSize>('md');

  private readonly field = inject(SlField, { optional: true });
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly ownId = this.element.getAttribute('id');

  protected readonly isDisabled = computed(
    () => this.disabled() ?? this.field?.disabled() ?? false,
  );

  protected readonly isInvalid = computed(() => this.invalid() ?? this.field?.invalid() ?? false);

  protected readonly isRequired = computed(
    () => this.required() ?? this.field?.required() ?? false,
  );

  protected readonly controlId = computed(() => this.ownId ?? this.field?.controlId() ?? null);

  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);

  toggle() {
    if (this.isDisabled()) return;
    this.checked.set(!this.checked());
  }

  constructor() {
    this.field?.registerControl();
  }
}
