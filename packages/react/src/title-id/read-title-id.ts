import { isValidElement } from 'react';
import type { ReactNode } from 'react';

interface TitleIdOptions {
  /** The family's root: a nested one names itself, so it is not read. */
  root: unknown;
  title: unknown;
  fallback: string;
}

/**
 * The identifier of the title written among the children, read from the
 * element tree so the server HTML is already named; the title's own effect
 * reports one a component of the page's renders.
 */
export function readTitleId(node: ReactNode, options: TitleIdOptions): string | null {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) {
      const found = readTitleId(child, options);
      if (found !== null) return found;
    }

    return null;
  }

  if (!isValidElement<{ children?: ReactNode; id?: string }>(node)) return null;
  if (node.type === options.root) return null;
  if (node.type === options.title) return node.props.id ?? options.fallback;

  return readTitleId(node.props.children, options);
}
