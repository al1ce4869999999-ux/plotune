# Phase 0: existing composition routes and baseline contract
Date: 2026-10-22. Branch: feature/composition-plan-phase1

## Entry and routing
- index.html loads analyzer, Resonare, generic composer, loop arranger, band, band+piano, handheld, and app-v13.js.
- app-v13.js form() reads title, character, world, scene, style, duration, engine, bandStyle, gameStyle.
- analyze() invokes PlotuneAnalysis.analyze/plan(input,variant), then PlotuneResonare.analyze/attachPlan. The two arms here compare **analysis/arrangement** (classic vs Resonare), not composition algorithm.
- renderer(plan) dispatches genre=band -> PlotuneBand, bandpiano -> PlotuneBandPiano, game -> PlotuneHandheld, everything else -> PlotuneComposerV4.
- Band routes: adaptPlan -> PlotuneLoop.baseline/reactive -> score -> render. Genre-specific parts: guitar/bass/drums; bandpiano adds piano unison.
- Handheld route: prepare(original or enhanced,gameStyle,appraisal,...) -> score -> render. Parts: lead, counter, chords, arp, bass, percussion, sparkle/pad. Story structure and psychology feed the plan. The hierarchical compositionV1 option is currently only applied here.
- Generic route: PlotuneComposerV4.buildScore -> render; covers chip, pop, piano, horror, fantasy, ambient and auto-resolved non-band/non-game genres. Instrument and rhythm differences are selected internally by genre.
- The old/new composition-engine A/B UI separately renders the *same prepared handheld plan* with compositionV1=false and compositionV1=true. It is distinct from classic/Resonare.
- Sound generation is browser-local Web Audio from synthesized Float32 PCM; output is mono 22050 Hz for the inspected renderers. WAV conversion is local. Browser gesture and Safari playback are separate acceptance gates.

## Input/output contracts
- PlotuneAnalysis.plan outputs genre, mode, bpm, duration, characterSeed, seed, progression, phrases, sections, root and analysis.
- PlotuneResonare.attachPlan adds event and intensity metadata; does not replace the synthesis renderer.
- Renderers expose score/buildScore and/or render; render(plan) returns {samples:Float32Array,sampleRate,score,details}. Score event layouts differ by renderer and must not be assumed interchangeable.
- Band/handheld use loop-oriented duration/measure quantization and tailored synthesis; generic uses its own event and synthesis path.
- All four inspected renderer modules use local seeded PRNGs, not Math.random. The seed is derived by analyzer from character and scene inputs, plus variation index. This is an architectural finding, not a claim of bit-exact cross-browser audio.

## Exceptions and migration risks
| Route | Distinct musical/synthesis rules | Shared hierarchical engine |
| --- | --- | --- |
| Generic (chip/pop/piano/horror/fantasy/ambient) | Generic event score, genre-conditioned synth and rhythm | No |
| Handheld/DS | Seven-role ensemble, instrument palettes, game styles, story arc and section dynamics | Opt-in only |
| 3-piece band | Guitar, bass and drums; whole-story loop adaptation and instrument event seeds | No |
| Band+piano | Band rules plus piano unison | No |
| Ocarina/flute/music-box character presets | Handheld palette/style variations; specific articulation depends on preset | Only if using handheld opt-in |
| Classic vs Resonare | Different narrative appraisal/arrangement arm, not different synthesis engine | Independent axis |

## Frozen reproducible fixtures
- Fixture inputs live in scripts/phase0-fixtures.cjs. They cover generic, band, bandpiano, handheld and handheld legacy/hierarchical at fixed input and variation.
- CI runs scripts/test-phase0-baselines.cjs and compares two independently generated score outputs for each fixture. This protects deterministic event generation; it does **not** yet freeze historical score hashes or verify acoustic quality.
- Before modifying any existing composition route, add a reviewed score fingerprint fixture from an identified commit and record the intended before/after difference. A same-run repeatability check alone is insufficient for historical regression.
- Open issues: real Safari playback, historical score fingerprints, music-box/flute preset-by-preset constraints, and whether any alternative page bypasses the main router.

## Completion boundary
This document completes the source-level Phase 0 route/input/output inventory for the main app and adds reproducible fixed-seed fixtures. Historical snapshot locking and browser-level verification remain separately tracked; do not equate inventory completion with Phase 1–6 quality acceptance.
