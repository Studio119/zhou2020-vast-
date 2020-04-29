/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-29 19:01:11
 */

import React, { Component } from "react";
import $ from "jquery";
import Color, { ColorThemes } from "./preference/Color";
import { SyncButton } from "./prototypes/SyncButton";
import { System } from "./Globe";
import ValueBar from "./tools/ValueBar";


export interface ControlCenterProps {
    width: number;
    padding: [number, number];
    ourSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    randomSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    zorderSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    blueNoiseSample: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    better: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
    reset: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
};

export interface ControlCenterState {}

export class ControlCenter extends Component<ControlCenterProps, ControlCenterState, null> {
    public constructor(props: ControlCenterProps) {
        super(props);
        this.state = {};
    }

    public render(): JSX.Element {
        return (
            <div id="ControlCenter"
            style={{
                width: this.props.width - this.props.padding[1] * 2,
                padding: `${ this.props.padding[0] }px ${ this.props.padding[1] }px`,
                background: ColorThemes.NakiriAyame.OuterBackground,
                color: ColorThemes.NakiriAyame.InnerBackground,
                border: "none"
            }} >
                <table
                style={{
                    borderBottom: "1px solid " + ColorThemes.NakiriAyame.Grey,
                    width: this.props.width - this.props.padding[1] * 2,
                    fontSize: "14.8px"
                }} >
                    <tbody>
                        <tr key="1"
                        style={{
                            padding: "6px"
                        }} >
                            <th key="1"
                            style={{
                                padding: "1px 8px",
                                textAlign: 'left'
                            }} >
                                <label key="random_sampling"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal',
                                    margin: '1px 0'
                                }} >
                                    <input name="algo" type="radio" value="random_sampling"
                                    onChange={
                                        () => {
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                            this.forceUpdate();
                                        }
                                    } />
                                    Random
                                </label>
                            </th>
                            <th key="2"
                            style={{
                                padding: "1px 8px",
                                textAlign: 'left'
                            }} >
                                <label key="pure_z-order"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal',
                                    margin: '1px 0'
                                }} >
                                    <input name="algo" type="radio" value="pure_z-order"
                                    onChange={
                                        () => {
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                            this.forceUpdate();
                                        }
                                    } />
                                    Z-order
                                </label>
                            </th>
                            <th key="="
                            style={{
                                padding: "1px 8px",
                                width: "5%"
                            }} />
                            <th key="3"
                            style={{
                                padding: "2px 0px 2px 6px"
                            }} >
                                <SyncButton text={ "Sample" }
                                    executer={ this.executer.bind(this) } style={{
                                        width: "60px",
										padding: "1px 0 4px"
                                    }} />
                            </th>
                            <th key="4"
                            style={{
                                padding: "2px 0px 2px 6px"
                            }} >
                                <SyncButton text={ "Reset" }
                                    executer={ this.props.reset.bind(this) } style={{
                                        width: "60px",
										padding: "1px 0 4px"
                                    }} />
                            </th>
                        </tr>
                        <tr key="2"
                        style={{
                            padding: "6px"
                        }} >
                            <th key="1"
                            style={{
                                padding: "1px 8px",
                                textAlign: 'left'
                            }} >
                                <label key="blue_noise_sampling"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal',
                                    margin: '1px 0'
                                }} >
                                    <input name="algo" type="radio" value="blue_noise_sampling"
                                    onChange={
                                        () => {
                                            (this.refs["btnBetter"] as SyncButton).setState({
                                                active: false
                                            });
                                            this.forceUpdate();
                                        }
                                    } />
                                    Blue Noise
                                </label>
                            </th>
                            <th key="2"
                            style={{
                                padding: "1px 8px",
                                textAlign: 'left'
                            }} >
                                <label key="this_paper"
                                style={{
                                    display: 'block',
                                    fontWeight: 'normal',
                                    margin: '1px 0'
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
                                            this.forceUpdate();
                                        }
                                    } />
                                    Ours
                                </label>
                            </th>
                            <th key="="
                            style={{
                                padding: "1px 8px",
                                width: "5%"
                            }} />
                            <th key="3"
                            style={{
                                padding: "2px 0px 2px 6px"
                            }} >
                                <SyncButton text={ "Optimize" } ref="btnBetter"
                                    executer={ this.props.better } style={{
                                        width: "60px",
										padding: "1px 0 4px"
                                    }} />
                            </th>
                            <th key="4"
                            style={{
                                padding: "2px 0px 2px 6px"
                            }} />
                        </tr>
                    </tbody>
                </table>
                <div key="params" id="params"
                style={{
                    width: this.props.width - this.props.padding[1] * 2 - 3,
                    background: Color.setLightness(ColorThemes.NakiriAyame.Grey, 0.96),
                    marginTop: "6px",
                    padding: "0",
                    textAlign: "start",
                    height: "96px",
                    overflow: "hidden scroll",
                    display: "grid"
                }} >
                    <div key="3" ref="rateDiv"
                    style={{
                        width: "100%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-flex",
                        opacity: (() => {
                            const val: string = $("input[name=algo]:checked").val()! as string;
                            return val !== "blue_noise_sampling" ? 1 : 0.4;
                        })(),
                        pointerEvents: (() => {
                            const val: string = $("input[name=algo]:checked").val()! as string;
                            return val !== "blue_noise_sampling" ? "unset" : "none";
                        })()
                    }} >
                        <ValueBar width={ 160 } height={ 18 } label="sample_rate"
                        min={ 0.01 } max={ 1.00 } step={ 0.01 } defaultValue={ 0.10 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `${ value.toFixed(2) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.rate = parseFloat(value.toFixed(2));
                            }
                        } />
                    </div>
                    <div key="2" ref="alphaDiv"
                    style={{
                        width: "100%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-flex",
                        opacity: (() => {
                            const val: string = $("input[name=algo]:checked").val()! as string;
                            return val === "this_paper" ? 1 : 0.4;
                        })(),
                        pointerEvents: (() => {
                            const val: string = $("input[name=algo]:checked").val()! as string;
                            return val === "this_paper" ? "unset" : "none";
                        })()
                    }} >
                        <ValueBar width={ 160 } height={ 18 } label="alpha"
                        min={ 0.1 } max={ 0.9 } step={ 0.05 } defaultValue={ 0.6 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `${ value.toFixed(2) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.alpha = parseFloat(value.toFixed(2));
                            }
                        } />
                    </div>
                    <div key="1" ref="radiusDiv"
                    style={{
                        width: "100%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-flex",
                        opacity: (() => {
                            const val: string = $("input[name=algo]:checked").val()! as string;
                            return val === "blue_noise_sampling" ? 1 : 0.4;
                        })(),
                        pointerEvents: (() => {
                            const val: string = $("input[name=algo]:checked").val()! as string;
                            return val === "blue_noise_sampling" ? "unset" : "none";
                        })()
                    }} >
                        <ValueBar width={ 160 } height={ 18 } label="radius"
                        min={ 0.005 } max={ 0.01 } step={ 0.001 } defaultValue={ 0.007 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `${ value.toFixed(3) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.radius = parseFloat(value.toFixed(2));
                            }
                        } />
                    </div>
                    <div key="4" ref="iterDiv"
                    style={{
                        width: "100%",
                        height: "80%",
                        padding: "4px 5%",
                        display: "inline-flex",
                        opacity: System.tail === "_o" || System.tail === "_ob"
                                            ? 1 : 0.4,
                        pointerEvents: System.tail === "_o" || System.tail === "_ob"
                                            ? "unset" : "none"
                    }} >
                        <ValueBar width={ 160 } height={ 18 } label="n_iter"
                        min={ 1 } max={ 10 } step={ 1 } defaultValue={ 1 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `${ Math.floor(value) }`
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

        $("#params").animate({
            scrollTop: 0
        }, 120);
    }

    public componentDidUpdate(): void {
        const val: string = $("input[name=algo]:checked").val()! as string;
        
        $("#params").animate({
            scrollTop: val === "blue_noise_sampling" ? 24 : 0
        }, 120);
    }

    private executer(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
        const val: string = $("input[name=algo]:checked").val()! as string;

        (this.refs["btnBetter"] as SyncButton).setState({
            active: false
        });

        $(this.refs["iterDiv"]).css("opacity", 0.4).css("pointerEvents", "none");

        if (val === "this_paper") {
            this.props.ourSample((value?: void | PromiseLike<void> | undefined) => {
                resolve(value);
                (this.refs["btnBetter"] as SyncButton).setState({
                    active: true
                });
                $(this.refs["iterDiv"]).css("opacity", 1).css("pointerEvents", "unset");
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
