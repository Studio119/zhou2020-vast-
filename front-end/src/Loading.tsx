/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-24 14:04:05 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-12 15:29:14
 */

import React, { Component } from "react";
import $ from "jquery";


export interface LoadingState {
    show: boolean;
};


export class Loading extends Component<{}, LoadingState, {}> {
    public constructor(props: {}) {
        super(props);
        this.state = {
            show: false
        };
    }

    public render(): JSX.Element {
        return (
            <div ref="self"
            style={{
                width: "inherit",
                height: "inherit",
                background: "rgba(30,30,34,0.3)",
                display: this.state.show ? "unset" : "none",
                position: "absolute",
                zIndex: 10
            }} >
                <p ref="text"
                style={{
                    color: "rgb(156,220,254)",
                    fontWeight: "bold",
                    pointerEvents: "none",
                    textAlign: "center",
                    marginTop: "40vh",
                    fontSize: "8vh"
                }}>
                    Loading
                </p>
            </div>
        );
    }

    public componentDidUpdate(): void {
        $(this.refs["self"]).width(
            $(this.refs["self"]).parent().width()!
        );
        $(this.refs["self"]).height(
            $(this.refs["self"]).parent().height()!
        );
    }
}
