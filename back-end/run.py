#!/usr/bin/env python3
import random
from random import random as rand
import matplotlib.pyplot as plt
import math
import copy
import tqdm
import logging
import json


class Sampler:
    def __init__(self, hash_precision=32, max_iter=10, min_accuracy=0.9, n_stacks=100):
        self.hash_precision = hash_precision
        self.max_iter = max_iter
        self.min_accuracy = min_accuracy
        self.n_stacks = n_stacks
        self._n_sampled = []
        return


    """
    * Encodes geographic coordinates using z-order
    """
    def _geo_hash(self, lat, lng):
        if not isinstance(lat, float) or not isinstance(lng, float):
            # 处理不合法数据
            print("lat-lng ({},{}) is not a legal input".format(lat, lng))
            raise ValueError("Expected type float")

        # 整理坐标定义域
        if lng > 180:
            x = lng % 180 + 180.0
        elif lng < -180:
            x = 180.0 - (-lng % 180)
        else:
            x = lng + 180.0
        if lat > 90:
            y = lat % 90 + 90.0
        elif lat < -90:
            y = 90.0 - (-lat % 90)
        else:
            y = lat + 90.0

        hash_code = ""

        for dx in [180.0 / 2 ** n for n in range(self.hash_precision)]:
            digit = 0
            if y >= dx:
                digit |= 2
                y -= dx
            if x >= dx:
                digit |= 1
                x -= dx
            hash_code += str(digit)

        return hash_code


    """
    * @param {Array<{lat: number; lng: number; value: number; label: number;}>} data
    * @param {"average"|"bycode"|"bycount"}
    * @returns {Array<{[label: number]: Array<{index: number; value: number;}>}>}
    """
    def _group(self, data, mode="average"):
        groups = []

        """
        * @param {Array<{index: number; code: string; label: number; value: number;}>}
        """
        after_hash = []

        label_count = {}

        for i in range(len(data)):
            d = data[i]
            if "label" in d:
                label = d["label"]
            else:
                label = 0
            label_count[label] = True
            after_hash.append({
                "index": i,
                "code": self._geo_hash(d["lat"], d["lng"]),
                "label": label,
                "value": d["value"]
            })

        after_hash.sort(key=lambda d: d["code"])

        n_stack = int(self.n_stacks / len(label_count)) | 1

        step = int(len(after_hash) / n_stack)

        """
        * @param {Array<Array<{index: number; label: number; value: number;}>>}
        """
        stacks = [after_hash[i * step: (i + 1) * step] for i in range(n_stack)]
        if n_stack * step < len(after_hash):
            stacks[-1].extend(after_hash[n_stack * step: len(after_hash)])

        for s in stacks:
            groups.append({})
            for d in s:
                label = d["label"]
                if label not in groups[-1]:
                    groups[-1][label] = []
                groups[-1][label].append({
                    "index": d["index"],
                    "value": d["value"]
                })

        return groups


    """
    * @param {Array<{index: number; value: number;}>} item_list
    * @returns {{index: number; value: number;} | null}
    """
    def _random_select(self, item_list):
        l = len(item_list)
        return item_list.pop(int(rand() * l))


    def _rapid_sample(self, data, kappa, delta, C):
        """
        每个类及其所对应的未被采样的点
        @type {{[column_index: number]: Array<{value: number; index: number;}>}}
        """
        groups = copy.deepcopy(data)

        """
        估计值
        @type {{[column_id]: number}}
        """
        v = {}

        """
        置信区间
        @type {{[column_id]: [number, number]}}
        """
        confidence_interval = {}
        
        """
        被采样到的点
        @type {{[column_id]: Array<index: number>}}
        """
        sample = {}
        
        """
        还需继续采样的柱子 id
        @type {Array<column_index: number>}
        """
        active_labels = [index for index in groups]
        
        # 预先从各个类别中采集一个样本
        for i in range(len(active_labels)):
            b = random.randint(0, len(groups[active_labels[i]]) - 1)
            v[active_labels[i]] = groups[active_labels[i]][b]["value"]
            sample[active_labels[i]] = [groups[active_labels[i]][b]]
            groups[active_labels[i]].pop(b)
        sample_num = len(active_labels)
        
        """
        迭代变量
        @type {number}
        """
        m = 1

        # 继续选点
        while active_labels:
            """
            当前继续采样的柱子 id
            @type {Array<column_index: number>}
            """
            cur_labels = copy.deepcopy(active_labels)

            m += 1

            # 去掉已经没有点的柱子
            for i in range(len(active_labels)-1, -1, -1):
                if len(groups[active_labels[i]]) == 0:
                    cur_labels.pop(i)

            temp_length_list = [len(groups[cur_labels[i]]) for i in range(len(cur_labels))]

            if temp_length_list:
                pass
            else:
                break

            alpha = 1 - (m / kappa - 1) / max(temp_length_list)
            if alpha < 0:
                logging.info('无法计算 epsilon 值')
                break
            mi = (2 * math.log(math.log(m, kappa)) + math.log(math.pi ** 2 * len(groups) / (3 * delta))) / (2 * m / kappa)
            epsilon = C * math.sqrt(alpha * mi)
            
            active_labels = cur_labels

            for i in range(len(active_labels)):
                b = random.randint(0, len(groups[active_labels[i]]) - 1)
                v[active_labels[i]] = (m - 1) / m * v[active_labels[i]] + groups[active_labels[i]][b]["value"] / m
                sample[active_labels[i]].append(groups[active_labels[i]][b])
                groups[active_labels[i]].pop(b)
                sample_num += 1

            # 更新置信区间
            for index in active_labels:
                confidence_interval[index] = (v[index] - epsilon, v[index] + epsilon)

            """
            置信区间已经独立的柱子的索引
            @type {number}
            """
            isoluted = []

            # 判断重叠
            for i in active_labels:
                overlap = False
                for j in [index for index in active_labels if index != i]:
                    if confidence_interval[i][0] > confidence_interval[j][1] or confidence_interval[i][1] < confidence_interval[j][0]:
                        pass
                    else:
                        overlap = True
                        break                
                if not overlap:
                    isoluted.append(i)

            active_labels = [index for index in active_labels if index not in isoluted]
            
        return sample

    """
    * @param {Array<{lat: number; lng: number; value: number; label: number;}>} data
    * @returns {Array<number>}
    """
    def sample(self, data, delta=0.05, C=0.1, kappa=2):
        if kappa > 10:
            math.log(-1)
            exit(0)

        self._n_sampled = []

        # Make groups of points by label
        groups = self._group(data)

        # count population
        population = {}

        g = []
        gc = []

        _i = 0

        # Apply sampling to all groups, while take each label-gathered data as a column
        for group in groups:
            for label in group:
                self._n_sampled.append([len(group[label])])
                population[_i] = group[label]
                g.append({
                    "id": _i,
                    "parent": -1,
                    "children": [],
                    "containedpoint": [d["index"] for d in group[label]]
                })
                gc.extend([d["index"] for d in group[label]])
                _i += 1

        with open("../front-end/public/data/tree.json", mode='w', encoding='utf8') as f:
            json.dump({
                "id": -1,
                "parent": None,
                "children": g,
                "containedpoint": gc
            }, f)

        # mark indexes of samples by column
        sampled = {}

        tr = tqdm.trange(self.max_iter, ncols=10, leave=True)
        # tr = range(self.max_iter)

        # Iteration
        for _ in tr:
            result = self._rapid_sample(population, kappa=kappa, delta=delta, C=C)
            _dif, _rate = self.diff(data, result)
            least = 1
            _c = C
            while _dif < least or _rate == 1:
                try:
                    least = self.min_accuracy + (least - self.min_accuracy) ** 2
                    _c += 0.01 * least
                    result = self._rapid_sample(population, kappa=kappa, delta=delta, C=_c)
                    _dif, _rate = self.diff(data, result)
                except KeyboardInterrupt:
                    tqdm.tqdm.write("Interrupted at " + str(_dif) + "\t" + str(_rate))

                    return population
            population = result
            for index in population:
                self._n_sampled[index].append(len(population[index]))
            # tqdm.tqdm.write(str(_))
            tqdm.tqdm.write(str(_dif) + "\t" + str(_rate))
            # print(str(_), str(self.diff(data, population)))

        return population
    
    
    def show(self):
        for res in self._n_sampled:
            plt.plot([i for i in range(len(res))][1:], res[1:], color='#FF000040', linestyle='-')
        plt.show()


    def diff(self, population, sample_groups):
        population_groups = {}

        _i = 0

        count_before = 0
        count_after = 0

        # Apply sampling to all groups, while take each label-gathered data as a column
        for group in self._group(population):
            for label in group:
                count_before += len(group[label])
                population_groups[_i] = group[label]
                _i += 1

        ranging = {}

        for index in range(len(population_groups)):
            aver = 0
            for d in population_groups[index]:
                aver += d["value"]
            aver /= len(population_groups[index])
            ranging[index] = {
                'before': aver
            }

        for index in sample_groups:
            aver = 0
            count_after += len(sample_groups[index])
            for d in sample_groups[index]:
                aver += d["value"]
            aver /= len(sample_groups[index])
            ranging[index]['after'] = aver

        ranging = [ranging[d] for d in ranging]

        count = 0
        mistake = 0

        ranging.sort(key=lambda d: d["before"])

        for i in range(len(ranging)):
            ranging[i]["before"] = i

        ranging.sort(key=lambda d: d["after"])

        for i in range(len(ranging)):
            ranging[i]["after"] = i

        for b in range(len(ranging) - 1):
            # print(ranging[b])
            for a in range(b + 1, len(ranging)):
                count += 1
                if (ranging[a]["after"] - ranging[b]["after"]) * (ranging[a]["before"] - ranging[b]["before"]) < 0:
                    mistake += 1

        # for r in ranging:
        #     print(r)
        # print(mistake, count)

        return 1 - mistake / count, count_after / count_before


if __name__ == '__main__':
    g_r = lambda : (rand() + rand() + rand() + rand() + rand() + rand()) / 6

    with open("../front-end/public/data/industry_data.json", encoding='utf8', mode='r') as f:
        population = json.load(f)

    s = Sampler(max_iter=10, n_stacks=100, min_accuracy=0.97)
    res = s.sample(population, C=0.5, delta=0.001, kappa=3)
    
    with open("../front-end/public/data/industry_sampled.json", encoding='utf8', mode='w') as f:
        r = {}
        for w in res:
            r[w] = [d["index"] for d in res[w]]
        json.dump(r, f)

    s.show()
