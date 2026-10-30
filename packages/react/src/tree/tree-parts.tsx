import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { Glyph, Icon } from '../icon';
import { TreeDepthContext, useTree, useTreeDepth } from './tree-context';
import type {
  TreeGroupProps,
  TreeMessageProps,
  TreeNodeProps,
  TreeNodeRootProps,
  TreePartProps,
} from './tree.types';
import { SPINNER_RING } from '../button/spinner-ring';

/** The selector the root reads its visible rows through, in DOM order. */
export const NODE_SELECTOR = "[data-part='node']";

/**
 * One node, and the facts the root reads back off it.
 *
 * The visible collection is read from the DOM rather than from a registry, as
 * `listbox` and `menu` already do: document order is reading order, a collapsed
 * branch renders no group and therefore contributes no rows, and nothing has to
 * be registered, unregistered or ordered by mount time. The flattening a tree
 * would otherwise need is the browser's own.
 *
 * `aria-disabled` and never the native attribute: the pattern needs a disabled
 * node to keep its place in the set, and `navigateDisabled` is what decides
 * whether the arrows land on it.
 */
export function TreeNode({
  actions,
  children,
  depth: statedDepth,
  description,
  disabled,
  hasChildren,
  icon,
  label,
  loading,
  match,
  meta,
  offset,
  onClick,
  pinned,
  render,
  textValue,
  value,
  ...nativeProps
}: TreeNodeProps) {
  const tree = useTree();
  const counted = useTreeDepth();
  const depth = statedDepth ?? counted;

  const branch = hasChildren === true || children !== undefined;
  const expanded = branch && tree.isExpanded(value);
  const selected = tree.isSelected(value);
  const indeterminate = tree.isIndeterminate(value);
  const isDisabled = disabled === true || tree.disabled === true;
  const chosen = tree.selectionMode === 'none' ? undefined : selected;

  const rootProps: TreeNodeRootProps = keyedProps({
    ...nativeProps,
    'aria-busy': branch && loading === true ? true : undefined,
    /* A leaf carrying `aria-expanded` is announced as a parent, so only a
       branch has it at all. */
    'aria-expanded': branch ? expanded : undefined,
    'aria-checked': tree.indicator === 'checkbox' ? chosen : undefined,
    'aria-disabled': isDisabled ? true : undefined,
    'aria-labelledby': tree.labelId(value),
    'aria-level': tree.levelOf(value),
    'aria-posinset': tree.posInSetOf(value),
    'aria-selected': tree.indicator === 'checkbox' ? undefined : chosen,
    'aria-setsize': tree.setSizeOf(value),
    ...(branch ? { 'data-branch': '' as const } : {}),
    ...(tree.isActive(value) ? { 'data-current': '' as const } : {}),
    'data-depth': depth,
    ...(isDisabled ? { 'data-disabled': '' as const } : {}),
    ...(expanded ? { 'data-expanded': '' as const } : {}),
    ...(indeterminate ? { 'data-indeterminate': '' as const } : {}),
    'data-key': value,
    ...(loading === true ? { 'data-loading': '' as const } : {}),
    ...(match === undefined ? {} : { 'data-match': match }),
    'data-part': 'node',
    ...(pinned === true ? { 'data-pinned': '' as const } : {}),
    ...(selected ? { 'data-selected': '' as const } : {}),
    ...(!expanded && tree.holdsSelection(value) ? { 'data-selected-within': '' as const } : {}),
    ...(textValue === undefined ? {} : { 'data-text-value': textValue }),
    id: tree.nodeId(value),
    role: 'treeitem',
    style: {
      ...nativeProps.style,
      ['--slotted-tree-depth' as string]: depth,
      ...(offset === undefined ? {} : { ['--slotted-tree-row-offset' as string]: `${offset}px` }),
    },
    tabIndex: tree.nodeTabIndex(value),
  });

  const row = (
    <div
      data-part="row"
      data-part-row=""
      onClick={(event) => {
        onClick?.(event as never);
        if (event.defaultPrevented) return;
        tree.press(value, event);
      }}
    >
      {tree.guides && depth > 0 ? (
        <span data-part="guide" data-part-guide="" aria-hidden="true" />
      ) : null}
      {/* The wait stands in the chevron's own cell, so a branch that starts
          fetching moves neither its own name nor the rows below it. */}
      {branch && loading === true ? (
        <span
          data-part="loader"
          data-part-loader=""
          data-ui="spinner"
          data-ui-spinner=""
          aria-hidden="true"
        >
          {SPINNER_RING}
        </span>
      ) : (
        <span
          data-part="expander"
          data-part-expander=""
          aria-hidden="true"
          onClick={(event) => {
            event.stopPropagation();
            if (!branch || isDisabled) return;
            tree.pressExpander(value, event);
          }}
        >
          {/* A leaf keeps the box and draws nothing in it. */}
          {branch ? (
            <Icon>
              <Glyph name="chevron-right" />
            </Icon>
          ) : null}
        </span>
      )}
      {tree.indicator === 'checkbox' ? (
        <span
          data-part="indicator"
          data-part-indicator=""
          aria-hidden="true"
          onClick={(event) => {
            event.stopPropagation();
            if (isDisabled) return;
            tree.pressIndicator(value, event);
          }}
        >
          {/* The dash outranks the check: a branch partly chosen shows the
              state its children are in. */}
          <Icon>
            <Glyph name={indeterminate ? 'minus' : 'check'} />
          </Icon>
        </span>
      ) : null}
      {icon === undefined ? null : (
        <span data-part="icon" data-part-icon="" aria-hidden="true">
          {icon}
        </span>
      )}
      <span data-part="label" data-part-label="" id={tree.labelId(value)}>
        {label}
      </span>
      {description === undefined ? null : (
        <span data-part="description" data-part-description="">
          {description}
        </span>
      )}
      {meta === undefined ? null : (
        <span data-part="meta" data-part-meta="">
          {meta}
        </span>
      )}
      {actions === undefined ? null : (
        <div data-part="actions" data-part-actions="">
          {actions}
        </div>
      )}
    </div>
  );

  /**
   * A branch renders its group only while it is open. A group that stayed in
   * the DOM behind `display: none` would put every descendant of every closed
   * branch in the reading order the root counts, which is the flattening this
   * family reads from the DOM to avoid.
   */
  const group =
    branch && expanded && children !== undefined ? (
      <ul
        data-part="group"
        data-part-group=""
        role="group"
        aria-busy={loading === true ? true : undefined}
      >
        {children}
      </ul>
    ) : null;

  const content = (
    <TreeDepthContext.Provider value={depth + 1}>
      {row}
      {group}
    </TreeDepthContext.Provider>
  );

  if (render) return render({ ...rootProps, children: content });
  return <li {...rootProps}>{content}</li>;
}

/**
 * A group written by hand, for a consumer that renders its own `li` elements
 * rather than using `Tree.Node`. `Tree.Node` renders its own.
 */
export function TreeGroup({ children, ...nativeProps }: TreeGroupProps) {
  const depth = useTreeDepth();
  return (
    <ul {...withSelectorKey(nativeProps, 'part', 'group')} role="group">
      <TreeDepthContext.Provider value={depth + 1}>{children}</TreeDepthContext.Provider>
    </ul>
  );
}

export function TreeLabel({ children, ...nativeProps }: TreePartProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'label')}>{children}</span>;
}

export function TreeDescription({ children, ...nativeProps }: TreePartProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'description')}>{children}</span>;
}

export function TreeMeta({ children, ...nativeProps }: TreePartProps) {
  return <span {...withSelectorKey(nativeProps, 'part', 'meta')}>{children}</span>;
}

export function TreeIcon({ children, ...nativeProps }: TreePartProps) {
  return (
    <span {...withSelectorKey(nativeProps, 'part', 'icon')} aria-hidden="true">
      {children}
    </span>
  );
}

export function TreeEmpty({ children, ...nativeProps }: TreeMessageProps) {
  return <div {...withSelectorKey(nativeProps, 'part', 'empty')}>{children}</div>;
}
