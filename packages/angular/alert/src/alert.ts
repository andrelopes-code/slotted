import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

export type AlertVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
export type AlertFill = 'subtle' | 'outline' | 'solid';
export type AlertSize = 'sm' | 'md';
export type AlertLive = 'off' | 'polite' | 'assertive';

const LIVE_ROLE: Record<AlertLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};

/**
 * `live` decides whether the message interrupts, and nothing else does. A
 * message rendered with the page says nothing; one that appears after an
 * action is polite; only a message about something going wrong right now earns
 * assertive, which cuts a screen reader off mid-sentence.
 */
@Component({
  selector: 'div[slAlert]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/alert/alert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-alert',
    'data-slotted-component': 'alert',
    'data-part': 'root',
    '[attr.data-variant]': 'variant()',
    '[attr.data-fill]': 'fill()',
    '[attr.data-size]': 'size()',
    '[attr.role]': 'role()',
  },
})
export class SlAlert {
  readonly fill = input<AlertFill>('subtle');
  readonly live = input<AlertLive>('off');
  readonly size = input<AlertSize>('md');
  readonly variant = input<AlertVariant>('accent');

  private readonly ownRole = inject(ElementRef<HTMLElement>).nativeElement.getAttribute('role');

  readonly role = computed(() => this.ownRole ?? LIVE_ROLE[this.live()]);
}
