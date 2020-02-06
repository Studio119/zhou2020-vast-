/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:29:28 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-07 00:17:08
 */

import React, { Component } from "react";
import Color, { ColorThemes, ColorThemeKey } from "../preference/Color";

export interface SyncButtonProps {
    text: string | number;
    theme: ColorThemeKey;
    style?: React.CSSProperties;
    callback: () => Promise<void>;
};

export interface SyncButtonState {
    active: boolean;
    busy: boolean;
};

export class SyncButton extends Component<SyncButtonProps, SyncButtonState, null> {
    private callback: () => Promise<void>;

    public constructor(props: SyncButtonProps) {
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
                const finishCode: void = await props.callback();
                setTimeout(() => {
                    this.setState({
                        busy: false
                    });
                }, 600);
                return finishCode;
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
