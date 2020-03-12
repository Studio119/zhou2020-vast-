/*
 * @Author: Antoine YANG 
 * @Date: 2020-03-03 09:02:04 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-03 21:56:00
 */

import React, { Component } from "react";
import $ from "jquery";
import axios, { AxiosResponse } from "axios";


export interface CommandProps {};

export interface CommandState {
    log: Array<{
        text: string;
        type: 'normal' | 'error';
    }>;
};

export interface CommandResult<T=any> {
    command: string;
    state: "successed" | "failed";
    value: T;
};

export type STDerr = number | string;

export interface CommandError {
    cmd: string;
    code: number;
    killed: boolean;
    signal: any;
};


export class Command extends Component<CommandProps, CommandState, any> {
    private dragging: boolean;
    private offsetX: number = 0;
    private offsetY: number = 0;

    private static readonly commandList: Array<string> = [
        "cd <path>",
        "cd",
        "cls",
        "conda activate <venv>",
        "conda deactivate",
        "python <path>"
    ];

    private possibleCommand: Array<[string, string]>;
    private commandFlag: number = 0;

    private runnable: boolean = false;

    private logList: Array<{
        text: string;
        type: 'normal' | 'error';
    }>;

    public constructor(props: CommandProps) {
        super(props);
        this.state = {
            log: []
        };
        this.dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.logList = [];
        this.possibleCommand = [];
    }
    
    public render(): JSX.Element {
        return (
            <div ref="window"
            style={{
                width: '480px',
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 10000
            }} >
                <div ref="title" key="head"
                style={{
                    background: "white",
                    width: '100%',
                    fontSize: '16px',
                    textAlign: 'left',
                    color: "black"
                }}
                onDragStart={
                    () => false
                }
                onMouseDown={
                    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
                        this.dragging = true;
                        this.offsetX = event.clientX - parseInt($(this.refs['window'] as any).css('left')!)
                        this.offsetY = event.clientY - parseInt($(this.refs['window'] as any).css('top')!)
                    }
                } >
                    <header
                    style={{
                        padding: '6px 24px',
                        fontFamily: 'monospace',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        MozUserSelect: 'none',
                        WebkitUserSelect: 'none'
                    }}>
                        TSXython
                    </header>
                </div>
                <div key="body" ref="body"
                style={{
                    height: '260px',
                    overflowX: 'hidden',
                    overflowY: 'scroll',
                    background: "black",
                    fontFamily: 'monospace',
                    color: "white",
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '1.16px',
                    textAlign: 'left',
                    paddingTop: '6px',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    userSelect: 'none'
                }}
                onClick={
                    () => {
                        $(this.refs["input"]).show().focus();
                    }
                } >
                    <div ref="paper" key="left"
                    style={{
                        minHeight: '20px',
                        position: 'relative',
                        top: '0px',
                        wordBreak: 'break-all',
                        display: 'inline-block',
                        width: '460px',
                        marginRight: '-20px'
                    }} >
                        {
                            this.state.log.map((d: {text: string; type: 'normal' | 'error';}, index: number) => {
                                return (
                                    d.text === "\n"
                                        ?   <br key={ index } ref={ `log_${ index }` }
                                            style={{
                                                margin: '0px',
                                                padding: '2px 8px',
                                                fontSize: '14px',
                                                lineHeight: '20px'
                                            }} />
                                        :   <p key={ index } ref={ `log_${ index }` }
                                            style={{
                                                color: d.type === 'error' ? 'red' : 'white',
                                                margin: '0px',
                                                padding: '2px 8px',
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                letterSpacing: '1.16px',
                                                fontFamily: 'monospace'
                                            }} >
                                                { d.text }
                                            </p>
                                );
                            })
                        }
                        <input key="input" ref="input" maxLength={ 48 }
                        style={{
                            margin: '0',
                            paddingLeft: '8px',
                            fontSize: '14px',
                            lineHeight: '20px',
                            letterSpacing: '1.16px',
                            fontFamily: 'monospace',
                            display: 'none',
                            width: '556px',
                            border: 'none',
                            color: "rgb(156,220,254)",
                            background: "rgb(30,30,30)"
                        }}
                        onKeyDown={
                            (event: React.KeyboardEvent<HTMLInputElement>) => {
                                if (event.which === 9) {
                                    // Tab
                                    this.tabEvent();
                                    setTimeout(() => {
                                        $(this.refs["input"]).focus();
                                    }, 10);
                                } else if (event.which === 38) {
                                    // Up
                                    this.selectEvent("+");
                                } else if (event.which === 40) {
                                    // Down
                                    this.selectEvent("-");
                                }
                            }
                        }
                        onKeyPress={
                            (event: React.KeyboardEvent<HTMLInputElement>) => {
                                this.handleInput(event.which);
                            }
                        }
                        onKeyUp={
                            (event: React.KeyboardEvent<HTMLInputElement>) => {
                                if (event.which === 8) {
                                    this.handleInput(-1);
                                }
                            }
                        } />
                        <div key="help" ref="help"
                        style={{
                            pointerEvents: 'none',
                            width: '240px',
                            padding: '4px',
                            position: 'relative',
                            left: 0,
                            top: 0,
                            display: 'none',
                            fontSize: '13px'
                        }} >
                            <ul key="ul" ref="help_list"
                            style={{
                                listStyle: 'none',
                                margin: 0,
                                padding: '4px',
                                border: '1px solid rgb(69,69,69)',
                                background: 'rgb(37,37,38)',
                                color: 'rgb(225,225,225)',
                                wordBreak: 'break-word'
                            }} />
                        </div>
                        <div key="hold" ref="hold"
                        style={{
                            pointerEvents: 'none',
                            height: '60px',
                            width: '10px'
                        }} />
                    </div>
                </div>
            </div>
        );
    }

    public componentDidMount(): void {
        $('*').on('mouseup', () => {
            this.dragging = false;
        }).on('mousemove', (event: JQuery.MouseMoveEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) => {
            if (!this.dragging) {
                return;
            }
            let left: number = event.clientX - this.offsetX;
            left =
                left < 0
                    ? 0
                    : left + 480 > $(this.refs["window"]).parent().width()!
                        ? $(this.refs["window"]).parent().width()! - 480
                        : left;
            let top: number = event.clientY - this.offsetY;
            top =
                top < 0
                    ? 0
                    : top + 300 > $(this.refs["window"]).parent().height()!
                        ? $(this.refs["window"]).parent().height()! - 300
                        : top;
            $(this.refs['window'])
                .css('left', left + 'px')
                .css('top', top + 'px');
        }).on('click', () => {
            $(this.refs["input"]).val("").hide();
        });
        axios.get(
            `/command/_init`, {
                headers: 'Content-type:text/html;charset=utf-8'
            }
        );
    }

    private async run(cmd: string): Promise<boolean> {
        if (cmd === "cls") {
            this.logList = [];
            this.setState({
                log: this.logList
            });
            return false;
        }
        return await new Promise<boolean>((resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void) => {
                const str: string = cmd.split("/").join("_sep")
                                        .split(" ").join("_blc")
                                        .split(".").join("_dot");
                const p: Promise<AxiosResponse<CommandResult<string|CommandError>>> = axios.get(
                    `/command/${ str }`, {
                        headers: 'Content-type:text/html;charset=utf-8'
                    }
                );
                p.then((value: AxiosResponse<CommandResult<string|CommandError>>) => {
                    if (value.data.state === "successed") {
                        resolve(true);
                        this.logList.push({
                            text: value.data.value as string,
                            type: 'normal'
                        }, {
                            text: '\n',
                            type: 'normal'
                        });
                        this.setState({
                            log: this.logList
                        });
                    } else {
                        resolve(false);
                        if (typeof(value.data.value) === "string") {
                            this.logList.push({
                                text: decodeURI(value.data.value),
                                type: 'error'
                            }, {
                                text: '\n',
                                type: 'normal'
                            });
                        } else {
                            this.logList.push({
                                text: `Command failed with code ${
                                    (value.data.value as CommandError).code
                                }`,
                                type: 'error'
                            }, {
                                text: '\n',
                                type: 'normal'
                            });
                        }
                        this.setState({
                            log: this.logList
                        });
                    }
                }).catch((reason: any) => {
                    console.warn(reason);
                    resolve(false);
                });
            }
        );
    }

    private handleInput(key: number): void {
        setTimeout(() => {
            // Avoid KeyPressEvent from ignoring the last character
            const cmd: string = $(this.refs["input"]).val()! as string;
            if (key === 13) {
                // Enter
                if (this.runnable) {
                    this.logList.push({
                        text: cmd,
                        type: 'normal'
                    });
                    this.setState({
                        log: this.logList
                    });
                    this.run(cmd);
                }
                $(this.refs["input"]).val("");
                this.help(false);
            } else if ((key >= 65 && key <= 90) || (key >= 97 && key <= 122)) {
                // A-Z|a-z
                this.help(true);
            } else if (key === 32) {
                // space
                this.help(true);
            } else {
                // console.log(key);
                this.help(true);
            }
        }, 20);
    }

    private tabEvent(): void {
        if (this.commandFlag >= this.possibleCommand.length) {
            return;
        }
        $(this.refs["input"]).val(this.possibleCommand[this.commandFlag][0]);
        this.help(true);
    }

    private selectEvent(mode: "+" | "-"): void {
        if (this.possibleCommand.length <= 1) {
            for (let i: number = 0; i < this.possibleCommand.length; i++) {
                $(`li#possibleCommand_${ i }`).css("background", "none");
                $(`li#possibleCommand_${ i } span.tip`).hide();
            }
            return;
        }
        if (mode === "+") {
            this.commandFlag = (this.possibleCommand.length + this.commandFlag - 1) % this.possibleCommand.length;
        } else {
            this.commandFlag = (this.commandFlag + 1) % this.possibleCommand.length;
        }
        for (let i: number = 0; i < this.possibleCommand.length; i++) {
            if (i === this.commandFlag) {
                $(`li#possibleCommand_${ i }`).css("background", "rgb(6,47,74)");
                $(`li#possibleCommand_${ i } span.tip`).show();
            } else {
                $(`li#possibleCommand_${ i }`).css("background", "none");
                $(`li#possibleCommand_${ i } span.tip`).hide();
            }
        }

        $(this.refs["body"]).scrollTop(1e10);
    }

    private help(flag: boolean): void {
        this.runnable = false;
        this.commandFlag = 0;

        if (!flag) {
            $(this.refs["help"]).hide();
            return;
        } else {
            $(this.refs["help"]).show();
        }

        const words: string = $(this.refs["input"]).val()! as string;

        this.possibleCommand = [];

        if (words.length === 0) {
            $(this.refs["help_list"]).html("");
            return;
        }

        // Check if any command is tabbed, and its argument is being tabbed
        Command.commandList.forEach((str: string) => {
            if (this.runnable) {
                return;
            }
            const cmd: string = str.split("<")[0];
            let flag: boolean = true;
            for (let i: number = 0; i < this.possibleCommand.length; i++) {
                if (this.possibleCommand[i][0].replace(" ", "") === cmd.replace(" ", "")) {
                    flag = false;
                    break;
                }
            }
            if (!flag) {
                return;
            }
            if (str.includes("<")) {
                const param: string = words.replace(str.replace(/ <(.*)>/, "") + " ", "");
                if (words.startsWith(str.replace(/<(.*)>/, ""))) {
                    if (param.split(" ").length > 1) {
                        this.possibleCommand.push([
                            cmd,
                            "<li style='color: rgb(244,135,113);'>command "
                                + "<span style='color: rgb(220,205,121);'>"
                                + cmd
                                + "</span>"
                                + " requires 1 argument</li>"
                        ]);
                    } else if (param.length) {
                        this.possibleCommand.push([
                            cmd,
                            "<li>"
                                + "<span style='color: rgb(220,205,121);'>"
                                + cmd
                                + "</span>"
                                + " <span>("
                                + str.replace(">", "").split("<")[1]
                                + "=\"" + param
                                + "\")</span>"
                                + "</li>"
                        ]);
                        this.runnable = true;
                    } else {
                        this.possibleCommand.push([
                            cmd,
                            "<li>"
                                + "<span style='color: rgb(220,205,121);'>"
                                + cmd
                                + "</span>"
                                + " <span>("
                                + str.replace(">", "").split("<")[1]
                                + ")</span>"
                                + "</li>"
                        ]);
                    }
                }
            } else {
                const param: string = words.replace(str, "").replace(/ */, "");
                if (words.startsWith(str.replace(/<(.*)>/, ""))) {
                    if (param.length) {
                        this.possibleCommand.push([
                            cmd,
                            "<li style='color: rgb(244,135,113);'>command "
                                + "<span style='color: rgb(220,205,121);'>"
                                + cmd
                                + "</span>"
                                + " requires no argument</li>"
                        ]);
                    } else {
                        this.possibleCommand.push([
                            cmd,
                            "<li>"
                                + "<span style='color: rgb(220,205,121);'>"
                                + cmd
                                + "</span>"
                                + "</li>"
                        ]);
                        this.runnable = true;
                    }
                }
            }
        });

        // Else, check if any command is just tabbed
        if (this.possibleCommand.length === 0) {
            Command.commandList.forEach((str: string) => {
                const cmd: string = str.split("<")[0];
                if (cmd === words) {
                    this.possibleCommand.push([
                        cmd,
                        "<li>"
                            + "<span style='color: rgb(220,205,121);'>"
                            + cmd
                            + "</span>"
                            + " <span>("
                            + str.replace(">", "").split("<")[1]
                            + ")</span>"
                            + "</li>"
                    ]);
                }
            });
        }

        // Else, check if any command is being tabbed
        if (this.possibleCommand.length === 0) {
            Command.commandList.forEach((str: string) => {
                const cmd: string = str.split("<")[0];
                let flag: boolean = true;
                for (let i: number = 0; i < this.possibleCommand.length; i++) {
                    if (this.possibleCommand[i][0].replace(" ", "") === cmd.replace(" ", "")) {
                        flag = false;
                        break;
                    }
                }
                if (flag && str.startsWith(words)) {
                    this.possibleCommand.push([
                        cmd,
                        "<li>"
                            + "<span "
                            + "style='color: rgb(0,151,251); background: inherit;'>"
                            + cmd
                            + "</span>"
                            + " <span class='tip' style='display: none'>press tab to enter</span>"
                            + "</li>"
                    ]);
                }
            });
        }
        
        $(this.refs["help_list"]).html(
            this.possibleCommand.map(
                (o: [string, string], index: number) => o[1].replace("<li>", `<li id="possibleCommand_${ index }">`)
            ).join("")
        );

        if (this.possibleCommand.length === 0) {
            $(this.refs["help_list"]).html(
                "<li style='color: rgb(244,135,113);'>Unknown command</li>"
            );
        }
                
        $("li#possibleCommand_0").css("background", "rgb(6,47,74)");
        $("li#possibleCommand_0 span.tip").show();

        $(this.refs["body"]).scrollTop(1e10);
    }
};
