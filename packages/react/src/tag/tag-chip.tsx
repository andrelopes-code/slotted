import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/tag/tag.css';

import { tagMessages } from '@slotted/core/i18n';
import { createContext, useContext } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, SyntheticEvent } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useTagDefaults } from './tag-defaults';
import type {
  TagAppearanceProps,
  TagRemovableProps,
  TagRemoveReason,
  TagRemoveRequest,
  TagRootPassthrough,
  TagRootProps,
  TagShape,
  TagSize,
  TagTone,
  TagVariant,
} from './tag.types';

/**
 * Every control a group's keyboard moves between, in the order the DOM holds
 * them: a chip's own control, then its remove control, then the next chip's.
 * Read literally from the APG Toolbar pattern, which needs no second axis to
 * reach a control inside an item.
 */
export const TAG_CONTROL_SELECTOR = '[data-part="body"]:is(a, button), [data-part="remove"]';

/**
 * The role a group gives the chips inside it. A toolbar's items are its
 * controls, so a chip in one carries no role of its own; a list's items are
 * its chips, so a chip in one is a `listitem`. The group is the only thing
 * that knows which it is, and a consumer's own `role` still wins over both.
 */
const TagItemRoleContext = createContext<string | undefined>(undefined);

export function TagItemRoleProvider({
  children,
  role,
}: {
  children: ReactNode;
  role: string | undefined;
}) {
  return <TagItemRoleContext.Provider value={role}>{children}</TagItemRoleContext.Provider>;
}

export function useTagItemRole(): string | undefined {
  return useContext(TagItemRoleContext);
}

export interface ResolvedAppearance {
  shape: TagShape;
  size: TagSize;
  tone: TagTone;
  variant: TagVariant;
}

/**
 * An explicit prop wins over the provider, and the provider over the family's
 * own default. The three are read in that order rather than merged.
 */
export function useAppearance(props: TagAppearanceProps): ResolvedAppearance {
  const provided = useTagDefaults();

  return {
    tone: props.tone ?? provided.tone,
    variant: props.variant ?? provided.variant,
    size: props.size ?? provided.size,
    shape: props.shape ?? provided.shape,
  };
}

/**
 * The public identity of the chip box: one family identifier, one root part,
 * the axes a consumer may select on, and the two states that are attributes.
 * Class names and the shape of the tree below this element are not contract.
 */
export function rootData(
  appearance: ResolvedAppearance,
  state: { disabled?: boolean | undefined; selected?: boolean | undefined },
) {
  return {
    'data-ui': 'tag',
    ...selectorKeyProps('ui', 'tag'),
    'data-part': 'root',
    ...selectorKeyProps('part', 'root'),
    'data-tone': appearance.tone,
    'data-variant': appearance.variant,
    'data-size': appearance.size,
    'data-shape': appearance.shape,
    'data-disabled': state.disabled ? '' : undefined,
    'data-selected': state.selected ? '' : undefined,
  } as const;
}

function createRequest(reason: TagRemoveReason, source: SyntheticEvent): TagRemoveRequest {
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

export interface Removal {
  /** Whether the chip renders a remove control at all. */
  removable: boolean;
  /** The control's own disabled state, which the chip's own also forces. */
  removeDisabled: boolean;
  /** The word announced before the tag's own label, in the language in force. */
  removeLabel: string;
  request: (reason: TagRemoveReason, source: SyntheticEvent) => void;
}

export function useRemoval(props: TagRemovableProps & { disabled?: boolean }): Removal {
  const t = useMessages(tagMessages, props.messages);
  const disabled = props.disabled === true;
  const removeDisabled = disabled || props.removeDisabled === true;

  return {
    removable: props.onRemove !== undefined,
    removeDisabled,
    removeLabel: t('remove'),
    request(reason, source) {
      if (removeDisabled) return;
      props.onRemove?.(createRequest(reason, source));
    },
  };
}

/**
 * `Backspace` and `Delete` on a removable chip, which is the shortcut MUI,
 * Primer, React Aria and Angular Material all ship — Primer goes as far as
 * announcing it in a visually hidden sentence beside the value.
 *
 * It is bound to the chip box rather than to either control, so it answers
 * wherever focus is inside the chip, and a consumer's own handler on the
 * control runs first and can refuse it by stopping propagation.
 *
 * A held key repeats, and a repeat would remove the chip that focus has just
 * landed on. The default is prevented because `Backspace` still navigates back
 * in some browsers when nothing is being edited.
 */
export function removalKeydown(removal: Removal) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (!removal.removable || removal.removeDisabled) return;
    if (event.repeat || event.defaultPrevented) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;

    event.preventDefault();
    removal.request('keyboard', event);
  };
}

interface TagContentOptions {
  children?: ReactNode | undefined;
  end?: ReactNode | undefined;
  /** The selection mark, on the one member that holds a selection. */
  indicator?: ReactNode | undefined;
  labelId: string;
  start?: ReactNode | undefined;
}

/**
 * What goes inside the body, in reading order. The words get a box of their
 * own — it is what `text-box` needs to trim the line to the cap and the
 * baseline, what `text-overflow` needs to clip a long value, and what
 * `aria-labelledby` on the remove control points at so it announces the value
 * rather than the word "Remove" on its own.
 */
export function TagContent({ children, end, indicator, labelId, start }: TagContentOptions) {
  return (
    <>
      {indicator}
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
        </span>
      )}
      <span data-part="label" data-part-label="" id={labelId}>
        {children}
      </span>
      {end === undefined ? null : (
        <span data-part="end" data-part-end="">
          {end}
        </span>
      )}
    </>
  );
}

interface TagRemoveOptions {
  labelId: string;
  removal: Removal;
  wordId: string;
}

/**
 * The control at the end of the chip. Its name is composed rather than
 * repeated: the hidden word and the tag's own label are joined by
 * `aria-labelledby`, so it announces "Remove Design" without the consumer
 * writing the value a second time — the string four of the surveyed
 * implementations make the consumer keep in step with the value by hand.
 *
 * Text referenced by `aria-labelledby` counts even when the element holding it
 * is hidden, which is what lets the word cost no space.
 */
export function TagRemove({ labelId, removal, wordId }: TagRemoveOptions) {
  return (
    <button
      aria-labelledby={`${wordId} ${labelId}`}
      data-part="remove"
      data-part-remove=""
      disabled={removal.removeDisabled}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        /* The X is its own target. A handler the consumer put on the chip is
           about the chip, and a removal is not a press of it. */
        event.stopPropagation();
        removal.request('remove', event);
      }}
      type="button"
    >
      <Icon>
        <Glyph name="x" />
      </Icon>
      <span hidden id={wordId}>
        {removal.removeLabel}
      </span>
    </button>
  );
}

interface TagFrameOptions {
  appearance: ResolvedAppearance;
  /** The body and, when there is one, the remove control. */
  children: ReactNode;
  disabled?: boolean | undefined;
  removal: Removal;
  render?: ((props: TagRootProps) => ReactNode) | undefined;
  rootProps?: TagRootPassthrough | undefined;
  selected?: boolean | undefined;
}

/**
 * The chip box. It is never the interactive element: a `button` cannot contain
 * a `button` and an `a` cannot contain either, so a chip that both acts and
 * removes has to put its two controls side by side.
 */
export function TagFrame({
  appearance,
  children,
  disabled,
  removal,
  render,
  rootProps,
  selected,
}: TagFrameOptions) {
  const itemRole = useTagItemRole();
  const props: TagRootProps = keyedProps({
    ...rootProps,
    ...rootData(appearance, { disabled: disabled === true, selected }),
    children,
    ...(rootProps?.role === undefined && itemRole !== undefined ? { role: itemRole } : {}),
    onKeyDown: (event) => {
      rootProps?.onKeyDown?.(event);
      removalKeydown(removal)(event);
    },
  });

  return render === undefined ? <span {...props} /> : render(props);
}
