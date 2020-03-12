#!/usr/bin/env python3

class KD_tree:

    def __init__(self, root):
        self.root = KD_tree._build_tree(root)
        return


    @staticmethod
    def _build_tree(root):
        while KD_tree._devide_tree(root, True):
            pass
        return root

        
    @staticmethod
    def _devide_tree(node, should_node_split):
        if len(node["n_leaves"]):
            lc = node["left_child"]
            rc = node["right_child"]
            did_split_l = KD_tree._devide_tree(lc, should_node_split & alpha(lc) - alpha(rc) < lbd)
            did_split_r = KD_tree._devide_tree(rc, should_node_split & alpha(rc) - alpha(lc) < lbd)
            node["n_leaves"] = lc["n_leaves"] + rc["n_leaves"]
            return did_split_l | did_split_r
        elif (should_node_split or beta(node) < tao) and len(node["occupied"]) > 0:
            lc, lr = split_node(node, D)
            node["left_child"] = lc
            node["right_child"] = rc
            return True
        return False



if __name__ == "__main__":
    print("?")
    pass
