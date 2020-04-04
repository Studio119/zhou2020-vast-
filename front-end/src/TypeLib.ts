/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:41:22 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-04 15:15:41
 */

export type LISAtype = "HH" | "LH" | "LL" | "HL";


export type DataItem = {
    type: LISAtype;
    lat: number;
    lng: number;
    value: number;
    mx: number;
    my: number;
    neighbors: Array<number>;
    target?: {
        type: LISAtype;
        mx: number;
        my: number;
    }
};

export namespace FileData {
    export type Origin = Array<DataItem>;

    export type Mode = Array<{
        id: number;
        type: LISAtype;
        lat: number;
        lng: number;
        value: number;
        mx: number;
        my: number;
        neighbors: Array<number>;
    }>;

    export type Sampled = {
        [id: number]: Array<number>;
    };
};
