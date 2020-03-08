/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 15:08:14 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-05 19:30:54
 */

import { DataItem, LISAtype } from "./TypeLib";

interface SystemType {
    maxValue: number;
    data: Array<DataItem>;
    active: Array<boolean>;
    picked: Array<number>;
    colorF: (value: LISAtype) => string;
    colorP: (value: number) => string;
};

const colorD = {
    "NS": "#B2B2B2",
    "HH": "#000000",
    "HL": "#F3BD00",
    "LL": "#509DC2",
    "LH": "#E70000"
};

export const System: SystemType = {
    maxValue: 1,
    data: [],
    active: [],
    picked: [],
    colorF: (value: LISAtype): string => {
        // return [
        //     "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6"
        // ][Math.floor(value * (9 - 1e-12))];
        return colorD[value]; 
    },
    colorP: (value: number): string => {
        return [
            "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6"
        ][Math.floor(value * (9 - 1e-12))];
    }
};
