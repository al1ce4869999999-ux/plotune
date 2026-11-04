# H3 implementation record / H4 handoff (provisional)

Date: 2026-10-30. Base H2: `99665823a882be9431ec46447ca049b4b20fcc2d`.
Branch: `feature/h3-harmonic-continuity`. Do not merge to main.

## Implemented (source changes, not yet validated)
- `m3-harmony-melody-v01.js`: `planH3` multi-bar deterministic bounded beam search (default width 12), voice-leading, H2 non-chord diagnostics, tension/release, phrase-cadence preferences, harmonic rhythm and repetition costs.
- Tonal-region ledger: stable `regionId`, `keyOffset`, local/global chord degree, `phase`, transition reason, bar.
- Dominant-related modulation limited to four-bar section boundaries with explicit melody-evidence thresholds, preparation region, return eligibility and dwell requirements. No random modulation.
- `handheld-v21.js`: `h3HarmonicContinuity` opt-in, H2-preserving OFF path, ON diagnostics in `score.details.h3`. H3 implies H2's no-chord-root-addition path for the lead.
- `tests/h3-harmonic-continuity.test.cjs`: motif immutability, determinism, region mapping, OFF note/harmony comparisons at 15/30/60 seconds, independent opt-in.

## Follow-up H3 search correction
- Added repeated-chord streak penalty so a high local note-fit does not force the same root through an entire phrase.
- Added beam-state diversity keyed by local tonic, phase, tenure, last chord and repetition streak, retaining distinct tonal hypotheses.
- Inspected isolated planner execution through the GitHub-connected JavaScript runtime (NOT Node and NOT full existing tests): 16-bar representative input yielded chords `4,4,4,4,0,4,4,4,0,4,4,4,0,4,4,0`; repeat call produced the same serialized planning output. The example stayed in global key 0 throughout; it does NOT demonstrate successful modulation.
- The 4-degree key offset currently represents a diatonic tonicization within the original scale. Real chromatic-key modulation/tonic establishment is **not implemented** and must not be called verified H3 modulation.
- Impacted existing tests: `tests/m3-harmony-melody.test.cjs`, `tests/m3-harmony-ab-ui.test.cjs`, `tests/engine.test.cjs`, `tests/h0-diagnostics.test.cjs`, `tests/h0-real-engine.test.cjs`, `tests/motif-phrase-integration.test.cjs`, `tests/motif-planner-v01.test.cjs`, `tests/motif-score-integration.test.cjs`; new `tests/h3-harmonic-continuity.test.cjs`.
- Local Node v22.16.0 is available in the tool container, but the repository could not be cloned because GitHub DNS lookup failed. Node repository tests and PCM rendering remain unexecuted.

## 2026-11-04 continuation — evidence and limitations
- Added chromatic **G-major** dominant-related region for original major mode: `keySemitones=7`, `keyScale='major'`, a local chord-degree ledger, and region-aware accompaniment rendering. H1 lead events and motif degrees stay unchanged. Minor-key modulation is intentionally disabled rather than pretending a nonchromatic offset constitutes modulation.
- Added forced structurally prepared tonic return at a 4-bar boundary near the ending when incoming notes strongly support the home tonic. A 24-bar synthetic fixture with leading dominant-region evidence produced key-region offsets: 4 bars in home, 16 in dominant, 4 in home. The stated example is a synthetic control, not a listening result.
- H3 OFF direct comparison against H2 commit `99665823a882be9431ec46447ca049b4b20fcc2d`: under identical scenario and preset, **15s / 30s / 60s notes, harmony and raw Float32 PCM bytes identical** (V8 runtime loading repository JavaScript through GitHub connector). PCM byte lengths: 1,323,000 / 2,646,000 / 5,292,000; first mismatched byte: none in all three.
- The comparison used a V8 JavaScript execution environment, **not a local Node checkout**, and covered one deterministic scenario per duration. Full multi-seed compatibility and existing Node suite remain pending.
- Added H3 test fixtures for chromatic region transition, prepared return and PCM comparisons (`tests/h3-harmonic-continuity.test.cjs`); the Node test file remains **unexecuted**.
- Current key evidence is a conservative heuristic over original diatonic melody degrees. Accidental-aware melodic composition, mode-changing modulation, orchestration of every specialized palette and human listening evaluation remain future design/validation tasks.

## Not yet verified / blockers
- Required formal `docs/HIERARCHICAL_TONAL_HARMONY_IMPLEMENTATION_PLAN.md` is absent from the H2 branch tree. The H2 completion/handoff note exists. Reconcile with the authoritative plan before final approval.
- Node tests **NOT RUN** in the present environment: repository checkout unavailable, and GitHub connector does not provide a local Node execution environment.
- One reference scenario each at 15/30/60 seconds passed a **direct H2 commit versus H3 OFF byte comparison in V8**. The Node test harness and wider seeds/presets remain **NOT RUN**.
- All affected baseline/related tests and H0 fixed baseline **NOT RUN**; H3 ON listener tests **NOT RUN**.
- Actual modulation and tonal establishment quality remain to be measured; tonal-region metadata does not by itself demonstrate musically convincing modulation.

## Required next verification (no GitHub Actions)
1. Fetch branch in local Node environment; run `node --test tests/h3-harmonic-continuity.test.cjs`.
2. Run existing related files: `engine`, `h0-diagnostics`, `h0-real-engine`, `m2-emotion-phrase`, `m3-harmony-ab-ui`, `m3-harmony-melody`, `m4-voice-dialogue`, `m5-performance`, `motif-phrase-integration`, `motif-planner-v01`, `motif-score-integration`.
3. With equal inputs/seed at 15/30/60 seconds, compare H2 vs H3 OFF notes and PCM as raw bytes; record digests and result. Verify H0 fixed baseline.
4. Check H3 ON genuine tonal transitions, melodic continuity, nonchord functions and determinism on representative seed/melody pairs. Compare listening samples.
5. Fix any failures without relaxing existing contracts, then record commands and outcomes here.

## Completion decision
**H3 NOT COMPLETE** pending authoritative plan reconciliation, full local Node regression/H0 baseline and proper multi-seed musical/tonal evaluation. The 15/30/60 single-scenario PCM equivalence evidence is recorded above.
H4 must not assume H3 is technically complete.
