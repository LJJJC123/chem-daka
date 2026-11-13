import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 端口固定，方便手机通过局域网 IP 访问
export default defineConfig({
  // 相对路径：放到任何子目录（Gitee Pages / OSS / 自己的服务器）都能直接用
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5180,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5181',
        changeOrigin: true,
      },
    },
  },
  preview: { host: true, port: 5181 },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
