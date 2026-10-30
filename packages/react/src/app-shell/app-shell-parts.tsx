import { keyedProps } from '@slotted/core/selector-key';
import {
  anchorsAtStart,
  EXTENT_LARGE_STEP_PX,
  EXTENT_STEP_PX,
  extentAtPoint,
  holdResizeGesture,
  stepAmountFromPixels,
  stepExtent,
} from '@slotted/core/extent';
import type { ExtentRect, ExtentSide } from '@slotted/core/extent';
import { clamp } from '@slotted/core/measure';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  Ref,
} from 'react';

import { Glyph, Icon } from '../icon';
import { ProgressBar, useProgressIndicatorDefaults } from '../progress-indicator';
import { useLoadingVisibility } from '../progress-indicator/use-loading-visibility';
import { useAppShell } from './app-shell';
import type {
  AppShellActionsProps,
  AppShellAsideBodyProps,
  AppShellAsideProps,
  AppShellAsideResizerProps,
  AppShellAsideSectionProps,
  AppShellAsideToggleProps,
  AppShellBannerProps,
  AppShellBrandProps,
  AppShellCenterProps,
  AppShellContextValue,
  AppShellFooterProps,
  AppShellMainProps,
  AppShellNavProps,
  AppShellNavSectionProps,
  AppShellNavToggleProps,
  AppShellProgressProps,
} from './app-shell.types';

/**
 * Keeps the consumer's own ref and gives the shell the node its layer, its
 * focus scope and its `inert` pass need. A part that took one and dropped the
 * other would be the defect `docs/build-briefing.md` records under _A family
 * that renders another family's part composes its ref, not only its props_.
 */
function useNode(
  slot: keyof AppShellContextValue['nodes'],
  ref: Ref<never> | undefined,
): (node: HTMLElement | null) => void {
  const shell = useAppShell();
  return useCallback(
    (node: HTMLElement | null) => {
      shell.nodes[slot] = node;
      if (typeof ref === 'function') (ref as (value: HTMLElement | null) => void)(node);
      else if (ref !== null && ref !== undefined) {
        (ref as { current: HTMLElement | null }).current = node;
      }
    },
    [ref, shell.nodes, slot],
  );
}

/** The consumer's ref as a callback, which an element `render` substitutes attaches whatever its type. */
function useAttach(ref: Ref<never> | undefined): (node: HTMLElement | null) => void {
  return useCallback(
    (node: HTMLElement | null) => {
      if (typeof ref === 'function') (ref as (value: HTMLElement | null) => void)(node);
      else if (ref !== null && ref !== undefined) {
        (ref as { current: HTMLElement | null }).current = node;
      }
    },
    [ref],
  );
}

/** A region says it exists, so a skip link is never written to a target nobody rendered. */
function useRegion(region: 'nav' | 'main' | 'aside') {
  const shell = useAppShell();
  useEffect(() => shell.register(region), [region, shell]);
}

/** A part rendered into another element: the props carry the ref, which is also how the shell registers the part. */
function part(
  props: HTMLAttributes<HTMLElement> & { ref?: unknown },
  render: ((p: never) => ReactNode) | undefined,
) {
  return render === undefined ? null : render(props as never);
}

/**
 * The `banner` landmark: a `header` in the context of the `body`, so it needs
 * no `role`. What goes in it is the consumer's — `top-navigation` fills it in
 * wave 8 — and where it goes is the shell's, which is what `brand` and
 * `actions` are.
 */
export function AppShellBanner({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellBannerProps) {
  const attach = useNode('banner', ref as never);
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'banner',
    style,
  });
  return part({ ...rootProps, ref: attach }, render) ?? <header {...rootProps} ref={attach} />;
}

/** The start cluster of the banner: the toggle, the mark, the name of the workspace. */
export function AppShellBrand({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellBrandProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'brand',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/**
 * The middle of the bar, and the one cluster that grows: a search, a trail, a
 * route title, tabs. Without it a bar is two clusters and a void.
 */
export function AppShellCenter({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellCenterProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'center',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/** The end cluster, pushed there by the space it takes, so an empty one costs nothing. */
export function AppShellActions({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellActionsProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'actions',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/**
 * The `navigation` landmark, and the one element all three modes share: the
 * rail is this `nav` at another inline size, which is what keeps the focus and
 * the scroll position where the reader left them.
 *
 * A document with more than one `navigation` needs a unique label on each, so
 * this one carries the family's, replaceable per instance.
 */
export function AppShellNav({
  'aria-label': ariaLabel,
  children,
  className,
  id,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellNavProps) {
  const shell = useAppShell();
  const attach = useNode('nav', ref as never);
  useRegion('nav');

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-label': ariaLabel ?? shell.t('nav'),
    children,
    className,
    'data-part': 'nav',
    id: id ?? shell.navId,
    style,
  });
  return part({ ...rootProps, ref: attach }, render) ?? <nav {...rootProps} ref={attach} />;
}

/**
 * A strip of marks before the column: the first level of a two-level
 * navigation, inside the one navigation landmark and under its one open state.
 * Closed to `rail`, the region keeps this strip and lets the column go.
 */
export function AppShellNavRail({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellNavSectionProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'nav-rail',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/** The pinned top of the navigation column. */
export function AppShellNavHeader({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellNavSectionProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'nav-header',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/** The middle, and the only part of the column that scrolls. */
export function AppShellNavBody({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellNavSectionProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'nav-body',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/** The pinned bottom: the account, the collapse control. */
export function AppShellNavFooter({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellNavSectionProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'nav-footer',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/**
 * The `main` landmark, and the skip link's destination.
 *
 * It carries no `tabIndex` of its own: the skip link and `focusMain()` write
 * `tabindex="-1"` for the one focus they move (`focusTarget`), and the blur or
 * the next pointer press inside removes it. A `main` focusable all the time
 * takes the focus of every click on its text, and the next key draws the ring
 * around the page. A `tabIndex` the consumer writes stays.
 */
export function AppShellMain({
  children,
  className,
  id,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellMainProps) {
  const shell = useAppShell();
  const attach = useNode('main', ref as never);
  useRegion('main');

  const rootProps = keyedProps({
    /** The wait on this region's edge; an `aria-busy` the consumer wrote wins. */
    ...(shell.busy ? { 'aria-busy': true } : {}),
    ...nativeProps,
    children,
    className,
    'data-part': 'main',
    id: id ?? shell.mainId,
    style,
  });
  return part({ ...rootProps, ref: attach }, render) ?? <main {...rootProps} ref={attach} />;
}

/**
 * The wait for the next page, on the line between the chrome and the content.
 * The frame is a box the stylesheet lays over `main` in every arrangement, and
 * it holds one bar at `edge-start`; where the line is — the card's border, the
 * banner's seam — is the stylesheet's to know, not the consumer's.
 *
 * The timing machine runs here rather than in the bar, because the shell has
 * to know when the bar is painted: `main` is busy for exactly as long as the
 * reader can see the wait, not from the moment the prop turns, and not after
 * the bar has gone. The bar is then handed a wait that is already decided.
 */
export function AppShellProgress({
  delay,
  label,
  loading = true,
  minDuration,
  onWithdraw,
  size,
  ...barProps
}: AppShellProgressProps) {
  const shell = useAppShell();
  const defaults = useProgressIndicatorDefaults();
  const painted = useLoadingVisibility({
    delay: delay ?? defaults.delay ?? 200,
    loading,
    minDuration: minDuration ?? defaults.minDuration ?? 400,
    onWithdraw,
  });

  const { setBusy } = shell;
  useEffect(() => {
    setBusy(painted);
  }, [painted, setBusy]);
  useEffect(() => () => setBusy(false), [setBusy]);

  return (
    <div data-part="progress" data-part-progress="">
      <ProgressBar
        {...barProps}
        delay={0}
        label={label ?? shell.t('progress')}
        loading={painted}
        minDuration={0}
        placement="edge-start"
        size={size ?? 'sm'}
      />
    </div>
  );
}

/**
 * The `complementary` landmark. It opens and closes the way the navigation
 * region does — a column beside the content or a layer over it, by
 * `asideMode` — and carries its own `data-open`, because the root's is the
 * navigation's and every selector written over it still reads the navigation.
 *
 * A document with more than one `complementary` region needs a label on each,
 * so this one carries the family's unless the consumer wrote another.
 */
export function AppShellAside({
  'aria-label': ariaLabel,
  children,
  className,
  id,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellAsideProps) {
  const shell = useAppShell();
  const attach = useNode('aside', ref as never);
  useRegion('aside');

  /* The extent as the column's width: a fraction of the shell in `cqi`, which
     the stylesheet reads in the column alone. */
  const extent = shell.asideExtent;
  const rootProps = keyedProps({
    ...nativeProps,
    'aria-label': ariaLabel ?? shell.t('aside'),
    children,
    className,
    ...(shell.asideOpen ? { 'data-open': '' as const } : {}),
    'data-part': 'aside',
    id: id ?? shell.asideId,
    style:
      extent === undefined
        ? style
        : ({
            ...style,
            '--slotted-app-shell-aside-extent': `${Math.round(extent * 10000) / 100}cqi`,
          } as CSSProperties),
  });
  return part({ ...rootProps, ref: attach }, render) ?? <aside {...rootProps} ref={attach} />;
}

/** The pinned top of the pane: its title, and the control that closes it. */
export function AppShellAsideHeader({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellAsideSectionProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'aside-header',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/**
 * The middle, and the only part of the pane that scrolls. It stands on the
 * pane's inset; `inset="none"` drops it for content that brings its own.
 */
export function AppShellAsideBody({
  children,
  className,
  inset,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellAsideBodyProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    ...(inset === undefined ? {} : { 'data-inset': inset }),
    'data-part': 'aside-body',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

function isRtl(node: HTMLElement | null): boolean {
  return node !== null && getComputedStyle(node).direction === 'rtl';
}

/**
 * The box the pane's extent is a fraction of: the shell's content box, which
 * is what `cqi` resolves against. Physical edges, because the pointer and the
 * rectangle are both in client coordinates.
 */
function shellRect(root: HTMLElement | null): ExtentRect | null {
  if (root === null) return null;
  const rect = root.getBoundingClientRect();
  const box = getComputedStyle(root);
  /* A border whose style is none is nought wide, whatever its width says. */
  const border = (style: string, width: string) =>
    style === 'none' || style === 'hidden' ? 0 : parseFloat(width) || 0;
  const start =
    (parseFloat(box.paddingLeft) || 0) + border(box.borderLeftStyle, box.borderLeftWidth);
  const end =
    (parseFloat(box.paddingRight) || 0) + border(box.borderRightStyle, box.borderRightWidth);
  return {
    height: rect.height,
    width: Math.max(0, rect.width - start - end),
    x: rect.x + start,
    y: rect.y,
  };
}

/** How far a press on the separator may wander and still be a tap. */
const TAP_SLOP_PX = 3;

/**
 * The pane's inner edge, from the WAI-ARIA Window Splitter pattern: a focusable
 * `separator` whose three values are the extent as whole percentages of the
 * shell. **Rendering it is the capability**; there is no `resizable` prop.
 *
 * It moves the column alone. Under `asideMode="overlay"` the layer keeps its
 * size step and a closed pane has nothing to resize, so it renders nothing
 * there; below the breakpoint the stylesheet hides it, because a row under the
 * content has no inline edge.
 *
 * The arrows are physical, the pattern's own reading: `ArrowLeft` grows an end
 * pane in a left-to-right document, and shrinks it where `navSide="end"` or a
 * mirrored line puts the pane at the start.
 */
export function AppShellAsideResizer({
  'aria-label': ariaLabel,
  className,
  onKeyDown,
  onPointerDown,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellAsideResizerProps) {
  const shell = useAppShell();
  const node = useRef<HTMLDivElement | null>(null);
  /** Where the press began and how far the edge was from the pointer then. */
  const press = useRef<{ x: number; offset: number; moved: boolean } | null>(null);
  /** What the document looked like before the drag, and how to put it back. */
  const gesture = useRef<(() => void) | null>(null);
  /** The pane's measure while the size step decides it, read from the layout. */
  const [rest, setRest] = useState<number | undefined>(undefined);

  /* The pane is at the end of the line the navigation is not on. */
  const side: ExtentSide = shell.navSide === 'end' ? 'start' : 'end';
  const shown = shell.asideMode === 'inline' && shell.asideOpen;
  const { asideExtent, nodes, root } = shell;

  useIsomorphicLayoutEffect(() => {
    const aside = nodes.aside;
    if (!shown || asideExtent !== undefined || aside === null) return undefined;
    const read = () => {
      const rect = shellRect(root);
      if (rect === null || rect.width <= 0) return setRest(undefined);
      setRest(aside.getBoundingClientRect().width / rect.width);
    };
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(aside);
    return () => observer.disconnect();
  }, [asideExtent, nodes, root, shown]);

  useEffect(() => () => gesture.current?.(), []);

  if (!shown) return null;

  const current = clamp(
    shell.asideExtent ?? rest ?? shell.minAsideExtent,
    shell.minAsideExtent,
    shell.maxAsideExtent,
  );
  const percent = (value: number) => Math.round(clamp(value, 0, 1) * 100);

  const pointAt = (event: PointerEvent<HTMLDivElement>, rect: ExtentRect) =>
    extentAtPoint({
      point: { x: event.clientX, y: event.clientY },
      rect,
      rtl: isRtl(node.current),
      side,
    });

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    const rect = shellRect(shell.root);
    if (rect === null || rect.width <= 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    press.current = { moved: false, offset: current - pointAt(event, rect), x: event.clientX };
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;
    if (held === null) return;
    const rect = shellRect(shell.root);
    if (rect === null || rect.width <= 0) return;

    if (!held.moved) {
      if (Math.abs(event.clientX - held.x) < TAP_SLOP_PX) return;
      held.moved = true;
      /* The cursor has to survive the pointer leaving the separator, and a drag
         across the page must not select the text under it. Both are the
         document's and neither is reachable from the family's own stylesheet. */
      gesture.current?.();
      gesture.current = holdResizeGesture(node.current?.ownerDocument, 'col-resize');
      shell.setAsideDragging(true);
    }
    shell.setAsideExtent(pointAt(event, rect) + held.offset, 'pointer', event);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;
    if (held === null) return;
    press.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!held.moved) return;
    gesture.current?.();
    gesture.current = null;
    shell.setAsideDragging(false);
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const atStart = anchorsAtStart(side, isRtl(node.current));

    /* A distance and not a proportion, converted against the shell measured at
       the moment of the press. */
    const by = (direction: 1 | -1) => {
      event.preventDefault();
      const rect = shellRect(shell.root);
      const amount =
        rect === null
          ? 0
          : stepAmountFromPixels({
              pixels: event.shiftKey ? EXTENT_LARGE_STEP_PX : EXTENT_STEP_PX,
              rect,
              side,
            });
      shell.setAsideExtent(
        stepExtent({
          amount,
          direction,
          fraction: current,
          max: shell.maxAsideExtent,
          min: shell.minAsideExtent,
        }),
        'keyboard',
        event,
      );
    };

    switch (event.key) {
      case 'ArrowLeft':
        return by(atStart ? -1 : 1);
      case 'ArrowRight':
        return by(atStart ? 1 : -1);
      case 'Home':
        event.preventDefault();
        return shell.setAsideExtent(shell.minAsideExtent, 'keyboard', event);
      case 'End':
        event.preventDefault();
        return shell.setAsideExtent(shell.maxAsideExtent, 'keyboard', event);
      default:
        return undefined;
    }
  };

  const attach = (element: HTMLDivElement | null) => {
    node.current = element;
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
  };

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-controls': shell.asideId,
    'aria-label': ariaLabel ?? shell.t('resizeAside'),
    'aria-orientation': 'vertical' as const,
    'aria-valuemax': percent(shell.maxAsideExtent),
    'aria-valuemin': percent(shell.minAsideExtent),
    'aria-valuenow': percent(current),
    children: (
      <>
        <span aria-hidden="true" data-part="line" data-part-line="" />
        <span aria-hidden="true" data-part="grip" data-part-grip="" />
        <span aria-hidden="true" data-part="line" data-part-line="" />
      </>
    ),
    className,
    'data-part': 'aside-resizer',
    onKeyDown: keyDown,
    onLostPointerCapture: endDrag,
    onPointerDown: pointerDown,
    onPointerMove: pointerMove,
    onPointerUp: endDrag,
    role: 'separator' as const,
    style,
    tabIndex: 0,
  });
  if (render !== undefined) return render({ ...rootProps, ref: attach } as never);
  return <div {...rootProps} ref={attach} />;
}

/** The pinned bottom: the actions that close the task the pane holds. */
export function AppShellAsideFooter({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellAsideSectionProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'aside-footer',
    style,
  });
  const attach = useAttach(ref as never);
  return part({ ...rootProps, ref: attach }, render) ?? <div {...rootProps} ref={attach} />;
}

/** The `contentinfo` landmark: the application's footer, not the page's action bar. */
export function AppShellFooter({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: AppShellFooterProps) {
  const attach = useNode('footer', ref as never);
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'footer',
    style,
  });
  return part({ ...rootProps, ref: attach }, render) ?? <footer {...rootProps} ref={attach} />;
}

/**
 * The disclosure control, by the APG's Disclosure pattern: a `button` carrying
 * `aria-expanded` and `aria-controls`, which `Enter` and `Space` activate
 * natively.
 *
 * It takes its wiring from the shell's context rather than from its position,
 * so it can be rendered in the banner, in the navigation's own footer, or
 * anywhere else the consumer wants it, and there is still exactly one control
 * carrying the state.
 */
export function AppShellNavToggle({
  'aria-controls': ariaControls,
  'aria-label': ariaLabel,
  children,
  className,
  id,
  onClick,
  ref,
  render,
  style,
  type,
  ...nativeProps
}: AppShellNavToggleProps) {
  const shell = useAppShell();
  const attach = useNode('toggle', ref as never);

  const press = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event as never);
      if (event.defaultPrevented) return;
      /* A click synthesised by the keyboard reports no detail; a real one does.
         The reason is the difference between a product that persists a press
         and one that cannot tell which gesture it saw. */
      const reason = event.detail === 0 ? 'keyboard' : 'pointer';
      shell.setOpen(!shell.open, reason, event.nativeEvent);
    },
    [onClick, shell],
  );

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-controls': ariaControls ?? shell.navId,
    'aria-expanded': shell.open,
    'aria-label': ariaLabel ?? (shell.open ? shell.t('close') : shell.t('open')),
    /* The panel mark says what a press does: open while closed, close while open. */
    children: children ?? (
      <Icon>
        <Glyph name={shell.open ? 'panel-close' : 'panel-open'} />
      </Icon>
    ),
    className,
    'data-part': 'nav-toggle',
    id: id ?? shell.toggleId,
    onClick: press,
    style,
    type: type ?? ('button' as const),
  });
  return part({ ...rootProps, ref: attach }, render) ?? <button {...rootProps} ref={attach} />;
}

/**
 * The pane's disclosure control, by the same pattern and with the same wiring
 * as the navigation's: it can stand in the pane's own header, in the banner's
 * actions, or anywhere else, and there is still exactly one control carrying
 * the pane's state.
 */
export function AppShellAsideToggle({
  'aria-controls': ariaControls,
  'aria-label': ariaLabel,
  children,
  className,
  id,
  onClick,
  ref,
  render,
  style,
  type,
  ...nativeProps
}: AppShellAsideToggleProps) {
  const shell = useAppShell();
  const attach = useNode('asideToggle', ref as never);

  const press = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event as never);
      if (event.defaultPrevented) return;
      const reason = event.detail === 0 ? 'keyboard' : 'pointer';
      shell.setAsideOpen(!shell.asideOpen, reason, event.nativeEvent);
    },
    [onClick, shell],
  );

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-controls': ariaControls ?? shell.asideId,
    'aria-expanded': shell.asideOpen,
    'aria-label': ariaLabel ?? (shell.asideOpen ? shell.t('closeAside') : shell.t('openAside')),
    children: children ?? (
      <Icon>
        <Glyph name={shell.asideOpen ? 'panel-close' : 'panel-open'} />
      </Icon>
    ),
    className,
    'data-part': 'aside-toggle',
    id: id ?? shell.asideToggleId,
    onClick: press,
    style,
    type: type ?? ('button' as const),
  });
  return part({ ...rootProps, ref: attach }, render) ?? <button {...rootProps} ref={attach} />;
}
