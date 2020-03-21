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
                <table
                style={{
                    width: this.props.width - this.props.padding[1] * 2,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green
                }} >
                    <tbody>
                        <tr key="names"
                        style={{
                            padding: "6px"
                        }} >
                            <th key="1"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.Green,
                                width: "33.3%",
                                padding: "2px 0"
                            }} >
                                Reset
                            </th>
                            <th key="2"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.Green,
                                width: "33.3%",
                                padding: "2px 0"
                            }} >
                                Test
                            </th>
                            <th key="3"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.Green,
                                width: "33.3%",
                                padding: "2px 0"
                            }} >
                                RandomSP
                            </th>
                        </tr>
                        <tr key="buttons" >
                            <td key="1"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.Green,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "o" }
                                    executer={ this.props.reset } />
                            </td>
                            <td key="2"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.Green,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "o" }
                                    executer={ this.props.apply } />
                            </td>
                            <td key="3"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.Green,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "o" }
                                    executer={ this.props.randomSample } />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
