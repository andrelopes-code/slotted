import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
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
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  carouselKeyIntent,
  indicatorDistance,
  intentPage,
  revealInStrip,
} from '@slotted/core/carousel';
import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlCarousel } from './carousel';
import type { CarouselControlsPlacement, CarouselIndicatorsVariant } from './carousel-defaults';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is the rule every activating family in this library writes.
 */
function activationReason(event: MouseEvent): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** The `aria-label` the consumer wrote, read before the host binding writes the family's. */
function consumerLabel(): string | null {
  return inject(new HostAttributeToken('aria-label'), { optional: true });
}

/**
 * The scroller, and the one element the family moves. It takes focus of its
 * own: the arrows of its axis, `PageUp`, `PageDown`, `Home` and `End` move a
 * page, and a held key moves without animating.
 */
@Directive({
  selector: '[slCarouselViewport]',
  standalone: true,
  host: {
    'data-part': 'viewport',
    'data-part-viewport': '',
    role: 'group',
    tabindex: '0',
    '[id]': 'carousel.viewportId',
    '[attr.aria-label]': "label ?? carousel.t('viewport')",
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlCarouselViewport {
  protected readonly carousel = inject(SlCarousel);
  protected readonly label = consumerLabel();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    this.carousel.attachViewport(this.element);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.target !== this.element) return;
    const direction = getComputedStyle(this.element).direction === 'rtl' ? 'rtl' : 'ltr';
    const intent = carouselKeyIntent(event.key, this.carousel.resolvedOrientation(), direction);
    if (intent === null) return;
    const target = intentPage(
      intent,
      this.carousel.shown(),
      this.carousel.pageCount(),
      this.carousel.resolvedLoop(),
    );
    if (target === -1) return;
    event.preventDefault();
    this.carousel.go(target, 'keyboard', event, { instant: event.repeat });
  }
}

/**
 * One slide. The engine names it "3 de 8" unless the consumer wrote a name,
 * marks it in view, and makes it `inert` when it is not.
 */
@Directive({
  selector: '[slCarouselSlide]',
  standalone: true,
  host: {
    'data-part': 'slide',
    'data-part-slide': '',
    role: 'group',
    '[attr.aria-roledescription]': "carousel.t('slideRoleDescription')",
  },
})
export class SlCarouselSlide {
  protected readonly carousel = inject(SlCarousel);
}

/** The control that shows the previous page; at the first page without a loop it stays, and says so. */
@Component({
  selector: 'button[slCarouselPrevious]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon [directional]="carousel.resolvedOrientation() === 'horizontal'"
      ><svg slGlyph name="chevron-right"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'previous',
    'data-part-previous': '',
    type: 'button',
    '[attr.aria-controls]': 'carousel.viewportId',
    '[attr.aria-label]': "label ?? carousel.t('previous')",
    '[attr.aria-disabled]': "carousel.canPrevious() ? null : 'true'",
    '[attr.data-disabled]': "carousel.canPrevious() ? null : ''",
    '(click)': 'onClick($event)',
  },
})
export class SlCarouselPrevious {
  protected readonly carousel = inject(SlCarousel);
  protected readonly label = consumerLabel();

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || !this.carousel.canPrevious()) return;
    this.carousel.step(-1, activationReason(event), event);
  }
}

/** The control that shows the next page. */
@Component({
  selector: 'button[slCarouselNext]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon [directional]="carousel.resolvedOrientation() === 'horizontal'"
      ><svg slGlyph name="chevron-right"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'next',
    'data-part-next': '',
    type: 'button',
    '[attr.aria-controls]': 'carousel.viewportId',
    '[attr.aria-label]': "label ?? carousel.t('next')",
    '[attr.aria-disabled]': "carousel.canNext() ? null : 'true'",
    '[attr.data-disabled]': "carousel.canNext() ? null : ''",
    '(click)': 'onClick($event)',
  },
})
export class SlCarouselNext {
  protected readonly carousel = inject(SlCarousel);
  protected readonly label = consumerLabel();

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || !this.carousel.canNext()) return;
    this.carousel.step(1, activationReason(event), event);
  }
}

/**
 * The rotation control, named by the action it performs and carrying no
 * pressed state, as the APG asks. Hidden in a carousel that does not rotate.
 */
@Component({
  selector: 'button[slCarouselAutoplay]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph [name]="carousel.isPlaying() ? 'pause' : 'play'"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'autoplay',
    'data-part-autoplay': '',
    type: 'button',
    '[attr.hidden]': "carousel.rotates() ? null : ''",
    '[attr.aria-controls]': 'carousel.viewportId',
    '[attr.aria-label]': "label ?? carousel.t(carousel.isPlaying() ? 'stop' : 'start')",
    '(click)': 'onClick($event)',
  },
})
export class SlCarouselAutoplay {
  protected readonly carousel = inject(SlCarousel);
  protected readonly label = consumerLabel();

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.carousel.setPlaying(!this.carousel.isPlaying(), activationReason(event), event);
  }
}

/** The bar the controls stand in: under the viewport, or over its foot. */
@Directive({
  selector: '[slCarouselControls]',
  standalone: true,
  host: {
    'data-part': 'controls',
    'data-part-controls': '',
    '[attr.data-placement]': 'placement()',
  },
})
export class SlCarouselControls {
  readonly placement = input<CarouselControlsPlacement>('below');
}

/** One page in the picker. Its content is the family's mark, or what the consumer puts in it. */
@Component({
  selector: 'button[slCarouselIndicator]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'indicator',
    'data-part-indicator': '',
    role: 'tab',
    type: 'button',
    '[attr.aria-selected]': 'current()',
    '[attr.aria-controls]': 'controls()',
    '[attr.aria-label]': 'resolvedLabel()',
    '[attr.data-current]': "current() ? '' : null",
    '[attr.data-distance]': 'distance()',
    '[attr.tabindex]': 'current() ? 0 : -1',
    '(click)': 'onClick($event)',
  },
})
export class SlCarouselIndicator {
  /** The page this indicator shows. */
  readonly page = input.required<number>();
  protected readonly carousel = inject(SlCarousel);
  private readonly label = consumerLabel();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly current = computed(() => this.carousel.shown() === this.page());
  protected readonly distance = computed(() =>
    indicatorDistance(this.page(), this.carousel.shown(), this.carousel.pageCount()),
  );
  protected readonly controls = computed(() => {
    const first = this.carousel.pages().starts[this.page()];
    return first === undefined ? null : (this.carousel.slideIds()[first] ?? null);
  });
  /** A thumbnail is named by its picture; a dot or a segment by the page. */
  protected readonly resolvedLabel = computed(() => {
    if (this.label !== null) return this.label;
    if (this.element.childElementCount > 0) return null;
    return this.carousel.t('indicator', {
      page: this.page() + 1,
      count: this.carousel.pageCount(),
    });
  });

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.carousel.go(this.page(), activationReason(event), event);
  }
}

/**
 * The template a slide picker draws each indicator from, with the page as
 * its implicit context: `<ng-template slCarouselIndicatorTemplate let-page>`.
 */
@Directive({ selector: 'ng-template[slCarouselIndicatorTemplate]', standalone: true })
export class SlCarouselIndicatorTemplate {
  readonly template = inject<TemplateRef<{ $implicit: number }>>(TemplateRef);
}

/**
 * The slide picker, as the APG's tabs: one tab stop, arrows that move and
 * show and stop at the ends. Without a template the family draws a dot — or a
 * segment — per page.
 */
@Component({
  selector: '[slCarouselIndicators]',
  standalone: true,
  imports: [NgTemplateOutlet, SlCarouselIndicator],
  template: `@for (page of pageList(); track page) {
    @if (custom(); as custom) {
      <ng-container *ngTemplateOutlet="custom.template; context: { $implicit: page }" />
    } @else {
      <button slCarouselIndicator [page]="page"></button>
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'indicators',
    'data-part-indicators': '',
    role: 'tablist',
    '[attr.aria-label]': "label ?? carousel.t('indicators')",
    '[attr.data-variant]': 'variant()',
    '[attr.data-adaptive]': "adaptive() ? '' : null",
  },
})
export class SlCarouselIndicators {
  readonly variant = input<CarouselIndicatorsVariant>('dots');
  protected readonly carousel = inject(SlCarousel);
  protected readonly label = consumerLabel();
  protected readonly custom = contentChild(SlCarouselIndicatorTemplate);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private roving: RovingTabindexHandle | null = null;

  protected readonly pageList = computed(() =>
    Array.from({ length: this.carousel.pageCount() }, (_, index) => index),
  );
  protected readonly adaptive = computed(
    () => this.variant() === 'dots' && indicatorDistance(0, 0, this.carousel.pageCount()) !== null,
  );

  constructor() {
    afterNextRender(() => {
      this.roving = createRovingTabindex(this.element, {
        itemSelector: '[data-part="indicator"]',
        loop: false,
        orientation: () => 'horizontal',
        onMove: (index) => this.carousel.go(index, 'keyboard'),
      });
    });

    effect(() => {
      const page = this.carousel.shown();
      this.pageList();
      untracked(() => {
        /* After the indicators of a new page count have rendered. */
        queueMicrotask(() => {
          this.roving?.refresh();
          this.roving?.setActive(page);
          if (this.variant() !== 'thumbnails') return;
          const item = this.element.querySelectorAll<HTMLElement>('[data-part="indicator"]')[page];
          if (item !== undefined) revealInStrip(this.element, item);
        });
      });
    });

    inject(DestroyRef).onDestroy(() => this.roving?.destroy());
  }
}

/**
 * "3 / 8", hidden from assistive technology: the slides' names and the
 * announcement already say where the reader is.
 */
@Component({
  selector: '[slCarouselCounter]',
  standalone: true,
  template: '{{ text() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'counter',
    'data-part-counter': '',
    'aria-hidden': 'true',
  },
})
export class SlCarouselCounter {
  protected readonly carousel = inject(SlCarousel);
  private readonly number = computed(() => new Intl.NumberFormat(this.carousel.locale()));

  protected readonly text = computed(() => {
    const count = this.carousel.pageCount();
    const shown = count === 0 ? 0 : this.carousel.shown() + 1;
    const number = this.number();
    return `${number.format(shown)} / ${number.format(count)}`;
  });
}
