# Plotune development and verification rules

## Scope and authority
- Development work occurs on a feature branch and is reviewed through a pull request. Never claim a phase completed based solely on a commit or a READY deployment.
- Keep changes small. Preserve existing composition engines and their tests when fixing test infrastructure.
- For every fix, identify affected existing tests before editing.

## Required gates for every change
1. Inspect the current code, the existing Node/CommonJS `tests/*.test.cjs` conventions, and the active GitHub Actions workflow.
2. Run `node --check` on every changed JavaScript file.
3. Run the changed test file and all related existing tests locally with Node 22 (the CI runtime); when the full suite is applicable, run all the same commands as `.github/workflows/test.yml`.
4. Review the exit codes and logs. If local execution is unavailable, explicitly label the change **未実行**, and do not call it verified or complete.
5. Check the GitHub Actions result for the exact commit SHA. A failing, pending, skipped, or absent required check blocks merge and phase completion. Fix and recheck; never treat a rerun as a substitute for correcting deterministic failures.
6. Verify the actual function in the UI, distinct from unit tests and CI. iPhone Safari confirmation remains **未確認** until real device verification.

## Regression rules
- Tests should preserve existing CommonJS + Node `assert` / `vm` patterns and support script URLs with optional query strings (`?v=...`). Do not hard-code an unversioned asset URL when the runtime supports cache-busting.
- Assertions across VM contexts must not depend on host-versus-VM error constructor identity; compare stable behavior/name when appropriate.
- Avoid adding duplicated or unrelated tests. Keep the existing regression suite intact.
- Never weaken product-behavior assertions merely to obtain green CI. Fix stale asset-presence assertions to match the supported runtime URL format instead.

## Reporting
Report only verified facts: changed files and commit, tests actually executed and outcomes, GitHub Actions run for the exact SHA, feature confirmation, and outstanding checks. Distinguish **CI success** from **feature validated** and **Safari validated**. Do not claim local tests were run unless their real execution output was inspected.

## Current regression watch
- `tests/ci-preflight.test.cjs`: app asset manifest and cache-busting URLs.
- `tests/resonare.test.cjs`: engine integration and HTML asset selection.
- `tests/instrument-auto-v18.test.cjs`: instrumental choices and script URL matching.
- `tests/song-form-v01.test.cjs`: whole-song structure, continuity and determinism.
- The full list in `.github/workflows/test.yml` is the mandatory regression suite.
