import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  type OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  SlAppShell,
  SlAppShellBanner,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavFooter,
  SlAppShellNavHeader,
  SlAppShellNavRail,
} from '@slotted/angular/app-shell';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSideNavigation,
  SlSideNavigationCount,
  SlSideNavigationGroup,
  SlSideNavigationIcon,
  SlSideNavigationItem,
  SlSideNavigationLabel,
  SlSideNavigationLink,
  SlSideNavigationList,
  SlSideNavigationSection,
  SlSideNavigationSectionLabel,
  SlSideNavigationTrigger,
} from '@slotted/angular/side-navigation';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { filter, map, startWith } from 'rxjs';

import { ApprovalsStore } from '../core/activity/approvals.store';
import { SupportQueuesStore } from '../core/support/tickets.store';
import { NotificationsStore } from '../core/activity/notifications.store';
import { TasksStore } from '../core/activity/tasks.store';
import { TransportHealth } from '../core/backend/transport-health';
import {
  destinationFor,
  moduleFor,
  SECTION_LABELS,
  visibleModules,
  type NavDestination,
  type NavModule,
} from '../core/nav/nav.model';
import { PreferencesStore } from '../core/session/preferences.store';
import { SessionStore } from '../core/session/session.store';
import { shellPreset } from '../core/shell/shell-presets';
import { ShortcutsService } from '../core/shortcuts/shortcuts.service';
import { Banner } from './banner/banner';
import { ShortcutsDialog } from './shortcuts/shortcuts-dialog';
import { ConnectionStatus } from './status/connection-status';

interface Section {
  id: NavModule['section'];
  label: string | null;
  modules: NavModule[];
}

@Component({
  selector: 'app-shell-layout',
  imports: [
    RouterLink,
    RouterOutlet,
    NgIcon,
    Banner,
    ConnectionStatus,
    ShortcutsDialog,
    SlAppShell,
    SlAppShellBanner,
    SlAppShellMain,
    SlAppShellNav,
    SlAppShellNavBody,
    SlAppShellNavFooter,
    SlAppShellNavHeader,
    SlAppShellNavRail,
    SlAvatar,
    SlButton,
    SlIconButton,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSideNavigation,
    SlSideNavigationCount,
    SlSideNavigationGroup,
    SlSideNavigationIcon,
    SlSideNavigationItem,
    SlSideNavigationLabel,
    SlSideNavigationLink,
    SlSideNavigationList,
    SlSideNavigationSection,
    SlSideNavigationSectionLabel,
    SlSideNavigationTrigger,
    SlSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.css',
})
export class ShellLayout implements OnInit {
  readonly session = inject(SessionStore);
  readonly approvals = inject(ApprovalsStore);
  private readonly supportQueues = inject(SupportQueuesStore);
  readonly tasks = inject(TasksStore);
  readonly notifications = inject(NotificationsStore);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(ShortcutsService);
  private readonly preferences = inject(PreferencesStore);
  private readonly banner = viewChild(Banner);
  readonly health = inject(TransportHealth);

  readonly navOpen = signal(this.readNavOpen());
  /** The arrangement the reader chose in their preferences; `inset` before they choose. */
  readonly preset = computed(() => shellPreset(this.preferences.preferences().shell));
  /** The module the reader pressed in the strip, until the next navigation. */
  private readonly pickedModule = signal<string | null>(null);
  readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly modules = computed(() => {
    void this.session.session();
    return visibleModules((p) => this.session.can(p));
  });
  readonly sections = computed<Section[]>(() =>
    (['home', 'operate', 'insight', 'manage'] as const)
      .map((id) => ({
        id,
        label: SECTION_LABELS[id],
        modules: this.modules().filter((m) => m.section === id),
      }))
      .filter((s) => s.modules.length > 0),
  );
  readonly current = computed(
    () => destinationFor(this.url())?.destination.id ?? moduleFor(this.url())?.id ?? null,
  );
  readonly expanded = computed(() => {
    const m = moduleFor(this.url());
    return m === undefined ? [] : [m.id];
  });
  /**
   * The module the two-level column shows: the one the reader pressed, or the
   * one the route is in, or the first. It is the product's state; the shell
   * holds only whether the region is open.
   */
  readonly railModule = computed(() => {
    const modules = this.modules();
    const picked = modules.find((m) => m.id === this.pickedModule());
    return picked ?? moduleFor(this.url()) ?? modules[0] ?? null;
  });
  readonly organization = computed(() => this.session.session()?.organization ?? null);
  /** What the session is scoped to: every warehouse, or the ones the operator can see. */
  readonly scope = computed(() => {
    const s = this.session.session();
    if (s === null) return '';
    const warehouses = this.session.warehouses();
    if (s.warehouseIds === 'all' || warehouses.length === 0) return 'All warehouses';
    const first = warehouses[0]!;
    const rest = warehouses.length - 1;
    return `${first.code} ${first.name}${rest > 0 ? ` +${rest}` : ''}`;
  });

  constructor() {
    this.shortcuts.install();
    // A navigation settles which module the column shows: the route's.
    effect(() => {
      this.url();
      untracked(() => this.pickedModule.set(null));
    });
    effect(() => {
      if (this.shortcuts.demoRequested() > 0) this.banner()?.demo().openAt();
    });
    effect(() => {
      const open = this.navOpen();
      // Overlay mode closes the column on every navigation; that is not a preference.
      if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
      try {
        localStorage.setItem(this.navKey(), String(open));
      } catch {
        /* storage unavailable */
      }
    });
  }

  ngOnInit(): void {
    if (this.session.status() === 'ready') {
      void Promise.all([
        this.approvals.refresh(),
        this.tasks.refresh(),
        this.notifications.refreshCount(),
      ]);
    }
  }

  /** Keyboard selection in the column: the link's router navigation covers the pointer. */
  navigate(request: { value: string | null }): void {
    const target = this.modules()
      .flatMap((m): (NavModule | NavDestination)[] => [m, ...m.destinations])
      .find((x) => x.id === request.value);
    if (target !== undefined && this.router.url !== target.path) {
      void this.router.navigateByUrl(target.path);
    }
  }

  /**
   * A module with destinations shows them in the column, opening the region
   * when it is closed to its strip; one without is a destination itself.
   */
  pickModule(module: NavModule): void {
    if (module.destinations.length === 0) {
      void this.router.navigateByUrl(module.path);
      return;
    }
    this.pickedModule.set(module.id);
    this.navOpen.set(true);
  }

  countFor(destination: NavDestination): number | null {
    if (destination.count === 'approvals') return this.approvals.pending();
    // The reader's own open tickets, the number the inbox's "Assigned to me" queue opens on.
    if (destination.count === 'support') return this.supportQueues.mine();
    return null;
  }

  retry(): void {
    void this.session.load();
  }

  private navKey(): string {
    return `nexora:nav-open:${this.session.user()?.id ?? 'anonymous'}`;
  }

  private readNavOpen(): boolean {
    try {
      return localStorage.getItem(this.navKey()) !== 'false';
    } catch {
      return true;
    }
  }
}
