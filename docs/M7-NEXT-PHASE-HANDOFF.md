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

## Technical integration update (2026-10-24)
- M1's real score generation now registers opening motif, records four section transformations and materializes a reprise in the final quarter when `musicMotifMemory` is ON. `motifDevelopment` is separately controlled by Phase, and M1 ablation disables only the M-specific register/return stage.
- M3 candidate harmony fit now depends on chord root. `PlotuneM3TonalJourney` applies an opt-in temporary +2 semitone tonicization to pitched voices, returns to home key, and can borrow iv's lowered third in a major-key subdominant bar when the prerequisite harmony exists. Provenance is on the score.
- M6's conservative counter-revoicing is limited to sounding chord tones of a different pitch class. Diagnostics include motif contour, harmonic alignment, lead-counter unisons, and last-note chord tone. These are descriptive safeguards, not proof of musical merit.
- Phase condition now enables four distinct structural switches: `phaseSongForm`, `motifDevelopment`, `phaseArrangement`, `musicTransitions`. M toggles `musicMotifMemory`, `musicDevelopment`, `musicHarmony`, `musicTonalJourney`, `musicVoices`, and `musicPerformance`. Four conditions remain orthogonal; the full original Phase infrastructure may differ from these isolated handheld implementations.
- Multi-song paired listening/diagnostic storage plus JSON aggregate export have been added to the browser.
- Regression suites include score-level Phase sections, M1 reprise provenance, M3 tonicization/borrowing and M6 live local repair, plus 15/30/60-second four-way PCM and ablations.

## CI and validation rules
A previous engineering HEAD `04a87bce` passed 9/9 GitHub CI workflows; latest branch must be separately checked. Imported files and added tests are not certified merely because older SHAs were green. Neither Safari hands-on, Preview, subjective listening nor music-quality improvement has been verified. All code is **未実行** locally. M7 aggregate also has a browser save/export control, but authentic human ratings still need to be collected. Never label a generated metric as aesthetic quality.

## Explicit acceptance gaps
1. Phase 1–4 are now independently gated in the handheld score, but a full comparison against every historical Phase-branch implementation has not been certified.
2. M1 is connected to score generation and has deterministic theme return and trace tests. Perceptual recognizability remains a human listening question.
3. M3 implements explicit harmonic reinterpretation, temporary tonicization/return, and guarded chromatic subdominant borrowing; M6 multi-axis description and bounded local revoicing are implemented. Broader harmonic grammar and subjective improvement remain open research/acceptance gates.
4. The formal M7 acceptance requires real multi-song listener records; neither aggregation code nor CI establishes improvement. User has postponed listening until full M-series technical completion.
5. Verify latest HEAD CI 9/9 and real Safari playback separately, only with user approval for a permitted deployment.

## Next implementer order
- Verify pending latest-HEAD workflows, inspect and fix failures immediately.
- Reconcile M1 modules with actual rendering and explicit section/motif references, then expand integration/coverage.
- Close M3/M6 acceptance criteria through tests and documented evidence.
- Ensure ablation and aggregate APIs are accessible in UI/file export without breaking existing four-way controls; test fixed-seed/volume alignment.
- Prepare a final comparison-session fixture; after all technical gates, request one user listening review and leave Draft PR unmerged and undeployed until separately authorized.

Never merge or deploy on this handoff alone.
