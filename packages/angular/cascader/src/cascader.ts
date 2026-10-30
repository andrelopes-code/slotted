import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
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
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import type { EmbeddedViewRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { cascaderFit, cascaderMeasure, pathTo } from '@slotted/core/cascader';
import type { CascaderCheckedStrategy, CascaderLayoutAxis } from '@slotted/core/cascader';
import type { TreeCollection } from '@slotted/core/collection';
import { cascaderMessages, type CascaderMessages, type PartialMessages } from '@slotted/core/i18n';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';

import { SlCascaderBody, SlCascaderNode } from './cascader-body';
import { injectCascaderDefaults } from './cascader-defaults';
import type {
  CascaderExpandOn,
  CascaderSelectionMode,
  CascaderSize,
  CascaderValue,
  CascaderVariant,
} from './cascader-defaults';
import { CascaderEngine } from './cascader-engine';
import type { CascaderLoadRequest, CascaderRoom, CascaderSelectable } from './cascader-engine';

let instances = 0;

const directionOf = (node: Element | null): 'ltr' | 'rtl' =>
  node !== null && node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl'
    ? 'rtl'
    : 'ltr';

/**
 * The inputs both hosts read. A base class rather than a mixin: the two
 * components declare the same hierarchy, the same state and the same axes, and
 * Angular reads inherited signal inputs.
 */
@Directive()
abstract class CascaderBase<T> {
  readonly nodes = input<readonly T[]>([]);
  readonly getKey = input.required<(node: T) => string>();
  readonly getLabel = input.required<(node: T) => string>();
  readonly getChildren = input<((node: T) => readonly T[] | undefined) | undefined>(undefined);
  readonly getParent = input<((node: T) => string | null | undefined) | undefined>(undefined);
  readonly hasChildren = input<((node: T) => boolean) | undefined>(undefined);
  readonly getChildrenCount = input<((node: T) => number | undefined) | undefined>(undefined);
  readonly isNodeDisabled = input<((node: T) => boolean) | undefined>(undefined);
  readonly isNodeLoading = input<((node: T) => boolean) | undefined>(undefined);
  readonly isNodeFailed = input<((node: T) => boolean) | undefined>(undefined);
  readonly getDescription = input<((node: T) => string | undefined) | undefined>(undefined);
  readonly filter = input<((node: T, query: string) => boolean) | undefined>(undefined);
  /** BCP 47, for the substring test and its marks. The language in force when absent. */
  readonly locale = input<string | undefined>(undefined);
  /** The roots are on their way: the first level waits as rows. */
  readonly loading = input(false, { transform: booleanAttribute });

  readonly selectionMode = input<CascaderSelectionMode | undefined>(undefined);
  readonly selectable = input<CascaderSelectable<T> | undefined>(undefined);
  readonly checkedStrategy = input<CascaderCheckedStrategy | undefined>(undefined);
  readonly layout = input<CascaderLayoutAxis | undefined>(undefined);
  readonly expandOn = input<CascaderExpandOn | undefined>(undefined);
  readonly search = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly size = input<CascaderSize | undefined>(undefined);
  readonly maxColumns = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly maxCrumbs = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly hoverDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly separator = input<string | undefined>(undefined);
  readonly readOnly = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * placeholder, the buttons, the search field, the breadcrumb, and the
   * sentences a level and a search say.
   */
  readonly messages = input<PartialMessages<CascaderMessages> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  readonly value = model<CascaderValue>(null);
  readonly path = model<readonly string[]>([]);
  readonly activeKey = model<string | null>(null);
  readonly expandedKeys = model<readonly string[]>([]);
  readonly searchValue = model('');

  readonly valueChangeRequest = output<ChangeRequest<CascaderValue>>();
  readonly pathChangeRequest = output<ChangeRequest<readonly string[]>>();
  readonly activeKeyChangeRequest = output<ChangeRequest<string | null>>();
  readonly expandedKeysChangeRequest = output<ChangeRequest<readonly string[]>>();
  readonly searchValueChangeRequest = output<ChangeRequest<string>>();
  /** A level that has not arrived is on show; the signal aborts if the reader moves on. */
  readonly loadChildren = output<CascaderLoadRequest>();
  /** The reader pressed retry on a level that failed. */
  readonly retry = output<string>();

  protected readonly nodeTemplate = contentChild(SlCascaderNode);
  protected readonly defaults = injectCascaderDefaults();
  protected readonly identifier = `sl-cascader-${(instances += 1)}`;
  protected readonly treeId = `${this.identifier}-tree`;
  protected readonly room = signal<CascaderRoom>({
    available: undefined,
    columnMeasure: 192,
    inset: 2,
  });

  /** The family's words in the language in force, with this instance's `messages` laid over them. */
  readonly t = injectMessages(cascaderMessages, this.messages);
  private readonly inForceLocale = injectLocale();
  /** The locale the search compares and marks in: the `locale` input, or the language in force. */
  protected readonly resolvedLocale = computed(() => this.locale() ?? this.inForceLocale());
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedSeparator = computed(
    () => this.separator() ?? this.defaults.separator,
  );
  protected readonly resolvedExpandOn = computed(() => this.expandOn() ?? this.defaults.expandOn);
  protected readonly resolvedHoverDelay = computed(
    () => this.hoverDelay() ?? this.defaults.hoverDelay,
  );
  protected abstract readonly readOnlyState: () => boolean;

  readonly engine: CascaderEngine<T> = new CascaderEngine<T>({
    nodes: this.nodes,
    getKey: this.getKey,
    getLabel: this.getLabel,
    getChildren: this.getChildren,
    getParent: this.getParent,
    hasChildren: this.hasChildren,
    getChildrenCount: this.getChildrenCount,
    isNodeDisabled: this.isNodeDisabled,
    isNodeLoading: this.isNodeLoading,
    isNodeFailed: this.isNodeFailed,
    filter: this.filter,
    locale: this.resolvedLocale,
    loading: this.loading,
    multiple: computed(() => (this.selectionMode() ?? this.defaults.selectionMode) === 'multiple'),
    selectable: computed(() => this.selectable() ?? this.defaults.selectable),
    checkedStrategy: computed(() => this.checkedStrategy() ?? this.defaults.checkedStrategy),
    layout: computed(() => this.layout() ?? this.defaults.layout),
    search: computed(() => this.search() ?? this.defaults.search),
    maxColumns: computed(() => this.maxColumns() ?? this.defaults.maxColumns),
    maxCrumbs: computed(() => this.maxCrumbs() ?? this.defaults.maxCrumbs),
    readOnly: computed(() => this.readOnlyState()),
    t: this.t,
    room: this.room,
    value: this.value,
    path: this.path,
    activeKey: this.activeKey,
    expandedKeys: this.expandedKeys,
    searchValue: this.searchValue,
    valueChangeRequest: this.valueChangeRequest,
    pathChangeRequest: this.pathChangeRequest,
    activeKeyChangeRequest: this.activeKeyChangeRequest,
    expandedKeysChangeRequest: this.expandedKeysChangeRequest,
    searchValueChangeRequest: this.searchValueChangeRequest,
    loadChildren: this.loadChildren,
  });

  protected readonly nodeId = (key: string) => `${this.identifier}-node-${encodeURIComponent(key)}`;

  private typeaheadHandle: TypeaheadHandle | null = createTypeahead({ timeout: 500 });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.engine.destroy();
      this.typeaheadHandle?.destroy();
      this.typeaheadHandle = null;
    });
  }

  /** Typeahead in the level the reader is on, when no field holds the characters. */
  protected typeahead(key: string, source: Event): boolean {
    const handle = this.typeaheadHandle;
    if (handle === null || !isPrintable(key, handle.query.length > 0)) return false;
    const engine = this.engine;
    const collection = engine.collection() as TreeCollection<unknown>;
    const active = engine.activeKey;
    const node = active === null ? undefined : collection.nodeFor(active);
    const siblings =
      engine.layout() === 'tree'
        ? (engine.view().columns[0]?.nodes.map((entry) => entry.key) ?? [])
        : node === undefined
          ? collection.roots
          : collection.siblingsOf(node.key);
    const labels = siblings.map((sibling) => collection.nodeFor(sibling)?.label ?? '');
    const index = handle.match(key, labels, active === null ? -1 : siblings.indexOf(active));
    const target = siblings[index];
    if (target !== undefined) engine.setActive(target, 'keyboard', source);
    return true;
  }

  protected scrollActive(container: HTMLElement | null) {
    const active = this.engine.activeKey;
    if (container === null || active === null) return;
    container.ownerDocument.getElementById(this.nodeId(active))?.scrollIntoView?.({
      block: 'nearest',
    });
  }
}

/**
 * A control that picks one place in a hierarchy, or several.
 *
 * The control is `sl-select`'s control; the popup is an `ng-template` built
 * into the portal as it opens, as `sl-select` builds its own, and holds a tree
 * drawn as columns, one level at a time, or an indented list.
 */
@Component({
  selector: 'sl-cascader',
  standalone: true,
  exportAs: 'slCascader',
  imports: [NgTemplateOutlet, SlCascaderBody, SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    '../../../styles/src/cascader/cascader.css',
    '../../../styles/src/tag/tag.css',
    '../../../styles/src/skeleton/skeleton.css',
    '../../../styles/src/spinner/spinner.css',
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlCascader), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlCascader), multi: true },
  ],
  host: {
    'data-ui': 'cascader',
    'data-ui-cascader': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-full-width]': "resolvedFullWidth() ? '' : null",
    '[attr.data-open]': "open() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-readonly]': "readOnlyState() ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() ? '' : null",
    '[attr.data-required]': "resolvedRequired() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
  },
  template: `
    <button
      #trigger
      type="button"
      role="combobox"
      data-part="trigger"
      data-part-trigger=""
      [attr.aria-haspopup]="engineSearch() ? 'dialog' : 'tree'"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? (engineSearch() ? contentId : treeId) : null"
      [attr.aria-activedescendant]="triggerActiveDescendant()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabel() === undefined ? (ariaLabelledBy() ?? null) : null"
      [attr.aria-readonly]="readOnlyState() ? true : null"
      [attr.aria-required]="resolvedRequired() ? true : null"
      [attr.aria-invalid]="resolvedInvalid() ? true : null"
      [disabled]="resolvedDisabled()"
      (click)="onTriggerClick($event)"
      (keydown)="onKey($event, false)"
      (blur)="onTouched()"
    >
      @if (engine.multiple) {
        <span data-part="value" data-part-value=""
          ><span data-part="summary" data-part-summary="">{{ summary() }}</span></span
        >
      } @else if (engine.emitted().length === 0) {
        <span data-part="placeholder" data-part-placeholder="">{{ t('placeholder') }}</span>
      } @else if (valueTemplate(); as template) {
        <span data-part="value" data-part-value="">
          <ng-container *ngTemplateOutlet="template; context: { $implicit: valuePath() }" />
        </span>
      } @else {
        <span data-part="value" data-part-value="">
          @for (segment of segments(); track segment.key) {
            @if (!$first) {
              <span data-part="value-separator" data-part-value-separator="" aria-hidden="true">{{
                resolvedSeparator()
              }}</span>
            }
            <span data-part="value-segment" data-part-value-segment="">{{ segment.label }}</span>
          }
        </span>
      }
    </button>

    @if (engine.multiple && engine.emitted().length > 0) {
      <span data-part="tags" data-part-tags="">
        @for (key of engine.emitted(); track key) {
          <span
            data-ui="tag"
            data-ui-tag=""
            data-part="root"
            data-part-root=""
            data-size="sm"
            data-variant="soft"
          >
            <span data-part="body" data-part-body=""
              ><span data-part="label" data-part-label="">{{ engine.labelOf(key) }}</span></span
            >
            <button
              type="button"
              data-part="remove"
              data-part-remove=""
              [disabled]="resolvedDisabled() || readOnlyState()"
              [attr.aria-label]="removeLabel(key)"
              (click)="onRemove(key, $event)"
            >
              <span slIcon><svg slGlyph name="x"></svg></span>
            </button>
          </span>
        }
      </span>
    }

    @if (showClear()) {
      <button
        type="button"
        data-part="clear"
        data-part-clear=""
        [attr.aria-label]="t('clear')"
        (click)="onClear($event)"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    }
    @if (loading()) {
      <span
        data-part="busy"
        data-part-busy=""
        data-ui="spinner"
        data-ui-spinner=""
        aria-hidden="true"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    } @else {
      <span data-part="arrow" data-part-arrow=""
        ><span slIcon><svg slGlyph name="chevron-down"></svg></span
      ></span>
    }
    @if (name(); as submission) {
      @for (key of engine.emitted(); track key) {
        <input type="hidden" [attr.name]="submission" [attr.form]="form() ?? null" [value]="key" />
      }
    }

    <ng-template #layer>
      <div
        data-ui="cascader"
        data-ui-cascader=""
        data-part="positioner"
        data-part-positioner=""
        [attr.data-layout]="engine.layout()"
        [attr.data-size]="resolvedSize()"
        [attr.data-selection]="engine.multiple ? 'multiple' : null"
        [attr.data-open]="open() && positioned() ? '' : null"
        [attr.inert]="open() ? null : ''"
      >
        <div
          data-part="content"
          data-part-content=""
          [id]="contentId"
          [attr.role]="engineSearch() ? 'dialog' : null"
          [attr.aria-label]="engineSearch() ? (ariaLabel() ?? t('search')) : null"
        >
          @if (engineSearch()) {
            <div data-part="search" data-part-search="">
              <span slIcon><svg slGlyph name="search"></svg></span>
              <input
                data-part="search-input"
                data-part-search-input=""
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                [attr.aria-controls]="treeId"
                [attr.aria-label]="t('search')"
                [attr.aria-activedescendant]="
                  engine.activeKey === null ? null : nodeId(engine.activeKey!)
                "
                [placeholder]="t('searchPlaceholder')"
                [value]="searchValue()"
                (input)="onSearchInput($event)"
                (keydown)="onKey($event, true)"
              />
            </div>
          }
          <sl-cascader-body
            [engine]="engine"
            [nodeId]="nodeId"
            [treeId]="treeId"
            [label]="ariaLabel()"
            [labelledBy]="ariaLabelledBy()"
            [separator]="resolvedSeparator()"
            [expandOn]="resolvedExpandOn()"
            [hoverDelay]="resolvedHoverDelay()"
            [nodeTemplate]="nodeTemplate()?.template"
            [getDescription]="getDescription()"
            [locale]="resolvedLocale()"
            (retry)="retry.emit($event)"
          />
        </div>
      </div>
    </ng-template>
  `,
})
export class SlCascader<T = unknown>
  extends CascaderBase<T>
  implements ControlValueAccessor, Validator
{
  readonly open = model(false);
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  readonly closeOnSelect = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly clearable = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly variant = input<CascaderVariant | undefined>(undefined);
  readonly fullWidth = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly portal = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly disabled = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly required = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly invalid = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly form = input<string | undefined>(undefined);
  /** The name the hidden inputs carry; a static `name` attribute is read before it is written over. */
  readonly name = input<string | undefined>(
    inject(new HostAttributeToken('name'), { optional: true }) ?? undefined,
  );
  /** The value's path as the control prints it, replacing the segments. */
  readonly valueTemplate = input<TemplateRef<{ $implicit: readonly T[] }> | undefined>(undefined);

  protected readonly contentId = `${this.identifier}-content`;
  private readonly disabledByForm = signal(false);
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? (this.disabledByForm() || this.defaults.disabled),
  );
  protected readonly readOnlyState = () => this.readOnly() ?? this.defaults.readOnly;
  protected readonly resolvedRequired = computed(() => this.required() ?? this.defaults.required);
  protected readonly resolvedInvalid = computed(() => this.invalid() ?? this.defaults.invalid);
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedFullWidth = computed(
    () => this.fullWidth() ?? this.defaults.fullWidth,
  );
  protected readonly engineSearch = computed(() => this.search() ?? this.defaults.search);
  protected readonly positioned = signal(false);

  protected readonly triggerActiveDescendant = computed(() =>
    this.open() && !this.engineSearch() && this.activeKey() !== null
      ? this.nodeId(this.activeKey() as string)
      : null,
  );

  protected readonly valuePath = computed(() => {
    const first = this.engine.emitted()[0];
    if (first === undefined || this.engine.multiple) return [];
    return pathTo(this.engine.collection() as TreeCollection<unknown>, first)
      .map((key) => this.engine.itemFor(key))
      .filter((item): item is T => item !== undefined);
  });

  protected readonly segments = computed(() => {
    const first = this.engine.emitted()[0];
    if (first === undefined) return [];
    const path = pathTo(this.engine.collection() as TreeCollection<unknown>, first);
    return path.length === 0
      ? [{ key: first, label: first }]
      : path.map((key) => ({ key, label: this.engine.labelOf(key) }));
  });

  protected readonly summary = computed(() => {
    const count = this.engine.emitted().length;
    return count === 0 ? '' : this.t('summary', { count });
  });

  protected readonly showClear = computed(
    () =>
      (this.clearable() ?? this.defaults.clearable) &&
      this.engine.emitted().length > 0 &&
      !this.resolvedDisabled() &&
      !this.readOnlyState(),
  );

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly template = viewChild.required<TemplateRef<unknown>>('layer');
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  private view: EmbeddedViewRef<unknown> | null = null;
  private portalRoot: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private layer: DismissableLayerHandle | null = null;
  private layerNode: HTMLElement | null = null;
  private onChange: (value: CascaderValue) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    super();
    this.engine.onCommitted = () => {
      this.setOpen(false, 'select');
      this.triggerRef().nativeElement.focus({ preventScroll: true });
    };

    /* The forms API hears every value the family commits. */
    this.valueChangeRequest.subscribe((request) => {
      queueMicrotask(() => {
        if (!request.cancelled) this.onChange(request.value);
      });
    });

    effect(() => {
      this.engine.closeOnSelect = this.closeOnSelect() ?? this.defaults.closeOnSelect;
    });

    let wasOpen = false;
    effect(() => {
      const open = this.open() && !this.resolvedDisabled();
      untracked(() => {
        if (open && !wasOpen) this.show();
        if (!open && wasOpen) this.hide();
        wasOpen = open;
      });
    });

    effect(() => {
      const showing = this.open();
      this.engine.view();
      untracked(() => this.engine.syncLoads(showing));
    });

    /* The widest the window can reach, reserved on the layer, so a path that
       grows never pushes the layer back across the screen. */
    afterRenderEffect(() => {
      const layout = this.engine.layout();
      const room = this.room();
      const maxColumns = this.maxColumns() ?? this.defaults.maxColumns;
      const node = this.layerNode;
      if (node === null) return;
      if (layout !== 'columns') {
        node.style.removeProperty('inline-size');
        return;
      }
      const fit = cascaderFit({ ...room, maxColumns });
      node.style.inlineSize = `${fit * room.columnMeasure + room.inset}px`;
    });

    afterRenderEffect(() => {
      void this.activeKey();
      this.scrollActive(this.layerNode);
    });

    inject(DestroyRef).onDestroy(() => this.teardown());
  }

  focus() {
    this.triggerRef().nativeElement.focus({ preventScroll: true });
  }

  /** Shows the level that holds the value, as opening does. */
  revealValue() {
    this.engine.reveal();
  }

  protected setOpen(next: boolean, reason: ChangeReason, source?: unknown) {
    if (next === this.open()) return;
    let cancelled = false;
    this.openChangeRequest.emit({
      value: next,
      previous: this.open(),
      reason,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel: () => {
        cancelled = true;
      },
    });
    if (!cancelled) this.open.set(next);
  }

  protected removeLabel(key: string) {
    return this.t('remove', { label: this.engine.labelOf(key) });
  }

  protected onTriggerClick(event: MouseEvent) {
    if (this.resolvedDisabled()) return;
    this.setOpen(!this.open(), event.detail === 0 ? 'keyboard' : 'pointer', event);
  }

  protected onRemove(key: string, event: MouseEvent) {
    this.engine.remove(key, event);
    this.focus();
  }

  protected onClear(event: MouseEvent) {
    this.engine.clear(event);
    this.focus();
  }

  protected onSearchInput(event: Event) {
    this.engine.setQuery((event.target as HTMLInputElement).value, 'keyboard', event);
  }

  protected onKey(event: KeyboardEvent, fromSearch: boolean) {
    if (this.resolvedDisabled()) return;
    if (event.key === 'Tab') {
      if (this.open()) this.setOpen(false, 'blur', event);
      return;
    }
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.setOpen(true, 'keyboard', event);
      }
      return;
    }
    if (event.key === 'Escape') return;
    if (!fromSearch && !this.engineSearch() && this.typeahead(event.key, event)) {
      event.preventDefault();
      return;
    }
    if (fromSearch && (event.key === 'Home' || event.key === 'End')) return;
    /* The field owns the characters, the space included. */
    if (fromSearch && (event.key === ' ' || isPrintable(event.key, false))) return;
    const action = this.engine.handleKey(
      event.key,
      event,
      directionOf(event.currentTarget as Element),
      true,
    );
    if (action.type !== 'none') event.preventDefault();
  }

  private show() {
    if (this.view === null) {
      this.portalRoot = createPortalRoot({
        origin: this.triggerRef().nativeElement,
        disabled: (this.portal() ?? this.defaults.portal) === false,
      });
      this.view = this.viewContainer.createEmbeddedView(this.template());
      this.view.detectChanges();
      this.layerNode =
        (this.view.rootNodes.find(
          (node: unknown): node is HTMLElement => node instanceof HTMLElement,
        ) as HTMLElement | undefined) ?? null;
      if (this.layerNode === null) return;
      this.portalRoot.container?.append(this.layerNode);
    }
    const node = this.layerNode;
    if (node === null) return;

    const surface = node.querySelector<HTMLElement>("[data-part='content']");
    if (surface !== null) {
      const measured = cascaderMeasure(surface);
      this.room.update((held) => ({ ...held, ...measured }));
    }

    this.engine.reveal();

    this.positioner = createPositioner(this.host, node, {
      align: 'start',
      side: 'bottom',
      sideOffset: 4,
      boundaryPadding: 8,
      matchWidth: this.engine.layout() !== 'columns',
      onPositioned: (position) => {
        if (this.room().available !== position.availableWidth) {
          this.room.update((held) => ({ ...held, available: position.availableWidth }));
        }
      },
    });
    /* `data-open` is written on the element in the task that opened the layer,
       with the position; the binding says it again on the next check. */
    void this.positioner.update().then(() => {
      if (this.open()) node.setAttribute('data-open', '');
      this.positioned.set(true);
    });

    this.layer = createDismissableLayer(node, {
      branches: [this.host],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (request) => {
        const source = request.source as Event | undefined;
        if (request.reason === 'escape' && this.engine.query !== '') {
          this.engine.setQuery('', 'clear', source);
          return;
        }
        this.setOpen(false, request.reason === 'escape' ? 'escape' : 'outsidePress', source);
        if (request.reason === 'escape') this.focus();
      },
    });

    if (this.engineSearch()) {
      queueMicrotask(() =>
        node.querySelector<HTMLInputElement>("[data-part='search-input']")?.focus({
          preventScroll: true,
        }),
      );
    }
  }

  private hide() {
    this.positioned.set(false);
    this.layer?.destroy();
    this.positioner?.destroy();
    this.layer = null;
    this.positioner = null;
    this.engine.setQuery('', 'clear');
    this.teardown();
  }

  private teardown() {
    this.layer?.destroy();
    this.positioner?.destroy();
    this.portalRoot?.release();
    this.layerNode?.remove();
    this.view?.destroy();
    this.layer = null;
    this.positioner = null;
    this.portalRoot = null;
    this.layerNode = null;
    this.view = null;
  }

  writeValue(value: CascaderValue) {
    this.value.set(value ?? (this.engine.multiple ? [] : null));
  }

  registerOnChange(fn: (value: CascaderValue) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabledByForm.set(isDisabled);
  }

  /**
   * The validity the family owns: nothing chosen while required, and a key the
   * collection cannot resolve — a value that names a node no longer there.
   */
  validate(): ValidationErrors | null {
    const keys = this.engine.emitted();
    if (this.resolvedRequired() && keys.length === 0) return { required: true };
    const collection = this.engine.collection();
    const unresolved =
      this.nodes().length === 0 ? [] : keys.filter((key) => collection.nodeFor(key) === undefined);
    return unresolved.length > 0 ? { unresolved } : null;
  }
}

/**
 * The same tree on the page, without a control or a layer: a settings screen
 * or a sidebar. The tree takes focus and carries `aria-activedescendant`.
 */
@Component({
  selector: 'sl-cascader-panel',
  standalone: true,
  exportAs: 'slCascaderPanel',
  imports: [SlCascaderBody],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    '../../../styles/src/cascader/cascader.css',
    '../../../styles/src/skeleton/skeleton.css',
    '../../../styles/src/spinner/spinner.css',
  ],
  host: {
    'data-ui': 'cascader',
    'data-ui-cascader': '',
    'data-part': 'content',
    'data-part-content': '',
    '[attr.data-layout]': 'engine.layout()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-selection]': "engine.multiple ? 'multiple' : null",
  },
  template: `
    <sl-cascader-body
      [engine]="engine"
      [nodeId]="nodeId"
      [treeId]="treeId"
      [focusable]="true"
      [label]="ariaLabel()"
      [labelledBy]="ariaLabelledBy()"
      [separator]="resolvedSeparator()"
      [expandOn]="resolvedExpandOn()"
      [hoverDelay]="resolvedHoverDelay()"
      [nodeTemplate]="nodeTemplate()?.template"
      [getDescription]="getDescription()"
      [locale]="resolvedLocale()"
      (retry)="retry.emit($event)"
      (treeKeydown)="onKey($event)"
    />
  `,
})
export class SlCascaderPanel<T = unknown> extends CascaderBase<T> {
  protected readonly readOnlyState = () => this.readOnly() ?? this.defaults.readOnly;
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    super();
    effect(() => {
      this.engine.view();
      untracked(() => this.engine.syncLoads(true));
    });

    afterRenderEffect(() => {
      const measured = cascaderMeasure(this.host);
      const available = (this.host.parentElement ?? this.host).getBoundingClientRect().width;
      const held = this.room();
      if (
        held.available !== available ||
        held.columnMeasure !== measured.columnMeasure ||
        held.inset !== measured.inset
      ) {
        this.room.set({ available, ...measured });
      }
    });

    let revealed = false;
    afterRenderEffect(() => {
      if (revealed) return;
      revealed = true;
      if (untracked(() => this.activeKey()) === null) untracked(() => this.engine.reveal());
    });

    afterRenderEffect(() => {
      void this.activeKey();
      this.scrollActive(this.host);
    });

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        const available = (this.host.parentElement ?? this.host).getBoundingClientRect().width;
        if (this.room().available !== available) {
          this.room.update((room) => ({ ...room, available }));
        }
      });
      queueMicrotask(() => observer.observe(this.host.parentElement ?? this.host));
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  protected onKey(event: KeyboardEvent) {
    if (this.typeahead(event.key, event)) {
      event.preventDefault();
      return;
    }
    const action = this.engine.handleKey(
      event.key,
      event,
      directionOf(event.currentTarget as Element),
      true,
    );
    if (action.type !== 'none' && action.type !== 'close') event.preventDefault();
  }
}
