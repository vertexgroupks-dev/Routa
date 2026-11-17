// The driver app has its own node_modules (separate from the website, which uses a different React).
// Metro also watches packages/shared so the design tokens and labels are shared with the web app.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '../..');
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(root, 'packages/shared')];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
// Packages may keep their own helpers in nested node_modules (Expo 58 does), so normal lookup stays on…
config.resolver.disableHierarchicalLookup = false;
// …but never resolve anything from the website's node_modules at the repo root.
config.resolver.blockList = [new RegExp(`^${escape(path.join(root, 'node_modules'))}[\\\\/].*`)];

module.exports = config;
