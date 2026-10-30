# Agent material evaluation — 2026-10-20, relative paths

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.4`: the paths in `skills/*/SKILL.md` and in the guidelines
are now relative to the file itself (`../../guidelines/composition.md`), and the two snippets
open with the base of the paths ("Paths below are relative to the directory that holds node_modules.").
The text of `content/` did not change. Run restricted to one case, `orders-list` (skill `compose-screen`),
with the snippet, one run per binding (`--runs 1 --case orders-list --condition with`), over the
tarballs of `08fa74a1`: confirms that an agent follows the relative paths to the guidelines.

| Case        | Binding | Trigger | Compliance | Cost (USD) |
| ----------- | ------- | ------- | ---------- | ---------- |
| orders-list | react   | sim     | 4/4        | 0.65       |
| orders-list | angular | yes     | 4/4        | 0.88       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | ---------- | ------- |
| compose-screen | 2                 | 1.00         | 1.00            | 1.53       | meets   |
