/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:37 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-02 18:00:01
 */
import React, { Component } from 'react';
import './App.css';
import { Map } from './Map';
import { Container } from './prototypes/Container';
import { Tree } from './Tree';

class App extends Component<{}, {}, {}> {
  public render(): JSX.Element {
    return (
      <div className="App">
        <Container theme="NakiriAyame" title="MAP VIEW">
          <Map ref="map" id="map" minZoom={ 1 } zoom={ 4.7 } center={[-2.31, 53.56]} width={ 400 } height={ 400 } />
        </Container>
        <Container theme="NakiriAyame" title="TEST WINDOW">
          <div
          style={{
            width: 300,
            height: 400
          }}>
            This is a container
          </div>
        </Container>
        <br />
        <Container theme="NakiriAyame" title="TREE VIEW" width="100%">
          <Tree width={ "100%" } height={ 320 } />
        </Container>
      </div>
    );
  }

  public componentDidMount(): void {
    // TODO: 加载数据
    (this.refs["map"] as Map).setState({
      // data: (this.refs["map"] as Map).random(-2.31, 53.56, 2, 5e5, 0.8)
      data: (this.refs["map"] as Map).random(-2.31, 53.56, 2, 1e3, 0.8)
    });
  }
}

export default App;
