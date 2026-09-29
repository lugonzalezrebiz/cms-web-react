---
name: stacked-prs
description: Open pull requests for the current work as a chain of small, stacked PRs on a common feature branch, each with a standard English description (summary, changes, testing, risks, and which PR merges next). Use whenever the user asks to open, create, upload or split a PR / pull request, or to "subir" changes for review.
---

# Stacked pull requests

Ship the current changes as **small, dependent PRs stacked on a common
branch**, never as one large PR. Each PR is reviewable on its own, builds on
its own, and says exactly which PR merges next.

## Rules

1. **Split when the change touches more than 10 files.** Up to 10 files → a
   single PR (still on the common branch, see below). More than 10 → split.
2. **PR size:** aim for **~7 files per PR, 10 at most.** Never exceed 10.
3. **One responsibility per PR.** Group files by topic, not by folder. A PR
   must not mix unrelated concerns (e.g. a refactor and a new feature).
4. **Every PR must build on its own** (`npm run build`, `npm run lint`) on top
   of the PRs below it. Never leave a PR that only compiles once a later PR
   lands — move the missing piece down the stack instead.
5. **Order from foundation to usage:** types/constants → shared hooks/utils →
   components → pages/wiring → cleanup/refactors that depend on the rest.
6. **Never push, create PRs, or force-push without the user's explicit OK.**
   Show the plan first (step 3) and wait for confirmation.
7. Don't include unrelated local changes (scratch files, `docs/` drafts, stray
   edits). Ask when in doubt.

## Branch model (stacked chain)

```
v1                                   (target branch — confirm with the user)
 └─ Feat/<topic>                     common branch, created from v1
     └─ Feat/<topic>-01-<slug>       PR #1 → base: Feat/<topic>
         └─ Feat/<topic>-02-<slug>   PR #2 → base: Feat/<topic>-01-<slug>
             └─ Feat/<topic>-03-<slug> PR #3 → base: Feat/<topic>-02-<slug>
```

- Merge order: PR #1 → PR #2 → … → last PR, then one final PR
  `Feat/<topic>` → `v1`.
- After a PR merges, retarget the next PR's base to `Feat/<topic>` (GitHub
  does this automatically when the base branch is deleted on merge; otherwise
  `gh pr edit <n> --base Feat/<topic>`).
- Branch names follow this repo's convention: `Feat/<kebab-topic>`, parts
  numbered `-01-`, `-02-`… so they sort in merge order.

## Workflow

### 1. Inspect the change
- `git status`, `git diff --stat <target>...HEAD` and the working tree diff.
- Identify the target branch (in this repo usually `v1`; confirm).
- Count changed files (excluding ones the user doesn't want shipped).

### 2. Plan the split
Group files into PRs following the rules. For each PR note: number, branch
name, title, files, and what it depends on. Check each PR would build alone
(a file that imports something new must come after the PR that adds it).

### 3. Show the plan and wait
Present a table like:

| # | Branch | Title | Files | Base |
|---|--------|-------|-------|------|
| 1 | `Feat/punches-01-types` | Add punch session types and constants | 4 | `Feat/punches` |
| 2 | `Feat/punches-02-timeline` | Session bars and shortcuts in the timeline | 7 | `Feat/punches-01-types` |

Ask the user to confirm or adjust. Do not continue without an explicit yes.

### 4. Build the branches
For each PR in order:
```bash
git checkout -b Feat/<topic> <target>            # once, the common branch
git checkout -b Feat/<topic>-01-<slug> Feat/<topic>
git checkout <source-branch> -- <files of this PR>   # or apply the hunks
npm run lint && npm run build                    # must pass
git commit -m "<conventional message>"           # see "Commits"
```
The next PR branches from the previous PR's branch. If a file is shared by two
PRs, split its hunks (`git add -p`) so each PR carries only its part.

If lint/build fails on a PR, fix the split (move code between PRs) rather than
adding "will be fixed in the next PR" code.

### 5. Push and open the PRs (after confirmation)
- Check tooling: `gh auth status`. If `gh` is missing or not logged in, push
  the branches and give the user the GitHub compare URLs
  (`https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1`)
  plus each PR body ready to paste.
- Otherwise, per PR in order:
  ```bash
  git push -u origin Feat/<topic>-NN-<slug>
  gh pr create --base <base-branch> --head Feat/<topic>-NN-<slug> \
    --title "<title>" --body-file <tmp-body.md>
  ```
- After all PRs exist, edit each body so "Previous" / "Next" link the real PR
  numbers (`gh pr edit <n> --body-file ...`).
- Finally open the common PR `Feat/<topic>` → `<target>` whose body lists the
  whole stack (see "Stack overview PR").

### 6. Report
Give the user the list of PR links in merge order and anything left to do.

## Commits

Conventional style, like the repo history: `feat: …`, `fix: …`,
`refactor: …`, `chore: …`. One or a few commits per PR, each building.
Add any attribution lines the session instructions require.

## PR description template (English)

Use this for every PR in the stack. Keep it concrete; delete sections that
don't apply rather than writing "N/A".

```markdown
## Summary
<1–3 sentences: what this PR does and why, from the reviewer's point of view.>

## Stack
- **Part N of M** of `Feat/<topic>` — <one-line goal of the whole stack>
- ⬅️ Previous: #<n> <title> _(merge first)_  | or: "First PR of the stack"
- ➡️ **Next to merge after this:** #<n> <title> | or: "Last PR — then merge `Feat/<topic>` into `<target>` (#<n>)"
- Base: `<base-branch>`

## Changes
- `<path>` — <what changed and why>
- …

## How to test
1. `npm run lint && npm run build`
2. <manual steps: page, tab, keys to press, expected result>

## Impact & risks
- **Affected areas:** <screens/features touched>
- **Not affected:** <areas explicitly unchanged, e.g. "Compliance violations behavior is unchanged">
- **Risks / follow-ups:** <known limitations, TODOs moved to later PRs>

## Screenshots
<before/after if the UI changes>
```

## Stack overview PR

The final PR (`Feat/<topic>` → `<target>`) uses:

```markdown
## Summary
<What the whole feature delivers.>

## Merge order
1. #<n> <title>
2. #<n> <title>
…
N. This PR (`Feat/<topic>` → `<target>`) — merge after all of the above.

## How to test the whole feature
<end-to-end steps>

## Impact & risks
<combined notes>
```
