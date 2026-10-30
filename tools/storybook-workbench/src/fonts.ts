/**
 * The two stacks the workbench sets type in, in one place. Storybook takes
 * them as `fontBase` and `fontCode` on three themes; `workbench.css` mirrors
 * them into `--slotted-workbench-font-sans` and `--slotted-workbench-font-code`,
 * and `workbench.styles.test.mjs` holds the two copies to the same string.
 *
 * `ui-monospace` is absent on purpose. On Linux Chrome the keyword resolves to
 * the platform's default proportional face rather than falling through to the
 * next family, so a stack that names it before a real monospaced font sets code
 * in a proportional one and reports a monospaced `font-family` while doing it.
 * Concrete families answer for each platform, and the generic keyword is last.
 */
export const WORKBENCH_FONT_SANS = '"Geist Variable", Geist, ui-sans-serif, system-ui, sans-serif';

export const WORKBENCH_FONT_CODE =
  '"Geist Mono Variable", "Geist Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
