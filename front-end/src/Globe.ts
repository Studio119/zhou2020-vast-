/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 15:08:14 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-05 19:30:54
 */

import { DataItem } from "./TypeLib";

interface SystemType {
    maxValue: number;
    data: Array<DataItem>;
    active: Array<boolean>;
    picked: Array<number>;
};

export const System: SystemType = {
    maxValue: 1,
    data: [],
    active: [],
    picked: []
};
