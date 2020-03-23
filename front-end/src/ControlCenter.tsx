/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-23 21:00:31
 */

import React, { Component } from "react";
import $ from "jquery";
import { ColorThemes } from "./preference/Color";
import { SyncButton } from "./prototypes/SyncButton";
import { System } from "./Globe";


export interface ControlCenterProps {
    width: number;
    height: number;
    padding: [number, number];
    reset: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    apply: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    randomSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
};

export interface ControlCenterState {
    filepath: string | null;
}

export class ControlCenter extends Component<ControlCenterProps, ControlCenterState, null> {
    public constructor(props: ControlCenterProps) {
        super(props);
        this.state = {
            filepath: null
        };
    }

    public render(): JSX.Element {
        return (
            <div id="ControlCenter"
            style={{
                width: this.props.width - this.props.padding[1] * 2,
                height: this.props.height - this.props.padding[0] * 2,
                padding: `${ this.props.padding[0] }px ${ this.props.padding[1] }px`
            }} >
                <div key="loadfile" style={{
                    width: this.props.width - this.props.padding[1] * 2 - 23,
                    height: '70px',
                    overflow: "hidden",
                    padding: '8px 10px',
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green
                }} >
                    <form style={{
                        width: "100%",
                        height: "100%"
                    }} >
                        <label>
                            Load dataset from...
                        </label>
                        <input type="file" ref="actualInput" accept=".csv" name="file"
                        onChange={
                            (event: React.ChangeEvent<HTMLInputElement>) => {
                                this.onSelected(
                                    event.target.value.split("fakepath\\")[1]
                                );
                            }
                        }
                        style={{
                            display: "none"
                        }} />
                        <div key="fakeInput"
                        style={{
                            margin: "12px 10px 10px",
                            height: "24px"
                        }} >
                            <label key="filename" ref="filename"
                            style={{
                                display: "inline-block",
                                height: "100%",
                                width: "54%",
                                textAlign: "right",
                                overflow: "hidden",
                                marginBottom: "-6px",
                                color: this.state.filepath
                                            ? "rgb(0,120,215)"
                                            : ColorThemes.NakiriAyame.Grey,
                                textDecorationLine: this.state.filepath
                                            ? "underline"
                                            : "none"
                            }} >
                                {
                                    this.state.filepath
                                        ? this.state.filepath
                                        : "No file selected"
                                }
                            </label>
                            <div key="spring" style={{
                                height: "100%",
                                width: "6%",
                                display: "inline-block"
                            }} />
                            <button type="button" ref="filebutton"
                            style={{
                                display: "inline-block",
                                height: "100%",
                                width: "16%"
                            }}
                            onClick={
                                () => {
                                    $(this.refs["actualInput"]).click();
                                }
                            } >
                                Open
                            </button>
                        </div>
                    </form>
                </div>
                <div key="params"
                style={{
                    width: this.props.width - this.props.padding[1] * 2 - 3,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green,
                    padding: "0 0 6px"
                }} >
                    <div key="1"
                    style={{
                        width: "30%",
                        height: "80%",
                        padding: "4px 10%",
                        display: "inline-block"
                    }} >
                        <label
                        style={{
                            height: "40%"
                        }} >
                            Density
                        </label>
                        <input name="density" type="number" min="10" max="100" defaultValue="50"
                        style={{
                            height: "40%",
                            width: "100%",
                            marginTop: "8px"
                        }} />
                    </div>
                    <div key="2"
                    style={{
                        width: "30%",
                        height: "80%",
                        padding: "4px 10%",
                        display: "inline-block"
                    }} >
                        <label
                        style={{
                            height: "40%"
                        }} >
                            N_Iter
                        </label>
                        <input name="n_iter" type="number" min="1" max="10" defaultValue="10"
                        style={{
                            height: "40%",
                            width: "100%",
                            marginTop: "8px"
                        }} />
                    </div>
                </div>
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
                                Load
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

    private onSelected(path: string): void {
        System.filepath = path;
        this.setState({
            filepath: path
        });
    }
}
