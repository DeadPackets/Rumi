import React, {Component} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {material} from 'react-native-typography';
import {Button} from 'react-native-elements';

export default class Intro extends Component {
  startApp() {
    this.props.advanceState();
  }

  render() {
    return (
      <>
        <StatusBar backgroundColor="#162B3C" barStyle="light-content" />
        <SafeAreaView style={styles.backgroundView}>
          <ScrollView contentContainerStyle={styles.contentView}>
            <Text style={[material.display3, styles.titleStyle]}>Rumi</Text>
            <Text style={[material.headline, styles.bodyStyle]}>
              Welcome to Rumi! An app designed to show you what kind of
              information apps can collect about you and your phone with
              different levels of permissions.
            </Text>
            <Text style={[material.headline, styles.bodyStyle]}>
              No private data or information is collected, stored, or sent to
              the internet.
            </Text>
            <Text style={[material.headline, styles.bodyStyle]}>
              When you're ready, press Start.
            </Text>
            <Button
              title="Start"
              onPress={this.startApp.bind(this)}
              buttonStyle={{backgroundColor: '#324A5F'}}
              titleStyle={[
                material.headline,
                {color: '#eee', fontFamily: 'ProximaNova-Bold'},
              ]}
              containerStyle={{width: 150, borderRadius: 7}}
            />
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  backgroundView: {
    flex: 1,
    backgroundColor: '#162B3C',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    paddingTop: 60,
  },
  contentView: {
    alignItems: 'center',
  },
  titleStyle: {
    color: '#eee',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  bodyStyle: {
    color: '#eee',
    padding: 20,
    textAlign: 'center',
    fontFamily: 'ProximaNova',
  },
});
