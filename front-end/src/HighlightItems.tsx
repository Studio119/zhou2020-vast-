/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-13 21:26:18 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-29 19:05:16
 */

import React, { Component } from "react";
import $ from "jquery";
import { Container } from "./prototypes/Container";
import { ColorThemes } from "./preference/Color";
import { System } from "./Globe";
import { DataItem } from "./TypeLib";


export interface HighlightItemsProps {
    width?: number;
    height: number;
};

export interface HighlightItemsState {
    before: {
        HH: number;
        LH: number;
        LL: number;
        HL: number;
    },
    after?: {
        HH: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
            all: number;
        };
        LH: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
            all: number;
        };
        LL: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
            all: number;
        };
        HL: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
            all: number;
        };
    }
};

export class HighlightItems extends Component<HighlightItemsProps, HighlightItemsState, {}> {
    public constructor(props: HighlightItemsProps) {
        super(props);
        this.state = {
            before: {
                HH: 0,
                LH: 0,
                LL: 0,
                HL: 0,
            }
        };
    }

    public render(): JSX.Element {
        let width: number = 0;
        let count: number = 0;

        const max: number = Math.max(...(
            this.state.after ? [
                this.state.after.HH.all,
                this.state.after.LH.all,
                this.state.after.LL.all,
                this.state.after.HL.all
            ] : [
                this.state.before.HH,
                this.state.before.LH,
                this.state.before.LL,
                this.state.before.LH
            ]
        ), 1);

        return (
            <Container theme="Caffee" title="Spatial Autocorrelation"
            width={ this.props.width ? this.props.width : "100%" }
            height="auto"
            style={{
                background: "rgb(252, 251, 252) none repeat scroll 0% 0%"
            }} >
                <div
                style={{
                    width: "96%",
                    padding: "2.1% 1.8%",
                    height: this.props.height,
                    background: ColorThemes.NakiriAyame.OuterBackground,
                    color: ColorThemes.NakiriAyame.InnerBackground
                }} >
                    <svg width="84%" height={ this.props.height }
                    onMouseOut={
                        () => {
                            System.highlight("none");
                        }
                    } >
                        <rect key="iconHH"
                        x={ "2%" } y={ 0 }
                        width={ "10%" } height = { "22%" }
                        style={{
                            fill: System.colorF("HH")[0]
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("HH");
                            }
                        } />
                        <text key="labelHH"
                        x={ "7%" } y={ "16%" }
                        textAnchor="middle"
                        style={{
                            fill: System.colorF("HH")[1],
                            pointerEvents: "none"
                        }} >
                            HH
                        </text>
                        <rect key="iconLH"
                        x={ "2%" } y={ "26%" }
                        width={ "10%" } height = { "22%" }
                        style={{
                            fill: System.colorF("LH")[0]
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("LH");
                            }
                        } />
                        <text key="labelLH"
                        x={ "7%" } y={ "42%" }
                        textAnchor="middle"
                        style={{
                            fill: System.colorF("LH")[1],
                            pointerEvents: "none"
                        }} >
                            LH
                        </text>
                        <rect key="iconLL"
                        x={ "2%" } y={ "52%" }
                        width={ "10%" } height = { "22%" }
                        style={{
                            fill: System.colorF("LL")[0]
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("LL");
                            }
                        } />
                        <text key="labelLL"
                        x={ "7%" } y={ "68%" }
                        textAnchor="middle"
                        style={{
                            fill: System.colorF("LL")[1],
                            pointerEvents: "none"
                        }} >
                            LL
                        </text>
                        <rect key="iconHL"
                        x={ "2%" } y={ "78%" }
                        width={ "10%" } height = { "22%" }
                        style={{
                            fill: System.colorF("HL")[0]
                        }}
                        onMouseOver={
                            () => {
                                System.highlight("HL");
                            }
                        } />
                        <text key="labelHL"
                        x={ "7%" } y={ "94%" }
                        textAnchor="middle"
                        style={{
                            fill: System.colorF("HL")[1],
                            pointerEvents: "none"
                        }} >
                            HL
                        </text>
                        {
                            this.state.after ? (
                                <>
                                    <rect key="rectHH-HH" ref="rectHH-HH"
                                    x={ "13%" } y={ 0 }
                                    width={
                                        (() => {
                                            const rate: number = this.state.after.HH.all / max;
                                            width = this.state.after.HH.HH
                                                / this.state.after.HH.all;
                                            count += width;
                                            return rate * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                this.state.after!.HH.HH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HH", "HH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                (100 * this.state.after!.HH.HH
                                                    / this.state.after!.HH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectHH-LH" ref="rectHH-LH"
                                    x={ 13 + (
                                        this.state.after.HH.all / max
                                    ) * 82 * count + "%" } y={ 0 }
                                    width={
                                        (() => {
                                            const rate: number = this.state.after.HH.all / max;
                                            width = this.state.after.HH.LH
                                                / this.state.after.HH.all;
                                            count += width;
                                            return rate * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                this.state.after!.HH.LH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HH", "LH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                (100 * this.state.after!.HH.HH
                                                    / this.state.after!.HH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectHH-LL" ref="rectHH-LL"
                                    x={ 13 + (
                                        this.state.after.HH.all / max
                                    ) * 82 * count + "%" } y={ 0 }
                                    width={
                                        (() => {
                                            width = this.state.after.HH.LL
                                                / this.state.after.HH.all;
                                            count += width;
                                            return (
                                                this.state.after.HH.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                this.state.after!.HH.LL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HH", "LL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                (100 * this.state.after!.HH.HH
                                                    / this.state.after!.HH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectHH-HL" ref="rectHH-HL"
                                    x={ 13 + (
                                        this.state.after.HH.all / max
                                    ) * 82 * count + "%" } y={ 0 }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return (
                                                this.state.after.HH.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                this.state.after!.HH.HL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HH", "HL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HH"]).text(
                                                (100 * this.state.after!.HH.HH
                                                    / this.state.after!.HH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />

                                    <rect key="rectLH-LH" ref="rectLH-LH"
                                    x={ "13%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LH.LH
                                                / this.state.after.LH.all;
                                            count += width;
                                            return (
                                                this.state.after.LH.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                this.state.after!.LH.LH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LH", "LH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                (100 * this.state.after!.LH.LH
                                                    / this.state.after!.LH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectLH-HH" ref="rectLH-HH"
                                    x={ 13 + (
                                        this.state.after.LH.all / max
                                    ) * 82 * count + "%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LH.HH
                                                / this.state.after.LH.all;
                                            count += width;
                                            return (
                                                this.state.after.LH.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                this.state.after!.LH.HH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LH", "HH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                (100 * this.state.after!.LH.LH
                                                    / this.state.after!.LH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectLH-LL" ref="rectLH-LL"
                                    x={ 13 + (
                                        this.state.after.LH.all / max
                                    ) * 82 * count + "%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LH.LL
                                                / this.state.after.LH.all;
                                            count += width;
                                            return (
                                                this.state.after.LH.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                this.state.after!.LH.LL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LH", "LL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                (100 * this.state.after!.LH.LH
                                                    / this.state.after!.LH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectLH-HL" ref="rectLH-HL"
                                    x={ 13 + (
                                        this.state.after.LH.all / max
                                    ) * 82 * count + "%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return (
                                                this.state.after.LH.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                this.state.after!.LH.HL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LH", "HL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LH"]).text(
                                                (100 * this.state.after!.LH.LH
                                                    / this.state.after!.LH.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />

                                    <rect key="rectLL-LL" ref="rectLL-LL"
                                    x={ "13%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LL.LL
                                                / this.state.after.LL.all;
                                            count += width;
                                            return (
                                                this.state.after.LL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                this.state.after!.LL.LL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LL", "LL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                (100 * this.state.after!.LL.LL
                                                    / this.state.after!.LL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectLL-HH" ref="rectLL-HH"
                                    x={ 13 + (
                                        this.state.after.LL.all / max
                                    ) * 82 * count + "%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LL.HH
                                                / this.state.after.LL.all;
                                            count += width;
                                            return (
                                                this.state.after.LL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                this.state.after!.LL.HH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LL", "HH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                (100 * this.state.after!.LL.LL
                                                    / this.state.after!.LL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectLL-LH" ref="rectLL-LH"
                                    x={ 13 + (
                                        this.state.after.LL.all / max
                                    ) * 82 * count + "%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LL.LH
                                                / this.state.after.LL.all;
                                            count += width;
                                            return (
                                                this.state.after.LL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                this.state.after!.LL.LH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LL", "LH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                (100 * this.state.after!.LL.LL
                                                    / this.state.after!.LL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectLL-HL" ref="rectLL-HL"
                                    x={ 13 + (
                                        this.state.after.LL.all / max
                                    ) * 82 * count + "%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return (
                                                this.state.after.LL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                this.state.after!.LL.HL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("LL", "HL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_LL"]).text(
                                                (100 * this.state.after!.LL.LL
                                                    / this.state.after!.LL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />

                                    <rect key="rectHL-HL" ref="rectHL-HL"
                                    x={ "13%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = this.state.after.HL.HL
                                                / this.state.after.HL.all;
                                            count += width;
                                            return (
                                                this.state.after.HL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                this.state.after!.HL.HL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HL", "HL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                (100 * this.state.after!.HL.HL
                                                    / this.state.after!.HL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectHL-HH" ref="rectHL-HH"
                                    x={ 13 + (
                                        this.state.after.HL.all / max
                                    ) * 82 * count + "%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = this.state.after.HL.HH
                                                / this.state.after.HL.all;
                                            count += width;
                                            return (
                                                this.state.after.HL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                this.state.after!.HL.HH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HL", "HH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                (100 * this.state.after!.HL.HL
                                                    / this.state.after!.HL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectHL-LH" ref="rectHL-LH"
                                    x={ 13 + (
                                        this.state.after.HL.all / max
                                    ) * 82 * count + "%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = this.state.after.HL.LH
                                                / this.state.after.HL.all;
                                            count += width;
                                            return (
                                                this.state.after.HL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                this.state.after!.HL.LH
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HL", "LH");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                (100 * this.state.after!.HL.HL
                                                    / this.state.after!.HL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                    <rect key="rectHL-LL" ref="rectHL-LL"
                                    x={ 13 + (
                                        this.state.after.HL.all / max
                                    ) * 82 * count + "%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return (
                                                this.state.after.HL.all / max
                                            ) * 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0],
                                        fillOpacity: 0.5
                                    }}
                                    onMouseOver={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                this.state.after!.HL.LL
                                            ).css("fill", "rgb(2,115,191)");
                                            System.highlight("HL", "LL");
                                        }
                                    }
                                    onMouseOut={
                                        () => {
                                            $(this.refs["num_HL"]).text(
                                                (100 * this.state.after!.HL.HL
                                                    / this.state.after!.HL.all
                                                ).toFixed(2) + "%"
                                            ).css("fill", "initial");
                                        }
                                    } />
                                </>
                            ) : (
                                <>
                                    <rect key="rectHH"
                                    x={ "13%" } y={ 0 }
                                    width={ `${ 82 * this.state.before.HH / max }%` }
                                    height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HH");
                                        }
                                    } />
                                    <rect key="rectLH"
                                    x={ "13%" } y={ "26%" }
                                    width={ `${ 82 * this.state.before.LH / max }%` }
                                    height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LH");
                                        }
                                    } />
                                    <rect key="rectLL"
                                    x={ "13%" } y={ "52%" }
                                    width={ `${ 82 * this.state.before.LL / max }%` }
                                    height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LL");
                                        }
                                    } />
                                    <rect key="rectHL"
                                    x={ "13%" } y={ "78%" }
                                    width={ `${ 82 * this.state.before.HL / max }%` }
                                    height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HL");
                                        }
                                    } />
                                </>
                            )
                        }
                    </svg>
                    <svg width="16%" height={ this.props.height } >
                        <text ref="num_HH"
                        x={ "50%" } y={ "16%" }
                        textAnchor="middle"
                        style={{
                            pointerEvents: "none"
                        }} >
                            { this.state.after
                                ? (
                                    100 * this.state.after.HH.HH
                                    / this.state.after.HH.all
                                ).toFixed(2) + "%"
                                : this.state.before.HH }
                        </text>
                        <text ref="num_LH"
                        x={ "50%" } y={ "42%" }
                        textAnchor="middle"
                        style={{
                            pointerEvents: "none"
                        }} >
                            { this.state.after
                                ? (
                                    100 * this.state.after.LH.LH
                                    / this.state.after.LH.all
                                ).toFixed(2) + "%"
                                : this.state.before.LH }
                        </text>
                        <text ref="num_LL"
                        x={ "50%" } y={ "68%" }
                        textAnchor="middle"
                        style={{
                            pointerEvents: "none"
                        }} >
                            { this.state.after
                                ? (
                                    100 * this.state.after.LL.LL
                                    / this.state.after.LL.all
                                ).toFixed(2) + "%"
                                : this.state.before.LL }
                        </text>
                        <text ref="num_HL"
                        x={ "50%" } y={ "94%" }
                        textAnchor="middle"
                        style={{
                            pointerEvents: "none"
                        }} >
                            { this.state.after
                                ? (
                                    100 * this.state.after.HL.HL
                                    / this.state.after.HL.all
                                ).toFixed(2) + "%"
                                : this.state.before.HL }
                        </text>
                    </svg>
                    <label
                    style={{
                        position: "relative",
                        left: 144,
                        top: -131,
                        textAlign: "end",
                        color: ColorThemes.NakiriAyame.Red,
                        fontSize: "90%"
                    }} >
                        {
                            this.state.after ? (() => {
                                let count: number = 0;
                                count += this.state.after.HH.all - this.state.after.HH.HH;
                                count += this.state.after.LH.all - this.state.after.LH.LH;
                                count += this.state.after.LL.all - this.state.after.LL.LL;
                                count += this.state.after.HL.all - this.state.after.HL.HL;
                                
                                return "Ambiguity: " + count;
                            })() : ""
                        }
                    </label>
                </div>
            </Container>
        );
    }

    public componentDidMount(): void {
        System.initialize = () => {
            System.send();
            
            let count: {
                HH: number;
                LH: number;
                LL: number;
                HL: number;
            } = {
                HH: 0,
                LH: 0,
                LL: 0,
                HL: 0
            };

            System.data.forEach((d: DataItem) => {
                count[d.type] ++;
            });

            this.setState({
                before: {
                    ...count
                },
                after: void 0
            });
        };

        System.update = () => {
            System.send();
            
            let count: {
                HH: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                    all: number;
                };
                LH: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                    all: number;
                };
                LL: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                    all: number;
                };
                HL: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                    all: number;
                };
            } = {
                HH: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0,
                    all: 0
                },
                LH: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0,
                    all: 0
                },
                LL: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0,
                    all: 0
                },
                HL: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0,
                    all: 0
                }
            };

            System.data.forEach((d: DataItem, i: number) => {
                if (System.active[i]) {
                    count[d.type][d.target!.type] ++;
                    count[d.type].all ++;
                }
            });

            this.setState({
                after: count
            });
        };
    }
}
