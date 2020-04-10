/*
 * @Author: Antoine YANG 
 * @Date: 2020-04-09 23:11:41 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-09 23:15:03
 */

import React, { Component } from "react";

export interface ProcessProps {
    direction: "horizontal" | "vertical";
    width?: number;
};

export interface ProcessState {};


export class Process extends Component<ProcessProps, ProcessState, null> {
    private width: number;

    public constructor(props: ProcessProps) {
        super(props);
        this.width = this.props.width || 4;
    }

    public render(): JSX.Element {
        return (
            <svg key="process"
            width={ this.props.direction === "horizontal" ? "100%" : this.width }
            height={ this.props.direction === "horizontal" ? "100%" : this.width }
            style={{
                position: "relative",
                top: "-854.6px",
                left: 0,
                pointerEvents: "none"
            }} >
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{
                            stopColor: "",
                            stopOpacity: 1
                        }} />
                        <stop offset="90%" style={{
                            stopColor: "",
                            stopOpacity: 1
                        }} />
                        <stop offset="100%" style={{
                            stopColor: "",
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
        );
    }
}
