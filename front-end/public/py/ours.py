from scipy import stats
import json
import numpy as np
import matplotlib.pyplot as plt
import random
import pymorton as pm
import math
from Z_score import Z_score as Z_score
from newBlue import update1, update2
import sys
import os

def Zorder_auto(filename, m, N):

    ori = []
    sample = []
    with open(filename, 'r', encoding='utf8') as f:
        for i in f:
            ori = json.loads(i)

    for index, i in enumerate(ori):
        i['id'] = index

    geo_hash_dict = {}
    geo_hash = []
    s_set = set()
    datasets = {}
    for index, i in enumerate(ori):
        geohash = pm.interleave_latlng(i['lng'], i['lat'])
        geo_hash_dict[str(index)] = geohash
        datasets[str(index)] = [geohash]
        geo_hash.append(geo_hash)
        s_set.add(geohash)
    # print(geo_hash)
    # print(len(geo_hash))
    # print(len(s_set))

    a1 = sorted(geo_hash_dict.items(), key=lambda x: x[1], reverse=True)

    aa = 20000

    num = N
    num1 = math.floor(aa/num)
    if (aa-num*num1) % num1 == 0:
        num += math.floor((aa-num*num1)/num1)
    else:
        num += math.floor((aa-num*num1)/num1) + 1

    sample_list = []
    z_lsit = []
    attribute_dict ={}
    attribute_list = []
    x = np.zeros([num, 1])
    for i in range(num):
        if abs(aa-1 - i*num1) < num1:
            b = a1[i*num1: aa]
        else:
            b = a1[i*num1: (i+1)*num1]
        z_lsit.append(b)
        # print(b, i)
        c = random.sample(b, 1)
        sample_list.append(c[0][0])


    A = [{
        "lng": ori[int(d)]['lng'],
        "lat": ori[int(d)]['lat'],
        "value": ori[int(d)]["value"],
        'id': ori[int(d)]['id'],
        'type': ori[int(d)]['type']
    } for d in sample_list]

    m.fit(A)

    transform = [m.type_idx(i) for i in range(len(A))]

    with open("./z-order/order_crime_output_{}.json".format(m.k), mode='w', encoding='utf8') as f:
        res = []
        for i in range(len(A)):
            neighbors = m.neighbors[i]
            res.append({
                'id': A[i]['id'],
                "type": transform[i],
                "lat": A[i]["lat"],
                "lng": A[i]["lng"],
                "value": A[i]["value"],
                "mx": m.score[i][0],
                "my": m.score[i][1],
                "neighbors": neighbors
            })
        json.dump(res, f)

    with open('./z-order/order_crime_output_{}.json'.format(m.k), 'r', encoding='utf-8') as f:
        for i in f:
            RecomputingPoints = json.loads(i)
    oriData = A
    correct = 0
    mean = 0
    for i in range(len(oriData)):
        mean += RecomputingPoints[i]['value']
        if RecomputingPoints[i]['type'] == ori[RecomputingPoints[i]['id']]['type']:
            correct += 1
    return A, correct, RecomputingPoints, mean/(len(oriData))


def Zorder_auto_voting(filename, m, N, alpha, dirname, outputname):
    ori = []
    sample = []
    with open(filename, 'r', encoding='utf8') as f:
        ori = json.load(f)

    for index, i in enumerate(ori):
        i['id'] = index

    geo_hash_dict = {}
    geo_hash = []
    s_set = set()
    datasets = {}
    for index, i in enumerate(ori):
        geohash = pm.interleave_latlng(i['lng'], i['lat'])
        geo_hash_dict[str(index)] = geohash
        datasets[str(index)] = [geohash]
        geo_hash.append(geo_hash)
        s_set.add(geohash)
    # print(geo_hash)
    # print(len(geo_hash))
    # print(len(s_set))

    a1 = sorted(geo_hash_dict.items(), key=lambda x: x[1], reverse=True)

    aa = len(ori)

    num = math.floor(aa*float(N))
    num1 = math.floor(aa / num)
    if (aa - num * num1) % num1 == 0:
        num += math.floor((aa - num * num1) / num1)
    else:
        num += math.floor((aa - num * num1) / num1) + 1

    sample_list = []
    z_lsit = []
    x = np.zeros([num, 1])
    for i in range(num):
        if abs(aa - 1 - i * num1) < num1:
            b = a1[i * num1: aa]
        else:
            b = a1[i * num1: (i + 1) * num1]
        z_lsit.append(b)
        # print(b, i)
        c = random.sample(b, 1)
        sample_list.append(c[0][0])

    # z_list包含每个分组，统计每个分组的中心点，类比泊松盘，找到10个邻近分组。并获取每个分组内高低值的点分布
    grouping_number = len(z_lsit)
    center_list = []
    c_list = []
    diskCoverPoints = []
    M_list = []
    A_list = []
    for i in z_lsit:
        x = 0
        y = 0
        H_list = []
        L_list = []
        HH, HL, LL, LH = [], [], [], []
        NH = []
        NL = []
        for j in i:
            if ori[int(j[0])]['type'] == 'HH' or ori[int(j[0])]['type'] == 'HL':
                H_list.append(int(j[0]))
                if ori[int(j[0])]['type'] == 'HH':
                    HH.append(int(j[0]))
                else:
                    HL.append(int(j[0]))
            elif ori[int(j[0])]['type'] == 'LL' or ori[int(j[0])]['type'] == 'LH':
                L_list.append(int(j[0]))
                if ori[int(j[0])]['type'] == 'LL':
                    LL.append(int(j[0]))
                else:
                    LH.append(int(j[0]))
            if ori[int(j[0])]['type'] == 'HH' or ori[int(j[0])]['type'] == 'LH':
                NH.append(int(j[0]))
            elif ori[int(j[0])]['type'] == 'LL' or ori[int(j[0])]['type'] == 'HL':
                NL.append(int(j[0]))
            x += ori[int(j[0])]['lat']
            y += ori[int(j[0])]['lng']
        center_list.append([x/len(i), y/len(i)])
        c_list.append([H_list, L_list])
        M_list.append([HH, HL, LL, LH])
        A_list.append([NH, NL])
    # print(c_list)
    # 找到邻接分组
    nearbyM = {}
    for i in range(grouping_number):
        temp ={}
        for j in range(grouping_number):
            if i == j:
                continue
            else:
                temp[str(j)] = math.sqrt((center_list[j][0]-center_list[i][0])**2 + (center_list[j][1]-center_list[i][1])**2)
        a1 = sorted(temp.items(), key=lambda x: x[1], reverse=False)
        a1 = [int(d[0]) for d in a1[0:8]]
        nearbyM[str(i)] = a1

    # 找到相邻盘中包含自己的盘
    bynearM = {}
    # print(grouping_number)
    for i in range(grouping_number):
        temp = []
        for j in nearbyM:
            if i == int(j):
                continue
            else:
                if i in nearbyM[j]:
                    temp.append(int(j))
        bynearM[str(i)] = temp
    # print(bynearM)

    with open(dirname +'\\nearbyM.json', 'w', encoding='utf8') as f:
        f.write(json.dumps(nearbyM))
    with open(dirname +'\\bynearM.json', 'w', encoding='utf8') as f:
        f.write(json.dumps(bynearM))
    # nearbyM = []
    # bynearM = []
    # with open('./z-order/nearbyM.json', 'r', encoding='utf8') as f:
    #     for i in f:
    #         nearbyM = json.loads(i)
    # with open('./z-order/bynearM.json', 'r', encoding='utf8') as f:
    #     for i in f:
    #         bynearM = json.loads(i)
    with open(dirname + '\\nearbyM1.json', 'w', encoding='utf8') as f:
        f.write(json.dumps(M_list))
    # print(M_list)
    a = update2(ori, c_list, nearbyM, bynearM, M_list, A_list, alpha)

    A = [{
        "lng": d['lng'],
        "lat": d['lat'],
        "value": d["value"],
        'id': d['id'],
        'type': d['type']
    } for d in a]

    m.fit(A)

    transform = [m.type_idx(i) for i in range(len(A))]

    with open(outputname, mode='w', encoding='utf8') as f:
        res = []
        for i in range(len(A)):
            neighbors = m.neighbors[i]
            res.append({
                'id': A[i]['id'],
                "type": transform[i],
                "lat": A[i]["lat"],
                "lng": A[i]["lng"],
                "value": A[i]["value"],
                "mx": m.score[i][0],
                "my": m.score[i][1],
                "neighbors": neighbors
            })
        json.dump(res, f)

    with open(outputname, 'r', encoding='utf-8') as f:
        for i in f:
            RecomputingPoints = json.loads(i)
    oriData = A
    correct = 0
    mean = 0
    for i in range(len(oriData)):
        mean += RecomputingPoints[i]['value']
        if RecomputingPoints[i]['type'] == ori[RecomputingPoints[i]['id']]['type']:
            correct += 1
    return A, correct, RecomputingPoints, ori, mean/len(oriData)

# def updating(grouping_list, )

if __name__ == '__main__':
    # filename = './blue noise/healthy_output_81.json'
    # dir = os.getcwd()
    filename = sys.argv[1]
    t = filename.split('\\')
    # print(t)
    recentBlueNoiseFilePath = ''
    recentBlueNoiseFilePath1 = ''
    for index, i in enumerate(t):
        if index == len(t) - 1:
            temp1 = i.split('.')
        if index < len(t) - 1:
            temp = i + '\\'
            recentBlueNoiseFilePath += temp
            recentBlueNoiseFilePath1 += temp
        else:
            recentBlueNoiseFilePath1 += (temp1[0]+'_o.json')
    alpha = sys.argv[2]
    rate = sys.argv[3]
    m = Z_score(k=8, mode="euclidean", equal=False)
    A, correct, RecomputingPoints, Original, sampleM = Zorder_auto_voting(filename, m, rate, alpha, recentBlueNoiseFilePath, recentBlueNoiseFilePath1)
    oriData = A
    original_mean = 0
    for i in Original:
        original_mean += i['value']
    # print('原始均值', original_mean/len(Original))
    # print('采样后均值', sampleM)
    x_data_list = [[], [], [], [], []]
    y_data_list = [[], [], [], [], []]
    HH = 0
    HL = 0
    LL = 0
    LH = 0
    for i in range(len(oriData)):
        if RecomputingPoints[i]['type'] == oriData[i]['type']:
            if RecomputingPoints[i]['type'] == 'HH':
                x_data_list[0].append(RecomputingPoints[i]['lat'])
                y_data_list[0].append(RecomputingPoints[i]['lng'])
                HH += 1
            elif RecomputingPoints[i]['type'] == 'HL':
                x_data_list[1].append(RecomputingPoints[i]['lat'])
                y_data_list[1].append(RecomputingPoints[i]['lng'])
                HL += 1
            elif RecomputingPoints[i]['type'] == 'LL':
                x_data_list[2].append(RecomputingPoints[i]['lat'])
                y_data_list[2].append(RecomputingPoints[i]['lng'])
                LL += 1
            elif RecomputingPoints[i]['type'] == 'LH':
                x_data_list[3].append(RecomputingPoints[i]['lat'])
                y_data_list[3].append(RecomputingPoints[i]['lng'])
                LH += 1
        else:
            x_data_list[4].append(RecomputingPoints[i]['lat'])
            y_data_list[4].append(RecomputingPoints[i]['lng'])
    HH_HL = 0
    HH_LL = 0
    HH_LH = 0

    LL_HL = 0
    LL_LH = 0
    LL_HH = 0

    HL_HH = 0
    HL_LL = 0
    HL_LH = 0

    LH_HH = 0
    LH_LL = 0
    LH_HL = 0
    for i in range(len(RecomputingPoints)):
        if oriData[i]['type'] == 'HH' and RecomputingPoints[i]['type'] == 'HL':
            HH_HL += 1
        if oriData[i]['type'] == 'HH' and RecomputingPoints[i]['type'] == 'LL':
            HH_LL += 1
        if oriData[i]['type'] == 'HH' and RecomputingPoints[i]['type'] == 'LH':
            HH_LH += 1

        if oriData[i]['type'] == 'LL' and RecomputingPoints[i]['type'] == 'HH':
            LL_HH += 1
        if oriData[i]['type'] == 'LL' and RecomputingPoints[i]['type'] == 'HL':
            LL_HL += 1
        if oriData[i]['type'] == 'LL' and RecomputingPoints[i]['type'] == 'LH':
            LL_LH += 1

        if oriData[i]['type'] == 'HL' and RecomputingPoints[i]['type'] == 'HH':
            HL_HH += 1
        if oriData[i]['type'] == 'HL' and RecomputingPoints[i]['type'] == 'LL':
            HL_LL += 1
        if oriData[i]['type'] == 'HL' and RecomputingPoints[i]['type'] == 'LH':
            HL_LH += 1

        if oriData[i]['type'] == 'LH' and RecomputingPoints[i]['type'] == 'HH':
            LH_HH += 1
        if oriData[i]['type'] == 'LH' and RecomputingPoints[i]['type'] == 'LL':
            LH_LL += 1
        if oriData[i]['type'] == 'LH' and RecomputingPoints[i]['type'] == 'HL':
            LH_HL += 1
    # print('HH变成其他的', HH_HL, HH_LL, HH_LH)
    # print('LL变成其他的', LL_HH, LL_HL, LL_LH)
    # print('HL变成其他的', HL_HH, HL_LL, HL_LH)
    # print('LH变成其他的', LH_HH, LH_LL, LH_HL)
    # print('after', HH, HL, LL, LH)
    # print('correct', correct)

    HH = 0
    HL = 0
    LL = 0
    LH = 0
    for i in range(len(oriData)):
        if oriData[i]['type'] == 'HH':
            HH += 1
        elif oriData[i]['type'] == 'HL':
            HL += 1
        elif oriData[i]['type'] == 'LL':
            LL += 1
        elif oriData[i]['type'] == 'LH':
            LH += 1

    # print('before', HH, HL, LL, LH)
