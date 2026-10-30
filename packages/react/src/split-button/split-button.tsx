import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/split-button/split-button.css';

import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useState } from 'react';

import { ButtonDefaultsProvider, useButtonDefaults } from '../button/button-defaults';
import { useSplitButtonDefaults } from './split-button-defaults';
import type {
  SplitButtonContextValue,
  SplitButtonProps,
  SplitButtonRootProps,
  SplitButtonValueReason,
} from './split-button.types';

const SplitButtonContext = createContext<SplitButtonContextValue | null>(null);

export function useSplitButton(): SplitButtonContextValue {
  const context = useContext(SplitButtonContext);
  if (context === null) {
    throw new Error('A split button part has to be inside a SplitButton.');
  }
  return context;
}

/**
 * An action and the menu of its alternatives, joined into one shape.
 *
 * The root is a `group` of two `button`s: the primary, `button`'s Button, and
 * the menu trigger, `button`'s IconButton rendered as `menu`'s trigger. Each
 * keeps its role, its state and its own tab stop — every surveyed split
 * button gives the pair two — and the root hands them one appearance through
 * `button`'s own defaults, the mechanism `button-group` uses. The menu is
 * `menu` unchanged: `MenuContent` and its items are imported from there.
 *
 * `remember` is the one decision the family adds. Off, the alternatives are
 * actions. On, the items inside `SplitButtonChoices` are radio items bound to
 * `value`, and the consumer renders the primary's label from that value — the
 * merge button whose strategy a repository remembers. A silent update was
 * refused because it changes what the next click does.
 */
export function SplitButton({
  children,
  defaultValue,
  disabled = false,
  fullWidth = false,
  loading = false,
  onValueChange,
  remember = false,
  render,
  size,
  tone,
  value,
  variant,
  ...nativeProps
}: SplitButtonProps) {
  const defaults = useSplitButtonDefaults();
  const inherited = useButtonDefaults();

  /* Resolution: the prop, the family's defaults, `button`'s defaults, then
     the contract's. `button` is consulted because an application that paints
     every action at once has already said what a primary action looks like. */
  const resolved = {
    size: size ?? defaults.size ?? inherited.size ?? 'md',
    tone: tone ?? defaults.tone ?? inherited.tone ?? 'accent',
    variant: variant ?? defaults.variant ?? inherited.variant ?? 'solid',
  } as const;

  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const state = createControllable<string | undefined>({
    controlled: value,
    initial: own,
    onRequest: (request) => onValueChange?.(request.value as string, request as never),
  });

  const context: SplitButtonContextValue = {
    disabled,
    loading,
    remember,
    select: (next: string, reason: SplitButtonValueReason, source: unknown) => {
      if (state.request(next, reason, source)) setOwn(next);
    },
    value: remember ? state.value : undefined,
  };

  const rootProps: SplitButtonRootProps = keyedProps({
    role: 'group',
    ...nativeProps,
    children: (
      <SplitButtonContext.Provider value={context}>
        <ButtonDefaultsProvider
          size={resolved.size}
          tone={resolved.tone}
          variant={resolved.variant}
        >
          {children}
        </ButtonDefaultsProvider>
      </SplitButtonContext.Provider>
    ),
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(fullWidth ? { 'data-full-width': '' } : {}),
    ...(loading ? { 'data-loading': '' } : {}),
    'data-part': 'root',
    'data-size': resolved.size,
    'data-tone': resolved.tone,
    'data-ui': 'split-button',
    'data-variant': resolved.variant,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
