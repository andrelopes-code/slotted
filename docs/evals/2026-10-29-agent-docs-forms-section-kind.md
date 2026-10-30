# Agent material evaluation — 2026-10-29, section of a form

Model: `claude-sonnet-5-5`. Thresholds: trigger ≥ 0.9, compliance ≥ 0.85.

Change evaluated since `v0.1.0-beta.27`: `guidelines/forms.md`, the rule on sections by topic, now asks for each topic as a `field-group` with `kind` equal to `section`. Run restricted to the `customer-form` case, one run per binding and per condition (`--runs 1 --case customer-form`), over the tarballs of `8d810e72`.

| Case          | Binding | Condition | Trigger | Compliance | Cost (USD) |
| ------------- | ------- | --------- | ------- | ---------- | ---------- |
| customer-form | react   | with      | yes     | 4/4        | 0.61       |
| customer-form | react   | sem       | sim     | 3/4        | 0.36       |
| customer-form | angular | com       | sim     | 4/4        | 0.55       |
| customer-form | angular | without   | yes     | 3/4        | 0.46       |

| Skill          | Runs with snippet | Trigger with | Compliance with | Trigger without | Compliance without | Cost (USD) | Verdict |
| -------------- | ----------------- | ------------ | --------------- | --------------- | ------------------ | ---------- | ------- |
| compose-screen | 2                 | 1.00         | 1.00            | 1.00            | 0.75               | 1.97       | meets   |

The two failures are the `mentions loading` assertion, in the two runs without snippet. No assertion of the case measures `kind`: the sample confirms that the rewritten rule does not regress the case, and does not measure its effect.
