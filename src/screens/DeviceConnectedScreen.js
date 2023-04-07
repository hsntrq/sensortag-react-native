import React, { useEffect, useState } from 'react';
import { Text, View, Alert, TouchableOpacity } from 'react-native';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { MMKV } from 'react-native-mmkv';

import styles from '../styles';
import * as FS from '../services/fileHandling';
import dataHandler from '../services/dataHandling';
import ids from '../services/characteristics.json';

const storage = new MMKV();

const Button = function ({ onPress, title, ...restProps }) {
  return (
    <TouchableOpacity onPress={onPress} {...restProps}>
      <Text
        style={[
          styles.buttonStyle,
          restProps.disabled ? styles.disabledButtonStyle : null,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default DeviceConnectedScreen = ({
  sensorTag,
  setSensorTag,
  setConnectionState,
}) => {
  const [acceleremeter, setAcceleremeter] = useState({});
  const [gyroscope, setGyroscope] = useState({});
  const [magnotometer, setMagnetometer] = useState({});
  const [light, setLight] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [path, setPath] = useState('');
  const [time, setTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const [notificationSub, setNotificationSub] = useState([]);
  const [uploading, setUploading] = useState(false);

  let subscription;
  const connectToDevice = async () => {
    try {
      setConnectionState(`Connecting to ${sensorTag.name} (${sensorTag.id})`);
      await sensorTag.connect({ autoConnect: true });
      setConnectionState(`Discovering ${sensorTag.name} (${sensorTag.id})`);
      await sensorTag.discoverAllServicesAndCharacteristics();
      setConnectionState(`Connected to ${sensorTag.name} (${sensorTag.id})`);
      subscription = sensorTag.onDisconnected(err => {
        if (err) console.error('Error while disconnecting:', err);
      });
    } catch (err) {
      console.error('Error while connecting:', err);
      Alert.alert('Could not connect...');
      disconnect();
    }
  };

  useEffect(() => {
    connectToDevice();
    return () => {
      subscription?.remove();
      disconnect();
    };
  }, []);

  useEffect(() => {
    let interval = null;

    if (recording) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [recording]);

  const setupNotifications = async (device, path) => {
    try {
      for (const item of ids) {
        const service = item.serviceUUID;
        const characteristicW = item.writeUUID;
        const characteristicN = item.notifyUUID;
        const characteristicP = item.periodUUID;

        await device.writeCharacteristicWithResponseForService(
          service,
          characteristicW,
          item.base64EncodeChar, //"AQ==" /* 0x01 in hex AQ==*/
        );

        await device.writeCharacteristicWithResponseForService(
          service,
          characteristicP,
          'FA==', //"Mg==" -> 0x32, "FA==" -> 0x14, "Cg==" -> 0x0A /* 0x01 in hex AQ==*/a
        );

        const sub = device.monitorCharacteristicForService(
          service,
          characteristicN,
          (error, characteristic) => {
            if (error) {
              console.log(error.message);
              return;
            }
            setData(item.id, characteristic.value, path);
          },
        );
        setNotificationSub(prevState => [...prevState, sub]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Could not setup notifications', err.message);
      disconnect();
    }
  };

  const setData = async (id, rawData, path) => {
    const data = await dataHandler(id, rawData);
    if (data !== null) {
      switch (id) {
        case '8':
          const Acc = { x: data.ax, y: data.ay, z: data.az };
          const Gyr = { x: data.gx, y: data.gy, z: data.gz };
          const Mag = { x: data.mx, y: data.my, z: data.mz };
          setAcceleremeter(Acc);
          setGyroscope(Gyr);
          setMagnetometer(Mag);
          const hum = await storage.getNumber('humidity');
          const pre = await storage.getNumber('pressure');
          const lig = await storage.getNumber('light');
          const temp = await storage.getNumber('temperature');
          await FS.AppendtoFile(
            `${new Date().getTime()},${data.ax},${data.ay},${data.az},${
              data.gx
            },${data.gy},${data.gz},${data.mx},${data.my},${
              data.mz
            },${hum},${pre},${lig},${temp}\n`,
            path,
          );
          break;
        case '2':
          setHumidity(data.hum);
          setTemperature(data.temp);
          storage.set('humidity', data.hum);
          storage.set('temperature', data.temp);
          break;
        case '4':
          setPressure(data);
          storage.set('pressure', data);
          break;
        case '7':
          setLight(data);
          storage.set('light', data);
          break;
      }
    }
  };

  const disconnect = async () => {
    if (await sensorTag.isConnected()) {
      await sensorTag.cancelConnection();
      setConnectionState('Select Device to Connect...');
      setSensorTag(null);
      storage.clearAll();
    }
  };

  return (
    <View style={{ padding: 10 }}>
      <View style={{ flexDirection: 'row', paddingTop: 5 }}>
        <Button
          disabled={uploading}
          style={{ flex: 1 }}
          onPress={async () => {
            if (!recording) {
              const newPath = await FS.pathReturn();
              setPath(newPath);
              console.log(newPath);
              await FS.WritetoFile(newPath);
              setupNotifications(sensorTag, newPath);
            } else notificationSub.forEach(sub => sub?.remove());
            setRecording(~recording);
          }}
          title={`${recording ? 'Stop' : 'Start'} Study`}
        />
        <View style={{ width: 5 }} />
        <Button
          disabled={recording || uploading ? true : false}
          style={{ flex: 1 }}
          onPress={() => {
            disconnect();
          }}
          title={'Disconnect'}
        />
      </View>
      <View style={{ flexDirection: 'row', paddingTop: 5 }}>
        <Button
          disabled={!path || recording ? true : false}
          style={{ flex: 1 }}
          onPress={async () => {
            setUploading(true);
            setConnectionState('Saving Locally...');
            const dst = await FS.CopyFile(path);
            if (dst)
              Alert.alert(
                'Saved to Local Storage Successfully',
                `Find file at: ${dst}`,
              );
            else Alert.alert('Error', 'Could not save file');
            setConnectionState(
              `Connected to ${sensorTag.name} (${sensorTag.id})`,
            );
            setUploading(false);
          }}
          title={'Save Locally'}
        />
        <View style={{ width: 5 }} />
        <Button
          style={{ flex: 1 }}
          disabled={!path || recording ? true : false}
          onPress={async () => {
            const fileName = path.split('/').pop();
            const data = await FS.ReadFile(path);
            if (!data) return Alert.alert('Error', 'Could not read file');
            const client = new S3Client({region: 'me-central-1'});
            const command = new PutObjectCommand({
              Bucket: 'sensortagdata',
              Key: fileName,
              Body: data,
            });
            try {
              const res = await client.send(command);
              console.log(res);
            } catch (err) {
              console.error(err);
            }
          }}
          title={'Send to Cloud'}
        />
      </View>
      {recording ? (
        <View style={{ margin: 20 }}>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  justifyContent: 'flex-start',
                  color: '#4E6E81',
                  fontSize: 20,
                }}>{`Recording Data...`}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  justifyContent: 'flex-end',
                  textAlign: 'right',
                  color: '#4E6E81',
                  fontSize: 20,
                }}>{`${time} seconds`}</Text>
            </View>
          </View>
          <Text style={styles.logTextStyle}>
            {`Acc: ${acceleremeter?.x?.toFixed(2)}\t${acceleremeter?.y?.toFixed(
              2,
            )}\t${acceleremeter?.z?.toFixed(2)}`}
          </Text>
          <Text style={styles.logTextStyle}>
            {`Gyr: ${gyroscope?.x?.toFixed(2)}\t${gyroscope?.y?.toFixed(
              2,
            )}\t${gyroscope?.z?.toFixed(2)}`}
          </Text>
          <Text style={styles.logTextStyle}>
            {`Mag: ${magnotometer?.x}\t${magnotometer?.y}\t${magnotometer?.z}`}
          </Text>
          <Text
            style={styles.logTextStyle}>{`Hum: ${humidity?.toFixed(2)}`}</Text>
          <Text
            style={
              styles.logTextStyle
            }>{`Tem: ${temperature?.toFixed(2)}`}</Text>
          <Text style={styles.logTextStyle}>{`Lux: ${light}`}</Text>
          <Text style={styles.logTextStyle}>{`Ps: ${pressure}`}</Text>
        </View>
      ) : (
        <></>
      )}
    </View>
  );
};
