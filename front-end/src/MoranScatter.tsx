/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-11 21:17:33 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-14 22:57:49
 */

import React, { Component } from "react";
import $ from "jquery";
import { LISAtype, DataItem, FileData } from "./TypeLib";
import { System } from "./Globe";
import Color, { ColorThemes } from "./preference/Color";
import { Container } from "./prototypes/Container";
import axios, { AxiosResponse } from "axios";
import { CommandResult, CommandError } from "./Command";


export interface MoranScatterProps {
    width?: number;
    height: number;
    padding: number;
    id: number | string;
};

export interface MoranScatterState {
    list: Array<{
        type: LISAtype;
        mx: number;
        my: number;
    }>;
};

export class MoranScatter extends Component<MoranScatterProps, MoranScatterState> {
    private canvas: null | HTMLCanvasElement;
    private ctx: null | CanvasRenderingContext2D;
    private width: number;
    private timers: Array<NodeJS.Timeout>;

    public constructor(props: MoranScatterProps) {
        super(props);
        this.state = {
            list: []
        };
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.timers = [];
    }

    public componentWillUnmount(): void {
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
    }

    public render(): JSX.Element {
        const xAll: Array<number> = this.state.list.map(
            (item: { type: LISAtype; mx: number; my: number; }) => item.mx
        );
        // let xMin: number = Math.min(xAll.length ? Math.min(...xAll) : -1, -1);
        // let xMax: number = Math.max(xAll.length ? Math.max(...xAll) : 1, 1);
        let xMin: number = xAll.length ? Math.min(...xAll) : -1;
        let xMax: number = xAll.length ? Math.max(...xAll) : 1;
        
        const yAll: Array<number> = this.state.list.map(
            (item: { type: LISAtype; mx: number; my: number; }) => item.my
        );
        // let yMin: number = Math.min(yAll.length ? Math.min(...yAll) : -1, -1);
        // let yMax: number = Math.max(yAll.length ? Math.max(...yAll) : 1, 1);
        let yMin: number = yAll.length ? Math.min(...yAll) : -1;
        let yMax: number = yAll.length ? Math.max(...yAll) : 1;

        let xTicks: Array<number> = [];

        if (xMin > -1) {
            xTicks.push(xMin);
        }
        for (let i: number = Math.floor(xMin); i <= Math.ceil(xMax); i++) {
            if (i !== 0) {
                xTicks.push(i);
            }
        }
        if (xMax < 1) {
            xTicks.push(xMax);
        }

        let yTicks: Array<number> = [];

        if (yMin > -1) {
            yTicks.push(yMin);
        }
        for (let i: number = Math.floor(yMin); i <= Math.ceil(yMax); i++) {
            if (i !== 0) {
                yTicks.push(i);
            }
        }
        if (yMax < 1) {
            yTicks.push(yMax);
        }

        [xMin, xMax] = [xMin - (xMax - xMin) / 10, xMax + (xMax - xMin) / 10];
        [yMin, yMax] = [yMin - (yMax - yMin) / 10, yMax + (yMax - yMin) / 10];

        const fx: (d: number) => number = (d: number) => {
            return this.props.padding + (
                100 - this.props.padding * 2
            ) * (d - xMin) / (xMax - xMin);
        };
        
        const fy: (d: number) => number = (d: number) => {
            return this.props.padding + (
                100 - this.props.padding * 2
            ) * (yMax - d) / (yMax - yMin);
        };

        setTimeout(() => {
            this.paint(fx, fy);
        });

        return (
            <Container theme="NakiriAyame" title="MORAN SCATTER" >
                <canvas ref="canvas" key="canvas" id={ this.props.id + "_canvas" }
                width={ this.props.width ? this.props.width : "100%" }
                height={ this.props.height }
                style={{
                    width: this.props.width ? this.props.width : "100%",
                    height: this.props.height,
                    backgroundColor: ColorThemes.NakiriAyame.OuterBackground,
                    marginBottom: '-4px'
                }} />
                <svg style={{
                    position: "relative",
                    top: -1 * this.props.height,
                    width: this.props.width ? this.props.width : "100%",
                    height: this.props.height,
                    marginBottom: '-4px'
                }}>
                    {
                        <g key="axes">
                            { this.axis("x", fx, fy, xTicks) }
                            { this.axis("y", fx, fy, yTicks) }
                            <text key={ "0_text" }
                            x={ fx(0) + "%" } y={ fy(0) + "%" }
                            textAnchor="middle"
                            style={{
                                fontSize: 15,
                                transform: `translate(-13px, 17px)`,
                                fontStyle: 'italic',
                                fontWeight: 'bold'
                            }} >
                                { 0 }
                            </text>
                        </g>
                    }
                </svg>
            </Container>
        );
    }

    public componentDidUpdate(): void {
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
    }

    public componentDidMount(): void {
        this.canvas = document.getElementById(this.props.id + "_canvas") as HTMLCanvasElement;
        this.ctx = this.canvas!.getContext("2d");
        this.width = $(this.canvas).width()!;
    }

    private tick(list: Array<{color: string; x: number; y: number;}>): void {
        list.forEach((item: {
            color: string; x: number; y: number;
        }) => {
            this.ctx!.strokeStyle = Color.setLightness(item.color, 0.3);
            this.ctx!.fillStyle = item.color;

            this.ctx!.beginPath();
            this.ctx!.arc(item.x, item.y, 3, 0, 2 * Math.PI);
            this.ctx!.stroke();
            this.ctx!.fill();
        });
    }

    private paint(fx: (d: number) => number, fy: (d: number) => number): void {
        let ready: Array<Array<{
            color: string; x: number; y: number;
        }>> = [];

        let nParts = Math.floor(Math.pow((this.state.list.length - 400) / 100, 0.8));
        if (!nParts || nParts < 1) {
            nParts = 1;
        }

        for (let i: number = 0; i < nParts; i++) {
            ready.push([]);
        }

        this.state.list.forEach((item: {
            type: LISAtype; mx: number; my: number;
        }, index: number) => {
            const color: string = System.colorF(item.type);

            ready[index % nParts].push({
                color: color,
                x: fx(item.mx) / 100 * this.width,
                y: fy(item.my) / 100 * this.props.height
            });
        });

        ready.forEach((li: Array<{
            color: string; x: number; y: number;
        }>, index: number) => {
            this.timers.push(setTimeout(() => {
                this.tick(li);
            }, (index + 1) * 5));
        });
    }

    public async run(send: (s: boolean) => void): Promise<boolean> {
        this.setState({
            list: []
        });

        const items: Array<number> = System.data.map((d: DataItem, i: number) => {
            return i;
        }).filter((i: number) => {
            return System.active[i];
        });

        const cmdWrite: string = "cd public/python & python write.py ["
            + items.join(",") + "] & cd ../..";

        const cmd: string = "cd public/python & conda activate base & python Z_score.py temp_input temp_output & cd ../..";

        return await new Promise<boolean>((resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void) => {
            const strWrite: string = cmdWrite.split("/").join("_sep")
                                            .split(" ").join("_blc")
                                            .split(".").join("_dot");
            const p: Promise<AxiosResponse<CommandResult<string|CommandError>>> = axios.get(
                `/command/${ strWrite }`, {
                    headers: 'Content-type:text/html;charset=utf-8'
                }
            );
            p.then((value: AxiosResponse<CommandResult<string|CommandError>>) => {
                if (value.data.state === "successed") {
                    new Promise<boolean>((__resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void) => {
                        const str: string = cmd.split("/").join("_sep")
                                                .split(" ").join("_blc")
                                                .split(".").join("_dot");
                        const p: Promise<AxiosResponse<CommandResult<FileData.Origin|CommandError>>> = axios.get(
                            `/command/${ str }`, {
                                headers: 'Content-type:text/html;charset=utf-8'
                            }
                        );
                        p.then((value: AxiosResponse<CommandResult<FileData.Origin|CommandError>>) => {
                            if (value.data.state === "successed") {
                                try {
                                    const res: Array<{
                                        type: LISAtype;
                                        mx: number;
                                        my: number;
                                    }> = (value.data.value as FileData.Origin).map((d: DataItem) => {
                                        return {
                                            type: d.type,
                                            mx: d.mx,
                                            my: d.my
                                        };
                                    });
                                    this.setState({
                                        list: res
                                    });
                                    __resolve(true);
                                    resolve(true);
                                    send(true);
                                } catch (err) {
                                    __resolve(false);
                                    resolve(false);
                                    console.error("Error occured when fetching/parsing temp_output");
                                }
                            } else {
                                __resolve(false);
                                resolve(false);
                                send(false);
                                if (typeof(value.data.value) === "string") {
                                    console.error(decodeURI(value.data.value));
                                } else {
                                    console.error(`Command failed with code ${
                                        (value.data.value as CommandError).code
                                    }`);
                                }
                            }
                        }).catch((reason: any) => {
                            console.warn(reason);
                            __resolve(false);
                            resolve(false);
                            send(false);
                        });
                    });
                } else {
                    resolve(false);
                    send(false);
                    if (typeof(value.data.value) === "string") {
                        console.error(decodeURI(value.data.value));
                    } else {
                        console.error(`Command failed with code ${
                            (value.data.value as CommandError).code
                        }`);
                    }
                }
            }).catch((reason: any) => {
                console.warn(reason);
                resolve(false);
                send(false);
            });
        });
    }

    private axis(type: "x" | "y",
    fx: (d: number) => number, fy: (d: number) => number, ticks: Array<number>): JSX.Element {
        if (type === "x") {
            return (
                <g key={ type }>
                    <line key={ type }
                    x1={ this.props.padding + "%" } x2={ 100 - this.props.padding + "%" }
                    y1={ fy(0) + "%" } y2={ fy(0) + "%" }
                    style={{
                        stroke: ColorThemes.NakiriAyame.InnerBackground,
                        strokeWidth: 2
                    }} />
                    {
                        ticks.map((t: number, i: number) => {
                            return (
                                <g key={ type + "_tick_" + i } >
                                    <text key={ type + "_" + i + "_text" }
                                    x={ fx(t) + "%" } y={ fy(0) + "%" }
                                    textAnchor="middle"
                                    style={{
                                        fontSize: 13,
                                        transform: `translateY(15px)`,
                                        fontWeight: 'bold'
                                    }} >
                                        { t }
                                    </text>
                                    <line key={ type + "_" + i + "_line" }
                                    x1={ fx(t) + "%" } x2={ fx(t) + "%" }
                                    y1={ fy(0) + "%" } y2={ (fy(0) - 5.4 / this.props.height * 100) + "%" }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.InnerBackground
                                    }} />
                                </g>
                            );
                        })
                    }
                </g>
            );
        } else {
            return (
                <g key={ type }>
                    <line key={ type }
                    x1={ fx(0) + "%" } x2={ fx(0) + "%" }
                    y1={ this.props.padding + "%" } y2={ 100 - this.props.padding + "%" }
                    style={{
                        stroke: ColorThemes.NakiriAyame.InnerBackground,
                        strokeWidth: 2
                    }} />
                    {
                        ticks.map((t: number, i: number) => {
                            return (
                                <g key={ type + "_tick_" + i } >
                                    <text key={ type + "_" + i + "_text" }
                                    x={ fx(0) + "%" } y={ fy(t) + "%" }
                                    textAnchor="end"
                                    style={{
                                        fontSize: 13,
                                        transform: `translate(-8px, 5px)`,
                                        fontWeight: 'bold'
                                    }} >
                                        { t }
                                    </text>
                                    <line key={ type + "_" + i + "_line" }
                                    x1={ (fx(0) + 5.4 / this.props.height * 100) + "%" } x2={ fx(0) + "%" }
                                    y1={ fy(t) + "%" } y2={ fy(t) + "%" }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.InnerBackground
                                    }} />
                                </g>
                            );
                        })
                    }
                </g>
            );
        }
    }

    public load(data: Array<DataItem>): void {
        const items: Array<{type: LISAtype; mx: number; my: number;}> = data.map((d: DataItem) => {
            return {
                type: d.type,
                mx: d.mx,
                my: d.my
            };
        }).filter((item: {type: LISAtype; mx: number; my: number;}, index: number) => {
            return System.active[index];
        });

        this.setState({
            list: items
        });
    }
}
