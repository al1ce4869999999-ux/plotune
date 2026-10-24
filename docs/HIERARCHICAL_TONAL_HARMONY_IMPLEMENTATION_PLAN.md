# Plotune 調性・和声・主題統合エンジン 実装計画書

版: 1.0 / 2026-10-24
対象: `al1ce4869999999-ux/plotune`
状態: **計画のみ。未実装・未実行・未聴取**
系統: **H0–H9（Hierarchical Harmony）**。既存の Phase 0–6、M1–M7、R0–R9 を改名・上書きしない独立計画。統合は各計画の責務と完了状況を確認してから実施する。

## 0. 目的と観測された問題

最終目的: 多様で複合的な感情を呼び起こす、自然な音楽的因果関係を持つ楽曲を生成する。ジャンル模倣・転調回数・複雑さ・音符数の最大化は目標ではない。

聴取で M / Phase+M にセクション接続の不自然さ、短い「でっでっ」という機械的な動きが報告された。生成音源とイベント列の直接対応は未特定であり、以下はコードからの**検証待ちの原因仮説**:

1. M2 が跳躍量・休符率・音価と終止度数を局所的に最適化する。調と和声機能を知らない。
2. M3 の和音選択は小節ごとの逐次候補選択。終止や全曲調性経路を先取りしない。和音根を無視した強拍補正の可能性。
3. `degree` が主題内度数・局所調度数・和音相対度数として混用され、レンダリングで和音根を加える経路がある。
4. M4/M5/Phase transition の下流補正は上流の調性・旋律不整合を解決できない。
5. 不自然なつなぎへの無根拠な橋渡し音の追加はすでに撤回。再導入しない。

小目標: **同一seed・同一入力・同一編成の旧版と新階層版をiPhone Safari上で聴き比べ、自然なつながりと感情表現を評価できること。** CI成功だけで完了としない。

## 1. 既存計画との責任分界

- **Phase**: form/section role、感情・緊張の軌道、調性移行の理由、回帰先、境界意図を計画する。「何が起きるか」。
- **M**: 上位計画を受け、実際の旋律・和声・Bass・内声・表情を生成する。「どう音にするか」。
- **R**: 既存R0–R9の評価器・候補比較・診断・局所改訂。Rは「R=repair」と改名しない。意図のない音追加で後付け修復しない。
- **H**: 上記をつなぐ中間表現・調性/和声計画・共同実現の契約を整備する横断改善。初期はOFF/ON分離、既存計画を遮断しない。

参考となる既存R計画は PR #68（`docs/research-driven-phase-improvements`、R0–R9）に存在し、PR #69 は Phase 5/6 の4条件比較を持つ。これらは未マージの独立開発系統。統合時は実際のベースブランチ・差分・依存関係を調べ、ドキュメントだけを根拠に勝手にマージしない。

## 2. 新しいデータ契約

```text
CompositionIntent {
  emotionArc, tensionTargets, expectancyTargets, form, motifRoles
}
TonalRegion {
  id, sectionId, tonicPitchClass, mode, parentRegionId,
  relationToPrevious, entryMethod, establishmentStrength,
  exitMethod, returnTarget, purpose, confidence
}
HarmonicEvent {
  id, sectionId, phraseId, onset, duration, keyRegionId,
  function, chordPitchClasses, rootPitchClass, quality, inversion,
  harmonicRhythm, cadenceRole, expectedResolution, actualResolution
}
MotifIdentity {
  id, intervalSkeleton, contour, rhythmCells, accentPattern,
  anchors, harmonicRoles
}
MotifTransformation {
  sourceMotifId, kind, preservedFeatures, changedFeatures,
  harmonicContext, structuralPurpose
}
MusicalNote {
  motifDegree, localScaleDegree, chordRelativeDegree, localKeyRegionId,
  harmonyId, nonChordToneRole, midi, voice, onset, duration,
  provenance[]
}
TransitionPlan {
  sourceSectionId, targetSectionId, sourceCadence, targetEntry,
  commonTones, bassDirection, leadContinuation, motifRelation,
  rhythmicContinuity, orchestrationContinuity, contrastIntent
}
```

**値の意味の不変条件**:
- `motifDegree`: 動機内の相対関係。和音根を機械的に足さない。
- `localScaleDegree`: 所属する調性領域に対する音階度数。
- `chordRelativeDegree`: 指定された和音を基準にした音程/役割。
- `midi`: 音響出力直前に確定する実音高。
- 未定義の属性は `null` / optional として明示し、曖昧な `degree` へフォールバックしない。旧経路のみ互換アダプタを使う。
- 同じ音を複数の根拠が正当化できる。provenance は推論記録であり主観的な感情の証明ではない。
- schema/version と migration adapter を用意し、旧 score/PCM をデフォルトのまま保持する。

## 3. 探索の因果順序

```text
Emotion / Narrative → Form / Section Purposes
 → Tonal Route (including explicit NO_MODULATION)
 → Harmonic Function + Cadence Plan
 → Motif Identity + Harmonic Reinterpretation
 → Joint Melody/Bass/Inner-Voice Realization
 → Voice-Leading / Non-Chord-Tone Constraints
 → Arrangement (M4) → Performance (M5)
 → R diagnostics and bounded revision → PCM
```

Phase は意図の所有者、M は音の所有者、R は診断と限定的候補採択の所有者。RNGは従来生成と分離し、seed依存の同点解消は決定的に行う。

## 4. マイルストーンと完了条件

| 段階 | 目的/成果物 | 音の変更 | 合格ゲート |
|---|---|---|---|
| H0 | 現行実装・実際のM/Phase+M音源の境界診断、原因仮説の優先度づけ。固定seed/score/PCMの基準保存 | なし | 不自然箇所の時刻/音/和音/声部/原因候補をtraceし、未立証は未立証と表記 |
| H1 | `degree`の意味を分離するversion付きIntermediate Representationと旧→新/新→旧adapter | なし | 旧OFFのnote/PCM/seed完全一致、破壊的な再解釈なし |
| H2 | M3-v02: 和音根に相対化した強拍・非和声音診断、音階/和音音の意味を分離 | 条件付きONのみ | 和音変更で主題が自動平行移動しない、弱拍経過音が合法、無説明の強拍衝突を検出 |
| H3 | M3-v02: 候補和音の全系列 DP + traceback（greedyとのA/B） | ONのみ | 終止への長期到達・再現性・探索予算内完結・fallback |
| H4 | `CadencePlan`: 句末1–2小節の PD/D/T、半終止・偽終止・保留・解決、bass/leadの共同到達 | ONのみ | 終音一個の書き換えに依存せず、指定終止と解決未達を判定 |
| H5 | `TonalRoutePlan`: 維持/近親調/平行調/同主調/属調・下属調、転調なしを同格選択 | ONのみ | 転調理由、準備、到達、定着、回帰、短尺でのNO_MODULATION |
| H6 | 調的経路に基づく転調実現：pivot、applied dominant、modal mixture、意図したdirect cutを段階追加 | ONのみ | 調移行の意図と実際の和声/旋律で根拠が一致 |
| H7 | `MotifIdentity` / `MotifTransformation` v02：sequence、反行、拡大縮小、断片、和声再解釈 | ONのみ | 主題特徴別一致・変形理由・回帰識別、コピー/無関係音の両極を回避 |
| H8 | 実声部MIDI voice-leading、非和声音の準備と解決、M4/M5/編曲/境界への接続 | ONのみ | 各声部範囲と解決、非和声音の役割、意図的な不連続を許容 |
| H9 | 全曲統合、固定seed複数曲A/B、Phase/M/R/HのflagとSafari聴取UI、採否判断 | 比較 | 客観診断と聴感を分離、聴感悪化なら無採用・OFF維持 |

**H0/H1は最初の実装単位。** H2以降は各段階で旧/新を同条件比較。H4/H5は設計並行可能だが、生成への接続はH3と契約整合後。H7はH4–H6から harmonicContext を受ける。H8はH7後の sounding score を受ける。H9で初めて総合採否。

## 5. H0：再現性・原因切り分け

- 4条件 `Baseline / Phase / M / Phase+M` と同seed、同style、同楽器、同durationを固定。
- 人が聴いた異常位置を timestamp/小節/section boundary で記録。
- 周辺2小節のlead/counter/bass/chord/drums onset・duration・midi・velocity、演奏前後の差を記録。
- M2、M3、M4、M5を一つずつOFFにするablationと、harmonic rootの過剰加算を可視化する。
- 「でっでっ」の原因を断定しない。再現音と変化を紐づけられなければ未特定。
- 4条件比較UIの既存入口とデフォルトを維持し、将来のH条件追加で既存比較を置換しない。

## 6. H1/H2：音高度数意味の分離と和声整合

H1のadapterは `legacyDegreeToSoundingMidi(...)` の旧結果を保つ。`motifDegree`から直接soundを作らず、local key/harmony mappingを明示的な別関数へ分離。旧API・formatを壊さず新schemaを併設。

H2ではnoteを無理に三和音へ吸着させない。強拍で不協和なら `suspension/appoggiatura/anticipation` 等の役割・準備・解決を持つか評価。役割がなければ candidate regeneration/selection を優先し、独断で追加音を置かない。ダイアトニック以外への拡張はH6。

## 7. H3：DP chord path

```text
V[t,h] = localFit(t,h,key,motif) +
         max_{h_prev}(V[t-1,h_prev] + transition(h_prev,h,functions,cadence,voiceLeading))
```

- score と backpointer を分離し、全候補列の最良経路を traceback。
- strong-beat chord fit、harmonic function、cadence target、反復の意味、harmonic rhythm、voice-leading candidate costを独立指標としてtrace。
- hard constraints: 到達調、合法な終止、発音範囲、明示されたセクション意図。soft costsは仮説重みと記録。
- beam / bounded state でiPhoneブラウザ計算負荷を制限。解不在時は reasonつき旧経路fallback。
- **指標改善だけで音楽的合格にしない**。和声が単調化したら不採用。

## 8. H4–H6：終止と調性移行

`TonalRegion` 間のedge costに調的距離、準備負荷、到達証拠、回帰制約、構造上の目的を含める。移動しないedgeも通常候補とする。小節数が足りず定着できない転調を避ける。

`CadencePlan` は前終止・属・解決/回避を bass、旋律、拍節、和声で検証。偽終止は expectedTarget と actualTarget の双方を保存。直接転調・ハードカットは contrastIntent を持つとき許し、距離ペナルティで一律却下しない。

## 9. H7–H8：主題・声部・演奏

- motif identity は輪郭・リズム・音程骨格・アクセント・アンカー・和声的役割の別々の特徴で扱う。
- `same motif in another harmony` のために、固定するのは主題の不変量、変えるのは local scale/harmonic role。
- actual MIDI voices で stepwise tendency resolution、common tone、unresolved 7th/leading tone、register overlap、voice crossingを診断。
- 各声部の自然さ・独立性を評価し、M4が和声役割を壊す応答を棄却。M5は構造計画を作り直さず表情付けに限定。
- classical strict parallel 禁止を普遍則にしない。様式に応じた制約/警告にする。

## 10. テスト・聴取・品質ゲート

**環境**: 既存のNode 22、`tests/*.test.cjs`、必要に応じ既存DOM/jsdom契約、GitHub Actions。新しいテストランナーを勝手に入れない。

各段階:
1. Unit: 物理的pitch-class/度数変換、schema、DP最適経路、同点安定、入力不変、no NaN、onset/音価、終止、転調の解/非解。
2. Integration: 実handheld score経由でfeature OFF legacy notes/PCM同一、ONのみ変更、最終PCMの差・無変更箇所を確認。
3. CI: 全関連既存テスト + 新回帰。CI失敗は原因→修正→確認コマンド、失敗記録をIssue/PRへ。
4. Preview: 実際に比較UIで生成→別々に再生→結果保存。READY ≠ UI動作。
5. Human listening: 同入力/同seed/同編成で複数seed。自然さ、必然性、主題認識、緊張と解放、複合感情、再聴意欲、perceived/feltを別々に評価。盲検順序、音量差にも配慮。

影響が想定される既存回帰:
`tests/m2-emotion-phrase.test.cjs`、
`tests/m3-harmony-melody.test.cjs`、
`tests/m4-voice-dialogue.test.cjs`、
`tests/m5-performance.test.cjs`、
`tests/motif-phrase-integration.test.cjs`、
`tests/motif-score-integration.test.cjs`、
`tests/phase4-transition-ab.test.cjs`、
`tests/phase5-whole-song-audit.test.cjs`、
`tests/phase56-integration.test.cjs`、
`tests/phase56-lab-ui.test.cjs`、
`tests/preflight-contracts.test.cjs`、`tests/engine.test.cjs`、grief/arc/instrument関連。ブランチごとに存在と対象の対応を確認してから実行する。

**記録:** 各段階で「問題・再現・根拠と原因確度・変更・変更前後のスコア/PCM/聴取結果・CI・未解決・次段階」をIssue/PRへ残す。

**採用判定:** chord-tone ratio、転調数、跳躍の少なさ、理論スコアのみでは不可。自然さ・展開の必然性・主題認識・感情の豊かさが旧版を上回り、特定seedだけに偏らないこと。聴感が悪化すればfeature OFFに戻す。

## 11. 運用・ブランチ

- H0→H1を開始し、H2以降はゲート通過で段階的に進める。各段階は小さいPRとIssueに分割し、実装・CI・公開・聴取の状態を別々に記す。
- 未マージPRと依存ブランチを確認してから積み上げる。Phase・M・Rライン全体のマージを勝手に進めない。
- 既存の4条件聴き比べUI、公開URL、保存形式と同じseed入力を優先して維持。Hフラグは独立追加。
- mainへの直接書き込み、既存実験の破壊、マージ、デプロイはこの計画の保存時には行わない。

## 12. 研究根拠（調査報告を実装判断へ変換）

- van Kranenburg & Kearns, *Algorithmic Harmonization of Tonal Melodies Using Weighted Pitch Context Vectors*, ISMIR 2023：候補列のDP・traceback。
- Yi et al., *AccoMontage2*, ISMIR 2022：micro/meso/macro和声評価。
- Lu et al., *MeloForm*, ISMIR 2022：motif→phrase→sectionの階層化。
- Rohrmeier, *Towards a Generative Syntax of Tonal Harmony*, 2011：key/function/chordの階層。
- Herremans & Chew, *MorpheuS*, 2017/2018：長期反復制約と緊張目標、探索負荷への注意。
- Pachet, Roy & Barbieri, *Finite-Length Markov Processes with Constraints*, IJCAI 2011：生成priorとhard constraintの分離。
- Callender, Quinn & Tymoczko, *Generalized Voice-Leading Spaces*, Science 2008：和音/声部接続の幾何学的表現。
- Pearce, IDyOM関係研究：期待・情報量は感情そのものではない。
- Zentner et al., 2008；Juslin & Västfjäll, 2008：知覚した感情と実際に感じた感情の区別。

式、評価重み、段階区分、schemaは**Plotune向けの提案**であり、論文で実証済みの数値として扱わない。

## 13. 次の一手

最初の実装Issueは **H0: 固定seedでM/Phase+Mの「でっでっ」の出所をトレースする**。診断のみで音を変えない。H0の再現例を確保し、その後 H1 (degree semantics + lossless compatibility adapter) に進む。
