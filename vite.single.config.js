import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 单文件构建：把 JS/CSS 全部塞进一个 index.html，适合直接发给手机打开
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-single',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
})
