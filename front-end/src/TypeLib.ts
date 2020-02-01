/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:41:22 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-16 22:49:05
 */

export interface CordDict {
    [code: string]: [[number, number]]
};

export interface Proxy {
    getCordinateByCode: (code: string) => [number, number];
};
