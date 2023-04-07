import decoder from 'base64-arraybuffer';

export default dataHandler = (id, roughData) => {
  switch (id) {
    case "2":
      return humidityData(base64toUint8Array(roughData));
    case "4":
      return barometerData(base64toUint8Array(roughData));
    case "7":
      return luxometerData(base64toUint8Array(roughData));
    case "8":
      return movementData(base64toUint8Array(roughData));
    default:
      return null;
  }
};

const {Buffer} = require('buffer/'); // note: the trailing slash is important!

const base64toUint8Array = value => {
  x = decoder.decode(value);
  return Buffer.from(x); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
};

const humidityData = buffer => {
  var hexString = buffer[3].toString(16) + buffer[2].toString(16);
  var temp = buffer[1].toString(16) + buffer[0].toString(16);
  var hexfulInt = parseInt(hexString, 16);
  hexfulInt = hexfulInt & ~0x0003;
  temp = (parseInt(temp, 16) / 65536) * 165 - 40;
  hum = (hexfulInt / 65536) * 100;
  return {hum, temp};
};

const barometerData = buffer => {
  var hexString =
    buffer[5].toString(16) + buffer[4].toString(16) + buffer[3].toString(16);
  var hexfulInt = parseInt(hexString, 16);
  pressure = hexfulInt / 100;
  return hexfulInt / 100;
};
const luxometerData = buffer => {
  var hexString = buffer[1].toString(16) + buffer[0].toString(16);
  var hexfulInt = parseInt(hexString, 16);
  var mentissa = hexfulInt & 0x0fff;
  var exponant = hexfulInt >> 12;
  var mag = Math.pow(2, exponant);
  var output = mentissa * mag;
  var lux = output / 100;
  return lux;
};

const littleIndiantoIntFunctions = (data, offset) => {
  return (littleEndianToInt8(data, offset + 1) << 8) + data[offset];
};

const littleEndianToInt8 = (data, offset) => {
  var x = data[offset];
  if (x & 0x80) x = x - 256;
  return x;
};

const movementData = buffer => {
  gx = littleIndiantoIntFunctions(buffer, 0) / (65536 / 500);
  gy = littleIndiantoIntFunctions(buffer, 2) / (65536 / 500);
  gz = littleIndiantoIntFunctions(buffer, 4) / (65536 / 500);
  ax = littleIndiantoIntFunctions(buffer, 6) / (32768/20);
  ay = littleIndiantoIntFunctions(buffer, 8) / (32768/20);
  az = littleIndiantoIntFunctions(buffer, 10) / (32768/20);
  mx = littleIndiantoIntFunctions(buffer, 12);
  my = littleIndiantoIntFunctions(buffer, 14);
  mz = littleIndiantoIntFunctions(buffer, 16);

  return {gx, gy, gz, ax, ay, az, mx, my, mz};
};
