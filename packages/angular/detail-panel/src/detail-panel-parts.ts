import type { ChangeRequest } from '@slotted/core/state';
import { SlBadge } from '@slotted/angular/badge';
import { SlContainer } from '@slotted/angular/container';
import { SlPage } from '@slotted/angular/page';
import { SlPageHeaderTabs } from '@slotted/angular/page-header';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTags,
  SlSectionTitle,
} from '@slotted/angular/section';
import type { SectionLevel } from '@slotted/angular/section';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  HostAttributeToken,
  inject,
  input,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { SlDetailPanel } from './detail-panel';
import type { DetailPanelSectionReason } from './detail-panel-defaults';

/** How many placeholder lines a waiting section and a waiting aside draw. */
const SECTION_SKELETON_LINES = 3;
const ASIDE_SKELETON_LINES = 4;

/** An alert about the record, above the columns. */
@Directive({
  selector: '[slDetailPanelBanner]',
  standalone: true,
  host: { 'data-part': 'banner', 'data-part-banner': '' },
})
export class SlDetailPanelBanner {}

/** What stands in place of the columns when the record is not there: a result-state. */
@Directive({
  selector: '[slDetailPanelMessage]',
  standalone: true,
  host: { 'data-part': 'message', 'data-part-message': '' },
})
export class SlDetailPanelMessage {}

/**
 * The metadata column beside the sections. An `aside` element, named by
 * the `aside` message unless the consumer names it; while the panel is loading
 * it shows four short skeleton lines in place of its content.
 */
@Component({
  selector: 'aside[slDetailPanelAside]',
  standalone: true,
  exportAs: 'slDetailPanelAside',
  imports: [SlSkeletonText],
  template: `@if (panel.loading()) {
      <span slSkeletonText [lines]="lines" inlineSize="60%"></span>
    } @else {
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'aside',
    'data-part-aside': '',
    '[attr.aria-label]': 'name()',
  },
})
export class SlDetailPanelAside {
  protected readonly panel = inject(SlDetailPanel);
  protected readonly lines = ASIDE_SKELETON_LINES;
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly name = computed(() => this.written ?? this.panel.t('aside'));
}

/**
 * The row that stays at the bottom: an action-bar, aligned with the column
 * above through a container at the page's width and inset.
 */
@Component({
  selector: 'footer[slDetailPanelFooter]',
  standalone: true,
  exportAs: 'slDetailPanelFooter',
  imports: [SlContainer],
  template: `<div slContainer [size]="page?.resolvedWidth()" [inset]="page?.resolvedInset()">
    <ng-content />
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDetailPanelFooter {
  protected readonly page = inject(SlPage, { optional: true });
}

/**
 * The column under the header: a container at the page's width and inset,
 * so the columns align with the header's own; the banner above, the two
 * columns — the sections and the aside — and, when the record is not
 * there, the message in their place.
 *
 * The sections are the panel's `ng-template[slDetailPanelSection]`s,
 * rendered here in either shape: a tabpanel wired to the strip's tab, or a
 * `[slSection]` at the rank below the panel's. Rendering a template is what
 * lets `mount` and `loading` decide whether the consumer's view exists.
 */
@Component({
  selector: '[slDetailPanelBody]',
  standalone: true,
  exportAs: 'slDetailPanelBody',
  imports: [
    NgTemplateOutlet,
    SlBadge,
    SlContainer,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTags,
    SlSectionTitle,
    SlSkeletonText,
  ],
  template: `<div slContainer [size]="page?.resolvedWidth()" [inset]="page?.resolvedInset()">
    <ng-content select="[slDetailPanelBanner]" />
    @if (panel.status() === 'ready') {
      <div data-part="columns" data-part-columns="">
        <div data-part="main" data-part-main="">
          @for (section of panel.sections(); track section.name()) {
            @if (tabbed()) {
              <div
                data-part="section"
                data-part-section=""
                role="tabpanel"
                tabindex="0"
                [attr.id]="identity(section.name())?.panelId"
                [attr.aria-labelledby]="identity(section.name())?.tabId"
                [attr.data-name]="section.name()"
                [attr.data-current]="panel.current() === section.name() ? '' : null"
                [hidden]="panel.current() !== section.name()"
              >
                @if (section.actions(); as actions) {
                  <div data-part="section-actions" data-part-section-actions="">
                    <ng-container *ngTemplateOutlet="actions" />
                  </div>
                }
                @if (present(section.name())) {
                  @if (panel.loading()) {
                    <span slSkeletonText [lines]="lines"></span>
                  } @else {
                    <ng-container *ngTemplateOutlet="section.template" />
                  }
                }
              </div>
            } @else {
              <div
                data-part="section"
                data-part-section=""
                [attr.data-name]="section.name()"
                [attr.data-current]="panel.current() === section.name() ? '' : null"
              >
                <section slSection [level]="sectionLevel()" [size]="panel.resolvedSize()">
                  <div slSectionHeader>
                    <div slSectionTitle>
                      <div slSectionHeading>{{ section.label() }}</div>
                      @if (section.count() !== undefined) {
                        <div slSectionTags>
                          <span
                            slBadge
                            [count]="section.count()"
                            shape="pill"
                            size="sm"
                            tone="secondary"
                            variant="soft"
                          ></span>
                        </div>
                      }
                    </div>
                    @if (section.actions(); as actions) {
                      <div slSectionActions>
                        <ng-container *ngTemplateOutlet="actions" />
                      </div>
                    }
                  </div>
                  <div slSectionBody>
                    @if (panel.loading()) {
                      <span slSkeletonText [lines]="lines"></span>
                    } @else {
                      <ng-container *ngTemplateOutlet="section.template" />
                    }
                  </div>
                </section>
              </div>
            }
          }
        </div>
        @if (panel.resolvedAside() !== 'none' && aside() !== undefined) {
          <ng-content select="aside[slDetailPanelAside]" />
        }
      </div>
    } @else {
      <ng-content select="[slDetailPanelMessage]" />
    }
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlDetailPanelBody {
  protected readonly panel = inject(SlDetailPanel);
  protected readonly page = inject(SlPage, { optional: true });
  protected readonly aside = contentChild(SlDetailPanelAside);
  protected readonly lines = SECTION_SKELETON_LINES;

  protected readonly tabbed = computed(() => this.panel.resolvedLayout() === 'tabs');
  protected readonly sectionLevel = computed<SectionLevel>(
    () => String(Math.min(Number(this.panel.resolvedLevel()) + 1, 6)) as SectionLevel,
  );

  protected identity(name: string) {
    return this.panel.identify()?.(name);
  }

  /** Whether a tabbed section's content exists, by the mount axis. */
  protected present(name: string): boolean {
    const mount = this.panel.resolvedMount();
    if (mount === 'eager') return true;
    if (this.panel.current() === name) return true;
    return mount === 'lazy' && this.panel.hasSeen(name);
  }
}

/**
 * The strip: a `[slTabs]` list rendered from the panel's sections, placed
 * on the element in the page-header's tabs slot — `slPageHeaderTabs` is a
 * host directive, so the element is that slot. It holds the list alone; the
 * panels are the body's sections, wired by the ids this strip hands the
 * panel. A toolbar beside the list is the consumer's own `[slTabActions]`
 * element, projected into the strip. Under `layout="stacked"` it renders
 * nothing.
 */
@Component({
  selector: '[slDetailPanelTabs]',
  standalone: true,
  exportAs: 'slDetailPanelTabs',
  hostDirectives: [SlPageHeaderTabs],
  imports: [SlBadge, SlTab, SlTabList, SlTabs],
  template: `@if (panel.resolvedLayout() === 'tabs') {
    <div slTabs track="none" [value]="panel.current()" (valueChange)="forward($event)">
      <div slTabList [attr.aria-label]="label()">
        @for (section of panel.sections(); track section.name()) {
          <div slTab [value]="section.name()" [disabled]="section.disabled()">
            {{ section.label() }}&ngsp;
            @if (section.count() !== undefined) {
              <span
                slBadge
                [count]="section.count()"
                shape="pill"
                size="sm"
                tone="secondary"
                variant="soft"
              ></span>
            }
          </div>
        }
      </div>
      <ng-content select="[slTabActions]" />
    </div>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlDetailPanelTabs {
  /** The list's accessible name. */
  readonly label = input.required<string>();

  protected readonly panel = inject(SlDetailPanel);
  private readonly tabs = viewChild(SlTabs);

  constructor() {
    /* The strip hands the panel its ids, so the sections can be wired to the tabs. */
    effect((onCleanup) => {
      const tabs = this.tabs();
      untracked(() =>
        this.panel.identify.set(tabs === undefined ? undefined : (name) => tabs.identify(name)),
      );
      onCleanup(() => this.panel.identify.set(undefined));
    });
  }

  protected forward(request: ChangeRequest<string | undefined>) {
    if (request.value === undefined) return;
    this.panel.select(
      request.value,
      request.reason as DetailPanelSectionReason,
      request.source as Event | undefined,
    );
  }
}
