/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-13 21:43:42
 */

import React, { Component } from "react";
import { ColorThemes } from "./preference/Color";
import { SyncButton } from "./prototypes/SyncButton";


export interface ControlCenterProps {
    width: number;
    height: number;
    padding: [number, number];
    reset: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    apply: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    randomSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
};

export class ControlCenter extends Component<ControlCenterProps, {}, null> {
    public render(): JSX.Element {
        return (
            <div id="ControlCenter"
            style={{
                width: this.props.width - this.props.padding[1] * 2,
                height: this.props.height - this.props.padding[0] * 2,
                padding: `${ this.props.padding[0] }px ${ this.props.padding[1] }px`
            }} >
                <div key="Reset"
                style={{
                    width: this.props.width - this.props.padding[1] * 2,
                    height: 70,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green
                }} >
                    <header
                    style={{
                        padding: "6px"
                    }} >
                        Reset
                    </header>
                    <SyncButton theme="NakiriAyame" text={ "apply" }
                    executer={ this.props.reset } />
                </div>
                <div key="RapidSample"
                style={{
                    width: this.props.width - this.props.padding[1] * 2,
                    height: 70,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green
                }} >
                    <header
                    style={{
                        padding: "6px"
                    }} >
                        RapidSample
                    </header>
                    <SyncButton theme="NakiriAyame" text={ "apply" }
                    executer={ this.props.apply } />
                </div>
                <div key="randomSample"
                style={{
                    width: this.props.width - this.props.padding[1] * 2,
                    height: 70,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green
                }} >
                    <header
                    style={{
                        padding: "6px"
                    }} >
                        RandomSample
                    </header>
                    <SyncButton theme="NakiriAyame" text={ "sample" }
                    executer={ this.props.randomSample } />
                </div>
            </div>
        );
    }
}
