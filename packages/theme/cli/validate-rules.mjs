import { transform } from 'lightningcss';

import { ruleErrors } from '../dist/index.js';

const at = (filename, loc) => `${filename}:${(loc?.line ?? 0) + 1}:${loc?.column ?? 0}`;

const policy = (css, filename) =>
  ruleErrors(css).map(
    ({ line, selector, message }) => `${filename}:${line} ${selector}: ${message}`,
  );

/**
 * The errors of one file of theme rules, each naming the file, the line and
 * the selector of the rule at fault. lightningcss reads the text first, so a
 * syntax error is reported with its column; what a rule may select and read
 * is `ruleErrors`, the check `defineTheme` runs on every rule at runtime.
 *
 * Some text the policy refuses is also text lightningcss cannot parse — a
 * declaration outside a style rule is one. There the policy's message wins,
 * so the build and `defineTheme` refuse it in the same words; the syntax
 * error stands only where the policy has nothing to say.
 */
export function validateRules(css, filename) {
  try {
    transform({ filename, code: Buffer.from(css), errorRecovery: false });
  } catch (error) {
    let refused;
    try {
      refused = policy(css, filename);
    } catch {
      refused = [];
    }
    return refused.length > 0 ? refused : [`${at(filename, error.loc)} ${error.message}`];
  }
  return policy(css, filename);
}
