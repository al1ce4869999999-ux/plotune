# M7.1 実エンジン接続 / M7.2 引き継ぎ

## 固定する小目標
同じ入力・seed・準備済みplanから4条件を生成し、M7.2でPCMを再生して比較できる生成基盤を用意する。聴き比べ画面自体はM7.2の担当。

## 接続点
index.htmlで既に読み込まれる `PlotuneM7Generation.generate(input, seed)` を呼ぶ。
依存省略時は現行windowのAnalysis / Resonare / StoryStructure / MusicPsychology / HandheldとMモジュールを検査する。不足時は生成前に失敗する。
既存prepareを1回だけ呼び、同一の準備済みplanを条件ごとに深く複製する。変えるのは以下の処置フラグだけ。

| conditionId | motifDevelopment | musicDevelopment / Harmony / Voices / Performance |
|---|---|---|
| baseline | false | false |
| phase | true | false |
| m | false | true |
| phase-m | true | true |

M6は全条件false。ここでのPhaseはPR #67既存契約のmotifDevelopmentを指す。Phase 1〜4全体の比較と呼び替えない。Baselineも現行handheldのフラグOFFであり、歴史的バージョンの再現ではない。

返却: `{schemaVersion, request, tracks}`。各trackは `{conditionId, config, request, track: {samples, sampleRate, score, ...}}`。
UIはconditionIdで選び、samples全体をsampleRateでAudioBufferへコピーする。再生切替で再生成しない。共通再生位置を秒で保持する。
入力はhandheld、15/30/60秒、uint32 seed、instrumentSet=handheld-currentのみ。未対応楽器セットは黙って無視せず拒否する。

## 回帰検証
`node tests/m7-generation.test.cjs` は契約・入力エラーを検証。VMの例外はプロトタイプではなくnameで照合。
`node tests/m7-real-engine.test.cjs` はモックなしの実エンジンを読み込む。
- 15秒/seed=42、30秒/seed=0、60秒/seed=4294967295。
- 共通planの処置フラグ以外が等しいこと、nested object分離、render後のplan不変。
- 通常順と逆順で全notesおよびPCM全バイトのSHA-256が条件ごとに一致。
- 各ケースで4条件のnotesとPCMが全て異なること。
- 指定尺、有限かつ振幅1以内のPCM、同じrequestからのplan再現。
- Math.randomを例外にし、実行経路で環境の乱数を使うと失敗。

これは検証ケースの再現性と順序独立性を保証する回帰テスト。すべての入力・プリセット・ブラウザ間のビット一致、各乱数系列の統計的独立性までは証明しない。楽器パレットや既存のseedフォールバックは変更していない。異なるseedの出力が常に一意という契約も設けない。

## CI失敗の再現と原因
元HEAD 1e167f1 のengine run 39842906070ではM7テスト9行目のRangeError比較がVM境界で失敗。他の既存テストは成功/既定skip。
Goal retention run 39842906251はPR本文の6必須見出し欠落。ゲート自体にも二重エスケープされた正規表現リテラルがあり、空節・コメントの検査が不正なため併せて修正。

## M7.2の完了条件と残作業
4条件生成ボタン→生成中表示→4条件の再生/停止・同じ位置からの切替→共通seed/入力表示→評価保存までつなぐ。既存2曲比較は維持する。
生成エラー時は部分的な比較を提示しない。まず15秒を既定にし、iPhone Safariで待ち時間・メモリ・AudioContext再開・切替位置を検証する。30/60秒は全曲PCMを保持する負荷も確認する。
UI未実装、Safari実機・聴感未検証。Draftを維持し、マージ・デプロイしない。
