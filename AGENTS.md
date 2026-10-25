# Mandatory Development Rules — CI Budget and Quality

Applies to all code changes by AI agents and human developers. Read before every development task.

## Preflight (mandatory)
1. Inspect current HEAD, relevant implementation, existing workflow triggers, and CI status.
2. Identify changed files, affected tests and relevant regression tests before editing.
3. Prefer existing local/isolated execution for quick checks; do not claim tests passed unless actual results were observed.
4. State whether verification was executed or **未実行**.

## CI budget guardrails
1. Do not push each micro-fix or rerun a failing CI unchanged. Inspect failure logs, fix the root cause, then retry.
2. Batch related edits into one coherent change, keeping the change scope small.
3. Do not trigger full test suites for docs-only changes unless documentation affects generated artifacts or release safety.
4. Deduplicate push/PR workflows, cancel superseded in-progress runs (but **never** cancel protected release/deploy runs), and use dependency caches when editing workflows.
5. For development use targeted tests; for release/merge run all required regressions, baselines and integration checks.
6. Expensive benchmarks, AI evaluations, music rendering, longitudinal simulations and deployment jobs require purpose and explicit trigger.
7. Do not increase paid Actions usage or trigger expensive workflows without explicit approval.
8. Never weaken or skip required tests just to obtain green CI or save minutes.

## Failure handling
- After a CI failure: **cause → minimal fix → affected tests → verification command/result**.
- Never retry without a new reason. Avoid duplicated test matrices and redundant CI triggers.
- If Actions quota prevents verification, mark it blocked/unverified; never report success.
- No unverified claims of completion, deployment or audio quality.
- Respect repository-specific tests (Node/jsdom/etc.) and existing conventions.

## Completion checklist
- [ ] Relevant HEAD and workflows checked
- [ ] Affected existing tests enumerated
- [ ] No duplicate or obsolete workflow run requested
- [ ] Targeted tests run or clearly marked unexecuted
- [ ] Required regressions and baseline status recorded
- [ ] Actions quota impact considered
- [ ] Required release checks are not bypassed

This file is policy, not an executable CI blocker. Enforce mechanically with path filters, concurrency, workflow permissions, and branch protection where supported.