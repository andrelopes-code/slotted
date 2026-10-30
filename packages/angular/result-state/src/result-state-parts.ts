import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  HostAttributeToken,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { SlResultState } from './result-state';
import type { ResultStateLive } from './result-state-defaults';

/**
 * The two roles that announce, and the value that does not. Both roles imply
 * `aria-live` and `aria-atomic`, so the whole message is read rather than the
 * word that changed, and nothing here writes either attribute by hand.
 */
const LIVE_ROLE: Record<ResultStateLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};

/**
 * The message itself, and the only part that announces.
 *
 * It is written explicitly rather than wrapped around the region's projected
 * content, because a box that guessed which of its children were text would be
 * guessing about the one thing a reader hears. None of the seven surveyed
 * implementations writes a live role of any kind, while WCAG 2.2's
 * Understanding document for SC 4.1.3 names "No results returned" as its own
 * example of a status message.
 */
@Directive({
  selector: '[slResultStateContent]',
  standalone: true,
  exportAs: 'slResultStateContent',
  host: {
    'data-part': 'content',
    'data-part-content': '',
    '[attr.role]': 'role()',
  },
})
export class SlResultStateContent {
  private readonly region = inject(SlResultState);

  protected readonly role = computed(() => LIVE_ROLE[this.region.resolvedLive()]);
}

/**
 * The message's name, and the box's.
 *
 * The element is the consumer's: a heading puts the region in the document
 * outline, which is right for a full-page 404 and wrong for the empty state of
 * one card in a grid of twelve, and only the page knows which. Writing
 * `<h2 slResultStateTitle>` is how a page that wants one says so, and Angular
 * needs no `render` prop to allow it.
 *
 * Atlassian's `headingLevel`, one to six, is the field's answer. A numeric
 * input invites a skipped level, which the guide's section 10 forbids.
 */
@Component({
  selector: '[slResultStateTitle]',
  standalone: true,
  exportAs: 'slResultStateTitle',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'title',
    'data-part-title': '',
    '[attr.id]': 'id',
  },
})
export class SlResultStateTitle {
  protected readonly region = inject(SlResultState);

  /**
   * The family's identifier, unless the page wrote one of its own — a skip
   * target, an anchor. Reading it before the host binding writes over it is
   * what keeps the consumer's attribute alive, and telling the box which
   * identifier won is what keeps `aria-labelledby` pointing at an element that
   * exists.
   */
  readonly id = inject(new HostAttributeToken('id'), { optional: true }) ?? this.region.titleId;

  constructor() {
    this.region.registerTitle(this.id);
  }

  ngOnDestroy() {
    this.region.registerTitle(null);
  }
}

/** The message. Written on the consumer's own `p`, which is what prose is. */
@Directive({
  selector: '[slResultStateDescription]',
  standalone: true,
  exportAs: 'slResultStateDescription',
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlResultStateDescription {}

/**
 * The controls that get the reader out of the situation, outside the region
 * that announces. What goes in is the consumer's own buttons, because `button`
 * already owns what a button is — including `loading`, which is what a retry in
 * flight is.
 */
@Directive({
  selector: '[slResultStateActions]',
  standalone: true,
  exportAs: 'slResultStateActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlResultStateActions {}

/**
 * The line under the actions: the documentation link that is not a call to
 * action. Polaris calls it `footerContent` and Atlassian a `tertiaryAction`,
 * and both are right that it is neither of the buttons above it.
 */
@Directive({
  selector: '[slResultStateFooter]',
  standalone: true,
  exportAs: 'slResultStateFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlResultStateFooter {}

/**
 * Artwork the page supplies instead of the status's own mark. It is projected
 * into the box the family draws, so it keeps the height the reach gives it —
 * which is what stops an illustration that has not loaded from moving the
 * title and the actions when it arrives.
 */
@Directive({
  selector: '[slResultStateMedia]',
  standalone: true,
  exportAs: 'slResultStateMedia',
})
export class SlResultStateMedia {}
