/*
 * @Author: Antoine YANG 
 * @Date: 2019-09-23 18:41:23 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-06 23:48:51
 */
import React, { Component } from 'react';
import MapBox from './react-mapbox/MapBox';
import Color from './preference/Color';
import { DataItem } from './TypeLib';
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
}

export interface MapViewState<T> {
    data: Array<{
        lng: number;
        lat: number;
        value: T;
    }>;
}

export class Map extends Component<MapViewProps, MapViewState<number>, {}> {
    private originBounds: Readonly<[[number, number], [number, number]]>
        = [[ 50.55349948549696, 22.86881607932105 ], [ -128.14621384226703, -67.85378615773539 ]];
    private bounds: [[number, number], [number, number]]
        = [[ 50.55349948549696, 22.86881607932105 ], [ -128.14621384226703, -67.85378615773539 ]];
    private mounted: boolean;
    private canvas: null | HTMLCanvasElement;
    private ctx: null | CanvasRenderingContext2D;
    private ready: Array<Array<[number, number, string]>>;
    private timers: Array<NodeJS.Timeout>;
    private cloneObserver: Array<Map>;
    private recursiveLock: boolean;

    public constructor(props: MapViewProps) {
        super(props);
        this.mounted = false;
        this.state = { data: [] };
        this.canvas = null;
        this.ctx = null;
        this.timers = [];
        this.ready = [];
        this.cloneObserver = [];
        this.recursiveLock = false;
    }

    public render(): JSX.Element {
        return (
            <div id={ this.props.id }
            style={{
                height: `${ this.props.height }px`,
                width: `${ this.props.width }px`,
                background: 'white',
                ...this.props.style
            }} >
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
                    <canvas key="1" id={ this.props.id + "_canvas" } ref="canvas"
                    width={ `${ this.props.width }px` } height={`${ this.props.height }px`} style={{
                        position: 'initial',
                        top: '-100%',
                        pointerEvents: 'none'
                    }} />
                </div>
            </div>
        )
    }

    public componentDidMount(): void {
        this.mounted = true;
        this.canvas = document.getElementById(this.props.id + "_canvas") as HTMLCanvasElement;
        this.ctx = this.canvas!.getContext("2d");
        this.ctx!.globalAlpha = 0.5;
        this.forceUpdate();
    }

    public componentDidUpdate(): void {
        this.ready = [];
        this.redraw();
    }

    public componentWillUnmount(): void {
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
    }

    private redraw(): void {
        this.ctx!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers = [];
        if (this.ready.length === 0) {
            const nParts = Math.max(Math.floor(Math.pow((this.state.data.length - 400) / 100, 0.8)), 1);
            for (let i: number = 0; i < nParts; i++) {
                this.ready.push([]);
            }
            this.state.data.forEach((d: { lng: number, lat: number, value: number }, index: number) => {
                if (isNaN(d.lat) || isNaN(d.lng) || !System.active[index]) {
                    return;
                }
                this.ready[index % nParts].push([d.lng, d.lat, Color.interpolate(
                    Color.Nippon.Rurikonn, Color.Nippon.Karakurenai, d.value
                )]);
            });
        }
        this.ready.forEach((list: Array<[number, number, string]>, index: number) => {
            this.timers.push(
                setTimeout(() => {
                    list.forEach((d: [number, number, string]) => {
                        this.addPoint(d[0], d[1], d[2]);
                    });
                }, index * 10)
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

    public applySynchronizedBounds(): void {
        console.log("traggered by", this.props.id);
        if (this.recursiveLock) {
            this.recursiveLock = false;
            console.log("Unlock", this.props.id);
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
                console.log("Lock", clone.props.id);
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

    private addPoint(x: number, y: number, style: string): void {
        this.ctx!.fillStyle = style;
        x = this.fx(x) - 0.7;//0.5;
        y = this.fy(y) - 0.7;//0.5;
        this.ctx!.fillRect(x, y, 1.4, 1.4);//1, 1);
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
                    value: this.props.scaleType === "linear" ? d.value / System.maxValue
                        : this.props.scaleType === "log2" ? Math.log2(1 + d.value / System.maxValue * 1)
                        : this.props.scaleType === "log" ? Math.log(1 + d.value / System.maxValue * (Math.E - 1))
                        : this.props.scaleType === "log10" ? Math.log10(1 + d.value / System.maxValue * 9)
                        // : this.props.scaleType === "quick" ? Math.pow(
                        //     d.value / System.maxValue, 1 / Math.log10(System.maxValue)
                        // )
                        : this.props.scaleType === "quick" ? Math.pow(d.value / System.maxValue, 0.34)
                        : Math.sqrt(d.value / System.maxValue)
                };
            })
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
