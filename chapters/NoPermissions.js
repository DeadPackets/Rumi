import React, {Component} from 'react';
import {
  BackHandler,
  ToastAndroid,
  AppState,
  SafeAreaView,
  Text,
  StatusBar,
  View,
  StyleSheet,
  Appearance,
  NativeModules,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import {material, human} from 'react-native-typography';
import * as Animatable from 'react-native-animatable';
import {Button} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';

//Notifications
import PushNotification from 'react-native-push-notification';

//Libraries to get info
import {AppInstalledChecker} from 'react-native-check-app-install';
import Markdown from 'react-native-markdown-display';
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
import Dots from 'react-native-dots-pagination';
import ReactNativeHeading from 'react-native-heading';
const {AndroidInformation, SensorManager} = NativeModules;

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
      visited: [false, false, false, false, false, false],
      appsInstalled: [],
      pairedDevices: [],
      kernelVer: '',
      uptime: '',
    };
  }

  componentDidMount() {
    //AppState listener
    AppState.addEventListener('change', nextState => {
      if (this.state.chapter === 3) {
        this.displayNotif(
          `The app is now ${
            nextState === 'active' ? 'active!' : 'in the background!'
          }`,
        );
      }
    });

    //Back button handler
    BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.state.chapter === 3) {
        this.displayToast('You pressed the back button!');
      }
    });

    //Sensor measurements
    SensorManager.startLightSensor(2000);
    SensorManager.startThermometer(2000);
    SensorManager.startProximity(2000);
    SensorManager.startStepCounter(1000);
    ReactNativeHeading.start(1).then(didStart => {
      this.setState({
        headingIsSupported: didStart,
      });
    });

    DeviceEventEmitter.addListener('LightSensor', data => {
      this.state.lightLevel = data.light;
      if (data.light <= 5) {
        this.state.lightStatus = 'no light';
      } else if (data.light <= 10 || data.light < 30) {
        this.state.lightStatus = 'dimly lit';
      } else if (data.light <= 30 || data.light < 3000) {
        this.state.lightStatus = 'well lit';
      } else if (data.light >= 3000) {
        this.state.lightStatus = 'high light (probably outdoors)';
      }
    });

    DeviceEventEmitter.addListener('Thermometer', data => {
      this.state.temp = data.temp;
    });

    DeviceEventEmitter.addListener('Proximity', data => {
      this.state.proximityVal = data.value;
      this.state.proximityMax = data.maxRange;
      this.state.proximityIsNear = data.isNear;
    });

    DeviceEventEmitter.addListener('StepCounter', data => {
      this.state.stepCount = data.steps;
    });

    DeviceEventEmitter.addListener('headingUpdated', data => {
      this.state.heading = data;
    });

    //Some stuff needs to be refreshed every 2 seconds
    this.intervalID = setInterval(() => {
      this.state.usedMemory = DeviceInfo.getUsedMemorySync();

      SystemSetting.isBluetoothEnabled().then(enabled => {
        this.state.isBluetoothEnabled = enabled ? 'On' : 'Off';
      });

      AndroidInformation.getBrightness().then(brightness => {
        this.state.brightnessLevel = brightness;
      });

      SystemSetting.getVolume().then(volume => {
        this.state.volumeLevel = volume;
      });

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

      AndroidInformation.isListeningToMusic().then(res => {
        this.state.isListeningToMusic = res;
      });

      AndroidInformation.getRingerMode().then(mode => {
        this.state.ringerMode = mode;
        this.setState(this.state);
      });
    }, 2000);

    AndroidInformation.getResolution().then(res => {
      this.state.resolution = res;
    });

    AndroidInformation.getSensors().then(res => {
      this.state.sensors = res;
      this.setState(this.state);
    });

    AndroidInformation.getADBEnabled().then(res => {
      this.state.ADBEnabled = res === '1';
      this.setState(this.state);
    });

    AndroidInformation.getBootCount().then(res => {
      this.state.bootCount = res;
      this.setState(this.state);
    });

    AndroidInformation.getRoaming().then(res => {
      this.state.isRoaming = res === '1';
      this.setState(this.state);
    });

    AndroidInformation.getDevelopmentSettings().then(res => {
      this.state.devSettings = res === '1';
      this.setState(this.state);
    });

    AndroidInformation.getScreenTimeout().then(res => {
      this.state.screenTimeout = res / 1000;
      this.setState(this.state);
    });

    AndroidInformation.getAccessibility().then(res => {
      this.state.isAccessibilityEnabled = res === '1';
      this.setState(this.state);
    });

    AndroidInformation.getPairedDevices()
      .then(devices => {
        this.state.pairedDevices = devices;
        this.setState(this.state);
      })
      .catch(err => {
        this.state.pairedDevices = [];
        this.setState(this.state);
      });

    AndroidInformation.getBluetoothName()
      .then(name => {
        this.state.bluetoothName = name;
        this.setState(this.state);
      })
      .catch(err => {
        this.state.bluetoothName = 'UNKNOWN';
        this.setState(this.state);
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
      //Manual check for spotify since this library has a broken check
      if (app === 'spotify') {
        AppInstalledChecker.checkURLScheme('spotify').then(result => {
          this.state.appsInstalled.push({name: 'Spotify', result});
        });
      } else {
        AppInstalledChecker.isAppInstalled(app).then(result => {
          this.state.appsInstalled.push({
            name: app
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            result,
          });
          this.setState(this.state);
        });
      }
    });

    AndroidInformation.installedApps().then(res => {
      this.state.numApps = res;
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
        try {
          JSON.parse(response);
          this.state.wifiMan = 'UNKNOWN';
        } catch (e) {
          this.state.wifiMan = response;
        }
        this.setState(this.state);
      })
      .catch(err => {
        this.state.wifiMan = 'UNKNOWN';
        this.setState(this.state);
      });

    fetch('https://icanhazip.com/s')
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

  componentWillUnmount() {
    clearInterval(this.intervalID);
    SensorManager.stopLightSensor();
    SensorManager.stopProximity();
    SensorManager.stopThermometer();
    SensorManager.stopStepCounter();
    ReactNativeHeading.stop();
    DeviceEventEmitter.removeAllListeners();
    BackHandler.removeEventListener('hardwareBackPress');
    AppState.removeEventListener('change');
  }

  displayToast(msg) {
    ToastAndroid.show(msg, ToastAndroid.BOTTOM, ToastAndroid.LONG);
  }

  displayNotif(message) {
    PushNotification.localNotification({
      message,
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
    let content;
    switch (index) {
      case 0:
        return (
          <ScrollView>
            <Animatable.View animation="fadeIn" style={styles.contentView}>
              <Icon name="home" size={100} color="#eee" />
              <Text style={[material.display1, styles.titleStyle]}>Part 1</Text>
              <Text style={[material.display2, styles.titleStyle]}>
                System Given Permissions
              </Text>
              <Text style={[human.title2, styles.bodyStyle]}>
                This part will focus on gathering information using permissions
                automatically given to the app upon installation, without any
                prompts to the user. These permissions can usually be found upon
                installation of the app.
              </Text>
              <Text style={[human.title2, styles.bodyStyle]}>
                In other words, every other app you have installed on your phone
                has access to this data.
              </Text>
            </Animatable.View>
          </ScrollView>
        );
      case 1:
        content = `

        # Device Information
        ---
        You are currently using a **${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}** (called **"${DeviceInfo.getDeviceNameSync()}"**) which is running **${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}**.

        Your device's unique ID is **\`${DeviceInfo.getUniqueId()}\`**.

        # Device Type
        ---
        Your device is a **${DeviceInfo.getDeviceType()}** and is ${
          DeviceInfo.isEmulatorSync() ? '' : 'not'
        } an emulator.

        # Device Design
        ---
        Your device is in **${
          DeviceInfo.isLandscapeSync() ? 'landscape' : 'portrait'
        }** mode and ${
          DeviceInfo.hasNotch() ? 'has a notch' : 'does not have a notch'
        }.

        # Audio Information
        ---
        You ${
          DeviceInfo.isHeadphonesConnectedSync() ? '' : 'do not'
        } have headphones/earphones connected.

        Your current volume level is at **${(
          this.state.volumeLevel * 100
        ).toFixed(1)}%**.

        You are also currently ${
          this.state.isListeningToMusic ? 'are' : 'are not'
        } listening to music.

        # Security Information
        ---
        I can detect that you ${
          DeviceInfo.isPinOrFingerprintSetSync() ? 'have' : 'do not have'
        } a PIN/Fingerprint lock set for this device.

        Android reports that there ${
          JailMonkey.hookDetected()
            ? 'are some malicious apps installed'
            : 'are no malicious apps installed'
        } on this device.

        Even scarier, I know that the date of your installed security patch is **${DeviceInfo.getSecurityPatchSync()}**.
        `
          .split(/\r?\n/)
          .map(row =>
            row
              .trim()
              .split(/\s+/)
              .join(' '),
          )
          .join('\n');
        return (
          <>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[material.display2, styles.titleStyle]}>
              General Information
            </Animatable.Text>
            <ScrollView
              contentContainerStyle={styles.markdownContentView}
              bounces={false}
              key={this.state.chapter}>
              <Markdown debugPrintTree={false} mergeStyle={true} style={styles}>
                {content}
              </Markdown>
            </ScrollView>
          </>
        );
      case 2:
        content = `
        # Connection Details
        ---
        You are connected to the internet via ${this.state.netinfo.type}. ${
          this.state.netinfo.type === 'wifi'
            ? '\n\nI cannot access details of WiFi connections without special permissions.'
            : ''
        } ${
          this.state.netinfo.type === 'cellular'
            ? `You're on a **${this.state.netinfo.details.cellularGeneration ||
                'UNKNOWN'}** connection to the carrier **"${
                this.state.netinfo.details.carrier
              }"** with network operator code (**${
                this.state.networkOperator
              }**).\n\nIt is marked as an **"${
                this.state.netinfo.details.isConnectionExpensive
                  ? 'expensive'
                  : 'inexpensive'
              }"** connection.\n\nYour cellular connection reveals you are currently located in **${this.state.isoCountryCode.toUpperCase()}**.\n\nYour phone reports that you are currently ${
                this.state.isRoaming ? 'roaming' : 'not roaming'
              }.`
            : ''
        }

        # Network Details
        ---
        Your local IP is **\`${this.state.localIP}\`** and public IP is **\`${
          this.state.publicIP
        }\`**.

        The IP of your gateway (your router probably) is **\`${
          this.state.gatewayIP
        }\`**.

        Your device's WiFi network card has the MAC address of **\`${DeviceInfo.getMacAddressSync()}\`**.

        # Chip Information
        ---
        Using the internet, I discovered that your WiFi card was built by **\`${
          this.state.wifiMan
        }\`**.

        # Ad Blocking
        ---
        I detect that you ${
          this.state.adsBlocked ? 'are blocking ads.' : 'are not blocking ads.'
        }

        # Router Access
        ---
        I tried to access your router's web interface in the background. It ${
          this.state.routerWeb === 'UNKNOWN' ||
          this.state.routerWeb === undefined
            ? 'did not respond.'
            : `responded with an HTTP status code of **\`${
                this.state.routerWeb
              }\`**.`
        }

        I could have logged in the background and changed some crucial settings.

        # IP Information
        ---
        Using your IP, I found out that you are probably located in **${
          this.state.ipInfo.city
        }, ${this.state.ipInfo.country}**.

        Your ISP is **${this.state.ipInfo.isp}**.

        You ${
          this.state.ipInfo.proxy ? 'are' : 'are not'
        } using Tor or a public proxy.

        I can detect that your connection is ${
          this.state.vpnActive ? '' : 'not '
        }going through a VPN.

        # Network Scan
        ---
        I can scan for any device on your local network.

        ${
          this.state.chromecasts.length > 0
            ? `For example, I have detected the following Chromecasts:
            ${this.state.chromecasts
              .map(item => {
                return '- ' + item + '\n';
              })
              .join(' ')}`
            : 'I tried to scan for Chromecasts but found none on your network.'
        }
        `
          .split(/\r?\n/)
          .map(row =>
            row
              .trim()
              .split(/\s+/)
              .join(' '),
          )
          .join('\n');
        return (
          <>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[material.display2, styles.titleStyle]}>
              Network Information
            </Animatable.Text>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.markdownContentView}
              key={this.state.chapter}>
              <Markdown
                rules={rules}
                debugPrintTree={false}
                mergeStyle={true}
                style={styles}>
                {content}
              </Markdown>
            </ScrollView>
          </>
        );
      case 3:
        content = `
        # Battery Information
        ---
        The battery is currently ${
          DeviceInfo.getPowerStateSync().batteryState
        } at **${(DeviceInfo.getPowerStateSync().batteryLevel * 100).toFixed(
          1,
        )}%** and ${
          DeviceInfo.getPowerStateSync().lowPowerMode ? 'is' : 'is not'
        } in low power mode.

        # Storage Information
        ---
        You have used **${this.humanFileSize(
          this.state.spaceInfo.totalSpace - this.state.spaceInfo.freeSpace,
          1,
        )}** of storage space out of your total ${this.humanFileSize(
          this.state.spaceInfo.totalSpace,
          1,
        )} (**${(
          ((this.state.spaceInfo.totalSpace - this.state.spaceInfo.freeSpace) /
            this.state.spaceInfo.totalSpace) *
          100
        ).toFixed(2)}%** usage).

        # Memory Information
        ---
        This app is using **${this.humanFileSize(
          this.state.usedMemory,
          1,
        )}** of RAM out of your total available ${this.humanFileSize(
          DeviceInfo.getTotalMemorySync(),
          1,
        )} (**${(
          (this.state.usedMemory / DeviceInfo.getTotalMemorySync()) *
          100
        ).toFixed(2)}%** usage).

        # Display Information
        ---
        I can detect that you have global dark mode ${
          Appearance.getColorScheme() === 'dark' ? 'enabled' : 'disabled'
        } on this device.

        The screen resolution is **${this.state.resolution}**.

        Your screen's brightness level is at **${(
          (this.state.brightnessLevel / 255) *
          100
        ).toFixed(1)}%**.

        This percentage may be inaccurate on different devices due to how they handle brightness internally.

        Your screen is set to automatically turn off in ${
          this.state.screenTimeout
        } seconds.

        # Installed Apps
        ---
        You have **${
          this.state.numApps
        }** applications installed on your device.

        Out of those apps, I can find apps within certain categories.

        For example, here are all the browsers installed on this device: \n${
          this.state.browserApps.length > 0
            ? this.state.browserApps
                .map(item => {
                  return '- ' + item + '\n';
                })
                .join(' ')
            : 'None'
        }

        I can also detect if certain apps are installed by name. Here are a list of apps I detected:
        | **App Name** | **Is Installed?** |
        | -------- | ------------- |
        ${this.state.appsInstalled
          .map(item => {
            return `| ${item.name} | ${item.result ? '✅' : '❌'} |\n`;
          })
          .join(' ')}

        # Clipboard Information
        ---
        I can grab whatever you have in your clipboard (what you recently copied).

        You have **"${this.state.clipboard}"** inside your clipboard right now.

        # Back Button Detection
        ---
        If you have a hardware or software back button, I can detect when you press it.

        Try pressing the back button and you should get a notification.

        This will only happen on this page.

        # App Exit Detection
        ---
        I can detect when the app is in the background or back into active view.

        Try going back to your home menu and see what happens. Then come back to the app.

        This will only happen on this page.

        # Runtime Information
        ---
        I can detect that this device is ${
          JailMonkey.isJailBroken() ? '' : 'not '
        }rooted/jailbroken.

        Your device is ${
          JailMonkey.canMockLocation() ? 'capable' : 'not currently capable'
        } of faking its location.

        You have accessibility settings ${
          this.state.isAccessibilityEnabled ? 'enabled' : 'disabled'
        }.

        Your OS has a build ID of **\`${DeviceInfo.getBuildIdSync()}\`**.

        This app is running on ${
          JailMonkey.isOnExternalStorage()
            ? 'the external storage'
            : 'the internal storage (not SD card)'
        }.

        Android reports that there ${
          JailMonkey.hookDetected()
            ? 'are some malicious apps installed'
            : 'are no malicious apps installed'
        }.

        I know that your device has been restarted **${
          this.state.bootCount
        }** times.

        I detect that you have android USB debugging is ${
          this.state.ADBEnabled ? 'enabled' : 'disabled'
        }.

        You also have developer settings ${
          this.state.devSettings ? 'enabled' : 'disabled'
        }.

        Lastly, this app ${
          JailMonkey.isDebuggedMode() ? 'is' : 'is not'
        } running in debug mode.

        # OS Information
        ---
        You are running Android with linux kernel version **\`${this.state.kernelVer.trim()}\`**.

        The phone has been **${this.state.uptime.trim()}**.

        # Bluetooth Information
        ---
        I can detect that you have Bluetooth ${
          this.state.isBluetoothEnabled ? 'enabled' : 'disabled'
        }.

        The name other bluetooth devices see when scanning for your phone is ${
          this.state.bluetoothName
        }.

        I can get a list of all paired bluetooth devices (You have ${
          this.state.pairedDevices.length
        }):
        | Device Name | MAC Address |
        | ----------- | ----------- |
        ${
          this.state.pairedDevices.length > 0
            ? this.state.pairedDevices
                .map(item => {
                  return (
                    '| ' +
                    item.split('[]')[0] +
                    ` | ~~\`${item.split('[]')[1]}\`~~` +
                    ' |\n'
                  );
                })
                .join(' ')
            : '| None | None |'
        }

        # System Features
        ---
        Your device reports it has the following available features:
        | Feature |
        | ------- |
        ${
          DeviceInfo.getSystemAvailableFeaturesSync().length > 0
            ? DeviceInfo.getSystemAvailableFeaturesSync()
                .map(item => {
                  return `| ~~\`${item}\`~~ |\n`;
                })
                .join(' ')
            : '| None |'
        }
        `
          .split(/\r?\n/)
          .map(row =>
            row
              .trim()
              .split(/\s+/)
              .join(' '),
          )
          .join('\n');
        return (
          <>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[material.display2, styles.titleStyle]}>
              System Information
            </Animatable.Text>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.markdownContentView}
              key={this.state.chapter}>
              <Markdown
                rules={rules}
                debugPrintTree={false}
                mergeStyle={true}
                style={styles}>
                {content}
              </Markdown>
            </ScrollView>
          </>
        );
      case 4:
        content = `
        # Sensor List
        ---
        I can read from any sensor on your device. Using this sensor data, I can figure out information about you.

        Here is a list of every sensor on your device and their vendor (You have ${
          this.state.sensors.length
        }):
        | Sensor Name | Vendor |
        | ----------- | ------ |
        ${
          this.state.sensors.length > 0
            ? this.state.sensors
                .map(item => {
                  return (
                    '| ' +
                    item.split('[]')[0] +
                    ` | ${item.split('[]')[1]}` +
                    ' |\n'
                  );
                })
                .join(' ')
            : '| None | None |'
        }

        Every single app on your phone has access to these sensors and their data.

        I will show you some information from sensors you might not know about.

        # Light Intensity Sensor
        ---
        ${
          this.state.lightLevel !== undefined
            ? `Using data from the light sensor in your device, I can tell the place you are currently in is **${this.state.lightLevel.toFixed(
                2,
              )}** lux.

              Using this reading, I can tell that the room you are in is/has ${this
                .state.lightStatus || ' an unknown amount of light.'}.`
            : 'Your device does not have a light sensor.'
        }

        # Temperature Sensor
        ---
        ${
          this.state.temp !== undefined
            ? `Using data from the temperature sensor in your device, I can tell that the temperature around you is around **${this.state.temp.toFixed(
                2,
              )}°C**.`
            : 'Your phone does not have a temperature sensor.'
        }

        # Proximity Sensor
        ---
        ${
          this.state.proximityVal !== undefined
            ? `Using data from the proximity sensor in your device, I can tell that you are about **${this.state.proximityVal.toFixed(
                2,
              )}** cm away from your phone.

            However, I know that the maximum value this sensor can read is **${this.state.proximityMax.toFixed(
              2,
            )}** cm.`
            : 'Your device does not have a proximity sensor.'
        }

        Your device reports that you ${
          this.state.proximityIsNear ? 'are' : 'are not'
        } near to it.

        # Step Counter Sensor
        ---
        Your phone can also track how many steps you are taking.

        Your phone reports that you have taken **${this.state.stepCount ||
          0}** steps.

        # Device Heading Sensor
        ---
        ${
          this.state.headingIsSupported
            ? `I can tell what direction you are facing using the heading sensor on your device. This sensor reports that you are facing **${this.state.heading.toFixed(
                2,
              )}°**`
            : 'Your device does not have a heading sensor.'
        }
        `
          .split(/\r?\n/)
          .map(row =>
            row
              .trim()
              .split(/\s+/)
              .join(' '),
          )
          .join('\n');
        return (
          <>
            <Animatable.Text
              animation={this.state.visited[this.state.chapter] ? '' : 'fadeIn'}
              style={[material.display2, styles.titleStyle]}>
              Device Sensors
            </Animatable.Text>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.markdownContentView}
              key={this.state.chapter}>
              <Markdown
                rules={rules}
                debugPrintTree={false}
                mergeStyle={true}
                style={styles}>
                {content}
              </Markdown>
            </ScrollView>
          </>
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
            paddingBottom: 10,
          }}>
          <Button
            icon={{name: 'arrow-back', color: '#eee', size: 30}}
            buttonStyle={{backgroundColor: '#162B3C'}}
            style={{width: 80}}
            disabled={this.state.chapter > 0 ? false : true}
            disabledStyle={{backgroundColor: '#CCC9DC'}}
            onPress={this.goBack.bind(this)}
          />
          <Dots
            paddingVertical={20}
            length={5}
            activeColor="#ddd"
            active={this.state.chapter}
            passiveColor="#1b2a38"
          />
          <Button
            iconRight
            icon={{name: 'arrow-forward', color: '#eee', size: 30}}
            buttonStyle={{backgroundColor: '#162B3C'}}
            style={{width: 80}}
            disabled={this.state.chapter === 4 ? true : false}
            disabledStyle={{backgroundColor: '#CCC9DC'}}
            onPress={this.goNext.bind(this)}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const rules = {
  paragraph: (node, children, parent, styles) => {
    if (parent[0].type === 'list_item') {
      return (
        <View key={node.key} style={styles._VIEW_SAFE_paragraph_list}>
          {children}
        </View>
      );
    }

    return (
      <View key={node.key} style={styles._VIEW_SAFE_paragraph}>
        {children}
      </View>
    );
  },
};

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
  markdownContentView: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  titleStyle: {
    color: '#eee',
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingBottom: 10,
  },
  bodyStyle: {
    flexGrow: 1,
    color: '#eee',
    padding: 20,
    textAlign: 'center',
    fontFamily: 'ProximaNova',
  },
  body: {
    ...human.title3,
    color: '#eee',
    fontFamily: 'ProximaNova',
    flex: 1,
    flexShrink: 1,
  },
  hr: {
    backgroundColor: '#999',
    marginTop: 5,
    height: 1,
  },
  bullet_list_icon: {
    color: '#eee',
    lineHeight: 20,
  },
  paragraph: {
    color: '#eee',
    fontFamily: 'ProximaNova',
    paddingBottom: 10,
  },
  heading1: {
    ...human.title2,
    color: '#eee',
    fontFamily: 'ProximaNova-Bold',
  },
  code_inline: {
    backgroundColor: '#324A5F',
    borderColor: '#fff',
    color: '#eee',
    fontFamily: 'monospace',
    borderWidth: 0,
  },
  paragraph_list: {
    marginTop: 2,
    marginBottom: 2,
    paddingBottom: 10,
  },
  table: {
    marginBottom: 20,
  },
  s: {
    textDecorationLine: 'none',
    fontSize: 14,
  },
});
