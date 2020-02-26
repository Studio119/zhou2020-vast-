from sklearn import cluster, neighbors
import json
from sklearn import preprocessing
import numpy as np
from scipy import stats
import random
import math
import copy
import logging


def fx(d):
    return (d + 128.14621384226703) / (128.14621384226703 - 67.85378615773539) * 788


def fy(d):
    d = (d - 50.55349948549696) / (22.86881607932105 - 50.55349948549696) * (
                22.86881607932105 - 50.55349948549696) + 50.55349948549696 + 2 * (
                    1 - (22.86881607932105 - 50.55349948549696) / (22.86881607932105 - 50.55349948549696))

    return 462.4 * (d * d * (-0.00025304519602050573) - d * 0.01760550015218513 + 1.5344062688366468)


def read_json(filename):
    location_lat_list = []
    location_lng_list = []
    location_list = []
    sentiment_list = []
    index_list = []
    with open(filename, 'r', encoding='utf-8') as f:
        for i in f:
            temp = json.loads(i)
        # print(temp)
    # 110443
    num = 200000

    for index, content in enumerate(temp):
        location_lat_list.append(fx(float(content['lat'])))
        location_lng_list.append(fy(float(content['lng'])))
        location_list.append([fx(float(content['lat'])), fy(float(content['lng']))])
        sentiment_list.append(float(content['sentiment']))
        index_list.append(index)
        if index >= num:
            break
    return location_lat_list, location_lng_list, np.array(
        sentiment_list), np.array(location_list), index_list


def read_json1(filename):
    location_lat_list = []
    location_lng_list = []
    location_list = []
    sentiment_list = []
    with open(filename, 'r', encoding='utf-8') as f:
        for i in f:
            temp = json.loads(i)
    # 110443
    num = 200000
    for index, content in enumerate(temp):
        location_lat_list.append(content['lat'])
        location_lng_list.append(content['lng'])
        location_list.append([content['lat'], content['lng']])
        sentiment_list.append(abs(float(content['value'])))
        if index >= num:
            break
    return location_lat_list, location_lng_list, np.array(
        sentiment_list), np.array(location_list)


def get_max_min(x, y):
    logging.info('开始计算距离最大值，情感最大值，情感最小值')
    distance_max = 0
    sentiment_max = 0
    sentiment_min = 0
    for i in range(len(x)):
        logging.info(str(i))
        for j in range(i + 1, len(x)):
            a = math.sqrt((x[i][0] - x[j][0])**2 +
                         (x[i][1] - x[j][1])**2)
            if a > distance_max:
                distance_max = a
        if y[i] > sentiment_max:
            sentiment_max = y[i]
        if y[i] < sentiment_min:
            sentiment_min = y[i]
    logging.info('取距离最大值成功' + str(distance_max))
    logging.info('取情感最大值成功' + str(sentiment_max))
    logging.info('取情感最小值成功' + str(sentiment_min))
    return [distance_max, sentiment_max, sentiment_min]


def is_distance(x, y, z, eta, normal_list, QQ):
    # if z[0] == 0 and z[1] == 0:
    #     if math.sqrt((x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2) <= QQ:
    #         return True
    #     else:
    #         False
    #
    # if z[0]*z[1] > 0:
    #     if math.sqrt((x[0] - y[0])**2 + (x[1] - y[1])**2) <= QQ:
    #         if abs(z[0] - z[1]) / (normal_list[1] - normal_list[2]) <= eta:
    #             return True
    #         else:
    #             return False
    #     else:
    #         return False
    # else:
    #     False
    #
    if math.sqrt((x[0] - y[0])**2 + (x[1] - y[1])**2) <= QQ:
        if abs(z[0] - z[1]) <= eta:
            return True
        else:
            return False
    else:
        return False


def new_is_distance(x, y, alpha, normal_list):
    x_temp = 0
    y_temp = 0
    for i in x:
        x_temp += i[0]
        y_temp += i[1]
    x_ave = [x_temp/len(x), y_temp/len(x)]
    x_temp = 0
    y_temp = 0
    for j in y:
        x_temp += j[0]
        y_temp += j[1]
    y_ave = [x_temp/len(y), y_temp/len(y)]

    if math.sqrt((x_ave[0]-y_ave[0])**2+(x_ave[1]-y_ave[1])**2)/normal_list[0] <= alpha:
        return math.sqrt((x_ave[0]-y_ave[0])**2+(x_ave[1]-y_ave[1])**2)/normal_list[0]
    else:
        return False


def my_clustering(location_array, sentiment_array, kde_array, eta, beta, radius, normal_list):
    index_list = []
    for index, content in enumerate(location_array):
        index_list.append({str(index): content})
    print(index_list)
    # 最底层叶子生成
    dict1 = {}
    dict10 = {}
    num = 0
    un_match_list = []
    index_num = 0
    while len(index_list) != 0:
        temp_set = []
        sent = 0
        original_copy = copy.deepcopy(index_list)
        n1 = int(list(random.choice(index_list).keys())[0])
        # temp_r = radius / kde_array(location_array[n1])[0]
        temp_r = radius
        print(temp_r)
        # 2.33
        if temp_r >= 7.5:
            temp_r = 7.5
        print(n1)
        for i, content in enumerate(reversed(original_copy)):
            n2 = int(list(content.keys())[0])
            temp_sentiment_array = [
                sentiment_array[n1], sentiment_array[n2]]
            if is_distance(
                    location_array[n1],
                    location_array[n2],
                    temp_sentiment_array,
                    eta, normal_list, temp_r):
                temp_set.append(n2)
                sent += sentiment_array[n2]
                index_list.pop(len(original_copy) - 1 - i)
        if len(temp_set) > 1:
            sent = sent / len(temp_set)
            dict1[str(index_num)] = Node(items=[index_num],
                                         parent=None,
                                         ave_sentiment=sent,
                                         circle=[n1, radius / kde_array(location_array[n1])[0]],
                                         node_number=len(temp_set),
                                         contained_point=temp_set,
                                         child=[index_num], level=0)
            dict10[str(index_num)] = {'id': index_num, 'parent': None, 'children': [], 'containedpoint': temp_set}
            index_num += 1
        if len(temp_set) == 1:
            un_match_list.append(temp_set[0])
        logging.info("叶子聚类剩余多少点" + str(len(original_copy)))

    for i in un_match_list:
        dict1[str(index_num)] = Node(items=[index_num],
                                     parent=None,
                                     ave_sentiment=sentiment_array[i],
                                     circle=[i, radius / kde_array(location_array[n1])[0]],
                                     node_number=1,
                                     contained_point=[i], child=[index_num], level=0)
        dict10[str(index_num)] = {'id': index_num, 'parent': None, 'children': [], 'containedpoint': [i]}
        index_num += 1
    # 储存所有节点
    dict3 = copy.deepcopy(dict1)
    dict4 = copy.deepcopy(dict1)
    dict6 = copy.deepcopy(dict10)
    # 开始层次聚类
    logging.info('开始层次聚类,类别数量有'+'\t'+str(len(dict1)))
    logging.info('----------------------------------')
    level = 0
    stop_num = 0
    while len(dict4) != 1 and stop_num != 10000:
        dict1 = copy.deepcopy(dict4)
        level += 1
        dict5 = {}
        logging.info('进入层次' + '\t' + str(level))
        logging.info('剩余类别数量' + '\t' + str(len(dict4)))
        stop_num = 0
        while len(dict1) != 0:
            temp = dict1[random.sample(dict1.keys(), 1)[0]]
            baocun_list = []  # 存储符合条件的类别
            temp_baocun_dict = {}
            for content in dict1:
                x = []
                y = []
                for i in temp.contained_point:
                    x.append(location_array[i])
                for i in dict1[content].contained_point:
                    y.append(location_array[i])
                # z = [temp.ave_sentiment, dict2[content].ave_sentiment]
                l = new_is_distance(x, y, beta, normal_list)
                if int(l) == 0:
                    temp_baocun_dict[str(l)] = [content, x, y]
                elif l:
                    temp_baocun_dict[str(l)] = [content, x, y]
            dict100 = sorted(temp_baocun_dict.items(), key=lambda d: d[0])
            for index, i in enumerate(dict100):
                if index >4:
                    break
                baocun_list.append(i[1])

            avesentiment = 0
            totalnodenumber = 0
            containedpoint = []
            child = []
            if len(baocun_list) == 1:
                stop_num += 1
            dict6[str(index_num)] = {'id': index_num, 'parent': None, 'children': []}
            for index, i in enumerate(baocun_list):
                avesentiment += dict1[str(i[0])].ave_sentiment * dict1[str(i[0])].node_number
                totalnodenumber += dict1[str(i[0])].node_number
                containedpoint += dict1[str(i[0])].contained_point
                child += dict1[str(i[0])].child
                dict3[str(i[0])].parent = [index_num]
                dict6[str(i[0])]['parent'] = index_num
                dict6[str(index_num)]['children'].append(dict6[str(i[0])])
                del dict1[str(i[0])]
                del dict6[str(i[0])]
            dict6[str(index_num)]['containedpoint'] = containedpoint
            dict3[str(index_num)] = Node(items=[index_num], parent=None, ave_sentiment=avesentiment / totalnodenumber,
                                         node_number=totalnodenumber,
                                         contained_point=containedpoint,
                                         child=child,
                                         circle=None, level=level)
            dict5[str(index_num)] = Node(items=[index_num], parent=None, ave_sentiment=avesentiment / totalnodenumber,
                                         node_number=totalnodenumber,
                                         contained_point=containedpoint,
                                         child=child,
                                         circle=None, level=level)
            index_num += 1
            logging.info('当前层次' + '\t' + str(level) + '\t' + '剩余类别数量' + '\t' + str(len(dict1)))
        child1 = []
        t = []
        mm = []
        if beta < 0.3:
            beta += 0.07
        print(stop_num, len(dict4))
        if stop_num == len(dict4):
            print('ttttttttttttttttttttt')
            stop_num = 10000
            for i in dict4:
                child1 += dict4[i].items
            dict3[str(index_num)] = Node(items=[index_num], parent=None, ave_sentiment=-1, node_number=-1, child=child1,
                                         circle=None, level='root', contained_point=-1)
            for i in dict6:
                dict6[i]['children'][0]['parent'] = index_num-stop_num
                t.append(dict6[i]['children'][0])
                mm += dict6[i]['children'][0]['containedpoint']
            dict7 = {'id': index_num-stop_num, 'parent': None, 'children': t, 'containedpoint': mm}
        else:
            dict7 = dict6
        dict4 = dict5
        print(len(dict3))
    return dict3, len(dict3), dict7


def standardization(array):
    return preprocessing.scale(array)


def get_random_point(array):
    index = random.randint(0, len(array))
    point = array(index)
    return index, point


def get_kde(array):
    kde = stats.gaussian_kde(array)
    return kde


def file_output(input_data, eta, beta, radius):
    output_file = './outputdata/new_tree_dict_{0}_{1}_{2}.json'.format(eta, beta, radius)
    input_file = {}
    list1 = []
    for i in input_data:
        print(input_data[i].node_number)
        if input_data[i].node_number == -1:
            maxium = max(input_data[i].child)
            list1 = input_data[i].child
        elif input_data[i].node_number == 181373:
            maxium = input_data[i].items[0] - 1
            for j in input_data:
                try:
                    if input_data[j].parent[0] == maxium:
                        list1.append(j)
                except:
                    pass
    for i in input_data:
        if input_data[i].items[0] <= maxium:
            if input_data[i].items[0] in list1:
                input_file[i] = {'items': input_data[i].items, 'parent': [maxium+1],
                                 'ave_sentiment': input_data[i].ave_sentiment,
                                 'node_number': input_data[i].node_number,
                                 'child': input_data[i].child, 'circle': input_data[i].circle,
                                 'level': input_data[i].level,
                                 'contained_points': input_data[i].contained_point}
            else:
               input_file[i] = {'items': input_data[i].items, 'parent': input_data[i].parent, 'ave_sentiment': input_data[i].ave_sentiment,
                                 'node_number': input_data[i].node_number,
                                 'child': input_data[i].child, 'circle': input_data[i].circle, 'level': input_data[i].level,
                                 'contained_points': input_data[i].contained_point}
        elif input_data[i].node_number == -1:
            input_file[str(maxium+1)] = {'items': [maxium+1], 'parent':  [maxium+2], 'ave_sentiment': input_data[i].ave_sentiment,
                             'node_number': input_data[i].node_number,
                             'child': input_data[i].child, 'circle': input_data[i].circle, 'level': input_data[i].level,
                             'contained_points': input_data[i].contained_point}
        elif input_data[i].node_number == 181373:
            input_file[str(maxium+1)] = {'items': [maxium+1], 'parent':  [maxium+2], 'ave_sentiment': input_data[i].ave_sentiment,
                             'node_number': input_data[i].node_number,
                             'child': input_data[i].child, 'circle': input_data[i].circle, 'level': input_data[i].level,
                             'contained_points': input_data[i].contained_point}
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(json.dumps(input_file))


def tree_json_output(input_data, eta, beta, radius):
    output_file = './outputdata/new_visualization_tree_dict_{0}_{1}_{2}.json'.format(beta, eta, radius)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(json.dumps(input_data))


def combining(M, Z, T, eta, beta, radius, maxmin_list):
    Q, Q1, Q2 = my_clustering(M, Z, T, eta, beta, radius, maxmin_list)
    file_output(Q, eta, beta, radius)
    tree_json_output(Q2, eta, beta, radius)

class Node(object):
    def __init__(
            self,
            items,
            parent,
            ave_sentiment,
            node_number,
            contained_point,
            child, circle, level):
        self.items = items
        self.parent = parent
        self.ave_sentiment = ave_sentiment
        self.node_number = node_number
        self.contained_point = contained_point
        self.child = child
        self.circle = circle
        self.level = level


if __name__ == '__main__':
    logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.INFO)
    # X, Y, Z, M, Q = read_json('./93_new.json')
    X, Y, Z, M, Q = read_json('./inputdata/industry_data1.json')
    # X = standardization(X)
    Data = np.array([X, Y])
    T = get_kde(Data)
    # maxmin_list = get_max_min(M, Z)
    # INFO:取距离最大值成功646.5583419822547,0.5575193546780711
    # <class 'list'>: [872.2144943934162, 0.9876, -0.9948] new twitter 99_new
    # INFO:取情感最大值成功0.9985, 9857
    # INFO:取情感最小值成功-0.9956, -9969
    # maxmin_list = [872.2144943934162, 0.9876, -0.9948]
    # <class 'list'>: [811.8689290521634, 0.9985, -0.9956] 93_new
    # < class 'list'>: [31.31945360882922, 0.9998, -0.9979]
    maxmin_list = [82.75854757149585, 143.0, 0]  # industry_data
    # eta, beta, radius
    # Q, Q1, Q2 = my_clustering(M, Z, T, 0.3, 0.1, 0.001, maxmin_list)    12.1  tweet树的参数设定
    combining(M, Z, T, 0.2, 0.1, 3.5, maxmin_list)
    # print(Q)
    # print(Q1)
    # print(Q2)
    # zzz = 0
    # with open('./9.17.json', 'r', encoding= 'utf-8') as f:
    #     for i in f:
    #         temp = json.loads(i)
    # for i in temp:
    #     if float(i['sentiment']) == 0:
    #         zzz += 1
    #
    # print(zzz)
