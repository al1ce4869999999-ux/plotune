# M0-1 既存資産・公開契約の棚卸し

2026-10-22 / 対象: `feature/m0-inventory-contract`（`docs/parallel-phase-m-roadmaps`起点）
状態: **静的調査完了、実行・CI・Safari・聴取は未確認**

## 根拠と現行の入口

- `index.html:69-81` は `analyzer.js`、`resonare-v08.js`、`composer-v04.js`、`loop-arranger-v09.js`、`band-v09.js`、`band-piano-v15.js`、`comparison-v13.js`、`story-structure-v01.js`、`music-psychology-v01.js`、`melodic-grammar-v01.js`、`handheld-v21.js`、`generation-trace-v01.js`、`app-v13.js` 等をブラウザのscriptで読み込む。
- `app-v13.js` は `window.PlotuneComposerV4` / `PlotuneBand` / `PlotuneBandPiano` / `PlotuneHandheld` を読み取り、`genre` でrendererを選ぶ。作曲開始は `generate`（167行付近）。
- `index.html:135` の `emotionComposition` は既存Phase 1の通常音源向けON/OFF。Mの機能フラグとして**流用しない**。
- `index.html:182` の `generationTrace` は既存UIログのDOM ID。`app-v13.js:251-252` が更新するため、M用ログで直接上書きしない。

## 既存機能の利用方針

| 領域 | 確認した実装 | Mラインの方針 |
|---|---|---|
| 動機・フレーズ | `melodic-grammar-v01.js`: `PlotuneMelodicGrammar.grammar`, `phrase`, `composePhrase`。4小節の動機記憶を `options.motif` で参照し、stageで一部変形 | **拡張**。現行の変形は移高/音価・終止中心。M1で反行・拡大縮小・断片化を別実装し、旧経路は維持 |
| 長期主題・ゲーム曲 | `handheld-v21.js:265,329-334` に既存主題と共有フレーズ、`:860` に `motifDevelopment` 表示 | **再利用**。表示文言だけでは音楽的変形の根拠にしない |
| 感情 | `composer-v04.js:43` が `emotionComposition===true` の時だけ `emotionPlan.sections` を読む | **再利用・接続**。感情単語→音程固定対応は採用しない |
| 和声 | `composer-v04.js` の `harmonyAt`、`handheld-v21.js:297-338` の進行とフレーズ参照 | **拡張**。M3の共生成は未確認のため完了扱いにしない |
| 声部・編曲 | handheld内のlead/counter/chords/arp/bass、`band-v09.js`、`band-piano-v15.js` | **再利用**。Phaseの楽器入退場計画とMの声部生成を分離 |
| 音声レンダラー | `PlotuneComposerV4.{buildScore,render,wavBlob}`、`PlotuneBand.{adaptPlan,score,render,wavBlob}`、`PlotuneBandPiano.{adaptPlan,score,render,wavBlob}`、`PlotuneHandheld.{prepare,score,render,wavBlob}` | **保持**。M0で変更しない |
| 生成ログ | `generation-trace-v01.js` と `app-v13.js` の表示経路 | **拡張予定**。Mでtrace契約を別定義後、UIと接続 |

## M0-2/3へ引き継ぐ最小契約案（実装前）

- 既存 `emotionComposition`、`engine`（classic/resonare）の意味を変更しない。
- 別の明示的な `musicDevelopment` フラグ（初期値false）をMの入口に設ける。**現時点では未実装**。
- `SectionPlan` から受け取る値は `sectionId`、`motifReferences`、`emotionTarget`、`cadenceTarget`。共通契約確定までは推測したAPIで他モジュールを改修しない。
- M1の動機登録データは `motifId`、`pitchIntervals`、`rhythmPattern`、`accents`、`harmonicContext`、`variationHistory`。楽曲構造の所有権はPhaseに置く。
- 旧経路比較の固定条件は同一入力・同一seed・編成・長さ・レンダラーとし、Phase OFF/ONとは**独立したM OFF/ON**を後続タスクで実装する。

## 品質ゲート・未解決

- この差分は**文書のみ**。公開API、HTML、JS、音源に変更なし。
- 影響しそうな既存テスト: `tests/preflight-contracts.test.cjs`、`tests/ui-v13.test.cjs`、動機/フレーズ、感情アーク、楽器編曲、音源出力の既存テスト（後続で実ファイル名を確定）。
- 検証: ソース静的確認のみ。Nodeテスト **未実行**、GitHub Actions **未確認**、Preview **未確認**、Safari **未確認**、聴取 **未評価**。
- 次: M0-2で固定seedの旧・Phase ON/OFF比較条件を追跡し、M0-3で最小の独立フラグとschemaを追加。実装変更前にCI設定と実テスト名を確認する。
