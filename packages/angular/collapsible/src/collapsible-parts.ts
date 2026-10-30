import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';

import { SlCollapsible } from './collapsible';

const HEADINGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

/**
 * The heading the trigger lives in.
 *
 * The element is the consumer's own, which is what this ecosystem composes
 * with: `<h3 slCollapsibleHeader>` is a native heading and this adds nothing to
 * it, while `<div slCollapsibleHeader>` gets `role="heading"` and the level the
 * disclosure resolved. The pattern names both — "if the native host language
 * has an element with an implicit heading and aria-level … a native host
 * language element may be used" — and React reads the element off `level`
 * instead, because there the component owns the tag.
 *
 * The trigger is meant to be its only child: the pattern requires the button to
 * be the only element inside the heading, which is why the always-visible
 * controls go in `slCollapsibleActions` beside it.
 */
@Directive({
  selector: '[slCollapsibleHeader]',
  standalone: true,
  exportAs: 'slCollapsibleHeader',
  host: {
    'data-part': 'header',
    'data-part-header': '',
    '[attr.role]': 'ariaRole()',
    '[attr.aria-level]': 'ariaLevel()',
  },
})
export class SlCollapsibleHeader {
  private readonly collapsible = inject(SlCollapsible);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  /** Whether the consumer already wrote a heading, in which case ARIA adds nothing. */
  private readonly isNativeHeading = HEADINGS.has(this.native.tagName);

  protected readonly ariaRole = computed(() => {
    if (this.isNativeHeading || this.collapsible.resolvedLevel() === 'none') return null;
    return 'heading';
  });

  protected readonly ariaLevel = computed(() => {
    if (this.isNativeHeading || this.collapsible.resolvedLevel() === 'none') return null;
    return this.collapsible.resolvedLevel();
  });
}

/**
 * The control.
 *
 * It is the consumer's own `button`, so `Enter` and `Space` are the platform's
 * and the family binds no key of its own. The mark, the words and the second
 * line are the component's, because all three are parts the stylesheet places.
 */
@Component({
  selector: 'button[slCollapsibleTrigger]',
  standalone: true,
  exportAs: 'slCollapsibleTrigger',
  imports: [SlGlyph, SlIcon],
  template: `@if (collapsible.resolvedIndicator() !== 'none') {
      <span data-part="indicator" data-part-indicator="" aria-hidden="true"
        ><span slIcon><svg slGlyph [name]="indicatorGlyph()"></svg></span
      ></span>
    }
    <span data-part="label" data-part-label=""><ng-content /></span>
    @if (description()) {
      <span data-part="description" data-part-description="">{{ description() }}</span>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'trigger',
    'data-part-trigger': '',
    type: 'button',
    '[attr.id]': 'ids().triggerId',
    '[attr.aria-controls]': 'ids().panelId',
    '[attr.aria-expanded]': 'collapsible.isOpen()',
    '[attr.aria-disabled]': "collapsible.held() ? 'true' : null",
    '[disabled]': 'collapsible.resolvedDisabled()',
    '(click)': 'onClick($event)',
  },
})
export class SlCollapsibleTrigger {
  protected readonly collapsible = inject(SlCollapsible);

  /**
   * A second line under the title. It is inside the trigger, so it is part of
   * the accessible name — "Delivery, 3 of 12 items" is what a reader hears.
   */
  readonly description = input<string | undefined>(undefined);

  /**
   * The chevron is one glyph the stylesheet turns; plus and minus are two, so
   * the state picks between them here.
   */
  protected readonly indicatorGlyph = computed<GlyphName>(() => {
    if (this.collapsible.resolvedIndicator() !== 'plus-minus') return 'chevron-down';
    return this.collapsible.isOpen() ? 'minus' : 'plus';
  });

  protected ids() {
    return this.collapsible.ids();
  }

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.collapsible.held()) return;
    /* A click synthesised by the keyboard reports no detail; a real one reports
       the click count. It is why Enter, Space and a pointer are told apart
       without a key listener existing for the toggle. */
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    this.collapsible.toggle(!this.collapsible.isOpen(), reason, event);
  }
}

/**
 * The always-visible controls beside the header.
 *
 * They are a sibling of the heading rather than a child of it, for two reasons
 * that agree: the pattern requires the button to be the only element inside the
 * heading, and a control inside a `button` is invalid HTML. What belongs here is
 * an `slToolbar` — one tab stop for however many actions the page puts there.
 */
@Directive({
  selector: '[slCollapsibleActions]',
  standalone: true,
  exportAs: 'slCollapsibleActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlCollapsibleActions {}

/**
 * Content built the first time the panel opens.
 *
 * `<ng-content>` is instantiated by the parent whether or not it is inserted,
 * so `mount="lazy"` needs a template rather than projection. It is Angular
 * Material's own `matExpansionPanelContent`, and it is the answer this
 * ecosystem already knows.
 */
@Directive({
  selector: 'ng-template[slCollapsibleContent]',
  standalone: true,
  exportAs: 'slCollapsibleContent',
})
export class SlCollapsibleContent {
  readonly template = inject(TemplateRef);
}

/**
 * The panel.
 *
 * The box always exists, so the trigger's `aria-controls` never names an
 * element that is gone; `mount` decides whether the content inside it does.
 *
 * While the panel is closed it is taken out of the tab sequence and out of the
 * accessibility tree twice over: the stylesheet with `content-visibility`, and
 * this component with `inert`, so a browser without the property still cannot
 * put focus inside it. `mount="until-found"` writes `hidden="until-found"`
 * instead, and the browser removes that attribute itself when its page search
 * reaches the text inside — `beforematch` is what asks the family to open, with
 * the one reason the closed vocabulary holds for a move the browser made.
 */
@Component({
  selector: '[slCollapsiblePanel]',
  standalone: true,
  exportAs: 'slCollapsiblePanel',
  imports: [NgTemplateOutlet],
  template: `@if (mounted()) {
    <div data-part="content" data-part-content="">
      @if (deferred()) {
        <ng-container [ngTemplateOutlet]="deferred()!.template" />
      }
      <ng-content />
    </div>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'panel',
    'data-part-panel': '',
    '[attr.id]': 'ids().panelId',
    '[attr.aria-labelledby]': 'ids().triggerId',
    '[attr.role]': "collapsible.region() ? 'region' : null",
    '[attr.aria-busy]': "collapsible.loading() ? 'true' : null",
  },
})
export class SlCollapsiblePanel {
  protected readonly collapsible = inject(SlCollapsible);
  protected readonly deferred = contentChild(SlCollapsibleContent);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly mounted = computed(() => {
    const mount = this.collapsible.resolvedMount();
    if (mount === 'active') return this.collapsible.isOpen();
    if (mount === 'lazy') return this.collapsible.seen();
    return true;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    let attached: (() => void) | undefined;

    effect(() => {
      const open = this.collapsible.isOpen();
      const untilFound = this.collapsible.resolvedMount() === 'until-found';

      attached?.();
      attached = undefined;

      if (open) {
        this.native.removeAttribute('hidden');
        this.native.removeAttribute('inert');
        return;
      }

      if (untilFound) {
        this.native.removeAttribute('inert');
        this.native.setAttribute('hidden', 'until-found');
        const reveal = () => this.collapsible.toggle(true, 'programmatic');
        this.native.addEventListener('beforematch', reveal);
        attached = () => this.native.removeEventListener('beforematch', reveal);
        return;
      }

      this.native.removeAttribute('hidden');
      this.native.setAttribute('inert', '');
    });

    destroyRef.onDestroy(() => attached?.());
  }

  protected ids() {
    return this.collapsible.ids();
  }
}
