import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  isDevMode,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { SlFieldIdFactory } from './field-id';

@Component({
  selector: 'div[slField]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/field/field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-field',
    'data-slotted-component': 'field',
    'data-part': 'root',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-invalid]': "invalid() ? '' : null",
    '[attr.data-readonly]': "readOnly() ? '' : null",
    '[attr.data-required]': "required() ? '' : null",
  },
})
export class SlField {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly fieldId = input<string | null>(null, { alias: 'id' });

  private readonly generatedId = inject(SlFieldIdFactory).next();
  private readonly parts = signal<readonly ('description' | 'error')[]>([]);
  private hasControl = false;

  readonly base = computed(() => this.fieldId() ?? this.generatedId);
  readonly controlId = computed(() => `${this.base()}-control`);
  readonly labelId = computed(() => `${this.base()}-label`);
  readonly descriptionId = computed(() => `${this.base()}-description`);
  readonly errorId = computed(() => `${this.base()}-error`);

  readonly describedBy = computed(() => {
    const parts = this.parts();
    const ids = [
      parts.includes('description') ? this.descriptionId() : null,
      parts.includes('error') ? this.errorId() : null,
    ].filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  registerPart(part: 'description' | 'error') {
    this.parts.update((current) => (current.includes(part) ? current : [...current, part]));
  }

  releasePart(part: 'description' | 'error') {
    this.parts.update((current) => current.filter((candidate) => candidate !== part));
  }

  registerControl() {
    this.hasControl = true;
  }

  ngAfterViewInit() {
    if (!isDevMode() || this.hasControl) return;
    console.warn(
      'Field rendered without a control. Add slFieldControl to the control, or use a control that reads the field, so the label resolves.',
    );
  }
}
