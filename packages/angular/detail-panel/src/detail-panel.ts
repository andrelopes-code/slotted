import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { findScrollParent } from '@slotted/core/sticky-header';
import { injectMessages } from '@slotted/angular/i18n';
import {
  detailPanelMessages,
  type DetailPanelMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { PAGE_HEADER_DEFAULTS } from '@slotted/angular/page-header';
import type { PageHeaderDefaults } from '@slotted/angular/page-header';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import { injectDetailPanelDefaults, SlDetailPanelIdFactory } from './detail-panel-defaults';
import type {
  DetailPanelAside,
  DetailPanelLayout,
  DetailPanelLevel,
  DetailPanelMount,
  DetailPanelScroll,
  DetailPanelSectionReason,
  DetailPanelSize,
  DetailPanelStatus,
} from './detail-panel-defaults';

export type {
  DetailPanelAside,
  DetailPanelDefaults,
  DetailPanelLayout,
  DetailPanelLevel,
  DetailPanelMount,
  DetailPanelScroll,
  DetailPanelSectionReason,
  DetailPanelSize,
  DetailPanelStatus,
} from './detail-panel-defaults';

/** The ids the strip's tabs family returns for one section name. */
export interface DetailPanelIdentity {
  panelId: string;
  tabId: string;
}

/** The selector for the heading the panel is named by and focuses: the page-header's. */
const HEADING_SELECTOR = ':scope > [data-ui="page-header"] [data-part="heading"]';

/**
 * One named unit of content, declared as a template so the panel decides
 * when it exists: `mount` under `tabs`, and `loading` under both layouts.
 *
 * ```html
 * <ng-template slDetailPanelSection name="linhas" label="Linhas" [count]="4">
 *   …
 * </ng-template>
 * ```
 */
@Directive({
  selector: 'ng-template[slDetailPanelSection]',
  standalone: true,
  exportAs: 'slDetailPanelSection',
})
export class SlDetailPanelSection {
  /** The value the section is named by in `section` and the URL. */
  readonly name = input.required<string>();
  /** The tab's words, and the stacked heading. */
  readonly label = input.required<string>();
  /** Drawn in the tab, or as a badge after the stacked heading. */
  readonly count = input<number | undefined>(undefined);
  /** Takes the tab out of the strip's sequence. Inert under `stacked`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The section's own controls, as a template: in the stacked heading's actions column, or in a row above a tabbed section. */
  readonly actions = input<TemplateRef<unknown> | undefined>(undefined);

  readonly template = inject(TemplateRef<unknown>);
}

/**
 * One record on screen: what identifies it, what state it is in, what can be
 * done to it, and what happened to it.
 *
 * **The top is a `[slPageHeader]` the consumer writes**, the root's first
 * child. The panel provides `PAGE_HEADER_DEFAULTS` for its subtree from its
 * own `level` and `size`, so a header that states neither takes the panel's;
 * one that does still wins.
 *
 * **One value moves: the current section.** `section` is a model; every move
 * is first a request on `sectionRequest`, carrying the reason and `cancel()`.
 * Under `layout="tabs"` the strip (`[slDetailPanelTabs]`, placed in the
 * header's tabs slot) asks with `pointer` or `keyboard`; under `stacked` the
 * value arrives as `programmatic` and the named section is scrolled under the
 * chrome and marked `data-current`.
 *
 * **Focus follows the record.** When `recordKey` changes while focus is
 * inside the root, the heading takes focus and the scroller returns to its
 * start.
 */
@Component({
  selector: '[slDetailPanel]',
  standalone: true,
  exportAs: 'slDetailPanel',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/detail-panel/detail-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: PAGE_HEADER_DEFAULTS,
      useFactory: (): PageHeaderDefaults => {
        const inherited = inject(PAGE_HEADER_DEFAULTS, { skipSelf: true });
        const panel = inject(SlDetailPanel);
        /* Getters over signals: a computed in the page-header that reads
           `defaults.level` tracks the panel's own resolved level. */
        return {
          get collapse() {
            return inherited.collapse;
          },
          get level() {
            return panel.resolvedLevel();
          },
          get material() {
            return inherited.material;
          },
          get size() {
            return panel.resolvedSize();
          },
          get variant() {
            return inherited.variant;
          },
        };
      },
    },
  ],
  host: {
    'data-ui': 'detail-panel',
    'data-ui-detail-panel': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-aside]': 'resolvedAside()',
    '[attr.data-level]': 'resolvedLevel()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-scroll]': 'resolvedScroll()',
    '[attr.data-mount]': 'resolvedMount()',
    '[attr.data-status]': 'status()',
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.aria-busy]': "loading() ? 'true' : null",
    '[attr.data-key]': 'recordKey() ?? null',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-label]': 'label()',
  },
})
export class SlDetailPanel {
  readonly layout = input<DetailPanelLayout | undefined>(undefined);
  readonly aside = input<DetailPanelAside | undefined>(undefined);
  readonly level = input<DetailPanelLevel | undefined>(undefined);
  readonly size = input<DetailPanelSize | undefined>(undefined);
  readonly scroll = input<DetailPanelScroll | undefined>(undefined);
  readonly mount = input<DetailPanelMount | undefined>(undefined);
  readonly status = input<DetailPanelStatus>('ready');
  /** The record has not arrived: `aria-busy`, and skeleton lines in every section. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** The identity of the record on screen. */
  readonly recordKey = input<string | number | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * aside's name (`aside`) and the root's name while loading (`loading`).
   */
  readonly messages = input<PartialMessages<DetailPanelMessages> | undefined>(undefined);
  /** The current section. Two-way, so a template may bind it directly. */
  readonly section = model<string | undefined>(undefined);

  /** One output for one move of the current section, carrying the reason and the event. */
  readonly sectionRequest = output<ChangeRequest<string | undefined>>();

  private readonly defaults = injectDetailPanelDefaults();
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  readonly id = inject(SlDetailPanelIdFactory).next();

  /** Every section declared inside the panel, in declaration order. */
  readonly sections = contentChildren(SlDetailPanelSection, { descendants: true });
  /** The strip's ids for a section, once the strip has attached. */
  readonly identify = signal<((name: string) => DetailPanelIdentity) | undefined>(undefined);
  private readonly headingId = signal<string | undefined>(undefined);
  private readonly seen = new Set<string>();

  readonly resolvedLayout = computed(() => this.layout() ?? this.defaults.layout);
  readonly resolvedAside = computed(() => this.aside() ?? this.defaults.aside);
  readonly resolvedLevel = computed(() => this.level() ?? this.defaults.level);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedScroll = computed(() => this.scroll() ?? this.defaults.scroll);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  /** The family's words in the language in force, with this panel's `messages` laid over them. */
  readonly t = injectMessages(detailPanelMessages, this.messages);
  /** The current section: the model, or under tabs the first section when nothing is named. */
  readonly current = computed(() => {
    const named = this.section();
    if (named !== undefined) return named;
    return this.resolvedLayout() === 'tabs' ? this.sections()[0]?.name() : undefined;
  });

  protected readonly labelledBy = computed(() => {
    if (this.writtenLabel !== null || this.writtenLabelledBy !== null)
      return this.writtenLabelledBy;
    return this.headingId() ?? null;
  });
  protected readonly label = computed(() => {
    if (this.writtenLabel !== null) return this.writtenLabel;
    if (this.writtenLabelledBy !== null || this.headingId() !== undefined) return null;
    return this.loading() ? this.t('loading') : null;
  });

  constructor() {
    effect(() => {
      const current = this.current();
      if (current !== undefined) this.seen.add(current);
    });

    /**
     * The root is named by the page-header's heading, which is in the DOM
     * once the consumer's header has rendered. Read there rather than
     * passed, because the heading's id is the page-header's to give.
     */
    afterRenderEffect(() => {
      this.loading();
      this.recordKey();
      const heading = this.native.querySelector<HTMLElement>(HEADING_SELECTOR);
      untracked(() => this.headingId.set(heading?.id || undefined));
    });

    /**
     * Focus follows the record. The first key is the record the panel
     * opened on and moves nothing; a later one is the previous or next
     * control, or the application, changing what is under the reader.
     */
    let seenKey = untracked(() => this.recordKey());
    afterRenderEffect(() => {
      const key = this.recordKey();
      if (key === seenKey) return;
      seenKey = key;
      const active = this.native.ownerDocument.activeElement;
      if (active === null || !this.native.contains(active)) return;
      this.scroller()?.scrollTo({ top: 0 });
      this.focus();
    });

    /**
     * Under `stacked` the current section is a place, so a value that
     * arrived is scrolled under the chrome; the section's
     * `scroll-margin-block-start` reads the chrome's height.
     */
    let scrolledTo: string | undefined;
    afterRenderEffect(() => {
      const current = this.current();
      if (this.resolvedLayout() !== 'stacked' || current === undefined) return;
      if (scrolledTo === current) return;
      scrolledTo = current;
      this.native
        .querySelector<HTMLElement>(`[data-part="section"][data-name="${CSS.escape(current)}"]`)
        ?.scrollIntoView({ block: 'start' });
    });
  }

  /** Whether a section has been current at least once, which is what `lazy` reads. */
  hasSeen(name: string): boolean {
    return this.seen.has(name);
  }

  /** Asks to move the current section, carrying the reason and the originating event. */
  select(next: string, reason: DetailPanelSectionReason, source?: Event) {
    if (next === this.current()) return;
    let cancelled = false;
    const state = createControllable<string | undefined>({
      initial: this.current(),
      onRequest: (request) => {
        this.sectionRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    this.section.set(next);
  }

  /** Scrolls a stacked section under the chrome, or shows a tabbed one, with the reason `programmatic`. */
  scrollToSection(name: string) {
    this.select(name, 'programmatic');
  }

  /** Puts focus on the page-header's heading, which is where a new record starts. */
  focus() {
    const heading = this.native.querySelector<HTMLElement>(HEADING_SELECTOR);
    if (heading === null) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  private scroller(): HTMLElement | null {
    return this.resolvedScroll() === 'self' ? this.native : findScrollParent(this.native);
  }
}
