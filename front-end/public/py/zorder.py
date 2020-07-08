import sys
from Z_score import Z_score as Z_score
import json
from random import random as rand


def geo_hash(lat, lng):
    code = ""

    y = lat + 90
    x = lng + 180

    for p in range(32):
        dx = 180 / 2 ** p
        digit = 0
        if y >= dx:
            digit |= 2
            y -= dx
        if x >= dx:
            digit |= 1
            x -= dx
        code += str(digit)

    return code


def group(population, rate):
    groups = []
    capacity = int(1 / rate + 0.5)

    population.sort(key=lambda d: d["code"])

    groups = [population[i : i + capacity] for i in range(0, len(population), capacity)]

    return groups


if __name__ == '__main__':
    m = Z_score(k=8, mode="euclidean", equal=False)

    rate = float(sys.argv[1])
    input_name = sys.argv[2]
    output_name = sys.argv[3]

    with open(input_name, mode='r', encoding='utf8') as f:
        data = []
        
        for i, line in enumerate(f.readlines()):
            if len(line.replace("\n", "")) == 0:
                continue
            d = [float(e) for e in line.replace("\n", "").split(",")]
            data.append({
                "id": i,
                "code": geo_hash(d[0], d[1]),
                "lat": d[0],
                "lng": d[1],
                "value": d[2]
            })
        
        groups = group(data, rate)

        sampled = [g[int(len(g) * rand())] for g in groups]

        m.fit(sampled)

        transform = [m.type_idx(i) for i in range(len(sampled))]

        with open(output_name, mode='w', encoding='utf8') as f:
            res = []
            for i in range(len(sampled)):
                neighbors = m.neighbors[i]
                res.append({
                    "type": transform[i],
                    "id": sampled[i]["id"],
                    "lng": sampled[i]["lng"],
                    "lat": sampled[i]["lat"],
                    "value": sampled[i]["value"],
                    "mx": m.score[i][0],
                    "my": m.score[i][1],
                    "neighbors": neighbors
                })
            json.dump(res, f)
