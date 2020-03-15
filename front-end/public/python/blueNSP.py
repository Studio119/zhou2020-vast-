import csv
import random
import math
import pygame  # draw point
import numpy as np
from scipy import stats
import copy
import json
import networkx as nx


def readData(w2v_file):
    station_data = []
    f = open(w2v_file, 'r', encoding="utf-8")
    tmp_data = csv.reader(f)
    index = 0
    for row in tmp_data:
        if index > 0:
            station_data.append([float(row[1]), float(row[2]), row[0]])
        index += 1
    return station_data


def distance(p1, p2):
    p_diff = (p2[0] - p1[0], p2[1] - p1[1])
    return math.sqrt(math.pow(p_diff[0], 2) + math.pow(p_diff[1], 2))


def geodistance(p1, p2):
    p1[1], p1[0], p2[1], p2[0] = map(math.radians, [p1[1], p1[0], p2[1], p2[0]])
    dlon=p2[1]-p1[1]
    dlat=p2[0]-p1[0]
    a=math.sin(dlat/2)**2 + math.cos(p1[0]) * math.cos(p2[0]) * math.sin(dlon/2)**2
    dis=2*math.asin(math.sqrt(a))*6371*1000
    return dis


def kde_fun(data):
    data1 = []
    for item in data:
        data1.append([item[0], item[1]])
    data1 = np.array(data1)
    values = data1.T
    kde = stats.gaussian_kde(values)
    return kde


def generate_points(kde_function, dataset, oriset, radius, all_well):
    #在dataset数组中采样点,all_well用于采样点寻找周围点的数
    r_dict = {}
    for p in dataset:
        tmp_r = float(kde_function(np.array([p[0], p[1]])))
        tmp_r = radius / (tmp_r)
        r_dict[p[2]] = tmp_r

    samples = []
    neighbors_loc = []
    neighbors_id = []
    # Choose a point randomly in the domain.
    i = int(random.random() * len(dataset))
    ix = dataset[i][0]
    iy = dataset[i][1]
    initial_point = [ix, iy]
    samples.append(initial_point)
    del (dataset[i])
    del(all_well[i])
    # remove the adj of initial point
    tmp_dist_init = float(kde_function(np.array(initial_point)))
    tmp_dist_init = radius * 1 / (tmp_dist_init)
    print("minimum_dist", tmp_dist_init)

    index = 0
    points = []
    ids = []
    r2_points = []
    while (index < len(dataset)):
        ix = dataset[index][0]
        iy = dataset[index][1]
        print(distance(initial_point, [ix, iy]))
        if (distance(initial_point, [ix, iy]) < tmp_dist_init):
            points.append([dataset[index][0], dataset[index][1]])
            ids.append(dataset[index][2])
            del (dataset[index])
        elif (distance(initial_point, [ix, iy]) >= tmp_dist_init) and (distance(initial_point, [ix, iy]) <= 2*tmp_dist_init):
            r2_points.append(dataset[index])
            index += 1
        else:
            index += 1
    neighbors_loc.append(points)
    neighbors_id.append(ids)
    #start judging if each point meet the sample condition
    while len(dataset) > 0:
            # Choose a random point from the active list.
        if len(r2_points) == 0:
            index_pn = int(random.random() * len(dataset))
            ix_h = dataset[index_pn][0]
            iy_h = dataset[index_pn][1]
            pn = [ix_h, iy_h]
            minimum_dist_pn = float(kde_function(np.array(pn)))
            minimum_dist_pn = radius * 1 / (minimum_dist_pn)
            tmp_chindex = all_well.index(dataset[index_pn])
            del (dataset[index_pn])
            fits = True
            # TODO: Optimize.  Maintain a grid of existing samples, and only check viable nearest neighbors.
            print(samples)
            for point in samples:
                print(point)
                minimum_dist_ps = float(kde_function(np.array(point)))
                print(minimum_dist_ps)
                minimum_dist_ps = radius * 1 / (minimum_dist_ps)
                max_dist = max(minimum_dist_pn, minimum_dist_ps)
                if distance(point, pn) < max_dist:
                    fits = False
                    break
            if fits:
                samples.append(pn)
                del(all_well[tmp_chindex])
                tmp_dist_pn = float(kde_function(np.array(pn)))
                tmp_dist_pn = radius * 1 / (tmp_dist_pn)
                print('tmp_dist_pn: ', tmp_dist_pn)
                index = 0
                points = []
                ids = []
                r2_points = []
                while index < len(all_well):
                    ix = all_well[index][0]
                    iy = all_well[index][1]
                    tmp_dis = distance(pn, [ix, iy])
                    if (tmp_dis < tmp_dist_pn):
                        points.append([all_well[index][0], all_well[index][1]])
                        if [all_well[index][0], all_well[index][1]] in samples:
                            t = float(kde_function(np.array([all_well[index][0], all_well[index][1]])))
                            t = radius * 1 / (t)
                            print(t)
                            print(tmp_dist_pn)
                            print(distance(pn, [all_well[index][0], all_well[index][1]]))
                            print("Wrong!!!!!!!!!!!!!!")
                        ids.append(all_well[index][2])
                        if all_well[index] in dataset:
                            tmp_arindex = dataset.index(all_well[index])
                            del (dataset[tmp_arindex])
                        index += 1
                    elif (tmp_dis > tmp_dist_pn) and (tmp_dis < 2 * tmp_dist_pn) and (all_well[index] in dataset):
                        r2_points.append(all_well[index])
                        index += 1
                    else:
                        index += 1
                neighbors_loc.append(points)
                neighbors_id.append(ids)
        else:
            while len(r2_points) > 0:
                print("dataset: ", len(dataset))
                # Generate up to k points chosen uniformly at random from dataset
                index_pn = int(random.random() * len(r2_points))
                ix_h = r2_points[index_pn][0]
                iy_h = r2_points[index_pn][1]
                pn = [ix_h, iy_h]
                minimum_dist_pn = float(kde_function(np.array(pn)))
                minimum_dist_pn = radius * 1 / (minimum_dist_pn)
                tmp_index = dataset.index(r2_points[index_pn])
                tmp_chindex = all_well.index(dataset[tmp_index])

                del(dataset[tmp_index])
                del(r2_points[index_pn])

                fits = True
                # TODO: Optimize.  Maintain a grid of existing samples, and only check viable nearest neighbors.
                for point in samples:
                    minimum_dist_ps = float(kde_function(np.array(point)))
                    minimum_dist_ps = radius * 1 / (minimum_dist_ps)
                    # print("minimum_dist_pn: ", minimum_dist_pn)
                    # print("minimum_dist_ps: ", minimum_dist_ps)
                    max_dist = max(minimum_dist_pn, minimum_dist_ps)
                    # print("max_dist: ", max_dist)
                    if distance(point, pn) < max_dist:
                        fits = False
                        break
                if fits == True:
                    samples.append(pn)
                    del(all_well[tmp_chindex])
                    tmp_dist_pn = float(kde_function(np.array(pn)))
                    tmp_dist_pn = radius * 1 / (tmp_dist_pn)
                    print('tmp_dist_pn: ', tmp_dist_pn)
                    index = 0
                    points = []
                    ids = []
                    r2_points = []
                    while (index < len(all_well)):
                        ix = all_well[index][0]
                        iy = all_well[index][1]
                        tmp_dis = distance(pn, [ix, iy])
                        if (tmp_dis < tmp_dist_pn):
                            points.append([all_well[index][0], all_well[index][1]])
                            if [all_well[index][0], all_well[index][1]] in samples:
                                print("Wrong!!!!!!!!!!!!!!")
                                t = float(kde_function(np.array([all_well[index][0], all_well[index][1]])))
                                t = radius * 1 / (t)
                                print(t)
                                print(tmp_dist_pn)
                                print(distance(pn, [all_well[index][0], all_well[index][1]]))
                                print("Wrong!!!!!!!!!!!!!!")
                            ids.append(all_well[index][2])

                            if all_well[index] in dataset:
                                tmp_arindex = dataset.index(all_well[index])
                                del (dataset[tmp_arindex])
                            index += 1
                        elif (tmp_dis > tmp_dist_pn) and (tmp_dis < 2 * tmp_dist_pn) and (all_well[index] in dataset):
                            r2_points.append(all_well[index])
                            index += 1
                        else:
                            index += 1
                    neighbors_loc.append(points)
                    neighbors_id.append(ids)
                    break
    return samples, neighbors_loc, neighbors_id, r_dict


def isSame(p1, p2):
    if p1[0] == p2[0] and p1[1] == p2[1]:
        return True
    else:
        return False


def fun(rate, pds_r):
    pos_file = 'data_x_y_node2vec/297_node_x_y.csv'
    f = open("data_x_y_node2vec/297_node_x_y.csv", 'r', encoding='utf-8')
    id_data = csv.reader(f)
    index = 0
    id_arr = []
    for row in id_data:
        if index > 0:
            id_arr.append(row[0])
        index += 1
    print(len(id_arr))

    # read points
    station_data = readData(pos_file)
    kde = kde_fun(station_data)
    gene_data = copy.deepcopy(station_data)
    all_well = copy.deepcopy(station_data)
    samples, neighbors_loc, neighbors_id, r_dict= generate_points(kde, gene_data, station_data, pds_r, all_well)

    index_arr = []
    for p1 in samples:
        for p2 in station_data:
            if isSame(p1, p2):
                index_arr.append(station_data.index(p2))
                break
    print(index_arr)
    print(len(index_arr))
    print("Station_data: ", len(station_data))

    print("samples: ", len(samples))
    #print(samples)
    print("sample: ", len(neighbors_loc))
    #print("sample:", neighbors_loc)

    out_arr = []
    tmp_index = 0
    for arr in station_data:
        tmp_dict = {}
        tmp_dict['id'] = arr[2]
        tmp_dict['loc'] = [arr[0], arr[1]]
        tmp_dict['status'] = 0
        tmp_dict['radius'] = r_dict[arr[2]]
        tmp_dict['index'] = tmp_index
        tmp_dict['around_points'] = []
        tmp_dict['around_ids'] = []
        out_arr.append(tmp_dict)
        tmp_index += 1
    tmp_index = 0
    for index in index_arr:
        out_arr[index]['status'] = 1
        out_arr[index]['around_points'] = neighbors_loc[tmp_index]
        out_arr[index]['around_ids'] = neighbors_id[tmp_index]
        tmp_index += 1

    outfile = open("public/data/R2sameCir_" + str(rate) + ".json", 'w', newline='')
    outdata = json.dumps(out_arr)
    outfile.write(outdata)
    outfile.close()


pdsR_arr = [0.003, 0.002, 0.001]
rates = [10, 20, 50]
# fun(10, 130)
for i in range(3):
    fun(rates[i], pdsR_arr[i])

