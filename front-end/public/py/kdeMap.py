import numpy as np
from scipy import stats
import json
from  mpl_toolkits.mplot3d import *
import matplotlib.pyplot as plt


def draw(data):
	fig = plt.figure(figsize=[12, 8])

	ax = [
		[0.05, 0.05],
		[0.55, 0.05],
		[0.05, 0.55],
		[0.55, 0.55]
	]

	for idx, label in enumerate(["HH", "LH", "LL", "HL"]):
		ori = data[label]
		m1 = []
		m2 = []

		for i in ori:
			m1.append(i['x'])
			m2.append(i['y'])

		m1 = np.array(m1)
		m2 = np.array(m2)
		xmin = m1.min()
		xmax = m1.max()
		ymin = m2.min()
		ymax = m2.max()

		values = np.vstack([m1, m2])
		kernel1 = stats.gaussian_kde(values)

		# 绘制原始的密度分布（3维度）
		X, Y = np.mgrid[xmin:xmax:100j, ymin:ymax:100j]
		positions = np.vstack([X.ravel(), Y.ravel()])
		Z = np.reshape(kernel1(positions).T, X.shape)

		axd = Axes3D(fig, rect=(ax[idx][0], ax[idx][1], 0.4, 0.4))
		axd.set_title(label)
		axd.plot_surface(X, Y, Z, rstride=1, cstride=1, cmap=plt.cm.jet)
		axd.set_zlim(bottom=0, top=0.00002)
		pass

	plt.show()


def draw_together(data):
	fig = plt.figure(figsize=[12, 8])
	axd = Axes3D(fig)

	colors = ["#00000080", "#F3BD0080", "#509DC280", "#E7000080"]

	for idx, label in enumerate(["HH", "LH", "LL", "HL"]):
		ori = data[label]
		m1 = []
		m2 = []

		for i in ori:
			m1.append(i['x'])
			m2.append(i['y'])

		m1 = np.array(m1)
		m2 = np.array(m2)
		xmin = m1.min()
		xmax = m1.max()
		ymin = m2.min()
		ymax = m2.max()

		values = np.vstack([m1, m2])
		kernel1 = stats.gaussian_kde(values)

		# 绘制原始的密度分布（3维度）
		X, Y = np.mgrid[xmin:xmax:100j, ymin:ymax:100j]
		positions = np.vstack([X.ravel(), Y.ravel()])
		Z = np.reshape(kernel1(positions).T, X.shape)

		axd.plot_surface(X, Y, Z, rstride=1, cstride=1, color=colors[idx])
		pass

	axd.set_zlim(bottom=0, top=0.00002)

	plt.show()



if __name__ == "__main__":
	with open("..\\storage\\pointsOnMap.json", mode='r', encoding='utf8') as f_data:
		data = {
			"HH": [], "LH": [], "LL": [], "HL": []
		}
		for d in json.load(f_data):
			data[d["type"]].append(d)
		draw(data)
		draw_together(data)

