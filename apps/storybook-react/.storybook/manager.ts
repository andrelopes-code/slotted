import { configureSlottedManager } from '@slotted/storybook-workbench/manager';
import { addons } from 'storybook/manager-api';

import { registerManagerTheme } from './manager-theme';

configureSlottedManager();
void registerManagerTheme(addons, document.documentElement);
