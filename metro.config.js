/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require("path");

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // windows subdirectory path fix
    extraNodeModules: {
      "@aws-sdk/client-s3": path.resolve(__dirname, "node_modules/@aws-sdk/client-s3"),
      "@aws-sdk/chunked-blob-reader": path.resolve(__dirname, "node_modules/@aws-sdk/chunked-blob-reader"),
    }

  }
};
