import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import {
  SlMenu,
  SlMenuItem,
  SlMenuItemDescription,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlSelect, SlSelectGroup, SlSelectItem } from '@slotted/angular/select';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';
import {
  WORKFLOW_LIMITS,
  operatorsFor,
  type ConditionNode,
  type ConditionOperator,
  type WorkflowField,
} from '@slotted/demo-nexora-backend';

import {
  keyboardTarget,
  levelAt,
  MOVE_REFUSAL_WORDS,
  moveRefusal,
  nodeAt,
  pathKey,
  remaining,
  withField,
  withOperator,
  type Condition,
  type KeyboardMove,
  type MoveRefusal,
  type TreePath,
} from '../../core/automation/condition-tree';
import type { WorkflowDraft } from '../../core/automation/workflow-draft';
import { JOIN_WORDS, operatorWords } from '../../core/automation/workflow.model';
import { ConditionValue } from './condition-value';

interface Drop {
  readonly parent: TreePath;
  readonly index: number;
  /** The row the line is drawn against, or the group a node is dropped at the end of. */
  readonly key: string;
  readonly edge: 'before' | 'after' | 'end';
  readonly refusal: MoveRefusal | null;
}

/**
 * The Rule Builder of §15 and §34.7: the condition tree of §69.2 written as
 * the tree it is. Each level says its join in words — "Match all of the
 * following", and "and" or "or" between its rows — so the nesting reads
 * without its color or its rule. A node is added, moved and removed from its
 * menu by keyboard or pointer, and moved by dragging its grip; both take the
 * same moves and refuse the same boundaries: a group into itself, and a level
 * past the fifth. What is left before §69.2's limits is said under the tree
 * before a limit is reached.
 *
 * Closest family: `filter-bar`'s builder, which nests groups of rules joined
 * by all or any. It edits a filter applied to a collection — an empty group and
 * an incomplete rule are dropped, where §69.2 refuses them — and its rules
 * carry the column descriptor's operators, not §69.2's; the tree here is the
 * backend's own `ConditionNode`, with no second model in the client (ledger
 * row "filter-bar, the Rule Builder").
 */
@Component({
  selector: 'app-rule-builder',
  imports: [
    ConditionValue,
    NgIcon,
    NgTemplateOutlet,
    SlButton,
    SlIconButton,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlMenu,
    SlMenuItem,
    SlMenuItemDescription,
    SlMenuSeparator,
    SlMenuTrigger,
    SlSegment,
    SlSegmentedControl,
    SlSelect,
    SlSelectGroup,
    SlSelectItem,
    SlText,
    SlVisuallyHidden,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:pointermove)': 'dragMove($event)',
    '(document:pointerup)': 'dragEnd($event)',
    '(document:pointercancel)': 'cancelDrag()',
    '(document:keydown.escape)': 'cancelDrag()',
    '[attr.data-dragging]': "dragging() ? '' : null",
  },
  styles: `
    :host {
      display: grid;
      gap: var(--slotted-space-3);
      container-type: inline-size;
    }
    .group,
    .rows,
    .stack {
      display: grid;
      gap: var(--slotted-space-2);
      min-inline-size: 0;
    }
    .rows {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* A nested level steps in by one space step behind a rule: five levels stay inside a phone. */
    .group.nested {
      padding-inline-start: var(--slotted-space-3);
      border-inline-start: var(--slotted-border-width-thick) solid var(--slotted-border-subtle);
    }
    .head,
    .foot,
    .row,
    .say {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--slotted-space-2);
      min-inline-size: 0;
    }
    /* The grip and the menu keep the row's two ends; the words between them wrap. */
    .head,
    .row {
      flex-wrap: nowrap;
    }
    .row {
      align-items: start;
    }
    .say {
      flex: 1 1 0;
    }
    .fields {
      flex: 1 1 0;
      min-inline-size: 0;
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 4fr) minmax(0, 5fr);
      gap: var(--slotted-space-2);
    }
    @container (width < 36rem) {
      .fields {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
      .fields > :first-child {
        grid-column: 1 / -1;
      }
    }
    .grip {
      display: grid;
      place-items: center;
      flex: none;
      inline-size: var(--slotted-control-height-sm);
      block-size: var(--slotted-control-height-md);
      color: var(--slotted-text-muted);
      cursor: grab;
      touch-action: none;
    }
    :host([data-dragging]) {
      cursor: grabbing;
      user-select: none;
    }
    .invalid > .row .fields,
    .group.invalid > .head {
      outline: var(--slotted-border-width-thick) solid var(--slotted-tone-danger-border);
      outline-offset: var(--slotted-space-1);
      border-radius: var(--slotted-radius-sm);
    }
    [data-drop='before'] {
      box-shadow: 0 calc(-1 * var(--slotted-space-1)) 0 var(--slotted-tone-accent-solid);
    }
    [data-drop='after'],
    [data-drop='end'] {
      box-shadow: 0 var(--slotted-space-1) 0 var(--slotted-tone-accent-solid);
    }
    [data-drop-refused] {
      box-shadow: 0 0 0 var(--slotted-border-width-thick) var(--slotted-tone-danger-border);
    }
    .dragged {
      opacity: 0.5;
    }
  `,
  template: `
    <ng-template #groupTemplate let-group="group" let-path="path">
      <div
        class="group"
        role="group"
        [class.nested]="path.length > 0"
        [class.invalid]="marked(path)"
        [class.dragged]="isDragged(path)"
        [attr.aria-label]="groupLabel(group, path)"
        [attr.data-path]="key(path)"
        [attr.data-testid]="'group-' + key(path)"
      >
        <div
          class="head"
          data-drop-row
          [attr.data-drop-path]="key(path)"
          [attr.data-drop]="dropEdge(path)"
          [attr.data-drop-refused]="refusedAt(path)"
        >
          @if (path.length > 0) {
            <span class="grip" aria-hidden="true" (pointerdown)="dragStart($event, path)"><ng-icon name="lucideGripVertical" /></span>
          }
          <span class="say">
            <span slText size="sm" weight="medium">Match</span>
            <div
              slSegmentedControl
              size="sm"
              [attr.aria-label]="'Join of ' + place(path)"
              [value]="group.operator"
              (valueChange)="draft().setJoin(path, $any($event.value))"
            >
              <label slSegment value="and">All</label>
              <label slSegment value="or">Any</label>
            </div>
            <span slText size="sm">of the following</span>
            <span slText size="sm" tone="muted">· level {{ path.length + 1 }} of {{ limits.maxConditionDepth }}</span>
          </span>
          <button
            slIconButton
            class="menu"
            size="sm"
            variant="ghost"
            tone="secondary"
            type="button"
            [attr.aria-label]="'Actions for ' + place(path)"
            [attr.data-testid]="'group-menu-' + key(path)"
            [slMenuTriggerFor]="groupMenu"
          >
            <ng-icon name="lucideEllipsisVertical" />
          </button>
          <sl-menu #groupMenu>
            <button slMenuItem data-testid="menu-add-condition" [disabled]="left().conditions <= 0" (select)="draft().addCondition(path)">
              Add a condition
              @if (left().conditions <= 0) {
                <span slMenuItemDescription>A workflow holds at most {{ limits.maxConditions }} conditions.</span>
              }
            </button>
            <button slMenuItem data-testid="menu-add-group" [disabled]="!canNest(path)" (select)="draft().addGroup(path)">
              Add a group inside
              @if (!canNest(path)) {
                <span slMenuItemDescription>{{ nestWords(path) }}</span>
              }
            </button>
            @if (path.length > 0) {
              <hr slMenuSeparator />
              @for (move of moves; track move.key) {
                <button
                  slMenuItem
                  [attr.data-testid]="'move-' + move.key"
                  [disabled]="moveBlocked(path, move.key) !== null"
                  (select)="moveBy(path, move.key)"
                >
                  {{ move.label }}
                  @if (moveBlocked(path, move.key); as reason) {
                    <span slMenuItemDescription>{{ reason }}</span>
                  }
                </button>
              }
              <hr slMenuSeparator />
              <button slMenuItem tone="danger" data-testid="remove-group" (select)="remove(path)">Remove group</button>
            }
          </sl-menu>
        </div>
        <ol class="rows">
          @for (child of group.children; track $index) {
            <li class="stack" [attr.data-path]="key(childPath(path, $index))">
              @if ($index > 0) {
                <span slText size="sm" tone="muted" class="joiner">{{ group.operator === 'and' ? 'and' : 'or' }}</span>
              }
              @if (child.type === 'group') {
                <ng-container
                  [ngTemplateOutlet]="groupTemplate"
                  [ngTemplateOutletContext]="{ group: child, path: childPath(path, $index) }"
                />
              } @else {
                <ng-container
                  [ngTemplateOutlet]="conditionTemplate"
                  [ngTemplateOutletContext]="{ condition: child, path: childPath(path, $index) }"
                />
              }
            </li>
          }
        </ol>
        @if (group.children.length === 0) {
          <div slInlineMessage [tone]="showIssues() ? 'danger' : 'warning'" [attr.data-testid]="'empty-' + key(path)">
            <span slInlineMessageIcon></span>
            {{ path.length === 0 ? 'No condition yet: add one, or the workflow cannot be saved.' : 'This group is empty: add a condition or remove the group.' }}
          </div>
        } @else if (showIssues()) {
          @for (message of issuesAt(path); track message) {
            <span slText size="sm" tone="danger">{{ message }}</span>
          }
        }
        <div
          class="foot"
          data-drop-end
          [attr.data-drop-path]="key(path)"
          [attr.data-drop]="dropEnd(path)"
          [attr.data-drop-refused]="refusedAt(path)"
        >
          <button
            slButton
            size="sm"
            variant="ghost"
            type="button"
            [disabled]="left().conditions <= 0"
            [attr.data-testid]="'add-condition-' + key(path)"
            (click)="draft().addCondition(path)"
          >
            <ng-icon name="lucidePlus" /> Condition
          </button>
          <button
            slButton
            size="sm"
            variant="ghost"
            type="button"
            [disabled]="!canNest(path)"
            [attr.data-testid]="'add-group-' + key(path)"
            (click)="draft().addGroup(path)"
          >
            <ng-icon name="lucidePlus" /> Group
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template #conditionTemplate let-condition="condition" let-path="path">
      <div
        class="stack"
        [class.invalid]="marked(path)"
        [class.dragged]="isDragged(path)"
        [attr.data-testid]="'condition-' + key(path)"
      >
        <div
          class="row"
          data-drop-row
          [attr.data-drop-path]="key(path)"
          [attr.data-drop]="dropEdge(path)"
          [attr.data-drop-refused]="refusedAt(path)"
        >
          <span class="grip" aria-hidden="true" (pointerdown)="dragStart($event, path)"><ng-icon name="lucideGripVertical" /></span>
          <div class="fields">
            <sl-select
              placeholder="Choose a field"
              [attr.aria-label]="'Field of ' + place(path)"
              [attr.data-testid]="'field-' + key(path)"
              [invalid]="marked(path) && !condition.field"
              [value]="condition.field || null"
              (valueChangeRequest)="setField(path, condition, $any($event.value))"
            >
              @for (section of sections(); track section.group) {
                <sl-select-group [label]="section.group">
                  @for (field of section.fields; track field.path) {
                    <sl-select-item [value]="field.path">{{ field.label }}</sl-select-item>
                  }
                </sl-select-group>
              }
            </sl-select>
            <sl-select
              [attr.aria-label]="'Comparison of ' + place(path)"
              [attr.data-testid]="'operator-' + key(path)"
              [disabled]="!fieldOf(condition)"
              [value]="condition.operator"
              (valueChangeRequest)="setOperator(path, condition, $any($event.value))"
            >
              @for (operator of operatorsOf(condition); track operator) {
                <sl-select-item [value]="operator">{{ operatorLabel(operator, condition) }}</sl-select-item>
              }
            </sl-select>
            <app-condition-value
              [field]="fieldOf(condition)"
              [operator]="condition.operator"
              [value]="condition.value"
              [invalid]="marked(path)"
              [label]="'Value of ' + place(path)"
              [attr.data-testid]="'value-' + key(path)"
              (valueChange)="setValue(path, condition, $event)"
            />
          </div>
          <button
            slIconButton
            class="menu"
            size="sm"
            variant="ghost"
            tone="secondary"
            type="button"
            [attr.aria-label]="'Actions for ' + place(path)"
            [attr.data-testid]="'condition-menu-' + key(path)"
            [slMenuTriggerFor]="conditionMenu"
          >
            <ng-icon name="lucideEllipsisVertical" />
          </button>
          <sl-menu #conditionMenu>
            @for (move of moves; track move.key) {
                <button
                  slMenuItem
                  [attr.data-testid]="'move-' + move.key"
                  [disabled]="moveBlocked(path, move.key) !== null"
                  (select)="moveBy(path, move.key)"
                >
                  {{ move.label }}
                  @if (moveBlocked(path, move.key); as reason) {
                    <span slMenuItemDescription>{{ reason }}</span>
                  }
                </button>
              }
            <hr slMenuSeparator />
            <button slMenuItem tone="danger" data-testid="remove-condition" (select)="remove(path)">Remove condition</button>
          </sl-menu>
        </div>
        @if (showIssues()) {
          @for (message of issuesAt(path); track message) {
            <span slText size="sm" tone="danger">{{ message }}</span>
          }
        }
      </div>
    </ng-template>

    <ng-container [ngTemplateOutlet]="groupTemplate" [ngTemplateOutletContext]="{ group: root(), path: rootPath }" />

    <span slText size="sm" [tone]="nearLimit() ? 'warning' : 'muted'" data-testid="remaining">{{ remainingWords() }}</span>
    <span slVisuallyHidden aria-live="polite" data-testid="announcement">{{ announcement() }}</span>
  `,
})
export class RuleBuilder {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly draft = input.required<WorkflowDraft>();
  /** True once a save was tried: from then on the issues are said at their nodes. */
  readonly showIssues = input(false);
  readonly issues = input<ReadonlyMap<string, readonly string[]>>(new Map());

  readonly limits = WORKFLOW_LIMITS;
  readonly rootPath: TreePath = [];
  readonly moves: readonly { key: KeyboardMove; label: string }[] = [
    { key: 'up', label: 'Move up' },
    { key: 'down', label: 'Move down' },
    { key: 'into-previous', label: 'Move into the group above' },
    { key: 'out', label: 'Move out of this group' },
  ];

  readonly announcement = signal('');
  private readonly drag = signal<{ from: TreePath; pointerId: number; x: number; y: number; active: boolean } | null>(null);
  readonly drop = signal<Drop | null>(null);
  readonly dragging = computed(() => this.drag()?.active === true);

  readonly root = computed(() => this.draft().definition().conditions as Extract<ConditionNode, { type: 'group' }>);
  readonly trigger = computed(() => this.draft().trigger());
  readonly left = computed(() => remaining(this.root()));

  /** The trigger's fields by the record they belong to, as the field control groups them. */
  readonly sections = computed(() => {
    const groups = new Map<string, WorkflowField[]>();
    for (const field of this.trigger()?.fields ?? []) groups.set(field.group, [...(groups.get(field.group) ?? []), field]);
    return [...groups.entries()].map(([group, fields]) => ({ group, fields }));
  });

  readonly nearLimit = computed(() => this.left().conditions <= 5 || this.left().depth <= 1);

  /** §69.2's limits said before they are reached: what is used and what remains. */
  readonly remainingWords = computed(() => {
    const { used, conditions, depth } = this.left();
    const count = `${used.conditions} of ${this.limits.maxConditions} conditions`;
    const levels = `${used.depth} of ${this.limits.maxConditionDepth} levels`;
    const rest =
      conditions <= 0
        ? 'No condition can be added.'
        : depth <= 0
          ? `No group can be nested further; ${conditions} more ${conditions === 1 ? 'condition' : 'conditions'} can be added.`
          : `${conditions} more ${conditions === 1 ? 'condition' : 'conditions'} and ${depth} more ${depth === 1 ? 'level' : 'levels'} can be added.`;
    return `${count}, ${levels}. ${rest}`;
  });

  constructor() {
    // A node a keyboard move put somewhere else keeps the focus: its menu button, where it now stands.
    afterRenderEffect(() => {
      const path = this.draft().focusPath();
      if (path === null || !this.focusAfterMove) return;
      this.focusAfterMove = false;
      const node = this.host.nativeElement.querySelector(`[data-path="${pathKey(path)}"] .menu`);
      (node as HTMLElement | null)?.focus();
    });
  }

  private focusAfterMove = false;

  key = pathKey;
  childPath = (path: TreePath, index: number): TreePath => [...path, index];

  place(path: TreePath): string {
    if (path.length === 0) return 'the top group';
    const node = nodeAt(this.root(), path);
    return `${node?.type === 'group' ? 'group' : 'condition'} ${path.map((index) => index + 1).join('.')}`;
  }

  groupLabel(group: Extract<ConditionNode, { type: 'group' }>, path: TreePath): string {
    return `${path.length === 0 ? 'Conditions' : `Group ${path.map((index) => index + 1).join('.')}`}: ${JOIN_WORDS[group.operator].toLowerCase()} the following, level ${levelAt(path)}`;
  }

  issuesAt(path: TreePath): readonly string[] {
    return this.issues().get(pathKey(path)) ?? [];
  }

  marked(path: TreePath): boolean {
    return this.showIssues() && this.issuesAt(path).length > 0;
  }

  fieldOf(condition: Condition): WorkflowField | undefined {
    return this.trigger()?.fields.find((field) => field.path === condition.field);
  }

  operatorsOf(condition: Condition): readonly ConditionOperator[] {
    const field = this.fieldOf(condition);
    return field ? operatorsFor(field) : [condition.operator];
  }

  operatorLabel(operator: ConditionOperator, condition: Condition): string {
    return operatorWords(operator, this.fieldOf(condition));
  }

  setField(path: TreePath, condition: Condition, value: string | null): void {
    const field = this.trigger()?.fields.find((candidate) => candidate.path === value);
    if (!field) return;
    this.draft().replace(path, withField(condition, field));
  }

  setOperator(path: TreePath, condition: Condition, operator: ConditionOperator | null): void {
    if (!operator) return;
    this.draft().replace(path, withOperator(condition, this.fieldOf(condition), operator));
  }

  setValue(path: TreePath, condition: Condition, value: unknown): void {
    this.draft().replace(path, { ...condition, value });
  }

  /** A group may hold another while the new level stays within §69.2's depth and a condition remains. */
  canNest(path: TreePath): boolean {
    return levelAt(path) < this.limits.maxConditionDepth && this.left().conditions > 0;
  }

  nestWords(path: TreePath): string {
    return this.left().conditions <= 0
      ? `A workflow holds at most ${this.limits.maxConditions} conditions.`
      : `This group is at level ${levelAt(path)}; groups nest at most ${this.limits.maxConditionDepth} levels deep.`;
  }

  moveBlocked(path: TreePath, move: KeyboardMove): string | null {
    const target = keyboardTarget(this.root(), path, move);
    if (target === null)
      return move === 'up'
        ? 'It is the first of its group.'
        : move === 'down'
          ? 'It is the last of its group.'
          : move === 'into-previous'
            ? 'The row above is not a group.'
            : 'It is in the top group.';
    const refusal = moveRefusal(this.root(), path, target.parent, target.index);
    return refusal === null ? null : MOVE_REFUSAL_WORDS[refusal];
  }

  moveBy(path: TreePath, move: KeyboardMove): void {
    const what = this.place(path);
    const moved = this.draft().moveBy(path, move);
    if (moved === null) return;
    this.focusAfterMove = true;
    this.announcement.set(`Moved ${what} to ${this.place(moved)}.`);
  }

  remove(path: TreePath): void {
    const what = this.place(path);
    this.draft().remove(path);
    this.announcement.set(`Removed ${what}.`);
  }

  // ---------------------------------------------------------------------------
  // The pointer's drag, through the grips

  isDragged(path: TreePath): boolean {
    const drag = this.drag();
    return drag?.active === true && pathKey(drag.from) === pathKey(path);
  }

  dropEdge(path: TreePath): 'before' | 'after' | null {
    const drop = this.drop();
    if (drop === null || drop.key !== pathKey(path) || drop.edge === 'end' || drop.refusal !== null) return null;
    return drop.edge;
  }

  dropEnd(path: TreePath): 'end' | null {
    const drop = this.drop();
    return drop?.edge === 'end' && drop.key === pathKey(path) && drop.refusal === null ? 'end' : null;
  }

  dragStart(event: PointerEvent, path: TreePath): void {
    if (event.button !== 0) return;
    event.preventDefault();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    this.drag.set({ from: path, pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false });
  }

  dragMove(event: PointerEvent): void {
    const drag = this.drag();
    if (drag === null || event.pointerId !== drag.pointerId) return;
    if (!drag.active) {
      // A grip pressed and barely moved is not a drag.
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
      this.drag.set({ ...drag, active: true });
      this.announcement.set(`Dragging ${this.place(drag.from)}. Release over a row to move it there; Escape cancels.`);
    }
    this.drop.set(this.dropAt(event.clientX, event.clientY, drag.from));
    this.markRefusal();
  }

  dragEnd(event: PointerEvent): void {
    const drag = this.drag();
    if (drag === null || event.pointerId !== drag.pointerId) return;
    const drop = this.drop();
    const what = this.place(drag.from);
    this.cancelDrag();
    if (!drag.active || drop === null) return;
    if (drop.refusal !== null) {
      this.announcement.set(`${what} was not moved: ${MOVE_REFUSAL_WORDS[drop.refusal]}`);
      return;
    }
    const moved = this.draft().move(drag.from, drop.parent, drop.index);
    if (moved !== null) this.announcement.set(`Moved ${what} to ${this.place(moved)}.`);
  }

  cancelDrag(): void {
    if (this.drag() === null) return;
    if (this.drag()?.active && this.drop() === null) this.announcement.set('The move was cancelled.');
    this.drag.set(null);
    this.drop.set(null);
    this.markRefusal();
  }

  /**
   * The place under the pointer: before or after the row it is over, by the
   * row's half, or the end of a group when it is over the group's foot.
   */
  private dropAt(x: number, y: number, from: TreePath): Drop | null {
    const document = this.host.nativeElement.ownerDocument;
    const element = document.elementFromPoint?.(x, y) ?? null;
    if (element === null || !this.host.nativeElement.contains(element)) return null;
    const end = element.closest('[data-drop-end]');
    const row = element.closest('[data-drop-row]');
    const tree = this.root();
    if (end) {
      const parent = this.pathOf(end.getAttribute('data-drop-path'));
      const group = nodeAt(tree, parent);
      if (group?.type !== 'group') return null;
      const index = group.children.length;
      return { parent, index, key: pathKey(parent), edge: 'end', refusal: moveRefusal(tree, from, parent, index) };
    }
    if (!row) return null;
    const path = this.pathOf(row.getAttribute('data-drop-path'));
    if (path.length === 0) {
      // Over the top group's own head: the first place in it.
      return { parent: [], index: 0, key: '', edge: 'before', refusal: moveRefusal(tree, from, [], 0) };
    }
    const rect = row.getBoundingClientRect();
    const before = y < rect.top + rect.height / 2;
    const parent = path.slice(0, -1);
    const index = (path[path.length - 1] as number) + (before ? 0 : 1);
    return { parent, index, key: pathKey(path), edge: before ? 'before' : 'after', refusal: moveRefusal(tree, from, parent, index) };
  }

  private pathOf(key: string | null): TreePath {
    return key ? key.split('.').map(Number) : [];
  }

  /** A refused place is outlined where the pointer is, and its reason is announced once. */
  private markRefusal(): void {
    const drop = this.drop();
    if (drop === null || drop.refusal === null || drop.refusal === 'same-place') return;
    const words = `Not here: ${MOVE_REFUSAL_WORDS[drop.refusal]}`;
    if (this.announcement() !== words) this.announcement.set(words);
  }

  refusedAt(path: TreePath): '' | null {
    const drop = this.drop();
    return drop !== null &&
      drop.key === pathKey(path) &&
      drop.refusal !== null &&
      drop.refusal !== 'same-place'
      ? ''
      : null;
  }
}
