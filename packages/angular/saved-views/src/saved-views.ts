import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import type { MenuSelectEvent } from '@slotted/angular/menu';
import {
  SlPopover,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import {
  BUILT_IN_VIEW_ID,
  emptySavedViews,
  isViewNameTaken,
  parseGridView,
  sameSavedView,
  savedViewText,
  serializeSavedViews,
  withActiveView,
  withDefaultView,
  withViewCreated,
  withViewDeleted,
  withViewRenamed,
  withViewSaved,
  type GridColumn,
  type GridView,
  type SavedView,
  type SavedViewsState,
} from '@slotted/core/grid';
import {
  type PartialMessages,
  savedViewsMessages,
  type SavedViewsMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeRequest } from '@slotted/core/state';

import {
  newSavedViewId,
  SlSavedViewsIdFactory,
  type SavedViewApply,
  type SavedViewsAction,
  type SavedViewsOpenReason,
  type SavedViewsReason,
  type SavedViewsRequest,
} from './saved-views-defaults';

/** What replaces a row, or opens above the footer. */
type Editing =
  { kind: 'create' } | { kind: 'rename'; id: string } | { kind: 'delete'; id: string } | null;

/** Where focus goes after the render a change causes. */
type FocusTarget =
  | { id: string; part: 'apply' | 'actions' | 'input' | 'cancel' }
  | { id: null; part: 'input' | 'save-as' | 'trigger' };

/** One row of the list: the built-in view has no id and no saved view. */
interface Row {
  readonly id: string | null;
  readonly key: string;
  readonly name: string;
  readonly view: SavedView | null;
  readonly current: boolean;
  readonly isDefault: boolean;
}

/**
 * `slMenuTriggerFor` binds `[attr.data-part]` and resolves it to `null` on a
 * trigger that is neither a bar's item nor a submenu's; a host binding of
 * `null` removes the part the template wrote. The part is written back after
 * the first change detection, where the constant binding is not applied again.
 */
@Directive({ selector: '[slSavedViewsPart]', standalone: true })
export class SlSavedViewsPart {
  readonly slSavedViewsPart = input.required<string>();

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => writeSelectorKey(element, 'part', this.slSavedViewsPart()));
  }
}

/**
 * The named views of a grid, and the one in use: a trigger naming it, a mark
 * and a revert while the grid differs from it, and a popover listing every
 * view with its actions. The family applies nothing to a grid — it asks with
 * `stateChangeRequest` and hands the consumer the view to write through
 * `viewApply`.
 */
@Component({
  selector: 'sl-saved-views',
  standalone: true,
  exportAs: 'slSavedViews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../../../styles/src/saved-views/saved-views.css',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
    SlPopover,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
    SlSavedViewsPart,
    SlTextField,
    SlTextFieldInput,
  ],
  host: {
    'data-ui': 'saved-views',
    'data-ui-saved-views': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role',
    '[attr.aria-label]': 'resolvedLabel()',
    '[attr.data-modified]': 'modified() ? "" : null',
    '[attr.data-open]': 'isOpen() ? "" : null',
  },
  template: `
    <ng-container
      slPopover
      initialFocus="[aria-current='true']"
      [open]="isOpen()"
      (openChangeRequest)="onLayerRequest($event)"
    >
      <button
        #trigger
        slPopoverTrigger
        type="button"
        data-part="trigger"
        data-part-trigger=""
        [attr.title]="activeName()"
      >
        <span data-label>{{ activeName() }}</span>
        @if (modified()) {
          <span data-part="modified" data-part-modified="">{{ t('modified') }}</span>
        }
        <span slIcon size="md"><svg slGlyph name="chevron-down"></svg></span>
      </button>

      <ng-template slPopoverLayer>
        <div slPopoverContent [attr.aria-label]="resolvedLabel()">
          <!-- The family's identifier is on its own element rather than on
               the popover's: slPopoverContent names its own part. -->
          <div
            data-ui="saved-views"
            data-ui-saved-views=""
            data-part="panel"
            data-part-panel=""
            [id]="panelId"
          >
            <ul data-part="list" data-part-list="" role="list">
              @for (row of rows(); track row.key) {
                <li
                  data-part="item"
                  data-part-item=""
                  [attr.data-view]="row.key"
                  [attr.data-current]="row.current ? '' : null"
                  [attr.data-default]="row.isDefault ? '' : null"
                  [attr.data-built-in]="row.view === null ? '' : null"
                  [attr.data-editing]="editingKind(row) !== null ? '' : null"
                >
                  @switch (editingKind(row)) {
                    @case ('rename') {
                      <ng-container
                        [ngTemplateOutlet]="nameForm"
                        [ngTemplateOutletContext]="{ kind: 'rename', name: row.name }"
                      />
                    }
                    @case ('delete') {
                      <div
                        data-part="confirm"
                        data-part-confirm=""
                        role="group"
                        [attr.aria-labelledby]="panelId + '-confirm-' + row.key"
                      >
                        <p [id]="panelId + '-confirm-' + row.key">
                          {{ t('confirmDelete', { name: row.name }) }}
                        </p>
                        <div data-buttons>
                          <button
                            slButton
                            data-cancel
                            size="sm"
                            tone="secondary"
                            variant="ghost"
                            (click)="cancelEditing()"
                          >
                            {{ t('cancel') }}
                          </button>
                          <button
                            slButton
                            size="sm"
                            tone="danger"
                            (click)="confirmDelete(row.key, $event)"
                          >
                            {{ t('delete') }}
                          </button>
                        </div>
                      </div>
                    }
                    @default {
                      <button
                        data-part="apply"
                        data-part-apply=""
                        type="button"
                        [attr.aria-current]="row.current ? 'true' : null"
                        (click)="apply(row.id, pressReason($event), $event)"
                      >
                        @if (row.current) {
                          <span slIcon size="sm"><svg slGlyph name="check"></svg></span>
                        }
                        <span data-label>{{ row.name }}</span>
                        @if (row.isDefault) {
                          <span data-part="default-mark" data-part-default-mark=""
                            ><span slIcon size="sm"><svg slGlyph name="pin"></svg></span
                            ><span>{{ t('isDefault') }}</span></span
                          >
                        }
                      </button>
                      <button
                        type="button"
                        data-part="actions"
                        data-part-actions=""
                        slSavedViewsPart="actions"
                        [slMenuTriggerFor]="menu"
                        [attr.aria-label]="t('actions', { name: row.name })"
                      >
                        <span slIcon size="md"><svg slGlyph name="ellipsis"></svg></span>
                      </button>
                      <sl-menu #menu>
                        @if (row.view; as view) {
                          <button slMenuItem (select)="startRename(view)">
                            {{ t('rename') }}
                          </button>
                        }
                        <button
                          slMenuItem
                          [disabled]="row.isDefault"
                          (select)="setDefault(row.id, $event)"
                        >
                          {{ t('setDefault') }}
                        </button>
                        @if (row.view; as view) {
                          <button slMenuItem tone="danger" (select)="startDelete(view)">
                            {{ t('delete') }}
                          </button>
                        }
                      </sl-menu>
                    }
                  }
                </li>
              }
            </ul>
            @if (editing()?.kind === 'create') {
              <ng-container
                [ngTemplateOutlet]="nameForm"
                [ngTemplateOutletContext]="{ kind: 'create', name: '' }"
              />
            }
            <div data-part="footer" data-part-footer="">
              <button
                slButton
                data-save-as
                size="sm"
                tone="secondary"
                variant="ghost"
                (click)="startCreate()"
              >
                {{ t('saveAs') }}
              </button>
              <button slButton size="sm" [disabled]="!canSave()" (click)="save($event)">
                {{ t('save') }}
              </button>
            </div>
          </div>
        </div>
      </ng-template>
    </ng-container>

    @if (modified()) {
      <button data-part="revert" data-part-revert="" type="button" (click)="revert($event)">
        <!-- An arrow that turns back turns the other way in a right-to-left document. -->
        <span slIcon size="sm" directional><svg slGlyph name="rotate-ccw"></svg></span>
        {{ t('revert') }}
      </button>
    }

    <ng-template #nameForm let-kind="kind" let-name="name">
      <form
        data-part="form"
        data-part-form=""
        novalidate
        [attr.aria-label]="kind === 'create' ? t('saveAs') : t('renameView', { name: name })"
        (submit)="submit($event)"
      >
        <div slField size="sm" [invalid]="error() !== null">
          <label slFieldLabel>{{ t('name') }}</label>
          <div slTextField size="sm">
            <input
              slTextFieldInput
              autocomplete="off"
              [value]="draft()"
              (valueChange)="onDraft($event.value)"
            />
          </div>
          @if (error(); as reason) {
            <span slFieldError>{{ reason === 'empty' ? t('empty') : t('duplicate') }}</span>
          }
        </div>
        <div data-buttons>
          <button
            slButton
            data-cancel
            size="sm"
            tone="secondary"
            variant="ghost"
            (click)="cancelEditing()"
          >
            {{ t('cancel') }}
          </button>
          <button slButton type="submit" size="sm">
            {{ kind === 'create' ? t('create') : t('rename') }}
          </button>
        </div>
      </form>
    </ng-template>
  `,
})
export class SlSavedViews {
  /** The view the grid shows now. */
  readonly current = input.required<GridView>();
  /** The built-in view: the application's defaults. */
  readonly builtIn = input.required<GridView>();
  /** The model, so a view is serialized and compared against the columns it names. */
  readonly columns = input<readonly GridColumn<never>[] | undefined>(undefined);
  /** The views. Two-way, so a template may bind it directly; cancel the request to hold it. */
  readonly state = model<SavedViewsState | undefined>(undefined);
  /** The views an unbound instance starts from. */
  readonly defaultState = input<SavedViewsState | undefined>(undefined);
  /** Whether the layer is open. Two-way. */
  readonly open = model<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * group's and the panel's name (`label`), the controls, the forms and the
   * announcements. A host `aria-label` names both instead.
   */
  readonly messages = input<PartialMessages<SavedViewsMessages> | undefined>(undefined);

  /** Every change to the views, carrying the action and the reason; cancellable. */
  readonly stateChangeRequest = output<SavedViewsRequest>();
  /** One output for one transition of the layer. */
  readonly openChangeRequest = output<ChangeRequest<boolean>>();
  /** After apply and revert: the view to write into the grid. */
  readonly viewApply = output<SavedViewApply>();

  private readonly injector = inject(Injector);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly role = inject(new HostAttributeToken('role'), { optional: true }) ?? 'group';
  protected readonly writtenLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });
  readonly panelId = `${inject(SlSavedViewsIdFactory).next()}-panel`;

  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly editing = signal<Editing>(null);
  protected readonly draft = signal('');
  protected readonly error = signal<'empty' | 'duplicate' | null>(null);

  /** The family's words in the language in force, with this control's `messages` laid over them. */
  readonly t = injectMessages(savedViewsMessages, this.messages);
  readonly resolvedLabel = computed(() => this.writtenLabel ?? this.t('label'));
  readonly resolvedState = computed<SavedViewsState>(
    () => this.state() ?? this.defaultState() ?? emptySavedViews(),
  );
  readonly isOpen = computed(() => this.open() ?? this.defaultOpen());
  readonly active = computed(() => {
    const state = this.resolvedState();
    return state.views.find((view) => view.id === state.activeId) ?? null;
  });
  readonly activeView = computed<GridView>(() => {
    const active = this.active();
    return active ? parseGridView(active.view, this.columns()) : this.builtIn();
  });
  readonly modified = computed(
    () => !sameSavedView(this.current(), this.activeView(), this.columns()),
  );
  readonly activeName = computed(() => this.active()?.name ?? this.t('builtIn'));
  readonly canSave = computed(() => this.active() !== null && this.modified());
  readonly rows = computed<readonly Row[]>(() => {
    const state = this.resolvedState();
    return [
      {
        id: null,
        key: BUILT_IN_VIEW_ID,
        name: this.t('builtIn'),
        view: null,
        current: state.activeId === null,
        isDefault: state.defaultId === null,
      },
      ...state.views.map((view) => ({
        id: view.id,
        key: view.id,
        name: view.name,
        view,
        current: state.activeId === view.id,
        isDefault: state.defaultId === view.id,
      })),
    ];
  });

  /** A click the keyboard produced has no pointer detail. */
  protected pressReason(event: MouseEvent): 'pointer' | 'keyboard' {
    return event.detail === 0 ? 'keyboard' : 'pointer';
  }

  protected editingKind(row: Row): 'rename' | 'delete' | null {
    const editing = this.editing();
    if (editing === null || editing.kind === 'create' || editing.id !== row.id) return null;
    return editing.kind;
  }

  /** Opens the layer, carrying `programmatic`. */
  show() {
    this.setOpen(true, 'programmatic');
  }

  /** Closes the layer, carrying `programmatic`. */
  hide() {
    this.setOpen(false, 'programmatic');
  }

  /** Moves focus to the trigger. */
  focus() {
    this.triggerRef().nativeElement.focus();
  }

  /** Applies a view by id — `null` is the built-in view — carrying the reason. */
  apply(id: string | null, reason: SavedViewsReason = 'programmatic', source?: Event) {
    const state = this.resolvedState();
    const target = id === null ? null : (state.views.find((view) => view.id === id) ?? null);
    if (id !== null && target === null) return;
    const request = this.request(withActiveView(state, id), 'apply', reason, source);
    if (request === null) return;
    const view = target ? parseGridView(target.view, this.columns()) : this.builtIn();
    this.viewApply.emit({ view, request });
    this.announce(this.t('applied', { name: target?.name ?? this.t('builtIn') }));
    this.setOpen(
      false,
      reason === 'keyboard' || reason === 'pointer' ? reason : 'programmatic',
      source,
    );
  }

  protected revert(event: MouseEvent) {
    const request = this.request(this.resolvedState(), 'revert', this.pressReason(event), event);
    if (request === null) return;
    this.viewApply.emit({ view: this.activeView(), request });
    this.announce(this.t('applied', { name: this.activeName() }));
    this.focusAfterRender({ id: null, part: 'trigger' });
  }

  protected save(event: MouseEvent) {
    const active = this.active();
    if (active === null || !this.modified()) return;
    const reason = this.pressReason(event);
    const next = withViewSaved(
      this.resolvedState(),
      active.id,
      savedViewText(this.current(), this.columns()),
    );
    if (this.request(next, 'save', reason, event) === null) return;
    this.announce(this.t('saved', { name: active.name }));
    this.setOpen(false, reason, event);
  }

  protected setDefault(id: string | null, event: MenuSelectEvent) {
    const state = this.resolvedState();
    const request = this.request(withDefaultView(state, id), 'default', event.reason, event.source);
    if (request === null) return;
    const name = state.views.find((view) => view.id === id)?.name ?? this.t('builtIn');
    this.announce(this.t('defaultChanged', { name }));
  }

  protected startCreate() {
    this.editing.set({ kind: 'create' });
    this.draft.set('');
    this.error.set(null);
    this.focusAfterRender({ id: null, part: 'input' });
  }

  protected startRename(view: SavedView) {
    this.editing.set({ kind: 'rename', id: view.id });
    this.draft.set(view.name);
    this.error.set(null);
    this.focusAfterRender({ id: view.id, part: 'input' });
  }

  protected startDelete(view: SavedView) {
    this.editing.set({ kind: 'delete', id: view.id });
    this.error.set(null);
    this.focusAfterRender({ id: view.id, part: 'cancel' });
  }

  /** Cancelling returns focus to the control that opened the form. */
  protected cancelEditing() {
    const was = this.editing();
    this.closeForms();
    if (was === null) return;
    this.focusAfterRender(
      was.kind === 'create' ? { id: null, part: 'save-as' } : { id: was.id, part: 'actions' },
    );
  }

  protected onDraft(value: string | undefined) {
    this.draft.set(value ?? '');
    this.error.set(null);
  }

  protected submit(event: Event) {
    event.preventDefault();
    const editing = this.editing();
    if (editing === null || editing.kind === 'delete') return;
    const state = this.resolvedState();
    const name = this.draft().trim();
    const except = editing.kind === 'rename' ? editing.id : null;
    const builtIn = this.t('builtIn').trim().toLocaleLowerCase();
    if (name === '') this.error.set('empty');
    else if (isViewNameTaken(state, name, except) || name.toLocaleLowerCase() === builtIn) {
      this.error.set('duplicate');
    }
    if (this.error() !== null) {
      this.focusAfterRender({ id: except, part: 'input' } as FocusTarget);
      return;
    }
    if (editing.kind === 'create') {
      const id = newSavedViewId();
      const next = withViewCreated(state, name, savedViewText(this.current(), this.columns()), id);
      if (this.request(next, 'create', 'submit', event) === null) return;
      this.announce(this.t('saved', { name }));
      this.closeForms();
      this.focusAfterRender({ id, part: 'apply' });
      return;
    }
    if (
      this.request(withViewRenamed(state, editing.id, name), 'rename', 'submit', event) === null
    ) {
      return;
    }
    this.announce(this.t('renamed', { name }));
    this.closeForms();
    this.focusAfterRender({ id: editing.id, part: 'apply' });
  }

  protected confirmDelete(id: string, event: MouseEvent) {
    const state = this.resolvedState();
    const index = state.views.findIndex((view) => view.id === id);
    const view = state.views[index];
    if (view === undefined) return;
    if (this.request(withViewDeleted(state, id), 'delete', 'remove', event) === null) return;
    this.announce(this.t('deleted', { name: view.name }));
    this.closeForms();
    this.focusAfterRender({ id: state.views[index - 1]?.id ?? BUILT_IN_VIEW_ID, part: 'apply' });
  }

  /**
   * The dismissable layer asks in the capture phase. The popover's own move is
   * always refused here and replayed as this family's request, so the layer
   * follows one open state; a form open inside is cancelled first and the
   * close is refused.
   */
  protected onLayerRequest(request: ChangeRequest<boolean>) {
    request.cancel();
    if (!request.value && request.reason === 'escape' && this.editing() !== null) {
      this.cancelEditing();
      return;
    }
    this.setOpen(
      request.value,
      request.reason as SavedViewsOpenReason,
      request.source as Event | undefined,
    );
  }

  private setOpen(next: boolean, reason: SavedViewsOpenReason, source?: Event) {
    if (next === this.isOpen()) return;
    let cancelled = false;
    const request: ChangeRequest<boolean> = {
      value: next,
      previous: !next,
      reason,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    };
    this.openChangeRequest.emit(request);
    if (cancelled) return;
    this.open.set(next);
    if (!next) this.closeForms();
  }

  /** Asks for a new state. Not emitted when nothing would change; refused when cancelled. */
  private request(
    next: SavedViewsState,
    action: SavedViewsAction,
    reason: SavedViewsReason,
    source?: Event,
  ): SavedViewsRequest | null {
    const previous = this.resolvedState();
    let cancelled = false;
    const request: SavedViewsRequest = {
      value: next,
      previous,
      reason,
      action,
      source,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    };
    if (serializeSavedViews(next) === serializeSavedViews(previous)) return request;
    this.stateChangeRequest.emit(request);
    if (cancelled) return null;
    this.state.set(next);
    return request;
  }

  private closeForms() {
    this.editing.set(null);
    this.draft.set('');
    this.error.set(null);
  }

  private announce(text: string) {
    getLiveAnnouncer(this.host.ownerDocument).announce(text);
  }

  private focusAfterRender(target: FocusTarget) {
    afterNextRender(
      () => {
        if (target.part === 'trigger') {
          this.focus();
          return;
        }
        const panel = this.host.ownerDocument.getElementById(this.panelId);
        if (panel === null) return;
        const scope =
          target.id === null
            ? panel
            : ([...panel.querySelectorAll<HTMLElement>('[data-part="item"]')].find(
                (item) => item.dataset['view'] === target.id,
              ) ?? null);
        const selector = {
          apply: '[data-part="apply"]',
          actions: '[data-part="actions"]',
          input: target.id === null ? ':scope > [data-part="form"] input' : 'input',
          cancel: '[data-cancel]',
          'save-as': '[data-save-as]',
        }[target.part];
        scope?.querySelector<HTMLElement>(selector)?.focus();
      },
      { injector: this.injector },
    );
  }
}
