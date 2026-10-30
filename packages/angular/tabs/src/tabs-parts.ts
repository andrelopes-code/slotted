import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlTabs } from './tabs';
import type { TabsDismissReason, TabsSelectionReason } from './tabs';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is why `Enter`, `Space` and a pointer are told apart without a
 * key listener existing for activation.
 */
function activationReason(event: Event): TabsSelectionReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The list of tabs, and the one tab stop the family holds.
 *
 * It hands its element to the root, which owns the roving tab stop, the removal
 * focus and the overflow observer. `tabindex="-1"` is the last resort of the
 * removal focus: a list emptied by its final dismissal keeps focus rather than
 * returning it to the top of the page.
 *
 * Its accessible name is the consumer's own `aria-label` or `aria-labelledby`:
 * only the page knows what the set of views is for.
 */
@Directive({
  selector: '[slTabList]',
  standalone: true,
  exportAs: 'slTabList',
  host: {
    'data-part': 'list',
    'data-part-list': '',
    role: 'tablist',
    tabindex: '-1',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class SlTabList {
  private readonly tabs = inject(SlTabs);

  protected readonly ariaOrientation = computed(() =>
    this.tabs.resolvedOrientation() === 'vertical' ? 'vertical' : null,
  );

  constructor() {
    this.tabs.attachList(inject(ElementRef<HTMLElement>).nativeElement);
  }
}

/**
 * What precedes the label inside a tab, such as an icon. It stands beside the
 * words rather than inside them, so the tab's gap spaces it and only the words
 * are clipped under `fit="equal"`; the part sizes an icon to the tab's icon step.
 */
@Directive({
  selector: '[slTabStart]',
  standalone: true,
  exportAs: 'slTabStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlTabStart {}

/** What follows the label inside a tab, such as a count. */
@Directive({
  selector: '[slTabEnd]',
  standalone: true,
  exportAs: 'slTabEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlTabEnd {}

/**
 * One tab, in the box that holds it.
 *
 * The host is that box, and it is presentational because a `button` may not
 * contain a `button`: a dismissible tab needs somewhere to put its second
 * control.
 *
 * `href` makes the control an anchor, and a click carrying a modifier key is
 * left to the browser so a deep link still opens in a new browser tab.
 */
@Component({
  selector: '[slTab]',
  standalone: true,
  imports: [NgTemplateOutlet, SlGlyph, SlIcon],
  exportAs: 'slTab',
  /* The words and what stands beside them are written once and placed in
     whichever control the tab renders: a selecting `ng-content` repeated in
     both branches left the button branch without its icon and its count. */
  template: `<ng-template #content
      ><ng-content select="[slTabStart]" /><span data-part="label" data-part-label=""
        ><ng-content /></span
      ><ng-content select="[slTabEnd]"
    /></ng-template>
    @if (href(); as destination) {
      <a
        #control
        data-part="tab"
        data-part-tab=""
        role="tab"
        [attr.id]="tabId()"
        [attr.href]="destination"
        [attr.data-value]="value()"
        [attr.aria-controls]="panelId()"
        [attr.aria-selected]="selected()"
        [attr.aria-disabled]="resolvedDisabled() ? 'true' : null"
        [attr.aria-keyshortcuts]="dismissible() ? 'Delete' : null"
        [attr.tabindex]="selected() ? 0 : -1"
        (click)="onClick($event)"
        (keydown)="onKeydown($event)"
        ><ng-container [ngTemplateOutlet]="content"
      /></a>
    } @else {
      <button
        #control
        data-part="tab"
        data-part-tab=""
        role="tab"
        type="button"
        [attr.id]="tabId()"
        [attr.data-value]="value()"
        [attr.aria-controls]="panelId()"
        [attr.aria-selected]="selected()"
        [attr.aria-keyshortcuts]="dismissible() ? 'Delete' : null"
        [disabled]="resolvedDisabled()"
        [attr.tabindex]="selected() ? 0 : -1"
        (click)="onClick($event)"
        (keydown)="onKeydown($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }
    @if (dismissible()) {
      <button
        data-part="dismiss"
        data-part-dismiss=""
        type="button"
        tabindex="-1"
        [attr.aria-label]="dismissLabel()"
        [disabled]="resolvedDisabled()"
        (click)="onDismiss($event)"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'item',
    'data-part-item': '',
    role: 'presentation',
    '[attr.data-selected]': "selected() ? '' : null",
  },
})
export class SlTab {
  /** What this tab selects. It is what the family's value holds. */
  readonly value = input.required<string>();
  /** Unstated rather than `false`, so the tab defers to the family. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** Whether this tab carries a control that closes it. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** The accessible name of that control. Required whenever it is drawn. */
  readonly dismissLabel = input<string | undefined>(undefined);
  /** Makes the control an anchor, for a view a router can deep-link to. */
  readonly href = input<string | undefined>(undefined);
  /**
   * The id of the element this tab controls, when it is not a panel of this
   * family: a strip over one region whose content the value filters — a
   * feed, a table — names that region here, and `aria-controls` says so.
   */
  readonly controls = input<string | undefined>(undefined);

  /** The family this tab belongs to. Public, because a template may read it. */
  readonly tabs = inject(SlTabs);

  readonly selected = computed(() => this.tabs.holds(this.value()));
  /**
   * A family out of action takes every tab with it. The tab's own input can
   * only add to that, never subtract: a consumer that writes `[disabled]="false"`
   * on a tab inside a disabled family is saying nothing about that family, and a
   * template that binds an expression writes `false` where it means "not this
   * one" — which is how every tab stayed operable while the family reported
   * itself disabled.
   */
  readonly resolvedDisabled = computed(() => this.tabs.disabled() || (this.disabled() ?? false));

  protected readonly tabId = computed(() => this.tabs.identify(this.value()).tabId);
  protected readonly panelId = computed(
    () => this.controls() ?? this.tabs.identify(this.value()).panelId,
  );

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.resolvedDisabled()) return;
    /* A modifier click on a link is the reader asking the browser for a new
       window, and swallowing it is what turns a real destination into a
       decoration. */
    if (
      this.href() !== undefined &&
      (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }
    if (this.href() !== undefined) event.preventDefault();
    this.tabs.select(this.value(), activationReason(event), event);
  }

  /**
   * `Delete` closes the tab, which is the key the APG names for it. A held key
   * repeats, and a repeat would close the tab focus has just landed on.
   */
  protected onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.repeat) return;
    if (!this.dismissible() || this.resolvedDisabled()) return;
    if (event.key !== 'Delete') return;

    event.preventDefault();
    this.tabs.dismiss(this.value(), 'keyboard' satisfies TabsDismissReason, event);
  }

  protected onDismiss(event: MouseEvent) {
    /* The control sits inside the item, whose click would otherwise select the
       tab that is being closed. */
    event.stopPropagation();
    this.tabs.dismiss(this.value(), 'pointer', event);
  }
}

/**
 * The content of a panel, as a template the panel instantiates.
 *
 * Projected markup is built by the consumer's own view whether a panel shows it
 * or not: a component inside a closed panel is constructed, change-detected and
 * keeps its state, and only its DOM is detached. A template is what `mount` can
 * act on. Under `active` it is instantiated on selection and destroyed after,
 * under `lazy` it is instantiated on first selection and kept, under `eager` it
 * is instantiated up front. It is the shape of Angular Material's `matTabContent`.
 *
 * It must be a direct child of the panel, so a panel never takes the template of
 * a family nested inside it.
 */
@Directive({
  selector: 'ng-template[slTabPanelContent]',
  standalone: true,
})
export class SlTabPanelContent {
  readonly template = inject(TemplateRef);
}

/**
 * The content of one tab.
 *
 * It is in the page's tab sequence, which is where `Tab` from the list goes, and
 * it is hidden with the attribute rather than with a class: a screen reader,
 * find-in-page and `:target` all already understand `hidden`.
 *
 * The panel itself always exists, so every tab's `aria-controls` names an
 * element. Whether its content is in the DOM is what `mount` decides. Content
 * written inside `<ng-template slTabPanelContent>` is also only built when
 * `mount` says so; projected markup is built by the consumer's view regardless.
 */
@Component({
  selector: '[slTabPanel]',
  standalone: true,
  imports: [NgTemplateOutlet],
  exportAs: 'slTabPanel',
  template: `@if (present()) {
    @if (content(); as deferred) {
      <ng-container [ngTemplateOutlet]="deferred.template" />
    } @else {
      <ng-content />
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'panel',
    'data-part-panel': '',
    role: 'tabpanel',
    tabindex: '0',
    '[attr.id]': 'panelId()',
    '[attr.aria-labelledby]': 'tabId()',
    '[attr.hidden]': "selected() ? null : ''",
  },
})
export class SlTabPanel {
  /** The tab this panel belongs to. */
  readonly value = input.required<string>();

  private readonly tabs = inject(SlTabs);

  /** The deferred content, when the consumer wrote one. */
  protected readonly content = contentChild(SlTabPanelContent, { descendants: false });

  readonly selected = computed(() => this.tabs.holds(this.value()));

  protected readonly panelId = computed(() => this.tabs.identify(this.value()).panelId);
  protected readonly tabId = computed(() => this.tabs.identify(this.value()).tabId);
  protected readonly present = computed(() => {
    const mount = this.tabs.resolvedMount();
    if (mount === 'eager') return true;
    if (this.selected()) return true;
    return mount === 'lazy' && this.tabs.hasSeen(this.value());
  });
}

/**
 * The slot beside the list, on the same row.
 *
 * What belongs in it is a `toolbar`: one tab stop for however many actions the
 * page puts there, which is what keeps the distance between the tab list and the
 * panel to the two stops the pattern asks for.
 */
@Directive({
  selector: '[slTabActions]',
  standalone: true,
  exportAs: 'slTabActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlTabActions {}
