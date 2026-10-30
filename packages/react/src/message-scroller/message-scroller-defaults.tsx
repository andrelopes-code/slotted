import { createContext, useContext } from 'react';

import type {
  MessageScrollerDefaults,
  MessageScrollerDefaultsProviderProps,
} from './message-scroller.types';

const FALLBACK: MessageScrollerDefaults = {
  follow: false,
  defaultPosition: 'last-anchor',
  peek: 64,
  scrollMargin: 0,
};

const DefaultsContext = createContext<MessageScrollerDefaults>(FALLBACK);

export function useMessageScrollerDefaults(): MessageScrollerDefaults {
  return useContext(DefaultsContext);
}

/**
 * An application decides once whether its conversations follow a reply,
 * where a saved one opens, and how much of the previous turn stays in view.
 * A scroller that states any of them wins. Its words come from the language in
 * force (`SlottedProvider`).
 */
export function MessageScrollerDefaultsProvider({
  children,
  ...defaults
}: MessageScrollerDefaultsProviderProps) {
  const inherited = useMessageScrollerDefaults();
  return (
    <DefaultsContext.Provider
      value={{
        follow: defaults.follow ?? inherited.follow,
        defaultPosition: defaults.defaultPosition ?? inherited.defaultPosition,
        peek: defaults.peek ?? inherited.peek,
        scrollMargin: defaults.scrollMargin ?? inherited.scrollMargin,
      }}
    >
      {children}
    </DefaultsContext.Provider>
  );
}
