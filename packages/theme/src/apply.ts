import type { Theme } from './define';
import { renderTheme } from './render';

/** Dispatched on the document when a theme stylesheet is applied or removed. */
export const THEME_CHANGE_EVENT = 'slotted-themechange';

export interface ThemeChangeDetail {
  readonly name: string;
  readonly applied: boolean;
}

/**
 * Which call most recently wrote a theme's sheet. Two live `applyTheme` calls
 * for the same name share the sheet — a second call updates it in place
 * rather than creating another one — so a disposer must not act on its
 * sheet's mere presence: that would let the first call's disposer remove a
 * sheet the second call still owns, after the first unmounts later than the
 * second re-applied. A disposer acts only when its own token is still the
 * sheet's current one.
 */
const OWNER = new WeakMap<CSSStyleSheet | HTMLStyleElement, symbol>();

/** The constructed sheet of each theme name, per document. */
const ADOPTED = new WeakMap<Document, Map<string, CSSStyleSheet>>();

export interface ApplyThemeOptions {
  readonly document?: Document;
  /**
   * The nonce a `style-src` policy allows, written on the `<style>` element.
   * Read only where the document has no constructed stylesheets.
   */
  readonly nonce?: string;
}

/**
 * Puts a theme on the page without a build: one sheet per theme name,
 * replaced in place when the same name is applied again. The sheet is a
 * constructed stylesheet in `adoptedStyleSheets`, which a `style-src`
 * without 'unsafe-inline' does not refuse; a document without constructed
 * stylesheets gets a `<style>` in the head, carrying `nonce` when given. The
 * returned function removes the sheet, but only while its call is still the
 * latest one to have applied that name; a call a later one has superseded
 * disposes to a no-op, as does calling the same disposer more than once.
 */
export function applyTheme(theme: Theme, options: ApplyThemeOptions = {}): () => void {
  const doc = options.document ?? globalThis.document;
  if (!doc) throw new Error(`${theme.name}: applyTheme needs a document`);
  const css = renderTheme(theme);
  const sheet = adoptsSheets(doc)
    ? adoptSheet(doc, theme.name, css)
    : writeStyleElement(doc, theme.name, css, options.nonce);

  const token = Symbol('slotted-theme-sheet-owner');
  OWNER.set(sheet, token);

  const announce = (applied: boolean) =>
    doc.dispatchEvent(
      new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, {
        detail: { name: theme.name, applied },
      }),
    );
  announce(true);

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    if (OWNER.get(sheet) !== token) return;
    OWNER.delete(sheet);
    if (!removeSheet(doc, theme.name, sheet)) return;
    announce(false);
  };
}

function adoptsSheets(doc: Document): boolean {
  return (
    Array.isArray(doc.adoptedStyleSheets) &&
    typeof doc.defaultView?.CSSStyleSheet.prototype.replaceSync === 'function'
  );
}

function adoptSheet(doc: Document, name: string, css: string): CSSStyleSheet {
  let sheets = ADOPTED.get(doc);
  if (!sheets) {
    sheets = new Map();
    ADOPTED.set(doc, sheets);
  }

  // A sheet adopts only into the document of the realm that constructed it.
  let sheet = sheets.get(name);
  if (!sheet) {
    sheet = new doc.defaultView!.CSSStyleSheet();
    sheets.set(name, sheet);
  }

  sheet.replaceSync(css);
  if (!doc.adoptedStyleSheets.includes(sheet))
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];

  return sheet;
}

function writeStyleElement(
  doc: Document,
  name: string,
  css: string,
  nonce: string | undefined,
): HTMLStyleElement {
  let element = doc.head.querySelector<HTMLStyleElement>(
    `style[data-slotted-theme-sheet="${name}"]`,
  );
  if (!element) {
    element = doc.createElement('style');
    element.setAttribute('data-slotted-theme-sheet', name);
    if (nonce !== undefined) element.nonce = nonce;
    doc.head.append(element);
  }

  if (element.textContent !== css) element.textContent = css;

  return element;
}

/** Takes the sheet off the page; false when something else already had. */
function removeSheet(
  doc: Document,
  name: string,
  sheet: CSSStyleSheet | HTMLStyleElement,
): boolean {
  if (!(sheet instanceof doc.defaultView!.CSSStyleSheet)) {
    if (!sheet.isConnected) return false;
    sheet.remove();
    return true;
  }

  ADOPTED.get(doc)?.delete(name);
  if (!doc.adoptedStyleSheets.includes(sheet)) return false;
  doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((entry) => entry !== sheet);

  return true;
}
