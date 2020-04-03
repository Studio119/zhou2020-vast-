/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:37 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-30 01:51:24
 */
import React, { Component } from 'react';
import './App.css';
import { Map } from './Map';
import { Container } from './prototypes/Container';
import { ControlCenter } from './ControlCenter';
import { FileData, DataItem } from './TypeLib';
import { System } from './Globe';
import { MoranScatter } from './MoranScatter';
import { HighlightItems } from './HighlightItems';
import axios, { AxiosResponse } from 'axios';
import { CommandResult, CommandError } from './Command';
import { Loading } from './Loading';


class App extends Component<{}, {}, null> {
  private map?: Map;
  private sct?: MoranScatter;
  private scale: "linear" | "sqrt" | "log" | "log2" | "log10" | "quick" = "sqrt";

  public render(): JSX.Element {
    return (
      <div className="App">
        <Loading ref="loading" />
        <div style={{
          width: "386px",
          height: "866.5px",
          overflow: "hidden",
          display: "inline-block",
          margin: "0 -1px -1px 1px"
        }}>
          <Container theme="NakiriAyame" title="CONTROLLER">
            <ControlCenter width={ 386 } height={ 267 } padding={ [20, 20] }
            apply={ this.apply.bind(this) } randomSample={ this.randomSample.bind(this) }
            reset={ this.load.bind(this) } />
          </Container>
          <HighlightItems ref="hl" height={ 104 } />
          <MoranScatter ref="sct" id="sct" width={ 386 } height={ 374 } padding={ 12 } />
        </div>
        <Container theme="NakiriAyame" title="MAP VIEW" >
          <Map ref="map" id="map" minZoom={ 1 } zoom={ 7.5 } maxZoom={ 11 } center={[-0.21, 51.46]}
          width={ 1149 } height={ 837 } scaleType={ this.scale } filter={ true }
          mode="circle" />
        </Container>
      </div>
    );
  }

  public componentDidMount(): void {
    this.map = (this.refs["map"] as Map);
    this.sct = (this.refs["sct"] as MoranScatter);
  }

  private apply(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
    try {
      System.type = "sample";
      this.map!.closeSketcher();
      this.map!.load(System.data);
      this.sct!.load(System.data);
      (this.refs["loading"] as Loading).setState({
        show: true
      });
      setTimeout(() => {
        this.sct!.run((s: boolean) => {
          if (s) {
            resolve();
            (this.refs["loading"] as Loading).setState({
              show: false
            });
            System.update();
          } else {
            reject();
            (this.refs["loading"] as Loading).setState({
              show: false
            });
          }
        });
      }, 2000);
    } catch(err) {
      reject(err);
      (this.refs["loading"] as Loading).setState({
        show: false
      });
    }
  }

  private randomSample(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
    try {
      (this.refs["map"] as Map).closeSketcher();
      let target: number = 0;
      (this.refs["loading"] as Loading).setState({
        show: true
      });
      if ((window as any)['rate']) {
        target = (window as any)['rate'] as number;
      } else {
        System.active.forEach((value: boolean) => {
          if (value) {
            target++;
          }
        });
      }
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
      System.type = "sample";
      this.map!.load([]);
      this.sct!.load([]);
      setTimeout(() => {
        this.sct!.run((s: boolean) => {
          if (s) {
            this.fetch(() => {
              resolve();
              (this.refs["loading"] as Loading).setState({
                show: false
              });
              System.update();
            }, () => {
              reject();
              (this.refs["loading"] as Loading).setState({
                show: false
              });
            }, "sample");
          } else {
            reject();
            (this.refs["loading"] as Loading).setState({
              show: false
            });
          }
        });
      }, 2000);
    } catch(err) {
      reject(err);
      (this.refs["loading"] as Loading).setState({
        show: false
      });
    }
  }

  private async fetch(
    resolve: (value?: void | PromiseLike<void> | undefined) => void,
    reject: (reason?: any) => void,
    type: "dataset" | "sample"
  ): Promise<AxiosResponse<CommandResult<FileData.Origin|CommandError>>> {
    const p: Promise<AxiosResponse<CommandResult<FileData.Origin|CommandError>>> = axios.get(
      `/zs/${ (type === "sample" ? "temp" : System.filepath!).split(".").join("_dot") }`, {
          headers: 'Content-type:text/html;charset=utf-8'
      }
    );
    p.then((value: AxiosResponse<CommandResult<FileData.Origin|CommandError>>) => {
      if (value.data.state === "successed") {
        if (type === "dataset") {
          System.active = [];
          System.data = [];
          System.data = (value.data.value as FileData.Origin).map((item: DataItem) => {
            System.active.push(true);
            return {
              ...item
            };
          });
        } else {
          const list: Array<number> = Object.entries(
            System.active
          ).filter((value: [string, boolean]) => {
            return value[1];
          }).map((entry: [string, boolean]) => {
            return parseInt(entry[0]);
          });
          (value.data.value as FileData.Origin).forEach((item: DataItem, i: number) => {
            const index: number = list[i];
            System.data[index].target = {
              type: item.type,
              mx: item.mx,
              my: item.my
            };
          });
        }

        this.map!.load(System.data);

        if (type === "dataset") {
          System.initialize();
        }

        setTimeout(() => {
          System.type = type;
          this.sct!.load(System.data);
          resolve();
          (this.refs["loading"] as Loading).setState({
            show: false
          });
        }, 0);
      } else {
        reject();
        (this.refs["loading"] as Loading).setState({
          show: false
        });
      }
    });
    return p;
  }

  private load(resolve: (value?: void | PromiseLike<void> | undefined) => void, reject: (reason?: any) => void): void {
    if (System.filepath === null) {
      alert("Error: dataset is NOT loaded");
      reject();
      return;
    }

    System.type = "dataset";

    this.map!.load([]);
    this.sct!.load([]);
    System.active = [];
    (this.refs["loading"] as Loading).setState({
      show: true
    });

    this.fetch(resolve, reject, "dataset");
  }
}

export default App;


/***             无可奉告 一颗赛艇
 *  uJjYJYYLLv7r7vJJ5kqSFFFUUjJ7rrr7LLYLJLJ7
 *  JuJujuYLrvuEM@@@B@@@B@B@B@@0MG5Y7vLjYjJL
 *  JYjYJvr7XM@3B8GOOE8ZEEO8GqM8OBBBMu77LLJ7
 *  LJLY7ru@@@BOZ8O8NXFFuSkSu25X0OFZ8MZJ;vLv
 *  YvL7i5@BM8OGGqk22uvriiriii;r7LuSZXEMXrvr
 *  vv7iU@BMNkF1uY7v7rr;iiii:i:i:ii7JEPNBPir
 *  L7iL@BM8Xjuujvv77rr;ri;i;:iiiii:iLXFOBJ:
 *  7ri@B@MOFuUS2Y7L7777rii;:::::i:iirjPG@O:
 *  7:1B@BBOPjXXSJvrL7rr7iiii:i::::i;iv5MBB,
 *  r:0@BBM8SFPX2Y77rri::iirri:::::iii75O@G.
 *  7:SB@BBGqXPk0122UJL::i::r:::i:i;i:v2@Bk.
 *  ri:MB@BBEqEMGq2JLLL1u7.iX51u77LF27iSB@r,
 *  ri,v@B@MB8@qqNEqN1u:5B8BOFE0S7ii7qMB@F::
 *  ii,J80Eq1MZkqPPX5YkPE@B@iXPE52j7:vBjE7::
 *  ii:7MSqkS0PvLv7rrii0@L.Z1iLr::ir:rO,vi::
 *  ii::EZXPSkquLvii:iF@N:.,BUi7ri,::UY;r:::
 *  i::.2ONXqkPXS5FUUEOPP;..iSPXkjLYLLrr:::,
 *  :::,iMXNP0NPLriiLGZ@BB1P87;JuL7r:7ri:::,
 *  :::,.UGqNX0EZF2uUjUuULr:::,:7uuvv77::::.
 *  ::::..5OXqXNJ50NSY;i:.,,,:i77Yvr;v;,,::.
 *  :::,:.jOEPqPJiqBMMMO8NqP0SYLJriirv:.:,:.
 *  ,:,,,.,Zq0P0X7vPFqF1ujLv7r:irrr7j7.,,::.
 *  ,,,....0qk0080v75ujLLv7ri:i:rvj2J...,,,.
 *  ......8@UXqZEMNvJjr;ii::,:::7uuv...,.,,.
 *  .....B@BOvX88GMGk52vririiirJS1i.......,.
 *  .JEMB@B@BMvL0MOMMMO8PE8GPqSk2L:.........
 *  @B@@@B@M@B@L:7PGBOO8MOMOEP0Xri@B@Mk7,...
 *  B@B@BBMBB@B@0::rJP8MO0uvvu7..,B@B@B@B@27
 *  MMBM@BBB@B@B@Br:i,..:Lur:....7@OMMBM@B@@
 *  8OOMMMOMMMMBB@B:....,PZENNi..JBOZ8GMOOOO
 */
