import '@slotted/theme/styles.css';
/**
 * Every theme the toolbar offers is loaded here. Two themes are two disjoint
 * selector sets, so loading both costs nothing at render time and lets the
 * `data-slotted-theme` attribute switch between them without a reload. A theme
 * offered by the toolbar and missing from this list paints nothing at all.
 */
import '@slotted/themes/default.css';

import './preview.css';

import { signal } from '@angular/core';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular-vite';
import type { Preview } from '@storybook/angular-vite';
import {
  GLOBAL_TYPES,
  INITIAL_GLOBALS,
  resolveWorkbenchGlobals,
} from '@slotted/storybook-workbench';
import '@slotted/storybook-workbench/styles.css';

import { SlottedDocsContainer } from './docs-container';
import { applyRootDirection, applyRootScheme, getPreviewStyle, normalizeScheme } from './theme';

/**
 * `autodocs` is what turns `parameters.docs.page` into a page. Without the tag
 * Storybook indexes the stories and no docs entry at all, so every reference
 * page this repository builds — the API tables, the anatomy, the captions and
 * the code beside each demonstration — was written, tested and never rendered.
 * Enabling it here rather than per family is what keeps the next family from
 * inheriting the same silence.
 */
/**
 * The locale axis, as a signal the application provider reads: setting it on a
 * change of the toolbar rewrites every family's words in place, the way an
 * application switching language does.
 */
const storyLocale = signal<string>(INITIAL_GLOBALS.locale);

const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: INITIAL_GLOBALS,
  globalTypes: GLOBAL_TYPES,
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div class="slotted-workbench-preview" [class.slotted-workbench-preview--embedded]="slottedEmbedded" [attr.data-slotted-theme]="slottedTheme" [attr.data-slotted-scheme]="slottedScheme" [attr.data-slotted-density]="slottedDensity" [attr.dir]="slottedDirection" [style.background]="slottedBackground" [style.color]="slottedColor" [style.color-scheme]="slottedColorScheme">${story}</div>`,
      (context) => {
        const values = resolveWorkbenchGlobals(context?.globals);
        const scheme = normalizeScheme(values.scheme);
        const previewStyle = getPreviewStyle(scheme);
        applyRootScheme(document.documentElement, scheme);
        applyRootDirection(document.documentElement, values.direction);
        document.documentElement.lang = values.locale;
        storyLocale.set(values.locale);

        return {
          slottedBackground: previewStyle.background,
          slottedColor: previewStyle.color,
          slottedColorScheme: previewStyle.colorScheme,
          slottedDensity: values.density,
          slottedDirection: values.direction,
          slottedEmbedded: context?.viewMode === 'docs',
          slottedScheme: scheme,
          slottedTheme: values.theme,
        };
      },
    ),
    applicationConfig({
      providers: [provideSlotted({ locale: storyLocale, catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  parameters: {
    a11y: { test: 'todo' },
    backgrounds: { disable: true },
    controls: { expanded: true },
    docs: { container: SlottedDocsContainer, source: { state: 'none' }, toc: true },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: [
          'Components',
          [
            'Button family',
            ['Overview', 'Button', 'ButtonLink', 'IconButton', 'ToggleButton', 'ButtonGroup'],
          ],
        ],
      },
    },
  },
};
export default preview;
