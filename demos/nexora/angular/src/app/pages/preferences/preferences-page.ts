import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlForm } from '@slotted/angular/form';
import { SlPage, SlPageBody, SlPageFooter } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlRadio, SlRadioDescription, SlRadioGroup } from '@slotted/angular/radio-group';
import {
  SlSection,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlToastService } from '@slotted/angular/toast';

import { visibleModules } from '../../core/nav/nav.model';
import {
  appearanceOf,
  PreferencesStore,
  type UserPreferences,
} from '../../core/session/preferences.store';
import { SHELL_PRESETS } from '../../core/shell/shell-presets';
import { SessionStore } from '../../core/session/session.store';
import { AppearanceSection } from './appearance-section';
import { ShellPreview } from './shell-preview';

/**
 * The preferences, edited as a draft until Save. The draft's appearance is
 * the application's own while the page is open (`PreferencesStore.preview`):
 * Discard returns the draft, and the application, to the saved preferences,
 * and leaving the page clears the candidate.
 */
@Component({
  selector: 'app-preferences-page',
  imports: [
    AppearanceSection,
    SlButton,
    SlCheckbox,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlForm,
    SlPage,
    SlPageBody,
    SlPageFooter,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlRadio,
    SlRadioDescription,
    SlRadioGroup,
    ShellPreview,
    SlSection,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlStack,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .checks {
      display: grid;
      gap: var(--slotted-space-2);
    }
    /* The arrangements, as a grid of framed choices of equal width. */
    .shells {
      display: grid;
      gap: var(--slotted-space-4);
      grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    }
    .shell-option {
      display: grid;
      gap: var(--slotted-space-3);
    }
  `,
  template: `
    <!-- CP-07: a form of choice grids and tables, not prose: content width. -->
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Preferences</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              How Nexora looks and what it tells you. Saved on this device, for your account.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <form slForm (submit)="$event.preventDefault(); save()">
          <div slStack [gap]="7">
            <app-appearance-section [draft]="draft()" (patch)="patch($event)" />

            <section slSection data-preferences-section="workspace">
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Workspace</h2>
                  <p slSectionDescription>How the application is laid out and where it opens.</p>
                </div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="5">
                  <div slField>
                    <label slFieldLabel>Shell layout</label>
                    <span slFieldDescription>
                      How the bar, the navigation and the page are arranged. Every layout keeps the
                      same destinations, the same keyboard order and the same shortcuts.
                    </span>
                    <div
                      slRadioGroup
                      name="shell"
                      variant="tile"
                      [value]="draft().shell"
                      (valueChange)="patch({ shell: $any($event.value) })"
                    >
                      <div class="shells">
                        @for (preset of presets; track preset.id) {
                          <div slRadio [value]="preset.id">
                            <span class="shell-option">
                              <app-shell-preview [preset]="preset" />
                              {{ preset.label }}
                            </span>
                            <p slRadioDescription>{{ preset.description }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                  <div slField>
                    <label slFieldLabel>Start page</label>
                    <sl-select
                      [value]="draft().startRoute"
                      (valueChangeRequest)="setStart($event.value)"
                    >
                      @for (m of startPages(); track m.path) {
                        <sl-select-item [value]="m.path">{{ m.label }}</sl-select-item>
                      }
                    </sl-select>
                    <span slFieldDescription>Where Nexora opens after sign-in.</span>
                  </div>
                </div>
              </div>
            </section>

            <section slSection data-preferences-section="notifications">
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Notifications</h2>
                  <p slSectionDescription>
                    What reaches you by email and in the application. Approvals and mentions always
                    reach you in the application.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div class="checks">
                  <div
                    slCheckbox
                    [checked]="draft().notifications.emailApprovals"
                    (checkedChange)="patchNotifications({ emailApprovals: $event.value })"
                  >
                    Email me approval requests
                  </div>
                  <div
                    slCheckbox
                    [checked]="draft().notifications.emailMentions"
                    (checkedChange)="patchNotifications({ emailMentions: $event.value })"
                  >
                    Email me mentions
                  </div>
                  <div
                    slCheckbox
                    [checked]="draft().notifications.inAppOperationalAlerts"
                    (checkedChange)="patchNotifications({ inAppOperationalAlerts: $event.value })"
                  >
                    In-app operational alerts
                  </div>
                  <div slCheckbox [checked]="true" disabled>In-app approvals (always on)</div>
                  <div slCheckbox [checked]="true" disabled>In-app mentions (always on)</div>
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
      <footer slPageFooter [open]="dirty()">
        <button slButton variant="ghost" tone="secondary" (click)="reset()">Discard</button>
        <button slButton tone="accent" (click)="save()">Save preferences</button>
      </footer>
    </div>
  `,
})
export class PreferencesPage {
  private readonly preferences = inject(PreferencesStore);
  private readonly session = inject(SessionStore);
  private readonly toasts = inject(SlToastService);
  readonly presets = SHELL_PRESETS;
  readonly draft = signal<UserPreferences>(structuredClone(this.preferences.preferences()));
  readonly dirty = computed(
    () => JSON.stringify(this.draft()) !== JSON.stringify(this.preferences.preferences()),
  );

  constructor() {
    effect(() => this.preferences.preview(appearanceOf(this.draft())));
    inject(DestroyRef).onDestroy(() => this.preferences.preview(null));
  }

  readonly startPages = computed(() =>
    visibleModules((p) => this.session.can(p)).map((m) => ({
      path: m.destinations[0]?.path ?? m.path,
      label: m.label,
    })),
  );

  patch(p: Partial<UserPreferences>): void {
    this.draft.update((d) => ({ ...d, ...p }));
  }

  setStart(value: unknown): void {
    if (typeof value === 'string') this.patch({ startRoute: value });
  }

  patchNotifications(p: Partial<UserPreferences['notifications']>): void {
    this.draft.update((d) => ({ ...d, notifications: { ...d.notifications, ...p } }));
  }

  reset(): void {
    this.draft.set(structuredClone(this.preferences.preferences()));
  }

  save(): void {
    this.preferences.update(this.draft());
    this.toasts.show({ title: 'Preferences saved', tone: 'success' });
  }
}
