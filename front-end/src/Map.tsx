/*
 * @Author: Antoine YANG 
 * @Date: 2019-09-23 18:41:23 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-07-04 17:42:47
 */
import React, { Component } from 'react';
import $ from 'jquery';
import MapBox from './react-mapbox/MapBox';
import axios from 'axios';
import Color, { ColorThemes } from './preference/Color';
import { DataItem, LISAtype, FileData } from './TypeLib';
import { System } from './Globe';
import { SyncButton } from './prototypes/SyncButton';
// import ValueBar from './tools/ValueBar';
import { AxiosResponse } from 'axios';
import { CommandResult, CommandError } from './Command';


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
    load: (state: boolean) => void;
    getZorderSubset: (
        resolve: (value: Array<Array<number>>) => void,
        reject: (reason: any) => void
    ) => Promise<AxiosResponse<CommandResult<Array<number[]>|CommandError>>>;
    runReplace: (from: number, to: number) => void;
    tryReplace: (from: number, to: number, callback: (data: FileData.Mode) => void) => void;
    applyReplace: () => void;
}

export interface MapViewState<T> {
    data: Array<{
        lng: number;
        lat: number;
        value: T;
        projection: number;
    }>;
    behavior: "Scatterplots" | "Ambiguity" | "heatmap";
    showMistake: boolean;
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
    private ready_r: Array<[number, number, [string, string, string], number]>;
    private timers: Array<NodeJS.Timeout>;
    private cloneObserver: Array<Map>;
    private recursiveLock: boolean;
    private keyboardDebounce: boolean;
    private behavior: "line" | "circle";
    private sketchers: Array<Sketch>;
    private drawing: boolean;
    private tickDone: number;
    // private adjust: (value: number) => void;
    // private adjustExtend: (value: number) => void;
    // private step: number;
    // private expand: number;
    private ambType: "Replace" | "AmbiguityVis";
    private heatmapType: "Origin" | "Sample" | "Difference";
    private replaceFrom: number;
    private replaceTo: number;
    private toReplace: Array<{
        x: number;
        y: number;
        to: number;
    }>;

    public constructor(props: MapViewProps) {
        super(props);
        this.mounted = false;
        this.state = {
            data: [],
            behavior: "Scatterplots",
            showMistake: false
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
        this.tickDone = 0;
        // this.adjust = () => {};
        // this.adjustExtend = () => {};
        // this.step = 16;
        // this.expand = 12;
        this.ambType = "AmbiguityVis";
        this.heatmapType = "Sample";
        this.replaceFrom = NaN;
        this.replaceTo = NaN;
        this.toReplace = [];
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
                <div ref="mapLayer"
                id={ this.props.id + ">>" }
                style={{
                    height: `${ this.props.height }px`,
                    width: `${ this.props.width }px`
                }}
                onClick={
                    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        const offset: {
                            left: number;
                            top: number;
                        } = $(this.refs["mapLayer"]).offset()!;
                        const x: number = event.clientX - offset.left;
                        const y: number = event.clientY - offset.top;
                        if (this.clickHandle(x, y)) {
                            // 拦截接下来的双击和拖拽
                            $(this.refs["mapLayer"]).css("pointer-events", "none");
                            setTimeout(() => {
                                $(this.refs["mapLayer"]).css("pointer-events", "unset");
                            }, 1000);
                        }
                    }
                } >
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
                <div id="Scatterplots"
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
                        opacity: this.state.behavior === "Scatterplots" || this.state.behavior === "heatmap"
                                    ? 0 : 1
                    }} />
                    <canvas key="1" id={ this.props.id + "_canvas" } ref="canvas"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        opacity: this.state.behavior === "Scatterplots"
                            ? 1 : this.state.behavior === "Ambiguity" ? 0.25 : 0
                    }} />
                    <canvas key="2" id={ this.props.id + "_canvas2" } ref="canvas2"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        opacity: this.state.behavior === "Scatterplots"
                            ? 1 : this.state.behavior === "Ambiguity" ? 0.25 : 0
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
                top: "-850px",
                right: "-790px",
                width: "auto",
                display: "table",
                padding: "4px 6px",
                marginBottom: "-57px",
                color: "black",
                background: ColorThemes.NakiriAyame.OuterBackground,
                border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground
            }} >
                {/* {
                    ([
                        "Scatterplots", "purity plot", "KDE plot", "heatmap"
                    ] as Array<"Scatterplots" | "purity plot" | "KDE plot" | "heatmap">
                    ).map((b: "Scatterplots" | "purity plot" | "KDE plot" | "heatmap") => {
                        if (this.state.behavior === b) {
                            return (
                                <label key={ b }
                                style={{
                                    display: 'inline-block',
                                    width: '84px',
                                    color: ColorThemes.NakiriAyame.InnerBackground,
                                    border: "1px solid " + ColorThemes.NakiriAyame.Green,
                                    padding: "0 6px 4px",
                                    margin: "0 2px",
                                    fontSize: "14px",
                                    fontWeight: 501
                                }} >
                                    { b }
                                </label>
                            );
                        } else {
                            return (
                                <SyncButton key={ b } text={ `➥ ${ b }` }
                                executer={
                                    () => {
                                        this.shift(b);
                                    }
                                }
                                style={{
                                    margin: "0 2px",
                                    width: '96px',
                                    backgroundColor: "#504D4D",
                                    border: "none",
                                    color: "aliceblue"
                                }} />
                            );
                        }
                    })
                } */}
                {
                    ([
                        "Scatterplots", "Ambiguity", "heatmap"
                    ] as Array<"Scatterplots" | "Ambiguity" | "heatmap">
                    ).map((b: "Scatterplots" | "Ambiguity" | "heatmap") => {
                        if (this.state.behavior === b) {
                            return (
                                <label key={ b }
                                style={{
                                    display: 'inline-block',
                                    width: '94px',
                                    color: ColorThemes.NakiriAyame.InnerBackground,
                                    border: "1px solid " + ColorThemes.NakiriAyame.Green,
                                    padding: "0 6px 4px",
                                    margin: "0 2px",
                                    fontSize: "14px",
                                    fontWeight: 501
                                }} >
                                    { "● " + b }
                                </label>
                            );
                        } else {
                            return (
                                <SyncButton key={ b } text={ `- ${ b }` }
                                executer={
                                    () => {
                                        this.shift(b);
                                    }
                                }
                                style={{
                                    margin: "0 2px",
                                    width: '106px',
                                    backgroundColor: "#504D4D",
                                    border: "none",
                                    color: "aliceblue"
                                }} />
                            );
                        }
                    })
                }
            </div>
            {
                this.state.behavior !== "Ambiguity" ? null :
                <div key="buttonBox_ambiguity"
                style={{
                    position: "relative",
                    top: "-784px",
                    right: "-790px",
                    width: "auto",
                    display: "table",
                    padding: "4px 8px 4px 4px",
                    marginBottom: "-31px",
                    color: "black",
                    background: ColorThemes.NakiriAyame.OuterBackground,
                    border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground,
                    borderRadius: "4px"
                }} >
                    <label key="1" style={{
                        margin: "0 10px",
                        display: "inline-block",
                        width: "140px"
                    }} >
                        <input type="radio" name="type_amb" value="AmbiguityVis"
                        onChange={
                            () => {
                                this.ambType = "AmbiguityVis";
                            }
                        }
                        defaultChecked={ this.ambType === "AmbiguityVis" } />
                        <span style={{ padding: "0 4px" }} >
                            AmbiguityVis
                        </span>
                    </label>
                    <label key="spring" style={{
                        width: "12px",
                        display: "inline-block",
                        margin: "0 10px"
                    }} />
                    <label key="2" style={{
                        margin: "0 10px",
                        display: "inline-block",
                        width: "119px"
                    }} >
                        <input type="radio" name="type_amb" value="Replace"
                        onChange={
                            () => {
                                this.ambType = "Replace";
                            }
                        }
                        defaultChecked={ this.ambType === "Replace" } />
                        <span style={{ padding: "0 4px" }} >
                            Replace
                        </span>
                    </label>
                </div>
            }
            {
                this.state.behavior !== "heatmap" ? null :
                <div key="buttonBox_heatmap"
                style={{
                    position: "relative",
                    top: "-784px",
                    right: "-790px",
                    width: "auto",
                    display: "table",
                    padding: "4px 8px 4px 4px",
                    marginBottom: "-31px",
                    color: "black",
                    background: ColorThemes.NakiriAyame.OuterBackground,
                    border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground,
                    borderRadius: "4px"
                }} >
                    <label key="1" style={{
                        margin: 0,
                        display: "inline-block",
                        width: "88px"
                    }} >
                        <input type="radio" name="type_heat" value="Origin"
                        onChange={
                            () => {
                                this.heatmapType = "Origin";
                                this.redraw();
                            }
                        }
                        defaultChecked={ this.heatmapType === "Origin" } />
                        <span style={{ padding: "0 4px" }} >
                            Origin
                        </span>
                    </label>
                    <label key="spring" style={{
                        width: "22px",
                        display: "inline-block"
                    }} />
                    <label key="2" style={{
                        margin: 0,
                        display: "inline-block",
                        width: "88px"
                    }} >
                        <input type="radio" name="type_heat" value="Sample"
                        onChange={
                            () => {
                                this.heatmapType = "Sample";
                                this.redraw();
                            }
                        }
                        defaultChecked={ this.heatmapType === "Sample" } />
                        <span style={{ padding: "0 4px" }} >
                            Sample
                        </span>
                    </label>
                    <label key="spring2" style={{
                        width: "22px",
                        display: "inline-block"
                    }} />
                    <label key="3" style={{
                        margin: 0,
                        display: "inline-block",
                        width: "112px"
                    }} >
                        <input type="radio" name="type_heat" value="Difference"
                        onChange={
                            () => {
                                this.heatmapType = "Difference";
                                this.redraw();
                            }
                        }
                        defaultChecked={ this.heatmapType === "Difference" } />
                        <span style={{ padding: "0 4px" }} >
                            Difference
                        </span>
                    </label>
                </div>
            }
            {
                // this.state.behavior !== "Scatterplots" ? null :
                // <div key="buttonBox1"
                // style={{
                //     position: "relative",
                //     top: "-784px",
                //     right: "-710px",
                //     width: "auto",
                //     display: "table",
                //     padding: "4px 8px 4px 4px",
                //     marginBottom: "-31px",
                //     color: "black",
                //     background: ColorThemes.NakiriAyame.OuterBackground,
                //     border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground,
                //     borderRadius: "4px"
                // }} >
                //     <label>
                //         <input type="checkbox" onChange={ this.changeView.bind(this) }
                //         defaultChecked={ this.state.showMistake } />
                //         <span style={{ padding: "0 4px" }} >⚐</span>
                //     </label>
                // </div>
            }
            {
                // this.state.behavior === "Scatterplots" || this.state.behavior === "heatmap" ? null :
                // <div key="buttonBox2"
                // style={{
                //     position: "relative",
                //     top: "-784px",
                //     right: "-710px",
                //     width: "auto",
                //     display: "table",
                //     padding: "1px 8px 7px 4px",
                //     marginBottom: "-31px",
                //     color: "black",
                //     background: ColorThemes.NakiriAyame.OuterBackground,
                //     border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground,
                //     borderRadius: "4px"
                // }} >
                //     <ValueBar width={ 80 } height={ 16 }
                //     min={ 2 } max={ 16 } defaultValue={ this.step } step={ 1 }
                //     onValueChange={
                //         this.adjust.bind(this)
                //     }
                //     valueFormatter={
                //         (value: number) => `size=${ value }`
                //     }
                //     style={{
                //         transform: "translateY(26%)",
                //         display: "inline-block"
                //     }} />
                //     <ValueBar width={ 80 } height={ 16 }
                //     min={ 4 } max={ 16 } defaultValue={ this.expand } step={ 1 }
                //     onValueChange={
                //         this.adjustExtend.bind(this)
                //     }
                //     valueFormatter={
                //         (value: number) => `expand=${ value }`
                //     }
                //     style={{
                //         transform: "translateY(26%)",
                //         display: "inline-block"
                //     }} />
                // </div>
            }
            {
                <div key="ambVisDetail" ref="ambVisDetail"
                style={{
                    position: "relative",
                    top: "-743px",
                    right: "-790px",
                    width: "auto",
                    display: "none",
                    padding: "6px 28px 8px",
                    marginBottom: "-103px",
                    color: "black",
                    background: ColorThemes.NakiriAyame.OuterBackground,
                    border: "1px solid " + ColorThemes.NakiriAyame.InnerBackground,
                    borderRadius: "4px"
                }} >
                    <label key="w2r" style={{
                        width: "140px",
                        display: "inline-block"
                    }} >
                        Wrong to right:
                    </label>
                    <label key="spring1" style={{
                        width: "47px",
                        display: "inline-block"
                    }} />
                    <label key="w2r__" ref="w2r__" style={{
                        width: "100px",
                        display: "inline-block"
                    }} >
                        0
                    </label>
                    <br />
                    <label key="r2w" style={{
                        width: "140px",
                        display: "inline-block"
                    }} >
                        Right to wrong:
                    </label>
                    <label key="spring2" style={{
                        width: "47px",
                        display: "inline-block"
                    }} />
                    <label key="r2w__" ref="r2w__" style={{
                        width: "100px",
                        display: "inline-block"
                    }} >
                        0
                    </label>
                    <hr />
                    <SyncButton text="Apply" executer={
                        (resolve: () => void, reject: (reason?: any) => void) => {
                            if (isNaN(this.replaceFrom) || isNaN(this.replaceTo)) {
                                reject("Got NaN for params");
                                return;
                            }
                            this.props.applyReplace();
                            this.replaceFrom = NaN;
                            this.toReplace = [];
                            this.replaceTo = NaN;
                            resolve();
                            $(this.refs["ambVisDetail"]).css("display", "none");
                        }
                    } />
                    <label key="spring3" style={{
                        width: "80px",
                        display: "inline-block"
                    }} />
                    <SyncButton text="Cancel" executer={
                        (resolve: () => void) => {
                            this.replaceTo = NaN;
                            resolve();
                            $(this.refs["ambVisDetail"]).css("display", "none");
                            this.redraw();
                        }
                    } />
                </div>
            }
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
        // this.adjust = (value: number) => {
        //     const v: number = Math.floor(value);
        //     if (v !== this.step) {
        //         this.step = v;
        //         this.process();
        //         this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        //         setTimeout(() => {
        //             this.heat();
        //         }, 10);
        //     }
        // };
        // this.adjustExtend = (value: number) => {
        //     const v: number = Math.floor(value);
        //     if (v !== this.expand) {
        //         this.expand = v;
        //         this.process();
        //         this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        //         setTimeout(() => {
        //             this.heat();
        //         }, 10);
        //     }
        // };
    }

    public componentDidUpdate(): void {
        this.process();
        this.ready = [];
        this.ready2 = [];
        this.sketchers = [];
        this.redraw();

        System.highlight = (value: LISAtype | "none", value2?: LISAtype) => {
            if (value === "none") {
                this.highlighted = [];
                if (this.state.behavior === "Scatterplots") {
                    this.redraw();
                }
            } else {
                this.highlight(value, value2);
            }
        };
    }

    public componentWillUnmount(): void {
        this.process();
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

    // private changeView(): void {
        // this.setState({
        //     showMistake: !this.state.showMistake
        // });
        // System.setPointFilter(!this.state.showMistake);
    // }

    private showZorderSubset(pIndex: number): void {
        this.replaceFrom = pIndex;
        this.ctx_r!.clearRect(0, 0, this.props.width, this.props.height);
        this.ready_r.forEach((
            d: [number, number, [string, string, string], number]
        ) => {
            this.outstand(d[0], d[1], d[2]);
        });
        this.props.getZorderSubset((value: Array<Array<number>>) => {
            for (let a: number = 0; a < value.length; a++) {
                for (let b: number = 0; b < value[a].length; b++) {
                    if (value[a][b] === pIndex) {
                        this.ctx_r!.clearRect(-2, -2, this.width + 4, this.props.height + 4);
                        let xMin: number = Infinity;
                        let xMax: number = -Infinity;
                        let yMin: number = Infinity;
                        let yMax: number = -Infinity;
                        value[a].forEach((i: number) => {
                            const x: number = this.fx(System.data[i].lng);
                            const y: number = this.fy(System.data[i].lat);
                            [xMin, xMax, yMin, yMax] = [
                                Math.min(xMin, x),
                                Math.max(xMax, x),
                                Math.min(yMin, y),
                                Math.max(yMax, y)
                            ];
                        });
                        const p: Promise<AxiosResponse<CommandResult<{
                            [id: number]: [boolean, number];
                        }|CommandError>>> = axios.get(
                            `/test/${ System.filepath!.split(".")[0] }/${ pIndex }/${
                                JSON.stringify(value[a]).split(" ").join("")
                            }/${
                                System.tail
                            }`, {
                                headers: 'Content-type:text/html;charset=utf-8'
                            }
                        );
                        const cx: number = (xMin + xMax) / 2;
                        const cy: number = (yMin + yMax) / 2;
                        const cr: number = Math.sqrt(
                            Math.max(
                                Math.pow(xMax - xMin, 2) + Math.pow(yMax - yMin, 2),
                                Math.pow(xMax - xMin, 2) + Math.pow(yMin - yMax, 2)
                            )
                        ) / 2 + 8;
                        p.then((value: AxiosResponse<CommandResult<{
                            [id: number]: [boolean, number];
                        } | CommandError>>) => {
                            if (value.data.state === "successed") {
                                this.testCandidate(value.data.value as {
                                    [id: number]: [boolean, number];
                                }, [cx, cy, cr]);
                            } else {
                                console.warn("error", value.data.value);
                            }
                        }).catch((reason: any) => {
                            console.warn("error", reason);
                        });
                        this.ctx_r!.lineWidth = 1;
                        this.ctx_r!.fillStyle = "#cccccca0";
                        this.ctx_r!.strokeStyle = "#000000";
                        value[a].forEach((i: number) => {
                            const x: number = this.fx(System.data[i].lng);
                            const y: number = this.fy(System.data[i].lat);
                            
                            if (this.props.mode === "rect") {
                                this.ctx_r!.fillRect(x - 3, y - 3, 6, 6);
                            } else {
                                this.ctx_r!.beginPath();
                                this.ctx_r!.arc(x, y, 3, 0, 2 * Math.PI);
                                this.ctx_r!.stroke();
                                this.ctx_r!.fill();
                            }
                        });
                        return;
                    }
                }
            }
        }, (reason: any) => {
            console.warn("error", reason);
        });
    }

    private testCandidate(points: {
        [id: number]: [boolean, number];
    }, center: [number, number, number]): void {
        // console.log(points);
        this.toReplace = [];
        const len: number = Object.entries(points).length;
        const step: number = 2 * Math.PI / len;

        const r: number = center[2];

        const projections: Array<{
            x: number;
            y: number;
        }> = Object.entries(points).map((_: {}, i: number) => {
            return {
                x: center[0] + Math.sin(step * i) * r,
                y: center[1] - Math.cos(step * i) * r
            };
        });

        const positions: Array<{
            x: number;
            y: number;
            id: number;
            available: boolean;
            contribution: number;
        }> = Object.entries(points).map((entry: [string, [boolean, number]]) => {
            const _x: number = this.fx(System.data[parseInt(entry[0])].lng);
            const _y: number = this.fy(System.data[parseInt(entry[0])].lat);
            let minIdx: number = 0;
            let minValue: number = Infinity;
            projections.forEach((c: {x: number; y: number;}, i: number) => {
                const dist: number = Math.pow(c.x - _x, 2) + Math.pow(c.y - _y, 2);
                if (dist < minValue) {
                    minValue = dist;
                    minIdx = i;
                }
            });
            return {
                x: _x,
                y: _y,
                id: parseInt(entry[0]),
                available: entry[1][0],
                contribution: entry[1][1],
                nearest: minIdx
            };
        }).sort((a, b) => a.nearest - b.nearest);

        this.ctx_r!.lineWidth = 1;

        positions.forEach((p: {
            x: number;
            y: number;
            id: number;
            available: boolean;
            contribution: number;
        }, index: number) => {
            const x: number = center[0] + Math.sin(step * index) * (r + 48);
            const y: number = center[1] - Math.cos(step * index) * (r + 48);
            // this.ctx_r!.strokeStyle = 'rgb(165,112,163)';
            // this.ctx_r!.moveTo(p.x, p.y);
            // this.ctx_r!.lineTo(x, y);
            // this.ctx_r!.stroke();
            this.drawCircle(
                x,
                y,
                p.available,
                p.contribution
            );
            if (p.available || this.ambType === "AmbiguityVis") {
                this.toReplace.push({
                    x: x,
                    y: y,
                    to: p.id
                });
            }
        });
    }

    private drawCircle(x: number, y: number, available: boolean, val: number): void {
        const p: (a: number) => number = (a: number) => {
            return 5 - (a + 1) / 4 * 10;
        };
        const color: string = `rgb(${
            available ? "255,0,230" : "0,205,250"
        })`;
        this.ctx_r!.beginPath();
        const r1: number = 12;
        const r2: number = r1 * (0.36 + 0.64 / (1 + Math.pow(Math.E, p(val))));
        this.ctx_r!.moveTo(x, y - r1);
        const step: number = 32;
        // let lastDeg: number = 0;
        for (let a: number = 1; a <= step; a++) {
            const deg: number = Math.PI * 2 / step * a;
            if (a % 2 === 0) {
                this.ctx_r!.lineTo(
                    x + Math.sin(deg) * r1,
                    y - Math.cos(deg) * r1
                );
                // this.ctx_r!.bezierCurveTo(
                //     x + Math.sin(deg) * r2,
                //     y - Math.cos(deg) * r2,
                //     x + Math.sin(lastDeg) * r1,
                //     y - Math.cos(lastDeg) * r1,
                //     x + Math.sin(deg) * r1,
                //     y - Math.cos(deg) * r1
                // );
            } else {
                this.ctx_r!.lineTo(
                    x + Math.sin(deg) * r2,
                    y - Math.cos(deg) * r2
                );
                // this.ctx_r!.bezierCurveTo(
                //     x + Math.sin(deg) * r1,
                //     y - Math.cos(deg) * r1,
                //     x + Math.sin(lastDeg) * r2,
                //     y - Math.cos(lastDeg) * r2,
                //     x + Math.sin(deg) * r2,
                //     y - Math.cos(deg) * r2
                // );
            }
            // lastDeg = deg;
        }
        this.ctx_r!.lineTo(
            x + Math.sin(0) * r2,
            y - Math.cos(0) * r2
        );
        this.ctx_r!.lineWidth = 1;
        this.ctx_r!.fillStyle = color;
        this.ctx_r!.strokeStyle = "rgb(118,92,116)";
        this.ctx_r!.closePath();
        this.ctx_r!.stroke();
        this.ctx_r!.fill();
    }

    private clickHandle(x: number, y: number): boolean {
        // 是否处于可交互场景
        if (System.tail !== "_o" && System.tail !== "_ob") {
            return false;
        } else if (this.state.behavior !== "Ambiguity") {
            return false;
        }

        // 是否点击到可替换点
        if (!isNaN(this.replaceFrom)) {
            for (let i: number = 0; i < this.toReplace.length; i++) {
                if (Math.pow(
                    x - this.toReplace[i].x, 2
                ) + Math.pow(
                    y - this.toReplace[i].y, 2
                ) <= 100) {
                    this.replaceTo = this.toReplace[i].to;
                    if (this.ambType === "Replace") {
                        this.props.runReplace(this.replaceFrom, this.replaceTo);
                        this.replaceFrom = NaN;
                        this.toReplace = [];
                        this.replaceTo = NaN;
                    } else {
                        this.props.tryReplace(
                            this.replaceFrom,
                            this.replaceTo,
                            this.ambiguityVis.bind(this)
                        );
                    }
                    return true;
                }
            }
        }

        // 从下到上遍历
        for (let i: number = this.ready_r.length - 1; i >= 0; i--) {
            const cx: number = this.fx(this.ready_r[i][0]);
            const cy: number = this.fy(this.ready_r[i][1]);
            // 是否点击到旗帜
            if (x >= cx && x <= cx + 13) {
                const line1 = (_x: number) => (7 / 13 * _x + cy - 24 - 7 / 13 * cx);
                const line2 = (_x: number) => (-5 / 13 * _x + cy - 12 + 5 / 13 * cx);
                if (y >= line1(x) && y <= line2(x)) {
                    this.showZorderSubset(this.ready_r[i][3]);
                    return true;
                }
            }
        }

        // 从下到上遍历
        for (let i: number = this.ready_r.length - 1; i >= 0; i--) {
            const cx: number = this.fx(this.ready_r[i][0]);
            const cy: number = this.fy(this.ready_r[i][1]);
            // 是否点击到圆或方框
            if (this.props.mode === "rect") {
                if (Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3) {
                    return true;
                }
            } else {
                if (Math.pow(x - cx, 2) + Math.pow(y - cy, 2) <= 16) {
                    this.showZorderSubset(this.ready_r[i][3]);
                    return true;
                }
            }
        }

        return false;
    }

    private ambiguityVis(data: FileData.Mode): void {
        (this.refs["map"] as MapBox).updateHeatMap([]);
        this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        this.ctx_r!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        this.ctx2!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        this.ctx_r!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        
        this.process();

        $(this.refs["ambVisDetail"]).css("display", "table");

        let nParts = Math.floor(Math.pow((this.state.data.length - 400) / 100, 0.8));
        if (!nParts || nParts < 1) {
            nParts = 1;
        }
        nParts *= (1 + this.cloneObserver.length);

        let ready: Array<Array<[number, number, [string, string], number]>> = [];

        for (let i: number = 0; i < nParts + 2; i++) {
            ready.push([]);
        }

        let box: Array<{
            id: number;
            lng: number;
            lat: number;
            value: {
                origin: LISAtype;
                before: LISAtype | null;
                after: LISAtype | null;
            };
        }> = System.data.map((d: DataItem, i: number) => {
            return {
                id: i,
                lng: d.lng,
                lat: d.lat,
                value: {
                    origin: d.type,
                    before: d.target ? d.target.type : null,
                    after: null
                }
            };
        }).filter(a => {
            return a.value.before;
        }).sort((a, b) => {
            return Math.pow(a.lng - System.data[this.replaceTo].lng, 2)
                + Math.pow(a.lat - System.data[this.replaceTo].lat, 2)
                - Math.pow(b.lng - System.data[this.replaceTo].lng, 2)
                - Math.pow(b.lat - System.data[this.replaceTo].lat, 2);
        });

        data.forEach((d: { id: number; type: LISAtype; }) => {
            for (let i: number = 0; i <= box.length; i++) {
                if (i === box.length) {
                    box.push({
                        id: d.id,
                        lng: System.data[d.id].lng,
                        lat: System.data[d.id].lat,
                        value: {
                            origin: System.data[d.id].type,
                            before: null,
                            after: d.type
                        }
                    });
                    return;
                }
                if (d.id === box[i].id) {
                    box[i].value.after = d.type;
                    break;
                }
            }
        });

        let count: {
            RightToWrong: number;
            WrongToRight: number;
        } = {
            RightToWrong: 0,
            WrongToRight: 0
        };

        // if (this.replaceFrom !== this.replaceTo) {
        //     if (box[this.replaceTo].value.origin === box[this.replaceTo].value.after) {
        //         count.WrongToRight ++;
        //     }
        // }

        box.forEach((d: {
            lng: number;
            lat: number;
            value: {
                origin: LISAtype;
                before: LISAtype | null;
                after: LISAtype | null;
            };
        }, i: number) => {
            if (d.value.before && d.value.after) {
                if (d.value.before === d.value.after) {
                    // 没有发生变化
                    ready[i % nParts].push([
                        d.lng,
                        d.lat,
                        ["#3C3C3C18", "#1D1D1D"],
                        2.5
                    ]);
                } else {
                    if (d.value.before === d.value.origin) {
                        // 好的变坏
                        ready[i % nParts].push([
                            d.lng,
                            d.lat,
                            ["rgb(255,69,48)", "#402020"],
                            4
                        ]);
                        count.RightToWrong ++;
                    } else if (d.value.after === d.value.origin) {
                        // 坏的变好
                        ready[i % nParts].push([
                            d.lng,
                            d.lat,
                            ["rgb(106,225,85)", "#202024"],
                            4
                        ]);
                        count.WrongToRight ++;
                    } else {
                        // 变了没意义
                        ready[i % nParts].push([
                            d.lng,
                            d.lat,
                            ["#3C3C3C80", "#1D1D1D"],
                            4
                        ]);
                    }
                }
            } else if (d.value.after && d.value.after === d.value.origin) {
                // console.log("new", d);
                ready[i % nParts].push([
                    d.lng,
                    d.lat,
                    ["rgb(106,225,85)", "#202024"],
                    5.6
                ]);
                count.WrongToRight ++;
            } else if (d.value.before) {
                // console.log("old", d);
            }
        });

        this.ctx_r!.globalAlpha = 1;

        ready.forEach((
            list: Array<[number, number, [string, string], number]>,
            index: number
        ) => {
            this.timers.push(
                setTimeout(() => {
                    list.forEach((
                        d: [number, number, [string, string], number]
                    ) => {
                        this.ctx_r!.fillStyle = d[2][0];
                        this.ctx_r!.strokeStyle = d[2][1];
                        this.ctx_r!.beginPath();
                        this.ctx_r!.arc(
                            this.fx(d[0]),
                            this.fy(d[1]),
                            d[3],
                            0,
                            2 * Math.PI
                        );
                        this.ctx_r!.stroke();
                        this.ctx_r!.fill();
                    });
                    this.makeStep();
                }, index * 10)
            );
        });

        $(this.refs["w2r__"]).text(count.WrongToRight);
        $(this.refs["r2w__"]).text(count.RightToWrong);
    }

    private shift(b: "Scatterplots" | "Ambiguity" | "heatmap"): void {
        if (this.state.behavior === b) {
            return;
        } else if (this.state.showMistake && b === "Scatterplots") {
            this.setState({
                behavior: b,
                showMistake: false
            });
            System.setPointFilter(false);
        } else if (!this.state.showMistake && b === "Ambiguity") {
            this.setState({
                behavior: b,
                showMistake: true
            });
            System.setPointFilter(true);
        } else {
            this.setState({
                behavior: b
            });
        }
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

    // private heat(): void {
    //     const expand: number = Math.round(this.expand / this.step);
    //     const index: (x: number, y: number) => [number, number] = (x: number, y: number) => {
    //         return [
    //             Math.round(x / this.step),
    //             Math.round(y / this.step)
    //         ];
    //     };
    //     if (this.state.behavior === "KDE plot") {
    //         const expand: number = Math.max(Math.round(this.expand / this.step), 2);
    //         // 点的数量
    //         let box: Array<Array<{
    //             HH: number;
    //             LH: number;
    //             LL: number;
    //             HL: number;
    //             all: number;
    //         }>> = [];
    //         // 值
    //         let dots: Array<Array<{
    //             HH: number;
    //             LH: number;
    //             LL: number;
    //             HL: number;
    //         }>> = [];

    //         // 值的映射
    //         const f: (val: number) => number = (val: number) => {
    //             // return val >= 0.9 ? 1
    //             //     : val >= 0.6 ? 0.7
    //             //         : val >= 0.4 ? 0.4 : 0;
    //             // return Math.sqrt(Math.round(Math.pow(val, 2) * 6)) / 6;
    //             // return Math.pow(Math.round(Math.sqrt(val) * 6) / 6, 2);
    //             return Math.log(val * (Math.E - 1) + 1);
    //         };
        
    //         this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        
    //         // 网格
    //         for (let y: number = 0; y <= this.props.width + this.step; y += this.step) {
    //             box.push([]);
    //             dots.push([]);
    //             for (let x: number = 0; x <= this.props.width + this.step; x += this.step) {
    //                 box[y / this.step].push({
    //                     HH: 0,
    //                     LH: 0,
    //                     LL: 0,
    //                     HL: 0,
    //                     all: 0
    //                 });
    //                 dots[y / this.step].push({
    //                     HH: 0,
    //                     LH: 0,
    //                     LL: 0,
    //                     HL: 0
    //                 });
    //             }
    //         }
            
    //         this.ctx_base!.globalAlpha = 1;

    //         // 反卷积，value 是归一化的值
    //         const contribute: (value: number, dist: number) => number
    //         = (value: number, dist: number) => {
    //             return 1 - Math.pow(dist, 2) / Math.pow(expand * (value * 10 + 1), 2);
    //         };

    //         const fartheset: (value: number) => number
    //         = (value: number) => {
    //             return Math.floor(expand * (value * 10 + 1));
    //         };

    //         let max: number = 0;

    //         const paint: (tMax: number) => void = (tMax: number) => {
    //             this.process();
    //             for (let y: number = 0; y < dots.length; y++) {
    //                 for (let x: number = 0; x < dots[y].length; x++) {
    //                     this.timers.push(
    //                         setTimeout(() => {
    //                             let colors: Array<[string, number, number]> = [];
    //                             (
    //                                 ["HH", "LH", "LL", "HL"] as Array<"HH" | "LH" | "LL" | "HL">
    //                             ).forEach((label: "HH" | "LH" | "LL" | "HL") => {
    //                                 if (dots[y][x][label] <= 1e-3) {
    //                                     return;
    //                                 }
    //                                 const fill: number = f(dots[y][x][label] / tMax);
    //                                 const color: string = System.colorF(label)[0];
    //                                 colors.push([color, fill, 0.7 - 0.4 * fill]);
    //                             });
    //                             if (colors.length) {
    //                                 while (colors.length > 2) {
    //                                     const a: [string, number, number] = colors.pop()!;
    //                                     const b: [string, number, number] = colors.pop()!;
    //                                     colors.push([
    //                                         Color.interpolate(
    //                                             a[0],
    //                                             b[0],
    //                                             b[1] / (a[1] + b[1])
    //                                         ),
    //                                         a[1] + b[1],
    //                                         Math.min(a[2], b[2])
    //                                     ]);
    //                                 }
    //                                 if (colors.length === 2) {
    //                                     this.ctx_base!.fillStyle = Color.setLightness(
    //                                         Color.interpolate(
    //                                             colors[0][0],
    //                                             colors[1][0],
    //                                             colors[1][1] / (colors[0][1] + colors[1][1])
    //                                         ),
    //                                         Math.min(colors[0][2], colors[1][2])
    //                                     );
    //                                     this.ctx_base!.globalAlpha = Math.sqrt((
    //                                         0.7 - Math.min(colors[0][2], colors[1][2])
    //                                     ) / 0.4);
    //                                 } else {
    //                                     this.ctx_base!.fillStyle = Color.setLightness(
    //                                         colors[0][0],
    //                                         colors[0][2]
    //                                     );
    //                                     this.ctx_base!.globalAlpha = Math.sqrt((
    //                                         0.7 - colors[0][2]
    //                                     ) / 0.4);
    //                                 }
    //                                 this.ctx_base!.fillRect(
    //                                     this.step * x,
    //                                     this.step * y,
    //                                     this.step,
    //                                     this.step
    //                                 );
    //                             }
    //                             this.makeStep();
    //                         }, (x * box[x].length + y) / 10 + 10)
    //                     );
    //                 }
    //             }
    //         };

    //         const goon: () => void = () => {
    //             const vMax: number = max;
    //             let _max: number = 0;
    //             const updateTmax: (d: number) => void = (d: number) => {
    //                 if (d > _max) {
    //                     _max = d;
    //                 }
    //             };
    //             const getTmax: () => number = () => _max;
    //             this.process();
    //             for (let y: number = 0; y < box.length; y++) {
    //                 for (let x: number = 0; x < box[y].length; x++) {
    //                     this.timers.push(
    //                         setTimeout(() => {
    //                             (
    //                                 ["HH", "LH", "LL", "HL"] as Array<"HH" | "LH" | "LL" | "HL">
    //                             ).forEach((label: "HH" | "LH" | "LL" | "HL") => {
    //                                 const val: number = box[y][x][label] / vMax;
    //                                 const exd: number = fartheset(val);
    //                                 for (let _y: number = -exd; _y <= exd; _y++) {
    //                                     const width: number = Math.floor(Math.sqrt(
    //                                         Math.pow(exd, 2) - Math.pow(Math.abs(_y), 2)
    //                                     ));
    //                                     for (let _x: number = -width; _x <= width; _x++) {
    //                                         const pos: [number, number] = [
    //                                             y + _y,
    //                                             x + _x
    //                                         ];
    //                                         if (pos[0] < 0 || pos[0] >= dots.length
    //                                             || pos[1] < 0 || pos[1] >= dots[0].length) {
    //                                             continue;
    //                                         }
    //                                         dots[pos[0]][pos[1]][label] += val * contribute(
    //                                             val,
    //                                             Math.sqrt(
    //                                                 Math.pow(_x, 2) + Math.pow(_y, 2)
    //                                             )
    //                                         );
    //                                         updateTmax(dots[pos[0]][pos[1]][label]);
    //                                     }
    //                                 }
    //                             });
    //                             this.makeStep();
    //                             if (y === box.length - 1 && x === box[y].length - 1) {
    //                                 setTimeout(() => {
    //                                     paint(getTmax());
    //                                 }, 100);
    //                             }
    //                         }, (x * box[x].length + y) / 1000 + 10)
    //                     );
    //                 }
    //             }
    //         };

    //         this.state.data.forEach((d: {
    //             lng: number;
    //             lat: number;
    //             value: LISAtype;
    //             projection: number;
    //         }, i: number) => {
    //             if (this.props.filter && !System.active[i]) {
    //                 if (i === this.state.data.length - 1) {
    //                     setTimeout(goon, 10);
    //                 }
    //                 return;
    //             }
    //             const pos: [number, number] = [
    //                 index(this.fx(d.lng), this.fy(d.lat))[1],
    //                 index(this.fx(d.lng), this.fy(d.lat))[0]
    //             ];
    //             if (pos[0] < 0 || pos[0] >= box.length || pos[1] < 0 || pos[1] >= box[0].length) {
	//                 if (i === this.state.data.length - 1) {
	//                     setTimeout(goon, 10);
	//                 }
    //                 return;
    //             }
    //             box[pos[0]][pos[1]][d.value] ++;
    //             box[pos[0]][pos[1]].all ++;
    //             if (box[pos[0]][pos[1]].all > max) {
    //                 max = box[pos[0]][pos[1]].all;
    //             }
    //             if (i === this.state.data.length - 1) {
    //                 setTimeout(goon, 10);
    //             }
    //         });
    //     } else if (this.state.behavior === "purity plot") {
    //         let box: Array<Array<boolean>> = [];
        
    //         this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        
    //         // 网格
    //         for (let y: number = 0; y <= this.props.width + this.step; y += this.step) {
    //             box.push([]);
    //             for (let x: number = 0; x <= this.props.width + this.step; x += this.step) {
    //                 box[y / this.step].push(false);
    //             }
    //         }
            
    //         this.ctx_base!.globalAlpha = 1;
        
    //         this.state.data.forEach((d: {
    //             lng: number;
    //             lat: number;
    //             value: LISAtype;
    //             projection: number;
    //         }, i: number) => {
    //             this.timers.push(
    //                 setTimeout(() => {
    //                     this.makeStep();
    //                     if (this.props.filter && !System.active[i]) {
    //                         return;
    //                     }
    //                     // 考虑扩展像素
    //                     for (let _y: number = - expand; _y <= expand; _y++) {
    //                         const width: number = Math.floor(Math.sqrt(
    //                             Math.pow(expand, 2)
    //                             - Math.pow(Math.abs(_y), 2)
    //                         ));
                            
    //                         for (let _x: number = - width; _x <= width; _x++) {
    //                             const pos: [number, number] = [
    //                                 index(this.fx(d.lng), this.fy(d.lat))[1] + _y,
    //                                 index(this.fx(d.lng), this.fy(d.lat))[0] + _x
    //                             ];
    //                             if (pos[0] < 0 || pos[0] >= box.length
    //                                 || pos[1] < 0 || pos[1] >= box[0].length
    //                                 || box[pos[0]][pos[1]]) {
    //                                 continue;
    //                             }
    //                             box[pos[0]][pos[1]] = true;
                                
    //                             const x: number = this.step * (pos[1] + 0.5);
    //                             const y: number = this.step * (pos[0] + 0.5);
                
    //                             let neighbors: Array<{
    //                                 index: number;
    //                                 dist: number;
    //                             }> = [];
                
    //                             this.state.data.forEach((e: {
    //                                 lng: number;
    //                                 lat: number;
    //                                 value: LISAtype;
    //                                 projection: number;
    //                             }, j: number) => {
    //                                 if (i === j) {
    //                                     return;
    //                                 }
    //                                 if (this.props.filter && !System.active[j]) {
    //                                     return;
    //                                 }
    //                                 const dist: number = Math.sqrt(
    //                                     Math.pow(this.fx(e.lng) - x, 2)
    //                                     + Math.pow(this.fy(e.lat) - y, 2)
    //                                 );
    //                                 if (dist < 1e-6) {
    //                                     return;
    //                                 }
    //                                 if (neighbors.length < 13 || neighbors[12].dist > dist) {
    //                                     neighbors.push({
    //                                         index: j,
    //                                         dist: dist
    //                                     });
    //                                     neighbors.sort((a, b) => {
    //                                         return a.dist - b.dist;
    //                                     });
    //                                     if (neighbors.length > 13) {
    //                                         neighbors.length = 13;
    //                                     }
    //                                 }
    //                             });
                
    //                             let max: number = 0;
    //                             let sum: number = 0;
    //                             let TYPE: LISAtype = d.value;
    //                             let contribution: number = 0;
                
    //                             let count = {
    //                                 HH: 0,
    //                                 LH: 0,
    //                                 LL: 0,
    //                                 HL: 0
    //                             };
                
    //                             for (let k: number = 0; k < neighbors.length; k++) {
    //                                 const n: {index: number; dist: number} = neighbors[k];
    //                                 if (k <= 7) {
    //                                     count[this.state.data[n.index].value] ++;
    //                                     sum ++;
    //                                     if (count[this.state.data[n.index].value] > max) {
    //                                         max = count[this.state.data[n.index].value];
    //                                         TYPE = this.state.data[n.index].value;
    //                                     }
    //                                 } else {
    //                                     let t: number = 0;
    //                                     if (count.HH === max) {
    //                                         t ++;
    //                                     }
    //                                     if (count.LH === max) {
    //                                         t ++;
    //                                     }
    //                                     if (count.LL === max) {
    //                                         t ++;
    //                                     }
    //                                     if (count.HL === max) {
    //                                         t ++;
    //                                     }
    //                                     if (t === 1) {
    //                                         break;
    //                                     }
    //                                 }
    //                             }
                
    //                             for (let k: number = 0; k < sum; k++) {
    //                                 const n: {index: number; dist: number} = neighbors[k];
    //                                 if (this.state.data[n.index].value === TYPE) {
    //                                     contribution ++;
    //                                 }
    //                             }
                
    //                             contribution /= sum;
                
    //                             this.ctx_base!.fillStyle = Color.setLightness(
    //                                 System.colorF(TYPE)[0],
    //                                 0.4 + 0.4 * (1 - contribution)
    //                             );
    //                             this.ctx_base!.fillRect(
    //                                 this.step * pos[1],
    //                                 this.step * pos[0],
    //                                 this.step,
    //                                 this.step
    //                             );
    //                         }
    //                     }
    //                 }, i / 1000)
    //             );
    //         });
    //     }
    // }

    private redraw(source: "2" | "all" = "all"): void {
        $(this.refs["ambVisDetail"]).css("display", "none");
        this.ready_r = [];
        this.ctx_base!.clearRect(0, 0, this.props.width, this.props.height);
        (this.refs["map"] as MapBox).updateHeatMap([]);
        if (this.state.behavior === "heatmap") {
            this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            this.ctx2!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            this.ctx_r!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            this.ready = [];
            this.ready2 = [];
            let box: Array<[number, number, number]> = [];
            let box2: Array<[number, number]> = [];
            let box3: Array<[number, number, number]> = [];
            System.data.forEach((d: DataItem, i: number) => {
                box2.push([d.lng, d.lat]);
                if (System.active[i]) {
                    box.push([d.lng, d.lat, 1]);
                } else {
                    box3.push([d.lng, d.lat, 1]);
                }
            });
            if (this.heatmapType === "Difference") {
                (this.refs["map"] as MapBox).updateHeatMap(box3.map(d => {
                    return [d[0], d[1], 0.2 * d[2] * box2.length / box3.length];
                }));
            } else if (this.heatmapType === "Origin") {
                (this.refs["map"] as MapBox).updateHeatMap(box2.map(d => {
                    return [d[0], d[1], 0.2];
                }));
            } else {
                (this.refs["map"] as MapBox).updateHeatMap(box.map(d => {
                    return [d[0], d[1], 0.2 * box2.length / box.length];
                }));
            }
            return;
        }
        // if (this.state.behavior !== "Scatterplots" && System.filepath) {
        //     this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        //     this.ctx2!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        //     this.ctx_r!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        //     if (this.state.behavior === "heatmap") {
        //         let box: Array<[number, number]> = [];
        //         System.data.forEach((d: DataItem, i: number) => {
        //             if (System.active[i]) {
        //                 box.push([d.lng, d.lat + 0.12]);
        //             }
        //         });
        //         (this.refs["map"] as MapBox).updateHeatMap(box);
        //     } else {
        //         this.heat();
        //     }
        //     return;
        // }
        this.process();
        if (source === "all") {
            this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
            this.ctx_r!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
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
                        this.makeStep();
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
                        this.makeStep();
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
                        ],
                        id
                    ]);
                }
            });
        } else {
            $(this.canvas!).css(
                "opacity",
                System.type === "dataset" || !this.state.showMistake
                    ? 1 : 0.25
            );

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
                        ],
                        index
                    ]);
                }
            });
        }
        this.ready_r.sort((a: [number, number, [string, string, string], number], b: [number, number, [string, string, string], number]) => {
            return b[1] - a[1];
        });
        this.ready_r.forEach((
            d: [number, number, [string, string, string], number],
            index: number
        ) => {
            this.timers.push(
                setTimeout(() => {
                    this.outstand(d[0], d[1], d[2]);
                    this.makeStep();
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

    public highlight(type: LISAtype, type2?: LISAtype): void {
        this.highlighted = [];
        if (this.state.behavior !== "Scatterplots") {
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
        return this.props.height * (d * d * (-0.00025304519602050573) - d * 0.01700550015218513 + 1.5344062688366468);
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
            this.ctx_r!.fillStyle = style[0];
            this.ctx_r!.strokeStyle = style[1];
            this.ctx_r!.fillRect(x - 3, y - 3, 6, 6);
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
        if (this.state.showMistake) {
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
