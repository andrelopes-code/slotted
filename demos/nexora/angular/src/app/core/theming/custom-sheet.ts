import { InjectionToken, signal } from '@angular/core';
import type { Theme } from '@slotted/theme';

import type { Customization } from './customization';

/** What a compile of a customization needs from `custom-theme.ts`, which is loaded by `import()`. */
export type CustomThemeModule = Pick<typeof import('./custom-theme'), 'applyCustomTheme'>;

/** Where the store's builder sheets load the builder from: `custom-theme.ts`, by `import()`. */
export const CUSTOM_THEME_LOADER = new InjectionToken<() => Promise<CustomThemeModule>>(
  'CUSTOM_THEME_LOADER',
  { providedIn: 'root', factory: () => () => import('./custom-theme') },
);

/**
 * One builder sheet on the page, under one name: the saved customization that
 * `html` names, or the candidate the preferences page is editing. A request
 * is compiled after `delay` ms in which no other request arrived, so a burst
 * of changes — a slider dragged across its range — compiles once, with its
 * last value. A request for what is already on the page compiles nothing.
 * The compile replaces the sheet in place (`applyTheme`), so the name never
 * goes without one once it has had one. A compile that fails — the module
 * does not load, or the theme does not compile — leaves the sheet as it was
 * and says so in `failed` until `retry` or the next request compiles.
 */
export class CustomSheet {
  /** The theme on the page and what it was compiled from; `null` before the first compile. */
  readonly compiled = signal<{ readonly signature: string; readonly theme: Theme } | null>(null);
  /** The last compile asked for did not happen. */
  readonly failed = signal(false);

  private timer: ReturnType<typeof setTimeout> | undefined;
  private wanted: string | null = null;
  private last: { readonly theme: string; readonly customization: Customization } | null = null;
  private dispose: (() => void) | null = null;
  private ended = false;

  constructor(
    readonly name: string,
    private readonly document: Document,
    private readonly delay: number,
    private readonly load: () => Promise<CustomThemeModule> = () => import('./custom-theme'),
  ) {}

  /** The key a customization of a theme compiles under. */
  static signature(theme: string, customization: Customization): string {
    return JSON.stringify([theme, customization]);
  }

  /** Asks for `customization` of `theme`; the latest request within `delay` is the one compiled. */
  request(theme: string, customization: Customization): void {
    const signature = CustomSheet.signature(theme, customization);
    if (signature !== this.wanted) this.failed.set(false);
    this.wanted = signature;
    this.last = { theme, customization };
    clearTimeout(this.timer);
    if (signature === this.compiled()?.signature) return;
    this.timer = setTimeout(() => this.compile(theme, customization, signature), this.delay);
  }

  /** Compiles the last request again after a failure; nothing when it did not fail. */
  retry(): void {
    if (!this.failed() || this.last === null) return;
    this.failed.set(false);
    const { theme, customization } = this.last;
    this.compile(theme, customization, CustomSheet.signature(theme, customization));
  }

  private compile(theme: string, customization: Customization, signature: string): void {
    const current = () => !this.ended && this.wanted === signature;
    this.load().then(
      ({ applyCustomTheme }) => {
        if (!current()) return;
        try {
          const applied = applyCustomTheme(theme, customization, this.name, this.document);
          this.dispose = applied.dispose;
          this.compiled.set({ signature, theme: applied.theme });
        } catch {
          this.failed.set(true);
        }
      },
      () => {
        if (current()) this.failed.set(true);
      },
    );
  }

  /** The compiled theme when it was compiled over `theme`, else `null`; a signal read. */
  themeOver(theme: string): Theme | null {
    const compiled = this.compiled();
    return compiled !== null && (JSON.parse(compiled.signature) as [string])[0] === theme
      ? compiled.theme
      : null;
  }

  /**
   * Drops any pending request and stops naming what is on the page: the
   * next customization shows nothing older than itself. The sheet stays, to
   * be replaced in place by the next compile.
   */
  forget(): void {
    clearTimeout(this.timer);
    this.wanted = null;
    this.last = null;
    this.compiled.set(null);
    this.failed.set(false);
  }

  /** Whether `customization` of `theme` is the request pending or compiled. */
  wants(theme: string, customization: Customization): boolean {
    return this.wanted === CustomSheet.signature(theme, customization);
  }

  /** Whether the sheet on the page is the one `customization` of `theme` compiles to. */
  holds(theme: string, customization: Customization): boolean {
    return this.compiled()?.signature === CustomSheet.signature(theme, customization);
  }

  /** Stops a pending compile and removes the sheet. */
  end(): void {
    this.ended = true;
    clearTimeout(this.timer);
    this.dispose?.();
  }
}
