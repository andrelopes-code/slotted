import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import { addons } from 'storybook/manager-api';

import { managerTheme } from './manager-theme';

export function configureSlottedManager() {
  addons.setConfig({
    theme: managerTheme,
    sidebar: { showRoots: true },
    toolbar: { title: { hidden: true } },
  });
}
