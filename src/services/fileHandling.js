const RNFS = require('react-native-fs');

export const pathReturn = async () => {
  return `${RNFS.ExternalCachesDirectoryPath}/${new Date()
    .toLocaleString('en-US', { hour12: false })
    .replace(
      /(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/g,
      '$1-$2-$3-$4-$5-$6',
    )}.csv`;
};
export const ReadFile = async path => {
  const data = await RNFS.readFile(path, 'utf8')
  return data;
};
export const WritetoFile = async path => {
  await RNFS.writeFile(
    path,
    'timestamp,ax,ay,az,gx,gy,gz,mx,my,mz,humidity,pressure,light,temp,\n',
    'utf8',
  )
    .then(success => {
      console.log('FILE WRITTEN!');
    })
    .catch(err => {
      console.error(err);
    });
};
export const AppendtoFile = async (text, path) => {
  // console.log(text, path);
  await RNFS.appendFile(path, text, 'utf8').catch(err => {
    console.error(err);
  });
};
export const DeleteFile = async path => {
  await RNFS.unlink(path)
    .then(() => {
      console.log('FILE DELETED');
    })
    // `unlink` will throw an error, if the item to unlink does not exist
    .catch(err => {
      console.error(err);
    });
};
export const CopyFile = async path => {
  const dst = `${RNFS.ExternalDirectoryPath}/fyp/${path.split('/').pop()}`;
  // console.log(dst);
  await RNFS.mkdir(`${RNFS.ExternalDirectoryPath}/fyp/`).catch(err => {
    console.error(err);
  });
  await RNFS.copyFile(path, dst)
    .then(success => {
      console.log('FILE MOVED');
    })
    .catch(err => {
      console.error(err);
      return;
    });

  return dst;
};
