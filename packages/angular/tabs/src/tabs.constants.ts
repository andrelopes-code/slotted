export const TABS_ORIENTATIONS = ['horizontal', 'vertical'] as const;
export const TABS_ACTIVATION = ['automatic', 'manual'] as const;

export type TabsOrientation = (typeof TABS_ORIENTATIONS)[number];
export type TabsActivation = (typeof TABS_ACTIVATION)[number];
