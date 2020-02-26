# -*- coding: utf-8 -*-
import random
import math
from math import pi, log, sqrt
import copy
import json
import logging
from text3 import read_json
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties


def json_output(input, file_name):
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write(json.dumps(input))
    return None


def json_out(input):
    AA = {}
    BB = []
    with open(input, 'r', encoding='utf-8') as f:
        for i in f:
            temp = json.loads(i)
        for i in range(len(temp)):
            if str(temp[i]['leaf_id']) not in AA:
                if temp[i]['value'] == 0:
                    continue
                AA[str(temp[i]['leaf_id'])] = [abs(temp[i]['value'])]
            else:
                if temp[i]['value'] == 0:
                    continue
                AA[str(temp[i]['leaf_id'])].append(abs(temp[i]['value']))
        for i in AA:
            if sum(AA[i]) == 0:
                BB.append(i)
        for i in BB:
            AA.pop(i)
        # for i in AA:
        #     max1 = max(AA[str(i)])
        #     min1 = min(AA[str(i)])
        #     for j in range(len(AA[str(i)])):
        #         AA[str(i)][j] = (AA[str(i)][j] - min1) / (max1 - min1)
        # AA = {'0': AA['0'], '4': AA['4'], '2': AA['2'], '7': AA['7'], '1': AA['1'], '6': AA['6'], '8': AA['8']}
    return AA, len(AA)


def rapid_sampling2(data, kappa=3, delta=0.01, c=0.013):
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
        sample[active_labels[i]] = [groups[active_labels[i]][b]["index"]]
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
        mi = (2 * math.log(log(m, kappa)) + log((pi ** 2) * len(groups) / (3 * delta))) / (2 * m / kappa)
        epsilon = c * sqrt(alpha * mi)
        
        active_labels = cur_labels
        for i in range(len(active_labels)):
            b = random.randint(0, len(groups[active_labels[i]]) - 1)
            v[active_labels[i]] = (
                (m - 1) / m) * v[active_labels[i]] + (1 / m) * groups[active_labels[i]][b]["value"]
            sample[active_labels[i]].append(groups[active_labels[i]][b]["index"])
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


def rapid_sampling(a_list, A, Len, kappa, delta, c, point_index_list):
    sample_dict = {}
    sample_mean = {}
    interval = {}
    selected_point ={}
    len1 = copy.deepcopy(Len)
    A1 = copy.deepcopy(A)
    a_list1 = copy.deepcopy(a_list)
    point_index_list1 = copy.deepcopy(point_index_list)
    for i in a_list1:
        sample_dict[str(i)] = []
    # 预先从各个类别中采集一个样本
    for i in range(len(A1)):
        b = random.randint(0, len1[str(A1[i])] - 1)
        len1[str(A1[i])] = len1[str(A1[i])] - 1
        sample_dict[str(A1[i])].append(a_list1[str(A1[i])][b])
        sample_mean[str(A1[i])] = a_list1[str(A1[i])][b]
        selected_point[str(A1[i])] = [point_index_list1[str(A1[i])][b]]
        a_list1[str(A1[i])].pop(b)
        point_index_list1[str(A1[i])].pop(b)
    sample_num = len(A1)
    m = 1
    while A1:
        E = []
        m += 1
        D = copy.deepcopy(A1)
        for i in range(len(A1)-1, -1, -1):
            if len1[str(A1[i])] == 0:
                D.pop(i)
        temp_length_list = [len1[str(D[i])] for i in range(len(D))]
        if temp_length_list:
            pass
        else:
            break
        part1 = 1 - (m / kappa - 1) / max(temp_length_list)
        if part1 < 0:
            logging.info('无法计算eta值')
            break
        part2 = (2 * math.log(log(m, kappa)) +
                 log((pi ** 2) * kappa / (3 * delta))) / (2 * m / kappa)
        eta = c * sqrt(part1 * part2)
        A1 = D
        for i in range(len(A1)):
            b = random.randint(0, len1[str(A1[i])] - 1)
            sample_dict[str(A1[i])].append(a_list1[str(A1[i])][b])
            sample_mean[str(A1[i])] = (
                (m - 1) / m) * sample_mean[str(A1[i])] + (1 / m) * a_list1[str(A1[i])][b]
            len1[str(A1[i])] = len1[str(A1[i])] - 1
            selected_point[str(A1[i])].append(point_index_list1[str(A1[i])][b])
            a_list1[str(A1[i])].pop(b)
            point_index_list1[str(A1[i])].pop(b)
            sample_num += 1
        for i in range(len(A1)):
            numm = 0
            for j in range(len(A1)):
                if i == j:
                    continue
                if sample_mean[str(A1[i])] - eta>= sample_mean[str(A1[j])] - eta and sample_mean[str(A1[i])] - eta <= sample_mean[str(A1[j])] + eta:
                    temp = False
                elif sample_mean[str(A1[i])] + eta <= sample_mean[str(A1[j])] + eta and sample_mean[str(A1[i])] +eta >= sample_mean[str(A1[j])] - eta:
                    temp = False
                elif sample_mean[str(A1[i])] - eta <= sample_mean[str(A1[j])] - eta and sample_mean[str(A1[i])] + eta >= sample_mean[str(A1[j])] - eta:
                    temp = False
                elif sample_mean[str(A1[i])] + eta >= sample_mean[str(A1[j])] + eta and sample_mean[str(A1[i])] - eta <= sample_mean[str(A1[j])] + eta:
                    temp = False
                else:
                    numm += 1
            if numm == len(A1) -1:
                E.append(A1[i])
                interval[str(A1[i])] = [sample_mean[str(A1[i])] +
                                       eta, sample_mean[str(A1[i])] - eta]
        if len(E) == 0:
            pass
        else:
            for i in E:
                A1.pop(A1.index(i))
    return sample_mean, interval, m, len(interval), sample_num, len1, selected_point


def new_json_read(input):
    AA = {}
    BB= []
    CC = {}
    X, Y, Z, M, Q = read_json('./93_new.json')
    with open(input, 'r', encoding='utf-8') as f:
        for i in f:
            temp = json.loads(i)
    for i in temp:
        if temp[i]['level'] == 0 and temp[i]['ave_sentiment'] != 0:
            AA[str(i)] = []
            CC[str(i)] = []
            for j in temp[i]['contained_points']:
                AA[str(i)].append(abs(Z[j]))
                CC[str(i)].append(j)

    for i in AA:
        if sum(AA[str(i)]) == 0:
            BB.append(i)
    for i in BB:
        AA.pop(i)
    return AA, len(AA), CC


def spatial_preserved(original_len_list, sampled_len_list, C):
    all = 0
    result = 0
    for i in range(len(C)):
        for j in range(i + 1, len(C)):
            all += original_len_list[str(C[i])]*original_len_list[str(C[j])]
            if original_len_list[str(C[i])] <= original_len_list[str(C[j])] and sampled_len_list[str(C[i])] <= sampled_len_list[str(C[j])]:
                result += original_len_list[str(C[i])]*original_len_list[str(C[j])]
            elif original_len_list[str(C[i])] > original_len_list[str(C[j])] and sampled_len_list[str(C[i])] > sampled_len_list[str(C[j])]:
                result += original_len_list[str(C[i])]*original_len_list[str(C[j])]
    return result/all


if __name__ == '__main__':
    aaaaa = 0
    bbbbb = 0
    cccc = 1
    for t in range(cccc):
        X, Y, Z, M, Q = read_json('./93_new.json')
        logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.INFO)
        List1, len1, List2 = new_json_read('./tree_dict_0.25_0.05_0.002.json')
        length_list = {}
        sum1 = 0
        for i in List1:
            length_list[i] = len(List1[i])
            sum1 += len(List1[i])
        # print(length_list)
        B = [int(i) for i in List1]
        C = copy.deepcopy(B)
        OO = copy.deepcopy(length_list)

        sampled_mean = {}
        original_mean = {}
        for i in range(len(B)):
            original_mean[str(B[i])] = sum(
                List1[str(B[i])]) / len(List1[str(B[i])])

        """{{[column_index: number]: Array<value: number>}}"""
        # List1 = {}
        # for i in [(l, len(List1[l]), List1[l][:min(5, len(List1[l]))]) for l in List1]:
        #     print(i)

        data = {}

        for l in List1:
            data[l] = []
            for i in range(len(List1[l])):
                data[l].append({
                    "value": List1[l][i],
                    "index": List2[l][i]
                })

        """{Array<column_index: number>}"""
        # B = []
        # print(B)

        """{[column_index: number]: (n_elements)number} = {[key: len(List[key])]}"""
        # length_list = {}
        # print(length_list)

        """{{[column_index: number]: Array<index: number>}}"""
        # List2 = {}
        # print(List2)

        # sampled_mean, inter, n, N1, N2, length_list, qqqqq = rapid_sampling(List1, B, length_list, 3, 0.01, 0.013, List2)
        qqqqq = rapid_sampling2(data, kappa=3, delta=0.01, c=0.013)

        print(qqqqq)
        exit(0)
        # => {{[column_index: number]: Array<{value: number; index: number;}>}}
        _all = 0
        result = 0
        oo = {}
        full_domain = 0
        min_yta = {}
        for i in range(len(C)):
            for j in range(i + 1, len(C)):
                _all += 1
                if original_mean[str(C[i])] <= original_mean[str(
                        C[j])] and sampled_mean[str(C[i])] <= sampled_mean[str(C[j])]:
                    result += 1
                if original_mean[str(C[i])] > original_mean[str(
                        C[j])] and sampled_mean[str(C[i])] > sampled_mean[str(C[j])]:
                    result += 1
        for i in range(len(C)):
            min_yta[str(C[i])] = 1
            for j in range(len(C)):
                if i == j :
                    continue
                if abs(original_mean[str(C[i])] - original_mean[str(
                        C[j])]) < min_yta[str(C[i])]:
                    min_yta[str(C[i])] = abs(original_mean[str(C[i])] - original_mean[str(
                        C[j])])
        for i in range(len(C)):
            oo[str(C[i])] =OO[str(C[i])] - length_list[str(C[i])]
            if length_list[str(C[i])] == 0:
                full_domain += 1
        aaaaa += (result / _all)
        bbbbb += N2
        print(
            result /
            _all,
            result,
            _all,
            n,
            N1,
            N2/sum1,
            len1,
            full_domain,
            full_domain /
            len(length_list),
            inter)
        total_complex = 0
        for i in range(len(C)):
            if min_yta[str(C[i])] == 0:
                continue
            total_complex += (log(2/0.05)+log(log(1/min_yta[str(C[i])])))/(min_yta[str(C[i])]**2)
        # print(oo)
        # print(OO)
        print((0.015**2)*total_complex)
        space = spatial_preserved(OO, oo, C)
        print('space', space)
        json_output(qqqqq, 'sampled_9.17_{0}_{1}_{2}.json'.format(N2, result/_all, space))
        json_output(original_mean, './original_mean.json')
    print(aaaaa, aaaaa / cccc, bbbbb / cccc)
# # 绘制
# font = FontProperties(fname=r"C:\Windows\Fonts\simhei.ttf", size=14)
#
# plt.bar([1, 3], [original_mean['0'], original_mean['1']], label='before sampling ')
#
# plt.bar([2, 4], [sampled_mean['0'], sampled_mean['1']], label='after sampling ')
#
# # params
#
# # x: 条形图x轴
# # y：条形图的高度
# # width：条形图的宽度 默认是0.8
# # bottom：条形底部的y坐标值 默认是0
# # align：center / edge 条形图是否以x轴坐标为中心点或者是以x轴坐标为边缘
#
# plt.legend()
#
# plt.xlabel('number')
# plt.ylabel('average_sentiment')
#
# plt.title(u'测试采样前后的平均值保持情况', FontProperties=font)
#
# plt.show()
