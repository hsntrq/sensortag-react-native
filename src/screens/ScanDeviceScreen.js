import React, { useEffect, useState } from 'react';
import {
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';

import styles from '../styles';
import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

export default ScanDeviceScreen = ({ setSensorTag, setConnectionState }) => {
  const [devices, setDevices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    enableBLE = async () => await bleManager.enable();
    enableBLE();
    onRefresh();
    return () => {};
  }, []);

  const onRefresh = () => {
    setConnectionState('Scanning...');
    setRefreshing(true);
    bleManager.stopDeviceScan();
    setDevices([]);
    bleManager.startDeviceScan(null, null, (err, device) => {
      if (err) {
        Alert.alert('error in scanning', JSON.stringify(err));
        console.error(err);
      }
      if (device?.name && device.rssi > -80) {
        setDevices(prevState => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
    setTimeout(() => {
      setRefreshing(false);
      setConnectionState('Select Device to Connect...');
      bleManager.stopDeviceScan();
    }, 1000);
  };

  const isDuplicteDevice = (devices, nextDevice) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1;

  return (
    <FlatList
      data={devices}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        refreshing ? null : (
          <Text style={styles.noDevicesTextStyle}>
            {"No Devices Found! :'("}
          </Text>
        )
      }
      renderItem={({ item }) => {
        return (
          <TouchableOpacity
            style={styles.deviceCard}
            disabled={refreshing}
            onPress={() => {
              setSensorTag(item);
            }}>
            <Text style={styles.deviceText}>{item.name}</Text>
            <Text
              style={styles.deviceDetails}>{`MAC Address: ${item.id}`}</Text>
            <Text style={styles.deviceDetails}>{`RSSI: ${item.rssi}`}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
};
