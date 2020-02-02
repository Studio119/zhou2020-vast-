/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:41:22 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-02 17:27:53
 */

export interface TreeNode {
    id: number;
    value: number;
    level: number;
    parent: TreeNode | null;
    children: Array<TreeNode>;
    containning?: Array<number>;
};
