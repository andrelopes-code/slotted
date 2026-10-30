import {
  ApplicationConfig,
  computed,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideArchive,
  lucideCircleDashed,
  lucideCircleMinus,
  lucideCirclePause,
  lucideCircleX,
  lucideClock,
  lucideFilePlus,
  lucideGitBranch,
  lucideShieldCheck,
  lucideTag,
  lucideUserCheck,
  lucideZap,
  lucideBell,
  lucideBuilding2,
  lucideChartColumn,
  lucideCheck,
  lucideCheckCheck,
  lucideChevronDown,
  lucideChevronUp,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleHelp,
  lucideClipboardCheck,
  lucideClipboardList,
  lucideCornerDownRight,
  lucideEllipsisVertical,
  lucideFileText,
  lucideFlaskConical,
  lucideGripVertical,
  lucideInfo,
  lucideLandmark,
  lucideLayoutDashboard,
  lucideLifeBuoy,
  lucideListTodo,
  lucideMoon,
  lucideOctagonAlert,
  lucidePackage,
  lucidePlus,
  lucideReceipt,
  lucideRefreshCw,
  lucideRows2,
  lucideRows3,
  lucideRows4,
  lucideScrollText,
  lucideSearch,
  lucideSettings,
  lucideShoppingCart,
  lucideSun,
  lucideTrash2,
  lucideTruck,
  lucideUser,
  lucideUsers,
  lucideWarehouse,
  lucideWorkflow,
  lucideX,
} from '@ng-icons/lucide';
import { provideSlotted } from '@slotted/angular/i18n';
import { provideSkeletonDefaults } from '@slotted/angular/skeleton';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import { provideNexoraBackend } from './core/backend/nexora-backend.provider';
import { NexoraTitleStrategy } from './core/nav/title.strategy';
import { PreferencesStore } from './core/session/preferences.store';

import { preloadLazyPages, routes } from './app.routes';

/**
 * Nexora is an English product. The library's spoken defaults are not, so
 * every family that speaks is told once, here, what to say. There is no single
 * provider for this yet: one per family is the current cost of a translated
 * application, and this file is where that cost is measured.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideNexoraBackend(),
    provideRouter(routes, withComponentInputBinding()),
    // After the first paint: the chunks load beside the seed rather than in front of a page.
    provideAppInitializer(() => void setTimeout(preloadLazyPages, 0)),
    { provide: TitleStrategy, useClass: NexoraTitleStrategy },
    provideIcons({
      lucideActivity,
      lucideArchive,
      lucideCircleDashed,
      lucideCircleMinus,
      lucideCirclePause,
      lucideCircleX,
      lucideClock,
      lucideFilePlus,
      lucideGitBranch,
      lucideShieldCheck,
      lucideTag,
      lucideUserCheck,
      lucideZap,
      lucideBell,
      lucideBuilding2,
      lucideChartColumn,
      lucideCheck,
      lucideCheckCheck,
      lucideChevronDown,
      lucideChevronUp,
      lucideCircleAlert,
      lucideCircleCheck,
      lucideCircleHelp,
      lucideClipboardCheck,
      lucideClipboardList,
      lucideCornerDownRight,
      lucideEllipsisVertical,
      lucideFileText,
      lucideFlaskConical,
      lucideGripVertical,
      lucideInfo,
      lucideLandmark,
      lucideLayoutDashboard,
      lucideLifeBuoy,
      lucideListTodo,
      lucideMoon,
      lucideOctagonAlert,
      lucidePackage,
      lucidePlus,
      lucideReceipt,
      lucideRefreshCw,
      lucideRows2,
      lucideRows3,
      lucideRows4,
      lucideScrollText,
      lucideSearch,
      lucideSettings,
      lucideShoppingCart,
      lucideSun,
      lucideTrash2,
      lucideTruck,
      lucideUser,
      lucideUsers,
      lucideWarehouse,
      lucideWorkflow,
      lucideX,
    }),
    /*
     * A region's placeholders are never delayed (AF-05): the backend's own
     * floor is 120 ms and a region with nothing in it reads as a stall from
     * the first frame. What they are given is a minimum: once drawn, they stay
     * long enough not to appear and leave inside one frame (AF-06).
     */
    /*
     * The library speaks the language the reader chose in the account menu: a
     * signal over the stored preference, so a change rewrites every family's
     * words in place, with no reload and no component created again.
     */
    provideSlotted(() => {
      const preferences = inject(PreferencesStore);
      return {
        locale: computed(() => preferences.preferences().locale),
        catalogs: { 'pt-BR': PT_BR },
      };
    }),
    provideSkeletonDefaults({ delay: 0, minDuration: 400 }),
  ],
};
