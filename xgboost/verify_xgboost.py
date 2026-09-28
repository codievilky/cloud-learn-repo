"""用真正的 xgboost 复现《XGBoost 动画图解》（index.html）里的数字。

运行：
    pip install xgboost numpy pandas
    python verify_xgboost.py

页面上的量和 xgboost 输出的换算关系：
    页面 Gain（论文公式） = xgboost 的 gain / 2 − γ
    页面 w*              = xgboost 的 leaf / eta
    页面 H               = xgboost 的 cover
"""
import numpy as np
import xgboost as xgb

# 西瓜数据集 3.0α（周志华《机器学习》）：密度、含糖率、是否好瓜
X = np.array([
    [0.697, 0.460], [0.774, 0.376], [0.634, 0.264], [0.608, 0.318], [0.556, 0.215],
    [0.403, 0.237], [0.481, 0.149], [0.437, 0.211], [0.666, 0.091], [0.243, 0.267],
    [0.245, 0.057], [0.343, 0.099], [0.639, 0.161], [0.657, 0.198], [0.360, 0.370],
    [0.593, 0.042], [0.719, 0.103],
])
y = np.array([1] * 8 + [0] * 9, dtype=float)
names = ["density", "sugar"]

# 与页面第 4–7 章相同的参数
params = {
    "objective": "binary:logistic",
    "eta": 0.3,
    "max_depth": 3,
    "lambda": 1.0,
    "gamma": 0.0,
    "min_child_weight": 0.5,
    "base_score": 0.5,       # 写死起点，关闭 2.0+ 的自动估计
    "tree_method": "exact",  # 页面演示的是精确贪心算法
}
eta, gamma = params["eta"], params["gamma"]

bst = xgb.train(params, xgb.DMatrix(X, label=y, feature_names=names), num_boost_round=20)

print("== 图 2 / 图 6：第 1 棵树 ==")
print(bst.get_dump(with_stats=True)[0])
df = bst.trees_to_dataframe()
t0 = df[df.Tree == 0]
for _, r in t0.iterrows():
    if r.Feature == "Leaf":
        print(f"  叶子 {r.ID}: w* = leaf / eta = {r.Gain / eta:+.4f}   H = cover = {r.Cover:.4f}")
    else:
        print(f"  节点 {r.ID}: {r.Feature} < {r.Split:.4f}   页面 Gain = gain/2 − γ = {r.Gain / 2 - gamma:.4f}   H = {r.Cover:.4f}")

print("\n== 图 7：20 轮后的训练集 logloss ==")
p = bst.predict(xgb.DMatrix(X, feature_names=names))
print(f"  logloss = {-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)):.4f}")
print("  分错的瓜：", [f"#{i + 1}" for i in np.where((p >= 0.5) != (y == 1))[0]] or "无")

print("\n== 图 9：#3、#12、#16 缺失含糖率时根节点的默认方向 ==")
Xm = X.copy()
Xm[[2, 11, 15], 1] = np.nan
bm = xgb.train(params, xgb.DMatrix(Xm, label=y, feature_names=names, missing=np.nan), num_boost_round=1)
root = bm.get_dump(with_stats=True)[0].splitlines()[0]
print(" ", root)
print("  missing=1 表示缺失值走 yes（左）分支" if "missing=1" in root else "  缺失值走 no（右）分支")

print("\n== 图 10：新瓜（密度 0.62，含糖率 0.30）前 10 棵树的预测 ==")
new = xgb.DMatrix(np.array([[0.62, 0.30]]), feature_names=names)
margin = bst.predict(new, output_margin=True, iteration_range=(0, 10))[0]
print(f"  log-odds ŷ = {margin:.4f}   p = σ(ŷ) = {1 / (1 + np.exp(-margin)):.4f}")
