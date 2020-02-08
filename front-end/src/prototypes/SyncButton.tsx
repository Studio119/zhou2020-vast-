/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:29:28 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-07 00:17:08
 */

import React, { Component } from "react";
import Color, { ColorThemes, ColorThemeKey } from "../preference/Color";

export interface SyncButtonProps<T> {
    text: string | number;
    theme: ColorThemeKey;
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
                padding: "2px 6px",
                border: `2px solid ${ ColorThemes[this.props.theme].Grey }`,
                backgroundColor: Color.setLightness(
                    ColorThemes[this.props.theme].Red, this.state.busy || !this.state.active ? 0.8 : 0.4
                ),
                color: ColorThemes[this.props.theme].InnerColor,
                ...this.props.style
            }}
            onClick={ this.callback } >
                { this.props.text }
            </button>
        );
    }
}
