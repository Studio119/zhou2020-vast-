import json, math, random



# 导入邻近泊松盘信息， 盘内点信息，以及每个点的邻近信息
# diskCoverPoints = []
# diskNearby = []
# oriData = []
# associated_NearbyDisk = []
# with open('./blue noise/diskCoverPoints.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         diskCoverPoints = json.loads(i)
#
# with open('./blue noise/diskNearby.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         diskNearby = json.loads(i)
#
# with open('./blue noise/healthy_output_101.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         oriData = json.loads(i)
#
# with open('./blue noise/associatedDiskNearby.json', 'r', encoding='utf-8') as f:
#     for i in f:
#         associated_NearbyDisk = json.loads(i)


def update(oriData, diskCoverPoints, diskNearby, associated_NearbyDisk):
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
    return sampledPoints, overlapPoints


def update1(oriData, diskCoverPoints, diskNearby, associated_NearbyDisk, cover4):
    overlapPoints = 0
    # Status 为0，表示该盘还未选点，为1表示已选点 diskVote为每个已经采样的盘记录去广播信息
    diskNumber = len(diskCoverPoints)
    print(diskNumber)
    diskStatus = {}
    diskVote = {}
    diskPoints = {}
    sampledDisk = []
    sampledPoints = []
    for i in range(diskNumber):
        diskStatus[str(i)] = 0
    for i in range(diskNumber):
        diskVote[str(i)] = [0, 0]
    # 算法开始，思路，首先将泊松盘内只包含一种类型的点直接采样了
    for index, i in enumerate(diskCoverPoints):
        t = False
        if len(diskCoverPoints[index][0]) == 0:
            temp = 0
            temp1 = 0
            for j in diskNearby[str(index)]:
                if len(diskCoverPoints[j][0]) == 0:
                    temp += 1
                if len(diskCoverPoints[j][1]) == 0:
                    temp1 += 1
            if temp >= 7:
                t = random.sample(cover4[index][3], 1)[0]  # LH
            elif temp1 >= 7:
                t = random.sample(cover4[index][2], 1)[0]  # LL
            else:
                t = random.sample(diskCoverPoints[index][1], 1)[0]
        elif len(diskCoverPoints[index][1]) == 0:
            temp = 0
            temp1 = 0
            for j in diskNearby[str(index)]:
                if len(diskCoverPoints[j][0]) == 0:
                    temp += 1
                if len(diskCoverPoints[j][1]) == 0:
                    temp1 += 1
            if temp >= 7:
                t = random.sample(cover4[index][0], 1)[0]
            elif temp1 >= 7:
                t = random.sample(cover4[index][1], 1)[0]
            else:
                t = random.sample(diskCoverPoints[index][0], 1)[0]
            # t = random.sample(diskCoverPoints[index][0], 1)[0]
        if t:
            sampledPoints.append(t)
            sampledDisk.append(index)
            diskPoints[str(index)] = t
            diskStatus[str(index)] = 1
            diskVote[str(index)] = [oriData[t]['n_H'], oriData[t]['n_L']]
        else:
            continue


    num = 0
    for i in diskStatus:
        if diskStatus[i] != 0:
            num += 1
    print('初始采样状态', num, diskNumber)

    current_nearbyDisk = []
    for i in sampledDisk:
        temp = diskNearby[str(i)]
        for j in temp:
            if int(j) in current_nearbyDisk or int(j) in sampledDisk:
                continue
            else:
                current_nearbyDisk.append(int(j))
    print(current_nearbyDisk)
    # 接下来的采样策略就是直接算出当前已采样盘的所有邻接盘，然后从中进行随机选出邻接盘，根据已经采样点的投票信息进行选点操作

    while len(current_nearbyDisk) != 0 or len(sampledPoints) != diskNumber:
        if len(current_nearbyDisk) == 0:
            print('OKOKOKOKO', len(sampledPoints))
            for i in diskStatus:
                if diskStatus[i] != 1:
                    current_nearbyDisk.append(int(i))
        nearby_index = random.sample(current_nearbyDisk, 1)[0]
        current_nearbyDisk.remove(nearby_index)
        # 找出当前哪些已采样点的邻近点是与当前随机的nearby盘有关的
        probability_H = 0
        probability_L = 0
        for i in associated_NearbyDisk[str(nearby_index)]:
            probability_H += diskVote[str(i)][0]
            probability_L += diskVote[str(i)][1]

        # 定义概率
        try:
            alpha = (probability_H)/(probability_H + probability_L)
        except:
            alpha = len(diskCoverPoints[nearby_index][0])/(len(diskCoverPoints[nearby_index][1]) + len(diskCoverPoints[nearby_index][0]))
        tempR = random.random()
        # 根据概率挑选类别，然后选择一个点
        if tempR <= alpha:
            temp = 0
            temp1 = 0
            for j in diskNearby[str(nearby_index)]:
                if diskStatus[str(j)] == 1:
                    if oriData[diskPoints[str(j)]]['type'] == 'HH' or oriData[diskPoints[str(j)]]['type'] == 'HL':
                        temp += 1
                    else:
                        temp1 += 1
            # print(temp, temp1)
            if temp >= 4 and temp1 >= 4:
                t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            elif temp >= 4:
                if len(cover4[nearby_index][0]) == 0:
                    t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                else:
                    t = random.sample(cover4[nearby_index][0], 1)[0]
            elif temp1 >= 4:
                if len(cover4[nearby_index][1]) == 0:
                    t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                else:
                    t = random.sample(cover4[nearby_index][1], 1)[0]
            else:
                t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                    # temp.append(oriData(diskPoints[str(j)]))
                # if len(diskCoverPoints[j][0]) == 0:
                #     temp += 1
                # if len(diskCoverPoints[j][1]) == 0:
                #     temp1 += 1
            # if temp >= 7:
            #     t = random.sample(cover4[nearby_index][0], 1)[0]
            # elif temp1 >= 7:
            #     t = random.sample(cover4[nearby_index][1], 1)[0]
            # else:
            #     t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
        else:
            temp = 0
            temp1 = 0
            for j in diskNearby[str(nearby_index)]:
                if diskStatus[str(j)] == 1:
                    if oriData[diskPoints[str(j)]]['type'] == 'LH' or oriData[diskPoints[str(j)]]['type'] == 'LL':
                        temp += 1
                    else:
                        temp1 += 1
            if temp >= 4 and temp1 >= 4:
                t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            elif temp >= 4:
                if len(cover4[nearby_index][2]) == 0:
                    t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
                else:
                    t = random.sample(cover4[nearby_index][2], 1)[0]
            elif temp1 >= 4:
                if len(cover4[nearby_index][3]) == 0:
                    t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
                else:
                    t = random.sample(cover4[nearby_index][3], 1)[0]
            else:
                t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #     if len(diskCoverPoints[j][0]) == 0:
            #         temp += 1
            #     if len(diskCoverPoints[j][1]) == 0:
            #         temp1 += 1
            # if temp >= 7:
            #     t = random.sample(cover4[nearby_index][3], 1)[0]
            # elif temp1 >= 7:
            #     t = random.sample(cover4[nearby_index][2], 1)[0]
            # else:
            #     t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            # t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
        sampledPoints.append(t)
        sampledDisk.append(nearby_index)
        diskStatus[str(nearby_index)] = 1
        diskPoints[str(nearby_index)] = t
        diskVote[str(nearby_index)] = [oriData[t]['n_H'], oriData[t]['n_L']]
        # 找出当前盘的邻近盘，把他纳入当前邻近盘，然后进行下一次随机
        temp = diskNearby[str(nearby_index)]
        for j in temp:
            if int(j) in current_nearbyDisk or int(j) in sampledDisk:
                continue
            else:
                current_nearbyDisk.append(int(j))

    samplePoints = []
    for i in sampledPoints:
        samplePoints.append(oriData[i])
    return samplePoints


def update2(oriData, diskCoverPoints, diskNearby, associated_NearbyDisk, cover4, cover1, alpha1):
    alpha1 = float(alpha1)
    overlapPoints = 0
    # Status 为0，表示该盘还未选点，为1表示已选点 diskVote为每个已经采样的盘记录去广播信息
    diskNumber = len(diskCoverPoints)
    print(diskNumber)
    diskStatus = {}
    diskVote = {}
    diskPoints = {}
    sampledDisk = []
    sampledPoints = []
    for i in range(diskNumber):
        diskStatus[str(i)] = 0
    for i in range(diskNumber):
        diskVote[str(i)] = [0, 0]
    tem = 0

    # 计算n_H和n_L
    for i in oriData:
        temp = i['neighbors']
        nH = 0
        nL = 0
        for j in temp:
            if oriData[int(j)]['type'] == 'HH' or oriData[int(j)]['type'] == 'HL':
                nH += 1
            elif oriData[int(j)]['type'] == 'LH' or oriData[int(j)]['type'] == 'LL':
                nL += 1
        i['n_H'] = nH
        i['n_L'] = nL


    # 算法开始，思路，首先将泊松盘内只包含一种类型的点直接采样了
    for index, i in enumerate(cover4):
        t = False
        # if len(cover1[index][0]) == 0:
        #     # temp = 0
        #     # temp1 = 0
        #     # for j in diskNearby[str(index)]:
        #     #     if len(cover1[j][0]) == 0:
        #     #         temp += 1
        #     #     if len(cover1[j][1]) == 0:
        #     #         temp1 += 1
        #     # if temp >= 7:
        #     #     tem += 1
        #     #     t = random.sample(cover4[index][3], 1)[0]  # LH
        #     # elif temp1 >= 7:
        #     #     tem += 1
        #     #     t = random.sample(cover4[index][2], 1)[0]  # LL
        #     # else:
        #     t = random.sample(cover1[index][1], 1)[0]
        # elif len(cover1[index][1]) == 0:
        #     # temp = 0
        #     # temp1 = 0
        #     # for j in diskNearby[str(index)]:
        #     #     if len(diskCoverPoints[j][0]) == 0:
        #     #         temp += 1
        #     #     if len(diskCoverPoints[j][1]) == 0:
        #     #         temp1 += 1
        #     # if temp >= 7:
        #     #     tem += 1
        #     #     t = random.sample(cover4[index][0], 1)[0]
        #     # elif temp1 >= 7:
        #     #     tem += 1
        #     #     t = random.sample(cover4[index][1], 1)[0]
        #     # else:
        #     t = random.sample(cover1[index][0], 1)[0]
        #     # t = random.sample(diskCoverPoints[index][0], 1)[0]
        # 从只包含HH或者只包含LL的类中选择
        if len(cover4[index][1]) == 0 and len(cover4[index][2]) == 0 and len(cover4[index][3]) == 0:
            t = random.sample(cover4[index][0], 1)[0]
        if len(cover4[index][0]) == 0 and len(cover4[index][1]) == 0 and len(cover4[index][3]) == 0:
            t = random.sample(cover4[index][2], 1)[0]
        if t:
            sampledPoints.append(t)
            sampledDisk.append(index)
            diskPoints[str(index)] = t
            diskStatus[str(index)] = 1
            diskVote[str(index)] = [oriData[t]['n_H'], oriData[t]['n_L']]
        else:
            continue
    print(tem)

    num = 0
    for i in diskStatus:
        if diskStatus[i] != 0:
            num += 1
    print('初始采样状态', num, diskNumber)

    current_nearbyDisk = []
    for i in sampledDisk:
        temp = diskNearby[str(i)]
        for j in temp:
            if int(j) in current_nearbyDisk or int(j) in sampledDisk:
                continue
            else:
                current_nearbyDisk.append(int(j))
    print(len(current_nearbyDisk))
    print(len(set(current_nearbyDisk)))
    # 接下来的采样策略就是直接算出当前已采样盘的所有邻接盘，然后从中进行随机选出邻接盘，根据已经采样点的投票信息进行选点操作

    while len(current_nearbyDisk) != 0 or len(sampledPoints) != diskNumber:
        if len(current_nearbyDisk) == 0:
            print('OKOKOKOKO', len(sampledPoints))
            for i in diskStatus:
                if diskStatus[i] != 1:
                    current_nearbyDisk.append(int(i))
        nearby_index = random.sample(current_nearbyDisk, 1)[0]
        current_nearbyDisk.remove(nearby_index)
        # 找出当前哪些已采样点的邻近点是与当前随机的nearby盘有关的
        probability_H = 0
        probability_L = 0
        for i in associated_NearbyDisk[str(nearby_index)]:
            probability_H += diskVote[str(i)][0]
            probability_L += diskVote[str(i)][1]

        # 定义概率
        try:
            alpha = (probability_H)/(probability_H + probability_L)
            # if alpha >= 0.6:
            #     alpha = 0.6
        except:
            alpha = len(diskCoverPoints[nearby_index][0])/(len(diskCoverPoints[nearby_index][1]) + len(diskCoverPoints[nearby_index][0]))
        tempR = random.random()
        # 根据概率挑选类别，然后选择一个点
        if tempR <= alpha:
            temp = 0
            temp1 = 0
            tttt = []
            for j in diskNearby[str(nearby_index)]:
                if diskStatus[str(j)] == 1:
                    if oriData[diskPoints[str(j)]]['type'] == 'HH' or oriData[diskPoints[str(j)]]['type'] == 'HL':
                        temp += 1
                    else:
                        temp1 += 1
            if len(diskCoverPoints[nearby_index][0]) != 0:
                # print(temp, temp1)
                if (temp + temp1) > 2:
                    if temp/(temp + temp1) > alpha1:
                        if len(cover4[nearby_index][0]) == 0:
                            t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][0], 1)[0]
                    elif temp1/(temp + temp1) > alpha1:
                        if len(cover4[nearby_index][1]) == 0:
                            t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][1], 1)[0]
                    else:
                        t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                else:
                    t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            else:
                if (temp + temp1) > 2:
                    if temp/(temp + temp1) > alpha1:
                        tttt = cover4[nearby_index][0] + cover4[nearby_index][3]
                        if len(tttt) != 0:
                            t = random.sample(tttt, 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][2], 1)[0]
                    elif temp1/(temp + temp1) > alpha1:
                        tttt = cover4[nearby_index][1] + cover4[nearby_index][2]
                        if len(tttt) != 0:
                            t = random.sample(tttt, 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][3], 1)[0]
                    else:
                        t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
                else:
                    t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]

            # if temp >= 3 and temp1 >= 3:
            #     if len(diskCoverPoints[nearby_index][0]) == 0:
            #         t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #     else:
            #         t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            # elif temp >= 3:
            #     if len(cover4[nearby_index][0]) == 0:
            #         if len(diskCoverPoints[nearby_index][0]) == 0:
            #             t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #         else:
            #             t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            #     else:
            #         t = random.sample(cover4[nearby_index][0], 1)[0]
            # elif temp1 >= 3:
            #     if len(cover4[nearby_index][1]) == 0:
            #         if len(diskCoverPoints[nearby_index][0]) == 0:
            #             t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #         else:
            #             t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            #     else:
            #         t = random.sample(cover4[nearby_index][1], 1)[0]
            # else:
            #     if len(diskCoverPoints[nearby_index][0]) == 0:
            #         t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #     else:
            #         t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                    # temp.append(oriData(diskPoints[str(j)]))
                # if len(diskCoverPoints[j][0]) == 0:
                #     temp += 1
                # if len(diskCoverPoints[j][1]) == 0:
                #     temp1 += 1
            # if temp >= 7:
            #     t = random.sample(cover4[nearby_index][0], 1)[0]
            # elif temp1 >= 7:
            #     t = random.sample(cover4[nearby_index][1], 1)[0]
            # else:
            #     t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
        else:
            temp = 0
            temp1 = 0
            for j in diskNearby[str(nearby_index)]:
                if diskStatus[str(j)] == 1:
                    if oriData[diskPoints[str(j)]]['type'] == 'LH' or oriData[diskPoints[str(j)]]['type'] == 'LL':
                        temp += 1
                    else:
                        temp1 += 1
            if len(diskCoverPoints[nearby_index][1]) != 0:
                if (temp + temp1) > 2:
                    if temp/(temp+temp1) > alpha1:
                        if len(cover4[nearby_index][2]) == 0:
                            t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][2], 1)[0]
                    elif temp1/(temp+temp1) > alpha1:
                        if len(cover4[nearby_index][3]) == 0:
                            t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][3], 1)[0]
                    else:
                        t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
                else:
                    t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            else:
                if (temp + temp1) > 2:
                    if temp/(temp + temp1) > alpha1:
                        tttt = cover4[nearby_index][1] + cover4[nearby_index][2]
                        if len(tttt) != 0:
                            t = random.sample(tttt, 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][0], 1)[0]
                    elif temp1/(temp + temp1) > alpha1:
                        tttt = cover4[nearby_index][0] + cover4[nearby_index][3]
                        if len(tttt) != 0:
                            t = random.sample(tttt, 1)[0]
                        else:
                            t = random.sample(cover4[nearby_index][1], 1)[0]
                    else:
                        t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
                else:
                    t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            # if temp >= 3 and temp1 >= 3:
            #     if len(diskCoverPoints[nearby_index][1]) == 0:
            #         t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            #     else:
            #         t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            # elif temp >= 3:
            #     if len(cover4[nearby_index][2]) == 0:
            #         if len(diskCoverPoints[nearby_index][1]) == 0:
            #             t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            #         else:
            #             t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #     else:
            #         t = random.sample(cover4[nearby_index][2], 1)[0]
            # elif temp1 >= 3:
            #     if len(cover4[nearby_index][3]) == 0:
            #         if len(diskCoverPoints[nearby_index][1]) == 0:
            #             t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            #         else:
            #             t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #     else:
            #         t = random.sample(cover4[nearby_index][3], 1)[0]
            # else:
            #     if len(diskCoverPoints[nearby_index][1]) == 0:
            #         t = random.sample(diskCoverPoints[nearby_index][0], 1)[0]
            #     else:
            #         t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            #     if len(diskCoverPoints[j][0]) == 0:
            #         temp += 1
            #     if len(diskCoverPoints[j][1]) == 0:
            #         temp1 += 1
            # if temp >= 7:
            #     t = random.sample(cover4[nearby_index][3], 1)[0]
            # elif temp1 >= 7:
            #     t = random.sample(cover4[nearby_index][2], 1)[0]
            # else:
            #     t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
            # t = random.sample(diskCoverPoints[nearby_index][1], 1)[0]
        if t in sampledPoints:
            print('wrong', nearby_index, sampledPoints)
            if nearby_index in sampledDisk:
                print('盘多采了')
        sampledPoints.append(t)
        sampledDisk.append(nearby_index)
        diskStatus[str(nearby_index)] = 1
        diskPoints[str(nearby_index)] = t
        diskVote[str(nearby_index)] = [oriData[t]['n_H'], oriData[t]['n_L']]
        # 找出当前盘的邻近盘，把他纳入当前邻近盘，然后进行下一次随机
        temp = diskNearby[str(nearby_index)]
        for j in temp:
            if int(j) in current_nearbyDisk or int(j) in sampledDisk:
                continue
            else:
                current_nearbyDisk.append(int(j))
    samplePoints = []
    # for i in sampledPoints:
    #     samplePoints.append(oriData[i])
    for i in range(len(diskPoints)):
        samplePoints.append(oriData[diskPoints[str(i)]])
    return samplePoints


if __name__ == '__main__':

    samplePoints, overlapPoints = update(oriData, diskCoverPoints, diskNearby, associated_NearbyDisk)
    print(overlapPoints)
    with open('./blue noise/sampledPoints_3.16_1.json', 'w', encoding='utf-8')as f:
        f.write(json.dumps(samplePoints))
