# Plotune R4 → R5 引き継ぎ（暫定・技術完了未判定）
更新: 2026-10-24

## 開発状態
- R4ブランチ `feature/r4-identity-novelty`; 基点 R3 `ce2c28117b03e9dcc3b84f848e6a45176b071614`（PR #78 は未統合）。
- Draft PR #80、Issue #79。マージ・デプロイ禁止。
- R4a: `identity-novelty-r4.js`。R1特徴から主題同一性を独立評価し、変形要因による新規性を別尺度とする。仮説的な役割別band。
- R4b: `identity-novelty-r4b.js`。M2候補集合に品質・終止・帯制約を適用し、適合候補がなければ旧結果にfallback。
- `handheld-v21.js` で原主題のスナップショット、section role、traceを接続。`musicIdentityNoveltyR4` と `musicIdentityNoveltyR4Selection` は独立flag。
- `tests/identity-novelty-r4a.test.cjs`、`tests/identity-novelty-r4b.test.cjs`、`tests/r4-m7-real-engine.test.cjs` と専用CI。
- **未確定:** 実rendered notes/PCMの差分・セクション役割別の選択変化・全4条件×15/30/60秒の成功・R0 baselineのCI結果。CIで確証後にIssue #79を更新すること。

## R5の作業対象
R5 ArrangementPerceptionEvaluator は score-only とする。前景明瞭性、register overlap、同時オンセット、アクティブ声部数、密度、role conflict、blend fit、instrument change distanceを音符・楽器別traceから評価。スペクトルマスキングはシンボリック代理指標と混同しない。R0/M7音・RNG完全不変、同一seedの決定性、4条件回帰を確認。

## R5着手の前提
R4技術完了は、PR #80の全CIと実エンジン差分、参照主題の全曲継承trace、既存品質fallbackの十分な反例まで確認した後に判定。CIは音楽的改善の根拠にはしない。R9聴取評価まで音楽的採否保留。
