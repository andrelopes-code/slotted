import { createContext, useContext } from 'react';

import type { MessageDefaults, MessageDefaultsProviderProps } from './message.types';

const FALLBACK: MessageDefaults = {
  layout: 'bubble',
  actionsVisibility: 'hover',
  variant: 'soft',
  tone: 'secondary',
};

const MessageDefaultsContext = createContext<MessageDefaults>(FALLBACK);

/** What a message renders as here, before its group or itself states anything. */
export function useMessageDefaults(): MessageDefaults {
  return useContext(MessageDefaultsContext);
}

/**
 * An application decides once how its messages are laid out, when their
 * actions show, and what a bubble paints when nothing infers it. A group, a
 * row or a bubble that states any of them still wins. Its words come from the
 * language in force (`SlottedProvider`).
 */
export function MessageDefaultsProvider({ children, ...defaults }: MessageDefaultsProviderProps) {
  const inherited = useMessageDefaults();

  return (
    <MessageDefaultsContext.Provider
      value={{
        layout: defaults.layout ?? inherited.layout,
        actionsVisibility: defaults.actionsVisibility ?? inherited.actionsVisibility,
        variant: defaults.variant ?? inherited.variant,
        tone: defaults.tone ?? inherited.tone,
      }}
    >
      {children}
    </MessageDefaultsContext.Provider>
  );
}
