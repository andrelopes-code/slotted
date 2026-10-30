# Agent material evaluation — 2026-10-20

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.3`: CP-09 in `content/guidelines/composition.md` (switching
region defers the heavy render), LP-14 in `content/guidelines/list-pages.md` (a list that can exceed
a hundred rows is a `data-grid`), and two steps of `content/skills/compose-screen/SKILL.md` (CP-09 and LP-14
in "4. Compose"; measurement with 4× CPU in "6. Done"). Run restricted to the five cases of
`compose-screen`, one `--case` at a time, on both bindings, over the tarballs of `a99c525c`.

| Case            | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) |
| --------------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- |
| orders-list     | 6                 | 1.00         | 0.96            | 1.00            | 1.00               | 8.74       |
| customer-record | 6                 | 1.00         | 1.00            | 1.00            | 1.00               | 8.13       |
| customer-form   | 6                 | 1.00         | 1.00            | 1.00            | 0.83               | 4.75       |
| sales-overview  | 6                 | 1.00         | 1.00            | 1.00            | 1.00               | 4.91       |
| own-element     | 6                 | 1.00         | 1.00            | 1.00            | 1.00               | 8.03       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| compose-screen | 30                | 1.00         | 0.99            | 1.00            | 0.97               | 34.56      | meets   |

Failures: one React session of `orders-list` with snippet failed on `no-literal`; four sessions of
`customer-form` without snippet (three React, one Angular) failed on `mentions` `loading`.
