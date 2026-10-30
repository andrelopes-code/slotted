import { keyedProps } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createFocusScope } from '@slotted/core/focus';
import { observeKeyboardInset } from '@slotted/core/measure';
import { createPortalRoot } from '@slotted/core/portal';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { useDialog } from './dialog';
import type {
  AlertDialogActionProps,
  AlertDialogCancelProps,
  AlertDialogIconProps,
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogContextValue,
  DialogFooterProps,
  DialogHeaderProps,
  DialogDescriptionProps,
  DialogOpenReason,
  DialogTitleProps,
  DialogTone,
  DialogTriggerProps,
  DialogTriggerRootProps,
} from './dialog.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is how `Enter`, `Space` and a pointer are told apart without
 * a key listener existing for something the platform already handles.
 */
function activationReason(event: MouseEvent): DialogOpenReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** Layout on the client, and nothing at all on the server. */
const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The control that opens the layer.
 *
 * It stays where it is written while the layer is portalled out, which is why
 * it is also the layer's *branch*: a press on it is inside the layer as far as
 * `dismissable-layer` is concerned, or opening would immediately be read as an
 * outside press and close what it just opened.
 *
 * `dialog.css` writes no appearance for it. A real application's trigger is a
 * `Button`, reached with `render`, and a substituted trigger therefore loses
 * nothing.
 */
export function DialogTrigger({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  ...nativeProps
}: DialogTriggerProps) {
  const dialog = useDialog();

  const rootProps: DialogTriggerRootProps = keyedProps({
    ...nativeProps,
    'aria-controls': dialog.mounted ? `${dialog.triggerId}-content` : undefined,
    'aria-expanded': dialog.open,
    /* `dialog` for both members: `aria-haspopup` has no `alertdialog` token,
       and the role on the layer is what distinguishes them. */
    'aria-haspopup': 'dialog',
    children,
    className,
    'data-part': 'trigger',
    ...(dialog.open ? { 'data-open': '' } : {}),
    id: dialog.triggerId,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      /* The consumer's handler runs first, and preventDefault() refuses the
         open — composed with, never replaced. */
      onClick?.(event);
      if (event.defaultPrevented) return;
      dialog.openWith(activationReason(event), event);
    },
    ref: (node: HTMLButtonElement | null) => {
      dialog.registerTrigger(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    style,
    type: 'button',
  });

  if (render !== undefined) return render(rootProps);
  return <button {...rootProps} />;
}

/** Where the layer is placed, and what it inherits once it is there. */
function usePortalContainer(dialog: DialogContextValue): Element | null {
  const [layer, setLayer] = useState<Element | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!dialog.mounted) return;

    /**
     * The trigger is the origin, and that is a rule rather than a fallback: it
     * is the element the layer was opened from, so its region is the one whose
     * scheme, density, theme and direction the layer inherits. A layer opened
     * from code has no trigger, and the document is then the honest origin.
     *
     * Angular has it better — `<sl-dialog>`'s host element is written in place,
     * so its own parent is the origin whether a trigger exists or not — and the
     * design document records the asymmetry rather than levelling both down.
     */
    const root = createPortalRoot({
      origin: dialog.nodes.trigger,
      ...(dialog.container === undefined ? {} : { container: dialog.container }),
    });
    setLayer(root.container);

    return () => {
      setLayer(null);
      root.release();
    };
  }, [dialog.container, dialog.mounted, dialog.nodes]);

  return layer;
}

/**
 * The layer, the scrim and the panel.
 *
 * Three boxes rather than two. `root` declares `container-type: inline-size`,
 * which applies `contain: layout`, which makes it the containing block for
 * every positioned descendant — so a scrim inside a root that scrolls is part
 * of what scrolls, and under `scroll="viewport"` it slides off the top of the
 * layer. `backdrop` and `viewport` are two things in one grid cell instead.
 */
export function DialogContent({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: DialogContentProps) {
  const dialog = useDialog();
  const layer = usePortalContainer(dialog);
  const [content, setContent] = useState<HTMLElement | null>(null);

  const contentId = `${dialog.triggerId}-content`;
  const labelled = dialog.titleId !== '' && nativeProps['aria-label'] === undefined;
  const described = dialog.descriptionId !== '';

  /**
   * The alert dialog pattern *requires* `aria-describedby`; the modal dialog
   * pattern makes it optional. A confirmation announced as a title and two
   * buttons, with the sentence saying what is about to be destroyed left out,
   * is the failure the requirement exists for — so it fails loudly rather than
   * shipping.
   */
  useEffect(() => {
    if (dialog.member !== 'alertDialog' || content === null) return;
    /* The DOM rather than the context: a child's effect runs before its
       parent's, so the description has registered itself in the DOM and has not
       yet reached the state this component reads. */
    if (content.querySelector('[data-part="description"]') !== null) return;
    throw new Error(
      'AlertDialog requires a DialogDescription: the alertdialog pattern makes aria-describedby mandatory.',
    );
  }, [content, dialog.member]);

  /**
   * Everything the layer does while it is open, taken down when it closes
   * rather than when the node unmounts — `presence` keeps the node mounted
   * through the exit, and a layer still holding the scroll lock and the
   * background's `inert` for those two hundred milliseconds is a page nobody
   * can touch.
   */
  /* The context is a new object on every render of the root, and a palette
     re-renders it on every highlight move: the layer reads it through a ref,
     and only the values that change what the layer is re-register it. */
  const latest = useRef(dialog);
  latest.current = dialog;
  const { back, escape, modal, open, outsidePress } = dialog;
  const trigger = dialog.nodes.trigger;
  useEffect(() => {
    if (content === null || !open) return;

    const root = content.closest<HTMLElement>('[data-ui="dialog"]');
    if (root === null) return;

    const branches = trigger === null ? [] : [trigger];
    /* The frame is the layer and the panel is what a press is inside of: the
       scrim and the viewport around the panel are the way out. The click, not
       the pointerdown, so a selection dragged out of the panel is not a press
       on the scrim. */
    const layerHandle = createDismissableLayer(root, {
      /* A history entry is a modal layer's: a layer the page stays reachable
         under has no claim on the way back. */
      back: modal && back === 'close',
      branches,
      content,
      escape: escape === 'close',
      modal,
      onDismiss: (request) => {
        if (request.reason === 'outsidePress' && outsidePress === 'none') {
          return request.cancel();
        }
        latest.current.close(request.reason as DialogOpenReason, undefined, request.source);
      },
      outsidePress: outsidePress === 'close',
      outsidePressEvent: 'click',
    });

    const wanted = latest.current.initialFocus;
    const returnTo = latest.current.finalFocus;
    const scope = createFocusScope(content, {
      contain: modal,
      initial:
        wanted === 'cancel'
          ? () => latest.current.nodes.cancel
          : typeof wanted === 'object' && wanted !== null
            ? () => wanted.current
            : wanted,
      ...(returnTo === undefined
        ? {}
        : { restore: returnTo === false ? (false as const) : () => returnTo.current }),
    });
    scope.enter();

    /* The layer first: it lifts the `inert` it wrote on the background, and a
       browser refuses focus inside an inert subtree, so a scope taken down
       first hands focus back to a trigger that cannot take it. */
    return () => {
      layerHandle.destroy();
      scope.destroy();
    };
  }, [back, content, escape, modal, open, outsidePress, trigger]);

  /**
   * The virtual keyboard, while the panel can cover the layer: the layer
   * carries what the keys cover, and the stylesheet ends a full-screen panel's
   * rows above them. A centerd panel reads nothing from it.
   */
  const coversLayer = dialog.fullScreen !== 'never' || dialog.fullscreen;
  useEffect(() => {
    if (content === null || !dialog.open || !coversLayer) return;
    const root = content.closest<HTMLElement>('[data-ui="dialog"]');
    if (root === null) return;
    const stop = observeKeyboardInset(root.ownerDocument.defaultView, (pixels) => {
      if (pixels === 0) root.style.removeProperty('--slotted-keyboard-inset');
      else root.style.setProperty('--slotted-keyboard-inset', `${pixels}px`);
    });
    return () => {
      stop();
      root.style.removeProperty('--slotted-keyboard-inset');
    };
  }, [content, coversLayer, dialog.open]);

  if (!dialog.mounted || layer === null) return null;

  const rootProps = keyedProps({
    'data-full-screen': dialog.fullScreen,
    ...(dialog.fullscreen ? { 'data-fullscreen': '' } : {}),
    ...(dialog.loading ? { 'data-loading': '' } : {}),
    ...(dialog.modal ? { 'data-modal': '' } : {}),
    'data-mount': dialog.mount,
    ...(dialog.visible ? { 'data-open': '' } : {}),
    'data-outside-press': dialog.outsidePress,
    'data-part': 'root',
    'data-placement': dialog.placement,
    'data-scroll': dialog.scroll,
    'data-size': dialog.size,
    'data-surface': dialog.surface,
    ...(dialog.tone === undefined ? {} : { 'data-tone': dialog.tone }),
    'data-ui': 'dialog',
  });

  /**
   * `render` substitutes the panel and not the layer. The layer, the scrim and
   * the box that centers them are the mechanism — a consumer who replaced the
   * layer would be replacing the thing `dismissable-layer` and `presence` are
   * holding — while the panel is the element a consumer has a reason to change:
   * a `form` that submits, a `section` that is a landmark.
   */
  const panelProps = keyedProps({
    ...nativeProps,
    ...(described ? { 'aria-describedby': dialog.descriptionId } : {}),
    ...(labelled ? { 'aria-labelledby': dialog.titleId } : {}),
    ...(dialog.modal ? { 'aria-modal': true } : {}),
    children,
    className,
    'data-part': 'content' as const,
    id: contentId,
    ref: (node: HTMLDivElement | null) => {
      setContent(node);
      dialog.registerContent(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    role: dialog.member === 'alertDialog' ? ('alertdialog' as const) : ('dialog' as const),
    style,
  });

  const panel: ReactNode = render === undefined ? <div {...panelProps} /> : render(panelProps);

  /* `inert` alongside the stylesheet's own closed state, so a browser without
     `content-visibility` still cannot put focus inside a layer that is shut. */
  return createPortal(
    <div {...rootProps} {...(dialog.interactive ? {} : { inert: true })} ref={dialog.registerLayer}>
      <div data-part="backdrop" data-part-backdrop="" />
      <div data-part="viewport" data-part-viewport="">
        {panel}
      </div>
    </div>,
    layer,
  );
}

/**
 * The header, and the one part of it the family renders rather than the
 * consumer: the full-screen toggle, when the layer was asked for one.
 *
 * It is written after the consumer's children on purpose. The title and the
 * description come first for a reader moving through the header, and the two
 * corner controls are adjacent peers whose order carries no meaning — where
 * the toggle went first in the DOM it would be announced ahead of the name of
 * the dialog it belongs to. The stylesheet puts it in the column before the
 * close, which is where a window's controls put it.
 */
export function DialogHeader({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DialogHeaderProps) {
  const dialog = useDialog();
  const rootProps = keyedProps({
    ...rest,
    children: (
      <>
        {children}
        {dialog.fullscreenToggle ? <DialogFullscreen /> : null}
      </>
    ),
    className,
    'data-part': 'header' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <header {...rootProps} ref={ref} />;
}

/**
 * The control that hands the layer to the panel and takes it back.
 *
 * `aria-pressed` is what says which way it is set, so the name stays one word
 * in every state — a label that changed with the state would be read as a
 * second control. The mark is the opposite of the state, because a mark on a
 * control says what pressing it does.
 */
function DialogFullscreen() {
  const dialog = useDialog();
  return (
    <button
      aria-label={dialog.t('fullScreen')}
      aria-pressed={dialog.fullscreen}
      data-part="fullscreen"
      data-part-fullscreen=""
      onClick={(event) => {
        if (event.defaultPrevented) return;
        dialog.setFullscreen(
          !dialog.fullscreen,
          event.detail === 0 ? 'keyboard' : 'pointer',
          event,
        );
      }}
      type="button"
    >
      <Icon>
        <Glyph name={dialog.fullscreen ? 'minimize' : 'maximize'} />
      </Icon>
    </button>
  );
}

/** The visible name, which `aria-labelledby` points at. */
export function DialogTitle({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DialogTitleProps) {
  const dialog = useDialog();
  useEffect(() => dialog.announce('title', null), [dialog]);

  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'title' as const,
    id: dialog.titleId === '' ? undefined : dialog.titleId,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <h2 {...rootProps} ref={ref} />;
}

/** The sentence that says what the dialog is about. */
export function DialogDescription({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DialogDescriptionProps) {
  const dialog = useDialog();
  useEffect(() => dialog.announce('description', null), [dialog]);

  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'description' as const,
    id: dialog.descriptionId === '' ? undefined : dialog.descriptionId,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <p {...rootProps} ref={ref} />;
}

/**
 * The one row that scrolls, and the row `aria-busy` belongs to while the
 * content is still on its way — the header, the close button and Escape all
 * stay operable, because a loading dialog a reader cannot leave is the worse
 * failure of the two.
 */
export function DialogBody({ children, className, ref, render, style, ...rest }: DialogBodyProps) {
  const dialog = useDialog();
  const rootProps = keyedProps({
    ...rest,
    ...(dialog.loading ? { 'aria-busy': true } : {}),
    children,
    className,
    'data-part': 'body' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

export function DialogFooter({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: DialogFooterProps) {
  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'footer' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <footer {...rootProps} ref={ref} />;
}

/** What every control that closes the layer shares. */
function useClosingButton(
  part: 'close' | 'cancel' | 'action',
  reason: DialogOpenReason,
  onClick: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined,
  value: string | undefined,
) {
  const dialog = useDialog();
  return {
    dialog,
    handleClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      dialog.close(reason, value, event);
    },
    part,
  };
}

/**
 * The ✕ in the corner. It carries `dismiss`, which is the word the closed
 * vocabulary in `docs/state-and-events.md` already has for what a close button
 * means; `docs/component-features.md` §8 calls the source `closeButton`, and a
 * twelfth reason would be a change to a contract outside this family.
 */
export function DialogClose({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  value,
  ...rest
}: DialogCloseProps) {
  const { dialog, handleClick } = useClosingButton('close', 'dismiss', onClick, value);

  if (dialog.member === 'alertDialog') {
    throw new Error(
      'AlertDialog has no close part: a confirmation is answered with AlertDialogCancel or AlertDialogAction, not dismissed by an ✕.',
    );
  }

  const rootProps = keyedProps({
    'aria-label': dialog.t('close'),
    ...rest,
    /* The cross is drawn unless the consumer wrote content of their own. */
    children: children ?? (
      <Icon>
        <Glyph name="x" />
      </Icon>
    ),
    className,
    'data-part': 'close' as const,
    onClick: handleClick,
    style,
    type: 'button' as const,
  });
  if (render !== undefined) return render(rootProps);
  return <button {...rootProps} ref={ref} />;
}

/**
 * The glyph each tone draws, and the warning diamond where no tone was resolved. Warning
 * and danger differ in silhouette as well as color, because under forced
 * colors the silhouette is all that is left.
 */
const TONE_GLYPH: Record<DialogTone, GlyphName> = {
  accent: 'status-info',
  secondary: 'status-info',
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * The tone's own mark, which is geometry rather than a character. A mark the
 * consumer writes as children replaces the tone's.
 */
export function AlertDialogIcon({
  children,
  className,
  ref,
  render,
  style,
  ...rest
}: AlertDialogIconProps) {
  const dialog = useDialog();
  const rootProps = keyedProps({
    'aria-hidden': true,
    ...rest,
    children: children ?? (
      <Icon>
        <Glyph name={dialog.tone === undefined ? 'status-warning' : TONE_GLYPH[dialog.tone]} />
      </Icon>
    ),
    className,
    'data-part': 'icon' as const,
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/**
 * The least destructive action, and where focus lands when the layer opens.
 * That is the APG's own advice for a step that is not easily reversible, and it
 * is a default of the member rather than something a consumer remembers.
 */
export function AlertDialogCancel({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  value,
  ...rest
}: AlertDialogCancelProps) {
  const { dialog, handleClick } = useClosingButton('cancel', 'dismiss', onClick, value ?? 'cancel');

  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'cancel' as const,
    onClick: handleClick,
    style,
    type: 'button' as const,
  });

  const attach = (node: HTMLButtonElement | null) => {
    dialog.announce('cancel', node);
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  if (render !== undefined) return render({ ...rootProps, ref: attach });
  return <button {...rootProps} ref={attach} />;
}

/**
 * The action being confirmed. It carries `submit`, because confirming is what
 * the reader came to do, and `dismiss` is what the other two controls mean.
 */
export function AlertDialogAction({
  children,
  className,
  onClick,
  ref,
  render,
  style,
  value,
  ...rest
}: AlertDialogActionProps) {
  const { handleClick } = useClosingButton('action', 'submit', onClick, value ?? 'confirm');

  const rootProps = keyedProps({
    ...rest,
    children,
    className,
    'data-part': 'action' as const,
    onClick: handleClick,
    style,
    type: 'button' as const,
  });
  if (render !== undefined) return render(rootProps);
  return <button {...rootProps} ref={ref} />;
}
