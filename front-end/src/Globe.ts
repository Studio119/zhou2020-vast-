/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 15:08:14 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-13 22:20:46
 */

import { DataItem, LISAtype } from "./TypeLib";
import TaskQueue from "./tools/TaskQueue";

interface SystemType {
    maxValue: number;
    data: Array<DataItem>;
    active: Array<boolean>;
    picked: Array<number>;
    colorF: (value: LISAtype) => [string, string];
    colorP: (value: number) => string;
    task?: TaskQueue<null>;
    highlight: (value: LISAtype | "none") => void;
    initialize: () => void;
    update: () => void;
};

const colorD: {[type: string]: [string, string]} = {
    "NS": ["#B2B2B2", "#000000"],
    "HH": ["#000000", "rgb(226,226,226)"],
    "HL": ["#F3BD00", "rgb(185,64,45)"],
    "LL": ["#509DC2", "rgb(34,34,34)"],
    "LH": ["#E70000", "rgb(217,201,198)"]
};

export const System: SystemType = {
    maxValue: 1,
    data: [],
    active: [],
    picked: [],
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
