/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:20 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-06 23:33:41
 */

import React, {Component} from 'react';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl';
import './MapBox.css';


export interface MapProps {
    accessToken: string;
    styleURL?: string;
    containerID: string;
    center: [number, number];
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    bounds?: [[number, number], [number, number]];
    pitch?: number;
    bearing?: number;
    onDragEnd: (bounds: [[number, number], [number, number]]) => void | null | undefined;
    onZoomEnd: (bounds: [[number, number], [number, number]]) => void | null | undefined;
    allowInteraction: boolean;
}


class MapBox extends Component<MapProps, {}, {}> {
    private map?: mapboxgl.Map | null;

    public constructor(props: MapProps) {
        super(props);
        this.map = null;
    }

    public render(): JSX.Element {
        return (
            <></>
        )
    }

    public componentDidMount(): void {
        mapboxgl.accessToken = this.props.accessToken;

        this.map = new mapboxgl.Map({
            attributionControl: false,
            interactive: this.props.allowInteraction,
            style: this.props.styleURL ? this.props.styleURL : 'mapbox://styles/mapbox/streets-v10',
            center: [this.props.center[0], this.props.center[1]],
            zoom: this.props.zoom,
            minZoom: this.props.minZoom ? this.props.minZoom : this.props.zoom - 3,
            maxZoom: this.props.maxZoom ? this.props.maxZoom : this.props.zoom + 3,
            pitch: this.props.pitch ? this.props.pitch : 0,
            bearing: this.props.bearing ? this.props.bearing : 0,
            container: this.props.containerID,
            maxBounds: this.props.bounds,
            refreshExpiredTiles: false
        });

        this.map.on('load', () => {
            $('.mapboxgl-canvas').css('opacity', '0.5').css('position', 'relative');//.css('top', '-472px').css('height', '466px');
            this.props.onDragEnd([
                [this.map!.getBounds().getNorth(), this.map!.getBounds().getSouth()],
                [this.map!.getBounds().getWest(), this.map!.getBounds().getEast()]
            ]);
            
            this.map!.on('zoomend', () => {
                this.props.onZoomEnd([
                    [this.map!.getBounds().getNorth(), this.map!.getBounds().getSouth()],
                    [this.map!.getBounds().getWest(), this.map!.getBounds().getEast()]
                ]);
            })
            .on('dragend', () => {
                this.props.onDragEnd([
                    [this.map!.getBounds().getNorth(), this.map!.getBounds().getSouth()],
                    [this.map!.getBounds().getWest(), this.map!.getBounds().getEast()]
                ]);
            });
        });
    }

    public getBounds(): mapboxgl.LngLatBounds {
        return this.map!.getBounds();
    }

    public fitBounds(target: MapBox): void {
        if (this.map && target) {
            this.map.fitBounds(target.getBounds());
        }
    }
}


export default MapBox;
