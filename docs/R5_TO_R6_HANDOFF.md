# Plotune R5 → R6 引き継ぎ（CI完了判定前）

## 基点
R5 development branch `feature/r5-arrangement-perception`、Draft PR #82、Issue #81。R4 PR #80は未マージ。マージ・デプロイ禁止。

## R5評価インターフェース
`PlotuneArrangementPerceptionR5.evaluate(score,plan,context)` は診断専用。結果は `score.details.arrangementPerceptionR5`。独立フラグ `musicArrangementPerceptionR5`。R0 researchEvaluationsにもsummary。8つの値と event/bar/phrase/section/song trace、入退場と観測根拠を提供。記録される各値は知覚のproxyであり、音響マスキングの測定ではない。

## R6側の計画契約（提案・未実装）
Phase 3は `foregroundRole`、`blendTarget`、`densityTarget`、`registerTarget`、`continuityTarget` を提供。編曲候補を固定した同一seedのもとで複数生成し、R5 metrics と意図から選択コストを構成する。強い対比や hard-cut は明示的な意図があるとき許容。楽器数と密度を同一視しない。先に候補の品質ゲートをかけ、ゲート未達なら旧編曲を返す。候補比較RNGは音源生成RNGと分離。R6で初めて音・編成が変わる。

## R6着手前ゲート
R5専用/総合CI SUCCESS、全4条件×15/30/60秒OFF/ONのnotes・PCM一致、固定R0 baseline、R0〜R4回帰、R5 trace根拠とfallbackの検証。Section実境界や音色特性が不足した状態をproxyとして明記。音楽的評価はR9に保留。
