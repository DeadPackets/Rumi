package com.rumi;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.Arguments;
import android.content.Context;
import android.app.ActivityManager;
import android.content.pm.*;
import android.content.Intent;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.accounts.*;
import android.util.Patterns;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothDevice;
import android.provider.Settings;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.*;
import java.net.NetworkInterface;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.Process;
import java.lang.StringBuffer;
import java.lang.ProcessBuilder;

public class AndroidInformationModule extends ReactContextBaseJavaModule {

    public AndroidInformationModule(ReactApplicationContext reactContext) {
        super(reactContext); //required by React Native
    }

    @Override
    //getName is required to define the name of the module represented in JavaScript
    public String getName() {
        return "AndroidInformation";
	}

    @ReactMethod
    public void installedApps(Promise promise) {
		//Returns the number of installed packages
		try {
			PackageManager pm = getReactApplicationContext().getPackageManager();
			List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
			promise.resolve(packages.size());
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
    public void isListeningToMusic(Promise promise) {
		//Returns if the user is currently listening to music
		try {
			AudioManager manager = (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);
			promise.resolve(manager.isMusicActive());
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
    public void getRingerMode(Promise promise) {
		//Returns if the user is currently listening to music
		try {
			AudioManager manager = (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);
			switch (manager.getRingerMode()) {
				case AudioManager.RINGER_MODE_SILENT:
					promise.resolve("silent");
					break;
				case AudioManager.RINGER_MODE_VIBRATE:
					promise.resolve("vibrate");
					break;
				case AudioManager.RINGER_MODE_NORMAL:
					promise.resolve("normal");
					break;
			}
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
    public void getInstalledBrowsers(Promise promise) {
		//Returns if the user is currently listening to music
		try {
			PackageManager packageManager = getReactApplicationContext().getPackageManager();
			Intent intent = new Intent(Intent.ACTION_VIEW);
			intent.setData(Uri.parse("http://www.google.com"));
			List<ResolveInfo> list = packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL);
			WritableArray resultSet = Arguments.createArray();
			for (ResolveInfo info : list) {
					resultSet.pushString(info.loadLabel(packageManager).toString());
			}
			promise.resolve(resultSet);
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void isVPNActive(Promise promise) {
		String iface = "";
		try {
			for (NetworkInterface networkInterface : Collections.list(NetworkInterface.getNetworkInterfaces())) {
				if (networkInterface.isUp())
					iface = networkInterface.getName();
				if ( iface.contains("tun") || iface.contains("ppp") || iface.contains("pptp")) {
					promise.resolve(true);
				}
			}
		} catch (Exception e1) {
			promise.reject("ERROR", e1);
		}
		promise.resolve(false);
	}

	@ReactMethod
	public void getCommand(String cmd, Promise promise) {
		try {
			ProcessBuilder builder = new ProcessBuilder("/system/bin/sh", "-c", cmd);
			builder.redirectErrorStream(true);
			Process process = builder.start();
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            int read;
            char[] buffer = new char[4096];
            StringBuffer output = new StringBuffer();
            while ((read = reader.read(buffer)) > 0) {
                output.append(buffer, 0, read);
            }
            reader.close();

            // Waits for the command to finish.
            process.waitFor();
            promise.resolve(output.toString());
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getPairedDevices(Promise promise) {
		try {
			BluetoothManager b = (BluetoothManager) getReactApplicationContext().getSystemService(Context.BLUETOOTH_SERVICE);
			BluetoothAdapter adapter = b.getAdapter();
			Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
			WritableArray resultSet = Arguments.createArray();
			for(BluetoothDevice bt : pairedDevices) {
				resultSet.pushString(bt.getName() + "[]" + bt.getAddress());
			}
			promise.resolve(resultSet);
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getBluetoothName(Promise promise) {
		try {
			BluetoothManager b = (BluetoothManager) getReactApplicationContext().getSystemService(Context.BLUETOOTH_SERVICE);
			BluetoothAdapter adapter = b.getAdapter();
			promise.resolve(adapter.getName());
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getADBEnabled(Promise promise) {
		try {
			promise.resolve(Settings.Global.getString(getReactApplicationContext().getContentResolver(), Settings.Global.ADB_ENABLED));
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getBootCount(Promise promise) {
		try {
			promise.resolve(Settings.Global.getString(getReactApplicationContext().getContentResolver(), Settings.Global.BOOT_COUNT));
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getRoaming(Promise promise) {
		try {
			promise.resolve(Settings.Global.getString(getReactApplicationContext().getContentResolver(), Settings.Global.DATA_ROAMING));
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getDevelopmentSettings(Promise promise) {
		try {
			promise.resolve(Settings.Global.getString(getReactApplicationContext().getContentResolver(), Settings.Global.DEVELOPMENT_SETTINGS_ENABLED));
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getScreenTimeout(Promise promise) {
		try {
			promise.resolve(Settings.System.getString(getReactApplicationContext().getContentResolver(), Settings.System.SCREEN_OFF_TIMEOUT));
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getAccessibility(Promise promise) {
		try {
			promise.resolve(Settings.Secure.getString(getReactApplicationContext().getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED));
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}

	@ReactMethod
	public void getSensors(Promise promise) {
		try {
			SensorManager sm = (SensorManager) getReactApplicationContext().getSystemService(Context.SENSOR_SERVICE);
			List<Sensor> sensors = sm.getSensorList(Sensor.TYPE_ALL);
			WritableArray resultSet = Arguments.createArray();
			for(Sensor s : sensors) {
				resultSet.pushString(s.getName() + "[]" + s.getVendor());
			}
			promise.resolve(resultSet);
		} catch (Exception e) {
			promise.reject("ERROR", e);
		}
	}
}