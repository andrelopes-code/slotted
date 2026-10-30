import type { ThemeVars } from 'storybook/theming';

import {
  applyRootScheme,
  getStorybookTheme,
  readSchemeFromSearch,
  subscribeToScheme,
  type SchemeRoot,
} from './theme';

type SchemeChannel = Parameters<typeof subscribeToScheme>[0];

type ManagerThemeApi = {
  ready: () => Promise<SchemeChannel>;
  setConfig: (config: { theme: ThemeVars }) => unknown;
};

export const registerManagerTheme = async (
  manager: ManagerThemeApi,
  root: SchemeRoot,
  search = '',
) => {
  const channel = await manager.ready();

  return subscribeToScheme(channel, readSchemeFromSearch(search), (scheme) => {
    manager.setConfig({ theme: getStorybookTheme(scheme) });
    applyRootScheme(root, scheme);
  });
};
