import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { tabbables } from '@slotted/core/focus';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, Ref } from 'react';
import { createPortal } from 'react-dom';

import { useField } from '../field';
import { Glyph, Icon } from '../icon';
import { useSelect } from './select';
import { ChipRow } from './select-tags';
import {
  entryHighlight,
  moveHighlight,
  options,
  revealOption,
  searchable,
  valueOf,
} from './select-collection';
import type {
  SelectContentProps,
  SelectOptionValue,
  SelectPositionerProps,
  SelectSearchProps,
  SelectSearchRootProps,
  SelectTriggerProps,
  SelectTriggerRootProps,
  SelectValueProps,
} from './select.types';
import { SPINNER_RING } from '../button/spinner-ring';

/**
 * The family's own handler runs after the consumer's, and only if the consumer
 * has not called `preventDefault`. Composing rather than replacing is what lets
 * a page put its own `onKeyDown` on a trigger and keep both.
 */
function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

/**
 * Where `Tab` goes from inside the popup.
 *
 * The layer is portalled to the end of the document, so the browser's own next
 * element is the end of the page rather than the element after the control.
 * The document's tab order is read with the layer's own subtree taken out of
 * it, the trigger is found in what remains, and focus goes to the entry beside
 * it — before it under `Shift`. Returning focus to the trigger and stopping
 * there was the first answer, and it cost a second `Tab` to leave a control the
 * reader had finished with.
 */
function moveTabFrom(trigger: HTMLElement | null, layer: HTMLElement | null, backwards: boolean) {
  if (trigger === null) return;
  const order = tabbables(document.body).filter((node) => layer === null || !layer.contains(node));
  const index = order.indexOf(trigger);
  const next = index === -1 ? undefined : order[index + (backwards ? -1 : 1)];
  (next ?? trigger).focus({ preventScroll: true });
}

function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The frame, the button, the chevron and the clear button.
 *
 * Four elements from one component, as `text-field` renders its frame, its
 * input and its two buttons: the frame draws the border and the focus ring, and
 * the ring can only be drawn by an ancestor of the thing that took focus. The
 * chevron and the clear button are siblings of the button rather than children
 * of it, because a focusable descendant of a `combobox` is a widget inside a
 * widget, and the stylesheet places both against the frame's inline end.
 *
 * `render` replaces the **frame**, which is the element a consumer has a reason
 * to change — a `label` wrapping the whole control, for instance. The button
 * itself carries the role, the wiring and every key in the pattern, and
 * replacing it would replace all three.
 */
export function SelectTrigger({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SelectTriggerProps) {
  const select = useSelect();
  const field = useField();
  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);
  const [node, setNode] = useState<HTMLButtonElement | null>(null);
  /**
   * The frame, and whether it is under the width a chip needs (SL4). The
   * measurement is the frame's rather than the trigger's because the chips
   * stand over the trigger and the sentence stands inside it, and the two have
   * to answer the same width.
   */
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  /** The last press went down on the frame; see `onClick`. */
  const pressedFrame = useRef(false);
  useEffect(() => {
    if (frame === null) return undefined;
    const doc = frame.ownerDocument;
    /* Every press resets it in the capture phase, and one on the frame sets it after. */
    const reset = () => {
      pressedFrame.current = false;
    };
    const press = () => {
      pressedFrame.current = true;
    };
    doc.addEventListener('pointerdown', reset, true);
    frame.addEventListener('pointerdown', press);
    return () => {
      doc.removeEventListener('pointerdown', reset, true);
      frame.removeEventListener('pointerdown', press);
    };
  }, [frame]);
  const [narrow, setNarrow] = useState(false);

  const pending = useRef<string | null>(null);
  const typeahead = useRef<TypeaheadHandle | null>(null);

  useEffect(() => {
    select.setTriggerNode(node);
  }, [node, select]);

  useEffect(() => {
    if (!select.typeahead) return;
    const handle = createTypeahead({ timeout: select.typeaheadTimeout });
    typeahead.current = handle;
    return () => {
      handle.destroy();
      typeahead.current = null;
    };
  }, [select.typeahead, select.typeaheadTimeout]);

  /**
   * The character that opened the popup, applied once the popup exists. A
   * printable key on a closed control both opens it and moves the highlight —
   * the pattern asks for both — and under `mount="active"` there is no list to
   * search until React has rendered one.
   */
  useEffect(() => {
    if (!select.open || select.contentNode === null) return;
    const character = pending.current;
    pending.current = null;
    if (character === null || typeahead.current === null) return;
    const { elements, labels } = searchable(select.contentNode);
    const index = typeahead.current.match(character, labels, -1);
    if (index !== -1) select.setHighlighted(valueOf(elements[index] as HTMLElement), 'keyboard');
  }, [select, select.contentNode, select.open]);

  const openWith = (entry: 'selected' | 'first' | 'last' | 'none', source?: unknown) => {
    select.entry.current = entry;
    select.setOpen(true, 'keyboard', source);
  };

  const move = (intent: Parameters<typeof moveHighlight>[2], source: unknown) => {
    const next = moveHighlight(select.contentNode, select.highlighted, intent, select.loop);
    if (next !== null) select.setHighlighted(next, 'keyboard', source);
  };

  /** Takes the highlighted option, and says what happens to the popup after. */
  const commitHighlighted = (source: unknown, close: boolean) => {
    if (select.highlighted === null) {
      if (close) select.setOpen(false, 'select', source);
      return;
    }
    select.toggle(select.highlighted, 'keyboard', source);
    if (close) select.setOpen(false, 'select', source);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (select.disabled || select.readOnly) return;
    const alt = event.altKey;

    if (!select.open) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          openWith(alt ? 'none' : 'selected', event.nativeEvent);
          return;
        case 'ArrowUp':
          event.preventDefault();
          /* The example opens onto the first option; the last is the mirror of
             ArrowDown and what every surveyed implementation does. The contract
             records the departure. */
          openWith('last', event.nativeEvent);
          return;
        case 'Enter':
        case ' ':
          event.preventDefault();
          openWith('selected', event.nativeEvent);
          return;
        case 'Home':
          event.preventDefault();
          openWith('first', event.nativeEvent);
          return;
        case 'End':
          event.preventDefault();
          openWith('last', event.nativeEvent);
          return;
        default:
          break;
      }
      if (!event.ctrlKey && !event.metaKey && !alt && isPrintable(event.key)) {
        /* With a search field the character opens the popup and becomes the
           first character of the query; without one it opens the popup and
           seeds the typeahead. The pattern asks the same thing of both — a
           printable key opens and moves the highlight — and only the search
           the key feeds differs. */
        if (select.search) {
          event.preventDefault();
          select.setQuery(event.key, 'keyboard', event.nativeEvent);
          openWith('first', event.nativeEvent);
          return;
        }
        if (select.typeahead) {
          event.preventDefault();
          pending.current = event.key;
          openWith('none', event.nativeEvent);
        }
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move('next', event.nativeEvent);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (alt) commitHighlighted(event.nativeEvent, true);
        else move('previous', event.nativeEvent);
        return;
      case 'Home':
        event.preventDefault();
        move('first', event.nativeEvent);
        return;
      case 'End':
        event.preventDefault();
        move('last', event.nativeEvent);
        return;
      case 'PageDown':
        event.preventDefault();
        move('pageDown', event.nativeEvent);
        return;
      case 'PageUp':
        event.preventDefault();
        move('pageUp', event.nativeEvent);
        return;
      case 'Enter':
        event.preventDefault();
        commitHighlighted(event.nativeEvent, select.closeOnSelect);
        return;
      case ' ':
        event.preventDefault();
        /* Multiple selection keeps the popup open on Space, which is the
           listbox pattern's recommended model: the reader toggles several
           options without the list closing under them. */
        commitHighlighted(event.nativeEvent, select.multiple ? false : select.closeOnSelect);
        return;
      case 'Escape':
        event.preventDefault();
        select.setOpen(false, 'escape', event.nativeEvent);
        return;
      case 'Tab':
        /* Not prevented: the key commits and then does what Tab does. The
           example states this and notes it differs from a native select, which
           closes and leaves focus where it is. */
        commitHighlighted(event.nativeEvent, true);
        return;
      default:
        break;
    }

    if (!select.typeahead || typeahead.current === null) return;
    if (event.ctrlKey || event.metaKey || alt) return;
    if (!isPrintable(event.key, typeahead.current.query.length > 0)) return;

    event.preventDefault();
    const { elements, labels } = searchable(select.contentNode);
    const from = elements.findIndex((option) => valueOf(option) === select.highlighted);
    const index = typeahead.current.match(event.key, labels, from);
    if (index !== -1) select.setHighlighted(valueOf(elements[index] as HTMLElement), 'keyboard');
  };

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    /* A press on the field's label arrives here as the click the label
       forwards: a pointer click whose press went down on the label, not on
       the frame. It focuses the control and does not open the list — the
       select-only example's label only focuses, and so does a native
       select's. A keyboard or assistive-technology click carries detail 0 and
       opens. The press is recorded rather than the click's coordinates
       compared with the frame's box: that box is a layout read in the click's
       own task, after the release changed the frame's style. */
    const fromFrame = pressedFrame.current;
    pressedFrame.current = false;
    if (event.detail > 0 && !fromFrame) {
      event.currentTarget.focus({ preventScroll: true });
      return;
    }
    if (select.disabled || select.readOnly) return;
    select.entry.current = 'selected';
    select.setOpen(!select.open, 'pointer', event.nativeEvent);
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    select.clear('clear', event.nativeEvent);
    /* Focus goes back to the control the reader was on: a button that removes
       itself as it is pressed would otherwise leave focus on the document. */
    node?.focus({ preventScroll: true });
  };

  const setButton = useCallback(
    (element: HTMLButtonElement | null) => {
      setNode(element);
      attach(element, ref);
    },
    [ref],
  );

  const describedBy = [nativeProps['aria-describedby'], field?.describedBy]
    .filter(Boolean)
    .join(' ');

  const showClear =
    select.clearable && select.selection.length > 0 && !select.disabled && !select.readOnly;

  /* className and style size the frame, the element that draws the control, as on TextField. */
  const rootProps: SelectTriggerRootProps = {
    className,
    style,
    'data-part': 'root',
    ...selectorKeyProps('part', 'root'),
    'data-size': select.size,
    'data-ui': 'select',
    ...selectorKeyProps('ui', 'select'),
    'data-variant': select.variant,
    ...(select.fullWidth ? { 'data-full-width': '' } : {}),
    ...(select.multiple ? { 'data-multiple': '' } : {}),
    ...(select.open ? { 'data-open': '' } : {}),
    ...(select.disabled ? { 'data-disabled': '' } : {}),
    ...(select.readOnly ? { 'data-readonly': '' } : {}),
    ...(select.invalid ? { 'data-invalid': '' } : {}),
    ...(select.required ? { 'data-required': '' } : {}),
    ...(select.loading ? { 'data-loading': '' } : {}),
    ...(narrow ? { 'data-narrow': '' } : {}),
  };

  /**
   * The chips stand over the trigger rather than inside it: the trigger is a
   * `button`, and a remove control inside one is a control inside a control
   * (SL4). The row is a sibling, placed by the stylesheet over the trigger's
   * own content box, and it lets every press it does not want through to the
   * button underneath.
   */
  const chips =
    select.multiple && select.selection.length > 0 ? (
      <ChipRow
        disabled={select.disabled || select.readOnly}
        frame={frame}
        labelFor={select.labelFor}
        onNarrow={setNarrow}
        onRemove={(value, event) => {
          select.toggle(value, 'select', event.nativeEvent);
          node?.focus({ preventScroll: true });
        }}
        removeLabel={(label) => select.t('remove', { label })}
        values={select.selection}
      />
    ) : null;

  const inner = (
    <>
      <button
        {...nativeProps}
        /* The search field holds focus while the popup is open, so it is the
           field that names the highlighted option. Two elements naming one
           option would put the same announcement on the element nobody is
           operating. */
        aria-activedescendant={
          select.open && !select.search && select.highlighted !== null
            ? select.optionId(select.highlighted)
            : undefined
        }
        aria-controls={select.open ? select.contentId : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        aria-expanded={select.open}
        /*
         * `listbox` is redundant for role="combobox", whose implicit value is
         * listbox, and written anyway because the element is a button and the
         * role replaces `button` on it. `dialog` is not redundant: the pattern
         * requires it of a popup that is not a listbox, and a popup holding a
         * text field and a list is a dialog.
         */
        aria-haspopup={select.search ? 'dialog' : 'listbox'}
        aria-invalid={select.invalid ? true : undefined}
        aria-labelledby={
          nativeProps['aria-label'] === undefined && nativeProps['aria-labelledby'] === undefined
            ? field?.ids.label
            : nativeProps['aria-labelledby']
        }
        aria-readonly={select.readOnly ? true : undefined}
        aria-required={select.required ? true : undefined}
        data-part="trigger"
        data-part-trigger=""
        disabled={select.disabled}
        id={select.triggerId}
        onClick={compose(nativeProps.onClick, onClick)}
        onKeyDown={compose(nativeProps.onKeyDown, onKeyDown)}
        ref={setButton}
        role="combobox"
        type="button"
      >
        {children}
      </button>
      {chips}
      {showClear ? (
        <button
          aria-label={select.t('clear')}
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
      {/*
        While an answer is travelling the control shows the ring rather than the
        chevron: the chevron says the popup opens, and it does not open onto
        anything yet (SL6). The arc is `spinner`'s, worn as `data-ui` beside
        this family's own part.
      */}
      {select.loading ? (
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
      <NativeSelect />
    </>
  );

  if (render !== undefined) return render({ ...rootProps, children: inner });
  return (
    <div {...rootProps} ref={setFrame}>
      {inner}
    </div>
  );
}

/**
 * The element a plain form submits, and the one a native `reset()` restores.
 *
 * A real `select` with a real `option` for each value, visually hidden rather
 * than `display: none`, because a hidden control is not submitted. Radix ships
 * the same element for the same reason, and it is what makes the browser's own
 * validation bubble point at the right control.
 *
 * It is `aria-hidden` and out of the tab order: the reader operates the button
 * above it, and a second combobox in the accessibility tree would be announced
 * twice.
 */
function NativeSelect() {
  const select = useSelect();
  const [node, setNode] = useState<HTMLSelectElement | null>(null);
  const { restore } = select;

  /**
   * A native reset restores the hidden select's own options and tells nothing,
   * so the control would keep the last value chosen in a form that had been
   * reset. The form is reached through the element rather than through a prop,
   * because `form` may name a form anywhere in the document.
   */
  useEffect(() => {
    const owner = node?.form;
    if (owner === null || owner === undefined) return;
    const onReset = (event: Event) => restore(event);
    owner.addEventListener('reset', onReset);
    return () => owner.removeEventListener('reset', onReset);
  }, [node, restore, select.form]);

  if (select.name === undefined) return null;

  return (
    <select
      aria-hidden="true"
      disabled={select.disabled}
      form={select.form}
      multiple={select.multiple}
      name={select.name}
      onChange={() => undefined}
      ref={setNode}
      required={select.required}
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
      value={select.multiple ? [...select.selection] : (select.selection[0] ?? '')}
    >
      <option value="" />
      {select.selection.map((value) => (
        <option key={value} value={value}>
          {select.labelFor(value) ?? value}
        </option>
      ))}
    </select>
  );
}

/**
 * What the control shows: the chosen label, the summary of several, or the
 * placeholder.
 *
 * `children` is a function rather than a node, because the only thing a
 * consumer needs to change here is how a *value* becomes words — "three
 * selected", a chip count, a formatted date. It receives the values and the
 * labels the family could resolve, so a consumer who has the records already
 * does not have to resolve them twice.
 */
export function SelectValue({ children, placeholder, ...nativeProps }: SelectValueProps) {
  const select = useSelect();
  const labels = select.selection.map((value) => select.labelFor(value));
  const resolved = labels.filter((label): label is string => label !== undefined);
  const unmatched = select.selection.length > 0 && resolved.length < select.selection.length;

  const summary = (() => {
    if (children !== undefined) return children(select.selection, resolved);
    if (select.selection.length === 0) return placeholder;
    const first = labels[0] ?? select.selection[0];
    if (!select.multiple || select.selection.length === 1) return first;
    /**
     * Several values are the chips beside this element, not a sentence here
     * (SL4). The sentence stays anyway, in its own part: it is the trigger's
     * accessible name, and it is what a control too narrow for a chip shows
     * instead. The stylesheet decides which of the two is seen; the name is
     * the same either way.
     */
    return (
      <span data-part="summary" data-part-summary="">
        {select.t('summary', { count: select.selection.length })}
      </span>
    );
  })();

  return (
    <span
      {...withSelectorKey(nativeProps, 'part', 'value')}

      {...(select.selection.length === 0 ? { 'data-placeholder': '' } : {})}
      {...(unmatched ? { 'data-unmatched': '' } : {})}
    >
      {summary}
    </span>
  );
}

/**
 * The field the reader filters the options with, at the top of the popup.
 *
 * It is `role="combobox"` over the `list` below it, and it holds DOM focus for
 * the whole time the popup is open — which is what the combobox pattern
 * requires of a dialog popup: "dialogs do not support `aria-activedescendant`
 * so DOM focus moves into the dialog from the combobox". The trigger becomes
 * the outer combobox, over the dialog; this is the inner one, over the listbox.
 *
 * It is rendered by `SelectContent` rather than placed by the consumer, because
 * the two elements it sits between — the dialog and the listbox — are wiring
 * the family owns. `searchProps` on `SelectContent` reaches every native
 * attribute of it, its glyph and its `render`.
 */
export function SelectSearch({ icon, ref, render, ...nativeProps }: SelectSearchProps) {
  const select = useSelect();

  const move = (intent: Parameters<typeof moveHighlight>[2], source: unknown) => {
    const next = moveHighlight(select.contentNode, select.highlighted, intent, select.loop);
    if (next !== null) select.setHighlighted(next, 'keyboard', source);
  };

  /** Takes the highlighted option, and says what happens to the popup after. */
  const commit = (source: unknown, close: boolean) => {
    if (select.highlighted !== null) select.toggle(select.highlighted, 'keyboard', source);
    if (close) {
      select.setOpen(false, 'select', source);
      select.triggerNode?.focus({ preventScroll: true });
      return;
    }
    /* The popup stayed open, so the query is emptied here rather than by the
       close, for the reason an option's own press empties it. */
    if (select.highlighted !== null) select.setQuery('', 'select', source);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const alt = event.altKey;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move('next', event.nativeEvent);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (alt) commit(event.nativeEvent, true);
        else move('previous', event.nativeEvent);
        return;
      case 'PageDown':
        event.preventDefault();
        move('pageDown', event.nativeEvent);
        return;
      case 'PageUp':
        event.preventDefault();
        move('pageUp', event.nativeEvent);
        return;
      case 'Enter':
        event.preventDefault();
        commit(event.nativeEvent, select.closeOnSelect && !select.multiple);
        return;
      case 'Escape':
        event.preventDefault();
        /* The layer saw this key first, in the capture phase, and its dismiss
           handler holds the two steps. This branch is what answers when the
           layer was told to ignore Escape entirely: the query still empties,
           and the popup a consumer said to keep open stays open. */
        if (select.query !== '') select.setQuery('', 'clear', event.nativeEvent);
        return;
      case 'Tab':
        event.preventDefault();
        commit(event.nativeEvent, true);
        moveTabFrom(
          select.triggerNode,
          event.currentTarget.closest("[data-part='positioner']"),
          event.shiftKey,
        );
        return;
      default:
        /*
         * Everything else is the browser's: the caret, the selection, the text
         * editing, and `Home`, `End` and the space bar with them. The closed
         * control spends all three on the list; a field the reader is typing
         * into cannot spend any of them, and the pattern's editable branch
         * returns `Home` and `End` to the caret for the same reason.
         */
        break;
    }
  };

  const rootProps: SelectSearchRootProps = {
    'data-part': 'search',
    ...selectorKeyProps('part', 'search'),
  };

  const field = (
    <>
      {icon === null
        ? null
        : (icon ?? (
            <span aria-hidden="true" data-part="search-icon" data-part-search-icon="">
              <Icon>
                <Glyph name="search" />
              </Icon>
            </span>
          ))}
      <input
        {...withSelectorKey(nativeProps, 'part', 'search-input')}
        aria-activedescendant={
          select.highlighted === null ? undefined : select.optionId(select.highlighted)
        }
        aria-autocomplete="list"
        aria-controls={select.listId}
        aria-expanded={true}
        aria-label={nativeProps['aria-label'] ?? select.t('search')}
        autoComplete="off"

        id={nativeProps.id ?? select.searchId}
        onChange={compose(nativeProps.onChange, (event) =>
          select.setQuery(event.target.value, 'keyboard', event.nativeEvent),
        )}
        onKeyDown={compose(nativeProps.onKeyDown, onKeyDown)}
        placeholder={nativeProps.placeholder ?? select.t('searchPlaceholder')}
        ref={(element: HTMLInputElement | null) => {
          select.setSearchNode(element);
          attach(element, ref);
        }}
        role="combobox"
        spellCheck={false}
        type="text"
        value={select.query}
      />
    </>
  );

  if (render !== undefined) return render({ ...rootProps, children: field });
  return <div {...rootProps}>{field}</div>;
}

/**
 * The layer and the surface it paints.
 *
 * The layer is what the positioner writes `left` and `top` onto and what scales
 * and fades; the surface is the painted panel, and it is the element carrying
 * `role="listbox"`. Two boxes rather than one, as `tooltip`, `popover` and
 * `menu` are built, because the positioner leaves `transform` alone on purpose.
 */
export function SelectContent({
  children,
  empty,
  ref,
  render,
  searchProps,
  status: statusMessage,
  ...nativeProps
}: SelectContentProps) {
  const select = useSelect();

  const [layerNode, setLayerNode] = useState<HTMLElement | null>(null);
  const [surfaceNode, setSurfaceNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to open the popup: the trigger took focus or a press.
   * The portal's layer is made then, because making it reads the trigger's
   * computed style, and a read in the open's own task is a style recalculation
   * the first frame waits for. A press focuses before it clicks, in a task of
   * its own.
   */
  const [warm, setWarm] = useState(false);
  /**
   * How many options the popup is holding, counted from the DOM after every
   * render. It is what decides whether the empty row is drawn, and counting is
   * what lets a consumer render options from any shape — a map, a filter, three
   * groups — without telling the family how many there will be.
   */
  const [count, setCount] = useState(0);

  const presence = useRef<PresenceHandle | null>(null);
  const latest = useRef(select);
  latest.current = select;

  useEffect(() => {
    const handle = createPresence({ present: latest.current.open, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);

  useEffect(() => presence.current?.sync(select.open), [select.open]);
  useEffect(() => presence.current?.setNode(layerNode), [layerNode]);
  useEffect(() => select.setContentNode(surfaceNode), [select, surfaceNode]);

  /**
   * Open renders the popup in the commit that opens it, rather than once the
   * presence has reported `entering` in a render of its own.
   */
  const mounted =
    select.mount === 'eager' ||
    (select.mount === 'lazy' && select.seen) ||
    select.open ||
    status !== 'unmounted';

  useEffect(() => {
    const trigger = select.triggerNode;
    if (trigger === null || warm) return undefined;
    const prepare = () => setWarm(true);
    trigger.addEventListener('focusin', prepare);
    trigger.addEventListener('pointerdown', prepare);
    return () => {
      trigger.removeEventListener('focusin', prepare);
      trigger.removeEventListener('pointerdown', prepare);
    };
  }, [select.triggerNode, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({ origin: select.triggerNode, disabled: !select.portal });
    setContainer(handle.container);
    return () => handle.release();
  }, [layered, select.portal, select.triggerNode]);

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
  } = select;

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
    if (layerNode === null || select.triggerNode === null) return;

    /* The anchor is the frame rather than the button inside it, so the popup is
       as wide as the control the reader sees: the trigger is the frame less its
       two borders, and `matchWidth` writes whatever it is given (SL10).
       `combobox` anchors to its own frame for the same reason. */
    const anchor =
      select.triggerNode.closest<HTMLElement>("[data-part='root']") ?? select.triggerNode;

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
    select.triggerNode,
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
    if (select.open) {
      place(handle, layerNode);
      return;
    }
    layerNode.removeAttribute('data-open');
    if (revealFrame.current !== 0) {
      layerNode.ownerDocument.defaultView?.cancelAnimationFrame(revealFrame.current);
      revealFrame.current = 0;
    }
  }, [layerNode, place, select.open]);

  /**
   * One layer in the single stack. The control is a branch, so pressing the
   * trigger again toggles the popup instead of dismissing it and reopening it
   * in the same gesture.
   */
  useEffect(() => {
    if (layerNode === null || !select.open) return;
    const branches = [select.triggerNode].filter(
      (branch): branch is HTMLElement => branch !== null,
    );

    const layer = createDismissableLayer(layerNode, {
      branches,
      escape: select.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: select.closeOnOutsidePress,
      scrollLock: false,
      onDismiss: (request) => {
        const select = latest.current;
        /**
         * The query first, the popup second — and the decision lives here
         * rather than in the field's own handler because the layer listens in
         * the **capture** phase: it sees Escape before anything inside it does,
         * so a field that tried to spend the key first would already have lost
         * the surface. A reader four characters into a search wants the whole
         * list back more often than they want the popup gone, and the pattern
         * names this branch and makes it optional.
         */
        if (request.reason === 'escape' && select.search && select.query !== '') {
          select.setQuery('', 'clear', request.source);
          return;
        }
        select.setOpen(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source,
        );
        /* Focus goes back to the control on a key and stays where the reader
           put it on a press outside. */
        if (request.reason === 'escape') select.triggerNode?.focus({ preventScroll: true });
      },
    });
    return () => layer.destroy();
  }, [
    layerNode,
    select.closeOnEscape,
    select.closeOnOutsidePress,
    select.open,
    select.triggerNode,
  ]);

  /**
   * Where the highlight lands as the popup opens. Nothing takes focus — the
   * trigger keeps it for the whole interaction — so this is the whole of what
   * "focus enters the surface" means for this family.
   */
  /**
   * Where the highlight lands as the popup opens. Nothing takes focus — the
   * trigger keeps it for the whole interaction — so this is the whole of what
   * "focus enters the surface" means for this family.
   *
   * The effect is **idempotent**, and deliberately: React invokes a layout
   * effect twice per mount under StrictMode, and the first version of this one
   * consumed `entry` by resetting it — so the second invocation read
   * `'selected'`, and `ArrowUp` opened onto the first option instead of the
   * last. Nothing is consumed here; `setOpen` puts `entry` back when the popup
   * closes, which is the one moment the answer stops being needed.
   */
  useLayoutEffect(() => {
    const state = latest.current;
    if (!state.open || surfaceNode === null) return;
    if (state.entry.current === 'none') return;
    const next = entryHighlight(surfaceNode, state.selection, state.entry.current, state.loop);
    if (next !== null) state.setHighlighted(next, 'keyboard');
  }, [select.open, surfaceNode]);

  useLayoutEffect(() => {
    const measured = options(surfaceNode).length;
    setCount((held) => (held === measured ? held : measured));
  });

  /**
   * A browser scrolls a focused element into view; nothing here is focused.
   * On open the reveal waits for the position (above): the height that bounds
   * the list arrives with it.
   */
  useEffect(() => {
    if (layerNode?.hasAttribute('data-open') !== true) return;
    revealOption(surfaceNode, select.highlighted);
  }, [layerNode, select.highlighted, surfaceNode]);

  /**
   * The field takes focus as the popup opens, however it was opened — a press
   * on the trigger included. The combobox pattern's note is the reason: a
   * dialog popup does not support `aria-activedescendant`, so DOM focus moves
   * into the dialog. A select with a search field exists to be typed into, and
   * a reader who had to press `Tab` first would be one key from the capability
   * they asked for.
   *
   * The trigger takes focus back where the popup is closed — by `Escape`, by a
   * commit, by `Tab` — and each of those does it where the close happens. It is
   * deliberately not done here, on the popup unmounting: an outside press has
   * already put focus where the reader wanted it, and taking it back would undo
   * the gesture that closed the popup.
   */
  const searchNode = select.searchNode;
  useEffect(() => {
    if (!select.open || !select.search || searchNode === null) return;
    searchNode.focus({ preventScroll: true });
  }, [searchNode, select.open, select.search]);

  /**
   * The highlight follows the query. A reader who types four characters and
   * presses `Enter` means the first row they can see, and a highlight left on
   * a row the filter has just removed answers with nothing at all.
   */
  const lastQuery = useRef(select.query);
  useEffect(() => {
    if (!select.open || !select.search || surfaceNode === null) return;
    if (lastQuery.current === select.query) return;
    lastQuery.current = select.query;
    latest.current.setHighlighted(moveHighlight(surfaceNode, null, 'first', false), 'keyboard');
  }, [count, select.open, select.query, select.search, surfaceNode]);

  /**
   * The labels a closed control has to print. Under `mount="active"` the popup
   * does not exist until the first open, so a held value that is not its own
   * label — an identifier — read as the identifier until `items` was passed.
   * While such a value is held and the popup is not built, the options are
   * rendered once into a fragment no document holds: each registers its label,
   * and the fragment goes in the next commit. A set of values no option names
   * is collected once, not on every render. The key is `null` when every held
   * value has a label: a joined key would read the one value `""` as none.
   */
  const pending = select.selection.filter((held) => select.labelFor(held) === undefined);
  const unresolved = pending.length === 0 ? null : JSON.stringify(pending);
  const [collector, setCollector] = useState<DocumentFragment | null>(null);
  const collected = useRef<string | null>(null);
  useEffect(() => {
    if (collector !== null) {
      setCollector(null);
      return;
    }
    if (mounted || unresolved === null || collected.current === unresolved) return;
    collected.current = unresolved;
    setCollector((select.triggerNode?.ownerDocument ?? document).createDocumentFragment());
  }, [collector, mounted, select.triggerNode, unresolved]);

  if (!mounted) return collector === null ? null : createPortal(children, collector);

  const rootProps: SelectPositionerProps = keyedProps({
    'data-align': align,
    ...(select.open ? {} : { inert: true }),
    'data-part': 'positioner',
    'data-size': select.size,
    'data-ui': 'select',
    'data-width': select.width,
  });

  /**
   * The sentence the live region carries. While an answer is travelling it is
   * the loading message; while the reader is searching it is how many options
   * survived the query, which is what `docs/component-features.md` §6 asks of
   * a filtered collection — "leitores de tela recebem contagem e item ativo".
   * `combobox` announces the same count, in the same place, in the same words.
   */
  const message = (() => {
    if (statusMessage !== undefined) return statusMessage;
    if (select.loading) return select.t('loading');
    if (!select.search || count === 0) return null;
    return select.t('count', { count });
  })();

  /*
   * Everything that is chosen, at the top of the popup (SL10). The control
   * holds one line, so twelve values are three chips and a count; here they are
   * all of them, and the band scrolls at about two rows of its own rather than
   * growing the surface.
   *
   * It is `aria-hidden`, and carries no remove control. The reason is keyboard
   * reach: without `search` focus never enters this layer at all, and with it
   * the layer's one `Tab` is spent commiting and leaving the control — so a
   * widget in the band would be reachable by pointer and by nothing else.
   * Taking a value back is the option's own row, which the list has open
   * beside it, and the chips in the control, which are focusable.
   */
  const chosen =
    select.multiple && select.selection.length > 0 ? (
      <div aria-hidden="true" data-part="chosen" data-part-chosen="">
        {select.selection.map((value) => (
          <span
            data-part="root"
            data-part-root=""
            data-size="sm"
            data-ui="tag"
            data-ui-tag=""
            data-variant="soft"
            key={String(value)}
          >
            <span data-part="body" data-part-body="">
              <span data-part="label" data-part-label="">
                {select.labelFor(value) ?? String(value)}
              </span>
            </span>
          </span>
        ))}
      </div>
    ) : null;

  /*
   * The two rows a consumer configures rather than places. A popup that opens
   * onto nothing is what React Aria refuses to open at all and what Radix
   * paints as an empty box; here it opens onto a sentence, and the sentence has
   * a default so a family that says nothing still says something. The status
   * row keeps the popup's measure while an answer is travelling, so nothing
   * jumps when the options land.
   */
  const rows = (
    <>
      {chosen}
      {children}
      {select.loading ? (
        /*
          The wait, as the shape of the list that is coming: three rows the
          height of an option, drawn by `skeleton` (SL6). Hidden from assistive
          technology — the status row below is the live region and it already
          says what is happening.
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
      {!select.loading && count === 0 ? (
        <div data-part="empty" data-part-empty="">
          {empty ?? select.t('empty')}
        </div>
      ) : null}
      {select.search || select.loading ? (
        <div
          aria-live="polite"
          data-part="status"
          data-part-status=""
          {...(select.loading ? { 'data-loading': '' } : {})}
          role="status"
        >
          {message}
        </div>
      ) : null}
    </>
  );

  /**
   * One element or two, and the pattern decides which.
   *
   * Without a search field the surface *is* the listbox, as it has always been.
   * With one the surface is a dialog — "the popup is an element that has role
   * `listbox`, `tree`, `grid`, or `dialog`" — and the listbox moves one element
   * in, because a listbox holds options and groups and a text field is neither.
   */
  const listWiring = {
    'aria-busy': select.loading ? true : undefined,
    'aria-multiselectable': select.multiple ? true : undefined,
  } as const;

  const element = (
    <div
      {...rootProps}
      ref={(node: HTMLDivElement | null) => {
        setLayerNode(node);
        attach(node, ref as Ref<HTMLDivElement> | undefined);
      }}
    >
      <div
        {...nativeProps}
        {...withSelectorKey(select.search ? {} : listWiring, 'part', 'content')}
        aria-labelledby={nativeProps['aria-label'] === undefined ? select.triggerId : undefined}
        data-loading={select.loading ? '' : undefined}

        {...(select.search ? { 'data-search': '' } : {})}
        id={select.contentId}
        ref={setSurfaceNode}
        role={select.search ? 'dialog' : 'listbox'}
      >
        {select.search ? (
          <>
            <SelectSearch {...searchProps} />
            <div
              {...withSelectorKey(listWiring, 'part', 'list')}
              aria-labelledby={select.triggerId}

              id={select.listId}
              role="listbox"
            >
              {rows}
            </div>
          </>
        ) : (
          rows
        )}
      </div>
    </div>
  );

  const rendered = render === undefined ? element : render({ ...rootProps, children });
  return container === null ? rendered : createPortal(rendered, container);
}

export type { SelectOptionValue };
