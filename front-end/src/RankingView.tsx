/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-15 14:52:32 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-15 17:46:43
 */

import React, { Component } from "react";
import $ from "jquery";
import { TreeNode } from "./TypeLib";
import { System } from "./Globe";
import Color, { ColorThemes } from "./preference/Color";


export interface RankingViewProps {
    width: number;
    height: number;
    scaleType: "linear" | "sqrt" | "log" | "log2" | "log10" | "quick";
    displayOnMap: (id: number) => void;
};

export interface RankingViewState {
    before: Array<{
        id: number;
        value: number;
    }>;
    after: Array<{
        id: number;
        value: number;
    }>;
};


export class RankingView extends Component<RankingViewProps, RankingViewState, null> {
    private span: number;
    private width: number;

    public constructor(props: RankingViewProps) {
        super(props);
        this.state = {
            before: [],
            after: []
        };
        this.width = props.width - 17;
        this.span = 100;
    }

    public render(): JSX.Element {
        let contrasting: {[id: number]: {
            before: number;
            after: number;
        }} = {};
        this.state.before.forEach((leaf: {id: number; value: number;}, i: number) => {
            contrasting[leaf.id] = {
                before: i,
                after: i
            };
        });
        this.state.after.forEach((leaf: {id: number; value: number;}, i: number) => {
            contrasting[leaf.id].after = i;
        });

        return (
            <div ref="div" style={{
                width: this.props.width,
                height: this.props.height,
                overflowX: 'hidden',
                overflowY: 'scroll'
            }} >
                <svg width="100%" style={{
                    minHeight: this.props.height - 4,
                    height: this.state.before.length * 20,
                    marginBottom: -6
                }} >
                    {
                        this.state.before.map((leaf: {id: number; value: number;}, i: number) => {
                            const value: number = this.scale(leaf.value);
                            return (
                                <g key={ "g_" + leaf.id + "_before" }>
                                    <rect key="strip" x={ 21 } y={ 20 * i + 2 }
                                    width={ this.width / 2 - this.span / 2 - 40 } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.OuterBackground,
                                        fill: ColorThemes.NakiriAyame.Grey + '80'
                                    }} />
                                    <rect key="icon1" x={ 2 } y={ 20 * i + 2 } width={ 16 } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.Red,
                                        strokeWidth: 2,
                                        fill: ColorThemes.NakiriAyame.OuterBackground
                                    }} />
                                    <rect key="icon2" x={ this.width / 2 - this.span / 2 - 16 } y={ 20 * i + 2 }
                                    width={ 16 } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.InnerColor,
                                        strokeWidth: 2,
                                        fill: contrasting[leaf.id].before === contrasting[leaf.id].after
                                                ? ColorThemes.NakiriAyame.Green
                                                : ColorThemes.NakiriAyame.Red
                                    }}
                                    onClick={
                                        () => {
                                            this.props.displayOnMap(leaf.id);
                                        }
                                    } />
                                    <rect key="value" x={ 21 } y={ 20 * i + 2 }
                                    width={ (this.width / 2 - 40 - this.span / 2) * value } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.InnerColor,
                                        fill: System.colorF(value)
                                    }} />
                                </g>
                            );
                        })
                    }
                    {
                        this.state.after.map((leaf: {id: number; value: number;}, i: number) => {
                            const value: number = this.scale(leaf.value);
                            return (
                                <g key={ "g_" + leaf.id + "_after" }>
                                    <rect key="strip" x={ this.width / 2 + this.span / 2 + 19 } y={ 20 * i + 2 }
                                    width={ this.width / 2 - this.span / 2 - 40 } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.OuterBackground,
                                        fill: ColorThemes.NakiriAyame.Grey + '80'
                                    }} />
                                    <rect key="icon1" x={ this.width - 18 } y={ 20 * i + 2 } width={ 16 } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.Red,
                                        strokeWidth: 2,
                                        fill: ColorThemes.NakiriAyame.OuterBackground
                                    }} />
                                    <rect key="icon2" x={ this.width / 2 + this.span / 2 } y={ 20 * i + 2 }
                                    width={ 16 } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.InnerColor,
                                        strokeWidth: 2,
                                        fill: contrasting[leaf.id].before === contrasting[leaf.id].after
                                                ? ColorThemes.NakiriAyame.Green
                                                : ColorThemes.NakiriAyame.Red
                                    }}
                                    onClick={
                                        () => {
                                            this.props.displayOnMap(leaf.id);
                                        }
                                    } />
                                    <rect key="value"
                                    x={ this.width - 21 - (this.width / 2 - 40 - this.span / 2) * value } y={ 20 * i + 2 }
                                    width={ (this.width / 2 - 40 - this.span / 2) * value } height={ 16 }
                                    style={{
                                        stroke: ColorThemes.NakiriAyame.InnerColor,
                                        fill: System.colorF(value)
                                    }} />
                                </g>
                            );
                        })
                    }
                    <g key="lines">
                        {
                            Object.entries(contrasting).map((leaf: [string, {before: number; after: number;}]) => {
                                if (leaf[1].before === leaf[1].after) {
                                    return (
                                        <line key={ leaf[0] } ref={ leaf[0] }
                                        x1={ this.width / 2 - this.span / 2 + 2 } x2={ this.width / 2 + this.span / 2 - 2 }
                                        y1={ 20 * leaf[1].before + 10 } y2={ 20 * leaf[1].after + 10 }
                                        style={{
                                            stroke: ColorThemes.NakiriAyame.InnerColor,
                                            strokeWidth: 8,
                                            opacity: 0.6
                                        }}
                                        onMouseOver={
                                            () => {
                                                $(this.refs[leaf[0]]).css("opacity", 1);
                                            }
                                        }
                                        onMouseOut={
                                            () => {
                                                $(this.refs[leaf[0]]).css("opacity", 0.6);
                                            }
                                        }
                                        onClick={
                                            () => {
                                                this.props.displayOnMap(parseInt(leaf[0]));
                                            }
                                        } />
                                    );
                                } else {
                                    const x1: number = this.width / 2 - this.span / 2 + 2;
                                    const x2: number = this.width / 2 + this.span / 2 - 2;
                                    const y1: number = 20 * leaf[1].before + 10;
                                    const y2: number = 20 * leaf[1].after + 10;
                                    const distance: number = this.span / 3 * Math.abs(leaf[1].before - leaf[1].after)
                                                                / this.state.after.length;
                                    const d: string = `M${ x1 },${ y1 - 4 }`
                                                    + ` L${ x1 + distance },${ y1 - 4 }`
                                                    + ` C${ this.width / 2 },${ y1 - 4 }`
                                                    + ` ${ this.width / 2 },${ y2 - 4 }`
                                                    + ` ${ x2 - distance },${ y2 - 4 }`
                                                    + ` L${ x2 },${ y2 - 4 }`
                                                    + ` L${ x2 },${ y2 + 4 }`
                                                    + ` L${ x2 - distance },${ y2 + 4 }`
                                                    + ` C${ this.width / 2 },${ y2 + 4 }`
                                                    + ` ${ this.width / 2 },${ y1 + 4 }`
                                                    + ` ${ x1 + distance },${ y1 + 4 }`
                                                    + ` L${ x1 },${ y1 + 4 } Z`;
                                    return (
                                        <path key={ leaf[0] } ref={ leaf[0] }
                                        d = { d }
                                        style={{
                                            fill: Color.interpolate(
                                                ColorThemes.NakiriAyame.Grey,
                                                ColorThemes.NakiriAyame.Red
                                            ),
                                            stroke: 'none',
                                            fillOpacity: 0.6
                                        }}
                                        onMouseOver={
                                            () => {
                                                $(this.refs[leaf[0]]).css("fill-opacity", 1);
                                            }
                                        }
                                        onMouseOut={
                                            () => {
                                                $(this.refs[leaf[0]]).css("fill-opacity", 0.6);
                                            }
                                        }
                                        onClick={
                                            () => {
                                                this.props.displayOnMap(parseInt(leaf[0]));
                                            }
                                        } />
                                    );
                                }
                            })
                        }
                    </g>
                </svg>
            </div>
        );
    }

    public componentDidUpdate(): void {
        $(this.refs["div"]).animate({
            "scroll-top": 0
        });
    }

    private scale(value: number): number {
        return (
            this.props.scaleType === "linear" ? value
                    : this.props.scaleType === "log2" ? Math.log2(1 + value * 1)
                    : this.props.scaleType === "log" ? Math.log(1 + value * (Math.E - 1))
                    : this.props.scaleType === "log10" ? Math.log10(1 + value * 9)
                    // : this.props.scaleType === "quick" ? Math.pow(value, 1 / Math.log10(System.maxValue))
                    : this.props.scaleType === "quick" ? Math.pow(value, 0.34)
                    : Math.sqrt(value)
        );
    }

    private each(node: TreeNode): RankingViewState {
        let data: RankingViewState = {
            before: [],
            after: []
        };
        node.children.forEach((child: TreeNode) => {
            const part: RankingViewState = this.each(child);
            data.before.push(...part.before);
            data.after.push(...part.after);
        });
        if (node.children.length === 0) {
            let dataBefore: {
                value: number;
                count: number;
            } = {
                value: 0,
                count: 0
            };
            let dataAfter: {
                value: number;
                count: number;
            } = {
                value: 0,
                count: 0
            };
            node.containning!.forEach((id: number) => {
                const value: number = System.data[id].value;
                dataBefore.value += value;
                dataBefore.count++;
                if (System.active[id]) {
                    dataAfter.value += value;
                    dataAfter.count++;
                }
            });
            data.before.push({
                id: node.id,
                value: dataBefore.value / dataBefore.count / System.maxValue
            });
            data.after.push({
                id: node.id,
                value: dataAfter.value / dataAfter.count / System.maxValue
            });
        }
        return data;
    }

    public activate(node: TreeNode): void {
        if (node.children.length === 0 && !node.containning) {
            return;
        }
        let data: RankingViewState = this.each(node);
        data = {
            before: data.before.sort((a: {id: number; value: number;}, b: {id: number; value: number;}) => b.value - a.value),
            after: data.after.sort((a: {id: number; value: number;}, b: {id: number; value: number;}) => b.value - a.value)
        };
        this.setState(data);
    }
}
