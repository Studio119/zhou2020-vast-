/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-01 15:33:28 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-01 17:58:53
 */

import React, { Component } from "react";
import { ColorThemes } from "../preference/Color";

/**
 * Component Container: props required when instantiating a Container object
 * @export
 * @interface ContainerProps
 */
export interface ContainerProps {
    height?: string | number;
    innerStyle?: React.CSSProperties;
    outerStyle?: React.CSSProperties;
    selectableText?: boolean;
    theme: "NakiriAyame";
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
            <div className="ComponentContainer"
            style={{
                width: this.props.width || "auto",
                height: this.props.height || "auto",
                display: 'inline-block',
                overflow: 'hidden',
                background: ColorThemes[this.props.theme].InnerBackground,
                border: "1px solid " + ColorThemes[this.props.theme].Border,
                color: ColorThemes[this.props.theme].InnerColor,
                WebkitUserSelect: this.props.selectableText ? undefined : 'none',
                MozUserSelect: this.props.selectableText ? undefined : 'none',
                msUserSelect: this.props.selectableText ? undefined : 'none',
                userSelect: this.props.selectableText ? undefined : 'none',
                ...this.props.innerStyle
            }} >
                {
                    this.props.title &&
                    <div className="ComponentContainerHead"
                    style={{
                        width: this.props.width || "auto",
                        height: "auto",
                        background: ColorThemes[this.props.theme].OuterBackground,
                        borderBottom: "1px solid " + ColorThemes[this.props.theme].Border,
                        color: ColorThemes[this.props.theme].OuterColor,
                        padding: 3,
                        fontWeight: 'bold',
                        ...this.props.innerStyle
                    }}>
                        { this.props.title }
                    </div>
                }
                {
                    this.props.children
                }
            </div>
        );
    }
};
