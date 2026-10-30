import { InjectionToken, inject } from '@angular/core';
import type { TemplateRef } from '@angular/core';

/**
 * What a trail does with crumbs its width cannot hold. `collapse` folds the
 * middle ones into the ellipsis; `wrap` lets the row break onto a second line
 * and only the count collapses.
 */
export type BreadcrumbOverflow = 'collapse' | 'wrap';

/** Why the trail expanded. Only two things can ask: a press and a key. */
export type BreadcrumbExpandReason = 'pointer' | 'keyboard';

/**
 * What every trail on the page does before it states anything of its own. The
 * three collapse numbers are here because how deep a trail may get before it
 * folds is a decision about the application rather than about one page.
 */
export interface BreadcrumbDefaults {
  itemsAfterCollapse?: number;
  itemsBeforeCollapse?: number;
  maxItems?: number;
  overflow?: BreadcrumbOverflow;
  /** The mark drawn between two crumbs, rendered once per item. */
  separator?: TemplateRef<unknown>;
}

export const BREADCRUMB_DEFAULT_MAX_ITEMS = 8;
export const BREADCRUMB_DEFAULT_ITEMS_BEFORE = 1;
export const BREADCRUMB_DEFAULT_ITEMS_AFTER = 2;
export const BREADCRUMB_DEFAULT_OVERFLOW: BreadcrumbOverflow = 'collapse';

export const BREADCRUMB_DEFAULTS_TOKEN = new InjectionToken<BreadcrumbDefaults>(
  'slotted breadcrumb defaults',
  { providedIn: 'root', factory: (): BreadcrumbDefaults => ({}) },
);

/**
 * An application decides once how deep its trails may get before they fold,
 * whether they fold for want of width, and what is drawn between two crumbs. A
 * trail that states any of those itself still wins: an explicit input is never
 * overridden by the token. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideBreadcrumbDefaults(defaults: BreadcrumbDefaults) {
  return { provide: BREADCRUMB_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectBreadcrumbDefaults(): BreadcrumbDefaults {
  return inject(BREADCRUMB_DEFAULTS_TOKEN);
}

/**
 * Which crumbs survive a collapse, as indices into the trail. Shared with the
 * React binding's own copy through the tests that assert the same table, and
 * deliberately not shared through `@slotted/core`: it is four lines, and a core
 * module exists for arithmetic two bindings would otherwise get *differently*
 * wrong, not for arithmetic they would each get right.
 */
export function collapsedRange(count: number, before: number, after: number) {
  const kept = Math.max(0, before) + Math.max(0, after);
  if (count <= kept) return undefined;
  return { start: Math.max(0, before), end: count - Math.max(0, after) };
}
