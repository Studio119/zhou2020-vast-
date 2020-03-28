/*
 * @Author: Antoine YANG 
 * @Date: 2019-09-23 18:41:23 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-16 18:45:36
 */
import React, { Component } from 'react';
import $ from 'jquery';
import MapBox from './react-mapbox/MapBox';
import Color, { ColorThemes } from './preference/Color';
import { DataItem, LISAtype, FileData } from './TypeLib';
import { System } from './Globe';


export interface MapViewProps {
    id: string;
    center: [number, number];
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    options?: any;
    width: number;
    height: number;
    scaleType: "linear" | "sqrt" | "log" | "log2" | "log10" | "quick";
    style?: React.CSSProperties;
    allowInteraction?: boolean;
    filter: boolean;
    mode: "circle" | "rect";
}

export interface MapViewState<T> {
    data: Array<{
        lng: number;
        lat: number;
        value: T;
        projection: number;
    }>;
    poissons: Array<FileData.Poisson>;
}

export interface Sketch {
    type: "line" | "circle";
    begin: [number, number];
    end: [number, number];
};


export class Map extends Component<MapViewProps, MapViewState<LISAtype>, {}> {
    private originBounds: Readonly<[[number, number], [number, number]]>
        = [[ 50.55349948549696, 22.86881607932105 ], [ -128.14621384226703, -67.85378615773539 ]];
    private bounds: [[number, number], [number, number]]
        = [[ 50.55349948549696, 22.86881607932105 ], [ -128.14621384226703, -67.85378615773539 ]];
    private mounted: boolean;
    private canvas: null | HTMLCanvasElement;
    private ctx: null | CanvasRenderingContext2D;
    private ready: Array<Array<[number, number, string]>>;
    private highlighted: Array<number>;
    private canvas2: null | HTMLCanvasElement;
    private ctx2: null | CanvasRenderingContext2D;
    private canvas_s: null | HTMLCanvasElement;
    private ctx_s: null | CanvasRenderingContext2D;
    private canvas_d: null | HTMLCanvasElement;
    private ctx_d: null | CanvasRenderingContext2D;
    private canvas_p: null | HTMLCanvasElement;
    private ctx_p: null | CanvasRenderingContext2D;
    private ready2: Array<Array<[number, number, string]>>;
    private timers: Array<NodeJS.Timeout>;
    private cloneObserver: Array<Map>;
    private recursiveLock: boolean;
    private keyboardDebounce: boolean;
    private behavior: "line" | "circle";
    private sketchers: Array<Sketch>;
    private drawing: boolean;
    private timers_p: Array<NodeJS.Timeout>;

    public constructor(props: MapViewProps) {
        super(props);
        this.mounted = false;
        this.state = { data: [], poissons: [] };
        this.canvas = null;
        this.ctx = null;
        this.timers = [];
        this.ready = [];
        this.highlighted = [];
        this.canvas2 = null;
        this.ctx2 = null;
        this.canvas_s = null;
        this.ctx_s = null;
        this.canvas_d = null;
        this.ctx_d = null;
        this.canvas_p = null;
        this.ctx_p = null;
        this.ready2 = [];
        this.cloneObserver = [];
        this.recursiveLock = false;
        this.keyboardDebounce = false;
        this.behavior = "line";
        this.sketchers = [];
        this.drawing = false;
        this.timers_p = [];
    }

    public render(): JSX.Element {
        return (
            <div id={ this.props.id } ref="container"
            style={{
                height: `${ this.props.height }px`,
                width: `${ this.props.width }px`,
                background: 'white',
                ...this.props.style
            }}
            onKeyDown={
                (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (!this.keyboardDebounce && e.which === 49) {    // Key 1
                        if ($(this.refs["cover"]).css("display") === "none") {
                            $(this.refs["detail"]).show();
                            $(this.refs["cover"]).show();
                            $(this.refs["tool-line"]).fadeIn(200);
                            this.updateSketcher();
                            this.keyboardDebounce = true;
                            this.cloneObserver.forEach((clone: Map) => {
                                $(clone.refs["detail"]).show();
                                $(clone.refs["cover"]).show();
                                $(clone.refs["tool-line"]).fadeIn(200);
                                clone.updateSketcher();
                                clone.keyboardDebounce = true;
                            });
                        }
                    }
                }
            }
            onKeyUp={
                () => {
                    this.keyboardDebounce = false;
                }
            }
            onMouseOver={
                () => {
                    $(this.refs["container"]).focus();
                }
            } >
                <div
                id={ this.props.id + ">>" }
                style={{
                    height: `${ this.props.height }px`,
                    width: `${ this.props.width }px`
                }} >
                    {
                        this.mounted
                            ? <MapBox
                                allowInteraction = {
                                    this.props.allowInteraction === void(0) || this.props.allowInteraction
                                }
                                accessToken={ "pk.eyJ1IjoiaWNoZW4tYW50b2luZSIsImEiOiJjazF5bDh5eWUwZ2tiM2NsaXQ3bnFvNGJ1In0.sFDwirFIqR4UEjFQoKB8uA" }
                                styleURL={"mapbox://styles/ichen-antoine/ck1504bas09eu1cs1op2eqsnu"}
                                containerID={ this.props.id + ">>" } center={ this.props.center } zoom={ this.props.zoom }
                                minZoom={ this.props.minZoom } maxZoom={ this.props.maxZoom } ref="map"
                                onDragEnd={ this.onDragEnd.bind(this) }
                                onZoomEnd={ this.onZoomEnd.bind(this) } />
                            : null
                    }
                </div>
                <div id="scatter"
                style={{
                    position: 'relative',
                    pointerEvents: 'none',
                    left: '0px',
                    top: '-100%'
                }} >
                    <canvas key="p" id={ this.props.id + "_poisson" } ref="poisson"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'initial',
                        pointerEvents: 'none'
                    }} />
                    <canvas key="1" id={ this.props.id + "_canvas" } ref="canvas"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none'
                    }} />
                    <canvas key="2" id={ this.props.id + "_canvas2" } ref="canvas2"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none'
                    }} />
                    <canvas key="?" id={ this.props.id + "_canvas_s" } ref="cover"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'all',
                        cursor: 'crosshair',
                        background: '#000000A0'
                    }}
                    onMouseDown={
                        (e: React.MouseEvent<HTMLCanvasElement>) => {
                            this.sketch([e.clientX, e.clientY], "begin");
                            this.drawing = true;
                        }
                    }
                    onMouseMove={
                        (e: React.MouseEvent<HTMLCanvasElement>) => {
                            if (!this.drawing) {
                                return;
                            }
                            this.sketch([e.clientX, e.clientY], "drag");
                        }
                    }
                    onMouseUp={
                        (e: React.MouseEvent<HTMLCanvasElement>) => {
                            if (!this.drawing) {
                                return;
                            }
                            this.sketch([e.clientX, e.clientY], "end");
                            this.cloneObserver.forEach((clone: Map) => {
                                clone.sketchers = this.sketchers.map((item: Sketch) => item);
                                clone.sketch([e.clientX, e.clientY], "end");
                            });
                            this.drawing = false;
                        }
                    }
                    onDoubleClick={
                        () => {
                            this.ctx_s!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
                            this.ctx_d!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
                            this.closeSketcher();
                            this.cloneObserver.forEach((clone: Map) => {
                                clone.ctx_s!.clearRect(-2, -2, clone.props.width + 4, clone.props.height + 4);
                                clone.ctx_d!.clearRect(-2, -2, clone.props.width + 4, clone.props.height + 4);
                                clone.sketchers = [];
                                clone.drawing = false;
                                $(clone.refs["detail"]).hide();
                                $(clone.refs["cover"]).hide();
                                $(clone.refs["tool-line"]).hide();
                            });
                        }
                    }
                    onMouseOut={
                        () => {
                            if (this.drawing) {
                                this.sketchers.pop();
                            }
                            this.drawing = false;
                        }
                    } />
                    <canvas key="!" id={ this.props.id + "_canvas_d" } ref="detail"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        cursor: 'crosshair',
                        background: 'none'
                    }} />
                    <svg key="tool-line" ref="tool-line"
                    style={{
                        position: 'absolute',
                        width: '80px',
                        height: '28px',
                        top: '10px',
                        left: `${ this.props.width / 2 - 40 }px`,
                        background: ColorThemes.NakiriAyame.Grey,
                        pointerEvents: 'none'
                    }} >
                        <rect key="btn-line" ref="btn-line" x={ 7 } y={ 2 } width={ 24 } height={ 24 }
                        style={{
                            fill: 'none',
                            stroke: 'black',
                            strokeWidth: 1,
                            pointerEvents: 'all'
                        }}
                        onClick={
                            () => {
                                this.setSketchType("line");
                            }
                        } />
                        <line key="line" x1={ 11 } y1={ 6 } x2={ 27 } y2={ 22 }
                        style={{
                            stroke: 'rgb(136,115,255)',
                            strokeWidth: 3
                        }} />
                        <rect key="btn-circle" ref="btn-circle" x={ 45 } y={ 2 } width={ 24 } height={ 24 }
                        style={{
                            fill: 'none',
                            stroke: 'black',
                            strokeWidth: 1,
                            pointerEvents: 'all'
                        }}
                        onClick={
                            () => {
                                this.setSketchType("circle");
                            }
                        } />
                        <circle key="circle" cx={ 57 } cy={ 14 } r={ 8 }
                        style={{
                            stroke: 'rgb(136,115,255)',
                            strokeWidth: 2.4,
                            fill: 'none'
                        }} />
                    </svg>
                </div>
            </div>
        )
    }

    public componentDidMount(): void {
        $(this.refs["detail"]).hide();
        $(this.refs["cover"]).hide();
        $(this.refs["tool-line"]).hide();
        this.mounted = true;
        this.canvas_p = document.getElementById(this.props.id + "_poisson") as HTMLCanvasElement;
        this.ctx_p = this.canvas_p!.getContext("2d");
        this.ctx_p!.strokeStyle = "#7A1B27";
        this.ctx_p!.globalAlpha = 0.4;
        this.canvas = document.getElementById(this.props.id + "_canvas") as HTMLCanvasElement;
        this.ctx = this.canvas!.getContext("2d");
        this.canvas2 = document.getElementById(this.props.id + "_canvas2") as HTMLCanvasElement;
        this.ctx2 = this.canvas2!.getContext("2d");
        this.canvas_s = document.getElementById(this.props.id + "_canvas_s") as HTMLCanvasElement;
        this.ctx_s = this.canvas_s!.getContext("2d");
        this.canvas_d = document.getElementById(this.props.id + "_canvas_d") as HTMLCanvasElement;
        this.ctx_d = this.canvas_d!.getContext("2d");
        this.forceUpdate();
        this.setSketchType("line");
    }

    public componentDidUpdate(): void {
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers = [];
        this.timers_p.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers_p = [];
        this.ready = [];
        this.ready2 = [];
        this.sketchers = [];
        this.redraw();

        System.highlight = (value: LISAtype | "none") => {
            if (value === "none") {
                this.highlighted = [];
                this.redraw();
            } else {
                this.highlight(value);
            }
        };

        // this.showPoisson();
    }

    public componentWillUnmount(): void {
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers_p.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
    }

    public closeSketcher(): void {
        this.sketchers = [];
        this.drawing = false;
        $(this.refs["detail"]).hide();
        $(this.refs["cover"]).hide();
        $(this.refs["tool-line"]).hide();
    }

    private sketch(position: [number, number], event: "begin" | "drag" | "end"): void {
        position = [
            position[0] - $(this.refs["cover"]).offset()!.left,
            position[1] - $(this.refs["cover"]).offset()!.top
        ];
        if (this.behavior === "line") {
            if (event === "begin") {
                this.sketchers.push({
                    type: "line",
                    begin: position,
                    end: position
                });
            } else if (this.sketchers.length) {
                if (event === "drag") {
                    this.sketchers[this.sketchers.length - 1].end = position;
                } else {
                    const current: Sketch = this.sketchers[this.sketchers.length - 1];
                    const dist: number = Math.pow(current.begin[0] - current.end[0], 2)
                                        + Math.pow(current.begin[1] - current.end[1], 2);
                    if (dist < 10000) {
                        this.sketchers.pop();
                    } else {
                        this.onSketched(current);
                    }
                }
            }
        } else if (this.behavior === "circle") {
            if (event === "begin") {
                this.sketchers.push({
                    type: "circle",
                    begin: position,
                    end: position
                });
            } else if (this.sketchers.length) {
                if (event === "drag") {
                    this.sketchers[this.sketchers.length - 1].end = position;
                } else {
                    const current: Sketch = this.sketchers[this.sketchers.length - 1];
                    const radius2: number = Math.pow(current.begin[0] - current.end[0], 2)
                                        + Math.pow(current.begin[1] - current.end[1], 2);
                    if (radius2 < 1000) {
                        this.sketchers.pop();
                    } else {
                        this.onSketched(current);
                    }
                }
            }
        }
    }

    private setSketchType(type: "line" | "circle"): void {
        this.behavior = type;
        this.cloneObserver.forEach((clone: Map) => {
            if (clone.behavior !== type) {
                clone.setSketchType(type);
            }
        });
        if (type === "line") {
            $(this.refs["btn-line"]).css("stroke", "red").css("stroke-width", 2);
            $(this.refs["btn-circle"]).css("stroke", "black").css("stroke-width", 1);
        } else if (type === "circle") {
            $(this.refs["btn-line"]).css("stroke", "black").css("stroke-width", 1);
            $(this.refs["btn-circle"]).css("stroke", "red").css("stroke-width", 2);
        }
    }

    private onSketched(s: Sketch): void {
        if (s.type === "line") {
            // /**
            //  * 点到直线距离上限
            //  */
            // const distance: number = Infinity;
            /**
             * 直线参数
             */
            const line: { A: number; B: number; C: number; } = {
                A: s.end[1] - s.begin[1],
                B: s.begin[0] - s.end[0],
                C: s.begin[0] * (s.begin[1] - s.end[1]) + s.begin[1] * (s.end[0] - s.begin[0])
            };
            const vertical: number = -(line.A * line.A) / line.B;
            const root: number = Math.sqrt(Math.pow(line.A, 2) + Math.pow(line.B, 2));
            // /**
            //  * 计算点到直线距离。
            //  * @param {{x: number; y: number;}} p 数据点投影坐标
            //  * @returns {number} 距离（像素）
            //  */
            // const dist = (p: {x: number; y: number;}): number => {
            //     return Math.abs(
            //         (line.A * p.x + line.B * p.y + line.C) / root
            //     );
            // };
            /**
             * 计算点到直线距离。
             * @param {{x: number; y: number;}} p 数据点投影坐标
             * @returns {number} 距离起点的一维长度（比例）
             */
            const projection = Math.abs(s.begin[0] - s.end[0]) < Math.abs(s.begin[1] - s.end[1])
            ? // y 坐标相差更大，比较 y 坐标
            (p: {x: number; y: number;}): number => {
                const C: number = 0 - line.A * p.x - vertical * p.y;
                const y: number = (C - line.C) / (line.B - vertical);
                return (y - s.begin[1]) / (s.end[1] - s.begin[1]);
            }
            : // x 坐标相差更大，比较 x 坐标
            (p: {x: number; y: number;}): number => {
                const C: number = 0 - line.A * p.x - vertical * p.y;
                const y: number = (C - line.C) / (line.B - vertical);
                const x: number = (-line.C - line.B * y) / line.A;
                return (x - s.begin[0]) / (s.end[0] - s.begin[0]);
            };
            let box: Array<{pos: number; value: number;}> = [];
            let min: number = 1;
            let max: number = 0;
            let n_max: number = 1;
            this.state.data.forEach((d: {lng: number; lat: number; projection: number;}, index: number) => {
                if (isNaN(d.lat) || isNaN(d.lng) || (this.props.filter && !System.active[index])) {
                    return;
                }
                const cord: {x: number; y: number;} = {
                    x: this.fx(d.lng),
                    y: this.fy(d.lat)
                };
                // const _dis: number = dist(cord);
                // if (_dis <= distance) {
                //     // 放入
                //     const proj: number = projection(cord);
                //     if (proj < min) {
                //         min = proj;
                //     } else if (proj > max) {
                //         max = proj;
                //     }
                //     box.push({
                //         pos: proj,
                //         value: d.value
                //     });
                // }
                const proj: number = projection(cord);
                if (proj < min) {
                    min = proj;
                } else if (proj > max) {
                    max = proj;
                }
                box.push({
                    pos: proj,
                    value: d.projection
                });
            });
            if (max === 0 && min === 1) {
                [min, max] = [max, min];    // 交换二者的值
            }
            // 拆分成 n_pieces 份
            const n_pieces: number = 500;
            let spans: Array<{value: number; count: number;}> = [];
            for (let i: number = 0; i < n_pieces; i++) {
                spans.push({
                    value: 0,
                    count: 0
                });
            }
            box.forEach((p: {pos: number; value: number}) => {
                const index: number = Math.floor(n_pieces * (p.pos - min) / (max - min));
                try {
                    if (index < 0) {
                        spans[0].value += p.value;
                        spans[0].count++;
                        n_max = Math.max(n_max, spans[0].count);
                    } else if (index >= n_pieces) {
                        spans[n_pieces - 1].value += p.value;
                        spans[n_pieces - 1].count++;
                        n_max = Math.max(n_max, spans[n_pieces - 1].count);
                    } else {
                        spans[index].value += p.value;
                        spans[index].count++;
                        n_max = Math.max(n_max, spans[index].count);
                    }
                } catch {
                    console.warn(index);
                }
            });
            // 实际的开始和结束坐标
            const beginX: number = s.begin[0] + (s.end[0] - s.begin[0]) * min;
            const beginY: number = s.begin[1] + (s.end[1] - s.begin[1]) * min;
            const endX: number = s.begin[0] + (s.end[0] - s.begin[0]) * max;
            const endY: number = s.begin[1] + (s.end[1] - s.begin[1]) * max;
            const width: number = Math.sqrt(
                Math.pow(endX - beginX, 2) + Math.pow(endY - beginY, 2)
            ) / n_pieces;
            const maxHeight: number = 32;
            // 填充背景
            this.ctx_d!.fillStyle = "#fff";
            const x0: number = beginX + (endX - beginX) / 2 + 2 * line.A / root;
            const y0: number = beginY + (endY - beginY) / 2 + 2 * line.B / root;
            const x1: number = beginX + (endX - beginX) / 2 + (2 + maxHeight) * line.A / root;
            const y1: number = beginY + (endY - beginY) / 2 + (2 + maxHeight) * line.B / root;
            this.ctx_d!.beginPath();
            this.ctx_d!.moveTo(
                x0 - width * n_pieces / 2 * line.B / root,
                y0 + width * n_pieces / 2 * line.A / root
            );
            this.ctx_d!.lineTo(
                x0 + width * n_pieces / 2 * line.B / root,
                y0 - width * n_pieces / 2 * line.A / root
            );
            this.ctx_d!.lineTo(
                x1 + width * n_pieces / 2 * line.B / root,
                y1 - width * n_pieces / 2 * line.A / root
            );
            this.ctx_d!.lineTo(
                x1 - width * n_pieces / 2 * line.B / root,
                y1 + width * n_pieces / 2 * line.A / root
            );
            this.ctx_d!.fill();
            const rootV: number = Math.sqrt(Math.pow(line.A, 2) + Math.pow(vertical, 2));
            const w: number = width / (s.end[0] - s.begin[0] + s.end[1] - s.begin[1]) * root;
            // 每个小矩形块
            spans.forEach((span: {value: number; count: number}, i: number) => {
                if (span.count) {
                    const value: number = span.value / span.count;
                    const x0: number = beginX
                                        + (endX - beginX) * (i + 0.5) / n_pieces
                                        + 2 * line.A / root;
                    const y0: number = beginY
                                        + (endY - beginY) * (i + 0.5) / n_pieces
                                        + 2 * line.B / root;
                    const x1: number = beginX
                                        + (endX - beginX) * (i + 0.5) / n_pieces
                                        + (2 + span.count / n_max * maxHeight) * line.A / root;
                    const y1: number = beginY
                                        + (endY - beginY) * (i + 0.5) / n_pieces
                                        + (2 + span.count / n_max * maxHeight) * line.B / root;
                    const xm: number = beginX
                                        + (endX - beginX) * (i + 0.5) / n_pieces
                                        + (2 + maxHeight) * line.A / root;
                    const ym: number = beginY
                                        + (endY - beginY) * (i + 0.5) / n_pieces
                                        + (2 + maxHeight) * line.B / root;
                    this.ctx_d!.fillStyle = Color.interpolate(
                        Color.Nippon.Rurikonn, Color.Nippon.Karakurenai, value
                    );
                    this.ctx_d!.globalAlpha = 0.3;
                    this.ctx_d!.beginPath();
                    this.ctx_d!.moveTo(
                        x0 - w / 2 * line.A / rootV,
                        y0 + w / 2 * vertical / rootV
                    );
                    this.ctx_d!.lineTo(
                        x0 + w / 2 * line.A / rootV,
                        y0 - w / 2 * vertical / rootV
                    );
                    this.ctx_d!.lineTo(
                        xm + w / 2 * line.A / rootV,
                        ym - w / 2 * vertical / rootV
                    );
                    this.ctx_d!.lineTo(
                        xm - w / 2 * line.A / rootV,
                        ym + w / 2 * vertical / rootV
                    );
                    this.ctx_d!.fill();
                    this.ctx_d!.globalAlpha = 1;
                    this.ctx_d!.beginPath();
                    this.ctx_d!.moveTo(
                        x0 - w / 2 * line.A / rootV,
                        y0 + w / 2 * vertical / rootV
                    );
                    this.ctx_d!.lineTo(
                        x0 + w / 2 * line.A / rootV,
                        y0 - w / 2 * vertical / rootV
                    );
                    this.ctx_d!.lineTo(
                        x1 + w / 2 * line.A / rootV,
                        y1 - w / 2 * vertical / rootV
                    );
                    this.ctx_d!.lineTo(
                        x1 - w / 2 * line.A / rootV,
                        y1 + w / 2 * vertical / rootV
                    );
                    this.ctx_d!.fill();
                }
            });
        } else if (s.type === "circle") {
            const x: number = s.begin[0];
            const y: number = s.begin[1];
            /**
             * 圆的半径
             */
            const radius2: number = Math.pow(s.end[0] - x, 2) + Math.pow(s.end[1] - y, 2);
            let pies: Array<number> = [];
            const n_pieces: number = 360;
            // 扩展
            const stretch: number = 18;
            for (let i: number = 0; i < n_pieces; i++) {
                pies.push(0);
            }
            let max: number = 1;
            this.state.data.forEach((d: {lng: number; lat: number; projection: number;}, index: number) => {
                if (isNaN(d.lng) || isNaN(d.lat) || (this.props.filter && !System.active[index])) {
                    return;
                }
                const dist2: number = Math.pow(this.fx(d.lng) - x, 2) + Math.pow(this.fy(d.lat) - y, 2);
                if (dist2 > radius2) {
                    return;
                }
                const i: number = Math.floor(d.projection * n_pieces);
                if (i >= n_pieces) {
                    pies[n_pieces - 1]++;
                    if (pies[n_pieces - 1] > max) {
                        max = pies[n_pieces - 1];
                    }
                } else {
                    pies[i]++;
                    if (pies[i] > max) {
                        max = pies[i];
                    }
                }
                for (let t: number = - stretch; t <= stretch; t++) {
                    const idx: number = n_pieces + i + t;
                    if (t === 0) {
                        continue;
                    }
                    pies[idx % n_pieces] += 0.8 / Math.abs(t);
                    if (pies[idx % n_pieces] > max) {
                        max = pies[idx % n_pieces];
                    }
                }
            });
            const radius: number = Math.sqrt(radius2) - 2;
            // 背景
            this.ctx_d!.globalAlpha = 1.0;
            this.ctx_d!.fillStyle = "#ffffff80";
            this.ctx_d!.beginPath();
            this.ctx_d!.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx_d!.fill();
            // 绘制扇形
            pies.forEach((pie: number, i: number) => {
                if (pie === 0) {
                    return;
                }
                const r: number = radius * pie / max;
                const x1: number = x + Math.sin(i / n_pieces * 2 * Math.PI) * r
                const y1: number = y - Math.cos(i / n_pieces * 2 * Math.PI) * r;
                const x2: number = x + Math.sin((i + 1) / n_pieces * 2 * Math.PI) * r;
                const y2: number = y - Math.cos((i + 1) / n_pieces * 2 * Math.PI) * r;
                this.ctx_d!.beginPath();
                this.ctx_d!.fillStyle = Color.interpolate(
                    Color.Nippon.Rurikonn, Color.Nippon.Karakurenai, i / (n_pieces - 1)
                );
                this.ctx_d!.moveTo(x, y);
                this.ctx_d!.lineTo(x1, y1);
                this.ctx_d!.lineTo(x2, y2);
                this.ctx_d!.fill();
            });
        }
    }

    private updateSketcher(): void {
        this.canvas_s!.height = this.canvas_s!.height;
        this.sketchers.forEach((s: Sketch, i: number) => {
            if (s.type === "line") {
                this.ctx_s!.strokeStyle = Color.setLightness('rgb(136,115,255)', 0.9);
                this.ctx_s!.lineWidth = 4;
                this.ctx_s!.moveTo(...s.begin);
                this.ctx_s!.lineTo(...s.end);
                this.ctx_s!.stroke();
            } else if (s.type === "circle") {
                const radius: number = Math.sqrt(Math.pow(s.end[0] - s.begin[0], 2) + Math.pow(s.end[1] - s.begin[1], 2));
                if (this.drawing && i === this.sketchers.length - 1) {
                    this.ctx_s!.strokeStyle = 'rgb(136,115,255)';
                    this.ctx_s!.lineWidth = 2;
                    this.ctx_s!.moveTo(...s.begin);
                    this.ctx_s!.lineTo(...s.end);
                    this.ctx_s!.stroke();
                }
                this.ctx_s!.fillStyle = Color.setLightness('rgb(136,115,255)', 0.9);
                this.ctx_s!.fillRect(s.begin[0] - 3, s.begin[1] - 3, 6, 6);
                this.ctx_s!.strokeStyle = Color.setLightness('rgb(136,115,255)', 0.9);
                this.ctx_s!.lineWidth = 3;
                this.ctx_s!.beginPath();
                this.ctx_s!.arc(s.begin[0], s.begin[1], radius, 0, Math.PI * 2);
                this.ctx_s!.stroke();
            }
        });
        if ($(this.refs["cover"]).css("display") !== "none") {
            setTimeout(this.updateSketcher.bind(this), 40);
        }
    }

    private redraw(source: "2" | "all" = "all"): void {
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers = [];
        this.timers_p.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers_p = [];
        // if (source === "all") {
            this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            if (this.ready.length === 0) {
                let nParts = Math.floor(Math.pow((this.state.data.length - 400) / 100, 0.8));
                if (!nParts || nParts < 1) {
                    nParts = 1;
                }
                nParts *= (1 + this.cloneObserver.length);
                for (let i: number = 0; i < nParts; i++) {
                    this.ready.push([]);
                }
                this.state.data.forEach((d: { lng: number; lat: number; value: LISAtype; }, index: number) => {
                    if (isNaN(d.lat) || isNaN(d.lng) || (this.props.filter && !System.active[index])) {
                        return;
                    }
                    // this.ready[index % nParts].push([d.lng, d.lat, System.colorF(d.value)]);
                    this.ready[index % nParts].push([d.lng, d.lat, "rgb(140,140,140)"]);
                });
            }
            this.ready.forEach((list: Array<[number, number, string]>, index: number) => {
                this.timers.push(
                    setTimeout(() => {
                        list.forEach((d: [number, number, string]) => {
                            this.addPoint(d[0], d[1], d[2], "1");
                        });
                    }, index * 10)
                );
            });
        // }
        // this.ctx2!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        // if (this.highlighted.length) {
        //     $(this.canvas!).css("opacity", 0.33);
        //     if (this.ready2.length === 0) {
        //         let nParts = Math.floor(Math.pow((this.highlighted.length - 400) / 100, 0.8));
        //         if (!nParts || nParts < 1) {
        //             nParts = 1;
        //         }
        //         nParts *= (1 + this.cloneObserver.length);
        //         for (let i: number = 0; i < nParts; i++) {
        //             this.ready2.push([]);
        //         }
        //         this.highlighted.forEach((id: number, index: number) => {
        //             const d: { lng: number; lat: number; value: LISAtype; } = this.state.data[id];
        //             if (isNaN(d.lat) || isNaN(d.lng) || (this.props.filter && !System.active[id])) {
        //                 return;
        //             }
        //             this.ready2[index % nParts].push([d.lng, d.lat, System.colorF(d.value)]);
        //         });
        //     }
        //     this.ready2.forEach((list: Array<[number, number, string]>, index: number) => {
        //         this.timers.push(
        //             setTimeout(() => {
        //                 list.forEach((d: [number, number, string]) => {
        //                     this.addPoint(d[0], d[1], d[2], "2");
        //                 });
        //             }, index * 10)
        //         );
        //     });
        // } else {
        //     $(this.canvas!).css("opacity", 1);
        // }

        this.ctx_p!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        setTimeout(() => {
            this.showPoisson();
        }, 4000);
    }

    public synchronize(clone: Map): void {
        this.cloneObserver.push(clone);
        clone.cloneObserver.push(this);
    }

    private onDragEnd(bounds: [[number, number], [number, number]]): void {
        this.bounds = bounds;
        this.applySynchronizedBounds();
        this.redraw();
    }

    private onZoomEnd(bounds: [[number, number], [number, number]]): void {
        this.bounds = bounds;
        this.applySynchronizedBounds();
        this.redraw();
    }

    public highlight(type: LISAtype): void {
        this.highlighted = [];
        this.state.data.forEach((item: {value: LISAtype;}, index: number) => {
            if (item.value === type && (!this.props.filter || System.active[index])) {
                this.highlighted.push(index);
            }
        });
        this.ready2 = [];
        this.redraw("2");
    }

    public applySynchronizedBounds(): void {
        if (this.recursiveLock) {
            this.recursiveLock = false;
            return;
        }
        const map: MapBox = this.refs["map"] as MapBox;
        if (!map) {
            return;
        }
        this.cloneObserver.forEach((clone: Map) => {
            const mapcl: MapBox = clone.refs["map"] as MapBox;
            if (mapcl) {
                clone.recursiveLock = true;
                mapcl.fitBounds(map);
            }
        });
    }

    private fx(d: number): number {
        return (d - this.bounds[1][0]) / (this.bounds[1][1] - this.bounds[1][0]) * (this.props.width - 2);
    }

    private fy(d: number): number {
        d = (d - this.bounds[0][0]) / (this.bounds[0][1] - this.bounds[0][0])
            * (this.originBounds[0][1] - this.originBounds[0][0]) + this.originBounds[0][0]
            + 2 * (1 - (this.bounds[0][1] - this.bounds[0][0]) / (this.originBounds[0][1] - this.originBounds[0][0]));
        return this.props.height * (d * d * (-0.00025304519602050573) - d * 0.01760550015218513 + 1.5344062688366468);
    }

    private addPoint(x: number, y: number, style: string, source: "1" | "2"): void {
        if (this.props.mode === "rect") {
            x = this.fx(x) - 3;//0.5;
            y = this.fy(y) - 3;//0.5;
            if (source === "1") {
                this.ctx!.fillStyle = "#999";
                this.ctx!.fillRect(x - 1, y - 1, 8, 8);
                this.ctx!.fillStyle = style;
                this.ctx!.fillRect(x, y, 6, 6);//1, 1);
            } else {
                this.ctx2!.fillStyle = "#999";
                this.ctx2!.fillRect(x - 1, y - 1, 8, 8);
                this.ctx2!.fillStyle = style;
                this.ctx2!.fillRect(x, y, 6, 6);//1, 1);
            }
        } else {
            if (source === "1") {
                this.ctx!.strokeStyle = "#999";
                this.ctx!.fillStyle = style;
                this.ctx!.beginPath();
                this.ctx!.arc(this.fx(x), this.fy(y), 4, 0, 2 * Math.PI);
                this.ctx!.stroke();
                this.ctx!.fill();
            } else {
                this.ctx2!.strokeStyle = "#999";
                this.ctx2!.fillStyle = style;
                this.ctx2!.beginPath();
                this.ctx2!.arc(this.fx(x), this.fy(y), 4, 0, 2 * Math.PI);
                this.ctx2!.stroke();
                this.ctx2!.fill();
            }
        }
    }

    // private diff(a: {lng: number; lat: number;}, b: {lng: number; lat: number;}): number {
    //     const lng1: number = a.lng * Math.PI / 180;
    //     const lat1: number = a.lat * Math.PI / 180;
    //     const lng2: number = b.lng * Math.PI / 180;
    //     const lat2: number = b.lat * Math.PI / 180;
    //     return Math.asin(
    //         Math.sqrt(
    //             Math.pow(
    //                 Math.sin((lat2 - lat1) / 2), 2
    //             ) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(
    //                 Math.sin((lng2 - lng1) / 2), 2
    //             )
    //         )
    //     ) * 12742;
    // }

    private showPoisson(): void {
        this.ready = [];
        const nParts = 10;
        for (let i: number = 0; i < nParts; i++) {
            this.ready.push([]);
        }

        this.state.poissons.forEach((p: FileData.Poisson, i: number) => {
            for (let t: number = 0; t < nParts - 1; t++) {
                this.ready[t] = [];
            }
            const x: number = this.fx(p.lng);
            const y: number = this.fy(p.lat);
            const r: number = Math.max(
                ...p.pointsInDisk.map((d: {
                    lat: number;
                    lng: number;
                }) => {
                    return Math.sqrt(
                        Math.pow(
                            x - this.fx(d.lng), 2
                        ) + Math.pow(
                            y - this.fy(d.lat), 2
                        )
                    );
                })
            );
            
            this.timers_p.push(
                setTimeout(() => {
                    this.ctx_p!.beginPath();
                    this.ctx_p!.arc(x, y, r, 0, 2 * Math.PI);
                    this.ctx_p!.stroke();
                }, 10 * i)
            );

            this.ready[9].push([
                this.state.data[p.c_index].lng,
                this.state.data[p.c_index].lat,
                "rgb(231,0,0)"
            ]);

            this.ready.forEach((list: Array<[number, number, string]>, index: number) => {
                this.timers.push(
                    setTimeout(() => {
                        list.forEach((d: [number, number, string]) => {
                            this.addPoint(d[0], d[1], d[2], "1");
                        });
                    }, index * 10)
                );
            });

            // if (i < this.state.poissons.length - 1) {
                return;
            // }

            this.timers.push(
                setTimeout(() => {
                    this.ready[9].push([
                        this.state.data[p.c_index].lng,
                        this.state.data[p.c_index].lat,
                        "rgb(231,0,0)"
                    ]);
                    p.pointsInDisk.forEach((d: {
                        id: number;
                        lat: number;
                        lng: number;
                        value: number;
                        type: LISAtype;
                    }) => {
                        this.ready[d.id % (nParts - 1)].push([
                            d.lng,
                            d.lat,
                            "rgb(87,136,211)"
                        ]);
                    });
                    this.ready.forEach((list: Array<[number, number, string]>, index: number) => {
                        this.timers.push(
                            setTimeout(() => {
                                list.forEach((d: [number, number, string]) => {
                                    this.addPoint(d[0], d[1], d[2], "1");
                                });
                            }, index * 10)
                        );
                    });
                }, 400 * i)
            );
        });
    }

    public load(data: Array<DataItem>, poissons?: Array<FileData.Poisson>): void {
        if (!this.mounted) {
            let count: number = 3;
            setTimeout(() => {
                if (count--) {
                    this.load(data);                    
                }
            }, 2000);
            return;
        }
        System.maxValue = Math.max(System.maxValue, ...data.map((d: DataItem) => d.value));
        this.setState({
            data: data.map((d: DataItem) => {
                return {
                    lat: d.lat,
                    lng: d.lng,
                    value: d.type,
                    projection: this.props.scaleType === "linear" ? d.value / System.maxValue
                        : this.props.scaleType === "log2" ? Math.log2(1 + d.value / System.maxValue * 1)
                        : this.props.scaleType === "log" ? Math.log(1 + d.value / System.maxValue * (Math.E - 1))
                        : this.props.scaleType === "log10" ? Math.log10(1 + d.value / System.maxValue * 9)
                        // : this.props.scaleType === "quick" ? Math.pow(
                        //     d.value / System.maxValue, 1 / Math.log10(System.maxValue)
                        // )
                        : this.props.scaleType === "quick" ? Math.pow(d.value / System.maxValue, 0.34)
                        : Math.sqrt(d.value / System.maxValue)
                };
            }),
            poissons: poissons ? poissons : this.state.poissons
        })
    }

    public random(cx: number, cy: number, r: number, amount: number, gamma: number = 1, diff: number = 0.3): Array<{
        lng: number;
        lat: number;
        value: number;
    }> {
        let box: Array<{lng: number; lat: number; value: number;}> = [];
        const rate = Math.min(0.02, r / Math.sqrt(100 / gamma));
        for (let i: number = 0; i < amount; i++) {
            const angle: number = Math.random() * 2 * Math.PI;
            const _r: number = Math.random() * r;
            if (i === 0 || Math.random() < gamma / Math.sqrt(i)) {
                box.push({
                    lng: cx + _r * Math.sin(angle),
                    lat: cy + _r / 1.8 * Math.cos(angle),
                    value: Math.random()
                });
            } else {
                const a = Math.floor(Math.random() * i);
                const valueMin = box[a].value * (1 - diff);
                const valueMax = box[a].value * (1 + diff) / Math.max(1, box[a].value * (1 + diff));
                box.push({
                    lng: box[a].lng + _r * rate * Math.sin(angle),
                    lat: box[a].lat + _r * rate / 1.8 * Math.cos(angle),
                    value: valueMin + Math.random() * (valueMax - valueMin)
                });
            }
        }

        return box;
    }

    public get width() : number {
        return this.props.width;
    }
    
    public get height() : number {
        return this.props.height;
    }
}
