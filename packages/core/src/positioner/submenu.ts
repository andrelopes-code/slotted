/**
 * Where a submenu sits beside the item that opened it.
 *
 * The anchor of a submenu is the item, and the item is inset from the parent
 * surface's edge by that surface's padding and border. Placed at the item's
 * edge, the submenu's panel lands on the parent's padding and reads as glued
 * to it; placed at the parent's edge, the layer's own gap separates the two
 * surfaces. Along the block axis the submenu's first item sits below the
 * layer's top by the submenu surface's own border and padding, and a submenu
 * whose first item lines up with the item that opened it reads as a
 * continuation of it rather than as a list that starts under it.
 *
 * Both distances are read from the surfaces rather than from tokens, so the
 * theme owns them: a denser inset moves the submenu with it.
 */
export interface SubmenuOffsets {
  /** Added to the side offset: the parent surface's inset around its items. */
  sideOffset: number;
  /** Added to the align offset: the submenu surface's inset above its first item, negated. */
  alignOffset: number;
}

export interface SubmenuGeometry {
  /** The parent's painted surface, or nothing when there is no parent. */
  parentSurface: Element | null;
  /** The item that opens the submenu. */
  item: Element;
  /** The submenu's own painted surface. */
  surface: Element;
}

export function submenuOffsets({ parentSurface, item, surface }: SubmenuGeometry): SubmenuOffsets {
  const inset =
    parentSurface === null
      ? 0
      : Math.max(
          0,
          (parentSurface.getBoundingClientRect().width - item.getBoundingClientRect().width) / 2,
        );
  const first = surface.querySelector("[data-part='item']");
  const lead =
    first === null
      ? 0
      : Math.max(0, first.getBoundingClientRect().top - surface.getBoundingClientRect().top);
  return { sideOffset: inset, alignOffset: lead === 0 ? 0 : -lead };
}
