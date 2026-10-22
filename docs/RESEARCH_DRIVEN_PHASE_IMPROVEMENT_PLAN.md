# plotune Phase 1〜4 研究駆動型音楽性改善 実装計画書

版: 1.0 / 2026-10-23
対象: `al1ce4869999999-ux/plotune`
位置づけ: 既存Phase 1〜4とM1〜M7を置換せず、研究に基づく評価器と候補選択を追加するRシリーズ。
関連: `PHASE_IMPLEMENTATION_PLAN.md`, `M_IMPLEMENTATION_PLAN.md`, `DEVELOPMENT_RULES.md`

## 1. 最終目標と責務

多様で複合的な感情を呼び起こし、主題の提示・発展・対比・回帰、楽器の入退場、緊張・解放、セクション接続に音楽的な因果関係を持たせる。

- Phaseライン: 曲全体の構造、感情と緊張の計画、主題参照、編曲役割、境界の意図を所有。
- Mライン: 具体的な動機変形、音符、フレーズ、和声、声部、演奏を所有。
- Rシリーズ: 計画と実現の間に評価・候補選択・診断を追加。まずscore-only/trace-onlyで導入し、効果検証後に生成へ接続する。
- 既存コードの実装済み/部分実装/未実装を棚卸しし、再実装を避ける。既存M6評価、M7比較基盤を優先再利用する。
- 同一seed、OFF/ON、既存のBaseline/Phase/M/Phase+Mの4条件、実エンジンのrendered notes/PCM検証を維持する。
- CI、Preview、Safari実機、聴取評価は別々の判定。マージ/デプロイは明示承認を得る。

## 2. マイルストーン

| 段階 | 対象 | 成果 | 音の変更 |
|---|---|---|---|
| R0 | 共通 | baseline・共通評価契約・GenerationTrace | なし |
| R1 | Phase 2 / M1 | MotifSimilarityEvaluator | なし |
| R2a | Phase 1 | 多成分TensionPlan計画・診断 | なし |
| R2b | Phase 1 / M2,M3,M5 | tension候補評価への接続 | あり |
| R3a | Phase 1,2,4 | ExpectancyEvaluator / IDyOM-lite | なし |
| R3b | Phase 1,2,4 | expectancy目標と候補評価の接続 | あり |
| R4 | Phase 2 / M1 | Identity × Novelty候補選択 | あり |
| R5 | Phase 3 | ArrangementPerceptionEvaluator | なし |
| R6 | Phase 3 / M3,M4,M5 | 編曲候補の知覚・継承コスト最適化 | あり |
| R7 | Phase 4 | TransitionPlan・境界評価器 | なし |
| R8 | Phase 4 / M2,M3,M5,M6 | 接続戦略と境界局所修正 | あり |
| R9 | Phase 1〜4 / M7 | 全曲統合・4条件＋研究OFF/ON聴取比較 | 比較のみ |

原則はマイルストーン単位のPR。R2/R3は計画・測定と生成接続で変更目的が異なるため分離。共通契約は先に統合し、同じファイルの並行編集を避ける。

## 3. R0 評価基盤

1. 実ファイル、公開API、Node/jsdomテスト、CI、feature flag、生成経路、M6/M7、4条件比較UIを調査。
2. 旧経路の同一seed/planでMusicScore、rendered notes、PCM、traceを基準化。
3. evaluatorを `evaluate(score, plan, context) -> metrics + diagnostics` として定義。計算専用、入力を変更しない、生成RNGを消費しない。
4. version付き評価結果とcandidate selection reasonsをGenerationTraceへ記録。
5. 評価失敗時は安全に既存生成を継続。

ゲート: score-onlyのOFF/ONでnotes/PCM完全一致、決定性、4条件比較の維持。影響テスト: `tests/preflight-contracts.test.cjs`（存在確認後）、seed、生成契約、MusicScore、PCM、trace、M7 UI。

## 4. R1 主題同一性

- contour、interval、rhythm/onset、anchor、range、accent、onset-pitch transportを特徴別に測定。
- 移調・速度変更に対する不変特徴と絶対特徴を区別。総合重みはsection role依存で、心理学的に確定した閾値として扱わない。
- fixtures: 完全一致、移調、リズム変奏、反行、断片化、無関係旋律、休符と小節境界。
- 初期は診断専用。ゲート: 特徴別理由が追える、生成音不変。影響テスト: M1動機、Phase 2参照、seed、trace。

## 5. R2 多成分緊張

- `emotionTrajectory` と `tensionPlan` を別軸にする。
- tension成分: tonal / expectancy / rhythmic / density / timbral / dynamic。単一tensionTargetとの後方互換を維持。
- R2a: plan/schema、実音からの代理指標、traceのみ。R2b: M3和声・M2リズムから段階的に候補選択へ接続し、残りを順次検討。
- ゲート: 同じ感情で異なる緊張機構を選べる、R2aの音不変、R2bの変更箇所をscore/PCMで確認。
- 影響テスト: Phase 1感情、M2フレーズ、M3和声、M5演奏、schema互換。

## 6. R3 期待・情報量

- 軽量なn-gram/IDyOM-likeモデルを導入。音程間隔、リズム、フレーズ境界を文脈として扱う。
- `IC=-log2(P(event|context))`、predictive entropy、surprise trajectoryを算出。未知イベントは平滑化/バックオフし有限値にする。
- モデルの学習コーパス、版、音楽様式を記録。高IC最大化を品質目標としない。
- R3aは評価専用、R3bは目標帯との適合度として候補選択へ接続。
- 影響テスト: M1/M2、Phase 1/4、seed、モデル版とtrace。

## 7. R4 主題展開候補選択

- Phase 2がstatement/variation/development/contrast/returnのidentityBandとnoveltyBandを指定。
- M1が既存の変形候補を生成し、R1/R3が類似性と情報量を採点。コピー過多、同一性喪失、section不適合を診断。
- 候補なし・閾値未達は旧方式へfallback。seeded tie-breakを使い、生成RNGを共有・消費しない。
- ゲート: 回帰で認識可能性、変奏で新鮮さを別々に聴取比較。影響テスト: Phase 2、M1/M2、4条件比較、trace。

## 8. R5〜R6 編曲の知覚

R5: register overlap、simultaneous onset、active voice count、note density、role conflict、foreground clarity proxy、blend fit、instrument change distanceをsymbolic scoreから測定。音声ベースのspectral maskingは別指標とする。生成音不変。

R6: Phase 3はforegroundRole、blendTarget、densityTarget、registerTarget、continuityTargetを計画し、Mラインの編曲候補を知覚的コストと前セクション継承コストでranking。楽器数と知覚的密度を区別。意図したhard contrastをcontinuity penaltyで禁止しない。

ゲート: 主旋律明瞭性・豊かさを別々に聴取評価。影響テスト: Phase 3、M3/M4/M5、楽器割当、音源、PCM。

## 9. R7〜R8 セクション境界

R7: `TransitionPlan` にfrom/to section、boundarySalienceTarget、closureStrength、continuityTarget、surpriseTarget、preservedFeatures、changedFeatures、previewChannels、breathWindowを定義。強い境界を欠陥とみなさず、意図との適合を評価。診断専用。

R8: COMMON_TONE / MOTIF_PREVIEW / RHYTHMIC_BRIDGE / BASS_LEAD / TEXTURE_DOVETAIL / CADENCE_BREATH / SUSPENSION / HARD_CUT を戦略候補とする。最初は既存Mラインで実現できる戦略から段階導入。境界前後1〜2 phraseを対象に局所修正し、無関係sectionのnotes/PCMとmotif IDを維持。

ゲート: smoothとhard cutを使い分け、自然さ・期待・劇的効果を聴取比較。影響テスト: Phase 4、M2終止、M3和声、M5呼吸、M6局所修正、seed。

## 10. R9 統合・採否

- M7のBaseline/Phase/M/Phase+Mを維持し、研究改善OFF/ONを独立して比較。必要に応じてR1〜R8を個別に切るablation。
- 同一seed、同一編成、同一render、ラウドネス調整、提示順ランダム化、複数曲。
- 聴取票: 差異の有無 / 好み / 自然さ / 感情の複雑さ / 主題再認 / 変奏の新鮮さ / 主旋律明瞭性 / 境界の説得力 / 全曲まとまり / 再聴意欲。
- 音符/MIDIの客観指標とPCMの音響指標を区別。metricの改善だけでは音楽的完了にしない。
- M7.1実エンジン接続・RNG独立性・M7.2比較UIの未解決事項を事前ゲートとして確認する。

## 11. 依存関係・実施順

`R0 → (R1, R2a, R3a) → R4`、`R2a → R2b`、`R3a → R3b`、`R0 → R5 → R6`、`R0 → R7 → R8`、最後に`R9`。R4の本格導入はR3aを利用できる状態になってから。R5/R7はR1〜R4と独立に開発可能。

## 12. 品質・変更管理

1. 実装前に既存コード・テスト・CIと重複機能を確認。
2. 変更ごとに小目標・対象ファイル・ユーザーが達成すべき操作（特に聴き比べ）をPRへ明記。
3. 影響しそうな既存テストを列挙し、既存Node/jsdom方式に合わせて回帰を追加。
4. score-only段階は生成結果の不変性、selector段階は狙ったrendered notes/PCM差分とOFF互換を検証。
5. CI結果、Preview操作、Safari実機、聴取結果を混同しない。未確認は未確認と記録。
6. Issue/PRに問題、再現、原因（確度）、修正、前後結果、未解決事項を記録。
7. 既存の良い曲を壊した場合はfeature flagで戻せること。マージ・デプロイは明示承認後。

## 13. 完了定義

- 実装完了: 変更と必要テストが揃う。
- 技術的完了: CI・決定性・旧挙動・4条件比較が成立。
- 比較準備完了: 実エンジンからscore/PCMが返り、UIで同条件再生できる。
- 音楽的改善: 複数seedの聴取で狙った音楽的効果が確認される。
- Rシリーズ完了: Phase 1〜4の統合と全曲聴取評価を通過する。

## 14. 研究根拠（代表）

- Lerdahl & Jackendoff, *A Generative Theory of Tonal Music* — 階層構造。
- Lerdahl, *Tonal Pitch Space* — 調性距離・緊張。
- Farbood (2012), *A Parametric, Temporal Model of Musical Tension* — 多成分緊張。
- Pearce & Wiggins (2012), *Auditory Expectation* — 情報理論的期待。
- Müllensiefen & Frieler (2007), *Modelling experts' notions of melodic similarity* — 旋律同一性。
- McAdams et al. (2022), *A Taxonomy of Orchestral Grouping Effects* — 編曲の知覚的グルーピング。
- Cella (2022), *Orchidea* — 編曲の制約最適化と継承。
- Hansen et al. (2021), *Predictive Uncertainty Underlies Auditory Boundary Perception* — 境界と期待。
- Yang & Lerch, *On the evaluation of generative models in music* — 自動評価と聴取の区別。

研究由来の指標は品質を保証するものではない。plotune自身の聴取結果で校正し、根拠が弱い重み・閾値は仮説として記録する。
