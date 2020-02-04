/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:41:22 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-02 17:27:53
 */

export namespace Snapshot {
    export interface TreeNode {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

export interface TreeNode {
    id: number;
    value: number;
    level: number;
    parent: TreeNode | null;
    children: Array<TreeNode>;
    leaves?: number;
    containning?: Array<number>;
};
