# cloud-learn-repo

学习笔记和可交互的图解。

## XGBoost 动画图解

[`xgboost/index.html`](xgboost/index.html) 用十张可以逐步播放的动画拆解 XGBoost 的完整工作原理：加法模型、目标函数、二阶泰勒展开（g 和 h）、叶子权重 w*、分裂增益与贪心扫描、树的生长与 γ 剪枝、训练循环、直方图算法、缺失值的默认方向、预测，最后是参数速查。

- 用浏览器直接打开 `xgboost/index.html` 即可。字体从 Google Fonts 加载，离线时会退回系统字体。
- 页面里的数字由内置的小型 XGBoost 实时计算。在西瓜数据集 3.0α 上，它和 xgboost 3.2（`tree_method="exact"`）逐棵树对照过，分裂点、增益、叶子值一致。
- [`xgboost/verify_xgboost.py`](xgboost/verify_xgboost.py) 用真正的 xgboost 复现页面上的数字：

  ```sh
  pip install xgboost numpy pandas
  python xgboost/verify_xgboost.py
  ```

## 北京的秋天（JS 短片）

[`beijing-autumn/index.html`](beijing-autumn/index.html) 是一部用 JavaScript 实时画出来的短片，约 2 分 50 秒。十五个镜头按七个节气排开，从立秋走到立冬：院子里的西瓜、胡同上空的鸽哨、白露打枣、白塔后面的月亮、故宫角楼的夕阳、香山红叶、留给喜鹊的柿子、一夜北风吹光的银杏、街口的糖炒栗子，最后写成一封寄往南方的信。页面下方附完整的分镜表（景别、运镜、转场、旁白、声音），点缩略图就从那个镜头开始播。

- 用浏览器直接打开 `beijing-autumn/index.html`，点播放（有声音）。空格暂停，←/→ 快退快进 5 秒，Shift + ←/→ 换镜头。
- 画面用 Canvas 2D 绘制，每一帧都是时间的函数 `renderFilm(t)`，所以可以随意拖动。声音用 Web Audio 合成：Karplus–Strong 拨弦的古筝、箫、鸽哨、蝉鸣和风声。整页没有用到任何图片、视频或音频文件。
- [`beijing-autumn/render.mjs`](beijing-autumn/render.mjs) 把短片逐帧导出成 1080p 的 MP4（需要本机装有 ffmpeg）：

  ```sh
  npm install playwright && npx playwright install chromium
  node beijing-autumn/render.mjs --out beijing-autumn.mp4
  ```
