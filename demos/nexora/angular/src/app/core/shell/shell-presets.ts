import type {
  AppShellCanvas,
  AppShellPrimary,
  AppShellSeparation,
} from '@slotted/angular/app-shell';

/**
 * An arrangement of the shell, in the family's own words. The package ships the
 * axes; which combinations a product offers its readers is the product's, so
 * the catalogue lives here and not in `@slotted/angular`.
 */
export interface ShellPreset {
  readonly id: ShellPresetId;
  readonly label: string;
  readonly description: string;
  readonly canvas: AppShellCanvas;
  readonly primary: AppShellPrimary;
  readonly separation: AppShellSeparation;
  /** The column on a dark scheme of its own over a light frame. */
  readonly darkNav?: boolean;
  /** The bar on a dark scheme of its own. */
  readonly darkBanner?: boolean;
  /** The modules in a strip of the rail's own, one module's destinations in the column. */
  readonly twoLevel?: boolean;
  /** A wash of the accent tone behind the frame. */
  readonly wash?: boolean;
}

export type ShellPresetId =
  | 'inset'
  | 'inset-content'
  | 'classic'
  | 'sidebar'
  | 'tones'
  | 'floating'
  | 'panel'
  | 'panel-tones'
  | 'dark-column'
  | 'dark-bar'
  | 'two-level'
  | 'wash';

export const SHELL_PRESETS: readonly ShellPreset[] = [
  {
    id: 'inset',
    label: 'Inset',
    description: 'The bar across the top, the column on the frame, the page as a card.',
    canvas: 'inset',
    primary: 'banner',
    separation: 'rule',
  },
  {
    id: 'inset-content',
    label: 'Inset, bar in the page',
    description: 'The column reaches the top; the bar sits inside the page card.',
    canvas: 'inset',
    primary: 'main',
    separation: 'rule',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Every region edge to edge, separated by rules.',
    canvas: 'flush',
    primary: 'banner',
    separation: 'rule',
  },
  {
    id: 'sidebar',
    label: 'Sidebar first',
    description: 'The column the full height, the bar beside it, rules between.',
    canvas: 'flush',
    primary: 'nav',
    separation: 'rule',
  },
  {
    id: 'tones',
    label: 'Tones',
    description: 'No lines: the column on a tone of its own, the page on the surface.',
    canvas: 'flush',
    primary: 'main',
    separation: 'tone',
  },
  {
    id: 'floating',
    label: 'Floating',
    description: 'The column and the page as two cards on the frame.',
    canvas: 'floating',
    primary: 'main',
    separation: 'rule',
  },
  {
    id: 'panel',
    label: 'Panel',
    description: 'One card holds the column and the page, under the bar.',
    canvas: 'panel',
    primary: 'banner',
    separation: 'rule',
  },
  {
    id: 'panel-tones',
    label: 'Panel, tones',
    description: 'One card with the bar inside it, the column on a tone.',
    canvas: 'panel',
    primary: 'main',
    separation: 'tone',
  },
  {
    id: 'dark-column',
    label: 'Dark column',
    description: 'A dark column on a light frame, the bar in the page.',
    canvas: 'inset',
    primary: 'main',
    separation: 'rule',
    darkNav: true,
  },
  {
    id: 'dark-bar',
    label: 'Dark bar',
    description: 'A dark bar across the top over a light column.',
    canvas: 'flush',
    primary: 'banner',
    separation: 'rule',
    darkBanner: true,
  },
  {
    id: 'two-level',
    label: 'Two levels',
    description: 'The modules in a strip of icons, one module at a time in the column.',
    canvas: 'inset',
    primary: 'main',
    separation: 'rule',
    twoLevel: true,
  },
  {
    id: 'wash',
    label: 'Washed frame',
    description: 'Floating cards over a soft wash of the accent colour.',
    canvas: 'floating',
    primary: 'main',
    separation: 'rule',
    wash: true,
  },
];

export const DEFAULT_SHELL_PRESET: ShellPresetId = 'inset';

/** The preset of an id, or the default for an id the catalogue no longer has. */
export function shellPreset(id: string | undefined): ShellPreset {
  return (
    SHELL_PRESETS.find((preset) => preset.id === id) ??
    SHELL_PRESETS.find((preset) => preset.id === DEFAULT_SHELL_PRESET)!
  );
}
