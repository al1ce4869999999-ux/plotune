# R1 MotifSimilarityEvaluator handoff

## Scope
Diagnostic-only evaluator: no generation change and no R4 candidate selection.

## Public API
Load `motif-similarity-r1.js` then call `PlotuneMotifSimilarityEvaluator.compare(motifA,motifB,options?)`. Accepts `events` in M1 motif form, M7 `notes`, or an event array. Returns `version`, `metrics`, `diagnostics`, and `configuration`. Run through R0 `PlotuneResearchEvaluation.evaluate((score)=>...,score,plan,context)` for safe fallback and trace recording. Missing accents produce `accent: null`.

## Interpretability
- contour: ascending / flat / descending interval direction
- interval: signed pitch distance, compared on a tunable scale
- rhythm: normalized onset positions, invariant under uniform tempo scaling
- anchor: explicit marked anchors or first/last sounded note; transposition invariant
- range: pitch-span comparison
- accent: recorded amplitudes only; omitted if no comparable accents
- transport: normalized onset + relative pitch correspondence, invariant under uniform transposition and uniform tempo scaling
- absolutePitch / absoluteOnset: sensitive to transposition / timing respectively
- transposedPitch: pitch sequence after relative transposition
- restPattern / coverage: rests and unmatched fragments

## Limitations
Heuristic scales are hypotheses, not empirically validated perceptual weights. First-note alignment penalizes offset motifs, motif fragmentation and reordered phrases. Bar metadata does not currently change alignment. No musical-quality improvement is claimed.

## R2a
Use real scored motifs and controlled transformations to measure false-positive/false-negative behavior. Preserve per-feature diagnostics and uncertainty instead of collapsing into one quality score. R4, not R1/R2a, owns candidate selection.

## Regression contract
`node tests/motif-similarity-r1.test.cjs`, `node tests/r1-m7-diagnostic.test.cjs`, `node tests/r0-m7-integration.test.cjs`. The 4 M7 conditions at 15/30/60 seconds must retain exact frozen note/PCM hashes.

R0-R9: no merge to main, no deployment. Safari and listening are separate and unverified.
