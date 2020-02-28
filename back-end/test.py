from sklearn.neighbors import kde
import numpy as np

X = np.array([[-1, -1], [-2, -1], [-3, -2], [1, 1], [2, 1], [3, 2]])
kde = kde.KernelDensity(kernel='gaussian', bandwidth=0.2).fit(X)
print(kde.score_samples(X))
print(np.exp(kde.score_samples(X)))

