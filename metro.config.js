const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for GLB/GLTF files
config.resolver.assetExts.push('glb', 'gltf', 'obj', 'mtl', 'fbx');

// Remove GLB from source extensions if it exists there
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !['glb', 'gltf'].includes(ext)
);

// Exclude Node.js-specific WatermelonDB modules from bundling
config.resolver.blockList = [
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/sqlite-node\/.*/,
  /node_modules\/better-sqlite3\/.*/,
];

// Add resolver for platform-specific extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs' // often needed for three.js components
];

// Force resolution of 'three' to the root node_modules to avoid duplicates
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return {
      filePath: require.resolve('three'),
      type: 'sourceFile',
    };
  }
  // Let Metro handle other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
