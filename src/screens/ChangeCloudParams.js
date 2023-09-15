import React, { useEffect, useState } from 'react';
import { Text, TextInput, View, Modal, TouchableOpacity } from 'react-native';

import styles from '../styles';

export default ChangeCloudParams = ({ secretStorage }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState('');
  const [bucket, setBucket] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setRegion('');
    setBucket('');
    setAccessKey('');
    setSecretKey('');
  }, [modalVisible]);

  return (
    <View>
      <Modal
        transparent={true}
        style={{ flex: 1 }}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View style={styles.modalView}>
          <Text style={styles.modalHeader}>{'Enter AWS Paramters'}</Text>
          <TextInput
            style={styles.modalText}
            placeholder="Region"
            placeholderTextColor={'#2D314277'}
            value={region}
            onChange={obj => setRegion(obj.nativeEvent.text)}
          />
          <TextInput
            style={styles.modalText}
            placeholder="Bucket Name"
            placeholderTextColor={'#2D314277'}
            value={bucket}
            onChange={obj => setBucket(obj.nativeEvent.text)}
          />
          <TextInput
            style={styles.modalText}
            placeholder="Access Key"
            placeholderTextColor={'#2D314277'}
            value={accessKey}
            onChange={obj => setAccessKey(obj.nativeEvent.text)}
          />
          <TextInput
            style={styles.modalText}
            placeholder="Secret Key"
            placeholderTextColor={'#2D314277'}
            value={secretKey}
            onChange={obj => setSecretKey(obj.nativeEvent.text)}
          />
          {valid ? (
            <></>
          ) : (
            <Text style={{ color: 'red' }}>
              {'Please fill all values before submitting'}
            </Text>
          )}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButton}>{'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                if (region && bucket && accessKey && secretKey) {
                  secretStorage.set('region', region);
                  secretStorage.set('bucket', bucket);
                  secretStorage.set('accessKey', accessKey);
                  secretStorage.set('secretKey', secretKey);
                  setValid(true);
                  setModalVisible(!modalVisible);
                } else {
                  setValid(false);
                }
              }}>
              <Text style={styles.modalButton}>{'Update'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        disabled={modalVisible}>
        <Text
          style={[
            styles.buttonStyle,
            modalVisible ? styles.disabledButtonStyle : null,
          ]}>
          {'Change Cloud Parameters'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
