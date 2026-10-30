import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import {
  SlAlertDialog,
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerTitle,
} from '@slotted/angular/drawer';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemLabel,
  SlListItemStart,
} from '@slotted/angular/list-item';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlToastService } from '@slotted/angular/toast';
import { SlToggle } from '@slotted/angular/toggle';
import type { ScenarioId } from '@slotted/demo-nexora-backend';

import { DemoStore } from '../../core/demo/demo.store';
import { roleLabel } from '../../core/nav/permission-area';
import { ClockService } from '../../core/session/clock.service';
import { PreferencesStore } from '../../core/session/preferences.store';
import { SessionStore } from '../../core/session/session.store';

/** The demonstration's controls. Nothing here exists in the product. */
@Component({
  selector: 'app-demo-drawer',
  imports: [
    SlAvatar,
    SlButton,
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerTitle,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemLabel,
    SlListItemStart,
    SlSection,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlSkeleton,
    SlSkeletonRegion,
    SlToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .row {
      display: flex;
      gap: var(--slotted-space-2);
      flex-wrap: wrap;
      align-items: center;
    }
    .date {
      margin: 0 0 var(--slotted-space-2);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .note {
      margin: var(--slotted-space-2) 0 0;
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
    }
  `,
  template: `
    <sl-drawer [(open)]="open" side="end" size="md" aria-label="Demo controls">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Demo controls</h2>
        <p slDrawerDescription>Simulated Asteron environment. Nothing here exists in the product.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <section slSection id="demo-persona">
          <div slSectionHeader><div slSectionTitle><h3 slSectionHeading>Persona</h3></div></div>
          <div slSectionBody>
            @if (demo.info() === null) {
              <!-- The session is on its way: the rows' own boxes, so the wait is visible. -->
              <div slSkeletonRegion [messages]="{ label: 'Loading demo controls' }" [loading]="true">
                <ul slList>
                  @for (i of placeholders; track i) {
                    <li slListItem size="sm">
                      <div slListItemContent>
                        <span slListItemStart><span slSkeleton shape="circle" size="sm"></span></span>
                        <span slListItemBody>
                          <span slListItemLabel><span slSkeleton shape="text" inlineSize="50%"></span></span>
                          <span slListItemDescription><span slSkeleton shape="text" inlineSize="75%"></span></span>
                        </span>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            } @else {
              <ul slList>
                @for (p of demo.info()?.personas ?? []; track p.key) {
                  <li slListItem size="sm" [selected]="p.active">
                    <button
                      type="button"
                      slListItemContent
                      [disabled]="demo.busy()"
                      (click)="setPersona(p.key, p.name)"
                    >
                      <span slListItemStart>
                        <span slAvatar size="sm" tone="accent" variant="soft" [name]="p.name"></span>
                      </span>
                      <span slListItemBody>
                        <span slListItemLabel>{{ p.name }}</span>
                        <span slListItemDescription>{{ roleLabel(p.role) }} · {{ p.context }}</span>
                      </span>
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
        </section>

        <section slSection id="demo-scenario">
          <div slSectionHeader><div slSectionTitle><h3 slSectionHeading>Scenario</h3></div></div>
          <div slSectionBody>
            @if (demo.info() === null) {
              <span slSkeleton shape="block" blockSize="var(--slotted-control-height-md)" [loading]="true"></span>
            } @else {
              <sl-select
                aria-label="Scenario"
                [value]="demo.info()?.scenarioId ?? 'healthy'"
                (valueChangeRequest)="askScenario($event.value)"
              >
                @for (s of demo.info()?.scenarios ?? []; track s.id) {
                  <sl-select-item [value]="s.id">{{ s.label }}</sl-select-item>
                }
              </sl-select>
              <p class="note">{{ scenarioDescription() }}</p>
            }
          </div>
        </section>

        <section slSection>
          <div slSectionHeader><div slSectionTitle><h3 slSectionHeading>Business date</h3></div></div>
          <div slSectionBody>
            <p class="date">
              {{ clock.formatDate(clock.now(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }}
            </p>
            <div class="row">
              <button slButton size="sm" variant="outline" [disabled]="demo.busy()" (click)="advance(1)">+1 day</button>
              <button slButton size="sm" variant="outline" [disabled]="demo.busy()" (click)="advance(7)">+7 days</button>
              <button slButton size="sm" variant="outline" [disabled]="demo.busy()" (click)="advance(daysToMonthEnd())">
                End of month
              </button>
            </div>
          </div>
        </section>

        <section slSection>
          <div slSectionHeader><div slSectionTitle><h3 slSectionHeading>Transport</h3></div></div>
          <div slSectionBody>
            <button slToggle [pressed]="demo.info()?.latency === 'degraded'" (pressedChange)="setDegraded($event.value)">
              System degraded
            </button>
            <p class="note">700 ms base latency, random 503s on activity and finance, 5 % failed mutations.</p>
          </div>
        </section>

        <section slSection id="demo-reset">
          <div slSectionHeader><div slSectionTitle><h3 slSectionHeading>Reset</h3></div></div>
          <div slSectionBody>
            <button slButton tone="danger" variant="outline" [disabled]="demo.busy()" (click)="resetOpen.set(true)">
              Reset demo data
            </button>
          </div>
        </section>
      </div>
    </sl-drawer>

    <sl-alert-dialog [(open)]="scenarioOpen">
      <header slDialogHeader>
        <span slAlertDialogIcon></span>
        <h2 slDialogTitle>Switch scenario?</h2>
        <p slDialogDescription>
          Switching resets demo data before applying “{{ pendingScenarioLabel() }}”. Anything you changed is lost.
        </p>
      </header>
      <footer slDialogFooter>
        <button slButton variant="outline" tone="secondary" slAlertDialogCancel>Cancel</button>
        <button slButton tone="danger" slAlertDialogAction (click)="confirmScenario()">Switch and reset</button>
      </footer>
    </sl-alert-dialog>

    <sl-alert-dialog [(open)]="resetOpen">
      <header slDialogHeader>
        <span slAlertDialogIcon></span>
        <h2 slDialogTitle>Reset demo data?</h2>
        <p slDialogDescription>Restores the canonical seed for the current scenario and the business date.</p>
      </header>
      <footer slDialogFooter>
        <button slButton variant="outline" tone="secondary" slAlertDialogCancel>Keep data</button>
        <button slButton tone="danger" slAlertDialogAction (click)="confirmReset()">Reset</button>
      </footer>
    </sl-alert-dialog>
  `,
})
export class DemoDrawer {
  readonly demo = inject(DemoStore);
  readonly roleLabel = roleLabel;
  readonly session = inject(SessionStore);
  readonly clock = inject(ClockService);
  private readonly preferences = inject(PreferencesStore);
  private readonly toasts = inject(SlToastService);
  private readonly router = inject(Router);

  readonly placeholders = [1, 2, 3, 4];
  readonly open = signal(false);
  readonly scenarioOpen = signal(false);
  readonly resetOpen = signal(false);
  readonly pendingScenario = signal<ScenarioId | null>(null);
  readonly pendingScenarioLabel = computed(
    () => this.demo.info()?.scenarios.find((s) => s.id === this.pendingScenario())?.label ?? '',
  );
  readonly scenarioDescription = computed(
    () =>
      this.demo.info()?.scenarios.find((s) => s.id === this.demo.info()?.scenarioId)?.description ??
      '',
  );

  openAt(section?: 'persona' | 'scenario' | 'reset'): void {
    if (this.demo.info() === null) void this.demo.load();
    if (section === 'reset') {
      this.resetOpen.set(true);
      return;
    }
    this.open.set(true);
    if (section !== undefined) {
      setTimeout(() => document.getElementById(`demo-${section}`)?.scrollIntoView?.({ block: 'start' }), 50);
    }
  }

  async setPersona(key: string, name: string): Promise<void> {
    await this.demo.setPersona(key);
    this.open.set(false);
    this.toasts.show({ title: `Signed in as ${name}`, tone: 'success' });
    await this.router.navigateByUrl(this.preferences.preferences().startRoute);
  }

  askScenario(value: unknown): void {
    if (typeof value !== 'string' || value === this.demo.info()?.scenarioId) return;
    this.pendingScenario.set(value as ScenarioId);
    this.scenarioOpen.set(true);
  }

  async confirmScenario(): Promise<void> {
    const id = this.pendingScenario();
    if (id === null) return;
    await this.demo.switchScenario(id);
    this.toasts.show({
      title: `Scenario: ${this.pendingScenarioLabel()}`,
      description: `Signed in as ${this.session.user()?.displayName}`,
      tone: 'success',
    });
    this.open.set(false);
    await this.router.navigateByUrl(this.preferences.preferences().startRoute);
  }

  async advance(days: number): Promise<void> {
    await this.demo.advanceDays(days);
    this.toasts.show({ title: `Business date is now ${this.clock.formatDate(this.clock.now())}` });
  }

  daysToMonthEnd(): number {
    const now = new Date(this.clock.now());
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    return Math.max(1, end.getUTCDate() - now.getUTCDate());
  }

  async setDegraded(pressed: boolean): Promise<void> {
    await this.demo.setLatency(pressed ? 'degraded' : 'normal');
    this.toasts.show({
      title: pressed ? 'Transport degraded' : 'Transport normal',
      tone: pressed ? 'warning' : 'success',
    });
  }

  async confirmReset(): Promise<void> {
    await this.demo.reset();
    this.toasts.show({ title: 'Demo data reset', tone: 'success' });
    this.open.set(false);
    await this.router.navigateByUrl(this.preferences.preferences().startRoute);
  }
}
