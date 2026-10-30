import { writeSelectorKey } from '@slotted/core/selector-key';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { CardFill, CardSize } from '@slotted/angular/card';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { injectSkeletonDefaults } from '@slotted/angular/skeleton';
import type { DashboardWidgetSpec } from '@slotted/core/dashboard-grid';
import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';

import { SlDashboardGridWords, SlDashboardWidgetHost } from './dashboard-grid-defaults';
import type { DashboardHeadingLevel, DashboardWidgetStatus } from './dashboard-grid-defaults';

const optionalNumber = (given: number | string | undefined) =>
  given === undefined ? undefined : numberAttribute(given);
const optionalBoolean = (given: boolean | string | undefined) =>
  given === undefined ? undefined : booleanAttribute(given);

/** Controls in the header's corner, before the detail action: `<button slDashboardWidgetActions>`. */
@Directive({ selector: '[slDashboardWidgetActions]', standalone: true })
export class SlDashboardWidgetActions {}

/**
 * The detail link the application writes — a router's link — in place of the
 * family's own: `<a slDashboardWidgetDetail routerLink="/revenue">`. It takes
 * the family's part, look, mark and name.
 */
@Component({
  selector: 'a[slDashboardWidgetDetail]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'button',
    'data-ui-button': '',
    'data-part': 'detail',
    'data-part-detail': '',
    'data-tone': 'secondary',
    'data-variant': 'ghost',
    'data-size': 'sm',
    'data-shape': 'square',
    '[attr.aria-label]': 'label ?? words.detailLabel(widget.title())',
  },
  template: `<span data-part="icon" data-part-icon="" aria-hidden="true"
    ><span slIcon directional><svg slGlyph name="external"></svg></span
  ></span>`,
})
export class SlDashboardWidgetDetail {
  protected readonly widget = inject(SlDashboardWidget);
  protected readonly words = inject(SlDashboardGridWords);
  protected readonly label = inject(new HostAttributeToken('aria-label'), { optional: true });
}

/** The skeleton of the body's own anatomy, shown while the widget loads. */
@Directive({ selector: '[slDashboardWidgetSkeleton]', standalone: true })
export class SlDashboardWidgetSkeleton {}

/** The action under the empty message: the one that creates the first entry. */
@Directive({ selector: '[slDashboardWidgetEmptyAction]', standalone: true })
export class SlDashboardWidgetEmptyAction {}

/** Content under the body. */
@Directive({ selector: '[slDashboardWidgetFooter]', standalone: true })
export class SlDashboardWidgetFooter {}

/**
 * Writes this family's part name on a control of another family. `slButton`
 * and `slIconButton` write `data-part="root"` as a static host attribute, and
 * `slMenuTriggerFor` binds the attribute to `null` on a lone trigger; both
 * erase the part the template wrote, so it is written back after the first
 * render. The erasing expressions are constants, so nothing writes over it
 * again.
 */
@Directive({ selector: '[slDashboardPart]', standalone: true })
export class SlDashboardPart {
  readonly part = input.required<string>({ alias: 'slDashboardPart' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => writeSelectorKey(this.host.nativeElement, 'part', this.part()));
  }
}

/**
 * One widget, declared. It draws nothing where it is written: its content is
 * kept in templates the grid renders inside its own `li` and card, in the
 * order the layout says — the way `mat-tab` hands its content to the tab
 * group. `value` is the widget's key in the layout.
 */
@Component({
  selector: 'sl-dashboard-widget',
  standalone: true,
  exportAs: 'slDashboardWidget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: none' },
  template: `
    <ng-template #body><ng-content /></ng-template>
    <ng-template #actions><ng-content select="[slDashboardWidgetActions]" /></ng-template>
    <ng-template #detailLink><ng-content select="[slDashboardWidgetDetail]" /></ng-template>
    <ng-template #skeleton><ng-content select="[slDashboardWidgetSkeleton]" /></ng-template>
    <ng-template #emptyAction><ng-content select="[slDashboardWidgetEmptyAction]" /></ng-template>
    <ng-template #footer><ng-content select="[slDashboardWidgetFooter]" /></ng-template>
  `,
})
export class SlDashboardWidget {
  readonly value = input.required<string>();
  /** The widget's name: its heading, its accessible name and its entry in Add widget. */
  readonly title = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly headingLevel = input<DashboardHeadingLevel | undefined>(undefined);

  readonly defaultColumns = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly defaultRows = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly minColumns = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly maxColumns = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly minRows = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly maxRows = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  /**
   * `auto` draws the widget as tall as its content, to a twelfth of a row's step, and the widgets
   * below rise or make room. At least one sub-row, or `minRows` when stated; at most `maxRows`.
   * The rows a move or a resize reads are the content's, rounded up to whole rows.
   */
  readonly rows = input<'auto' | undefined>(undefined);
  /** The sub-rows the content measures, written by the grid while `rows` is `auto`. */
  readonly contentSpan = signal<number | undefined>(undefined);
  readonly movable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly resizable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly removable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  /** The first answer has not arrived: the body shows a skeleton. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** A refresh of data already shown: the content stays and the region is busy. */
  readonly busy = input(false, { transform: booleanAttribute });
  readonly status = input<DashboardWidgetStatus>('ready');
  readonly emptyTitle = input<string | undefined>(undefined);
  readonly emptyDescription = input<string | undefined>(undefined);
  readonly errorTitle = input<string | undefined>(undefined);
  readonly errorDescription = input<string | undefined>(undefined);
  /** Draws Try again under the error message; `retry` fires when it is pressed. */
  readonly retryable = input(false, { transform: booleanAttribute });
  /** The widget's own page. */
  readonly detailHref = input<string | undefined>(undefined);
  /** Draws the detail action as a button; `detail` fires when it is pressed. */
  readonly detailable = input(false, { transform: booleanAttribute });
  readonly fill = input<CardFill | undefined>(undefined);
  readonly size = input<CardSize | undefined>(undefined);

  readonly retry = output<MouseEvent>();
  readonly detail = output<MouseEvent>();

  readonly bodyTemplate = viewChild.required<TemplateRef<unknown>>('body');
  readonly actionsTemplate = viewChild.required<TemplateRef<unknown>>('actions');
  readonly skeletonTemplate = viewChild.required<TemplateRef<unknown>>('skeleton');
  readonly emptyActionTemplate = viewChild.required<TemplateRef<unknown>>('emptyAction');
  readonly footerTemplate = viewChild.required<TemplateRef<unknown>>('footer');

  readonly hasActions = contentChild(SlDashboardWidgetActions);
  readonly hasDetail = contentChild(forwardRef(() => SlDashboardWidgetDetail));
  readonly detailTemplate = viewChild.required<TemplateRef<unknown>>('detailLink');

  readonly hasSkeleton = contentChild(SlDashboardWidgetSkeleton);
  readonly hasEmptyAction = contentChild(SlDashboardWidgetEmptyAction);
  readonly hasFooter = contentChild(SlDashboardWidgetFooter);

  /** Whether the skeleton is on screen: `loading` held back by the skeleton family's timing. */
  readonly painted = signal(false);

  private readonly skeletonDefaults = injectSkeletonDefaults();
  private visibility = initialLoadingVisibility;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const loading = this.loading();
      untracked(() => this.tick(loading));
    });
    const withdraw = inject(SlDashboardWidgetHost, { optional: true })?.declare(this);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      withdraw?.();
    });
  }

  /** What the grid's layout arithmetic reads. */
  spec(): DashboardWidgetSpec {
    const given = {
      defaultColumns: this.defaultColumns(),
      defaultRows: this.defaultRows(),
      minColumns: this.minColumns(),
      maxColumns: this.maxColumns(),
      minRows: this.minRows(),
      maxRows: this.maxRows(),
      contentSpan: this.rows() === 'auto' ? this.contentSpan() : undefined,
      movable: this.movable(),
      resizable: this.resizable(),
      removable: this.removable(),
    };
    return {
      key: this.value(),
      ...Object.fromEntries(Object.entries(given).filter(([, value]) => value !== undefined)),
    };
  }

  private tick(loading: boolean): void {
    const answer = nextLoadingVisibility({
      delay: this.skeletonDefaults.delay ?? 0,
      loading,
      minDuration: this.skeletonDefaults.minDuration ?? 0,
      now: Date.now(),
      state: this.visibility,
    });
    this.visibility = answer.state;
    this.painted.set(answer.state.visible);
    clearTimeout(this.timer);
    if (answer.wait !== null) {
      this.timer = setTimeout(() => this.tick(this.loading()), answer.wait);
    }
  }
}
