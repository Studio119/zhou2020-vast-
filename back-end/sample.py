#!/usr/bin/env python3
from random import random as rand
import math


class Sampler:
    def __init__(self, hash_precision=32, max_iter=10, n_stacks=10000):
        self.hash_precision = hash_precision
        self.max_iter = max_iter
        self.n_stacks = n_stacks
        return


    """
    * Clusters data points by hash codes
    * @param {Array<{code: number; index: number; value: number;}>} group
    * @returns {Array<Array<{index: number; value: number;}>>}
    """
    def _cluster(self, group):
        # Sort them by z-order
        group.sort(key=lambda e: e["code"])
        n_stacks = int(min(self.n_stacks, len(group) / 10)) | 1

        stacks = [[] for i in range(n_stacks)]
        step = int(len(group) / n_stacks)
        for i in range(n_stacks):
            for d in group[step * i: step * (i + 1)]:
                stacks[i].append({
                    "index": d["index"],
                    "value": d["value"]
                })

        return stacks


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
    * Make data grouped by label
    * @param {Array<{lat: number; lng: number; value: number; label: number;}>} data
    * @returns {{[label: number]: Array<{code: number; index: number; value: number;}>}}
    """
    def _group(self, data):
        groups = {}
        for i in range(len(data)):
            d = data[i]
            if d["label"] not in groups:
                groups[d["label"]] = []
            # Get geo-code
            geo_code = self._geo_hash(d["lat"], d["lng"])
            groups[d["label"]].append({
                "code": geo_code,
                "index": i,
                "value": d["value"]
            })
        return groups


    """
    * @param {Array<{lat: number; lng: number; value: number; label: number;}>} data
    * @returns {{[label: number]: Array<number>}}
    """
    def sample(self, data, delta=1):
        # Make groups of points by label
        groups = self._group(data)

        s = {}

        # Apply sampling by each group
        for label in groups:
            columns = self._cluster(groups[label])

            contained = [[] for _ in columns]

            for t in range(self.max_iter):
                if t > 0:
                    columns = contained.copy()
                    contained = [[] for _ in columns]
                    pass
                # Mark the sample
                s[label] = []
                
                # Mark the estimates
                v = [None for _ in columns]

                for i in range(len(columns)):
                    g = columns[i]
                    idx = int(rand() * len(g))
                    s[label].append(g[idx]["index"])
                    contained[i].append(g[idx])
                    v[i] = g[idx]["value"]
                    del g[idx]
                
                # Initialize
                m = 1
                A = [i for i in range(len(columns))]

                # Sample complexity
                C = 1

                k = len(columns)
                base = math.log(k)

                if base <= 0:
                    continue

                while len(A) > 0 and len([i for i in A if len(columns[i]) > 0]) > 0:
                    m += 1
                    epsilon = C * math.sqrt(
                        (1 - (m / k - 1) / max([len(l) for l in columns]))
                        * (2 * math.log(math.log(m) / base) + math.log(math.pi ** 2 * k / 3 / delta))
                    )

                    for i in [i for i in A if len(columns[i]) > 0]:
                        idx = int(rand() * len(columns[i]))
                        v[i] = v[i] * (m - 1) / m + columns[i][idx]["value"] / m
                        s[label].append(columns[i][idx]["index"])
                        contained[i].append(columns[i][idx])
                        del columns[i][idx]

                    safe = []

                    for i in A:
                        # Confidence Interval
                        ci = (v[i] - epsilon, v[i] + epsilon)
                        overlap = False
                        for j in [j for j in A if j > i]:
                            if ci[0] >= v[j] + epsilon or ci[1] <= v[j] - epsilon:
                                pass
                            else:
                                overlap = True
                                break

                        if not overlap:
                            safe.append(i)
                        
                    A = [i for i in A if i not in safe]
                    pass
                sd = []
                for i in s[0]:
                    sd.append(i)
                print(len(sd), len(sd) / 100000)
                pass

            return s


if __name__ == '__main__':
    g_r = lambda : (rand() + rand() + rand() + rand() + rand() + rand()) / 6

    n_sample = 100000

    s = Sampler(n_stacks=100, max_iter=40)
    res = s.sample([{
        "lat": 45.0 + g_r() * 30,
        "lng": -15.0 + g_r() * 50,
        "value": rand(),
        "label": 0
    } for i in range(n_sample)])
    sd = []
    for i in res[0]:
        sd.append(i)
    print(len(sd), len(sd) / n_sample)
