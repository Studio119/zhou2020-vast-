/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:29:28 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-21 17:01:57
 */

import React, { Component } from "react";


export interface SyncButtonProps<T> {
    text: string | number;
    style?: React.CSSProperties;
    executer: (resolve: (value?: T | PromiseLike<T> | undefined) => void, reject: (reason?: any) => void) => void;
};

export interface SyncButtonState {
    active: boolean;
    busy: boolean;
};

export class SyncButton<T=void> extends Component<SyncButtonProps<T>, SyncButtonState, null> {
    private callback: () => void;

    public constructor(props: SyncButtonProps<T>) {
        super(props);
        this.state = {
            active: true,
            busy: false
        };
        this.callback = async () => {
            if (this.state.active && !this.state.busy) {
                this.setState({
                    busy: true
                });
                this.forceUpdate();
                const p = new Promise<T>(this.props.executer);
                p.then(() => {
                    setTimeout(() => {
                        this.setState({
                            busy: false
                        });
                        this.forceUpdate();
                    }, 100);
                })
                .catch(err => {
                    console.error(err);
                    setTimeout(() => {
                        this.setState({
                            busy: false
                        });
                        this.forceUpdate();
                    }, 100);
                });
            }
        };
    }

    public render(): JSX.Element {
        return (
            <button
            style={{
                padding: "1px 6px 4px",
                pointerEvents: this.state.active && !this.state.busy ? "initial" : "none",
                opacity: this.state.active && !this.state.busy ? 1 : 0.4,
                ...this.props.style
            }}
            onClick={ this.callback } >
                { this.props.text }
            </button>
        );
    }
}
