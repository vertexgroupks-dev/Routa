// Expo SDK 52+ detects npm workspaces automatically; this keeps the shared package resolvable.
const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname);
