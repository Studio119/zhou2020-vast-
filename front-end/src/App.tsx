/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:37 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-15 17:52:46
 */
import React, { Component } from 'react';
import './App.css';
import { Map } from './Map';
import { Container } from './prototypes/Container';
import { Tree } from './Tree';
import { ControlCenter } from './ControlCenter';
import TaskQueue from './tools/TaskQueue';
import { FileData, TreeNode } from './TypeLib';
import { System } from './Globe';
import { RankingView } from './RankingView';

class App extends Component<{}, {}, null> {
  private task?: TaskQueue<null>;
  private map?: Map;
  private map2?: Map;
  private tree?: Tree;
  private scale: "linear" | "sqrt" | "log" | "log2" | "log10" | "quick" = "linear";

  public render(): JSX.Element {
    return (
      <div className="App">
        <TaskQueue<null> control={ null } ref="task" />
        <Container theme="NakiriAyame" title="CONTROLLER">
          <ControlCenter width={ 300 } height={ 400 } padding={ [20, 20] }
          apply={ this.apply.bind(this) } randomSample={ this.randomSample.bind(this) } />
        </Container>
        <Container theme="NakiriAyame" title="MAP VIEW" >
          <Map ref="map" id="map" minZoom={ 1 } zoom={ 4.7 } center={[-2.31, 53.56]}
          width={ 400 } height={ 400 } scaleType={ this.scale } filter={ false } />
        </Container>
        <Container theme="NakiriAyame" title="SAMPLED VIEW" >
          <Map ref="map2" id="map2" minZoom={ 1 } zoom={ 4.7 } center={[-2.31, 53.56]}
          width={ 400 } height={ 400 } scaleType={ this.scale } filter={ true } />
        </Container>
        <Container theme="NakiriAyame" title="RANKING VIEW">
          <RankingView ref="RankingView" width={ 435 } height={ 400 }
          scaleType={ this.scale } displayOnMap={ this.highlightPointsInGroup.bind(this) } />
        </Container>
        <br />
        <Container theme="NakiriAyame" title="TREE VIEW" width="100%">
          <Tree width={ "100%" } height={ 402 } ref="tree"
          scaleType={ this.scale } displayOnMap={ this.highlightPoints.bind(this) } rank={ this.rank.bind(this) } />
        </Container>
      </div>
    );
  }

  public componentDidMount(): void {
    this.map = (this.refs["map"] as Map);
    this.map2 = (this.refs["map2"] as Map);
    this.map2.synchronize(this.map);
    this.tree = (this.refs["tree"] as Tree);
    this.task = (this.refs["task"] as TaskQueue<null>);

    this.load();
  }

  private apply(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
    try {
      (this.refs["map"] as Map).closeSketcher();
      (this.refs["map2"] as Map).closeSketcher();
      // this.task!.open("./data/sampled_9.17_10070_1.0_0.json", (jsondata: FileData.Sampled) => {
      this.task!.open("./data/population_sampled3.json", (jsondata: FileData.Sampled) => {
        // this.task!.open("./data/industry_sampled.json", (jsondata: FileData.Sampled) => {
          System.active.fill(false, 0, System.active.length);
          for (const key in jsondata) {
            if (jsondata.hasOwnProperty(key)) {
              const list: Array<number> = jsondata[key];
              list.forEach((i: number) => {
                System.active[i] = true;
              });
            }
          }
          System.picked = Object.keys(jsondata).map((key: string) => parseInt(key));
        });
      // this.task!.open("./data/new_visualization_tree_dict_0.1_0.2_0.0025.json", (jsondata: FileData.Tree) => {
      this.task!.open("./data/tree3.json", (jsondata: FileData.Tree) => {
        this.tree!.load(jsondata);
        this.map2!.load(System.data);
        (this.refs["RankingView"] as RankingView).forceUpdate();
        resolve();
      });
    } catch(err) {
      reject(err);
    }
  }

  private rank(node: TreeNode): void {
    (this.refs["RankingView"] as RankingView).activate(node);
  }

  private highlightPoints(list: Array<number>): void {
    (this.refs["map"] as Map).highlight(list);
    (this.refs["map2"] as Map).highlight(list);
  }

  private highlightPointsInGroup(id: number): void {
    this.highlightPoints((this.refs["tree"] as Tree).getContaining(id));
  }

  private randomSample(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
    try {
      (this.refs["map"] as Map).closeSketcher();
      (this.refs["map2"] as Map).closeSketcher();
      let target: number = 0;
      System.active.forEach((value: boolean) => {
        if (value) {
          target++;
        }
      });
      System.active.fill(false, 0, System.active.length);
      let count: number = 0;
      while (count < target) {
        const r: number = Math.floor(Math.random() * System.active.length);
        if (System.active[r]) {
          continue;
        } else {
          System.active[r] = true;
          count++;
        }
      }
      System.picked = [];
      this.map2!.load(System.data);
      this.tree!.forceUpdate();
      resolve();
    } catch(err) {
      reject(err);
    }
  }

  private load(): void {
    // this.task!.open("./data/industry_data.json", (jsondata: FileData.Origin) => {
    this.task!.open("./data/population.json", (jsondata: FileData.Origin) => {
      System.active = [];
      System.data = jsondata.map((item: {lat: number;lng: number;value: number;}) => {
        System.active.push(true);
        return {
          ...item,
          label: NaN
        };
      });
      this.map!.load(System.data);
    });
  }
}

export default App;
