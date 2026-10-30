import { definedProps, keyedProps } from '@slotted/core/selector-key';
import { createCollapse } from '@slotted/core/overflow';
import {
  Children,
  isValidElement,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Glyph, Icon } from '../icon';
import { BreadcrumbItemProvider, useBreadcrumb, useBreadcrumbItem } from './breadcrumb';
import type {
  BreadcrumbItemProps,
  BreadcrumbItemRootProps,
  BreadcrumbLinkProps,
  BreadcrumbLinkRootProps,
  BreadcrumbListProps,
  BreadcrumbListRootProps,
  BreadcrumbPageProps,
  BreadcrumbPageRootProps,
  BreadcrumbTriggerProps,
  BreadcrumbTriggerRootProps,
} from './breadcrumb.types';

/**
 * Which crumbs survive a collapse, as indices into the trail.
 *
 * A collapsed trail is always the same shape — so many at the start, the
 * ellipsis, so many at the end — whatever it is folding, which is what makes
 * `maxItems` a number a consumer can predict from. It refuses only when there
 * is nothing left in the middle to hide.
 *
 * It once refused to hide a single crumb as well, on the reasoning that
 * replacing one crumb with one button saves nothing. That reasoning is wrong
 * twice: the crumb may be a forty-character compound and the button is one
 * target wide, and it made `maxItems` mean different things at different
 * depths.
 */
export function collapsedRange(count: number, before: number, after: number) {
  const kept = Math.max(0, before) + Math.max(0, after);
  if (count <= kept) return undefined;
  return { start: Math.max(0, before), end: count - Math.max(0, after) };
}

/**
 * The ordered list, and the one part that knows how many crumbs there are.
 *
 * It maps its children rather than rendering them straight through, because
 * three facts about a crumb can only be known from the outside: whether it is
 * the last one — the last draws no separator — whether the collapse is hiding
 * it, and whether it is the first one an expansion reveals, which is where
 * focus goes when the ellipsis stops existing.
 */
export function BreadcrumbList({ children, ref, render, ...nativeProps }: BreadcrumbListProps) {
  const trail = useBreadcrumb();
  const items = Children.toArray(children).filter((child) => isValidElement(child));
  const before = Math.max(0, trail.itemsBeforeCollapse);
  const after = Math.max(0, trail.itemsAfterCollapse);
  /**
   * The range is computed whether or not the trail is expanded, because two
   * different things read it. The collapse reads it only while folded; the
   * focus target reads it afterwards, and it has to still be there — the id
   * used to disappear with the ellipsis, which left focus on a removed button
   * and therefore on the body.
   */
  const range =
    trail.maxItems <= 0 || items.length <= trail.maxItems
      ? undefined
      : collapsedRange(items.length, before, after);
  const collapsed = trail.expanded ? undefined : range;
  /** Whether there is a middle at all: crumbs outside the ones that never fold. */
  const middle = items.length > before + after;

  /**
   * The width collapse runs only while the count has hidden nothing: a trail
   * the count already folded shows only the crumbs that never fold, so there
   * is nothing left for the width to take, and one writer per `hidden`
   * attribute is what keeps the two from undoing each other. React writes it on
   * the crumbs the count hides; `createCollapse` writes it on the crumbs the
   * width hides and on the ellipsis's own item.
   */
  const measuring =
    trail.overflow === 'collapse' && !trail.expanded && range === undefined && middle;
  const list = useRef<HTMLOListElement | null>(null);
  const ellipsis = useRef<HTMLLIElement | null>(null);
  const [folded, setFolded] = useState(0);
  const { setCollapsed } = trail;

  useLayoutEffect(() => {
    const container = list.current;
    if (!measuring || container === null) {
      setFolded(0);
      return;
    }
    const units = () =>
      [...container.children].filter(
        (unit): unit is HTMLElement => unit instanceof HTMLElement && unit !== ellipsis.current,
      );
    const handle = createCollapse(container, {
      /* Only the middle folds: the first crumbs and the last ones never do. */
      collapsible: (unit) => {
        const index = units().indexOf(unit);
        return index >= before && index < units().length - after;
      },
      onChange: (hidden) => setFolded(hidden.length),
      /* Nearest the root first, so the folded run stays beside the ellipsis. */
      rank: (unit) => units().indexOf(unit),
      trigger: () => ellipsis.current,
      units,
    });
    return () => {
      handle.destroy();
      setFolded(0);
    };
  }, [after, before, items.length, measuring]);

  const hiddenCount = collapsed === undefined ? folded : collapsed.end - collapsed.start;
  useLayoutEffect(() => {
    setCollapsed(hiddenCount);
  }, [hiddenCount, setCollapsed]);

  const setList = useCallback(
    (node: HTMLOListElement | null) => {
      list.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref !== null && ref !== undefined) ref.current = node;
    },
    [ref],
  );

  const laidOut: ReactNode[] = [];
  for (const [index, child] of items.entries()) {
    if (index === before && (collapsed !== undefined || measuring)) {
      laidOut.push(
        <BreadcrumbEllipsis
          key="slotted-breadcrumb-ellipsis"
          hidden={hiddenCount}
          /* Until the width has been measured the ellipsis stands for nothing,
             so it is rendered hidden and `createCollapse` owns it from there. */
          idle={collapsed === undefined}
          itemRef={ellipsis}
        />,
      );
    }
    const hidden = collapsed !== undefined && index >= collapsed.start && index < collapsed.end;
    laidOut.push(
      <BreadcrumbItemProvider
        key={child.key ?? index}
        value={{
          hidden,
          last: index === items.length - 1,
          /* The first crumb an expansion reveals, whichever collapse hid it. */
          revealedId: middle && index === before ? trail.firstRevealedId : undefined,
        }}
      >
        {child}
      </BreadcrumbItemProvider>,
    );
  }

  const rootProps: BreadcrumbListRootProps = keyedProps({
    ...nativeProps,
    children: laidOut,
    'data-part': 'list',
    ref: setList,
  });

  return render === undefined ? <ol {...rootProps} /> : render(rootProps);
}

/**
 * The separator, drawn after every crumb but the last. It is `aria-hidden`
 * because the `nav` and the `ol` already say what it means, which is the
 * reasoning the APG example gives for drawing it in CSS.
 */
function Separator({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" data-part="separator" data-part-separator="">
      {children}
    </span>
  );
}

/**
 * The control that reveals what the collapse hides.
 *
 * Its accessible name carries the count, because three dots say nothing about
 * how much is behind them. It is a `button` with `aria-expanded`, so a reader
 * hears that it opens something before pressing it.
 */
function BreadcrumbEllipsis({
  hidden,
  idle,
  itemRef,
}: {
  hidden: number;
  idle: boolean;
  itemRef: { current: HTMLLIElement | null };
}) {
  const trail = useBreadcrumb();

  return (
    <li data-part="item" data-part-item="" hidden={idle} ref={itemRef}>
      <button
        aria-expanded={false}
        aria-label={trail.t('showHidden', { count: hidden })}
        data-part="ellipsis"
        data-part-ellipsis=""
        onClick={(event) => trail.expand('pointer', event)}
        onKeyDown={(event) => {
          /* `Enter` and `Space` both activate a button, and the browser turns
             each into a click. This is the reason the request carries, and it
             is the difference between a press and a key. */
          if (event.key === 'Enter' || event.key === ' ') trail.expand('keyboard', event);
        }}
        type="button"
      >
        <Icon>
          <Glyph name="ellipsis" />
        </Icon>
      </button>
      <Separator>{trail.separator}</Separator>
    </li>
  );
}

/**
 * One ancestor, or the current page. It carries the separator after it, so a
 * consumer never writes one and never leaves a trailing one behind.
 */
export function BreadcrumbItem({ children, ref, render, ...nativeProps }: BreadcrumbItemProps) {
  const trail = useBreadcrumb();
  const item = useBreadcrumbItem();

  const rootProps: BreadcrumbItemRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        {item?.last === true ? null : <Separator>{trail.separator}</Separator>}
      </>
    ),
    'data-part': 'item',
    hidden: item?.hidden === true ? true : nativeProps.hidden,
  });

  return render === undefined ? <li {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * An ancestor that can be reached. It is a plain anchor, so the role, `Enter`,
 * the context menu and every modified click come from the platform; `render`
 * substitutes it for a router's own link and hands over the destination.
 */
export function BreadcrumbLink({ children, ref, render, ...nativeProps }: BreadcrumbLinkProps) {
  const item = useBreadcrumbItem();

  const rootProps: BreadcrumbLinkRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'link',
    /* Focus lands here when the ellipsis that hid this crumb stops existing. */
    id: nativeProps.id ?? item?.revealedId,
  });

  return render === undefined ? <a {...rootProps} ref={ref} /> : render(definedProps(rootProps));
}

/**
 * A crumb that opens a menu of its siblings — the organisation, the project,
 * the environment. It is a `button`, because an `a` without `href` takes no
 * focus, dressed as the crumb it stands for, with a chevron after the label.
 * The menu is composed around it:
 *
 * ```tsx
 * <Menu>
 *   <MenuTrigger render={(props) => <BreadcrumbTrigger {...props}>web-app</BreadcrumbTrigger>} />
 *   <MenuContent>…</MenuContent>
 * </Menu>
 * ```
 *
 * `current` keeps `aria-current="page"` on the switcher of the page the reader
 * is on, which a switcher does not stop being.
 */
export function BreadcrumbTrigger({
  children,
  current,
  ref,
  render,
  ...nativeProps
}: BreadcrumbTriggerProps) {
  const item = useBreadcrumbItem();

  const rootProps: BreadcrumbTriggerRootProps = keyedProps({
    type: 'button',
    ...nativeProps,
    'aria-current': current === true ? 'page' : nativeProps['aria-current'],
    children: (
      <>
        {children}
        <Icon>
          <Glyph name="chevron-down" />
        </Icon>
      </>
    ),
    'data-part': 'trigger',
    id: nativeProps.id ?? item?.revealedId,
  });

  return render === undefined ? <button {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * The page the reader is on. It is text rather than a link, because a link to
 * the page you are already on goes nowhere, and it carries `aria-current="page"`
 * — the value the ARIA specification names for a link within a set of pages.
 */
export function BreadcrumbPage({ children, ref, render, ...nativeProps }: BreadcrumbPageProps) {
  const rootProps: BreadcrumbPageRootProps = keyedProps({
    ...nativeProps,
    'aria-current': 'page',
    children,
    'data-part': 'page',
  });

  return render === undefined ? <span {...rootProps} ref={ref} /> : render(rootProps);
}
