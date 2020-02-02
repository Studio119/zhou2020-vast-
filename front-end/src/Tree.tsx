/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-02 15:29:12 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-02 18:00:16
 */

import React, { Component } from "react";
import { TreeNode } from "./TypeLib";
import { Container } from "./prototypes/Container";

export interface TreeProps {
    id?: string;
    width: number | string;
    height: number | string;
};

interface TreeNodeSnapshot {
    width: number | string;
};

export class Tree extends Component<TreeProps, TreeNode, null> {
    public constructor(props: TreeProps) {
        super(props);
        this.state = {
            id: 0,
            value: 0.5,
            level: 0,
            parent: null,
            children: []
        };
    }

    public render(): JSX.Element {
        return (
            <Container theme="NakiriAyame" width={ this.props.width } height={ this.props.height }>
                {
                    this.toXML(this.state, {
                        width: "100%"
                    })
                }
            </Container>
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

    private toXML(node: TreeNode, snapshot: TreeNodeSnapshot): React.ReactNode | null | undefined {
        return (
            <Container theme="NakiriAyame" title={ node.id.toString() } key={ node.id }
            width={ snapshot.width } height={ "100%" }>
                <p
                style={{
                    margin: "auto",
                    height: node.children.length ? "" : "100%"
                }}>
                    { node.value.toFixed(3) }
                </p>
                {
                    node.children.map((n: TreeNode) => {
                        return this.toXML(n, {
                            width: `${ 100 / node.children.length }%`
                        });
                    })
                }
            </Container>
        );
    }
};
