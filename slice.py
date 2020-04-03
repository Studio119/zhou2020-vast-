from tqdm import tqdm as tr


def stringify(d):
	return d[:d.find(".") + 4]


with open("Chicago_Crimes_2012.csv", mode='r') as ifile:
	with open("Chicago_Crimes_12.csv", mode='w', encoding='utf8') as ofile:
		table = {}
		for line in tr(ifile.readlines()[1:], leave=True):
			items = line.split(",")
			try:
				if not items[20] or not items[21]:
					continue
				lat = float(items[20])
				lng = float(items[21])
				index = stringify(items[20]) + "," + stringify(items[21])
				if index in table:
					table[index][2] += 1
				else:
					table[index] = [lat, lng, 1]
			except:
				continue

		table = [table[t] for t in table]

		table.sort(key=lambda d: d[0])

		for record in table[:20005]:
			ofile.write("{},{},{}\n".format(record[0], record[1], float(record[2])))
