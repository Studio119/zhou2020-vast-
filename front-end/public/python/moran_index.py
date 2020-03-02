#!/usr/bin/env python3
import numpy as np
import math
import json


class moranI:
    def __init__(self, k=None, mode="euclidean"):
        self.sp_w_matrix = None
        self.indexes = None
        self.mode = "manhattan" if mode == "manhattan" else "euclidean"
        self.k = k
        self.val_matrix = None
        return


    def __diff(self, a, b):
        if self.mode == "euclidean":
            return math.sqrt((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2)
        else:
            return math.fabs(a["x"] - b["x"]) + math.fabs(a["y"] - b["y"])


    """
    * @param {Array<{x: number; y: number; value: number;}>} data
    """
    def fit(self, data):
        dis_mtrx = [[None for __ in data] for _ in data]
        val_list = []

        for i in range(len(data)):
            a = data[i]
            val_list.append(a["value"])
            for j in range(i + 1, len(data)):
                b = data[j]
                dist = self.__diff(a, b)
                dis_mtrx[i][j] = dis_mtrx[j][i] = dist

        self.sp_w_matrix = [[0 for __ in data] for _ in data]

        for i in range(len(dis_mtrx)):
            for j in range(i + 1, len(dis_mtrx)):
                self.sp_w_matrix[i][j] = self.sp_w_matrix[j][i] = 1 / dis_mtrx[i][j]

        self.sp_w_matrix = np.array(self.sp_w_matrix)
        self.val_matrix = np.array(val_list)

        return self


    def transform(self):
        X = self.val_matrix.reshape(1, -1)
        W = self.sp_w_matrix / self.sp_w_matrix.sum(axis=1)  # 归一化
        n = W.shape[0]  # 空间单元数
        Z = X - X.mean()  # 离差阵
        S0 = W.sum()
        S1 = 0
        for i in range(n):
            for j in range(n):
                S1 += 0.5 * (W[i, j] + W[j, i]) ** 2
        S2 = 0
        for i in range(n):
            S2 += (W[i, :].sum() + W[:, i].sum()) ** 2

        # 计算局部moran指数
        Ii = list()
        for i in range(n):
            Ii_ = n * Z[0, i]
            Ii__ = 0
            for j in range(n):
                Ii__ += W[i, j] * Z[0, j]
            Ii_ = Ii_ * Ii__ / ((Z * Z).sum())
            Ii.append(Ii_)

        return np.array(Ii)



if __name__ == "__main__":
    m = moranI()

    # A = [{
    #     "x": 1, "y": 4, "value": 8
    # },{
    #     "x": 2, "y": 0, "value": 6
    # },{
    #     "x": 1, "y": 3, "value": 6
    # },{
    #     "x": 4, "y": 2, "value": 3
    # },{
    #     "x": 0, "y": 3, "value": 2
    # }]

    def fx(d):
        return (d + 128.14621384226703) / (67.85378615773539 - -128.14621384226703) * 398

    def fy(d):
        d = (d - 50.55349948549696) / (22.86881607932105 - 50.55349948549696) * (22.86881607932105 - 50.55349948549696) + 50.55349948549696 + 2 * (1 - (22.86881607932105 - 50.55349948549696) / (22.86881607932105 - 50.55349948549696))
        return 400 * (d * d * (-0.00025304519602050573) - d * 0.01760550015218513 + 1.5344062688366468)

    with open("../data/industry_data.json", mode='r', encoding='utf8') as f:
        A = [{
            "x": fx(d["lng"]),
            "y": fy(d["lat"]),
            "value": d["value"]
        } for d in json.load(f)]

    # print(A)

    m.fit(A)

    transform = m.transform()

    print(transform)

    pass
