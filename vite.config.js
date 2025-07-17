import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/sina': {
        target: 'https://hq.sinajs.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sina/, '')
      },
      '/api/tencent': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tencent/, '')
      }
    }
  }
})