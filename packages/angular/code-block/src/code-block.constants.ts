import { InjectionToken, inject } from '@angular/core';
import type { CodeHighlighter, CodeMark } from '@slotted/core/code';

export type CodeBlockWrapReason = 'pointer' | 'keyboard' | 'programmatic';
export type CodeBlockRevealedReason = 'pointer' | 'keyboard' | 'escape' | 'programmatic';
export type { CodeMark };

export interface CodeBlockCopyRequest {
  readonly value: string;
  readonly reason: 'pointer' | 'keyboard';
  readonly copied: boolean;
  readonly source?: Event | undefined;
}

export interface CodeBlockDefaults {
  highlight?: CodeHighlighter;
  lineNumbers?: boolean;
  copy?: boolean;
}

export const CODE_BLOCK_DEFAULTS_TOKEN = new InjectionToken<CodeBlockDefaults>(
  'slotted code-block defaults',
  { providedIn: 'root', factory: (): CodeBlockDefaults => ({}) },
);

/**
 * An application that has loaded an engine once hands it to every block here,
 * along with whether blocks number their lines and carry a copy control. A
 * block that states any of those itself still wins. Its words come from the
 * language in force (`provideSlotted`).
 */
export function provideCodeBlockDefaults(defaults: CodeBlockDefaults) {
  return { provide: CODE_BLOCK_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectCodeBlockDefaults(): CodeBlockDefaults {
  return inject(CODE_BLOCK_DEFAULTS_TOKEN);
}
