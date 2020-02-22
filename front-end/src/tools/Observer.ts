/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-22 17:02:50 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-22 18:24:25
 */


/**
 * 类型截取 - 匹配原接口中不定数量的键
 * @exports
 * @template T 原始类型
 */
export type Partial<T> = {
    [P in keyof T]?: T[P];
}


/**
 * 可连接观察者实例的对象类型
 * @export
 * @class Subscribable
 * @template T - 状态的数据类型
 */
export class Subscribable<T> {
    /**
     *Creates an instance of Subscribable.
     * @memberof Subscribable
     */
    public constructor(onInformed: (state: T) => void = () => {}, onSubscribe: (state: T) => void = () => {}, onUnsubcribe: (state: T) => void = () => {}) {
        this.onInformed = onInformed;
        this.onSubscribe = onSubscribe;
        this.onUnsubcribe = onSubscribe;
    }

    /**
     * 更改对应的监听逻辑
     * @param {("any" | "informed" | "subscribe" | "unsubscribe")} type
     * @param {(state: T) => void} callback
     * @returns {Subscribable<T>}
     * @memberof Subscribable
     */
    public on(type: "any" | "informed" | "subscribe" | "unsubscribe", callback: (state: T) => void): Subscribable<T> {
        if (type === "informed") {
            this.onInformed = callback;
        } else if (type === "subscribe") {
            this.onSubscribe = callback;
        } else if (type === "unsubscribe") {
            this.onUnsubcribe = callback;
        } else {
            this.onInformed = callback;
            this.onSubscribe = callback;
            this.onUnsubcribe = callback;
        }
        return this;
    }

    /**
     * 状态更新触发的监听
     * @memberof Subscribable
     */
    public onInformed: (state: T) => void;

    /**
     * 开始订阅触发的监听
     * @memberof Subscribable
     */
    protected onSubscribe: (state: T) => void;

    /**
     * 取消订阅触发的监听
     * @memberof Subscribable
     */
    protected onUnsubcribe: (state: T) => void;

    /**
     * 开始订阅
     * @param {Observer<T>} obsv
     * @returns {Subscribable<T>}
     * @memberof Subscribable
     */
    public subscribe(obsv: Observer<T>): Subscribable<T> {
        obsv.startObserving(this);
        return this;
    }

    /**
     * 取消订阅
     * @param {Observer<T>} obsv
     * @returns {Subscribable<T>}
     * @memberof Subscribable
     */
    public unsubscribe(obsv: Observer<T>): Subscribable<T> {
        obsv.stopObserving(this);
        return this;
    }
}


/**
 * 观察者类 - 用于订阅和应用不同对象间状态的更新
 * @export
 * @class Observer
 * @template T - 状态的数据类型
 */
export class Observer<T> {
    protected shouldUpdate: (prevState: T, nextState: T) => boolean;

    /**
     * 订阅者列表
     * @protected
     * @type {Array<Subscribable<T>>}
     * @memberof Observer
     */
    protected submitters: Array<Subscribable<T>>;

    /**
     * 当前状态
     */
    protected state: T;

    /**
     *Creates an instance of Observer.
    * @param {T} state 初始状态
    * @memberof Observer
    */
    public constructor(state: T) {
        this.shouldUpdate = () => true;
        this.submitters = [];
        this.state = state;
    }

    /**
     * 设定回调函数判断每次更新数据后是否通知订阅者
     * @param {(prevState: T, nextState: T) => boolean} callback
     * @returns {Observer<T>}
     * @memberof Observer
     */
    public changeShouldInform(callback: (prevState: T, nextState: T) => boolean): Observer<T> {
        this.shouldUpdate = callback;
        return this;
    }

    /**
     * 更新观察者的状态
     * @param {Partial<T>} nextState 新的状态
     * @memberof Observer
     */
    public setState(nextState: Partial<T>): void {
        const snapshot: T = { ...this.state };
        this.state = { ...this.state, ...nextState };
        if (this.shouldUpdate(snapshot, this.state)) {
            this.submitters.forEach((s: Subscribable<T>) => {
                s.onInformed(this.state);
            });
        }
    }

    /**
     * 订阅者开始接受订阅
     * @param {Subscribable<T>} s - 订阅者
     * @returns {Observer<T>}
     * @memberof Observer
     */
    public startObserving(s: Subscribable<T>): Observer<T> {
        this.submitters.push(s);
        return this;
    }

    /**
     * 订阅者终止接受订阅
     * @param {Subscribable<T>} s - 订阅者
     * @returns {Observer<T>}
     * @memberof Observer
     */
    public stopObserving(s: Subscribable<T>): Observer<T> {
        this.submitters = [];
        this.submitters.forEach((_s: Subscribable<T>) => {
            if (_s !== s) {
                this.submitters.push(_s);
            }
        });
        return this;
    }
}
