/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:41:22 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-11 21:22:11
 */

export type LISAtype = "NS" | "HH" | "LH" | "LL" | "HL";

export namespace Snapshot {
    export type TreeNode = {
        x: number;
        y: number;
        width: number;
        height: number;
        node: _treenode;
        value: number;
        accuracy?: number;
    };
};

export type DataItem = {
    type: LISAtype;
    lat: number;
    lng: number;
    value: number;
    mx: number;
    my: number;
    neighbors: Array<number>;
};

export namespace FileData {
    export type Origin = Array<DataItem>;

    export type Tree = {
        id: number;
        children: Array<Tree>;
        parent: Tree | null;
        containedpoint: Array<number>;
    };

    export type Sampled = {
        [id: number]: Array<number>;
    };

    // export type Poisson = {
    //     id: number;
    //     lat: number;
    //     lng: number;
    //     value: number;
    //     type: LISAtype;
    //     r: number;
    //     pointsInDisk: Array<{
    //         id: number;
    //         lat: number;
    //         lng: number;
    //         value: number;
    //         type: LISAtype;
    //     }>;
    // };
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
