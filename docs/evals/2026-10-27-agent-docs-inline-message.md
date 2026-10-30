# Agent material evaluation — 2026-10-27, region messages

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.17`: `composition.md` gained CP-11 (the message of a region is an `alert`; that of a control is an `inline-message`); `errors-and-conflicts.md` names `alert` next to `inline-message`; `reports.md` and `reading-permissions.md` replace `inline-message` with `alert` in the families, and PM-02 puts the declaration in an `alert`. Run restricted to the new case `section-notices`, with the snippet, one run per binding (`--runs 1 --case section-notices --condition with`), over the tarballs of `19ba0d82`.

| Case            | Binding | Trigger | Compliance | Cost (USD) |
| --------------- | ------- | ------- | ---------- | ---------- |
| section-notices | react   | sim     | 2/2        | 0.49       |
| section-notices | angular | yes     | 2/2        | 0.45       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | ---------- | ------- |
| compose-screen | 2                 | 1.00         | 1.00            | 0.94       | meets   |
