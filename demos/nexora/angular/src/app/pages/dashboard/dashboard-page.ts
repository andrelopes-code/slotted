import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderSubheading,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlStatCard,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardValue,
} from '@slotted/angular/stat-card';

import { ApprovalsStore } from '../../core/activity/approvals.store';
import { NotificationsStore } from '../../core/activity/notifications.store';
import { TasksStore } from '../../core/activity/tasks.store';
import { ClockService } from '../../core/session/clock.service';
import { SessionStore } from '../../core/session/session.store';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    SlGrid,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderSubheading,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlStatCard,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardValue,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>Good {{ dayPart() }}, {{ session.user()?.firstName }}</h1>
              <p slPageHeaderSubheading>
                {{ session.session()?.organization?.displayName }} · business date
                {{
                  clock.formatDate(clock.now(), { weekday: 'long', month: 'long', day: 'numeric' })
                }}
              </p>
            </div>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div slGrid [columns]="3" [gap]="4">
          <div slStatCard>
            <div slStatCardHeader><span slStatCardLabel>Pending approvals</span></div>
            <div slStatCardFigure><span slStatCardValue [value]="approvals.pending()"></span></div>
          </div>
          <div slStatCard>
            <div slStatCardHeader><span slStatCardLabel>Open tasks</span></div>
            <div slStatCardFigure><span slStatCardValue [value]="tasks.open()"></span></div>
          </div>
          <div slStatCard>
            <div slStatCardHeader><span slStatCardLabel>Unread notifications</span></div>
            <div slStatCardFigure>
              <span slStatCardValue [value]="notifications.unread()"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit {
  readonly session = inject(SessionStore);
  readonly clock = inject(ClockService);
  readonly approvals = inject(ApprovalsStore);
  readonly tasks = inject(TasksStore);
  readonly notifications = inject(NotificationsStore);

  ngOnInit(): void {
    void Promise.all([
      this.approvals.refresh(),
      this.tasks.refresh(),
      this.notifications.refreshCount(),
    ]);
  }

  dayPart(): string {
    const hour = Number(
      this.clock.formatDate(this.clock.now(), { hour: 'numeric', hour12: false }),
    );
    return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  }
}
