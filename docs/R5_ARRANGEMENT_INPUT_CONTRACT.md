# R5 編曲評価の入力契約と責務 (R5a)

## 調査対象
- `handheld-v21.js`: score(plan) は `{notes, drums, rests, harmony, theme, details, duration, bpm, sampleRate}` を返す。render(plan) は score を一度生成して PCM を合成し `{samples,sampleRate,score,details}` を返す。
- `notes`: `{t,d,midi,voice,role,volume}`（秒、MIDI音高、声部、音量）。多くのノートは add 内で stage 別の mix を適用する。
- `drums`: `{t,kind,volume}`（MIDI音高なし）。R5音高系指標には混ぜない。
- `M4`: lead/counter の応答と伴奏ducking（実notesの変化）。
- `M3`: 和声・旋律連動。R5は和声決定に介入しない。
- `M5`: ベロシティ/演奏と音価の後段加工。R5は評価時点の最終scoreを採用する。
- Phase 3: セクションの意図と編曲の入退場を所有。R5は良否最適化しない。

## R5入力契約
`PlotuneArrangementPerceptionR5.evaluate(score,plan,context)` は pure synchronous 評価。必須は score.notes と正の duration。notes 要素は有限数 `t,d,midi,volume` と voice を要する。bpm があれば小節の代理幅 `240/bpm` を使う。欠損したイベントは診断から除外し理由を記録する。

## 出力
`{version,status,kind:'symbolic-proxy',metrics,windows,phrases,sections,events,whole,entrances,diagnostics,limits}`。
8指標は混ぜずに公開。register overlapは他声部と時間的に重なる二音間の7半音以内比率、simultaneous onsetは35ms以内のアタック近接比率、active voiceは時間加重活動声部数、densityは時間あたり新規note、role conflictは同音域かつ相対音量の近い前景対、foreground clarityとblend fitは代理値、instrument changeは声部集合対称差。閾値は作業仮説であり心理音響的確定閾値ではない。

## 不足
- `voice` と実楽器プリセットの一意対応はない（役割名として扱う）。
- スペクトル/包絡/周波数帯別マスキングの測定値なし。
- 演奏ニュアンスは volume の単純近似であり知覚音量ではない。
- section 意図の厳密な境界IDは score に常に存在しないため暫定四分割を使用。Phase3の境界接続が将来必要。
- 楽器の物理的融合度はsymbolicから推定不能。

## 安全な導入
`musicArrangementPerceptionR5===true` のときのみ render前scoreの末尾にtraceを付ける。生成ノート、M4/M5、PCM、RNGを変更しない。R0の researchEvaluations に summary を登録し、詳細は details.arrangementPerceptionR5。M7全4条件/15・30・60秒の差分検証を行う。

## 影響する既存テスト
`r4-m7-real-engine`、`r3-m7-real-engine`、`r0-m7-integration`、`motif-similarity-r1`、`m2-emotion-phrase`、R0 fixture / M7 compare UI。

## Phase 3 セクション境界・音色情報の修正（2026-10-24）
- `handheld.score` の `wholeTrackArc` は小節別の実使用ステージ（opening / development / climax / resolution）を持つため、R5はこれを `context.wholeTrackArc` として受け取り、隣接する同一ステージを連結してセクション窓を構成する。四等分は明示データがないときだけのfallback。
- `palette` は instrumentChoice.palette または STORY_INSTRUMENTS で決まる。render側から声部別 `timbres` metadata を渡す。ただし未指定はnullを保持し、`timbreSource` に由来を記録。声部ラベルだけから音色融合やスペクトルマスキングを推論しない。
- スコアで発音する前景は lead と counter を検出。セクション境界と音色情報は診断trace専用でありnotes/PCMへ逆流しない。
