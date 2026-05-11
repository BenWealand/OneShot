const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, "glb", "gltf", "png", "jpg", "jpeg"]));
config.resolver.sourceExts = Array.from(new Set([...config.resolver.sourceExts, "cjs", "mjs"]));

module.exports = config;
