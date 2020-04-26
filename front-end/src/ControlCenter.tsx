/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-27 04:13:39
 */

import React, { Component } from "react";
import $ from "jquery";
import Color, { ColorThemes } from "./preference/Color";
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
                    width: this.props.width - this.props.padding[1] * 2 - 27,
                    overflow: "hidden",
                    padding: '4px 10px',
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
                        <SyncButton ref="refresh" theme="Caffee" text={ "⭮" } style={{
                            fontSize: "16px"
                        }} executer={ this.props.reset } />
                    </div>
                </div>
                <table
                style={{
                    borderTop: "1px solid " + ColorThemes.NakiriAyame.Grey,
                    borderBottom: "1px solid " + ColorThemes.NakiriAyame.Grey,
                    width: this.props.width - this.props.padding[1] * 2
                }} >
                    <tbody>
                        <tr key="names"
                        style={{
                            padding: "6px"
                        }} >
                            <th key="2" colSpan={ 2 } rowSpan={ 2 }
                            style={{
                                width: "60%",
                                padding: "1px 8px 4px",
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
                            <th key="3"
                            style={{
                                width: "20%",
                                padding: "2px 0"
                            }} >
                                Sample
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
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="Caffee" text={ "▶" }
                                    executer={ this.executer.bind(this) } />
                            </td>
                            <td key="4"
                            style={{
                                padding: "6px 0"
                            }} >
                                <SyncButton theme="Caffee" text={ "▶" } ref="btnBetter"
                                    executer={ this.props.better } />
                            </td>
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
                        min={ 0.02 } max={ 0.2 } step={ 0.02 } defaultValue={ 0.04 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `${ value.toFixed(2) }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.radius = parseFloat(value.toFixed(2));
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
            scrollTop: 32
        }, 120);
    }

    public componentDidUpdate(): void {
        const val: string = $("input[name=algo]:checked").val()! as string;
        
        $("#params").animate({
            scrollTop: val === "blue_noise_sampling" ? 0 : val === "this_paper" ? 12 : 32
        }, 120);
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
