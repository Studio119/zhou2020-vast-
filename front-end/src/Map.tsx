/*
 * @Author: Antoine YANG 
 * @Date: 2019-09-23 18:41:23 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-08 21:27:33
 */
import React, { Component } from 'react';
import $ from 'jquery';
import MapBox from './react-mapbox/MapBox';
import Color, { ColorThemes } from './preference/Color';
import { DataItem, LISAtype } from './TypeLib';
import { System } from './Globe';
import { SyncButton } from './prototypes/SyncButton';


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
    heat: boolean;
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
    private ready: Array<Array<[number, number, [string, string]]>>;
    private highlighted: Array<number>;
    private canvas_base: null | HTMLCanvasElement;
    private ctx_base: null | CanvasRenderingContext2D;
    private canvas2: null | HTMLCanvasElement;
    private ctx2: null | CanvasRenderingContext2D;
    private canvas_r: null | HTMLCanvasElement;
    private ctx_r: null | CanvasRenderingContext2D;
    private canvas_s: null | HTMLCanvasElement;
    private ctx_s: null | CanvasRenderingContext2D;
    private canvas_d: null | HTMLCanvasElement;
    private ctx_d: null | CanvasRenderingContext2D;
    private ready2: Array<Array<[number, number, [string, string]]>>;
    private ready_r: Array<[number, number, [string, string, string]]>;
    private timers: Array<NodeJS.Timeout>;
    private cloneObserver: Array<Map>;
    private recursiveLock: boolean;
    private keyboardDebounce: boolean;
    private behavior: "line" | "circle";
    private sketchers: Array<Sketch>;
    private drawing: boolean;

    public constructor(props: MapViewProps) {
        super(props);
        this.mounted = false;
        this.state = {
            data: [],
            heat: true
        };
        this.canvas = null;
        this.ctx = null;
        this.timers = [];
        this.ready = [];
        this.highlighted = [];
        this.canvas_base = null;
        this.ctx_base = null;
        this.canvas2 = null;
        this.ctx2 = null;
        this.canvas_r = null;
        this.ctx_r = null;
        this.canvas_s = null;
        this.ctx_s = null;
        this.canvas_d = null;
        this.ctx_d = null;
        this.ready2 = [];
        this.ready_r = [];
        this.cloneObserver = [];
        this.recursiveLock = false;
        this.keyboardDebounce = false;
        this.behavior = "line";
        this.sketchers = [];
        this.drawing = false;
    }

    public render(): JSX.Element {
        return (<>
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
                    <canvas key="base" id={ this.props.id + "_canvas_base" } ref="canvas_base"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        opacity: this.state.heat ? 1 : 0
                    }} />
                    <canvas key="1" id={ this.props.id + "_canvas" } ref="canvas"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        opacity: System.type === "dataset" ? 1 : 0.25
                    }} />
                    <canvas key="2" id={ this.props.id + "_canvas2" } ref="canvas2"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        opacity: System.type === "dataset" ? 1 : 0.25
                    }} />
                    <canvas key="r" id={ this.props.id + "_canvas_r" } ref="canvas_r"
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
            <svg key="process"
            width={ this.props.width } height="4px"
            style={{
                position: "relative",
                top: "-854.6px",
                left: 0,
                pointerEvents: "none"
            }} >
                <rect ref="process"
                x={ 0 } y={ 0 } width={ 0 } height={ 4 }
                style={{
                    fill: Color.setLightness(
                            ColorThemes.NakiriAyame.Green, 0.6
                        )
                }} />
            </svg>
            <div key="buttonBox"
            style={{
                position: "relative",
                top: "-850px",
                left: "10px",
                width: "30px",
                marginBottom: "-47px"
            }} >
                <SyncButton theme="NakiriAyame" text={
                    this.state.heat ? "on " : "off"
                }
                    executer={ this.shift.bind(this) } />
            </div>
        </>)
    }

    public componentDidMount(): void {
        $(this.refs["detail"]).hide();
        $(this.refs["cover"]).hide();
        $(this.refs["tool-line"]).hide();
        this.mounted = true;
        this.canvas = document.getElementById(this.props.id + "_canvas") as HTMLCanvasElement;
        this.ctx = this.canvas!.getContext("2d");
        this.canvas_base = document.getElementById(this.props.id + "_canvas_base") as HTMLCanvasElement;
        this.ctx_base = this.canvas_base!.getContext("2d");
        this.canvas2 = document.getElementById(this.props.id + "_canvas2") as HTMLCanvasElement;
        this.ctx2 = this.canvas2!.getContext("2d");
        this.canvas_r = document.getElementById(this.props.id + "_canvas_r") as HTMLCanvasElement;
        this.ctx_r = this.canvas_r!.getContext("2d");
        this.canvas_s = document.getElementById(this.props.id + "_canvas_s") as HTMLCanvasElement;
        this.ctx_s = this.canvas_s!.getContext("2d");
        this.canvas_d = document.getElementById(this.props.id + "_canvas_d") as HTMLCanvasElement;
        this.ctx_d = this.canvas_d!.getContext("2d");
        this.forceUpdate();
        this.setSketchType("line");
    }

    public componentDidUpdate(): void {
        $(this.refs["process"]).attr("width", 0);
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers = [];
        this.ready = [];
        this.ready2 = [];
        this.sketchers = [];
        this.redraw();

        System.highlight = (value: LISAtype | "none", value2?: LISAtype) => {
            if (value === "none") {
                this.highlighted = [];
                this.redraw();
            } else {
                this.highlight(value, value2);
            }
        };
    }

    public componentWillUnmount(): void {
        $(this.refs["process"]).attr("width", 0);
        this.timers.forEach((timer: NodeJS.Timeout) => {
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
                    this.ctx_d!.globalAlpha = 0.25;
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

    private heat(): void {
        const step: number = 4;

        const index: (x: number, y: number) => [number, number] = (x: number, y: number) => {
            return [
                Math.round(x / step),
                Math.round(y / step)
            ];
        };

        let box: Array<Array<boolean>> = [];

        // 网格
        for (let y: number = 0; y <= this.props.width; y += step) {
            box.push([]);
            this.ctx_base!.strokeStyle = 'rgb(55,55,61)';
            this.ctx_base!.moveTo(0, y);
            this.ctx_base!.lineTo(this.props.width, y);
            this.ctx_base!.stroke();
            for (let x: number = 0; x <= this.props.width; x += step) {
                box[y / step].push(false);
                if (y === 0) {
                    this.ctx_base!.moveTo(x, 0);
                    this.ctx_base!.lineTo(x, this.props.height);
                    this.ctx_base!.stroke();
                }
            }
        }

        this.state.data.forEach((d: {
            lng: number;
            lat: number;
            value: LISAtype;
            projection: number;
        }, i: number) => {
            this.timers.push(
                setTimeout(() => {
                    $(this.refs["process"]).attr(
                        "width",
                        100 * (i + 1) / this.state.data.length + "%"
                    );
                    if (i === this.state.data.length - 1) {
                        setTimeout(() => {
                            $(this.refs["process"]).attr("width", 0);
                        }, 80);
                    }
                    const pos: [number, number] = index(this.fx(d.lng), this.fy(d.lat));
                    if (pos[0] < 0 || pos[0] >= box.length
                        || pos[1] < 0 || pos[1] >= box[0].length
                        || box[pos[0]][pos[1]]) {
                        return;
                    }
                    box[pos[0]][pos[1]] = true;
                    
                    const x: number = step * (pos[0] + 0.5);
                    const y: number = step * (pos[1] + 0.5);

                    let neighbors: Array<{
                        index: number;
                        dist: number;
                    }> = [];

                    this.state.data.forEach((e: {
                        lng: number;
                        lat: number;
                        value: LISAtype;
                        projection: number;
                    }, j: number) => {
                        if (i === j) {
                            return;
                        }
                        const dist: number = Math.sqrt(
                            Math.pow(this.fx(e.lng) - x, 2)
                            + Math.pow(this.fy(e.lat) - y, 2)
                        );
                        if (dist < 1e-6) {
                            return;
                        }
                        if (neighbors.length < 13 || neighbors[12].dist > dist) {
                            neighbors.push({
                                index: j,
                                dist: dist
                            });
                            neighbors.sort((a, b) => {
                                return a.dist - b.dist;
                            });
                            if (neighbors.length > 13) {
                                neighbors.length = 13;
                            }
                        }
                    });

                    let max: number = 0;
                    let sum: number = 0;
                    let TYPE: LISAtype = d.value;
                    let contribution: number = 0;

                    let count = {
                        HH: 0,
                        LH: 0,
                        LL: 0,
                        HL: 0
                    };

                    for (let k: number = 0; k < neighbors.length; k++) {
                        const n: {index: number; dist: number} = neighbors[k];
                        if (k <= 7) {
                            count[this.state.data[n.index].value] ++;
                            sum ++;
                            if (count[this.state.data[n.index].value] > max) {
                                max = count[this.state.data[n.index].value];
                                TYPE = this.state.data[n.index].value;
                            }
                        } else {
                            let t: number = 0;
                            if (count.HH === max) {
                                t ++;
                            }
                            if (count.LH === max) {
                                t ++;
                            }
                            if (count.LL === max) {
                                t ++;
                            }
                            if (count.HL === max) {
                                t ++;
                            }
                            if (t === 1) {
                                break;
                            }
                        }
                    }

                    for (let k: number = 0; k < sum; k++) {
                        const n: {index: number; dist: number} = neighbors[k];
                        if (this.state.data[n.index].value === TYPE) {
                            contribution ++;
                        }
                    }

                    contribution /= sum;

                    this.ctx_base!.globalAlpha = contribution;
                    this.ctx_base!.fillStyle = System.colorF(TYPE)[0];
                    this.ctx_base!.fillRect(
                        step * pos[0], step * pos[1], step, step
                    );
                    this.ctx_base!.globalAlpha = 1;
                }, i / 8)
            );
        });
    }

    private redraw(source: "2" | "all" = "all"): void {
        $(this.refs["process"]).attr("width", 0);
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.ready_r = [];
        this.timers = [];
        this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        if (this.state.heat) {
            this.heat();
            this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            this.ctx2!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            return;
        }
        if (source === "all") {
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
                    const type: LISAtype = System.data[index].target
                        ? System.data[index].target!.type : d.value;
                    if (type === d.value) {
                        this.ready[index % nParts].push([
                            d.lng,
                            d.lat,
                            System.colorF(type)
                        ]);
                    }
                });
            }
            this.ready.forEach((
                list: Array<[number, number, [string, string]]>,
                index: number
            ) => {
                this.timers.push(
                    setTimeout(() => {
                        list.forEach((
                            d: [number, number, [string, string]]
                        ) => {
                            this.addPoint(d[0], d[1], d[2], "1");
                        });
                    }, index * 10)
                );
            });
        }
        this.ctx2!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        this.ctx_r!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        if (this.highlighted.length) {
            $(this.canvas!).css("opacity", 0.25);
            if (this.ready2.length === 0) {
                let nParts = Math.floor(Math.pow((this.highlighted.length - 400) / 100, 0.8));
                if (!nParts || nParts < 1) {
                    nParts = 1;
                }
                nParts *= (1 + this.cloneObserver.length);
                for (let i: number = 0; i < nParts; i++) {
                    this.ready2.push([]);
                }
                this.highlighted.forEach((id: number, index: number) => {
                    const d: { lng: number; lat: number; value: LISAtype; } = this.state.data[id];
                    if (isNaN(d.lat) || isNaN(d.lng) || (this.props.filter && !System.active[id])) {
                        return;
                    }
                    const type: LISAtype = System.data[id].target
                        ? System.data[id].target!.type : d.value;
                    if (type === d.value) {
                        this.ready2[index % nParts].push([
                            d.lng,
                            d.lat,
                            System.colorF(type)
                        ]);
                    }
                });
            }
            this.ready2.forEach((
                list: Array<[number, number, [string, string]]>,
                index: number
            ) => {
                this.timers.push(
                    setTimeout(() => {
                        list.forEach((
                            d: [number, number, [string, string]]
                        ) => {
                            this.addPoint(d[0], d[1], d[2], "2");
                        });
                    }, index * 10)
                );
            });

            this.highlighted.forEach((id: number) => {
                const d: { lng: number; lat: number; value: LISAtype; } = this.state.data[id];
                if (isNaN(d.lat) || isNaN(d.lng) || (this.props.filter && !System.active[id])) {
                    return;
                }
                const type: LISAtype = System.data[id].target
                    ? System.data[id].target!.type : d.value;
                if (type !== d.value) {
                    this.ready_r.push([
                        d.lng,
                        d.lat,
                        [
                            System.colorF(type)[0],
                            System.colorF(type)[1],
                            System.colorF(d.value)[0]
                        ]
                    ]);
                }
            });
        } else {
            $(this.canvas!).css("opacity", System.type === "dataset" ? 1 : 0.25);

            this.state.data.forEach((d: { lng: number; lat: number; value: LISAtype; }, index: number) => {
                if (isNaN(d.lat) || isNaN(d.lng) || !System.data[index].target) {
                    return;
                }
                const type: LISAtype = System.data[index].target!.type;
                if (type !== d.value) {
                    this.ready_r.push([
                        d.lng,
                        d.lat,
                        [
                            System.colorF(type)[0],
                            System.colorF(type)[1],
                            System.colorF(d.value)[0]
                        ]
                    ]);
                }
            });
        }
        this.ready_r.sort((a: [number, number, [string, string, string]], b: [number, number, [string, string, string]]) => {
            return b[1] - a[1];
        });
        this.ready_r.forEach((
            d: [number, number, [string, string, string]],
            index: number
        ) => {
            this.timers.push(
                setTimeout(() => {
                    this.outstand(d[0], d[1], d[2]);
                }, index)
            );
        });
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

    private shift(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
        this.setState({
            heat: !this.state.heat
        });
        resolve();
    }

    public highlight(type: LISAtype, type2?: LISAtype): void {
        this.highlighted = [];
        if (this.state.heat) {
            return;
        }
        this.state.data.forEach((item: {value: LISAtype;}, index: number) => {
            if (type2) {
                if (item.value === type && (!this.props.filter || System.active[index])) {
                    if (System.data[index].target!.type === type2) {
                        this.highlighted.push(index);
                    }
                }
            } else if (System.type === "dataset" || System.data[index].target) {
                const t1: LISAtype = System.type === "dataset"
                    ? item.value
                    : System.data[index].target!.type;
                if (t1 === type) {
                    this.highlighted.push(index);
                }
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

    private addPoint(x: number, y: number, style: [string, string], source: "1" | "2"): void {
        if (this.props.mode === "rect") {
            x = this.fx(x) - 3;//0.5;
            y = this.fy(y) - 3;//0.5;
            if (source === "1") {
                this.ctx!.fillStyle = style[0];
                this.ctx!.strokeStyle = style[1];
                this.ctx!.fillRect(x, y, 6, 6);//1, 1);
            } else {
                this.ctx2!.fillStyle = style[0];
                this.ctx2!.strokeStyle = style[1];
                this.ctx2!.fillRect(x, y, 6, 6);//1, 1);
            }
        } else {
            if (source === "1") {
                this.ctx!.fillStyle = style[0];
                this.ctx!.strokeStyle = style[1];
                this.ctx!.beginPath();
                this.ctx!.arc(this.fx(x), this.fy(y), 4, 0, 2 * Math.PI);
                this.ctx!.stroke();
                this.ctx!.fill();
            } else {
                this.ctx2!.fillStyle = style[0];
                this.ctx2!.strokeStyle = style[1];
                this.ctx2!.beginPath();
                this.ctx2!.arc(this.fx(x), this.fy(y), 4, 0, 2 * Math.PI);
                this.ctx2!.stroke();
                this.ctx2!.fill();
            }
        }
    }

    private outstand(x: number, y: number, style: [string, string, string]): void {
        if (this.props.mode === "rect") {
            x = this.fx(x) - 3;
            y = this.fy(y) - 3;
            this.ctx_r!.fillStyle = style[0];
            this.ctx_r!.strokeStyle = style[1];
            this.ctx_r!.fillRect(x, y, 6, 6);
        } else {
            x = this.fx(x);
            y = this.fy(y);
            this.ctx_r!.fillStyle = style[0];
            this.ctx_r!.strokeStyle = style[1];
            this.ctx_r!.beginPath();
            this.ctx_r!.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx_r!.stroke();
            this.ctx_r!.fill();
        }
        this.ctx_r!.fillStyle = style[2];
        this.ctx_r!.strokeStyle = 'rgb(156,156,156)';
        this.ctx_r!.lineWidth = 1.8;
        this.ctx_r!.beginPath();
        this.ctx_r!.moveTo(x, y);
        this.ctx_r!.lineTo(x, y - 24);
        this.ctx_r!.lineTo(x + 13, y - 17);
        this.ctx_r!.lineTo(x, y - 12);
        this.ctx_r!.closePath();
        this.ctx_r!.stroke();
        this.ctx_r!.fill();
        this.ctx_r!.lineWidth = 1;
    }

    public load(data: Array<DataItem>): void {
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
        })
    }

    public random(cx: number, cy: number, r: number, amount: number, gamma: number = 1, diff: number = 0.25): Array<{
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
