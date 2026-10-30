# Agent material evaluation — 2026-10-27

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.16`: `overviews.md` gained OV-07 (an overview the reader arranges is a `dashboard-grid`) and OV-08 (inside a frame, the figure is `plain`); `review-screen` gained the two sweep lines; LA-06 caps the height of a custom sticky by `--slotted-page-scrollport-block-size`; `compose-screen` routes a custom sticky to LA-06 in steps 3, 5, and 7. Run restricted to the two new cases, with the snippet, one run per binding (`--runs 1 --case <case> --condition with`), over the tarballs of `a9f485e6`.

| Case            | Binding | Trigger | Compliance | Cost (USD) |
| --------------- | ------- | ------- | ---------- | ---------- |
| review-overview | react   | sim     | 2/2        | 0.40       |
| review-overview | angular | sim     | 2/2        | 0.43       |
| sticky-summary  | react   | sim     | 2/2        | 0.61       |
| sticky-summary  | angular | yes     | 2/2        | 0.49       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | ---------- | ------- |
| review-screen  | 2                 | 1.00         | 1.00            | 0.83       | meets   |
| compose-screen | 2                 | 1.00         | 1.00            | 1.10       | meets   |
