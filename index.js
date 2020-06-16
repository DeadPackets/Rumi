import {AppRegistry} from 'react-native';
import React, {Component} from 'react';
import {name as appName} from './app.json';
import NetInfo from '@react-native-community/netinfo';

//The No Internet component
import NoInternet from './chapters/NoInternet';

//Here we import the different chapters of the app
import Intro from './chapters/Intro';
import NoPermissions from './chapters/NoPermissions';

class Main extends Component {
  constructor() {
    super();
    this.state = {
      chapter: 0,
      hasInternetConnection: false,
    };
  }

  componentDidMount() {
    NetInfo.addEventListener(state => {
      this.state.hasInternetConnection = state.isInternetReachable;
      this.setState(this.state);
    });
  }

  advanceState() {
    this.state.chapter++;
    this.setState(this.state);
  }

  render() {
    let component;
    if (this.state.hasInternetConnection) {
      switch (this.state.chapter) {
        case 0:
          component = (
            <Intro
              advanceState={() => {
                this.advanceState();
              }}
            />
          );
          break;
        case 1:
          component = (
            <NoPermissions
              advanceState={() => {
                this.advanceState();
              }}
            />
          );
          break;
      }
    } else {
      component = <NoInternet />;
    }

    return component;
  }
}

AppRegistry.registerComponent(appName, () => Main);
