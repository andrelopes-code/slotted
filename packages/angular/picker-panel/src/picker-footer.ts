import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { pickerPanelMessages } from '@slotted/core/i18n';

/**
 * What the reader is told, and the two actions, on one line in six families.
 * The consumer's own hint is its content, under a reason when there is one.
 */
@Component({
  selector: '[slPickerFooter]',
  standalone: true,
  template: `
    <span
      data-part="hint"
      data-part-hint=""
      role="status"
      [attr.data-invalid]="invalid() ? '' : null"
    >
      @if (invalid()) {
        {{ hint() }}
      } @else {
        <ng-content>{{ hint() }}</ng-content>
      }
    </span>
    <button
      data-part="clear"
      data-part-clear=""
      type="button"
      [disabled]="!canClear()"
      (click)="cleared.emit($event)"
    >
      {{ t('clear') }}
    </button>
    @if (confirm()) {
      <button
        data-part="apply"
        data-part-apply=""
        type="button"
        [disabled]="!canApply()"
        (click)="applied.emit($event)"
      >
        {{ t('apply') }}
      </button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlPickerFooter {
  /** The draft may be written. Ignored without a confirmation. */
  readonly canApply = input.required({ transform: booleanAttribute });
  readonly canClear = input.required({ transform: booleanAttribute });
  /** Whether the panel keeps a draft until Apply. */
  readonly confirm = input.required({ transform: booleanAttribute });
  /** A limit, a zone, or the reason Apply is off. */
  readonly hint = input.required<string>();
  readonly invalid = input(false, { transform: booleanAttribute });

  readonly applied = output<Event>();
  readonly cleared = output<Event>();

  protected readonly t = injectMessages(pickerPanelMessages);
}
