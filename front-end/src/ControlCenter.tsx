/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-20 14:50:06
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
    ourSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    randomSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    zorderSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    blueNoiseSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    better: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
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
                padding: `${ this.props.padding[0] }px ${ this.props.padding[1] }px`,
                background: ColorThemes.NakiriAyame.OuterBackground,
                color: ColorThemes.NakiriAyame.InnerBackground
            }} >
                <div key="loadfile" style={{
                    width: this.props.width - this.props.padding[1] * 2 - 23,
                    height: '54px',
                    overflow: "hidden",
                    padding: '2px 10px',
                    border: "1.6px solid " + ColorThemes.NakiriAyame.InnerBackground
                }} >
                    <form style={{
                        width: "100%",
                        height: "100%",
                        textAlign: "left"
                    }} >
                        <label>
                            Import dataset from
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
                            margin: "2px 10px",
                            textAlign: 'end'
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
                                            : ColorThemes.NakiriAyame.Green,
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
                    border: "1.6px solid " + ColorThemes.NakiriAyame.InnerBackground,
                    padding: "0",
                    textAlign: "start",
                    overflowX: "scroll"
                }} >
                    <div key="1" ref="radiusDiv"
                    style={{
                        width: "20%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "none"
                    }} >
                        <label
                        style={{
                            height: "40%"
                        }} >
                            Radius
                        </label>
                        <input name="radius" type="number" min="0.02" max="0.2"
                        step="0.02" defaultValue="0.02"
                        style={{
                            height: "40%",
                            width: "100%",
                            marginTop: "2%"
                        }} />
                    </div>
                    <div key="2" ref="alphaDiv"
                    style={{
                        width: "20%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-block"
                    }} >
                        <label
                        style={{
                            height: "40%"
                        }} >
                            Alpha
                        </label>
                        <input name="alpha" type="number" min="1" max="10" defaultValue="10"
                        style={{
                            height: "40%",
                            width: "100%",
                            marginTop: "2%"
                        }} />
                    </div>
                    <div key="3" ref="rateDiv"
                    style={{
                        width: "30%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-block"
                    }} >
                        <label
                        style={{
                            height: "40%"
                        }} >
                            Sampling Rate
                        </label>
                        <input name="rate" type="number" min="0.01" max="1.00"
                        step="0.01" defaultValue="0.10"
                        style={{
                            height: "40%",
                            width: "100%",
                            marginTop: "2%"
                        }} />
                    </div>
                    <div key="4" ref="iterDiv"
                    style={{
                        width: "20%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "none"
                    }} >
                        <label
                        style={{
                            height: "40%"
                        }} >
                            N_iter
                        </label>
                        <input name="iter" type="number" min="1" max="10" defaultValue="1"
                        style={{
                            height: "40%",
                            width: "100%",
                            marginTop: "2%"
                        }} />
                    </div>
                </div>
                <table
                style={{
                    width: this.props.width - this.props.padding[1] * 2,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.InnerBackground
                }} >
                    <tbody>
                        <tr key="names"
                        style={{
                            padding: "6px"
                        }} >
                            <th key="1"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                width: "16%",
                                padding: "2px 0"
                            }} >
                                Load
                            </th>
                            <th key="2" colSpan={ 2 } rowSpan={ 2 }
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                width: "36%",
                                padding: 0,
                                textAlign: 'left'
                            }} >
                                <label key="this_paper"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="this_paper"
                                    onChange={
                                        () => {
                                            $(this.refs["radiusDiv"]).css("display", "none");
                                            $(this.refs["alphaDiv"]).css("display", "inline-block");
                                            $(this.refs["rateDiv"]).css("display", "inline-block");
                                            if (System.tail === "_o" || System.tail === "_ob") {
                                                $(this.refs["radiusDiv"]).css(
                                                    "display", "none"
                                                );
                                                $(this.refs["alphaDiv"]).css(
                                                    "display", "none"
                                                );
                                                $(this.refs["rateDiv"]).css(
                                                    "display", "none"
                                                );
                                                $(this.refs["iterDiv"]).css(
                                                    "display", "inline-block"
                                                );
                                                (this.refs["btnBetter"] as SyncButton).setState({
                                                    active: true
                                                });
                                            } else {
                                                $(this.refs["radiusDiv"]).css(
                                                    "display", "none"
                                                );
                                                $(this.refs["alphaDiv"]).css(
                                                    "display", "inline-block"
                                                );
                                                $(this.refs["rateDiv"]).css(
                                                    "display", "inline-block"
                                                );
                                                $(this.refs["iterDiv"]).css(
                                                    "display", "none"
                                                );
                                                (this.refs["btnBetter"] as SyncButton).setState({
                                                    active: false
                                                });
                                            }
                                        }
                                    } />
                                    Our method
                                </label>
                                <label key="random_sampling"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="random_sampling"
                                    onChange={
                                        () => {
                                            $(this.refs["radiusDiv"]).css("display", "none");
                                            $(this.refs["alphaDiv"]).css("display", "none");
                                            $(this.refs["rateDiv"]).css("display", "inline-block");
                                            $(this.refs["iterDiv"]).css("display", "none");
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                        }
                                    } />
                                    Random sp
                                </label>
                                <label key="blue_noise_sampling"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="blue_noise_sampling"
                                    onChange={
                                        () => {
                                            $(this.refs["radiusDiv"]).css("display", "inline-block");
                                            $(this.refs["alphaDiv"]).css("display", "none");
                                            $(this.refs["rateDiv"]).css("display", "none");
                                            $(this.refs["iterDiv"]).css("display", "none");
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                        }
                                    } />
                                    BNS
                                </label>
                                <label key="pure_z-order"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="pure_z-order"
                                    onChange={
                                        () => {
                                            $(this.refs["radiusDiv"]).css("display", "none");
                                            $(this.refs["alphaDiv"]).css("display", "none");
                                            $(this.refs["rateDiv"]).css("display", "inline-block");
                                            $(this.refs["iterDiv"]).css("display", "none");
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                        }
                                    } />
                                    Z-order
                                </label>
                            </th>
                            <th key="3"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                width: "24%",
                                padding: "2px 0"
                            }} >
                                Apply
                            </th>
                            <th key="4"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                width: "24%",
                                padding: "2px 0"
                            }} >
                                Optimize
                            </th>
                        </tr>
                        <tr key="buttons" >
                            <td key="1"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "o" }
                                    executer={ this.props.reset } />
                            </td>
                            <td key="3"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "o" }
                                    executer={ this.executer.bind(this) } />
                            </td>
                            <td key="4"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "o" } ref="btnBetter"
                                    executer={ this.props.better } />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    public componentDidMount(): void {
        $("input[name=algo]").eq(0).attr("checked", "checked");

        (this.refs["btnBetter"] as SyncButton).setState({
            active: false
        });
    }

    private onSelected(path: string): void {
        System.filepath = path;
        this.setState({
            filepath: path
        });
    }

    private executer(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
        const val: string = $("input[name=algo]:checked").val()! as string;

        (this.refs["btnBetter"] as SyncButton).setState({
            active: false
        });

        $(this.refs["iterDiv"]).css("display", "none");
        
        if (val === "this_paper") {
            this.props.ourSample((value?: void | PromiseLike<void> | undefined) => {
                resolve(value);
                $(this.refs["radiusDiv"]).css("display", "none");
                $(this.refs["alphaDiv"]).css("display", "none");
                $(this.refs["rateDiv"]).css("display", "none");
                $(this.refs["iterDiv"]).css("display", "inline-block");
                (this.refs["btnBetter"] as SyncButton).setState({
                    active: true
                });
            }, reject);
        } else if (val === "random_sampling") {
            this.props.randomSample(resolve, reject);
        } else if (val === "pure_z-order") {
            this.props.zorderSample(resolve, reject);
        } else if (val === "blue_noise_sampling") {
            this.props.blueNoiseSample(resolve, reject);
        }
    }
}
