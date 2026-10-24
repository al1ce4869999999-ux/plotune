# R6 → R7 技術引き継ぎ（検証中）

## 小目標
同一seedの作曲でR6 ONのとき、R5のsymbolic評価を根拠に編曲候補を比較して実notes/PCMへ反映し、OFFではR5までの生成結果を変えない。

## 基点
R5 HEAD a5ec25cb9d125ea98967a4f93b47c631a5fede12。R6 feature/r6-arrangement-optimization、Draft PR #85、Issue #84。マージ・デプロイなし。

## R6a 調査された実契約
handheld.score()のnotesはt/d/midi/voice/role/volume。wholeTrackArcのstageはopening/development/climax/resolution。R5評価器はscore,plan,contextを受け取る。M3で和声、M4で対話/ducking、M5で演奏加工したあとにR6を接続。render()はscore()の結果をPCM化。instrumentChoice.paletteの既知音色だけtimbresとして渡す。声部名は音響特性を保証しない。R6候補RNGは使用しない（候補順序・操作は決定的）。

## R6b/c 現行選択
既存編曲、duck、stagger、register、sectionalの5候補。5要素のsection goalをtraceに保持。R5の8指標を候補ごとに記録し、quality gate→scoreの順に比較。前景明瞭性、競合、音域、入退場、密度・継承のproxyを記録し、climaxでは明示的対比を許す。音響マスキング/実際の聴感は測定しない。失敗時は既存notesを保持。

## R6d 統合
フラグ musicArrangementOptimizationR6===true でのみ、render前のscore後段に適用。R5評価器は読み取り専用のまま。R0 fixtureは不変。

## 影響する既存テスト
arrangement-perception-r5、r4-m7-real-engine、r3-m7-real-engine、r0-m7-integration、motif-similarity-r1、m2-emotion-phrase、preflight-contracts、engine tests。

## R7への残課題
R6候補の各セクション独立最適化、前セクションとの選択継承、意図的な強対比の定量ゲート、Phase3境界ごとの候補配置、R9聴取評価で音響・音色の心理的妥当性の確認。R6は総合CIおよび実notes/PCM差分の証拠確認までは完了扱いにしない。
