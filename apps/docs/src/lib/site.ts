/** The product name is provisional (PRODUCT.md): it is written here and nowhere else. */
export const SITE_NAME = 'Slotted';

/** The address of a site path: Astro prefixes its assets with `base`, and no written link. */
export const sitePath = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
