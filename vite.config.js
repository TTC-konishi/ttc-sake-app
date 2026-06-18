import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // LANに公開（--host相当）
    allowedHosts: true,  // .local 等のホスト名アクセスを許可（IP変更に強い）
  },
})
