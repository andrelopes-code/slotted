import { createCondense } from '@slotted/core/overflow';
import { useCallback, useEffect, useState } from 'react';
import type { Ref } from 'react';

const LABEL_SELECTOR = '[data-part="item"] [data-part="label"]';

/**
 * Whether a control told to condense to a column stands as one now, and the
 * ref that reads its width. The consumer's own `ref` still receives the root.
 */
export function useCondense(enabled: boolean, ref: Ref<HTMLDivElement> | undefined) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    if (!enabled || node === null) return undefined;

    const handle = createCondense(node, {
      labels: () => [...node.querySelectorAll(LABEL_SELECTOR)],
      onChange: setStacked,
    });

    return () => {
      handle.destroy();
      setStacked(false);
    };
  }, [enabled, node]);

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element);
      if (typeof ref === 'function') ref(element);
      else if (ref !== null && ref !== undefined) ref.current = element;
    },
    [ref],
  );

  return { attach, stacked: enabled && stacked };
}
