import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer, pressOrigin } from '@slotted/core/dismissable-layer';
import { createWidthGate } from '@slotted/core/measure';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, KeyboardEvent, MouseEvent, Ref } from 'react';
import { createPortal } from 'react-dom';

import { useField } from '../field';
import { Glyph, Icon } from '../icon';
import { useMultiSelect } from './multi-select';
import { ChipRow } from './multi-select-chips';
import {
  entryHighlight,
  isCreateRow,
  moveHighlight,
  options,
  revealOption,
  valueOf,
} from './multi-select-collection';
import type {
  MultiSelectContentProps,
  MultiSelectControlProps,
  MultiSelectPositionerProps,
  MultiSelectRootProps,
} from './multi-select.types';
import { SPINNER_RING } from '../button/spinner-ring';

/** The width, in CSS pixels, under which a chip has no room for a word. */
export const NARROW_WIDTH = 120;

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
 * The frame, the grid, the chips, the field and the two buttons.
 *
 * The field is a real `input`, so every text-editing key, the caret, the
 * selection, IME and autofill stay the browser's — the pattern's own IMPORTANT
 * note asks that script not capture the keys a browser uses to edit text, and
 * the handler below binds none of them while there is text to edit.
 *
 * The trigger carries `tabindex="-1"`, and so does every chip: the combobox
 * pattern excludes the popup indicator from the page tab sequence and the grid
 * pattern puts one element of a layout grid in it. The field is that element,
 * and the whole control is one tab stop.
 */
export function MultiSelectControl({ ref, render, ...nativeProps }: MultiSelectControlProps) {
  const multiSelect = useMultiSelect();
  const field = useField();
  const [node, setNode] = useState<HTMLInputElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    multiSelect.setInputNode(node);
  }, [multiSelect, node]);

  /**
   * Under 120 pixels there is no room for a chip at all, and the counter
   * answers instead. A width and a callback rather than a container query:
   * `container-type: inline-size` would stop the frame's own width depending on
   * its contents, which is exactly how a control that is not `fullWidth` is
   * measured. `select` recorded the same finding.
   */
  const setNarrow = multiSelect.setNarrow;
  useEffect(() => {
    const element = frame.current;
    if (element === null) return;
    const gate = createWidthGate(element, { at: NARROW_WIDTH, onChange: setNarrow });
    return () => gate.destroy();
  }, [setNarrow]);

  /**
   * A native reset puts the hidden inputs back and tells nothing, so the chips
   * would keep the last set chosen in a form that had been reset. The form is
   * the one `form` names, or the one the input sits in.
   */
  const { form: formId, restore } = multiSelect;
  useEffect(() => {
    if (node === null) return;
    const owner = formId === undefined ? node.form : node.ownerDocument.getElementById(formId);
    if (!(owner instanceof HTMLFormElement)) return;
    const onReset = (event: Event) => restore(event);
    owner.addEventListener('reset', onReset);
    return () => owner.removeEventListener('reset', onReset);
  }, [formId, node, restore]);

  const move = (intent: Parameters<typeof moveHighlight>[2], source: unknown) => {
    /* Open, but the surface has not mounted yet: the arrow waits for it, as
       the arrow that opens a closed popup does, instead of finding no option. */
    if (multiSelect.contentNode === null) {
      multiSelect.entry.current = intent === 'previous' || intent === 'pageUp' ? 'last' : 'first';
      return;
    }
    const next = moveHighlight(
      multiSelect.contentNode,
      multiSelect.highlighted,
      intent,
      multiSelect.loop,
    );
    if (next !== null) multiSelect.setHighlighted(next, 'keyboard', source);
  };

  const split = (text: string) => {
    const delimiters = multiSelect.delimiters;
    if (delimiters.length === 0) return [text];
    const pattern = new RegExp(
      `[${delimiters.map((mark) => mark.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')).join('')}]`,
    );
    return text.split(pattern);
  };

  /** The typed text, committed as one or several values. */
  const commitQuery = (source: unknown) => {
    if (!multiSelect.creatable) return false;
    const text = multiSelect.inputValue;
    if (text.trim() === '') return false;
    multiSelect.admit(split(text), 'submit', source);
    multiSelect.setInputValue('', 'submit', source);
    return true;
  };

  /** Takes the highlighted option, and empties the query so the next one can be typed. */
  const commitHighlighted = (source: unknown) => {
    const value = multiSelect.highlighted;
    if (value === null) return false;

    if (isCreateRow(multiSelect.contentNode, value)) {
      commitQuery(source);
      return true;
    }

    multiSelect.toggle(value, 'select', source);
    multiSelect.setInputValue('', 'select', source);
    if (multiSelect.closeOnSelect) multiSelect.setOpen(false, 'select', source);
    return true;
  };

  const openWith = (entry: 'first' | 'last' | 'none', source: unknown) => {
    multiSelect.entry.current = entry;
    multiSelect.setOpen(true, 'keyboard', source);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (multiSelect.disabled) return;
    const alt = event.altKey;

    if (multiSelect.delimiters.includes(event.key) && !alt) {
      event.preventDefault();
      commitQuery(event.nativeEvent);
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        if (multiSelect.readOnly) return;
        event.preventDefault();
        if (!multiSelect.open) openWith(alt ? 'none' : 'first', event.nativeEvent);
        else if (!alt) move('next', event.nativeEvent);
        return;
      case 'ArrowUp':
        if (multiSelect.readOnly) return;
        event.preventDefault();
        if (alt) multiSelect.setOpen(false, 'keyboard', event.nativeEvent);
        else if (!multiSelect.open) openWith('last', event.nativeEvent);
        else move('previous', event.nativeEvent);
        return;
      case 'PageDown':
        if (!multiSelect.open) return;
        event.preventDefault();
        move('pageDown', event.nativeEvent);
        return;
      case 'PageUp':
        if (!multiSelect.open) return;
        event.preventDefault();
        move('pageUp', event.nativeEvent);
        return;
      case 'Enter':
        if (commitHighlighted(event.nativeEvent)) {
          event.preventDefault();
          return;
        }
        if (commitQuery(event.nativeEvent)) event.preventDefault();
        return;
      case 'Escape':
        /* Open, it closes and keeps the typed text; closed, it clears the text.
           It never clears the selection: a set a reader spent six presses
           building is not something one key should take. */
        if (multiSelect.open) {
          event.preventDefault();
          multiSelect.setOpen(false, 'escape', event.nativeEvent);
          return;
        }
        if (multiSelect.inputValue === '') return;
        event.preventDefault();
        multiSelect.setInputValue('', 'clear', event.nativeEvent);
        return;
      case 'Backspace': {
        /**
         * §6's rule, and the predictable half of it: from an empty field the
         * first press moves focus to the last chip and removes nothing, and the
         * second press — which lands on the chip — removes it. One press to see
         * what is about to go, one to let it go, and the only rule under which
         * `Backspace` is reversible without an undo.
         */
        if (multiSelect.inputValue !== '') return;
        if (event.currentTarget.selectionStart !== 0) return;
        if (multiSelect.readOnly || multiSelect.value.length === 0) return;
        const chips = frame.current?.querySelectorAll<HTMLElement>(
          "[data-part='chips'] > [role='gridcell']:not([data-part='field'])",
        );
        const last = chips === undefined ? undefined : chips[chips.length - 1];
        if (last === undefined) return;
        event.preventDefault();
        last.focus({ preventScroll: true });
        return;
      }
      case 'Tab':
        if (multiSelect.open) multiSelect.setOpen(false, 'dismiss', event.nativeEvent);
        return;
      default:
        /* Every other key is the browser's. The pattern's IMPORTANT note asks
           that script not capture the keys used to edit text. */
        break;
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value;
    multiSelect.setInputValue(next, 'keyboard', event.nativeEvent);
    if (multiSelect.openOn === 'manual') return;
    if (!multiSelect.open && !multiSelect.readOnly && next !== '') {
      multiSelect.entry.current = 'none';
      multiSelect.setOpen(true, 'keyboard', event.nativeEvent);
    }
  };

  const onFocus = () => {
    if (multiSelect.openOn !== 'focus' || multiSelect.open) return;
    if (multiSelect.disabled || multiSelect.readOnly) return;
    multiSelect.entry.current = 'none';
    multiSelect.setOpen(true, 'keyboard');
  };

  /* A press on the input opens a closed popup and never closes an open one,
     because the same press places the caret. Under `focus` the press has
     already opened it through focus, so this finds it open. */
  const onClick = (event: MouseEvent<HTMLInputElement>) => {
    if (multiSelect.openOn === 'manual' || multiSelect.open) return;
    if (multiSelect.disabled || multiSelect.readOnly) return;
    multiSelect.entry.current = 'none';
    multiSelect.setOpen(true, 'pointer', event.nativeEvent);
  };

  /**
   * A paste that carries several values. The same delimiters the key reads, so
   * a control cannot accept `a,b` from the clipboard and refuse it from the
   * keyboard; and what the limit turns away is reported rather than dropped,
   * which is the case none of the eight surveyed implementations describes.
   */
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (!multiSelect.addOnPaste || !multiSelect.creatable || multiSelect.readOnly) return;
    const text = event.clipboardData.getData('text');
    const parts = split(text).filter((part) => part.trim() !== '');
    if (parts.length < 2) return;
    event.preventDefault();
    multiSelect.admit(parts, 'submit', event.nativeEvent);
    multiSelect.setInputValue('', 'submit', event.nativeEvent);
  };

  const onBlur = (event: { relatedTarget: EventTarget | null }) => {
    const next = event.relatedTarget;
    if (next instanceof Node && multiSelect.contentNode?.contains(next) === true) return;
    if (next instanceof Node && frame.current?.contains(next) === true) return;
    /* A press on the popup's own surface takes focus off the field and reports
       no `relatedTarget`, which is indistinguishable from the reader leaving.
       The layer stack records where the press in flight went down. */
    const began = pressOrigin(node?.ownerDocument);
    if (began instanceof Node && multiSelect.contentNode?.contains(began) === true) return;

    if (multiSelect.commitOnBlur) commitQuery(event);
    if (multiSelect.open) multiSelect.setOpen(false, 'blur');
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    multiSelect.clear(event.nativeEvent);
    node?.focus({ preventScroll: true });
  };

  const toggleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    if (multiSelect.disabled || multiSelect.readOnly) return;
    multiSelect.entry.current = 'none';
    multiSelect.setOpen(!multiSelect.open, 'pointer', event.nativeEvent);
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
    multiSelect.clearable &&
    (multiSelect.value.length > 0 || multiSelect.inputValue !== '') &&
    !multiSelect.disabled &&
    !multiSelect.readOnly;

  const counter = (() => {
    if (multiSelect.max !== null) {
      return multiSelect.t('counter', { count: multiSelect.value.length, max: multiSelect.max });
    }
    if (multiSelect.narrow && multiSelect.value.length > 0) {
      return multiSelect.t('chosen', { count: multiSelect.value.length });
    }
    return null;
  })();

  const rootProps: MultiSelectRootProps = {
    /* The frame is measured — the width gate reads it, and `Backspace` finds
       the last chip through it — so a consumer who replaces it with `render`
       hands the ref on rather than losing the measurement. `toolbar` lost an
       anchor exactly this way. */
    ref: frame,
    'data-overflow': multiSelect.overflow,
    'data-part': 'root',
    ...selectorKeyProps('part', 'root'),
    'data-size': multiSelect.size,
    'data-ui': 'multi-select',
    ...selectorKeyProps('ui', 'multi-select'),
    'data-variant': multiSelect.variant,
    ...(multiSelect.fullWidth ? { 'data-full-width': '' } : {}),
    ...(multiSelect.open ? { 'data-open': '' } : {}),
    ...(multiSelect.disabled ? { 'data-disabled': '' } : {}),
    ...(multiSelect.readOnly ? { 'data-readonly': '' } : {}),
    ...(multiSelect.invalid ? { 'data-invalid': '' } : {}),
    ...(multiSelect.required ? { 'data-required': '' } : {}),
    ...(multiSelect.loading ? { 'data-loading': '' } : {}),
    ...(multiSelect.full ? { 'data-complete': '' } : {}),
    ...(multiSelect.narrow ? { 'data-narrow': '' } : {}),
  };

  /* The contract's wiring: the grid carries the field's label and the count
     of chips. A label written by id is read through `aria-labelledby` with the
     count beside it; a label written as text is joined to the count. */
  const chosen = multiSelect.t('chosen', { count: multiSelect.value.length });
  const chosenId = `${nativeProps.id ?? field?.ids.control ?? multiSelect.inputId}-chosen`;
  const labelledBy = nativeProps['aria-labelledby'] ?? field?.ids.label;
  const gridName =
    nativeProps['aria-label'] !== undefined
      ? { 'aria-label': `${nativeProps['aria-label']}, ${chosen}` }
      : labelledBy !== undefined
        ? { 'aria-labelledby': `${labelledBy} ${chosenId}` }
        : { 'aria-label': chosen };

  const inner = (
    <>
      <span hidden id={chosenId}>
        {chosen}
      </span>
      <div {...withSelectorKey(gridName, 'part', 'control')} role="grid">
        <ChipRow>
          <span data-part="field" data-part-field="" role="gridcell">
            <input
              {...withSelectorKey(nativeProps, 'part', 'input')}
              aria-activedescendant={
                multiSelect.open && multiSelect.highlighted !== null
                  ? multiSelect.optionId(multiSelect.highlighted)
                  : undefined
              }
              aria-autocomplete="list"
              aria-controls={multiSelect.open ? multiSelect.contentId : undefined}
              aria-describedby={describedBy === '' ? undefined : describedBy}
              aria-expanded={multiSelect.open}
              aria-invalid={multiSelect.invalid ? true : undefined}
              aria-readonly={multiSelect.readOnly ? true : undefined}

              disabled={multiSelect.disabled}
              id={nativeProps.id ?? field?.ids.control ?? multiSelect.inputId}
              onBlur={compose(nativeProps.onBlur, onBlur)}
              onChange={compose(nativeProps.onChange, onChange)}
              onClick={compose(nativeProps.onClick, onClick)}
              onFocus={compose(nativeProps.onFocus, onFocus)}
              onKeyDown={compose(nativeProps.onKeyDown, onKeyDown)}
              onPaste={compose(nativeProps.onPaste, onPaste)}
              /* The placeholder names what an empty control takes; beside a
                 chosen value it is a second phrase on the line, and in a frame
                 too narrow for a chip it was a sliver of a word. */
              placeholder={multiSelect.value.length === 0 ? nativeProps.placeholder : undefined}
              readOnly={multiSelect.readOnly}
              ref={setInput}
              required={multiSelect.required && multiSelect.value.length === 0}
              role="combobox"
              type="text"
              value={multiSelect.inputValue}
            />
          </span>
        </ChipRow>
      </div>
      {counter === null ? null : (
        <span aria-hidden="true" data-part="counter" data-part-counter="">
          {counter}
        </span>
      )}
      {showClear ? (
        <button
          aria-label={multiSelect.t('clear')}
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
      {multiSelect.loading ? (
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
        <button
          aria-label={multiSelect.t('trigger')}
          data-part="trigger"
          data-part-trigger=""
          disabled={multiSelect.disabled}
          onClick={toggleOpen}
          tabIndex={-1}
          type="button"
        >
          <span data-part="arrow" data-part-arrow="">
            <Icon>
              <Glyph name="chevron-down" />
            </Icon>
          </span>
        </button>
      )}
      {/*
        One hidden input per value, all under the same name: that is how a plain
        `FormData` receives several values under one key and how a native
        `reset()` restores them.
      */}
      {multiSelect.name === undefined
        ? null
        : multiSelect.value.map((value) => (
            <input
              aria-hidden="true"
              form={multiSelect.form}
              key={value}
              name={multiSelect.name}
              readOnly
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
              value={value}
            />
          ))}
    </>
  );

  if (render !== undefined) return render({ ...rootProps, children: inner });
  return <div {...rootProps}>{inner}</div>;
}

/**
 * The layer, the surface it paints, the band of chosen values and the rows that
 * speak for it.
 *
 * `status` is the live region as well as the loading row: a reader who cannot
 * see the list still hears how many options answered their query.
 */
export function MultiSelectContent({
  children,
  chosen = true,
  empty,
  ref,
  render,
  status: statusMessage,
  ...nativeProps
}: MultiSelectContentProps) {
  const multiSelect = useMultiSelect();

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
  const latest = useRef(multiSelect);
  latest.current = multiSelect;

  useEffect(() => {
    const handle = createPresence({ present: latest.current.open, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);

  useEffect(() => presence.current?.sync(multiSelect.open), [multiSelect.open]);
  useEffect(() => presence.current?.setNode(layerNode), [layerNode]);
  useEffect(() => multiSelect.setContentNode(surfaceNode), [multiSelect, surfaceNode]);

  /**
   * Open renders the popup in the commit that opens it, rather than once the
   * presence has reported `entering` in a render of its own.
   */
  const mounted =
    multiSelect.mount === 'eager' ||
    (multiSelect.mount === 'lazy' && multiSelect.seen) ||
    multiSelect.open ||
    status !== 'unmounted';

  useEffect(() => {
    const control = multiSelect.inputNode;
    if (control === null || warm) return undefined;
    const prepare = () => setWarm(true);
    control.addEventListener('focusin', prepare);
    control.addEventListener('pointerdown', prepare);
    return () => {
      control.removeEventListener('focusin', prepare);
      control.removeEventListener('pointerdown', prepare);
    };
  }, [multiSelect.inputNode, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({
      origin: multiSelect.inputNode,
      disabled: !multiSelect.portal,
    });
    setContainer(handle.container);
    return () => handle.release();
  }, [multiSelect.inputNode, multiSelect.portal, layered]);

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
  } = multiSelect;

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
    if (layerNode === null || multiSelect.inputNode === null) return;

    /* The anchor is the frame rather than the field, so the popup is as wide as
       the control the reader sees and not as wide as the caret's cell. */
    const anchor =
      multiSelect.inputNode.closest<HTMLElement>("[data-part='root']") ?? multiSelect.inputNode;

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
    flip,
    hideWhenDetached,
    layerNode,
    multiSelect.inputNode,
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
    if (multiSelect.open) {
      place(handle, layerNode);
      return;
    }
    layerNode.removeAttribute('data-open');
    if (revealFrame.current !== 0) {
      layerNode.ownerDocument.defaultView?.cancelAnimationFrame(revealFrame.current);
      revealFrame.current = 0;
    }
  }, [layerNode, place, multiSelect.open]);

  useEffect(() => {
    if (layerNode === null || !multiSelect.open) return;
    const root = multiSelect.inputNode?.closest<HTMLElement>("[data-part='root']") ?? null;
    const branches = [root].filter((branch): branch is HTMLElement => branch !== null);

    const layer = createDismissableLayer(layerNode, {
      branches,
      escape: multiSelect.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: multiSelect.closeOnOutsidePress,
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
    multiSelect.closeOnEscape,
    multiSelect.closeOnOutsidePress,
    multiSelect.inputNode,
    multiSelect.open,
    layerNode,
  ]);

  /**
   * How many options the collection put on the surface. The offer to add what
   * was typed is not one of them: it is drawn *because* the count is nought, so
   * counting it would take it away, which would bring it back.
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
   */
  useLayoutEffect(() => {
    const state = latest.current;
    if (!state.open || surfaceNode === null) return;
    if (state.entry.current !== 'none') {
      const next = entryHighlight(surfaceNode, state.entry.current, state.loop);
      state.entry.current = 'none';
      if (next !== null) state.setHighlighted(next, 'keyboard');
      return;
    }
    if (state.highlighted === null) return;
    const held = options(surfaceNode).some((option) => valueOf(option) === state.highlighted);
    if (!held) state.setHighlighted(null, 'keyboard');
  }, [multiSelect.open, count, surfaceNode]);

  /**
   * A browser scrolls a focused element into view; nothing here is focused.
   * On open the reveal waits for the position (above): the height that bounds
   * the list arrives with it.
   */
  useEffect(() => {
    if (layerNode?.hasAttribute('data-open') !== true) return;
    revealOption(surfaceNode, multiSelect.highlighted);
  }, [layerNode, multiSelect.highlighted, surfaceNode]);

  useEffect(() => {
    const target = sentinel.current;
    const root = surfaceNode;
    const onLoadMore = multiSelect.onLoadMore;
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
  }, [multiSelect.onLoadMore, count, surfaceNode]);

  if (!mounted) return null;

  const rootProps: MultiSelectPositionerProps = keyedProps({
    'data-align': align,
    ...(multiSelect.open ? {} : { inert: true }),
    'data-part': 'positioner',
    'data-size': multiSelect.size,
    'data-ui': 'multi-select',
    'data-width': multiSelect.width,
  });

  const message = (() => {
    if (statusMessage !== undefined) return statusMessage;
    if (multiSelect.loading) return multiSelect.t('loading');
    if (count === 0) return null;
    return multiSelect.t('count', { count });
  })();

  /* The offer stands only while there is something to offer and room to take
     it: a full control refuses every value, so offering one would be an offer
     the next press turns down. */
  const offering =
    !multiSelect.loading &&
    count === 0 &&
    multiSelect.creatable &&
    !multiSelect.full &&
    multiSelect.query.trim() !== '';

  const element = (
    <div
      {...rootProps}
      ref={(element: HTMLDivElement | null) => {
        setLayerNode(element);
        attach(element, ref as Ref<HTMLDivElement> | undefined);
      }}
    >
      <div
        {...withSelectorKey(nativeProps, 'part', 'content')}
        aria-busy={multiSelect.loading ? true : undefined}
        aria-multiselectable="true"
        data-loading={multiSelect.loading ? '' : undefined}

        id={multiSelect.contentId}
        ref={setSurfaceNode}
        role="listbox"
      >
        {/*
          Every chosen value, whatever the row in the control did with them. It
          is what makes `overflow="collapse"` legal against §6: the `+N` chip
          summarizes and this band is where the whole set stays reachable. Its
          chips carry no remove control — focus never enters this layer, so one
          would be reachable by pointer and by nothing else.
        */}
        {chosen && multiSelect.value.length > 0 ? (
          <div data-part="chosen" data-part-chosen="">
            {multiSelect.value.map((value) => (
              <span
                data-part="root"
                data-part-root=""
                data-size="sm"
                data-ui="tag"
                data-ui-tag=""
                data-variant="soft"
                key={value}
              >
                <span data-part="body" data-part-body="">
                  <span data-part="label" data-part-label="">
                    {multiSelect.labelFor(value) ?? value}
                  </span>
                </span>
              </span>
            ))}
          </div>
        ) : null}
        {children}
        <div ref={sentinel} />
        {offering ? (
          <div
            data-create=""
            data-part="item"
            data-part-item=""
            data-value={multiSelect.query}
            id={multiSelect.optionId(multiSelect.query)}
            onClick={(event) => {
              multiSelect.admit([multiSelect.query], 'submit', event.nativeEvent);
              multiSelect.setInputValue('', 'submit', event.nativeEvent);
              multiSelect.inputNode?.focus({ preventScroll: true });
            }}
            onPointerDown={(event) => {
              if (event.defaultPrevented) return;
              event.preventDefault();
            }}
            onPointerEnter={(event) =>
              multiSelect.setHighlighted(multiSelect.query, 'pointer', event.nativeEvent)
            }
            role="option"
            aria-selected={false}
            {...(multiSelect.highlighted === multiSelect.query ? { 'data-current': '' } : {})}
          >
            <span data-part="icon" data-part-icon="" />
            <span data-part="label" data-part-label="">
              {multiSelect.t('create', { query: multiSelect.query })}
            </span>
            <span data-part="indicator" data-part-indicator="">
              <Icon>
                <Glyph name="plus" />
              </Icon>
            </span>
          </div>
        ) : null}
        {!multiSelect.loading && count === 0 && !offering ? (
          <div data-part="empty" data-part-empty="">
            {empty ?? multiSelect.t('empty')}
          </div>
        ) : null}
        {multiSelect.loading ? (
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
          {...(multiSelect.loading ? { 'data-loading': '' } : {})}
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
