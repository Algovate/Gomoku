import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 支持 GitHub Pages 部署
  // 如果仓库名不是用户名.github.io，需要设置 base 为仓库名
  // 可以通过环境变量 VITE_BASE_PATH 来覆盖，默认为 '/'
  base: process.env.VITE_BASE_PATH || '/',
})
