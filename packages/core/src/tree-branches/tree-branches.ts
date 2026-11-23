/**
 * The rails of rows that fold their children, read from the order and the
 * levels of the rows in the document. A stylesheet knows a row's own level and
 * not whether a later row continues the rail of one above it, which is what
 * says where a rail turns into its last branch.
 */

export interface TreeBranch {
  /** No later row continues this row's rail: it turns into the row's branch and ends. */
  readonly last: boolean;
  /** The next row is under this one: a rail starts at this row's mark. */
  readonly open: boolean;
  /** The levels above the parent's whose rail crosses this row on its way to a later one. */
  readonly rails: readonly number[];
}

/** The branch of each row, from the levels of the rows in document order. */
export function treeBranches(levels: readonly number[]): TreeBranch[] {
  const branches: TreeBranch[] = [];
  /* Whether a later row stands at a level, under the same parent as a row met before it. */
  let continues: boolean[] = [];
  for (let index = levels.length - 1; index >= 0; index -= 1) {
    const level = levels[index]!;
    const rails: number[] = [];
    for (let above = 0; above < level - 1; above += 1) {
      if (continues[above + 1] === true) rails.push(above);
    }

    branches.unshift({
      last: continues[level] !== true,
      open: (levels[index + 1] ?? 0) > level,
      rails,
    });
    continues = continues.slice(0, level);
    continues[level] = true;
  }

  return branches;
}

/**
 * Keeps each row that carries a level told of its branch (`data-branch`,
 * `data-branch-open`, `--slotted-tree-rails`) while rows come and go. Returns
 * the function that stops it.
 */
export function observeTreeBranches(root: HTMLElement): () => void {
  const write = () => {
    const rows = [...root.querySelectorAll<HTMLElement>('[data-part-row][data-level]')].filter(
      (row) => row.closest('[data-ui-table]') === root,
    );
    const branches = treeBranches(rows.map((row) => Number(row.getAttribute('data-level'))));

    rows.forEach((row, index) => writeBranch(row, branches[index]!));
  };

  const observer = new MutationObserver(write);
  observer.observe(root, { attributeFilter: ['data-level'], childList: true, subtree: true });
  write();

  return () => observer.disconnect();
}

function writeBranch(row: HTMLElement, branch: TreeBranch) {
  row.setAttribute('data-branch', branch.last ? 'last' : 'middle');
  row.toggleAttribute('data-branch-open', branch.open);

  if (branch.rails.length === 0) row.style.removeProperty('--slotted-tree-rails');
  else row.style.setProperty('--slotted-tree-rails', branch.rails.map(railLayer).join(', '));
}

/** One full-height line of the background, at the center of the mark of a level. */
function railLayer(level: number) {
  return `linear-gradient(var(--_guide) 0 0) calc(var(--_rail) + ${String(level)} * var(--_rail-step)) 0 / var(--_rule-width) 100% no-repeat`;
}
