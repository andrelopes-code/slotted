import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/breadcrumb/breadcrumb.css';

import { breadcrumbMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';

import { useMessages } from '../i18n';
import { useBreadcrumbDefaults } from './breadcrumb-defaults';
import type {
  BreadcrumbContextValue,
  BreadcrumbExpandReason,
  BreadcrumbItemContextValue,
  BreadcrumbProps,
  BreadcrumbRootProps,
} from './breadcrumb.types';

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined);
const BreadcrumbItemContext = createContext<BreadcrumbItemContextValue | undefined>(undefined);

/**
 * What the trail around this part says. A part outside a trail has no landmark
 * to belong to and no collapse to answer, so this throws rather than rendering
 * markup that looks right and behaves like nothing.
 */
export function useBreadcrumb(): BreadcrumbContextValue {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('Breadcrumb parts must be rendered inside a Breadcrumb.');
  }
  return context;
}

export function useBreadcrumbItem(): BreadcrumbItemContextValue | undefined {
  return useContext(BreadcrumbItemContext);
}

export const BreadcrumbItemProvider = BreadcrumbItemContext.Provider;

/**
 * The trail of ancestors above the current page.
 *
 * **The landmark and the list are the platform's.** `nav` makes the trail
 * findable and `ol` carries the hierarchy and the set size, which is the whole
 * of the APG's Breadcrumb pattern: it lists no keyboard interaction and two
 * attributes, and both are written here rather than reimplemented.
 *
 * **The collapse expands in place.** shadcn and MUI both put the hidden crumbs
 * behind an overlay; an overlay needs a layer, a positioner and a dismissal
 * policy, and this needs none of them. The hidden crumbs carry `hidden`, so
 * they leave the accessibility tree with the page — and the button that hides
 * them names the count, which is what a reader hears in place of them.
 *
 * **A trail that does not fit folds.** With `overflow="collapse"` the list
 * measures itself and folds the middle crumbs that its width cannot hold into
 * the same ellipsis, nearest the root first; what folded is read from the
 * layout and reported in `data-collapsed`, not owned by anyone.
 *
 * **It is not a back button.** The trail is where the page sits in the
 * hierarchy, not where the reader came from, and section 7 of the feature guide
 * says so.
 */
export function Breadcrumb({
  children,
  defaultExpanded,
  expanded,
  itemsAfterCollapse,
  itemsBeforeCollapse,
  maxItems,
  messages,
  onExpandedChange,
  overflow,
  render,
  separator,
  ...nativeProps
}: BreadcrumbProps) {
  const defaults = useBreadcrumbDefaults();
  const t = useMessages(breadcrumbMessages, messages);
  const generatedId = useId();

  const [own, setOwn] = useState(defaultExpanded ?? false);
  const [collapsed, setCollapsed] = useState(0);
  const current = expanded ?? own;
  const revealedId = `slotted-breadcrumb-${generatedId}`;

  /**
   * Focus has to be given somewhere: the ellipsis stops existing the moment it
   * is pressed, and focus on a removed element is lost to the body. The flag
   * survives one render because the crumb it moves to does not exist until the
   * trail has expanded, and it is set only by this family's own control — a
   * consumer who expands the trail from elsewhere moves nobody's focus.
   */
  const pendingFocus = useRef(false);

  const expand = (reason: BreadcrumbExpandReason, source?: unknown) => {
    const state = createControllable<boolean>({
      controlled: expanded,
      initial: current,
      onRequest: (request) => onExpandedChange?.(request.value, request),
    });
    pendingFocus.current = true;
    if (state.request(true, reason, source)) setOwn(true);
  };

  useEffect(() => {
    if (!pendingFocus.current || !current) return;
    pendingFocus.current = false;
    document.getElementById(revealedId)?.focus();
  }, [current, revealedId]);

  const context: BreadcrumbContextValue = {
    expand,
    expanded: current,
    firstRevealedId: revealedId,
    itemsAfterCollapse: itemsAfterCollapse ?? defaults.itemsAfterCollapse ?? 2,
    itemsBeforeCollapse: itemsBeforeCollapse ?? defaults.itemsBeforeCollapse ?? 1,
    maxItems: maxItems ?? defaults.maxItems ?? 8,
    overflow: overflow ?? defaults.overflow ?? 'collapse',
    separator: separator ?? defaults.separator,
    setCollapsed,
    t,
  };

  const rootProps: BreadcrumbRootProps = keyedProps({
    'aria-label': t('label'),
    ...nativeProps,
    children,
    'data-collapsed': collapsed > 0 ? String(collapsed) : undefined,
    'data-expanded': current ? '' : undefined,
    'data-part': 'root',
    'data-ui': 'breadcrumb',
  });

  return (
    <BreadcrumbContext.Provider value={context}>
      {render === undefined ? <nav {...rootProps} /> : render(rootProps)}
    </BreadcrumbContext.Provider>
  );
}
