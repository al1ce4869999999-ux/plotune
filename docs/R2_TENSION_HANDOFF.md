# Plotune R2 多成分緊張 — 実装引き継ぎ

対象PR: #73（base: feature/r1-motif-similarity）。R9までmainへマージしない。

## 実装契約

- R2a `PlotuneTensionR2a.plan` は emotionTrajectory と六成分の tension target を独立に保持する。欠損は null。旧 `tensionTarget` を保存し、恣意的な再マッピングはしない。
- R2a `evaluate(score, plan)` は調性・期待・リズム・密度・音色・強弱の**象徴的代理指標**と診断を返す。聴取上の緊張そのものではない。
- R2b `assess` は実測がない成分を unknown とし、差分は既知の成分のみで計算する。
- R2b `harmonyCandidate` の tonal は前和音との全音階ルート移動。調性安定度・不協和音の実測ではない。
- R2b `realized` は生成後の音符をセクション単位で再測定し、評価の異常をセクション別に安全回復する。
- `musicTensionR2:true` + 有効な `tensionPlan` が診断とM5の明示的dynamic制御を有効化する。
- `musicTensionR2Selection:true` を追加すると、既存M2/M3候補を緊張目標で再順位付けする。既存音楽スコア最良値から既定0.25以内のみを採用対象とし、測定値がなければ既存候補へfallback。通常OFF。R4のidentity×novelty選択は未実装。
- 既存M7の四条件と既定生成経路は変更しない。通常出力のノート・PCM固定baselineを維持する。

## 主なCIゲート

- `tests/tension-r2a.test.cjs`: 六軸、旧schema、未測定、RNG非消費
- `tests/r2a-m7-diagnostic.test.cjs`: M7四条件×15/30/60秒と既存PCM/notes hash
- `tests/tension-r2b.test.cjs`: M2/M3候補評価、選択フラグ、スコア予算、終止
- `tests/r2b-score-integration.test.cjs`: 実生成診断のみのOFF/ON、非破壊性
- `tests/r2b-dynamics-pcm.test.cjs`: 同一感情で異なる強弱目標、PCM差分と旋律保持
- `tests/r2-realized-sections.test.cjs`: 生成後セクション測定・fallback・画面script読み込み
- `tests/r2-m7-real-engine.test.cjs`: M7実PCM差分、決定性、和声選択、R2選択フラグ

影響既存テスト: `tests/emotion-plan-phase1.test.cjs`, `tests/m2-emotion-phrase.test.cjs`, `tests/m3-harmony-melody.test.cjs`, `tests/m5-performance.test.cjs`, `tests/m7-real-engine.test.cjs`, `tests/r0-m7-integration.test.cjs`, `tests/preflight-contracts.test.cjs`。

## 非ゴール・未確認事項

- 代理指標の大小が音楽的な優劣を示すという主張はしない。
- 調性（キー・和音機能）、R3の確率的期待、音色混合の知覚モデルはまだ導入されていない。
- R4の主題同一性・新規性の候補選択は別工程。
- CI成功、Preview、iPhone Safari、聴取評価、音楽的改善判定は分離する。
- 正式な音楽的採否はR9の複数seed・ブラインド比較まで保留。

## 保護事項

- `main`・Production・Preview・本番データの変更なし。PRはDraft。
- R2bの候補ランキングは既定OFFで保存する。既存M7比較UIの四条件に自動付与しない。
