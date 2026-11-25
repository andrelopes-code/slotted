import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { pickerPanelMessages } from '@slotted/core/i18n';

import { SlPickerStep } from './picker-step';
import type { PickerSpanView } from './picker-views';

/** The value in words, what it means beside today, and the steps that move it. */
@Component({
  selector: '[slPickerHead]',
  standalone: true,
  template: `
    @if (shown() === undefined) {
      <span
        data-part="value"
        data-part-value=""
        [attr.data-empty]="empty() ? '' : null"
        [attr.data-invalid]="invalid() ? '' : null"
        >{{ value() }}</span
      >
    } @else {
      <button
        data-part="value"
        data-part-value=""
        type="button"
        [attr.aria-expanded]="shown()"
        [attr.data-empty]="empty() ? '' : null"
        [attr.data-invalid]="invalid() ? '' : null"
        (click)="revealed.emit($event)"
      >
        {{ value() }}
      </button>
    }
    <span data-part="meta" data-part-meta="">{{ meta() }}</span>
    <span data-part="steps" data-part-steps=""><ng-content /></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'head', 'data-part-head': '' },
})
export class SlPickerHead {
  readonly empty = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly meta = input.required<string>();
  /** Stated, the head is a press that brings its part, in a panel of one at a time. */
  readonly shown = input<boolean | undefined>(undefined);
  readonly value = input.required<string>();

  readonly revealed = output<Event>();
}

/** The name of a time, what it means beside now, and the field it is typed in. */
@Component({
  selector: '[slPickerTimeHead]',
  standalone: true,
  template: `
    @if (shown() === undefined) {
      <span data-part="time-label" data-part-time-label="">{{ label() }}</span>
    } @else {
      <button
        data-part="time-label"
        data-part-time-label=""
        type="button"
        [attr.aria-expanded]="shown()"
        (click)="revealed.emit($event)"
      >
        {{ label() }}
      </button>
    }
    <span data-part="time-meta" data-part-time-meta="">{{ meta() }}</span>
    <span data-part="time-value" data-part-time-value=""><ng-content /></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'time-head', 'data-part-time-head': '' },
})
export class SlPickerTimeHead {
  readonly label = input.required<string>();
  readonly meta = input.required<string>();
  /** Stated, the head is a press that brings its part, in a panel of one at a time. */
  readonly shown = input<boolean | undefined>(undefined);

  readonly revealed = output<Event>();
}

/** The two ends of a run, and its length between them. */
@Directive({
  selector: '[slPickerRangeHead]',
  standalone: true,
  host: { 'data-part': 'range-head', 'data-part-range-head': '' },
})
export class SlPickerRangeHead {}

/** One end of a run. Its value is its content. */
@Component({
  selector: '[slPickerHalf]',
  standalone: true,
  template: `
    <span data-part="half-label" data-part-half-label="" [attr.id]="id">{{ label() }}</span>
    <span data-part="half-meta" data-part-half-meta="">{{ meta() }}</span>
    <span
      data-part="half-value"
      data-part-half-value=""
      [attr.data-empty]="empty() ? '' : null"
      [attr.data-invalid]="invalid() ? '' : null"
      ><ng-content
    /></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'group',
    'data-part': 'half',
    'data-part-half': '',
    '[attr.aria-labelledby]': 'id',
    '[attr.data-current]': "current() ? '' : null",
    '(focusin)': 'entered.emit()',
    '(pointerdown)': 'entered.emit()',
  },
})
export class SlPickerHalf {
  readonly current = input(false, { transform: booleanAttribute });
  readonly empty = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly label = input.required<string>();
  readonly meta = input.required<string>();

  /** Pressing or focusing anywhere in the half makes it the end being chosen. */
  readonly entered = output();

  protected readonly id = `sl-picker-half-${String((sequence += 1))}`;
}

/** The day or the time of one end, as a press that brings its grid. */
@Directive({
  selector: 'button[slPickerHalfPart]',
  standalone: true,
  host: {
    type: 'button',
    '[attr.data-part]': "'half-' + slPickerHalfPart()",
    '[attr.data-part-half-day]': "slPickerHalfPart() === 'day' ? '' : null",
    '[attr.data-part-half-time]': "slPickerHalfPart() === 'time' ? '' : null",
    '[attr.data-current]': "current() ? '' : null",
  },
})
export class SlPickerHalfPart {
  readonly slPickerHalfPart = input.required<'day' | 'time'>();
  readonly current = input(false, { transform: booleanAttribute });
}

/** The length of a run, and the two steps that change it. */
@Component({
  selector: '[slPickerSpan]',
  standalone: true,
  imports: [SlPickerStep],
  template: `
    <button
      slPickerStep="decrease"
      [disabled]="!span().canDecrease"
      [label]="t('decrease')"
      (click)="span().step(-1, $event)"
    ></button>
    <span
      data-part="span-text"
      data-part-span-text=""
      role="status"
      [attr.data-empty]="span().empty ? '' : null"
      >{{ span().text }}</span
    >
    <button
      slPickerStep="increase"
      [disabled]="!span().canIncrease"
      [label]="t('increase')"
      (click)="span().step(1, $event)"
    ></button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'span', 'data-part-span': '' },
})
export class SlPickerSpan {
  readonly span = input.required<PickerSpanView>();

  protected readonly t = injectMessages(pickerPanelMessages);
}

/** A half is labelled by its own name. */
let sequence = 0;
