import { SlHeadingLevel } from '@slotted/angular/typography';
import { observeStuck } from '@slotted/core/sticky-header';
import type { HeadingLevelValue } from '@slotted/angular/typography';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { injectSectionDefaults, SlSectionIdFactory } from './section-defaults';
import type { SectionGround, SectionLevel, SectionSize } from './section-defaults';

export type { SectionDefaults, SectionGround, SectionLevel, SectionSize } from './section-defaults';

/**
 * One unit of content inside a page: a header — eyebrow, heading,
 * description, actions — and a body one outline step deeper.
 *
 * **The rank is the outline's.** `typography` owns it: the heading takes the
 * rank `slHeadingLevel` gives — `h2` directly in a page body, one deeper
 * inside another section's body — unless `level` says otherwise. The element
 * is the consumer's: `<h2 slSectionHeading>` is a native heading and the
 * directive adds nothing to it; `<div slSectionHeading>` gets `role="heading"`
 * and the level the section resolved.
 *
 * **A region only when it has a name.** The root is `aria-labelledby` its
 * heading once one is rendered, which makes the `section` a region landmark.
 *
 * **The hooks anchor navigation needs.** The root carries an `id`, the
 * consumer's own or a generated one, and a scroll margin the height of the
 * page's fixed chrome, so a hash link lands under the header.
 */
/** The measured height of a sticky section's header, written on the root. */
export const HEADER_SIZE_PROPERTY = '--slotted-section-header-size';

@Component({
  selector: '[slSection]',
  standalone: true,
  exportAs: 'slSection',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/section/section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'section',
    'data-ui-section': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.id]': 'id()',
    '[attr.aria-labelledby]': 'hasHeading() ? headingId() : null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-level]': 'resolvedLevel()',
    '[attr.data-ground]': 'resolvedGround()',
    '[attr.data-divider]': "resolvedDivider() ? '' : null",
    '[attr.data-sticky]': "resolvedSticky() ? '' : null",
  },
})
export class SlSection {
  readonly size = input<SectionSize | undefined>(undefined);
  /** Defaults to `auto`: the rank the outline gives. */
  readonly level = input<SectionLevel | undefined>(undefined);
  readonly ground = input<SectionGround | undefined>(undefined);
  readonly divider = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly sticky = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  private readonly defaults = injectSectionDefaults();
  private readonly outline = inject(SlHeadingLevel, { optional: true });
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly generated = inject(SlSectionIdFactory).next();

  /** Whether a heading is rendered, which is what makes the section a region. */
  readonly hasHeading = signal(false);
  /** The header element, handed over by `slSectionHeader`, so a sticky header can be measured. */
  readonly header = signal<HTMLElement | null>(null);

  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  readonly id = computed(() => this.writtenId ?? this.generated);
  readonly headingId = computed(() => `${this.id()}-heading`);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedGround = computed(() => this.ground() ?? this.defaults.ground);
  readonly resolvedDivider = computed(() => (this.divider() ?? this.defaults.divider) === true);
  readonly resolvedSticky = computed(() => (this.sticky() ?? this.defaults.sticky) === true);
  readonly resolvedLevel = computed<HeadingLevelValue>(() => {
    const level = this.level();
    if (level === undefined || level === 'auto') return this.outline?.level ?? 1;
    return Number(level) as HeadingLevelValue;
  });

  constructor() {
    /**
     * A sticky header is chrome for what is under it: its height, measured,
     * goes on the root as `--slotted-section-header-size`, and the stylesheet
     * republishes `--slotted-page-sticky-top` for the body as page plus
     * header, so a table's column header or a nested section stops under this
     * header. Written on the element, so a resize costs no change detection.
     */
    effect((onCleanup) => {
      const header = this.header();
      if (!this.resolvedSticky() || header === null) return;
      /* Rounded up: a fractional height rounded down leaves a hairline gap the rows show through. */
      const write = () =>
        this.native.style.setProperty(
          HEADER_SIZE_PROPERTY,
          `${Math.ceil(header.getBoundingClientRect().height || header.offsetHeight)}px`,
        );
      write();
      const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(write);
      sizes?.observe(header);
      onCleanup(() => {
        sizes?.disconnect();
        this.native.style.removeProperty(HEADER_SIZE_PROPERTY);
      });
    });

    /**
     * `data-stuck` on the header while content passes under it, so a theme
     * can paint the header's ground only then. Written on the element, so a
     * scroll costs no change detection.
     */
    effect((onCleanup) => {
      const header = this.header();
      if (!this.resolvedSticky() || header === null) return;
      const stop = observeStuck(header, (stuck) => {
        if (stuck) header.setAttribute('data-stuck', '');
        else header.removeAttribute('data-stuck');
      });
      onCleanup(() => {
        stop();
        header.removeAttribute('data-stuck');
      });
    });
  }
}
