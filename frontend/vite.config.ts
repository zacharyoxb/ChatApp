import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('certs/vite-server.key'),
      cert: fs.readFileSync('certs/vite-server.crt')
    },
    port: 3000,
  },
  plugins: [react()],
})
