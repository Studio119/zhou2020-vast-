import json, math, random

# 导入邻近泊松盘信息， 盘内点信息，以及每个点的邻近信息
diskCoverPoints = []
diskNearby = []
oriData = []
associated_NearbyDisk = []
with open('./blue noise/diskCoverPoints.json', 'r', encoding='utf-8') as f:
    for i in f:
        diskCoverPoints = json.loads(i)

with open('./blue noise/diskNearby.json', 'r', encoding='utf-8') as f:
    for i in f:
        diskNearby = json.loads(i)

with open('./blue noise/healthy_output_101.json', 'r', encoding='utf-8') as f:
    for i in f:
        oriData = json.loads(i)

with open('./blue noise/associatedDiskNearby.json', 'r', encoding='utf-8') as f:
    for i in f:
        associated_NearbyDisk = json.loads(i)

overlapPoints = 0
# Status 为0，表示该盘还未选点，为1表示已选点 diskVote为每个已经采样的盘记录去广播信息
diskNumber = len(diskCoverPoints)
diskStatus = {}
diskVote = {}
sampledDisk = []
sampledPoints = []
for i in range(diskNumber):
    diskStatus[str(i)] = 0
for i in range(diskNumber):
    diskVote[str(i)] = [0, 0]
# 算法开始，思路，首先将泊松盘内只包含一种类型的点直接采样了
for index, i in enumerate(diskCoverPoints):
    t = False
    if len(diskCoverPoints[index][str(index)][0]) == 0:
        t = random.sample(diskCoverPoints[index][str(index)][1], 1)[0]
        while t in sampledPoints:
            print('出现重复点了')
            overlapPoints += 1
            diskCoverPoints[index][str(index)][1].remove(t)
            t = random.sample(diskCoverPoints[index][str(index)][1], 1)[0]
            if len(diskCoverPoints[index][str(index)][1]) ==0:
                print('有问题')
    elif len(diskCoverPoints[index][str(index)][1]) == 0:
        t = random.sample(diskCoverPoints[index][str(index)][0], 1)[0]
        while t in sampledPoints:
            print('出现重复点了')
            overlapPoints += 1
            diskCoverPoints[index][str(index)][0].remove(t)
            t = random.sample(diskCoverPoints[index][str(index)][0], 1)[0]
            if len(diskCoverPoints[index][str(index)][0]) == 0:
                print('有问题')
    if t:
        sampledPoints.append(t)
        sampledDisk.append(index)
        diskStatus[str(index)] = 1
        diskVote[str(index)] = [oriData[t]['n_H'], oriData[t]['n_L']]
    else:
        continue

num = 0
for i in diskStatus:
    if diskStatus[i] != 0:
        num += 1
print(num, diskNumber)

current_nearbyDisk = []
for i in sampledDisk:
    temp = diskNearby[i][str(i)]
    for j in temp:
        if int(j) in current_nearbyDisk or int(j) in sampledDisk:
            continue
        else:
            current_nearbyDisk.append(int(j))
print(current_nearbyDisk)
# 接下来的采样策略就是直接算出当前已采样盘的所有邻接盘，然后从中进行随机选出邻接盘，根据已经采样点的投票信息进行选点操作

while len(current_nearbyDisk) != 0:
    nearby_index = random.sample(current_nearbyDisk, 1)[0]
    current_nearbyDisk.remove(nearby_index)
    # 找出当前哪些已采样点的邻近点是与当前随机的nearby盘有关的
    probability_H = 0
    probability_L = 0
    for i in associated_NearbyDisk[nearby_index]:
        probability_H += diskVote[str(i)][0]
        probability_L += diskVote[str(i)][1]

    # 定义概率
    alpha = (probability_H)/(probability_H + probability_L)
    tempR = random.random()
    # 根据概率挑选类别，然后选择一个点
    if tempR <= alpha:
        t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][0], 1)[0]
        while t in sampledPoints:
            print('出现重复点了')
            overlapPoints += 1
            diskCoverPoints[nearby_index][str(nearby_index)][0].remove(t)
            # t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][0], 1)[0]
            if len(diskCoverPoints[nearby_index][str(nearby_index)][0]) == 0:
                t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][1], 1)[0]
                while t in sampledPoints:
                    print('出现重复点了')
                    overlapPoints += 1
                    diskCoverPoints[nearby_index][str(nearby_index)][1].remove(t)
                    t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][1], 1)[0]
            else:
                t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][0], 1)[0]
    else:
        t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][1], 1)[0]
        while t in sampledPoints:
            print('出现重复点了')
            overlapPoints += 1
            diskCoverPoints[nearby_index][str(nearby_index)][1].remove(t)
            # t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][1], 1)[0]
            if len(diskCoverPoints[nearby_index][str(nearby_index)][1]) == 0:
                t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][0], 1)[0]
                while t in sampledPoints:
                    print('出现重复点了')
                    overlapPoints += 1
                    diskCoverPoints[nearby_index][str(nearby_index)][0].remove(t)
                    t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][0], 1)[0]
            else:
                t = random.sample(diskCoverPoints[nearby_index][str(nearby_index)][1], 1)[0]
    sampledPoints.append(t)
    sampledDisk.append(nearby_index)
    diskStatus[str(nearby_index)] = 1
    diskVote[str(nearby_index)] = [oriData[t]['n_H'], oriData[t]['n_L']]
    # 找出当前盘的邻近盘，把他纳入当前邻近盘，然后进行下一次随机
    temp = diskNearby[nearby_index][str(nearby_index)]
    for j in temp:
        if int(j) in current_nearbyDisk or int(j) in sampledDisk:
            continue
        else:
            current_nearbyDisk.append(int(j))

samplePoints = []
for i in sampledPoints:
    samplePoints.append(oriData[i])

print(overlapPoints)
with open('./blue noise/sampledPoints_3.16_1.json', 'w', encoding='utf-8')as f:
    f.write(json.dumps(samplePoints))
