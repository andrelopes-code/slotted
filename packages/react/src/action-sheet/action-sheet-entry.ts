export const ITEM_SELECTOR = "[data-part='item']";

export const items = (list: HTMLElement | null) =>
  list === null ? [] : [...list.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];

export const operable = (item: HTMLElement) =>
  item.dataset['disabled'] === undefined && item.dataset['loading'] === undefined;

/**
 * Where focus enters, from the dialog pattern's first note: the first action
 * that can run, unless it is destructive, in which case the least destructive
 * action — the cancel, or the first action that is not `danger`, or the panel.
 */
export function entryTarget(panel: HTMLElement): HTMLElement {
  const list = panel.querySelector<HTMLElement>("[data-part='list']");
  const enabled = items(list).filter(operable);
  const first = enabled[0];
  if (first !== undefined && first.dataset['tone'] !== 'danger') return first;
  const cancel = panel.querySelector<HTMLElement>("[data-part='cancel']");
  if (cancel !== null) return cancel;
  return enabled.find((item) => item.dataset['tone'] !== 'danger') ?? panel;
}
