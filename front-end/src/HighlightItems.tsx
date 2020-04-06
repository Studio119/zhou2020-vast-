/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-13 21:26:18 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-21 16:16:18
 */

import React, { Component } from "react";
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
        };
        LH: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
        };
        LL: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
        };
        HL: {
            HH: number;
            LH: number;
            LL: number;
            HL: number;
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

        return (
            <Container theme="NakiriAyame" title="Labels"
            width={ this.props.width ? this.props.width : "100%" }
            height="auto" >
                <div
                style={{
                    width: "98%",
                    padding: "2.7% 1.8%",
                    height: this.props.height,
                    border: "1.6px solid " + ColorThemes.NakiriAyame.Green,
                    background: ColorThemes.NakiriAyame.OuterBackground,
                    color: ColorThemes.NakiriAyame.InnerBackground
                }} >
                    <svg width="100%" height={ this.props.height }
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
                                    <rect key="rectHH-HH"
                                    x={ "13%" } y={ 0 }
                                    width={
                                        (() => {
                                            width = this.state.after.HH.HH / (
                                                this.state.after.HH.HH
                                                + this.state.after.HH.LH
                                                + this.state.after.HH.LL
                                                + this.state.after.HH.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HH", "HH");
                                        }
                                    } />
                                    <rect key="rectHH-LH"
                                    x={ 13 + 82 * count + "%" } y={ 0 }
                                    width={
                                        (() => {
                                            width = this.state.after.HH.LH / (
                                                this.state.after.HH.HH
                                                + this.state.after.HH.LH
                                                + this.state.after.HH.LL
                                                + this.state.after.HH.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HH", "LH");
                                        }
                                    } />
                                    <rect key="rectHH-LL"
                                    x={ 13 + 82 * count + "%" } y={ 0 }
                                    width={
                                        (() => {
                                            width = this.state.after.HH.LL / (
                                                this.state.after.HH.HH
                                                + this.state.after.HH.LH
                                                + this.state.after.HH.LL
                                                + this.state.after.HH.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HH", "LL");
                                        }
                                    } />
                                    <rect key="rectHH-HL"
                                    x={ 13 + 82 * count + "%" } y={ 0 }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HH", "HL");
                                        }
                                    } />

                                    <rect key="rectLH-HH"
                                    x={ "13%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LH.HH / (
                                                this.state.after.LH.HH
                                                + this.state.after.LH.LH
                                                + this.state.after.LH.LL
                                                + this.state.after.LH.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LH", "HH");
                                        }
                                    } />
                                    <rect key="rectLH-LH"
                                    x={ 13 + 82 * count + "%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LH.LH / (
                                                this.state.after.LH.HH
                                                + this.state.after.LH.LH
                                                + this.state.after.LH.LL
                                                + this.state.after.LH.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LH", "LH");
                                        }
                                    } />
                                    <rect key="rectLH-LL"
                                    x={ 13 + 82 * count + "%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LH.LL / (
                                                this.state.after.LH.HH
                                                + this.state.after.LH.LH
                                                + this.state.after.LH.LL
                                                + this.state.after.LH.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LH", "LL");
                                        }
                                    } />
                                    <rect key="rectLH-HL"
                                    x={ 13 + 82 * count + "%" } y={ "26%" }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LH", "HL");
                                        }
                                    } />

                                    <rect key="rectLL-HH"
                                    x={ "13%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LL.HH / (
                                                this.state.after.LL.HH
                                                + this.state.after.LL.LH
                                                + this.state.after.LL.LL
                                                + this.state.after.LL.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LL", "HH");
                                        }
                                    } />
                                    <rect key="rectLL-LH"
                                    x={ 13 + 82 * count + "%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LL.LH / (
                                                this.state.after.LL.HH
                                                + this.state.after.LL.LH
                                                + this.state.after.LL.LL
                                                + this.state.after.LL.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LL", "LH");
                                        }
                                    } />
                                    <rect key="rectLL-LL"
                                    x={ 13 + 82 * count + "%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = this.state.after.LL.LL / (
                                                this.state.after.LL.HH
                                                + this.state.after.LL.LH
                                                + this.state.after.LL.LL
                                                + this.state.after.LL.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LL", "LL");
                                        }
                                    } />
                                    <rect key="rectLL-HL"
                                    x={ 13 + 82 * count + "%" } y={ "52%" }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("LL", "HL");
                                        }
                                    } />

                                    <rect key="rectHL-HH"
                                    x={ "13%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = this.state.after.HL.HH / (
                                                this.state.after.HL.HH
                                                + this.state.after.HL.LH
                                                + this.state.after.HL.LL
                                                + this.state.after.HL.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HL", "HH");
                                        }
                                    } />
                                    <rect key="rectHL-LH"
                                    x={ 13 + 82 * count + "%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = this.state.after.HL.LH / (
                                                this.state.after.HL.HH
                                                + this.state.after.HL.LH
                                                + this.state.after.HL.LL
                                                + this.state.after.HL.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LH")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HL", "LH");
                                        }
                                    } />
                                    <rect key="rectHL-LL"
                                    x={ 13 + 82 * count + "%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = this.state.after.HL.LL / (
                                                this.state.after.HL.HH
                                                + this.state.after.HL.LH
                                                + this.state.after.HL.LL
                                                + this.state.after.HL.HL
                                            );
                                            count += width;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("LL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HL", "LL");
                                        }
                                    } />
                                    <rect key="rectHL-HL"
                                    x={ 13 + 82 * count + "%" } y={ "78%" }
                                    width={
                                        (() => {
                                            width = 1 - count;
                                            count = 0;
                                            return 82 * width + "%";
                                        })()
                                    } height = { "22%" }
                                    style={{
                                        fill: System.colorF("HL")[0]
                                    }}
                                    onMouseOver={
                                        () => {
                                            System.highlight("HL", "HL");
                                        }
                                    } />
                                </>
                            ) : (
                                <>
                                    <rect key="rectHH"
                                    x={ "13%" } y={ 0 }
                                    width={ "82%" } height = { "22%" }
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
                                    width={ "82%" } height = { "22%" }
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
                                    width={ "82%" } height = { "22%" }
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
                                    width={ "82%" } height = { "22%" }
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
                </div>
            </Container>
        );
    }

    public componentDidMount(): void {
        System.initialize = () => {
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
            let count: {
                HH: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                };
                LH: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                };
                LL: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                };
                HL: {
                    HH: number;
                    LH: number;
                    LL: number;
                    HL: number;
                };
            } = {
                HH: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0
                },
                LH: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0
                },
                LL: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0
                },
                HL: {
                    HH: 0,
                    LH: 0,
                    LL: 0,
                    HL: 0
                }
            };

            System.data.forEach((d: DataItem, i: number) => {
                if (System.active[i]) {
                    count[d.type][d.target!.type] ++;
                }
            });

            this.setState({
                after: count
            });
        };
    }
}
