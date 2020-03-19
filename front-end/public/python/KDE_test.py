import numpy as np
from sklearn.neighbors import KernelDensity
from scipy import stats
from random import randint


"""
@class BalanceSampling
用于应用采样的实例
"""
class BalanceSampling:

    """
    @constructor
    实例化一个新的采样器实例
    """
    def __init__(self):
        super().__init__()

        """
        含 Z 得分的数据点矩阵
        @type {list<{
                "type": "HH" | "LH" | "LL" | "HL";
                "x": float;
                "y": float;
                "value": float;
            }>%len=N}
        """
        self.dataset = []

        """
        核密度估计器
        @type {scipy.stats.gaussian_kde?}
        """
        self.kde = None

        """
        核密度估计矩阵
        @type {list<float>%len=n}
        """
        self.kde_map = []

        """
        采样过程中的快照
        """
        self._snapshot = {
            "pr": 2.,       # 预定义半径参数
            "p_active": [], # 当前活跃点集
            "n_ready": 0,   # 当前可激活点数
            "result": [],   # 被采样点
            "state": [],    # 各数据点状态
            "poissons": []  # 泊松盘
        }


    """
    兼容一个含 Z 得分的数据点矩阵
    @param {list<{
        "type": "HH" | "LH" | "LL" | "HL";
        "x": float;
        "y": float;
        "value": float;
    }>%len=N} dataset 
    """
    def fit(self, dataset):
        self.dataset = dataset

        X = np.array([[
            d["y"], d["x"]
        ] for d in dataset])

        self.kde = stats.gaussian_kde(X.T)

        self.kde_map = [self.kde([X[i][0], X[i][1]])[0] for i in range(X.shape[0])]


    """
    进行采样
    @param {float} pr? 预定义半径参数
    @returns {list<number>} 采样点
    """
    def sample(self, pr=1.):
        # 设定半径参数
        self._snapshot["pr"] = pr

        """
        当前数据点总数
        @type {number}
        """
        N = len(self.dataset)

        """
        数据点状态
        - "checked" 已被采样
        - "invaild" 未被采样，但落入禁区
        - "ready"   可被采样
        @type {list<"checked" | "invaild" | "ready">%len=N}
        """
        self._snapshot["state"] = ["ready" for _ in range(N)]
        """
        采样结果
        @type {list<number>}
        """
        self._snapshot["result"] = []
        """
        当前活跃点集
        @type {list<number>}
        """
        self._snapshot["p_active"] = []
        """
        当前剩余可被选择点数
        @type {number}
        """
        self._snapshot["n_ready"] = N

        # 开始循环
        while self._snapshot["n_ready"]:
            possible = self._onLoopBegin() if len(self._snapshot["p_active"])\
                        else self._onLoopEnter()
            # print("下一步：", possible)
            while len(possible):
                idx = possible[randint(0, len(possible) - 1)]
                # print("{} 号点标记为活跃点".format(idx))
                self._snapshot["p_active"].append(idx)
                self._snapshot["state"][idx] = "checked"
                self._snapshot["result"].append(idx)
                self._snapshot["n_ready"] -= 1
                possible = self._onLoopBegin()
                # print("下一步：", possible)
            else:
                # print("{} 号点标记为不活跃点".format(self._snapshot["poissons"][-1]["c_index"]))
                self._snapshot["p_active"].remove(self._snapshot["poissons"][-1]["c_index"])
            # print("...剩余活跃点 {} 个，{} 个点未被禁区覆盖".format(
            #     len(self._snapshot["p_active"]), self._snapshot["n_ready"]
            # ))
            pass

        return self._snapshot["result"]

    
    """
    生成一个新的泊松盘，按规则标记周围的点
    @param {int} idx 圆心点索引
    @returns {{
        "c_index": number,
        "r": number
    }, list<number>}   泊松盘, 位于泊松盘 r ~ 2r 范围的点集
    """
    def _generatePoisson(self, idx):
        poisson = {
            "c_index": idx,
            "r": self._snapshot["pr"] / self.kde_map[idx]
        }

        """
        位于泊松盘 r ~ 2r 之间的可激活点列表
        @type {list<number>}
        """
        possible = []

        count = 0

        # 遍历附近的点，将其他落入禁区的点标记，记录 r ~ 2r 间可被激活的点
        for i, d in enumerate(self._snapshot["state"]):
            if d != "ready":
                # 排除不可激活的点，此处也会剔除其本身
                continue
                
            # 判断指定点的关系
            pos = BalanceSampling._checkIfPointAvailable({
                "x": self.dataset[idx]["x"],
                "y": self.dataset[idx]["y"]
            }, {
                "x": self.dataset[i]["x"],
                "y": self.dataset[i]["y"]
            }, poisson["r"])

            if pos == 1:
                # 落入禁区，标记为无效
                self._snapshot["state"][i] = "invaild"
                self._snapshot["n_ready"] -= 1
                count += 1
            elif pos == 2:
                possible.append(i)
            pass

        print("第 {} 个泊松盘：新增 {} 个点落入禁区".format(len(self._snapshot["poissons"]) + 1, count))

        return poisson, possible


    """
    检测一个点是否位于泊松盘指定半径范围内
    @static
    @param {{x: float; y: float}} pc    泊松盘圆心坐标
    @param {{x: float; y: float}} p     数据点坐标
    @param {number} r                   泊松盘半径
    @returns {-1 | 1 | 2}
    """
    @staticmethod
    def _checkIfPointAvailable(pc, p, r):
        if abs(pc["x"] - p["x"]) > r * 2:
            return -1
        elif abs(pc["y"] - p["y"]) > r * 2:
            return -1
        else:
            dist_2 = (pc["x"] - p["x"]) ** 2 + (pc["y"] - p["y"]) ** 2
            if dist_2 <= (r * 2) ** 2:
                return 1 if dist_2 <= r ** 2 else 2
            return -1


    """
    从所有点集中随机激活一个点，生成一个新的泊松盘
    @returns {list<number>} 位于新泊松盘 r ~ 2r 范围的可激活点索引集合
    """
    def _onLoopEnter(self):
        ps = [i for i, d in enumerate(self._snapshot["state"]) if d == "ready"]
        idx = ps[randint(0, len(ps) - 1)]
        # print("新的流程，{} 号点标记为活跃点".format(idx))
        self._snapshot["p_active"].append(idx)
        self._snapshot["state"][idx] = "checked"
        self._snapshot["result"].append(idx)
        self._snapshot["n_ready"] -= 1
        poisson, possible = self._generatePoisson(idx)
        self._snapshot["poissons"].append(poisson)
        return possible
        
        
    """
    从当前活跃点集中随机采样一个点，生成一个新的泊松盘
    @returns {list<number>} 位于新泊松盘 r ~ 2r 范围的可激活点索引集合
    """
    def _onLoopBegin(self):
        idx = self._snapshot["p_active"][randint(0, len(self._snapshot["p_active"]) - 1)]
        # print("挑选活跃点 {} ".format(idx))
        poisson, possible = self._generatePoisson(idx)
        self._snapshot["poissons"].append(poisson)
        return possible



if __name__ == "__main__":
    bs = BalanceSampling()
    import json

    def fx(d):
        return (d + 128.14621384226703) / (67.85378615773539 - -128.14621384226703) * 398

    def fy(d):
        d = (d - 50.55349948549696) / (22.86881607932105 - 50.55349948549696) * (22.86881607932105 - 50.55349948549696) + 50.55349948549696 + 2 * (1 - (22.86881607932105 - 50.55349948549696) / (22.86881607932105 - 50.55349948549696))
        return 400 - 400 * (d * d * (-0.00025304519602050573) - d * 0.01760550015218513 + 1.5344062688366468)

    def show(origin, sampled):
        from matplotlib import pyplot as plt

        plt.figure(figsize=(16, 8))
        plt.subplot(1, 2, 1)
        
        x = []
        y = []

        di = {
            "HH": "black",
            "LH": "yellow",
            "LL": "blue",
            "HL": "red"
        }

        T = []

        for d in origin:
            x.append(d["x"])
            y.append(d["y"])
            T.append(di[d["type"]])
        
        plt.scatter(x, y, c=T, s=5, alpha=0.6, marker='o')

        plt.subplot(1, 2, 2)
        
        x = []
        y = []

        di = {
            "HH": "black",
            "LH": "yellow",
            "LL": "blue",
            "HL": "red"
        }

        T = []

        for d in sampled:
            x.append(dataset[d]["x"])
            y.append(dataset[d]["y"])
            T.append(di[dataset[d]["type"]])
        
        plt.scatter(x, y, c=T, s=5, alpha=0.6, marker='o')

        plt.show()

        return

    with open("../data/healthy_output_10.json", mode='r', encoding='utf8') as f:
        dataset = [{
            "type": d["type"],
            "x": fx(d["lng"]),
            "y": fy(d["lat"]),
            # "x": d["lng"],
            # "y": d["lat"],
            "value": d["value"]
        } for d in json.load(f)]
        
        bs.fit(dataset)
        res = bs.sample(0.003)
        print(len(res))
        show(dataset, [])
        
    pass

