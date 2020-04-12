import numpy as np
from scipy import stats
import json


if __name__ == "__main__":
    with open("..\\storage\\pointsOnMap.json", mode='r', encoding='utf8') as f_data:
        data = json.load(f_data)
        X = np.array([[
            d["x"], d["y"]
        ] for d in data])
        kde = stats.gaussian_kde(X.T)
        with open("..\\storage\\rectsOnMap.json", mode='r', encoding='utf8') as f_centers:
            centers = json.load(f_centers)
            kde_map = [kde([c["cx"], c["cy"]])[0] for c in centers]
            with open("..\\storage\\kdeOnMap.json", mode='w', encoding='utf8') as f_out:
                json.dump(kde_map, f_out)
                pass
    
    pass


