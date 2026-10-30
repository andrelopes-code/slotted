# Agent material evaluation — 2026-10-29, layout of a form

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.24`: `guidelines/forms.md` gains FM-18 to FM-24 (column at the form's measure, two fields on one row only when they are one answer, field width, sections by topic, set of choices as a question, necessity stated once, help next to the question). Run restricted to the `customer-form` case, one run per binding and per condition (`--runs 1 --case customer-form`), over the tarballs of `4d1c5030`.

| Case          | Binding | Condition | Trigger | Compliance | Cost (USD) |
| ------------- | ------- | --------- | ------- | ---------- | ---------- |
| customer-form | react   | with      | yes     | 4/4        | 0.41       |
| customer-form | react   | sem       | sim     | 3/4        | 0.44       |
| customer-form | angular | com       | sim     | 3/4        | 0.46       |
| customer-form | angular | without   | yes     | 4/4        | 0.35       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| compose-screen | 2                 | 1.00         | 0.88            | 1.00            | 0.88               | 1.66       | meets   |

The two failures are the same assertion, `mentions loading`, one with snippet and one without; no assertion of the case measures the field layout, so the sample confirms that the new rules do not regress the case and does not measure their effect.
