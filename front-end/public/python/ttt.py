# -*- coding: utf-8 -*-
import json
# from vader_sentiment.vader_sentiment import SentimentIntensityAnalyzer
import codecs
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from sklearn.cluster import KMeans
import numpy as np
import random
import math
import csv
import heapq
from scipy import stats


# output = []
# tweets = []
# with open('D:/twitter database/new/new/extractedData.txt', 'r', encoding='utf-8', errors='ignore') as f:
#     for line in f:
#         try:
#             tweet = line.strip("\t\n").split("\t")
#             tweets.append(tweet)
#         except:
#             pass
# print(len(tweets))
# analyzer = SentimentIntensityAnalyzer()
# writeF = codecs.open('D:/twitter database/new/new/raw_cleanedData.txt', 'w', encoding='utf-8')  # 文件对应
# for i in range(len(tweets)):
#     vs = analyzer.polarity_scores(tweets[i][1])
#     # print("{:-<65} {}".format(sentence, str(vs)))
#     writeF.write(
#         tweets[i][0] + '\t' + tweets[i][1] + '\t' + tweets[i][2] + '\t' + tweets[i][3] + '\t' + tweets[i][4] + '\t' + str(vs['compound']) +
#         '\t\n')

# out_tweets = []
# num = 0
# with open('D:/twitter database/new/new/97_new.json', 'w', encoding='utf-8') as f1:
#     with open('D:/twitter database/new/new/cleanedData.txt', 'r', encoding='utf-8', errors='ignore') as f:
#         for line in f:
#             try:
#                 tweet = line.strip("\t\n").split("\t")
#                 print(tweet)
#             except:
#                 pass
#             num += 1
#             out_tweets.append({'lat': float(tweet[3]), 'lng': float(tweet[4]), 'word': tweet[1], 'sentiment': str(tweet[5])})
#     f1.write(json.dumps(out_tweets))
# print(num)

# with open('./9.17.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp = json.loads(i)
#         for i in temp:
#             if float(i['sentiment']) == 0.0:
#                 continue
#             else:
#                 output.append(i)
#
# with open('./9.18.json', 'w', encoding='utf-8') as f:
#     f.write(json.dumps(output))


# 输出leaf_id 矩阵
# putlist = []
# with open('D:/twitter database/new/new/new_99.json', 'w', encoding='utf-8') as f1:
#     with open('D:/twitter database/new/new/99_new.json', 'r', encoding='utf-8') as f:
#         with open('../tree_results/tree_dict_0.2_0.08_0.001.json', 'r', encoding='utf-8') as f2:
#             temp1 = {}
#             for z in f2:
#                 temp1 = json.loads(z)
#             for i in f:
#                 temp = json.loads(i)
#                 for j, index in enumerate(temp):
#                     temp_data ={'x': temp[j]['lat'], 'y': temp[j]['lng'], 'id': j, 'value': float(temp[j]['sentiment']), 'leaf_id': 0}
#                     for z in temp1:
#                         temp_list = temp1[z]["contained_points"]
#                         if j in temp_list:
#                             temp_data['leaf_id'] = int(z)
#                             break
#                     putlist.append(temp_data)
#             f1.write(json.dumps(putlist))



# 输出97_new文件
# output = []
# analyzer = SentimentIntensityAnalyzer()
# with open('D:/yelp data/97_new.json', 'w', encoding='utf-8') as f1:
#     with open('D:/yelp data/AZ_partition_step_data.json', 'r', encoding='utf-8') as f:
#         for line in f:
#             tweets = {}
#             temp = json.loads(line)
#             tweets['lng'] = str(temp['lng'])
#             tweets['lat'] = str(temp['lat'])
#             tweets['city'] = 'Phoenix'
#             tweets['words'] = temp['text']
#             tweets['id'] = temp['user_id']
#             vs = analyzer.polarity_scores(temp['text'])['compound']
#             tweets['sentiment'] = str(vs)
#             output.append(tweets)
#         f1.write(json.dumps(output))


# # 画柱子
# font = FontProperties(fname=r"C:\Windows\Fonts\simhei.ttf", size=24)
#
# ax = plt.bar(['AA', 'JB', 'UA', 'DL'], [30, 15, 85, 45], width=0.4)
#
# # plt.bar([2, 4, 6, 8, 10], [4, 6, 8, 13, 15], label='graph 2')
#
# # params
#
# # x: 条形图x轴
# # y：条形图的高度
# # width：条形图的宽度 默认是0.8
# # bottom：条形底部的y坐标值 默认是0
# # align：center / edge 条形图是否以x轴坐标为中心点或者是以x轴坐标为边缘
#
# for i in ax:
#     plt.text(i.get_x() + i.get_width()/2, i.get_height(), '%d'%int(i.get_height()), ha='center', va='bottom', fontsize=24)
#
# plt.xlabel('Airline Name', fontsize=24)
# plt.ylabel('Average Delay (minutes)', fontsize=24)
#
# # plt.title(u'测试例子——条形图', FontProperties=font)
#
# plt.show()

# point = []
# with open('D:/project/yelpdata/venv/blue-noise-master/blue-noisy.json', 'w', encoding='utf-8') as f1:
#     with open('D:/project/yelpdata/venv/blue-noise-master/samplePoints-1-6027-0.0545711362422245.json', 'r', encoding='utf-8') as f:
#         for i in f:
#             temp = json.loads(i)
#         for i in temp:
#             point.append(i['id'])
#         f1.write(json.dumps(point))

# 匹配经纬度进程
# temp_dict = {}
# out_dict = []
# with open('./inputdata/industry_data.json', 'w', encoding='utf-8') as f:
#     with open('./inputdata/output_area_location.json', 'r', encoding='utf-8') as f1:
#         with open('./inputdata/industry-by-sex.json', 'r', encoding='utf-8') as f2:
#             for i in f2:
#                 temp = json.loads(i)
#             for i in temp:
#                 temp_dict[i['code']] = i['value']
#         for i in f1:
#             temp = json.loads(i)
#         for i in temp:
#             if i in temp_dict:
#                 out_dict.append({'code':i, 'value':temp_dict[i], 'lat':temp[i][0][0], 'lng':temp[i][0][1]})
#     f.write(json.dumps(out_dict))

#归一化数据
# with open('./inputdata/industry_data1.json', 'w', encoding='utf-8') as f:
#     with open('./inputdata/industry_data.json', 'r', encoding='utf-8') as f1:
#         for i in f1:
#             temp = json.loads(i)
#         for i in temp:
#             i['value'] = i['value']/143
#         f.write(json.dumps(temp))


# 统计数据分布
# with open('./inputdata/industry_data.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp = json.loads(i)
# num20 = 0
# num40 = 0
# num60 = 0
# num80 = 0
# num100 = 0
# for i in temp:
#     if i['value'] <= 20:
#         num20 += 1
#     elif i['value'] <= 40:
#         num40 += 1
#     elif i['value'] <= 60:
#         num60 += 1
#     elif i['value'] <= 80:
#         num80 += 1
#     elif i['value'] >80:
#         num100 += 1
#
# print(num20+num40+num60+num80+num100)
# print(num20)
# print(num40)
# print(num60)
# print(num80)
# print(num100)


# KMmeans 测试
# x = np.array([[2], [1.8], [8], [9], [0.6], [11] ])
# clf = KMeans(n_clusters=3)
# clf.fit(x)  # 分组
# centers = clf.cluster_centers_
# labels = clf.labels_
# for i in :
#     print(i)
# import random
# a = random.randint(0, 2)
# print(a)
#

# Mean = [[-1, 1], [1, 1], [-1, -1], [1, -1]]
# # synthetize_data = []
# # for i in range(4):
# #     mean = Mean[i]
# #     cov = [[1, 0], [0, 1]]
# #     x, y =np.random.multivariate_normal(mean, cov, 20000).T
# #     for index in range(len(x)):
# #         synthetize_data.append({'lat': x[index], 'lng': y[index], 'value': random.random()})
# #
# # with open('./inputdata/synthetize_data.json', 'w', encoding='utf-8') as f:
# #     f.write(json.dumps(synthetize_data))

# 绘制散点图
# x = np.zeros(27637)
# y = np.zeros(27637)
# color_list = [
#     "#a6cee3",
#     "#1f78b4",
#     "#b2df8a",
#     "#33a02c",
#     "#fb9a99",
#     "#e31a1c",
#     "#fdbf6f",
#     "#ff7f00",
#     "#cab2d6"
#   ]
# x_data_list = [[], [], [], [], [], [], [], [], []]
# y_data_list  = [[], [], [], [], [], [], [], [], []]
# class_data_list  = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
# mean = 0
# num = 0
# # [2, -2] [50, 52.5]
# with open('./inputdata/healthy_data.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp = json.loads(i)
#     for index, i in enumerate(temp):
#         # if i['lat'] >= 52.2:
#         #     continue
#         # elif i['lng'] <= -1.8:
#         #     continue
#         mean += i['value']
#         num += 1
#         if i['value'] <= 220:
#             x_data_list[0].append(i['lat'])
#             y_data_list[0].append(i['lng'])
#         # elif i['value'] <= 10:
#         #     x_data_list[1].append(i['lat'])
#         #     y_data_list[1].append(i['lng'])
#         elif i['value'] <= 240:
#             x_data_list[1].append(i['lat'])
#             y_data_list[1].append(i['lng'])
#         elif i['value'] <= 260:
#             x_data_list[2].append(i['lat'])
#             y_data_list[2].append(i['lng'])
#         elif i['value'] <= 280:
#             x_data_list[3].append(i['lat'])
#             y_data_list[3].append(i['lng'])
#         elif i['value'] <= 300:
#             x_data_list[4].append(i['lat'])
#             y_data_list[4].append(i['lng'])
#         elif i['value'] <= 320:
#             x_data_list[5].append(i['lat'])
#             y_data_list[5].append(i['lng'])
#         elif i['value'] <= 340:
#             x_data_list[6].append(i['lat'])
#             y_data_list[6].append(i['lng'])
#         elif i['value'] <= 360:
#             x_data_list[7].append(i['lat'])
#             y_data_list[7].append(i['lng'])
#         else:
#             x_data_list[8].append(i['lat'])
#             y_data_list[8].append(i['lng'])
#         # x[index] = i['lat']# np.array([0.2, 0.35, 0.4, 0.42, 1.1, 1.3, 1.4, 1.65, 1.8])
#     mean = mean/num # y[index] = i['lng'] # np.array([1.2, 1.6, 0.8, 1.9, 0.6, ])
# for i in range(9):
#     plt.scatter(x_data_list[i], y_data_list[i], c=color_list[i], alpha=0.4, label='value'+str(class_data_list[i]))
# # plt.plot(x, y, '.')
# plt.axis('equal')
# plt.legend()
# plt.savefig(r'.\outputdata\123456789svm.png', dpi=300)
# plt.show()
# #
#
# # 莫兰
# def MoranI(W, X):
#     '''
#         W:空间权重矩阵
#         X:观测值矩阵
#         归一化空间权重矩阵后进行moran检验，实例https://bbs.pinggu.org/thread-3568074-1-1.html
#     '''
#     n = len(X)  # 空间单元数
#     # W = np.array(W)
#     X = np.array(X)
#     # X = X.reshape(1, -1)
#     # W = W / W.sum(axis=1)  # 归一化
#     print(X)
#     mean = X.mean()
#     print(mean)
#     # Z = X - X.mean()  # 离差阵
#     # S0 = W.sum()
#     # S1 = 0
#     # for i in range(n):
#     #     for j in range(n):
#     #         S1 += 0.5 * (W[i, j] + W[j, i]) ** 2
#     # S2 = 0
#     # for i in range(n):
#     #     S2 += (W[i, :].sum() + W[:, i].sum()) ** 2
#     # 计算局部每个点的样本方差
#     S = []
#     for i in range(n):
#         temp_v = 0
#         for j in range(n):
#             if i == j:
#                 continue
#             temp_v += (X[j] - mean)**2
#         S.append(temp_v/(n-1))
#     # 计算局部moran指数
#     Ii = list()
#     licha = list()
#     for i in range(n):
#         # Ii_ = n * Z[0, i]
#         li__ = 0
#         for j in W[str(i)]:
#             li__ += (1/(len(W[str(i)])))*(X[j]-mean)
#         licha.append(li__)
#         li_ = ((X[i] - mean)/S[i])*li__
#         #     Ii__ += W[i, j] * Z[0, j]
#         # Ii_ = Ii_ * Ii__ / ((Z * Z).sum())
#         Ii.append(li_)
#     # Ii = np.array(Ii)
#     return Ii, licha
#
#
# with open('./outputdata/Weight_matrix_kde_0.004.json', 'r', encoding='utf-8') as f1:
#     for i in f1:
#         temp = json.loads(i)
# with open('./inputdata/healthy_data1.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp1 = json.loads(i)
#     attribute_list = []
#     for i in temp1:
#         attribute_list.append(i['value'])
#
# Li, Licha = MoranI(temp, attribute_list)
# with open('./outputdata/kde_local_M1.json', 'w', encoding='utf-8') as f:
#     f.write(json.dumps(Li))
# with open('./outputdata/kde_local_Licha1.json', 'w', encoding='utf-8') as f:
#     f.write(json.dumps(Licha))

# 空间权重矩阵计算
# def geodistance(p1, p2):
#     p1[1], p1[0], p2[1], p2[0] = map(math.radians, [p1[1], p1[0], p2[1], p2[0]])
#     dlon=p2[1]-p1[1]
#     dlat=p2[0]-p1[0]
#     a=math.sin(dlat/2)**2 + math.cos(p1[0]) * math.cos(p2[0]) * math.sin(dlon/2)**2
#     dis=2*math.asin(math.sqrt(a))*6371*1000
#     return dis


# Weight_matrix = {}  # 权重矩阵
# Weight_matrix1 = {}  # kde结果的空间权重矩阵
# threshold = 0.01
# max = 0
# min = 1000
# radis = 0.015
# kde_radius = {}
# with open('./outputdata/kde_{0}.json'.format(radis), 'w', encoding='utf-8') as f2:
#     with open('./outputdata/Weight_matrix_kde_{0}.json'.format(radis), 'w', encoding='utf-8') as f1:
#         with open('./inputdata/healthy_data.json', 'r', encoding='utf-8') as f:
#             for i in f:
#                 temp = json.loads(i)
#             # kde 计算
#             data1 = []
#             for i in temp:
#                 data1.append([i['lat'], i['lng']])
#             data1 = np.array(data1)
#             values = data1.T
#             kde = stats.gaussian_kde(values)
#             for index, i in enumerate(temp):
#                 Weight_matrix[str(index)] = []
#                 Weight_matrix1[str(index)] = []
#                 head = []
#                 temp_kde = kde(np.array([i['lat'], i['lng']]))
#                 kde_radius[str(index)] = list(radis/(temp_kde))[0]
#                 for index1, j in enumerate(temp):
#                     if i == j:
#                         continue
#                     else:
#                         pass
#                     # geodis = geodistance([i['lat'], i['lng']], [j['lat'], j['lng']])
#                     m = math.sqrt((i['lat'] - j['lat'])**2 + (i['lng'] - j['lng'])**2)
#                     head.append(m)
#                     # # if m <= min:
#                     # #     min = m
#                     # # if m >= max:
#                     # #     max = m
#                     # if m <= threshold:
#                     #     Weight_matrix[str(index)].append(index1)
#                     if m <= (radis/temp_kde):
#                         Weight_matrix[str(index)].append(index1)
#                 # if len(Weight_matrix[str(index)]) <= 5:
#                 #     tlen = len(Weight_matrix[str(index)])
#                 #     qqqq = map(head.index, heapq.nsmallest(5, head))
#                 #     qqqq = list(qqqq)
#                 #     for j in range(len(qqqq) - len(Weight_matrix[str(index)])):
#                 #         Weight_matrix[str(index)].append(qqqq[j+tlen])
#                 if len(Weight_matrix[str(index)]) < 2:
#                     break
#                 print(index, len(Weight_matrix[str(index)]))
#         f1.write(json.dumps(Weight_matrix))
#     f2.write(json.dumps(kde_radius))


# 健康数据CSV读取
# sFileName = './inputdata/bulk(1).csv'
# temp_dict = {}
# out_dict = []
# with open('./inputdata/healthy_data1.json', 'w', encoding='utf-8') as f:
#     with open('./inputdata/output_area_location.json', 'r', encoding='utf-8') as f1:
#         with open(sFileName, newline='', encoding='UTF-8') as csvfile:
#             rows = csv.reader(csvfile)
#             for row in rows:
#                 temp_dict[str(row[1])] = [row[3], row[4], row[5], row[6]]
#         for i in f1:
#             temp = json.loads(i)
#         for i in temp:
#             if i in temp_dict:
#                 out_dict.append({'code':i, 'value': int(temp_dict[i][1])/int(temp_dict[i][0]), 'lat':temp[i][0][0], 'lng':temp[i][0][1]})
#     f.write(json.dumps(out_dict))

# 输出健康CSV格式
# import codecs
# csv_dict = {}
# csv_list = []
# file = codecs.open('./inputdata/healthy_data.csv', 'w', 'utf-8')
# with open('./inputdata/output_area_location.json', 'r', encoding='utf-8') as f1:
#     with open(sFileName, newline='', encoding='UTF-8') as csvfile:
#         rows = csv.reader(csvfile)
#         for row in rows:
#             row = ','.join(row).strip('\n').split(',')
#             print(row)
#             csv_dict[str(row[1])] = row
#     for i in f1:
#         temp = json.loads(i)
#     for i in temp:
#         if i in csv_dict:
#             csv_dict[i][1] = temp[i][0][0]
#             csv_dict[i][2] = temp[i][0][1]
#             csv_list.append(csv_dict[i])
# writer = csv.writer(file)
# writer.writerow(['date', 'lat', 'lng'] + [i for i in range(1, 140)])
# writer.writerows(csv_list)

# temp_ratio_dict = {'HH': 5, 'HL': 1, 'LL': 2, 'LH': 4}
# order = sorted(temp_ratio_dict.items(), key=lambda d: d[1])
# print(temp_ratio_dict[0])

# 根据值域对数据进行重新分类

# value_range_list = [0.654545, 0.759591, 0.825658, 0.879888, 1] # 5个
# value_range_list = [0.591623, 0.704036, 0.768769, 0.816479, 0.857724, 0.897959, 1] # 7个
#
# with open('./inputdata/healthy_output1.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp = json.loads(i)
#
# for i in temp:
#     if i['value'] <= value_range_list[0]:
#         i['v_type'] = '0'
#     elif i['value'] <= value_range_list[1]:
#         i['v_type'] = '1'
#     elif i['value'] <= value_range_list[2]:
#         i['v_type'] = '2'
#     elif i['value'] <= value_range_list[3]:
#         i['v_type'] = '3'
#     elif i['value'] <= value_range_list[4]:
#         i['v_type'] = '4'
#     elif i['value'] <= value_range_list[5]:
#         i['v_type'] = '5'
#     elif i['value'] <= value_range_list[6]:
#         i['v_type'] = '6'
#
#
# with open('./inputdata/healthy_output1_Vpartition_7.json', 'w', encoding='utf-8') as f:
#     f.write(json.dumps(temp))



# A, B, C, D, E, F, G = 0, 0, 0, 0, 0, 0, 0
# for i in temp:
#     if i['v_type'] == '0':
#         A += 1
#     elif i['v_type'] == '1':
#         B += 1
#     elif i['v_type'] == '2':
#         C += 1
#     elif i['v_type'] == '3':
#         D += 1
#     elif i['v_type'] == '4':
#         E += 1
#     elif i['v_type'] == '5':
#         F += 1
#     elif i['v_type'] == '6':
#         G += 1
#
# print(A, B, C, D, E, F, G)
# #
#
# with open('./outputdata/new_quadtree_sample_13_V.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp = json.loads(i)
#
# A, B, C, D, E = 0, 0, 0, 0, 0
# for i in temp:
#     if i['v_type'] == '0':
#         A += 1
#     elif i['v_type'] == '1':
#         B += 1
#     elif i['v_type'] == '2':
#         C += 1
#     elif i['v_type'] == '3':
#         D += 1
#     elif i['v_type'] == '4':
#         E += 1
#
# print(A, B, C, D, E)
#
# t = [0, 1]
# b = [1]
# a = random.sample(t, 0)
# print(b.append(a))
# print(b)

# 计算所有泊松盘的邻近盘以及点信息。

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

oriBlu = []
with open('./blue noise/_bbbsamplePoints-250-8034-0.29069725368165866.json', 'r', encoding='utf-8') as f:
    for i in f:
        oriBlu = json.loads(i)
oriData = []
with open('./inputdata/healthy_output_10.json', 'r', encoding='utf-8') as f:
    for i in f:
        oriData = json.loads(i)

nearByPosiondisk = []
print('开始找临近盘')
# 找泊松盘的邻近盘
for index, i in enumerate(oriBlu):
    temp_nearby = {}
    for index1, j in enumerate(oriBlu):
        if i == j:
            continue
        else:
            temp_nearby[str(index1)] = math.sqrt(getGeoDistance(i, j))
    sortA = sorted(temp_nearby.items(), key=lambda item: item[1])
    # 取前面10个
    nearByPosiondisk.append({str(index): [ x[0] for index2, x in enumerate(sortA) if index2 <=9]})

print('开始找盘内点')
# 计算每个泊松盘内的点
Posiondisk_point = []
Posiondisk_point1 = []
for index, i in enumerate(oriBlu):
    H_points = []
    L_points = []
    HH = []
    HL = []
    LL = []
    LH = []
    for index1, j in enumerate(oriData):
        if getGeoDistance(i, j) <= i['r']:
            if j['type'] == 'HH' or j['type'] == 'HL':
                H_points.append(index1)
            else:
                L_points.append(index1)
            if j['type'] == 'HH':
                HH.append(index1)
            elif j['type'] == 'HL':
                HL.append(index1)
            elif j['type'] == 'LL':
                LL.append(index1)
            elif j['type'] == 'LH':
                LH.append(index1)
    Posiondisk_point.append({str(index): [H_points, L_points]})
    Posiondisk_point1.append([HH, HL, LL, LH])



# 输出每个盘的邻接点的矩阵
with open('./blue noise/diskNearby.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(nearByPosiondisk))

# 输出每个盘的包含的数据项
with open('./blue noise/diskCoverPoints.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(Posiondisk_point))

# 输出每个盘的四个类别的数据项
with open('./blue noise/diskCoverPoints1.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(Posiondisk_point1))

nearByPosiondisk = []
# 输出每个盘的邻接点的矩阵
with open('./blue noise/diskNearby.json', 'r', encoding='utf-8') as f:
    for i in f:
        nearByPosiondisk = json.loads(i)

# 输出每个点的关联盘索引，即这个盘内点的选择会影响那个盘
associated_NearbyDisk = []
for j in range(len(nearByPosiondisk)):
    temp = []
    for index, i in enumerate(nearByPosiondisk):
        if str(j) in i[str(index)]:
            temp.append(index)
    associated_NearbyDisk.append(temp)


# 输出每个盘的邻接点的矩阵
with open('./blue noise/associatedDiskNearby.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(associated_NearbyDisk))



# 计算n_H和n_L
with open('./inputdata/healthy_output_10.json', 'r', encoding='utf-8') as f:
    for i in f:
        oriData = json.loads(i)
for i in oriData:
    temp = i['neighbors']
    nH = 0
    nL = 0
    for j in temp:
        if oriData[j]['type'] == 'HH' or oriData[j]['type'] == 'HL':
            nH += 1
        elif oriData[j]['type'] == 'LH' or oriData[j]['type'] == 'LL':
            nL += 1
    i['n_H'] = nH
    i['n_L'] = nL

with open('./blue noise/healthy_output_101.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(oriData))


# with open('./blue noise/diskCoverPoints.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         temp = json.loads(i)
# num = set()
# for index, i in enumerate(temp):
#     for j in i[str(index)][0]:
#         if j in num:
#             continue
#         else:
#             num.add(j)
#     for j in i[str(index)][1]:
#         if j in num:
#             continue
#         else:
#             num.add(j)
#
# for i in range(27637):
#     if i not in num:
#         print(i)
