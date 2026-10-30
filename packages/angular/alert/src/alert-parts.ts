import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { BUTTON_DEFAULTS_TOKEN } from '@slotted/angular/button';
import type { ButtonDefaults } from '@slotted/angular/button';

import { SlAlert } from './alert';
import type { AlertLive } from './alert-defaults';

/**
 * The two roles that announce, and the value that does not. Both roles imply
 * `aria-live` and `aria-atomic`, so the whole message is read rather than the
 * word that changed, and nothing here writes either attribute by hand.
 */
const LIVE_ROLE: Record<AlertLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};

/**
 * The message itself, and the only part that announces.
 *
 * It is written explicitly rather than wrapped around the alert's projected
 * content, because a box that guessed which of its children were text would be
 * guessing about the one thing a reader hears. Fluent's `MessageBarBody` is the
 * only surveyed implementation with the same shape, and it is the only one
 * whose region excludes its own controls.
 */
@Directive({
  selector: '[slAlertContent]',
  standalone: true,
  exportAs: 'slAlertContent',
  host: {
    'data-part': 'content',
    'data-part-content': '',
    '[attr.role]': 'role()',
  },
})
export class SlAlertContent {
  private readonly alert = inject(SlAlert);

  protected readonly role = computed(() => LIVE_ROLE[this.alert.resolvedLive()]);
}

/**
 * The message's name, and the box's.
 *
 * The element is the consumer's: a heading puts the alert in the document
 * outline, which is right for a page banner and wrong for the alert beside a
 * field group, and only the page knows which. Writing `<h3 slAlertTitle>` is
 * how a page that wants one says so, and Angular needs no `render` prop to
 * allow it.
 */
@Component({
  selector: '[slAlertTitle]',
  standalone: true,
  exportAs: 'slAlertTitle',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'title',
    'data-part-title': '',
    '[attr.id]': 'alert.titleId',
  },
})
export class SlAlertTitle {
  protected readonly alert = inject(SlAlert);

  constructor() {
    this.alert.registerTitle(true);
  }

  ngOnDestroy() {
    this.alert.registerTitle(false);
  }
}

/** The message. Written on the consumer's own `p`, which is what prose is. */
@Directive({
  selector: '[slAlertDescription]',
  standalone: true,
  exportAs: 'slAlertDescription',
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlAlertDescription {}

/**
 * The buttons in the actions part take the alert's tone and the small size,
 * through `button`'s own defaults: a button that states an axis still wins,
 * and the variant stays the application's or the button's.
 */
function provideActionsPaint() {
  return {
    provide: BUTTON_DEFAULTS_TOKEN,
    useFactory: (): ButtonDefaults => {
      const alert = inject(SlAlert);
      const inherited = inject(BUTTON_DEFAULTS_TOKEN, { skipSelf: true });

      return {
        size: 'sm',
        get tone() {
          return alert.resolvedTone();
        },
        get variant() {
          return inherited.variant;
        },
      };
    },
  };
}

/**
 * The controls that act on the message, outside the region that announces: a
 * reader hearing the message is not read the labels of two buttons in the
 * middle of it. What goes in is the consumer's own buttons, because `button`
 * already owns what a button is.
 */
@Directive({
  selector: '[slAlertActions]',
  standalone: true,
  exportAs: 'slAlertActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
  providers: [provideActionsPaint()],
})
export class SlAlertActions {}

/* `SlAlertIcon` lives in `./alert`: the alert reads whether one was projected. */
export { SlAlertIcon } from './alert';
