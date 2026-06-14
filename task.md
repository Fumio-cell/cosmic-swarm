- `[x]` **フェーズ1: 画像ローダー + ピクセル解析の実装 (描画なし)**
  - `[x]` `src/utils/imageAnalyzer.ts` を作成する。
  - `[x]` 画像ファイル (Fileオブジェクト) を受け取り、非表示Canvasに指定の `voxelResolution` (例: 64) で縮小描画し、`getImageData()` でRGBA配列と各ピクセルのグリッド座標 (X, Y) を返す純粋関数 `analyzeImagePixels` を実装する。
  - `[x]` アルファ値が低い（透明に近い）ピクセルは除外する仕組みを入れる。
  - `[x]` `App.tsx` と `OverlayHUD.tsx` を修正し、ファイルドロップ時にMIMEタイプが `image/*` の場合はこの関数を呼び出し、取得したピクセル配列と採用ピクセル数を `console.log` に出力する。
  
- `[x]` **フェーズ2: 静止ボクセル描画 (`InstancedMesh`の導入)**
  - `[x]` `src/components/canvas/ImageVoxelSwarm.tsx` を新規作成する。
  - `[x]` `THREE.InstancedMesh` を用いて、`analyzeImagePixels` で取得したデータに基づき、初期位置（`homePos`）にキューブを静止配置する。
  - `[x]` 色はピクセルRGBを `mesh.setColorAt()` で設定する。
  - `[x]` 解像度 (`voxelResolution`) と隙間 (`voxelSpacing`) の値が反映されるようにする。
  - `[x]` `Scene.tsx` に組み込み、画像が読み込まれている場合はこのコンポーネントが表示されるようにする。

- `[x]` **フェーズ3: 風 + 集合/拡散アニメーション (GLSLカスタムシェーダーへの組み込み)**
  - `[x]` `ImageVoxelSwarm.tsx` の `InstancedMesh` のマテリアルをカスタムシェーダー化（`onBeforeCompile`を使用、または `particle.vert` と同等のロジックを移植した `ShaderMaterial`）する。
  - `[x]` 各インスタンスの `homePos` を `InstancedBufferAttribute` として頂点シェーダーに渡す。
  - `[x]` 頂点シェーダー内で、既存のカオスなノイズ計算（風・オーディオリアクション等）による「Swarm座標」と、「`homePos` 座標」を、`uGatherStrength` (0.0〜1.0) の uniform で `mix()` (線形補間) させます。
  - `[x]` `uGatherStrength` をスライダーで操作できるようにし、画像（1.0）と自由なSwarm（0.0）を行き来できるようにする。

- `[x]` **フェーズ4: 既存Swarmとの統合とUI完成**
  - `[x]` 画像未読込時は従来の `ParticleSwarm.tsx` がそのまま動作することをテストし、破綻がないか確認する。
  - `[x]` `OverlayHUD.tsx` に追加パラメータ用のスライダー（解像度、隙間、集合度）と、「画像クリア（既存Swarmへ復帰）」ボタンを追加する。
  - `[x]` インスタンス数が30,000を超えないように、大きな画像が入力されても `voxelResolution` 等でクランプする安全策を実装する。

- `[x]` **フェーズ5: テスト・ビルド・デプロイ確認**
  - `[x]` `imageAnalyzer.ts` に関する Vitest での単体テスト（Mock Canvas 等を利用）があれば記述（または動作確認）。
  - `[x]` `npm run build` を実行し、ビルドエラーがないか確認。
  - `[x]` パフォーマンスを検証し、1.6万キューブ（64x64等）で実用的なフレームレートが出るか確認する。
