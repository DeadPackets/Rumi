import React, {Component} from 'react';
import {
  SafeAreaView,
  Text,
  StatusBar,
  View,
  StyleSheet,
  Appearance,
  NativeModules,
  Dimensions,
  ScrollView,
} from 'react-native';
import {robotoWeights, material} from 'react-native-typography';
import * as Animatable from 'react-native-animatable';
import {Button} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';

//Libraries to get info
import {AppInstalledChecker} from 'react-native-check-app-install';
import DeviceInfo from 'react-native-device-info';
import {NetworkInfo} from 'react-native-network-info';
import CarrierInfo from 'react-native-carrier-info';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import Zeroconf from 'react-native-zeroconf';
const zeroconf = new Zeroconf();
import JailMonkey from 'jail-monkey';
import Clipboard from '@react-native-community/clipboard';
import SystemSetting from 'react-native-system-setting';
import ReactNativeHeading from 'react-native-heading';
import Proximity from 'react-native-proximity';
import AccountManager from 'react-native-account-manager';
const {AndroidInformation} = NativeModules;

export default class NoPermissions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chapter: 0,
      ipInfo: {
        city: 'null',
        country: 'null',
        isp: 'null',
        proxy: false,
      },
      chromecasts: [],
      spaceInfo: {
        freeSpace: '',
        totalSpace: '',
      },
      browserApps: [],
      visited: [false, false, false, false],
      appsInstalled: [],
    };
  }

  componentDidMount() {
    Clipboard.getString().then(content => {
      this.state.clipboard = content;
    });

    AndroidInformation.getCommand('uname -r')
      .then(res => {
        this.state.kernelVer = res;
      })
      .catch(err => {
        this.state.kernelVer = 'error';
      });

    AndroidInformation.getCommand('uptime -p')
      .then(res => {
        this.state.uptime = res;
      })
      .catch(err => {
        this.state.uptime = 'error';
      });

    AndroidInformation.isVPNActive()
      .then(res => {
        this.state.vpnActive = res;
      })
      .catch(err => {
        this.state.vpnActive = false;
      });

    fetch('http://doubleclick.net')
      .then(res => {
        this.state.adsBlocked = false;
        this.setState(this.state);
      })
      .catch(err => {
        this.state.adsBlocked = true;
        this.setState(this.state);
      });

    AppInstalledChecker.getAppList().forEach(app => {
      AppInstalledChecker.isAppInstalled(app).then(result => {
        if (result) {
          if (this.state.appsInstalled.indexOf(app) === -1) {
            this.state.appsInstalled.push(app);
            this.setState(this.state);
          }
        }
      });
    });

    AndroidInformation.installedApps().then(res => {
      this.state.numApps = res;
      this.setState(this.state);
    });

    AndroidInformation.isListeningToMusic().then(res => {
      this.state.isListeningToMusic = res;
      this.setState(this.state);
    });

    AndroidInformation.getInstalledBrowsers().then(res => {
      this.state.browserApps = res;
      this.setState(this.state);
    });

    //Start the zeroconf scan
    zeroconf.scan('googlecast', 'tcp', 'local.');

    zeroconf.on('resolved', service => {
      if (this.state.chromecasts.indexOf(service.txt.fn) === -1) {
        this.state.chromecasts.push(service.txt.fn);
        this.setState(this.state);
      }
    });

    // Here we where we preload all the information
    CarrierInfo.mobileNetworkOperator().then(result => {
      this.state.networkOperator = result;
      this.setState(this.state);
    });

    CarrierInfo.isoCountryCode().then(result => {
      this.state.isoCountryCode = result;
      this.setState(this.state);
    });

    // Load NetInfo
    NetInfo.fetch().then(state => {
      this.state.netinfo = state;
      this.setState(this.state);
    });

    // Get local IP
    NetworkInfo.getIPV4Address().then(ipv4Address => {
      this.state.localIP = ipv4Address;
      this.setState(this.state);
    });

    // Get Default Gateway IP
    NetworkInfo.getGatewayIPAddress().then(defaultGateway => {
      this.state.gatewayIP = defaultGateway;
      if (this.state.netinfo.type === 'wifi') {
        fetch(`http://${defaultGateway.trim()}`)
          .then(response => {
            this.state.routerWeb = response.status;
            this.setState(this.state);
          })
          .catch(err => {
            this.state.routerWeb = 'ERROR';
            this.setState(this.state);
          });
      }
    });

    // Fetch OUI of WiFi MAC address
    fetch(`https://api.macvendors.com/${DeviceInfo.getMacAddressSync()}`)
      .then(response => {
        return response.text();
      })
      .then(response => {
        this.state.wifiMan = response;
        this.setState(this.state);
      })
      .catch(err => {
        this.state.wifiMan = 'UNKNOWN';
        this.setState(this.state);
      });

    fetch('http://icanhazip.com/s')
      .then(response => response.text())
      .then(response => {
        this.state.publicIP = response.trim();
        fetch(
          `http://ip-api.com/json/${
            this.state.publicIP
          }?fields=status,message,country,city,isp,as,proxy`,
        )
          .then(ipRes => {
            return ipRes.json();
          })
          .then(res => {
            this.state.ipInfo = res;
            this.setState(this.state);
          })
          .catch(err => {
            //do nothing
          });
      })
      .catch(err => {
        this.state.publicIP = 'ERROR';
        this.setState(this.state);
      });

    RNFS.getFSInfo().then(info => {
      this.state.spaceInfo = info;
      this.setState(this.state);
    });
  }

  nextChapter() {
    this.props.advanceState();
  }

  goNext() {
    this.state.visited[this.state.chapter] = true;
    this.state.chapter++;
    this.setState(this.state);
  }

  goBack() {
    if (this.state.chapter > 0) {
      this.state.visited[this.state.chapter] = true;
      this.state.chapter--;
      this.setState(this.state);
    }
  }

  humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (bytes < thresh) {
      return bytes + ' B';
    }
    var units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (bytes >= thresh);
    return bytes.toFixed(1) + ' ' + units[u];
  }

  getComponent(index) {
    switch (index) {
      case 0:
        return (
          <Animatable.View animation="fadeIn" style={styles.contentView}>
            <Icon name="home" size={100} color="#eee" />
            <Text
              style={[
                material.display1,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              Part 1
            </Text>
            <Text
              style={[
                material.headline,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              System Given Permissions
            </Text>
            <Text
              style={[material.title, robotoWeights.light, styles.bodyStyle]}>
              This part will focus on gathering information using permissions
              automatically given to the app upon installation, without any
              prompts to the user. These permissions can usually be found upon
              installation of the app.
            </Text>
          </Animatable.View>
        );
      case 1:
        return (
          <ScrollView
            contentContainerStyle={styles.contentView}
            bounces={false}
            key={this.state.chapter}>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.display1,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              Basic Information
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You are currently using a {DeviceInfo.getBrand()}{' '}
              {DeviceInfo.getModel()} (called "{DeviceInfo.getDeviceNameSync()}
              ") running {DeviceInfo.getSystemName()}{' '}
              {DeviceInfo.getSystemVersion()}. You are{' '}
              {DeviceInfo.isEmulatorSync() ? '' : 'not'} using an emulator.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={2000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Apps can use this information to find your exact device's model
              and specs.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={4000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Your device is a {DeviceInfo.getDeviceType()} that{' '}
              {DeviceInfo.hasNotch() ? 'has a notch' : 'does not have a notch'}.
              It is currently in{' '}
              {DeviceInfo.isLandscapeSync()
                ? 'landscape mode'
                : 'portrait mode'}
              .
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={6000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You {DeviceInfo.isHeadphonesConnectedSync() ? '' : 'do not'} have
              headphones/earphones connected. Airplane mode is switched{' '}
              {DeviceInfo.isAirplaneModeSync() ? 'on' : 'off'}.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={8000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Without the location permission, I can tell you have location
              serivices{' '}
              {DeviceInfo.isLocationEnabledSync() ? 'enabled' : 'disabled'}. I
              can also tell you{' '}
              {DeviceInfo.isPinOrFingerprintSetSync() ? 'have' : 'do not have'}{' '}
              a PIN/Fingerprint lock set for this device.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={10000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              The latest security patch your phone has installed is{' '}
              {DeviceInfo.getSecurityPatchSync()}.
            </Animatable.Text>
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.contentView}
            key={this.state.chapter}>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.display1,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              Network Information
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You are currently connected to the internet via{' '}
              {this.state.netinfo.type}.{' '}
              {this.state.netinfo.type === 'wifi'
                ? 'I cannot access details of WiFi connections without special permissions.'
                : ''}{' '}
              {this.state.netinfo.type === 'cellular'
                ? `You're on a ${
                    this.state.netinfo.details.cellularGeneration
                  } connection to the carrier "${
                    this.state.netinfo.details.carrier
                  }" with network operator code (${
                    this.state.networkOperator
                  }). It is marked as an "${
                    this.state.netinfo.details.isConnectionExpensive
                      ? 'expensive'
                      : 'inexpensive'
                  }" connection. Your cellular connection reveals you are currently located in ${this.state.isoCountryCode.toUpperCase()}.`
                : ''}
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={2000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You have a local IP address of {this.state.localIP} and a public
              IP of {this.state.publicIP}. The IP of your gateway (your router
              probably) is {this.state.gatewayIP}. Your device's WiFi chip has
              the MAC address of {DeviceInfo.getMacAddressSync()}.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={4000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Using the internet, I can tell that your device's WiFi chip was
              manufactured by {this.state.wifiMan}. I can also tell that you{' '}
              {this.state.adsBlocked
                ? 'have ad-blocking enabled.'
                : 'do not have ad-blocking.'}
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={6000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              I tried to access your router's web interface in the background.
              It{' '}
              {this.state.routerWeb === 'UNKNOWN'
                ? 'did not respond.'
                : `responded with an HTTP status code of ${
                    this.state.routerWeb
                  }.`}{' '}
              I could have logged in the background and changed some crucial
              settings.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={8000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Using your IP, I found out that you are probably located in{' '}
              {this.state.ipInfo.city}, {this.state.ipInfo.country}. Your ISP is{' '}
              {this.state.ipInfo.isp}. You{' '}
              {this.state.ipInfo.proxy ? 'are' : 'are not'} using Tor or a
              public proxy. I can detect that your connection is{' '}
              {this.state.vpnActive ? '' : 'not '}going through a VPN.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={10000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              I can scan the network for devices. For example, I found{' '}
              {this.state.chromecasts.length > 0
                ? `${
                    this.state.chromecasts.length
                  } Chromecasts called: ${this.state.chromecasts.join(', ')}.`
                : 'no Chromecasts on your network.'}
            </Animatable.Text>
          </ScrollView>
        );
      case 3:
        return (
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.contentView}
            key={this.state.chapter}>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.display1,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              System Information
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              The battery is currently{' '}
              {DeviceInfo.getPowerStateSync().batteryState} at{' '}
              {(DeviceInfo.getPowerStateSync().batteryLevel * 100).toFixed(1)}%
              and{' '}
              {DeviceInfo.getPowerStateSync().lowPowerMode ? 'is' : 'is not'} in
              low power mode.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={2000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You have used{' '}
              {this.humanFileSize(
                this.state.spaceInfo.totalSpace -
                  this.state.spaceInfo.freeSpace,
                1,
              )}{' '}
              of storage space out of your total{' '}
              {this.humanFileSize(this.state.spaceInfo.totalSpace, 1)} (
              {(
                ((this.state.spaceInfo.totalSpace -
                  this.state.spaceInfo.freeSpace) /
                  this.state.spaceInfo.totalSpace) *
                100
              ).toFixed(2)}
              % usage).
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={4000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              This app is using{' '}
              {this.humanFileSize(DeviceInfo.getUsedMemorySync(), 1)} of RAM out
              of your total available{' '}
              {this.humanFileSize(DeviceInfo.getTotalMemorySync(), 1)} (
              {(
                (DeviceInfo.getUsedMemorySync() /
                  DeviceInfo.getTotalMemorySync()) *
                100
              ).toFixed(2)}
              % usage).
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={6000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              I can detect that you have global dark mode{' '}
              {Appearance.getColorScheme() === 'dark' ? 'enabled' : 'disabled'}{' '}
              on this device. The virtual screen resolution is{' '}
              {Dimensions.get('window').height} x{' '}
              {Dimensions.get('window').width}. You are currently{' '}
              {this.state.isListeningToMusic ? 'are' : 'are not'} listening to
              music.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={8000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You have {this.state.numApps} applications installed on your
              device. Out of those apps, I can find apps within certain
              categories. For example, here are all the browsers installed on
              this device:{' '}
              {this.state.browserApps.length > 0
                ? this.state.browserApps.join(', ')
                : 'None'}
              .
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={10000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              I can additionally check if certain apps are installed. For
              example, I can tell that you have installed:{' '}
              {this.state.appsInstalled.join(', ')}.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={12000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              You are running Android with linux kernel version{' '}
              {this.state.kernelVer.trim()}. The phone has been{' '}
              {this.state.uptime.trim()}.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={14000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              I can grab whatever you have in your clipboard (what you recently
              copied). You have "{this.state.clipboard}" inside your clipboard
              right now.
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              delay={16000}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Finally, I can detect that this device is{' '}
              {JailMonkey.isJailBroken() ? '' : 'not '}rooted/jailbroken. Your
              device is{' '}
              {JailMonkey.canMockLocation()
                ? 'capable'
                : 'not currently capable'}{' '}
              of faking its location. This app is running on{' '}
              {JailMonkey.isOnExternalStorage()
                ? 'the external storage'
                : 'the internal storage (not SD card)'}
              . Android reports that there{' '}
              {JailMonkey.hookDetected()
                ? 'are some malicious apps installed'
                : 'are no malicious apps installed'}
              . Lastly, this app {JailMonkey.isDebuggedMode() ? 'is' : 'is not'}{' '}
              running in debug mode.
            </Animatable.Text>
          </ScrollView>
        );
      case 4:
        return (
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.contentView}
            key={this.state.chapter}>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.display1,
                robotoWeights.bold,
                styles.titleStyle,
              ]}>
              Device Sensors
            </Animatable.Text>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[
                material.subheading,
                robotoWeights.light,
                styles.bodyStyle,
              ]}>
              Bruh momento.
            </Animatable.Text>
          </ScrollView>
        );
      default:
        // We'll reach this state when its time to get to the next chapter
        this.nextChapter();
        break;
    }
  }

  render() {
    let component = this.getComponent(this.state.chapter);
    // Add the the previous and next buttons
    return (
      <SafeAreaView style={styles.backgroundView}>
        <StatusBar backgroundColor="#324A5F" barStyle="light-content" />
        {component}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 20,
          }}>
          <Button
            title="Back"
            icon={{name: 'arrow-back', color: '#eee'}}
            buttonStyle={{backgroundColor: '#0C1821'}}
            style={{width: 80}}
            disabled={this.state.chapter > 0 ? false : true}
            disabledStyle={{backgroundColor: '#CCC9DC'}}
            onPress={this.goBack.bind(this)}
          />
          <Button
            title="Next"
            iconRight
            icon={{name: 'arrow-forward', color: '#eee'}}
            buttonStyle={{backgroundColor: '#0C1821'}}
            style={{width: 80}}
            onPress={this.goNext.bind(this)}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  backgroundView: {
    flex: 1,
    backgroundColor: '#324A5F',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    paddingTop: 20,
  },
  contentView: {
    flexGrow: 1,
    alignItems: 'center',
  },
  titleStyle: {
    color: '#eee',
    paddingTop: 20,
  },
  bodyStyle: {
    color: '#eee',
    padding: 20,
    textAlign: 'center',
  },
});
