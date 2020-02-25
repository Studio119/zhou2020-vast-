#!/usr/bin/env python3
from random import random as rand
import matplotlib.pyplot as plt
import math
import copy
import tqdm


class Sampler:
    def __init__(self, hash_precision=32, max_iter=10, n_stacks=100):
        self.hash_precision = hash_precision
        self.max_iter = max_iter
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
            label_count[d["label"]] = True
            after_hash.append({
                "index": i,
                "code": self._geo_hash(d["lat"], d["lng"]),
                "label": d["label"],
                "value": d["value"]
            })

        after_hash.sort(key=lambda d: d["code"])

        n_stack = int(min(len(after_hash) / 100, self.n_stacks) / len(label_count)) | 1

        step = int(len(after_hash) / n_stack)

        hash_sorted = [{
            "index": d["index"],
            "label": d["label"],
            "value": d["value"]
        } for d in after_hash]

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
        if l == 0:
            return None
        else:
            return item_list.pop(int(rand() * l))



    """
    * @param {Array<{lat: number; lng: number; value: number; label: number;}>} data
    * @returns {Array<number>}
    """
    def sample(self, data, delta=0.05, C=0.1, kappa=2):
        self._n_sampled = []

        # Make groups of points by label
        groups = self._group(data)

        s = []

        # count population
        population = {}

        _i = 0

        # Apply sampling to all groups, while take each label-gathered data as a column
        for group in groups:
            for label in group:
                self._n_sampled.append([len(group[label])])
                population[_i] = group[label]
                _i += 1

        # mark indexes of samples by column
        sampled = {}

        # Iteration
        for t in tqdm.trange(self.max_iter, ncols=10, leave=True):
            if t > 0:
                # Update population and samples
                population = copy.deepcopy(sampled)
                sampled = {}
                pass
            
            for index in population:
                sampled[index] = []
            
            # Mark the estimates
            v = {}
            for index in population:
                v[index] = None

            # indexes of sets
            sets = []

            # Take the first sample of each set
            for index in population:
                res = self._random_select(population[index])
                if res:
                    v[index] = res["value"]
                    sampled[index].append(res)
                    sets.append(index)

            k = len(sets)

            if k == 0:
                break
            elif k == 1 and len(population[sets[0]]) > 0:
                # take the one clearest to the average
                aver = 0
                for d in population[sets[0]]:
                    aver += d["value"]
                aver /= len(population[sets[0]])
                population[sets[0]].sort(key=lambda d: math.fabs(population[sets[0]] - aver))
                res = population[sets[0]].pop(0)
                sampled[sets[0]].append(res)
                break

            # Initialize
            m = 1

            while len(sets) > 0:
                m += 1
                
                epsilon = C * math.sqrt(
                    (1 - (m / kappa - 1) / max([len(population[index]) for index in population]))
                    * (2 * math.log(math.log(m, kappa)) + math.log(math.pi ** 2 * len(population) / 3 / delta)) / (2 * m / kappa)
                )

                for index in [i for i in sets if len(population[i]) > 0]:
                    res = self._random_select(population[index])
                    v[index] = v[index] * (m - 1) / m + res["value"] / m
                    sampled[index].append(res)

                safe = []

                for i in sets:
                    # Confidence Interval
                    ci = (v[i] - epsilon, v[i] + epsilon)
                    overlap = False
                    for j in [j for j in sets if j != i]:
                        if ci[0] >= v[j] + epsilon or ci[1] <= v[j] - epsilon:
                            pass
                        else:
                            overlap = True

                    if not overlap:
                        safe.append(i)
                    
                sets = [index for index in sets if index not in safe and len(population[index]) > 0]
                pass

            for index in sampled:
                self._n_sampled[index].append(len(sampled[index]))
            pass

        for index in sampled:
            s.extend(sampled[index])

        return [d["index"] for d in s]

    
    def show(self):
        for res in self._n_sampled:
            # print(res)
            plt.plot([i for i in range(len(res))][1:], res[1:], color='#FF000040', linestyle='-')
        plt.show()


    def diff(self, population, sample):
        # Make groups of points by label
        groups = self._group(population)

        s = []

        # count population - before
        population_groups = {}

        # count population - after
        sample_groups = {}

        _i = 0

        # Apply sampling to all groups, while take each label-gathered data as a column
        for group in groups:
            for label in group:
                population_groups[_i] = [d["value"] for d in group[label]]
                sample_groups[_i] = []
                for d in group[label]:
                    if d["index"] in sample:
                        sample_groups[_i].append(d["value"])
                # print(len(sample_groups[_i]), len(population_groups[_i]))
                _i += 1

        ranging = []

        for group in population_groups:
            aver = 0
            for d in population_groups[group]:
                aver += d
            aver /= len(population_groups[group])
            ranging.append({
                'index': group,
                'before': aver
            })

        for group in sample_groups:
            aver = 0
            for d in sample_groups[group]:
                aver += d
            aver /= len(sample_groups[group])
            for r in ranging:
                if r["index"] == group:
                    r["after"] = aver
                    break

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

        return 1 - mistake / count


if __name__ == '__main__':
    g_r = lambda : (rand() + rand() + rand() + rand() + rand() + rand()) / 6

    n_sample = 100000

    population = [{
        "lat": 45.0 + g_r() * 30,
        "lng": -15.0 + g_r() * 50,
        "value": rand(),
        "label": int(rand() * 3)
    } for _ in range(n_sample)]

    s = Sampler(max_iter=1, n_stacks=10)
    res = s.sample(population, C=.01)
    print(len(res), len(res) / n_sample)
    print(s.diff(population, res))
    s.show()


"""
  
     █████▒█    ██  ▄████▄   ██ ▄█▀       ██████╗ ██╗   ██╗ ██████╗
   ▓██   ▒ ██  ▓██▒▒██▀ ▀█   ██▄█▒        ██╔══██╗██║   ██║██╔════╝
   ▒████ ░▓██  ▒██░▒▓█    ▄ ▓███▄░        ██████╔╝██║   ██║██║  ███╗
   ░▓█▒  ░▓▓█  ░██░▒▓▓▄ ▄██▒▓██ █▄        ██╔══██╗██║   ██║██║   ██║
   ░▒█░   ▒▒█████▓ ▒ ▓███▀ ░▒██▒ █▄       ██████╔╝╚██████╔╝╚██████╔╝
    ▒ ░   ░▒▓▒ ▒ ▒ ░ ░▒ ▒  ░▒ ▒▒ ▓▒       ╚═════╝  ╚═════╝  ╚═════╝
    ░     ░░▒░ ░ ░   ░  ▒   ░ ░▒ ▒░
    ░ ░    ░░░ ░ ░ ░        ░ ░░ ░
             ░     ░ ░      ░  ░

"""