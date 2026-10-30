import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { injectResultStateDefaults, SlResultStateIdFactory } from './result-state-defaults';
import type {
  ResultStateAlign,
  ResultStateIllustration,
  ResultStateLive,
  ResultStateReach,
  ResultStateStatus,
} from './result-state-defaults';

export type {
  ResultStateAlign,
  ResultStateIllustration,
  ResultStateLive,
  ResultStateReach,
  ResultStateStatus,
} from './result-state-defaults';

/**
 * The region that stands in for content that is not there, and says what to do
 * next.
 *
 * The directive is written on the consumer's own element, and the element it
 * belongs on is a `section`: named by its own title through `aria-labelledby`,
 * a `section` is a `region` landmark a reader can jump to, and unnamed it is a
 * plain grouping element that costs nothing. The APG's region landmark practice
 * states that "a region landmark must have a label", which is why the attribute
 * is written only once a title has said it exists.
 *
 * **The box is not the live region.** MDN's `alert` role reference states that
 * the role "should only be used for text content, not interactive elements such
 * as links or buttons", and this family has a row of buttons in it.
 * `slResultStateContent` is what announces, and it holds the title and the
 * description alone; the mark, the actions and the footer are its siblings.
 *
 * **It announces by default.** WCAG 2.2's Understanding document for SC 4.1.3
 * names this family's own text as its example of a status message. `alert`
 * defaults to silence because an alert may be a standing notice; a result is
 * always the outcome of an operation.
 */
@Component({
  selector: '[slResultState]',
  standalone: true,
  exportAs: 'slResultState',
  /* The picture box is always in the markup and empty until the page fills
     it: the stylesheet withdraws an empty box, so a region with no picture is
     a title, a description and an action with nothing standing above them
     (RS1). A stack of cards is the one drawing that stands without a glyph. */
  template: `<div aria-hidden="true" data-part="media" data-part-media="">
      <ng-content select="[slResultStateMedia]" />
    </div>
    <ng-content />`,
  styleUrl: '../../../styles/src/result-state/result-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'result-state',
    'data-ui-result-state': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-status]': 'resolvedStatus()',
    '[attr.data-reach]': 'resolvedReach()',
    '[attr.data-align]': 'resolvedAlign()',
    '[attr.data-illustration]': 'resolvedIllustration()',
    '[attr.data-live]': 'resolvedLive()',
    '[attr.tabindex]': 'writtenTabIndex ?? -1',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
})
export class SlResultState {
  /** Defaults to the provider, then to `empty`. */
  readonly status = input<ResultStateStatus | undefined>(undefined);
  /** Defaults to the provider, then to `section`. */
  readonly reach = input<ResultStateReach | undefined>(undefined);
  /** Defaults to the provider, then to `center`. */
  readonly align = input<ResultStateAlign | undefined>(undefined);
  /** Defaults to the provider, then to `polite`. */
  readonly live = input<ResultStateLive | undefined>(undefined);
  /**
   * The drawing made around the projected `slResultStateMedia`. Defaults to
   * the provider, then to `none`. `tile` and `stack` frame a glyph and draw
   * nothing without one; `cards` puts the glyph where a row's thumbnail would
   * be and draws its two lines with or without it.
   */
  readonly illustration = input<ResultStateIllustration | undefined>(undefined);
  private readonly defaults = injectResultStateDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** An explicit tab index the consumer wrote is never replaced by the family's. */
  protected readonly writtenTabIndex = inject(new HostAttributeToken('tabindex'), {
    optional: true,
  });

  /** The identifier the title writes, and the box is named by. */
  readonly titleId = `${inject(SlResultStateIdFactory).next()}-title`;

  /** The identifier the title actually carries, which is not always ours. */
  private readonly labelId = signal<string | null>(null);

  protected readonly resolvedStatus = computed(() => this.status() ?? this.defaults.status);
  protected readonly resolvedReach = computed(() => this.reach() ?? this.defaults.reach);
  protected readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  protected readonly resolvedIllustration = computed(
    () => this.illustration() ?? this.defaults.illustration,
  );
  readonly resolvedLive = computed(() => this.live() ?? this.defaults.live);

  /**
   * A `section` with an `aria-labelledby` pointing at nothing has no accessible
   * name and is not a landmark, so the attribute is written only once a title
   * has said it exists.
   */
  protected readonly labelledBy = computed(() => this.labelId());

  /**
   * Called by `slResultStateTitle`, which is the part that names the box. It
   * carries the identifier rather than a boolean, because a page that wrote its
   * own `id` on the title keeps it, and the box has to point at the one that is
   * actually in the DOM.
   */
  registerTitle(id: string | null) {
    this.labelId.set(id);
  }

  /**
   * Sends the keyboard to the message. The family never does this by itself:
   * moving focus unprompted is a change of context nobody asked for, and the
   * moment an application wants it — a filter has just emptied a table — is one
   * only the application knows.
   *
   * It is the reach a template has and React does not: JSX re-renders an input,
   * and an Angular template calls a method on the instance `exportAs` gives it.
   */
  focus() {
    this.host.nativeElement.focus();
  }
}
