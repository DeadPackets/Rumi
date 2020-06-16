import React, {Component} from 'react';
import {SafeAreaView, Text, StatusBar, StyleSheet} from 'react-native';
import {robotoWeights, material} from 'react-native-typography';
import * as Animatable from 'react-native-animatable';

export default class Intro extends Component {
  startApp() {
    this.props.advanceState();
  }

  render() {
    return (
      <>
        <StatusBar backgroundColor="#0C1821" barStyle="light-content" />
        <SafeAreaView style={styles.backgroundView}>
          <Animatable.View animation="fadeIn" style={styles.contentView}>
            <Text
              style={[
                material.display3,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              No Internet!
            </Text>
            <Text
              style={[material.title, robotoWeights.light, styles.bodyStyle]}>
              This app needs an internet connection to work. Please connect to
              the internet then try open the app again.
            </Text>
          </Animatable.View>
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  backgroundView: {
    flex: 1,
    backgroundColor: '#BC2927',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    paddingTop: 100,
  },
  contentView: {
    alignItems: 'center',
  },
  titleStyle: {
    color: '#eee',
  },
  bodyStyle: {
    color: '#eee',
    padding: 20,
    textAlign: 'center',
  },
});
