/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:37 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-01 17:57:37
 */
import React, { Component } from 'react';
import './App.css';
import { Map } from './Map';
// import TaskQueue from './tools/TaskQueue';
import { Container } from './prototypes/Container';

class App extends Component<{}, {}, {}> {
  public render(): JSX.Element {
    return (
      <div className="App">
        {/* <TaskQueue<null> ref="DataCenter" control={ null } /> */}
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
      </div>
    );
  }

  public componentDidMount(): void {
    // TODO: 加载数据
  }
}

export default App;
