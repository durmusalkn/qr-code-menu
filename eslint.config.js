const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  globalIgnores([
    'src/db/migrations.generated.ts',
    'dist/*',
    '.expo/*',
    'android/*',
    'ios/*',
    'env.d.ts',
    'nativewind-env.d.ts',
  ]),
  expoConfig,
  eslintPluginPrettierRecommended,
]);
