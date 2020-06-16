import React, {Component} from 'react';
import {SafeAreaView, View, Text, StatusBar, StyleSheet} from 'react-native';
import {robotoWeights, material} from 'react-native-typography';
import * as Animatable from 'react-native-animatable';
import {Button} from 'react-native-elements';

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
              Rumi
            </Text>
            <Text
              style={[material.title, robotoWeights.light, styles.bodyStyle]}>
              Welcome to Rumi! An app designed to show you what kind of
              information apps can collect about you and your phone with
              different levels of permissions.
            </Text>
            <Text
              style={[
                material.title,
                robotoWeights.condensedBold,
                styles.bodyStyle,
              ]}>
              No private data or information is collected, stored, or sent to
              the internet.
            </Text>
            <Text
              style={[material.title, robotoWeights.light, styles.bodyStyle]}>
              When you're ready, press Start.
            </Text>
            <Button
              title="Start"
              onPress={this.startApp.bind(this)}
              buttonStyle={{backgroundColor: '#324A5F'}}
              titleStyle={[
                material.title,
                {color: '#eee'},
                robotoWeights.light,
              ]}
              containerStyle={{width: 200, borderRadius: 7}}
            />
          </Animatable.View>
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  backgroundView: {
    flex: 1,
    backgroundColor: '#0C1821',
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
