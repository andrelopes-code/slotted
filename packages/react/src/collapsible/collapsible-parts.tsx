import { keyedProps } from '@slotted/core/selector-key';
import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { useCollapsible } from './collapsible';
import type {
  CollapsibleActionsProps,
  CollapsibleHeaderProps,
  CollapsibleHeaderRootProps,
  CollapsiblePanelProps,
  CollapsiblePanelRootProps,
  CollapsibleTriggerProps,
  CollapsibleTriggerRootProps,
} from './collapsible.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is why `Enter`, `Space` and a pointer are told apart without
 * a key listener existing for the toggle — the platform keeps both keys.
 */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

/**
 * The heading the trigger lives in.
 *
 * `level` decides the element. `none` renders a `div` and writes no heading
 * semantics, which is the standalone disclosure that belongs to no outline;
 * every other value renders that heading, and the accordion sets the level for
 * a whole set at once.
 *
 * The trigger is meant to be its only child: the APG requires the button to be
 * the only element inside the heading, which is why the always-visible controls
 * go in `CollapsibleActions` beside it rather than in here.
 */
export function CollapsibleHeader({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: CollapsibleHeaderProps) {
  const { level } = useCollapsible();

  const rootProps: CollapsibleHeaderRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'header',
    style,
  });

  if (render !== undefined) return render(rootProps);

  const Heading = level === 'none' ? 'div' : (`h${level}` as 'h1');
  return <Heading {...rootProps} ref={ref} />;
}

/**
 * The control.
 *
 * It is a `button`, so `Enter` and `Space` are the platform's and the family
 * binds no key of its own. `aria-expanded` and `aria-controls` are the pattern's
 * two properties; `aria-disabled` appears only when the group refuses to let
 * this panel close, which is the APG's own instruction for an accordion that
 * requires one panel to stay open.
 */
export function CollapsibleTrigger({
  children,
  className,
  description,
  disabled,
  onClick,
  ref,
  render,
  style,
  ...nativeProps
}: CollapsibleTriggerProps) {
  const { disabled: familyDisabled, held, ids, indicator, open, toggle } = useCollapsible();
  const resolvedDisabled = disabled ?? familyDisabled;
  /* The chevron is one glyph the stylesheet turns; plus and minus are two, so
     the state picks between them here. */
  let indicatorGlyph: GlyphName = 'chevron-down';
  if (indicator === 'plus-minus') indicatorGlyph = open ? 'minus' : 'plus';

  const rootProps: CollapsibleTriggerRootProps = keyedProps({
    ...nativeProps,
    'aria-controls': ids.panelId,
    ...(held ? { 'aria-disabled': 'true' as const } : {}),
    'aria-expanded': open,
    children: (
      <>
        {indicator === 'none' ? null : (
          <span aria-hidden="true" data-part="indicator" data-part-indicator="">
            <Icon>
              <Glyph name={indicatorGlyph} />
            </Icon>
          </span>
        )}
        <span data-part="label" data-part-label="">
          {children}
        </span>
        {description === undefined ? null : (
          <span data-part="description" data-part-description="">
            {description}
          </span>
        )}
      </>
    ),
    className,
    'data-part': 'trigger',
    disabled: resolvedDisabled,
    id: ids.triggerId,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      /* The consumer's handler runs first, and preventDefault() refuses the
         toggle — composed with, never replaced. */
      onClick?.(event);
      if (event.defaultPrevented || held) return;
      toggle(!open, activationReason(event), event);
    },
    style,
    type: 'button',
  });

  if (render !== undefined) return render(rootProps);
  return <button {...rootProps} ref={ref} />;
}

/**
 * The always-visible controls beside the header.
 *
 * They are a sibling of the heading rather than a child of it, for two reasons
 * that agree: the APG requires the button to be the only element inside the
 * heading, and a control inside a `button` is invalid HTML. What belongs here
 * is a `Toolbar` — one tab stop for however many actions the page puts there.
 */
export function CollapsibleActions({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: CollapsibleActionsProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'actions',
    style,
  });

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The panel.
 *
 * `mount` decides whether it exists at all. While it exists and is closed it is
 * taken out of the tab sequence and out of the accessibility tree twice over:
 * the stylesheet with `content-visibility`, and this component with `inert`, so
 * a browser without the property still cannot put focus inside it.
 *
 * `mount="until-found"` writes `hidden="until-found"` instead. The browser then
 * removes that attribute itself when its page search reaches the text inside,
 * fires `beforematch`, and this asks the family to open with the reason
 * `programmatic` — the closest word the vocabulary holds for a move the browser
 * made rather than the reader's own control.
 *
 * Both attributes are written from an effect rather than as props. `hidden`
 * takes a keyword React types as a boolean, and the browser removing it has to
 * survive until the next render decides what to do about it.
 */
export function CollapsiblePanel({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: CollapsiblePanelProps) {
  const { ids, loading, mount, open, region, seen, toggle } = useCollapsible();
  /* A ref rather than state: held in state, attaching the panel rendered it a
     second time on mount, for an element nothing renders from. */
  const node = useRef<HTMLElement | null>(null);
  const untilFound = mount === 'until-found';

  useEffect(() => {
    const element = node.current;
    if (element === null) return undefined;

    if (open) {
      element.removeAttribute('hidden');
      element.removeAttribute('inert');
      return undefined;
    }

    if (untilFound) {
      element.removeAttribute('inert');
      element.setAttribute('hidden', 'until-found');
      const reveal = () => toggle(true, 'programmatic', undefined);
      element.addEventListener('beforematch', reveal);
      return () => element.removeEventListener('beforematch', reveal);
    }

    element.removeAttribute('hidden');
    element.setAttribute('inert', '');
    return undefined;
  }, [open, toggle, untilFound]);

  /**
   * The box always exists; what `mount` decides is whether its content does.
   * Radix and Base UI drop the whole panel, and the trigger's `aria-controls`
   * then names an element that is not there — a dangling reference a screen
   * reader has to make sense of. The empty box costs one element and keeps the
   * pattern's own wiring true at every moment.
   */
  const mounted =
    mount !== 'active' && mount !== 'lazy' ? true : open || (mount === 'lazy' && seen);

  const rootProps: CollapsiblePanelRootProps = keyedProps({
    ...nativeProps,
    'aria-labelledby': ids.triggerId,
    ...(loading ? { 'aria-busy': true } : {}),
    children: mounted ? (
      <div data-part="content" data-part-content="">
        {children}
      </div>
    ) : null,
    className,
    'data-part': 'panel',
    id: ids.panelId,
    ...(region ? { role: 'region' as const } : {}),
    style,
  });

  if (render !== undefined) return render(rootProps);

  return (
    <div
      {...rootProps}
      ref={(element) => {
        node.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
    />
  );
}
