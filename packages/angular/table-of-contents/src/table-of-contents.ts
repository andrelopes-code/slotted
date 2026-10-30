import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import {
  tableOfContentsMessages,
  type PartialMessages,
  type TableOfContentsMessages,
} from '@slotted/core/i18n';
import { collectOutline } from '@slotted/core/outline';
import type { OutlineEntry } from '@slotted/core/outline';
import {
  createScrollSpy,
  focusTarget,
  landOn,
  prefersReducedMotion,
  readStickyTop,
  resolveScroller,
} from '@slotted/core/scroll-spy';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { SlSkeleton } from '@slotted/angular/skeleton';

import {
  injectTableOfContentsDefaults,
  SlTableOfContentsIdFactory,
} from './table-of-contents-defaults';
import type {
  TableOfContentsHistory,
  TableOfContentsItemData,
  TableOfContentsLayout,
  TableOfContentsOpenReason,
  TableOfContentsSize,
  TableOfContentsValueReason,
} from './table-of-contents-defaults';

export type {
  TableOfContentsDefaults,
  TableOfContentsHistory,
  TableOfContentsItemData,
  TableOfContentsLayout,
  TableOfContentsOpenReason,
  TableOfContentsSize,
  TableOfContentsValueReason,
} from './table-of-contents-defaults';

/**
 * The tolerance under the reading line: a target whose top is within it is
 * taken as reached, so a heading landed on by a press — sitting exactly at
 * the line, give or take a subpixel — is the one marked. Ant's `bounds`.
 */
export const TABLE_OF_CONTENTS_BOUNDS = 4;

/** The skeleton rows the list draws while loading, by width. */
const SKELETON_ROWS = ['72%', '56%', '80%', '48%'];

/** What the link template is handed: the entry, and whether it is current. */
export interface TableOfContentsLinkContext {
  $implicit: TableOfContentsItemData;
  current: boolean;
}

/**
 * The content of every link, as a template: `<ng-template slTableOfContentsLink let-entry>`.
 * Without one the link shows the entry's label.
 */
@Directive({ selector: 'ng-template[slTableOfContentsLink]', standalone: true })
export class SlTableOfContentsLink {
  readonly template = inject<TemplateRef<TableOfContentsLinkContext>>(TemplateRef);
  /* Types the template's context, so `let-entry` is an entry in the template. */
  static ngTemplateContextGuard(
    _directive: SlTableOfContentsLink,
    context: unknown,
  ): context is TableOfContentsLinkContext {
    return context !== null;
  }
}

/** The list's title, as a template: `<ng-template slTableOfContentsLabel>`. */
@Directive({ selector: 'ng-template[slTableOfContentsLabel]', standalone: true })
export class SlTableOfContentsLabel {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

function fromOutline(entries: readonly OutlineEntry[]): TableOfContentsItemData[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    children: fromOutline(entry.children),
  }));
}

function flatten(items: readonly TableOfContentsItemData[]): TableOfContentsItemData[] {
  const out: TableOfContentsItemData[] = [];
  const walk = (list: readonly TableOfContentsItemData[]) => {
    for (const item of list) {
      out.push(item);
      if (item.children !== undefined) walk(item.children);
    }
  };
  walk(items);
  return out;
}

function element(
  value: ElementRef<HTMLElement> | HTMLElement | null | undefined,
): HTMLElement | null | undefined {
  if (value === undefined || value === null) return value;
  return value instanceof ElementRef ? value.nativeElement : value;
}

/** A click the platform should keep: a modifier for a new tab, or a button other than the main one. */
function platformClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * A list of links into the document the reader is in, with the link of the
 * place in view marked.
 *
 * The directive goes on the consumer's own element — `<nav slTableOfContents>`
 * standing alone, `<div slTableOfContents>` inside a landmark that already has
 * a name. `landmark` decides whether the name is written; the element is the
 * consumer's, as it is everywhere in this ecosystem.
 *
 * **Two ways in, one list.** `items` as data, or `source` — a region whose
 * headings are read after the view is built by `@slotted/core/outline` and
 * read again when the region's subtree changes. A template Angular would not
 * write a nested list by hand, so there are no parts to compose; a
 * `slTableOfContentsLink` template shapes every link instead.
 *
 * **Two values, two models.** `value` is the current target and `open` is
 * whether the collapsed list is shown. The spy asks `value` to move with the
 * reason `scroll`; a press asks with `pointer` or `keyboard` before it
 * scrolls, and the scroll happens whether or not the request is accepted.
 */
@Component({
  selector: '[slTableOfContents]',
  standalone: true,
  exportAs: 'slTableOfContents',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlSkeleton],
  template: `
    @if (collapsed()) {
      <button
        #trigger
        data-part="trigger"
        data-part-trigger=""
        type="button"
        [attr.aria-controls]="panelId"
        [attr.aria-expanded]="open()"
        (click)="toggle($event)"
      >
        <span data-part="label" data-part-label="" [id]="labelId">
          @if (labelTemplate(); as label) {
            <ng-container *ngTemplateOutlet="label.template" />
          } @else {
            {{ resolvedLabel() }}
          }
        </span>
        <span data-part="current" data-part-current="">{{ currentLabel() }}</span>
        <span data-part="indicator" data-part-indicator="" aria-hidden="true"
          ><span slIcon><svg slGlyph name="chevron-down"></svg></span
        ></span>
      </button>
    } @else if (hasLabel()) {
      <div data-part="label" data-part-label="" [id]="labelId">
        @if (labelTemplate(); as label) {
          <ng-container *ngTemplateOutlet="label.template" />
        } @else {
          {{ label() }}
        }
      </div>
    }
    <div #panel data-part="panel" data-part-panel="" [id]="panelId">
      <div #marker data-part="marker" data-part-marker="" aria-hidden="true"></div>
      <ol data-part="list" data-part-list="">
        @if (loading()) {
          @for (width of skeletonRows; track width) {
            <li data-part="skeleton" data-part-skeleton="" aria-hidden="true">
              <span slSkeleton shape="text" [inlineSize]="width"></span>
            </li>
          }
        } @else {
          <ng-container
            *ngTemplateOutlet="entriesTemplate; context: { $implicit: entries(), depth: 1 }"
          />
        }
      </ol>
    </div>

    <ng-template #entriesTemplate let-list let-depth="depth">
      @for (entry of list; track entry.id) {
        <li
          data-part="item"
          data-part-item=""
          [attr.data-depth]="depth"
          [attr.data-value]="entry.id"
          [attr.data-current]="value() === entry.id ? '' : null"
        >
          <a
            data-part="link"
            data-part-link=""
            [attr.href]="'#' + entry.id"
            [attr.aria-current]="value() === entry.id ? 'location' : null"
            [attr.data-current]="value() === entry.id ? '' : null"
            (click)="onLinkClick($event, entry.id)"
          >
            @if (linkTemplate(); as link) {
              <ng-container
                *ngTemplateOutlet="
                  link.template;
                  context: { $implicit: entry, current: value() === entry.id }
                "
              />
            } @else {
              {{ entry.label }}
            }
          </a>
          @if (entry.children?.length) {
            <ol data-part="group" data-part-group="">
              <ng-container
                *ngTemplateOutlet="
                  entriesTemplate;
                  context: { $implicit: entry.children, depth: depth + 1 }
                "
              />
            </ol>
          }
        </li>
      }
    </ng-template>
  `,
  styleUrl: '../../../styles/src/table-of-contents/table-of-contents.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'table-of-contents',
    'data-ui-table-of-contents': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-busy]': "loading() ? 'true' : null",
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-sticky]': "resolvedSticky() && !collapsed() ? '' : null",
    '[attr.data-numbered]': "resolvedNumbered() ? '' : null",
    '[attr.data-open]': "collapsed() && open() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-empty]': "empty() ? '' : null",
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlTableOfContents {
  /** The current target's id, without the hash. Two-way, so a template may bind it directly. */
  readonly value = model<string | null>(null);
  /** Whether the collapsed list is shown. */
  readonly open = model<boolean>(false);

  /** The list as data. */
  readonly items = input<readonly TableOfContentsItemData[] | undefined>(undefined);
  /** The region whose headings make the list, read after the view is built. */
  readonly source = input<ElementRef<HTMLElement> | HTMLElement | null | undefined>(undefined);
  /** The lowest and highest heading level `source` keeps. */
  readonly levels = input<readonly [number, number] | undefined>(undefined);
  /** A heading matching this selector, or inside one, is left out of `source`. */
  readonly exclude = input<string | undefined>(undefined);
  /** The element that scrolls. Derived from the first target when unset. */
  readonly scroller = input<ElementRef<HTMLElement> | HTMLElement | null | undefined>(undefined);
  /** What to add under the page's chrome, in CSS pixels. */
  readonly offset = input<number | undefined, number | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : numberAttribute(state)),
  });
  readonly layout = input<TableOfContentsLayout | undefined>(undefined);
  readonly size = input<TableOfContentsSize | undefined>(undefined);
  readonly history = input<TableOfContentsHistory | undefined>(undefined);
  readonly sticky = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly numbered = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** Whether the host is the navigation landmark and takes its name. */
  readonly landmark = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** The list's title, as text. A `slTableOfContentsLabel` template wins over it. */
  readonly label = input<string | undefined>(undefined);
  /** Rows of skeleton in the list's place. */
  readonly loading = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force: the landmark's name
   * when no label is given, and the collapsed trigger's fixed text
   * (`navigation`). A static `aria-label` still wins.
   */
  readonly messages = input<PartialMessages<TableOfContentsMessages> | undefined>(undefined);

  /** One output for one transition, carrying the reason and the event. */
  readonly valueChangeRequest = output<ChangeRequest<string | null>>();
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  private readonly defaults = injectTableOfContentsDefaults();
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  private readonly ids = inject(SlTableOfContentsIdFactory).next();
  readonly panelId = `${this.ids}-panel`;
  readonly labelId = `${this.ids}-label`;
  readonly skeletonRows = SKELETON_ROWS;

  readonly linkTemplate = contentChild(SlTableOfContentsLink);
  readonly labelTemplate = contentChild(SlTableOfContentsLabel);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly marker = viewChild.required<ElementRef<HTMLElement>>('marker');
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly resolvedLayout = computed(() => this.layout() ?? this.defaults.layout);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedHistory = computed(() => this.history() ?? this.defaults.history);
  readonly resolvedSticky = computed(() => this.sticky() ?? this.defaults.sticky);
  readonly resolvedNumbered = computed(() => this.numbered() ?? this.defaults.numbered);
  readonly resolvedLandmark = computed(() => this.landmark() ?? this.defaults.landmark);
  readonly resolvedLevels = computed(() => this.levels() ?? this.defaults.levels);
  readonly resolvedOffset = computed(() => this.offset() ?? this.defaults.offset);
  /** The family's words in the language in force, with this list's `messages` laid over them. */
  readonly t = injectMessages(tableOfContentsMessages, this.messages);
  readonly collapsed = computed(() => this.resolvedLayout() === 'collapsed');

  /** The headings of `source`, as the list reads them. */
  private readonly outline = signal<OutlineEntry[]>([]);
  /** The list, whichever way it came. */
  readonly entries = computed<readonly TableOfContentsItemData[]>(
    () => this.items() ?? fromOutline(this.outline()),
  );
  readonly flat = computed(() => flatten(this.entries()));
  readonly empty = computed(() => !this.loading() && this.flat().length === 0);

  readonly hasLabel = computed(
    () => this.labelTemplate() !== undefined || this.label() !== undefined,
  );
  readonly resolvedLabel = computed(() => this.label() ?? this.t('navigation'));
  readonly currentLabel = computed(() => {
    const current = this.value();
    return current === null ? '' : (this.flat().find((entry) => entry.id === current)?.label ?? '');
  });

  protected readonly ariaLabelledBy = computed(() =>
    this.resolvedLandmark() && this.writtenLabel === null && this.hasLabel()
      ? (this.writtenLabelledBy ?? this.labelId)
      : this.writtenLabelledBy,
  );
  protected readonly ariaLabel = computed(() =>
    this.resolvedLandmark() && this.writtenLabelledBy === null && !this.hasLabel()
      ? (this.writtenLabel ?? this.t('navigation'))
      : this.writtenLabel,
  );

  private pendingFocus = false;

  constructor() {
    /* The headings of `source`, read when it is set and again when its subtree changes. */
    effect((onCleanup) => {
      const region = element(this.source());
      const levels = this.resolvedLevels();
      const exclude = this.exclude();
      if (region === null || region === undefined) return;
      const read = () =>
        this.outline.set(
          collectOutline(region, { levels, ...(exclude !== undefined ? { exclude } : {}) }),
        );
      read();
      if (typeof MutationObserver === 'undefined') return;
      const observer = new MutationObserver(read);
      observer.observe(region, { childList: true, subtree: true, characterData: true });
      onCleanup(() => observer.disconnect());
    });

    /* The spy, rebuilt when the targets, the scroller or the offset change. */
    afterRenderEffect((onCleanup) => {
      const ids = this.flat().map((entry) => entry.id);
      const scrollerInput = this.scroller();
      const offset = this.resolvedOffset();
      if (ids.length === 0) return;
      const doc = this.host.ownerDocument;
      const targets = () =>
        ids
          .map((id) => doc.getElementById(id))
          .filter((node): node is HTMLElement => node !== null)
          .sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
          );
      const explicit = element(scrollerInput);
      const scroller = explicit === undefined ? resolveScroller(targets()) : explicit;
      const handle = createScrollSpy({
        targets,
        scroller,
        line: () => readStickyTop(scroller, doc) + offset + TABLE_OF_CONTENTS_BOUNDS,
        onChange: (next) => this.requestValue(next, 'scroll'),
        own: this.host,
      });
      this.spy = handle;

      /* A deep link the browser jumped to on load landed under the chrome: land it again, instantly. */
      const hash = doc.defaultView?.location.hash.slice(1) ?? '';
      if (hash !== '' && ids.includes(hash)) {
        const target = doc.getElementById(hash);
        if (target !== null) {
          landOn(target, {
            scroller,
            chrome: readStickyTop(scroller, doc),
            offset,
            behavior: 'instant',
          });
        }
      }
      onCleanup(() => {
        handle.destroy();
        this.spy = null;
      });
    });

    /* The marker, measured against the panel from the current link's box. */
    afterRenderEffect((onCleanup) => {
      this.value();
      this.entries();
      this.open();
      const layout = this.resolvedLayout();
      const panel = this.panel().nativeElement;
      const marker = this.marker().nativeElement;
      const measure = () => this.measureMarker(panel, marker, layout);
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(panel);
      let live = true;
      void panel.ownerDocument.fonts?.ready.then(() => {
        if (live) measure();
      });
      onCleanup(() => {
        live = false;
        observer.disconnect();
      });
    });

    /* The bar says which edge it continues past, for the stylesheet's fade. */
    afterRenderEffect((onCleanup) => {
      this.entries();
      if (this.resolvedLayout() !== 'horizontal') return;
      const panel = this.panel().nativeElement;
      const measure = () => {
        const overflow = panel.scrollWidth - panel.clientWidth;
        if (overflow <= 1) {
          panel.removeAttribute('data-overflow');
          return;
        }
        const scrolled = Math.abs(panel.scrollLeft);
        const atStart = scrolled <= 1;
        const atEnd = scrolled >= overflow - 1;
        panel.setAttribute('data-overflow', atStart ? 'end' : atEnd ? 'start' : 'both');
      };
      measure();
      panel.addEventListener('scroll', measure, { passive: true });
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
      observer?.observe(panel);
      onCleanup(() => {
        panel.removeEventListener('scroll', measure);
        observer?.disconnect();
      });
    });

    /* The collapsed list is a dismissable layer while it is shown, with the trigger as a branch. */
    afterRenderEffect((onCleanup) => {
      if (!this.collapsed() || !this.open()) return;
      const panel = this.panel().nativeElement;
      const trigger = this.trigger()?.nativeElement ?? null;
      const layer = createDismissableLayer(panel, {
        branches: trigger === null ? [] : [trigger],
        onDismiss: (request) => {
          if (request.reason !== 'escape' && request.reason !== 'outsidePress') return;
          this.requestOpen(false, request.reason, request.source);
          if (request.reason === 'escape') trigger?.focus();
        },
      });
      onCleanup(() => layer.destroy());
    });

    /* ArrowDown on the trigger opened the list: the first link takes focus once it is drawn. */
    afterRenderEffect(() => {
      if (!this.open() || !this.pendingFocus) return;
      this.pendingFocus = false;
      untracked(() => this.links()[0]?.focus());
    });

    this.destroyRef.onDestroy(() => this.spy?.destroy());
  }

  private spy: ReturnType<typeof createScrollSpy> | null = null;

  private requestValue(next: string | null, reason: TableOfContentsValueReason, source?: Event) {
    const state = createControllable<string | null>({
      initial: this.value(),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.value.set(next);
  }

  private requestOpen(next: boolean, reason: TableOfContentsOpenReason, source?: Event) {
    const state = createControllable<boolean>({
      initial: this.open(),
      onRequest: (request) => this.openChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.open.set(next);
  }

  private measureMarker(panel: HTMLElement, marker: HTMLElement, layout: TableOfContentsLayout) {
    const link = panel.querySelector<HTMLElement>('[data-part="link"][data-current]');
    if (link === null) {
      marker.style.removeProperty('--_marker-start');
      marker.style.removeProperty('--_marker-size');
      return;
    }
    const panelRect = panel.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const rtl = getComputedStyle(panel).direction === 'rtl';
    if (layout === 'horizontal') {
      const start = rtl
        ? panelRect.right - linkRect.right - panel.scrollLeft
        : linkRect.left - panelRect.left + panel.scrollLeft;
      marker.style.setProperty('--_marker-start', `${start}px`);
      marker.style.setProperty('--_marker-size', `${linkRect.width}px`);
      /* The current link is kept in view without moving the page: the panel alone scrolls. */
      const from = rtl ? panelRect.right - linkRect.right : linkRect.left - panelRect.left;
      const room = panelRect.width;
      if (from < 0 || from + linkRect.width > room) {
        const delta = from < 0 ? from : from + linkRect.width - room;
        panel.scrollBy({ left: rtl ? -delta : delta, behavior: 'smooth' });
      }
      return;
    }
    const start = linkRect.top - panelRect.top + panel.scrollTop;
    marker.style.setProperty('--_marker-start', `${start}px`);
    marker.style.setProperty('--_marker-size', `${linkRect.height}px`);
    const from = linkRect.top - panelRect.top;
    if (panel.scrollHeight > panel.clientHeight) {
      if (from < 0) panel.scrollBy({ top: from, behavior: 'smooth' });
      else if (from + linkRect.height > panelRect.height) {
        panel.scrollBy({ top: from + linkRect.height - panelRect.height, behavior: 'smooth' });
      }
    }
  }

  /** The links the keyboard walks: every link while the list is shown, none while it is folded. */
  links(): HTMLElement[] {
    if (this.collapsed() && !this.open()) return [];
    return [...this.panel().nativeElement.querySelectorAll<HTMLElement>('[data-part="link"]')];
  }

  /**
   * A press asks `value`, then the list scrolls the target under the chrome,
   * writes the URL and focuses the target. Cmd-click, Ctrl-click and the
   * middle button are the platform's: they open the fragment in a new tab.
   */
  protected onLinkClick(event: MouseEvent, id: string) {
    if (event.defaultPrevented || platformClick(event)) return;
    event.preventDefault();
    this.navigate(id, event.detail === 0 ? 'keyboard' : 'pointer', event);
  }

  private navigate(id: string, reason: 'pointer' | 'keyboard' | 'programmatic', source?: Event) {
    const doc = this.host.ownerDocument;
    const view = doc.defaultView;
    const target = doc.getElementById(id);
    this.requestValue(id, reason, source);
    if (target === null || view === null) return;
    /* The choice holds against the end-of-scroller rule until the reader scrolls by a gesture. */
    this.spy?.pin(id);
    const scroller = this.spy?.scroller() ?? element(this.scroller()) ?? null;
    landOn(target, {
      scroller,
      chrome: readStickyTop(scroller, doc),
      offset: this.resolvedOffset(),
      behavior: prefersReducedMotion(view) ? 'instant' : 'smooth',
    });
    const history = this.resolvedHistory();
    if (reason !== 'programmatic' && history !== 'none') {
      const url = `#${id}`;
      if (history === 'push') view.history.pushState(null, '', url);
      else view.history.replaceState(null, '', url);
    }
    focusTarget(target);
    if (this.collapsed() && this.open()) this.requestOpen(false, 'select', source);
  }

  protected toggle(event: MouseEvent) {
    this.requestOpen(!this.open(), event.detail === 0 ? 'keyboard' : 'pointer', event);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;

    if (target === this.trigger()?.nativeElement) {
      if (event.key === 'ArrowDown' && !this.open()) {
        event.preventDefault();
        this.pendingFocus = true;
        this.requestOpen(true, 'keyboard', event);
      }
      return;
    }
    if (!target.matches('[data-part="link"]')) return;

    const horizontal = this.resolvedLayout() === 'horizontal';
    const forward = horizontal ? 'ArrowRight' : 'ArrowDown';
    const backward = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const step =
      event.key === forward || event.key === 'ArrowDown'
        ? 1
        : event.key === backward || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return;

    const all = this.links();
    if (all.length === 0) return;
    event.preventDefault();
    const index = all.indexOf(target);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? all.length - 1
          : Math.min(all.length - 1, Math.max(0, index + step));
    all[next]?.focus();
  }

  /** Focuses the first link, or the trigger in the collapsed layout. */
  focus() {
    if (this.collapsed()) this.trigger()?.nativeElement.focus();
    else this.links()[0]?.focus();
  }

  /** Reads the headings again and measures again. */
  refresh() {
    const region = element(this.source());
    if (region !== null && region !== undefined) {
      const exclude = this.exclude();
      this.outline.set(
        collectOutline(region, {
          levels: this.resolvedLevels(),
          ...(exclude !== undefined ? { exclude } : {}),
        }),
      );
    }
    this.spy?.refresh();
  }

  /** Scrolls to a target and asks `value` to move with the reason `programmatic`; the URL is left. */
  scrollTo(id: string) {
    this.navigate(id, 'programmatic');
  }
}
