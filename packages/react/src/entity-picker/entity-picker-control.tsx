import { selectorKeyProps } from '@slotted/core/selector-key';
import { entityInitials, entityName, entityPickerKey } from '@slotted/core/entity-picker';
import type { Entity } from '@slotted/core/entity-picker';
import { moveIndex } from '@slotted/core/collection';
import { pressOrigin } from '@slotted/core/dismissable-layer';
import { createArrowNavigation, createRemovalFocus } from '@slotted/core/focus';
import { createCollapse } from '@slotted/core/overflow';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';

import { Avatar } from '../avatar';
import { useField } from '../field';
import { Glyph, Icon } from '../icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { useEntityPicker } from './entity-picker';
import type { EntityPickerRootProps } from './entity-picker.types';
import { SPINNER_RING } from '../button/spinner-ring';

const CHIP_SELECTOR = "[data-part='chips'] > [data-ui='tag']:not([data-count])";

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

const HIDDEN_INPUT = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

/** A record's face, as the avatar family draws it, or nothing for `avatar: null`. */
export function EntityFace({ entity, locale }: { entity: Entity; locale: string | undefined }) {
  if (entity.avatar === null) return null;
  return (
    <Avatar
      decorative
      initials={entityInitials(entity)}
      locale={locale}
      name={entity.avatar?.name ?? entity.label}
      shape={entity.avatar?.shape ?? 'circle'}
      surface={entity.avatar?.surface ?? 'tone'}
      size="xs"
      {...(entity.avatar?.src === undefined ? {} : { src: entity.avatar.src })}
    />
  );
}

/**
 * The root, the scope, the frame and everything the frame holds.
 *
 * The input is a real `input`: the caret, the selection, IME and autofill stay
 * the browser's, and `entityPickerKey` binds only the keys the pattern gives
 * the family.
 */
export function EntityPickerControl() {
  const picker = useEntityPicker();
  const field = useField();
  const { props } = picker;
  const {
    'aria-describedby': describedByProp,
    'aria-label': ariaLabel,
    form,
    id,
    name,
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    placeholder,
    ref,
    render,
    // Everything the family owns and the input must not receive.
    source: _source,
    items: _items,
    entities: _entities,
    favorites: _favorites,
    recent: _recent,
    scopes,
    scope: _scope,
    defaultScope: _defaultScope,
    onScopeChange: _onScopeChange,
    inputValue: _inputValue,
    defaultInputValue: _defaultInputValue,
    onInputValueChange: _onInputValueChange,
    open: _open,
    defaultOpen: _defaultOpen,
    onOpenChange: _onOpenChange,
    highlightedValue: _highlightedValue,
    defaultHighlightedValue: _defaultHighlightedValue,
    onHighlightedValueChange: _onHighlightedValueChange,
    onCreate: _onCreate,
    renderOption: _renderOption,
    renderChip,
    handleRef: _handleRef,
    locale: _locale,
    max: _max,
    clearable: _clearable,
    disabled: _disabled,
    fullWidth: _fullWidth,
    highlightMatch: _highlightMatch,
    invalid: _invalid,
    messages: _messages,
    loop: _loop,
    media: _media,
    minQueryLength: _minQueryLength,
    openOn: _openOn,
    overflow: _overflow,
    portal: _portal,
    readOnly: _readOnly,
    required: _required,
    searchDelay: _searchDelay,
    side: _side,
    size: _size,
    strategy: _strategy,
    variant: _variant,
    width: _width,
    selectionMode: _selectionMode,
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    ...nativeProps
  } = props;

  const { t, multiple } = picker;
  const chosen = picker.chosen;
  const chips = useRef<HTMLDivElement | null>(null);
  const count = useRef<HTMLSpanElement | null>(null);
  const [collapsed, setCollapsed] = useState(0);

  const setInput = useCallback(
    (element: HTMLInputElement | null) => {
      picker.setInputNode(element);
      attach(element, ref);
    },
    [ref],
  );

  const openWith = (entry: 'first' | 'last' | 'keep', source: unknown) => {
    picker.entry.current = entry;
    picker.setOpen(true, 'keyboard', source);
  };

  const move = (intent: Parameters<typeof moveIndex>[0]['intent'], source: unknown) => {
    const options = picker.options;
    const from = options.findIndex((option) => option.key === picker.highlighted);
    const next = moveIndex({
      enabled: options.map((option) => !option.disabled),
      from,
      intent,
      loop: picker.loop,
    });
    if (next >= 0) picker.setHighlighted(options[next]!.key, 'keyboard', source);
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (picker.disabled) return;
    const input = event.currentTarget;
    const action = entityPickerKey({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      composing: event.nativeEvent.isComposing,
      open: picker.open,
      selectionMode: multiple ? 'multiple' : 'single',
      readOnly: picker.readOnly,
      highlighted: picker.highlighted !== null,
      empty: input.value === '',
      caretAtStart: input.selectionStart === 0 && input.selectionEnd === 0,
      chips: chosen.length,
      dir: getComputedStyle(input).direction === 'rtl' ? 'rtl' : 'ltr',
    });
    const source = event.nativeEvent;

    switch (action.type) {
      case 'none':
        if (event.key === 'Tab' && picker.open) picker.setOpen(false, 'blur', source);
        return;
      case 'open':
        event.preventDefault();
        openWith(action.highlight, source);
        return;
      case 'close':
        event.preventDefault();
        picker.setOpen(false, action.reason, source);
        return;
      case 'move':
        event.preventDefault();
        move(action.intent, source);
        return;
      case 'activate':
        event.preventDefault();
        if (picker.highlighted !== null) picker.activate(picker.highlighted, 'keyboard', source);
        return;
      case 'revert':
        event.preventDefault();
        picker.revert(source);
        return;
      case 'clearQuery':
        event.preventDefault();
        picker.clearQuery(source);
        return;
      case 'focusChip': {
        event.preventDefault();
        const all = [...(chips.current?.querySelectorAll<HTMLElement>(CHIP_SELECTOR) ?? [])].filter(
          (chip) => !chip.hidden,
        );
        all[all.length - 1]?.focus({ preventScroll: true });
        return;
      }
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    picker.setTyped(event.currentTarget.value, event.nativeEvent);
    if (!picker.open && !picker.readOnly && picker.openOn !== 'manual') {
      picker.entry.current = 'keep';
      picker.setOpen(true, 'keyboard', event.nativeEvent);
    }
  };

  const handleFocus = () => {
    if (picker.openOn !== 'focus' || picker.readOnly || picker.open) return;
    picker.entry.current = multiple ? 'keep' : 'selected';
    picker.setOpen(true, 'keyboard');
  };

  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    if (picker.openOn === 'manual' || picker.disabled || picker.readOnly || picker.open) return;
    picker.entry.current = multiple ? 'keep' : 'selected';
    picker.setOpen(true, 'pointer', event.nativeEvent);
  };

  const handleBlur = (event: { relatedTarget: EventTarget | null }) => {
    const next = event.relatedTarget;
    const content = picker.inputNode?.ownerDocument.getElementById(picker.contentId) ?? null;
    const root = picker.controlNode?.parentElement ?? null;
    if (next instanceof Node && (content?.contains(next) || picker.controlNode?.contains(next))) {
      return;
    }
    const began = pressOrigin(picker.inputNode?.ownerDocument);
    if (began instanceof Node && content?.contains(began) === true) return;
    void root;
    picker.settle(event);
    if (picker.open) picker.setOpen(false, 'blur');
  };

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (picker.disabled || picker.readOnly) return;
    picker.entry.current = multiple ? 'keep' : 'selected';
    picker.setOpen(!picker.open, 'pointer', event.nativeEvent);
    picker.inputNode?.focus({ preventScroll: true });
  };

  const onClear = (event: MouseEvent<HTMLButtonElement>) => {
    picker.clear(event.nativeEvent);
    picker.inputNode?.focus({ preventScroll: true });
  };

  /* The ring over the chips and the field, and where focus goes after a removal. */
  useEffect(() => {
    const row = chips.current;
    if (row === null) return;
    const navigation = createArrowNavigation(row, {
      itemSelector: `${CHIP_SELECTOR}, [data-part='field'] > [data-part='input']`,
      loop: false,
      ownedKeys: (item) =>
        item instanceof HTMLInputElement && item.value !== ''
          ? ['ArrowLeft', 'ArrowRight', 'Home', 'End']
          : [],
    });
    const removal = createRemovalFocus(row, {
      itemSelector: CHIP_SELECTOR,
      fallback: () => picker.inputNode,
    });
    return () => {
      navigation.destroy();
      removal.destroy();
    };
  }, [multiple, picker.inputNode]);

  /* One line: what does not fit is counted by the "+N" chip. */
  const collapsing = multiple && picker.overflow === 'collapse';
  const collapse = useRef<ReturnType<typeof createCollapse> | null>(null);
  useEffect(() => {
    const row = chips.current;
    if (row === null || !collapsing) {
      setCollapsed(0);
      return;
    }
    const fieldMin = (unit: HTMLElement) =>
      unit.dataset['part'] === 'field'
        ? Number.parseFloat(getComputedStyle(unit).minInlineSize) || 0
        : undefined;
    const handle = createCollapse(row, {
      collapsible: (unit) => unit.dataset['part'] !== 'field',
      fixedSize: fieldMin,
      onChange: (units) => setCollapsed(units.length),
      trigger: () => count.current,
      units: () =>
        [...row.children].filter(
          (unit): unit is HTMLElement =>
            unit instanceof HTMLElement && !unit.hasAttribute('data-count'),
        ),
    });
    collapse.current = handle;
    return () => {
      handle.destroy();
      collapse.current = null;
    };
  }, [collapsing]);

  useLayoutEffect(() => {
    collapse.current?.refresh();
  }, [chosen, picker.version]);

  const describedBy = [describedByProp, field?.describedBy].filter(Boolean).join(' ');
  const inputId = id ?? field?.ids.control ?? picker.inputId;
  const pendingSingle =
    !multiple && chosen.length > 0 && picker.resolver.status(chosen[0]!) === 'pending';
  const busy = picker.search.indicator || pendingSingle;
  const showClear =
    picker.clearable &&
    !picker.disabled &&
    !picker.readOnly &&
    (chosen.length > 0 || picker.inputValue !== '');

  /* A picker searches names, and a proper name is a misspelling to a
     dictionary: the query and the chosen label carry no underline unless the
     consumer asks for one. */
  const input = (
    <input
      autoCorrect="off"
      spellCheck={false}
      {...nativeProps}
      aria-activedescendant={
        picker.open && picker.highlighted !== null ? picker.optionId(picker.highlighted) : undefined
      }
      aria-autocomplete="list"
      aria-busy={pendingSingle ? true : undefined}
      aria-controls={picker.open ? picker.contentId : undefined}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      aria-expanded={picker.open}
      aria-invalid={picker.invalid ? true : undefined}
      aria-label={ariaLabel}
      aria-readonly={picker.readOnly ? true : undefined}
      autoComplete="off"
      data-part="input"
      data-part-input=""
      disabled={picker.disabled}
      id={inputId}
      onBlur={compose(onBlur, handleBlur)}
      onChange={onChange}
      onClick={compose(onClick, handleClick)}
      onFocus={compose(onFocus, handleFocus)}
      onKeyDown={compose(onKeyDown, handleKey)}
      placeholder={placeholder}
      readOnly={picker.readOnly}
      ref={setInput}
      required={picker.required && chosen.length === 0}
      role="combobox"
      type="text"
      value={picker.inputValue}
    />
  );

  const chosenEntity =
    !multiple && chosen[0] !== undefined ? picker.cache.get(chosen[0]) : undefined;

  const rootProps: EntityPickerRootProps = {
    'data-overflow': picker.overflow,
    'data-part': 'root',
    ...selectorKeyProps('part', 'root'),
    'data-selection-mode': multiple ? 'multiple' : 'single',
    'data-size': picker.size,
    'data-ui': 'entity-picker',
    ...selectorKeyProps('ui', 'entity-picker'),
    'data-variant': picker.variant,
    ...(picker.fullWidth ? { 'data-full-width': '' } : {}),
    ...(picker.open ? { 'data-open': '' } : {}),
    ...(picker.disabled ? { 'data-disabled': '' } : {}),
    ...(picker.readOnly ? { 'data-readonly': '' } : {}),
    ...(picker.invalid ? { 'data-invalid': '' } : {}),
    ...(picker.required ? { 'data-required': '' } : {}),
    ...(busy ? { 'data-loading': '' } : {}),
    ...(picker.max !== null && chosen.length >= picker.max ? { 'data-complete': '' } : {}),
    ...(scopes !== undefined && scopes.length > 0
      ? {
          role: 'group',
          ...(field?.ids.label === undefined
            ? ariaLabel === undefined
              ? {}
              : { 'aria-label': ariaLabel }
            : { 'aria-labelledby': field.ids.label }),
        }
      : {}),
  };

  const chipLabel = t('chips', {
    label: ariaLabel ?? '',
    count: chosen.length,
  }).replace(/^, /, '');

  const children = (
    <>
      {scopes !== undefined && scopes.length > 0 ? (
        <div data-part="scope" data-part-scope="">
          <Select
            disabled={picker.disabled || picker.readOnly}
            items={scopes.map((scope) => ({ value: scope.id, label: scope.label }))}
            onValueChange={(next, request) =>
              picker.setScope(
                typeof next === 'string' ? next : null,
                request.reason === 'pointer' || request.reason === 'keyboard'
                  ? request.reason
                  : 'programmatic',
                request.source,
              )
            }
            size={picker.size}
            value={picker.scope}
            variant={picker.variant === 'plain' ? 'plain' : picker.variant}
          >
            <SelectTrigger aria-label={t('scope')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopes.map((scope) => (
                <SelectItem key={scope.id} value={scope.id}>
                  {scope.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div data-part="control" data-part-control="" ref={picker.setControlNode}>
        {!multiple &&
        chosenEntity !== undefined &&
        chosenEntity.avatar !== null &&
        picker.media === 'avatar' &&
        picker.inputValue === chosenEntity.label ? (
          <span aria-hidden="true" data-part="selection" data-part-selection="">
            <EntityFace entity={chosenEntity} locale={picker.locale} />
          </span>
        ) : null}
        {multiple ? (
          <div aria-label={chipLabel} data-part="values" data-part-values="" role="grid">
            <div data-part="chips" data-part-chips="" ref={chips} role="row">
              {chosen.map((chosenId) => (
                <Chip id={chosenId} key={chosenId} renderChip={renderChip} />
              ))}
              {collapsing ? (
                <span
                  aria-label={t('moreLabel', {
                    count: Math.max(collapsed, 1),
                  })}
                  data-count=""
                  data-part="root"
                  data-part-root=""
                  data-size="sm"
                  data-tone="secondary"
                  data-ui="tag"
                  data-ui-tag=""
                  data-variant="outline"
                  hidden
                  onClick={(event) => {
                    picker.setTyped('', event.nativeEvent);
                    picker.entry.current = 'keep';
                    picker.setOpen(true, 'pointer', event.nativeEvent);
                    picker.inputNode?.focus({ preventScroll: true });
                  }}
                  ref={count}
                  role="gridcell"
                  tabIndex={-1}
                >
                  <span data-part="body" data-part-body="">
                    <span data-part="label" data-part-label="">
                      {t('more', { count: Math.max(collapsed, 1) })}
                    </span>
                  </span>
                </span>
              ) : null}
              <span data-part="field" data-part-field="" role="gridcell">
                {input}
              </span>
            </div>
          </div>
        ) : (
          input
        )}
        {showClear ? (
          <button
            aria-label={t('clear')}
            data-part="clear"
            data-part-clear=""
            onClick={onClear}
            type="button"
          >
            <Icon>
              <Glyph name="x" />
            </Icon>
          </button>
        ) : null}
        <button
          aria-label={t('trigger')}
          data-part="trigger"
          data-part-trigger=""
          disabled={picker.disabled}
          onClick={toggle}
          tabIndex={-1}
          type="button"
        >
          {busy ? (
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
      </div>
      {name === undefined
        ? null
        : (chosen.length === 0 ? [''] : chosen).map((chosenId, index) => (
            <input
              aria-hidden="true"
              form={form}
              key={`${chosenId}-${index}`}
              name={name}
              readOnly
              required={index === 0 && picker.required}
              style={HIDDEN_INPUT}
              tabIndex={-1}
              type="text"
              value={chosenId}
            />
          ))}
    </>
  );

  if (render !== undefined) return render({ ...rootProps, children }) as ReactNode;
  return <div {...rootProps}>{children}</div>;
}

/**
 * One chosen record, as the `tag` it is. It is drawn from the cache, so a new
 * search never erases its name; while its id resolves it is a skeleton the
 * width of a short name, and an id the source never returned reads
 * "Unavailable" and stays removable.
 */
function Chip({
  id,
  renderChip,
}: {
  id: string;
  renderChip: ((entity: Entity) => ReactNode) | undefined;
}) {
  const picker = useEntityPicker();
  const { t } = picker;
  const entity = picker.cache.get(id);
  const status = picker.resolver.status(id);
  const pending = entity === undefined && status === 'pending';
  const missing = entity === undefined && status === 'missing';
  const frozen = picker.readOnly || picker.disabled;

  const name =
    entity !== undefined
      ? entityName(entity)
      : missing
        ? t('unresolvedChip', { id })
        : t('loadingChip', { id });
  const shown = entity?.label ?? (missing ? t('unresolved') : id);

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.defaultPrevented) return;
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (frozen) return;
        event.preventDefault();
        picker.remove(id, event.nativeEvent);
        return;
      case 'Escape':
        event.preventDefault();
        picker.inputNode?.focus({ preventScroll: true });
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          picker.inputNode?.focus({ preventScroll: true });
        }
    }
  };

  const onRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    picker.remove(id, event.nativeEvent);
    picker.inputNode?.focus({ preventScroll: true });
  };

  return (
    <span
      aria-busy={pending ? true : undefined}
      aria-label={name}
      data-part="root"
      data-part-root=""
      data-size="sm"
      data-tone="secondary"
      data-ui="tag"
      data-ui-tag=""
      data-value={id}
      data-variant={missing || pending ? 'outline' : 'soft'}
      onKeyDown={onKeyDown}
      role="gridcell"
      tabIndex={-1}
      {...(pending ? { 'data-loading': '' } : {})}
      {...(missing ? { 'data-unresolved': '' } : {})}
      {...(picker.disabled ? { 'data-disabled': '' } : {})}
    >
      <span data-part="body" data-part-body="">
        {picker.media === 'avatar' && entity?.avatar !== null ? (
          <span data-part="start" data-part-start="">
            {entity !== undefined ? (
              <EntityFace entity={entity} locale={picker.locale} />
            ) : pending ? (
              <span
                aria-hidden="true"
                data-loading=""
                data-part="root"
                data-part-root=""
                data-shape="circle"
                data-size="xs"
                data-ui="skeleton"
                data-ui-skeleton=""
              />
            ) : missing ? (
              <Icon>
                <Glyph name="circle-alert" />
              </Icon>
            ) : null}
          </span>
        ) : null}
        <span data-part="label" data-part-label="">
          {pending ? (
            <span
              aria-hidden="true"
              data-loading=""
              data-part="root"
              data-part-root=""
              data-shape="text"
              data-ui="skeleton"
              data-ui-skeleton=""
            />
          ) : entity !== undefined && renderChip !== undefined ? (
            renderChip(entity)
          ) : (
            shown
          )}
        </span>
      </span>
      {frozen ? null : (
        <button
          aria-label={t('remove', { label: entity?.label ?? shown })}
          data-part="remove"
          data-part-remove=""
          onClick={onRemove}
          tabIndex={-1}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      )}
    </span>
  );
}
