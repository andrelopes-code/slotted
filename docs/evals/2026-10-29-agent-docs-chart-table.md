# Agent material evaluation — 2026-10-29, chart table surfaces

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.26`: step 3 of the `theme-app` skill names `--slotted-chart-table-surface` and `--slotted-chart-table-header-surface`, and fixes `--slotted-chart-surface` as opaque (`0e02b2cc`). Run restricted to the `brand-theme` case, the only one that exercises the skill, one run per binding and per condition (`--runs 1 --case brand-theme`), over the tarballs of `0dbe255b`.

| Case        | Binding | Condition | Trigger | Compliance | Cost (USD) |
| ----------- | ------- | --------- | ------- | ---------- | ---------- |
| brand-theme | react   | with      | yes     | 4/4        | 0.25       |
| brand-theme | react   | sem       | sim     | 4/4        | 0.36       |
| brand-theme | angular | com       | sim     | 4/4        | 0.30       |
| brand-theme | angular | without   | yes     | 4/4        | 0.32       |

| Skill     | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| --------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| theme-app | 2                 | 1.00         | 1.00            | 1.00            | 1.00               | 1.24       | meets   |
