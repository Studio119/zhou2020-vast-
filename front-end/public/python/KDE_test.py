import numpy as np
from sklearn.neighbors import KernelDensity
from scipy import stats
from random import randint, sample
from Z_score import Z_score as Z_score


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
            "p_ready": [],   # 当前可激活点
            "result": [],   # 被采样点
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
        当前剩余可被选择点
        @type {list<number>}
        """
        self._snapshot["p_ready"] = [i for i in range(N)]

        # 开始循环
        while len(self._snapshot["p_ready"]) or len(self._snapshot["p_active"]):
            self._snapshot["p_active"] =\
                self._onLoopBegin() if len(self._snapshot["p_active"])\
                        else self._onLoopEnter()
            print(
                len(self._snapshot["p_ready"]),
                len(self._snapshot["p_active"])
            )
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
            "r": self._snapshot["pr"] / self.kde_map[idx],
            "lat": self.dataset[idx]["lat"],
            "lng": self.dataset[idx]["lng"],
            "id": len(self._snapshot["poissons"]),
            "value": self.dataset[idx]["value"],
            "type": self.dataset[idx]["type"],
            "pointsInDisk": []
        }

        # 检查盘内是否含有已有泊松盘的圆心
        for p in self._snapshot["poissons"]:
            dist = (
                (self.dataset[idx]["x"] - self.dataset[p["c_index"]]["x"]) ** 2
                + (self.dataset[idx]["y"] - self.dataset[p["c_index"]]["y"]) ** 2
            ) ** 0.5 - poisson["r"]
            if dist < 0:
                poisson["r"] += dist

        """
        位于泊松盘 r ~ 2r 之间的可激活点列表
        @type {list<number>}
        """
        possible = []

        count = 0

        for d in self._snapshot["p_active"]:
            # 判断指定点的关系
            pos = BalanceSampling._checkIfPointAvailable({
                "x": self.dataset[idx]["x"],
                "y": self.dataset[idx]["y"]
            }, {
                "x": self.dataset[d]["x"],
                "y": self.dataset[d]["y"]
            }, poisson["r"])

            if pos == 1:
                # 落入禁区，标记为无效
                poisson["pointsInDisk"].append({
                    "id": d,
                    "lat":self.dataset[d]["lat"],
                    "lng": self.dataset[d]["lng"],
                    "value": self.dataset[d]["value"],
                    "type": self.dataset[d]["type"]
                })
                count += 1
            else:
                possible.append(d)
            pass

        removing = []
        
        for d in self._snapshot["p_ready"]:
            # 判断指定点的关系
            pos = BalanceSampling._checkIfPointAvailable({
                "x": self.dataset[idx]["x"],
                "y": self.dataset[idx]["y"]
            }, {
                "x": self.dataset[d]["x"],
                "y": self.dataset[d]["y"]
            }, poisson["r"])

            if pos == 1:
                poisson["pointsInDisk"].append({
                    "id": d,
                    "lat":self.dataset[d]["lat"],
                    "lng": self.dataset[d]["lng"],
                    "value": self.dataset[d]["value"],
                    "type": self.dataset[d]["type"]
                })
                # 落入禁区，标记为无效
                removing.append(d)
                count += 1
            elif pos == 2:
                removing.append(d)
                possible.append(d)
            pass

        for i in removing:
            self._snapshot["p_ready"].remove(i)

        pc = {
            "x": self.dataset[idx]["x"],
            "y": self.dataset[idx]["y"]
        }

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
        dist = ((pc["x"] - p["x"]) ** 2 + (pc["y"] - p["y"]) ** 2) ** 0.5
        if dist <= r * 2:
            return 1 if dist <= r else -1
        return -1
        # if abs(pc["x"] - p["x"]) > r * 2:
        #     return -1
        # elif abs(pc["y"] - p["y"]) > r * 2:
        #     return -1
        # else:
        #     # dist_2 = (pc["x"] - p["x"]) ** 2 + (pc["y"] - p["y"]) ** 2
        #     # if dist_2 <= (r * 2) ** 2:
        #     #     return 1 if dist_2 <= r ** 2 else 2
        #     dist = ((pc["x"] - p["x"]) ** 2 + (pc["y"] - p["y"]) ** 2) ** 0.5
        #     if dist <= r * 2:
        #         return 1 if dist <= r else -1
        #     return -1


    """
    从所有点集中随机激活一个点，生成一个新的泊松盘
    @returns {list<number>} 位于新泊松盘 r ~ 2r 范围的可激活点索引集合
    """
    def _onLoopEnter(self):
        idx = self._snapshot["p_ready"].pop(randint(0, len(self._snapshot["p_ready"]) - 1))
        self._snapshot["result"].append(idx)
        poisson, possible = self._generatePoisson(idx)
        self._snapshot["poissons"].append(poisson)
        return possible
        
        
    """
    从当前活跃点集中随机采样一个点，生成一个新的泊松盘
    @returns {list<number>} 位于新泊松盘 r ~ 2r 范围的可激活点索引集合
    """
    def _onLoopBegin(self):
        idx = self._snapshot["p_active"].pop(randint(0, len(self._snapshot["p_active"]) - 1))
        self._snapshot["result"].append(idx)
        poisson, possible = self._generatePoisson(idx)
        self._snapshot["poissons"].append(poisson)
        return possible


if __name__ == "__main__":
    bs = BalanceSampling()
    import json

    def fx(d):
        return (d - -128.14621384226703) / (-67.85378615773539 - -128.14621384226703) * 1147

    def fy(d):
        d = (d - 50.55349948549696) / (22.86881607932105 - 50.55349948549696)\
            * (22.86881607932105 - 50.55349948549696) + 50.55349948549696\
                + 2 * (1 - (22.86881607932105 - 50.55349948549696) / (22.86881607932105 - 50.55349948549696))
        return 834 * (d * d * (-0.00025304519602050573) - d * 0.01760550015218513 + 1.5344062688366468)

    with open("../data/healthy_output_10.json", mode='r', encoding='utf8') as f:
        dataset = [{
            "type": d["type"],
            "x": fx(d["lng"]),
            "y": fy(d["lat"]),
            "lng": d["lng"],
            "lat": d["lat"],
            # "x": d["lng"],
            # "y": d["lat"],
            "value": d["value"]
        } for d in json.load(f)]
        
        bs.fit(dataset)
        res = bs.sample(0.001)
        print(len(res))
        # show(dataset, [])

        count = {
            "HH": 0,
            "LH": 0,
            "LL": 0,
            "HL": 0
        }

        for d in dataset:
            count[d["type"]] += 1
        
        print("原来：", count)
        print("原来：", {
            "HH": count["HH"] / len(dataset),
            "LH": count["LH"] / len(dataset),
            "LL": count["LL"] / len(dataset),
            "HL": count["HL"] / len(dataset)
        })

        sampled = [{
            "lng": dataset[i]["lng"],
            "lat": dataset[i]["lat"],
            "value": dataset[i]["value"]
        } for i in res]

        zs = Z_score(k=10, mode="euclidean", equal=False).fit(sampled)

        coming = [zs.type_idx(i) for i in range(len(res))]
        
        count = {
            "HH": 0,
            "LH": 0,
            "LL": 0,
            "HL": 0
        }

        mis = 0

        for i, e in enumerate(res):
            d = coming[i]
            count[d] += 1
            if d != dataset[e]["type"]:
                mis += 1
        
        print("蓝噪声：", count)
        print("蓝噪声：", {
            "HH": count["HH"] / len(res),
            "LH": count["LH"] / len(res),
            "LL": count["LL"] / len(res),
            "HL": count["HL"] / len(res)
        })

        print("采样率：", len(res) / len(dataset))
        print("正确率：", 1 - mis / len(res))

        r = sample([i for i in range(len(dataset))], len(res))

        sampled = [{
            "lng": dataset[i]["lng"],
            "lat": dataset[i]["lat"],
            "value": dataset[i]["value"]
        } for i in r]

        zs = Z_score(k=10, mode="euclidean", equal=False).fit(sampled)

        coming = [zs.type_idx(i) for i in range(len(res))]
        
        count = {
            "HH": 0,
            "LH": 0,
            "LL": 0,
            "HL": 0
        }

        mis = 0

        for i, e in enumerate(res):
            d = coming[i]
            count[d] += 1
            if d != dataset[e]["type"]:
                mis += 1
        
        print("随机：", count)
        print("随机：", {
            "HH": count["HH"] / len(res),
            "LH": count["LH"] / len(res),
            "LL": count["LL"] / len(res),
            "HL": count["HL"] / len(res)
        })

        print("采样率：", len(res) / len(dataset))
        print("正确率：", 1 - mis / len(res))

        with open("../data/samplePoints-all.json", mode='w', encoding='utf8') as p:
            json.dump(bs._snapshot["poissons"], p)
        
    pass

