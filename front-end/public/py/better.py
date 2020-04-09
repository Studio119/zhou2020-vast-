import json
import random
import logging
import math
from Z_score1 import Z_score

def getGeoDistance(p1, p2):
    # result matches `leaflet` coordinate system
    # can not memorize the distance maxtrix because it's too large,too space-consuming
    lon1 = p1['lng']
    lon2 = p2['lng']
    lat1 = p1['lat']
    lat2 = p2['lat']
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * \
        math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371
    dis = c * r * 1000
    return dis

def far_radius(p1, p2_list):
    max_radius = 0
    for i in p2_list:
        dis = getGeoDistance(p1, i)
        if dis >= max_radius:
            max_radius = dis
    return max_radius


def z_replacement(filename, m):
    # 优化选点
    # filename1 = './outputdata/new_quadtree_sample_21.json'
    possionCenter = []
    oriData = []

    with open(filename, 'r', encoding='utf-8') as f:
        for i in f:
            possionCenter = json.loads(i)
    samplingR = len(possionCenter)
    with open('./blue noise/healthy_output_81.json', 'r', encoding='utf-8') as f:
        for i in f:
            oriData = json.loads(i)

    mean_before = 0
    mean_after = 0
    mean_afterafter = 0

    for i in oriData:
        mean_before += i['value']
    mean_before = mean_before/len(oriData)

    # 统计每个泊松盘的
    dict = []
    point_index_list = []
    for i in possionCenter:
        point_index_list.append(i['id'])
    for index, i in enumerate(possionCenter):
        # if index ==1763 or index ==1767:
        #     print(i)
        # 找出邻近的泊松盘，起始都是中心点
        mean_after += i['value']
        near = i['neighbors']
        H_number = 0
        L_number = 0
        for j in near:
            if oriData[int(j)]['type'] == 'HH' or oriData[int(j)]['type'] == 'HL':
                H_number += 1
            else:
                L_number += 1
        dict.append({'type': oriData[i['id']]['type'], 'near': [H_number, L_number], 'index': i['id'],
                     'neighbor': i['neighbors'], 'counterpart': index})

    mean_after = mean_after/samplingR

    # print(dict)
    P = 0.6
    unm = 0
    dict1 = []
    for i in dict:
        if i['near'][0]/8 >= P and (i['type'] == 'HL' or i['type'] == 'LL'):
            dict1.append(i)
            # print(i)
            unm += 1
        if i['near'][1]/8 >= P and (i['type'] == 'HH' or i['type'] == 'LH'):
            # print(i)
            dict1.append(i)
            unm += 1
    unm1 = unm
    # print(unm)

    # Termi = 0
    # while len(dict1) != 0 and Termi != 10:
    for i in dict1:
        Boo = False
        if i['near'].index(max(i['near'])) == 0:
            # 计算最远点半径
            nearlist = []
            for j in i['neighbor']:
                nearlist.append(oriData[j])
            maxR = far_radius(oriData[i['index']], nearlist)
            # 找出以最远点为半径，且符合条件的候选点
            temp = []
            for index, j in enumerate(oriData):
                if index == i['index']:
                    continue
                else:
                    if getGeoDistance(oriData[i['index']], j) <= maxR and (j['type'] =='HH' or j['type'] == 'LH'):
                        temp.append(index)
            if not temp:
                continue
            randomPoint = random.sample(temp, 1)[0]
            while randomPoint in point_index_list:
                if len(temp) == 1:
                    Boo = True
                    break
                elif len(temp) != 1:
                    temp.remove(randomPoint)
                    randomPoint = random.sample(temp, 1)[0]
            if Boo:
                continue
        else:
            # 计算最远点半径
            nearlist = []
            for j in i['neighbor']:
                nearlist.append(oriData[j])
            maxR = far_radius(oriData[i['index']], nearlist)
            # 找出以最远点为半径，且符合条件的候选点
            temp = []
            for index, j in enumerate(oriData):
                if index == i['index']:
                    continue
                else:
                    if getGeoDistance(oriData[i['index']], j) <= maxR and (j['type'] =='LL' or j['type'] == 'HL'):
                        temp.append(index)
            if not temp:
                continue
            randomPoint = random.sample(temp, 1)[0]
            while randomPoint in point_index_list:
                if len(temp) == 1:
                    Boo = True
                    break
                elif len(temp) != 1:
                    temp.remove(randomPoint)
                    randomPoint = random.sample(temp, 1)[0]
            if Boo:
                continue
        point_index_list.remove(possionCenter[i['counterpart']]['id'])
        point_index_list.append(randomPoint)
        possionCenter[i['counterpart']] = {"id": randomPoint, "lat": oriData[randomPoint]['lat'],
                                     "lng": oriData[randomPoint]['lng'],
                                     "value": oriData[randomPoint]['value'],
                                     "type": oriData[randomPoint]['type']}
        # # 重新计算本身点和邻接情况
        # dict = []
        # for index, i in enumerate(possionCenter):
        #     # 找出邻近的泊松盘，起始都是中心点
        #     near = diskNearby[index][str(index)]
        #     H_number = 0
        #     L_number = 0
        #     for j in near:
        #         if possionCenter[int(j)]['type'] == 'HH' or possionCenter[int(j)]['type'] == 'HL':
        #             H_number += 1
        #         else:
        #             L_number += 1
        #     dict.append({'type': i['type'], 'near': [H_number, L_number], 'index': index})
        # dict1 = []
        # unm = 0
        # for i in dict:
        #     if i['near'][0] / 10 >= P and (i['type'] == 'HL' or i['type'] == 'LL'):
        #         dict1.append(i)
        #         unm += 1
        #     if i['near'][1] / 10 >= P and (i['type'] == 'HH' or i['type'] == 'LH'):
        #         dict1.append(i)
        #         unm += 1
        # print(unm)
        # if unm1 == unm:
        #     Termi += 1
        # else:
        #     Termi = 0
        # unm1 = unm
    A = [{
        "lng": d["lng"],
        "lat": d["lat"],
        "value": d["value"],
        'id': d['id']
    } for d in possionCenter]

    m.fit(A)

    transform = [m.type_idx(i) for i in range(len(A))]

    with open("./z-order/update_order_healthy_output_{}.json".format(m.k), mode='w', encoding='utf8') as f:
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
    with open('./z-order/update_order_healthy_output_{}.json'.format(m.k), 'r', encoding='utf-8') as f:
        for i in f:
            RecomputingPoints = json.loads(i)
    # oriData = possionCenter
    correct = 0
    mean = 0
    for i in range(len(possionCenter)):
        mean += RecomputingPoints[i]['value']
        if RecomputingPoints[i]['type'] == oriData[RecomputingPoints[i]['id']]['type']:
            correct += 1
    for i in possionCenter:
        mean_afterafter += i['value']
    return possionCenter, correct, RecomputingPoints, oriData, mean/(len(RecomputingPoints))

def z_replacement1(filename, m):
    # 优化选点
    # filename1 = './outputdata/new_quadtree_sample_21.json'
    possionCenter = []
    oriData = []
    diskCoverPoints = []
    diskNearby = []
    with open(filename, 'r', encoding='utf-8') as f:
        for i in f:
            possionCenter = json.loads(i)
    samplingR = len(possionCenter)
    with open('./blue noise/healthy_output_81.json', 'r', encoding='utf-8') as f:
        for i in f:
            oriData = json.loads(i)
    with open('./z-order/nearbyM1.json', 'r', encoding='utf-8') as f:
        for i in f:
            diskCoverPoints = json.loads(i)
    with open('./z-order/nearbyM.json', 'r', encoding='utf-8') as f:
        for i in f:
            diskNearby = json.loads(i)
    mean_before = 0
    mean_after = 0
    mean_afterafter = 0

    for i in oriData:
        mean_before += i['value']
    mean_before = mean_before/len(oriData)

    # 统计每个泊松盘的
    dict = []
    point_index_list = []
    correct = 0
    for i in possionCenter:
        point_index_list.append(i['id'])
    for index, i in enumerate(possionCenter):
        # print(i)
        # print(diskCoverPoints[index])
        # if index ==1763 or index ==1767:
        #     print(i)
        # 找出邻近的泊松盘，起始都是中心点
        mean_after += i['value']
        if i['type'] == oriData[i['id']]['type']:
            correct += 1
        near = i['neighbors']
        H_number = 0
        L_number = 0
        for j in near:
            if oriData[int(j)]['type'] == 'HH' or oriData[int(j)]['type'] == 'HL':
                H_number += 1
            else:
                L_number += 1
        dict.append({'type': oriData[i['id']]['type'], 'near': [H_number, L_number], 'index': i['id'], 'counterpart': index, 'sampled': i['type']})

    mean_after = mean_after/samplingR

    # print(dict)
    P = 0.6
    unm = 0
    unm1 = 0
    unm2 = 0
    unm3 = 0
    dict1 = []
    for i in dict:
        if i['type'] == i['sampled']:
            continue
        if i['near'][0]/8 >= P and (i['type'] == 'HL' or i['type'] == 'LL'):
            dict1.append(i)
            # print(i)
        # if i['near'][0]/8 == 0.5 and i['sampled'] != oriData[i['index']]['type']:
        #     print(i)
        #     # print(i)
        #     unm += 1
        # if (i['near'][0]/8 == 6/8 or i['near'][1]/8 == 6/8) and i['sampled'] != oriData[i['index']]['type']:
        #     print(i)
        #     # print(i)
        #     unm1 += 1
        # if (i['near'][0]/8 == 7/8 or i['near'][1]/8 == 7/8) and i['sampled'] != oriData[i['index']]['type']:
        #     print(i)
        #     # print(i)
        #     unm2 += 1
        if i['near'][1]/8 >= P and (i['type'] == 'HH' or i['type'] == 'LH'):
            # print(i)
            dict1.append(i)
    # unm1 = unm
    # print(unm, unm1, unm2, 2126-correct)

    Termi = 0
    # while len(dict1) != 0 and Termi != 10:
    # print(len(diskCoverPoints))
    # print(dict1)
    # while len(dict1) != 0 and Termi != 10:
    for i in dict1:
        Boo = False
        if i['near'].index(max(i['near'])) == 0:
            temp = diskCoverPoints[i['counterpart']][0] + diskCoverPoints[i['counterpart']][3]
            # print(temp)
            if not temp:
                continue
            else:
                randomPoint = random.sample(temp, 1)[0]
                if randomPoint in point_index_list:
                    print('wrong', randomPoint, i)
                    print(diskCoverPoints[i['counterpart']])
            # 计算最远点半径
            # nearlist = []
            # for j in i['neighbor']:
            #     nearlist.append(oriData[j])
            # maxR = far_radius(oriData[i['index']], nearlist)
            # # 找出以最远点为半径，且符合条件的候选点
            # temp = []
            # for index, j in enumerate(oriData):
            #     if index == i['index']:
            #         continue
            #     else:
            #         if getGeoDistance(oriData[i['index']], j) <= maxR and (j['type'] =='HH' or j['type'] == 'LH'):
            #             temp.append(index)
            # if not temp:
            #     continue
            # randomPoint = random.sample(temp, 1)[0]
            # while randomPoint in point_index_list:
            #     if len(temp) == 1:
            #         Boo = True
            #         break
            #     elif len(temp) != 1:
            #         temp.remove(randomPoint)
            #         randomPoint = random.sample(temp, 1)[0]
            # if Boo:
            #     continue
        else:
            temp = diskCoverPoints[i['counterpart']][1] + diskCoverPoints[i['counterpart']][2]
            if not temp:
                continue
            else:
                randomPoint = random.sample(temp, 1)[0]
                if randomPoint in point_index_list:
                    print('wrong', randomPoint, i)
                    print(diskCoverPoints[i['counterpart']])
            # 计算最远点半径
            # nearlist = []
            # for j in i['neighbor']:
            #     nearlist.append(oriData[j])
            # maxR = far_radius(oriData[i['index']], nearlist)
            # # 找出以最远点为半径，且符合条件的候选点
            # temp = []
            # for index, j in enumerate(oriData):
            #     if index == i['index']:
            #         continue
            #     else:
            #         if getGeoDistance(oriData[i['index']], j) <= maxR and (j['type'] =='LL' or j['type'] == 'HL'):
            #             temp.append(index)
            # if not temp:
            #     continue
            # randomPoint = random.sample(temp, 1)[0]
            # while randomPoint in point_index_list:
            #     if len(temp) == 1:
            #         Boo = True
            #         break
            #     elif len(temp) != 1:
            #         temp.remove(randomPoint)
            #         randomPoint = random.sample(temp, 1)[0]
            # if Boo:
            #     continue
        point_index_list.remove(possionCenter[i['counterpart']]['id'])
        point_index_list.append(randomPoint)
        possionCenter[i['counterpart']] = {"id": randomPoint, "lat": oriData[randomPoint]['lat'],
                                     "lng": oriData[randomPoint]['lng'],
                                     "value": oriData[randomPoint]['value'],
                                     "type": oriData[randomPoint]['type']}

            # # 重新计算本身点和邻接情况
            # dict = []
            # for index, i in enumerate(possionCenter):
            #     # 找出邻近的泊松盘，起始都是中心点
            #     near = diskNearby[str(index)]
            #     H_number = 0
            #     L_number = 0
            #     for j in near:
            #         if possionCenter[int(j)]['type'] == 'HH' or possionCenter[int(j)]['type'] == 'HL':
            #             H_number += 1
            #         else:
            #             L_number += 1
            #     dict.append({'type': oriData[i['id']]['type'], 'near': [H_number, L_number], 'index': i['id'],
            #                  'neighbor': i['neighbors'], 'counterpart': index})
            # dict1 = []
            # unm = 0
            # for i in dict:
            #     if i['near'][0] / 8 >= P and (i['type'] == 'HL' or i['type'] == 'LL'):
            #         dict1.append(i)
            #         unm += 1
            #     if i['near'][1] / 8 >= P and (i['type'] == 'HH' or i['type'] == 'LH'):
            #         dict1.append(i)
            #         unm += 1
            # print(unm)
            # if unm1 == unm:
            #     Termi += 1
            # else:
            #     Termi = 0
            # unm1 = unm
    A = [{
        "lng": d["lng"],
        "lat": d["lat"],
        "value": d["value"],
        'id': d['id']
    } for d in possionCenter]

    m.fit(A)

    transform = [m.type_idx(i) for i in range(len(A))]

    with open("./z-order/update_order_healthy_output_{}.json".format(m.k), mode='w', encoding='utf8') as f:
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
    with open('./z-order/update_order_healthy_output_{}.json'.format(m.k), 'r', encoding='utf-8') as f:
        for i in f:
            RecomputingPoints = json.loads(i)
    # oriData = possionCenter
    correct = 0
    mean = 0
    for i in range(len(possionCenter)):
        mean += RecomputingPoints[i]['value']
        if RecomputingPoints[i]['type'] == oriData[RecomputingPoints[i]['id']]['type']:
            correct += 1
    for i in possionCenter:
        mean_afterafter += i['value']
    return possionCenter, correct, RecomputingPoints, oriData, mean/(len(RecomputingPoints))



if __name__ == '__main__':
    filename = './z-order/order_healthy_output_8.json'
    m = Z_score(k=8, mode="euclidean", equal=False)
    a, b, c, d, e = z_replacement1(filename, m)
    print(b)
    pass
#
# mean_afterafter = mean_afterafter/samplingR
# print(mean_before, mean_after, mean_afterafter)
