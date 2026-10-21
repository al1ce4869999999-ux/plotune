# Phase 1–4 Safari validation gate (2026-10-22)

## Implemented
- Deterministic form, section tension and density planning
- Motif A/B and section-aware repeat/variation/contrast/return
- Opt-in joint melody-anchor / functional-chord scoring in handheld generator
- Section-aware counterline, arpeggio, percussion, sparkle and chord activity
- Legacy path unchanged by default; `?compositionV1=1` enables new path
- Node structural regression scripts and GitHub Actions workflow

## Verification status
- GitHub commits saved, draft PR #23 open
- GitHub workflow runs and combined statuses were empty at inspection; CI passing **not established**
- iPhone Safari playback, exported audio, audio quality, and production deployment **not verified**
- No merge to main, no public Pages deployment

## Safari gate
After CI passes and a Preview URL is available, use identical style, character, scene and seed with the URL flag off/on. Check:
1. Playback starts after tapping play and can stop/restart without glitches.
2. Compare handheld, music box and ocarina presets, including 15/30/60 seconds.
3. Main melody has audible return after contrast, not only different note density.
4. Harmony agrees with lead on strong beats and resolves at the end.
5. Instrument entrances follow section function; no masking or overload.
6. WAV export, duration, loop boundary and repeated-seed determinism.
7. Capture failing URL, style, seed, time and audible symptom in Issue #22 or a new issue.

## Known gaps
- The hierarchical planner currently applies only to the handheld score when opt-in.
- Band and piano still use legacy composition routes.
- Motif transformation uses a first-pass heuristic, not a validated optimization search.
- No automatic listening-quality metric can replace Safari A/B.
- Preview deployment is required before the user can open the branch build on iPhone.
