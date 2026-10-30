import type { Binding } from '../types.ts';
import type { SessionTrace } from './stream.ts';

export const THRESHOLDS = { trigger: 0.9, conformance: 0.85 } as const;

export interface RunResult {
  caseId: string;
  binding: Binding;
  skill: string;
  condition: 'with' | 'without';
  triggered: boolean;
  passed: number;
  total: number;
  trace: SessionTrace;
}

export interface SkillSummary {
  skill: string;
  condition: 'with' | 'without';
  runs: number;
  triggerRate: number;
  conformance: number;
  costUsd: number;
}

export function summarize(results: readonly RunResult[]): SkillSummary[] {
  const groups = new Map<string, RunResult[]>();
  for (const result of results) {
    const key = `${result.skill}\u0000${result.condition}`;
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return [...groups]
    .map(([key, runs]) => {
      const [skill, condition] = key.split('\u0000') as [string, 'with' | 'without'];
      const total = runs.reduce((sum, run) => sum + run.total, 0);
      return {
        skill,
        condition,
        runs: runs.length,
        triggerRate: runs.filter((run) => run.triggered).length / runs.length,
        conformance: total === 0 ? 0 : runs.reduce((sum, run) => sum + run.passed, 0) / total,
        costUsd: runs.reduce((sum, run) => sum + run.trace.costUsd, 0),
      };
    })
    .sort((a, b) => a.skill.localeCompare(b.skill) || (a.condition === 'with' ? -1 : 1));
}

export function renderReport(
  date: string,
  model: string,
  summaries: readonly SkillSummary[],
): string {
  const lines = [
    `# Agent material evaluation — ${date}`,
    '',
    `Model: \`${model}\`. Thresholds: trigger ≥ ${THRESHOLDS.trigger}, compliance ≥ ${THRESHOLDS.conformance}.`,
    '',
    '| Skill | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const skill of [...new Set(summaries.map((summary) => summary.skill))]) {
    const withSnippet = summaries.find((s) => s.skill === skill && s.condition === 'with');
    const without = summaries.find((s) => s.skill === skill && s.condition === 'without');
    const cost = (withSnippet?.costUsd ?? 0) + (without?.costUsd ?? 0);
    const meets =
      withSnippet !== undefined &&
      withSnippet.triggerRate >= THRESHOLDS.trigger &&
      withSnippet.conformance >= THRESHOLDS.conformance;
    lines.push(
      `| ${skill} | ${withSnippet?.runs ?? 0} | ${(withSnippet?.triggerRate ?? 0).toFixed(2)} | ${(withSnippet?.conformance ?? 0).toFixed(2)} | ${(without?.triggerRate ?? 0).toFixed(2)} | ${(without?.conformance ?? 0).toFixed(2)} | ${cost.toFixed(2)} | ${meets ? 'meets' : 'below'} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}
