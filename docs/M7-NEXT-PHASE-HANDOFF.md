# M7 technical handoff — 2026-10-24

Source of truth: `docs/M_IMPLEMENTATION_PLAN.md` on `docs/parallel-phase-m-roadmaps`. Working PR: #67, branch `feature/m7-1-four-condition-generation`. Issue: #45.

## Implemented
- M7.1 four-condition, fixed-seed 15/30/60 s render through handheld engine.
- M7.2 generation state and four-way browser comparison playback.
- M7.3 per-condition five-dimensional human rating record/JSON export.
- M7.4 deterministic objective score/PCM diagnostics.
- M6 conservative opt-in repair and actual renderer override, with provenance report.
- M0 contract and M1 motif registry/transform/history/test assets imported from separate branch.
- `PlotuneM7Generation.generateAblations()`: an all-on control and M1–M5 one-at-a-time OFF recordings, independent of the four conditions.
- `PlotuneM7Aggregate.aggregate()`: multiple paired subjective/objective trials; missing scores excluded and conflicts reported only as descriptive observations.

## CI and validation rules
A previous engineering HEAD `04a87bce` passed 9/9 GitHub CI workflows; latest branch must be separately checked. Imported files and added tests are not certified merely because older SHAs were green. Neither Safari hands-on, Preview, subjective listening nor music-quality improvement has been verified. All code is **未実行** locally. M7 aggregate is an API, not an interactive browser workflow. Never label a generated metric as aesthetic quality.

## Explicit acceptance gaps
1. The original plan's full Phase 1–4 architecture is **not** the same as M7's `motifDevelopment` Phase flag. Four-way UI labels therefore need qualification or full integration before claiming complete Phase-vs-M comparisons.
2. M1 legacy registry/history modules are imported, not yet proven as a complete cross-module rendering pipeline or recognizable thematic return.
3. M3 reharmonization/borrowed-harmony/modulation functionality and M6 harmonic/motif multi-axis evaluation are not fully met; see `docs/M0-M7-FORMAL-ACCEPTANCE-AUDIT.md`.
4. The formal M7 acceptance requires multi-song listener records; aggregation code without collected human judgments cannot establish improvement. User has postponed listening until full M-series technical completion.
5. Verify latest HEAD CI 9/9 and real Safari playback separately, only with user approval for a permitted deployment.

## Next implementer order
- Verify pending latest-HEAD workflows, inspect and fix failures immediately.
- Reconcile M1 modules with actual rendering and explicit section/motif references, then expand integration/coverage.
- Close M3/M6 acceptance criteria through tests and documented evidence.
- Ensure ablation and aggregate APIs are accessible in UI/file export without breaking existing four-way controls; test fixed-seed/volume alignment.
- Prepare a final comparison-session fixture; after all technical gates, request one user listening review and leave Draft PR unmerged and undeployed until separately authorized.

Never merge or deploy on this handoff alone.
