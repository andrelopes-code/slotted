import { SlSkeletonText } from '@slotted/angular/skeleton';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  booleanAttribute,
  HostAttributeToken,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  injectProgressIndicatorDefaults,
  SlProgressBar,
  type ProgressSize,
  type ProgressTone,
} from '@slotted/angular/progress-indicator';

import { SlPageHeader } from './page-header';

const HEADINGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

/** A click synthesised by the keyboard reports no detail; a real one reports the click count. */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

/** The strip that never leaves: nav, title row and controls. Sticky at 0 inside the root. */
@Directive({
  selector: '[slPageHeaderTitleArea]',
  standalone: true,
  host: { 'data-part': 'title-area', 'data-part-title-area': '' },
})
export class SlPageHeaderTitleArea {}

/** The row above the title: the way back, then the breadcrumbs. */
@Directive({
  selector: '[slPageHeaderNav]',
  standalone: true,
  host: { 'data-part': 'nav', 'data-part-nav': '' },
})
export class SlPageHeaderNav {}

/**
 * The way back: the consumer's own link or button, with the arrow the family
 * draws before it. The arrow points along the reading direction and mirrors
 * with it.
 */
@Component({
  selector: '[slPageHeaderBack]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<span slIcon directional><svg slGlyph name="arrow-left"></svg></span><ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-part': 'back', 'data-part-back': '' },
})
export class SlPageHeaderBack {}

/** The slot a breadcrumb sits in. Hidden below 600 pixels. */
@Directive({
  selector: '[slPageHeaderBreadcrumbs]',
  standalone: true,
  host: { 'data-part': 'breadcrumbs', 'data-part-breadcrumbs': '' },
})
export class SlPageHeaderBreadcrumbs {}

/** Visual, title, actions and navigation, on one row that wraps. */
@Directive({
  selector: '[slPageHeaderTitleRow]',
  standalone: true,
  host: { 'data-part': 'title-row', 'data-part-title-row': '' },
})
export class SlPageHeaderTitleRow {}

/** The mark before the heading: an avatar, an icon, an image. */
@Directive({
  selector: '[slPageHeaderVisual]',
  standalone: true,
  host: { 'data-part': 'visual', 'data-part-visual': '' },
})
export class SlPageHeaderVisual {}

/** The column of heading, marks and subheading. */
@Directive({
  selector: '[slPageHeaderTitle]',
  standalone: true,
  host: { 'data-part': 'title', 'data-part-title': '' },
})
export class SlPageHeaderTitle {}

/** The status beside the heading: a tag, a badge, a status indicator. */
@Directive({
  selector: '[slPageHeaderMarks]',
  standalone: true,
  host: { 'data-part': 'marks', 'data-part-marks': '' },
})
export class SlPageHeaderMarks {}

/** The slot a toolbar sits in, pushed to the end of the title row. */
@Directive({
  selector: '[slPageHeaderActions]',
  standalone: true,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlPageHeaderActions {}

/** The previous and next record, at the far end of the title row. */
@Directive({
  selector: '[slPageHeaderNavigation]',
  standalone: true,
  host: { 'data-part': 'navigation', 'data-part-navigation': '' },
})
export class SlPageHeaderNavigation {}

/** The picture of the record, a column before the content of the header area. */
@Directive({
  selector: '[slPageHeaderFigure]',
  standalone: true,
  host: { 'data-part': 'figure', 'data-part-figure': '' },
})
export class SlPageHeaderFigure {}

/** A column of whatever only makes sense at rest. */
@Directive({
  selector: '[slPageHeaderContent]',
  standalone: true,
  host: { 'data-part': 'content', 'data-part-content': '' },
})
export class SlPageHeaderContent {}

/** The slot a tabs family sits in, last in the root. */
@Directive({
  selector: '[slPageHeaderTabs]',
  standalone: true,
  host: { 'data-part': 'tabs', 'data-part-tabs': '' },
})
export class SlPageHeaderTabs {}

/**
 * The heading. The element is the consumer's own: `<h1 slPageHeaderHeading>`
 * is a native heading and this adds nothing to it, while a `div` or an
 * `input` gets `role="heading"` and the level the header resolved. While
 * loading it renders `slSkeletonText` in place of its words.
 */
@Component({
  selector: '[slPageHeaderHeading]',
  standalone: true,
  exportAs: 'slPageHeaderHeading',
  imports: [SlSkeletonText],
  template: `@if (header.loading()) {
      <span slSkeletonText [lines]="1"></span>
    } @else {
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'heading',
    'data-part-heading': '',
    '[attr.id]': 'header.ids().headingId',
    '[attr.role]': 'ariaRole()',
    '[attr.aria-level]': 'ariaLevel()',
  },
})
export class SlPageHeaderHeading {
  protected readonly header = inject(SlPageHeader);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly isNativeHeading = HEADINGS.has(this.native.tagName);

  protected readonly ariaRole = computed(() => (this.isNativeHeading ? null : 'heading'));
  protected readonly ariaLevel = computed(() =>
    this.isNativeHeading ? null : this.header.resolvedLevel(),
  );
}

/** One line under the heading, in the muted text, part of what stays visible. */
@Component({
  selector: '[slPageHeaderSubheading]',
  standalone: true,
  imports: [SlSkeletonText],
  template: `@if (header.loading()) {
      <span slSkeletonText [lines]="1"></span>
    } @else {
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'subheading', 'data-part-subheading': '' },
})
export class SlPageHeaderSubheading {
  protected readonly header = inject(SlPageHeader);
}

/** A paragraph with a measure, inside the header area's content. */
@Component({
  selector: '[slPageHeaderDescription]',
  standalone: true,
  imports: [SlSkeletonText],
  template: `@if (header.loading()) {
      <span slSkeletonText [lines]="2"></span>
    } @else {
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlPageHeaderDescription {
  protected readonly header = inject(SlPageHeader);
}

/**
 * The region that collapses. Collapsed by the control it is `inert` and
 * hidden from assistive technology; scrolled past it is neither, so a control
 * inside it that receives focus is scrolled back into view and the header
 * re-opens with the reason `scroll`.
 */
@Directive({
  selector: '[slPageHeaderArea]',
  standalone: true,
  exportAs: 'slPageHeaderArea',
  host: {
    'data-part': 'header-area',
    'data-part-header-area': '',
    role: 'region',
    '[attr.id]': 'header.ids().areaId',
    '[attr.aria-label]': 'label()',
  },
})
export class SlPageHeaderArea {
  protected readonly header = inject(SlPageHeader);
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly label = computed(() => this.written ?? this.header.t('headerArea'));

  constructor() {
    effect(() => {
      const closedByControl = !this.header.expanded() && !this.header.scrolled();
      if (closedByControl) {
        this.native.setAttribute('inert', '');
        this.native.setAttribute('aria-hidden', 'true');
      } else {
        this.native.removeAttribute('inert');
        this.native.removeAttribute('aria-hidden');
      }
    });
  }
}

/** The zero-height row on the chrome's edge; the pill is its only child. */
@Component({
  selector: '[slPageHeaderControls]',
  standalone: true,
  template: `<div><ng-content /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'controls', 'data-part-controls': '' },
})
export class SlPageHeaderControls {}

/**
 * The disclosure control: the consumer's own `button`, so `Enter` and `Space`
 * are the platform's. `aria-expanded` and `aria-controls` are the pattern's
 * two properties.
 */
@Component({
  selector: 'button[slPageHeaderToggle]',
  standalone: true,
  exportAs: 'slPageHeaderToggle',
  imports: [SlGlyph, SlIcon],
  /* The stylesheet turns the chevron half a turn while the area is shown. */
  template: `<ng-content
    ><span slIcon><svg slGlyph name="chevron-down"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'toggle',
    'data-part-toggle': '',
    type: 'button',
    '[attr.aria-expanded]': 'header.expanded()',
    '[attr.aria-controls]': 'header.ids().areaId',
    '[attr.aria-label]': 'label()',
    '(click)': 'onClick($event)',
  },
})
export class SlPageHeaderToggle {
  protected readonly header = inject(SlPageHeader);
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly label = computed(() => {
    if (this.written !== null) return this.written;
    return this.header.expanded() ? this.header.t('collapse') : this.header.t('expand');
  });

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.header.setExpanded(!this.header.expanded(), activationReason(event), event);
  }
}

/** The pin: a toggle button with `aria-pressed`, which is the `pressed` state the vocabulary has. */
@Component({
  selector: 'button[slPageHeaderPin]',
  standalone: true,
  exportAs: 'slPageHeaderPin',
  imports: [SlGlyph, SlIcon],
  /* The mark says what a press does: pin while free, unpin while held. */
  template: `<ng-content
    ><span slIcon><svg slGlyph [name]="header.pinned() ? 'pin-off' : 'pin'"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'pin',
    'data-part-pin': '',
    type: 'button',
    '[attr.aria-pressed]': 'header.pinned()',
    '[attr.data-pressed]': "header.pinned() ? '' : null",
    '[attr.aria-label]': 'label()',
    '(click)': 'onClick($event)',
  },
})
export class SlPageHeaderPin {
  protected readonly header = inject(SlPageHeader);
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly label = computed(() => {
    if (this.written !== null) return this.written;
    return this.header.pinned() ? this.header.t('unpin') : this.header.t('pin');
  });

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.header.setPinned(!this.header.pinned(), activationReason(event), event);
  }
}

/**
 * A refresh of what is already on screen, drawn over the line where the chrome
 * ends, wherever it is written among the parts: with a pill over the tabs it is
 * the line the pill straddles, and otherwise the root's own hairline. The
 * frame is a row of the container one hairline tall; the
 * stylesheet gives the bar the header's width and draws nothing while the
 * title is still loading or while a region around the header is busy. `size`
 * defaults to `sm`, `delay` to 200 and `minDuration` to 400 milliseconds; an
 * input, then `provideProgressIndicatorDefaults()`, wins.
 */
@Component({
  selector: '[slPageHeaderProgress]',
  standalone: true,
  exportAs: 'slPageHeaderProgress',
  imports: [SlProgressBar],
  template: `<div
    slProgressBar
    placement="edge-end"
    [buffer]="buffer()"
    [delay]="delay() ?? defaults.delay ?? 200"
    [label]="label() ?? header.t('progress')"
    [loading]="loading()"
    [max]="max()"
    [min]="min()"
    [minDuration]="minDuration() ?? defaults.minDuration ?? 400"
    [size]="size() ?? 'sm'"
    [tone]="tone()"
    [value]="value()"
    [valueText]="valueText()"
    (withdraw)="withdraw.emit()"
  ></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'progress', 'data-part-progress': '' },
})
export class SlPageHeaderProgress {
  protected readonly header = inject(SlPageHeader);
  protected readonly defaults = injectProgressIndicatorDefaults();

  readonly loading = input(true, { transform: booleanAttribute });
  readonly value = input<number | null | undefined>(undefined);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly buffer = input<number | null | undefined>(undefined);
  readonly valueText = input<string | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly tone = input<ProgressTone | undefined>(undefined);
  readonly size = input<ProgressSize | undefined>(undefined);
  readonly delay = input<number | undefined>(undefined);
  readonly minDuration = input<number | undefined>(undefined);
  /** The bar was painted and has been withdrawn. */
  readonly withdraw = output<void>();
}
