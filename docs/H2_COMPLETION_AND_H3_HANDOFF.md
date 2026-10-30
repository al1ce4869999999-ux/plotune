# H2 和音と主旋律の整合性 — 完了判定とH3引き継ぎ

## H2の目的
主旋律のモチーフ度数と和音相対度数を区別し、和音の根音を主旋律へ機械的に加算しない。非和声音を分類し、意図した不協和は残し、強拍衝突を診断して主旋律を改変するより和音候補を比較する。H2は独立ON/OFFであり、OFFはH1出力と完全互換とする。

## 実装
- `m3-harmony-melody-v01.js`: `h2Classify`（passing, neighbor, suspension, appoggiatura, anticipation, intentional dissonance, collision）および `planH2`（モチーフを変更せず和音候補を比較）。
- `handheld-v21.js`: `h2HarmonyAlignment` 独立フラグ。ON時は主旋律への `chord` 加算を外し、OFF時は旧式を維持。
- `tests/m3-harmony-melody.test.cjs`: H2分類、決定性、モチーフ保持、15/30/60秒のOFF互換を追加。
- `tests/m3-harmony-ab-ui.test.cjs`: H2独立フラグに合わせたM3の既存契約を維持。

## 検証記録
- 2026-10-30: Node v22.16.0でローカル11ファイルを個別実行。11/11 PASS。
- 対象: engine, h0-diagnostics, h0-real-engine, m2-emotion-phrase, m3-harmony-ab-ui, m3-harmony-melody, m4-voice-dialogue, m5-performance, motif-phrase-integration, motif-planner-v01, motif-score-integration。
- 15/30/60秒のH2 OFF音符列・PCMのバイト一致は前段のローカル比較で一致と記録済み。今回の11テスト再実行ではPCM比較を再実行していないため、結果を混同しない。
- GitHub Actionsは起動していない。mainへのマージとデプロイは行っていない。
- 実機のH2 ON聴感評価は未実施。音楽的な良さの保証とは区別する。

## 完了判定
H2の実装・既存関連回帰は完了。ブランチをH3の開始点として維持する。mainへの統合と公開はユーザーの承認を待つ。

## H3引き継ぎ
開始ブランチ: `feature/h2-harmony-melody-alignment`。
目的: 和音の時間的連続性、局所調性と転調の境界を明示し、H2で維持した主旋律・非和声音の意味を壊さずに複数小節の和声遷移を選択する。
1. H2の和音候補診断とモチーフ度数を入力に使い、複数小節をまたぐ遷移コストを追加。
2. 調性領域IDと転調候補を明示し、無根拠な転調を避ける。
3. H3独立ON/OFFを設け、OFFでH2と15/30/60秒の音符列・PCM完全一致を要求。
4. Node/jsdomの既存テスト形式に従い、境界、決定性、回帰、既存H0固定baselineを検証。
5. GitHub Actionsは使用しない。mainマージ・デプロイは承認まで行わない。
