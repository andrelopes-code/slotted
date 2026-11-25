import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import {
  createTimeFormat,
  rulerKeyTarget,
  rulerScale,
  rulerShare,
  rulerTimeAt,
  SECONDS_PER_DAY,
  secondsOfDay,
} from '@slotted/core/date';
import type { ClockModel, PlainTime } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';

/** A handle of the ruler asked to move. */
export interface PickerRulerMove {
  readonly position: 'start' | 'end';
  readonly source: Event;
  readonly time: PlainTime;
}

const POSITIONS = ['start', 'end'] as const;

/** The day as one axis: the run as a band with a handle on each end. */
@Component({
  selector: '[slPickerRuler]',
  standalone: true,
  template: `
    <div #track data-part="ruler-track" data-part-ruler-track="">
      @for (hour of model().hours; track hour.value) {
        <span
          data-part="ruler-hour"
          data-part-ruler-hour=""
          [attr.data-unavailable]="hour.unavailable ? '' : null"
        ></span>
      }
      @if (band(); as band) {
        <div
          data-part="ruler-band"
          data-part-ruler-band=""
          [style.inline-size.%]="band.size"
          [style.inset-inline-start.%]="band.start"
        ></div>
      }
      @for (handle of handles(); track handle.position) {
        <div
          data-part="ruler-handle"
          data-part-ruler-handle=""
          role="slider"
          tabindex="0"
          aria-valuemin="0"
          [attr.aria-label]="handle.name"
          [attr.aria-valuemax]="last"
          [attr.aria-valuenow]="handle.at"
          [attr.aria-valuetext]="handle.words"
          [style.inset-inline-start.%]="handle.share"
          (keydown)="onKeydown(handle.position, handle.time, $event)"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove(handle.position, $event)"
        ></div>
      }
    </div>
    <div aria-hidden="true" data-part="ruler-scale" data-part-ruler-scale="">
      @for (label of scale(); track $index) {
        <span>{{ label }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'ruler', 'data-part-ruler': '' },
})
export class SlPickerRuler {
  readonly end = input.required<PlainTime | null>();
  readonly hourCycle = input<12 | 24 | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly model = input.required<ClockModel>();
  readonly start = input.required<PlainTime | null>();
  readonly step = input.required<number>();

  readonly moved = output<PickerRulerMove>();

  protected readonly last = SECONDS_PER_DAY - 1;
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly appLocale = injectLocale();
  private readonly t = injectMessages(pickerPanelMessages);

  private readonly format = computed(() =>
    createTimeFormat({ locale: this.locale() ?? this.appLocale(), hourCycle: this.hourCycle() }),
  );

  protected readonly scale = computed(() => rulerScale(this.format()));

  protected readonly band = computed(() => {
    const [start, end] = [this.start(), this.end()];
    if (start === null || end === null) return null;

    const size = rulerShare(end) - rulerShare(start);

    return size > 0 ? { size, start: rulerShare(start) } : null;
  });

  protected readonly handles = computed(() =>
    POSITIONS.flatMap((position) => {
      const time = position === 'start' ? this.start() : this.end();
      if (time === null) return [];

      return [
        {
          at: secondsOfDay(time),
          name: this.t(`${position}Handle`),
          position,
          share: rulerShare(time),
          time,
          words: this.format().describe(time),
        },
      ];
    }),
  );

  protected onKeydown(position: 'start' | 'end', held: PlainTime, event: KeyboardEvent): void {
    const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
    const time = rulerKeyTarget({ key: event.key, rtl }, held, this.model(), this.step());
    if (time === null) return;

    event.preventDefault();
    this.moved.emit({ position, source: event, time });
  }

  protected onPointerDown(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onPointerMove(position: 'start' | 'end', event: PointerEvent): void {
    if (!(event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) return;

    const track = this.track().nativeElement;
    const box = track.getBoundingClientRect();
    const share = (event.clientX - box.left) / box.width;
    const rtl = getComputedStyle(track).direction === 'rtl';
    const time = rulerTimeAt(rtl ? 1 - share : share, this.model());
    if (time !== null) this.moved.emit({ position, source: event, time });
  }
}
