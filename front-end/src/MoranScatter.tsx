/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-11 21:17:33 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-12 16:54:17
 */

import React, { Component } from "react";
import $ from "jquery";
import { LISAtype, DataItem } from "./TypeLib";
import { System } from "./Globe";
import Color, { ColorThemes } from "./preference/Color";
import { Container } from "./prototypes/Container";
import axios, { AxiosResponse } from "axios";
import { CommandResult, CommandError } from "./Command";
import { SyncButton } from "./prototypes/SyncButton";
import ValueBar from "./tools/ValueBar";


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
        target?: {
            type: LISAtype;
            mx: number;
            my: number;
        };
    }>;
    strech: boolean;
    nSpan: number;
};

export class MoranScatter extends Component<MoranScatterProps, MoranScatterState, null> {
    private canvas1: null | HTMLCanvasElement;
    private ctx1: null | CanvasRenderingContext2D;
    private canvas2: null | HTMLCanvasElement;
    private ctx2: null | CanvasRenderingContext2D;
    private width: number;
    private timers: Array<NodeJS.Timeout>;
    private snapshots: {
        x: [number, number];
        y: [number, number];
        fx: (d: number) => number;
        fy: (d: number) => number;
        kX: Array<{
            floor: number;
            ceil: number;
            f: (d: number) => number;
        }>;
        kY: Array<{
            floor: number;
            ceil: number;
            f: (d: number) => number;
        }>;
    };
    private tickDone: number;

    public constructor(props: MoranScatterProps) {
        super(props);
        this.state = {
            list: [],
            strech: false,
            nSpan: 32
        };
        this.canvas1 = null;
        this.canvas2 = null;
        this.ctx1 = null;
        this.ctx2 = null;
        this.width = 0;
        this.timers = [];
        this.snapshots = {
            x: [NaN, NaN],
            y: [NaN, NaN],
            fx: () => NaN,
            fy: () => NaN,
            kX: [],
            kY: []
        };
        this.tickDone = 0;
    }

    public componentWillUnmount(): void {
        this.process();
    }

    public render(): JSX.Element {
        if (System.type === "dataset" || this.state.list.length) {
            const xAll: Array<number> = this.state.list.filter(
                (item: {
                    target?: {};
                }) => System.type === "dataset" || item.target
            ).map(
                (item: {
                    type: LISAtype;
                    mx: number;
                    my: number;
                    target?: {
                        type: LISAtype;
                        mx: number;
                        my: number;
                    };
                }) => item.target ? item.target.mx : item.mx
            );
            let xMin: number = xAll.length ? Math.min(...xAll) : -1;
            let xMax: number = xAll.length ? Math.max(...xAll) : 1;
            
            const yAll: Array<number> = this.state.list.filter(
                (item: {
                    target?: {};
                }) => System.type === "dataset" || item.target
            ).map(
                (item: {
                    type: LISAtype;
                    mx: number;
                    my: number;
                    target?: {
                        type: LISAtype;
                        mx: number;
                        my: number;
                    };
                }) => item.target ? item.target.my : item.my
            );
            let yMin: number = yAll.length ? Math.min(...yAll) : -1;
            let yMax: number = yAll.length ? Math.max(...yAll) : 1;

            if (this.state.strech) {
                [xMin, xMax] = [xMin - 1, xMax + 1];
                [yMin, yMax] = [yMin - 1, yMax + 1];
            } else {
                [xMin, xMax] = [Math.min(xMin, - xMax), Math.max(xMax, - xMin)];
                [yMin, yMax] = [Math.min(yMin, - yMax), Math.max(yMax, - yMin)];
            }
    
            this.snapshots.x = [xMin - (xMax - xMin) / 10, xMax + (xMax - xMin) / 10];
            this.snapshots.y = [yMin - (yMax - yMin) / 10, yMax + (yMax - yMin) / 10];

            let spansX: Array<number> = [];
            let spansY: Array<number> = [];

            if (this.state.strech && this.state.list.length >= this.state.nSpan) {
                this.snapshots.kX = [];
                this.snapshots.kY = [];
                for (let i: number = 0; i < this.state.nSpan; i++) {
                    spansX.push(0);
                    this.snapshots.kX.push({
                        floor: xMin + (xMax - xMin) * 0.99999 / this.state.nSpan * i,
                        ceil: xMin + (xMax - xMin) * 0.99999 / this.state.nSpan * (i + 1),
                        f: () => NaN
                    });
                    spansY.push(0);
                    this.snapshots.kY.push({
                        floor: yMin + (yMax - yMin) * 0.99999 / this.state.nSpan * i,
                        ceil: yMin + (yMax - yMin) * 0.99999 / this.state.nSpan * (i + 1),
                        f: () => NaN
                    });
                }
                let xOffset: number = 0;
                let yOffset: number = 0;
                this.state.list.forEach((d: {
                    mx: number;
                    my: number;
                }) => {
                    spansX[Math.floor((d.mx - xMin) / (xMax - xMin) * this.state.nSpan * 0.99999)] ++;
                    spansY[Math.floor((d.my - yMin) / (yMax - yMin) * this.state.nSpan * 0.99999)] ++;
                });
                let xS: number = 0;
                let yS: number = 0;
                for (let i: number = 0; i < this.state.nSpan; i++) {
                    spansX[i] = Math.sqrt(spansX[i]);
                    xS += spansX[i];
                    spansY[i] = Math.sqrt(spansY[i]);
                    yS += spansY[i];
                }
                for (let i: number = 0; i < this.state.nSpan; i++) {
                    let dx: number = 0.7 * spansX[i] / xS + 0.3 / this.state.nSpan;
                    const tx: number = xOffset;
                    this.snapshots.kX[i].f = (d: number) => {
                        return tx
                            + dx * (d - this.snapshots.kX[i].floor)
                                / (this.snapshots.kX[i].ceil - this.snapshots.kX[i].floor);
                    };
                    xOffset += dx;
                    let dy: number = 0.7 * spansY[i] / yS + 0.3 / this.state.nSpan;
                    const ty: number = yOffset;
                    this.snapshots.kY[i].f = (d: number) => {
                        return ty
                            + dy * (d - this.snapshots.kY[i].floor)
                                / (this.snapshots.kY[i].ceil - this.snapshots.kY[i].floor);
                    };
                    yOffset += dy;
                }
            }

            this.snapshots.fx = (d: number) => {
                if (!this.state.strech || this.state.list.length < 10) {
                    return this.props.padding + (
                        100 - this.props.padding * 2
                    ) * (d - this.snapshots.x[0]) / (this.snapshots.x[1] - this.snapshots.x[0]);
                } else {
                    let i: number = 0;
                    while (d > this.snapshots.kX[i].ceil && i + 1 < this.state.nSpan) {
                        i++;
                    }
                    return this.props.padding + (
                        100 - this.props.padding * 2
                    ) * this.snapshots.kX[i].f(d);
                }
            };
            
            this.snapshots.fy = (d: number) => {
                if (!this.state.strech || this.state.list.length < 10) {
                    return this.props.padding + (
                        100 - this.props.padding * 2
                    ) * (this.snapshots.y[1] - d) / (this.snapshots.y[1] - this.snapshots.y[0]);
                } else {
                    let i: number = 0;
                    while (d > this.snapshots.kY[i].ceil && i + 1 < this.state.nSpan) {
                        i++;
                    }
                    return this.props.padding + (
                        100 - this.props.padding * 2
                    ) * (1 - this.snapshots.kY[i].f(d));
                }
            };
        }
        
        let xTicks: Array<number> = [];

        if (this.snapshots.x[0] > -1) {
            xTicks.push(this.snapshots.x[0]);
        }
        for (
            let i: number = Math.floor(this.snapshots.x[0]);
            i <= Math.ceil(this.snapshots.x[1]);
            i++
        ) {
            if (i !== 0) {
                xTicks.push(i);
            }
        }
        if (this.snapshots.x[1] < 1) {
            xTicks.push(this.snapshots.x[1]);
        }

        let yTicks: Array<number> = [];

        if (this.snapshots.y[0] > -1) {
            yTicks.push(this.snapshots.y[0]);
        }
        for (
            let i: number = Math.floor(this.snapshots.y[0]);
            i <= Math.ceil(this.snapshots.y[1]);
            i++
        ) {
            if (i !== 0) {
                yTicks.push(i);
            }
        }
        if (this.snapshots.y[1] < 1) {
            yTicks.push(this.snapshots.y[1]);
        }

        return (
            <Container theme="NakiriAyame" title="Moran Scatter" >
                <div key="background"
                style={{
                    width: this.props.width ? this.props.width : "100%",
                    height: this.props.height,
                    backgroundColor: ColorThemes.NakiriAyame.OuterBackground,
                    marginBottom: '-4px'
                }} />
                <canvas ref="canvas1" key="canvas1" id={ this.props.id + "_canvas1" }
                width={ this.props.width ? this.props.width : "100%" }
                height={ this.props.height }
                style={{
                    position: "relative",
                    top: -1 * this.props.height,
                    width: this.props.width ? this.props.width : "100%",
                    height: this.props.height,
                    marginBottom: '-4px',
                    opacity: System.type === "dataset" ? 1 : 0.25
                }} />
                <canvas ref="canvas2" key="canvas2" id={ this.props.id + "_canvas2" }
                width={ this.props.width ? this.props.width : "100%" }
                height={ this.props.height }
                style={{
                    position: "relative",
                    top: -2 * this.props.height,
                    width: this.props.width ? this.props.width : "100%",
                    height: this.props.height,
                    marginBottom: '-4px',
                    opacity: System.type === "dataset" ? 0 : 1
                }} />
                <svg key="axes" style={{
                    position: "relative",
                    top: -3 * this.props.height,
                    width: this.props.width ? this.props.width : "100%",
                    height: this.props.height,
                    marginBottom: '-4px'
                }}>
                    {
                        <g key="axes">
                            { this.axis(
                                "x",
                                this.snapshots.fx,
                                this.snapshots.fy,
                                xTicks
                            ) }
                            { this.axis(
                                "y",
                                this.snapshots.fx,
                                this.snapshots.fy,
                                yTicks
                            ) }
                            <text key={ "0_text" }
                            x={ this.snapshots.fx(0) + "%" }
                            y={ this.snapshots.fy(0) + "%" }
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
                <svg key="process"
                width={ this.props.width } height="4px"
                style={{
                    position: "relative",
                    top: "-1510.6px",
                    left: 0,
                    pointerEvents: "none"
                }} >
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{
                                stopColor: Color.setLightness(
                                    ColorThemes.NakiriAyame.Green, 0.5
                                ),
                                stopOpacity: 1
                            }} />
                            <stop offset="90%" style={{
                                stopColor: Color.setLightness(
                                    ColorThemes.NakiriAyame.Green, 0.7
                                ),
                                stopOpacity: 1
                            }} />
                            <stop offset="100%" style={{
                                stopColor: Color.setLightness(
                                    ColorThemes.NakiriAyame.Green, 0.8
                                ),
                                stopOpacity: 1
                            }} />
                        </linearGradient>
                    </defs>
                    <rect ref="process"
                    x={ 0 } y={ 0 } width={ 0 } height={ 4 }
                    style={{
                        fill: 'url(#grad)'
                    }} />
                </svg>
                <div key="buttonBox"
                style={{
                    position: "relative",
                    top: "-1505px",
                    left: "8px",
                    background: ColorThemes.NakiriAyame.OuterBackground,
                    border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground,
                    borderRadius: this.state.strech ? "0 12px 10px 0" : "0",
                    width: this.state.strech ? "138px" : "35px",
                }} >
                    <SyncButton theme="NakiriAyame" text={
                        this.state.strech ? "on " : "off"
                    } executer={ this.shift.bind(this) } />
                    <ValueBar width={ 80 } height={ 16 }
                    min={ 1 } max={ 64 } defaultValue={ this.state.nSpan } step={ 1 }
                    onValueChange={
                        this.adjust.bind(this)
                    }
                    style={{
                        transform: "translateY(26%)",
                        display: this.state.strech ? "inline-block" : "none"
                    }} />
                </div>
            </Container>
        );
    }

    public getSnapshotBeforeUpdate(): null {
        this.ctx1!.clearRect(0, 0, this.width, this.props.height);
        this.ctx2!.clearRect(0, 0, this.width, this.props.height);
        this.process();
        return null;
    }

    public componentDidUpdate(): void {
        setTimeout(() => {
            this.paint(this.snapshots.fx, this.snapshots.fy);
        }, 0);
    }

    public componentDidMount(): void {
        this.canvas1 = document.getElementById(this.props.id + "_canvas1") as HTMLCanvasElement;
        this.ctx1 = this.canvas1!.getContext("2d");
        this.width = $(this.canvas1).width()!;
        this.canvas2 = document.getElementById(this.props.id + "_canvas2") as HTMLCanvasElement;
        this.ctx2 = this.canvas2!.getContext("2d");

        this.ctx1!.lineWidth = 0.6;
        this.ctx2!.lineWidth = 0.4;
    }

    private process(): void {
        $(this.refs["process"]).attr("width", 0);
        this.tickDone = 0;
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers = [];
    }

    private makeStep(): void {
        this.tickDone += 1;
        if (this.tickDone >= this.timers.length) {
            this.process();
        } else {
            $(this.refs["process"]).attr(
                "width",
                100 * this.tickDone / this.timers.length + "%"
            );
        }
    }

    private shift(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
        this.setState({
            strech: !this.state.strech
        });
        resolve();
    }

    private adjust(value: number): void {
        const v: number = Math.floor(value);
        if (v !== this.state.nSpan) {
            this.setState({
                nSpan: v
            });
        }
    }

    private tick(
        list: Array<{
            color: [string, string];
            x: number;
            y: number;
        }>
    ): void {
        list.forEach((item: {
            color: [string, string]; x: number; y: number;
        }) => {
            this.ctx1!.strokeStyle = item.color[1];
            this.ctx1!.fillStyle = item.color[0];

            this.ctx1!.beginPath();
            this.ctx1!.arc(item.x, item.y, this.state.strech ? 1.2 : 3, 0, 2 * Math.PI);
            this.ctx1!.stroke();
            this.ctx1!.fill();
        });
    }

    private link(
        list: Array<{
            color: [string, string];
            x: number;
            y: number;
            prevX: number;
            prevY: number;
        }>
    ): void {
        list.forEach((item: {
            color: [string, string]; x: number; y: number; prevX: number; prevY: number;
        }) => {
            this.ctx2!.strokeStyle = item.color[1];
            this.ctx2!.fillStyle = item.color[0];
            
            this.ctx2!.beginPath();
            this.ctx2!.arc(item.prevX, item.prevY, this.state.strech ? 0.8 : 2, 0, 2 * Math.PI);
            this.ctx2!.stroke();

            this.ctx2!.globalAlpha = 0.1;
            this.ctx2!.strokeStyle = 'rgb(0,162,60)';
            let x: number = item.prevX;
            let y: number = item.prevY;
            const len: number = Math.sqrt(
                Math.pow(item.x - item.prevX, 2)
                + Math.pow(item.y - item.prevY, 2)
            );
            const step: number = 2;
            const xStep: number = (item.x - item.prevX) / len * step;
            const yStep: number = (item.y - item.prevY) / len * step;
            
            while (
                (xStep > 0 && x < item.x)
                || (yStep > 0 && y < item.y)
                || (xStep <= 0 && x > item.x)
                || (yStep <=0 && y > item.y)
            ) {
                this.ctx2!.moveTo(x, y);
                x += xStep;
                y += yStep;
                this.ctx2!.lineTo(x, y);
                this.ctx2!.stroke();
                x += xStep;
                y += yStep;
            }

            this.ctx2!.globalAlpha = 1;
            this.ctx2!.strokeStyle = item.color[1];

            this.ctx2!.beginPath();
            this.ctx2!.arc(item.x, item.y, 3, 0, 2 * Math.PI);
            this.ctx2!.stroke();
            this.ctx2!.fill();
        });
    }

    private paint(fx: (d: number) => number, fy: (d: number) => number): void {
        let ready: Array<Array<{
            color: [string, string]; x: number; y: number;
        }>> = [];

        let ready2: Array<Array<{
            color: [string, string]; x: number; y: number; prevX: number; prevY: number;
        }>> = [];

        let nParts = Math.floor(Math.pow((this.state.list.length - 400) / 100, 0.8));
        if (!nParts || nParts < 1) {
            nParts = 1;
        }

        for (let i: number = 0; i < nParts; i++) {
            ready.push([]);
            ready2.push([]);
        }

        this.state.list.forEach((item: {
            type: LISAtype;
            mx: number;
            my: number;
            target?: {
                type: LISAtype;
                mx: number;
                my: number;
            };
        }, index: number) => {
            const color: [string, string] = System.colorF(item.type);

            if (System.type === "dataset") {
                ready[index % nParts].push({
                    color: color,
                    x: fx(item.mx) / 100 * this.width,
                    y: fy(item.my) / 100 * this.props.height
                });
            } else if (item.target) {
                if (item.type === item.target.type) {
                    ready[index % nParts].push({
                        color: color,
                        x: fx(item.target.mx) / 100 * this.width,
                        y: fy(item.target.my) / 100 * this.props.height
                    });
                } else {
                    ready2[index % nParts].push({
                        color: System.colorF(item.target!.type),
                        x: fx(item.target.mx) / 100 * this.width,
                        y: fy(item.target.my) / 100 * this.props.height,
                        prevX: fx(item.mx) / 100 * this.width,
                        prevY: fy(item.my) / 100 * this.props.height
                    });
                }
            }
        });

        ready.forEach((li: Array<{
            color: [string, string]; x: number; y: number;
        }>, index: number) => {
            this.timers.push(setTimeout(() => {
                this.tick(li);
                this.makeStep();
            }, (index + 1) * 5));
        });

        ready2.forEach((li: Array<{
            color: [string, string]; x: number; y: number; prevX: number; prevY: number;
        }>, index: number) => {
            this.timers.push(setTimeout(() => {
                this.link(li);
                this.makeStep();
            }, (index + 1) * 5));
        });
    }

    public async run(send: (s: boolean) => void): Promise<boolean> {
        this.setState({
            list: []
        });

        const items: Array<number> = System.data.map((_: DataItem, i: number) => {
            return i;
        }).filter((i: number) => {
            return System.active[i];
        });

        return await new Promise<boolean>((resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void) => {
            const p: Promise<AxiosResponse<CommandResult<string|CommandError>>> = axios.post(
                `/take`, {
                    dataset: System.filepath,
                    list: items
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    }
                }
            );
            p.then((value: AxiosResponse<CommandResult<string|CommandError>>) => {
                if (value.data.state === "successed") {
                    resolve(true);
                    send(true);
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

    public async apply(send: (s: boolean) => void): Promise<boolean> {
        const items: Array<number> = System.data.map((_: DataItem, i: number) => {
            return i;
        }).filter((i: number) => {
            return System.active[i];
        });

        return await new Promise<boolean>((resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void) => {
            const p: Promise<AxiosResponse<CommandResult<string|CommandError>>> = axios.post(
                `/get`, {
                    dataset: System.filepath,
                    list: items
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    }
                }
            );
            p.then((value: AxiosResponse<CommandResult<string|CommandError>>) => {
                if (value.data.state === "successed") {
                    resolve(true);
                    send(true);
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
                            const x: number = fx(t);
                            if (x < this.props.padding || x > 100 - this.props.padding) {
                                return null;
                            }
                            return (
                                <g key={ type + "_tick_" + i } >
                                    <text key={ type + "_" + i + "_text" }
                                    x={ x + "%" } y={ fy(0) + "%" }
                                    textAnchor="middle"
                                    style={{
                                        fontSize: 13,
                                        transform: `translateY(15px)`,
                                        fontWeight: 'bold'
                                    }} >
                                        { t }
                                    </text>
                                    <line key={ type + "_" + i + "_line" }
                                    x1={ x + "%" } x2={ x + "%" }
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
                            const y: number = fy(t);
                            if (y < this.props.padding || y > 100 - this.props.padding) {
                                return null;
                            }
                            return (
                                <g key={ type + "_tick_" + i } >
                                    <text key={ type + "_" + i + "_text" }
                                    x={ fx(0) + "%" } y={ y + "%" }
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
                                    y1={ y + "%" } y2={ y + "%" }
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
        this.setState({
            list: data
        });
    }
}
