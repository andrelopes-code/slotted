import { computed, signal, type Signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import {
  actionDefinition,
  workflowIssues,
  type ConditionNode,
  type WorkflowAction,
  type WorkflowActionType,
  type WorkflowCatalog,
  type WorkflowCheck,
  type WorkflowIssue,
  type WorkflowTriggerType,
} from '@slotted/demo-nexora-backend';

import {
  conditionOn,
  emptyGroup,
  insertAt,
  keyboardTarget,
  moveNode,
  nodeAt,
  pathKey,
  removeAt,
  replaceAt,
  type KeyboardMove,
  type TreePath,
} from './condition-tree';

/** A definition as the editor holds it: what `workflows.create` and `update` take. */
export interface WorkflowDefinition {
  name: string;
  description: string;
  ownerId: string;
  trigger: { type: WorkflowTriggerType | ''; config: Record<string, unknown> };
  conditions: ConditionNode;
  actions: WorkflowAction[];
}

export const blankDefinition = (ownerId = ''): WorkflowDefinition => ({
  name: '',
  description: '',
  ownerId,
  trigger: { type: '', config: {} },
  conditions: emptyGroup('and'),
  actions: [],
});

/** The issues of one check, split the way the screen shows them: by node, by field, and the rest. */
export interface DraftIssues {
  readonly all: readonly WorkflowIssue[];
  /** Condition issues keyed by the node's path (`pathKey`): the builder marks the node. */
  readonly nodes: ReadonlyMap<string, readonly string[]>;
  /** Every other issue, keyed by the backend's field name (FM-02). */
  readonly fields: FormErrors;
}

function split(issues: readonly WorkflowIssue[]): DraftIssues {
  const nodes = new Map<string, string[]>();
  const fields: Record<string, string[]> = {};
  for (const issue of issues) {
    if (issue.field === 'conditions' && issue.path) {
      const key = pathKey(issue.path);
      nodes.set(key, [...(nodes.get(key) ?? []), issue.message]);
    } else fields[issue.field] = [...(fields[issue.field] ?? []), issue.message];
  }
  return { all: issues, nodes, fields };
}

const clone = <T>(value: T): T => structuredClone(value);

/**
 * The definition being written, and every edit the designer makes to it. The
 * same `workflowIssues` the backend runs is run here on every change, so a
 * node §69.2 refuses is marked before the request that would be refused —
 * after it the backend says only "conditions", never which node.
 */
export class WorkflowDraft {
  readonly definition = signal<WorkflowDefinition>(blankDefinition());
  /** The definition as the form opened on it: what an edit compares with (FM-09, FM-08). */
  readonly opened = signal<WorkflowDefinition>(blankDefinition());
  /** Set by a save attempt: the issues are shown from then on, not while the reader is still writing. */
  readonly attempted = signal(false);
  /** The node to bring into view and focus after a move: its path, as the tree now stands. */
  readonly focusPath = signal<TreePath | null>(null);

  constructor(private readonly catalog: Signal<WorkflowCatalog | null>) {}

  readonly trigger = computed(() =>
    this.catalog()?.triggers.find((trigger) => trigger.type === this.definition().trigger.type),
  );

  private issuesAt(check: WorkflowCheck): DraftIssues {
    const catalog = this.catalog();
    if (catalog === null) return split([]);
    const definition = this.definition();
    const issues = workflowIssues(
      {
        name: definition.name,
        trigger: definition.trigger.type ? { type: definition.trigger.type, config: definition.trigger.config } : {},
        conditions: definition.conditions,
        actions: definition.actions,
      },
      catalog,
      check,
    );
    if (!catalog.owners.some((owner) => owner.id === definition.ownerId))
      issues.push({ field: 'ownerId', code: 'INVALID_VALUE', message: 'Choose an owner who reads workflows' });
    return split(issues);
  }

  /** What a save of this definition would be refused for. */
  readonly saveIssues = computed(() => this.issuesAt('structure'));
  /** What activation would be refused for: the save's, and what would stop a run. */
  readonly runIssues = computed(() => this.issuesAt('run'));

  load(definition: WorkflowDefinition): void {
    this.definition.set(clone(definition));
    this.opened.set(clone(definition));
    this.attempted.set(false);
    this.focusPath.set(null);
  }

  patch(patch: Partial<Omit<WorkflowDefinition, 'trigger' | 'conditions' | 'actions'>>): void {
    this.definition.update((definition) => ({ ...definition, ...patch }));
  }

  /**
   * A new trigger keeps the conditions and actions it still has fields and
   * records for; the rest are left for the issues to mark, never dropped
   * silently.
   */
  setTrigger(type: WorkflowTriggerType): void {
    const trigger = this.catalog()?.triggers.find((candidate) => candidate.type === type);
    this.definition.update((definition) => ({
      ...definition,
      trigger: {
        type,
        config: trigger?.schedule
          ? {
              hour: typeof definition.trigger.config['hour'] === 'number' ? definition.trigger.config['hour'] : 7,
              ...(trigger.schedule === 'weekly'
                ? { weekday: typeof definition.trigger.config['weekday'] === 'string' ? definition.trigger.config['weekday'] : 'monday' }
                : {}),
            }
          : {},
      },
    }));
  }

  setScheduleConfig(key: 'hour' | 'weekday', value: number | string): void {
    this.definition.update((definition) => ({
      ...definition,
      trigger: { ...definition.trigger, config: { ...definition.trigger.config, [key]: value } },
    }));
  }

  // ---------------------------------------------------------------------------
  // The tree

  private setTree(tree: ConditionNode, focus: TreePath | null = null): void {
    this.definition.update((definition) => ({ ...definition, conditions: tree }));
    this.focusPath.set(focus);
  }

  node(path: TreePath): ConditionNode | undefined {
    return nodeAt(this.definition().conditions, path);
  }

  replace(path: TreePath, node: ConditionNode): void {
    this.setTree(replaceAt(this.definition().conditions, path, node));
  }

  /** A condition at the end of the group at `parent`, on the trigger's first field when there is one. */
  addCondition(parent: TreePath): void {
    const group = nodeAt(this.definition().conditions, parent);
    if (group?.type !== 'group') return;
    const index = group.children.length;
    this.setTree(insertAt(this.definition().conditions, parent, index, conditionOn(this.trigger()?.fields[0])), [...parent, index]);
  }

  /** A group of the other join, so the new level reads as a different question; it starts with one condition. */
  addGroup(parent: TreePath): void {
    const group = nodeAt(this.definition().conditions, parent);
    if (group?.type !== 'group') return;
    const index = group.children.length;
    const inner = { ...emptyGroup(group.operator === 'and' ? 'or' : 'and'), children: [conditionOn(this.trigger()?.fields[0])] };
    this.setTree(insertAt(this.definition().conditions, parent, index, inner), [...parent, index]);
  }

  remove(path: TreePath): void {
    const parent = path.slice(0, -1);
    this.setTree(removeAt(this.definition().conditions, path), parent);
  }

  setJoin(path: TreePath, operator: 'and' | 'or'): void {
    const group = nodeAt(this.definition().conditions, path);
    if (group?.type !== 'group') return;
    this.setTree(replaceAt(this.definition().conditions, path, { ...group, operator }), path);
  }

  /** Answers the node's new path, or null where §69.2 or the tree's shape refuses the move. */
  move(from: TreePath, parent: TreePath, index: number): TreePath | null {
    const moved = moveNode(this.definition().conditions, from, parent, index);
    if (moved === null) return null;
    this.setTree(moved.tree, moved.path);
    return moved.path;
  }

  moveBy(path: TreePath, move: KeyboardMove): TreePath | null {
    const target = keyboardTarget(this.definition().conditions, path, move);
    return target === null ? null : this.move(path, target.parent, target.index);
  }

  // ---------------------------------------------------------------------------
  // The actions

  addAction(type: WorkflowActionType): void {
    const definition = actionDefinition(type);
    const config: Record<string, unknown> = {};
    for (const field of definition?.fields ?? []) {
      if (field.kind === 'choice' && field.initial !== undefined) config[field.key] = field.initial;
      if (field.kind === 'record') {
        const records = this.trigger()?.records ?? [];
        config[field.key] = records.includes('ticket') ? 'ticket' : 'customer';
      }
    }
    this.definition.update((current) => ({ ...current, actions: [...current.actions, { type, config }] }));
  }

  setActionConfig(index: number, key: string, value: unknown): void {
    this.definition.update((current) => ({
      ...current,
      actions: current.actions.map((action, position) =>
        position === index
          ? { ...action, config: value === null || value === '' ? omit(action.config, key) : { ...action.config, [key]: value } }
          : action,
      ),
    }));
  }

  removeAction(index: number): void {
    this.definition.update((current) => ({ ...current, actions: current.actions.filter((_, position) => position !== index) }));
  }

  moveAction(index: number, by: -1 | 1): void {
    const target = index + by;
    this.definition.update((current) => {
      if (target < 0 || target >= current.actions.length) return current;
      const actions = [...current.actions];
      [actions[index], actions[target]] = [actions[target] as WorkflowAction, actions[index] as WorkflowAction];
      return { ...current, actions };
    });
  }

  // ---------------------------------------------------------------------------
  // What a save sends

  /** The fields whose value moved since the form opened (FM-09). */
  changes(): Partial<{
    name: string;
    description: string;
    ownerId: string;
    trigger: { type: WorkflowTriggerType; config: Record<string, unknown> };
    conditions: ConditionNode;
    actions: WorkflowAction[];
  }> {
    const now = this.definition();
    const then = this.opened();
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    return {
      ...(now.name !== then.name ? { name: now.name } : {}),
      ...(now.description !== then.description ? { description: now.description } : {}),
      ...(now.ownerId !== then.ownerId ? { ownerId: now.ownerId } : {}),
      ...(!same(now.trigger, then.trigger) && now.trigger.type
        ? { trigger: { type: now.trigger.type, config: now.trigger.config } }
        : {}),
      ...(!same(now.conditions, then.conditions) ? { conditions: now.conditions } : {}),
      ...(!same(now.actions, then.actions) ? { actions: now.actions } : {}),
    };
  }

  readonly dirty = computed(() => JSON.stringify(this.definition()) !== JSON.stringify(this.opened()));
}

function omit(config: Record<string, unknown>, key: string): Record<string, unknown> {
  const next = { ...config };
  delete next[key];
  return next;
}
