---
name: release
description: Use when asked to release, publish or ship the Slotted packages to npm, cut a new beta, "release", "publish", "ship a beta", "new version", or to check why a release did not reach npm. Covers `pnpm release`, the Release workflow, verification on the registry and recovery from a failed publish. Not for packing tarballs for a demo (`pnpm pack:beta`, `pnpm demo:refresh`).
---

# Release

A release moves the six `@slotted/*` packages to one shared version and publishes them from
`.github/workflows/release.yml`. The session never publishes: npm trusts that workflow by
OIDC, and no npm token or one-time password exists for a session to use.
`node scripts/release.mjs --publish` refuses to run outside GitHub Actions.

`CONTRIBUTING.md` › "Publishing to npm" is the rule; this skill is the order of work.

## 1. Before

- The user asked for a release. A finished change is not a release by itself.
- `git status --short` is empty, the branch is `main`, and `git fetch && git status -sb` shows
  `main...origin/main` with nothing ahead or behind. Work on another branch reaches `main` by PR
  first.
- CI passed on `HEAD`: `gh run list --branch main --limit 1`. A red or running CI is waited for or
  fixed; `pnpm release` refuses it anyway.

## 2. Choose the version

`pnpm release --dry-run` prints the next version, its dist-tag and the `CHANGELOG.md` entry, and
writes nothing.

- No argument: the next beta (`0.1.0-beta.3` → `0.1.0-beta.4`). This is the default.
- An explicit version (`pnpm release 0.2.0-beta.0`) only when the user names it.
- The entry lists commit subjects up to their first `—`. A subject that reads wrong in the
  changelog is fixed in the next release's commits, not by editing history.

Show the dry run to the user before the real run.

## 3. Release

```sh
pnpm release            # or: pnpm release <version>
```

It commits `chore(release): v<version>`, tags `v<version>` and pushes both. Then:

```sh
gh run list --workflow release.yml --limit 1
gh run watch <id>
```

The workflow runs `pnpm build` and the publish step: about 5 minutes. It does not validate again; CI on the
released commit is the one validation, and CI skips the `chore(release)` commit.

## 4. Verify

A version reaches the registry up to two minutes after the workflow ends.

```sh
for p in styles theme core themes angular react; do npm view @slotted/$p@<version> dist-tags --prefer-online; done
```

Each of the six shows `latest` at `<version>` (`0.x` line). Report the run id and the six
versions.

## 5. When it fails

| Symptom                                        | Cause and action                                                                                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm release` refuses                         | The message names the guard. Fix the state it names; never bypass a guard.                                                                                                                                                       |
| `pnpm build` fails in the workflow             | A defect on `main` that CI did not reach. Fix it with a test on `main` through CI, then `pnpm release` again: the next version. The failed tag stays; its version was never published.                                           |
| Publish step: `E404`, `E403` or `ENEEDAUTH`    | The package has no trusted publisher for `andrelopes-code/slotted` › `release.yml`. The user configures it on npmjs.com; then `gh run rerun <id> --failed`.                                                                      |
| Some packages published, the step failed after | `gh run rerun <id> --failed`. The step skips every version already on the registry.                                                                                                                                              |
| A package new to `packages/`                   | npm configures a trusted publisher only on an existing package: the user publishes its first version by hand, then runs the `npm trust github` command in CONTRIBUTING.md › Publishing to npm, and the next release includes it. |

A published version is never unpublished or overwritten. A wrong release is answered by the next
version.
