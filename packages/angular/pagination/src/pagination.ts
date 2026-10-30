import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  paginationMessages,
  type PaginationMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { clampPage, itemRange, pageItems, totalPages } from '@slotted/core/pagination';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import {
  injectPaginationDefaults,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS,
  type PaginationLive,
  type PaginationPageReason,
  type PaginationPageSizeReason,
} from './pagination.constants';

/**
 * Moving between pages of a collection the consumer owns.
 *
 * **It never fetches and never slices.** The collection is the consumer's, and
 * a family that held a copy of it would hold a stale one. `count` and
 * `pageSize` are all the arithmetic needs, and `@slotted/core/pagination` does
 * that arithmetic once for both bindings.
 *
 * **It never invents a total.** A collection whose total the server does not
 * know states no `count`; the row of numbers is then not drawn at all, and the
 * two triggers plus a sentence are the whole paginator.
 *
 * **The page can move by itself, twice.** A collection that shrinks under a
 * reader leaves them past the end, and a change of page size moves the window
 * they are looking through. Both emit `programmatic`, so a consumer holding
 * the value follows rather than guessing.
 */
@Component({
  selector: 'nav[slPagination]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrls: ['../../../styles/src/pagination/pagination.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slPagination',
  host: {
    'data-ui': 'pagination',
    'data-ui-pagination': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-label]': 'accessibleLabel()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
  },
})
export class SlPagination {
  /**
   * Present means controlled, for the life of the component. Both values take
   * `undefined` as their unset state rather than a number, because a paginator
   * that read a default as the consumer's answer would never own its own page.
   */
  readonly pageValue = input(undefined, { alias: 'page', transform: optionalNumber });
  readonly defaultPage = input(1, { transform: numberAttribute });
  readonly pageSizeValue = input(undefined, { alias: 'pageSize', transform: optionalNumber });
  readonly defaultPageSize = input(undefined, { transform: optionalNumber });
  readonly count = input(undefined, { transform: optionalNumber });
  readonly siblingCount = input(undefined, { transform: optionalNumber });
  readonly boundaryCount = input(undefined, { transform: optionalNumber });
  readonly pageSizeOptions = input<readonly number[] | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name (`label`), the controls, and the sentences.
   */
  readonly messages = input<PartialMessages<PaginationMessages> | undefined>(undefined);
  readonly live = input<PaginationLive | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  /** Turns every page and every trigger into an anchor with a destination. */
  readonly itemHref = input<((page: number) => string) | undefined>(undefined);

  /**
   * Emitted before either value moves, carrying what it replaces, the reason
   * and the event. Neither is the second half of a two-way binding: one slot
   * can carry none of those.
   */
  readonly pageChange = output<ChangeRequest<number>>();
  readonly pageSizeChange = output<ChangeRequest<number>>();

  private readonly ownPage = signal<number | undefined>(undefined);
  private readonly ownSize = signal<number | undefined>(undefined);

  readonly page = computed(() => this.pageValue() ?? this.ownPage() ?? this.defaultPage());
  readonly pageSize = computed(
    () =>
      this.pageSizeValue() ??
      this.ownSize() ??
      this.defaultPageSize() ??
      this.defaults.defaultPageSize ??
      PAGINATION_DEFAULT_PAGE_SIZE,
  );

  private readonly defaults = injectPaginationDefaults();
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  /** The family's words in the language in force, with this paginator's `messages` laid over them. */
  readonly t = injectMessages(paginationMessages, this.messages);
  readonly accessibleLabel = computed(() => this.ownLabel ?? this.t('label'));
  readonly liveValue = computed(() => this.live() ?? this.defaults.live ?? 'polite');
  readonly sizeOptions = computed(
    () =>
      this.pageSizeOptions() ??
      this.defaults.pageSizeOptions ??
      PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS,
  );

  readonly pages = computed(() => {
    const count = this.count();
    return count === undefined
      ? Number.POSITIVE_INFINITY
      : totalPages({ count, pageSize: this.pageSize() });
  });
  readonly currentPage = computed(() => {
    const count = this.count();
    return count === undefined
      ? Math.max(1, Math.trunc(this.page()))
      : clampPage(this.page(), this.pages());
  });
  readonly items = computed(() => {
    const count = this.count();
    if (count === undefined) return [];
    return pageItems({
      boundaryCount: this.boundaryCount() ?? this.defaults.boundaryCount ?? 1,
      count,
      page: this.currentPage(),
      pageSize: this.pageSize(),
      siblingCount: this.siblingCount() ?? this.defaults.siblingCount ?? 1,
    });
  });
  readonly range = computed(() => {
    const count = this.count();
    return count === undefined
      ? { start: 0, end: 0 }
      : itemRange({ count, page: this.currentPage(), pageSize: this.pageSize() });
  });

  readonly inert = computed(() => this.disabled() || this.loading());
  readonly canGoPrevious = computed(() => !this.inert() && this.currentPage() > 1);
  readonly canGoNext = computed(
    () => !this.inert() && (this.count() === undefined || this.currentPage() < this.pages()),
  );

  constructor() {
    /**
     * The one move nobody asked for: the collection shrank under a reader who
     * was past its new end. It runs in an effect rather than in the computed
     * that noticed it, because a computed that emitted an event would emit one
     * every time anything read it.
     */
    effect(() => {
      const clamped = this.currentPage();
      if (untracked(() => this.page()) === clamped) return;
      this.move(clamped, 'programmatic');
    });
  }

  goToPage(next: number, reason: PaginationPageReason = 'pointer', source?: Event) {
    if (this.inert()) return;
    const count = this.count();
    const target =
      count === undefined ? Math.max(1, Math.trunc(next)) : clampPage(next, this.pages());
    this.move(target, reason, source);
  }

  reset(source?: Event) {
    this.goToPage(this.defaultPage(), 'programmatic', source);
  }

  next(reason: PaginationPageReason = 'pointer', source?: Event) {
    this.goToPage(this.currentPage() + 1, reason, source);
  }

  previous(reason: PaginationPageReason = 'pointer', source?: Event) {
    this.goToPage(this.currentPage() - 1, reason, source);
  }

  /**
   * Changing how many rows a page holds moves the reader, and where they land
   * is a decision. Clamping leaves someone on page seven at the end of the
   * collection; resetting to page one throws away where they were. Angular
   * Material takes the third answer and so does this: the first item of the
   * current page stays visible.
   */
  setPageSize(next: number, reason: PaginationPageSizeReason = 'select', source?: Event) {
    if (this.inert()) return;
    const size = Math.max(1, Math.trunc(next));
    const previous = this.pageSize();
    if (size === previous) return;

    const firstItem = (this.currentPage() - 1) * previous;
    const state = createControllable<number>({
      controlled: this.pageSizeValue(),
      initial: previous,
      onRequest: (request) => this.pageSizeChange.emit(request),
    });
    if (!state.request(size, reason, source)) return;
    this.ownSize.set(size);

    const count = this.count();
    if (count === undefined) return;
    const kept = clampPage(Math.floor(firstItem / size) + 1, totalPages({ count, pageSize: size }));
    if (kept !== this.currentPage()) this.move(kept, 'programmatic', source);
  }

  private move(next: number, reason: PaginationPageReason, source?: Event) {
    const previous = untracked(() => this.page());
    const state = createControllable<number>({
      controlled: untracked(() => this.pageValue()),
      initial: previous,
      onRequest: (request) => this.pageChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownPage.set(next);
  }
}

/**
 * A control that moves the page, on the consumer's own `button` or `a`.
 *
 * A button that cannot move takes the native `disabled`. An anchor cannot: it
 * has no such attribute, and one that kept its `href` would still navigate on
 * a middle click — so an unavailable link loses its destination and says
 * `aria-disabled`, the shape the `link` family already ships.
 */
@Directive()
abstract class SlPaginationTrigger {
  protected readonly pagination = inject(SlPagination);
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  abstract readonly part: 'first' | 'previous' | 'next' | 'last';
  protected abstract target(): number;
  protected abstract usable(): boolean;
  protected abstract defaultLabel(): string;

  /** A button says it cannot move with the native `disabled`; only an anchor needs `aria-disabled`. */
  readonly anchor = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'A';
  readonly accessibleLabel = computed(() => this.ownLabel ?? this.defaultLabel());
  readonly unavailable = computed(() => !this.usable());
  readonly href = computed(() =>
    this.unavailable() ? null : (this.pagination.itemHref()?.(this.target()) ?? null),
  );

  activate(event: Event) {
    if (this.unavailable()) return;
    this.pagination.goToPage(this.target(), 'pointer', event);
  }
}

/**
 * One chevron for a step and two for an end, drawn unless the consumer wrote
 * content of their own. Every one points along the reading direction and
 * mirrors with it; the stylesheet turns the two that point back.
 */
const STEP_TRIGGER_TEMPLATE = `<ng-content
  ><span slIcon directional><svg slGlyph name="chevron-right"></svg></span
></ng-content>`;
const END_TRIGGER_TEMPLATE = `<ng-content
  ><span slIcon directional><svg slGlyph name="chevrons-right"></svg></span
></ng-content>`;

const triggerHost = {
  '[attr.aria-label]': 'accessibleLabel()',
  '[attr.aria-disabled]': 'anchor && unavailable() ? "true" : null',
  '[attr.data-loading]': 'pagination.loading() ? "" : null',
  '[attr.href]': 'href()',
  '[disabled]': 'unavailable()',
  '(click)': 'activate($event)',
} as const;

@Component({
  selector: '[slPaginationFirst]',
  standalone: true,
  exportAs: 'slPaginationFirst',
  imports: [SlGlyph, SlIcon],
  template: END_TRIGGER_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    ...triggerHost,
    'data-part': 'first',
    'data-part-first': '',
    '[attr.data-disabled]': 'unavailable() && !pagination.loading() ? "" : null',
  },
})
export class SlPaginationFirst extends SlPaginationTrigger {
  override readonly part = 'first' as const;
  protected override target = () => 1;
  protected override usable = () => this.pagination.canGoPrevious();
  protected override defaultLabel = () => this.pagination.t('first');
}

@Component({
  selector: '[slPaginationPrevious]',
  standalone: true,
  exportAs: 'slPaginationPrevious',
  imports: [SlGlyph, SlIcon],
  template: STEP_TRIGGER_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    ...triggerHost,
    'data-part': 'previous',
    'data-part-previous': '',
    '[attr.data-disabled]': 'unavailable() && !pagination.loading() ? "" : null',
  },
})
export class SlPaginationPrevious extends SlPaginationTrigger {
  override readonly part = 'previous' as const;
  protected override target = () => this.pagination.currentPage() - 1;
  protected override usable = () => this.pagination.canGoPrevious();
  protected override defaultLabel = () => this.pagination.t('previous');
}

@Component({
  selector: '[slPaginationNext]',
  standalone: true,
  exportAs: 'slPaginationNext',
  imports: [SlGlyph, SlIcon],
  template: STEP_TRIGGER_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    ...triggerHost,
    'data-part': 'next',
    'data-part-next': '',
    '[attr.data-disabled]': 'unavailable() && !pagination.loading() ? "" : null',
  },
})
export class SlPaginationNext extends SlPaginationTrigger {
  override readonly part = 'next' as const;
  protected override target = () => this.pagination.currentPage() + 1;
  protected override usable = () => this.pagination.canGoNext();
  protected override defaultLabel = () => this.pagination.t('next');
}

@Component({
  selector: '[slPaginationLast]',
  standalone: true,
  exportAs: 'slPaginationLast',
  imports: [SlGlyph, SlIcon],
  template: END_TRIGGER_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    ...triggerHost,
    'data-part': 'last',
    'data-part-last': '',
    '[attr.data-disabled]': 'unavailable() && !pagination.loading() ? "" : null',
  },
})
export class SlPaginationLast extends SlPaginationTrigger {
  override readonly part = 'last' as const;
  protected override target = () => this.pagination.pages();
  protected override usable = () => this.pagination.canGoNext();
  protected override defaultLabel = () => this.pagination.t('last');
}

/**
 * The row of page numbers, and the sentence that replaces it below the
 * family's own breakpoint. Both are rendered and exactly one is displayed, so
 * neither is announced twice. A paginator over a collection whose total the
 * server does not know renders nothing here.
 */
@Component({
  selector: 'sl-pagination-items',
  standalone: true,
  template: `
    @if (pagination.count() !== undefined) {
      <ul data-part="list" data-part-list="">
        @for (item of pagination.items(); track item.type === 'page' ? item.value : item.side) {
          <li data-part="item" data-part-item="">
            @if (item.type === 'page') {
              @if (pagination.itemHref(); as href) {
                <a
                  [attr.aria-current]="item.value === pagination.currentPage() ? 'page' : null"
                  [attr.aria-disabled]="pagination.inert() ? 'true' : null"
                  [attr.aria-label]="pagination.t('page', { page: item.value })"
                  [attr.data-disabled]="pagination.disabled() ? '' : null"
                  [attr.data-loading]="pagination.loading() ? '' : null"
                  [attr.href]="pagination.inert() ? null : href(item.value)"
                  data-part="page"
                  data-part-page=""
                  (click)="pagination.goToPage(item.value, 'pointer', $event)"
                  >{{ item.value }}</a
                >
              } @else {
                <button
                  [attr.aria-current]="item.value === pagination.currentPage() ? 'page' : null"
                  [attr.aria-label]="pagination.t('page', { page: item.value })"
                  [attr.data-disabled]="pagination.disabled() ? '' : null"
                  [attr.data-loading]="pagination.loading() ? '' : null"
                  [disabled]="pagination.inert()"
                  data-part="page"
                  data-part-page=""
                  type="button"
                  (click)="pagination.goToPage(item.value, 'pointer', $event)"
                >
                  {{ item.value }}
                </button>
              }
            } @else {
              <span aria-hidden="true" data-part="ellipsis" data-part-ellipsis="">&#8230;</span>
            }
          </li>
        }
      </ul>
      <span data-part="summary" data-part-summary="">{{
        pagination.t('summary', { page: pagination.currentPage(), pages: pagination.pages() })
      }}</span>
    }
  `,
  styleUrls: ['../../../styles/src/pagination/pagination.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slPaginationItems',
  host: { style: 'display: contents' },
})
export class SlPaginationItems {
  readonly pagination = inject(SlPagination);
}

/**
 * "21–40 of 482", and the polite live region that announces a page change. One
 * region announcing one sentence is the whole of the announcement.
 */
@Component({
  selector: 'p[slPaginationStatus]',
  standalone: true,
  template: '<ng-content>{{ text() }}</ng-content>',
  styleUrls: ['../../../styles/src/pagination/pagination.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slPaginationStatus',
  host: {
    'data-part': 'status',
    'data-part-status': '',
    '[attr.aria-live]': 'pagination.liveValue()',
  },
})
export class SlPaginationStatus {
  readonly pagination = inject(SlPagination);
  readonly text = computed(() => {
    const range = this.pagination.range();
    return this.pagination.t('range', {
      start: range.start,
      end: range.end,
      count: this.pagination.count() ?? 0,
    });
  });
}

/**
 * How many items a page holds.
 *
 * A native `select`, wrapped by its own label. `select` in a later wave owns
 * the styled listbox; a paginator that could not change its page size until
 * then is not one a table can use. Wrapping rather than pointing gives the
 * control its accessible name from the platform, with no generated id.
 */
@Component({
  selector: 'sl-pagination-page-size',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `
    <label data-part="page-size-label" data-part-page-size-label="">
      <ng-content>{{ pagination.t('pageSize') }}</ng-content>
      <select
        [disabled]="pagination.inert()"
        [value]="pagination.pageSize()"
        data-part="page-size"
        data-part-page-size=""
        (change)="onChange($event)"
      >
        @for (size of pagination.sizeOptions(); track size) {
          <option [value]="size">{{ size }}</option>
        }
      </select>
      <span slIcon><svg slGlyph name="chevron-down"></svg></span>
    </label>
  `,
  styleUrls: ['../../../styles/src/pagination/pagination.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slPaginationPageSize',
  host: { style: 'display: contents' },
})
export class SlPaginationPageSize {
  readonly pagination = inject(SlPagination);

  onChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pagination.setPageSize(value, 'select', event);
  }
}

/**
 * Absence has to survive the transform: `numberAttribute` maps an unset input
 * to `NaN`, and a paginator that read that would invent a total the server
 * never gave it.
 */
function optionalNumber(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
