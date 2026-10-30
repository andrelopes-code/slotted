import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';

import { addons } from 'storybook/manager-api';

import { managerTheme } from './manager-theme';

export function configureSlottedManager() {
  addons.setConfig({
    theme: managerTheme,
    sidebar: { showRoots: true },
    toolbar: { title: { hidden: true } },
  });
}
