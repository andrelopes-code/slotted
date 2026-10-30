import { inject, Injectable, signal } from '@angular/core';
import {
  SCENARIOS,
  type LatencyProfile,
  type ScenarioId,
  type SessionInfo,
} from '@slotted/demo-nexora-backend';

import { ApprovalsStore } from '../activity/approvals.store';
import { NotificationsStore } from '../activity/notifications.store';
import { TasksStore } from '../activity/tasks.store';
import { readDemoState, writeDemoState } from '../backend/demo-state';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';

export interface DemoInfo {
  personas: SessionInfo['personas'];
  activePersonaKey: string | null;
  scenarios: { id: ScenarioId; label: string; description: string }[];
  scenarioId: ScenarioId;
  clock: { now: string; today: string };
  latency: LatencyProfile;
}

@Injectable({ providedIn: 'root' })
export class DemoStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly sessionStore = inject(SessionStore);
  private readonly notifications = inject(NotificationsStore);
  private readonly approvals = inject(ApprovalsStore);
  private readonly tasks = inject(TasksStore);
  private readonly health = inject(TransportHealth);
  readonly info = signal<DemoInfo | null>(null);
  readonly busy = signal(false);
  private latency: LatencyProfile = 'normal';

  async load(): Promise<void> {
    const api = await this.backend.ready();
    const session = await api.session.get();
    const active = session.personas.find((p) => p.userId === session.user.id);
    this.info.set({
      personas: session.personas,
      activePersonaKey: active?.key ?? null,
      scenarios: SCENARIOS.map((s) => ({ id: s.id, label: s.name, description: s.description })),
      scenarioId: session.demo.scenarioId as ScenarioId,
      clock: { now: session.demo.demoClock, today: session.demo.today },
      latency: this.latency,
    });
  }

  private async after(): Promise<void> {
    await this.sessionStore.reload();
    if (this.sessionStore.status() === 'ready') {
      await Promise.all([
        this.notifications.refreshCount(),
        this.approvals.refresh(),
        this.tasks.refresh(),
      ]);
    }
    await this.load();
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      await this.after();
    } finally {
      this.busy.set(false);
    }
  }

  setPersona(key: string): Promise<void> {
    return this.run(async () => {
      const api = await this.backend.ready();
      await api.demo.setPersona(key);
      writeDemoState({ persona: key, signedOut: false });
    });
  }

  signOut(): Promise<void> {
    this.sessionStore.signOut();
    return this.load();
  }

  switchScenario(id: ScenarioId): Promise<void> {
    return this.run(async () => {
      const api = await this.backend.ready();
      await api.demo.setScenario(id);
      writeDemoState({ scenario: id });
    });
  }

  advanceDays(days: number): Promise<void> {
    return this.run(async () => (await this.backend.ready()).demo.advanceClock(days * 24));
  }

  reset(): Promise<void> {
    return this.run(async () => (await this.backend.ready()).demo.reset(readDemoState().scenario));
  }

  setLatency(profile: LatencyProfile): Promise<void> {
    return this.run(async () => {
      (await this.backend.ready()).demo.setLatency(profile);
      this.latency = profile;
      this.health.profile.set(profile);
    });
  }
}
