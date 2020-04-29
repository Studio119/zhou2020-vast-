/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:07:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-29 18:55:26
 */

import React, { Component } from "react";
import $ from "jquery";
import { ColorThemes } from "./preference/Color";
// import { SyncButton } from "./prototypes/SyncButton";
import { System } from "./Globe";


export interface DataOverviewProps {
    width: number;
    padding: [number, number];
    reset: (resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void) => void;
};

export interface DataOverviewState {
    filepath: string | null;
    count: number;
    countAfter: number;
}

export class DataOverview extends Component<DataOverviewProps, DataOverviewState, null> {
    public constructor(props: DataOverviewProps) {
        super(props);
        this.state = {
            filepath: null,
            count: 0,
            countAfter: 0
        };
    }

    public render(): JSX.Element {
        return (
            <div id="DataOverview"
            style={{
                width: this.props.width - this.props.padding[1] * 2,
                padding: `${ this.props.padding[0] }px ${ this.props.padding[1] }px`
                    + ` ${ this.props.padding[0] + 4 }px`,
                background: ColorThemes.NakiriAyame.OuterBackground,
                color: ColorThemes.NakiriAyame.InnerBackground,
                border: "none"
            }} >
                <div key="loadfile" style={{
                    width: this.props.width - this.props.padding[1] * 2 - 27,
                    overflow: "hidden",
                    padding: '6px 10px',
                    display: "flex",
                    height: "22.4px"
                }} >
                    <form style={{
                        textAlign: "left",
                        display: "flex"
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
                        <label key="label"
                        style={{
                            display: "inline-block",
                            height: "100%",
                            marginBottom: "-6px",
                            marginRight: "10px"
                        }} >
                            Dataset:
                        </label>
                        <label key="filename" ref="filename"
                        style={{
                            display: "inline-block",
                            height: "100%",
                            wordBreak: "break-all",
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
                        <button type="button" ref="filebutton"
                        style={{
                            display: "inline-block",
                            position: "absolute",
                            left: "277px",
                            fontSize: "14px"
                        }}
                        onClick={
                            () => {
                                $(this.refs["actualInput"]).click();
                            }
                        } >
                            Import
                        </button>
                    </form>
                    {/* <div key="3" style={{
                        display: "inline-block",
                        fontSize: "15px",
                        position: "absolute",
                        left: "352px"
                    }} >
                        <SyncButton ref="refresh" text={ "⭮" } executer={ this.props.reset }
                        style={{
                            padding: "0 3px"
                        }} />
                    </div> */}
                </div>
                <table
                style={{
                    borderTop: "1px solid " + ColorThemes.NakiriAyame.Grey,
                    padding: "0 10px",
                    width: this.props.width - this.props.padding[1] * 2,
                    fontSize: "14.5px"
                }} >
                    <tbody>
                        <tr key="1">
                            <td key="1" style={{
                                width: "140px",
                                textAlign: "left"
                            }} >
                                Original Data Size:
                            </td>
                            <td key="spring" style={{
                                display: "inline-block",
                                width: "110px"
                            }} />
                            <td key="2"
                            style={{
                                display: "inline-block",
                                textAlign: "left",
                                width: "80px"
                            }} >
                                { this.state.count }
                            </td>
                        </tr>
                        <tr key="2">
                            <td key="1" style={{
                                width: "140px",
                                textAlign: "left"
                            }} >
                                Sampled Data Size:
                            </td>
                            <td key="spring" style={{
                                display: "inline-block",
                                width: "110px"
                            }} />
                            <td key="2"
                            style={{
                                display: "inline-block",
                                textAlign: "left",
                                width: "80px"
                            }} >
                                {
                                    this.state.filepath && System.tail
                                        ? this.state.countAfter : "-"
                                }
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    public componentDidMount(): void {
        System.send = () => {
            this.setState({
                count: System.data.length,
                countAfter: System.data.filter(d => d.target).length
            });
        };
    }

    private onSelected(path: string): void {
        System.filepath = path;
        this.setState({
            filepath: path
        });
    }
}
