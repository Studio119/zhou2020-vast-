/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-06 23:50:39
 */

import React, { Component } from "react";
import { ColorThemes } from "./preference/Color";
import { SyncButton } from "./prototypes/SyncButton";


export interface ControlCenterProps {
    width: number;
    height: number;
    padding: [number, number];
    apply: () => Promise<void>;
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
                <div key="partA"
                style={{
                    width: this.props.width - this.props.padding[1] * 2,
                    height: 100,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green
                }} >
                    <header
                    style={{
                        padding: "6px"
                    }} >
                        Part A
                    </header>
                    <SyncButton theme="NakiriAyame" text={ "apply" } callback={ this.props.apply } />
                </div>
            </div>
        );
    }
}
