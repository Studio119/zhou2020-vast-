/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 15:08:14 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-25 22:25:39
 */

import { DataItem, LISAtype } from "./TypeLib";
import Color from "./preference/Color";

interface SystemType {
    filepath: string | null;
    tail: "_o" | "_ob" | "_r" | "_b" | "_z" | "";
    maxValue: number;
    data: Array<DataItem>;
    active: Array<boolean>;
    type: "dataset" | "sample";
    colorF: (value: LISAtype) => [string, string];
    colorP: (value: number) => string;
    highlight: (value: LISAtype | "none", value2?: LISAtype) => void;
    initialize: () => void;
    update: () => void;
    setPointFilter: (b: boolean) => void;
    send: () => void;
    params: {
        radius: number;
        alpha: number;
        rate: number;
        iter: number;
    };
};

const colorD: {[type: string]: [string, string]} = {
    "HH": [Color.setLightness(Color.Nippon.Ikkonzome, 0.42), "rgb(48,11,2)"],
    "LH": [Color.setLightness(Color.Nippon.Yamabuki, 0.42), "rgb(11,39,30)"],
    "LL": [Color.setLightness(Color.Nippon.Tokiwa, 0.42), "rgb(7,26,43)"],
    "HL": [Color.setLightness("rgb(225,219,10)", 0.42), "rgb(34,16,33)"]
};

export const System: SystemType = {
    filepath: null,
    maxValue: 1,
    tail: "",
    data: [],
    send: () => {},
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
    update: () => {},
    setPointFilter: () => {},
    params: {
        radius: 0.4,
        alpha: 0.6,
        rate: 0.1,
        iter: 1
    }
};
