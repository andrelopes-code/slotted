import { ChangeDetectionStrategy, Component, computed, effect, inject, viewChild } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SlAppShellNavToggle } from '@slotted/angular/app-shell';
import type { ChangeRequest } from '@slotted/core/state';
import { SlCommandPaletteTrigger } from '@slotted/angular/command-palette';
import { SlIcon } from '@slotted/angular/icon';
import { SlShortcut } from '@slotted/angular/kbd';
import {
  SlTopNavigation,
  SlTopNavigationAction,
  SlTopNavigationActions,
  SlTopNavigationBrand,
  SlTopNavigationHome,
  SlTopNavigationMark,
  SlTopNavigationName,
  SlTopNavigationSearch,
} from '@slotted/angular/top-navigation';

import { ApprovalsStore } from '../../core/activity/approvals.store';
import { NotificationsStore } from '../../core/activity/notifications.store';
import { TasksStore } from '../../core/activity/tasks.store';
import { PreferencesStore } from '../../core/session/preferences.store';
import { DemoDrawer } from '../demo/demo-drawer';
import { NotificationsPopover } from '../notifications/notifications-popover';
import { CommandPalette } from '../palette/command-palette';
import { UserMenu } from '../user-menu/user-menu';
import { ApprovalsPopover } from './approvals-popover';
import { BrandMark } from './brand-mark';
import { HelpMenu } from './help-menu';
import { TasksPopover } from './tasks-popover';

@Component({
  selector: 'app-banner',
  imports: [
    NgIcon,
    SlAppShellNavToggle,
    SlCommandPaletteTrigger,
    SlIcon,
    SlShortcut,
    SlTopNavigation,
    SlTopNavigationAction,
    SlTopNavigationActions,
    SlTopNavigationBrand,
      SlTopNavigationHome,
    SlTopNavigationMark,
    SlTopNavigationName,
    SlTopNavigationSearch,
    BrandMark,
    ApprovalsPopover,
    TasksPopover,
    HelpMenu,
    UserMenu,
    NotificationsPopover,
    CommandPalette,
    DemoDrawer,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner {
  readonly approvals = inject(ApprovalsStore);
  readonly tasks = inject(TasksStore);
  readonly notifications = inject(NotificationsStore);
  readonly preferences = inject(PreferencesStore);
  readonly palette = viewChild.required(CommandPalette);
  readonly demo = viewChild.required(DemoDrawer);

  readonly approvalsLabel = computed(() => `Approvals, ${this.approvals.pending()} pending`);
  readonly tasksLabel = computed(() => `Tasks, ${this.tasks.open()} open`);
  readonly notificationsLabel = computed(
    () => `Notifications, ${this.notifications.unread()} unread`,
  );

  constructor() {
    effect(() => this.palette().drawer.set(this.demo()));
  }

  /**
   * Below 600px the bar folds the search region behind a magnifier and opens
   * it on press. The region holds a palette trigger, not a field, so opening
   * it would cost a second press: the magnifier opens the palette itself.
   */
  searchRequested(request: ChangeRequest<boolean>): void {
    if (!request.value) return;
    request.cancel();
    this.palette().open.set(true);
  }
}
