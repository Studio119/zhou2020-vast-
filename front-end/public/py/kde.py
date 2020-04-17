import numpy as np
from scipy import stats
import json


if __name__ == "__main__":
    with open("..\\storage\\pointsOnMap.json", mode='r', encoding='utf8') as f_data:
        X = {
            "HH": [],
            "LH": [],
            "LL": [],
            "HL": []
        }
        for d in json.load(f_data):
            X[d["type"]].append(d)
        for l in X:
            X[l] = np.array([[
                d["x"], d["y"]
            ] for d in X[l]])
        with open("..\\storage\\rectsOnMap.json", mode='r', encoding='utf8') as f_centers:
            centersByType = {
                "HH": [],
                "LH": [],
                "LL": [],
                "HL": []
            }
            kde_map = []
            for d in json.load(f_centers):
                centersByType[d["type"]].append(d)
            for centers in centersByType:
                kde = stats.gaussian_kde(X[centers].T)
                kde_map.extend([kde([c["cx"], c["cy"]])[0] for c in centersByType[centers]])
            with open("..\\storage\\kdeOnMap.json", mode='w', encoding='utf8') as f_out:
                json.dump(kde_map, f_out)
                pass
    
    pass


