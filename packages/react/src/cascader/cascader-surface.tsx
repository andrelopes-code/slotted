import { withSelectorKey } from '@slotted/core/selector-key';
import type { CascaderColumnView, CascaderCrumb, CascaderNodeView } from '@slotted/core/cascader';
import { matchRanges } from '@slotted/core/highlight';
import { useEffect, useRef } from 'react';
import type { CSSProperties, MouseEvent, ReactNode, Ref } from 'react';

import { Button } from '../button';
import { Highlight } from '../highlight';
import { Glyph, Icon } from '../icon';
import type { CascaderState } from './cascader-state';
import type { CascaderDataProps } from './cascader.types';
import { SPINNER_RING } from '../button/spinner-ring';

interface SurfaceProps<T> {
  state: CascaderState<T>;
  data: CascaderDataProps<T>;
  separator: string;
  expandOn: 'press' | 'hover';
  hoverDelay: number;
  /** The id the tree carries, for `aria-controls`. */
  treeId: string;
  /** Props the tree element takes: focus and keys, when it owns them. */
  treeProps?: Record<string, unknown> | undefined;
  treeRef?: Ref<HTMLDivElement> | undefined;
  /** Whether a single commit of a branch closes the popup. */
  onBranchCommit?: (() => void) | undefined;
  label: string | undefined;
  labelledBy: string | undefined;
}

/**
 * What the surface holds, the same in the popup and on the page: the
 * breadcrumb, then the tree with its columns, or the results of a query. The
 * picture is `cascaderView`'s and every press goes back through the state, so
 * the two hosts cannot draw two different things from one value.
 */
export function CascaderSurfaceBody<T>({
  data,
  expandOn,
  hoverDelay,
  label,
  labelledBy,
  separator,
  state,
  treeId,
  treeProps,
  treeRef,
}: SurfaceProps<T>) {
  const { t, view } = state;
  const hover = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hover.current), []);

  const labelOf = (key: string | undefined) =>
    key === undefined ? t('root') : (state.collection.nodeFor(key)?.label ?? key);

  const onNodeClick = (node: CascaderNodeView, event: MouseEvent<HTMLElement>) => {
    if (node.disabled) return;
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    const onBox = (event.target as Element).closest("[data-part='indicator']") !== null;
    const onExpander = (event.target as Element).closest("[data-part='expander']") !== null;

    if (view.searching) {
      if (node.selectable) state.choose(node.key, reason, event.nativeEvent);
      else if (node.branch) {
        state.setQuery('', 'select', event.nativeEvent);
        state.showLevel(node.key, reason, event.nativeEvent);
      }
      return;
    }
    if (state.layout === 'tree') {
      if (node.branch && (onExpander || !node.selectable)) {
        state.toggleExpanded(node.key, reason, event.nativeEvent);
        return;
      }
      state.choose(node.key, reason, event.nativeEvent);
      return;
    }
    if (state.multiple && onBox) {
      state.choose(node.key, reason, event.nativeEvent);
      return;
    }
    if (node.branch) {
      state.showLevel(node.key, reason, event.nativeEvent);
      state.setActive(node.key, reason, event.nativeEvent);
      /* A branch the consumer made selectable is chosen as it opens, and in a
         single selection it does not close the popup: the reader is drilling. */
      if (node.selectable && !state.multiple) {
        state.choose(node.key, reason, event.nativeEvent, { close: false });
      }
      return;
    }
    state.choose(node.key, reason, event.nativeEvent);
  };

  const onPointerEnter = (node: CascaderNodeView) => {
    clearTimeout(hover.current);
    if (expandOn !== 'hover' || !node.branch || node.disabled || state.layout === 'tree') return;
    if (view.searching) return;
    /* Hover shows a level after a rest and never commits, so a pointer
       crossing the panel cannot change the value. */
    hover.current = setTimeout(() => state.showLevel(node.key, 'pointer'), hoverDelay);
  };

  const renderLabel = (node: CascaderNodeView): ReactNode => {
    const item = state.itemFor(node.key);
    if (item !== undefined && data.renderNode !== undefined) return data.renderNode(item, node);
    if (!view.searching || state.query === '') return node.label;
    /* The `highlight` family draws the match, from the collator the search
       used, so the mark reads the same here as in every other filtered list. */
    const ranges = matchRanges(node.label, state.query, { locale: state.locale });
    return <Highlight ranges={ranges} text={node.label} />;
  };

  const renderNode = (node: CascaderNodeView) => {
    const item = state.itemFor(node.key);
    const description = view.searching
      ? node.trail.map(labelOf).join(` ${separator} `)
      : item === undefined
        ? undefined
        : data.getDescription?.(item);
    const icon = item === undefined ? undefined : data.renderIcon?.(item);
    const meta = !node.branch
      ? undefined
      : /* Inside a chosen branch the count is how many are chosen there, in the
           accent ink; how many there are is a different fact, and the two side
           by side read as a fraction of the wrong things. */
        state.multiple && node.selectedInside > 0
        ? node.selectedInside
        : node.childrenCount;
    const style =
      state.layout === 'tree' && !view.searching
        ? ({ '--slotted-cascader-depth': node.depth } as CSSProperties)
        : undefined;

    return (
      <div
        aria-busy={node.loading ? true : undefined}
        aria-checked={state.multiple ? (node.indeterminate ? 'mixed' : node.selected) : undefined}
        aria-disabled={node.disabled ? true : undefined}
        aria-expanded={node.branch && !view.searching ? node.expanded : undefined}
        aria-level={view.searching ? undefined : node.level}
        aria-posinset={view.searching ? undefined : node.posInSet}
        aria-selected={state.multiple ? undefined : node.selected}
        aria-setsize={view.searching ? undefined : node.setSize}
        data-current={node.current ? '' : undefined}
        data-disabled={node.disabled ? '' : undefined}
        data-expanded={node.expanded && !view.searching ? '' : undefined}
        data-indeterminate={node.indeterminate ? '' : undefined}
        data-loading={node.loading ? '' : undefined}
        data-part="node"
        data-part-node=""
        data-selected={node.selected ? '' : undefined}
        id={state.nodeId(node.key)}
        key={node.key}
        onClick={(event) => onNodeClick(node, event)}
        onPointerEnter={() => onPointerEnter(node)}
        onPointerLeave={() => clearTimeout(hover.current)}
        onPointerMove={(event) => {
          if (!node.current) state.setActive(node.key, 'pointer', event.nativeEvent);
        }}
        role="treeitem"
        style={style}
      >
        {state.multiple ? (
          <span data-part="indicator" data-part-indicator="">
            <Icon>
              <Glyph name={node.indeterminate ? 'minus' : 'check'} />
            </Icon>
          </span>
        ) : null}
        {icon === undefined ? null : (
          <span data-part="icon" data-part-icon="">
            {icon}
          </span>
        )}
        <span data-part="label" data-part-label="">
          {renderLabel(node)}
        </span>
        {description === undefined || description === '' ? null : (
          <span data-part="description" data-part-description="">
            {description}
          </span>
        )}
        {meta === undefined ? null : (
          <span aria-hidden="true" data-part="meta" data-part-meta="">
            {meta}
          </span>
        )}
        {node.branch ? (
          <span aria-hidden="true" data-part="expander" data-part-expander="">
            {node.loading ? (
              <span data-part="root" data-part-root="" data-ui="spinner" data-ui-spinner="">
                {SPINNER_RING}
              </span>
            ) : (
              <Icon directional>
                <Glyph name="chevron-right" />
              </Icon>
            )}
          </span>
        ) : state.multiple ? null : (
          <span data-part="indicator" data-part-indicator="">
            <Icon>
              <Glyph name="check" />
            </Icon>
          </span>
        )}
      </div>
    );
  };

  const renderColumn = (column: CascaderColumnView, index: number) => {
    const name = labelOf(column.parent);
    const parentItem = column.parent === undefined ? undefined : state.itemFor(column.parent);
    return (
      <div
        aria-busy={column.pending && !column.failed ? true : undefined}
        aria-label={name}
        data-part="column"
        data-part-column=""
        key={column.parent ?? `root-${index}`}
        role="group"
      >
        {column.nodes.map(renderNode)}
        {column.pending && !column.failed
          ? [0, 1, 2].map((row) => (
              <div aria-hidden="true" data-part="loader" data-part-loader="" key={row}>
                <span
                  data-loading=""
                  data-part="root"
                  data-part-root=""
                  data-shape="text"
                  data-ui="skeleton"
                  data-ui-skeleton=""
                />
              </div>
            ))
          : null}
        {column.failed && column.parent !== undefined ? (
          <div data-part="status" data-part-status="" role="status">
            {t('failed', { label: name })}
            <Button
              onClick={() => {
                const key = column.parent as string;
                if (parentItem !== undefined) data.onRetry?.(key);
              }}
              size="sm"
              variant="outline"
            >
              {t('retry')}
            </Button>
          </div>
        ) : null}
        {!column.pending && !column.failed && column.nodes.length === 0 ? (
          <div data-part="empty" data-part-empty="">
            {t('empty')}
          </div>
        ) : null}
      </div>
    );
  };

  const renderCrumb = (crumb: CascaderCrumb, index: number) => {
    const separatorIcon =
      index === 0 ? null : (
        <Icon directional key={`separator-${index}`}>
          <Glyph name="chevron-right" />
        </Icon>
      );
    if (crumb.type === 'collapsed') {
      return [
        separatorIcon,
        <button
          aria-label={t('back', { label: labelOf(crumb.target) })}
          data-collapsed=""
          data-part="crumb"
          data-part-crumb=""
          key="collapsed"
          onClick={(event) =>
            state.goTo(crumb.target, event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent)
          }
          type="button"
        >
          …
        </button>,
      ];
    }
    return [
      separatorIcon,
      <button
        aria-current={crumb.current ? 'location' : undefined}
        data-part="crumb"
        data-part-crumb=""
        key={crumb.key ?? 'root'}
        onClick={(event) => {
          if (crumb.current) return;
          state.goTo(crumb.key, event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent);
        }}
        type="button"
      >
        {labelOf(crumb.key)}
      </button>,
    ];
  };

  const crumbs = view.crumbs;

  return (
    <>
      {crumbs.length > 0 ? (
        <nav aria-label={t('breadcrumb')} data-part="breadcrumb" data-part-breadcrumb="">
          {crumbs.flatMap(renderCrumb)}
          {state.layout === 'columns' ? (
            <Icon directional>
              <Glyph name="chevron-right" />
            </Icon>
          ) : null}
        </nav>
      ) : null}
      <div
        {...withSelectorKey(treeProps, 'part', 'panel')}
        aria-activedescendant={
          treeProps?.['tabIndex'] !== undefined && state.activeKey !== null
            ? state.nodeId(state.activeKey)
            : undefined
        }
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-multiselectable={state.multiple ? true : undefined}

        id={treeId}
        ref={treeRef}
        role="tree"
      >
        {view.searching ? (
          <div aria-label={t('search')} data-part="column" data-part-column="" role="group">
            {view.results.map(renderNode)}
            {view.results.length === 0 ? (
              <div data-part="empty" data-part-empty="">
                {t('noResults', { query: state.query })}
              </div>
            ) : null}
            <div data-part="status" data-part-status="" role="status">
              {view.results.length === 0 ? '' : t('results', { count: view.results.length })}
            </div>
          </div>
        ) : (
          view.columns.map(renderColumn)
        )}
      </div>
    </>
  );
}

/** Brings the active node into view; nothing on the surface holds focus. */
export function useRevealActive(container: HTMLElement | null, id: string | null) {
  useEffect(() => {
    if (container === null || id === null) return;
    const node = container.ownerDocument.getElementById(id);
    node?.scrollIntoView?.({ block: 'nearest' });
  }, [container, id]);
}
