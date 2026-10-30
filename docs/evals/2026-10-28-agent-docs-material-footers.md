# Agent material evaluation — 2026-10-28, footer and overlay filters

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.21`: step 3 of the `theme-app` skill names `--slotted-drawer-footer-surface` with `--slotted-drawer-footer-backdrop-filter` and `--slotted-chart-overlay-backdrop-filter` (`a8e54300`). Run restricted to the `brand-theme` case, the only one that exercises the skill, one run per binding and per condition (`--runs 1 --case brand-theme`), over the tarballs of `b1b64637`.

| Case        | Binding | Condition | Trigger | Compliance | Cost (USD) |
| ----------- | ------- | --------- | ------- | ---------- | ---------- |
| brand-theme | react   | with      | yes     | 4/4        | 0.27       |
| brand-theme | react   | sem       | sim     | 4/4        | 0.31       |
| brand-theme | angular | com       | sim     | 4/4        | 0.39       |
| brand-theme | angular | without   | yes     | 4/4        | 0.32       |

| Skill     | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| --------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| theme-app | 2                 | 1.00         | 1.00            | 1.00            | 1.00               | 1.29       | meets   |
