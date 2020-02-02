/*
 * @Author: Antoine YANG 
 * @Date: 2019-09-23 18:41:23 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-16 22:39:10
 */
import React, { Component } from 'react';
import $ from 'jquery';
import MapBox from './react-mapbox/MapBox';
import Color from './preference/Color';


export interface MapViewProps {
    id: string;
    center: [number, number];
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    options?: any;
    width: number;
    height: number;
    style?: React.CSSProperties;
}

export interface MapViewState<T> {
    data: Array<{
        lng: number;
        lat: number;
        value: T;
    }>;
    sampled: Array<number>;
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

    public constructor(props: MapViewProps) {
        super(props);
        this.mounted = false;
        this.state = { data: [], sampled: [] };
        this.canvas = null;
        this.ctx = null;
        this.timers = [];
        this.ready = [];
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
                    {/* 这个画布用于展现全部的点 */}
                    <canvas key="1" id="map_layer_canvas" ref="canvas"
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
        this.canvas = document.getElementById("map_layer_canvas") as HTMLCanvasElement;
        this.ctx = this.canvas!.getContext("2d");
        this.ctx!.globalAlpha = 0.5;
        this.forceUpdate();
    }

    public componentDidUpdate(): void {
        this.ready = [];
        if (this.state.sampled.length === 0) {
            this.redraw();
            $("#map_layer_canvas").css('opacity', 1);
        }
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
                if (d.lat >= 0 || d.lat < 0 || d.lng >= 0 || d.lng < 0) {
                    this.ready[index % nParts].push([d.lng, d.lat, Color.interpolate(
                        Color.Nippon.Ruri, Color.Nippon.Syozyohi, d.value
                    )]);
                }
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

    private onDragEnd(bounds: [[number, number], [number, number]]): void {
        this.bounds = bounds;
        this.redraw();
    }

    private onZoomEnd(bounds: [[number, number], [number, number]]): void {
        this.bounds = bounds;
        this.redraw();
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
        x = this.fx(x) - 0.5;
        y = this.fy(y) - 0.5;
        this.ctx!.fillRect(x, y, 1, 1);
    }

    public random(cx: number, cy: number, r: number, amount: number, gamma: number = 1): Array<{
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
                box.push({
                    lng: box[a].lng + _r * rate * Math.sin(angle),
                    lat: box[a].lat + _r * rate / 1.8 * Math.cos(angle),
                    value: Math.random()
                });
            }
        }

        return box;
    }
}
