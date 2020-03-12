#!/usr/bin/env python3
import numpy as np
import math
import json
from tqdm import trange
import sys


class Z_score:
    
    def __init__(self, k=10, mode="euclidean", r=.3):
        """
        Z 得分
        @type {list<[float, float]>?}
        """
        self.score = None

        """
        距离计算标准
        @type {"euclidean" | "manhattan"}
        * - "euclidean" 欧几里得距离
        * - "manhattan" 曼哈顿距离
        """
        self.mode = "manhattan" if mode == "manhattan" else "euclidean"

        """
        考虑的邻近点的数量
        @type {int}
        """
        self.k = k

        """
        莫兰散点图中，点被判定为不显著点的半径上限
        @type {float}
        """
        self.r = r

        return


    """
    计算两点距离
    @param      {any extends {x: float; y: float;}} a   第一个坐标点
    @param      {any extends {x: float; y: float;}} b   第二个坐标点
    @returns    {float}                                 距离
    """
    def __diff(self, a, b):
        if self.mode == "euclidean":
            return math.sqrt((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2)
        else:
            return math.fabs(a["x"] - b["x"]) + math.fabs(a["y"] - b["y"])


    """
    生成邻近点矩阵
    @param {list<{x: float; y: float; value: float;}>} data 空间数据
    """
    def fit(self, data):
        # 重置 Z 得分
        self.score = []

        """
        数据点的数量
        @type {int}
        """
        n = len(data)

        """
        原始属性值向量
        @type {numpy.ndarray%shape=(n,)}
        """
        val_in = np.array([d["value"] for d in data])

        """
        全局属性值均值
        @type {float}
        """
        mean = np.mean(val_in)
        
        """
        全局属性值标准差
        @type {float}
        """
        std_deviation = np.std(val_in)

        """
        标准化属性值列表
        @type {numpy.ndarray%shape=(n,)}
        """
        val_list = (val_in - mean) / std_deviation

        """
        完成标准化的数据列表
        @type {list<{x: float; y: float; value: float;}>}
        """
        M = [{
            "x": data[i]["x"],
            "y": data[i]["y"],
            "value": float(val_list[i])
        } for i in range(n)]

        # fr = open("../data/healthy_sp.json", mode='w', encoding='utf8')

        # 遍历，时间复杂度 O(n^2)
        iteration = range(len(data))

        if len(sys.argv) == 1:
            iteration = trange(len(data), ncols=20, leave=True)

        for i in iteration:
            """
            目标点
            @type {{x: float; y: float; value: float;}}
            """
            a = M[i]

            """
            按距离升序排列的其他点
            @type {list<{dist: float; value: float;}>%len=n-1}
            """
            order = []

            # 遍历其他点，时间复杂度 O(n)
            for j in [x for x in range(n) if i != x]:
                """
                被比较点
                @type {{x: float; y: float; value: float;}}
                """
                b = M[j]

                """
                两点距离
                @type {float}
                """
                dist = self.__diff(a, b)

                order.append({
                    "dist": 1. / dist,
                    "value": b["value"]
                })

            # 对 order 按距离升序排序
            order.sort(key=lambda e: e["dist"], reverse=True)

            """
            邻近点空间权重列向量
            @type {np.ndarray%shape=(1, self.k)}
            """
            _weights = np.array([[d["dist"]] for d in order[:self.k]])
            _weights /= _weights.sum()

            # fr.write("[")
            # for i in range(len(_weights)):
            #     w = _weights[i]
            #     fr.write(str(float(w)))
            #     if i < len(_weights) - 1:
            #         fr.write(",")
            # fr.write("],")

            """
            标准化观测值
            @type {float}
            """
            x = a["value"]

            """
            空间滞后值
            @type {float}
            """
            sp_lag = np.mean(np.array([_weights[i][0] * order[i]["value"] for i in range(self.k)]))

            self.score.append([x, sp_lag])

        # fr.close()

        return self


    """
    判断给定索引对应的数据点的类别
    @param      {int}                               index   点的索引
    @returns    {"NS" | "HH" | "LH" | "LL" | "HL"}          类别
    """
    def type_idx(self, index):
        if math.sqrt(self.score[index][0] ** 2 + self.score[index][1] ** 2) <= self.r:
            """
            NS - 不显著点 = Not Significant
            """
            return "NS"

        """
        激活函数
        @type {number => ("L" | "H")}
        """
        SIGN = lambda n: "L" if n < 0 else "H"

        return SIGN(self.score[index][0]) + SIGN(self.score[index][1])



if __name__ == "__main__":
    m = Z_score(k=8, mode="euclidean")

    input_name = None

    output_name = "healthy_output"
    if len(sys.argv) > 2:
        input_name = sys.argv[1]
        output_name = sys.argv[2]

    def fx(d):
        return (d + 128.14621384226703) / (67.85378615773539 - -128.14621384226703) * 398

    def fy(d):
        d = (d - 50.55349948549696) / (22.86881607932105 - 50.55349948549696) * (22.86881607932105 - 50.55349948549696) + 50.55349948549696 + 2 * (1 - (22.86881607932105 - 50.55349948549696) / (22.86881607932105 - 50.55349948549696))
        return 400 * (d * d * (-0.00025304519602050573) - d * 0.01760550015218513 + 1.5344062688366468)

    with open("../../../back-end/healthy_data1.json", mode='r', encoding='utf8') as f:
        A = [{
            "lat": d["lat"],
            "lng": d["lng"],
            "x": fx(d["lng"]),
            "y": fy(d["lat"]),
            "value": d["value"]
        } for d in json.load(f)]

    if input_name:
        with open("../../../back-end/{}.json".format(input_name), mode='r', encoding='utf8') as f:
            indexes = json.load(f)
            A = [A[i] for i in range(len(A)) if i in indexes]
    
    m.fit(A)

    transform = [m.type_idx(i) for i in range(len(A))]

    print(transform)

    with open("../../../back-end/{}.json".format(output_name), mode='w', encoding='utf8') as f:
        res = []
        for i in range(len(A)):
            res.append({
                "type": transform[i],
                "lat": A[i]["lat"],
                "lng": A[i]["lng"],
                "value": A[i]["value"],
                "mx": m.score[i][0],
                "my": m.score[i][1]
            })
        json.dump(res, f)

    pass
