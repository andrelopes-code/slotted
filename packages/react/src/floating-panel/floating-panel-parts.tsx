import { Glyph, Icon } from '../icon';
import { useFloatingPanel } from './floating-panel';
import type {
  FloatingPanelBodyProps,
  FloatingPanelCloseProps,
  FloatingPanelHandleProps,
  FloatingPanelTitleProps,
} from './floating-panel.types';

/**
 * The bar the panel is moved by. A press that moves drags the panel, with the
 * pointer captured; the grip at its start takes focus and moves it one step
 * per arrow key, a larger one with Shift.
 */
export function FloatingPanelHandle({
  children,
  onPointerDown,
  ...nativeProps
}: FloatingPanelHandleProps) {
  const panel = useFloatingPanel();

  return (
    <div
      {...nativeProps}
      data-part="handle"
      data-part-handle=""
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) panel.startDrag(event);
      }}
    >
      <button
        aria-label={panel.t('move')}
        data-part="grip"
        data-part-grip=""
        onKeyDown={panel.move}
        type="button"
      >
        <Icon>
          <Glyph name="grip-vertical" />
        </Icon>
      </button>
      {children}
    </div>
  );
}

/** The panel's name, which names the region when no `aria-label` does. */
export function FloatingPanelTitle(props: FloatingPanelTitleProps) {
  const panel = useFloatingPanel();

  return <h2 id={panel.titleId} {...props} data-part="title" data-part-title="" />;
}

/** Closes the panel; focus returns to the element that held it before it opened. */
export function FloatingPanelClose({ children, onClick, ...nativeProps }: FloatingPanelCloseProps) {
  const panel = useFloatingPanel();

  return (
    <button
      aria-label={panel.t('close')}
      {...nativeProps}
      data-part="close"
      data-part-close=""
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) panel.close();
      }}
      type="button"
    >
      {children ?? (
        <Icon>
          <Glyph name="x" />
        </Icon>
      )}
    </button>
  );
}

/** What the tool holds. It scrolls when the panel is held shorter than it. */
export function FloatingPanelBody(props: FloatingPanelBodyProps) {
  return <div {...props} data-part="body" data-part-body="" />;
}
