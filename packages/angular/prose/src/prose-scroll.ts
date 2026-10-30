import { createScrollAffordance } from '@slotted/core/overflow';
import type { ScrollAffordanceHandle } from '@slotted/core/overflow';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { proseMessages, type PartialMessages, type ProseMessages } from '@slotted/core/i18n';

/**
 * A wide block — a table, a fence — that scrolls sideways instead of pushing
 * the page over. The axe rule `scrollable-region-focusable` makes that a WCAG
 * 2.2 level A failure unless a keyboard can reach it, and anything that takes
 * focus then needs a name and a role or it fails SC 4.1.2. Adrian Roselli's
 * pattern is `<div role="region" aria-labelledby tabindex="0">`.
 *
 * None of the four surveyed implementations of this family ships it: Typeset's
 * `typeset-scroll` is a `div` with `overflow: auto`, and GitHub's table
 * wrapper is the same.
 *
 * The wiring is written **only while the block actually overflows**, measured
 * by `@slotted/core/overflow` — the module `slTabs` already uses. A tab stop
 * on a block that fits is a tab stop that does nothing, and a reader tabbing a
 * documentation page would hit one per table.
 *
 * `refresh()` is reachable through `exportAs`, for content that arrives after
 * the observer's last measurement:
 *
 * ```html
 * <div slProseScroll #wide="slProseScroll"><table>…</table></div>
 * <button type="button" (click)="wide.refresh()">Reloaded</button>
 * ```
 */
@Directive({
  selector: '[slProseScroll]',
  standalone: true,
  exportAs: 'slProseScroll',
  host: {
    'data-part': 'scroll',
    'data-part-scroll': '',
    '[attr.role]': 'resolvedRole()',
    '[attr.tabindex]': 'resolvedTabIndex()',
    '[attr.aria-label]': 'resolvedLabel()',
    '[attr.aria-labelledby]': 'resolvedLabelledBy()',
  },
})
export class SlProseScroll {
  /**
   * Words laid over the catalog of the language in force: the last resort name
   * of the region (`scroll`). A static `aria-label` still wins.
   */
  readonly messages = input<PartialMessages<ProseMessages> | undefined>(undefined);
  /** Names it from an element already on the page — a table's own caption. */
  readonly labelledBy = input<string>();

  private readonly host = inject(ElementRef<HTMLElement>);
  /** The family's words in the language in force, with this block's `messages` laid over them. */
  readonly t = injectMessages(proseMessages, this.messages);
  private readonly overflowing = signal(false);
  private affordance: ScrollAffordanceHandle | null = null;

  /**
   * A consumer who wrote its own `role` or `aria-label` on the element keeps
   * them: the attribute is read once, before anything is bound over it.
   */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly resolvedRole = computed(() => {
    if (this.writtenRole !== null) return this.writtenRole;
    return this.overflowing() ? 'region' : null;
  });

  protected readonly resolvedTabIndex = computed(() => (this.overflowing() ? '0' : null));

  protected readonly resolvedLabelledBy = computed(() => {
    if (!this.overflowing()) return null;
    return this.labelledBy() ?? null;
  });

  protected readonly resolvedLabel = computed(() => {
    if (!this.overflowing() || this.labelledBy() !== undefined) return null;
    if (this.writtenLabel !== null) return this.writtenLabel;
    return this.t('scroll');
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    /**
     * The measurement runs after the first render and never during it, so the
     * server renders a plain scroller and hydration finds the same DOM. It is
     * also the first moment a browser can say whether the block overflows.
     */
    afterNextRender(() => {
      const handle = createScrollAffordance(this.host.nativeElement, {
        onChange: (state) => this.overflowing.set(state.overflowing),
      });
      this.affordance = handle;
      this.overflowing.set(handle.state().overflowing);

      destroyRef.onDestroy(() => {
        handle.destroy();
        this.affordance = null;
      });
    });
  }

  /** Measures the block again and rewrites the wiring if the answer changed. */
  refresh(): void {
    this.affordance?.refresh();
  }

  /** Whether the block is scrollable as of the last measurement. */
  isOverflowing(): boolean {
    return this.overflowing();
  }
}
