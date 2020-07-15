import numpy as np
import sys
import json


def get_histogram(A, B, width=None):
    if width == None:
        std = A.std()
        num = A.size
        width = 3.49 * std * num ** (1 / 3)
    
    roots = []

    _min = min(A.min(), B.min())
    _max = max(A.max(), B.max())

    def bucket(val):
        return int((val - _min) / width)

    A_h = []
    B_h = []

    r = _min

    while r < _max:
        A_h.append(0)
        B_h.append(0)
        r += width

    for d in list(A):
        A_h[bucket(d)] += 1

    for d in list(B):
        B_h[bucket(d)] += 1

    for i in range(len(A_h)):
        A_h[i] /= A.size
        B_h[i] /= B.size

    return np.array(A_h), np.array(B_h)


# 0-1, 越接近 1 越相似
def contrast(A, B, method='CV_COMP_CORREL', width=0.1):
    # Correlation
    A_h, B_h = get_histogram(A, B, width)

    H_aver_a = A_h.mean()
    H_aver_b = B_h.mean()

    if method == 'CV_COMP_BHATTACHARYYA':
        d = 0

        for a, b in zip(A_h, B_h):
            d += (a * b) ** 0.5

        return 1 - (1 - d / (H_aver_a * H_aver_b * A_h.size ** 2) ** 0.5) ** 0.5

    dh = 0
    db = 0

    for a, b in zip(A_h, B_h):
        dh += (a - H_aver_a) * (b - H_aver_b)
        db += (a - H_aver_a) ** 2 + (b - H_aver_b) ** 2

    return dh / db ** 0.5


if __name__ == "__main__":
    # from random import random as rand
    # A = np.array([rand() * 100 for _ in range(100)])
    # B = np.array([A[int(rand() * 100)] for _ in range(40)])

    # with open(sys.argv[1], mode='r') as f:
    #     A = np.array([d["value"] for d in json.load(f)])

    # with open(sys.argv[2], mode='r') as f:
    #     B = np.array([d["value"] for d in json.load(f)])

    # print(B.size, A.size, B.size / A.size)
    
    # print(
    #     contrast(A, B, method='CV_COMP_BHATTACHARYYA', width=float(sys.argv[3]))
    # )

    from tqdm import tqdm as tqdm
    import os

    dataset = sys.argv[1]                                           # 数据集名称
    mode = sys.argv[2]                                              # r - 随机 o - 我们的 z - zorder
    rate = sys.argv[3] if len(sys.argv) >= 4 else "0.1"             # 采样率
    repeat = int(sys.argv[4]) if len(sys.argv) >= 5 else 100        # 运行次数

    t = []

    with open("..\\..\\..\\storage\\" + dataset + ".json", mode='r') as f:
        A = np.array([d["value"] for d in json.load(f)])

    if mode == 'r':
        for i in tqdm(range(repeat), leave=True, ncols=40):
            if os.system("..\\cpp\\randomSample " + rate + " < ..\\data\\" + dataset + ".csv > ..\\..\\..\\storage\\" + dataset + "_r_c.json") == 0:
                if os.system("conda activate base & python Z_score.py ..\\..\\..\\storage\\" + dataset + "_r_c.json ..\\..\\..\\storage\\" + dataset + "_r.json") == 0:
                    with open("..\\..\\..\\storage\\" + dataset + "_r.json", mode='r') as f:
                        B = np.array([d["value"] for d in json.load(f)])
                        val = contrast(A, B, method='CV_COMP_BHATTACHARYYA', width=0.1)
                        tqdm.write("{} - {}".format(i + 1, val))
                        t.append(val)
    elif mode == 'o':
        for i in tqdm(range(repeat), leave=True, ncols=40):
            if os.system("conda activate base & python ours.py ..\\..\\..\\storage\\" + dataset + ".json 0.6 " + rate) == 0:
                with open("..\\..\\..\\storage\\" + dataset + "_o.json", mode='r') as f:
                    B = np.array([d["value"] for d in json.load(f)])
                    val = contrast(A, B, method='CV_COMP_BHATTACHARYYA', width=0.1)
                    tqdm.write("{} - {}".format(i + 1, val))
                    t.append(val)
    elif mode == 'z':
        for i in tqdm(range(repeat), leave=True, ncols=40):
            if os.system("conda activate base & python zorder.py " + rate + " ..\\data\\" + dataset + ".csv ..\\..\\..\\storage\\" + dataset + "_z.json") == 0:
                if os.system("conda activate base & python better.py ..\\..\\..\\storage\\" + dataset + "_o.json ..\\..\\..\\storage\\" + dataset + ".json 0.6 1") == 0:
                    with open("..\\..\\..\\storage\\" + dataset + "_ob.json", mode='r') as f:
                        B = np.array([d["value"] for d in json.load(f)])
                        val = contrast(A, B, method='CV_COMP_BHATTACHARYYA', width=0.1)
                        tqdm.write("{} - {}".format(i + 1, val))
                        t.append(val)

    print()
    print(t)
