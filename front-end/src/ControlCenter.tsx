/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-25 21:29:11
 */

import React, { Component } from "react";
import $ from "jquery";
import { ColorThemes } from "./preference/Color";
import { SyncButton } from "./prototypes/SyncButton";
import { System } from "./Globe";
import ValueBar from "./tools/ValueBar";


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
                color: ColorThemes.NakiriAyame.InnerBackground,
                border: "none"
            }} >
                <div key="loadfile" style={{
                    width: this.props.width - this.props.padding[1] * 2 - 23,
                    overflow: "hidden",
                    padding: '2px 10px',
                    display: "flex"
                }} >
                    <form style={{
                        width: "86%",
                        textAlign: "left",
                        display: "inline-block"
                    }} >
                        <input type="file" ref="actualInput" accept=".csv" name="file"
                        onChange={
                            (event: React.ChangeEvent<HTMLInputElement>) => {
                                this.onSelected(
                                    event.target.value.split("fakepath\\")[1]
                                );
                                this.props.reset(() => {}, () => {});
                            }
                        }
                        style={{
                            display: "none"
                        }} />
                        <div key="fakeInput"
                        style={{
                            margin: "6px 10px",
                            textAlign: 'end'
                        }} >
                            <label key="filename" ref="filename"
                            style={{
                                display: "inline-block",
                                height: "100%",
                                width: "60%",
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
                                width: "22%"
                            }}
                            onClick={
                                () => {
                                    $(this.refs["actualInput"]).click();
                                }
                            } >
                                Load
                            </button>
                        </div>
                    </form>
                    <div style={{
                        textAlign: "left",
                        display: "inline-block",
                        margin: "1.2% auto"
                    }} >
                        <SyncButton ref="refresh" theme="NakiriAyame" text={ "⭮" } style={{
                            fontSize: "16px"
                        }} executer={ this.props.reset } />
                    </div>
                </div>
                <table
                style={{
                    width: this.props.width - this.props.padding[1] * 2
                }} >
                    <tbody>
                        <tr key="names"
                        style={{
                            padding: "6px"
                        }} >
                            <th key="2" colSpan={ 2 } rowSpan={ 2 }
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                width: "60%",
                                padding: "1px 8px 4px",
                                textAlign: 'left'
                            }} >
                                <label key="random_sampling"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="random_sampling"
                                    onChange={
                                        () => {
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                        }
                                    } />
                                    Random Sample
                                </label>
                                <label key="blue_noise_sampling"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="blue_noise_sampling"
                                    onChange={
                                        () => {
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                        }
                                    } />
                                    Blue Noise Sample
                                </label>
                                <label key="pure_z-order"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="pure_z-order"
                                    onChange={
                                        () => {
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                        }
                                    } />
                                    Z-order Sample
                                </label>
                                <label key="this_paper"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal'
                                }} >
                                    <input name="algo" type="radio" value="this_paper"
                                    onChange={
                                        () => {
                                            if (System.tail === "_o" || System.tail === "_ob") {
                                                (this.refs["btnBetter"] as SyncButton).setState({
                                                    active: true
                                                });
                                            } else {
                                                (this.refs["btnBetter"] as SyncButton).setState({
                                                    active: false
                                                });
                                            }
                                        }
                                    } />
                                    Our method
                                </label>
                            </th>
                            <th key="3"
                            style={{
                                width: "20%",
                                padding: "2px 0"
                            }} >
                                Apply
                            </th>
                            <th key="4"
                            style={{
                                width: "20%",
                                padding: "2px 0"
                            }} >
                                Update
                            </th>
                        </tr>
                        <tr key="buttons" >
                            <td key="3"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "▶" }
                                    executer={ this.executer.bind(this) } />
                            </td>
                            <td key="4"
                            style={{
                                border: "1.2px solid " + ColorThemes.NakiriAyame.InnerBackground,
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="NakiriAyame" text={ "▶" } ref="btnBetter"
                                    executer={ this.props.better } />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div key="params"
                style={{
                    width: this.props.width - this.props.padding[1] * 2 - 3,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.InnerBackground,
                    padding: "0",
                    textAlign: "start",
                    overflowX: "scroll",
                    height: "70px",
                    overflowY: "hidden"
                }} >
                    <div key="1" ref="radiusDiv"
                    style={{
                        width: "80px",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-block"
                    }} >
                        <ValueBar width={ 80 } height={ 18 }
                        min={ 0.02 } max={ 0.2 } step={ 0.02 } defaultValue={ 0.04 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `radius=${ value.toFixed(2) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.radius = parseFloat(value.toFixed(2));
                            }
                        } />
                    </div>
                    <div key="2" ref="alphaDiv"
                    style={{
                        width: "80px",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-block"
                    }} >
                        <ValueBar width={ 80 } height={ 18 }
                        min={ 0.1 } max={ 0.9 } step={ 0.05 } defaultValue={ 0.6 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `alpha=${ value.toFixed(2) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.alpha = parseFloat(value.toFixed(2));
                            }
                        } />
                    </div>
                    <div key="3" ref="rateDiv"
                    style={{
                        width: "120px",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-block"
                    }} >
                        <ValueBar width={ 120 } height={ 18 }
                        min={ 0.01 } max={ 1.00 } step={ 0.01 } defaultValue={ 0.10 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `sample_rate=${ value.toFixed(2) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.rate = parseFloat(value.toFixed(2));
                            }
                        } />
                    </div>
                    <div key="4" ref="iterDiv"
                    style={{
                        width: "54px",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-block"
                    }} >
                        <ValueBar width={ 54 } height={ 18 }
                        min={ 1 } max={ 10 } step={ 1 } defaultValue={ 1 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `n_iter=${ Math.floor(value) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.iter = Math.floor(value);
                            }
                        } />
                    </div>
                </div>
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

        if (val === "this_paper") {
            this.props.ourSample((value?: void | PromiseLike<void> | undefined) => {
                resolve(value);
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
