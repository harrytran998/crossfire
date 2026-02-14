import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'browser',
  target: 'esnext',
  dts: true,
  clean: true,
  treeshake: true,
  external: ['@crossfire/shared', 'react', 'react-dom', 'three'],
})
