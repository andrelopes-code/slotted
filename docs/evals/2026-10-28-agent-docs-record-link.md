# Agent material evaluation — 2026-10-28, router link

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.18`: the `render` line of `agents-snippet.react.md` says that a router link is never drawn on its own, only as the element that a family's `render` returns, `Link` for a link. Run restricted to the new case `record-link`, one run per binding and per condition (`--runs 1 --case record-link`), over the tarballs of `590dab38`.

| Case        | Binding | Condition | Trigger | Compliance | Cost (USD) |
| ----------- | ------- | --------- | ------- | ---------- | ---------- |
| record-link | react   | with      | yes     | 2/2        | 0.32       |
| record-link | react   | without   | yes     | 2/2        | 0.27       |
| record-link | angular | with      | yes     | 2/2        | 0.24       |
| record-link | angular | without   | no      | 0/2        | 0.17       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| compose-screen | 2                 | 1.00         | 1.00            | 0.50            | 0.50               | 1.00       | meets   |

The React run without snippet also meets: in this sample the case does not separate the new snippet from the old one, because the "without" condition removes the whole snippet and not only the changed line.
