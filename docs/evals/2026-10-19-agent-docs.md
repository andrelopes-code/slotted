# Agent material evaluation — 2026-10-19

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.2`: `content/skills/theme-app/SKILL.md` gained step 4 of
the "One region" section (an application bar over scrolling content reads
`--slotted-surface-material` and `--slotted-material-backdrop`). Run restricted to that
skill's case: `pnpm eval:agent-docs --case brand-theme`, on both bindings, over the tarballs
of `d7bd74d7`.

| Skill     | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| --------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| theme-app | 6                 | 1.00         | 1.00            | 1.00            | 1.00               | 3.40       | meets   |
