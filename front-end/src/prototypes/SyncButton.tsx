/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-05 12:29:28 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-05 13:43:22
 */

import React, { Component } from "react";
import { ColorThemes, ColorThemeKey } from "../preference/Color";

export interface SyncButtonProps {
    text: string | number;
    theme: ColorThemeKey;
    style?: React.CSSProperties;
}

export class SyncButton extends Component<SyncButtonProps, {}, null> {
    public render(): JSX.Element {
        return (
            <button
            style={{
                padding: "2px 6px",
                border: `2px solid ${ ColorThemes[this.props.theme].Grey }`,
                backgroundColor: ColorThemes[this.props.theme].Red,
                color: ColorThemes[this.props.theme].InnerColor,
                ...this.props.style
            }} >
                { this.props.text }
            </button>
        );
    }
}
