import {
  LIST_OPERATORS,
  VALUELESS_OPERATORS,
  WORKFLOW_LIMITS,
  conditionMeasure,
  operatorsFor,
  type ConditionNode,
  type ConditionOperator,
  type WorkflowField,
} from '@slotted/demo-nexora-backend';

/**
 * The condition tree of §69.2 edited as the backend stores it: every function
 * takes the tree and returns a new one, and a node is named by its path of
 * indices from the root group. The keyboard's menu and the pointer's drag call
 * the same moves, so a boundary refused to one is refused to the other.
 */
export type TreePath = readonly number[];
export type Group = Extract<ConditionNode, { type: 'group' }>;
export type Condition = Extract<ConditionNode, { type: 'condition' }>;

export const pathKey = (path: TreePath): string => path.join('.');

export function nodeAt(root: ConditionNode, path: TreePath): ConditionNode | undefined {
  let node: ConditionNode | undefined = root;
  for (const index of path) {
    if (node?.type !== 'group') return undefined;
    node = node.children[index];
  }
  return node;
}

function withChildren(root: ConditionNode, path: TreePath, edit: (children: ConditionNode[]) => void): ConditionNode {
  if (root.type !== 'group') return root;
  if (path.length === 0) {
    const children = [...root.children];
    edit(children);
    return { ...root, children };
  }
  const [head, ...rest] = path as [number, ...number[]];
  const child = root.children[head];
  if (child === undefined) return root;
  const children = [...root.children];
  children[head] = withChildren(child, rest, edit);
  return { ...root, children };
}

export function replaceAt(root: ConditionNode, path: TreePath, node: ConditionNode): ConditionNode {
  if (path.length === 0) return node;
  const index = path[path.length - 1] as number;
  return withChildren(root, path.slice(0, -1), (children) => {
    if (index < children.length) children[index] = node;
  });
}

export function removeAt(root: ConditionNode, path: TreePath): ConditionNode {
  if (path.length === 0) return root;
  const index = path[path.length - 1] as number;
  return withChildren(root, path.slice(0, -1), (children) => {
    children.splice(index, 1);
  });
}

export function insertAt(root: ConditionNode, parent: TreePath, index: number, node: ConditionNode): ConditionNode {
  return withChildren(root, parent, (children) => {
    children.splice(Math.min(index, children.length), 0, node);
  });
}

/** Group levels a subtree holds: a condition none, a group one more than its deepest child group. */
export function levelsOf(node: ConditionNode): number {
  if (node.type !== 'group') return 0;
  return 1 + node.children.reduce((deepest, child) => Math.max(deepest, levelsOf(child)), 0);
}

/** The level a group at `path` stands at: the root group is level 1. */
export const levelAt = (path: TreePath): number => path.length + 1;

const isPrefix = (prefix: TreePath, path: TreePath): boolean =>
  prefix.length <= path.length && prefix.every((value, index) => value === path[index]);

export type MoveRefusal = 'same-place' | 'into-itself' | 'too-deep' | 'not-a-group';

/** Why a node cannot go to `index` of the group at `parent`; null where it can (§69.2's depth). */
export function moveRefusal(root: ConditionNode, from: TreePath, parent: TreePath, index: number): MoveRefusal | null {
  const node = nodeAt(root, from);
  const target = nodeAt(root, parent);
  if (node === undefined || from.length === 0) return 'same-place';
  if (target?.type !== 'group') return 'not-a-group';
  if (isPrefix(from, parent)) return 'into-itself';
  const fromParent = from.slice(0, -1);
  const fromIndex = from[from.length - 1] as number;
  if (pathKey(fromParent) === pathKey(parent) && (index === fromIndex || index === fromIndex + 1)) return 'same-place';
  if (levelAt(parent) + levelsOf(node) > WORKFLOW_LIMITS.maxConditionDepth) return 'too-deep';
  return null;
}

export const MOVE_REFUSAL_WORDS: Record<MoveRefusal, string> = {
  'same-place': 'It is already there.',
  'into-itself': 'A group cannot go inside itself.',
  'too-deep': `Groups nest at most ${WORKFLOW_LIMITS.maxConditionDepth} levels deep.`,
  'not-a-group': 'Only a group holds conditions.',
};

/**
 * Moves the node at `from` to `index` of the group at `parent`, both read on
 * the tree as it stands before the move. Answers the tree and the node's new
 * path, or null where `moveRefusal` refuses it.
 */
export function moveNode(
  root: ConditionNode,
  from: TreePath,
  parent: TreePath,
  index: number,
): { tree: ConditionNode; path: TreePath } | null {
  if (moveRefusal(root, from, parent, index) !== null) return null;
  const node = nodeAt(root, from) as ConditionNode;
  const fromParent = from.slice(0, -1);
  const fromIndex = from[from.length - 1] as number;
  // Removing the node shifts the later siblings, and any path that runs through one of them.
  const shifted = [...parent];
  if (isPrefix(fromParent, parent) && parent.length > fromParent.length) {
    const at = fromParent.length;
    if ((shifted[at] as number) > fromIndex) shifted[at] = (shifted[at] as number) - 1;
  }
  let target = index;
  if (pathKey(fromParent) === pathKey(parent) && fromIndex < index) target -= 1;
  const tree = insertAt(removeAt(root, from), shifted, target, node);
  return { tree, path: [...shifted, target] };
}

export type KeyboardMove = 'up' | 'down' | 'into-previous' | 'out';

/** The four moves the node's menu offers, each as a move the drag also makes. */
export function keyboardTarget(root: ConditionNode, path: TreePath, move: KeyboardMove): { parent: TreePath; index: number } | null {
  if (path.length === 0) return null;
  const parent = path.slice(0, -1);
  const index = path[path.length - 1] as number;
  const group = nodeAt(root, parent);
  if (group?.type !== 'group') return null;
  switch (move) {
    case 'up':
      return index > 0 ? { parent, index: index - 1 } : null;
    case 'down':
      return index < group.children.length - 1 ? { parent, index: index + 2 } : null;
    case 'into-previous': {
      const previous = group.children[index - 1];
      return previous?.type === 'group' ? { parent: [...parent, index - 1], index: previous.children.length } : null;
    }
    case 'out':
      return parent.length > 0 ? { parent: parent.slice(0, -1), index: (parent[parent.length - 1] as number) + 1 } : null;
  }
}

/** The value a condition starts with on a field and an operator: none for emptiness, a list for a list. */
export function initialValue(field: WorkflowField | undefined, operator: ConditionOperator): unknown {
  if (VALUELESS_OPERATORS.includes(operator)) return null;
  if (LIST_OPERATORS.includes(operator)) return [];
  if (!field) return null;
  switch (field.type) {
    case 'boolean':
      return true;
    case 'enum':
    case 'tags':
      return field.options?.[0]?.value ?? null;
    default:
      return null;
  }
}

/** A condition on `field`, with the first operator the field answers. */
export function conditionOn(field: WorkflowField | undefined): Condition {
  const operator = field ? (operatorsFor(field)[0] as ConditionOperator) : 'eq';
  return { type: 'condition', field: field?.path ?? '', operator, value: initialValue(field, operator) };
}

/** The condition after its field changes: an operator the new field answers, and a value of its kind. */
export function withField(condition: Condition, field: WorkflowField): Condition {
  const operators = operatorsFor(field);
  const operator = operators.includes(condition.operator) ? condition.operator : (operators[0] as ConditionOperator);
  return { type: 'condition', field: field.path, operator, value: initialValue(field, operator) };
}

/** The condition after its operator changes: the value kept where it still reads, reset where it does not. */
export function withOperator(condition: Condition, field: WorkflowField | undefined, operator: ConditionOperator): Condition {
  const list = LIST_OPERATORS.includes(operator);
  const wasList = LIST_OPERATORS.includes(condition.operator);
  const valueless = VALUELESS_OPERATORS.includes(operator);
  const keep = !valueless && list === wasList && !VALUELESS_OPERATORS.includes(condition.operator);
  return { ...condition, operator, value: keep ? condition.value : initialValue(field, operator) };
}

/** How many conditions and group levels remain before §69.2's limits. */
export function remaining(root: ConditionNode): { conditions: number; depth: number; used: { conditions: number; depth: number } } {
  const used = conditionMeasure(root);
  return {
    conditions: WORKFLOW_LIMITS.maxConditions - used.conditions,
    depth: WORKFLOW_LIMITS.maxConditionDepth - used.depth,
    used,
  };
}

export const emptyGroup = (operator: 'and' | 'or' = 'and'): Group => ({ type: 'group', operator, children: [] });
