# R7 → R8 技術引き継ぎ（R7 CI結果未確定）

## 正式スコープ
正本 `docs/RESEARCH_DRIVEN_PHASE_IMPROVEMENT_PLAN.md` は `docs/research-driven-phase-improvements` ブランチに存在。§9でR7はPhase 4 `TransitionPlan` と境界のscore-only診断、R8が接続候補選択・境界前後1〜2 phraseの実音修正を担当。2026-10-25のR7引き継ぎで要求された全曲編曲アーク・notes/PCM変更はこの正本と矛盾。Issue #86で差分を記録。

## 実装
- R6 HEAD e00a8d0613ae3e7a6da0056c313855bd1e8ba062 を親とする `feature/r7-arrangement-arc`。Draft PR #87（R6ブランチ宛）。
- `transition-evaluation-r7.js`: wholeTrackArc の実stage変化から境界を生成。from/to・境界目標・closure・continuity・surprise・保持/変更すべき要素・previewChannels・breathWindow を計画。選択対象の存在しない和音終止やmotif IDは観測しない。
- `musicTransitionEvaluationR7===true`: score() のR6後段・R5評価の前に診断traceを追加する。R6 flagsとは独立し、既存notesとPCMを変更しない。
- trace: 入退場の声部、境界前後の発音イベント密度、境界横断音、声部継続、symbolic境界顕著性、目標差、意図されたhard contrastと不自然断絶の区別。
- R7のターゲット値はPhase 4 intentが実データにない場合のstage heuristicsであり音響指標や心理音響的確定値ではない。
- Arc欠損・不完全時は推測で偽の境界を作らずfallback。

## R8への具体的課題
1. Phase 4から明示的な境界意図（`TransitionPlan` 目標）を受け取れる契約にする。stage推定値との区別を維持。
2. COMMON_TONE / MOTIF_PREVIEW / RHYTHMIC_BRIDGE / BASS_LEAD / TEXTURE_DOVETAIL / CADENCE_BREATH / SUSPENSION / HARD_CUT を候補とし、実装可能なものを品質ゲート付きで限定導入。
3. R7の診断を事前評価に使い、境界前後1〜2 phraseのみを変更。実Notes・PCMの変更範囲と未変更セクションのhashを記録。原motif IDやR6編曲を破壊しない。
4. M2終止 / M3和声 / M5呼吸 / M6修正との競合を検討。強い境界は一律に減点しない。
5. 独立 `musicTransitionOptimizationR8` フラグ、決定性、RNG分離、fallback、R0固定fixture、M7 4条件×15/30/60、専用/総合CIと聴取は区別。
6. 評価値は仮説であり、音楽品質採否はR9まで保留。

## 影響回帰
`tests/transition-evaluation-r7.test.cjs`、`tests/arrangement-optimization-r6.test.cjs`、`tests/arrangement-perception-r5.test.cjs`、`tests/r4-m7-real-engine.test.cjs`、`tests/r3-m7-real-engine.test.cjs`、`tests/r0-m7-integration.test.cjs`、`tests/motif-similarity-r1.test.cjs`、`tests/m2-emotion-phrase.test.cjs`、`tests/preflight-contracts.test.cjs`。

## CIの扱い
R7専用workflows `.github/workflows/r7-transition-diagnostics.yml` を新設。SUCCESSを確認するまではR7技術的完了とは呼ばない。マージ・デプロイ禁止。
