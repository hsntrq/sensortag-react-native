// @flow

import React, { useEffect, useState } from 'react';
import {
  Text,
  SafeAreaView,
  StatusBar,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';

import KeepAwake from 'react-native-keep-awake';

import Config from 'react-native-config';
import { MMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';
const secretStorage = new MMKV({ id: 'secrets', path: `${RNFS.ExternalCachesDirectoryPath}/storage`, encryptionKey: Config.key });

import ScanDeviceScreen from './screens/ScanDeviceScreen';
import DeviceConnectedScreen from './screens/DeviceConnectedScreen';
import styles from './styles';
import ChangeCloudParams from './screens/ChangeCloudParams';

const requestPermissions = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    const enabled =
      (await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      )) &&
      (await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      )) &&
      (await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ));
      // (await PermissionsAndroid.check(
      //   PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      // )) &&
      // (await PermissionsAndroid.check(
      //   PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      // ));
    if (!enabled) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        // PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        // PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      if (!Object.values(granted).every(val => val === 'granted')) {
        Alert.alert(
          'Permissions not granted',
          'Please restart tbe app and allow permissions',
          [],
          { cancelable: true },
        );
        return;
      }
    }
  }
};

export default SensorTag = () => {
  const [sensorTag, setSensorTag] = useState(null);
  const [connectionState, setConnectionState] = useState(
    'Select Device to Connect...',
  );

  useEffect(() => {
    KeepAwake.activate();
    requestPermissions();
    const region = secretStorage.getString('region');
    const bucket = secretStorage.getString('bucket');
    const accessKey = secretStorage.getString('accessKey');
    const secretKey = secretStorage.getString('secretKey');
    if (!region || !bucket || !accessKey || !secretKey) {
      secretStorage.set('region', Config.region);
      secretStorage.set('bucket', Config.bucketName);
      secretStorage.set('accessKey', Config.accessKeyId);
      secretStorage.set('secretKey', Config.secretAccessKey);
      Alert.alert(
        'Cloud Configurations not set',
        'No Cloud Configurations found locally, Default Configuration has been set for now. Please change them if you want to use your custom cloud.',
        [],
        { cancelable: true },
      );
    }
    return () => {};
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Text style={styles.headerText}>{connectionState}</Text>
      {sensorTag ? (
        <DeviceConnectedScreen
          sensorTag={sensorTag}
          setSensorTag={setSensorTag}
          setConnectionState={setConnectionState}
          secretStorage={secretStorage}
        />
      ) : (
        <>
          <ScanDeviceScreen
            setSensorTag={setSensorTag}
            setConnectionState={setConnectionState}
          />
          <ChangeCloudParams secretStorage={secretStorage} />
        </>
      )}
    </SafeAreaView>
  );
};
