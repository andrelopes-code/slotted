import { Injectable, signal } from '@angular/core';
import type { ReportRecords } from '@slotted/demo-nexora-backend';

import { DEFAULT_COMPARISON, DEFAULT_PERIOD, type PeriodKey, type ReportComparison } from './report.model';

/**
 * The period and comparison last chosen on any report, so moving from one
 * report to the next keeps them: a report opened with no period in its
 * address takes these. The coverage each kind of record was last answered
 * with lets a report offer only the periods it can read before its own answer.
 */
@Injectable({ providedIn: 'root' })
export class PeriodMemory {
  readonly period = signal<PeriodKey>(DEFAULT_PERIOD);
  readonly compare = signal<ReportComparison>(DEFAULT_COMPARISON);
  readonly coverage = signal<Partial<Record<ReportRecords, string>>>({});

  remember(period: PeriodKey, compare: ReportComparison): void {
    this.period.set(period);
    this.compare.set(compare);
  }

  learn(coverage: Partial<Record<ReportRecords, string>>): void {
    this.coverage.update((known) => ({ ...known, ...coverage }));
  }

  /** Another persona, scenario or tenant: the coverage belongs to the tenant read before. */
  forget(): void {
    this.coverage.set({});
  }
}
