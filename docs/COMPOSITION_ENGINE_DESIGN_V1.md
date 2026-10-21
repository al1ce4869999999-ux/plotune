# plotune 次世代作曲エンジン設計書 v1.0
更新: 2026-10-22
状態: 提案仕様（実装未着手）
対象: plotune / handheld-v21.js / melodic-grammar-v01.js / impression-lab.html

## 1. 目的
「音程を少し変えても同じ音の運びに聞こえる」「旋律が平坦」「伴奏と主旋律が独立している」という課題を、パラメータ調整でなく生成アーキテクチャで解決する。

成功条件:
- 曲に認識可能な主題と意図的な変奏がある
- 旋律・和声・リズム・楽器の役割が共有された意図から決まる
- 生成判断を追跡し、同一seedで再現できる
- 従来のゲーム音色・プリセット・キャラクター曲を壊さない
- 音楽的評価と技術的成功を区別する

非目標: 学習済み大規模モデルへの全面移行、特定ゲーム楽曲の模倣、すべての曲調への単一テンプレート強制。

## 2. 理論的背景と採用判断
- Lerdahl & Jackendoff, *A Generative Theory of Tonal Music* (1983): 拍節・グルーピング・タイムスパン・延長構造。採用: 重要音と階層。注意: 記述理論をそのまま生成器と見なさない。
- Conklin & Witten, *Multiple Viewpoint Systems for Music Prediction* (1995): 音程差、拍位置、音価など複数観点。採用: 候補の多面的採点。
- Herremans & Chew, *MorpheuS* (2017/2018): パターンと緊張曲線を制約にする生成。採用: 目標緊張度と反復構造。注意: 実装数値は独自設計。
- Huron, *Sweet Anticipation* (2006): 期待と予測。採用: 反復・逸脱・回帰を設計する考え方。
- 階層的生成・フレーズ構造に関する研究: セクション→フレーズ→音符の段階化。採用: 生成順序。
参考文献は設計根拠であり、各評価式の実証的妥当性を保証するものではない。

## 3. 原則
1. 曲全体→セクション→フレーズ→重要音→装飾音→楽器演奏の順で詳細化する。
2. 旋律と和声は一方向に従属させず、候補ペアを共同評価する。
3. 主題は固定音列ではなく「輪郭・リズム・重要音・終止・機能」を持つ。
4. 対旋律は独立生成せず、主旋律の発音・休符・緊張に応答する。
5. ランダム性は候補の多様性に使い、最終決定は明示的制約と採点に従う。
6. 既存音色・奏法はレンダラーに残し、作曲計画と分離する。

## 4. 全体アーキテクチャ
入力（情景・感情・キャラ・曲長・seed・編成）
 → FormPlanner（形式、反復関係、セクション）
 → TensionPlanner（緊張曲線、終止位置）
 → MotifPlanner（主題のリズム、輪郭、重要音）
 → PhraseHarmonySolver（旋律・和声の候補共同評価）
 → RolePlanner（楽器の主導、応答、伴奏、休止）
 → PerformancePlanner（実音符、アーティキュレーション、強弱）
 → Evaluator（診断、局所再生成）
 → 既存の音源・書き出し処理

一方向のパイプラインではなく、EvaluatorがPhraseHarmonySolverおよびRolePlannerへ再提案できる。再生成回数に上限を設ける。

## 5. 中間データモデル（CompositionPlan）
```ts
type CompositionPlan = {
  version: 1;
  seed: number;
  meter: {beats: number; subdivision: number};
  tempo: number;
  key: {tonic: number; scale: number[]};
  instrumentation: InstrumentSpec[];
  sections: SectionPlan[];
  motifs: Record<string, Motif>;
  phrases: PhrasePlan[];
  diagnostics: DecisionTrace[];
};
type SectionPlan = {
  id: string; startBar: number; bars: number;
  function: 'intro'|'statement'|'variation'|'contrast'|'climax'|'reprise'|'outro';
  motifRef?: string; relation?: 'repeat'|'vary'|'contrast'|'return';
  tensionTarget: number[]; densityTarget: number[];
  cadence: 'none'|'half'|'authentic'|'deceptive'|'modal';
};
type Motif = {
  id: string;
  rhythm: {onset: number; duration: number; rest?: boolean}[];
  contour: number[]; // 相対的な上昇・下降
  anchors: {beat: number; degree: number; weight: number}[];
  signature: {intervals: number[]; rhythmicRatios: number[]};
};
type PhrasePlan = {
  sectionId: string; barStart: number; bars: number;
  motifRef: string; transformation: string[];
  anchorNotes: PlannedNote[];
  harmony: PlannedChord[];
  voices: VoicePlan[];
  targetTension: number[];
  candidates?: CandidateScore[];
};
type VoicePlan = {
  instrumentId: string;
  role: 'lead'|'answer'|'counter'|'harmony'|'bass'|'texture'|'silence';
  activeWindows: [number,number][];
  register: [number,number];
  density: number; dynamics: number;
  sourceMotifRef?: string;
};
type PlannedNote = {onset:number; duration:number; degree:number; octave:number; function?:string};
type PlannedChord = {onset:number; duration:number; rootDegree:number; quality?:string; function?:string};
type InstrumentSpec = {id:string; family:string; range:[number,number]};
type CandidateScore = {total:number; melody:number; harmony:number; motif:number; tension:number; texture:number; penalties:string[]};
type DecisionTrace = {stage:string; location:string; candidates:number; chosen:string; scores:Record<string,number>; reason:string};
```
時刻単位は曲内の拍（beat）に統一。UI秒変換はレンダリング層で実施。境界は半開区間。各IDは安定化し、シード由来の乱数ストリームをステージごとに分離する。

## 6. 形式生成（FormPlanner）
曲長と用途から小節数を決め、短曲はA–A'、中曲はA–A'–B–A、長曲はIntro–A–A'–B–A–Outroを候補とする。固定四等分は廃止。各セクションに役割、長さ、主題参照、変奏関係、終止種、緊張目標を与える。最後の回帰は音高完全一致でなく、主題同一性を維持した変奏も許す。

## 7. 主題とフレーズ
まずフレーズの拍節強位置に重要音（anchors）を置き、リズム骨格と旋律輪郭を生成。その間を経過音・刺繍音・跳躍・休符で埋める。各フレーズは「開始・推進・頂点・終止」の機能を持つ。
変奏演算: 移高、反行、リズム拡大/縮小、部分反復、音域移動、休符挿入、音価変更。変奏後もモチーフ同一性スコアを測定し、過度な一致と逸脱の両方を避ける。

## 8. 旋律と和声の共同生成
フレーズ単位でK個の旋律骨格候補とM個の和声候補を作り、整合する組み合わせを探索する。
評価例（初期値は調整可能）:
S = 0.22*melody + 0.20*harmony + 0.20*motif + 0.18*tension + 0.12*voiceLeading + 0.08*playability - penalties
各指標は0..1に正規化。重要拍での和声音/非和声音の扱い、隣接コードの声部進行、終止の強さ、目標緊張曲線との差を採点。緊張度は和声的不安定性・音域・リズム密度・未解決音の複合指標として定義し、単なる音量にしない。
候補数はK=6、M=5、上位3案の再評価から開始。制約違反時のみ局所再生成し、最大2回で打ち切る。重みは経験的初期値であり、聴感ABテストで調整する。

## 9. 楽器間の関係（RolePlanner）
各フレーズに主導楽器を割り当て、主旋律の発音占有率・休符・音域・緊張を入力として他楽器の役割を決定。
- leadが密ならcounterを減らし、和音を持続させる。
- leadが休む区間はanswerにモチーフの一部を渡す。
- bassは和声の根音だけでなく、次の和声への接近音を選ぶ。
- climaxは単なる全楽器同時演奏でなく、役割の入れ替えと対比で作る。
- resolutionは主題を再提示し、未解決音を減らし、楽器を整理する。
- 同時発音、音域重複、リズム衝突をスコア化し、過密なら役割を変更する。
楽器固有の音域、アタック、持続可能性、発音密度はInstrumentSpec/PerformancePlannerに置く。オルゴール・笛・キャラクター曲も共通計画を利用するが、音色と奏法は別設定。

## 10. 評価と診断
技術的検証:
- 同一seed・同一入力で完全一致
- 小節境界、音価、音域、NaN、配列外参照の検査
- 各フレーズに重要音と終止情報が存在
- 各楽器の演奏範囲・同時発音上限
- 入力長の極端値・短曲・無打楽器編成で正常生成
音楽的指標:
- 主題再認識度（輪郭・リズム類似度）
- フレーズ間の差異（単調すぎ/断絶しすぎ）
- 終止の強さ
- 旋律和声適合
- 音域と音数の変化
- 楽器間の空間的/時間的衝突
- 目標緊張曲線と生成結果の差
人間評価: 同seed・同音色で旧エンジンと新エンジンをブラインド比較。項目は「自然さ」「曲としてのまとまり」「変化」「印象」「好み」。自動スコアの改善のみで完成扱いしない。

## 11. 移行計画
Phase 0: 既存エンジンの入出力・生成経路・楽器別例外を棚卸し。再現用の固定seedを保存。
Phase 1: CompositionPlan schema、FormPlanner、TensionPlannerを追加。音は旧エンジンで鳴らす。診断表示を先に作る。
Phase 2: MotifPlannerと重要音生成。従来のフレーズ生成器と並走し、A/B可能にする。
Phase 3: PhraseHarmonySolverの候補探索とスコア内訳の保存。
Phase 4: RolePlannerを導入し、笛・オルゴール・ピアノ・ベースで問いと応答を検証。
Phase 5: 全生成経路（通常・ゲーム・オルゴール・笛・キャラクター）を共通Planへ統合。
Phase 6: 印象ラボで聴感AB・性能計測・診断、品質基準を満たしてから既定化。
各Phaseは別PR、旧エンジンへの切替フラグ、CI成功、必要な実機Safari検証を分けて記録。Production相当の公開経路への直接変更は避ける。

## 12. 性能と安全なロールアウト
ブラウザ・モバイル前提。探索候補数と再生成回数に上限を設ける。処理時間とメモリを測定し、重い場合はビーム幅を縮小。生成失敗時は旧エンジンにフォールバック。診断ログは入力全文ではなく構造化された判断を優先。キャッシュと音源の互換性を確認する。

## 13. 完了判定
- 全主要経路が同じCompositionPlanを経由
- 同一seed再現、エラーなし、既存音色保持
- 4種類以上の曲調と複数曲長で診断が通る
- 主題の提示・変奏・回帰、和声的終止、楽器の受け渡しがデータ上で確認可能
- ブラインド聴感評価で旧版より自然さ・まとまりの改善を確認
- iPhone Safari実機で再生・保存・UI操作を確認
- 各不具合は「問題/再現/原因(確度)/対処/前後結果/未解決」をIssueに記録

## 14. 未決事項
- 既存コードの全生成経路の実地棚卸し
- 楽器固有の演奏可能音域・発音制約
- 緊張度スコアの校正方法
- ループ曲の終結処理（ループ終端と曲終止の両立）
- 各種感情・キャラクター設定のPlanへのマッピング
- 実機計測の性能予算
