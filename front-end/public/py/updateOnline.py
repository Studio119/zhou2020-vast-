import json
import random
import matplotlib.pyplot as plt
import numpy as np
import copy
import math
from Z_score import Z_score as Z_score
import sys


def SIGN(n):
    return "L" if n < 0 else "H"

def sp(weight, c, oriData):
    sum1 = 0
    # 加权平均
    for j in weight:
        sum1 += j
    sp_lag = 0
    for j in range(m.k):
        sp_lag += (weight[j] / sum1) * oriData[int(c[j][0])]['value']
    return sp_lag


def beforeIsRight(j, sampled, oriData):
    sampled_type = ''
    for i in sampled:
        if i['id'] == j:
            sampled_type = i['type']
    if sampled_type[1] == oriData[j]['type'][1]:
        return True
    else:
        return False

def onlineUpdate(filename, p_list, ori_filename, selected_point_index, m):
    with open(filename, 'r', encoding='utf-8') as f:
        sampled = json.load(f)
    with open(ori_filename, 'r', encoding='utf-8') as f:
        oriData = json.load(f)

    sampled1 = copy.deepcopy(sampled)
    # 从采样数据中移除当前被选中的错误点
    for index, j in enumerate(sampled):
        if j['id'] == selected_point_index:
            sampled.pop(index)

    # 是否可以替换的boolean字典
    isReplaced = {}

    # 计算不替换前多少点的自身特征发生变化
    val_in = np.array([d["value"] for d in sampled1])
    mean = np.mean(val_in)
    before_wrong_num = 0
    for i in sampled1:
        if i['type'][0] == oriData[i['id']]['type'][0]:
            continue
        else:
            before_wrong_num += 1
    # 遍历该错误点所在子集的其他点，判断是否可以替换
    # 判断准则主要是该点的空间自相关特征是否变化（T3），与该点的邻近点是否会发生变化（T2），以及所有其他点的特征是否发生变化（T1）。
    for i in p_list:
        if i == selected_point_index:
            isReplaced[str(i)] = False
            continue
        else:
            # 判断自身特征是否发生变化
            after_wrong_num = 0
            sampled.append(oriData[i])
            val_in = np.array([d["value"] for d in sampled])
            mean = np.mean(val_in)
            T1 = False
            T2 = True
            T3 = False
            for j in sampled1:
                if SIGN(j['value'] - mean) == oriData[j['id']]['type'][0]:
                    continue
                else:
                    after_wrong_num += 1
            # T1任务保持住了
            if after_wrong_num <= before_wrong_num:
                T1 = True

            ## 判断自身的local 和neighbouring 特征都能保持住 ，即T3任务
            # 首先判断自身
            T3_1 = False #（local是否保持）
            T3_2 = False #（neighbouring是否保持）
            if SIGN(oriData[i]['value'] - mean) == oriData[i]['type'][0]:
                T3_1 = True
            # 计算当前点的邻接点
            dis_dict = {}
            for j in sampled:
                if j['id'] == oriData[i]['id']:
                    continue
                distance = math.sqrt((j['lat']-oriData[i]['lat'])**2 + (j['lng']-oriData[i]['lng'])**2)
                verse_distance = 1/distance
                dis_dict[str(j['id'])] = verse_distance
            c = sorted(dis_dict.items(), key=lambda item: item[1], reverse= True)
            weight = [ d[1] for d in c[:m.k]]
            sp_lag  = sp(weight, c, oriData)
            if SIGN(sp_lag) == oriData[i]['type'][1]:
                T3_2 = True
            if T3_1 and T3_2:
                T3 = True

            # T2任务，简便计算，即与该点邻近的点，仅出现在离该点最近的100个点中
            bynear_index = [ int(d[0]) for d in c[:100]]
            # 循环这100个点，找出其中与该点邻近的点
            for j in bynear_index:
                dis_dict = {}
                for z in sampled:
                    if j == z['id']:
                        continue
                    else:
                        distance = math.sqrt((oriData[j]['lat'] - oriData[i]['lat']) ** 2 + (oriData[j]['lng'] - oriData[i]['lng']) ** 2)
                        verse_distance = 1 / distance
                        dis_dict[str(j)] = verse_distance
                c = sorted(dis_dict.items(), key=lambda item: item[1], reverse=True)
                target = [ int(d[0]) for d in c[:m.k]]
                if i in target:
                    weight = [d[1] for d in c[:m.k]]
                    sp_lag = sp(weight, c, oriData)
                    ## 一旦出现将某个点之前是好的，但是变了之后却坏了，那就不要
                    #所以先计算没换之前，这个点的采样前后是否保持
                    if beforeIsRight(j, sampled, oriData):
                        # 保持住了，则在计算换了之后，这个点的采样前后是否会不会打破正确性
                        if SIGN(sp_lag) == oriData[j]['type'][1]:
                            T2 = True
                        else:
                            T2 = False
                    # 之前就没保持住，那么采样后无所谓，能保持住是最好的
                    else:
                        T2 = True
                if not T2:
                    break
        if T1 and T2 and T3:
            isReplaced[str(i)] = True
        else:
            isReplaced[str(i)] = False
    return isReplaced


if __name__ == '__main__':
    dataset_name = sys.argv[1]
    filename = "..\\storage\\" + dataset_name + "_o.json" #　第一次进来以ｏ结尾的ｊｓｏｎ文件,输出以r结尾的文件
    ori_filename = "..\\storage\\" + dataset_name + ".json" # 原始的json文件
    selected_point_index = sys.argv[2] # 被选中的错误点
    p_list = json.loads(sys.argv[3])
    m = Z_score(k=8, mode="euclidean", equal=False)
    # isReplace是一个存储错误点所在的子集的其他点能否被替换的字典形式存在，每个点的value以Boolean编写。
    isReplaced = onlineUpdate(filename, p_list, ori_filename, selected_point_index, m)
    print(isReplaced)
