import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/tabs/tabs.css';

import { createRemovalFocus, createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createScrollAffordance, NOT_OVERFLOWING } from '@slotted/core/overflow';
import type { OverflowState, ScrollAffordanceHandle } from '@slotted/core/overflow';
import { createIndicator } from '@slotted/core/measure';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useContext,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Glyph, Icon } from '../icon';
import { useTabsDefaults } from './tabs-defaults';
import type {
  TabsActivationDirection,
  TabsContextValue,
  TabsDismissReason,
  TabsDismissRequest,
  TabsProps,
  TabsRootProps,
  TabsSelectionReason,
} from './tabs.types';

/** Every tab in the list, in the order the DOM holds them. */
export const TAB_SELECTOR = '[data-part="tab"]';
/** The selected tab, the one the marker underlines. */
const SELECTED_TAB_SELECTOR = ':scope > [data-part="item"][data-selected] > [data-part="tab"]';
/** A layout effect where there is a document to lay out, an effect on the server. */
const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

/**
 * What the family around this tab says. A `Tab` outside one has no list to
 * belong to, no panel to control and no value to be compared against, so this
 * throws rather than rendering a control that looks right and does nothing.
 */
export function useTabs(): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('Tab, TabPanel and TabActions must be rendered inside Tabs.');
  }
  return context;
}

/**
 * An identifier from a value, injectively.
 *
 * A value is the consumer's own string and may hold a space, which no
 * identifier may. Escaping the characters an identifier refuses — rather than
 * replacing them — is what keeps two values from wiring one panel: `"a b"` and
 * `"a_b"` are different tabs and would otherwise share an `id`.
 */
function escapeValue(value: string): string {
  return value.replace(/[^\w-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`);
}

function createDismissRequest(reason: TabsDismissReason, source: unknown): TabsDismissRequest {
  let cancelled = false;

  return {
    reason,
    source,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/**
 * One view out of several, and the panels under it.
 *
 * **The keyboard is the APG's, and it is implemented once.** The list is a
 * roving tab stop from `@slotted/core/focus`: `Tab` enters on the selected tab,
 * the arrows of the flow axis move and wrap, `Home` and `End` reach the ends,
 * and the cross axis is left alone so the page still scrolls with focus inside
 * a horizontal list. `Delete` dismisses a dismissible tab, and focus lands
 * where the pattern says.
 *
 * **The marker moves without a measurement.** The root records which way the
 * selection travelled, and the stylesheet turns that into a transform origin,
 * so the family is right in a server response and during the first paint. Every
 * surveyed indicator reads the active tab's box instead, which is why Base UI
 * ships `renderBeforeHydration`.
 *
 * **The paging controls belong to the root**, because the root owns the observer
 * that knows whether they are needed. They are out of the tab sequence and out
 * of the accessibility tree: the arrows already reach every tab and bring it
 * into view.
 */
export function Tabs({
  activation,
  children,
  className,
  defaultValue,
  deferPanels,
  disabled,
  fit,
  loop,
  mount,
  onTabDismiss,
  onValueChange,
  orientation,
  ref,
  render,
  size,
  style,
  track,
  value,
  variant,
  ...nativeProps
}: TabsProps) {
  const defaults = useTabsDefaults();
  const baseId = useId();

  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const current = value ?? own;

  const [list, setList] = useState<HTMLElement | null>(null);
  const [overflow, setOverflow] = useState<OverflowState>(NOT_OVERFLOWING);
  const [direction, setDirection] = useState<TabsActivationDirection>('none');

  const resolvedActivation = activation ?? defaults.activation;
  const resolvedFit = fit ?? defaults.fit;
  const resolvedLoop = loop ?? defaults.loop;
  const resolvedMount = mount ?? defaults.mount;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedSize = size ?? defaults.size;
  const resolvedTrack = track ?? defaults.track;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedDisabled = disabled === true;

  /**
   * The tab is urgent and the panel is not. Under `mount="active"` selecting a
   * tab mounts its panel, and a panel holding a table or a form is a render
   * long enough to delay the next paint; rendering it from the deferred value
   * lets the selection paint in the click's frame and the panel follow.
   */
  const deferred = useDeferredValue(current);
  const shownValue = (deferPanels ?? resolvedMount === 'active') ? deferred : current;

  /** Every value that has been selected at least once, which is what `lazy` reads. */
  const seen = useRef(new Set<string>(current === undefined ? [] : [current]));
  if (current !== undefined) seen.current.add(current);

  const roving = useRef<RovingTabindexHandle | null>(null);
  const affordance = useRef<ScrollAffordanceHandle | null>(null);

  /** The tabs as the DOM holds them, which is the only order that is never stale. */
  function tabElements(): HTMLElement[] {
    return list === null ? [] : [...list.querySelectorAll<HTMLElement>(TAB_SELECTOR)];
  }

  function indexOf(candidate: string | undefined): number {
    if (candidate === undefined) return -1;
    return tabElements().findIndex((item) => item.getAttribute('data-value') === candidate);
  }

  function select(next: string, reason: TabsSelectionReason, source: unknown) {
    if (next === current) return;

    let cancelled = false;
    const state = createControllable<string | undefined>({
      controlled: value,
      initial: current,
      onRequest: (request) => {
        cancelled = request.cancelled;
        /* Never undefined here: a tab is selected by being asked for. */
        if (request.value !== undefined) onValueChange?.(request.value, request);
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;

    /**
     * Set in the same event as the value, so the marker's origin and the
     * selection reach the DOM in one paint. A value the consumer moves on its
     * own — with no interaction — leaves the direction where it was, which is
     * what "none" already means for the first paint.
     */
    const from = indexOf(current);
    const to = indexOf(next);
    if (from !== -1 && to !== -1) setDirection(to > from ? 'forward' : 'backward');

    seen.current.add(next);
    if (moved) setOwn(next);
  }

  /**
   * The neighbour a dismissal leaves the selection to: the tab that followed
   * the dismissed one, or the one before it when the dismissed tab was last.
   * It is the APG's own focus rule for `Delete`, applied to the value, and it
   * is what Carbon and Cloudscape leave to the consumer.
   */
  function neighbourOf(dismissed: string): string | undefined {
    const values = tabElements()
      .map((item) => item.getAttribute('data-value'))
      .filter((candidate): candidate is string => candidate !== null);
    const index = values.indexOf(dismissed);
    if (index === -1) return undefined;
    return values[index + 1] ?? values[index - 1];
  }

  function dismiss(dismissed: string, reason: TabsDismissReason, source: unknown) {
    const request = createDismissRequest(reason, source);
    onTabDismiss?.(dismissed, request);
    if (request.cancelled) return;

    if (dismissed !== current) return;
    const next = neighbourOf(dismissed);
    if (next !== undefined) select(next, 'remove', source);
  }

  /**
   * The latest `select`, for the handles below. They are created once per
   * container and would otherwise close over the first render's value; a ref
   * written in an effect is what keeps them reading the current one without
   * tearing the handle down on every render.
   */
  const latest = useRef({ activation: resolvedActivation, select, value: current });
  useEffect(() => {
    latest.current = { activation: resolvedActivation, select, value: current };
  });

  useEffect(() => {
    if (list === null) return undefined;

    const tabindex = createRovingTabindex(list, {
      crossAxis: false,
      itemSelector: TAB_SELECTOR,
      loop: resolvedLoop,
      onMove: (_index, item) => {
        affordance.current?.reveal(item);
        if (latest.current.activation !== 'automatic') return;
        const next = item.getAttribute('data-value');
        if (next !== null) latest.current.select(next, 'keyboard', undefined);
      },
      orientation: () => resolvedOrientation,
    });
    roving.current = tabindex;

    /**
     * Where the keyboard goes when the tab it was on is dismissed. The list is
     * the last resort, which is why it holds `tabIndex={-1}`: a list emptied by
     * its final dismissal keeps focus rather than returning it to the top of
     * the page.
     */
    const removal = createRemovalFocus(list, { itemSelector: TAB_SELECTOR });
    /**
     * A tab arriving or leaving has to reach both handles, and neither binding
     * can be told by the other's change detection. The DOM is the one thing
     * they agree on.
     */
    const observer = new MutationObserver(() => {
      tabindex.refresh();
      affordance.current?.refresh();
    });
    observer.observe(list, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      removal.destroy();
      tabindex.destroy();
      roving.current = null;
    };
  }, [list, resolvedLoop, resolvedOrientation]);

  /**
   * The marker the list draws under the selected tab, measured by
   * `createIndicator` before the first paint, so it is in place in the frame
   * that shows the tabs and slides from there on.
   */
  useIsomorphicLayoutEffect(() => {
    if (list === null) return undefined;
    const indicator = createIndicator(list, {
      orientation: () => resolvedOrientation,
      part: 'marker',
      target: () => list.querySelector<HTMLElement>(SELECTED_TAB_SELECTOR),
    });
    return indicator.destroy;
  }, [list, resolvedOrientation]);

  useEffect(() => {
    if (list === null || resolvedOrientation === 'vertical') {
      setOverflow(NOT_OVERFLOWING);
      return undefined;
    }

    const handle = createScrollAffordance(list, { onChange: setOverflow });
    affordance.current = handle;
    setOverflow(handle.state());

    return () => {
      handle.destroy();
      affordance.current = null;
    };
  }, [list, resolvedOrientation]);

  /**
   * The tab sequence holds the selected tab, which is where `Tab` from outside
   * the list lands. It is also brought into view, because a selected tab
   * scrolled out of sight is a family that looks like it has nothing selected.
   */
  useEffect(() => {
    const index = indexOf(current);
    if (index === -1) return;
    roving.current?.setActive(index);
    const item = tabElements()[index];
    if (item !== undefined) affordance.current?.reveal(item);
    /* Only when the selection or the list moves. Revealing on every render
       would fight a reader who has just scrolled the list by hand. */
  }, [current, list]);

  const paging = overflow.overflowing && resolvedOrientation === 'horizontal';

  /**
   * A list that starts to overflow — on mount, or later when its stylesheet
   * arrives, a drawer opens or a hidden panel is shown — draws its paging
   * controls, and they narrow it: a tab revealed against the wider list ended
   * behind the end control. The selected tab is revealed again once the
   * controls are in the layout, on that transition and on no other, so a reader
   * scrolling the list keeps control.
   */
  useEffect(() => {
    if (!paging) return;
    const item = tabElements()[indexOf(latest.current.value)];
    if (item !== undefined) affordance.current?.reveal(item);
  }, [paging]);

  const context: TabsContextValue = {
    activation: resolvedActivation,
    attachList: setList,
    disabled: resolvedDisabled,
    dismiss,
    identify: (candidate) => ({
      panelId: `${baseId}panel-${escapeValue(candidate)}`,
      tabId: `${baseId}tab-${escapeValue(candidate)}`,
    }),
    mount: resolvedMount,
    orientation: resolvedOrientation,
    seen: (candidate) => seen.current.has(candidate),
    select,
    shownValue,
    value: current,
  };

  const rootProps: TabsRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        {paging ? (
          <>
            <button
              aria-hidden="true"
              data-direction="start"
              data-part="scroll"
              data-part-scroll=""
              disabled={overflow.atStart}
              onClick={() => affordance.current?.page(-1)}
              tabIndex={-1}
              type="button"
            >
              <Icon directional>
                <Glyph name="chevron-right" />
              </Icon>
            </button>
            <button
              aria-hidden="true"
              data-direction="end"
              data-part="scroll"
              data-part-scroll=""
              disabled={overflow.atEnd}
              onClick={() => affordance.current?.page(1)}
              tabIndex={-1}
              type="button"
            >
              <Icon directional>
                <Glyph name="chevron-right" />
              </Icon>
            </button>
          </>
        ) : null}
      </>
    ),
    className,
    'data-activation-direction': direction,
    ...(resolvedDisabled ? { 'data-disabled': '' } : {}),
    'data-fit': resolvedFit,
    'data-orientation': resolvedOrientation,
    ...(overflow.overflowing ? { 'data-overflowing': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-track': resolvedTrack,
    'data-ui': 'tabs',
    'data-variant': resolvedVariant,
    style,
  });

  return (
    <TabsContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps)}
    </TabsContext.Provider>
  );
}
