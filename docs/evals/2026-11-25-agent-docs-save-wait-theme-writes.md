# Agent material evaluation — 2026-11-25, a saving control and theme writes

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Changes evaluated since `v0.1.0-beta.40`: guideline AF-09 in `async-feedback` and the row of the `waiting-states` skill on a control that saves at the press, which shows the asked value at once; the row of the `theme-app` skill on a theme rule, which reads and writes only tokens or a property with a prefix of the application's. Two runs restricted to one case each, with the snippet, one run per binding (`--runs 1 --case save-button-wait --condition with`, then `--case brand-theme`), over the tarballs of `cfb8b27e`.

| Case             | Binding | Trigger | Compliance | Cost (USD) |
| ---------------- | ------- | ------- | ---------- | ---------- |
| save-button-wait | react   | yes     | 3/3        | 0.64       |
| save-button-wait | angular | yes     | 3/3        | 0.71       |
| brand-theme      | react   | yes     | 4/4        | 0.53       |
| brand-theme      | angular | yes     | 4/4        | 0.49       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | ---------- | ------- |
| waiting-states | 2                 | 1.00         | 1.00            | 1.36       | meets   |
| theme-app      | 2                 | 1.00         | 1.00            | 1.02       | meets   |
