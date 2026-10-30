import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlColumnManager,
  SlColumnManagerTrigger,
  type ColumnManagerRequest,
} from '@slotted/angular/column-manager';
import type { DataGridColumnStateRequest } from '@slotted/angular/data-grid';
import { SlInline } from '@slotted/angular/inline';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { SlSavedViews } from '@slotted/angular/saved-views';
import {
  SlSegment,
  SlSegmentedControl,
  SlSegmentIcon,
} from '@slotted/angular/segmented-control';
import { SlToastService, type ToastContent, type ToastMessage } from '@slotted/angular/toast';
import type { ChangeRequest } from '@slotted/core/state';
import {
  withColumnHidden,
  type GridColumn,
  type GridDensity,
  type GridOutOfSpace,
} from '@slotted/core/grid';

import { phoneSignal } from '../../core/layout/phone';
import { PreferencesStore } from '../../core/session/preferences.store';
import type { ListView } from './list-view';

const DENSITIES: readonly GridDensity[] = ['comfortable', 'compact', 'dense'];
const NONE_OUT: GridOutOfSpace = { popin: [], hidden: [] };

/**
 * What acts on a list's view, in the filter bar's `end` slot (LP-02): the
 * saved views, the column manager with its trigger, and the grid's density.
 * The page hands the grid's column requests here too, so a hidden column is
 * answered with one Undo whether the grid's menu or the manager hid it.
 *
 * While columns ride in the rows' pop-in their headers are gone, and with them
 * the header press that sorts: the Sort menu holds one item per sortable
 * column, which moves it through the order as `Shift` and a header press do,
 * and hands the order to the page's query.
 *
 * `column-manager` is a popover beside its trigger at the desk and a drawer on
 * a phone, where a popover of a dozen rows would cover the list it arranges.
 */
@Component({
  selector: 'app-list-view-tools',
  imports: [
    NgIcon,
    SlButton,
    SlColumnManager,
    SlColumnManagerTrigger,
    SlInline,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
    SlSavedViews,
    SlSegment,
    SlSegmentedControl,
    SlSegmentIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slInline [gap]="2">
      <ng-content />
      @if (outOfSpace().popin.length > 0) {
        <button
          slButton
          data-testid="sort-trigger"
          variant="outline"
          tone="secondary"
          type="button"
          [slMenuTriggerFor]="sortMenu"
        >
          Sort
        </button>
        <sl-menu #sortMenu>
          <sl-menu-group label="Sort by">
            @for (entry of sortEntries(); track entry.column.id) {
              <button
                slMenuCheckboxItem
                [checked]="entry.key !== null"
                [attr.aria-label]="entry.name"
                (checkedChangeRequest)="press(entry.column.id, $event)"
              >
                {{ entry.column.label }}
                @if (entry.mark) {
                  <span aria-hidden="true">{{ entry.mark }}</span>
                }
              </button>
            }
          </sl-menu-group>
          <hr slMenuSeparator />
          <button slMenuItem [disabled]="sort().length === 0" (select)="view().clearSort()">
            Clear sort
          </button>
        </sl-menu>
      }
      <sl-saved-views
        data-testid="saved-views"
        [messages]="{ label: label() + ' views' }"
        [current]="view().current()"
        [builtIn]="view().builtIn"
        [columns]="columns()"
        [state]="view().saved()"
        (stateChangeRequest)="view().saved.set($event.value)"
        (viewApply)="view().apply($event.view)"
      />
      <button
        slButton
        slColumnManagerTrigger
        data-testid="columns-trigger"
        variant="outline"
        tone="secondary"
        type="button"
        [slColumnManagerTriggerFor]="manager"
      >
        Columns
      </button>
      <sl-column-manager
        #manager="slColumnManager"
        [columns]="columns()"
        [columnState]="view().columnState()"
        (columnStateChangeRequest)="arrange($event)"
        [defaultColumnState]="view().defaultColumnState"
        [outOfSpace]="outOfSpace()"
        [presentation]="phone() ? 'drawer' : 'popover'"
      />
<!--
        On a coarse pointer the theme raises every density's rows to the touch
        target, so the control would change nothing a finger can see (LP-11).
      -->
      @if (!coarse()) {
            <div
        slSegmentedControl
        data-testid="density"
        aria-label="Row density"
        [value]="density()"
        (valueChange)="setDensity($event.value)"
      >
        <label slSegment value="comfortable" aria-label="Comfortable rows">
          <ng-icon slSegmentIcon name="lucideRows2" />
        </label>
        <label slSegment value="compact" aria-label="Compact rows">
          <ng-icon slSegmentIcon name="lucideRows3" />
        </label>
        <label slSegment value="dense" aria-label="Dense rows">
          <ng-icon slSegmentIcon name="lucideRows4" />
        </label>
      </div>
      }
    </div>
    <ng-template #undo let-message>
      <button
        slButton
        data-testid="undo-hide"
        size="sm"
        variant="outline"
        tone="secondary"
        type="button"
        (click)="restore(message)"
      >
        Undo
      </button>
    </ng-template>
  `,
})
export class ListViewTools {
  private readonly toasts = inject(SlToastService);
  private readonly preferences = inject(PreferencesStore);

  readonly view = input.required<ListView>();
  /** The columns the grid is given now. */
  readonly columns = input.required<readonly GridColumn<never>[]>();
  /**
   * The grid's `outOfSpace()`: the manager marks those columns rather than
   * calling them hidden, and a pop-in brings the Sort menu.
   */
  readonly outOfSpace = input<GridOutOfSpace>(NONE_OUT);
  /** What the list holds, for the saved views' name: "Customer" reads "Customer views". */
  readonly label = input.required<string>();

  readonly phone = phoneSignal();
  readonly coarse = phoneSignal('(pointer: coarse)');
  private readonly manager = viewChild.required<SlColumnManager>('manager');
  private readonly undo = viewChild.required<TemplateRef<{ $implicit: ToastMessage<ToastContent> }>>('undo');
  /** The columns each Undo shows again, by the toast that offers it. */
  private readonly undoable = new Map<string, readonly string[]>();

  /** The query's order, first key first. */
  protected readonly sort = computed(() => this.view().current().query.sort);
  /**
   * One Sort item per sortable column the reader shows or the order holds:
   * its key; the mark drawn after the label, the direction's arrow and the
   * level when the order has more than one key; and the name a screen reader
   * hears instead of the arrow — column, direction, level.
   */
  protected readonly sortEntries = computed(() => {
    const hidden = new Set(this.view().columnState().hidden);
    const sort = this.sort();
    return this.columns()
      .filter((column) => column.sortable ?? column.kind !== 'actions')
      .map((column) => {
        const index = sort.findIndex((key) => key.column === column.id);
        const key = sort[index] ?? null;
        const level = key && sort.length > 1 ? index + 1 : null;
        const arrow = key?.direction === 'ascending' ? '↑' : '↓';
        const mark = key ? `${arrow}${level ? ` ${level}` : ''}` : null;
        const name = key
          ? `${column.label}, ${key.direction}${level ? `, sort level ${level}` : ''}`
          : `${column.label}, not sorted`;
        return { column, key, mark, name };
      })
      .filter((entry) => entry.key !== null || !hidden.has(entry.column.id));
  });

  /** The grid's own density, or the page's while the reader has not chosen one. */
  readonly density = computed(() => this.view().density() ?? this.preferences.preferences().density);

  /** The grid's Manage columns opens the same manager the trigger does. */
  manage(): void {
    this.manager().show();
  }

  /**
   * Every column request, from the grid or from the manager. A request that
   * hides a column is answered with a toast whose Undo shows that column
   * again. Hiding moves no order, width or pin, so the column returns to its
   * place and its width, and whatever the reader changed since stays.
   */
  arrange(request: DataGridColumnStateRequest | ColumnManagerRequest): void {
    this.view().columnState.set(request.value);
    const changes = 'changes' in request ? request.changes : [request.change];
    if (!changes.includes('hidden')) return;
    const before = new Set(request.previous.hidden);
    const hidden = request.value.hidden.filter((id) => !before.has(id));
    if (hidden.length === 0) return;
    const labels = hidden.map(
      (id) => this.columns().find((column) => column.id === id)?.label ?? id,
    );
    const id = this.toasts.show({
      title: labels.length === 1 ? `${labels[0]} hidden` : `${labels.length} columns hidden`,
      actions: this.undo(),
    });
    this.undoable.set(id, hidden);
  }

  restore(message: ToastMessage<ToastContent>): void {
    const hidden = this.undoable.get(message.id) ?? [];
    const state = this.view().columnState;
    state.set(hidden.reduce((next, id) => withColumnHidden(next, id, false), state()));
    this.undoable.delete(message.id);
    this.toasts.dismiss(message.id, 'pointer');
  }

  /**
   * A Sort item's check follows the order, not the press: the request is
   * refused, and the press moves the column one step through the order.
   */
  press(column: string, request: ChangeRequest<boolean>): void {
    request.cancel();
    this.view().pressSort(column);
  }

  setDensity(value: string | undefined): void {
    const density = DENSITIES.find((candidate) => candidate === value);
    if (density) this.view().density.set(density);
  }
}
