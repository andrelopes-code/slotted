import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/fullscreen/fullscreen.css';

import { fullscreenMessages } from '@slotted/core/i18n';
import { createContext, useContext, useState } from 'react';
import type { MouseEvent, Ref } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useFullscreenDefaults } from './fullscreen-defaults';
import type {
  FullscreenContentProps,
  FullscreenContentRootProps,
  FullscreenHandle,
  FullscreenProps,
  FullscreenReason,
  FullscreenRootProps,
  FullscreenTriggerProps,
  FullscreenTriggerRootProps,
} from './fullscreen.types';
import { useFullscreen } from './use-fullscreen';

const FullscreenContext = createContext<FullscreenHandle | null>(null);

/** The handle of the nearest `Fullscreen`, or `null` outside one. */
export function useFullscreenContext(): FullscreenHandle | null {
  return useContext(FullscreenContext);
}

function assign<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/**
 * A region the reader can give the whole screen: by the Fullscreen API where
 * the page may ask, fixed over the page where it may not. At rest it paints
 * nothing — it is the container the consumer already had — and every control
 * inside reaches its handle through context.
 *
 * `Escape` in native full screen belongs to the agent, and no listener is
 * written for it; the leave is reported as a request with the reason `escape`.
 */
export function Fullscreen({
  children,
  defaultFullscreen,
  fullscreen,
  messages,
  mode,
  navigationUI,
  onFullscreenChange,
  onFullscreenError,
  ref,
  render,
  ...nativeProps
}: FullscreenProps) {
  /* A state rather than a ref object: an element swapped by `render` is a new
     region, and the hook makes a new controller for it. */
  const [element, setElement] = useState<HTMLElement | null>(null);
  const handle = useFullscreen(element, {
    defaultFullscreen,
    fullscreen,
    messages,
    mode,
    navigationUI,
    onFullscreenChange,
    onFullscreenError,
  });

  const attach = (node: HTMLElement | null) => {
    setElement(node);
    assign(ref as Ref<HTMLElement> | undefined, node);
  };

  const rootProps: FullscreenRootProps = keyedProps({
    ...nativeProps,
    children,
    ...(handle.fullscreen ? { 'data-fullscreen': '' } : {}),
    ...(handle.mode === null ? {} : { 'data-mode': handle.mode }),
    'data-part': 'root',
    'data-ui': 'fullscreen',
    ref: attach,
  });

  return (
    <FullscreenContext.Provider value={handle}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </FullscreenContext.Provider>
  );
}

/**
 * The part that takes the height the other children of the region leave
 * while it is full screen — a chart under its header, a document under its
 * toolbar — and whose first child fills it. A direct child of the region; at
 * rest it is a plain block the consumer styles.
 */
export function FullscreenContent({ ref, render, ...nativeProps }: FullscreenContentProps) {
  const rootProps: FullscreenContentRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'content',
    'data-ui': 'fullscreen',
  });
  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count.
 */
function activationReason(event: MouseEvent<HTMLElement>): FullscreenReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The control. Its words and its mark say what the press does next, and
 * change with the state; it is therefore not a toggle, and writes no
 * `aria-pressed` (APG Button pattern). Inside `Fullscreen` it reaches the
 * region by context; anywhere else it takes `target`, the handle
 * `useFullscreen` returns.
 */
export function FullscreenTrigger({
  children,
  className,
  disabled = false,
  icon,
  iconOnly = false,
  onClick,
  ref,
  render,
  size,
  style,
  target,
  type = 'button',
  variant,
  ...nativeProps
}: FullscreenTriggerProps) {
  const defaults = useFullscreenDefaults();
  const context = useFullscreenContext();
  const handle = target ?? context;
  const on = handle?.fullscreen ?? false;
  const words = typeof children === 'function' ? children(on) : children;
  const mark = typeof icon === 'function' ? icon(on) : icon;
  /* A control with no region has no region's words, and speaks the catalog's. */
  const own = useMessages(fullscreenMessages);
  const t = handle?.t ?? own;

  const rootProps: FullscreenTriggerRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        <span aria-hidden="true" data-part="icon" data-part-icon="">
          {/* The mark follows the state unless the consumer drew their own. */}
          {mark ?? (
            <Icon>
              <Glyph name={on ? 'minimize' : 'maximize'} />
            </Icon>
          )}
        </span>
        <span data-part="label" data-part-label="">
          {words ?? t(on ? 'exit' : 'enter')}
        </span>
      </>
    ),
    className,
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(on ? { 'data-fullscreen': '' } : {}),
    ...(iconOnly ? { 'data-icon-only': '' } : {}),
    'data-part': 'trigger',
    'data-size': size ?? defaults.size,
    'data-ui': 'fullscreen',
    'data-variant': variant ?? defaults.variant,
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as MouseEvent<HTMLButtonElement>);
      /* A consumer that calls preventDefault has refused the press. */
      if (event.defaultPrevented || disabled) return;
      handle?.toggle(activationReason(event), event);
    },
    style,
  });

  return render === undefined ? (
    <button {...rootProps} disabled={disabled} ref={ref} type={type} />
  ) : (
    render(rootProps)
  );
}
