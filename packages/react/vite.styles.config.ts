import { mergeConfig } from 'vite';

import base from './vite.config';

/**
 * The all-in-one stylesheet, for an application with no bundler: the same
 * build with its CSS in one file, written apart and moved beside the split
 * build by `css.build.mjs`.
 */
export default mergeConfig(base, {
  build: { cssCodeSplit: false, emptyOutDir: true, manifest: false, outDir: 'dist-styles' },
});
