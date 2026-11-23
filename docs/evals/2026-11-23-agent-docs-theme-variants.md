# Agent material evaluation — 2026-11-23, theme variants

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.36`: the row of the `theme-app` skill on a variant says that a value changes a token by a derivation or by a CSS value. Run restricted to the case `brand-theme`, with the snippet, one run per binding (`--runs 1 --case brand-theme --condition with`), over the tarballs of `30030dd1`. The case covers that the skill still triggers and holds its rules; no case asks for a variant.

| Case        | Binding | Trigger | Compliance | Cost (USD) |
| ----------- | ------- | ------- | ---------- | ---------- |
| brand-theme | react   | yes     | 4/4        | 0.30       |
| brand-theme | angular | yes     | 4/4        | 0.40       |

| Skill     | Runs with snippet | Trigger with | Compliance with | Cost (USD) | Verdict |
| --------- | ----------------- | ------------ | --------------- | ---------- | ------- |
| theme-app | 2                 | 1.00         | 1.00            | 0.70       | meets   |
