# Agent material evaluation — 2026-11-23, own elements

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.35`: the `build-own-element` skill gained the sections on a word-sized comparison and on a gallery of illustrated choices; `own-elements.md` gained OE-11 (comparison marks share a scale) and OE-12 (a picture gallery is one radio group). Run restricted to the case `seat-map`, with the snippet, one run per binding (`--runs 1 --case seat-map --condition with`), over the tarballs of `8375a925`. The case covers that the skill still triggers and holds its rules; no case asks for a comparison mark or a picture gallery.

| Case     | Binding | Trigger | Compliance | Cost (USD) |
| -------- | ------- | ------- | ---------- | ---------- |
| seat-map | react   | yes     | 4/4        | 0.74       |
| seat-map | angular | yes     | 4/4        | 0.41       |

| Skill             | Runs with snippet | Trigger with | Compliance with | Cost (USD) | Verdict |
| ----------------- | ----------------- | ------------ | --------------- | ---------- | ------- |
| build-own-element | 2                 | 1.00         | 1.00            | 1.15       | meets   |
