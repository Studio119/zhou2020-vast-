/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:41:22 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-05 19:22:21
 */

export namespace Snapshot {
    export type TreeNode = {
        x: number;
        y: number;
        width: number;
        height: number;
        node: _treenode;
        value: number;
    };
};

export namespace FileData {
    export type Origin = Array<{
        lat: number;
        lng: number;
        value: number;
    }>;

    export type Tree = {
        id: number;
        children: Array<Tree>;
        parent: Tree | null;
        containedpoint: Array<number>;
    };

    export type Sampled = {
        [id: number]: Array<number>;
    };
};

export type DataItem = {
    lat: number;
    lng: number;
    label: number;
    value: number;
};

export type TreeNode = {
    id: number;
    value: number;
    level: number;
    parent: TreeNode | null;
    children: Array<TreeNode>;
    leaves: number;
    containning?: Array<number>;
};

type _treenode = TreeNode;
