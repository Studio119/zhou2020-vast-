"""
The algorithm could speed up by memorizing some calculating results
"""

import csv
from itertools import islice
import random
from scipy import stats
import numpy as np
import math
import json
import time
import os
import copy
import sys
from Z_score import Z_score as Z_score


def getDistance(p1, p2):
    x1, y1, x2, y2 = p1['lat'], p1['lng'], p2['lat'], p2['lng']
    return math.sqrt(math.pow(x1 - x2, 2) + math.pow(y1 - y2, 2))


def getOverlapDict(points):
    overlapDict = {}
    for p in points:
        coor = (p['lat'], p['lng'])
        if coor not in overlapDict:
            overlapDict[coor] = [{"id": p['id'], "lat": p['lat'], "lng": p['lng']}]
        else:
            overlapDict[coor].append({"id": p['id'], "lat": p['lat'], "lng": p['lng']})
    for k in overlapDict:
        for points in overlapDict[k]:
            if len(points) == 1:
                overlapDict.pop(k)
    with open('..\\storage\\overlapPoint.json', 'w', encoding='utf-8') as f:
        points = []
        for k in overlapDict:
            for p in overlapDict[k]:
                points.append(p)
        f.write(json.dumps(points))
    return overlapDict


# 去除经纬度相同的点
def dereplication(points):
    # should i check for overlap condition here?
    # if overlap exists,a 3-dimension blue noise algorithm is required?
    pointsSet = []
    pSet = set()
    for p in points:
        if (p['lat'], p['lng']) in pSet:
            pass
        else:
            pSet.add((p['lat'], p['lng']))
            pointsSet.append(p)
    return pointsSet


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


def getdiskR(point, r, kde):
    radius = float(r) / kde([float(point['lat']), float(point['lng'])])[0]
    point['r'] = radius
    return radius


def setdiskRForAllPoints(points, r, kde):
    for p in points:
        p['r'] = getdiskR(p, r, kde)


# could speed up by selecting points in `unSampledPoints` List
def getAllPointsBetweenRAnd2R(center, r, points):
    allPoints = []
    for p in points:
        distance = getDistance(center, p)
        if (distance > r and distance < 2 * r):
            allPoints.append(p)
    return allPoints


def ifAllPointsAreInactive(points):
    for p in points:
        if p['status'] == 1 or p['status'] == None:
            return False
    return True


def setSamplePointsToOutputFormat(points, samplePoints):
    for p in points:
        del p['status']
        del p['coverByDisk']
    for p1 in samplePoints:
        p1['pointsInDisk'] = []
        for p2 in points:
            if p1 == p2:
                continue
            if getDistance(p1, p2) < p1['r']:
                p1['pointsInDisk'].append(p2)
    for p in points:
        if 'pointsInDisk' in p:
            for pInDisk in p['pointsInDisk']:
                if 'r' in pInDisk:
                    del pInDisk['r']
    return samplePoints


def ifAllPointsInDisk(points, samplePoints):
    for p in points:
        if p['coverByDisk'] == False:
            return False
    return True


# if `points` list is lat-lng ordered,shuffle first.
def getRandomPoint(points, samplePoints, kde):
    if (len(samplePoints) == 0):
        return points[random.randint(0, len(points) - 1)]
    for p in points:
        if p['status'] == 0 or p['status'] == 1:
            continue
        if p['coverByDisk'] == True:
            continue
        radius = p['r'] if 'r' in p else getdiskR(p, r, kde)
        for sp in samplePoints:
            dis = getDistance(p, sp)
            if dis < sp['r'] or dis < radius:
                break
        else:
            return p
    return None


def sorting(points, samplePs, activepoints, sampleBRand2R, meann):
    temp_value = {}
    random_poitns = []
    rencently_mean = 0
    m = len(samplePs)
    if len(samplePs) == 1:
        return points
    rencently_mean = meann
    samplePs = [i for i in samplePs if i != activepoints]
    for index, i in enumerate(points):
        temp_our_list = copy.deepcopy(samplePs)
        temp_our_list.append(i)
        fenzi = 0
        fenmu = 0
        oo = (m/(m+1))*rencently_mean + (1/(m+1))*i['value']
        sampleBRand2R.append(i)
        for z in sampleBRand2R:
            fenzi += (1 / len(sampleBRand2R)) * (z['value'] - oo)
        for z in temp_our_list:
            fenmu += (1 / (len(temp_our_list) - 1)) * ((z['value'] - oo) ** 2)
        temp_value[str(index)] = abs((activepoints['value'] - oo) * fenzi / fenmu - activepoints['M'])
    d_order = sorted(temp_value.items(), key=lambda x: x[1], reverse=False)
    for i in d_order:
        random_poitns.append(points[int(i[0])])
    return random_poitns


# parameter r and the disk radius are positively correlated
def blueNoise(originalPoints, r, value):
    activePoints = []
    samplePoints = []
    allLat = []
    allLng = []
    points = dereplication(originalPoints)
    overlapDict = getOverlapDict(originalPoints)
    overlapRate = round((len(originalPoints) - len(points)) / len(originalPoints), 2)
    for p in points:
        allLat.append(p['lat'])
        allLng.append(p['lng'])
    dataForKDE = np.vstack([allLat, allLng])
    kde = stats.gaussian_kde(dataForKDE)

    # @status: 0 for inactive,1 for active,None for neither active nor inactive
    # if a point is inactive,then its points between R and 2R must are all covered by disks
    # but `a point is covered by disk` does not mean it is inactive

    for p in points:
        p['status'] = None
        p['coverByDisk'] = False

    initialActivePoint = getRandomPoint(points, samplePoints, kde)
    initialActivePoint['status'] = 1
    initialActivePoint['coverByDisk'] = True
    samplePoints.append(initialActivePoint)
    activePoints.append(initialActivePoint)

    while (len(activePoints) > 0 or ifAllPointsInDisk(points, samplePoints) == False):
        if len(activePoints) == 0:
            initialActivePoint = getRandomPoint(points, samplePoints, kde)
            if initialActivePoint == None:
                break
            initialActivePoint['status'] = 1
            initialActivePoint['coverByDisk'] = True
            samplePoints.append(initialActivePoint)
            activePoints.append(initialActivePoint)
        randomActivePoint = activePoints[random.randint(
            0, len(activePoints) - 1)]
        diskR = randomActivePoint['r'] if 'r' in randomActivePoint else getdiskR(
            randomActivePoint, r, kde)
        pointsBetweenRand2R = getAllPointsBetweenRAnd2R(
            randomActivePoint, diskR, points)

        for p1 in pointsBetweenRand2R:
            if p1['status'] == 1 or p1['status'] == 0:
                continue
            if p1['coverByDisk'] == True:
                continue
            diskRForP1 = p1['r'] if 'r' in p1 else getdiskR(p1, r, kde)
            for p2 in samplePoints:
                diskRForP2 = p2['r']
                distance = getDistance(p1, p2)
                if distance <= diskRForP2:
                    p1['coverByDisk'] = True
                    break
                if distance <= diskRForP1:
                    break
            else:
                p1['status'] = 1
                p1['coverByDisk'] = True
                activePoints.append(p1)
                samplePoints.append(p1)
                break
        else:
            randomActivePoint['status'] = 0
            activePoints.remove(randomActivePoint)
    print(ifAllPointsInDisk(points, samplePoints))
    setSamplePointsToOutputFormat(points, samplePoints)

    for p in samplePoints:
        for i in range(len(p['pointsInDisk']) - 1, 0, -1):
            coord = (p['pointsInDisk'][i]['lat'], p['pointsInDisk'][i]['lng'])
            overlapPoints = overlapDict[coord]
            for overlapPoint in overlapPoints:
                if p['pointsInDisk'][i]['id'] != overlapPoint['id']:
                    p['pointsInDisk'].append(overlapPoint)
        coord = (p['lat'], p['lng'])
        overlapPoints = overlapDict[coord]
        for overlapPoint in overlapPoints:
            if overlapPoint['id'] != p['id']:
                p['pointsInDisk'].append(overlapPoint)
    return samplePoints


if __name__ == '__main__':
    maxCount = 0
    maxR = 0
    filename = sys.argv[1]
    radius = sys.argv[2]

    recentBlueNoiseFilePath = filename.replace(".json", "_b.json")

    for r in [100000]:
        r = radius
        t1 = time.time()
        points = []

        with open(filename, 'r', encoding='utf8') as f:
            temp = json.load(f)
            value = 0
            for index, i in enumerate(temp):
                pID = index
                lat = float(i['lat'])
                lng = float(i['lng'])
                value += i['value']
                points.append({'id': pID, 'lat': lat, 'lng': lng, 'value': i['value'], 'type': i['type']})
            value = value/len(points)

        samplePoints = blueNoise(points, r, value)

        m = Z_score(k=8, mode="euclidean", equal=False)
        A = [{
            "lng": d['lng'],
            "lat": d['lat'],
            "value": d["value"],
            'id': d['id']
        } for d in samplePoints]

        m.fit(A)

        transform = [m.type_idx(i) for i in range(len(A))]
        with open(recentBlueNoiseFilePath, mode='w', encoding='utf8') as f:
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

            