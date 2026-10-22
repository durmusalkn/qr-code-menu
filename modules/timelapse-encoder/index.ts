// Re-export the native module. On web, it will be resolved to TimelapseEncoderModule.web.ts
// and on native platforms to TimelapseEncoderModule.ts
export { default } from './src/TimelapseEncoderModule';
export * from './src/TimelapseEncoder.types';
