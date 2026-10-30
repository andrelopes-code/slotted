import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  type PartialMessages,
  statusIndicatorMessages,
  type StatusIndicatorMessages,
} from '@slotted/core/i18n';

import { injectStatusIndicatorDefaults } from './status-indicator-defaults';
import {
  STATUS_INDICATOR_DEFAULT_LIVE,
  STATUS_INDICATOR_DEFAULT_MARK,
  STATUS_INDICATOR_DEFAULT_SIZE,
  STATUS_INDICATOR_DEFAULT_STATUS,
  STATUS_INDICATOR_GLYPHS,
  STATUS_INDICATOR_ROLE,
  type StatusIndicatorLive,
  type StatusIndicatorMark,
  type StatusIndicatorSize,
  type StatusIndicatorStatus,
} from './status-indicator.constants';

/**
 * The operational state of something the application observes.
 *
 * The family reports; it never moves the value. That is why there is no
 * `model()` here and no output — `status` is the application's fact about a
 * system this component cannot see, the same relationship a progress range has
 * to the work it reports.
 *
 * It is always named. Given projected content, that content is the name; given
 * none, the status's own word is rendered and clipped from view. The fallback
 * belongs to `<ng-content>` rather than to a flag the component has to compute,
 * which is Angular's own answer to the question React answers with
 * `children === undefined`: the template knows whether anything was projected,
 * so nothing has to inspect the DOM to find out.
 *
 * The selector is a bare attribute, so the element stays the consumer's: a
 * status belongs in whatever a table cell, a list item or a heading already
 * is, and wrapping it in a second element would change their layout to carry
 * an attribute.
 */
/**
 * A second, quieter line under the words — “62% · build”, “4 minutes ago” —
 * hanging under the first word. It is projected into the label, so it is read
 * with the words and belongs to their accessible name.
 */
@Directive({
  selector: '[slStatusIndicatorDetail]',
  standalone: true,
  host: { 'data-part': 'detail', 'data-part-detail': '' },
})
export class SlStatusIndicatorDetail {}

@Component({
  selector: '[slStatusIndicator]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  /* The icon mark's glyph follows the status; the sheet sizes and colors it. */
  template: `<span aria-hidden="true" data-part="mark" data-part-mark="">
      @if (markValue() === 'icon') {
        <span slIcon><svg slGlyph [name]="glyph()"></svg></span>
      }</span
    ><span data-part="label" data-part-label=""
      ><ng-content
        ><span
          data-part="announcement"
          data-part-announcement=""
          data-ui="visually-hidden"
          data-ui-visually-hidden=""
          >{{ name() }}</span
        ></ng-content
      ><ng-content select="[slStatusIndicatorDetail]"
    /></span>`,
  styleUrls: [
    '../../../styles/src/status-indicator/status-indicator.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatusIndicator',
  host: {
    'data-ui': 'status-indicator',
    'data-ui-status-indicator': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-status]': 'status()',
    '[attr.data-mark]': 'markValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-pulse]': 'pulse() ? "" : null',
    '[attr.role]': 'roleValue()',
  },
})
export class SlStatusIndicator {
  readonly status = input<StatusIndicatorStatus>(STATUS_INDICATOR_DEFAULT_STATUS);
  readonly mark = input<StatusIndicatorMark | undefined>(undefined);
  readonly size = input<StatusIndicatorSize | undefined>(undefined);
  readonly live = input<StatusIndicatorLive | undefined>(undefined);
  /**
   * A wave leaving the dot, for a change happening now. An icon mark does not
   * pulse, and the wave is withdrawn under reduced motion and under forced
   * colors, so nothing is ever said by the wave alone.
   */
  readonly pulse = input(false, { transform: booleanAttribute });
  /**
   * What a reader hears when nothing was projected. Ignored when something
   * was, because naming an element twice is how a screen reader comes to read
   * “Success Healthy”. Falls back to the status's word in the catalog.
   */
  readonly label = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * word each status is heard as when nothing was projected.
   */
  readonly messages = input<PartialMessages<StatusIndicatorMessages> | undefined>(undefined);

  private readonly defaults = injectStatusIndicatorDefaults();
  /** The family's words in the language in force, with this indicator's `messages` laid over them. */
  readonly t = injectMessages(statusIndicatorMessages, this.messages);
  /**
   * Read once, before the host binding writes one. A consumer who put
   * `role="note"` on their own element keeps it, which is the rule
   * `frameworks.md` states for every static attribute a family writes over.
   */
  private readonly ownRole = inject(new HostAttributeToken('role'), { optional: true });

  readonly markValue = computed(
    () => this.mark() ?? this.defaults.mark ?? STATUS_INDICATOR_DEFAULT_MARK,
  );
  readonly sizeValue = computed(
    () => this.size() ?? this.defaults.size ?? STATUS_INDICATOR_DEFAULT_SIZE,
  );
  readonly liveValue = computed(
    () => this.live() ?? this.defaults.live ?? STATUS_INDICATOR_DEFAULT_LIVE,
  );

  readonly glyph = computed(() => STATUS_INDICATOR_GLYPHS[this.status()]);

  readonly roleValue = computed(() => this.ownRole ?? STATUS_INDICATOR_ROLE[this.liveValue()]);

  readonly name = computed(() => this.label() ?? this.t(this.status()));
}
