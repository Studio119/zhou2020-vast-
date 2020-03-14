/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-13 21:26:18 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-13 22:29:41
 */

import React, { Component } from "react";
import { Container } from "./prototypes/Container";
import { ColorThemes } from "./preference/Color";
import { System } from "./Globe";


export interface HighlightItemsProps {
    width?: number;
    height: number;
};

export interface HighlightItemsState {};

export class HighlightItems extends Component<HighlightItemsProps, HighlightItemsState, {}> {
    public render(): JSX.Element {
        return (
            <Container theme="NakiriAyame" title="Highlight..."
            width={ this.props.width ? this.props.width : "100%" }
            height="auto" >
                <div
                style={{
                    width: "96%",
                    margin: "2%",
                    height: this.props.height,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green,
                    paddingBottom: '1.4%'
                }}
                onMouseOut={
                    () => {
                        System.highlight("none");
                    }
                } >
                    <div key="1"
                    style={{
                        width: "20%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey,
                            color: ColorThemes.NakiriAyame.Red,
                            background: System.colorF("NS")
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("NS");
                            }
                        } >
                            <header
                            style={{
                                padding: "4px 6px",
								pointerEvents: "none"
                            }} >
                                Not Significant
                            </header>
                        </div>
                    </div>
                    <div key="2"
                    style={{
                        width: "20%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey,
                            background: System.colorF("HH")
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("HH");
                            }
                        } >
                            <header
                            style={{
                                padding: "4px 6px",
								pointerEvents: "none"
                            }} >
                                High-
                                High
                            </header>
                        </div>
                    </div>
                    <div key="3"
                    style={{
                        width: "20%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey,
                            background: System.colorF("LH")
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("LH");
                            }
                        } >
                            <header
                            style={{
                                padding: "4px 6px",
								pointerEvents: "none"
                            }} >
                                Low-
                                High
                            </header>
                        </div>
                    </div>
                    <div key="4"
                    style={{
                        width: "20%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey,
                            background: System.colorF("LL")
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("LL");
                            }
                        } >
                            <header
                            style={{
                                padding: "4px 6px",
								pointerEvents: "none"
                            }} >
                                Low-
                                <br />
                                Low
                            </header>
                        </div>
                    </div>
                    <div key="5"
                    style={{
                        width: "20%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey,
                            color: ColorThemes.NakiriAyame.Red,
                            background: System.colorF("HL")
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("HL");
                            }
                        } >
                            <header
                            style={{
                                padding: "4px 6px",
								pointerEvents: "none"
                            }} >
                                High-
                                Low
                            </header>
                        </div>
                    </div>
                </div>
            </Container>
        );
    }
}
