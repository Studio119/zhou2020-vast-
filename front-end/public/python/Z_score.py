#!/usr/bin/env python3
import numpy as np
import math
import json
from tqdm import trange
import sys


class Z_score:
    
    def __init__(self, k=10, mode="euclidean", r=.3, equal=False):
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
        每个点选取的邻近点的索引列表
        @type {list<list<int>%len=self.k>%len=n?}
        """
        self.neighbors = None

        """
        考虑的邻近点的数量
        @type {int}
        """
        self.k = k

        """
        是否均分邻近点空间权重
        @type {bool}
        """
        self.equal = equal

        """
        莫兰散点图中，点被判定为不显著点的半径上限
        @type {float}
        """
        self.r = r

        return


    """
    计算两点距离
    @param      {any extends {lng: float; lat: float;}} a   第一个坐标点
    @param      {any extends {lng: float; lat: float;}} b   第二个坐标点
    @returns    {float}                                 距离
    """
    @staticmethod
    def _diff(a, b):
        lon1 = a['lng']
        lon2 = b['lng']
        lat1 = a['lat']
        lat2 = b['lat']
        lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
        a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * \
            math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371
        dis = c * r * 1000
        return dis


    """
    生成邻近点矩阵
    @param {list<{lng: float; lat: float; value: float;}>} data 空间数据
    """
    def fit(self, data):
        # 重置 Z 得分
        self.score = []

        # 重置邻近点矩阵
        self.neighbors = []

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

        # print("标准化后取值范围：", (np.min(val_list), np.max(val_list)))
        # print("标准化数据均值：", np.mean(val_list), "标准化数据标准差：", np.std(val_list))

        """
        完成标准化的数据列表
        @type {list<{lat: float; lng: float; value: float;}>}
        """
        M = [{
            "lng": data[i]["lng"],
            "lat": data[i]["lat"],
            "value": float(val_list[i])
        } for i in range(n)]

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
            @type {list<{dist: float; value: float; index: int;}>%len=n-1}
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
                dist = Z_score._diff(a, b)

                order.append({
                    "dist": 1. / dist if not self.equal else 1. / self.k,
                    "value": b["value"],
                    "index": j
                })

            # 对 order 按距离升序排序
            order.sort(key=lambda e: e["dist"], reverse=True)

            self.neighbors.append([e["index"] for e in order[:self.k]])

            """
            邻近点空间权重列向量
            @type {np.ndarray%shape=(1, self.k)}
            """
            _weights = np.array([[d["dist"]] for d in order[:self.k]])
            _weights /= _weights.sum()

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

        return self


    """
    激活函数
    @type {number => ("L" | "H")}
    """
    @staticmethod
    def _SIGN(n):
        return "L" if n < 0 else "H"
    
    
    """
    判断给定索引对应的数据点的类别
    @param      {int}                               index   点的索引
    @returns    {"NS" | "HH" | "LH" | "LL" | "HL"}          类别
    """
    def type_idx(self, index):
        return Z_score._SIGN(self.score[index][0]) + Z_score._SIGN(self.score[index][1])



if __name__ == "__main__":
    m = Z_score(k=10, mode="euclidean", equal=True)

    input_name = None
    output_name = None

    if len(sys.argv) > 2:
        input_name = sys.argv[1]
        output_name = sys.argv[2]

    with open("../../../back-end/healthy_data1.json", mode='r', encoding='utf8') as f:
        A = [{
            "lng": d["lng"],
            "lat": d["lat"],
            "value": d["value"]
        } for d in json.load(f)]

    if input_name:
        with open("../../../back-end/{}.json".format(input_name), mode='r', encoding='utf8') as f:
            indexes = json.load(f)
            A = [A[i] for i in range(len(A)) if i in indexes]
    
    m.fit(A)

    transform = [m.type_idx(i) for i in range(len(A))]

    # print(transform)

    if output_name:
        with open("../../../back-end/{}.json".format(output_name), mode='w', encoding='utf8') as f:
            res = []
            for i in range(len(A)):
                neighbors = m.neighbors[i]
                res.append({
                    "type": transform[i],
                    "lng": A[i]["lng"],
                    "lat": A[i]["lat"],
                    "value": A[i]["value"],
                    "mx": m.score[i][0],
                    "my": m.score[i][1],
                    "neighbors": neighbors
                })
            json.dump(res, f)
    else:
        with open("../../public/data/healthy_output_{}_eq.json".format(m.k), mode='w', encoding='utf8') as f:
            res = []
            for i in range(len(A)):
                neighbors = m.neighbors[i]
                res.append({
                    "type": transform[i],
                    "lat": A[i]["lat"],
                    "lng": A[i]["lng"],
                    "value": A[i]["value"],
                    "mx": m.score[i][0],
                    "my": m.score[i][1],
                    "neighbors": neighbors
                })
            json.dump(res, f)

    pass
