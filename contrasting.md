# 实验结果



## 使用巴氏距离度量直方图相似度

(0: 完全不相似 -> 1: 相同)

* **最好**

* _最差_

| 数据集  | 柱宽 | 随机         | 蓝噪声     | Z-order    | 本文         | 本文 (优化) |
| ------- | ---- | ------------ | ---------- | ---------- | ------------ | ----------- |
| health  | 0.2  | 0.975788     | _0.912020_ | 0.964088   | **0.991073** | 0.980588    |
| health  | 0.1  | 0.974824     | _0.905157_ | 0.942052   | **0.980983** | 0.962884    |
| health  | 0.05 | **0.968519** | _0.893914_ | 0.934584   | 0.968152     | 0.942199    |
| health  | 0.02 | **0.957192** | _0.877540_ | 0.885217   | 0.956820     | 0.935782    |
| poverty | 0.2  | **0.995069** | _0.893743_ | 0.974200   | 0.984274     | 0.983604    |
| poverty | 0.1  | **0.994601** | _0.854407_ | 0.972555   | 0.975317     | 0.978051    |
| poverty | 0.05 | **0.990967** | _0.847082_ | 0.967731   | 0.968361     | 0.968622    |
| poverty | 0.02 | **0.978834** | _0.823458_ | 0.951374   | 0.954732     | 0.956123    |
| working | 0.2  | **0.989881** | -          | _0.986182_ | 0.988121     | -           |
| working | 0.1  | **0.988674** | -          | _0.979924_ | 0.985801     | -           |
| working | 0.05 | **0.978641** | -          | _0.975917_ | 0.976579     | -           |
| working | 0.02 | **0.959358** | -          | _0.950153_ | 0.954765     | -           |



