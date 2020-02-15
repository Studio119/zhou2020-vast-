/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-02 15:29:12 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-15 18:24:13
 */

import React, { Component } from "react";
import $ from 'jquery';
import { TreeNode, Snapshot, FileData } from "./TypeLib";
import Color, { ColorThemes } from "./preference/Color";
import { System } from "./Globe";


export interface TreeProps {
    id?: string;
    width: number | string;
    height: number | string;
    scaleType: "linear" | "sqrt" | "log" | "log2" | "log10" | "quick";
    displayOnMap: (list: Array<number>) => void;
    rank: (node: TreeNode) => void;
};

export class Tree extends Component<TreeProps, TreeNode, null> {
    private snapshots: {[id: number]: Snapshot.TreeNode};
    private maxLevel: number;

    public constructor(props: TreeProps) {
        super(props);
        this.state = {
            id: 0,
            value: 0,
            level: 0,
            parent: null,
            children: [],
            leaves: 1
        };
        this.snapshots = {};
        this.maxLevel = 1;
    }

    public componentDidUpdate(): void {
        this.pick(System.picked);
    }

    public render(): JSX.Element {
        const unitWidthStep: number = 100 / this.state.leaves;
        const unitHeightStep: number = 100 / this.maxLevel;

        this.snapshots[this.state.id] = {
            x: 0, y: 0, width: 100, height: 100, node: this.state, value: 0
        };

        this.each("DLR", this.state, (n: TreeNode) => {
            const parentSnapshot: Snapshot.TreeNode = this.snapshots[n.id];
            let offset: number = parentSnapshot.x;
            n.children.forEach((child: TreeNode) => {
                const containing: Array<number> = this.getContaining(child.id);
                let value: number = 0;
                let count: number = 0;
                containing.forEach((id: number) => {
                    value += System.data[id].value;
                    count++;
                });
                const width: number = unitWidthStep * child.leaves;
                this.snapshots[child.id] = {
                    x: offset,
                    y: parentSnapshot.y + unitHeightStep,
                    width: width,
                    height: unitHeightStep * (this.maxLevel - child.level),
                    node: child,
                    value: value / count
                };
                offset += width;
            });
        });

        return (
            <>
                <svg ref="svg" width={ this.props.width } height={ this.props.height }
                style={{
                    marginBottom: '-6px'
                }} >
                    {
                        this.toSVG(this.state, this.maxLevel)
                    }
                    <g ref="detailView" key="detailView"
                    style={{
                        display: 'none',
                        pointerEvents: 'none'
                    }}>
                        <rect ref="detailTitle" key="detailTitle" x={ 0 } y={ 0 }
                        width={ 10 } height={ 24 }
                        style={{
                            fill: ColorThemes.NakiriAyame.OuterBackground,
                            opacity: 0.8,
                            stroke: ColorThemes.NakiriAyame.OuterColor,
                            strokeWidth: 2
                        }} />
                        <text ref="detailTitleText" key="detailTitleText" x={ 0 } y={ 0 }
                        style={{
                            fill: ColorThemes.NakiriAyame.Red
                        }} />
                        <rect ref="detailBody" key="detailBody" x={ 0 } y={ 0 }
                        width={ 10 } height={ 10 }
                        style={{
                            transform: "translateY(24px)",
                            fill: ColorThemes.NakiriAyame.Green,
                            opacity: 0.5,
                            stroke: ColorThemes.NakiriAyame.InnerBackground,
                            strokeWidth: 2
                        }} />
                        <text ref="detailBodyText" key="detailBodyText" x={ 0 } y={ 0 }
                        style={{
                            transform: "translateY(24px)",
                            fill: ColorThemes.NakiriAyame.InnerColor
                        }} />
                        <text ref="detailAccuText" key="detailAccuText" x={ 0 } y={ 0 }
                        style={{
                            transform: "translateY(24px)",
                            fill: ColorThemes.NakiriAyame.InnerColor
                        }} />
                    </g>
                </svg>
                <div ref="test" key="test"
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none'
                }} />
            </>
        );
    }

    public getContaining(id: number): Array<number> {
        return this.snapshots[id].node.containning || this.snapshots[id].node.children.map((child: TreeNode) => {
            return this.getContaining(child.id);
        }).flat()
    }

    private showDetails(id: number): void {
        const snapshot: Snapshot.TreeNode = this.snapshots[id];
        if (!snapshot) {
            return;
        }
        const containning: Array<number> = this.getContaining(id);
        let count: number = 0;
        let value: number = 0;
        containning.forEach((id: number) => {
            if (System.active[id]) {
                count++;
                value += System.data[id].value / System.maxValue;
            }
        });
        value /= count;
        const html: string = `<p>node_id=${ id }</p>`
            + `<p>n_containing=${ count }(${ (100 * count / containning.length).toFixed(2) }%)`
            + `, value=${ value.toFixed(3) }(${ this.snapshots[id].node.value.toFixed(3) })</p>`
            + `<p>accuracy=${ (this.getAccuracy(snapshot.node) * 100).toFixed(2) }%</p>`;
        const test: JQuery<React.ReactInstance> = $(this.refs["test"]);
        test.html(html);
        const g: JQuery<React.ReactInstance> = $(this.refs["detailView"]);
        const head: JQuery<React.ReactInstance> = $(this.refs["detailTitle"]);
        const body: JQuery<React.ReactInstance> = $(this.refs["detailBody"]);
        const headText: JQuery<React.ReactInstance> = $(this.refs["detailTitleText"]).text(`node_id=${ id }`);
        const bodyText: JQuery<React.ReactInstance> = $(this.refs["detailBodyText"]).text(
            `n_containing=${ count }(${ (100 * count / containning.length).toFixed(2) }%), `
            + `value=${ value.toFixed(3) }(${ this.snapshots[id].node.value.toFixed(3) })`
        );
        const accuText: JQuery<React.ReactInstance> = $(this.refs["detailAccuText"]).text(
            `accuracy=${ (this.getAccuracy(snapshot.node) * 100).toFixed(2) }%`
        );
        const width: number = test.width()! + 30;
        if (snapshot.x <= 50) {
            head.attr("x", snapshot.x + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", "translateX(0)")
                .attr("width", width);
            body.attr("x", snapshot.x + "%")
                .attr("y", snapshot.y + "%")
                .attr("width", width)
                .css("transform", "translateY(24px)")
                .attr("height", $(this.refs["svg"]).height()! / this.maxLevel - 24);
            headText.attr("x", snapshot.x + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", "translate(15px, 18px)");
            bodyText.attr("x", snapshot.x + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", "translate(15px, 44px)");
            accuText.attr("x", snapshot.x + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", "translate(15px, 70px)");
        } else {
            head.attr("x", snapshot.x + snapshot.width + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", `translateX(-${ width }px)`)
                .attr("width", width);
            body.attr("x", snapshot.x + snapshot.width + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", `translateX(-${ width }px) translateY(24px)`)
                .attr("width", width)
                .attr("height", $(this.refs["svg"]).height()! / this.maxLevel - 24);
            headText.attr("x", snapshot.x + snapshot.width + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", `translate(${ 15 - width }px, 18px)`);
            bodyText.attr("x", snapshot.x + snapshot.width + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", `translate(${ 15 - width }px, 44px)`);
            accuText.attr("x", snapshot.x + snapshot.width + "%")
                .attr("y", snapshot.y + "%")
                .css("transform", `translate(${ 15 - width }px, 70px)`);
        }
        g.show();
    }

    private hideDetails(): void {
        $(this.refs["detailView"]).hide();
    }

    public random(level: number, n_children: {
        min: number; max: number; id: number;
    }, parent: TreeNode | null = null): TreeNode {
        let leaves: number = 0;
        let node: TreeNode = {
            id: n_children.id++,
            value: Math.random(),
            level: parent ? parent.level + 1 : 0,
            parent: parent,
            children: [],
            leaves: 1
        };
        if (--level) {
            for (let i: number = 0; i < Math.random() * (n_children.max - n_children.min) + n_children.min; i++) {
                const child: TreeNode = this.random(level, n_children, node);
                leaves += child.leaves;
                node.children.push(child);
            }
        }
        node.leaves = Math.max(1, leaves);
        return node;
    }

    private highlight(node: TreeNode, status: "on" | "off"): void {
        if (status === "off") {
            this.hideDetails();
        }
        this.each("DLR", node, (n: TreeNode) => {
            for (let i: number = 0; i < System.picked.length; i++) {
                if (System.picked[i] === n.id) {
                    return;
                }
            }
            $(this.refs["rect_" + n.id]).css(
                "fill", status === "on" ? Color.setLightness(
                                                ColorThemes.NakiriAyame.InnerBackground,
                                                0.2 / node.leaves + 0.2 + (n.id === node.id ? 0.1 : 0)
                                            )
                                        : ColorThemes.NakiriAyame.InnerBackground
            );
        });
        if (status === "on") {
            this.showDetails(node.id);
        }
    }

    private toSVG(node: TreeNode, maxLevel: number): React.ReactNode | null | undefined {
        const value: number = (
            this.props.scaleType === "linear" ? node.value
                    : this.props.scaleType === "log2" ? Math.log2(1 + node.value * 1)
                    : this.props.scaleType === "log" ? Math.log(1 + node.value * (Math.E - 1))
                    : this.props.scaleType === "log10" ? Math.log10(1 + node.value * 9)
                    // : this.props.scaleType === "quick" ? Math.pow(value, 1 / Math.log10(System.maxValue))
                    : this.props.scaleType === "quick" ? Math.pow(node.value, 0.34)
                    : Math.sqrt(node.value)
        ) * 0.5;
        const innerHeight: number = 200 / maxLevel * value;

        return (
            <g className="TreeNodeContainer" key={ "g_" + node.id }>
                <rect className="TreeNode" ref={ "rect_" + node.id } key={ "rect_" + node.id }
                x={ this.snapshots[node.id].x + "%" } y={ this.snapshots[node.id].y + "%" }
                width={ this.snapshots[node.id].width + "%" } height={ this.snapshots[node.id].height + "%" }
                style={{
                    fill: ColorThemes.NakiriAyame.InnerBackground
                }}
                onClick={
                    () => {
                        this.props.rank(node);
                        this.props.displayOnMap(this.getContaining(node.id));
                    }
                }
                onDoubleClick={
                    () => {
                        this.props.rank(node);
                        this.props.displayOnMap([]);
                    }
                }
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
                <rect className="TreeNodeValueBar" ref={ "value_" + node.id } key={ "value_" + node.id }
                x={ this.snapshots[node.id].x + "%" }
                y={ (this.snapshots[node.id].y + (100 / maxLevel * (1 - value * 2))) + "%" }
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
                    strokeWidth: 3,
                    pointerEvents: 'none'
                }} />
                <text className="TreeNode" key={ "label_" + node.id }
                x={ (this.snapshots[node.id].x + this.snapshots[node.id].width / 2) + "%" }
                y={ this.snapshots[node.id].y + 30 / maxLevel + "%" }
                textAnchor="middle"
                style={{
                    fill: Color.setLightness(ColorThemes.NakiriAyame.Green, 0.7),
                    pointerEvents: 'none'
                }} >
                    {
                        $(this.refs["svg"]) && $(this.refs["svg"]).width() ?
                            node.id.toString().length * 1200 + 1000
                            >= this.snapshots[node.id].width * $(this.refs["svg"]).width()!
                                ? "." : node.id
                            : null
                    }
                </text>
                <rect className="TreeNode" key={ "border_" + node.id }
                x={ this.snapshots[node.id].x + "%" } y={ this.snapshots[node.id].y + "%" }
                width={ this.snapshots[node.id].width + "%" } height={ this.snapshots[node.id].height + "%" }
                style={{
                    fill: 'none',
                    stroke: ColorThemes.NakiriAyame.InnerColor,
                    strokeWidth: 2 / Math.log(node.level + 1.4),
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

    private getAccuracy(node: TreeNode): number {
        if (this.snapshots[node.id].accuracy) {
            return this.snapshots[node.id].accuracy!;
        }
        if (node.leaves === 1) {
            return 1;
        }
        let rankings: {[id: number]: {before: number; after: number;}} = {};
        this.each("DLR", node, (n: TreeNode) => {
            if (n.children.length === 0 && n.containning) {
                let valueAfter: number = 0;
                let countAfter: number = 0;
                n.containning.forEach((i: number) => {
                    if (System.active[i]) {
                        valueAfter += System.data[i].value;
                        countAfter++;
                    }
                });
                rankings[n.id] = {
                    before: this.snapshots[n.id].node.value,
                    after: valueAfter / countAfter / System.maxValue
                };
            }
        });
        const list: Array<number> = Object.keys(rankings).map((keyname: string) => parseInt(keyname));
        const total: number = list.length * (list.length - 1);
        let mistake: number = 0;
        for (let a: number = 0; a < list.length - 1; a++) {
            for (let b: number = a + 1; b < list.length; b++) {
                if (Math.sign(rankings[list[a]].before - rankings[list[b]].before)
                        !== Math.sign(rankings[list[a]].after - rankings[list[b]].after)) {
                    mistake++;
                }
            }
        }
        this.snapshots[node.id].accuracy = (1 - mistake / total);
        return (1 - mistake / total);
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

    private parseState(jsondata: FileData.Tree, parent: TreeNode | null): TreeNode {
        let leaves: number = 0;
        let node: TreeNode = {
            id: jsondata.id,
            value: 0,
            level: parent ? parent.level + 1 : 0,
            children: [],
            parent: parent,
            containning: jsondata.children.length ? undefined : jsondata.containedpoint,
            leaves: 1
        };
        jsondata.children.forEach(
            (child: FileData.Tree) => {
                const childNode: TreeNode = this.parseState(child, node);
                leaves += childNode.leaves;
                node.children.push(childNode);
            }
        );
        node.leaves = Math.max(leaves, 1);
        let value: number = 0;
        const containing: Array<number> = jsondata.containedpoint;
        containing.forEach((id: number) => {
            value += System.data[id].value / System.maxValue;
        });
        value /= containing.length;
        node.value = value;

        return node;
    }

    public load(jsondata: FileData.Tree): void {
        let tree: TreeNode = this.parseState(jsondata, null);

        this.maxLevel = 1;

        this.snapshots = {};

        this.each("DLR", tree, (n: TreeNode) => {
            this.maxLevel = Math.max(this.maxLevel, n.level + 1);
            this.snapshots[n.id] = {
                x: NaN,
                y: NaN,
                width: NaN,
                height: NaN,
                node: n,
                value: n.value
            };
        });

        this.setState(tree);
    }

    public pick(list: Array<number>): void {
        list.forEach((i: number) => {
            $(this.refs["rect_" + i]).css("fill", ColorThemes.NakiriAyame.Red);
        });
    }
};
