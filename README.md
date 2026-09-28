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
