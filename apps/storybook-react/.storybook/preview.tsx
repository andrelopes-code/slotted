/**
 * The two generated stylesheets, and nothing built from source.
 *
 * `@slotted/react/styles.css` used to be imported here and must not be: it
 * resolves to `packages/react/dist`, a bundle of every family's CSS produced by
 * the last `pnpm --filter @slotted/react build`. The stories render components
 * from source, and each of those imports its own `@slotted/styles/*` sheet, so
 * the bundle added a second, older copy of every rule — and being loaded later
 * it won the cascade. A stylesheet fixed in source stayed broken on the page
 * until somebody remembered to rebuild a package the dev server does not need.
 * The Angular preview never imported its own bundle, which is why only this one
 * had the problem.
 *
 * The layer order still arrives first: `@slotted/theme/styles.css` begins with
 * the `@layer` statement, which is the only thing the bundle contributed that
 * the source files do not.
 */
import '@slotted/theme/styles.css';
/**
 * Every theme the toolbar offers is loaded here. Two themes are two disjoint
 * selector sets, so loading both costs nothing at render time and lets the
 * `data-slotted-theme` attribute switch between them without a reload. A theme
 * offered by the toolbar and missing from this list paints nothing at all.
 */
import '@slotted/themes/default.css';
import '@slotted/storybook-workbench/styles.css';

import './preview.css';

import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { SlottedProvider } from '@slotted/react/i18n';
import type { Preview } from '@storybook/react-vite';
import {
  GLOBAL_TYPES,
  INITIAL_GLOBALS,
  resolveWorkbenchGlobals,
} from '@slotted/storybook-workbench';

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
/** Every catalog the locale axis offers; English is the base and needs none. */
const CATALOGS = { 'pt-BR': PT_BR };

const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: INITIAL_GLOBALS,
  globalTypes: GLOBAL_TYPES,
  decorators: [
    (Story, context) => {
      const values = resolveWorkbenchGlobals(context?.globals);
      const scheme = normalizeScheme(values.scheme);
      applyRootScheme(document.documentElement, scheme);
      applyRootDirection(document.documentElement, values.direction);
      document.documentElement.lang = values.locale;
      const embedded = context?.viewMode === 'docs';
      const className = [
        'slotted-workbench-preview',
        embedded ? 'slotted-workbench-preview--embedded' : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div
          className={className}
          data-slotted-theme={values.theme}
          data-slotted-scheme={scheme}
          data-slotted-density={values.density}
          dir={values.direction}
          /**
           * A story on its own page fills the viewport; the same story inside a
           * reference page is one demonstration among nine. These two inline
           * values used to be unconditional, and they beat the `--embedded`
           * class that exists to undo them — so every demonstration on every
           * reference page was a screen tall with a component in the top
           * quarter of it, and the reader scrolled through grey to reach the
           * next one.
           */
          style={{
            ...getPreviewStyle(scheme),
            boxSizing: 'border-box',
            minHeight: embedded ? 0 : '100dvh',
            ...(embedded ? {} : { padding: 24 }),
          }}
        >
          <SlottedProvider locale={values.locale} catalogs={CATALOGS}>
            <Story />
          </SlottedProvider>
        </div>
      );
    },
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
