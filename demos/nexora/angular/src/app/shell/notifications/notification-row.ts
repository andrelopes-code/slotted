import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SlIcon } from '@slotted/angular/icon';
import {
  SlListItemActions,
  SlListItemBody,
  SlListItemDescription,
  SlListItemLabel,
  SlListItemStart,
} from '@slotted/angular/list-item';
import type { Notification, NotificationType } from '@slotted/demo-nexora-backend';

import { ClockService } from '../../core/session/clock.service';

/**
 * Every glyph a ring with a mark in it — the same set the notification center
 * in the bell's panel draws. The triangle is refused: its shape is not
 * symmetric, and beside a column of rings it reads as the odd one out.
 */
const ICON: Record<NotificationType, string> = {
  info: 'lucideInfo',
  success: 'lucideCircleCheck',
  warning: 'lucideCircleAlert',
  action_required: 'lucideOctagonAlert',
};
const TONE: Record<NotificationType, string> = {
  info: 'secondary',
  success: 'success',
  warning: 'warning',
  action_required: 'danger',
};

@Component({
  selector: '[appNotificationRow]',
  imports: [
    NgIcon,
    SlIcon,
    SlListItemBody,
    SlListItemDescription,
    SlListItemLabel,
    SlListItemStart,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * The tone's glyph, filled: the tone's surface as a disc under the ringed
     * glyph, at the ring's own radius on the icon grid (ten of twenty-four,
     * stopped a half unit in so the fill ends under the stroke), so the ring
     * is the disc's edge and the mark stands inside it — what the notification
     * center in the bell's panel draws. The disc and the glyph share one box,
     * so they are concentric at every zoom and density; the tinted disc with
     * its own edge and a smaller ringed glyph on top was two circles that
     * rounded apart.
     */
    .glyph {
      --_glyph-size: calc(var(--slotted-avatar-size-sm) * 6 / 7);

      display: inline-grid;
      place-items: center;
      inline-size: var(--slotted-avatar-size-sm);
      block-size: var(--slotted-avatar-size-sm);
      color: var(--slotted-tone-secondary-text);
      background-image: radial-gradient(
        circle,
        var(--_surface, var(--slotted-tone-secondary-surface)) calc(var(--_glyph-size) * 9.5 / 24 - 0.5px),
        transparent calc(var(--_glyph-size) * 9.5 / 24 + 0.5px)
      );
    }
    .glyph > [data-ui='icon'] {
      --slotted-icon-size: var(--_glyph-size);
    }
    .glyph[data-tone='success'] {
      --_surface: var(--slotted-tone-success-surface);

      color: var(--slotted-tone-success-text);
    }
    .glyph[data-tone='warning'] {
      --_surface: var(--slotted-tone-warning-surface);

      color: var(--slotted-tone-warning-text);
    }
    .glyph[data-tone='danger'] {
      --_surface: var(--slotted-tone-danger-surface);

      color: var(--slotted-tone-danger-text);
    }
    /*
     * Unread is the weight and the ink: a read row's title steps back to the
     * muted text, an unread one stands in the text ink, semibold. No dot — a
     * dot after the title wrapped to a line of its own under a long title and
     * sat off the title's center on the short ones.
     */
    .title {
      font-weight: 500;
      text-align: start;
      background: none;
      border: 0;
      padding: 0;
      color: var(--slotted-text-muted);
      font: inherit;
      cursor: pointer;
    }
    :host-context([data-unread]) .title {
      color: var(--slotted-text);
      font-weight: 600;
    }
  `,
  template: `
    <span slListItemStart>
      <span class="glyph" [attr.data-tone]="tone()"
        ><span slIcon><ng-icon [name]="icon()" /></span
      ></span>
    </span>
    <div slListItemBody>
      <button type="button" class="title" slListItemLabel (click)="open.emit(notification())">
        {{ notification().title }}
      </button>
      <span slListItemDescription>
        {{ notification().body }} · {{ clock.relative(notification().createdAt) }}
      </span>
    </div>
  `,
})
export class NotificationRow {
  readonly notification = input.required<Notification>();
  readonly open = output<Notification>();
  readonly clock = inject(ClockService);
  readonly unread = computed(() => this.notification().readAt === undefined);
  readonly icon = computed(() => ICON[this.notification().type]);
  readonly tone = computed(() => TONE[this.notification().type]);
}
