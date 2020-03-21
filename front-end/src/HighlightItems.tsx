/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-13 21:26:18 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-21 16:16:18
 */

import React, { Component } from "react";
import $ from "jquery";
import { Container } from "./prototypes/Container";
import { ColorThemes } from "./preference/Color";
import { System } from "./Globe";
import { DataItem, LISAtype } from "./TypeLib";


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
                    paddingTop: '0.4%'
                }}
                onMouseOut={
                    () => {
                        System.highlight("none");
                    }
                } >
                    <div key="2"
                    style={{
                        width: "25%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("HH");
                            }
                        } >
                            <div ref="prev_hh" key="prev"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                            <header key="label"
                            style={{
                                height: "29%",
								textTransform: "uppercase",
								fontWeight: "bold",
                                padding: "15% 6px 4px",
                                pointerEvents: "none",
                                background: System.colorF("HH")[0],
                                color: System.colorF("HH")[1],
                                letterSpacing: '-0.1px'
                            }} >
                                High - High
                            </header>
                            <div ref="next_hh" key="next"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                        </div>
                    </div>
                    <div key="3"
                    style={{
                        width: "25%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("LH");
                            }
                        } >
                            <div ref="prev_lh" key="prev"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                            <header key="label"
                            style={{
                                height: "29%",
								textTransform: "uppercase",
								fontWeight: "bold",
                                padding: "15% 6px 4px",
                                pointerEvents: "none",
                                background: System.colorF("LH")[0],
                                color: System.colorF("LH")[1]
                            }} >
                                Low - High
                            </header>
                            <div ref="next_lh" key="next"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                        </div>
                    </div>
                    <div key="4"
                    style={{
                        width: "25%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("LL");
                            }
                        } >
                            <div ref="prev_ll" key="prev"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                            <header key="label"
                            style={{
                                height: "29%",
								textTransform: "uppercase",
								fontWeight: "bold",
                                padding: "15% 6px 4px",
                                pointerEvents: "none",
                                background: System.colorF("LL")[0],
                                color: System.colorF("LL")[1]
                            }} >
                                Low - Low
                            </header>
                            <div ref="next_ll" key="next"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                        </div>
                    </div>
                    <div key="5"
                    style={{
                        width: "25%",
                        height: this.props.height,
                        float: "left"
                    }} >
                        <div
                        style={{
                            margin: "5%",
                            width: "90%",
                            height: "90%",
                            fontSize: "12px",
                            border: "1px solid " + ColorThemes.NakiriAyame.Grey
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("HL");
                            }
                        } >
                            <div ref="prev_hl" key="prev"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                            <header key="label"
                            style={{
                                height: "29%",
								textTransform: "uppercase",
								fontWeight: "bold",
                                padding: "15% 6px 4px",
                                pointerEvents: "none",
                                background: System.colorF("HL")[0],
                                color: System.colorF("HL")[1]
                            }} >
                                High - Low
                            </header>
                            <div ref="next_hl" key="next"
                            style={{
                                height: "20%",
								padding: "4%"
                            }} >
                                ???
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        );
    }

    public componentDidMount(): void {
        const LISA: Array<LISAtype> = ["HH", "LH", "LL", "HL"];

        const LISA2index: (type: LISAtype) => number = (t: LISAtype) => {
            return LISA.indexOf(t);
        };

        System.initialize = () => {
            let count: [number, number, number, number] = [0, 0, 0, 0];

            System.data.forEach((d: DataItem) => {
                count[LISA2index(d.type)] ++;
            });

            count.forEach((d: number, i: number) => {
                $(this.refs[
                    `prev_${ LISA[i].toLocaleLowerCase() }`
                ]).text(d);
            });
        };

        System.update = () => {
            let count: [number, number, number, number] = [0, 0, 0, 0];

            System.data.forEach((d: DataItem, i: number) => {
                if (System.active[i]) {
                    count[LISA2index(d.type)] ++;
                }
            });

            count.forEach((d: number, i: number) => {
                $(this.refs[
                    `next_${ LISA[i].toLocaleLowerCase() }`
                ]).text(d);
            });
        };
    }
}
