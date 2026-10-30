import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderSubheading,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlPageHeaderVisual,
} from '@slotted/angular/page-header';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';

import { AREA_LABELS, permissionArea, type PermissionArea } from '../../core/nav/permission-area';
import { ClockService } from '../../core/session/clock.service';
import { SessionStore } from '../../core/session/session.store';

@Component({
  selector: 'app-profile-page',
  imports: [
    SlAvatar,
    SlBadge,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderSubheading,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPageHeaderVisual,
    SlSection,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .permissions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--slotted-space-1);
      margin-block-end: var(--slotted-space-4);
    }
    .area {
      margin: 0 0 var(--slotted-space-2);
      font-size: var(--slotted-font-size-sm);
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    @if (session.session(); as s) {
      <div slPage width="content">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderTitleRow>
              <div slPageHeaderVisual>
                <span
                  slAvatar
                  size="lg"
                  tone="accent"
                  variant="soft"
                  [name]="s.user.displayName"
                ></span>
              </div>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ s.user.displayName }}</h1>
                <p slPageHeaderSubheading>{{ s.user.title }} · {{ s.user.department }}</p>
                <div slPageHeaderMarks>
                  @for (r of s.roles; track r.id) {
                    <span slBadge tone="accent" variant="soft" size="sm">{{ r.name }}</span>
                  }
                  @for (t of s.teams; track t.id) {
                    <span slBadge tone="secondary" variant="soft" size="sm">{{ t.name }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Account</h2></div>
            </div>
            <div slSectionBody>
              <div slDescriptionList [columns]="2">
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Email</dt>
                  <dd slDescriptionListDescription copy>{{ s.user.email }}</dd>
                </div>
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Manager</dt>
                  <dd slDescriptionListDescription [empty]="!s.user.managerId">
                    {{ s.user.managerId }}
                  </dd>
                </div>
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Timezone</dt>
                  <dd slDescriptionListDescription>{{ s.user.timezone }}</dd>
                </div>
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Last active</dt>
                  <dd slDescriptionListDescription [empty]="!s.user.lastActiveAt">
                    {{ s.user.lastActiveAt ? clock.relative(s.user.lastActiveAt) : '' }}
                  </dd>
                </div>
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Warehouses</dt>
                  <dd slDescriptionListDescription>{{ warehouses() }}</dd>
                </div>
              </div>
            </div>
          </section>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Effective permissions</h2></div>
            </div>
            <div slSectionBody>
              @for (group of grouped(); track group.area) {
                <p class="area">{{ group.label }}</p>
                <div class="permissions">
                  @for (p of group.permissions; track p) {
                    <span slBadge tone="secondary" variant="outline" size="sm"
                      ><code>{{ p }}</code></span
                    >
                  }
                </div>
              }
            </div>
          </section>
        </div>
      </div>
    }
  `,
})
export class ProfilePage {
  readonly session = inject(SessionStore);
  readonly clock = inject(ClockService);
  readonly warehouses = computed(() => {
    const s = this.session.session();
    if (s?.warehouseIds === 'all') return 'All warehouses';
    return (
      this.session
        .warehouses()
        .map((w) => `${w.code} ${w.name}`)
        .join(', ') || 'None'
    );
  });
  readonly grouped = computed(() => {
    const byArea = new Map<PermissionArea, string[]>();
    for (const p of this.session.session()?.permissions ?? []) {
      const area = permissionArea(p);
      const list = byArea.get(area) ?? [];
      list.push(p);
      byArea.set(area, list);
    }
    return [...byArea.entries()].map(([area, permissions]) => ({
      area,
      label: AREA_LABELS[area],
      permissions: permissions.sort(),
    }));
  });
}
