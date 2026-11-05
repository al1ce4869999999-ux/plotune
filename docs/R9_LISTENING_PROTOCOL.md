# R9 — 全曲統合・盲検聴取評価 (開始版)

## 固定する小目標
M7の4条件（Baseline / Phase / M / Phase+M）に研究改善OFF/ONを直交させ、同一seed・尺・編成・renderでA/B聴取できる比較契約を固定する。R1〜R8個別ablationは後続。R8が未完了のため音楽的採否は保留。

## ユーザーが通る利用経路
生成画面 → 4条件の同seed音源を研究OFF/ONでそれぞれ生成 → A/B提示順をblind割当 → ブラウザ内で再生/シーク → 回答保存 → 対応のある分析。現在の変更は割当・入力検証のみで、音源生成/UI/回答保存は未接続。

## 実験の不変条件
- R0固定baselineを壊さない。既存4条件は維持。個別研究flagをOFFにした基準生成を別扱いする。
- 同じseed・尺・conditionIdをペアとし、research OFF/ON以外を固定する。
- 同一レンダラ/サンプルレート/楽器構成を要求。ラウドネスの調整は両条件で同一規則、クリッピングや波形改変を記録する。
- A/Bは被験者に研究条件を伏せ、順序をseedから決定的に割り当てる。提示順による偏りは解析時に点検する。
- 差異の有無 (boolean)、好み (A/B/tie)、自然さ/感情の複雑さ/主題再認/変奏の新鮮さ/主旋律明瞭性/境界の説得力/全曲まとまり/再聴意欲 (各A/B 1〜5)。
- 客観的notes/MIDI指標とPCM音響指標は別集計。自動指標だけで音楽的改善を宣言しない。
- 順序割当が完全な均衡化を保証するわけではない。実験時にカウンターバランスを確認。
- 他seedと楽曲内容の多様性、複数聴取者、盲検結果が必要。

## この変更
- `r9-listening-protocol.js`: 純粋な割当と回答スキーマ検証。生成RNG非消費・音符/PCM非変更。
- `tests/r9-listening-protocol.test.cjs`: 4×3×3、順序決定性、重複・欠測・異常値の拒否。

## 影響しそうな既存テスト
`tests/m7-real-engine.test.cjs`, `tests/transition-optimization-r8.test.cjs`, `tests/r0-m7-integration.test.cjs`, `tests/r4-m7-real-engine.test.cjs`, `tests/preflight-contracts.test.cjs`。R9新規ファイルはまだ生成経路を変更しない。

## 判定ゲート
1. 割当単体テスト成功。
2. research OFF/ONの実notes・PCMを4条件×複数seed・尺で生成し、hash・決定性・R0固定baselineと照合。
3. A/B UIに音源・blind ID・回答保存を接続し、Safari実機で再生/シーク・終了を確認。
4. ラウドネス一致、提示順、複数seed・複数曲を監査。
5. 聴取差異・好み・全8軸を集計し、効果不明/悪化も報告。個別ablationを判定。
6. CI、実機、聴取を別ゲートで記録。マージ/デプロイはユーザー承認後。

状態: 初期プロトコル実装（未実行）。R9全体は未完了。
