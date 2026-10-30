import { create } from 'storybook/theming/create';

import { WORKBENCH_FONT_CODE, WORKBENCH_FONT_SANS } from './fonts';

export const managerTheme = create({
  base: 'dark',
  brandTitle: 'Slotted Workbench',
  brandUrl: '/',
  brandTarget: '_self',
  colorPrimary: '#fafafa',
  colorSecondary: '#d4d4d8',
  appBg: '#09090b',
  appContentBg: '#f4f6f8',
  appPreviewBg: '#f4f6f8',
  appBorderColor: '#27272a',
  appBorderRadius: 6,
  textColor: '#fafafa',
  textInverseColor: '#18181b',
  barTextColor: '#a1a1aa',
  barSelectedColor: '#fafafa',
  barHoverColor: '#ffffff',
  barBg: '#111113',
  inputBg: '#18181b',
  inputBorder: '#3f3f46',
  inputTextColor: '#fafafa',
  inputBorderRadius: 5,
  fontBase: WORKBENCH_FONT_SANS,
  fontCode: WORKBENCH_FONT_CODE,
});
