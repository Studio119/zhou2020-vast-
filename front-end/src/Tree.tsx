/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-02 15:29:12 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-02 18:00:16
 */

import React, { Component } from "react";
import $ from 'jquery';
import { TreeNode, Snapshot } from "./TypeLib";
import Color, { ColorThemes } from "./preference/Color";

export interface TreeProps {
    id?: string;
    width: number | string;
    height: number | string;
};

export class Tree extends Component<TreeProps, TreeNode, null> {
    private snapshots: {[id: number]: Snapshot.TreeNode};

    public constructor(props: TreeProps) {
        super(props);
        this.state = {
            id: 0,
            value: 0.5,
            level: 0,
            parent: null,
            children: []
        };
        this.snapshots = {};
    }

    public render(): JSX.Element {
        let maxLevel: number = 1;
        this.each("LRD", this.state, (n: TreeNode) => {
            maxLevel = Math.max(maxLevel, n.level + 1);
            n.leaves = 0;
            n.value = n.children.length ? 0 : n.value;
            n.children.forEach((child: TreeNode) => {
                n.leaves! += child.leaves!;
                n.value += n.children.length ? child.value : 0;
            });
            n.leaves = Math.max(n.leaves, 1);
            n.value /= Math.max(n.children.length, 1);
        });

        const unitWidthStep: number = 100 / this.state.leaves!;
        const unitHeightStep: number = 100 / maxLevel;

        this.snapshots = {};

        this.snapshots[this.state.id] = {
            x: 0, y: 0, width: 100, height: 100
        };

        this.each("DLR", this.state, (n: TreeNode) => {
            const parentSnapshot: Snapshot.TreeNode = this.snapshots[n.id];
            let offset: number = parentSnapshot.x;
            n.children.forEach((child: TreeNode) => {
                const width: number = unitWidthStep * child.leaves!;
                this.snapshots[child.id] = {
                    x: offset,
                    y: parentSnapshot.y + unitHeightStep,
                    width: width,
                    height: unitHeightStep * (maxLevel - child.level)
                };
                offset += width;
            })
        });

        return (
            <svg ref="svg" width={ this.props.width } height={ this.props.height }
            style={{
                marginBottom: '-6px'
            }} >
                {
                    this.toSVG(this.state, maxLevel)
                }
            </svg>
        );
    }

    public componentDidMount(): void {
        this.setState(
            this.random(5, {
                min: 2, max: 4, id: 0
            })
        );
    }

    private random(level: number, n_children: {
        min: number; max: number; id: number;
    }, parent: TreeNode | null = null): TreeNode {
        let node: TreeNode = {
            id: n_children.id++,
            value: Math.random(),
            level: parent ? parent.level + 1 : 0,
            parent: parent,
            children: []
        };
        if (--level) {
            for (let i: number = 0; i < Math.random() * (n_children.max - n_children.min) + n_children.min; i++) {
                node.children.push(
                    this.random(level, n_children, node)
                );
            }
        }
        return node;
    }

    private highlight(node: TreeNode, status: "on" | "off"): void {
        this.each("DLR", node, (n: TreeNode) => {
            $(this.refs["rect_" + n.id]).css(
                "fill", status === "on" ? Color.setLightness(
                                                ColorThemes.NakiriAyame.InnerBackground,
                                                0.2 / node.leaves! + 0.2 + (n.id === node.id ? 0.1 : 0)
                                            )
                                        : ColorThemes.NakiriAyame.InnerBackground
            );
        });
    }

    private toSVG(node: TreeNode, maxLevel: number): React.ReactNode | null | undefined {
        const value: number = node.value * 0.5;
        const innerHeight: number = 100 / maxLevel * value;

        return (
            <g className="TreeNodeContainer" key={ "g_" + node.id }>
                <rect className="TreeNode" ref={ "rect_" + node.id } key={ "rect_" + node.id }
                x={ this.snapshots[node.id].x + "%" } y={ this.snapshots[node.id].y + "%" }
                width={ this.snapshots[node.id].width + "%" } height={ this.snapshots[node.id].height + "%" }
                style={{
                    fill: ColorThemes.NakiriAyame.InnerBackground
                }}
                onMouseOver={
                    () => {
                        this.highlight(node, "on");
                    }
                }
                onMouseOut={
                    () => {
                        this.highlight(node, "off");
                    }
                } />
                <text className="TreeNode" key={ "label_" + node.id }
                x={ (this.snapshots[node.id].x + this.snapshots[node.id].width / 2) + "%" }
                y={ this.snapshots[node.id].y + 30 / maxLevel + "%" }
                textAnchor="middle"
                style={{
                    fill: ColorThemes.NakiriAyame.Green
                }} >
                    { node.id }
                </text>
                <rect className="TreeNodeValueBar" ref={ "value_" + node.id } key={ "value_" + node.id }
                x={ this.snapshots[node.id].x + "%" }
                y={ (this.snapshots[node.id].y + (100 / maxLevel * (1 - value))) + "%" }
                width={ this.snapshots[node.id].width + "%" }
                height={ innerHeight + "%" }
                style={{
                    fill: Color.interpolate(
                        Color.Nippon.Rurikonn, Color.Nippon.Karakurenai, value * 2
                    ),
                    stroke: Color.setLightness(
                        Color.interpolate(
                            Color.Nippon.Rurikonn, Color.Nippon.Karakurenai, value * 2
                        ), 0.2
                    ),
                    strokeWidth: 3
                }}
                onMouseOver={
                    () => {
                        this.highlight(node, "on");
                    }
                }
                onMouseOut={
                    () => {
                        this.highlight(node, "off");
                    }
                } />
                <rect className="TreeNode" key={ "border_" + node.id }
                x={ this.snapshots[node.id].x + "%" } y={ this.snapshots[node.id].y + "%" }
                width={ this.snapshots[node.id].width + "%" } height={ this.snapshots[node.id].height + "%" }
                style={{
                    fill: 'none',
                    stroke: ColorThemes.NakiriAyame.InnerColor,
                    strokeWidth: 2,
                    pointerEvents: 'none'
                }} />
                <g className="TreeNodeChildrenContainer" key={ "children_" + node.id }>
                    {
                        node.children.map((child: TreeNode) => {
                            return this.toSVG(child, maxLevel);
                        })
                    }
                </g>
            </g>
        );
    }

    /**
     * @private
     * @param {("DLR" | "LRD")} order 遍历顺序（前序/后序）
     * @param {TreeNode} node 遍历子树的根节点
     * @param {(n: TreeNode) => void} callback 执行的回调函数
     * @memberof Tree
     */
    private each(order: "DLR" | "LRD", node: TreeNode, callback: (n: TreeNode) => void): void {
        if (order === "DLR") {
            callback(node);
            node.children.forEach((n: TreeNode) => {
                this.each(order, n, callback);
            });
        } else {
            node.children.forEach((n: TreeNode) => {
                this.each(order, n, callback);
            });
            callback(node);
        }
    }
};
