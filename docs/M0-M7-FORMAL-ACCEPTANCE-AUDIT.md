# M0–M7 acceptance audit — 2026-10-24

Source of truth: `docs/M_IMPLEMENTATION_PLAN.md` on `docs/parallel-phase-m-roadmaps` (v1.0, 2026-10-22). Evidence: `feature/m7-1-four-condition-generation` at `04a87bce7a57b7337cb63323fb29de705f50d687`, related M0/M1 branches, Issue #45, and GitHub Actions run #40072903640 (9/9 SUCCESS). **CI passing is not equivalent to plan acceptance.**

| Stage | Verdict | Evidence | Missing acceptance evidence |
|---|---|---|---|
| M0 | PARTIAL / not accepted | `feature/m0-composition-contract` and `feature/m1-score-integration` contain `m-contract-v01.js`, `m-comparison-v01.js`, M0 tests and inventory. | M7 branch/main tree lacks these files. Cannot claim single integrated data-contract and comparison baseline or byte-level OFF compatibility across all selected paths. |
| M1 | PARTIAL / not accepted | Separate M1 motif registry, transform, history and score/renderer-opt-in branches exist; handheld has `motifDevelopment` flag. | No equivalent M1 registry/history/transform assets on current M7 branch. Formal tests of motif recognition on return, transform rationale and trace/return balance not established. |
| M2 | PARTIAL | `m2-emotion-phrase-v01.js` with multiple candidates, goal profile, events and cadence, referenced by current handheld and tests. | Controlled emotion-only cross-input evaluation (no excessive convergence, reliable cadence) not demonstrated across multiple scenarios. |
| M3 | PARTIAL | `m3-harmony-melody-v01.js` generates joint chord/phrase candidates, basic fit/voice-leading and cadence, with tests. | Explicit different harmonic interpretations of the **same** motif, reharmonized return, prepared dissonance/borrowing/modulation with explainable boundaries are not supported by visible module implementation. |
| M4 | PARTIAL | `m4-voice-dialogue-v01.js` and tests implement replies, imitation and register/density handling. | Measured harmonic consistency, counterline independence, and OFF stability beyond existing unit cases not fully established. |
| M5 | PARTIAL | `m5-performance-v01.js` and tests implement dynamics, breath/rubato/ornament effects. M7 listening has static per-track gain. | Explicit integration of performance with Phase 3 instrument entrance/exit plan and demonstrable phrase-apex/cadence expressive behavior across scenarios not fully established. |
| M6 | PARTIAL / not accepted | `m6-quality-v01.js`, `m6-integration-v01.js` and tests; actual optional score-to-PCM rendering, untouched control tracks, conservative guards, fixed-seed tests. | Plan requires separate motif identity, unrelated variation, harmonic resolution, independence and tradeoff diagnostics. Present assessment covers repetition, early ending, duplicate counter onset and invalid timing only; lead repetition repairs are conservatively rejected. Quality gain or acceptance frequency not established. |
| M7 | PARTIAL / not accepted to full plan | Four conditions with seed, 15/30/60s PCM/score, synchronized switching UI, ratings with JSON, objective metrics; latest CI 9/9 SUCCESS. | M1–M5 each-off ablation missing; full Phase 1–4 path not represented (Phase flag = motifDevelopment). No multi-song aggregate comparing objective metrics with human ratings; final listening and Safari/device verification deferred by user directive. |

## Scope clarification
- M7 "baseline" is current handheld with selected toggles OFF, not historic engine replay.
- M7 "Phase" is only `motifDevelopment`; do **not** interpret as all Phase 1–4.
- M6 is default OFF, so four-condition M7 result does not establish M6's musical effect.
- The latest M7 CI checks implementation/regression, not listening improvement.

## Required work before declaring M series technically complete
1. Reconcile M0/M1 modules and contracts into same development lineage with OFF compatibility and fixed-seed tests.
2. Implement missing M3/M6 acceptance capabilities or formally amend scope with user approval; do not rename incomplete work as complete.
3. Add M1–M5 one-at-a-time OFF ablation and multi-seed, multi-scene reproducible evaluation record that joins subjective and objective results.
4. Check cross-series regression CI on final HEAD and retain Draft PR / no merge/deploy.
5. Once all technical stages pass, arrange user's single final listening session; separately verify Safari/device playback if permission to deploy is granted.

No additional listening, merge or deployment authorized in this audit.
