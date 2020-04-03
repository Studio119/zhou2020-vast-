/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 15:08:14 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-30 01:51:47
 */

import { DataItem, LISAtype } from "./TypeLib";

interface SystemType {
    filepath: string | null;
    maxValue: number;
    data: Array<DataItem>;
    active: Array<boolean>;
    type: "dataset" | "sample";
    colorF: (value: LISAtype) => [string, string];
    colorP: (value: number) => string;
    highlight: (value: LISAtype | "none") => void;
    initialize: () => void;
    update: () => void;
};

const colorD: {[type: string]: [string, string]} = {
    "NS": ["#B2B2B2", "#000000"],
    "HH": ["#000000", "rgb(226,226,226)"],
    "HL": ["#F3BD00", "rgb(35,24,27)"],
    "LL": ["#509DC2", "rgb(34,34,34)"],
    "LH": ["#E70000", "rgb(45,31,30)"]
};

export const System: SystemType = {
    filepath: null,
    maxValue: 1,
    data: [],
    type: "dataset",
    active: [],
    colorF: (value: LISAtype): [string, string] => {
        return colorD[value]; 
    },
    colorP: (value: number): string => {
        return [
            "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6"
        ][Math.floor(value * (9 - 1e-12))];
    },
    highlight: () => {},
    initialize: () => {},
    update: () => {}
};
