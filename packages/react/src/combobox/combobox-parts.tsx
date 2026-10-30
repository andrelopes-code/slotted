import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer, pressOrigin } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent, Ref } from 'react';
import { createPortal } from 'react-dom';

import { useField } from '../field';
import { Glyph, Icon } from '../icon';
import { useCombobox } from './combobox';
import {
  entryHighlight,
  firstMatch,
  moveHighlight,
  options,
  revealOption,
  valueForLabel,
  valueOf,
} from './combobox-collection';
import type {
  ComboboxContentProps,
  ComboboxInputProps,
  ComboboxInputRootProps,
  ComboboxPositionerProps,
} from './combobox.types';
import { SPINNER_RING } from '../button/spinner-ring';

function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The frame, the input, the clear button and the trigger.
 *
 * The input is a real `input`, so every text-editing key, the caret, the
 * selection, IME and autofill stay the browser's — the pattern's own IMPORTANT
 * note asks that script not capture the keys a browser uses to edit text, and
 * the key handler below binds none of them.
 *
 * The trigger carries `tabindex="-1"`: the pattern's Keyboard Interaction note
 * excludes the popup indicator from the page tab sequence by name, so a reader
 * tabbing through a form meets the input once and not twice.
 */
export function ComboboxInput({ ref, render, ...nativeProps }: ComboboxInputProps) {
  const combobox = useCombobox();
  const field = useField();
  const [node, setNode] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    combobox.setInputNode(node);
  }, [combobox, node]);

  /**
   * The completion is shown as a **selected range**, so the next character
   * typed replaces it and `Backspace` withdraws it — which is what the pattern
   * means by a completion string that "appears inline after the input cursor"
   * and "has a selected state". The value is rendered; only the selection is
   * written here, because a selection is not something React renders.
   */
  useLayoutEffect(() => {
    if (combobox.completion === null || node === null) return;
    node.setSelectionRange(combobox.inputValue.length, combobox.completion.length);
  }, [combobox.completion, combobox.inputValue, node]);

  const move = (intent: Parameters<typeof moveHighlight>[2], source: unknown) => {
    const next = moveHighlight(combobox.contentNode, combobox.highlighted, intent, combobox.loop);
    if (next !== null) combobox.setHighlighted(next, 'keyboard', source);
  };

  /**
   * Takes the highlighted option: the key, the label into the input, and the
   * popup shut. Both requests carry the reason `select`, which is what tells a
   * consumer that the two moved together rather than one after the other.
   */
  const commit = (source: unknown) => {
    /* A completion the reader left standing is a choice they made: the option
       it came from is the one they were looking at. */
    if (combobox.highlighted === null && combobox.completion !== null) {
      const suggested = valueForLabel(combobox.contentNode, combobox.completion);
      if (suggested !== null) {
        combobox.select(suggested, 'keyboard', source);
        combobox.setInputValue(combobox.completion, 'select', source);
        combobox.setOpen(false, 'select', source);
        return;
      }
    }

    const value = combobox.highlighted;
    /**
     * The offer to add what was typed is an option like any other, so it is
     * reached and taken like one — and it is told apart by the row itself
     * rather than by a second copy of the rule, so the picture and the commit
     * cannot disagree about whether one is standing (CB8).
     */
    if (value !== null && isCreateRow(combobox.contentNode, value)) {
      combobox.create(value, 'keyboard', source);
      combobox.setOpen(false, 'select', source);
      return;
    }
    if (value === null) {
      if (combobox.allowsCustomValue) {
        combobox.select(
          combobox.inputValue === '' ? null : combobox.inputValue,
          'keyboard',
          source,
        );
      } else {
        /* Nothing was chosen and nothing may be invented, so the text goes back
           to the committed option's label — the pattern's "reverts". */
        combobox.setInputValue(
          combobox.value === null ? '' : (combobox.labelFor(combobox.value) ?? ''),
          'select',
          source,
        );
      }
      combobox.setOpen(false, 'select', source);
      return;
    }
    combobox.select(value, 'keyboard', source);
    combobox.setInputValue(combobox.labelFor(value) ?? value, 'select', source);
    if (combobox.closeOnSelect) combobox.setOpen(false, 'select', source);
  };

  const openWith = (entry: 'selected' | 'first' | 'last' | 'none', source: unknown) => {
    combobox.entry.current = entry;
    combobox.setOpen(true, 'keyboard', source);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (combobox.disabled) return;
    const alt = event.altKey;

    switch (event.key) {
      case 'ArrowDown':
        if (combobox.readOnly) return;
        event.preventDefault();
        if (!combobox.open) openWith(alt ? 'none' : 'first', event.nativeEvent);
        else if (!alt) move('next', event.nativeEvent);
        return;
      case 'ArrowUp':
        if (combobox.readOnly) return;
        event.preventDefault();
        if (alt) combobox.setOpen(false, 'keyboard', event.nativeEvent);
        else if (!combobox.open) openWith('last', event.nativeEvent);
        else move('previous', event.nativeEvent);
        return;
      case 'PageDown':
        if (!combobox.open) return;
        event.preventDefault();
        move('pageDown', event.nativeEvent);
        return;
      case 'PageUp':
        if (!combobox.open) return;
        event.preventDefault();
        move('pageUp', event.nativeEvent);
        return;
      case 'Enter':
        if (!combobox.open && !combobox.allowsCustomValue) return;
        event.preventDefault();
        commit(event.nativeEvent);
        return;
      case 'Escape':
        /**
         * Two steps, both named as optional in the pattern. Open, it closes and
         * keeps what was typed; closed, it puts the text back to the committed
         * label, and a second press clears the selection — which is what a
         * reader who pressed it twice is asking for.
         */
        if (combobox.open) {
          event.preventDefault();
          combobox.setOpen(false, 'escape', event.nativeEvent);
          return;
        }
        if (combobox.value === null) return;
        event.preventDefault();
        if (combobox.inputValue === (combobox.labelFor(combobox.value) ?? '')) {
          combobox.clear('keyboard', event.nativeEvent);
        } else {
          combobox.setInputValue(
            combobox.labelFor(combobox.value) ?? '',
            'keyboard',
            event.nativeEvent,
          );
        }
        return;
      case 'Tab':
        /* Not prevented, and no highlight is committed: one the reader arrowed
           past is not a choice they made, which is where this family parts
           company with `select`. A completion still standing is a choice, and
           the pattern says Tab accepts it. */
        if (combobox.completion !== null) commit(event.nativeEvent);
        else if (combobox.open) combobox.setOpen(false, 'dismiss', event.nativeEvent);
        return;
      default:
        /* Every other key is the browser's. The pattern's IMPORTANT note asks
           that script not capture the keys used to edit text, and this is where
           a family that bound Home, End or Backspace would break the caret. */
        break;
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value;
    combobox.setInputValue(next, 'keyboard', event.nativeEvent);
    /**
     * A completion is offered only while the reader is adding characters. One
     * who is deleting is taking the text apart, and writing the rest of a word
     * back into the field they are emptying is the behaviour that makes
     * `autocomplete="both"` unusable in the implementations that get it wrong.
     * The popup writes it, because the popup is the only thing that knows which
     * option matched first.
     */
    combobox.wantsCompletion.current =
      combobox.autocomplete === 'both' && next.length > combobox.inputValue.length;
    if (combobox.openOn === 'input' && !combobox.open && !combobox.readOnly) {
      combobox.entry.current = combobox.autoHighlight ? 'first' : 'none';
      combobox.setOpen(true, 'keyboard', event.nativeEvent);
    }
  };

  const onFocus = () => {
    if (combobox.openOn !== 'focus' || combobox.readOnly || combobox.open) return;
    combobox.entry.current = 'selected';
    combobox.setOpen(true, 'keyboard');
  };

  /* A press on the input opens a closed popup and never closes an open one,
     because the same press places the caret. Under `focus` the press has
     already opened it through focus, so this finds it open. */
  const onClick = (event: MouseEvent<HTMLInputElement>) => {
    if (combobox.openOn === 'manual' || combobox.open) return;
    if (combobox.disabled || combobox.readOnly) return;
    combobox.entry.current = 'selected';
    combobox.setOpen(true, 'pointer', event.nativeEvent);
  };

  const onBlur = (event: { relatedTarget: EventTarget | null }) => {
    const next = event.relatedTarget;
    if (next instanceof Node && combobox.contentNode?.contains(next) === true) return;
    /* A press on the popup's own surface — its padding, a group heading, its
       scrollbar — takes focus off the input and reports `relatedTarget: null`,
       which is indistinguishable from the reader leaving. The layer stack
       already records where the press in flight went down, so ask it (CB11). */
    const began = pressOrigin(node?.ownerDocument);
    if (began instanceof Node && combobox.contentNode?.contains(began) === true) return;
    /* The last moment at which the reader is still choosing, which is where
       text that matched no option is settled (CB7). */
    combobox.settleInput(event);
    if (!combobox.open) return;
    combobox.setOpen(false, 'blur');
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    combobox.clear('clear', event.nativeEvent);
    node?.focus({ preventScroll: true });
  };

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (combobox.disabled || combobox.readOnly) return;
    combobox.entry.current = 'selected';
    combobox.setOpen(!combobox.open, 'pointer', event.nativeEvent);
    node?.focus({ preventScroll: true });
  };

  const setInput = useCallback(
    (element: HTMLInputElement | null) => {
      setNode(element);
      attach(element, ref);
    },
    [ref],
  );

  const describedBy = [nativeProps['aria-describedby'], field?.describedBy]
    .filter(Boolean)
    .join(' ');
  const showClear =
    combobox.clearable && combobox.inputValue !== '' && !combobox.disabled && !combobox.readOnly;

  const rootProps: ComboboxInputRootProps = {
    'data-part': 'root',
    ...selectorKeyProps('part', 'root'),
    'data-size': combobox.size,
    'data-ui': 'combobox',
    ...selectorKeyProps('ui', 'combobox'),
    'data-variant': combobox.variant,
    ...(combobox.fullWidth ? { 'data-full-width': '' } : {}),
    ...(combobox.open ? { 'data-open': '' } : {}),
    ...(combobox.disabled ? { 'data-disabled': '' } : {}),
    ...(combobox.readOnly ? { 'data-readonly': '' } : {}),
    ...(combobox.invalid ? { 'data-invalid': '' } : {}),
    ...(combobox.required ? { 'data-required': '' } : {}),
    ...(combobox.loading ? { 'data-loading': '' } : {}),
  };

  const inner = (
    <>
      <input
        {...withSelectorKey(nativeProps, 'part', 'input')}
        aria-activedescendant={
          combobox.open && combobox.highlighted !== null
            ? combobox.optionId(combobox.highlighted)
            : undefined
        }
        aria-autocomplete={combobox.autocomplete}
        aria-controls={combobox.open ? combobox.contentId : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        aria-expanded={combobox.open}
        aria-invalid={combobox.invalid ? true : undefined}
        aria-readonly={combobox.readOnly ? true : undefined}

        disabled={combobox.disabled}
        id={nativeProps.id ?? field?.ids.control ?? combobox.inputId}
        onBlur={compose(nativeProps.onBlur, onBlur)}
        onChange={compose(nativeProps.onChange, onChange)}
        onClick={compose(nativeProps.onClick, onClick)}
        onFocus={compose(nativeProps.onFocus, onFocus)}
        onKeyDown={compose(nativeProps.onKeyDown, onKeyDown)}
        readOnly={combobox.readOnly}
        ref={setInput}
        required={combobox.required}
        role="combobox"
        type="text"
        value={combobox.completion ?? combobox.inputValue}
      />
      {showClear ? (
        <button
          aria-label={combobox.t('clear')}
          data-part="clear"
          data-part-clear=""
          onClick={clear}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      ) : null}
      <button
        aria-label={combobox.t('trigger')}
        data-part="trigger"
        data-part-trigger=""
        disabled={combobox.disabled}
        onClick={toggle}
        tabIndex={-1}
        type="button"
      >
        {/* `select`'s decision and `select`'s reasons (SL6/CB5). */}
        {combobox.loading ? (
          <span
            aria-hidden="true"
            data-part="busy"
            data-part-busy=""
            data-ui="spinner"
            data-ui-spinner=""
          >
            {SPINNER_RING}
          </span>
        ) : (
          <span data-part="arrow" data-part-arrow="">
            <Icon>
              <Glyph name="chevron-down" />
            </Icon>
          </span>
        )}
      </button>
      {combobox.name === undefined ? null : (
        <input
          aria-hidden="true"
          form={combobox.form}
          name={combobox.name}
          readOnly
          required={combobox.required}
          style={{
            border: 0,
            clip: 'rect(0 0 0 0)',
            clipPath: 'inset(50%)',
            height: '1px',
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            whiteSpace: 'nowrap',
            width: '1px',
          }}
          tabIndex={-1}
          type="text"
          value={combobox.value ?? ''}
        />
      )}
    </>
  );

  if (render !== undefined) return render({ ...rootProps, children: inner });
  return <div {...rootProps}>{inner}</div>;
}

/** Whether the option holding `value` is the offer to add it rather than a member. */
function isCreateRow(content: HTMLElement | null, value: string) {
  if (content === null) return false;
  const option = content.querySelector(`[data-part='item'][data-value="${CSS.escape(value)}"]`);
  return option?.hasAttribute('data-create') === true;
}

/**
 * The layer, the surface it paints, and the two rows that speak for it.
 *
 * `status` is the live region as well as the loading row: a reader who cannot
 * see the list still hears how many options answered their query, which is what
 * `docs/component-features.md` §6 asks for by name.
 */
export function ComboboxContent({
  children,
  empty,
  ref,
  render,
  status: statusMessage,
  ...nativeProps
}: ComboboxContentProps) {
  const combobox = useCombobox();

  const [layerNode, setLayerNode] = useState<HTMLElement | null>(null);
  const [surfaceNode, setSurfaceNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to open the popup: the control took focus or a press.
   * The portal's layer is made then, because making it reads the control's
   * computed style, and a read in the open's own task is a style recalculation
   * the first frame waits for. A press focuses before it clicks, in a task of
   * its own.
   */
  const [warm, setWarm] = useState(false);
  const [count, setCount] = useState(0);

  const presence = useRef<PresenceHandle | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const latest = useRef(combobox);
  latest.current = combobox;

  useEffect(() => {
    const handle = createPresence({ present: latest.current.open, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);

  useEffect(() => presence.current?.sync(combobox.open), [combobox.open]);
  useEffect(() => presence.current?.setNode(layerNode), [layerNode]);
  useEffect(() => combobox.setContentNode(surfaceNode), [combobox, surfaceNode]);

  /**
   * Open renders the popup in the commit that opens it, rather than once the
   * presence has reported `entering` in a render of its own.
   */
  const mounted =
    combobox.mount === 'eager' ||
    (combobox.mount === 'lazy' && combobox.seen) ||
    combobox.open ||
    status !== 'unmounted';

  useEffect(() => {
    const control = combobox.inputNode;
    if (control === null || warm) return undefined;
    const prepare = () => setWarm(true);
    control.addEventListener('focusin', prepare);
    control.addEventListener('pointerdown', prepare);
    return () => {
      control.removeEventListener('focusin', prepare);
      control.removeEventListener('pointerdown', prepare);
    };
  }, [combobox.inputNode, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({ origin: combobox.inputNode, disabled: !combobox.portal });
    setContainer(handle.container);
    return () => handle.release();
  }, [combobox.inputNode, combobox.portal, layered]);

  const {
    align,
    alignOffset,
    collisionPadding,
    flip,
    hideWhenDetached,
    shift,
    side,
    sideOffset,
    strategy,
    width,
  } = combobox;

  const positioner = useRef<PositionerHandle | null>(null);
  const revealFrame = useRef(0);

  /**
   * `data-open` is written by the measurement that places the popup, on the
   * element, in the task that opened it: the position, the side and the open
   * state reach one style update together, and the first frame after the
   * click shows the popup where it belongs. A render to say "positioned" was
   * a frame of its own. The highlighted option is revealed in the next frame,
   * whose layout the browser computes anyway, rather than by a read here
   * after the writes.
   */
  const place = useCallback((handle: PositionerHandle, layer: HTMLElement) => {
    void handle.update().then(() => {
      if (positioner.current !== handle || !latest.current.open) return;
      layer.setAttribute('data-open', '');
      const view = layer.ownerDocument.defaultView;
      if (view === null || revealFrame.current !== 0) return;
      revealFrame.current = view.requestAnimationFrame(() => {
        revealFrame.current = 0;
        revealOption(latest.current.contentNode, latest.current.highlighted);
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (layerNode === null || combobox.inputNode === null) return;

    /* The anchor is the frame rather than the input, so the popup is as wide as
       the control the reader sees and not as wide as the text inside it. */
    const anchor =
      combobox.inputNode.closest<HTMLElement>("[data-part='root']") ?? combobox.inputNode;

    const handle = createPositioner(anchor, layerNode, {
      align,
      alignOffset,
      boundaryPadding: collisionPadding,
      flip,
      hideWhenDetached,
      matchWidth: width === 'anchor',
      shift,
      side,
      sideOffset,
      strategy,
    });

    positioner.current = handle;
    if (latest.current.open) place(handle, layerNode);

    return () => {
      handle.destroy();
      positioner.current = null;
      layerNode.removeAttribute('data-open');
    };
  }, [
    align,
    alignOffset,
    collisionPadding,
    combobox.inputNode,
    flip,
    hideWhenDetached,
    layerNode,
    shift,
    side,
    sideOffset,
    strategy,
    width,
    place,
  ]);

  useLayoutEffect(() => {
    const handle = positioner.current;
    if (handle === null || layerNode === null) return;
    if (combobox.open) {
      place(handle, layerNode);
      return;
    }
    layerNode.removeAttribute('data-open');
    if (revealFrame.current !== 0) {
      layerNode.ownerDocument.defaultView?.cancelAnimationFrame(revealFrame.current);
      revealFrame.current = 0;
    }
  }, [layerNode, place, combobox.open]);

  useEffect(() => {
    if (layerNode === null || !combobox.open) return;
    const root = combobox.inputNode?.closest<HTMLElement>("[data-part='root']") ?? null;
    const branches = [root].filter((branch): branch is HTMLElement => branch !== null);

    const layer = createDismissableLayer(layerNode, {
      branches,
      escape: combobox.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: combobox.closeOnOutsidePress,
      scrollLock: false,
      onDismiss: (request) => {
        latest.current.setOpen(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source,
        );
      },
    });
    return () => layer.destroy();
  }, [
    combobox.closeOnEscape,
    combobox.closeOnOutsidePress,
    combobox.inputNode,
    combobox.open,
    layerNode,
  ]);

  /**
   * How many options the collection put on the surface. The offer to add what
   * was typed is not one of them: it is drawn *because* the count is nought,
   * so counting it would take it away, which would bring it back (CB8).
   */
  useLayoutEffect(() => {
    const measured = options(surfaceNode).filter(
      (option) => option.dataset['create'] === undefined,
    ).length;
    setCount((held) => (held === measured ? held : measured));
  });

  /**
   * Where the highlight lands as the popup opens, and where it goes when the
   * filter takes the highlighted option away. Idempotent, because React invokes
   * a layout effect twice per mount under StrictMode.
   *
   * With `autoHighlight`, a popup that opened onto no chosen option — a press,
   * a focus, the trigger — lands on the first match, and so does every query
   * typed after it: the contract's `focus.onOpen` sends the highlight to the
   * selected option, and to the first when `autoHighlight` is set.
   */
  useLayoutEffect(() => {
    const state = latest.current;
    if (!state.open || surfaceNode === null) return;
    if (state.entry.current !== 'none') {
      const next =
        entryHighlight(surfaceNode, state.value, state.entry.current, state.loop) ??
        (state.autoHighlight ? entryHighlight(surfaceNode, null, 'first', state.loop) : null);
      if (next !== null) state.setHighlighted(next, 'keyboard');
      return;
    }
    if (state.highlighted === null) return;
    const held = options(surfaceNode).some((option) => valueOf(option) === state.highlighted);
    if (!held) state.setHighlighted(null, 'keyboard');
  }, [combobox.open, combobox.query, count, surfaceNode]);

  /**
   * A browser scrolls a focused element into view; nothing here is focused.
   * On open the reveal waits for the position (above): the height that bounds
   * the list arrives with it.
   */
  useEffect(() => {
    if (layerNode?.hasAttribute('data-open') !== true) return;
    revealOption(surfaceNode, combobox.highlighted);
  }, [layerNode, combobox.highlighted, surfaceNode]);

  /**
   * The completion string, written into the input as a **selected range** and
   * not as text. Selected, so the next character the reader types replaces it
   * and `Backspace` withdraws it — which is what the pattern means by "the
   * portion of the selected suggestion that has not been typed by the user"
   * appearing after the cursor with a selected state.
   */
  useLayoutEffect(() => {
    const state = latest.current;
    if (!state.wantsCompletion.current) return;
    /* The flag is consumed only once there is something to act on: the popup
       mounts one render before its surface exists, and consuming it above this
       check spent every completion on the render that could not answer it. */
    if (surfaceNode === null) return;
    state.wantsCompletion.current = false;
    const suggestion = completionFor(surfaceNode, state.inputValue);
    if (suggestion === null || suggestion === state.inputValue) return;
    state.setCompletion(suggestion);
  }, [combobox.inputValue, count, surfaceNode]);

  /**
   * The last row came into view, so there is more to fetch. An observer rather
   * than a scroll listener: the question is "is the end of the list visible",
   * and a scroll handler answers it by measuring on every frame.
   */
  useEffect(() => {
    const target = sentinel.current;
    const root = surfaceNode;
    const onLoadMore = combobox.onLoadMore;
    if (target === null || root === null || onLoadMore === undefined) return;
    if (typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { root },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [combobox.onLoadMore, count, surfaceNode]);

  if (!mounted) return null;

  const rootProps: ComboboxPositionerProps = keyedProps({
    'data-align': align,
    ...(combobox.open ? {} : { inert: true }),
    'data-part': 'positioner',
    'data-size': combobox.size,
    'data-ui': 'combobox',
    'data-width': combobox.width,
  });

  const message = (() => {
    if (statusMessage !== undefined) return statusMessage;
    if (combobox.loading) return combobox.t('loading');
    if (count === 0) return null;
    return combobox.t('count', { count });
  })();

  const element = (
    <div
      {...rootProps}
      ref={(node: HTMLDivElement | null) => {
        setLayerNode(node);
        attach(node, ref as Ref<HTMLDivElement> | undefined);
      }}
    >
      <div
        {...withSelectorKey(nativeProps, 'part', 'content')}
        aria-busy={combobox.loading ? true : undefined}
        aria-label={nativeProps['aria-label'] ?? undefined}
        data-loading={combobox.loading ? '' : undefined}

        id={combobox.contentId}
        ref={setSurfaceNode}
        role="listbox"
      >
        {children}
        <div ref={sentinel} />
        {/*
          The offer to add what was typed (CB8). It is an option, not a button:
          the reader reaches it with ArrowDown, `aria-activedescendant` names
          it and Enter takes it, all through the machinery every other option
          already uses. It replaces the empty message rather than standing
          beside it — "nothing matched" and "create it" are one sentence.
        */}
        {!combobox.loading && count === 0 && combobox.canCreate && combobox.query !== '' ? (
          <div
            data-create=""
            data-part="item"
            data-part-item=""
            data-value={combobox.query}
            id={combobox.optionId(combobox.query)}
            onClick={(event) => {
              combobox.create(combobox.query, 'pointer', event.nativeEvent);
              combobox.setOpen(false, 'select', event.nativeEvent);
              combobox.inputNode?.focus({ preventScroll: true });
            }}
            /* An option, so it refuses the press for the reason every option
               refuses it (CB11). */
            onPointerDown={(event) => {
              if (event.defaultPrevented) return;
              event.preventDefault();
            }}
            onPointerEnter={(event) =>
              combobox.setHighlighted(combobox.query, 'pointer', event.nativeEvent)
            }
            role="option"
            {...(combobox.highlighted === combobox.query ? { 'data-current': '' } : {})}
          >
            <span data-part="label" data-part-label="">
              {combobox.t('create', { query: combobox.query })}
            </span>
          </div>
        ) : null}
        {!combobox.loading && count === 0 && !(combobox.canCreate && combobox.query !== '') ? (
          <div data-part="empty" data-part-empty="">
            {empty ?? combobox.t('empty')}
          </div>
        ) : null}
        {combobox.loading ? (
          /*
            The wait, as the shape of the list that is coming: three rows the
            height of an option, drawn by `skeleton` (SL6/CB5). Hidden from
            assistive technology — the status row below is the live region and
            it already says what is happening.
          */
          <div aria-hidden="true" data-part="placeholder" data-part-placeholder="">
            {[0, 1, 2].map((row) => (
              <div key={row}>
                <span
                  data-part="root"
                  data-part-root=""
                  data-shape="text"
                  data-ui="skeleton"
                  data-ui-skeleton=""
                  data-loading=""
                />
              </div>
            ))}
          </div>
        ) : null}
        <div
          aria-live="polite"
          data-part="status"
          data-part-status=""
          {...(combobox.loading ? { 'data-loading': '' } : {})}
          role="status"
        >
          {message}
        </div>
      </div>
    </div>
  );

  const rendered = render === undefined ? element : render({ ...rootProps, children });
  return container === null ? rendered : createPortal(rendered, container);
}

/** The completion string, for `autocomplete="both"`. */
export function completionFor(content: HTMLElement | null, typed: string): string | null {
  if (typed === '') return null;
  const label = firstMatch(content);
  if (label === null) return null;
  return label.toLowerCase().startsWith(typed.toLowerCase()) ? label : null;
}
