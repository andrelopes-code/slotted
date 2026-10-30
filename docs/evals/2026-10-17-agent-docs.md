# Agent material evaluation — 2026-10-17

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

| Skill             | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| ----------------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| build-own-element | 6                 | 1.00         | 0.96            | 0.67            | 0.67               | 3.77       | meets   |
| compose-screen    | 30                | 1.00         | 0.99            | 1.00            | 0.97               | 33.80      | meets   |
| review-screen     | 6                 | 1.00         | 1.00            | 1.00            | 1.00               | 5.42       | meets   |
| theme-app         | 6                 | 1.00         | 0.83            | 0.83            | 1.00               | 3.03       | below   |
| waiting-states    | 24                | 1.00         | 0.98            | 0.96            | 0.91               | 12.84      | meets   |

## Rerun of theme-app — 2026-10-17

In the run above, the runner read only `.ts`, `.tsx`, `.html`, `.css`, and `.scss`; the theme compiled by `extendTheme` in `src/theme/brand.theme.mjs`, the path `theme-app` points to, was outside the read, and two Angular sessions with snippet failed on `seed-accent` and `0f766e`. The runner now reads `.js`, `.mjs`, `.cjs`, `.jsx`, and `.json`, and the `brand-theme` case ran again on both bindings:

| Skill     | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| --------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| theme-app | 6                 | 1.00         | 1.00            | 1.00            | 1.00               | 3.12       | meets   |
