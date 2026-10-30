import { createContext, useContext } from 'react';

import type { AppShellDefaults, AppShellDefaultsProviderProps } from './app-shell.types';

const FALLBACK: AppShellDefaults = {
  asideMode: 'auto',
  asideSize: 'md',
  canvas: 'inset',
  closeOnNavigate: true,
  collapsedTo: 'rail',
  escape: 'close',
  back: 'close',
  modal: true,
  navMode: 'auto',
  navSide: 'start',
  navSize: 'md',
  outsidePress: 'close',
  primary: 'banner',
  scroll: 'content',
  separation: 'rule',
};

const AppShellDefaultsContext = createContext<AppShellDefaults>(FALLBACK);

/** What a shell renders as here, before it states anything of its own. */
export function useAppShellDefaults(): AppShellDefaults {
  return useContext(AppShellDefaultsContext);
}

/**
 * An application decides once how its shell is arranged — which region reaches
 * the corner, which plane the content sits on, how the navigation behaves when
 * the space runs out — rather than repeating the same props on every route. A
 * shell that states any of them itself still wins. Its words come from the
 * language in force (`SlottedProvider`).
 */
export function AppShellDefaultsProvider({ children, ...defaults }: AppShellDefaultsProviderProps) {
  const inherited = useAppShellDefaults();

  return (
    <AppShellDefaultsContext.Provider
      value={{
        asideMode: defaults.asideMode ?? inherited.asideMode,
        asideSize: defaults.asideSize ?? inherited.asideSize,
        canvas: defaults.canvas ?? inherited.canvas,
        closeOnNavigate: defaults.closeOnNavigate ?? inherited.closeOnNavigate,
        collapsedTo: defaults.collapsedTo ?? inherited.collapsedTo,
        escape: defaults.escape ?? inherited.escape,
        back: defaults.back ?? inherited.back,
        modal: defaults.modal ?? inherited.modal,
        navMode: defaults.navMode ?? inherited.navMode,
        navSide: defaults.navSide ?? inherited.navSide,
        navSize: defaults.navSize ?? inherited.navSize,
        outsidePress: defaults.outsidePress ?? inherited.outsidePress,
        primary: defaults.primary ?? inherited.primary,
        scroll: defaults.scroll ?? inherited.scroll,
        separation: defaults.separation ?? inherited.separation,
      }}
    >
      {children}
    </AppShellDefaultsContext.Provider>
  );
}
