/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-01 15:33:28 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-26 16:26:50
 */

import React, { Component } from "react";
import { ColorThemes, ColorThemeKey } from "../preference/Color";

/**
 * Component Container: props required when instantiating a Container object
 * @export
 * @interface ContainerProps
 */
export interface ContainerProps {
    height?: string | number;
    style?: React.CSSProperties;
    titleStyle?: React.CSSProperties;
    selectableText?: boolean;
    theme: ColorThemeKey;
    title?: string;
    width?: string | number;
};

/**
 * Component Container: A div container with optional formatters
 * @export
 * @class Container
 * @extends {Component<ContainerProps, any, React.ReactNode | null | undefined>}
 */
export class Container extends Component<ContainerProps, any, React.ReactNode | null | undefined> {
    public render(): JSX.Element {
        return (
            <div className="ComponentContainer" ref="container"
            style={{
                width: this.props.width || "auto",
                height: this.props.height || "auto",
                margin: '-0.8px',
                display: 'inline-block',
                overflow: 'hidden',
                background: ColorThemes[this.props.theme].InnerBackground,
                border: "1px solid " + ColorThemes[this.props.theme].Border,
                color: ColorThemes[this.props.theme].InnerColor,
                WebkitUserSelect: this.props.selectableText ? undefined : 'none',
                MozUserSelect: this.props.selectableText ? undefined : 'none',
                msUserSelect: this.props.selectableText ? undefined : 'none',
                userSelect: this.props.selectableText ? undefined : 'none',
                textAlign: 'center',
                ...this.props.style
            }} >
                {
                    this.props.title &&
                    <div className="ComponentContainerHead"
                    style={{
                        width: "100%",
                        height: "auto",
                        background: ColorThemes[this.props.theme].OuterBackground,
                        borderBottom: "1px solid " + ColorThemes[this.props.theme].Border,
                        color: ColorThemes[this.props.theme].OuterColor,
                        padding: "2.8px 0px",
                        fontWeight: 501,
                        fontSize: "106%",
                        letterSpacing: "0.7px",
                        textAlign: 'left',
                        ...this.props.titleStyle
                    }}>
                        <i style={{
                            display: 'inline-block',
                            width: '1em',
                            height: '100%'
                        }} />
                        { this.props.title }
                    </div>
                }
                {
                    <div className="ComponentContainerBody"
                    style={{
                        width: "100%",
                        height: "auto",
                        background: ColorThemes[this.props.theme].InnerBackground,
                        color: ColorThemes[this.props.theme].InnerColor,
                        padding: "0px",
                        ...this.props.style
                    }}>
                        { this.props.children }
                    </div>
                }
            </div>
        );
    }
};
