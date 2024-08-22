import { defineConfig } from 'vite';
import { resolve } from 'vite-plugin-resolve';

export default defineConfig({
  base: '/ThreeJS-Earth/',
  plugins: [
    resolve({
      'three': 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js'
    })
  ]
});