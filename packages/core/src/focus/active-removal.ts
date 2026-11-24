/**
 * Keeping a hierarchy's position when the node it was on leaves the document:
 * deleted, filtered out, or inside a branch the consumer closed.
 *
 * `createRemovalFocus` answers with the row that took the removed one's place,
 * which in a hierarchy is often another branch. The rule here is the one a file
 * tree follows: the next sibling, then the previous one, then the parent, and
 * so on up to the root.
 */

export interface ActiveRemovalOptions {
  /** Selects the nodes, which carry `data-key` and `data-depth`. */
  nodeSelector: string;
  /** The key of the node the position is on, or `null`. */
  getActive: () => string | null;
  /** The position moves here. `null` when no node is left to hold it. */
  onMove: (key: string | null) => void;
}

export interface ActiveRemovalHandle {
  /** Reads the neighbors of the active node. Called whenever the position moves. */
  refresh: () => void;
  destroy: () => void;
}

interface Neighbors {
  key: string;
  candidates: readonly string[];
}

export function createActiveRemoval(
  container: HTMLElement,
  options: ActiveRemovalOptions,
): ActiveRemovalHandle {
  const nodes = () => [...container.querySelectorAll<HTMLElement>(options.nodeSelector)];
  let neighbors: Neighbors | null = null;
  let held = container.contains(container.ownerDocument.activeElement);

  function refresh() {
    const key = options.getActive();
    if (key === null) {
      neighbors = null;
      return;
    }

    const candidates = candidatesFor(nodes(), key);
    if (candidates !== undefined) neighbors = { key, candidates };
  }

  function handleFocusIn() {
    held = true;
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next && !container.contains(next)) held = false;
  }

  function handleMutation() {
    const key = options.getActive();
    if (key === null) return;

    const current = nodes();
    if (current.some((node) => node.dataset['key'] === key)) {
      refresh();
      return;
    }

    /* A node that was never here is one that has yet to arrive. */
    if (neighbors?.key !== key) return;
    const { candidates } = neighbors;
    const target = candidates
      .map((candidate) => current.find((node) => node.dataset['key'] === candidate))
      .find((node) => node !== undefined && node.getAttribute('aria-disabled') !== 'true');
    neighbors = null;

    const { activeElement, body } = container.ownerDocument;
    if (held && (activeElement === null || activeElement === body)) (target ?? container).focus();
    options.onMove(target?.dataset['key'] ?? null);
  }

  const observer = new MutationObserver(handleMutation);
  observer.observe(container, { childList: true, subtree: true });
  container.addEventListener('focusin', handleFocusIn);
  container.addEventListener('focusout', handleFocusOut);
  refresh();

  return {
    refresh,
    destroy() {
      observer.disconnect();
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    },
  };
}

/** Next siblings, previous siblings, then the parent and the same for it. */
function candidatesFor(nodes: readonly HTMLElement[], key: string): string[] | undefined {
  const rows = nodes.map((node) => ({
    key: node.dataset['key'] ?? '',
    depth: Number(node.dataset['depth'] ?? 0),
  }));
  let index = rows.findIndex((row) => row.key === key);
  if (index === -1) return undefined;

  const candidates: string[] = [];
  while (index !== -1) {
    const { depth } = rows[index]!;
    const before = rows.slice(0, index).reverse();
    const parent = before.find((row) => row.depth < depth);
    const siblings = (run: typeof rows) => {
      const end = run.findIndex((row) => row.depth < depth);
      return run
        .slice(0, end === -1 ? run.length : end)
        .filter((row) => row.depth === depth)
        .map((row) => row.key);
    };
    candidates.push(...siblings(rows.slice(index + 1)), ...siblings(before));
    if (parent === undefined) break;
    candidates.push(parent.key);
    index = rows.indexOf(parent);
  }

  return candidates;
}
